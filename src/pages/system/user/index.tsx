import { DownOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDependency,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import type { MenuProps } from 'antd';
import { App, Col, Dropdown, Form, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DeptSelect, useDeptList } from '@/components/DeptSelect';
import { UserDeptTags } from '@/components/DeptSelect/UserDeptTags';
import { CreateButton } from '@/components/TableActions';
import {
  GENDER_META,
  GENDER_ORDER,
  USER_DEPT_MAX,
  USER_STATUS_META,
  USER_STATUS_ORDER,
} from '@/constants';
import { usePermissions } from '@/services/system/permissions';
import { listRoles } from '@/services/system/role';
import type {
  Gender,
  SystemUser,
  UserDept,
  UserDeptAssignment,
  UserStatus,
} from '@/services/system/typings';
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
import {
  useEnumText,
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import { fetchAllPages } from '@/utils/paging';
import { toTableResult } from '@/utils/table';

/**
 * 表单值 → 所属部门载荷：主部门未选或已不在所选部门内时取第一个。
 */
const toDeptAssignment = (
  deptIds?: string[],
  primaryDeptId?: string,
): UserDeptAssignment => {
  const ids = deptIds ?? [];
  if (ids.length === 0) return { deptIds: [] };
  return {
    deptIds: ids,
    primaryDeptId:
      primaryDeptId && ids.includes(primaryDeptId) ? primaryDeptId : ids[0],
  };
};

/** 所属部门是否与原值不同（集合或主部门任一变化） */
const deptsChanged = (next: UserDeptAssignment, prev: UserDept[]): boolean => {
  const prevIds = prev.map((item) => item.id);
  if (next.deptIds.length !== prevIds.length) return true;
  if (next.deptIds.some((id) => !prevIds.includes(id))) return true;
  return next.primaryDeptId !== prev.find((item) => item.isPrimary)?.id;
};

/**
 * 所属部门表单项（新建 / 编辑共用）：部门多选 + 主部门（选了多个部门时出现）。
 * span 为栅格表单下的列宽；不传则按普通纵向表单渲染。
 */
const DeptFields: React.FC<{
  span?: number;
  /** 已知的部门名称（编辑回显；主部门选项同样取自它） */
  knownDepts?: UserDept[];
}> = ({ span, knownDepts }) => {
  const t = useT();
  // 部门名称（主部门选项用）：与 DeptSelect 共享同一份缓存，不会多发请求
  const depts = useDeptList();
  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of knownDepts ?? []) map.set(item.id, item.name);
    for (const item of depts) map.set(item.id, item.name);
    return map;
  }, [depts, knownDepts]);

  // 主部门已不在所选部门内时清除，避免界面显示与实际提交不一致
  const form = Form.useFormInstance();
  const deptIds = Form.useWatch<string[] | undefined>('deptIds', form);
  const primaryDeptId = Form.useWatch<string | undefined>(
    'primaryDeptId',
    form,
  );
  useEffect(() => {
    if (primaryDeptId && deptIds && !deptIds.includes(primaryDeptId)) {
      form.setFieldValue('primaryDeptId', undefined);
    }
  }, [form, deptIds, primaryDeptId]);

  const deptItem = (
    <Form.Item
      name="deptIds"
      label={t('pages.system.user.column.depts')}
      tooltip={t('pages.system.user.form.depts.tooltip')}
    >
      <DeptSelect
        multiple
        maxCount={USER_DEPT_MAX}
        knownDepts={knownDepts}
        placeholder={t('pages.system.user.form.depts.placeholder')}
      />
    </Form.Item>
  );
  return (
    <>
      {span ? <Col span={span}>{deptItem}</Col> : deptItem}
      <ProFormDependency name={['deptIds']}>
        {({ deptIds }) =>
          (deptIds?.length ?? 0) > 1 ? (
            <ProFormSelect
              colProps={span ? { span } : undefined}
              name="primaryDeptId"
              label={t('pages.system.user.form.primaryDept')}
              tooltip={t('pages.system.user.form.primaryDept.tooltip')}
              placeholder={t('pages.system.user.form.primaryDept.placeholder')}
              options={(deptIds as string[]).map((id) => ({
                value: id,
                label: names.get(id) ?? id,
              }))}
            />
          ) : null
        }
      </ProFormDependency>
    </>
  );
};

