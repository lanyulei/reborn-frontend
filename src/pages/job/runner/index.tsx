/**
 * 执行节点：部署在各网络区域、实际运行 Ansible 的进程。节点用接入令牌主动连接执行引擎领取任务；
 * 令牌明文只在登记 / 重置时展示一次。列表每 10 秒自动刷新（页面可见时），展示在线状态与负载。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {
  Alert,
  App,
  AutoComplete,
  Badge,
  Col,
  Form,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import {
  ConfirmLink,
  CreateButton,
  DeleteConfirmLink,
} from '@/components/TableActions';
import { FULL, HALF } from '@/constants/layout';
import {
  createJobRunner,
  deleteJobRunner,
  listJobRunners,
  resetJobRunnerToken,
  updateJobRunner,
} from '@/services/job/runner';
import type { JobRunner, JobRunnerSpec } from '@/services/job/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';
import { formatAgo, formatTime } from '../components/format';
import { RESOURCE_TABS } from '../components/groups';
import {
  useNow,
  usePageVisible,
  usePolledRequest,
  useZoneOptions,
} from '../components/hooks';
import { JOB_LIMITS, ZONE_REGEX } from '../components/meta';
import { useJobStyles } from '../components/styles';
import { TokenModal } from '../components/TokenModal';
import { CodeText } from '../components/tags';

/** 自动刷新间隔 */
const REFRESH_MS = 10_000;
/** 节点读取接入令牌的环境变量名 */
const TOKEN_ENV = 'KRATOS_RUNNER_TOKEN';

interface RunnerFormValues {
  name: string;
  zone?: string;
  enabled?: boolean;
  description?: string;
}

interface TokenInfo {
  name: string;
  token: string;
  /** 重置（而非新登记）得到的令牌 */
  reset?: boolean;
}

/** 执行节点的一次性接入令牌弹窗：附带写入环境变量的片段 */
const RunnerTokenModal: React.FC<{ info: TokenInfo; onClose: () => void }> = ({
  info,
  onClose,
}) => {
  const t = useT();
  const { styles } = useJobStyles();
  const snippet = `export ${TOKEN_ENV}=${info.token}`;
  return (
    <TokenModal
      title={t(
        info.reset
          ? 'pages.job.runner.token.title.reset'
          : 'pages.job.runner.token.title.create',
        { name: info.name },
      )}
      token={info.token}
      label={t('pages.job.runner.token.label')}
      description={
        info.reset ? t('pages.job.runner.token.warning.reset') : undefined
      }
      onClose={onClose}
    >
      <div className={styles.secondary}>
        {t('pages.job.runner.token.snippet', { env: TOKEN_ENV })}
      </div>
      <Typography.Paragraph
        className={styles.codeBlock}
        copyable={{ text: snippet }}
        style={{ marginBottom: 0 }}
      >
        {snippet}
      </Typography.Paragraph>
    </TokenModal>
  );
};

