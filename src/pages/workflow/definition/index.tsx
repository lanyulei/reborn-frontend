import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { usePermissions } from '@/services/system/permissions';
import {
  createDefinition,
  deleteDefinition,
  listDefinitions,
  updateDefinition,
} from '@/services/workflow/definition';
import type {
  DefinitionStatus,
  WorkflowDefinition,
} from '@/services/workflow/typings';
import {
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import {
  DEFINITION_STATUS_META,
  DEFINITION_STATUS_ORDER,
} from '../components/meta';

/** 流程标识格式（与后端 proto 校验一致） */
const KEY_PATTERN = /^[a-z][a-z0-9_-]{1,63}$/;
const NAME_MAX = 64;
const DESCRIPTION_MAX = 255;

interface DefinitionFormValues {
  key: string;
  name: string;
  category?: string;
  description?: string;
  status?: DefinitionStatus;
}

const DefinitionList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const statusEnum = useValueEnum(DEFINITION_STATUS_META);
  const statusOptions = useOptions(
    DEFINITION_STATUS_META,
    DEFINITION_STATUS_ORDER,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<WorkflowDefinition | null>(null);

  const reload = () => actionRef.current?.reload();
  const canEdit = has('workflow.definition.edit');
  const hasAnyAction = canEdit || has('workflow.definition.delete');

  const nameRules = [
    rules.required(t('pages.workflow.definition.column.name')),
    rules.max(NAME_MAX),
  ];

  const columns: ProColumns<WorkflowDefinition>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.workflow.definition.search.placeholder'),
      },
    },
    {
      title: t('pages.workflow.definition.column.name'),
      dataIndex: 'name',
      search: false,
      ellipsis: true,
    },
    {
      title: t('pages.workflow.definition.column.key'),
      dataIndex: 'key',
      search: false,
      copyable: true,
      ellipsis: true,
    },
    {
      title: t('pages.workflow.definition.column.category'),
      dataIndex: 'category',
      search: false,
      ellipsis: true,
    },
    {
      title: t('pages.workflow.definition.column.version'),
      dataIndex: 'published',
      valueEnum: {
        true: { text: t('pages.workflow.definition.published') },
        false: { text: t('pages.workflow.definition.unpublished') },
      },
      width: 110,
      render: (_, record) =>
        record.publishedVersion ? (
          <Tag color="blue">v{record.publishedVersion}</Tag>
        ) : (
          <Tag>{t('pages.workflow.definition.unpublished')}</Tag>
        ),
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      width: 90,
    },
    {
      title: t('common.column.updateTime'),
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 160,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (canEdit) {
          actions.push(
            <a
              key="design"
              onClick={() => history.push(`/workflow/definition/${record.id}`)}
            >
              {t('pages.workflow.definition.action.design')}
            </a>,
            <a key="edit" onClick={() => setEditRow(record)}>
              {t('common.action.edit')}
            </a>,
          );
        }
        if (has('workflow.definition.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.workflow.definition.delete.title')}
              description={t('pages.workflow.definition.delete.description', {
                name: record.name,
              })}
              onConfirm={async () => {
                await deleteDefinition(record.id);
                message.success(t('common.msg.deleted'));
                reload();
              }}
            />,
          );
        }
        return actions.length ? actions : t('common.empty');
      },
    },
  ];

  return (
    <>
      <PageContainer title={false}>
        <ProTable<WorkflowDefinition>
          cardBordered
          headerTitle={
            has('workflow.definition.create') && (
              <CreateButton onClick={() => setCreateOpen(true)}>
                {t('pages.workflow.definition.create.title')}
              </CreateButton>
            )
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          scroll={{ x: 'max-content' }}
          request={async (params) => {
            const result = await listDefinitions({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              status:
                params.status === undefined || params.status === ''
                  ? undefined
                  : (Number(params.status) as DefinitionStatus),
              published: parseBoolParam(params.published),
            });
            return toTableResult(result);
          }}
        />
      </PageContainer>

      {/* 新建流程：创建后直接进入设计器 */}
      <ModalForm<DefinitionFormValues>
        key="create-definition"
        title={t('pages.workflow.definition.create.title')}
        width={576}
        grid
        rowProps={{ gutter: 16 }}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        submitter={submitter.create}
        onFinish={async (values) => {
          const { definition } = await createDefinition({
            key: values.key,
            name: values.name,
            category: values.category ?? '',
            description: values.description ?? '',
          });
          message.success(t('common.msg.created'));
          if (canEdit) history.push(`/workflow/definition/${definition.id}`);
          else reload();
          return true;
        }}
      >
        <ProFormText
          name="name"
          colProps={{ span: 12 }}
          label={t('pages.workflow.definition.column.name')}
          rules={nameRules}
        />
        <ProFormText
          name="key"
          colProps={{ span: 12 }}
          label={t('pages.workflow.definition.column.key')}
          tooltip={t('pages.workflow.definition.form.key.tooltip')}
          placeholder={t('pages.workflow.definition.form.key.placeholder')}
          rules={[
            rules.required(t('pages.workflow.definition.column.key')),
            {
              pattern: KEY_PATTERN,
              message: t('pages.workflow.definition.form.key.pattern'),
            },
          ]}
        />
        <ProFormText
          name="category"
          label={t('pages.workflow.definition.column.category')}
          rules={[rules.max(NAME_MAX)]}
        />
        <ProFormTextArea
          name="description"
          label={t('pages.workflow.definition.form.description')}
          fieldProps={{
            maxLength: DESCRIPTION_MAX,
            showCount: true,
            autoSize: { minRows: 2, maxRows: 4 },
          }}
        />
      </ModalForm>

      {/* 编辑流程的基本信息（流程图在设计器里改） */}
      {editRow && (
        <ModalForm<DefinitionFormValues>
          key={`edit-definition-${editRow.id}`}
          title={t('pages.workflow.definition.edit.title', {
            name: editRow.name,
          })}
          width={480}
          open
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{
            key: editRow.key,
            name: editRow.name,
            category: editRow.category ?? '',
            description: editRow.description ?? '',
            status: editRow.status ?? 0,
          }}
          submitter={submitter.save}
          onFinish={async (values) => {
            await updateDefinition(editRow.id, {
              name: values.name,
              category: values.category ?? '',
              description: values.description ?? '',
              status: values.status,
            });
            message.success(t('common.msg.saved'));
            reload();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.workflow.definition.column.name')}
            rules={nameRules}
          />
          <ProFormText
            name="key"
            label={t('pages.workflow.definition.column.key')}
            disabled
            tooltip={t('pages.workflow.definition.form.key.tooltip')}
          />
          <ProFormText
            name="category"
            label={t('pages.workflow.definition.column.category')}
            rules={[rules.max(NAME_MAX)]}
          />
          <ProFormRadio.Group
            name="status"
            label={t('common.column.status')}
            tooltip={t('pages.workflow.definition.form.status.tooltip')}
            options={statusOptions}
          />
          <ProFormTextArea
            name="description"
            label={t('pages.workflow.definition.form.description')}
            fieldProps={{
              maxLength: DESCRIPTION_MAX,
              showCount: true,
              autoSize: { minRows: 2, maxRows: 4 },
            }}
          />
        </ModalForm>
      )}
    </>
  );
};

export default DefinitionList;
