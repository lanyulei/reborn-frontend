/**
 * 流程设计器的数据模型：结构化的流程（顺序 + 成对分支 + 跳转）↔ 后端的通用有向图。
 *
 * 设计器只编辑结构（Flow），保存时由 toGraph 生成图（nodes / edges），因此用户能做的
 * 每个操作都得到结构合法的图：分叉与汇聚成对、没有悬空节点。结构本身随图一起保存
 * （graph.design，后端原样存取、不解释），再次打开时直接还原；没有 design 的图
 * （经接口直接写入的）不支持可视化编辑。
 */
import type { Translate } from '@/utils/i18n';

/** 处理人规则类型（与后端 biz/workflow/graph.go 一致） */
export type AssigneeRuleKind =
  | 'user'
  | 'role'
  | 'initiator'
  | 'deptLeader'
  | 'deptLeaderOf'
  | 'formUser'
  | 'formDeptLeader'
  | 'oncall';

export interface AssigneeRule {
  kind: AssigneeRuleKind;
  userIds?: string[];
  roleCodes?: string[];
  deptId?: string;
  level?: number;
  field?: string;
  /** 值班人规则：值班组与其下的值班表（取流程到达节点那一刻的主、备值班人） */
  groupId?: string;
  scheduleId?: string;
  /** 仅设计器使用：已选用户 / 角色 / 部门 / 值班组 / 值班表的显示名，卡片摘要与回显用 */
  labels?: Record<string, string>;
}

/** 多人处理模式：或签 / 会签 / 依次审批 */
export type AssigneeMode = 'any' | 'all' | 'sequential';

export interface Assignee {
  rules: AssigneeRule[];
  mode?: AssigneeMode;
  /** 处理人为空：skip=自动跳过 admin=转交流程管理员 */
  onEmpty?: 'skip' | 'admin';
}

/** 时长单位 */
export type DurationUnit = 'minute' | 'hour' | 'day';
export const DURATION_UNITS: readonly DurationUnit[] = [
  'minute',
  'hour',
  'day',
];

/** 一段时长；workTime 时按工作日历计（分钟 / 小时只算工作时段，天 = 工作日） */
export interface FlowDuration {
  value: number;
  unit: DurationUnit;
  workTime?: boolean;
}

/** 任务超时后的动作：仅提醒 / 自动同意 / 自动拒绝 / 转交流程管理员 */
export type TimeoutAction = 'remind' | 'approve' | 'reject' | 'admin';
export const TIMEOUT_ACTIONS: readonly TimeoutAction[] = [
  'remind',
  'approve',
  'reject',
  'admin',
];

/** 人工任务的处理时限；remind 为到期前多久先提醒一次（与时限同单位、同日历） */
export interface TaskTimeout extends FlowDuration {
  action: TimeoutAction;
  remind?: number;
}

/** 定时节点的等待方式：延时 / 等到表单里的某个时刻 / 等外部信号 */
export type TimerMode = 'delay' | 'until' | 'signal';
export const TIMER_MODES: readonly TimerMode[] = ['delay', 'until', 'signal'];

export interface TimerConfig {
  mode: TimerMode;
  duration?: FlowDuration;
  field?: string;
  signal?: string;
}

/** 信号名格式（与后端校验一致） */
export const SIGNAL_PATTERN = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/;

/** 步骤节点的类型：人工任务 / 抄送 / 定时等待 / 自动任务 / 子流程 */
export type StepKind = 'task' | 'cc' | 'timer' | 'service' | 'sub';

/** 节点上某个表单字段的权限（由使用流程的业务域解释，如工单） */
export type FieldPermission = 'hidden' | 'readonly' | 'editable' | 'required';
export const FIELD_PERMISSIONS: readonly FieldPermission[] = [
  'readonly',
  'editable',
  'required',
  'hidden',
];
/** 字段码格式（与工单模板的字段码一致） */
export const FIELD_CODE_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,31}$/;
/** 单个节点的字段权限条数上限（通用的与各表单专属的合计，与后端校验一致） */
export const FIELD_PERMISSION_MAX = 300;

/**
 * 一条字段权限（设计器里按行编辑）。form 是这条权限所属的表单（使用该流程的表单的标识，
 * 工单为模板 ID）；不填 = 对所有使用该流程的表单生效。同一字段在某张表单上有专属的行时，
 * 那张表单以专属的为准。
 */
export interface FieldPermissionRow {
  form?: string;
  field: string;
  perm: FieldPermission;
}

/** 字段权限行里哪些不合法：字段码格式不对，或与前面同一张表单的行重复 */
export const invalidPermissionRows = (
  rows: readonly FieldPermissionRow[],
): Set<number> => {
  const bad = new Set<number>();
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const key = `${row.form ?? ''}/${row.field}`;
    if (!FIELD_CODE_PATTERN.test(row.field) || seen.has(key)) {
      bad.add(index);
    }
    seen.add(key);
  });
  return bad;
};