/** 登记 / 编辑执行节点抽屉（row 为空即登记） */
const RunnerDrawer: React.FC<{
  row: JobRunner | null;
  onClose: () => void;
  onSaved: (token?: TokenInfo) => void;
}> = ({ row, onClose, onSaved }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const zoneOptions = useZoneOptions();

  return (
    <DrawerForm<RunnerFormValues>
      title={
        row
          ? t('pages.job.runner.edit.title', { name: row.spec.name })
          : t('pages.job.runner.create.title')
      }
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true }}
      initialValues={
        row
          ? {
              name: row.spec.name,
              zone: row.spec.zone,
              enabled: row.spec.enabled ?? false,
              description: row.spec.description,
            }
          : { name: '', enabled: true }
      }
      submitter={row ? submitter.save : submitter.create}
      onFinish={async (values) => {
        const spec: JobRunnerSpec = {
          name: values.name.trim(),
          zone: values.zone?.trim() ?? '',
          enabled: values.enabled ?? false,
          description: values.description?.trim() ?? '',
        };
        if (row) {
          await updateJobRunner(row.id, { spec, version: row.version });
          message.success(t('common.msg.saved'));
          onSaved();
        } else {
          const { token } = await createJobRunner(spec);
          onSaved({ name: spec.name, token });
        }
        return true;
      }}
    >
      {!row && (
        <Col span={24}>
          <Alert
            type="info"
            showIcon
            title={t('pages.job.runner.create.hint')}
            style={{ marginBottom: 16 }}
          />
        </Col>
      )}
      <ProFormText
        name="name"
        label={t('pages.job.common.name')}
        colProps={HALF}
        rules={[
          rules.required(t('pages.job.common.name')),
          rules.max(JOB_LIMITS.nameMax),
        ]}
      />
      <Col span={12}>
        <Form.Item
          name="zone"
          label={t('pages.job.runner.column.zone')}
          tooltip={t('pages.job.runner.form.zone.tooltip')}
          rules={[
            {
              pattern: ZONE_REGEX,
              message: t('pages.job.zone.rule'),
            },
          ]}
        >
          <AutoComplete
            allowClear
            options={zoneOptions}
            placeholder={t('pages.job.runner.form.zone.placeholder')}
            showSearch={{
              filterOption: (input, option) =>
                String(option?.value ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase()),
            }}
          />
        </Form.Item>
      </Col>
      <ProFormTextArea
        name="description"
        label={t('pages.job.common.description')}
        colProps={FULL}
        fieldProps={{
          rows: 2,
          maxLength: JOB_LIMITS.descMax,
          showCount: true,
        }}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        tooltip={t('pages.job.runner.form.enabled.tooltip')}
        colProps={FULL}
      />
    </DrawerForm>
  );
};

