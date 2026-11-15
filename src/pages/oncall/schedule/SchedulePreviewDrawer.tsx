/**
 * 排班预览抽屉（值班表列表操作列打开）：按值班表当前配置计算未来的排班与异常，不写库。
 * 结果只反映轮转规则本身，不含已有的替班。
 */
import { Alert, Drawer, Empty, Segmented, Spin, Table } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  type PreviewScheduleResult,
  previewSchedule,
} from '@/services/oncall/schedule';
import type { OncallSchedule, OncallShift } from '@/services/oncall/typings';
import { getErrorMessage } from '@/services/system/request';
import { useT } from '@/utils/i18n';
import { useIssueText } from '../components/hooks';
import { useOncallStyles } from '../components/styles';
import { browserTimezone, formatRange } from '../components/time';

interface PreviewRow {
  key: string;
  startTime: string;
  endTime: string;
  primary?: OncallShift;
  backup?: OncallShift;
}

const PREVIEW_DAY_OPTIONS = [30, 60, 90];

interface SchedulePreviewDrawerProps {
  /** 要预览的值班表；不传即关闭 */
  schedule?: OncallSchedule;
  onClose: () => void;
}

export const SchedulePreviewDrawer: React.FC<SchedulePreviewDrawerProps> = ({
  schedule,
  onClose,
}) => {
  const t = useT();
  const { styles } = useOncallStyles();
  const issueText = useIssueText();
  const [days, setDays] = useState(PREVIEW_DAY_OPTIONS[0]);
  const [preview, setPreview] = useState<PreviewScheduleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!schedule) return;
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    previewSchedule({
      groupId: schedule.groupId,
      scheduleId: schedule.id,
      config: schedule.config,
      days,
    })
      .then((result) => !cancelled && setPreview(result))
      .catch((err) => {
        if (cancelled) return;
        setPreview(null);
        setError(getErrorMessage(err));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [schedule, days]);

  const rows = useMemo<PreviewRow[]>(() => {
    const map = new Map<string, PreviewRow>();
    for (const item of preview?.items ?? []) {
      const key = `${item.startTime}|${item.endTime}`;
      const row = map.get(key) ?? {
        key,
        startTime: item.startTime,
        endTime: item.endTime,
      };
      if (item.role === 1) row.primary = item;
      else row.backup = item;
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
  }, [preview]);

  const issues = preview?.issues ?? [];
  const userOf = (shift?: OncallShift) => shift?.userName || t('common.empty');

  return (
    <Drawer
      open={!!schedule}
      onClose={onClose}
      size={640}
      destroyOnHidden
      title={`${t('pages.oncall.schedule.preview.title')} - ${schedule?.config.name ?? ''}`}
      extra={
        <Segmented<number>
          value={days}
          onChange={setDays}
          options={PREVIEW_DAY_OPTIONS.map((value) => ({
            value,
            label: t('pages.oncall.schedule.preview.days', { days: value }),
          }))}
        />
      }
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          title={t('pages.oncall.schedule.preview.failed')}
          description={error}
        />
      ) : (
        <Spin spinning={loading}>
          {issues.length > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              title={t('pages.oncall.issue.summary', { count: issues.length })}
              description={
                <ul className={styles.issueList} style={{ maxWidth: 'none' }}>
                  {issues.map((issue) => (
                    <li
                      key={`${issue.type}${issue.userId}${issue.startTime}${issue.otherScheduleName}`}
                    >
                      {issueText(issue)}
                    </li>
                  ))}
                </ul>
              }
            />
          )}
          {preview && issues.length === 0 && rows.length > 0 && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
              title={t('pages.oncall.schedule.preview.noIssue')}
            />
          )}
          <Table<PreviewRow>
            size="small"
            rowKey="key"
            dataSource={rows}
            pagination={{ defaultPageSize: 15, hideOnSinglePage: true }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('pages.oncall.schedule.preview.empty')}
                />
              ),
            }}
            columns={[
              {
                title: t('pages.oncall.shift.column.time'),
                dataIndex: 'startTime',
                render: (_, row) => formatRange(row.startTime, row.endTime),
              },
              {
                title: t('enum.oncall.shiftRole.1'),
                dataIndex: 'primary',
                render: (_, row) => userOf(row.primary),
              },
              ...(schedule?.config.backupEnabled
                ? [
                    {
                      title: t('enum.oncall.shiftRole.2'),
                      dataIndex: 'backup',
                      render: (_: unknown, row: PreviewRow) =>
                        userOf(row.backup),
                    },
                  ]
                : []),
            ]}
          />
          <span className={styles.dutyMeta}>
            {t('pages.oncall.schedule.preview.hint', {
              timezone: browserTimezone(),
            })}
          </span>
        </Spin>
      )}
    </Drawer>
  );
};
