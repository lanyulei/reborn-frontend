/**
 * 访问凭证：限时 kubeconfig 的签发、查看与吊销。普通用户只看到自己的；超管可查看全部并吊销任何人的。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { App, Badge, Switch } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { ConfirmLink, CreateButton } from '@/components/TableActions';
import {
  type KubeToken,
  listKubeTokens,
  revokeKubeToken,
} from '@/services/k8s/governance';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { formatTime } from '../components/cells';
import { SECURITY_TABS } from '../components/groups';
import { KubeconfigModal } from '../components/KubeconfigModal';
import { K8sPage } from '../components/scope';

const Tokens: React.FC = () => {
  const t = useT();
  const { message } = App.useApp();
  const has = usePermissions();
  const { initialState } = useModel('@@initialState');
  const isAdmin = initialState?.currentUser?.isAdmin === true;
  const table = useRef<ActionType>(null);
  const [issuing, setIssuing] = useState(false);
  const [all, setAll] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);

  const columns: ProColumns<KubeToken>[] = [
    {
      title: t('pages.k8s.scope.cluster'),
      dataIndex: 'clusterName',
      renderText: (_, r) => r.clusterName || t('common.empty'),
    },
    ...(all
      ? [
          {
            title: t('pages.k8s.audit.user'),
            dataIndex: 'username',
          } as ProColumns<KubeToken>,
        ]
      : []),
    {
      title: t('pages.k8s.kubeconfig.note'),
      dataIndex: 'note',
      renderText: (_, r) => r.note || t('common.empty'),
    },
    {
      title: t('pages.k8s.kubeconfig.status'),
      key: 'status',
      width: 110,
      render: (_, r) =>
        r.active ? (
          <Badge status="success" text={t('pages.k8s.kubeconfig.active')} />
        ) : r.revokeTime ? (
          <Badge status="default" text={t('pages.k8s.kubeconfig.revoked')} />
        ) : (
          <Badge status="default" text={t('pages.k8s.kubeconfig.expired')} />
        ),
    },
    {
      title: t('pages.k8s.kubeconfig.createTime'),
      dataIndex: 'createTime',
      width: 170,
      renderText: (_, r) => formatTime(r.createTime),
    },
    {
      title: t('pages.k8s.kubeconfig.expireTime'),
      dataIndex: 'expireTime',
      width: 170,
      renderText: (_, r) => formatTime(r.expireTime),
    },
    {
      title: t('pages.k8s.kubeconfig.lastUsed'),
      key: 'lastUsed',
      width: 260,
      renderText: (_, r) =>
        r.lastUsedTime
          ? `${formatTime(r.lastUsedTime)}${r.lastUsedIp ? `（${r.lastUsedIp}）` : ''}`
          : t('pages.k8s.kubeconfig.neverUsed'),
    },
    {
      title: t('common.column.action'),
      key: 'action',
      width: 90,
      render: (_, r) =>
        r.active ? (
          <ConfirmLink
            danger
            title={t('pages.k8s.kubeconfig.revoke.title')}
            description={t('pages.k8s.kubeconfig.revoke.content')}
            onConfirm={async () => {
              await revokeKubeToken(r.id);
              message.success(t('pages.k8s.kubeconfig.revoke.done'));
              table.current?.reload();
            }}
          >
            {t('pages.k8s.kubeconfig.revoke')}
          </ConfirmLink>
        ) : null,
    },
  ];

  return (
    <>
      <ProTable<KubeToken>
        cardBordered
        rowKey="id"
        actionRef={table}
        search={false}
        columns={columns}
        scroll={{ x: 'max-content' }}
        params={{ all, activeOnly }}
        headerTitle={
          has('k8s.kubeconfig.issue') && (
            <CreateButton onClick={() => setIssuing(true)}>
              {t('pages.k8s.kubeconfig.issue')}
            </CreateButton>
          )
        }
        toolBarRender={() => [
          <span key="active">
            {t('pages.k8s.kubeconfig.activeOnly')}{' '}
            <Switch
              size="small"
              checked={activeOnly}
              onChange={setActiveOnly}
            />
          </span>,
          isAdmin && (
            <span key="all">
              {t('pages.k8s.kubeconfig.all')}{' '}
              <Switch size="small" checked={all} onChange={setAll} />
            </span>
          ),
        ]}
        request={async (params) =>
          toTableResult(
            await listKubeTokens({
              page: params.current,
              pageSize: params.pageSize,
              all: params.all,
              activeOnly: params.activeOnly,
            }),
          )
        }
      />
      {issuing && (
        <KubeconfigModal
          onClose={() => setIssuing(false)}
          onIssued={() => table.current?.reload()}
        />
      )}
    </>
  );
};

const KubeconfigPage: React.FC = () => (
  <K8sPage
    group={SECURITY_TABS}
    tabs={[
      { key: 'token', label: '', scope: 'none', render: () => <Tokens /> },
    ]}
  />
);

export default KubeconfigPage;
