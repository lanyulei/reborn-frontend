/**
 * 操作审计（只读）：变更记录（全部写操作、Secret 明文查看、集群与授权的配置变更）│ 终端会话。
 * 缺省只回看 7 天，跨度上限 90 天。
 */
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Badge,
  Descriptions,
  Drawer,
  Spin,
  Tag,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import SectionTitle from '@/components/SectionTitle';
import { getAudit, listAudits, listExecSessions } from '@/services/k8s/audit';
import type { ExecSession, K8sAudit } from '@/services/k8s/typings';
import { useClusterOptions } from '@/services/k8s/useClusterOptions';
import { usePermissions } from '@/services/system/permissions';
import { formatBytes } from '@/utils/format';
import { useT } from '@/utils/i18n';
import { timeRangeColumn, toTableResult } from '@/utils/table';
import { formatTime } from '../components/cells';
import { SECURITY_TABS } from '../components/groups';
import { RecordPlayer } from '../components/RecordPlayer';
import { K8sPage } from '../components/scope';
import { useK8sStyles } from '../components/styles';
import { YamlDiff, YamlEditor } from '../components/YamlEditor';

/** 审计动作（k8scontract.Action*）；筛选下拉与展示共用 */
const ACTIONS = [
  'create',
  'update',
  'delete',
  'scale',
  'restart',
  'set_image',
  'rollback',
  'pause',
  'resume',
  'trigger',
  'suspend',
  'unsuspend',
  'evict',
  'cordon',
  'uncordon',
  'drain',
  'secret_reveal',
  'exec',
  'agent_install',
  'agent_revoke',
  'scope_replace',
  'debug',
  'file_upload',
  'file_download',
  'exec_replay',
  'kubeconfig_issue',
  'kubeconfig_revoke',
  'inspect',
  'helm_install',
  'helm_upgrade',
  'helm_rollback',
  'helm_uninstall',
];

/** 集群筛选下拉：当前用户可见的集群（共享缓存，见 useClusterOptions） */
const useClusterEnum = () => {
  const { data: clusterItems } = useClusterOptions();
  return useMemo<Record<string, { text: string }>>(
    () =>
      Object.fromEntries(
        (clusterItems ?? []).map((item) => [item.id, { text: item.name }]),
      ),
    [clusterItems],
  );
};

const prettyJson = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

const AuditDetail: React.FC<{ id: string; onClose: () => void }> = ({
  id,
  onClose,
}) => {
  const t = useT();
  const { styles } = useK8sStyles();
  const [audit, setAudit] = useState<K8sAudit>();

  useEffect(() => {
    let cancelled = false;
    getAudit(id)
      .then((res) => {
        if (!cancelled) setAudit(res.audit);
      })
      .catch(onClose);
    return () => {
      cancelled = true;
    };
  }, [id]);

  const actionText = (action?: string) =>
    action && ACTIONS.includes(action)
      ? t(`pages.k8s.audit.action.${action}`)
      : action;

  return (
    <Drawer
      open
      size={1080}
      destroyOnHidden
      title={t('pages.k8s.audit.detail.title')}
      onClose={onClose}
    >
      {!audit ? (
        <Spin style={{ display: 'block', margin: '80px auto' }} />
      ) : (
        <>
          <Descriptions
            bordered
            size="small"
            column={2}
            styles={{ label: { width: 120, whiteSpace: 'nowrap' } }}
            items={[
              {
                key: 'time',
                label: t('pages.k8s.audit.time'),
                children: formatTime(audit.createTime),
              },
              {
                key: 'user',
                label: t('pages.k8s.audit.user'),
                children: `${audit.username ?? ''}${audit.clientIp ? `（${audit.clientIp}）` : ''}`,
              },
              {
                key: 'cluster',
                label: t('pages.k8s.scope.cluster'),
                children: audit.clusterName || t('common.empty'),
              },
              {
                key: 'namespace',
                label: t('pages.k8s.column.namespace'),
                children: audit.namespace || t('common.empty'),
              },
              {
                key: 'object',
                label: t('pages.k8s.audit.object'),
                children: `${audit.kind || audit.resource || ''} / ${audit.name ?? ''}`,
              },
              {
                key: 'action',
                label: t('pages.k8s.audit.action'),
                children: (
                  <span>
                    {actionText(audit.action)}
                    {audit.emergency && (
                      <Tag color="error" style={{ marginInlineStart: 8 }}>
                        {t('pages.k8s.audit.emergency')}
                      </Tag>
                    )}
                  </span>
                ),
              },
              {
                key: 'result',
                label: t('pages.k8s.audit.result'),
                span: 2,
                children:
                  audit.result === 2 ? (
                    <span>
                      <Badge
                        status="error"
                        text={t('pages.k8s.audit.result.2')}
                      />
                      {audit.error ? `：${audit.error}` : ''}
                    </span>
                  ) : (
                    <Badge
                      status="success"
                      text={t('pages.k8s.audit.result.1')}
                    />
                  ),
              },
            ]}
          />
          {audit.truncated && (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
              title={t('pages.k8s.audit.truncated')}
            />
          )}
          {audit.patch && (
            <>
              <SectionTitle>{t('pages.k8s.audit.patch')}</SectionTitle>
              <Typography.Paragraph className={styles.codeBlock}>
                {prettyJson(audit.patch)}
              </Typography.Paragraph>
            </>
          )}
          {audit.beforeYaml && audit.afterYaml ? (
            <>
              <SectionTitle>{t('pages.k8s.audit.diff')}</SectionTitle>
              <YamlDiff
                before={audit.beforeYaml}
                after={audit.afterYaml}
                maxHeight={560}
              />
            </>
          ) : (
            (audit.beforeYaml || audit.afterYaml) && (
              <>
                <SectionTitle>
                  {t(
                    audit.afterYaml
                      ? 'pages.k8s.audit.after'
                      : 'pages.k8s.audit.before',
                  )}
                </SectionTitle>
                <YamlEditor
                  value={audit.afterYaml || audit.beforeYaml || ''}
                  readOnly
                  height={480}
                />
              </>
            )
          )}
        </>
      )}
    </Drawer>
  );
};

