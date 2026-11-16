/**
 * 平铺列表 → 树：按 parentId 归组，保持入参顺序（后端已按「上级在前、同级排序」返回）。
 * 上级不在列表内的节点（被过滤掉 / 无权限）提升为根，避免整枝丢失。
 */
export type TreeNode<T> = T & { children?: TreeNode<T>[] };

export function buildTree<T extends { id: string; parentId?: string }>(
  items: readonly T[],
): TreeNode<T>[] {
  const nodes = new Map<string, TreeNode<T>>();
  for (const item of items) nodes.set(item.id, { ...item });
  const roots: TreeNode<T>[] = [];
  for (const item of items) {
    const node = nodes.get(item.id) as TreeNode<T>;
    const parent = item.parentId ? nodes.get(item.parentId) : undefined;
    if (parent) {
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** 节点及其全部下级的 id 集合（如编辑部门时排除自身子树，防止选成自己的下级） */
export function collectSubtreeIds<T extends { id: string; parentId?: string }>(
  items: readonly T[],
  rootId: string,
): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const item of items) {
    if (!item.parentId) continue;
    const list = childrenOf.get(item.parentId);
    if (list) list.push(item.id);
    else childrenOf.set(item.parentId, [item.id]);
  }
  const ids = new Set<string>([rootId]);
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.pop() as string;
    for (const child of childrenOf.get(current) ?? []) {
      if (!ids.has(child)) {
        ids.add(child);
        queue.push(child);
      }
    }
  }
  return ids;
}
