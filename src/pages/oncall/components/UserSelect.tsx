/**
 * 值班域用户选择器：通用 UserSelect + 值班域的候选接口（可用的系统用户，最多
 * 50 个，靠关键字缩小范围）。
 */
import type React from 'react';
import {
  UserSelect as BaseUserSelect,
  type UserSelectProps,
  userLabel,
} from '@/components/UserSelect';
import { listUserCandidates } from '@/services/oncall/group';

const fetchCandidates = async (keyword: string) => {
  const { items } = await listUserCandidates(keyword);
  return (items ?? []).map((u) => ({ id: u.id, label: userLabel(u) }));
};

export const UserSelect: React.FC<
  Omit<UserSelectProps, 'fetchUsers' | 'knownUsers'>
> = (props) => <BaseUserSelect {...props} fetchUsers={fetchCandidates} />;
