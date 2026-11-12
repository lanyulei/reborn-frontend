import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { history, useAccess } from '@umijs/max';
import { App, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  ROLE_NAME_MAX,
  ROLE_STATUS_META,
  ROLE_STATUS_ORDER,
} from '@/constants';
import { usePermissions } from '@/services/system/permissions';
import {
  createRole,
  deleteRole,
  getRole,
  listRoles,
  updateRole,
} from '@/services/system/role';
import type { RoleStatus, SystemRole } from '@/services/system/typings';
import {
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import { toTableResult } from '@/utils/table';

/** 通知 biz 标识格式（与后端 proto 校验一致） */
const BIZ_ID_PATTERN = /^[a-z0-9_-]{1,64}$/;

/** 角色表单值（新建含 code；通知 biz 范围空 = 不限） */
interface RoleFormValues {
  name: string;
  code: string;
  status: RoleStatus;
  bizScope?: string[];
}

/**
 * 通知 biz 范围字段（新建/编辑共用）：空 = 不限（现有角色缺省）。
 * 用户可管范围 = 启用角色 scope 并集，任一角色不限即不限；超管恒不限。
 */
const BizScopeField: React.FC = () => {
  const t = useT();
  return (
    <ProFormSelect
      name="bizScope"
      label={t('pages.system.role.bizScope.label')}
      tooltip={t('pages.system.role.bizScope.tooltip')}
      fieldProps={{
        mode: 'tags',
        open: false,
        tokenSeparators: [',', ' '],
        placeholder: t('pages.system.role.bizScope.placeholder'),
      }}
      rules={[
        {
          validator: (_: unknown, value?: string[]) => {
            const list = value ?? [];
            if (list.length > 64) {
              return Promise.reject(
                new Error(t('pages.system.role.bizScope.max')),
              );
            }
            if (new Set(list).size !== list.length) {
              return Promise.reject(
                new Error(t('pages.system.role.bizScope.duplicate')),
              );
            }
            if (list.some((item) => !BIZ_ID_PATTERN.test(item))) {
              return Promise.reject(
                new Error(t('pages.system.role.bizScope.pattern')),
              );
            }
            return Promise.resolve();
          },
        },
      ]}
    />
  );
};

const RoleList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  // 内置角色写操作仅超管（元素权限对超管恒放行，故需单独取 isAdmin）
  const { canAdmin: isAdmin } = useAccess();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const roleStatusEnum = useValueEnum(ROLE_STATUS_META);
  const roleStatusOptions = useOptions(ROLE_STATUS_META, ROLE_STATUS_ORDER);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<SystemRole | null>(null);

  const reload = () => actionRef.current?.reload();

  // 任一操作权限都没有时，整个「操作」列不展示
  const hasAnyAction =
    has('system.role.edit') ||
    has('system.role.grant') ||
    has('system.role.delete');

  /** 角色名称校验规则（新建/编辑一致） */
  const roleNameRules = [
    rules.required(t('pages.system.role.column.name')),
    rules.max(ROLE_NAME_MAX),
  ];

  const columns: ProColumns<SystemRole>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.system.role.search.placeholder') },
    },
    {
      title: t('pages.system.role.column.name'),
      dataIndex: 'name',
      ellipsis: true,
      // 角色名称搜索由「关键字」字段覆盖（后端 keyword 模糊匹配名称/编码）
      search: false,
      render: (_, record) => (
        <>
          {record.name}
          {record.builtin && (
            <Tag color="gold" style={{ marginInlineStart: 8 }}>
              {t('pages.system.role.tag.builtin')}
            </Tag>
          )}
        </>
      ),
    },
    {
      title: t('pages.system.role.column.code'),
      dataIndex: 'code',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: roleStatusEnum,
      width: 90,
    },
    {
      title: t('pages.system.role.bizScope.label'),
      dataIndex: 'bizScope',
      search: false,
      ellipsis: true,
      render: (_, record) =>
        record.bizScope?.length
          ? record.bizScope.map((bizId) => <Tag key={bizId}>{bizId}</Tag>)
          : t('pages.system.role.bizScope.unlimited'),
    },
    {
      title: t('common.column.createTime'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
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
      width: 160,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        // 元素权限显隐：无对应权限码的操作不渲染；
        // 内置角色：编辑/权限仅超管可见，删除对任何人不可见（后端同样拒绝）
        const locked = record.builtin === true && !isAdmin;
        const actions: React.ReactNode[] = [];
        if (has('system.role.edit') && !locked) {
          actions.push(
            <a
              key="edit"
              onClick={() => {
                setEditRow(record);
              }}
            >
              {t('common.action.edit')}
            </a>,
          );
        }
        if (has('system.role.grant') && !locked) {
          actions.push(
            <a
              key="permissions"
              onClick={() => {
                history.push(`/system/role/${record.id}/permission`);
              }}
            >
              {t('pages.system.role.action.permission')}
            </a>,
          );
        }
        if (has('system.role.delete') && !record.builtin) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.system.role.delete.title')}
              description={t('pages.system.role.delete.description')}
              onConfirm={async () => {
                await deleteRole(record.id);
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
        <ProTable<SystemRole>
          cardBordered
          headerTitle={
            has('system.role.create') && (
              <CreateButton
                onClick={() => {
                  setCreateOpen(true);
                }}
              >
                {t('pages.system.role.create.title')}
              </CreateButton>
            )
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          request={async (params) => {
            const result = await listRoles({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              status: params.status as RoleStatus | undefined,
            });
            return toTableResult(result);
          }}
        />
      </PageContainer>

      {/* 新建角色（code 创建后不可修改） */}
      <ModalForm<RoleFormValues>
        key="create-role"
        title={t('pages.system.role.create.title')}
        width={480}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{ status: 1 }}
        submitter={submitter.create}
        onFinish={async (values) => {
          await createRole({
            name: values.name,
            code: values.code,
            status: values.status,
            bizScope: values.bizScope?.length ? values.bizScope : undefined,
          });
          message.success(t('common.msg.created'));
          reload();
          return true;
        }}
      >
        <ProFormText
          name="name"
          label={t('pages.system.role.column.name')}
          rules={roleNameRules}
        />
        <ProFormText
          name="code"
          label={t('pages.system.role.column.code')}
          placeholder={t('pages.system.role.form.code.placeholder')}
          rules={[
            rules.required(t('pages.system.role.column.code')),
            {
              pattern: /^[a-z0-9_]{2,64}$/,
              message: t('pages.system.role.form.code.pattern'),
            },
          ]}
        />
        <ProFormRadio.Group
          name="status"
          label={t('common.column.status')}
          options={roleStatusOptions}
        />
        <BizScopeField />
      </ModalForm>

      {/* 编辑角色：name / status / 通知业务范围（整组替换）可改，打开时拉取详情 */}
      {editRow && (
        <ModalForm<RoleFormValues>
          key={`edit-role-${editRow.id}`}
          title={t('pages.system.role.edit.title', { name: editRow.name })}
          width={480}
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          params={{ id: editRow.id }}
          request={async ({ id }) => {
            const { role } = await getRole(id);
            return {
              name: role.name,
              code: role.code,
              status: role.status,
              bizScope: role.bizScope ?? [],
            };
          }}
          submitter={submitter.save}
          onFinish={async (values) => {
            await updateRole(editRow.id, {
              name: values.name,
              status: values.status,
              // 整组替换：表单回显即当前值，空列表 = 清空 = 不限
              bizScope: { items: values.bizScope ?? [] },
            });
            message.success(t('common.msg.saved'));
            reload();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.system.role.column.name')}
            rules={roleNameRules}
          />
          <ProFormText
            name="code"
            label={t('pages.system.role.column.code')}
            disabled
            tooltip={t('pages.system.role.form.code.tooltip')}
          />
          <ProFormRadio.Group
            name="status"
            label={t('common.column.status')}
            options={roleStatusOptions}
          />
          <BizScopeField />
        </ModalForm>
      )}
    </>
  );
};

export default RoleList;