const UserList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const userStatusEnum = useValueEnum(USER_STATUS_META);
  const userStatusOptions = useOptions(USER_STATUS_META, USER_STATUS_ORDER);
  const genderOptions = useOptions(GENDER_META, GENDER_ORDER);
  const genderText = useEnumText(GENDER_META);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<SystemUser | null>(null);
  const [resetRow, setResetRow] = useState<SystemUser | null>(null);
  const [roleRow, setRoleRow] = useState<SystemUser | null>(null);
  // 编辑弹窗打开时拉到的所属部门（回显名称 + 提交时比对是否变化）
  const [editDepts, setEditDepts] = useState<UserDept[]>([]);
  // 内置角色 ID（角色绑定弹窗加载选项时填充）：提交时并入，保证不可解绑
  const [builtinRoleIds, setBuiltinRoleIds] = useState<string[]>([]);

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
    const target = userStatusOptions.find((opt) => opt.value === status);
    modal.confirm({
      title: t('pages.system.user.statusChange.title'),
      content: t('pages.system.user.statusChange.content', {
        name: row.nickname || row.username,
        status: target?.label ?? status,
      }),
      onOk: async () => {
        await updateUserStatus(row.id, status);
        message.success(t('pages.system.user.statusChange.success'));
        reload();
      },
    });
  };

  const handleDelete = (row: SystemUser) => {
    modal.confirm({
      title: t('pages.system.user.delete.title'),
      content: t('pages.system.user.delete.content'),
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteUser(row.id);
        message.success(t('common.msg.deleted'));
        reload();
      },
    });
  };

  const columns: ProColumns<SystemUser>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.system.user.search.placeholder') },
    },
    {
      title: t('pages.system.user.column.username'),
      dataIndex: 'username',
      copyable: true,
      ellipsis: true,
      // 用户名搜索由「关键字」字段覆盖（后端 keyword 模糊匹配用户名/昵称/邮箱）
      search: false,
    },
    {
      title: t('pages.system.user.column.nickname'),
      dataIndex: 'nickname',
      ellipsis: true,
      search: false,
    },
    {
      title: t('pages.system.user.column.email'),
      dataIndex: 'email',
      ellipsis: true,
      search: false,
    },
    {
      title: t('pages.system.user.column.phone'),
      dataIndex: 'phone',
      // 手机号搜索由「关键字」字段覆盖（后端 keyword 模糊匹配用户名/昵称/邮箱/手机号）
      search: false,
    },
    {
      title: t('pages.system.user.column.depts'),
      dataIndex: 'deptId',
      // 筛选：选中部门及其全部下级部门的用户
      formItemRender: (_, { value, onChange }) => (
        <DeptSelect
          allowDisabled
          value={value}
          onChange={onChange}
          placeholder={t('pages.system.user.search.dept')}
        />
      ),
      render: (_, record) => <UserDeptTags depts={record.depts} />,
    },
    {
      title: t('pages.system.user.column.gender'),
      dataIndex: 'gender',
      search: false,
      render: (_, record) => (
        <Tag>
          {record.gender in GENDER_META
            ? genderText(record.gender as Gender)
            : record.gender}
        </Tag>
      ),
    },
    {
      title: t('pages.system.user.column.isAdmin'),
      dataIndex: 'isAdmin',
      search: false,
      render: (_, record) =>
        record.isAdmin ? (
          <Tag color="gold">{t('pages.system.user.tag.superAdmin')}</Tag>
        ) : (
          <Tag>{t('pages.system.user.tag.normal')}</Tag>
        ),
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: userStatusEnum,
      width: 90,
    },
    {
      title: t('common.column.createTime'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 110,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        // 元素权限显隐：无对应权限码的操作不渲染
        const items: MenuProps['items'] = [];
        if (has('system.user.reset_password')) {
          items.push({
            key: 'resetPassword',
            label: t('pages.system.user.action.resetPassword'),
          });
        }
        if (has('system.user.bind_role')) {
          items.push({
            key: 'roles',
            label: t('pages.system.user.action.bindRoles'),
          });
        }
        if (has('system.user.status')) {
          items.push({
            key: 'status',
            label: t('pages.system.user.action.changeStatus'),
            children: userStatusOptions.map((opt) => ({
              key: `status-${opt.value}`,
              label: opt.label,
              disabled: record.status === opt.value,
            })),
          });
        }
        if (has('system.user.delete')) {
          if (items.length > 0) {
            items.push({ type: 'divider' });
          }
          items.push({
            key: 'delete',
            label: t('common.action.delete'),
            danger: true,
          });
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
              {t('common.action.edit')}
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
                {t('pages.system.user.action.more')} <DownOutlined />
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
          cardBordered
          headerTitle={
            has('system.user.create') && (
              <CreateButton
                onClick={() => {
                  setCreateOpen(true);
                }}
              >
                {t('pages.system.user.create.title')}
              </CreateButton>
            )
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          scroll={{ x: 'max-content' }}
          request={async (params) => {
            const result = await listUsers({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              status: params.status as UserStatus | undefined,
              deptId: params.deptId || undefined,
              includeSubDepts: params.deptId ? true : undefined,
            });
            return toTableResult(result);
          }}
        />
      </PageContainer>

      {/* 新建用户：两列栅格布局（凭据 / 基本信息 / 联系方式 / 权限开关） */}
      <ModalForm
        key="create-user"
        title={t('pages.system.user.create.title')}
        width={720}
        grid
        rowProps={{ gutter: 16 }}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{ gender: 'unknown', isAdmin: false }}
        submitter={submitter.create}
        onFinish={async (values) => {
          await createUser({
            username: values.username,
            password: encodeSensitive(values.password),
            nickname: values.nickname,
            email: values.email || undefined,
            phone: values.phone || undefined,
            gender: values.gender,
            isAdmin: values.isAdmin ?? false,
            depts: values.deptIds?.length
              ? toDeptAssignment(values.deptIds, values.primaryDeptId)
              : undefined,
          });
          message.success(t('common.msg.created'));
          reload();
          return true;
        }}
      >
        <ProFormText
          colProps={{ span: 12 }}
          name="username"
          label={t('pages.system.user.column.username')}
          placeholder={t('pages.system.user.form.username.rule')}
          rules={[
            rules.required(t('pages.system.user.column.username')),
            {
              pattern: /^[a-zA-Z0-9_-]{3,64}$/,
              message: t('pages.system.user.form.username.rule'),
            },
          ]}
        />
        <ProFormText.Password
          colProps={{ span: 12 }}
          name="password"
          label={t('pages.system.user.form.password')}
          placeholder={t('pages.system.user.form.password.placeholder')}
          rules={[
            rules.required(t('pages.system.user.form.password')),
            rules.passwordLength(),
          ]}
        />
        <ProFormText
          colProps={{ span: 12 }}
          name="nickname"
          label={t('pages.system.user.column.nickname')}
          rules={[
            rules.required(t('pages.system.user.column.nickname')),
            rules.max(64),
          ]}
        />
        <ProFormText.Password
          colProps={{ span: 12 }}
          name="confirmPassword"
          label={t('pages.system.user.form.confirmPassword')}
          placeholder={t('pages.system.user.form.confirmPassword.placeholder')}
          dependencies={['password']}
          rules={[
            {
              required: true,
              message: t('pages.system.user.form.confirmPassword.required'),
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    t('pages.system.user.form.confirmPassword.mismatch'),
                  ),
                );
              },
            }),
          ]}
        />
        <ProFormRadio.Group
          colProps={{ span: 12 }}
          name="gender"
          label={t('pages.system.user.column.gender')}
          rules={[rules.select(t('pages.system.user.column.gender'))]}
          options={genderOptions}
        />
        <ProFormText
          colProps={{ span: 12 }}
          name="email"
          label={t('pages.system.user.column.email')}
          rules={[rules.email()]}
        />
        <ProFormText
          colProps={{ span: 12 }}
          name="phone"
          label={t('pages.system.user.column.phone')}
        />
        <ProFormSwitch
          colProps={{ span: 12 }}
          name="isAdmin"
          label={t('pages.system.user.tag.superAdmin')}
        />
        <DeptFields span={12} />
      </ModalForm>

      {/* 编辑用户（username 不可改） */}
      {editRow && (
        <ModalForm
          key={`edit-user-${editRow.id}`}
          title={t('pages.system.user.edit.title', { name: editRow.username })}
          width={560}
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          params={{ id: editRow.id }}
          request={async ({ id }) => {
            const { user } = await getUser(id);
            setEditDepts(user.depts ?? []);
            return {
              nickname: user.nickname,
              email: user.email,
              phone: user.phone,
              gender: user.gender,
              isAdmin: user.isAdmin,
              deptIds: (user.depts ?? []).map((item) => item.id),
              primaryDeptId: user.depts?.find((item) => item.isPrimary)?.id,
            };
          }}
          submitter={submitter.save}
          onFinish={async (values) => {
            const body: Record<string, unknown> = {
              nickname: values.nickname,
              gender: values.gender,
            };
            // isAdmin 仅在变化时提交：后端见到该字段即要求超管，且会吊销目标用户会话
            const nextAdmin = values.isAdmin ?? false;
            if (nextAdmin !== editRow.isAdmin) body.isAdmin = nextAdmin;
            // 清空也要提交：空串 = 清除（仅在与原值不同时发送）
            const email = values.email ?? '';
            const phone = values.phone ?? '';
            if (email !== (editRow.email ?? '')) body.email = email;
            if (phone !== (editRow.phone ?? '')) body.phone = phone;
            // 所属部门仅在变化时提交（整组替换）
            const depts = toDeptAssignment(
              values.deptIds,
              values.primaryDeptId,
            );
            if (deptsChanged(depts, editDepts)) body.depts = depts;
            await updateUser(editRow.id, body);
            message.success(t('common.msg.saved'));
            reload();
            return true;
          }}
        >
          <ProFormText
            name="nickname"
            label={t('pages.system.user.column.nickname')}
            rules={[
              rules.required(t('pages.system.user.column.nickname')),
              rules.max(64),
            ]}
          />
          <ProFormText
            name="email"
            label={t('pages.system.user.column.email')}
            rules={[rules.email()]}
          />
          <ProFormText
            name="phone"
            label={t('pages.system.user.column.phone')}
          />
          <ProFormRadio.Group
            name="gender"
            label={t('pages.system.user.column.gender')}
            options={genderOptions}
          />
          <ProFormSwitch
            name="isAdmin"
            label={t('pages.system.user.tag.superAdmin')}
          />
          <DeptFields knownDepts={editDepts} />
        </ModalForm>
      )}

      {/* 重置密码 */}
      {resetRow && (
        <ModalForm
          key={`reset-password-${resetRow.id}`}
          title={t('pages.system.user.reset.title', {
            name: resetRow.username,
          })}
          width={480}
          open={!!resetRow}
          onOpenChange={(open) => {
            if (!open) setResetRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          submitter={{
            searchConfig: {
              submitText: t('pages.system.user.reset.submit'),
              resetText: t('common.action.cancel'),
            },
          }}
          onFinish={async (values) => {
            await resetUserPassword(
              resetRow.id,
              encodeSensitive(values.password),
            );
            message.success(t('pages.system.user.reset.success'));
            return true;
          }}
        >
          <ProFormText.Password
            name="password"
            label={t('pages.system.user.form.newPassword')}
            placeholder={t('pages.system.user.form.password.placeholder')}
            rules={[
              rules.required(t('pages.system.user.form.newPassword')),
              rules.passwordLength(),
            ]}
          />
        </ModalForm>
      )}

      {/* 角色绑定：内置角色（默认角色）锁定——选项禁用、已选标签无叉号、提交并入；后端同样兜底保留 */}
      {roleRow && (
        <ModalForm
          key={`bind-roles-${roleRow.id}`}
          title={t('pages.system.user.roles.title', { name: roleRow.username })}
          width={560}
          open={!!roleRow}
          onOpenChange={(open) => {
            if (!open) setRoleRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{ roleIds: [] }}
          submitter={submitter.save}
          params={{ userId: roleRow.id }}
          request={async ({ userId }) => {
            const bound = await listUserRoles(userId);
            // 回显即含内置角色（历史数据缺失时由选项加载后补入，见 onFinish 并集）
            return { roleIds: bound.items.map((role) => role.id) };
          }}
          onFinish={async (values) => {
            const selected: string[] = values.roleIds ?? [];
            const merged = [
              ...selected,
              ...builtinRoleIds.filter((id) => !selected.includes(id)),
            ];
            await bindUserRoles(roleRow.id, merged);
            message.success(t('pages.system.user.roles.success'));
            reload();
            return true;
          }}
        >
          <ProFormSelect
            name="roleIds"
            label={t('pages.system.user.roles.label')}
            tooltip={t('pages.system.user.roles.builtinHint')}
            fieldProps={{
              mode: 'multiple',
              placeholder: t('pages.system.user.roles.placeholder'),
            }}
            request={async () => {
              // 翻页取全：角色超过一页时不再被截断
              const roles = await fetchAllPages((page, pageSize) =>
                listRoles({ page, pageSize }),
              );
              setBuiltinRoleIds(
                roles.filter((role) => role.builtin).map((role) => role.id),
              );
              return roles.map((role) => ({
                label: role.builtin
                  ? t('pages.system.user.roles.optionBuiltin', {
                      name: role.name,
                      code: role.code,
                    })
                  : t('pages.system.user.roles.option', {
                      name: role.name,
                      code: role.code,
                    }),
                value: role.id,
                // 禁用选项：下拉不可取消勾选，已选标签不渲染关闭图标
                disabled: role.builtin === true,
              }));
            }}
          />
        </ModalForm>
      )}
    </>
  );
};

export default UserList;
