/**
 * 规则分组选择器：分组树下拉，值为分组 ID，可单选 / 多选。低于 minLevel 的分组置灰不可选
 * （level=0 的上级分组只用于保持层级）。分组列表由调用方传入（页面通常已有）。
 */
import { TreeSelect } from 'antd';
import type React from 'react';
import { useMemo } from 'react';
import type { MonitorScopeLevel, RuleGroup } from '@/services/monitor/typings';
import { buildTree, type TreeNode } from '@/utils/tree';

interface GroupTreeOption {
  value: string;
  title: string;
  disabled?: boolean;
  children?: GroupTreeOption[];
}

export interface GroupTreeSelectProps {
  value?: string | string[];
  onChange?: (value?: string | string[]) => void;
  groups: readonly RuleGroup[];
  multiple?: boolean;
  maxCount?: number;
  /** 可选的最低级别：1=只读即可（筛选、订阅） 2=须可管理（归属、移动、屏蔽） */
  minLevel?: MonitorScopeLevel;
  /** 已知的分组名称（回显已选值；分组不在可见列表里时用它展示） */
  knownGroups?: readonly { id: string; name: string }[];
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const GroupTreeSelect: React.FC<GroupTreeSelectProps> = ({
  value,
  onChange,
  groups,
  multiple,
  maxCount,
  minLevel = 1,
  knownGroups,
  placeholder,
  allowClear = true,
  disabled,
  style,
}) => {
  const treeData = useMemo(() => {
    const toOption = (node: TreeNode<RuleGroup>): GroupTreeOption => ({
      value: node.id,
      title: node.name,
      disabled: (node.level ?? 0) < minLevel,
      children: node.children?.map(toOption),
    });
    const present = new Set(groups.map((group) => group.id));
    const missing = (knownGroups ?? [])
      .filter((group) => !present.has(group.id))
      .map((group) => ({ value: group.id, title: group.name }));
    return [...buildTree(groups).map(toOption), ...missing];
  }, [groups, minLevel, knownGroups]);

  return (
    <TreeSelect
      {...(multiple ? { multiple: true, maxCount } : {})}
      showSearch={{ filterTreeNode: true, treeNodeFilterProp: 'title' }}
      treeDefaultExpandAll
      allowClear={allowClear}
      disabled={disabled}
      style={style}
      value={value || undefined}
      placeholder={placeholder}
      treeData={treeData}
      onChange={(v) => onChange?.(v as string | string[] | undefined)}
    />
  );
};

export default GroupTreeSelect;
