/**
 * 项目：存放 Playbook 的 Git 仓库。执行节点每次执行时按分支 / 标签拉取。仓库凭据只写不读——
 * 编辑时留空即保留原值，更换认证方式时必须重新填写。仍被作业模板使用的项目不可删除。
 */
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDependency,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, App, Col, Tag, Tooltip, Typography } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { FULL, HALF } from '@/constants/layout';
import {
  createJobProject,
  deleteJobProject,
  getJobProject,
  listJobProjects,
  updateJobProject,
} from '@/services/job/project';
import type {
  JobProject,
  JobProjectAuthType,
  JobProjectSpec,
} from '@/services/job/typings';
import { usePermissions } from '@/services/system/permissions';
import {
  useEnumText,
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
} from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { RESOURCE_TABS } from '../components/groups';
import {
  HTTP_REPO_REGEX,
  JOB_LIMITS,
  PROJECT_AUTH_META,
  PROJECT_AUTH_ORDER,
  SSH_REPO_REGEX,
} from '../components/meta';
import { useJobStyles } from '../components/styles';
import { UpdatedCell } from '../components/tags';

interface ProjectFormValues {
  name: string;
  repoUrl: string;
  ref: string;
  authType: JobProjectAuthType;
  username?: string;
  secret?: string;
  description?: string;
}

/** 表单值 → 项目内容；凭据留空即不携带（编辑时保留原值） */
const buildSpec = (values: ProjectFormValues): JobProjectSpec => {
  const spec: JobProjectSpec = {
    name: values.name.trim(),
    repoUrl: values.repoUrl.trim(),
    ref: values.ref.trim(),
    authType: values.authType,
    username: values.authType === 2 ? (values.username?.trim() ?? '') : '',
    description: values.description?.trim() ?? '',
  };
  if (values.authType !== 1 && values.secret) {
    // 私钥补齐结尾换行（缺结尾换行会解析失败）；令牌去掉首尾空白
    spec.secret =
      values.authType === 3
        ? values.secret.endsWith('\n')
          ? values.secret
          : `${values.secret}\n`
        : values.secret.trim();
  }
  return spec;
};

/** 认证方式与仓库地址不匹配时的提示文案键（后端也会校验，这里只做提前提示） */
const authMismatchId = (
  authType?: JobProjectAuthType,
  repoUrl?: string,
): string | undefined => {
  const url = repoUrl?.trim();
  if (!url) return undefined;
  if (authType === 2 && !HTTP_REPO_REGEX.test(url)) {
    return 'pages.job.project.form.auth.tokenNeedsHttp';
  }
  if (authType === 3 && !SSH_REPO_REGEX.test(url)) {
    return 'pages.job.project.form.auth.keyNeedsSsh';
  }
  return undefined;
};

