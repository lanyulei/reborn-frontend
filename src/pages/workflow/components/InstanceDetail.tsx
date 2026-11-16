/**
 * 流程实例详情（整页）：顶部摘要（标题、状态、基本信息），左栏是流转记录（有业务内容时
 * 换成业务内容，流转记录移到右栏的流程进度里），右栏是当前处理人、等待中的节点（定时 / 自动任务）、子流程和流程图入口（点开在弹窗里看，
 * 高亮当前节点与已走路径）；当前用户可做的动作固定在页面底部（同意 / 拒绝 / 退回 / 转办 /
 * 加签 / 委派 / 撤回；管理视图另有终止 / 改派 / 重试、跳过等待节点 / 投递信号）。
 * 流程详情页直接使用；工单详情页通过 business 补充工单的摘要、表单与评论。
 */
import {
  FooterToolbar,
  ModalForm,
  ProFormRadio,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  Col,
  ConfigProvider,
  Descriptions,
  type DescriptionsProps,
  Empty,
  Flex,
  Form,
  Modal,
  Row,
  Spin,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  branchSummary,
  FlowCanvas,
  fromGraph,
  type NodeState,
  RawGraphView,
  stepSummary,
  walkNodes,
} from '@/components/FlowDesigner';
import { UserSelect } from '@/components/UserSelect';
import { usePermissions } from '@/services/system/permissions';
import {
  addSignTask,
  approveTask,
  cancelInstance,
  delegateTask,
  getInstance,
  listReturnTargets,
  reassignTask,
  rejectTask,
  retryInstanceJob,
  returnTask,
  signalInstance,
  skipInstanceJob,
  terminateInstance,
  transferTask,
} from '@/services/workflow/runtime';
import type {
  InstanceDetail as InstanceDetailData,
  InstanceWait,
  WorkflowHistory,
  WorkflowTaskAssignee,
} from '@/services/workflow/typings';
import { useEnumText, useFormRules, useSubmitter, useT } from '@/utils/i18n';
import {
  ASSIGNEE_STATUS_META,
  fetchWorkflowUsers,
  HISTORY_ACTION_COLOR,
  INSTANCE_STATUS_META,
} from './meta';

