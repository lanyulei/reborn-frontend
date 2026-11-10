import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, Button, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { ROLE_NAME_RULES, ROLE_STATUS_OPTIONS } from '@/constants';
import { usePermissions } from '@/services/system/permissions';
import {
  createRole,
  deleteRole,
  getRole,
  listRoles,
  updateRole,
} from '@/services/system/role';
import type { RoleStatus, SystemRole } from '@/services/system/typings';

/** 角色状态枚举（表格筛选 + 展示） */
const ROLE_STATUS_ENUM: NonNullable<ProColumns<SystemRole>['valueEnum']> = {
  1: { text: '启用', status: 'Success' },
  0: { text: '禁用', status: 'Default' },
};

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
const bizScopeField = (
  <ProFormSelect
    name="bizScope"
    label="通知业务范围"
    tooltip="限制该角色可管理的通知业务（biz）；留空 = 不限。多角色取并集，任一角色不限即不限"
    fieldProps={{
      mode: 'tags',
      open: false,
      tokenSeparators: [',', ' '],
      placeholder: '输入 biz 标识后回车，留空 = 不限',
    }}
    rules={[
      {
        validator: (_: unknown, value?: string[]) => {
          const list = value ?? [];
          if (list.length > 64) return Promise.reject(new Error('最多 64 项'));
          if (new Set(list).size !== list.length) {
            return Promise.reject(new Error('条目不可重复'));
          }
          if (list.some((item) => !BIZ_ID_PATTERN.test(item))) {
            return Promise.reject(
              new Error('1-64 位小写字母/数字/下划线/连字符'),
            );
          }
          return Promise.resolve();
        },
      },
    ]}
  />
);

const RoleList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<SystemRole | null>(null);

  const reload = () => actionRef.current?.reload();

  // 任一操作权限都没有时，整个「操作」列不展示
  const hasAnyAction =
    has('system.role.edit') ||
    has('system.role.grant') ||
    has('system.role.delete');

  const columns: ProColumns<SystemRole>[] = [
    {
      title: '搜索项',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '角色名称 / 编码' },
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      ellipsis: true,
      // 角色名称搜索由「关键字」字段覆盖（后端 keyword 模糊匹配名称/编码）
      search: false,
    },
    {
      title: '角色编码',
      dataIndex: 'code',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: ROLE_STATUS_ENUM,
      width: 90,
    },
    {
      title: '通知业务范围',
      dataIndex: 'bizScope',
      search: false,
      ellipsis: true,
      render: (_, record) =>
        record.bizScope?.length
          ? record.bizScope.map((bizId) => <Tag key={bizId}>{bizId}</Tag>)
          : '不限',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        // 元素权限显隐：无对应权限码的操作不渲染
        const actions: React.ReactNode[] = [];
        if (has('system.role.edit')) {
          actions.push(
            <a
              key="edit"
              onClick={() => {
                setEditRow(record);
              }}
            >
              编辑
            </a>,
          );
        }
        if (has('system.role.grant')) {
          actions.push(
            <a
              key="permissions"
              onClick={() => {
                history.push(`/system/role/${record.id}/permission`);
              }}
            >
              权限
            </a>,
          );
        }
        if (has('system.role.delete')) {
          actions.push(
            <Popconfirm
              key="delete"
              title="删除角色"
              description="将同时解除全部用户的角色绑定，确定删除？"
              onConfirm={async () => {
                await deleteRole(record.id);
                message.success('删除成功');
                reload();
              }}
            >
              <a style={{ color: '#ff4d4f' }}>删除</a>
            </Popconfirm>,
          );
        }
        return actions;
      },
    },
  ];

  return (
    <>
      <PageContainer title={false}>
        <ProTable<SystemRole>
          headerTitle={
            has('system.role.create') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCreateOpen(true);
                }}
              >
                新建角色
              </Button>
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
            return {
              data: result.items,
              total: Number(result.total),
              success: true,
            };
          }}
        />
      </PageContainer>

      {/* 新建角色（code 创建后不可修改） */}
      <ModalForm<RoleFormValues>
        key="create-role"
        title="新建角色"
        width={480}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{ status: 1 }}
        submitter={{
          searchConfig: { submitText: '创建', resetText: '取消' },
        }}
        onFinish={async (values) => {
          await createRole({
            name: values.name,
            code: values.code,
            status: values.status,
            bizScope: values.bizScope?.length ? values.bizScope : undefined,
          });
          message.success('创建成功');
          reload();
          return true;
        }}
      >
        <ProFormText name="name" label="角色名称" rules={ROLE_NAME_RULES} />
        <ProFormText
          name="code"
          label="角色编码"
          placeholder="2-64 位小写字母/数字/下划线，创建后不可修改"
          rules={[
            { required: true, message: '请输入角色编码' },
            {
              pattern: /^[a-z0-9_]{2,64}$/,
              message: '2-64 位小写字母/数字/下划线',
            },
          ]}
        />
        <ProFormRadio.Group
          name="status"
          label="状态"
          options={ROLE_STATUS_OPTIONS}
        />
        {bizScopeField}
      </ModalForm>

      {/* 编辑角色：name / status / 通知业务范围（整组替换）可改，打开时拉取详情 */}
      {editRow && (
        <ModalForm<RoleFormValues>
          key={`edit-role-${editRow.id}`}
          title={`编辑角色：${editRow.name}`}
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
          submitter={{
            searchConfig: { submitText: '保存', resetText: '取消' },
          }}
          onFinish={async (values) => {
            await updateRole(editRow.id, {
              name: values.name,
              status: values.status,
              // 整组替换：表单回显即当前值，空列表 = 清空 = 不限
              bizScope: { items: values.bizScope ?? [] },
            });
            message.success('保存成功');
            reload();
            return true;
          }}
        >
          <ProFormText name="name" label="角色名称" rules={ROLE_NAME_RULES} />
          <ProFormText
            name="code"
            label="角色编码"
            disabled
            tooltip="编码创建后不可修改"
          />
          <ProFormRadio.Group
            name="status"
            label="状态"
            options={ROLE_STATUS_OPTIONS}
          />
          {bizScopeField}
        </ModalForm>
      )}
    </>
  );
};

export default RoleList;