/** 新建 / 编辑项目抽屉（row 为空即新建） */
const ProjectDrawer: React.FC<{
  row: JobProject | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ row, onClose, onSaved }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { styles } = useJobStyles();
  const authOptions = useOptions(PROJECT_AUTH_META, PROJECT_AUTH_ORDER);
  // 编辑时以详情接口返回的为准（乐观锁版本号、是否已保存凭据）
  const [saved, setSaved] = useState<JobProject | null>(row);

  const formRef = useRef<ProFormInstance<ProjectFormValues>>(undefined);
  return (
    <DrawerForm<ProjectFormValues>
      title={
        row
          ? t('pages.job.project.edit.title', { name: row.spec.name })
          : t('pages.job.project.create.title')
      }
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true }}
      onValuesChange={(changed: Partial<ProjectFormValues>, _all) => {
        // 换认证方式：清掉已输入的凭据——令牌不该被带进明文的私钥输入框
        if ('authType' in changed)
          formRef.current?.setFieldValue('secret', undefined);
      }}
      formRef={formRef}
      request={async () => {
        const initial: ProjectFormValues = {
          name: '',
          repoUrl: '',
          ref: 'main',
          authType: 1,
        };
        if (!row) return initial;
        let project: JobProject;
        try {
          ({ project } = await getJobProject(row.id));
        } catch {
          // 错误提示已由请求层给出：关闭抽屉，避免留下一张空白但可保存的表单
          onClose();
          return initial;
        }
        setSaved(project);
        const { spec } = project;
        // 凭据恒不回填
        return {
          name: spec.name,
          repoUrl: spec.repoUrl,
          ref: spec.ref,
          authType: spec.authType,
          username: spec.username,
          description: spec.description,
        };
      }}
      submitter={row ? submitter.save : submitter.create}
      onFinish={async (values) => {
        const spec = buildSpec(values);
        if (row) {
          await updateJobProject(row.id, {
            spec,
            version: saved?.version ?? row.version,
          });
          message.success(t('common.msg.saved'));
        } else {
          await createJobProject(spec);
          message.success(t('common.msg.created'));
        }
        onSaved();
        return true;
      }}
    >
      <ProFormText
        name="name"
        label={t('pages.job.common.name')}
        colProps={HALF}
        rules={[
          rules.required(t('pages.job.common.name')),
          rules.max(JOB_LIMITS.nameMax),
        ]}
      />
      <ProFormText
        name="ref"
        label={t('pages.job.project.column.ref')}
        colProps={HALF}
        placeholder="main"
        extra={t('pages.job.project.form.ref.extra')}
        fieldProps={{ className: styles.codeInput }}
        rules={[
          rules.required(t('pages.job.project.column.ref')),
          rules.max(JOB_LIMITS.refMax),
        ]}
      />
      <ProFormText
        name="repoUrl"
        label={t('pages.job.project.column.repoUrl')}
        colProps={FULL}
        placeholder="https://git.example.com/ops/playbooks.git"
        extra={t('pages.job.project.form.repoUrl.extra')}
        fieldProps={{ className: styles.codeInput }}
        rules={[
          rules.required(t('pages.job.project.column.repoUrl')),
          rules.max(JOB_LIMITS.repoUrlMax),
          {
            validator: (_: unknown, value?: string) =>
              !value?.trim() ||
              HTTP_REPO_REGEX.test(value.trim()) ||
              SSH_REPO_REGEX.test(value.trim())
                ? Promise.resolve()
                : Promise.reject(
                    new Error(t('pages.job.project.form.repoUrl.rule')),
                  ),
          },
        ]}
      />
      <ProFormRadio.Group
        name="authType"
        label={t('pages.job.project.column.authType')}
        colProps={FULL}
        options={authOptions}
        rules={[rules.select(t('pages.job.project.column.authType'))]}
      />
      <ProFormDependency name={['authType', 'repoUrl']}>
        {({ authType, repoUrl }) => {
          const mismatchId = authMismatchId(authType, repoUrl);
          // 认证方式未变且已保存过凭据时可留空保留原值
          const kept =
            Boolean(row) &&
            saved?.hasSecret === true &&
            saved.spec.authType === authType;
          const secretLabel = t(
            authType === 3
              ? 'pages.job.project.form.privateKey'
              : 'pages.job.project.form.token',
          );
          const secretRules = [
            rules.max(JOB_LIMITS.secretMax),
            {
              required: !kept,
              message: t(
                row && !kept
                  ? 'pages.job.project.form.secret.requiredOnAuthChange'
                  : 'common.validation.required',
                { label: secretLabel },
              ),
            },
          ];
          const placeholder = kept
            ? t('pages.job.project.form.secret.kept')
            : undefined;
          return (
            <>
              {mismatchId && (
                <Col span={24}>
                  <Alert
                    type="warning"
                    showIcon
                    title={t(mismatchId)}
                    style={{ marginBottom: 16 }}
                  />
                </Col>
              )}
              {authType === 2 && (
                <>
                  <ProFormText
                    name="username"
                    label={t('pages.job.project.form.username')}
                    colProps={HALF}
                    extra={t('pages.job.project.form.username.extra')}
                    fieldProps={{ autoComplete: 'off' }}
                    rules={[
                      rules.required(t('pages.job.project.form.username')),
                      rules.max(JOB_LIMITS.projectUsernameMax),
                    ]}
                  />
                  <ProFormText.Password
                    name="secret"
                    label={secretLabel}
                    colProps={HALF}
                    placeholder={placeholder}
                    fieldProps={{ autoComplete: 'new-password' }}
                    rules={secretRules}
                  />
                </>
              )}
              {authType === 3 && (
                <ProFormTextArea
                  name="secret"
                  label={secretLabel}
                  colProps={FULL}
                  placeholder={
                    placeholder ?? '-----BEGIN OPENSSH PRIVATE KEY-----'
                  }
                  extra={t('pages.job.project.form.privateKey.extra')}
                  fieldProps={{
                    rows: 8,
                    className: styles.codeInput,
                    autoComplete: 'off',
                    spellCheck: false,
                  }}
                  rules={secretRules}
                />
              )}
            </>
          );
        }}
      </ProFormDependency>
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
    </DrawerForm>
  );
};

