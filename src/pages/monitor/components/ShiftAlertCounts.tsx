/**
 * 值班日历上的「当班期间告警数」（由监控告警域提供，值班日历页只引入并放置）：所选值班表在当前
 * 时间范围内各班次通知到当班人的告警事件数，逐班次一枚小徽标，只列有告警的班次。
 * 没有「告警事件」菜单的用户不渲染、不请求；接口失败（无权、服务端尚未提供等）同样静默不显示。
 */
import { useAccess } from '@umijs/max';
import { Badge, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useEffect, useState } from 'react';
import { listShiftAlertCounts } from '@/services/monitor/alert';
import type { ShiftAlertCount } from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import { useMonitorStyles } from './styles';

/** 接口限制：时间范围至多 62 天 */
const MAX_RANGE_DAYS = 62;
/** 一行里至多列出的班次数，其余折叠为「另有 N 个班次」 */
const MAX_SHOWN = 12;
const SHIFT_TIME_FORMAT = 'MM-DD HH:mm';

export const ShiftAlertCounts: React.FC<{
  /** 值班表；未选中时不显示 */
  scheduleId?: string;
  /** 时间范围（RFC3339；起点含、终点不含） */
  startTime: string;
  endTime: string;
}> = ({ scheduleId, startTime, endTime }) => {
  const t = useT();
  const access = useAccess();
  const { styles } = useMonitorStyles();
  const enabled = Boolean(access.canMonitorAlert);
  const [items, setItems] = useState<ShiftAlertCount[]>([]);

  useEffect(() => {
    setItems([]);
    if (
      !enabled ||
      !scheduleId ||
      dayjs(endTime).diff(dayjs(startTime), 'day', true) > MAX_RANGE_DAYS
    ) {
      return;
    }
    let cancelled = false;
    listShiftAlertCounts({ scheduleId, startTime, endTime })
      .then((result) => {
        if (!cancelled) setItems(result.items ?? []);
      })
      // 无权 / 服务端未提供：不显示，也不提示
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled, scheduleId, startTime, endTime]);

  const busy = items.filter((item) => (item.alertCount ?? 0) > 0);
  if (!enabled || busy.length === 0) return null;
  const total = busy.reduce((sum, item) => sum + (item.alertCount ?? 0), 0);
  const shown = busy.slice(0, MAX_SHOWN);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-y-1">
      <span className={styles.hint} style={{ marginInlineEnd: 8 }}>
        {t('pages.monitor.shiftAlerts.title', { total })}
      </span>
      {shown.map((item) => (
        <Tooltip
          key={`${item.userId}-${item.role}-${item.startTime}`}
          title={t('pages.monitor.shiftAlerts.tooltip', {
            start: dayjs(item.startTime).format(SHIFT_TIME_FORMAT),
            end: dayjs(item.endTime).format(SHIFT_TIME_FORMAT),
            count: item.alertCount ?? 0,
          })}
        >
          <Tag>
            {t(
              item.role === 2
                ? 'pages.monitor.shiftAlerts.backup'
                : 'pages.monitor.shiftAlerts.primary',
              {
                name: item.userName || item.userId || '',
                day: dayjs(item.startTime).format('MM-DD'),
              },
            )}
            <Badge
              count={item.alertCount}
              size="small"
              style={{ marginInlineStart: 6 }}
            />
          </Tag>
        </Tooltip>
      ))}
      {busy.length > shown.length && (
        <span className={styles.hint}>
          {t('pages.monitor.shiftAlerts.more', {
            count: busy.length - shown.length,
          })}
        </span>
      )}
    </div>
  );
};

export default ShiftAlertCounts;
