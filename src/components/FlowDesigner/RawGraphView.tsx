/**
 * 通用流程图的只读视图：直接按后端的 nodes / edges 自动分层排版。
 * 用于不是由设计器产生的流程图（经接口写入、还原不成「顺序 + 分支」的结构）：
 * 设计器页里只读查看，运行态里同样能高亮已走过 / 进行中的节点。
 * 节点卡片与结构化画布（FlowCanvas）同一套外观；回路与跳转画成虚线、从右侧绕行。
 */
import { UserOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import { createStyles } from 'antd-style';
import clsx from 'clsx';
import type React from 'react';
import { useMemo } from 'react';
import { useT } from '@/utils/i18n';
import {
  GROUP_ICON,
  type NodeState,
  STEP_ICON,
  useFlowStyles,
} from './FlowCanvas';
import type {
  Assignee,
  FlowDuration,
  GroupMode,
  StepKind,
  StepNode,
  TimeoutAction,
  TimerConfig,
} from './model';
import { layoutRawGraph, type RawEdge, type RawNode } from './rawLayout';
import { stepSummary } from './summary';

/** 后端图节点里本视图用到的字段 */
interface GraphNode extends RawNode {
  assignee?: Assignee;
  timeout?: FlowDuration & { action: TimeoutAction; remind?: FlowDuration };
  timer?: TimerConfig;
  service?: { webhookId: string };
  subProcess?: { definitionKey: string };
}

/** 后端节点类型 → 步骤节点类型（画成卡片的那些） */
const STEP_KIND: Record<string, StepKind> = {
  userTask: 'task',
  cc: 'cc',
  timer: 'timer',
  serviceTask: 'service',
  subProcess: 'sub',
};

/** 后端网关类型 → 分支组类型 */
const GATEWAY_MODE: Record<string, GroupMode> = {
  exclusiveGateway: 'exclusive',
  parallelGateway: 'parallel',
  inclusiveGateway: 'inclusive',
};

const CARD = { width: 220, height: 70 };
const PILL = { width: 120, height: 28 };
const GAP_X = 40;
const GAP_Y = 56;
/** 画布四周留白；右侧多留一些给回连的弧线 */
const PAD = 32;
const BACK_ROOM = 72;

const useStyles = createStyles(({ token, css }) => ({
  stage: css`
    position: relative;
    flex: none;
  `,
  node: css`
    position: absolute;
  `,
  cardFixed: css`
    height: ${CARD.height}px;
  `,
  body: css`
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  pill: css`
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: ${PILL.width}px;
    height: ${PILL.height}px;
    padding: 0 12px;
    overflow: hidden;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    white-space: nowrap;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorder};
    border-radius: 999px;
  `,
  pillEnd: css`
    background: ${token.colorFillSecondary};
    border-color: transparent;
  `,
  wires: css`
    position: absolute;
    inset: 0;
    overflow: visible;
    pointer-events: none;
  `,
  wire: css`
    fill: none;
    stroke: ${token.colorBorder};
    stroke-width: 2;
  `,
  wireBack: css`
    stroke: ${token.colorPrimaryBorder};
    stroke-dasharray: 5 4;
  `,
  arrow: css`
    fill: ${token.colorBorder};
  `,
  arrowBack: css`
    fill: ${token.colorPrimaryBorder};
  `,
  label: css`
    position: absolute;
    max-width: 160px;
    padding: 0 6px;
    overflow: hidden;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    line-height: 18px;
    white-space: nowrap;
    text-overflow: ellipsis;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 999px;
    transform: translate(-50%, -50%);
  `,
}));

const isCard = (node: RawNode) =>
  node.type === 'start' || (node.type ?? '') in STEP_KIND;

export interface RawGraphViewProps {
  /** 后端的流程图（nodes / edges） */
  graph?: Record<string, unknown>;
  /** 运行态：节点 ID → 状态；传入后未到达的任务节点淡出 */
  nodeStates?: Readonly<Record<string, NodeState>>;
}

export const RawGraphView: React.FC<RawGraphViewProps> = ({
  graph,
  nodeStates,
}) => {
  const { styles: flowStyles } = useFlowStyles();
  const { styles } = useStyles();
  const t = useT();

  const layout = useMemo(() => {
    const nodes = Array.isArray(graph?.nodes)
      ? (graph.nodes as GraphNode[]).filter((n) => typeof n?.id === 'string')
      : [];
    const edges = Array.isArray(graph?.edges)
      ? (graph.edges as RawEdge[]).filter(
          (e) => typeof e?.source === 'string' && typeof e?.target === 'string',
        )
      : [];
    return layoutRawGraph(nodes, edges, {
      sizeOf: (n) => (isCard(n) ? CARD : PILL),
      gapX: GAP_X,
      gapY: GAP_Y,
    });
  }, [graph]);

  if (layout.nodes.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const at = new Map(layout.nodes.map((p) => [p.node.id, p]));
  const right = PAD + layout.width;
  const hasBack = layout.edges.some((e) => e.back);

  const stateClass = (id: string) => {
    if (!nodeStates) return undefined;
    const state = nodeStates[id];
    if (state === 'active') return flowStyles.stateActive;
    if (state === 'done') return flowStyles.stateDone;
    if (state === 'rejected') return flowStyles.stateRejected;
    return flowStyles.stateIdle;
  };

  const nodeView = (node: GraphNode) => {
    if (node.type === 'start') {
      return (
        <div
          className={clsx(
            flowStyles.card,
            styles.cardFixed,
            nodeStates && flowStyles.stateDone,
          )}
        >
          <div className={clsx(flowStyles.cardHead, flowStyles.headStart)}>
            <UserOutlined />
            <span className={flowStyles.headTitle}>
              {t('component.flow.start')}
            </span>
          </div>
          <div className={clsx(flowStyles.cardBody, styles.body)}>
            <span className={flowStyles.placeholder}>
              {t('component.flow.start.hint')}
            </span>
          </div>
        </div>
      );
    }
    const kind = STEP_KIND[node.type ?? ''];
    if (kind) {
      const step: StepNode = {
        kind,
        id: node.id,
        name: node.name || t(`component.flow.node.${kind}`),
        assignee: { ...node.assignee, rules: node.assignee?.rules ?? [] },
        timeout: node.timeout && {
          ...node.timeout,
          remind: node.timeout.remind?.value,
        },
        timer: node.timer,
        service: node.service,
        subProcess: node.subProcess,
      };
      const summary = stepSummary(step, t);
      return (
        <div
          className={clsx(
            flowStyles.card,
            styles.cardFixed,
            stateClass(node.id),
          )}
        >
          <div
            className={clsx(
              flowStyles.cardHead,
              kind === 'task'
                ? flowStyles.headTask
                : kind === 'cc'
                  ? flowStyles.headCc
                  : flowStyles.headAuto,
            )}
          >
            {STEP_ICON[kind]}
            <span className={flowStyles.headTitle}>{step.name}</span>
          </div>
          <div
            className={clsx(flowStyles.cardBody, styles.body)}
            title={summary}
          >
            {summary || (
              <span className={flowStyles.placeholder}>
                {t(`component.flow.node.${kind}.empty`)}
              </span>
            )}
          </div>
        </div>
      );
    }
    if (node.type === 'end') {
      return (
        <div className={clsx(styles.pill, styles.pillEnd)}>
          {t('component.flow.finish')}
        </div>
      );
    }
    const mode = GATEWAY_MODE[node.type ?? ''];
    return (
      <div className={styles.pill} title={node.name || node.type}>
        {mode && GROUP_ICON[mode]}
        {mode
          ? t(`component.flow.group.${mode}`)
          : node.name || node.type || node.id}
      </div>
    );
  };

  let backIndex = 0;
  const wires = layout.edges.map(({ edge, back }, index) => {
    const from = at.get(edge.source);
    const to = at.get(edge.target);
    if (!from || !to) return null;
    const key = edge.id ?? `${edge.source}-${edge.target}-${index}`;
    let d: string;
    let labelAt: { x: number; y: number };
    if (back) {
      // 回连：从右侧绕行，多条回连依次外移，互不重叠
      const lane = right + 20 + (backIndex % 4) * 12;
      backIndex += 1;
      const x1 = PAD + from.x + from.width;
      const y1 = PAD + from.y + from.height / 2;
      const x2 = PAD + to.x + to.width;
      const y2 = PAD + to.y + to.height / 2;
      d = `M ${x1} ${y1} H ${lane - 8} Q ${lane} ${y1} ${lane} ${
        y1 + (y2 < y1 ? -8 : 8)
      } V ${y2 + (y2 < y1 ? 8 : -8)} Q ${lane} ${y2} ${lane - 8} ${y2} H ${
        x2 + 6
      }`;
      labelAt = { x: lane, y: (y1 + y2) / 2 };
    } else {
      const x1 = PAD + from.x + from.width / 2;
      const y1 = PAD + from.y + from.height;
      const x2 = PAD + to.x + to.width / 2;
      const y2 = PAD + to.y - 6;
      const mid = (y1 + y2) / 2;
      d = `M ${x1} ${y1} C ${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`;
      labelAt = { x: (x1 + x2) / 2, y: mid };
    }
    const label = edge.isDefault
      ? t('component.flow.branch.default')
      : edge.condition;
    return { key, d, back, label, labelAt };
  });

  return (
    <div className={flowStyles.canvas}>
      <div
        className={styles.stage}
        style={{
          width: layout.width + PAD * 2 + (hasBack ? BACK_ROOM : 0),
          height: layout.height + PAD * 2,
        }}
      >
        <svg className={styles.wires} aria-hidden="true">
          <defs>
            <marker
              id="flow-raw-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="1"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 z" className={styles.arrow} />
            </marker>
            <marker
              id="flow-raw-arrow-back"
              markerWidth="8"
              markerHeight="8"
              refX="1"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 z" className={styles.arrowBack} />
            </marker>
          </defs>
          {wires.map(
            (w) =>
              w && (
                <path
                  key={w.key}
                  d={w.d}
                  className={clsx(styles.wire, w.back && styles.wireBack)}
                  markerEnd={`url(#flow-raw-arrow${w.back ? '-back' : ''})`}
                />
              ),
          )}
        </svg>
        {layout.nodes.map((p) => (
          <div
            key={p.node.id}
            className={styles.node}
            style={{ left: PAD + p.x, top: PAD + p.y }}
          >
            {nodeView(p.node)}
          </div>
        ))}
        {wires.map(
          (w) =>
            w?.label && (
              <div
                key={`label-${w.key}`}
                className={styles.label}
                style={{ left: w.labelAt.x, top: w.labelAt.y }}
                title={w.label}
              >
                {w.label}
              </div>
            ),
        )}
      </div>
    </div>
  );
};

export default RawGraphView;