const ProjectList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const authText = useEnumText(PROJECT_AUTH_META);

  // undefined = 抽屉关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<JobProject | null | undefined>(
    undefined,
  );

  const reload = () => actionRef.current?.reload();
  const hasAnyAction = has('job.project.edit') || has('job.project.delete');

  const remove = async (record: JobProject) => {
    try {
      await deleteJobProject(record.id);
    } catch {
      // 已由请求层提示（仍被使用等）
      return;
    }
    message.success(t('common.msg.deleted'));
    reload();
  };

  const columns: ProColumns<JobProject>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.job.project.search.placeholder'),
        maxLength: JOB_LIMITS.keywordMax,
      },
    },
    {
      title: t('pages.job.common.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      width: 200,
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
      title: t('pages.job.project.column.repoUrl'),
      dataIndex: ['spec', 'repoUrl'],
      search: false,
      copyable: true,
      ellipsis: true,
      width: 360,
    },
    {
      title: t('pages.job.project.column.ref'),
      dataIndex: ['spec', 'ref'],
      search: false,
      width: 140,
      render: (_, record) => (
        <Tag style={{ marginInlineEnd: 0 }}>{record.spec.ref}</Tag>
      ),
    },
    {
      title: t('pages.job.project.column.authType'),
      dataIndex: ['spec', 'authType'],
      search: false,
      width: 140,
      render: (_, record) => authText(record.spec.authType ?? 1),
    },
    {
      title: t('pages.job.common.templateCount'),
      dataIndex: 'templateCount',
      search: false,
      width: 110,
      renderText: (value?: number) => value ?? 0,
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
      width: 120,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('job.project.edit')) {
          actions.push(
            <a key="edit" onClick={() => setFormRow(record)}>
              {t('common.action.edit')}
            </a>,
          );
        }
        if (has('job.project.delete')) {
          actions.push(
            (record.templateCount ?? 0) > 0 ? (
              <Tooltip
                key="delete"
                title={t('pages.job.project.delete.inUse', {
                  n: record.templateCount ?? 0,
                })}
              >
                <Typography.Link disabled>
                  {t('common.action.delete')}
                </Typography.Link>
              </Tooltip>
            ) : (
              <DeleteConfirmLink
                key="delete"
                title={t('pages.job.project.delete.title', {
                  name: record.spec.name,
                })}
                description={t('pages.job.project.delete.description')}
                onConfirm={() => remove(record)}
              />
            ),
          );
        }
        return actions;
      },
    },
  ];

  return (
    <RouteTabsPage tabs={RESOURCE_TABS}>
      <ProTable<JobProject>
        cardBordered
        headerTitle={
          has('job.project.create') && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.job.project.create.title')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          const result = await listJobProjects({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
          });
          return toTableResult(result);
        }}
      />
      {formRow !== undefined && (
        <ProjectDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={reload}
        />
      )}
    </RouteTabsPage>
  );
};

export default ProjectList;
