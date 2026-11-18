/**
 * 集群管理：集群（接入 / 连通性 / Agent）│ 节点 │ 命名空间。
 * 集群页签面向集群管理员，不受作用域栏约束；节点与命名空间在当前集群内操作。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Badge,
  Flex,
  Form,
  Input,
  Modal,
  Progress,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import SectionTitle from '@/components/SectionTitle';
import {
  ConfirmLink,
  CreateButton,
  DeleteConfirmLink,
} from '@/components/TableActions';
import {
  deleteCluster,
  installAgent,
  listClusters,
  revokeAgent,
} from '@/services/k8s/cluster';
import { listNamespaceQuotas, type NamespaceQuota } from '@/services/k8s/helm';
import type { AgentInstall, Cluster } from '@/services/k8s/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import {
  ChangeSettingsButton,
  NamespaceRequestButton,
  useChangeSettings,
} from '../change/requests';
import { ManifestModal } from '../components/ChangePreview';
import { AgeText, formatTime } from '../components/cells';
import { GVRS, isProdEnv, NAME_REGEX } from '../components/meta';
import { ResourceView } from '../components/ResourceView';
import { K8sPage, useK8sScope } from '../components/scope';
import { useK8sStyles } from '../components/styles';
import { ClusterDrawer } from './ClusterDrawer';

const STATUS_BADGE = ['default', 'success', 'error'] as const;

/** Agent 安装命令：一次性注册令牌，过期前未安装需重新生成 */
const AgentModal: React.FC<{
  name: string;
  info: AgentInstall;
  onClose: () => void;
}> = ({ name, info, onClose }) => {
  const t = useT();
  const { styles } = useK8sStyles();
  const inCluster = info.location !== 2;
  const content = (inCluster ? info.manifest : info.command) ?? '';
  return (
    <Modal
      open
      width={960}
      title={t('pages.k8s.agent.title', { name })}
      okText={t('pages.k8s.change.close')}
      cancelButtonProps={{ style: { display: 'none' } }}
      mask={{ closable: false }}
      // 安装命令里的注册令牌只显示这一次：只能点按钮关闭
      keyboard={false}
      closable={false}
      onOk={onClose}
      onCancel={onClose}
    >
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 12 }}
        title={t('pages.k8s.agent.warning', {
          time: formatTime(info.expireTime),
        })}
        description={t(
          inCluster
            ? 'pages.k8s.agent.hint.inCluster'
            : 'pages.k8s.agent.hint.relay',
        )}
      />
      <Typography.Paragraph
        className={styles.codeBlock}
        copyable={{ text: content }}
        style={{ marginBottom: 0 }}
      >
        {content}
      </Typography.Paragraph>
    </Modal>
  );
};