const Audits: React.FC = () => {
  const t = useT();
  const clusterEnum = useClusterEnum();
  const [detailId, setDetailId] = useState<string>();

  const actionEnum = useMemo(
    () =>
      Object.fromEntries(
        ACTIONS.map((action) => [
          action,
          { text: t(`pages.k8s.audit.action.${action}`) },
        ]),
      ),
    [t],
  );

  const columns: ProColumns<K8sAudit>[] = [
    timeRangeColumn<K8sAudit>(t, {
      start: 'createTimeStart',
      end: 'createTimeEnd',
    }),
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.k8s.audit.search'), maxLength: 64 },
    },
    {
      title: t('pages.k8s.audit.time'),
      dataIndex: 'createTime',
      search: false,
      width: 170,
      renderText: (_, row) => formatTime(row.createTime),
    },
    {
      title: t('pages.k8s.audit.user'),
      dataIndex: 'username',
      search: false,
      width: 120,
    },
    {
      title: t('pages.k8s.scope.cluster'),
      dataIndex: 'clusterId',
      width: 140,
      valueType: 'select',
      valueEnum: clusterEnum,
      fieldProps: { showSearch: true },
      renderText: (_, row) => row.clusterName || t('common.empty'),
    },
    {
      title: t('pages.k8s.column.namespace'),
      dataIndex: 'namespace',
      width: 140,
      fieldProps: { maxLength: 63 },
      renderText: (_, row) => row.namespace || t('common.empty'),
    },
    {
      title: t('pages.k8s.audit.resource'),
      dataIndex: 'resource',
      width: 140,
      fieldProps: { maxLength: 128, placeholder: 'deployments' },
      renderText: (_, row) => row.kind || row.resource,
    },
    {
      title: t('pages.k8s.column.name'),
      dataIndex: 'name',
      fieldProps: { maxLength: 253 },
      render: (_, row) => (
        <a onClick={() => setDetailId(row.id)}>{row.name || row.id}</a>
      ),
    },
    {
      title: t('pages.k8s.audit.action'),
      dataIndex: 'action',
      width: 130,
      valueType: 'select',
      valueEnum: actionEnum,
      render: (_, row) => (
        <span>
          {row.action && actionEnum[row.action]
            ? actionEnum[row.action].text
            : row.action}
          {row.emergency && (
            <Tag color="error" style={{ marginInlineStart: 8 }}>
              {t('pages.k8s.audit.emergency')}
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: t('pages.k8s.audit.result'),
      dataIndex: 'result',
      width: 100,
      valueType: 'select',
      valueEnum: {
        1: { text: t('pages.k8s.audit.result.1'), status: 'Success' },
        2: { text: t('pages.k8s.audit.result.2'), status: 'Error' },
      },
    },
    {
      title: t('pages.k8s.audit.clientIp'),
      dataIndex: 'clientIp',
      search: false,
      width: 130,
    },
  ];

  return (
    <>
      <ProTable<K8sAudit>
        cardBordered
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        request={async (params) =>
          toTableResult(
            await listAudits({
              page: params.current,
              pageSize: params.pageSize,
              createTimeStart: params.createTimeStart,
              createTimeEnd: params.createTimeEnd,
              clusterId: params.clusterId || undefined,
              namespace: params.namespace?.trim() || undefined,
              resource: params.resource?.trim() || undefined,
              name: params.name?.trim() || undefined,
              action: params.action || undefined,
              result: params.result ? Number(params.result) : undefined,
              keyword: params.keyword?.trim() || undefined,
            }),
          )
        }
      />
      {detailId && (
        <AuditDetail
          key={detailId}
          id={detailId}
          onClose={() => setDetailId(undefined)}
        />
      )}
    </>
  );
};

const END_REASONS = [
  'client_close',
  'idle_timeout',
  'max_duration',
  'detach_timeout',
  'container_exit',
  'shutdown',
  'error',
];

const Sessions: React.FC = () => {
  const t = useT();
  const clusterEnum = useClusterEnum();
  const has = usePermissions();
  const [replay, setReplay] = useState<ExecSession>();

  const columns: ProColumns<ExecSession>[] = [
    timeRangeColumn<ExecSession>(t, {
      start: 'startTimeStart',
      end: 'startTimeEnd',
    }),
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.k8s.session.search'), maxLength: 64 },
    },
    {
      title: t('pages.k8s.session.startTime'),
      dataIndex: 'startTime',
      search: false,
      width: 170,
      renderText: (_, row) => formatTime(row.startTime),
    },
    {
      title: t('pages.k8s.audit.user'),
      dataIndex: 'username',
      search: false,
      width: 120,
    },
    {
      title: t('pages.k8s.scope.cluster'),
      dataIndex: 'clusterId',
      width: 140,
      valueType: 'select',
      valueEnum: clusterEnum,
      fieldProps: { showSearch: true },
      renderText: (_, row) => row.clusterName || t('common.empty'),
    },
    {
      title: t('pages.k8s.column.namespace'),
      dataIndex: 'namespace',
      search: false,
      width: 140,
    },
    { title: 'Pod', dataIndex: 'pod', search: false },
    {
      title: t('pages.k8s.column.container'),
      dataIndex: 'container',
      search: false,
      width: 140,
    },
    {
      title: t('pages.k8s.session.endTime'),
      dataIndex: 'endTime',
      search: false,
      width: 170,
      render: (_, row) =>
        row.endTime ? (
          formatTime(row.endTime)
        ) : (
          <Badge status="processing" text={t('pages.k8s.session.active')} />
        ),
    },
    {
      title: t('pages.k8s.session.endReason'),
      dataIndex: 'endReason',
      search: false,
      width: 140,
      renderText: (_, row) =>
        row.endReason && END_REASONS.includes(row.endReason)
          ? t(`pages.k8s.session.end.${row.endReason}`)
          : row.endReason || t('common.empty'),
    },
    {
      title: t('pages.k8s.session.bytes'),
      key: 'bytes',
      search: false,
      width: 160,
      tooltip: t('pages.k8s.session.bytes.tooltip'),
      renderText: (_, row) =>
        `${formatBytes(row.bytesIn) || '0 B'} / ${formatBytes(row.bytesOut) || '0 B'}`,
    },
    {
      title: t('pages.k8s.audit.clientIp'),
      dataIndex: 'clientIp',
      search: false,
      width: 130,
    },
    {
      title: t('common.column.action'),
      key: 'action',
      search: false,
      width: 90,
      hideInTable: !has('k8s.audit.replay'),
      render: (_, row) =>
        row.recorded ? (
          <a onClick={() => setReplay(row)}>{t('pages.k8s.record.replay')}</a>
        ) : (
          t('common.empty')
        ),
    },
  ];

  return (
    <>
      {replay && (
        <RecordPlayer session={replay} onClose={() => setReplay(undefined)} />
      )}
      <ProTable<ExecSession>
        cardBordered
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        request={async (params) =>
          toTableResult(
            await listExecSessions({
              page: params.current,
              pageSize: params.pageSize,
              startTimeStart: params.startTimeStart,
              startTimeEnd: params.startTimeEnd,
              clusterId: params.clusterId || undefined,
              keyword: params.keyword?.trim() || undefined,
            }),
          )
        }
      />
    </>
  );
};

const Audit: React.FC = () => {
  const t = useT();
  return (
    <K8sPage
      group={SECURITY_TABS}
      tabs={[
        {
          key: 'audit',
          label: t('pages.k8s.audit.tab.audit'),
          scope: 'none',
          render: () => <Audits />,
        },
        {
          key: 'session',
          label: t('pages.k8s.audit.tab.session'),
          scope: 'none',
          render: () => <Sessions />,
        },
      ]}
    />
  );
};

export default Audit;
