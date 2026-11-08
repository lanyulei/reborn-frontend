import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import type { MenuProps } from 'antd';
import { App, Button, Dropdown, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  GENDER_OPTIONS,
  GENDER_TEXT,
  PASSWORD_LENGTH_RULE,
  USER_STATUS_ENUM,
  USER_STATUS_OPTIONS,
} from '@/constants';
import { usePermissions } from '@/services/system/permissions';
import { listRoles } from '@/services/system/role';
import type { Gender, SystemUser, UserStatus } from '@/services/system/typings';
import {
  bindUserRoles,
  createUser,
  deleteUser,
  getUser,
  listUserRoles,
  listUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus,
} from '@/services/system/user';
import { encodeSensitive } from '@/utils/encoding';

const UserList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message, modal } = App.useApp();
  const has = usePermissions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<SystemUser | null>(null);
  const [resetRow, setResetRow] = useState<SystemUser | null>(null);
  const [roleRow, setRoleRow] = useState<SystemUser | null>(null);

  const reload = () => actionRef.current?.reload();

  // 任一操作权限都没有时，整个「操作」列不展示
  const hasAnyAction =
    has('system.user.edit') ||
    has('system.user.reset_password') ||
    has('system.user.bind_role') ||
    has('system.user.status') ||
    has('system.user.delete');

  const handleStatusChange = (row: SystemUser, status: UserStatus) => {
    if (row.status === status) return;
    const target = USER_STATUS_OPTIONS.find((opt) => opt.value === status);
    modal.confirm({
      title: '变更用户状态',
      content: `确定将「${row.nickname || row.username}」状态变更为「${target?.text ?? status}」？`,
      onOk: async () => {
        await updateUserStatus(row.id, status);
        message.success('状态已变更');
        reload();
      },
    });
  };

  const handleDelete = (row: SystemUser) => {
    modal.confirm({
      title: '删除用户',
      content: '删除后将同时解除其全部角色绑定，确定删除？',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteUser(row.id);
        message.success('删除成功');
        reload();
      },
    });
  };

  const columns: ProColumns<SystemUser>[] = [
    {
      title: '搜索项',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '用户名 / 昵称 / 邮箱 / 手机号' },
    },
    {
      title: '用户名',
      dataIndex: 'username',
      copyable: true,
      ellipsis: true,
      // 用户名搜索由「关键字」字段覆盖（后端 keyword 模糊匹配用户名/昵称/邮箱）
      search: false,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      ellipsis: true,
      search: false,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      ellipsis: true,
      search: false,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      // 手机号搜索由「关键字」字段覆盖（后端 keyword 模糊匹配用户名/昵称/邮箱/手机号）
      search: false,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      search: false,
      render: (_, record) => (
        <Tag>{GENDER_TEXT[record.gender as Gender] ?? record.gender}</Tag>
      ),
    },
    {
      title: '管理员',
      dataIndex: 'isAdmin',
      search: false,
      render: (_, record) =>
        record.isAdmin ? (
          <Tag color="gold">超级管理员</Tag>
        ) : (
          <Tag>普通用户</Tag>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: USER_STATUS_ENUM,
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
      title: '操作',
      valueType: 'option',
      width: 100,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        // 元素权限显隐：无对应权限码的操作不渲染
        const items: MenuProps['items'] = [];
        if (has('system.user.reset_password')) {
          items.push({ key: 'resetPassword', label: '重置密码' });
        }
        if (has('system.user.bind_role')) {
          items.push({ key: 'roles', label: '角色绑定' });
        }
        if (has('system.user.status')) {
          items.push({
            key: 'status',
            label: '变更状态',
            children: USER_STATUS_OPTIONS.map((opt) => ({
              key: `status-${opt.value}`,
              label: opt.text,
              disabled: record.status === opt.value,
            })),
          });
        }
        if (has('system.user.delete')) {
          if (items.length > 0) {
            items.push({ type: 'divider' });
          }
          items.push({ key: 'delete', label: '删除', danger: true });
        }
        const actions: React.ReactNode[] = [];
        if (has('system.user.edit')) {
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
        if (items.length > 0) {
          actions.push(
            <Dropdown
              key="more"
              menu={{
                items,
                onClick: ({ key }) => {
                  if (key === 'resetPassword') {
                    setResetRow(record);
                    return;
                  }
                  if (key === 'roles') {
                    setRoleRow(record);
                    return;
                  }
                  if (key === 'delete') {
                    handleDelete(record);
                    return;
                  }
                  if (key.startsWith('status-')) {
                    handleStatusChange(
                      record,
                      Number(key.slice('status-'.length)) as UserStatus,
                    );
                  }
                },
              }}
            >
              <a>
                更多 <DownOutlined />
              </a>
            </Dropdown>,
          );
        }
        return actions;
      },
    },
  ];

  return (
    <>
      <PageContainer title={false}>
        <ProTable<SystemUser>
          headerTitle={
            has('system.user.create') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCreateOpen(true);
                }}
              >
                新建用户
              </Button>
            )
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          request={async (params) => {
            const result = await listUsers({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              status: params.status as UserStatus | undefined,
            });
            return {
              data: result.items,
              total: Number(result.total),
              success: true,
            };
          }}
        />
      </PageContainer>

      {/* 新建用户：两列栅格布局（凭据 / 基本信息 / 联系方式 / 权限开关） */}
      <ModalForm
        key="create-user"
        title="新建用户"
        width={720}
        grid
        rowProps={{ gutter: 16 }}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{ gender: 'unknown', isAdmin: false }}
        submitter={{
          searchConfig: { submitText: '创建', resetText: '取消' },
        }}
        onFinish={async (values) => {
          await createUser({
            username: values.username,
            password: encodeSensitive(values.password),
            nickname: values.nickname,
            email: values.email || undefined,
            phone: values.phone || undefined,
            gender: values.gender,
            isAdmin: values.isAdmin ?? false,
          });
          message.success('创建成功');
          reload();
          return true;
        }}
      >
        <ProFormText
          colProps={{ span: 12 }}
          name="username"
          label="用户名"
          placeholder="3-64 位字母/数字/下划线/中划线"
          rules={[
            { required: true, message: '请输入用户名' },
            {
              pattern: /^[a-zA-Z0-9_-]{3,64}$/,
              message: '3-64 位字母/数字/下划线/中划线',
            },
          ]}
        />
        <ProFormText.Password
          colProps={{ span: 12 }}
          name="password"
          label="密码"
          placeholder="8-64 位"
          rules={[
            { required: true, message: '请输入密码' },
            PASSWORD_LENGTH_RULE,
          ]}
        />
        <ProFormText
          colProps={{ span: 12 }}
          name="nickname"
          label="昵称"
          rules={[
            { required: true, message: '请输入昵称' },
            { max: 64, message: '最多 64 位' },
          ]}
        />
        <ProFormText.Password
          colProps={{ span: 12 }}
          name="confirmPassword"
          label="确认密码"
          placeholder="再次输入密码"
          dependencies={['password']}
          rules={[
            { required: true, message: '请再次输入密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        />
        <ProFormRadio.Group
          colProps={{ span: 12 }}
          name="gender"
          label="性别"
          rules={[{ required: true, message: '请选择性别' }]}
          options={GENDER_OPTIONS}
        />
        <ProFormText
          colProps={{ span: 12 }}
          name="email"
          label="邮箱"
          rules={[{ type: 'email', message: '邮箱格式不正确' }]}
        />
        <ProFormText colProps={{ span: 12 }} name="phone" label="手机号" />
        <ProFormSwitch
          colProps={{ span: 12 }}
          name="isAdmin"
          label="超级管理员"
        />
      </ModalForm>

      {/* 编辑用户（username 不可改） */}
      {editRow && (
        <ModalForm
          key={`edit-user-${editRow.id}`}
          title={`编辑用户：${editRow.username}`}
          width={560}
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          params={{ id: editRow.id }}
          request={async ({ id }) => {
            const { user } = await getUser(id);
            return {
              nickname: user.nickname,
              email: user.email,
              phone: user.phone,
              gender: user.gender,
              isAdmin: user.isAdmin,
            };
          }}
          submitter={{
            searchConfig: { submitText: '保存', resetText: '取消' },
          }}
          onFinish={async (values) => {
            const body: Record<string, unknown> = {
              nickname: values.nickname,
              gender: values.gender,
              isAdmin: values.isAdmin ?? false,
            };
            if (values.email) body.email = values.email;
            if (values.phone) body.phone = values.phone;
            await updateUser(editRow.id, body);
            message.success('保存成功');
            reload();
            return true;
          }}
        >
          <ProFormText
            name="nickname"
            label="昵称"
            rules={[
              { required: true, message: '请输入昵称' },
              { max: 64, message: '最多 64 位' },
            ]}
          />
          <ProFormText
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '邮箱格式不正确' }]}
          />
          <ProFormText name="phone" label="手机号" />
          <ProFormRadio.Group
            name="gender"
            label="性别"
            options={GENDER_OPTIONS}
          />
          <ProFormSwitch name="isAdmin" label="超级管理员" />
        </ModalForm>
      )}

      {/* 重置密码 */}
      {resetRow && (
        <ModalForm
          key={`reset-password-${resetRow.id}`}
          title={`重置密码：${resetRow.username}`}
          width={480}
          open={!!resetRow}
          onOpenChange={(open) => {
            if (!open) setResetRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          submitter={{
            searchConfig: { submitText: '重置', resetText: '取消' },
          }}
          onFinish={async (values) => {
            await resetUserPassword(
              resetRow.id,
              encodeSensitive(values.password),
            );
            message.success('密码已重置');
            return true;
          }}
        >
          <ProFormText.Password
            name="password"
            label="新密码"
            placeholder="8-64 位"
            rules={[
              { required: true, message: '请输入新密码' },
              PASSWORD_LENGTH_RULE,
            ]}
          />
        </ModalForm>
      )}

      {/* 角色绑定 */}
      {roleRow && (
        <ModalForm
          key={`bind-roles-${roleRow.id}`}
          title={`角色绑定：${roleRow.username}`}
          width={560}
          open={!!roleRow}
          onOpenChange={(open) => {
            if (!open) setRoleRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{ roleIds: [] }}
          submitter={{
            searchConfig: { submitText: '保存', resetText: '取消' },
          }}
          params={{ userId: roleRow.id }}
          request={async ({ userId }) => {
            const bound = await listUserRoles(userId);
            return { roleIds: bound.items.map((role) => role.id) };
          }}
          onFinish={async (values) => {
            await bindUserRoles(roleRow.id, values.roleIds ?? []);
            message.success('角色绑定已保存');
            reload();
            return true;
          }}
        >
          <ProFormSelect
            name="roleIds"
            label="已绑定角色"
            fieldProps={{
              mode: 'multiple',
              placeholder: '请选择角色（最多 100 个）',
            }}
            request={async () => {
              const all = await listRoles({ page: 1, pageSize: 100 });
              return all.items.map((role) => ({
                label: `${role.name}（${role.code}）`,
                value: role.id,
              }));
            }}
          />
        </ModalForm>
      )}
    </>
  );
};

export default UserList;