const ClusterList: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  // undefined = 抽屉关闭；null = 接入；对象 = 编辑
  const [formRow, setFormRow] = useState<Cluster | null | undefined>(undefined);
  const [agent, setAgent] = useState<{ name: string; info: AgentInstall }>();
  const [envs, setEnvs] = useState<string[]>([]);

  const reload = () => actionRef.current?.reload();

  const openAgent = async (cluster: Cluster) => {
    try {
      const info = await installAgent(cluster.id);
      setAgent({ name: cluster.spec.name, info });
      reload();
    } catch {
      // 已由请求层提示
    }
  };

  const columns: ProColumns<Cluster>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.k8s.cluster.search'), maxLength: 64 },
    },
    {
      title: t('pages.k8s.cluster.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      render: (_, row) => (
        <div>
          <div>
            {row.spec.name}
            {row.spec.enabled === false && (
              <Tag style={{ marginInlineStart: 8 }}>
                {t('enum.enabled.false')}
              </Tag>
            )}
          </div>
          {(row.spec.displayName || row.spec.description) && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {[row.spec.displayName, row.spec.description]
                .filter(Boolean)
                .join(' · ')}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: t('pages.k8s.cluster.env'),
      dataIndex: 'env',
      width: 110,
      fieldProps: { maxLength: 32 },
      render: (_, row) =>
        row.spec.env ? (
          <Tag color={isProdEnv(row.spec.env) ? 'red' : undefined}>
            {row.spec.env}
          </Tag>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: {
        0: { text: t('pages.k8s.cluster.status.0') },
        1: { text: t('pages.k8s.cluster.status.1') },
        2: { text: t('pages.k8s.cluster.status.2') },
      },
      render: (_, row) => {
        const status = row.runtime?.status ?? 0;
        const badge = (
          <Badge
            status={STATUS_BADGE[status]}
            text={t(`pages.k8s.cluster.status.${status}`)}
          />
        );
        return row.runtime?.lastError ? (
          <Tooltip title={row.runtime.lastError}>{badge}</Tooltip>
        ) : (
          badge
        );
      },
    },
    {
      title: t('pages.k8s.cluster.accessMode'),
      key: 'accessMode',
      search: false,
      width: 150,
      render: (_, row) =>
        row.spec.accessMode === 1 ? (
          <Tooltip
            title={
              row.runtime?.agentLastSeen
                ? t('pages.k8s.cluster.agent.lastSeen', {
                    time: formatTime(row.runtime.agentLastSeen),
                  })
                : t('pages.k8s.cluster.agent.never')
            }
          >
            <span>
              {t(
                `pages.k8s.cluster.agentLocation.${row.spec.agentLocation || 1}`,
              )}
              {row.runtime?.agentVersion
                ? ` · ${row.runtime.agentVersion}`
                : ''}
            </span>
          </Tooltip>
        ) : (
          t('pages.k8s.cluster.accessMode.2')
        ),
    },
    {
      title: t('pages.k8s.cluster.version'),
      key: 'version',
      search: false,
      width: 110,
      renderText: (_, row) => row.runtime?.k8sVersion || t('common.empty'),
    },
    {
      title: t('pages.k8s.cluster.nodes'),
      key: 'nodes',
      search: false,
      width: 100,
      tooltip: t('pages.k8s.cluster.nodes.tooltip'),
      renderText: (_, row) =>
        row.runtime?.status
          ? `${row.runtime.nodeReady ?? 0} / ${row.runtime.nodeTotal ?? 0}`
          : t('common.empty'),
    },
    {
      title: t('pages.k8s.cluster.scope'),
      key: 'scope',
      search: false,
      width: 110,
      render: (_, row) =>
        row.runtime?.scopeError ? (
          <Tooltip title={row.runtime.scopeError}>
            <Badge status="error" text={t('pages.k8s.cluster.scope.error')} />
          </Tooltip>
        ) : row.runtime?.scopeSynced ? (
          <Badge status="success" text={t('pages.k8s.cluster.scope.synced')} />
        ) : (
          <Badge
            status="processing"
            text={t('pages.k8s.cluster.scope.syncing')}
          />
        ),
    },
    {
      title: t('pages.k8s.cluster.probeTime'),
      key: 'probeTime',
      search: false,
      width: 100,
      render: (_, row) => <AgeText value={row.runtime?.probeTime} />,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 220,
      render: (_, row) => {
        const actions: React.ReactNode[] = [];
        if (has('k8s.cluster.edit')) {
          actions.push(
            <a key="edit" onClick={() => setFormRow(row)}>
              {t('common.action.edit')}
            </a>,
          );
        }
        if (row.spec.accessMode === 1 && has('k8s.cluster.agent')) {
          actions.push(
            (row.agentTokens ?? 0) > 0 ? (
              <ConfirmLink
                key="install"
                title={t('pages.k8s.agent.install.title', {
                  name: row.spec.name,
                })}
                description={t('pages.k8s.agent.install.again')}
                onConfirm={() => openAgent(row)}
              >
                {t('pages.k8s.agent.install')}
              </ConfirmLink>
            ) : (
              <a key="install" onClick={() => openAgent(row)}>
                {t('pages.k8s.agent.install')}
              </a>
            ),
          );
          if ((row.agentTokens ?? 0) > 0) {
            actions.push(
              <ConfirmLink
                key="revoke"
                danger
                title={t('pages.k8s.agent.revoke.title', {
                  name: row.spec.name,
                })}
                description={t('pages.k8s.agent.revoke.content')}
                onConfirm={async () => {
                  await revokeAgent(row.id);
                  message.success(t('pages.k8s.agent.revoke.done'));
                  reload();
                }}
              >
                {t('pages.k8s.agent.revoke')}
              </ConfirmLink>,
            );
          }
        }
        if (has('k8s.cluster.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.k8s.cluster.delete.title', {
                name: row.spec.name,
              })}
              description={t('pages.k8s.cluster.delete.content')}
              onConfirm={async () => {
                await deleteCluster(row.id);
                message.success(t('common.msg.deleted'));
                reload();
              }}
            >
              {t('pages.k8s.cluster.delete')}
            </DeleteConfirmLink>,
          );
        }
        return actions;
      },
    },
  ];

  return (
    <>
      <ProTable<Cluster>
        cardBordered
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        // 状态由数据面探活维护：定时刷新
        polling={15_000}
        headerTitle={
          (has('k8s.cluster.create') || has('k8s.cluster.edit')) && (
            <Space>
              {has('k8s.cluster.create') && (
                <CreateButton onClick={() => setFormRow(null)}>
                  {t('pages.k8s.cluster.create.title')}
                </CreateButton>
              )}
              {has('k8s.cluster.edit') && <ChangeSettingsButton />}
            </Space>
          )
        }
        request={async (params) => {
          const res = await listClusters(
            {
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              env: params.env || undefined,
              status:
                params.status === undefined ? undefined : Number(params.status),
            },
            { silent: true },
          ).catch(() => undefined);
          if (!res) return { data: [], total: 0, success: false };
          setEnvs((prev) => [
            ...new Set([
              ...prev,
              ...(res.items ?? [])
                .map((item) => item.spec.env ?? '')
                .filter(Boolean),
            ]),
          ]);
          return toTableResult(res);
        }}
      />
      {formRow !== undefined && (
        <ClusterDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          envOptions={envs}
          onClose={() => setFormRow(undefined)}
          onSaved={(cluster, created) => {
            reload();
            if (
              created &&
              cluster.spec.accessMode === 1 &&
              has('k8s.cluster.agent')
            ) {
              void openAgent(cluster);
            }
          }}
        />
      )}
      {agent && (
        <AgentModal
          name={agent.name}
          info={agent.info}
          onClose={() => setAgent(undefined)}
        />
      )}
    </>
  );
};