type PermissionMap = Record<string, FieldPermission>;

/**
 * 字段权限行 → 后端的两张映射：通用的（字段码 → 权限）与各表单专属的（表单 → 字段码 →
 * 权限）；不合法的行不输出（设计器里已标红）。
 */
const permissionsOf = (
  rows?: readonly FieldPermissionRow[],
): { shared?: PermissionMap; byForm?: Record<string, PermissionMap> } => {
  if (!rows?.length) return {};
  const bad = invalidPermissionRows(rows);
  const shared: PermissionMap = {};
  const byForm: Record<string, PermissionMap> = {};
  rows.forEach((row, index) => {
    if (bad.has(index)) return;
    if (row.form) {
      byForm[row.form] ??= {};
      byForm[row.form][row.field] = row.perm;
    } else {
      shared[row.field] = row.perm;
    }
  });
  return {
    shared: Object.keys(shared).length ? shared : undefined,
    byForm: Object.keys(byForm).length ? byForm : undefined,
  };
};

/** 步骤节点（非分支组）。按 kind 取用对应的配置；assignee 只对 task / cc 有意义 */
export interface StepNode {
  kind: StepKind;
  id: string;
  name: string;
  assignee: Assignee;
  /** 拒绝后退回到的节点 ID；空 = 流程以「已拒绝」结束（仅 task） */
  rejectTo?: string;
  /** 处理时限（仅 task，可选） */
  timeout?: TaskTimeout;
  /** 表单字段权限（task / cc，可选）：未列出的字段在该节点只读可见 */
  formPermissions?: FieldPermissionRow[];
  /** 定时配置（timer） */
  timer?: TimerConfig;
  /** 自动任务调用的 Webhook 端点（service）；label 仅设计器回显用 */
  service?: { webhookId: string; label?: string };
  /** 子流程（sub）：按流程标识发起；label 仅设计器回显用 */
  subProcess?: { definitionKey: string; label?: string };
}

/** 是否为「有处理人」的节点（人工任务 / 抄送） */
export const hasAssignee = (node: StepNode): boolean =>
  node.kind === 'task' || node.kind === 'cc';

/** 条件的一行：字段 运算符 值 */
export interface ConditionRow {
  field: string;
  op: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'contains';
  value: string;
  /**
   * 值的类型；不填 = 自动（形如数字 / true / false 的按数字 / 布尔，其余按文本）。
   * 表单里用文本保存的数字（工号、编码）须显式选「文本」，否则比较时类型不符、条件恒不命中。
   */
  valueType?: ConditionValueType;
}

export type ConditionValueType = 'string' | 'number' | 'bool';

/** 分支条件：可视化行（且 / 或）或手写表达式 */
export interface BranchCondition {
  mode: 'builder' | 'expr';
  join: '&&' | '||';
  rows: ConditionRow[];
  expr: string;
}

/** 分支末尾的去向：汇合后继续 / 跳转到指定节点 / 直接结束流程 */
export type BranchEnd =
  | { type: 'join' }
  | { type: 'jump'; to: string }
  | { type: 'end' };

export interface Branch {
  id: string;
  name: string;
  /** 条件分支用；默认分支与并行分支没有条件 */
  condition?: BranchCondition;
  isDefault?: boolean;
  nodes: FlowNode[];
  /** 仅条件分支可改；并行 / 包容分支恒为 join */
  end: BranchEnd;
}

/**
 * 分支组的类型：
 * - exclusive 条件分支：只走第一条条件成立的分支；
 * - parallel 并行分支：全部分支同时走，等齐后汇合；
 * - inclusive 包容分支：走全部条件成立的分支（都不成立走默认分支），等齐被走到的那些后汇合。
 */
export type GroupMode = 'exclusive' | 'parallel' | 'inclusive';

/** 分支是否带条件（条件分支 / 包容分支） */
export const isConditional = (mode: GroupMode): boolean => mode !== 'parallel';
/** 分支是否必须汇合（并行 / 包容：执行位置要在配对的汇聚处等齐，不能跳走或结束） */
export const mustJoin = (mode: GroupMode): boolean => mode !== 'exclusive';

/** 分支组：分叉与汇聚成对 */
export interface BranchGroup {
  kind: 'branch';
  id: string;
  mode: GroupMode;
  branches: Branch[];
}

export type FlowNode = StepNode | BranchGroup;

export interface Flow {
  nodes: FlowNode[];
  /** 流程管理员（处理人为空时的兜底处理人） */
  admins: string[];
  adminLabels?: Record<string, string>;
}

