/**
 * 部门选择器（通用）：部门树下拉，值为部门 ID，可单选 / 多选，支持按名称搜索。
 * 部门数据缺省自取（模块级短缓存，多处并用只请求一次）；页面已有部门列表时
 * 可经 depts 传入，避免重复请求。停用部门置灰不可选，已选中的仍正常回显。
 */
import { TreeSelect } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { listDepts } from '@/services/system/dept';
import type { SystemDept } from '@/services/system/typings';
import { useT } from '@/utils/i18n';
import { buildTree, collectSubtreeIds, type TreeNode } from '@/utils/tree';

/** 模块级短缓存：并发调用共享一次请求，30 秒内复用；失败不缓存 */
const TTL_MS = 30_000;
let cache: { at: number; promise: Promise<SystemDept[]> } | null = null;

function loadDepts(): Promise<SystemDept[]> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    const promise = listDepts({ silent: true }).then((res) => res.items ?? []);
    const entry = { at: Date.now(), promise };
    cache = entry;
    promise.catch(() => {
      if (cache === entry) cache = null;
    });
  }
  return cache.promise;
}

/** 部门数据变更后调用：使缓存失效，下次使用时重新拉取 */
export function invalidateDeptCache(): void {
  cache = null;
}

/** 全部部门（平铺）；加载失败 / 无权限时为空数组。enabled=false 时不请求 */
export function useDeptList(enabled = true): SystemDept[] {
  const [depts, setDepts] = useState<SystemDept[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadDepts()
      .then((items) => {
        if (!cancelled) setDepts(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return depts;
}

interface DeptTreeOption {
  value: string;
  title: string;
  disabled?: boolean;
  children?: DeptTreeOption[];
}

export interface DeptSelectProps {
  value?: string | string[];
  onChange?: (value?: string | string[]) => void;
  /** 单选时同 onChange，但带上部门名称（调用方需要把名称一并保存时使用） */
  onLabeledChange?: (dept?: { id: string; name: string }) => void;
  multiple?: boolean;
  /** 多选上限 */
  maxCount?: number;
  /** 调用方已有的部门列表；不传则组件自取 */
  depts?: readonly SystemDept[];
  /** 排除该部门及其全部下级（编辑部门选上级时防止成环） */
  excludeSubtreeOf?: string;
  /** 停用部门也可选（筛选场景：停用部门仍可能有成员）；缺省置灰不可选 */
  allowDisabled?: boolean;
  /** 已知的部门名称（回显已选值；部门列表不可用时用它展示，避免只显示裸 ID） */
  knownDepts?: readonly { id: string; name: string }[];
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const DeptSelect: React.FC<DeptSelectProps> = ({
  value,
  onChange,
  onLabeledChange,
  multiple,
  maxCount,
  depts,
  excludeSubtreeOf,
  allowDisabled,
  knownDepts,
  placeholder,
  allowClear = true,
  disabled,
  style,
}) => {
  const t = useT();
  // 调用方已给部门列表时不再自取
  const loaded = useDeptList(depts === undefined);
  const source = depts ?? loaded;

  const treeData = useMemo(() => {
    const excluded = excludeSubtreeOf
      ? collectSubtreeIds(source, excludeSubtreeOf)
      : undefined;
    const visible = excluded
      ? source.filter((dept) => !excluded.has(dept.id))
      : source;
    const toOption = (node: TreeNode<SystemDept>): DeptTreeOption => ({
      value: node.id,
      // 停用（status=0）在响应里是零值、会被省略：没有 status 即停用
      title: !node.status
        ? t('component.deptSelect.disabled', { name: node.name })
        : node.name,
      disabled: !node.status && !allowDisabled,
      children: node.children?.map(toOption),
    });
    const tree = buildTree(visible).map(toOption);
    // 已选但不在部门列表里的值（列表不可用 / 已被排除）：补平铺节点用于回显
    const present = new Set(visible.map((dept) => dept.id));
    const missing = (knownDepts ?? [])
      .filter((dept) => !present.has(dept.id))
      .map((dept) => ({ value: dept.id, title: dept.name }));
    return [...tree, ...missing];
  }, [source, excludeSubtreeOf, allowDisabled, knownDepts, t]);

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
      onChange={(v) => {
        onChange?.(v as string | string[] | undefined);
        if (!multiple) {
          const dept = source.find((item) => item.id === v);
          onLabeledChange?.(dept && { id: dept.id, name: dept.name });
        }
      }}
    />
  );
};

export default DeptSelect;