interface NamespaceForm {
  name: string;
  cpuRequests?: string;
  memoryRequests?: string;
  cpuLimits?: string;
  memoryLimits?: string;
  pods?: string;
  defaultCpuRequest?: string;
  defaultMemoryRequest?: string;
  defaultCpuLimit?: string;
  defaultMemoryLimit?: string;
}

const QUANTITY_REGEX = /^[0-9]+(\.[0-9]+)?(m|k|Ki|M|Mi|G|Gi|T|Ti)?$/;

/** 表单 → 清单：Namespace，以及可选的 ResourceQuota 与 LimitRange（值都加引号，避免被当成数字） */
const namespaceManifest = (values: NamespaceForm): string => {
  const name = values.name.trim();
  const pairs = (entries: [string, string | undefined][], indent: string) =>
    entries
      .filter(([, value]) => value?.trim())
      .map(([key, value]) => `${indent}${key}: "${value?.trim()}"`)
      .join('\n');
  const docs = [
    `apiVersion: v1\nkind: Namespace\nmetadata:\n  name: ${name}\n`,
  ];
  const hard = pairs(
    [
      ['requests.cpu', values.cpuRequests],
      ['requests.memory', values.memoryRequests],
      ['limits.cpu', values.cpuLimits],
      ['limits.memory', values.memoryLimits],
      ['pods', values.pods],
    ],
    '    ',
  );
  if (hard) {
    docs.push(
      `apiVersion: v1\nkind: ResourceQuota\nmetadata:\n  name: default\n  namespace: ${name}\nspec:\n  hard:\n${hard}\n`,
    );
  }
  const request = pairs(
    [
      ['cpu', values.defaultCpuRequest],
      ['memory', values.defaultMemoryRequest],
    ],
    '        ',
  );
  const limit = pairs(
    [
      ['cpu', values.defaultCpuLimit],
      ['memory', values.defaultMemoryLimit],
    ],
    '        ',
  );
  if (request || limit) {
    docs.push(
      `apiVersion: v1\nkind: LimitRange\nmetadata:\n  name: default\n  namespace: ${name}\nspec:\n  limits:\n    - type: Container\n${
        request ? `      defaultRequest:\n${request}\n` : ''
      }${limit ? `      default:\n${limit}\n` : ''}`,
    );
  }
  return docs.join('---\n');
};

/** 新建命名空间：可同时设定配额与容器缺省资源；生成清单后走统一的预检与提交 */
const NamespaceCreate: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const t = useT();
  const scope = useK8sScope();
  const [open, setOpen] = useState(false);
  const [manifest, setManifest] = useState<string>();
  const [form] = Form.useForm<NamespaceForm>();

  const quantity = {
    pattern: QUANTITY_REGEX,
    message: t('pages.k8s.namespace.quantity.rule'),
  };
  const field = (name: keyof NamespaceForm, placeholder: string) => (
    <Form.Item
      name={name}
      label={t(`pages.k8s.namespace.${name}`)}
      rules={[quantity]}
      style={{ flex: 1, minWidth: 180 }}
    >
      <Input placeholder={placeholder} maxLength={32} />
    </Form.Item>
  );

  return (
    <>
      <CreateButton onClick={() => setOpen(true)}>
        {t('pages.k8s.namespace.create')}
      </CreateButton>
      <Modal
        open={open}
        width={720}
        title={t('pages.k8s.namespace.create')}
        destroyOnHidden
        mask={{ closable: false }}
        okText={t('pages.k8s.change.preview')}
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          setManifest(namespaceManifest(values));
          setOpen(false);
        }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label={t('pages.k8s.column.name')}
            rules={[
              {
                required: true,
                message: t('pages.k8s.namespace.name.required'),
              },
              {
                pattern: NAME_REGEX,
                message: t('pages.k8s.cluster.name.rule'),
              },
            ]}
          >
            <Input maxLength={63} />
          </Form.Item>
          <SectionTitle>{t('pages.k8s.namespace.quota')}</SectionTitle>
          <Typography.Paragraph type="secondary">
            {t('pages.k8s.namespace.quota.hint')}
          </Typography.Paragraph>
          <div className="flex flex-wrap gap-x-4">
            {field('cpuRequests', '8')}
            {field('memoryRequests', '16Gi')}
            {field('cpuLimits', '16')}
            {field('memoryLimits', '32Gi')}
            {field('pods', '100')}
          </div>
          <SectionTitle>{t('pages.k8s.namespace.limitRange')}</SectionTitle>
          <Typography.Paragraph type="secondary">
            {t('pages.k8s.namespace.limitRange.hint')}
          </Typography.Paragraph>
          <div className="flex flex-wrap gap-x-4">
            {field('defaultCpuRequest', '100m')}
            {field('defaultMemoryRequest', '128Mi')}
            {field('defaultCpuLimit', '500m')}
            {field('defaultMemoryLimit', '512Mi')}
          </div>
        </Form>
      </Modal>
      {manifest && (
        <ManifestModal
          clusterId={scope.clusterId}
          title={t('pages.k8s.namespace.create')}
          initialYaml={manifest}
          onClose={() => setManifest(undefined)}
          onDone={() => {
            onDone();
            // 新命名空间要出现在切换器里
            scope.reload();
          }}
        />
      )}
    </>
  );
};