/** 后端图的节点 / 连线（只列设计器会写的字段） */
interface GraphNode {
  id: string;
  type: string;
  name?: string;
  assignee?: Omit<Assignee, 'rules'> & {
    rules: Omit<AssigneeRule, 'labels'>[];
  };
  onReject?: { to: string };
  join?: string;
  timeout?: FlowDuration & { action: TimeoutAction; remind?: FlowDuration };
  formPermissions?: Record<string, FieldPermission>;
  formPermissionsByForm?: Record<string, Record<string, FieldPermission>>;
  timer?: TimerConfig;
  service?: { webhookId: string };
  subProcess?: { definitionKey: string };
}
interface GraphEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  priority?: number;
  isDefault?: boolean;
  jump?: boolean;
}

const START = 'start';
const END = 'end';

/** 分支组类型 → 后端的网关节点类型 */
const GATEWAY_TYPE: Record<GroupMode, string> = {
  exclusive: 'exclusiveGateway',
  parallel: 'parallelGateway',
  inclusive: 'inclusiveGateway',
};

let seq = 0;
/** 生成设计器内唯一的节点 ID（时间戳 + 序号；只需在一张图内唯一） */
export const newId = (prefix: string): string => {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}${seq.toString(36)}`;
};

export const emptyCondition = (): BranchCondition => ({
  mode: 'builder',
  join: '&&',
  rows: [{ field: '', op: '==', value: '' }],
  expr: '',
});

/** 新建一个空流程 */
export const emptyFlow = (): Flow => ({ nodes: [], admins: [] });

export const newStep = (kind: StepKind, name: string): StepNode => ({
  kind,
  id: newId(kind),
  name,
  assignee: { rules: [], mode: 'any', onEmpty: 'skip' },
  timer:
    kind === 'timer'
      ? { mode: 'delay', duration: { value: 1, unit: 'hour' } }
      : undefined,
  service: kind === 'service' ? { webhookId: '' } : undefined,
  subProcess: kind === 'sub' ? { definitionKey: '' } : undefined,
});

/** 时长 → 后端字段（workTime 为假时不输出） */
const durationOf = (d: FlowDuration): FlowDuration => ({
  // 后端是整数字段：输入过程中的小数（1.5）取整后再输出
  value: Math.round(d.value),
  unit: d.unit,
  workTime: d.workTime || undefined,
});

/** 步骤节点 → 后端图的节点 */
const stepToGraph = (node: StepNode): GraphNode => {
  switch (node.kind) {
    case 'timer': {
      const timer = node.timer ?? { mode: 'delay' as const };
      return {
        id: node.id,
        type: 'timer',
        name: node.name,
        // 只输出当前等待方式用得到的字段
        timer: {
          mode: timer.mode,
          duration:
            timer.mode === 'delay' && timer.duration
              ? durationOf(timer.duration)
              : undefined,
          field: timer.mode === 'until' ? (timer.field ?? '') : undefined,
          signal: timer.mode === 'signal' ? (timer.signal ?? '') : undefined,
        },
      };
    }
    case 'service':
      return {
        id: node.id,
        type: 'serviceTask',
        name: node.name,
        service: { webhookId: node.service?.webhookId ?? '' },
      };
    case 'sub':
      return {
        id: node.id,
        type: 'subProcess',
        name: node.name,
        subProcess: { definitionKey: node.subProcess?.definitionKey ?? '' },
      };
    default: {
      const task = node.kind === 'task';
      const timeout = task ? node.timeout : undefined;
      return {
        id: node.id,
        type: task ? 'userTask' : 'cc',
        name: node.name,
        assignee: {
          mode: task ? node.assignee.mode : undefined,
          onEmpty: node.assignee.onEmpty,
          rules: node.assignee.rules.map(({ labels: _labels, ...r }) =>
            r.level === undefined ? r : { ...r, level: Math.round(r.level) },
          ),
        },
        onReject: task && node.rejectTo ? { to: node.rejectTo } : undefined,
        formPermissions: permissionsOf(node.formPermissions).shared,
        formPermissionsByForm: permissionsOf(node.formPermissions).byForm,
        timeout: timeout
          ? {
              ...durationOf(timeout),
              action: timeout.action,
              // 提前量与时限同单位、同日历
              remind: timeout.remind
                ? durationOf({ ...timeout, value: timeout.remind })
                : undefined,
            }
          : undefined,
      };
    }
  }
};

export const newBranch = (
  name: string,
  opts?: { isDefault?: boolean; conditional?: boolean },
): Branch => ({
  id: newId('br'),
  name,
  isDefault: opts?.isDefault,
  condition:
    opts?.conditional && !opts.isDefault ? emptyCondition() : undefined,
  nodes: [],
  end: { type: 'join' },
});

/** 字段一律用下标访问：字段码可能是表达式语言的保留字（in / as / package…）或含特殊字符 */
const fieldRef = (field: string): string => `form[${JSON.stringify(field)}]`;

const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * 值字面量。显式类型：文本恒加引号；数字 / 布尔的值不合法时退回文本（由人看得出不对，
 * 而不是生成一个语法错误的表达式）。未指定类型时按值的样子推断。
 */
const literal = (value: string, type?: ConditionValueType): string => {
  const v = value.trim();
  const numeric = NUMBER_PATTERN.test(v);
  const bool = v === 'true' || v === 'false';
  if (type === 'string') return JSON.stringify(value);
  if (type === 'number') return numeric ? v : JSON.stringify(value);
  if (type === 'bool') return bool ? v : JSON.stringify(value);
  return numeric || bool ? v : JSON.stringify(value);
};

/** 条件行是否完全空白（字段与值都没填；这样的行被忽略） */
const blankRow = (r: ConditionRow): boolean =>
  r.field.trim() === '' && r.value === '';

/**
 * 条件行是否只填了一半：缺字段，或缺值。显式选了「文本」类型的空值是合法的
 * （与空串比较），「包含」的空值没有意义。
 */
const incompleteRow = (r: ConditionRow): boolean => {
  if (blankRow(r)) return false;
  if (r.field.trim() === '') return true;
  if (r.value !== '') return false;
  return r.op === 'contains' || r.valueType !== 'string';
};

/** 可视化条件里是否有只填了一半的行（此时不生成表达式，由校验报「条件缺失」） */
export const conditionIncomplete = (c?: BranchCondition): boolean =>
  !!c && c.mode === 'builder' && c.rows.some(incompleteRow);

/**
 * 分支条件 → CEL 表达式。完全空白的行被忽略；有只填了一半的行时整条条件返回空串
 * （由校验报「条件缺失」、拦住发布）——不能悄悄丢掉半行，把「A 且 B」发布成「A」。
 */
export const conditionToExpr = (c?: BranchCondition): string => {
  if (!c) return '';
  if (c.mode === 'expr') return c.expr.trim();
  if (conditionIncomplete(c)) return '';
  const parts = c.rows
    .filter((r) => !blankRow(r))
    .map((r) =>
      r.op === 'contains'
        ? `string(${fieldRef(r.field.trim())}).contains(${JSON.stringify(r.value)})`
        : `${fieldRef(r.field.trim())} ${r.op} ${literal(r.value, r.valueType)}`,
    );
  if (parts.length <= 1) return parts[0] ?? '';
  return parts.map((p) => `(${p})`).join(` ${c.join} `);
};

/** 深度优先遍历全部节点（含分支内） */
export function* walkNodes(nodes: readonly FlowNode[]): Generator<FlowNode> {
  for (const node of nodes) {
    yield node;
    if (node.kind === 'branch') {
      for (const branch of node.branches) yield* walkNodes(branch.nodes);
    }
  }
}

/** 全部人工任务节点（拒绝去向 / 跳转目标的候选） */
export const listTasks = (flow: Flow): StepNode[] =>
  [...walkNodes(flow.nodes)].filter((n): n is StepNode => n.kind === 'task');

/**
 * 节点所在的并行分支路径（由外到内的「分叉#分支」标签）。跳转与拒绝去向只能指向
 * 同一并行分支内的节点，否则并行分支无法全部到达汇聚（与后端校验同一规则）。
 */
export const parallelPathOf = (flow: Flow, id: string): string | undefined => {
  const visit = (
    nodes: readonly FlowNode[],
    path: string,
  ): string | undefined => {
    for (const node of nodes) {
      if (node.id === id) return path;
      if (node.kind !== 'branch') continue;
      for (const branch of node.branches) {
        if (branch.id === id) return path;
        const inner = mustJoin(node.mode)
          ? `${path}/${node.id}#${branch.id}`
          : path;
        const found = visit(branch.nodes, inner);
        if (found !== undefined) return found;
      }
    }
    return undefined;
  };
  return visit(flow.nodes, '');
};

