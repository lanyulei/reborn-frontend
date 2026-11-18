/**
 * 按周重复的时间窗编辑器（规则生效时间、屏蔽规则的周期时间共用）：时区 + 多段
 * 「星期 + 起止时刻」。结束早于开始表示跨午夜到次日，等于开始表示全天。
 * 受控组件，值为 EffectiveTime；配套校验见 validateEffectiveTime。
 */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, ConfigProvider, Input, TimePicker } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import type { EffectiveTime, TimeWindow } from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import { MONITOR_LIMITS } from './meta';
import { useMonitorStyles } from './styles';

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const HM = 'HH:mm';

/** 浏览器当前时区（新建时的缺省值） */
export const localTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

/** 每个时间窗至少选一天且起止时刻齐全；时区不超长 */
export const validateEffectiveTime = (value?: EffectiveTime): boolean =>
  (value?.timezone ?? '').length <= MONITOR_LIMITS.timezoneMax &&
  (value?.windows ?? []).every(
    (w) => w.days.length > 0 && Boolean(w.start) && Boolean(w.end),
  );

/** 时间窗摘要（列表 / 版本对比展示）：周一、周二 09:00-18:00 */
export const useWindowText = () => {
  const t = useT();
  return (w: TimeWindow) =>
    `${[...w.days]
      .sort((a, b) => a - b)
      .map((day) => t(`pages.monitor.weekday.${day}`))
      .join(t('pages.monitor.listSeparator'))} ${w.start}-${w.end}`;
};

export const TimeWindowsEditor: React.FC<{
  value?: EffectiveTime;
  onChange?: (value: EffectiveTime) => void;
  /** 没有时间窗时的说明（规则：全时段生效；周期屏蔽：至少一个） */
  emptyHint?: string;
}> = ({ value, onChange, emptyHint }) => {
  const t = useT();
  const { styles } = useMonitorStyles();
  // 表单整体只读（禁用）时「添加」也要禁用：按钮上显式的 disabled 会盖过表单的禁用状态
  const { componentDisabled } = ConfigProvider.useConfig();
  const windows = value?.windows ?? [];

  const emit = (patch: Partial<EffectiveTime>) =>
    onChange?.({ timezone: value?.timezone, windows, ...patch });
  const update = (index: number, patch: Partial<TimeWindow>) =>
    emit({
      windows: windows.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    });

  return (
    <div>
      <div className={styles.editorRow} style={{ alignItems: 'center' }}>
        <span>{t('pages.monitor.window.timezone')}</span>
        <Input
          style={{ width: 240 }}
          value={value?.timezone}
          maxLength={MONITOR_LIMITS.timezoneMax}
          placeholder="Asia/Shanghai"
          onChange={(e) => emit({ timezone: e.target.value.trim() })}
        />
        <span className={styles.hint}>
          {t('pages.monitor.window.timezone.hint')}
        </span>
      </div>
      {windows.length === 0 && emptyHint && (
        <div className={styles.hint} style={{ marginBottom: 8 }}>
          {emptyHint}
        </div>
      )}
      {windows.map((w, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 行无稳定标识，按位置编辑
        <div key={index} className={styles.editorRow}>
          <Checkbox.Group
            style={{ flex: 1, minWidth: 0, paddingTop: 5 }}
            value={w.days}
            options={DAYS.map((day) => ({
              value: day,
              label: t(`pages.monitor.weekday.${day}`),
            }))}
            onChange={(days) => update(index, { days: days as number[] })}
          />
          <TimePicker.RangePicker
            style={{ width: 200, flex: 'none' }}
            format={HM}
            minuteStep={5}
            // 允许结束早于开始（跨午夜）
            order={false}
            allowClear={false}
            value={[dayjs(w.start, HM), dayjs(w.end, HM)]}
            onChange={(range) =>
              update(index, {
                start: range?.[0]?.format(HM) ?? w.start,
                end: range?.[1]?.format(HM) ?? w.end,
              })
            }
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            aria-label={t('pages.monitor.editor.remove')}
            onClick={() =>
              emit({ windows: windows.filter((_, i) => i !== index) })
            }
          />
        </div>
      ))}
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        disabled={
          componentDisabled || windows.length >= MONITOR_LIMITS.windowMax
        }
        onClick={() =>
          emit({
            windows: [
              ...windows,
              { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' },
            ],
          })
        }
      >
        {t('pages.monitor.window.add')}
      </Button>
      <div className={styles.hint} style={{ marginTop: 4 }}>
        {t('pages.monitor.window.hint')}
      </div>
    </div>
  );
};

export default TimeWindowsEditor;
