/**
 * 故障详情「关联告警」：分页列表（规则名 / 等级 / 状态 / 资源 / 触发与恢复时间 / 关联方式），处理人可解除关联、
 * 粘贴告警 ID 关联；有告警事件菜单且后端说可看时链接到告警详情。
 */
import { Link, useAccess } from '@umijs/max';
import { App, Badge, Button, Space, Table, Tag } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmLink } from '@/components/TableActions';
import { NOTIFY_SEVERITY_META } from '@/constants';
import { detachAlert, listIncidentAlerts } from '@/services/incident/incident';
import type { Incident, IncidentAlert } from '@/services/incident/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useT } from '@/utils/i18n';
import { ATTACH_METHOD_META } from '../components/meta';
import { CiLink, RefName } from '../components/tags';
import { AttachAlertsModal } from './Dialogs';

const PAGE_SIZE = 20;
const ALERT_BADGE = { 1: 'error', 2: 'success', 3: 'default' } as const;

export const AlertsPanel: React.FC<{
  incident: Incident;
  refreshKey: number;
  onChanged: () => void;
}> = ({ incident, refreshKey, onChanged }) => {
  const t = useT();
  const access = useAccess();
  const has = usePermissions();
  const { message } = App.useApp();
  const [items, setItems] = useState<IncidentAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [attachOpen, setAttachOpen] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const current = ++seq.current;
    setLoading(true);
    try {
      const result = await listIncidentAlerts(incident.id, {
        page,
        pageSize: PAGE_SIZE,
      });
      if (current !== seq.current) return;
      setItems(result.items ?? []);
      setTotal(Number(result.total ?? 0));
    } catch {
      if (current === seq.current) setItems([]);
    } finally {
      if (current === seq.current) setLoading(false);
    }
  }, [incident.id, page]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  // 关联 / 解除告警归元素权限「处置」（incident.list.handle），与页头操作同一口径
  const canHandle =
    incident.canHandle === true &&
    incident.status <= 4 &&
    has('incident.list.handle');

  return (
    <div>
      {canHandle && (
        <Space style={{ marginBottom: 12 }}>
          <Button onClick={() => setAttachOpen(true)}>
            {t('pages.incident.action.attach')}
          </Button>
        </Space>
      )}
      <Table<IncidentAlert>
        rowKey="alertId"
        size="small"
        loading={loading}
        dataSource={items}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          onChange: setPage,
          hideOnSinglePage: true,
        }}
        columns={[
          {
            title: t('pages.incident.alert.rule'),
            dataIndex: 'ruleName',
            ellipsis: true,
            render: (_, row) =>
              row.canView && access.canMonitorAlert ? (
                <Link to={`/monitor/alert/${row.alertId}`}>
                  {row.ruleName || row.alertId}
                </Link>
              ) : (
                row.ruleName || row.alertId
              ),
          },
          {
            title: t('pages.incident.alert.severity'),
            dataIndex: 'severity',
            width: 90,
            render: (_, row) => {
              const meta = row.severity
                ? NOTIFY_SEVERITY_META[row.severity as 1 | 2 | 3 | 4]
                : undefined;
              return meta ? <Tag>{t(meta.textId)}</Tag> : t('common.empty');
            },
          },
          {
            title: t('common.column.status'),
            dataIndex: 'status',
            width: 100,
            render: (_, row) => (
              <Badge
                status={
                  ALERT_BADGE[(row.status ?? 1) as 1 | 2 | 3] ?? 'default'
                }
                text={t(`pages.incident.alert.status.${row.status ?? 1}`)}
              />
            ),
          },
          {
            title: t('pages.incident.alert.ci'),
            dataIndex: 'ci',
            ellipsis: true,
            render: (_, row) =>
              row.ci?.id ? (
                <CiLink ci={row.ci} canView={row.canView} />
              ) : (
                t('common.empty')
              ),
          },
          {
            title: t('pages.incident.alert.value'),
            dataIndex: 'value',
            width: 100,
            ellipsis: true,
          },
          {
            title: t('pages.incident.alert.firstFireTime'),
            dataIndex: 'firstFireTime',
            width: 160,
            render: (_, row) => formatTime(row.firstFireTime),
          },
          {
            title: t('pages.incident.alert.resolveTime'),
            dataIndex: 'resolveTime',
            width: 160,
            render: (_, row) =>
              formatTime(row.resolveTime) || t('common.empty'),
          },
          {
            title: t('pages.incident.alert.method'),
            dataIndex: 'method',
            width: 150,
            render: (_, row) => (
              <>
                {row.method
                  ? t(ATTACH_METHOD_META[row.method].textId)
                  : t('common.empty')}
                {row.attachUser?.id && (
                  <span style={{ marginInlineStart: 4 }}>
                    · <RefName ref={row.attachUser} />
                  </span>
                )}
              </>
            ),
          },
          {
            title: t('common.column.action'),
            key: 'action',
            width: 90,
            hidden: !canHandle,
            render: (_, row) => (
              <ConfirmLink
                danger
                title={t('pages.incident.alert.detach.title')}
                description={t('pages.incident.alert.detach.desc')}
                onConfirm={async () => {
                  await detachAlert(incident.id, row.alertId);
                  message.success(t('pages.incident.alert.detached'));
                  onChanged();
                }}
              >
                {t('pages.incident.alert.detach')}
              </ConfirmLink>
            ),
          },
        ]}
      />
      {attachOpen && (
        <AttachAlertsModal
          incident={incident}
          onClose={() => setAttachOpen(false)}
          onDone={onChanged}
        />
      )}
    </div>
  );
};
