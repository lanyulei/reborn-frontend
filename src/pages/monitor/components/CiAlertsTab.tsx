/**
 * CMDB 资源详情页的「告警」页签（由监控告警域提供，资源详情页只引入并放置）：该资源的活跃告警与
 * 最近的历史告警，取自告警列表接口按 ciId 过滤的结果。没有「告警事件」菜单的用户不出现这个页签，
 * 也不发任何请求；页签内容在首次切到它时才挂载（antd Tabs 的惰性渲染），所以进入资源详情页本身
 * 不产生监控告警域的请求。
 */
import { Link, useAccess } from '@umijs/max';
import { Alert, Button, Segmented, Table, Tag } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listAlerts } from '@/services/monitor/alert';
import { getMonitorErrorMessage } from '@/services/monitor/request';
import type { MonitorAlert } from '@/services/monitor/typings';
import { useEnumText, useT } from '@/utils/i18n';
import { formatDuration, formatTime, formatValue } from './format';
import { ALERT_STATUS_META, HANDLE_STATE_META } from './meta';
import { LabelTags, SeverityTag } from './tags';

type Scope = 'active' | 'history';
const PAGE_SIZE = 10;

/** 带资源过滤的告警事件列表地址（告警事件页据 ciId / ciName 显示筛选横幅） */
export const ciAlertsPath = (ciId: string, ciName?: string): string => {
  const search = new URLSearchParams({ ciId });
  if (ciName) search.set('ciName', ciName);
  return `/monitor/alert?${search.toString()}`;
};

export const CiAlertsPanel: React.FC<{ ciId: string; ciName?: string }> = ({
  ciId,
  ciName,
}) => {
  const t = useT();
  const statusText = useEnumText(ALERT_STATUS_META);
  const [scope, setScope] = useState<Scope>('active');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ items: MonitorAlert[]; total: number }>({
    items: [],
    total: 0,
  });
  const [error, setError] = useState<string>();
  // 只采纳最后一次请求的结果
  const seq = useRef(0);

  const load = useCallback(async () => {
    const current = ++seq.current;
    setLoading(true);
    try {
      const result = await listAlerts(
        {
          ciId,
          statuses: scope === 'active' ? [1] : [2, 3],
          page,
          pageSize: PAGE_SIZE,
        },
        { silent: true },
      );
      if (current !== seq.current) return;
      setData({ items: result.items ?? [], total: Number(result.total ?? 0) });
      setError(undefined);
    } catch (e) {
      if (current !== seq.current) return;
      setData({ items: [], total: 0 });
      setError(getMonitorErrorMessage(e, t('pages.monitor.ciAlerts.failed')));
    } finally {
      if (current === seq.current) setLoading(false);
    }
  }, [ciId, scope, page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Segmented<Scope>
          value={scope}
          options={[
            { value: 'active', label: t('pages.monitor.ciAlerts.active') },
            { value: 'history', label: t('pages.monitor.ciAlerts.history') },
          ]}
          onChange={(value) => {
            setScope(value);
            setPage(1);
          }}
        />
        <Link to={ciAlertsPath(ciId, ciName)}>
          {t('pages.monitor.ciAlerts.viewAll')}
        </Link>
      </div>
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          action={
            <Button size="small" loading={loading} onClick={() => void load()}>
              {t('pages.monitor.retry')}
            </Button>
          }
          style={{ marginBottom: 12 }}
        />
      )}
      <Table<MonitorAlert>
        size="small"
        rowKey="id"
        loading={loading}
        dataSource={data.items}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: error
            ? t('common.empty')
            : t(`pages.monitor.ciAlerts.empty.${scope}`),
        }}
        pagination={
          data.total > PAGE_SIZE
            ? {
                current: page,
                pageSize: PAGE_SIZE,
                total: data.total,
                showSizeChanger: false,
                onChange: setPage,
              }
            : false
        }
        columns={[
          {
            title: t('pages.monitor.alert.column.severity'),
            dataIndex: 'severity',
            width: 80,
            render: (_, row) => <SeverityTag severity={row.severity} />,
          },
          {
            title: t('pages.monitor.alert.column.rule'),
            dataIndex: 'ruleName',
            render: (_, row) => (
              <Link to={`/monitor/alert/${row.id}`}>{row.ruleName}</Link>
            ),
          },
          {
            title: t('pages.monitor.alert.column.labels'),
            dataIndex: 'labels',
            render: (_, row) => <LabelTags labels={row.labels} max={3} />,
          },
          {
            title: t('pages.monitor.alert.column.value'),
            dataIndex: 'value',
            width: 100,
            render: (_, row) => formatValue(row.value) || t('common.empty'),
          },
          {
            title: t('common.column.status'),
            dataIndex: 'status',
            width: 110,
            render: (_, row) => {
              // 活跃告警显示处理状态（未认领 / 已认领 / 已屏蔽 / 被抑制）；历史告警显示已恢复 / 已关闭
              const handle =
                scope === 'active' && row.handleState
                  ? HANDLE_STATE_META[row.handleState]
                  : undefined;
              if (handle) {
                return (
                  <Tag color={handle.color} style={{ marginInlineEnd: 0 }}>
                    {t(handle.textId)}
                  </Tag>
                );
              }
              return row.status ? statusText(row.status) : t('common.empty');
            },
          },
          {
            title: t('pages.monitor.alert.column.firstFireTime'),
            dataIndex: 'firstFireTime',
            width: 170,
            render: (_, row) => formatTime(row.firstFireTime),
          },
          {
            title: t('pages.monitor.alert.column.duration'),
            dataIndex: 'durationS',
            width: 130,
            render: (_, row) => formatDuration(row.durationS, t),
          },
        ]}
      />
    </div>
  );
};

/**
 * 资源详情页 Tabs 的「告警」页签项：有「告警事件」菜单且资源已加载时返回一项，否则为空数组。
 * 用法：`const alertTabs = useCiAlertsTab(ci)`，再把 `...alertTabs` 放进 Tabs 的 items。
 */
export const useCiAlertsTab = (
  ci?: { id: string; name?: string } | null,
): { key: string; label: string; children: React.ReactNode }[] => {
  const t = useT();
  const access = useAccess();
  const enabled = Boolean(access.canMonitorAlert);
  const id = ci?.id;
  const name = ci?.name;
  return useMemo(
    () =>
      enabled && id
        ? [
            {
              key: 'monitor-alerts',
              label: t('pages.monitor.ciAlerts.tab'),
              children: <CiAlertsPanel ciId={id} ciName={name} />,
            },
          ]
        : [],
    [enabled, id, name, t],
  );
};