/**
 * 结构 → 后端图（nodes / edges / settings），并把结构本身放进 design 供下次还原。
 * 起止节点的名称会随图保存并出现在后端的流转记录 / 模拟步骤里，按保存时的语言生成。
 */
export const toGraph = (flow: Flow, t: Translate): Record<string, unknown> => {
  const nodes: GraphNode[] = [
    { id: START, type: 'start', name: t('component.flow.node.start') },
  ];
  const edges: GraphEdge[] = [];
  let edgeSeq = 0;
  const link = (source: string, target: string, extra?: Partial<GraphEdge>) => {
    edgeSeq += 1;
    edges.push({ id: `e${edgeSeq}`, source, target, ...extra });
  };
  /** 分支入口连线的 ID 带上分支 ID：后端按连线报的问题（条件缺失等）据此定位到分支卡片 */
  const entryOf = (branchId: string, extra: Partial<GraphEdge>) => ({
    ...extra,
    id: `in_${branchId}`,
  });

  /**
   * 把一段节点序列接在 from 之后，返回这段序列的出口节点 ID；first 为接入这段序列的
   * 第一条连线的附加属性（分支条件等）。
   *
   * 出口为 undefined 表示「到不了这里」：前面有一个分支组的所有分支都跳走或结束了。
   * 其后的节点照常写进图里但不连线——后端校验据此报「不可达」并定位到节点、拦住发布；
   * 绝不能悄悄丢掉用户画出来的节点，也不能生成没有起点的连线。
   */
  const chain = (
    seqNodes: readonly FlowNode[],
    from: string | undefined,
    first?: Partial<GraphEdge>,
  ): { tail?: string; pending?: Partial<GraphEdge> } => {
    let tail = from;
    let pending = first;
    const enter = (id: string) => {
      if (tail !== undefined) link(tail, id, pending);
      pending = undefined;
    };
    for (const node of seqNodes) {
      if (node.kind !== 'branch') {
        nodes.push(stepToGraph(node));
        enter(node.id);
        tail = node.id;
        continue;
      }
      const paired = mustJoin(node.mode);
      const gateway = GATEWAY_TYPE[node.mode];
      const join = `${node.id}_join`;
      nodes.push({
        id: node.id,
        type: gateway,
        // 并行 / 包容网关的分叉须指明配对的汇聚
        join: paired ? join : undefined,
      });
      enter(node.id);
      let reachesJoin = false;
      node.branches.forEach((branch, index) => {
        const entry: Partial<GraphEdge> = !isConditional(node.mode)
          ? {}
          : branch.isDefault
            ? { isDefault: true }
            : {
                condition: conditionToExpr(branch.condition),
                priority: index + 1,
              };
        const done = chain(branch.nodes, node.id, entryOf(branch.id, entry));
        // 分支内部已经走不到末尾（嵌套的分支组全部跳走 / 结束）：没有出口可连
        if (done.tail === undefined) return;
        const end = paired ? { type: 'join' as const } : branch.end;
        // 分支出口连线的 ID 同样带上分支 ID（空分支的出口就是入口连线，沿用入口的 ID）：
        // 后端按连线报的问题（自环、重复连线等）据此定位到分支卡片
        const out = { id: `out_${branch.id}`, ...done.pending };
        if (end.type === 'jump') {
          link(done.tail, end.to, { ...out, jump: true });
        } else if (end.type === 'end') {
          link(done.tail, END, out);
        } else {
          link(done.tail, join, done.pending);
          reachesJoin = true;
        }
      });
      if (reachesJoin) {
        nodes.push({ id: join, type: gateway });
        tail = join;
      } else {
        tail = undefined;
      }
    }
    return { tail, pending };
  };

  const done = chain(flow.nodes, START);
  nodes.push({ id: END, type: 'end', name: t('component.flow.node.end') });
  if (done.tail !== undefined) link(done.tail, END, done.pending);
  return {
    nodes,
    edges,
    settings: { admins: flow.admins },
    design: slimDesign(flow),
  };
};

