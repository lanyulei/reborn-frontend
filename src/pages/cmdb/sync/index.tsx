/**
 * 资源同步：采集源（云账号 / 虚拟化平台）配置、手动触发、运行记录。
 * 采集与对账由独立的数据面进程（backend/cmdb）执行；本页只写配置与任务、读结果。
 * 凭据只写不读：新建必填，编辑留空 = 保留。
 */
import { DownOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {
  Alert,
  App,
  Badge,
  Drawer,
  Dropdown,
  type MenuProps,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { CreateButton } from '@/components/TableActions';
import { JsonView } from '@/pages/notify/components/JsonView';
import {
  type CmdbProvider,
  type CmdbRunStatus,
  createSource,
  deleteSource,
  listConflicts,
  listRuns,
  listSources,
  type SyncConflict,
  type SyncRun,
  type SyncSource,
  triggerSync,
  updateSource,
} from '@/services/cmdb/sync';
import { usePermissions } from '@/services/system/permissions';
import type { EnumMeta } from '@/utils/i18n';
import {
  useEnumText,
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { WebhookModal } from './WebhookModal';

const HALF = { span: 12 };

export const CMDB_PROVIDER_META: EnumMeta<CmdbProvider> = {
  aliyun: { textId: 'enum.cmdb.provider.aliyun', status: 'Processing' },
  tencent: { textId: 'enum.cmdb.provider.tencent', status: 'Processing' },
  aws: { textId: 'enum.cmdb.provider.aws', status: 'Warning' },
  vmware: { textId: 'enum.cmdb.provider.vmware', status: 'Default' },
};
const CMDB_PROVIDER_ORDER: readonly CmdbProvider[] = [
  'aliyun',
  'tencent',
  'aws',
  'vmware',
];

export const CMDB_RUN_STATUS_META: EnumMeta<CmdbRunStatus> = {
  never: { textId: 'enum.cmdb.runStatus.never', status: 'Default' },
  running: { textId: 'enum.cmdb.runStatus.running', status: 'Processing' },
  succeeded: { textId: 'enum.cmdb.runStatus.succeeded', status: 'Success' },
  failed: { textId: 'enum.cmdb.runStatus.failed', status: 'Error' },
};

/** 表单值：平铺的提供方配置 + 公共字段 */
interface SourceFormValues {
  name: string;
  provider: CmdbProvider;
  credential?: string;
  env?: string;
  intervalMinutes: number;
  graceHours: number;
  enabled: boolean;
  // aliyun / tencent / aws
  region_id?: string;
  region?: string;
  access_key_id?: string;
  secret_id?: string;
  endpoint?: string;
  field_map_text?: string;
  // vmware
  url?: string;
  username?: string;
  insecure?: boolean;
}

/** 提供方配置的 jsonb 结构（与 kit/cmdbcontract 一致） */
/** 字段映射文本（每行 a=b）→ 对象 */
const parseFieldMap = (text?: string): Record<string, string> | undefined => {
  const entries = (text ?? '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('=').map((s) => s.trim()))
    .filter((kv) => kv.length === 2 && kv[0] && kv[1]) as [string, string][];
  return entries.length ? Object.fromEntries(entries) : undefined;
};

const buildConfig = (values: SourceFormValues): Record<string, unknown> => {
  const fieldMap = parseFieldMap(values.field_map_text);
  const extra = {
    ...(values.endpoint ? { endpoint: values.endpoint } : {}),
    ...(fieldMap ? { field_map: fieldMap } : {}),
  };
  switch (values.provider) {
    case 'aliyun':
      return {
        region_id: values.region_id,
        access_key_id: values.access_key_id,
        ...extra,
      };
    case 'tencent':
      return { region: values.region, secret_id: values.secret_id, ...extra };
    case 'aws':
      return {
        region: values.region,
        access_key_id: values.access_key_id,
        ...extra,
      };
    default:
      return {
        url: values.url,
        username: values.username,
        ...(values.insecure ? { insecure: true } : {}),
        ...(fieldMap ? { field_map: fieldMap } : {}),
      };
  }
};

const toFormValues = (src: SyncSource): SourceFormValues => ({
  name: src.name,
  provider: src.provider,
  env: src.env,
  intervalMinutes: Math.round(src.intervalSeconds / 60),
  graceHours: Math.round(src.gracePeriodSeconds / 3600),
  enabled: src.enabled,
  region_id: src.config.region_id as string | undefined,
  region: src.config.region as string | undefined,
  access_key_id: src.config.access_key_id as string | undefined,
  secret_id: src.config.secret_id as string | undefined,
  endpoint: src.config.endpoint as string | undefined,
  field_map_text: Object.entries(
    (src.config.field_map as Record<string, string> | undefined) ?? {},
  )
    .map(([k, v]) => `${k}=${v}`)
    .join('\n'),
  url: src.config.url as string | undefined,
  username: src.config.username as string | undefined,
  insecure: src.config.insecure as boolean | undefined,
});

/** 提供方配置字段（新建/编辑共用）；editing 时凭据可选 */
const ProviderFields: React.FC<{
  provider: CmdbProvider;
  editing?: boolean;
}> = ({ provider, editing }) => {
  const t = useT();
  const rules = useFormRules();
  const credentialLabel = t(
    provider === 'aliyun' || provider === 'aws'
      ? 'pages.cmdb.sync.form.accessKeySecret'
      : provider === 'tencent'
        ? 'pages.cmdb.sync.form.secretKey'
        : 'pages.cmdb.sync.form.password',
  );
  return (
    <>
      {provider === 'tencent' || provider === 'aws' ? (
        <>
          <ProFormText
            name="region"
            label={t('pages.cmdb.sync.form.regionId')}
            colProps={HALF}
            placeholder={provider === 'aws' ? 'us-east-1' : 'ap-guangzhou'}
            rules={[
              rules.required(t('pages.cmdb.sync.form.regionId')),
              rules.max(64),
            ]}
          />
          <ProFormText
            name="endpoint"
            label={t('pages.cmdb.sync.form.endpoint')}
            colProps={HALF}
            tooltip={t('pages.cmdb.sync.form.endpoint.tooltip')}
            rules={[rules.max(512)]}
          />
          <ProFormText
            name={provider === 'aws' ? 'access_key_id' : 'secret_id'}
            label={provider === 'aws' ? 'Access Key ID' : 'SecretId'}
            colProps={HALF}
            rules={[
              rules.required(provider === 'aws' ? 'Access Key ID' : 'SecretId'),
              rules.max(128),
            ]}
          />
        </>
      ) : provider === 'aliyun' ? (
        <>
          <ProFormText
            name="region_id"
            label={t('pages.cmdb.sync.form.regionId')}
            colProps={HALF}
            placeholder="cn-hangzhou"
            rules={[
              rules.required(t('pages.cmdb.sync.form.regionId')),
              rules.max(64),
            ]}
          />
          <ProFormText
            name="endpoint"
            label={t('pages.cmdb.sync.form.endpoint')}
            colProps={HALF}
            placeholder="https://ecs.aliyuncs.com"
            tooltip={t('pages.cmdb.sync.form.endpoint.tooltip')}
            rules={[rules.max(512)]}
          />
          <ProFormText
            name="access_key_id"
            label="AccessKey ID"
            colProps={HALF}
            rules={[rules.required('AccessKey ID'), rules.max(128)]}
          />
        </>
      ) : (
        <>
          <ProFormText
            name="url"
            label={t('pages.cmdb.sync.form.vcenterUrl')}
            colProps={HALF}
            placeholder="https://vcenter.example.com/sdk"
            rules={[
              rules.required(t('pages.cmdb.sync.form.vcenterUrl')),
              rules.max(512),
            ]}
          />
          <ProFormText
            name="username"
            label={t('pages.cmdb.sync.form.username')}
            colProps={HALF}
            placeholder="administrator@vsphere.local"
            rules={[
              rules.required(t('pages.cmdb.sync.form.username')),
              rules.max(128),
            ]}
          />
          <ProFormSwitch
            name="insecure"
            label={t('pages.cmdb.sync.form.insecure')}
            tooltip={t('pages.cmdb.sync.form.insecure.tooltip')}
            colProps={HALF}
          />
        </>
      )}
      <ProFormText.Password
        name="credential"
        label={credentialLabel}
        colProps={HALF}
        placeholder={
          editing ? t('pages.cmdb.sync.form.credential.editPlaceholder') : ''
        }
        rules={[
          {
            required: !editing,
            message: t('common.validation.required', {
              label: credentialLabel,
            }),
          },
          rules.lengthRange(1, 512),
        ]}
      />
      <ProFormTextArea
        name="field_map_text"
        label={t('pages.cmdb.sync.form.fieldMap')}
        tooltip={t('pages.cmdb.sync.form.fieldMap.tooltip')}
        placeholder={'cpu_cores=cpu\nprimary_ip=ip'}
        fieldProps={{ rows: 2 }}
      />
    </>
  );
};

/** 公共字段：环境 / 周期 / 宽限期 / 启用 */
const CommonFields: React.FC = () => {
  const t = useT();
  const rules = useFormRules();
  return (
    <>
      <ProFormText
        name="env"
        label={t('pages.cmdb.sync.form.env')}
        colProps={HALF}
        placeholder={t('common.optional')}
        tooltip={t('pages.cmdb.sync.form.env.tooltip')}
        rules={[rules.max(32)]}
      />
      <ProFormDigit
        name="intervalMinutes"
        label={t('pages.cmdb.sync.form.interval')}
        colProps={HALF}
        min={5}
        max={10080}
        fieldProps={{ precision: 0 }}
        rules={[rules.required(t('pages.cmdb.sync.form.interval'))]}
      />
      <ProFormDigit
        name="graceHours"
        label={t('pages.cmdb.sync.form.grace')}
        colProps={HALF}
        min={0}
        max={720}
        fieldProps={{ precision: 0 }}
        tooltip={t('pages.cmdb.sync.form.grace.tooltip')}
        rules={[rules.required(t('pages.cmdb.sync.form.grace'))]}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        colProps={HALF}
      />
    </>
  );
};

/** 运行记录抽屉 */
const RunsDrawer: React.FC<{
  source: SyncSource | null;
  onClose: () => void;
}> = ({ source, onClose }) => {
  const t = useT();
  const statusEnum = useValueEnum(CMDB_RUN_STATUS_META);
  const columns: ProColumns<SyncRun>[] = [
    {
      title: t('pages.cmdb.sync.run.column.startTime'),
      dataIndex: 'startTime',
      valueType: 'dateTime',
      width: 160,
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      width: 90,
    },
    {
      title: t('pages.cmdb.sync.run.column.counts'),
      render: (_, r) => (
        <Space size={4} wrap>
          <Tag>{t('pages.cmdb.sync.run.discovered', { n: r.discovered })}</Tag>
          <Tag color="green">
            {t('pages.cmdb.sync.run.created', { n: r.created })}
          </Tag>
          <Tag color="blue">
            {t('pages.cmdb.sync.run.updated', { n: r.updated })}
          </Tag>
          <Tag color="orange">
            {t('pages.cmdb.sync.run.disappeared', { n: r.disappeared })}
          </Tag>
          <Tag color="red">
            {t('pages.cmdb.sync.run.retired', { n: r.retired })}
          </Tag>
          {r.failed > 0 && (
            <Tag color="volcano">
              {t('pages.cmdb.sync.run.failed', { n: r.failed })}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('pages.cmdb.sync.run.column.error'),
      dataIndex: 'error',
      ellipsis: true,
      render: (_, r) =>
        r.error ? (
          <Typography.Text type="danger" ellipsis={{ tooltip: r.error }}>
            {r.error}
          </Typography.Text>
        ) : (
          t('common.empty')
        ),
    },
  ];
  return (
    <Drawer
      title={
        source ? t('pages.cmdb.sync.run.title', { name: source.name }) : ''
      }
      size={960}
      open={!!source}
      onClose={onClose}
      destroyOnHidden
    >
      {source && (
        <ProTable<SyncRun>
          rowKey="id"
          search={false}
          options={{ reload: true, density: false, setting: false }}
          size="small"
          columns={columns}
          expandable={{
            rowExpandable: (r) => (r.errors?.length ?? 0) > 0,
            expandedRowRender: (r) => (
              <JsonView value={r.errors} maxHeight={240} />
            ),
          }}
          request={async (params) => {
            const result = await listRuns(source.id, {
              page: params.current,
              pageSize: params.pageSize,
            });
            return toTableResult(result);
          }}
        />
      )}
    </Drawer>
  );
};

/** 同步冲突抽屉：该采集源当前仍未能写入的采集行与原因 */
const ConflictsDrawer: React.FC<{
  source: SyncSource | null;
  onClose: () => void;
}> = ({ source, onClose }) => {
  const t = useT();
  const columns: ProColumns<SyncConflict>[] = [
    {
      title: t('pages.cmdb.ci.column.model'),
      dataIndex: 'modelName',
      width: 120,
      render: (_, r) => r.modelName || r.modelCode,
    },
    {
      title: t('pages.cmdb.ci.column.name'),
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
    },
    {
      title: t('pages.cmdb.sync.conflict.column.externalId'),
      dataIndex: 'externalId',
      width: 180,
      ellipsis: true,
      copyable: true,
    },
    {
      title: t('pages.cmdb.sync.conflict.column.reason'),
      dataIndex: 'reason',
      ellipsis: true,
    },
    {
      title: t('pages.cmdb.sync.conflict.column.firstSeen'),
      dataIndex: 'firstSeen',
      valueType: 'dateTime',
      width: 160,
    },
  ];
  return (
    <Drawer
      title={
        source ? t('pages.cmdb.sync.conflict.title', { name: source.name }) : ''
      }
      size={960}
      open={!!source}
      onClose={onClose}
      destroyOnHidden
    >
      {source && (
        <>
          <Typography.Paragraph type="secondary">
            {t('pages.cmdb.sync.conflict.tip')}
          </Typography.Paragraph>
          <ProTable<SyncConflict>
            rowKey={(r) => `${r.modelCode}/${r.externalId}`}
            search={false}
            options={{ reload: true, density: false, setting: false }}
            size="small"
            columns={columns}
            request={async (params) => {
              const result = await listConflicts(source.id, {
                page: params.current,
                pageSize: params.pageSize,
              });
              return {
                data: result.items ?? [],
                total: Number(result.total ?? 0),
                success: true,
              };
            }}
          />
        </>
      )}
    </Drawer>
  );
};

const SyncSourcePage: React.FC = () => {
  const t = useT();
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const actionRef = useRef<ActionType>(null);
  const providerEnum = useValueEnum(CMDB_PROVIDER_META);
  const providerOptions = useOptions(CMDB_PROVIDER_META, CMDB_PROVIDER_ORDER);
  const statusText = useEnumText(CMDB_RUN_STATUS_META);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<SyncSource | null>(null);
  const [runsRow, setRunsRow] = useState<SyncSource | null>(null);
  const [conflictsRow, setConflictsRow] = useState<SyncSource | null>(null);
  const [webhookRow, setWebhookRow] = useState<SyncSource | null>(null);
  const reload = () => actionRef.current?.reload();
  const hasAnyAction =
    has('cmdb.sync.edit') ||
    has('cmdb.sync.delete') ||
    has('cmdb.sync.trigger') ||
    has('cmdb.sync.webhook');

  const columns: ProColumns<SyncSource>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.cmdb.sync.search.placeholder') },
    },
    {
      title: t('pages.cmdb.sync.column.name'),
      dataIndex: 'name',
      search: false,
      ellipsis: true,
      render: (_, r) => (
        <>
          {r.name}
          {!r.enabled && (
            <Tag style={{ marginInlineStart: 8 }}>
              {t('pages.cmdb.sync.disabled')}
            </Tag>
          )}
        </>
      ),
    },
    {
      title: t('pages.cmdb.sync.column.provider'),
      dataIndex: 'provider',
      valueEnum: providerEnum,
      width: 110,
    },
    {
      title: t('pages.cmdb.sync.column.target'),
      search: false,
      ellipsis: true,
      render: (_, r) => {
        const c = r.config as Record<string, string | undefined>;
        // vmware 用地址；云厂商用「地域 · 账号标识」（各家字段名不同）
        if (c.url) return c.url;
        const region = c.region_id ?? c.region;
        const account = c.access_key_id ?? c.secret_id;
        return (
          [region, account].filter(Boolean).join(' · ') || t('common.empty')
        );
      },
    },
    {
      title: t('pages.cmdb.sync.form.env'),
      dataIndex: 'env',
      search: false,
      width: 90,
      render: (_, r) => r.env || t('common.empty'),
    },
    {
      title: t('pages.cmdb.sync.column.schedule'),
      search: false,
      width: 150,
      render: (_, r) =>
        t('pages.cmdb.sync.schedule', {
          interval: Math.round(r.intervalSeconds / 60),
          grace: Math.round(r.gracePeriodSeconds / 3600),
        }),
    },
    {
      title: t('pages.cmdb.sync.column.lastStatus'),
      search: false,
      width: 120,
      render: (_, r) => (
        <Space size={4}>
          <Badge
            status={
              CMDB_RUN_STATUS_META[r.lastStatus]?.status?.toLowerCase() as never
            }
            text={statusText(r.lastStatus)}
          />
          {r.activeTask && (
            <Tooltip title={t('pages.cmdb.sync.activeTask')}>
              <Badge status="processing" />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: t('pages.cmdb.sync.column.lastRunTime'),
      dataIndex: 'lastRunTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: t('pages.cmdb.sync.column.nextRunTime'),
      dataIndex: 'nextRunTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 170,
      hideInTable: !hasAnyAction,
      render: (_, r) => {
        // 高频的「立即同步」外露，其余收进「更多」（同用户管理页）
        const items: MenuProps['items'] = [
          { key: 'runs', label: t('pages.cmdb.sync.action.runs') },
          { key: 'conflicts', label: t('pages.cmdb.sync.action.conflicts') },
        ];
        if (has('cmdb.sync.webhook')) {
          items.push({
            key: 'webhook',
            label: `${t('pages.cmdb.sync.action.webhook')}${r.webhookEnabled ? ' ✓' : ''}`,
          });
        }
        if (has('cmdb.sync.edit')) {
          items.push({ key: 'edit', label: t('common.action.edit') });
        }
        if (has('cmdb.sync.delete')) {
          items.push({ type: 'divider' });
          items.push({
            key: 'delete',
            label: t('common.action.delete'),
            danger: true,
          });
        }
        const actions: React.ReactNode[] = [];
        if (has('cmdb.sync.trigger')) {
          actions.push(
            <a
              key="trigger"
              onClick={async () => {
                try {
                  await triggerSync(r.id);
                  message.success(t('pages.cmdb.sync.triggered'));
                } catch {
                  // authRequest 已按后端 message 提示（如任务已在排队）
                }
                reload();
              }}
            >
              <PlayCircleOutlined /> {t('pages.cmdb.sync.action.trigger')}
            </a>,
          );
        }
        actions.push(
          <Dropdown
            key="more"
            menu={{
              items,
              onClick: ({ key }) => {
                if (key === 'runs') {
                  setRunsRow(r);
                } else if (key === 'conflicts') {
                  setConflictsRow(r);
                } else if (key === 'webhook') {
                  setWebhookRow(r);
                } else if (key === 'edit') {
                  setEditRow(r);
                } else if (key === 'delete') {
                  modal.confirm({
                    title: t('pages.cmdb.sync.delete.title'),
                    content: t('pages.cmdb.sync.delete.description'),
                    okButtonProps: { danger: true },
                    onOk: async () => {
                      await deleteSource(r.id);
                      message.success(t('common.msg.deleted'));
                      reload();
                    },
                  });
                }
              },
            }}
          >
            <a>
              {t('common.action.more')} <DownOutlined />
            </a>
          </Dropdown>,
        );
        return actions;
      },
    },
  ];

  return (
    <PageContainer title={false}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title={t('pages.cmdb.sync.intro')}
      />
      <ProTable<SyncSource>
        cardBordered
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        headerTitle={
          has('cmdb.sync.create') && (
            <CreateButton onClick={() => setCreateOpen(true)}>
              {t('pages.cmdb.sync.create.title')}
            </CreateButton>
          )
        }
        request={async (params) => {
          const result = await listSources({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            provider: params.provider as CmdbProvider | undefined,
          });
          return toTableResult(result);
        }}
      />
      <ModalForm<SourceFormValues>
        key="create-source"
        title={t('pages.cmdb.sync.create.title')}
        width={720}
        grid
        rowProps={{ gutter: 16 }}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{
          provider: 'aliyun',
          intervalMinutes: 60,
          graceHours: 24,
          enabled: true,
        }}
        submitter={submitter.create}
        onFinish={async (values) => {
          await createSource({
            name: values.name,
            provider: values.provider,
            config: buildConfig(values),
            credential: values.credential ?? '',
            env: values.env || undefined,
            intervalSeconds: values.intervalMinutes * 60,
            gracePeriodSeconds: values.graceHours * 3600,
            enabled: values.enabled,
          });
          message.success(t('common.msg.created'));
          reload();
          return true;
        }}
      >
        <ProFormText
          name="name"
          label={t('pages.cmdb.sync.column.name')}
          colProps={HALF}
          rules={[
            rules.required(t('pages.cmdb.sync.column.name')),
            rules.max(64),
          ]}
        />
        <ProFormSelect
          name="provider"
          label={t('pages.cmdb.sync.column.provider')}
          colProps={HALF}
          options={providerOptions}
          allowClear={false}
        />
        <ProFormDependency name={['provider']}>
          {({ provider }) => (
            <ProviderFields provider={(provider as CmdbProvider) ?? 'aliyun'} />
          )}
        </ProFormDependency>
        <CommonFields />
      </ModalForm>
      {editRow && (
        <ModalForm<SourceFormValues>
          key={`edit-source-${editRow.id}`}
          title={t('pages.cmdb.sync.edit.title', { name: editRow.name })}
          width={720}
          grid
          rowProps={{ gutter: 16 }}
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={toFormValues(editRow)}
          submitter={submitter.save}
          onFinish={async (values) => {
            await updateSource(editRow.id, {
              version: editRow.version,
              name: values.name,
              config: buildConfig({ ...values, provider: editRow.provider }),
              credential: values.credential || undefined,
              env: values.env ?? '',
              intervalSeconds: values.intervalMinutes * 60,
              gracePeriodSeconds: values.graceHours * 3600,
              enabled: values.enabled,
            });
            message.success(t('common.msg.saved'));
            reload();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.cmdb.sync.column.name')}
            colProps={HALF}
            rules={[
              rules.required(t('pages.cmdb.sync.column.name')),
              rules.max(64),
            ]}
          />
          <ProFormSelect
            name="provider"
            label={t('pages.cmdb.sync.column.provider')}
            colProps={HALF}
            options={providerOptions}
            disabled
          />
          <ProviderFields provider={editRow.provider} editing />
          <CommonFields />
        </ModalForm>
      )}
      <RunsDrawer source={runsRow} onClose={() => setRunsRow(null)} />
      <ConflictsDrawer
        source={conflictsRow}
        onClose={() => setConflictsRow(null)}
      />
      <WebhookModal
        source={webhookRow}
        onClose={() => setWebhookRow(null)}
        onChanged={reload}
      />
    </PageContainer>
  );
};

export default SyncSourcePage;
