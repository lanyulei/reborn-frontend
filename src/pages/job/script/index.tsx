/**
 * 脚本库：可复用的脚本，快速执行时引用。执行时脚本内容固化进执行记录，之后修改脚本不影响已提交的执行。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDependency,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Link, useAccess } from '@umijs/max';
import { App, Tag, Typography } from 'antd';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { FULL, HALF } from '@/constants/layout';
import {
  createJobScript,
  deleteJobScript,
  getJobScript,
  listJobScripts,
  updateJobScript,
} from '@/services/job/script';
import type {
  JobInterpreter,
  JobScript,
  JobScriptSpec,
} from '@/services/job/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatBytes } from '@/utils/format';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { byteLength } from '../components/format';
import { LIBRARY_TABS } from '../components/groups';
import {
  INTERPRETER_OPTIONS,
  INTERPRETER_ORDER,
  JOB_LIMITS,
} from '../components/meta';
import { useJobStyles } from '../components/styles';
import { UpdatedCell } from '../components/tags';

interface ScriptFormValues {
  name: string;
  interpreter: JobInterpreter;
  content: string;
  description?: string;
}

/** 新建 / 编辑脚本抽屉（row 为空即新建） */
const ScriptDrawer: React.FC<{
  row: JobScript | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ row, onClose, onSaved }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { styles } = useJobStyles();
  // 编辑时以详情接口返回的为准（乐观锁版本号）
  const [saved, setSaved] = useState<JobScript | null>(row);

  return (
    <DrawerForm<ScriptFormValues>
      title={
        row
          ? t('pages.job.script.edit.title', { name: row.spec.name })
          : t('pages.job.script.create.title')
      }
      width={960}
      grid
      rowProps={{ gutter: 16 }}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true, mask: { closable: false } }}
      request={async () => {
        const initial: ScriptFormValues = {
          name: '',
          interpreter: 'bash',
          content: '',
        };
        if (!row) return initial;
        // 列表不含脚本内容：编辑时取详情
        let script: JobScript;
        try {
          ({ script } = await getJobScript(row.id));
        } catch {
          // 错误提示已由请求层给出：关闭抽屉，避免留下一张空白但可保存的表单
          onClose();
          return initial;
        }
        setSaved(script);
        return {
          name: script.spec.name,
          interpreter: script.spec.interpreter,
          content: script.spec.content ?? '',
          description: script.spec.description,
        };
      }}
      submitter={row ? submitter.save : submitter.create}
      onFinish={async (values) => {
        const spec: JobScriptSpec = {
          name: values.name.trim(),
          interpreter: values.interpreter,
          content: values.content,
          description: values.description?.trim() ?? '',
        };
        if (row) {
          await updateJobScript(row.id, {
            spec,
            version: saved?.version ?? row.version,
          });
          message.success(t('common.msg.saved'));
        } else {
          await createJobScript(spec);
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
      <ProFormSelect
        name="interpreter"
        label={t('pages.job.adhoc.interpreter')}
        colProps={HALF}
        options={INTERPRETER_OPTIONS}
        allowClear={false}
        rules={[rules.select(t('pages.job.adhoc.interpreter'))]}
      />
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
      <ProFormDependency name={['content']}>
        {({ content }) => (
          <ProFormTextArea
            name="content"
            label={t('pages.job.script.form.content')}
            colProps={FULL}
            extra={t('pages.job.script.form.content.stat', {
              lines: content ? String(content).split('\n').length : 0,
              size: formatBytes(byteLength(content)) || '0 B',
            })}
            fieldProps={{
              rows: 24,
              className: styles.codeInput,
              spellCheck: false,
              autoComplete: 'off',
              wrap: 'off',
            }}
            rules={[
              rules.required(t('pages.job.script.form.content')),
              {
                validator: (_: unknown, value?: string) =>
                  byteLength(value) <= JOB_LIMITS.scriptMaxBytes
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(t('pages.job.script.form.content.tooLarge')),
                      ),
              },
            ]}
          />
        )}
      </ProFormDependency>
    </DrawerForm>
  );
};

const ScriptList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const access = useAccess();
  const t = useT();
  const interpreterEnum = useMemo(
    () =>
      Object.fromEntries(
        INTERPRETER_ORDER.map((value) => [value, { text: value }]),
      ),
    [],
  );

  // undefined = 抽屉关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<JobScript | null | undefined>(
    undefined,
  );

  const reload = () => actionRef.current?.reload();
  const hasAnyAction =
    has('job.script.edit') ||
    has('job.script.delete') ||
    Boolean(access.canJobAdhoc);

  const remove = async (record: JobScript) => {
    try {
      await deleteJobScript(record.id);
    } catch {
      // 已由请求层提示
      return;
    }
    message.success(t('common.msg.deleted'));
    reload();
  };

  const columns: ProColumns<JobScript>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.job.script.search.placeholder'),
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
      title: t('pages.job.adhoc.interpreter'),
      dataIndex: 'interpreter',
      valueType: 'select',
      valueEnum: interpreterEnum,
      width: 120,
      render: (_, record) => (
        <Tag style={{ marginInlineEnd: 0 }}>{record.spec.interpreter}</Tag>
      ),
    },
    {
      title: t('pages.job.script.column.size'),
      dataIndex: 'size',
      search: false,
      width: 110,
      renderText: (value?: number) => formatBytes(value) || t('common.empty'),
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
      width: 160,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        // 与快速执行页一致：进页面要菜单权限，发起执行要 job.adhoc.run 元素权限
        if (access.canJobAdhoc && has('job.adhoc.run')) {
          actions.push(
            <Link key="run" to={`/job/adhoc?scriptId=${record.id}`}>
              {t('pages.job.template.run')}
            </Link>,
          );
        }
        if (has('job.script.edit')) {
          actions.push(
            <a key="edit" onClick={() => setFormRow(record)}>
              {t('common.action.edit')}
            </a>,
          );
        }
        if (has('job.script.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.job.script.delete.title', {
                name: record.spec.name,
              })}
              description={t('pages.job.script.delete.description')}
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
      <ProTable<JobScript>
        cardBordered
        headerTitle={
          has('job.script.create') && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.job.script.create.title')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          const result = await listJobScripts({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            interpreter: (params.interpreter as JobInterpreter) || undefined,
          });
          return toTableResult(result);
        }}
      />
      {formRow !== undefined && (
        <ScriptDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={reload}
        />
      )}
    </RouteTabsPage>
  );
};

export default ScriptList;