/** 规则里带显示名的取值（用户 / 角色 / 部门 / 值班组 / 值班表） */
const labeledKeys = (rule: AssigneeRule): string[] => [
  ...(rule.userIds ?? []),
  ...(rule.roleCodes ?? []),
  ...(rule.deptId ? [rule.deptId] : []),
  ...(rule.groupId ? [rule.groupId] : []),
  ...(rule.scheduleId ? [rule.scheduleId] : []),
];
/** 显示名在共享表里的键：按规则类型区分，避免用户 ID 与角色编码撞名 */
const labelKey = (kind: AssigneeRuleKind, key: string) => `${kind}:${key}`;

/** 随图保存的结构（精简版）：slim 标记 + 全图共用的显示名表 */
interface SlimDesign extends Flow {
  slim: 1;
  labels?: Record<string, string>;
}

/**
 * 随图保存的结构。处理人规则已经在图的节点里（nodes[].assignee.rules），不再存第二份：
 * 结构里只留规则之外的部分，显示名全图合并成一张表（同一个人被多个节点引用只存一次）；
 * 没有处理人的节点（定时 / 自动任务 / 子流程）不存 assignee。fromGraph 据图还原。
 * 这样大流程的草稿体积约减半，不至于远未到节点数上限就超出后端的草稿大小限制。
 */
const slimDesign = (flow: Flow): SlimDesign => {
  const labels: Record<string, string> = {};
  const slim = (list: readonly FlowNode[]): FlowNode[] =>
    list.map((node) => {
      if (node.kind === 'branch') {
        return {
          ...node,
          branches: node.branches.map((b) => ({ ...b, nodes: slim(b.nodes) })),
        };
      }
      if (!hasAssignee(node)) {
        const { assignee: _assignee, ...rest } = node;
        return rest as StepNode;
      }
      for (const rule of node.assignee.rules) {
        for (const key of labeledKeys(rule)) {
          const label = rule.labels?.[key];
          if (label) labels[labelKey(rule.kind, key)] = label;
        }
      }
      const { rules: _rules, ...assignee } = node.assignee;
      return { ...node, assignee: assignee as Assignee };
    });
  return {
    ...flow,
    nodes: slim(flow.nodes),
    slim: 1,
    labels: Object.keys(labels).length ? labels : undefined,
  };
};

