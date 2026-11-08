import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormRadio,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, Button, Popconfirm } from 'antd';
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
      <ModalForm
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
      </ModalForm>

      {/* 编辑角色：仅 name / status 可改，打开时拉取详情 */}
      {editRow && (
        <ModalForm
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
            return { name: role.name, code: role.code, status: role.status };
          }}
          submitter={{
            searchConfig: { submitText: '保存', resetText: '取消' },
          }}
          onFinish={async (values) => {
            await updateRole(editRow.id, {
              name: values.name,
              status: values.status,
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
        </ModalForm>
      )}
    </>
  );
};

export default RoleList;