const RunnerList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const visible = usePageVisible();
  const now = useNow(visible, 5000);
  const polled = usePolledRequest();

  // undefined = 抽屉关闭；null = 登记；对象 = 编辑
  const [formRow, setFormRow] = useState<JobRunner | null | undefined>(
    undefined,
  );
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>();
  const [togglingId, setTogglingId] = useState<string>();

  const reload = () => actionRef.current?.reload();
  const hasAnyAction =
    has('job.runner.edit') ||
    has('job.runner.token') ||
    has('job.runner.delete');

  /** 启停：没有独立接口，整组回传 spec 只改 enabled */
  const setEnabled = async (record: JobRunner, enabled: boolean) => {
    setTogglingId(record.id);
    try {
      await updateJobRunner(record.id, {
        spec: { ...record.spec, enabled },
        version: record.version,
      });
      message.success(t('common.msg.updated'));
    } catch {
      // 已由请求层提示（版本冲突等）
    } finally {
      setTogglingId(undefined);
      reload();
    }
  };

  const toggle = (record: JobRunner, enabled: boolean) => {
    if (enabled) {
      void setEnabled(record, true);
      return;
    }
    modal.confirm({
      autoFocusButton: 'cancel',
      title: t('pages.job.runner.disable.title', { name: record.spec.name }),
      content: t('pages.job.runner.disable.description'),
      okButtonProps: { danger: true },
      onOk: () => setEnabled(record, false),
    });
  };

  const resetToken = async (record: JobRunner) => {
    try {
      const { token } = await resetJobRunnerToken(record.id);
      setTokenInfo({ name: record.spec.name, token, reset: true });
    } catch {
      // 已由请求层提示
    }
  };

  const remove = async (record: JobRunner) => {
    try {
      await deleteJobRunner(record.id);
    } catch {
      // 已由请求层提示
      return;
    }
    message.success(t('common.msg.deleted'));
    reload();
  };

  const columns: ProColumns<JobRunner>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.job.runner.search.placeholder'),
        maxLength: JOB_LIMITS.keywordMax,
      },
    },
    {
      title: t('pages.job.common.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      render: (_, record) => (
        <div>
          <div>{record.spec.name}</div>
          {record.spec.description && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.spec.description}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: t('pages.job.runner.column.zone'),
      dataIndex: ['spec', 'zone'],
      search: false,
      width: 140,
      render: (_, record) =>
        record.spec.zone ? (
          <Tag style={{ marginInlineEnd: 0 }}>{record.spec.zone}</Tag>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.job.runner.column.online'),
      dataIndex: 'online',
      search: false,
      width: 110,
      render: (_, record) =>
        record.online ? (
          <Badge status="success" text={t('pages.job.runner.online')} />
        ) : record.lastSeen ? (
          <Badge status="error" text={t('pages.job.runner.offline')} />
        ) : (
          <Badge status="default" text={t('pages.job.runner.neverSeen')} />
        ),
    },
    {
      title: t('pages.job.runner.column.lastSeen'),
      dataIndex: 'lastSeen',
      search: false,
      width: 150,
      render: (_, record) =>
        record.lastSeen ? (
          <Tooltip title={formatTime(record.lastSeen)}>
            <span>{formatAgo(record.lastSeen, now, t)}</span>
          </Tooltip>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.job.runner.column.hostname'),
      dataIndex: 'hostname',
      search: false,
      width: 180,
      render: (_, record) => <CodeText value={record.hostname} />,
    },
    {
      title: t('pages.job.runner.column.agentVersion'),
      dataIndex: 'agentVersion',
      search: false,
      width: 120,
      render: (_, record) => <CodeText value={record.agentVersion} />,
    },
    {
      title: t('pages.job.runner.column.load'),
      dataIndex: 'running',
      search: false,
      width: 110,
      tooltip: t('pages.job.runner.column.load.tooltip'),
      // 从未接入的节点没有容量信息
      renderText: (_, record) =>
        record.lastSeen
          ? `${record.running ?? 0} / ${record.capacity ?? 0}`
          : t('common.empty'),
    },
    {
      title: t('common.column.enabled'),
      dataIndex: ['spec', 'enabled'],
      search: false,
      width: 90,
      render: (_, record) =>
        has('job.runner.edit') ? (
          <Switch
            size="small"
            checked={record.spec.enabled === true}
            loading={togglingId === record.id}
            onChange={(checked) => toggle(record, checked)}
          />
        ) : (
          <Badge
            status={record.spec.enabled ? 'success' : 'default'}
            text={t(
              record.spec.enabled ? 'enum.enabled.true' : 'enum.enabled.false',
            )}
          />
        ),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 190,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('job.runner.edit')) {
          actions.push(
            <a key="edit" onClick={() => setFormRow(record)}>
              {t('common.action.edit')}
            </a>,
          );
        }
        if (has('job.runner.token')) {
          actions.push(
            <ConfirmLink
              key="token"
              danger
              title={t('pages.job.runner.resetToken.title', {
                name: record.spec.name,
              })}
              description={t('pages.job.runner.resetToken.description')}
              onConfirm={() => resetToken(record)}
            >
              {t('pages.job.runner.resetToken')}
            </ConfirmLink>,
          );
        }
        if (has('job.runner.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.job.runner.delete.title', {
                name: record.spec.name,
              })}
              description={t('pages.job.runner.delete.description')}
              onConfirm={() => remove(record)}
            />,
          );
        }
        return actions;
      },
    },
  ];

  return (
    <RouteTabsPage tabs={RESOURCE_TABS}>
      <ProTable<JobRunner>
        cardBordered
        headerTitle={
          has('job.runner.create') && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.job.runner.create.title')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        // 页面不可见时停止轮询；恢复可见时立即刷新一次
        polling={visible ? REFRESH_MS : undefined}
        request={(params) =>
          polled(() =>
            listJobRunners(
              {
                page: params.current,
                pageSize: params.pageSize,
                keyword: params.keyword || undefined,
              },
              { silent: true },
            ),
          )
        }
      />
      {formRow !== undefined && (
        <RunnerDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={(token) => {
            reload();
            if (token) setTokenInfo(token);
          }}
        />
      )}
      {tokenInfo && (
        <RunnerTokenModal
          info={tokenInfo}
          onClose={() => setTokenInfo(undefined)}
        />
      )}
    </RouteTabsPage>
  );
};

export default RunnerList;
