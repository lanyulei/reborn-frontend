/**
 * 触发器：由外部事件执行作业模板——开放接口（流程的服务节点、发布流水线等调用）与告警（告警自愈）。
 * 以负责人（创建人，编辑 / 启停后为操作人）的身份提交，与手动执行走同一套校验与审批。
 * 接口触发器的调用令牌只在创建 / 重置时展示一次。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Link, useAccess, useSearchParams } from '@umijs/max';
import { App, Badge, Switch, Tag, Typography } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import {
  ConfirmLink,
  CreateButton,
  DeleteConfirmLink,
} from '@/components/TableActions';
import {
  deleteJobTrigger,
  listJobTriggers,
  resetJobTriggerToken,
  updateJobTrigger,
} from '@/services/job/trigger';
import type { JobTrigger, JobTriggerType } from '@/services/job/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT, useValueEnum } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { formatDuration, formatTime } from '../components/format';
import { AUTOMATION_TABS } from '../components/groups';
import { JOB_LIMITS, TRIGGER_TYPE_META } from '../components/meta';
import { useJobStyles } from '../components/styles';
import { TemplateSelect } from '../components/TemplateSelect';
import { TokenModal } from '../components/TokenModal';
import { FiresDrawer } from './FiresDrawer';
import { TriggerDrawer } from './TriggerDrawer';

interface TokenInfo {
  trigger: JobTrigger;
  token: string;
  /** 重置（而非新建）得到的令牌 */
  reset?: boolean;
}

/** 接口触发器的一次性调用令牌弹窗：附带调用地址、curl 示例与流程里的接法 */
const TriggerTokenModal: React.FC<{
  info: TokenInfo;
  onClose: () => void;
}> = ({ info, onClose }) => {
  const t = useT();
  const { styles } = useJobStyles();
  const { trigger, token } = info;
  const url = `${window.location.origin}/api/v1/open/job/trigger/${trigger.id}`;
  const body = trigger.spec.passParams
    ? `{"requestId": "deploy-20250101-1", "params": {}}`
    : `{"requestId": "deploy-20250101-1"}`;
  const curl = [
    `curl -X POST '${url}' \\`,
    `  -H 'Authorization: Bearer ${token}' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d '${body}'`,
  ].join('\n');
  const signal = trigger.spec.signal;
  return (
    <TokenModal
      width={720}
      title={t(
        info.reset
          ? 'pages.job.trigger.token.title.reset'
          : 'pages.job.trigger.token.title.create',
        { name: trigger.spec.name },
      )}
      token={token}
      label={t('pages.job.trigger.token.label')}
      description={
        info.reset ? t('pages.job.trigger.token.warning.reset') : undefined
      }
      onClose={onClose}
    >
      <div className={styles.secondary}>{t('pages.job.trigger.usage.url')}</div>
      <Typography.Paragraph
        className={styles.codeBlock}
        copyable={{ text: url }}
      >
        {url}
      </Typography.Paragraph>
      <div className={styles.secondary}>
        {t('pages.job.trigger.usage.curl')}
      </div>
      <Typography.Paragraph
        className={styles.codeBlock}
        copyable={{ text: curl }}
      >
        {curl}
      </Typography.Paragraph>
      <div className={styles.secondary}>
        {t('pages.job.trigger.usage.workflow')}
      </div>
      <ol style={{ paddingInlineStart: 20, marginBottom: 0 }}>
        <li>{t('pages.job.trigger.usage.workflow.webhook')}</li>
        <li>
          {signal
            ? t('pages.job.trigger.usage.workflow.signal', { signal })
            : t('pages.job.trigger.usage.workflow.noSignal')}
        </li>
        {signal && <li>{t('pages.job.trigger.usage.workflow.vars')}</li>}
      </ol>
    </TokenModal>
  );
};

