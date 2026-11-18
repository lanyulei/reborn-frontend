/**
 * 终端录制回放：只有输出（不含用户的键盘输入）。按录制的时间偏移把输出写进一个只读的 xterm，
 * 支持暂停、倍速与拖动定位（定位 = 清屏后把该时刻之前的输出一次写完）。
 */
import {
  CaretRightOutlined,
  PauseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as XTerm } from '@xterm/xterm';
import { Alert, Button, Modal, Select, Slider, Space, Spin } from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import '@xterm/xterm/css/xterm.css';
import { getExecRecord } from '@/services/k8s/governance';
import type { ExecSession } from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { TERMINAL } from './styles';

interface Frame {
  at: number;
  data?: Uint8Array;
  cols?: number;
  rows?: number;
}

/** 回放时允许的最大窗口尺寸 */
const MAX_COLS = 500;
const MAX_ROWS = 200;

const decode = (b64: string): Uint8Array => {
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
};

const clock = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return s >= 3600
    ? `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
    : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};

const SPEEDS = [0.5, 1, 2, 4, 8];
const TICK_MS = 50;
/** 长时间没有输出的间隔在回放时压缩到这个时长，免得干等 */
const MAX_IDLE_MS = 2000;

export const RecordPlayer: React.FC<{
  session: ExecSession;
  onClose: () => void;
}> = ({ session, onClose }) => {
  const t = useT();
  const host = useRef<HTMLDivElement>(null);
  const term = useRef<XTerm | null>(null);
  const frames = useRef<Frame[]>([]);
  /** 已写入终端的帧数 */
  const cursor = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const positionRef = useRef(0);
  positionRef.current = position;

  useEffect(() => {
    let cancelled = false;
    getExecRecord(session.id)
      .then((res) => {
        if (cancelled) return;
        // 压缩长空闲：回放时间轴用压缩后的偏移
        let shift = 0;
        let last = 0;
        const list: Frame[] = [];
        for (const e of res.events ?? []) {
          const raw = Number(e.offsetMs ?? 0);
          if (raw - last > MAX_IDLE_MS) shift += raw - last - MAX_IDLE_MS;
          last = raw;
          const at = raw - shift;
          if (e.type === 'r') list.push({ at, cols: e.cols, rows: e.rows });
          else if (e.data) list.push({ at, data: decode(e.data) });
        }
        frames.current = list;
        setDuration(list.length ? list[list.length - 1].at : 0);
        setTruncated(Boolean(res.truncated));
        setLoading(false);
        setPlaying(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session.id]);

  useEffect(() => {
    if (loading || error || !host.current) return;
    const x = new XTerm({
      disableStdin: true,
      cursorBlink: false,
      // 录像内容来自被审计的会话，不可信：其中的超链接（OSC 8）一律不可点击
      linkHandler: { activate: () => undefined },
      fontSize: 13,
      scrollback: 5000,
      theme: { background: TERMINAL.bg, foreground: TERMINAL.text },
    });
    const fit = new FitAddon();
    x.loadAddon(fit);
    x.open(host.current);
    fit.fit();
    term.current = x;
    return () => {
      term.current = null;
      x.dispose();
    };
  }, [loading, error]);

  /** 把终端推进到 target 时刻：往回拖动时先清屏重放 */
  const advance = (target: number) => {
    const x = term.current;
    if (!x) return;
    const list = frames.current;
    if (cursor.current > 0 && list[cursor.current - 1].at > target) {
      x.reset();
      cursor.current = 0;
    }
    while (cursor.current < list.length && list[cursor.current].at <= target) {
      const f = list[cursor.current];
      try {
        if (f.data) x.write(f.data);
        else if (f.cols && f.rows) {
          // 录像里的窗口大小不可信：过大的尺寸会让终端分配巨量缓冲、拖垮页面
          x.resize(
            Math.min(Math.max(Math.floor(f.cols), 2), MAX_COLS),
            Math.min(Math.max(Math.floor(f.rows), 1), MAX_ROWS),
          );
        }
      } catch {
        // 单帧异常不影响后续回放
      }
      cursor.current += 1;
    }
  };

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      const next = Math.min(duration, positionRef.current + TICK_MS * speed);
      advance(next);
      setPosition(next);
      if (next >= duration) setPlaying(false);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [playing, speed, duration]);

  const seek = (value: number) => {
    advance(value);
    setPosition(value);
  };

  return (
    <Modal
      open
      width={960}
      title={t('pages.k8s.record.title', {
        pod: session.pod ?? '',
        user: session.username ?? '',
      })}
      footer={null}
      onCancel={onClose}
      destroyOnHidden
    >
      {loading && <Spin style={{ display: 'block', margin: '48px auto' }} />}
      {error && (
        <Alert type="error" showIcon title={t('pages.k8s.record.failed')} />
      )}
      {!loading && !error && (
        <>
          <Alert
            type={truncated ? 'warning' : 'info'}
            showIcon
            style={{ marginBottom: 12 }}
            title={
              truncated
                ? t('pages.k8s.record.truncated')
                : t('pages.k8s.record.hint')
            }
          />
          <div
            ref={host}
            style={{
              height: 420,
              padding: 8,
              borderRadius: 6,
              background: TERMINAL.bg,
              overflow: 'hidden',
            }}
          />
          <Space style={{ width: '100%', marginTop: 12 }} align="center">
            <Button
              icon={playing ? <PauseOutlined /> : <CaretRightOutlined />}
              onClick={() => {
                if (!playing && position >= duration) seek(0);
                setPlaying(!playing);
              }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                seek(0);
                setPlaying(true);
              }}
            />
            <Select
              value={speed}
              style={{ width: 84 }}
              options={SPEEDS.map((v) => ({ value: v, label: `${v}x` }))}
              onChange={setSpeed}
            />
            <Slider
              style={{ width: 560, margin: '0 8px' }}
              min={0}
              max={Math.max(duration, 1)}
              step={100}
              value={position}
              tooltip={{ formatter: (v) => clock(v ?? 0) }}
              onChange={(v) => {
                setPlaying(false);
                seek(v);
              }}
            />
            <span>
              {clock(position)} / {clock(duration)}
            </span>
          </Space>
        </>
      )}
    </Modal>
  );
};

export default RecordPlayer;