const COMMENT_MAX = 1000;
const REASSIGN_MAX = 20;
/** 一次加签的人数上限（与后端校验一致） */
const ADD_SIGN_MAX = 10;
const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const useStyles = createStyles(({ token, css }) => ({
  section: css`
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 20px 0 12px;
    color: ${token.colorText};
    font-weight: 600;
    &::before {
      width: 3px;
      height: 14px;
      background: ${token.colorPrimary};
      border-radius: 2px;
      content: '';
    }
  `,
  /** 整页容器：给底部固定的操作栏让出位置 */
  page: css`
    margin-bottom: 64px;
  `,
  headTitle: css`
    margin: 0 !important;
    font-size: ${token.fontSizeHeading4}px !important;
    word-break: break-word;
  `,
  headMeta: css`
    margin-top: 16px;
  `,
  canvas: css`
    max-height: 70vh;
    overflow: auto;
    border-radius: ${token.borderRadiusLG}px;
  `,
  comment: css`
    margin-top: 4px;
    padding: 6px 10px;
    color: ${token.colorTextSecondary};
    white-space: pre-wrap;
    word-break: break-word;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadius}px;
  `,
  time: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  nav: css`
    margin-bottom: 12px;
  `,
  waitError: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    word-break: break-word;
  `,
  pageActions: css`
    width: 100%;
    min-height: 64px;
    padding-block: 8px;
  `,
  /** 时间线：去掉末项多余的下边距 */
  timeline: css`
    margin-top: 4px;
    .ant-timeline-item:last-child {
      padding-bottom: 0;
    }
  `,
  sideTimeline: css`
    margin-top: 16px;
    .ant-timeline-item:last-child {
      padding-bottom: 0;
    }
  `,
}));

/** 基于流程的业务详情（如工单）在流程详情页上补充的内容；只属于入口实例 */
export interface InstanceBusiness {
  /** 标题右侧、状态标签之前的标签（如优先级） */
  tags?: React.ReactNode;
  /** 顶部摘要的字段；缺省为流程、发起人、发起 / 结束时间 */
  meta?: DescriptionsProps['items'];
  /** 摘要下方的整行提示（如满意度评价入口） */
  notice?: React.ReactNode;
  /**
   * 左栏的内容（如表单、附件、评论；一般是若干卡片）。有了它，流转记录就改放到右栏的
   * 「流程进度」里，左栏只留业务内容。
   */
  main?: React.ReactNode;
}

/** 分节标题（其他详情页与表单抽屉复用，保持同一样式） */
export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { styles } = useStyles();
  return <div className={styles.section}>{children}</div>;
};

/** 需要填写说明的动作 */
type ActionKind =
  | 'approve'
  | 'reject'
  | 'return'
  | 'transfer'
  | 'addSign'
  | 'delegate'
  | 'cancel'
  | 'terminate'
  | 'reassign'
  | 'skip'
  | 'signal';

interface ActionValues {
  comment?: string;
  toNodeId?: string;
  toUserId?: string;
  userIds?: string[];
  position?: 'before' | 'after';
  signal?: string;
}

/** 流程图里的节点（只取详情页用到的字段；结构化与接口创建的图都适用） */
interface RawGraphNode {
  id: string;
  type?: string;
  name?: string;
  timer?: { mode?: string; signal?: string };
}

/** 实例状态 → 标签色（已撤回为中性色） */
const STATUS_TAG_COLOR: Record<number, string | undefined> = {
  1: 'processing',
  2: 'success',
  3: 'error',
  5: 'warning',
};

/** 流转记录里表示「非人工节点已走过」的动作（定时 / 自动任务 / 子流程 / 跳过 / 抄送） */
const PASSED_ACTIONS: ReadonlySet<string> = new Set([
  'timer',
  'service',
  'subProcess',
  'skip',
  'cc',
]);
/** 占着节点的等待类型（其余类型是引擎内部作业的死信，节点状态由任务决定） */
const WAITING_KINDS: ReadonlySet<string> = new Set([
  'timer',
  'service',
  'signal',
]);

/**
 * 推导画布上各节点的状态。
 * - 非人工节点（定时 / 自动任务 / 子流程 / 被跳过的节点）没有任务：按流转记录标为已走过；
 * - 人工节点由最近一次到达的任务决定；已取消（撤回 / 终止 / 被退回波及）与已退回的任务
 *   没有「走完」，节点回到未到达的样子；
 * - 正在等待的定时 / 自动任务 / 信号节点、子流程仍在进行的节点是当前节点。
 */
const nodeStatesOf = (
  detail: InstanceDetailData | undefined,
): Record<string, NodeState> => {
  const states: Record<string, NodeState> = {};
  if (!detail) return states;
  for (const h of detail.histories ?? []) {
    if (h.nodeId && PASSED_ACTIONS.has(h.action)) states[h.nodeId] = 'done';
  }
  for (const task of detail.tasks ?? []) {
    if (task.status === 1) states[task.nodeId] = 'active';
    else if (task.status === 3) states[task.nodeId] = 'rejected';
    else if (task.status === 4 || task.status === 5) delete states[task.nodeId];
    else states[task.nodeId] = 'done';
  }
  // 实例已结束时不再有「当前节点」
  if (detail.instance?.status !== 1) return states;
  for (const wait of detail.waits ?? []) {
    if (WAITING_KINDS.has(wait.kind)) states[wait.nodeId] = 'active';
  }
  for (const child of detail.children ?? []) {
    if (child.status === 1) states[child.nodeId] = 'active';
  }
  return states;
};

export const InstanceDetail: React.FC<{
  /** 查看的实例 ID */
  instanceId: string;
  /** 返回上一页 */
  onBack: () => void;
  /** 实例状态变化后回调 */
  onChanged?: () => void;
  /** 是否展示管理动作（终止 / 改派）；仍以各自的权限与实例状态为准 */
  manage?: boolean;
  /**
   * 当前用户是否有处理权限（同意 / 拒绝 / 退回 / 转办 / 撤回的接口授权）；缺省有。
   * 没有时不显示这些按钮，即使当前用户正好是处理人或发起人。
   */
  canHandle?: boolean;
  /** 业务详情补充的内容（如工单的摘要、表单与评论） */
  business?: InstanceBusiness;
  /** 变化即重新加载当前实例（业务侧改了流程变量等，需要流程部分跟着刷新时递增） */
  reloadToken?: number;
}> = ({
  instanceId,
  onBack,
  onChanged,
  manage,
  canHandle = true,
  business,
  reloadToken,
}) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const instanceStatusText = useEnumText(INSTANCE_STATUS_META);
  const [detail, setDetail] = useState<InstanceDetailData>();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<ActionKind>();
  /** 改派的目标任务（管理动作针对具体任务） */
  const [reassignTaskId, setReassignTaskId] = useState<string>();
  /** 跳过的目标等待节点 */
  const [skipWait, setSkipWait] = useState<InstanceWait>();
  const [retrying, setRetrying] = useState<string>();
  /** 投递信号弹窗预选的信号名（从哪个等待节点点进来） */
  const [signalName, setSignalName] = useState<string>();
  /**
   * 从入口实例一路点进去的子流程 / 父流程（最后一个是正在看的）；空 = 正在看入口实例。
   * 业务补充的内容（business）只属于入口实例。
   */
  const [trail, setTrail] = useState<string[]>([]);
  const [chartOpen, setChartOpen] = useState(false);
  const viewingId = trail[trail.length - 1] ?? instanceId;

  // 只认最后一次请求的结果：快速切换实例、或动作后的刷新晚于切换返回时，旧响应不覆盖新内容
  const loadSeq = useRef(0);

  const load = useCallback(async (id: string) => {
    loadSeq.current += 1;
    const seq = loadSeq.current;
    setLoading(true);
    try {
      const result = await getInstance(id);
      if (seq === loadSeq.current) setDetail(result);
    } catch {
      if (seq === loadSeq.current) setDetail(undefined);
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  // 换了入口实例：回到入口本身
  useEffect(() => {
    setTrail([]);
  }, [instanceId]);

  // reloadToken 只作为重新加载的触发器
  useEffect(() => {
    void load(viewingId);
  }, [viewingId, load, reloadToken]);

  const flow = useMemo(() => fromGraph(detail?.graph), [detail?.graph]);
  const nodeStates = useMemo(() => nodeStatesOf(detail), [detail]);
  const graphNodes = useMemo(
    () => (detail?.graph?.nodes as RawGraphNode[] | undefined) ?? [],
    [detail?.graph],
  );
  const nodeNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const node of graphNodes) {
      if (node.name) names.set(node.id, node.name);
    }
    if (flow) {
      for (const node of walkNodes(flow.nodes)) {
        if (node.kind !== 'branch') names.set(node.id, node.name);
      }
    }
    return names;
  }, [flow, graphNodes]);
  /** 分支 ID → 分支名（条件出错的记录按连线 in_<分支> 指到分支） */
  const branchNames = useMemo(() => {
    const names = new Map<string, string>();
    if (flow) {
      for (const node of walkNodes(flow.nodes)) {
        if (node.kind !== 'branch') continue;
        for (const branch of node.branches) names.set(branch.id, branch.name);
      }
    }
    return names;
  }, [flow]);
  /** 条件求值出错的明细：每条出错的分支一行「分支名：错误」 */
  const conditionErrors = (h: WorkflowHistory): string[] => {
    const edges = h.detail?.edges;
    if (h.action !== 'conditionError' || !Array.isArray(edges)) return [];
    return edges.map((item) => {
      const { edge, error } = (item ?? {}) as {
        edge?: unknown;
        error?: unknown;
      };
      const id = typeof edge === 'string' ? edge : '';
      const name = branchNames.get(id.replace(/^in_/, '')) ?? id;
      return `${name}：${typeof error === 'string' ? error : ''}`;
    });
  };
  /** 详情里出现过的用户 ID → 显示名（流转记录里的转办对象、加签对象等只有 ID） */
  const userNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const task of detail?.tasks ?? []) {
      for (const a of task.assignees ?? []) {
        if (a.userName) names.set(a.userId, a.userName);
        if (a.onBehalf && a.onBehalfName) names.set(a.onBehalf, a.onBehalfName);
      }
    }
    for (const h of detail?.histories ?? []) {
      if (h.operator && h.operatorName) names.set(h.operator, h.operatorName);
    }
    return names;
  }, [detail?.tasks, detail?.histories]);
  const instance = detail?.instance;
  const myTaskId = detail?.myTaskId;
  const running = instance?.status === 1;
  /** 被委派：只需给出意见（同意 / 不同意），不能退回、加签、再委派 */
  const replying = detail?.mySeatOrigin === 'delegate';
  const pendingTasks = (detail?.tasks ?? []).filter(
    (task) => task.status === 1 && task.kind === 'approve',
  );
  const waits = detail?.waits ?? [];
  /** 正在等待的外部信号（去重） */
  const signalNames = [
    ...new Set(
      waits.flatMap((w) => (w.kind === 'signal' && w.signal ? [w.signal] : [])),
    ),
  ];
  const children = detail?.children ?? [];
  /** 重试 / 跳过等待节点、投递信号：管理视图 + 对应权限，且流程仍在进行 */
  const canOperateWait = !!manage && !!running && has('workflow.instance.wait');

  const historyText = (h: WorkflowHistory): string => {
    const who = h.operatorName || t('pages.workflow.history.system');
    const d = h.detail ?? {};
    const nameOfUser = (id: unknown) =>
      typeof id === 'string' ? (userNames.get(id) ?? id) : '';
    const target = d.to as string | undefined;
    // 同一动作按明细细分句式
    let key: string = h.action;
    switch (h.action) {
      case 'addSign':
        key = d.position === 'after' ? 'addSign.after' : 'addSign.before';
        break;
      case 'reply':
        key = d.agree ? 'reply.agree' : 'reply.disagree';
        break;
      case 'timeout':
        // blocked：本应自动同意，但本环节必填的内容还没填，系统没有替人同意
        key = d.blocked
          ? 'timeout.blocked'
          : `timeout.${String(d.action ?? 'remind')}`;
        break;
      case 'timer':
        key = d.signal ? 'timer.signal' : d.skipped ? 'timer.skipped' : 'timer';
        break;
      case 'subProcess':
        key =
          d.status === undefined
            ? 'subProcess.start'
            : d.status === 2
              ? 'subProcess.done'
              : 'subProcess.failed';
        break;
      case 'skip':
        key = h.operator ? 'skip.manual' : 'skip';
        break;
      default:
    }
    return t(`pages.workflow.history.${key}`, {
      who,
      node: h.nodeName || '',
      to: target
        ? (nodeNames.get(target) ?? userNames.get(target) ?? target)
        : '',
      from: nameOfUser(d.from),
      users: Array.isArray(d.users) ? d.users.map(nameOfUser).join('、') : '',
      signal: String(d.signal ?? ''),
      fields: Array.isArray(d.fields) ? d.fields.join('、') : '',
    });
  };

  /** 处理人标签上的文字：姓名 + 来源（加签 / 委派）+ 状态（排队 / 等待他人）+ 代谁处理 */
  const seatText = (a: WorkflowTaskAssignee): string => {
    const parts = [a.userName || a.userId];
    if (a.origin) parts.push(t(`pages.workflow.seat.origin.${a.origin}`));
    if (a.status === 2 || a.status === 9) {
      parts.push(t(ASSIGNEE_STATUS_META[a.status].textId));
    }
    if (a.onBehalf) {
      parts.push(
        t('pages.workflow.seat.onBehalf', {
          name: a.onBehalfName || a.onBehalf,
        }),
      );
    }
    return parts.join(' · ');
  };

  /** 等待节点的说明：定时写等到何时，自动任务写已尝试的次数 / 下次尝试时间 */
  const waitText = (wait: InstanceWait): string => {
    const time = wait.dueTime ? dayjs(wait.dueTime).format(TIME_FORMAT) : '';
    if (wait.kind === 'signal') {
      return t('pages.workflow.wait.signal.name', { name: wait.signal ?? '' });
    }
    if (wait.kind !== 'service') {
      // 定时节点；其余类型只会以死信出现（引擎内部作业失败）
      return wait.status === 4
        ? t('pages.workflow.wait.system.dead')
        : t('pages.workflow.wait.timer.until', { time });
    }
    if (wait.status === 4) {
      return t('pages.workflow.wait.service.dead', { n: wait.attempts });
    }
    return wait.attempts > 0
      ? t('pages.workflow.wait.service.retrying', { n: wait.attempts, time })
      : t('pages.workflow.wait.service.pending');
  };

  const finish = async (run: () => Promise<unknown>, successKey: string) => {
    try {
      await run();
    } catch (error) {
      // 多半是别人已先处理 / 流程已变化：重新加载，按钮回到最新状态（失败提示由请求层弹出）
      if (viewingId) void load(viewingId);
      throw error;
    }
    message.success(t(successKey));
    setAction(undefined);
    setReassignTaskId(undefined);
    setSkipWait(undefined);
    if (viewingId) void load(viewingId);
    onChanged?.();
    return true;
  };

  const retry = async (wait: InstanceWait) => {
    setRetrying(wait.jobId);
    try {
      await finish(
        () => retryInstanceJob(instance?.id ?? '', wait.jobId),
        'pages.workflow.msg.retried',
      );
    } catch {
      // 失败提示由请求层统一弹出
    } finally {
      setRetrying(undefined);
    }
  };

  const submit = (values: ActionValues) => {
    const comment = values.comment?.trim() ?? '';
    const id = instance?.id ?? '';
    switch (action) {
      case 'approve':
        return finish(
          () => approveTask(myTaskId ?? '', comment),
          replying
            ? 'pages.workflow.msg.replied'
            : 'pages.workflow.msg.approved',
        );
      case 'reject':
        return finish(
          () => rejectTask(myTaskId ?? '', comment),
          replying
            ? 'pages.workflow.msg.replied'
            : 'pages.workflow.msg.rejected',
        );
      case 'addSign':
        return finish(
          () =>
            addSignTask(
              myTaskId ?? '',
              values.userIds ?? [],
              values.position ?? 'before',
              comment,
            ),
          'pages.workflow.msg.addSigned',
        );
      case 'delegate':
        return finish(
          () => delegateTask(myTaskId ?? '', values.toUserId ?? '', comment),
          'pages.workflow.msg.delegated',
        );
      case 'skip':
        return finish(
          () => skipInstanceJob(id, skipWait?.jobId ?? '', comment),
          'pages.workflow.msg.skipped',
        );
      case 'signal':
        return finish(
          () => signalInstance(id, values.signal ?? ''),
          'pages.workflow.msg.signaled',
        );
      case 'return':
        return finish(
          () => returnTask(myTaskId ?? '', values.toNodeId ?? '', comment),
          'pages.workflow.msg.returned',
        );
      case 'transfer':
        return finish(
          () => transferTask(myTaskId ?? '', values.toUserId ?? '', comment),
          'pages.workflow.msg.transferred',
        );
      case 'cancel':
        return finish(
          () => cancelInstance(id, comment),
          'pages.workflow.msg.cancelled',
        );
      case 'terminate':
        return finish(
          () => terminateInstance(id, comment),
          'pages.workflow.msg.terminated',
        );
      case 'reassign':
        return finish(
          () =>
            reassignTask(reassignTaskId ?? '', values.userIds ?? [], comment),
          'pages.workflow.msg.reassigned',
        );
      default:
        return Promise.resolve(false);
    }
  };

  /** 说明是否必填：同意、转办、撤回可不填 */
  const commentRequired =
    action === 'reject' ||
    action === 'return' ||
    action === 'terminate' ||
    action === 'reassign' ||
    action === 'skip';

  /** 动作的名称（按钮与弹窗标题）：被委派时同意 / 拒绝是「回复意见」 */
  const actionLabel = (kind: ActionKind): string => {
    if (replying && kind === 'approve') {
      return t('pages.workflow.action.reply.agree');
    }
    if (replying && kind === 'reject') {
      return t('pages.workflow.action.reply.disagree');
    }
    return t(`pages.workflow.action.${kind}`);
  };

  const actions: React.ReactNode[] = [];
  if (myTaskId && canHandle) {
    actions.push(
      <Button key="transfer" onClick={() => setAction('transfer')}>
        {t('pages.workflow.action.transfer')}
      </Button>,
    );
    if (!replying) {
      actions.push(
        <Button key="delegate" onClick={() => setAction('delegate')}>
          {t('pages.workflow.action.delegate')}
        </Button>,
        <Button key="addSign" onClick={() => setAction('addSign')}>
          {t('pages.workflow.action.addSign')}
        </Button>,
        <Button key="return" onClick={() => setAction('return')}>
          {t('pages.workflow.action.return')}
        </Button>,
      );
    }
    actions.push(
      <Button key="reject" danger onClick={() => setAction('reject')}>
        {actionLabel('reject')}
      </Button>,
      <Button key="approve" type="primary" onClick={() => setAction('approve')}>
        {actionLabel('approve')}
      </Button>,
    );
  }
  if (detail?.canCancel && canHandle) {
    actions.unshift(
      <Button key="cancel" onClick={() => setAction('cancel')}>
        {t('pages.workflow.action.cancel')}
      </Button>,
    );
  }
  // 终止与改派是两项独立的权限，都以后端的判定为准（流程进行中且持有对应接口权限）：
  // 按钮显示出来就一定能用，不会出现点了才报无权限 / 流程已结束
  const canTerminate = manage && detail?.canManage;
  const canReassign = manage && detail?.canReassign;
  if (canTerminate) {
    actions.unshift(
      <Button key="terminate" danger onClick={() => setAction('terminate')}>
        {t('pages.workflow.action.terminate')}
      </Button>,
    );
  }

  const title = instance?.title ?? t('pages.workflow.detail.title');
  const showActions = actions.length > 0 && instance?.id === viewingId;
  // 业务补充的内容只属于入口实例；点进子流程 / 父流程时按纯流程展示
  const biz = trail.length === 0 ? business : undefined;

  /** 流转记录的时间线条目（时间正序） */
  const historyItems = (detail?.histories ?? []).map((h) => ({
    key: h.id,
    color: HISTORY_ACTION_COLOR[h.action] ?? 'gray',
    content: (
      <>
        <div>{historyText(h)}</div>
        {conditionErrors(h).map((line) => (
          <div key={line} className={styles.comment}>
            {line}
          </div>
        ))}
        {h.comment && <div className={styles.comment}>{h.comment}</div>}
        <div className={styles.time}>
          {h.createTime ? dayjs(h.createTime).format(TIME_FORMAT) : ''}
        </div>
      </>
    ),
  }));

  return (
    <div className={styles.page}>
      <Spin spinning={loading}>
        {trail.length > 0 && (
          <div className={styles.nav}>
            <a onClick={() => setTrail((list) => list.slice(0, -1))}>
              {t('pages.workflow.detail.back')}
            </a>
          </div>
        )}
        {!detail || !instance ? (
          !loading && <Empty />
        ) : (
          <Flex vertical gap={16}>
            <Card variant="outlined">
              <Flex justify="space-between" align="flex-start" gap={16}>
                <Typography.Title level={4} className={styles.headTitle}>
                  {title}
                </Typography.Title>
                <Flex gap={4} align="center" style={{ flex: 'none' }}>
                  {biz?.tags}
                  <Tag color={STATUS_TAG_COLOR[instance.status]}>
                    {instanceStatusText(instance.status)}
                  </Tag>
                </Flex>
              </Flex>
              {instance.parentInstanceId && (
                <Typography.Paragraph
                  type="secondary"
                  style={{ margin: '8px 0 0' }}
                >
                  {t('pages.workflow.detail.child.hint')}
                  <a
                    onClick={() =>
                      setTrail((list) => [
                        ...list,
                        instance.parentInstanceId ?? '',
                      ])
                    }
                  >
                    {t('pages.workflow.detail.child.parent')}
                  </a>
                </Typography.Paragraph>
              )}
              <Descriptions
                className={styles.headMeta}
                column={{ xs: 1, md: 2, xl: 4 }}
                size="small"
                items={
                  biz?.meta ?? [
                    {
                      key: 'definition',
                      label: t('pages.workflow.column.definition'),
                      children: `${instance.definitionName} · v${instance.version}`,
                    },
                    {
                      key: 'initiator',
                      label: t('pages.workflow.column.initiator'),
                      children: instance.initiatorName || instance.initiator,
                    },
                    {
                      key: 'startTime',
                      label: t('pages.workflow.column.startTime'),
                      children: instance.startTime
                        ? dayjs(instance.startTime).format(TIME_FORMAT)
                        : t('common.empty'),
                    },
                    {
                      key: 'endTime',
                      label: t('pages.workflow.column.endTime'),
                      children: instance.endTime
                        ? dayjs(instance.endTime).format(TIME_FORMAT)
                        : t('common.empty'),
                    },
                  ]
                }
              />
            </Card>

            {biz?.notice}

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Flex vertical gap={16}>
                  {biz?.main ?? (
                    // 纯流程：左栏就是流转记录，最新的在最上面
                    <Card
                      variant="outlined"
                      title={t('pages.workflow.detail.history')}
                    >
                      <Timeline
                        className={styles.timeline}
                        items={[...historyItems].reverse()}
                      />
                    </Card>
                  )}
                </Flex>
              </Col>
              <Col xs={24} lg={8}>
                <Flex vertical gap={16}>
                  {pendingTasks.length > 0 && (
                    <Card
                      variant="outlined"
                      title={t('pages.workflow.detail.current')}
                    >
                      <Flex vertical gap={8}>
                        {pendingTasks.map((task) => (
                          <Flex key={task.id} gap={8} align="center" wrap>
                            <Typography.Text strong>
                              {task.nodeName}
                            </Typography.Text>
                            {(task.assignees ?? [])
                              .filter(
                                (a) =>
                                  a.status === 1 ||
                                  a.status === 2 ||
                                  a.status === 9,
                              )
                              .map((a) => (
                                <Tag
                                  key={`${a.userId}-${a.status}-${a.origin ?? ''}-${a.onBehalf ?? ''}`}
                                  color={ASSIGNEE_STATUS_META[a.status].color}
                                >
                                  {seatText(a)}
                                </Tag>
                              ))}
                            {task.dueTime && (
                              <Typography.Text
                                type={
                                  dayjs(task.dueTime).isBefore(dayjs())
                                    ? 'warning'
                                    : 'secondary'
                                }
                              >
                                {t(
                                  dayjs(task.dueTime).isBefore(dayjs())
                                    ? 'pages.workflow.detail.overdue'
                                    : 'pages.workflow.detail.due',
                                  {
                                    time: dayjs(task.dueTime).format(
                                      TIME_FORMAT,
                                    ),
                                  },
                                )}
                              </Typography.Text>
                            )}
                            {canReassign && (
                              <a
                                onClick={() => {
                                  setReassignTaskId(task.id);
                                  setAction('reassign');
                                }}
                              >
                                {t('pages.workflow.action.reassign')}
                              </a>
                            )}
                          </Flex>
                        ))}
                      </Flex>
                    </Card>
                  )}

                  {waits.length > 0 && (
                    <Card
                      variant="outlined"
                      title={t('pages.workflow.detail.waits')}
                    >
                      <Flex vertical gap={8}>
                        {waits.map((wait) => (
                          <Flex
                            key={wait.jobId || `signal-${wait.nodeId}`}
                            vertical
                            gap={2}
                          >
                            <Flex gap={8} align="center" wrap>
                              <Typography.Text strong>
                                {nodeNames.get(wait.nodeId) ?? wait.nodeId}
                              </Typography.Text>
                              {wait.status === 4 ? (
                                <Tag color="error">
                                  {t('pages.workflow.wait.dead')}
                                </Tag>
                              ) : (
                                <Tag color="processing">
                                  {t(
                                    `pages.workflow.wait.${
                                      wait.kind === 'service' ||
                                      wait.kind === 'signal'
                                        ? wait.kind
                                        : 'timer'
                                    }`,
                                  )}
                                </Tag>
                              )}
                              <Typography.Text type="secondary">
                                {waitText(wait)}
                              </Typography.Text>
                              {canOperateWait && wait.status === 4 && (
                                <Button
                                  type="link"
                                  size="small"
                                  loading={retrying === wait.jobId}
                                  onClick={() => void retry(wait)}
                                >
                                  {t('pages.workflow.action.retry')}
                                </Button>
                              )}
                              {/* 跳过只对定时 / 自动任务有意义；等信号的节点用「投递信号」让它继续 */}
                              {canOperateWait &&
                                (wait.kind === 'timer' ||
                                  wait.kind === 'service') && (
                                  <Button
                                    type="link"
                                    size="small"
                                    danger
                                    onClick={() => {
                                      setSkipWait(wait);
                                      setAction('skip');
                                    }}
                                  >
                                    {t('pages.workflow.action.skip')}
                                  </Button>
                                )}
                              {canOperateWait && wait.kind === 'signal' && (
                                <Button
                                  type="link"
                                  size="small"
                                  onClick={() => {
                                    setSignalName(wait.signal);
                                    setAction('signal');
                                  }}
                                >
                                  {t('pages.workflow.action.signal')}
                                </Button>
                              )}
                            </Flex>
                            {wait.lastError && (
                              <div className={styles.waitError}>
                                {t('pages.workflow.wait.lastError', {
                                  error: wait.lastError,
                                })}
                              </div>
                            )}
                          </Flex>
                        ))}
                      </Flex>
                    </Card>
                  )}

                  {children.length > 0 && (
                    <Card
                      variant="outlined"
                      title={t('pages.workflow.detail.children')}
                    >
                      <Flex vertical gap={8}>
                        {children.map((child) => (
                          <Flex key={child.id} gap={8} align="center" wrap>
                            <Typography.Text type="secondary">
                              {nodeNames.get(child.nodeId) ?? child.nodeId}
                            </Typography.Text>
                            <a
                              onClick={() =>
                                setTrail((list) => [...list, child.id])
                              }
                            >
                              {child.definitionName}
                            </a>
                            <Tag color={STATUS_TAG_COLOR[child.status]}>
                              {instanceStatusText(child.status)}
                            </Tag>
                          </Flex>
                        ))}
                      </Flex>
                    </Card>
                  )}

                  <Card
                    variant="outlined"
                    title={t('pages.workflow.detail.flow')}
                    extra={
                      <a onClick={() => setChartOpen(true)}>
                        {t('pages.workflow.detail.flowChart')}
                      </a>
                    }
                  >
                    <Typography.Text type="secondary">
                      {`${instance.definitionName} · v${instance.version}`}
                    </Typography.Text>
                    {biz?.main && (
                      // 有业务内容时流转记录放在这里，按时间从上到下（发起 → 结束）
                      <Timeline
                        className={styles.sideTimeline}
                        items={historyItems}
                      />
                    )}
                  </Card>
                </Flex>
              </Col>
            </Row>
          </Flex>
        )}
      </Spin>

      {/* 流程图默认不展示，点开在弹窗里看（高亮当前节点与已走路径） */}
      <Modal
        title={t('pages.workflow.detail.flow')}
        width={960}
        open={chartOpen && !!detail}
        onCancel={() => setChartOpen(false)}
        footer={null}
        destroyOnHidden
      >
        {detail &&
          (flow ? (
            <div className={styles.canvas}>
              <FlowCanvas
                flow={flow}
                nodeStates={nodeStates}
                summaryOf={(node) => stepSummary(node, t)}
                conditionOf={(branch) => branchSummary(branch, t)}
                nameOf={(id) => nodeNames.get(id) ?? id}
              />
            </div>
          ) : (
            // 不是由设计器产生的流程图：按原图自动排版，同样高亮进度
            <div className={styles.canvas}>
              <RawGraphView graph={detail.graph} nodeStates={nodeStates} />
            </div>
          ))}
      </Modal>

      <FooterToolbar
        // 返回与动作排在同一行并居中（缺省布局靠右）；返回不随加载置灰。
        // 切换到子流程 / 父流程时，新详情返回前不展示上一个实例的动作（否则会操作到旧实例）
        renderContent={() => (
          <Flex
            justify="center"
            align="center"
            gap={8}
            wrap
            className={styles.pageActions}
          >
            <Button onClick={onBack}>{t('common.action.back')}</Button>
            {showActions && (
              <ConfigProvider componentDisabled={loading}>
                {actions}
              </ConfigProvider>
            )}
          </Flex>
        )}
      />

      {action && (
        <ModalForm<ActionValues>
          key={action}
          title={actionLabel(action)}
          width={480}
          open
          onOpenChange={(open) => {
            if (!open) {
              setAction(undefined);
              setReassignTaskId(undefined);
              setSkipWait(undefined);
            }
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{
            position: 'before',
            signal: signalName ?? signalNames[0],
          }}
          submitter={{
            ...submitter.save,
            searchConfig: {
              submitText: t('common.action.confirm'),
              resetText: t('common.action.cancel'),
            },
            submitButtonProps:
              (action === 'reject' && !replying) ||
              action === 'terminate' ||
              action === 'skip'
                ? { danger: true }
                : undefined,
          }}
          onFinish={submit}
        >
          {action === 'return' && (
            <ProFormSelect
              name="toNodeId"
              label={t('pages.workflow.form.returnTo')}
              rules={[rules.select(t('pages.workflow.form.returnTo'))]}
              request={async () => {
                const { items } = await listReturnTargets(myTaskId ?? '');
                return (items ?? []).map((n) => ({
                  value: n.nodeId,
                  label: n.nodeName || n.nodeId,
                }));
              }}
            />
          )}
          {(action === 'transfer' || action === 'delegate') && (
            <Form.Item
              name="toUserId"
              label={t(`pages.workflow.form.${action}To`)}
              extra={
                action === 'delegate'
                  ? t('pages.workflow.form.delegate.extra')
                  : undefined
              }
              rules={[rules.select(t(`pages.workflow.form.${action}To`))]}
            >
              <UserSelect
                fetchUsers={fetchWorkflowUsers}
                placeholder={t('pages.workflow.form.user.placeholder')}
              />
            </Form.Item>
          )}
          {action === 'addSign' && (
            <>
              <Form.Item
                name="userIds"
                label={t('pages.workflow.form.addSignTo')}
                rules={[
                  {
                    required: true,
                    type: 'array',
                    message: rules.select(t('pages.workflow.form.addSignTo'))
                      .message,
                  },
                ]}
              >
                <UserSelect
                  multiple
                  maxCount={ADD_SIGN_MAX}
                  fetchUsers={fetchWorkflowUsers}
                  placeholder={t('pages.workflow.form.user.placeholder')}
                />
              </Form.Item>
              <ProFormRadio.Group
                name="position"
                label={t('pages.workflow.form.addSign.position')}
                layout="vertical"
                options={(['before', 'after'] as const).map((position) => ({
                  value: position,
                  label: t(`pages.workflow.form.addSign.${position}`),
                }))}
              />
            </>
          )}
          {action === 'skip' && (
            <Typography.Paragraph type="secondary">
              {t('pages.workflow.form.skip.hint', {
                node: skipWait
                  ? (nodeNames.get(skipWait.nodeId) ?? skipWait.nodeId)
                  : '',
              })}
            </Typography.Paragraph>
          )}
          {action === 'signal' && (
            <ProFormSelect
              name="signal"
              label={t('pages.workflow.form.signal')}
              extra={t('pages.workflow.form.signal.extra')}
              allowClear={false}
              options={signalNames.map((name) => ({
                value: name,
                label: name,
              }))}
              rules={[rules.select(t('pages.workflow.form.signal'))]}
            />
          )}
          {action === 'reassign' && (
            <Form.Item
              name="userIds"
              label={t('pages.workflow.form.reassignTo')}
              rules={[
                {
                  required: true,
                  type: 'array',
                  message: rules.select(t('pages.workflow.form.reassignTo'))
                    .message,
                },
              ]}
            >
              <UserSelect
                multiple
                maxCount={REASSIGN_MAX}
                fetchUsers={fetchWorkflowUsers}
                placeholder={t('pages.workflow.form.user.placeholder')}
              />
            </Form.Item>
          )}
          {action !== 'signal' && (
            <ProFormTextArea
              name="comment"
              label={t(
                commentRequired
                  ? 'pages.workflow.form.reason'
                  : 'pages.workflow.form.comment',
              )}
              rules={
                commentRequired
                  ? [
                      // 只有空白不算填写（提交前会去掉首尾空白，后端同样拒绝）
                      {
                        ...rules.required(t('pages.workflow.form.reason')),
                        whitespace: true,
                      },
                    ]
                  : []
              }
              fieldProps={{
                maxLength: COMMENT_MAX,
                showCount: true,
                autoSize: { minRows: 3, maxRows: 6 },
              }}
            />
          )}
        </ModalForm>
      )}
    </div>
  );
};

export default InstanceDetail;
