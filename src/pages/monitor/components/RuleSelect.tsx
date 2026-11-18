/**
 * 规则选择器（屏蔽规则、订阅规则的「指定规则」）：按关键字在数据范围内远程搜索，值为规则 ID。
 * 交互与通用 UserSelect 完全一致（远程搜索 + 已选项回显），直接复用它，只换候选来源。
 */
import type React from 'react';
import { UserSelect, type UserSelectProps } from '@/components/UserSelect';
import { fetchMonitorRules } from './hooks';

export const RuleSelect: React.FC<
  Omit<UserSelectProps, 'fetchUsers' | 'multiple'>
> = (props) => (
  <UserSelect {...props} multiple fetchUsers={fetchMonitorRules} />
);

export default RuleSelect;