/** 配额用量：每项资源一条进度（已用 / 上限）；没有配额的命名空间显示 - */
const QuotaCell: React.FC<{ quota?: NamespaceQuota }> = ({ quota }) => {
  const items = (quota?.items ?? []).filter((item) =>
    QUOTA_SHOWN.includes(item.resource),
  );
  if (items.length === 0) return <>-</>;
  return (
    <div style={{ minWidth: 220 }}>
      {items.map((item) => (
        <Tooltip
          key={item.resource}
          title={`${item.resource}: ${item.used} / ${item.hard}`}
        >
          <Flex gap={8} align="center">
            <span style={{ width: 96, fontSize: 12 }}>{item.resource}</span>
            <Progress
              size="small"
              style={{ flex: 1, margin: 0 }}
              percent={Math.min(100, Math.round(item.ratio * 100))}
              status={item.ratio >= 0.9 ? 'exception' : 'normal'}
            />
          </Flex>
        </Tooltip>
      ))}
    </div>
  );
};
const QUOTA_SHOWN = [
  'requests.cpu',
  'requests.memory',
  'limits.cpu',
  'limits.memory',
  'pods',
];

const Namespaces: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const scope = useK8sScope();
  const [tick, setTick] = useState(0);
  const [quotas, setQuotas] = useState<Record<string, NamespaceQuota>>({});
  const settings = useChangeSettings();

  // 配额用量是列表之外的附加信息：取不到（无权限等）不影响列表
  useEffect(() => {
    if (!scope.clusterId) return;
    let cancelled = false;
    listNamespaceQuotas(scope.clusterId, undefined, { silent: true })
      .then((res) => {
        if (cancelled) return;
        setQuotas(
          Object.fromEntries(
            (res.items ?? []).map((item) => [item.namespace, item]),
          ),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [scope.clusterId]);

  const extraColumns = useMemo(
    () => [
      {
        key: '__quota',
        title: t('pages.k8s.quota.usage'),
        render: (row: { name: string }) => (
          <QuotaCell quota={quotas[row.name]} />
        ),
      },
    ],
    [quotas, t],
  );
  return (
    <ResourceView
      key={tick}
      gvr={GVRS.namespace}
      namespaced={false}
      creatable={false}
      extraColumns={extraColumns}
      extra={
        <Space>
          {settings.namespaceRequestTemplateId && (
            <NamespaceRequestButton clusterId={scope.clusterId} />
          )}
          {has('k8s.cluster.namespace_create') && (
            <NamespaceCreate onDone={() => setTick((n) => n + 1)} />
          )}
        </Space>
      }
    />
  );
};

const ClusterPage: React.FC = () => {
  const t = useT();
  const tabs = useMemo(
    () => [
      {
        key: 'cluster',
        label: t('pages.k8s.cluster.tab.cluster'),
        scope: 'none' as const,
        render: () => <ClusterList />,
      },
      {
        key: 'node',
        label: t('pages.k8s.cluster.tab.node'),
        scope: 'cluster' as const,
        render: () => (
          <ResourceView gvr={GVRS.node} namespaced={false} creatable={false} />
        ),
      },
      {
        key: 'namespace',
        label: t('pages.k8s.cluster.tab.namespace'),
        scope: 'cluster' as const,
        render: () => <Namespaces />,
      },
    ],
    [t],
  );
  return <K8sPage tabs={tabs} />;
};

export default ClusterPage;