/**
 * 还原随图保存的结构：补回处理人规则（取自图的节点）与显示名，并给缺失的字段补缺省值
 * （旧版保存的、或经接口手工写入的 design 可能不完整，不能让画布因此报错）。
 */
const restoreDesign = (
  design: Flow & { slim?: number; labels?: Record<string, string> },
  graph: Record<string, unknown>,
): Flow => {
  const graphNodes = new Map<string, GraphNode>();
  for (const n of (graph.nodes as GraphNode[] | undefined) ?? []) {
    if (n && typeof n.id === 'string') graphNodes.set(n.id, n);
  }
  const shared = design.labels ?? {};
  const restore = (list: unknown): FlowNode[] =>
    (Array.isArray(list) ? list : []).map((raw: FlowNode) => {
      if (raw.kind === 'branch') {
        return {
          ...raw,
          branches: (Array.isArray(raw.branches) ? raw.branches : []).map(
            (b) => ({
              ...b,
              nodes: restore(b.nodes),
              end: b.end?.type ? b.end : { type: 'join' as const },
            }),
          ),
        };
      }
      const saved: Partial<Assignee> = raw.assignee ?? {};
      let rules: AssigneeRule[] = Array.isArray(saved.rules) ? saved.rules : [];
      if (design.slim && hasAssignee(raw)) {
        rules = (graphNodes.get(raw.id)?.assignee?.rules ?? []).map((rule) => {
          const labels: Record<string, string> = {};
          for (const key of labeledKeys(rule)) {
            const label = shared[labelKey(rule.kind, key)];
            if (label) labels[key] = label;
          }
          return Object.keys(labels).length ? { ...rule, labels } : { ...rule };
        });
      }
      return {
        ...raw,
        assignee: {
          mode: saved.mode ?? 'any',
          onEmpty: saved.onEmpty ?? 'skip',
          rules,
        },
      };
    });
  const { slim: _slim, labels: _labels, ...flow } = design;
  return { ...flow, nodes: restore(design.nodes), admins: design.admins ?? [] };
};

/**
 * 把不再合法的跳转重置为「汇合后继续」（就地修改）。删除、移动节点后，原本合法的跳转
 * 可能变成自环（跳到分支自己的最后一个节点）或重复连线（空分支跳到出口已直接连着的
 * 节点）；与配置面板可选项同一口径（jumpTargetsOf）。
 */
export const resetInvalidJumps = (flow: Flow): void => {
  for (const node of walkNodes(flow.nodes)) {
    if (node.kind !== 'branch' || mustJoin(node.mode)) continue;
    for (const branch of node.branches) {
      if (branch.end.type !== 'jump') continue;
      const to = branch.end.to;
      if (!jumpTargetsOf(flow, branch.id).some((n) => n.id === to)) {
        branch.end = { type: 'join' };
      }
    }
  }
};

/**
 * 一条条件分支末尾可以跳转到的节点。排除：
 * - 不在同一并行分支内的节点（跨并行边界跳转会让汇聚等不齐或提前合并）；
 * - 分支自己的最后一个节点（自环）；
 * - 分支出口已经直接连着的节点（重复连线，例如空分支跳到同组另一条分支的首节点）。
 */
export const jumpTargetsOf = (flow: Flow, branchId: string): StepNode[] => {
  // 先把这条分支当作「汇合」算一遍图，得到它的出口节点与出口上已有的连线
  const probe = structuredClone(flow);
  let exit: string | undefined;
  for (const node of walkNodes(probe.nodes)) {
    if (node.kind !== 'branch') continue;
    const branch = node.branches.find((b) => b.id === branchId);
    if (!branch) continue;
    branch.end = { type: 'join' };
    const last = branch.nodes[branch.nodes.length - 1];
    if (!last) exit = node.id;
    else exit = last.kind === 'branch' ? `${last.id}_join` : last.id;
    break;
  }
  if (exit === undefined) return [];
  const taken = new Set(
    // 只看连线，节点名称无关紧要
    (toGraph(probe, (id) => id).edges as GraphEdge[])
      .filter((e) => e.source === exit)
      .map((e) => e.target),
  );
  const path = parallelPathOf(flow, branchId);
  return listTasks(flow).filter(
    (n) =>
      n.id !== exit && !taken.has(n.id) && parallelPathOf(flow, n.id) === path,
  );
};

/** 图 → 结构：取回随图保存的 design；没有（非设计器产生的图）返回 undefined */
export const fromGraph = (
  graph?: Record<string, unknown>,
): Flow | undefined => {
  const design = graph?.design as Flow | undefined;
  if (graph && design && Array.isArray(design.nodes)) {
    return restoreDesign(design, graph);
  }
  // 新建流程的骨架草稿：只有开始 / 结束节点，等价于空流程。
  const nodes = (graph?.nodes as { type?: string }[] | undefined) ?? [];
  if (nodes.every((n) => n.type === 'start' || n.type === 'end')) {
    return emptyFlow();
  }
  return undefined;
};

