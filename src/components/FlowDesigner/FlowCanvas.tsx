/**
 * 流程画布：把结构化的流程渲染为自上而下的流程图，可编辑或只读。
 *
 * 版面完全由结构决定（顺序纵向堆叠、分支横向排开并居中），没有可拖动的坐标：
 * 同一份流程在任何人屏幕上长得一样，增删节点后自动保持整齐。编辑只有三种动作——
 * 在连线上的「+」处插入节点、成组添加 / 删除分支、设置分支末尾的去向。
 * 只读模式（不传 onChange）用于运行态：按 nodeStates 高亮已走过 / 进行中的节点。
 */
import {
  ApartmentOutlined,
  ApiOutlined,
  AuditOutlined,
  BranchesOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CopyOutlined,
  DownOutlined,
  ForkOutlined,
  PlusOutlined,
  SendOutlined,
  ShareAltOutlined,
  UpOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { App, Badge, Button, Dropdown, Tag, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import clsx from 'clsx';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useT } from '@/utils/i18n';
import {
  ancestorGroupsOf,
  type Branch,
  type BranchGroup,
  type DiffMark,
  duplicateNode,
  type Flow,
  type FlowNode,
  type GroupMode,
  groupElementIds,
  groupStats,
  hasAssignee,
  isConditional,
  mustJoin,
  newBranch,
  newId,
  newStep,
  resetInvalidJumps,
  type StepKind,
  type StepNode,
} from './model';

/** 步骤节点的图标 */
export const STEP_ICON: Record<StepKind, React.ReactNode> = {
  task: <AuditOutlined />,
  cc: <SendOutlined />,
  timer: <ClockCircleOutlined />,
  service: <ApiOutlined />,
  sub: <ApartmentOutlined />,
};

/** 分支组的图标 */
export const GROUP_ICON: Record<GroupMode, React.ReactNode> = {
  exclusive: <BranchesOutlined />,
  parallel: <ShareAltOutlined />,
  inclusive: <ForkOutlined />,
};

const STEP_KINDS: readonly StepKind[] = [
  'task',
  'cc',
  'timer',
  'service',
  'sub',
];
const GROUP_MODES: readonly GroupMode[] = [
  'exclusive',
  'parallel',
  'inclusive',
];

/** 运行态的节点状态 */
export type NodeState = 'done' | 'active' | 'rejected';

/** 画布与节点卡片的样式；通用流程图的只读视图（RawGraphView）共用同一套卡片外观 */
export const useFlowStyles = createStyles(({ token, css }) => ({
  canvas: css`
    display: flex;
    justify-content: safe center;
    box-sizing: border-box;
    height: 100%;
    padding: 24px 32px 40px;
    overflow: auto;
    background-color: ${token.colorFillQuaternary};
    background-image: radial-gradient(
      ${token.colorBorderSecondary} 1px,
      transparent 1px
    );
    background-size: 16px 16px;
    border-radius: ${token.borderRadiusLG}px;
  `,
  column: css`
    display: flex;
    flex-direction: column;
    align-items: center;
  `,
  /** 连线：竖线，中间可放「+」 */
  wire: css`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2px;
    min-height: 44px;
    background: ${token.colorBorder};
  `,
  wireGrow: css`
    flex: 1;
  `,
  add: css`
    position: absolute;
    z-index: 1;
    box-shadow: ${token.boxShadowTertiary};

    /* antd 的圆形按钮选择器带三个类，宽度会被它盖回 32px 而成椭圆，这里抬高优先级 */
    &&&& {
      width: 22px;
      min-width: 22px;
      height: 22px;
      padding: 0;
      font-size: 12px;
      border-radius: 50%;
    }
  `,
  card: css`
    position: relative;
    width: 220px;
    overflow: hidden;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    box-shadow: ${token.boxShadowTertiary};
    transition:
      border-color ${token.motionDurationMid},
      box-shadow ${token.motionDurationMid};
  `,
  clickable: css`
    cursor: pointer;
    &:hover {
      border-color: ${token.colorPrimaryBorderHover};
      box-shadow: ${token.boxShadowSecondary};
    }
    &:hover .flow-remove,
    &:focus-within .flow-remove {
      opacity: 1;
    }
    &:focus-visible {
      border-color: ${token.colorPrimaryBorderHover};
      outline: 2px solid ${token.colorPrimaryBorder};
      outline-offset: 1px;
    }
  `,
  selected: css`
    border-color: ${token.colorPrimary};
    box-shadow: 0 0 0 2px ${token.colorPrimaryBg};
  `,
  invalid: css`
    border-color: ${token.colorErrorBorderHover};
  `,
  stateActive: css`
    border-color: ${token.colorPrimary};
    box-shadow: 0 0 0 2px ${token.colorPrimaryBg};
  `,
  stateDone: css`
    border-color: ${token.colorSuccessBorderHover};
  `,
  stateRejected: css`
    border-color: ${token.colorErrorBorderHover};
  `,
  stateIdle: css`
    opacity: 0.6;
  `,
  /** 版本对比：新增 / 删除 / 修改的元素用柔和的底色区分 */
  markAdded: css`
    background: ${token.colorSuccessBg};
    border-color: ${token.colorSuccessBorder};
  `,
  markRemoved: css`
    background: ${token.colorErrorBg};
    border-color: ${token.colorErrorBorder};
  `,
  markModified: css`
    background: ${token.colorWarningBg};
    border-color: ${token.colorWarningBorder};
  `,
  cardHead: css`
    display: flex;
    gap: 6px;
    align-items: center;
    height: 28px;
    padding: 0 10px;
    font-weight: 500;
    font-size: ${token.fontSizeSM}px;
  `,
  headStart: css`
    color: ${token.colorTextSecondary};
    background: ${token.colorFillTertiary};
  `,
  headTask: css`
    color: ${token.colorPrimaryText};
    background: ${token.colorPrimaryBg};
  `,
  headCc: css`
    color: ${token.colorInfoText};
    background: ${token.colorFillSecondary};
  `,
  headBranch: css`
    color: ${token.colorWarningText};
    background: ${token.colorWarningBg};
  `,
  /** 系统自动处理的节点（定时 / 自动任务 / 子流程）：中性色，与需要人处理的节点区分 */
  headAuto: css`
    color: ${token.colorTextSecondary};
    background: ${token.colorFillSecondary};
  `,
  headTitle: css`
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  remove: css`
    color: ${token.colorTextTertiary};
    opacity: 0;
    transition: opacity ${token.motionDurationMid};
    &:hover,
    &:focus-visible {
      color: ${token.colorError};
    }
  `,
  /** 卡片头部的非破坏性动作（复制）：与删除同样悬停才出现，悬停为主色 */
  headAction: css`
    color: ${token.colorTextTertiary};
    opacity: 0;
    transition: opacity ${token.motionDurationMid};
    &:hover,
    &:focus-visible {
      color: ${token.colorPrimary};
    }
  `,
  cardBody: css`
    min-height: 40px;
    padding: 8px 10px;
    color: ${token.colorText};
    font-size: ${token.fontSizeSM}px;
    line-height: 1.6;
    word-break: break-all;
  `,
  placeholder: css`
    color: ${token.colorTextQuaternary};
  `,
  problem: css`
    color: ${token.colorErrorHover};
  `,
  terminal: css`
    padding: 4px 16px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    background: ${token.colorFillSecondary};
    border-radius: 999px;
  `,
  group: css`
    display: flex;
    flex-direction: column;
    align-items: center;
  `,
  /** 分支组顶部的一排小按钮（添加分支 / 复制 / 折叠），压在分叉横线上 */
  groupBar: css`
    z-index: 1;
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: -13px;
  `,
  groupHead: css`
    display: flex;
    gap: 4px;
    align-items: center;
    height: 26px;
    padding: 0 10px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorder};
    border-radius: 999px;
  `,
  groupHeadAction: css`
    font-family: inherit;
    line-height: inherit;
    cursor: pointer;
    &:hover,
    &:focus-visible {
      color: ${token.colorPrimary};
      border-color: ${token.colorPrimaryBorderHover};
      outline: none;
    }
  `,
  branches: css`
    display: flex;
    align-items: stretch;
  `,
  /** 一条分支：上下各有一段横线把同组分支连起来，首尾分支只画半段 */
  branch: css`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 20px;
    &::before,
    &::after {
      position: absolute;
      right: 0;
      left: 0;
      height: 2px;
      background: ${token.colorBorder};
      content: '';
    }
    &::before {
      top: 0;
    }
    &::after {
      bottom: 0;
    }
    &:first-child::before,
    &:first-child::after {
      left: 50%;
    }
    &:last-child::before,
    &:last-child::after {
      right: 50%;
    }
    &:only-child::before,
    &:only-child::after {
      display: none;
    }
  `,
  /** 分支不汇合（跳转 / 结束）：不画底部横线 */
  branchOpen: css`
    &::after {
      display: none;
    }
  `,
  endTag: css`
    margin: 0;
  `,
}));

type Styles = ReturnType<typeof useFlowStyles>['styles'];

/** 让非按钮元素可用键盘触发：Enter / 空格等同点击 */
const onActivate =
  (run: () => void) => (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    run();
  };

export interface FlowCanvasProps {
  flow: Flow;
  /** 不传则为只读 */
  onChange?: (flow: Flow) => void;
  selectedId?: string;
  /** 选中元素；传 undefined 表示取消选中（如折叠了它所在的分支组） */
  onSelect?: (id?: string) => void;
  /** 元素 ID（节点 / 分支）→ 问题说明 */
  issues?: Readonly<Record<string, string[]>>;
  /** 运行态：节点 ID → 状态；传入后未出现的节点淡出 */
  nodeStates?: Readonly<Record<string, NodeState>>;
  /** 版本对比：元素 ID（节点 / 分支）→ 新增 / 删除 / 修改 */
  marks?: Readonly<Record<string, DiffMark>>;
  /** 节点卡片的摘要文字（处理人等）；空串表示未配置 */
  summaryOf: (node: StepNode) => string;
  /** 分支卡片的条件摘要 */
  conditionOf: (branch: Branch) => string;
  /** 节点 ID → 名称（跳转去向展示用） */
  nameOf: (id: string) => string;
}

/** 在克隆出的流程里按容器 ID 找到节点序列（root = 顶层，其余为分支 ID） */
const findList = (flow: Flow, containerId: string): FlowNode[] | undefined => {
  if (containerId === 'root') return flow.nodes;
  const visit = (nodes: FlowNode[]): FlowNode[] | undefined => {
    for (const node of nodes) {
      if (node.kind !== 'branch') continue;
      for (const branch of node.branches) {
        if (branch.id === containerId) return branch.nodes;
        const found = visit(branch.nodes);
        if (found) return found;
      }
    }
    return undefined;
  };
  return visit(flow.nodes);
};

/** 按 ID 找节点（含分支内） */
const findCopy = (flow: Flow, id: string): FlowNode | undefined => {
  const visit = (nodes: readonly FlowNode[]): FlowNode | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
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

/** 清除指向已删除节点的拒绝去向与跳转 */
const pruneReferences = (flow: Flow) => {
  const alive = new Set<string>();
  const collect = (nodes: FlowNode[]) => {
    for (const node of nodes) {
      alive.add(node.id);
      if (node.kind === 'branch') {
        for (const b of node.branches) collect(b.nodes);
      }
    }
  };
  collect(flow.nodes);
  const fix = (nodes: FlowNode[]) => {
    for (const node of nodes) {
      if (node.kind === 'branch') {
        for (const b of node.branches) {
          if (b.end.type === 'jump' && !alive.has(b.end.to)) {
            b.end = { type: 'join' };
          }
          fix(b.nodes);
        }
      } else if (node.rejectTo && !alive.has(node.rejectTo)) {
        node.rejectTo = undefined;
      }
    }
  };
  fix(flow.nodes);
};

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  flow,
  onChange,
  selectedId,
  onSelect,
  issues,
  nodeStates,
  marks,
  summaryOf,
  conditionOf,
  nameOf,
}) => {
  const { styles } = useFlowStyles();
  const { modal } = App.useApp();
  const t = useT();
  const editable = !!onChange;
  // 折叠的分支组：只是查看方式，不写进流程图
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const flowRef = useRef(flow);
  flowRef.current = flow;

  // 选中（含点击问题定位）的元素若在折叠的分支组里，自动展开它所在的各级分支组
  useEffect(() => {
    if (!selectedId) return;
    const groups = ancestorGroupsOf(flowRef.current, selectedId);
    setCollapsed((current) =>
      groups.some((id) => current.has(id))
        ? new Set([...current].filter((id) => !groups.includes(id)))
        : current,
    );
  }, [selectedId]);

  const toggleCollapsed = (group: BranchGroup) => {
    const collapsing = !collapsed.has(group.id);
    setCollapsed((current) => {
      const next = new Set(current);
      if (collapsing) next.add(group.id);
      else next.delete(group.id);
      return next;
    });
    // 折叠时里面的元素正被选中：取消选中，免得配置面板对着一个看不见的元素
    if (
      collapsing &&
      selectedId &&
      groupElementIds(group).includes(selectedId)
    ) {
      onSelect?.(undefined);
    }
  };

  /** 删除带内容的元素前确认（空节点 / 空分支直接删，不打断搭建） */
  const confirmRemove = (
    kind: 'node' | 'branch',
    name: string,
    hasContent: boolean,
    run: () => void,
  ) => {
    if (!hasContent) {
      run();
      return;
    }
    modal.confirm({
      title: t(`component.flow.remove.${kind}.title`),
      content: t(`component.flow.remove.${kind}.content`, { name }),
      okButtonProps: { danger: true },
      onOk: run,
    });
  };

  /** 在流程的副本上执行修改并回传（结构是小对象，整体克隆足够快） */
  const mutate = (fn: (draft: Flow) => void) => {
    if (!onChange) return;
    const draft = structuredClone(flow);
    fn(draft);
    pruneReferences(draft);
    // 删除 / 移动后变成自环或重复连线的跳转：回到「汇合后继续」
    resetInvalidJumps(draft);
    onChange(draft);
  };

  const insert = (
    containerId: string,
    index: number,
    kind: StepKind | GroupMode,
  ) => {
    let created = '';
    mutate((draft) => {
      const list = findList(draft, containerId);
      if (!list) return;
      let node: FlowNode;
      if ((STEP_KINDS as readonly string[]).includes(kind)) {
        node = newStep(kind as StepKind, t(`component.flow.node.${kind}`));
      } else {
        const mode = kind as GroupMode;
        const conditional = isConditional(mode);
        const group: BranchGroup = {
          kind: 'branch',
          id: newId('gw'),
          mode,
          branches: [
            newBranch(t('component.flow.branch.name', { n: 1 }), {
              conditional,
            }),
            conditional
              ? newBranch(t('component.flow.branch.default'), {
                  isDefault: true,
                })
              : newBranch(t('component.flow.branch.name', { n: 2 })),
          ],
        };
        node = group;
      }
      list.splice(index, 0, node);
      created = node.kind === 'branch' ? node.branches[0].id : node.id;
    });
    if (created) onSelect?.(created);
  };

  const remove = (containerId: string, id: string) =>
    mutate((draft) => {
      const list = findList(draft, containerId);
      const index = list?.findIndex((n) => n.id === id) ?? -1;
      if (list && index >= 0) list.splice(index, 1);
    });

  /** 复制节点或整组分支，副本插在原件之后并选中 */
  const duplicate = (id: string) => {
    if (!onChange) return;
    const result = duplicateNode(flow, id);
    if (!result) return;
    onChange(result.flow);
    // 复制的是分支组时选中它的第一条分支（分支组本身没有配置面板）
    const copy = findCopy(result.flow, result.copyId);
    onSelect?.(copy?.kind === 'branch' ? copy.branches[0]?.id : result.copyId);
  };

  const addBranch = (groupId: string) =>
    mutate((draft) => {
      const visit = (nodes: FlowNode[]): boolean => {
        for (const node of nodes) {
          if (node.kind !== 'branch') continue;
          if (node.id === groupId) {
            const conditional = isConditional(node.mode);
            // 取第一个未被占用的序号：删过分支、改过名之后也不会重名
            const used = new Set(node.branches.map((b) => b.name));
            let n = 1;
            while (used.has(t('component.flow.branch.name', { n }))) n += 1;
            const branch = newBranch(t('component.flow.branch.name', { n }), {
              conditional,
            });
            // 条件分支的默认分支恒在最后，新分支插在它之前
            node.branches.splice(
              conditional ? node.branches.length - 1 : node.branches.length,
              0,
              branch,
            );
            return true;
          }
          if (node.branches.some((b) => visit(b.nodes))) return true;
        }
        return false;
      };
      visit(draft.nodes);
    });

  /** 删除一条分支；只剩一条时整组解散，剩下分支里的节点并入上层 */
  const removeBranch = (containerId: string, groupId: string, id: string) =>
    mutate((draft) => {
      const list = findList(draft, containerId);
      const index = list?.findIndex((n) => n.id === groupId) ?? -1;
      const group = list?.[index];
      if (!list || !group || group.kind !== 'branch') return;
      group.branches = group.branches.filter((b) => b.id !== id);
      if (group.branches.length <= 1) {
        list.splice(index, 1, ...(group.branches[0]?.nodes ?? []));
      }
    });

  const addMenu = (containerId: string, index: number) => ({
    items: [
      ...(['task', 'cc'] as const).map((kind) => ({
        key: kind,
        icon: STEP_ICON[kind],
        label: t(`component.flow.add.${kind}`),
      })),
      { type: 'divider' as const },
      ...GROUP_MODES.map((mode) => ({
        key: mode,
        icon: GROUP_ICON[mode],
        label: t(`component.flow.add.${mode}`),
      })),
      { type: 'divider' as const },
      ...(['timer', 'service', 'sub'] as const).map((kind) => ({
        key: kind,
        icon: STEP_ICON[kind],
        label: t(`component.flow.add.${kind}`),
      })),
    ],
    onClick: ({ key }: { key: string }) =>
      insert(containerId, index, key as StepKind | GroupMode),
  });

  /** 连线；可编辑时中间带「+」 */
  const wire = (containerId: string, index: number, grow?: boolean) => (
    <div className={clsx(styles.wire, grow && styles.wireGrow)}>
      {editable && (
        <Dropdown menu={addMenu(containerId, index)} trigger={['click']}>
          <Button
            className={styles.add}
            type="primary"
            shape="circle"
            icon={<PlusOutlined />}
            aria-label={t('component.flow.add')}
          />
        </Dropdown>
      )}
    </div>
  );

  /**
   * 运行态下走过的分支：分支卡片本身没有运行状态，里面有节点到达过即视为走过
   * （空分支里没有节点可判断，保持未到达的样子）。
   */
  const takenBranches = new Set<string>();
  if (nodeStates) {
    const visit = (nodes: readonly FlowNode[]): boolean => {
      let reached = false;
      for (const node of nodes) {
        if (node.kind !== 'branch') {
          if (nodeStates[node.id]) reached = true;
          continue;
        }
        for (const branch of node.branches) {
          if (visit(branch.nodes)) {
            takenBranches.add(branch.id);
            reached = true;
          }
        }
      }
      return reached;
    };
    visit(flow.nodes);
  }

  const stateClass = (id: string, s: Styles) => {
    if (!nodeStates) return undefined;
    const state = nodeStates[id];
    if (!state && takenBranches.has(id)) return s.stateDone;
    if (state === 'active') return s.stateActive;
    if (state === 'done') return s.stateDone;
    if (state === 'rejected') return s.stateRejected;
    return s.stateIdle;
  };

  const problemsOf = (id: string) => issues?.[id] ?? [];

  const card = (opts: {
    id: string;
    head: string;
    headClass: string;
    icon: React.ReactNode;
    body: React.ReactNode;
    onRemove?: () => void;
    onCopy?: () => void;
  }) => {
    const problems = problemsOf(opts.id);
    const mark = marks?.[opts.id];
    const node = (
      <div
        className={clsx(
          styles.card,
          onSelect && styles.clickable,
          selectedId === opts.id && styles.selected,
          problems.length > 0 && styles.invalid,
          stateClass(opts.id, styles),
          mark === 'added' && styles.markAdded,
          mark === 'removed' && styles.markRemoved,
          mark === 'modified' && styles.markModified,
        )}
        {...(onSelect && {
          role: 'button',
          tabIndex: 0,
          onClick: () => onSelect(opts.id),
          onKeyDown: onActivate(() => onSelect(opts.id)),
        })}
      >
        <div className={clsx(styles.cardHead, opts.headClass)}>
          {opts.icon}
          <span className={styles.headTitle}>{opts.head}</span>
          {editable && opts.onCopy && (
            <CopyOutlined
              className={clsx(styles.headAction, 'flow-remove')}
              role="button"
              tabIndex={0}
              aria-label={t('component.flow.copy')}
              title={t('component.flow.copy')}
              onClick={(e) => {
                e.stopPropagation();
                opts.onCopy?.();
              }}
              onKeyDown={onActivate(() => opts.onCopy?.())}
            />
          )}
          {editable && opts.onRemove && (
            <CloseOutlined
              className={clsx(styles.remove, 'flow-remove')}
              role="button"
              tabIndex={0}
              aria-label={t('common.action.delete')}
              onClick={(e) => {
                e.stopPropagation();
                opts.onRemove?.();
              }}
              onKeyDown={onActivate(() => opts.onRemove?.())}
            />
          )}
        </div>
        <div className={styles.cardBody}>{opts.body}</div>
      </div>
    );
    return problems.length > 0 ? (
      <Tooltip title={problems.join('；')}>
        <Badge count={problems.length} size="small" offset={[-4, 4]}>
          {node}
        </Badge>
      </Tooltip>
    ) : (
      node
    );
  };

  const stepCard = (containerId: string, node: StepNode) => {
    const summary = summaryOf(node);
    return card({
      id: node.id,
      head: node.name,
      headClass:
        node.kind === 'task'
          ? styles.headTask
          : node.kind === 'cc'
            ? styles.headCc
            : styles.headAuto,
      icon: STEP_ICON[node.kind],
      body: summary || (
        <span className={editable ? styles.problem : styles.placeholder}>
          {t(`component.flow.node.${node.kind}.empty`)}
        </span>
      ),
      onCopy: () => duplicate(node.id),
      onRemove: () =>
        confirmRemove(
          'node',
          node.name,
          // 已经配置过内容的节点删除前确认
          hasAssignee(node) ? node.assignee.rules.length > 0 : !!summary,
          () => remove(containerId, node.id),
        ),
    });
  };

  const branchCard = (
    containerId: string,
    group: BranchGroup,
    branch: Branch,
  ) => {
    let body: React.ReactNode;
    if (!isConditional(group.mode)) {
      body = (
        <span className={styles.placeholder}>
          {t('component.flow.branch.parallel.hint')}
        </span>
      );
    } else if (branch.isDefault) {
      body = (
        <span className={styles.placeholder}>
          {t(
            group.mode === 'inclusive'
              ? 'component.flow.branch.default.hint.inclusive'
              : 'component.flow.branch.default.hint',
          )}
        </span>
      );
    } else {
      const text = conditionOf(branch);
      body = text || (
        <span className={editable ? styles.problem : styles.placeholder}>
          {t('component.flow.branch.condition.empty')}
        </span>
      );
    }
    return card({
      id: branch.id,
      head: branch.name,
      headClass: styles.headBranch,
      icon: GROUP_ICON[group.mode],
      body,
      // 默认分支不可删（条件分支必须有兜底去向）
      onRemove: branch.isDefault
        ? undefined
        : () =>
            confirmRemove('branch', branch.name, branch.nodes.length > 0, () =>
              removeBranch(containerId, group.id, branch.id),
            ),
    });
  };

  const sequence = (
    containerId: string,
    nodes: readonly FlowNode[],
  ): React.ReactNode => (
    <>
      {nodes.map((node, index) => (
        <div className={styles.column} key={node.id}>
          {wire(containerId, index)}
          {node.kind === 'branch'
            ? groupView(containerId, node)
            : stepCard(containerId, node)}
        </div>
      ))}
    </>
  );

  /** 折叠后的分支组：一张摘要卡片，仍然带出里面的问题数、运行状态与版本差异 */
  const collapsedGroup = (group: BranchGroup) => {
    const inner = groupElementIds(group);
    const problems = inner.reduce((n, id) => n + problemsOf(id).length, 0);
    const states = nodeStates ? inner.map((id) => nodeStates[id]) : [];
    const state = states.includes('active')
      ? styles.stateActive
      : states.includes('rejected')
        ? styles.stateRejected
        : states.includes('done')
          ? styles.stateDone
          : nodeStates && styles.stateIdle;
    const stats = groupStats(group);
    const expand = () => toggleCollapsed(group);
    const node = (
      <div
        className={clsx(
          styles.card,
          styles.clickable,
          problems > 0 && styles.invalid,
          state,
          marks && inner.some((id) => marks[id]) && styles.markModified,
        )}
        // 与节点卡片同样的可点击卡片（div + role），保持两者外观与键盘行为一致
        {...{
          role: 'button',
          tabIndex: 0,
          'aria-expanded': false,
          'aria-label': t('component.flow.group.expand'),
          onClick: expand,
          onKeyDown: onActivate(expand),
        }}
      >
        <div className={clsx(styles.cardHead, styles.headBranch)}>
          {GROUP_ICON[group.mode]}
          <span className={styles.headTitle}>
            {t(`component.flow.group.${group.mode}`)}
          </span>
          <DownOutlined />
        </div>
        <div className={styles.cardBody}>
          {t('component.flow.group.collapsed', stats)}
        </div>
      </div>
    );
    return problems > 0 ? (
      <Tooltip
        title={t('component.flow.group.collapsed.issues', { n: problems })}
      >
        <Badge count={problems} size="small" offset={[-4, 4]}>
          {node}
        </Badge>
      </Tooltip>
    ) : (
      node
    );
  };

  const groupView = (containerId: string, group: BranchGroup) =>
    collapsed.has(group.id) ? (
      collapsedGroup(group)
    ) : (
      <div className={styles.group}>
        <div className={styles.groupBar}>
          {editable ? (
            <button
              type="button"
              className={clsx(styles.groupHead, styles.groupHeadAction)}
              onClick={() => addBranch(group.id)}
            >
              <PlusOutlined />
              {t(`component.flow.group.${group.mode}.add`)}
            </button>
          ) : (
            <div className={styles.groupHead}>
              {t(`component.flow.group.${group.mode}`)}
            </div>
          )}
          {editable && (
            <Tooltip title={t('component.flow.group.copy')}>
              <button
                type="button"
                className={clsx(styles.groupHead, styles.groupHeadAction)}
                aria-label={t('component.flow.group.copy')}
                onClick={() => duplicate(group.id)}
              >
                <CopyOutlined />
              </button>
            </Tooltip>
          )}
          <Tooltip title={t('component.flow.group.collapse')}>
            <button
              type="button"
              className={clsx(styles.groupHead, styles.groupHeadAction)}
              aria-label={t('component.flow.group.collapse')}
              aria-expanded
              onClick={() => toggleCollapsed(group)}
            >
              <UpOutlined />
            </button>
          </Tooltip>
        </div>
        <div className={styles.branches}>
          {group.branches.map((branch) => {
            const end = mustJoin(group.mode)
              ? { type: 'join' as const }
              : branch.end;
            return (
              <div
                className={clsx(
                  styles.branch,
                  end.type !== 'join' && styles.branchOpen,
                )}
                key={branch.id}
              >
                <div className={clsx(styles.wire)} />
                {branchCard(containerId, group, branch)}
                {sequence(branch.id, branch.nodes)}
                {wire(branch.id, branch.nodes.length, true)}
                {end.type === 'jump' && (
                  <Tag
                    className={styles.endTag}
                    color="processing"
                    variant="outlined"
                  >
                    {t('component.flow.end.jump', { name: nameOf(end.to) })}
                  </Tag>
                )}
                {end.type === 'end' && (
                  <Tag className={styles.endTag}>
                    {t('component.flow.end.finish')}
                  </Tag>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );

  return (
    <div className={styles.canvas}>
      <div className={styles.column}>
        {/* 运行态：流程既已发起，发起节点恒为「已完成」 */}
        <div className={clsx(styles.card, nodeStates && styles.stateDone)}>
          <div className={clsx(styles.cardHead, styles.headStart)}>
            <UserOutlined />
            <span className={styles.headTitle}>
              {t('component.flow.start')}
            </span>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.placeholder}>
              {t('component.flow.start.hint')}
            </span>
          </div>
        </div>
        {sequence('root', flow.nodes)}
        {wire('root', flow.nodes.length)}
        <div className={styles.terminal}>{t('component.flow.finish')}</div>
      </div>
    </div>
  );
};

export default FlowCanvas;
