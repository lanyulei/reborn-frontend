/**
 * 接入凭据：其他系统凭令牌调用流程引擎的开放接口（发起 / 查询 / 撤回流程、投递信号）。
 * 每个凭据只能发起被允许的流程、只能操作自己发起的实例；令牌明文只在创建 / 重置时展示一次。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, App, Form, Modal, Tag, Typography } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import {
  ConfirmLink,
  CreateButton,
  DeleteConfirmLink,
} from '@/components/TableActions';
import { UserSelect } from '@/components/UserSelect';
import { usePermissions } from '@/services/system/permissions';
import {
  createClient,
  deleteClient,
  listClients,
  rotateClientToken,
  updateClient,
  type WorkflowClient,
} from '@/services/workflow/config';
import { listDefinitions } from '@/services/workflow/definition';
import {
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import { fetchAllPages } from '@/utils/paging';
import {
  DEFINITION_STATUS_META,
  DEFINITION_STATUS_ORDER,
  fetchWorkflowUsers,
} from '../components/meta';

const NAME_MAX = 64;
const DESCRIPTION_MAX = 255;
/** 允许发起的流程数上限（与后端 proto 校验一致） */
const KEYS_MAX = 50;

interface ClientValues {
  name: string;
  actingUserId: string;
  definitionKeys: string[];
  status: 0 | 1;
  description?: string;
}

