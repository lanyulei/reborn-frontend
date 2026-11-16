/**
 * 流程设计器（通用）：结构化的流程画布 + 配置面板 + 结构与后端流程图的互转。
 * 不依赖任何业务域：选人 / 选角色 / 表单字段的数据来源由使用方注入。
 */
export {
  ConfigPanel,
  type FieldGroup,
  type FlowConfigDeps,
  findTarget,
} from './ConfigPanel';
export {
  FlowCanvas,
  type FlowCanvasProps,
  GROUP_ICON,
  type NodeState,
  STEP_ICON,
} from './FlowCanvas';
export {
  type Branch,
  type DiffMark,
  diffFlows,
  emptyFlow,
  type Flow,
  type FlowDiff,
  type FlowNode,
  fromGraph,
  locateIssue,
  type StepNode,
  toGraph,
  walkNodes,
} from './model';
export { RawGraphView, type RawGraphViewProps } from './RawGraphView';
export { branchSummary, stepSummary } from './summary';
