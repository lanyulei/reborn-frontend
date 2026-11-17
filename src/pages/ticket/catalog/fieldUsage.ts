/**
 * 流程图里对表单字段的引用：表单权限（通用的与本模板专属的）、分支条件（form.<字段码>）、
 * 处理人规则与定时节点里取的表单字段。用于在改字段码 / 删字段之前提醒——这些配置按字段码
 * 引用，字段码变了就悄悄失效。只读、纯计算。
 */

interface GraphNode {
  id?: string;
  name?: string;
  formPermissions?: Record<string, unknown>;
  formPermissionsByForm?: Record<string, Record<string, unknown>>;
  assignee?: { rules?: { field?: string }[] };
  timer?: { field?: string };
}
interface GraphEdge {
  source?: string;
  condition?: string;
}

/** 条件表达式里的 form.<字段码> */
const FORM_REF = /\bform\.([a-zA-Z][a-zA-Z0-9_]*)/g;

/** 字段码 → 引用它的节点名称（去重，按出现顺序） */
export const fieldUsage = (
  graph: Record<string, unknown> | undefined,
  templateId?: string,
): Map<string, string[]> => {
  const usage = new Map<string, string[]>();
  const nodes = (graph?.nodes as GraphNode[] | undefined) ?? [];
  const edges = (graph?.edges as GraphEdge[] | undefined) ?? [];
  const nameOf = new Map(nodes.map((n) => [n.id ?? '', n.name || n.id || '']));
  const add = (code: string | undefined, node: string | undefined) => {
    if (!code || !node) return;
    const list = usage.get(code) ?? [];
    if (!list.includes(node)) list.push(node);
    usage.set(code, list);
  };
  for (const node of nodes) {
    const name = node.name || node.id;
    for (const code of Object.keys(node.formPermissions ?? {})) add(code, name);
    const own = templateId
      ? node.formPermissionsByForm?.[templateId]
      : undefined;
    for (const code of Object.keys(own ?? {})) add(code, name);
    for (const rule of node.assignee?.rules ?? []) add(rule.field, name);
    add(node.timer?.field, name);
  }
  for (const edge of edges) {
    for (const match of (edge.condition ?? '').matchAll(FORM_REF)) {
      add(match[1], nameOf.get(edge.source ?? '') || edge.source);
    }
  }
  return usage;
};
