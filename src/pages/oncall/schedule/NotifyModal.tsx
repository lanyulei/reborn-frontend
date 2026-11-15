/**
 * 手动发送值班通知：自动通知没有发出时，由分组管理员补发。
 * - 上班提醒：发给所选班次（当前 / 下一个）的主、备值班人，发送前列出收件人；
 * - 每日播报：按通知规则投递（通常是群机器人）。
 * 发出的就是正式通知（与自动通知同一套规则、模板、渠道），所以发送前二次确认；
 * 发送后留在弹窗里轮询投递结果，没发出去时给出原因。
 */
import { Alert, App, Button, Modal, Radio, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  listScheduleNotificationResults,
  listShifts,
  sendScheduleNotification,
} from '@/services/oncall/schedule';
import type {
  OncallNotifyKind,
  OncallNotifyRecipient,
  OncallNotifyResult,
  OncallNotifyTarget,
  OncallSchedule,
  OncallShift,
  OncallShiftRole,
} from '@/services/oncall/typings';
import { useT } from '@/utils/i18n';
import { useOncallStyles } from '../components/styles';
import { formatRange } from '../components/time';

/** 预览收件人时向后查找下一个班次的范围（天；班次查询上限 100 天） */
const LOOKAHEAD_DAYS = 90;
/** 投递结果轮询：间隔与最长等待 */
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;
const ROLES: OncallShiftRole[] = [1, 2];

/** 某角色的当前班次（已开始）或下一个班次（最早的未开始班次）；与后端同一口径 */
const pickShift = (
  shifts: OncallShift[],
  role: OncallShiftRole,
  target: OncallNotifyTarget,
  now: dayjs.Dayjs,
) =>
  shifts.find(
    (shift) =>
      shift.role === role &&
      dayjs(shift.endTime).isAfter(now) &&
      (target === 1) === !dayjs(shift.startTime).isAfter(now),
  );

/** 一个事件是否已有最终结果（不必再轮询） */
const settled = (result: OncallNotifyResult) => {
  if (result.status === 3 || result.status === 4) return true;
  const deliveries = result.deliveries ?? [];
  return (
    result.status === 2 &&
    deliveries.length > 0 &&
    deliveries.every((d) => d.status === 3 || d.status === 5)
  );
};

interface Sent {
  kind: OncallNotifyKind;
  eventIds: string[];
  recipients: OncallNotifyRecipient[];
}