/**
 * 后端校验问题里的节点 / 连线 ID → 画布上的元素 ID（节点或分支）：
 * 分支入口 / 出口连线 in_<分支> / out_<分支> → 分支；分支组的网关 / 汇聚 → 该组的第一条分支。
 * 定位不到返回 undefined（问题只在列表里展示）。
 */
export const locateIssue = (
  flow: Flow,
  issue: { nodeId?: string; edgeId?: string },
): string | undefined => {
  if (issue.edgeId?.startsWith('in_')) return issue.edgeId.slice(3);
  if (issue.edgeId?.startsWith('out_')) return issue.edgeId.slice(4);
  const id = issue.nodeId?.endsWith('_join')
    ? issue.nodeId.slice(0, -'_join'.length)
    : issue.nodeId;
  if (!id) return undefined;
  for (const node of walkNodes(flow.nodes)) {
    if (node.id !== id) continue;
    return node.kind === 'branch' ? node.branches[0]?.id : node.id;
  }
  return undefined;
};

/** 元素（节点 / 分支）所在的节点序列与下标；找不到返回 undefined */
const locateNode = (
  flow: Flow,
  id: string,
): { list: FlowNode[]; index: number } | undefined => {
  const visit = (
    list: FlowNode[],
  ): { list: FlowNode[]; index: number } | undefined => {
    for (let index = 0; index < list.length; index += 1) {
      const node = list[index];
      if (node.id === id) return { list, index };
      if (node.kind !== 'branch') continue;
      for (const branch of node.branches) {
        const found = visit(branch.nodes);
        if (found) return found;
      }
    }
    return undefined;
  };
  return visit(flow.nodes);
};

/**
 * 复制一个节点或一整组分支，副本插在原件之后。返回新流程与副本的 ID；找不到原件返回
 * undefined。入参不被修改。
 *
 * ID 规则：
 * - 副本内的每个节点、分支组、分支都换成新 ID（名称保留）。
 * - 指向「副本内部」的引用（分支末尾的跳转、拒绝后的退回节点）改指对应的新节点，
 *   副本因此与原件结构一致、互不牵连。
 * - 指向「副本之外」的引用保持原样，但只在副本所处位置仍然合法时保留（与配置面板
 *   可选项同一口径：跳转须在 jumpTargetsOf 之内，退回节点须在同一并行分支内）；
 *   不合法的重置为缺省（跳转 → 汇合后继续，退回节点 → 清空）。
 */
export const duplicateNode = (
  flow: Flow,
  nodeId: string,
): { flow: Flow; copyId: string } | undefined => {
  const next = structuredClone(flow);
  const at = locateNode(next, nodeId);
  if (!at) return undefined;
  const copy = structuredClone(at.list[at.index]);

  const ids = new Map<string, string>();
  const rename = (old: string, prefix: string) => {
    const fresh = newId(prefix);
    ids.set(old, fresh);
    return fresh;
  };
  const renameAll = (node: FlowNode) => {
    if (node.kind !== 'branch') {
      node.id = rename(node.id, node.kind);
      return;
    }
    node.id = rename(node.id, 'gw');
    for (const branch of node.branches) {
      branch.id = rename(branch.id, 'br');
      branch.nodes.forEach(renameAll);
    }
  };
  renameAll(copy);
  // 先把内部引用改指新节点
  for (const node of walkNodes([copy])) {
    if (node.kind !== 'branch') {
      if (node.rejectTo)
        node.rejectTo = ids.get(node.rejectTo) ?? node.rejectTo;
      continue;
    }
    for (const branch of node.branches) {
      if (branch.end.type === 'jump') {
        branch.end = {
          type: 'jump',
          to: ids.get(branch.end.to) ?? branch.end.to,
        };
      }
    }
  }
  at.list.splice(at.index + 1, 0, copy);
  // 再按副本所处的位置核对每个引用是否合法
  for (const node of walkNodes([copy])) {
    if (node.kind !== 'branch') {
      if (
        node.rejectTo &&
        (node.rejectTo === node.id ||
          parallelPathOf(next, node.rejectTo) !== parallelPathOf(next, node.id))
      ) {
        node.rejectTo = undefined;
      }
      continue;
    }
    for (const branch of node.branches) {
      if (branch.end.type !== 'jump') continue;
      const to = branch.end.to;
      if (!jumpTargetsOf(next, branch.id).some((n) => n.id === to)) {
        branch.end = { type: 'join' };
      }
    }
  }
  return { flow: next, copyId: copy.id };
};

