/**
 * 作业模板：把「项目中的一个 Playbook + 目标主机 + 凭据 + 执行参数 + 执行选项」固定下来，
 * 执行时只需确认主机、填写参数。停用的模板不可执行；删除模板不影响已有的执行记录。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Link, useAccess, useSearchParams } from '@umijs/max';
import { App, Badge, Switch, Tag, Tooltip, Typography } from 'antd';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { ENABLED_META } from '@/constants';
import {
  deleteJobTemplate,
  getJobTemplate,
  listJobTemplates,
  updateJobTemplate,
} from '@/services/job/template';
import type { JobTemplate } from '@/services/job/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { targetSummary } from '../components/format';
import { LIBRARY_TABS } from '../components/groups';
import { useProjectOptions } from '../components/hooks';
import { JOB_LIMITS } from '../components/meta';
import { RunModal } from '../components/RunModal';
import { CodeText, UpdatedCell } from '../components/tags';
import { TemplateDrawer } from './TemplateDrawer';

const TemplateList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const access = useAccess();
  const t = useT();
  const enabledEnum = useValueEnum(ENABLED_META);
  const projects = useProjectOptions();
  // 定时作业 / 触发器的模板链接带名称跳转过来
  const [searchParams] = useSearchParams();
  const projectEnum = useMemo(
    () =>
      Object.fromEntries(
        projects.map((project) => [project.id, { text: project.name }]),
      ),
    [projects],
  );

  // undefined = 抽屉关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<JobTemplate | null | undefined>(
    undefined,
  );
  const [runId, setRunId] = useState<string>();
  const [togglingId, setTogglingId] = useState<string>();

  const reload = () => actionRef.current?.reload();
  const hasAnyAction =
    has('job.template.run') ||
    has('job.template.edit') ||
    has('job.template.delete') ||
    Boolean(access.canJobExecution);

  /** 启停：没有独立接口。先取最新详情再整组回传，只改 enabled（不依赖列表里的内容是否完整） */
  const setEnabled = async (record: JobTemplate, enabled: boolean) => {
    setTogglingId(record.id);
    try {
      const { template } = await getJobTemplate(record.id);
      await updateJobTemplate(record.id, {
        spec: { ...template.spec, enabled },
        version: template.version,
      });
      message.success(t('common.msg.updated'));
    } catch {
      // 已由请求层提示（版本冲突等）
    } finally {
      setTogglingId(undefined);
      reload();
    }
  };

  const toggle = (record: JobTemplate, enabled: boolean) => {
    if (enabled) {
      void setEnabled(record, true);
      return;
    }
    modal.confirm({
      autoFocusButton: 'cancel',
      title: t('pages.job.template.disable.title', { name: record.spec.name }),
      content: t('pages.job.template.disable.description'),
      okButtonProps: { danger: true },
      onOk: () => setEnabled(record, false),
    });
  };

  const remove = async (record: JobTemplate) => {
    try {
      await deleteJobTemplate(record.id);
    } catch {
      // 已由请求层提示
      return;
    }
    message.success(t('common.msg.deleted'));
    reload();
  };

  const columns: ProColumns<JobTemplate>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.job.template.search.placeholder'),
        maxLength: JOB_LIMITS.keywordMax,
      },
    },
    {
      title: t('pages.job.common.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      render: (_, record) => (
        <div style={{ maxWidth: 280 }}>
          <div>
            {record.spec.name}
            {record.spec.exclusive && (
              <Tooltip title={t('pages.job.options.exclusive.extra')}>
                <Tag color="geekblue" style={{ marginInlineStart: 8 }}>
                  {t('pages.job.template.exclusive')}
                </Tag>
              </Tooltip>
            )}
            {record.spec.requireApproval && (
              <Tag color="orange" style={{ marginInlineStart: 8 }}>
                {t('pages.job.template.requireApproval')}
              </Tag>
            )}
            {(record.spec.sliceSize ?? 0) > 0 && (
              <Tooltip
                title={t('pages.job.template.slice.tooltip', {
                  size: record.spec.sliceSize ?? 0,
                })}
              >
                <Tag color="cyan" style={{ marginInlineStart: 8 }}>
                  {t('pages.job.template.slice')}
                </Tag>
              </Tooltip>
            )}
            {record.spec.options?.check && (
              <Tag color="purple" style={{ marginInlineStart: 8 }}>
                {t('pages.job.checkMode')}
              </Tag>
            )}
          </div>
          {record.spec.description && (
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12 }}
              ellipsis={{ tooltip: record.spec.description }}
            >
              {record.spec.description}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: t('pages.job.template.column.project'),
      dataIndex: 'projectId',
      valueType: 'select',
      valueEnum: projectEnum,
      fieldProps: { showSearch: true },
      width: 180,
      render: (_, record) =>
        record.projectName ? (
          <span>
            {record.projectName}
            {record.projectRef && (
              <Tag style={{ marginInlineStart: 8, marginInlineEnd: 0 }}>
                {record.projectRef}
              </Tag>
            )}
          </span>
        ) : (
          <Typography.Text type="danger">
            {t('pages.job.template.project.missing')}
          </Typography.Text>
        ),
    },
    {
      title: t('pages.job.template.column.playbook'),
      dataIndex: ['spec', 'playbook'],
      search: false,
      width: 200,
      render: (_, record) => <CodeText value={record.spec.playbook} />,
    },
    {
      title: t('pages.job.template.column.target'),
      dataIndex: ['spec', 'target'],
      search: false,
      width: 220,
      renderText: (_, record) =>
        targetSummary(record.spec.target, record.modelName, t),
    },
    {
      title: t('pages.job.template.column.credential'),
      dataIndex: 'credentialName',
      search: false,
      width: 140,
      render: (_, record) =>
        record.credentialName || (
          <Typography.Text type="danger">
            {t('pages.job.template.credential.missing')}
          </Typography.Text>
        ),
    },
    {
      title: t('common.column.enabled'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
      render: (_, record) =>
        has('job.template.edit') ? (
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
      title: t('pages.job.template.column.version'),
      dataIndex: 'version',
      search: false,
      width: 80,
      renderText: (value?: number) => `v${value ?? 1}`,
    },
    {
      title: t('pages.job.common.updated'),
      dataIndex: 'updateTime',
      search: false,
      width: 180,
      render: (_, record) => (
        <UpdatedCell
          userName={record.updateUserName}
          time={record.updateTime}
        />
      ),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 230,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('job.template.run')) {
          actions.push(
            record.spec.enabled ? (
              <a
                key="run"
                style={{ fontWeight: 600 }}
                onClick={() => setRunId(record.id)}
              >
                {t('pages.job.template.run')}
              </a>
            ) : (
              <Tooltip key="run" title={t('pages.job.error.templateDisabled')}>
                <Typography.Link disabled>
                  {t('pages.job.template.run')}
                </Typography.Link>
              </Tooltip>
            ),
          );
        }
        if (has('job.template.edit')) {
          actions.push(
            <a key="edit" onClick={() => setFormRow(record)}>
              {t('common.action.edit')}
            </a>,
          );
        }
        if (access.canJobExecution) {
          actions.push(
            <Link
              key="executions"
              to={`/job/execution?templateId=${record.id}`}
            >
              {t('pages.job.template.executions')}
            </Link>,
          );
        }
        if (has('job.template.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.job.template.delete.title', {
                name: record.spec.name,
              })}
              description={t('pages.job.template.delete.description')}
              onConfirm={() => remove(record)}
            />,
          );
        }
        return actions;
      },
    },
  ];

  return (
    <RouteTabsPage tabs={LIBRARY_TABS}>
      <ProTable<JobTemplate>
        cardBordered
        headerTitle={
          has('job.template.create') && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.job.template.create.title')}
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
          const result = await listJobTemplates({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            projectId: params.projectId || undefined,
            enabled: parseBoolParam(params.enabled),
          });
          return toTableResult(result);
        }}
      />
      {formRow !== undefined && (
        <TemplateDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={reload}
        />
      )}
      {runId && (
        <RunModal
          key={runId}
          templateId={runId}
          onClose={() => setRunId(undefined)}
        />
      )}
    </RouteTabsPage>
  );
};

export default TemplateList;