export const Clients: React.FC = () => {
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
  /** 正在编辑的凭据；null = 新建；undefined = 弹窗关闭 */
  const [editing, setEditing] = useState<WorkflowClient | null>();
  /** 刚签发的令牌（只展示这一次） */
  const [issued, setIssued] = useState<{ name: string; token: string }>();
  const editable = has('workflow.config.client');

  const reload = () => actionRef.current?.reload();

  const columns: ProColumns<WorkflowClient>[] = [
    {
      title: t('pages.workflow.client.name'),
      dataIndex: 'name',
      ellipsis: true,
      width: 180,
    },
    {
      title: t('pages.workflow.client.token'),
      dataIndex: 'tokenPrefix',
      width: 150,
      render: (_, record) => (
        <Typography.Text code>{record.tokenPrefix}…</Typography.Text>
      ),
    },
    {
      title: t('pages.workflow.client.actingUser'),
      dataIndex: 'actingUserName',
      width: 140,
      renderText: (_, record) => record.actingUserName || record.actingUserId,
    },
    {
      title: t('pages.workflow.client.definitions'),
      dataIndex: 'definitionKeys',
      render: (_, record) =>
        record.definitionKeys.map((key) => <Tag key={key}>{key}</Tag>),
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      width: 90,
    },
    {
      title: t('pages.workflow.client.lastUsed'),
      dataIndex: 'lastUsedTime',
      valueType: 'dateTime',
      width: 160,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 180,
      hideInTable: !editable,
      render: (_, record) => [
        <a key="edit" onClick={() => setEditing(record)}>
          {t('common.action.edit')}
        </a>,
        <ConfirmLink
          key="rotate"
          danger
          title={t('pages.workflow.client.rotate.title')}
          description={t('pages.workflow.client.rotate.description', {
            name: record.name,
          })}
          onConfirm={async () => {
            const { token } = await rotateClientToken(record.id);
            setIssued({ name: record.name, token });
            reload();
          }}
        >
          {t('pages.workflow.client.rotate')}
        </ConfirmLink>,
        <DeleteConfirmLink
          key="delete"
          title={t('pages.workflow.client.delete.title')}
          description={t('pages.workflow.client.delete.description', {
            name: record.name,
          })}
          onConfirm={async () => {
            await deleteClient(record.id);
            message.success(t('common.msg.deleted'));
            reload();
          }}
        />,
      ],
    },
  ];

  return (
    <>
      <ProTable<WorkflowClient>
        cardBordered
        headerTitle={
          editable && (
            <CreateButton onClick={() => setEditing(null)}>
              {t('pages.workflow.client.create')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        scroll={{ x: 'max-content' }}
        // 凭据数量有上限，一次取回
        pagination={false}
        request={async () => {
          const data = await listClients();
          return { data, total: data.length, success: true };
        }}
      />

      {editing !== undefined && (
        <ModalForm<ClientValues>
          key={editing?.id ?? 'create-client'}
          title={t(
            editing
              ? 'pages.workflow.client.edit'
              : 'pages.workflow.client.create',
          )}
          width={520}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(undefined);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{
            name: editing?.name,
            actingUserId: editing?.actingUserId,
            definitionKeys: editing?.definitionKeys ?? [],
            status: editing?.status ?? 1,
            description: editing?.description ?? '',
          }}
          submitter={editing ? submitter.save : submitter.create}
          onFinish={async (values) => {
            const spec = {
              name: values.name.trim(),
              actingUserId: values.actingUserId,
              definitionKeys: values.definitionKeys,
              status: values.status,
              description: values.description ?? '',
            };
            if (editing) {
              await updateClient(editing.id, spec);
              message.success(t('common.msg.saved'));
            } else {
              const { token } = await createClient(spec);
              setIssued({ name: spec.name, token });
            }
            reload();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.workflow.client.name')}
            tooltip={t('pages.workflow.client.name.tooltip')}
            rules={[
              {
                ...rules.required(t('pages.workflow.client.name')),
                whitespace: true,
              },
              rules.max(NAME_MAX),
            ]}
          />
          <Form.Item
            name="actingUserId"
            label={t('pages.workflow.client.actingUser')}
            tooltip={t('pages.workflow.client.actingUser.tooltip')}
            rules={[rules.select(t('pages.workflow.client.actingUser'))]}
          >
            <UserSelect
              fetchUsers={fetchWorkflowUsers}
              knownUsers={
                editing?.actingUserName
                  ? [
                      {
                        id: editing.actingUserId,
                        label: editing.actingUserName,
                      },
                    ]
                  : undefined
              }
            />
          </Form.Item>
          <ProFormSelect
            name="definitionKeys"
            label={t('pages.workflow.client.definitions')}
            tooltip={t('pages.workflow.client.definitions.tooltip')}
            mode="multiple"
            showSearch
            fieldProps={{ maxCount: KEYS_MAX }}
            request={async () => {
              const items = await fetchAllPages((page, pageSize) =>
                listDefinitions({ page, pageSize }),
              );
              return items.map((d) => ({
                value: d.key,
                label: `${d.name}（${d.key}）`,
              }));
            }}
            rules={[
              {
                required: true,
                type: 'array',
                message: t('common.validation.select', {
                  label: t('pages.workflow.client.definitions'),
                }),
              },
            ]}
          />
          <ProFormRadio.Group
            name="status"
            label={t('common.column.status')}
            tooltip={t('pages.workflow.client.status.tooltip')}
            options={statusOptions}
          />
          <ProFormTextArea
            name="description"
            label={t('pages.workflow.client.description')}
            fieldProps={{
              maxLength: DESCRIPTION_MAX,
              showCount: true,
              autoSize: { minRows: 2, maxRows: 4 },
            }}
          />
        </ModalForm>
      )}

      {/* 令牌只展示这一次：关闭后无法再次查看，只能重置 */}
      <Modal
        title={t('pages.workflow.client.issued.title', {
          name: issued?.name ?? '',
        })}
        open={!!issued}
        width={560}
        mask={{ closable: false }}
        onCancel={() => setIssued(undefined)}
        footer={null}
        destroyOnHidden
      >
        <Alert
          type="warning"
          showIcon
          title={t('pages.workflow.client.issued.warning')}
          style={{ marginBottom: 16 }}
        />
        <Typography.Paragraph copyable code style={{ wordBreak: 'break-all' }}>
          {issued?.token}
        </Typography.Paragraph>
        <Typography.Text type="secondary">
          {t('pages.workflow.client.issued.usage')}
        </Typography.Text>
      </Modal>
    </>
  );
};

export default Clients;