/** 分支组内的分支数与节点数（折叠后的摘要用；节点数含嵌套分支内的，不含分支组本身） */
export const groupStats = (
  group: BranchGroup,
): { branches: number; nodes: number } => {
  let nodes = 0;
  for (const branch of group.branches) {
    for (const node of walkNodes(branch.nodes)) {
      if (node.kind !== 'branch') nodes += 1;
    }
  }
  return { branches: group.branches.length, nodes };
};

/** 分支组内全部元素的 ID（各级节点与分支；不含分支组自身） */
export const groupElementIds = (group: BranchGroup): string[] => {
  const out: string[] = [];
  for (const branch of group.branches) {
    out.push(branch.id);
    for (const node of walkNodes(branch.nodes)) {
      if (node.kind === 'branch') out.push(...node.branches.map((b) => b.id));
      else out.push(node.id);
    }
  }
  return out;
};

/** 包含某个元素（节点 / 分支）的全部分支组 ID，由外到内；元素不存在返回空 */
export const ancestorGroupsOf = (flow: Flow, id: string): string[] => {
  const visit = (
    nodes: readonly FlowNode[],
    path: string[],
  ): string[] | undefined => {
    for (const node of nodes) {
      if (node.id === id) return path;
      if (node.kind !== 'branch') continue;
      const inner = [...path, node.id];
      for (const branch of node.branches) {
        if (branch.id === id) return inner;
        const found = visit(branch.nodes, inner);
        if (found) return found;
      }
    }
    return undefined;
  };
  return visit(flow.nodes, []) ?? [];
};

/** 版本对比里一个元素的变化 */
export type DiffMark = 'added' | 'removed' | 'modified';

/** 版本对比的结果：两侧各自要标注的元素（节点 / 分支 ID → 变化） */
export interface FlowDiff {
  /** 旧版一侧：被删除的、被修改的 */
  before: Record<string, DiffMark>;
  /** 新版一侧：新增的、被修改的 */
  after: Record<string, DiffMark>;
  added: number;
  removed: number;
  modified: number;
  /** 流程级设置（流程管理员）是否有变化 */
  settings: boolean;
}

/**
 * 参与对比的内容（按元素 ID 配对）。节点：名称、类型、处理人规则 / 多人模式 /
 * 为空策略、拒绝后的退回节点；分支：名称、所属分支组的类型、是否默认分支、条件
 * （按生成的表达式比，改了写法但含义不变不算修改）、末尾去向。
 * 只用于回显的显示名（labels）不参与；位置变化不算修改。
 */
const diffSignatures = (flow: Flow): Map<string, string> => {
  const out = new Map<string, string>();
  for (const node of walkNodes(flow.nodes)) {
    if (node.kind !== 'branch') {
      out.set(
        node.id,
        JSON.stringify([
          node.kind,
          node.name,
          node.kind === 'task' ? (node.assignee.mode ?? 'any') : '',
          node.assignee.onEmpty ?? 'skip',
          node.assignee.rules.map(({ labels: _labels, ...rule }) => rule),
          node.rejectTo ?? '',
          // 以生成的后端字段为准：时限、定时、自动任务、子流程的配置
          (({
            timeout,
            timer,
            service,
            subProcess,
            formPermissions,
            formPermissionsByForm,
          }) => [
            // 字段权限按表单、字段码排序后比较：行的先后不算改动
            Object.entries({
              '': formPermissions ?? {},
              ...formPermissionsByForm,
            })
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([form, perms]) => [
                form,
                Object.entries(perms).sort(([a], [b]) => a.localeCompare(b)),
              ]),
            timeout ?? null,
            timer ?? null,
            service ?? null,
            subProcess ?? null,
          ])(stepToGraph(node)),
        ]),
      );
      continue;
    }
    for (const branch of node.branches) {
      out.set(
        branch.id,
        JSON.stringify([
          node.mode,
          branch.name,
          !!branch.isDefault,
          isConditional(node.mode) ? conditionToExpr(branch.condition) : '',
          mustJoin(node.mode) ? { type: 'join' } : branch.end,
        ]),
      );
    }
  }
  return out;
};

/** 对比两份流程（旧 → 新），得到两侧各自要标注的元素 */
export const diffFlows = (before: Flow, after: Flow): FlowDiff => {
  const a = diffSignatures(before);
  const b = diffSignatures(after);
  const diff: FlowDiff = {
    before: {},
    after: {},
    added: 0,
    removed: 0,
    modified: 0,
    settings:
      JSON.stringify([...before.admins].sort()) !==
      JSON.stringify([...after.admins].sort()),
  };
  for (const [id, signature] of a) {
    const other = b.get(id);
    if (other === undefined) {
      diff.before[id] = 'removed';
      diff.removed += 1;
    } else if (other !== signature) {
      diff.before[id] = 'modified';
      diff.after[id] = 'modified';
      diff.modified += 1;
    }
  }
  for (const id of b.keys()) {
    if (!a.has(id)) {
      diff.after[id] = 'added';
      diff.added += 1;
    }
  }
  return diff;
};
