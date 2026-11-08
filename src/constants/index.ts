import type { ProColumns } from '@ant-design/pro-components';

import type { Gender, RoleStatus, UserStatus } from '@/services/system/typings';

/** 性别选项（新建/编辑用户、个人设置表单共用） */
export const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '未知', value: 'unknown' },
];

/** 性别文案（表格展示），与选项同源派生 */
export const GENDER_TEXT: Record<Gender, string> = Object.fromEntries(
  GENDER_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<Gender, string>;

/** 密码长度规则（创建用户 / 重置密码 / 修改密码一致，对应后端 8-64 位断言） */
export const PASSWORD_LENGTH_RULE = {
  min: 8,
  max: 64,
  message: '长度 8-64 位',
};

/** 用户状态元数据：枚举展示与选项的唯一数据源 */
const USER_STATUS_META: Record<
  UserStatus,
  { text: string; status: 'Success' | 'Error' | 'Warning' | 'Default' }
> = {
  1: { text: '可用', status: 'Success' },
  2: { text: '停用', status: 'Error' },
  3: { text: '暂停', status: 'Warning' },
  4: { text: '离职', status: 'Default' },
};

/** 用户状态枚举（表格筛选 + 展示） */
export const USER_STATUS_ENUM: NonNullable<ProColumns['valueEnum']> =
  USER_STATUS_META;

/** 用户状态选项（变更状态子菜单等），由同一份元数据派生 */
export const USER_STATUS_OPTIONS: { value: UserStatus; text: string }[] = (
  [1, 2, 3, 4] as UserStatus[]
).map((value) => ({ value, text: USER_STATUS_META[value].text }));

/** 角色状态选项（新建/编辑表单共用） */
export const ROLE_STATUS_OPTIONS: { label: string; value: RoleStatus }[] = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
];

/** 角色名称校验规则（新建/编辑一致） */
export const ROLE_NAME_RULES = [
  { required: true, message: '请输入角色名称' },
  { max: 64, message: '最多 64 位' },
];