const TriggerList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const access = useAccess();
  const t = useT();
  const typeEnum = useValueEnum(TRIGGER_TYPE_META);
  // 执行详情的「触发来源」带名称跳转过来
  const [searchParams] = useSearchParams();

  // undefined = 抽屉关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<JobTrigger | null | undefined>(
    undefined,
  );
  const [firesRow, setFiresRow] = useState<JobTrigger>();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>();
  const [togglingId, setTogglingId] = useState<string>();

  const reload = () => actionRef.current?.reload();

  /** 启停：没有独立接口，整组回传 spec 只改 enabled（负责人随之变为当前操作人） */
  const setEnabled = async (record: JobTrigger, enabled: boolean) => {
    setTogglingId(record.id);
    try {
      await updateJobTrigger(record.id, {
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

  const toggle = (record: JobTrigger, enabled: boolean) =>
    // 启用后会以操作人的身份自动执行；停用则外部调用 / 告警不再触发——都先确认
    modal.confirm({
      autoFocusButton: 'cancel',
      title: t(
        enabled
          ? 'pages.job.trigger.enable.title'
          : 'pages.job.trigger.disable.title',
        { name: record.spec.name },
      ),
      content: t(
        enabled
          ? 'pages.job.trigger.enable.description'
          : 'pages.job.trigger.disable.description',
      ),
      okButtonProps: enabled ? undefined : { danger: true },
      onOk: () => setEnabled(record, enabled),
    });

  const resetToken = async (record: JobTrigger) => {
    try {
      const { token } = await resetJobTriggerToken(record.id);
      setTokenInfo({ trigger: record, token, reset: true });
    } catch {
      // 已由请求层提示
    }
  };

  const remove = async (record: JobTrigger) => {
    try {
      await deleteJobTrigger(record.id);
    } catch {
      // 已由请求层提示
      return;
    }
    message.success(t('common.msg.deleted'));
    reload();
  };

  const columns: ProColumns<JobTrigger>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.job.trigger.search.placeholder'),
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
      title: t('pages.job.trigger.column.type'),
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: typeEnum,
      width: 110,
      render: (_, record) => {
        const meta = TRIGGER_TYPE_META[record.spec.type];
        return meta ? (
          <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
            {t(meta.textId)}
          </Tag>
        ) : (
          t('common.empty')
        );
      },
    },
    {
      title: t('pages.job.execution.column.template'),
      dataIndex: 'templateId',
      formItemRender: (_, { value, onChange }) => (
        <TemplateSelect
          value={value as string | undefined}
          onChange={onChange}
        />
      ),
      render: (_, record) =>
        !record.templateName ? (
          <Typography.Text type="danger">
            {t('pages.job.schedule.template.missing')}
          </Typography.Text>
        ) : access.canJobTemplate ? (
          <Link
            to={`/job/template?keyword=${encodeURIComponent(record.templateName)}`}
          >
            {record.templateName}
          </Link>
        ) : (
          record.templateName
        ),
    },
    {
      title: t('common.column.enabled'),
      dataIndex: ['spec', 'enabled'],
      search: false,
      width: 90,
      render: (_, record) =>
        has('job.trigger.edit') ? (
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
      title: t('pages.job.trigger.column.cooldown'),
      dataIndex: ['spec', 'cooldownS'],
      search: false,
      width: 110,
      renderText: (_, record) =>
        record.spec.cooldownS
          ? formatDuration(record.spec.cooldownS, t)
          : t('pages.job.trigger.cooldown.none'),
    },
    {
      title: t('pages.job.common.owner'),
      dataIndex: 'ownerName',
      search: false,
      width: 120,
      tooltip: t('pages.job.common.owner.tooltip'),
      renderText: (value?: string) => value || t('common.empty'),
    },
    {
      title: t('pages.job.trigger.column.lastFire'),
      dataIndex: 'lastFireTime',
      search: false,
      width: 170,
      renderText: (value?: string) => formatTime(value) || t('common.empty'),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 260,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('job.trigger.edit')) {
          actions.push(
            <a key="edit" onClick={() => setFormRow(record)}>
              {t('common.action.edit')}
            </a>,
          );
        }
        actions.push(
          <a key="fires" onClick={() => setFiresRow(record)}>
            {t('pages.job.trigger.fires')}
          </a>,
        );
        if (record.spec.type === 1 && has('job.trigger.token')) {
          actions.push(
            <ConfirmLink
              key="token"
              danger
              title={t('pages.job.trigger.resetToken.title', {
                name: record.spec.name,
              })}
              description={t('pages.job.trigger.resetToken.description')}
              onConfirm={() => resetToken(record)}
            >
              {t('pages.job.runner.resetToken')}
            </ConfirmLink>,
          );
        }
        if (has('job.trigger.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.job.trigger.delete.title', {
                name: record.spec.name,
              })}
              description={t('pages.job.trigger.delete.description')}
              onConfirm={() => remove(record)}
            />,
          );
        }
        return actions;
      },
    },
  ];

  return (
    <RouteTabsPage tabs={AUTOMATION_TABS}>
      <ProTable<JobTrigger>
        cardBordered
        headerTitle={
          has('job.trigger.create') && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.job.trigger.create.title')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        form={{
          initialValues: { keyword: searchParams.get('keyword') ?? undefined },
        }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          const result = await listJobTriggers({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            type: params.type
              ? (Number(params.type) as JobTriggerType)
              : undefined,
            templateId: params.templateId || undefined,
          });
          return toTableResult(result);
        }}
      />
      {formRow !== undefined && (
        <TriggerDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={(created) => {
            reload();
            if (created) setTokenInfo(created);
          }}
        />
      )}
      {firesRow && (
        <FiresDrawer
          key={firesRow.id}
          trigger={firesRow}
          canViewWorkflow={Boolean(access.canWorkflow)}
          onClose={() => setFiresRow(undefined)}
        />
      )}
      {tokenInfo && (
        <TriggerTokenModal
          info={tokenInfo}
          onClose={() => setTokenInfo(undefined)}
        />
      )}
    </RouteTabsPage>
  );
};

export default TriggerList;
