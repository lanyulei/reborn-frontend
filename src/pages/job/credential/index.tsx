/**
 * 凭据：登录目标主机的 SSH 账号（私钥或密码）与提权方式。密文只写不读——列表与表单都不回显
 * 私钥、密码、提权密码；编辑时留空即保留原值。仍被作业模板使用的凭据不可删除。
 */
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormCheckbox,
  ProFormDependency,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, App, Col, Tag, Tooltip, Typography } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { SectionTitle } from '@/components/SectionTitle';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { FULL, HALF } from '@/constants/layout';
import {
  createJobCredential,
  deleteJobCredential,
  getJobCredential,
  listJobCredentials,
  updateJobCredential,
} from '@/services/job/credential';
import type {
  JobCredential,
  JobCredentialSpec,
  JobCredentialType,
} from '@/services/job/typings';
import { usePermissions } from '@/services/system/permissions';
import {
  useEnumText,
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { RESOURCE_TABS } from '../components/groups';
import {
  BECOME_METHOD_META,
  BECOME_METHOD_ORDER,
  type BecomeMethodKey,
  CREDENTIAL_TYPE_META,
  CREDENTIAL_TYPE_ORDER,
  fromBecomeKey,
  JOB_LIMITS,
  toBecomeKey,
  USERNAME_REGEX,
} from '../components/meta';
import { useJobStyles } from '../components/styles';
import { CodeText, UpdatedCell } from '../components/tags';

interface CredentialFormValues {
  name: string;
  type: JobCredentialType;
  username: string;
  secret?: string;
  becomeMethod: BecomeMethodKey;
  becomeUser?: string;
  becomeSecret?: string;
  /** 清除已保存的提权密码（仅编辑且已保存过时出现） */
  clearBecomeSecret?: boolean;
  description?: string;
}

/**
 * 表单值 → 凭据内容。密文的三种语义：不带字段 = 保留原值；空串 = 清除（仅提权密码）；有值 = 更换。
 * 私钥原样提交，仅补齐结尾换行（OpenSSH 私钥缺结尾换行会解析失败）。
 */
const buildSpec = (
  values: CredentialFormValues,
  saved: JobCredential | null,
): JobCredentialSpec => {
  const becomeMethod = fromBecomeKey(values.becomeMethod);
  const spec: JobCredentialSpec = {
    name: values.name.trim(),
    type: values.type,
    username: values.username.trim(),
    becomeMethod,
    becomeUser: becomeMethod ? (values.becomeUser?.trim() ?? '') : '',
    description: values.description?.trim() ?? '',
  };
  if (values.secret) {
    spec.secret =
      values.type === 1 && !values.secret.endsWith('\n')
        ? `${values.secret}\n`
        : values.secret;
  }
  if (!becomeMethod || values.clearBecomeSecret) {
    // 不提权时不再保留提权密码；勾选了清除同理
    if (saved?.hasBecomeSecret) spec.becomeSecret = '';
  } else if (values.becomeSecret) {
    spec.becomeSecret = values.becomeSecret;
  }
  return spec;
};

/** 新建 / 编辑凭据抽屉（row 为空即新建） */
const CredentialDrawer: React.FC<{
  row: JobCredential | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ row, onClose, onSaved }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { styles } = useJobStyles();
  const typeOptions = useOptions(CREDENTIAL_TYPE_META, CREDENTIAL_TYPE_ORDER);
  const becomeOptions = useOptions(BECOME_METHOD_META, BECOME_METHOD_ORDER);
  const formRef = useRef<ProFormInstance<CredentialFormValues> | undefined>(
    undefined,
  );
  // 编辑时以详情接口返回的为准（乐观锁版本号、是否已保存提权密码）
  const [saved, setSaved] = useState<JobCredential | null>(row);

  const usernameRule = {
    pattern: USERNAME_REGEX,
    message: t('pages.job.credential.username.rule'),
  };

  return (
    <DrawerForm<CredentialFormValues>
      title={
        row
          ? t('pages.job.credential.edit.title', { name: row.spec.name })
          : t('pages.job.credential.create.title')
      }
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      open
      formRef={formRef}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true }}
      onValuesChange={(changed: Partial<CredentialFormValues>) => {
        // 切换类型时丢弃已输入的另一种密文
        if ('type' in changed) {
          formRef.current?.setFieldValue('secret', undefined);
        }
      }}
      request={async () => {
        if (!row) {
          return { name: '', type: 1, username: '', becomeMethod: 'none' };
        }
        const { credential } = await getJobCredential(row.id);
        setSaved(credential);
        const { spec } = credential;
        // 密文恒不回填
        return {
          name: spec.name,
          type: spec.type,
          username: spec.username,
          becomeMethod: toBecomeKey(spec.becomeMethod),
          becomeUser: spec.becomeUser,
          description: spec.description,
        };
      }}
      submitter={row ? submitter.save : submitter.create}
      onFinish={async (values) => {
        const spec = buildSpec(values, row ? saved : null);
        if (row) {
          await updateJobCredential(row.id, {
            spec,
            version: saved?.version ?? row.version,
          });
          message.success(t('common.msg.saved'));
        } else {
          await createJobCredential(spec);
          message.success(t('common.msg.created'));
        }
        onSaved();
        return true;
      }}
    >
      <Col span={24}>
        <Alert
          type="info"
          showIcon
          title={t('pages.job.credential.writeOnly')}
          style={{ marginBottom: 16 }}
        />
      </Col>
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
        name="username"
        label={t('pages.job.credential.column.username')}
        colProps={HALF}
        placeholder="root"
        fieldProps={{ autoComplete: 'off' }}
        rules={[
          rules.required(t('pages.job.credential.column.username')),
          usernameRule,
        ]}
      />
      <ProFormRadio.Group
        name="type"
        label={t('pages.job.credential.column.type')}
        colProps={FULL}
        options={typeOptions}
        rules={[rules.select(t('pages.job.credential.column.type'))]}
      />
      <ProFormDependency name={['type']}>
        {({ type }) => {
          // 类型未变时可留空保留原值；换了类型必须重新填写
          const kept = Boolean(row) && saved?.spec.type === type;
          const label = t(
            type === 2
              ? 'pages.job.credential.form.password'
              : 'pages.job.credential.form.privateKey',
          );
          const secretRules = [
            rules.max(JOB_LIMITS.secretMax),
            {
              required: !kept,
              message: t(
                row && !kept
                  ? 'pages.job.credential.form.secret.requiredOnTypeChange'
                  : 'common.validation.required',
                { label },
              ),
            },
          ];
          const placeholder = kept
            ? t('pages.job.credential.form.secret.kept')
            : undefined;
          return type === 2 ? (
            <ProFormText.Password
              key="password"
              name="secret"
              label={label}
              colProps={FULL}
              placeholder={placeholder}
              fieldProps={{ autoComplete: 'new-password' }}
              rules={secretRules}
            />
          ) : (
            <ProFormTextArea
              key="privateKey"
              name="secret"
              label={label}
              colProps={FULL}
              placeholder={placeholder ?? '-----BEGIN OPENSSH PRIVATE KEY-----'}
              extra={t('pages.job.credential.form.privateKey.extra')}
              fieldProps={{
                rows: 8,
                className: styles.codeInput,
                autoComplete: 'off',
                spellCheck: false,
              }}
              rules={secretRules}
            />
          );
        }}
      </ProFormDependency>

      <Col span={24}>
        <SectionTitle>{t('pages.job.credential.section.become')}</SectionTitle>
      </Col>
      <ProFormSelect
        name="becomeMethod"
        label={t('pages.job.credential.column.become')}
        colProps={HALF}
        options={becomeOptions}
        allowClear={false}
        extra={t('pages.job.credential.form.become.extra')}
      />
      <ProFormDependency name={['becomeMethod', 'clearBecomeSecret']}>
        {({ becomeMethod, clearBecomeSecret }) => {
          if (becomeMethod !== 'sudo' && becomeMethod !== 'su') return null;
          const hasSaved = Boolean(row) && saved?.hasBecomeSecret === true;
          return (
            <>
              <ProFormText
                name="becomeUser"
                label={t('pages.job.credential.form.becomeUser')}
                colProps={HALF}
                placeholder="root"
                fieldProps={{ autoComplete: 'off' }}
                rules={[usernameRule]}
              />
              <ProFormText.Password
                name="becomeSecret"
                label={t('pages.job.credential.form.becomeSecret')}
                colProps={HALF}
                disabled={clearBecomeSecret === true}
                placeholder={t(
                  hasSaved
                    ? 'pages.job.credential.form.becomeSecret.kept'
                    : 'pages.job.credential.form.becomeSecret.placeholder',
                )}
                extra={
                  hasSaved
                    ? t('pages.job.credential.form.becomeSecret.saved')
                    : t('pages.job.credential.form.becomeSecret.none')
                }
                fieldProps={{ autoComplete: 'new-password' }}
                rules={[rules.max(JOB_LIMITS.becomeSecretMax)]}
              />
              {hasSaved && (
                <ProFormCheckbox name="clearBecomeSecret" colProps={HALF}>
                  {t('pages.job.credential.form.becomeSecret.clear')}
                </ProFormCheckbox>
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

const CredentialList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const typeEnum = useValueEnum(CREDENTIAL_TYPE_META);
  const becomeText = useEnumText(BECOME_METHOD_META);

  // undefined = 抽屉关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<JobCredential | null | undefined>(
    undefined,
  );

  const reload = () => actionRef.current?.reload();
  const hasAnyAction =
    has('job.credential.edit') || has('job.credential.delete');

  const remove = async (record: JobCredential) => {
    try {
      await deleteJobCredential(record.id);
    } catch {
      // 已由请求层提示（仍被使用等）
      return;
    }
    message.success(t('common.msg.deleted'));
    reload();
  };

  const columns: ProColumns<JobCredential>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.job.credential.search.placeholder'),
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
      title: t('pages.job.credential.column.type'),
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: typeEnum,
      width: 110,
      render: (_, record) => {
        const meta = CREDENTIAL_TYPE_META[record.spec.type];
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
      title: t('pages.job.credential.column.username'),
      dataIndex: ['spec', 'username'],
      search: false,
      width: 140,
      render: (_, record) => <CodeText value={record.spec.username} />,
    },
    {
      title: t('pages.job.credential.column.become'),
      dataIndex: ['spec', 'becomeMethod'],
      search: false,
      width: 150,
      render: (_, record) => {
        const key = toBecomeKey(record.spec.becomeMethod);
        if (key === 'none') return becomeText(key);
        return (
          <span>
            {becomeText(key)}
            {' → '}
            <CodeText value={record.spec.becomeUser || 'root'} />
          </span>
        );
      },
    },
    {
      title: t('pages.job.credential.column.fingerprint'),
      dataIndex: 'fingerprint',
      search: false,
      width: 260,
      tooltip: t('pages.job.credential.column.fingerprint.tooltip'),
      render: (_, record) => <CodeText value={record.fingerprint} copyable />,
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
        if (has('job.credential.edit')) {
          actions.push(
            <a key="edit" onClick={() => setFormRow(record)}>
              {t('common.action.edit')}
            </a>,
          );
        }
        if (has('job.credential.delete')) {
          actions.push(
            (record.templateCount ?? 0) > 0 ? (
              <Tooltip
                key="delete"
                title={t('pages.job.credential.delete.inUse', {
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
                title={t('pages.job.credential.delete.title', {
                  name: record.spec.name,
                })}
                description={t('pages.job.credential.delete.description')}
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
      <ProTable<JobCredential>
        cardBordered
        headerTitle={
          has('job.credential.create') && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.job.credential.create.title')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          const result = await listJobCredentials({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            type: params.type
              ? (Number(params.type) as JobCredentialType)
              : undefined,
          });
          return toTableResult(result);
        }}
      />
      {formRow !== undefined && (
        <CredentialDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={reload}
        />
      )}
    </RouteTabsPage>
  );
};

export default CredentialList;
