/**
 * Webhook 端点：流程里的「自动任务」节点调用的外部地址。地址与签名密钥只在这里维护，
 * 流程图里只引用端点——流程图对参与者可见，不能放密钥。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormCheckbox,
  ProFormDependency,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { usePermissions } from '@/services/system/permissions';
import {
  createWebhook,
  deleteWebhook,
  listWebhooks,
  updateWebhook,
} from '@/services/workflow/config';
import type { WorkflowWebhook } from '@/services/workflow/typings';
import {
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import {
  DEFINITION_STATUS_META,
  DEFINITION_STATUS_ORDER,
} from '../components/meta';

const NAME_MAX = 64;
const URL_MAX = 1024;
const SECRET_MAX = 255;
const DESCRIPTION_MAX = 255;
/** 只接受 https（与后端校验一致） */
const URL_PATTERN = /^https:\/\/[^\s/@?#]+([/?#]\S*)?$/;

interface WebhookValues {
  name: string;
  url: string;
  status: 0 | 1;
  description?: string;
  secret?: string;
  clearSecret?: boolean;
}

export const Webhooks: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  // 启用 / 停用与流程定义同一套状态词条
  const statusEnum = useValueEnum(DEFINITION_STATUS_META);
  const statusOptions = useOptions(
    DEFINITION_STATUS_META,
    DEFINITION_STATUS_ORDER,
  );
  /** 正在编辑的端点；null = 新建；undefined = 弹窗关闭 */
  const [editing, setEditing] = useState<WorkflowWebhook | null>();
  const editable = has('workflow.config.webhook');

  const reload = () => actionRef.current?.reload();

  const columns: ProColumns<WorkflowWebhook>[] = [
    {
      title: t('pages.workflow.webhook.name'),
      dataIndex: 'name',
      ellipsis: true,
      width: 200,
    },
    {
      title: t('pages.workflow.webhook.url'),
      dataIndex: 'url',
      ellipsis: true,
      copyable: true,
    },
    {
      title: t('pages.workflow.webhook.secret'),
      dataIndex: 'hasSecret',
      width: 110,
      render: (_, record) =>
        record.hasSecret ? (
          <Tag color="blue">{t('pages.workflow.webhook.secret.set')}</Tag>
        ) : (
          <Tag>{t('pages.workflow.webhook.secret.unset')}</Tag>
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
      width: 160,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 110,
      hideInTable: !editable,
      render: (_, record) => [
        <a key="edit" onClick={() => setEditing(record)}>
          {t('common.action.edit')}
        </a>,
        <DeleteConfirmLink
          key="delete"
          title={t('pages.workflow.webhook.delete.title')}
          description={t('pages.workflow.webhook.delete.description', {
            name: record.name,
          })}
          onConfirm={async () => {
            await deleteWebhook(record.id);
            message.success(t('common.msg.deleted'));
            reload();
          }}
        />,
      ],
    },
  ];

  return (
    <>
      <ProTable<WorkflowWebhook>
        cardBordered
        headerTitle={
          editable && (
            <CreateButton onClick={() => setEditing(null)}>
              {t('pages.workflow.webhook.create')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        scroll={{ x: 'max-content' }}
        // 端点数量有上限，一次取回
        pagination={false}
        request={async () => {
          const data = await listWebhooks();
          return { data, total: data.length, success: true };
        }}
      />

      {editing !== undefined && (
        <ModalForm<WebhookValues>
          key={editing?.id ?? 'create-webhook'}
          title={t(
            editing
              ? 'pages.workflow.webhook.edit'
              : 'pages.workflow.webhook.create',
          )}
          width={520}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(undefined);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{
            name: editing?.name,
            url: editing?.url,
            status: editing?.status ?? 1,
            description: editing?.description ?? '',
          }}
          submitter={editing ? submitter.save : submitter.create}
          onFinish={async (values) => {
            const spec = {
              name: values.name.trim(),
              url: values.url.trim(),
              status: values.status,
              description: values.description ?? '',
              // 编辑：勾了清除传空串；填了新值传新值；都没有则不传（保留原密钥）
              secret: values.clearSecret ? '' : values.secret || undefined,
            };
            if (editing) await updateWebhook(editing.id, spec);
            else await createWebhook(spec);
            message.success(
              t(editing ? 'common.msg.saved' : 'common.msg.created'),
            );
            reload();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.workflow.webhook.name')}
            rules={[
              {
                ...rules.required(t('pages.workflow.webhook.name')),
                whitespace: true,
              },
              rules.max(NAME_MAX),
            ]}
          />
          <ProFormText
            name="url"
            label={t('pages.workflow.webhook.url')}
            tooltip={t('pages.workflow.webhook.url.tooltip')}
            placeholder="https://example.com/hooks/workflow"
            rules={[
              rules.required(t('pages.workflow.webhook.url')),
              rules.max(URL_MAX),
              {
                pattern: URL_PATTERN,
                message: t('pages.workflow.webhook.url.pattern'),
              },
            ]}
          />
          <ProFormDependency name={['clearSecret']}>
            {({ clearSecret }) => (
              <ProFormText.Password
                name="secret"
                label={t('pages.workflow.webhook.secret')}
                tooltip={t('pages.workflow.webhook.secret.tooltip')}
                disabled={!!clearSecret}
                placeholder={
                  editing?.hasSecret
                    ? t('pages.workflow.webhook.secret.keep')
                    : t('pages.workflow.webhook.secret.placeholder')
                }
                fieldProps={{ autoComplete: 'new-password' }}
                rules={[rules.max(SECRET_MAX)]}
              />
            )}
          </ProFormDependency>
          {editing?.hasSecret && (
            <ProFormCheckbox name="clearSecret">
              {t('pages.workflow.webhook.secret.clear')}
            </ProFormCheckbox>
          )}
          <ProFormRadio.Group
            name="status"
            label={t('common.column.status')}
            tooltip={t('pages.workflow.webhook.status.tooltip')}
            options={statusOptions}
          />
          <ProFormTextArea
            name="description"
            label={t('pages.workflow.webhook.description')}
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

export default Webhooks;