export const NotifyModal: React.FC<{
  schedule?: OncallSchedule;
  onClose: () => void;
}> = ({ schedule, onClose }) => {
  const t = useT();
  const { modal } = App.useApp();
  const { styles } = useOncallStyles();
  const [kind, setKind] = useState<OncallNotifyKind>(1);
  const [target, setTarget] = useState<OncallNotifyTarget>(1);
  const [shifts, setShifts] = useState<OncallShift[] | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const [results, setResults] = useState<OncallNotifyResult[]>([]);
  const [polling, setPolling] = useState(false);

  const scheduleId = schedule?.id;
  // 打开时重置，并取未来的班次用于预览收件人
  useEffect(() => {
    if (!scheduleId) return;
    setKind(1);
    setSent(null);
    setResults([]);
    setShifts(null);
    let cancelled = false;
    const now = dayjs();
    listShifts({
      scheduleId,
      startTime: now.toISOString(),
      endTime: now.add(LOOKAHEAD_DAYS, 'day').toISOString(),
    })
      .then(({ items }) => {
        if (cancelled) return;
        const list = items ?? [];
        setShifts(list);
        // 当前没有人值班时默认选下一个班次
        setTarget(ROLES.some((role) => pickShift(list, role, 1, now)) ? 1 : 2);
      })
      .catch(() => {
        if (!cancelled) setShifts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [scheduleId]);

  const preview = useMemo(() => {
    const now = dayjs();
    const of = (which: OncallNotifyTarget) =>
      ROLES.map((role) => pickShift(shifts ?? [], role, which, now)).filter(
        (shift): shift is OncallShift =>
          !!shift && shift.userAvailable !== false,
      );
    return { 1: of(1), 2: of(2) };
  }, [shifts]);
  const recipients = preview[target];

  // 发送后轮询投递结果：全部有最终结果或超时即停
  const eventKey = sent?.eventIds.join(',');
  useEffect(() => {
    if (!scheduleId || !sent || sent.eventIds.length === 0) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    setPolling(true);
    const tick = async () => {
      let done = false;
      try {
        const { items } = await listScheduleNotificationResults(
          scheduleId,
          sent.eventIds,
        );
        if (stopped) return;
        const list = items ?? [];
        setResults(list);
        done = list.length === sent.eventIds.length && list.every(settled);
      } catch {
        // 查询失败不打断：下一轮再试，直到超时
      }
      if (stopped) return;
      if (done || Date.now() - started >= POLL_TIMEOUT_MS) {
        setPolling(false);
        return;
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [scheduleId, eventKey]);

  if (!schedule) return null;
  const disabled = schedule.status !== 1;
  const canSend =
    !disabled && shifts !== null && (kind === 2 || recipients.length > 0);

  const send = () =>
    modal.confirm({
      title: t('pages.oncall.notify.confirm.title'),
      content:
        kind === 1
          ? t('pages.oncall.notify.confirm.remind', {
              names: recipients
                .map((shift) => shift.userName || t('common.empty'))
                .join('、'),
            })
          : t('pages.oncall.notify.confirm.digest'),
      onOk: async () => {
        setSending(true);
        try {
          const res = await sendScheduleNotification(schedule.id, {
            kind,
            target: kind === 1 ? target : undefined,
          });
          setResults([]);
          setSent({
            kind,
            eventIds: res.eventIds ?? [],
            recipients: res.recipients ?? [],
          });
        } catch {
          // 失败原因已由全局请求错误提示给出（权限、限流、无人值班等）
        } finally {
          setSending(false);
        }
      },
    });

  /** 一个事件的结果说明 */
  const renderResult = (eventId: string, index: number) => {
    const result = results.find((item) => item.eventId === eventId);
    const who =
      sent?.kind === 1
        ? `${t(`enum.oncall.shiftRole.${sent.recipients[index]?.role ?? 1}`)} ${
            sent.recipients[index]?.userName || t('common.empty')
          }`
        : t('pages.oncall.notify.kind.digest');
    let body: React.ReactNode;
    if (!result || result.status === 1) {
      body = polling ? (
        <span className={styles.notifyMuted}>
          <Spin size="small" /> {t('pages.oncall.notify.result.waiting')}
        </span>
      ) : (
        <span className={styles.notifyError}>
          {t('pages.oncall.notify.result.stuck')}
        </span>
      );
    } else if (result.status === 3) {
      body = (
        <span className={styles.notifyError}>
          {t('pages.oncall.notify.result.silenced')}
        </span>
      );
    } else if (result.status === 4) {
      body = (
        <span className={styles.notifyError}>
          {t('pages.oncall.notify.result.noRoute')}
        </span>
      );
    } else if ((result.deliveries ?? []).length === 0) {
      body = (
        <span className={styles.notifyError}>
          {t('pages.oncall.notify.result.noDelivery')}
        </span>
      );
    } else {
      body = (result.deliveries ?? []).map((delivery, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: 投递列表顺序稳定且无唯一键
          key={i}
          className={styles.notifyDelivery}
        >
          <Tag
            color={
              delivery.status === 3
                ? 'success'
                : delivery.status === 4 || delivery.status === 5
                  ? 'error'
                  : 'processing'
            }
          >
            {t(`pages.oncall.notify.delivery.${delivery.status}`)}
          </Tag>
          <span>
            {delivery.channelName || t('common.empty')}
            {delivery.recipient && !delivery.recipient.startsWith('$')
              ? ` → ${delivery.recipient}`
              : ''}
          </span>
          {delivery.error && delivery.status !== 3 && (
            <span className={styles.notifyError}>{delivery.error}</span>
          )}
        </div>
      ));
    }
    return (
      <div key={eventId} className={styles.notifyResult}>
        <div className={styles.notifyWho}>{who}</div>
        {body}
      </div>
    );
  };

  return (
    <Modal
      title={t('pages.oncall.notify.titleOf', { name: schedule.config.name })}
      open
      onCancel={onClose}
      width={560}
      mask={{ closable: false }}
      destroyOnHidden
      footer={
        sent
          ? [
              <Button key="close" type="primary" onClick={onClose}>
                {t('pages.oncall.shift.close')}
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onClose}>
                {t('common.action.cancel')}
              </Button>,
              <Button
                key="send"
                type="primary"
                loading={sending}
                disabled={!canSend}
                onClick={send}
              >
                {t('pages.oncall.notify.send')}
              </Button>,
            ]
      }
    >
      {sent ? (
        <div className={styles.notifyBody}>
          <Alert type="info" showIcon title={t('pages.oncall.notify.sent')} />
          {sent.eventIds.map(renderResult)}
        </div>
      ) : (
        <div className={styles.notifyBody}>
          {disabled && (
            <Alert
              type="warning"
              showIcon
              title={t('pages.oncall.notify.disabled')}
            />
          )}
          <div className={styles.notifyField}>
            <span className={styles.notifyLabel}>
              {t('pages.oncall.notify.kind')}
            </span>
            <Radio.Group
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              options={[
                { value: 1, label: t('pages.oncall.notify.kind.remind') },
                { value: 2, label: t('pages.oncall.notify.kind.digest') },
              ]}
            />
          </div>
          {kind === 1 ? (
            <>
              <div className={styles.notifyField}>
                <span className={styles.notifyLabel}>
                  {t('pages.oncall.notify.target')}
                </span>
                <Radio.Group
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  options={[
                    {
                      value: 1,
                      label: t('pages.oncall.notify.target.current'),
                      disabled: preview[1].length === 0,
                    },
                    {
                      value: 2,
                      label: t('pages.oncall.notify.target.next'),
                      disabled: preview[2].length === 0,
                    },
                  ]}
                />
              </div>
              <div className={styles.notifyField}>
                <span className={styles.notifyLabel}>
                  {t('pages.oncall.notify.recipients')}
                </span>
                <div className={styles.notifyValue}>
                  {shifts === null ? (
                    <Spin size="small" />
                  ) : recipients.length === 0 ? (
                    <Typography.Text type="secondary">
                      {t('pages.oncall.notify.recipients.none')}
                    </Typography.Text>
                  ) : (
                    recipients.map((shift) => (
                      <div key={`${shift.role}${shift.startTime}`}>
                        {t(`enum.oncall.shiftRole.${shift.role}`)}{' '}
                        {shift.userName || t('common.empty')}
                        <span className={styles.notifyMuted}>
                          {' · '}
                          {formatRange(shift.startTime, shift.endTime)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.notifyField}>
              <span className={styles.notifyLabel}>
                {t('pages.oncall.notify.recipients')}
              </span>
              <div className={styles.notifyValue}>
                {t('pages.oncall.notify.recipients.digest')}
              </div>
            </div>
          )}
          <Typography.Text type="secondary">
            {t('pages.oncall.notify.hint')}
          </Typography.Text>
        </div>
      )}
    </Modal>
  );
};
