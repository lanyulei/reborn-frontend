/**
 * CMDB 资源详情页的「故障」页签（由故障域提供，资源详情页只引入并放置）：影响该资源的故障，取自故障列表接口
 * 按 ciId 过滤。没有故障列表菜单的用户不出现这个页签，也不发请求；页签内容首次切到时才挂载。
 */
import { Link, useAccess } from '@umijs/max';
import { Alert, Button, Table } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listIncidents } from '@/services/incident/incident';
import { getIncidentErrorMessage } from '@/services/incident/request';
import type { Incident } from '@/services/incident/typings';
import { formatTime } from '@/utils/format';
import { useT } from '@/utils/i18n';
import { incidentPath } from './meta';
import { RefName, SeverityTag, StatusBadge } from './tags';

const PAGE_SIZE = 10;

export const CiIncidentsPanel: React.FC<{ ciId: string }> = ({ ciId }) => {
  const t = useT();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ items: Incident[]; total: number }>({
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
      const result = await listIncidents(
        { ciId, page, pageSize: PAGE_SIZE },
        { silent: true },
      );
      if (current !== seq.current) return;
      setData({ items: result.items ?? [], total: Number(result.total ?? 0) });
      setError(undefined);
    } catch (e) {
      if (current !== seq.current) return;
      setData({ items: [], total: 0 });
      setError(getIncidentErrorMessage(e, t('pages.incident.ciTab.failed')));
    } finally {
      if (current === seq.current) setLoading(false);
    }
  }, [ciId, page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          action={
            <Button size="small" loading={loading} onClick={() => void load()}>
              {t('pages.incident.retry')}
            </Button>
          }
          style={{ marginBottom: 12 }}
        />
      )}
      <Table<Incident>
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={data.items}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: data.total,
          onChange: setPage,
          hideOnSinglePage: true,
        }}
        locale={{ emptyText: t('pages.incident.ciTab.empty') }}
        columns={[
          {
            title: t('pages.incident.field.severity'),
            dataIndex: 'severity',
            width: 90,
            render: (_, r) => <SeverityTag severity={r.severity} />,
          },
          {
            title: t('pages.incident.field.number'),
            dataIndex: 'number',
            width: 170,
            render: (_, r) => <Link to={incidentPath(r.id)}>{r.number}</Link>,
          },
          {
            title: t('pages.incident.field.title'),
            dataIndex: 'title',
            ellipsis: true,
            render: (_, r) => <Link to={incidentPath(r.id)}>{r.title}</Link>,
          },
          {
            title: t('common.column.status'),
            dataIndex: 'status',
            width: 100,
            render: (_, r) => <StatusBadge status={r.status} />,
          },
          {
            title: t('pages.incident.field.commander'),
            dataIndex: 'commander',
            width: 110,
            ellipsis: true,
            render: (_, r) => <RefName ref={r.commander} />,
          },
          {
            title: t('pages.incident.field.openTime'),
            dataIndex: 'openTime',
            width: 160,
            render: (_, r) => formatTime(r.openTime),
          },
        ]}
      />
    </div>
  );
};

/** 用法：`const incidentTabs = useCiIncidentsTab(ci)`，再把 `...incidentTabs` 放进 Tabs 的 items。 */
export const useCiIncidentsTab = (
  ci?: { id: string } | null,
): { key: string; label: string; children: React.ReactNode }[] => {
  const t = useT();
  const access = useAccess();
  const enabled = Boolean(access.canIncidentList);
  const id = ci?.id;
  return useMemo(
    () =>
      enabled && id
        ? [
            {
              key: 'incidents',
              label: t('pages.incident.ciTab.title'),
              children: <CiIncidentsPanel ciId={id} />,
            },
          ]
        : [],
    [enabled, id, t],
  );
};
