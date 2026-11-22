/**
 * 运维 Agent 页面共享的枚举元数据与常量：只保存结构（值、徽标状态、顺序）与 i18n 键，文案见 src/locales/<lang>/agent.ts。
 */
import type {
  Feedback,
  RunStatus,
  StageKey,
  StageStatus,
  TaskSource,
  TaskStatus,
} from '@/services/agent/typings';
import type { EnumMeta } from '@/utils/i18n';

export const TASK_STATUS_META: EnumMeta<TaskStatus> = {
  queued: { textId: 'enum.agent.task.status.queued', status: 'Default' },
  running: { textId: 'enum.agent.task.status.running', status: 'Processing' },
  succeeded: { textId: 'enum.agent.task.status.succeeded', status: 'Success' },
  no_finding: {
    textId: 'enum.agent.task.status.no_finding',
    status: 'Warning',
  },
  failed: { textId: 'enum.agent.task.status.failed', status: 'Error' },
  cancelled: { textId: 'enum.agent.task.status.cancelled', status: 'Default' },
  skipped: { textId: 'enum.agent.task.status.skipped', status: 'Default' },
  expired: { textId: 'enum.agent.task.status.expired', status: 'Default' },
};
export const TASK_STATUS_ORDER: readonly TaskStatus[] = [
  'queued',
  'running',
  'succeeded',
  'no_finding',
  'failed',
  'cancelled',
  'skipped',
  'expired',
];

export const RUN_STATUS_META: EnumMeta<RunStatus> = {
  running: { textId: 'enum.agent.run.status.running', status: 'Processing' },
  succeeded: { textId: 'enum.agent.run.status.succeeded', status: 'Success' },
  no_finding: { textId: 'enum.agent.run.status.no_finding', status: 'Warning' },
  failed: { textId: 'enum.agent.run.status.failed', status: 'Error' },
  cancelled: { textId: 'enum.agent.run.status.cancelled', status: 'Default' },
};

export const SOURCE_META: Record<TaskSource, { textId: string }> = {
  1: { textId: 'enum.agent.task.source.1' },
  2: { textId: 'enum.agent.task.source.2' },
  3: { textId: 'enum.agent.task.source.3' },
  4: { textId: 'enum.agent.task.source.4' },
  5: { textId: 'enum.agent.task.source.5' },
};
export const SOURCE_ORDER: readonly TaskSource[] = [1, 2, 3, 4, 5];

export const STAGE_META: Record<StageKey, { textId: string }> = {
  collect: { textId: 'enum.agent.stage.collect' },
  hypothesize: { textId: 'enum.agent.stage.hypothesize' },
  verify: { textId: 'enum.agent.stage.verify' },
  conclude: { textId: 'enum.agent.stage.conclude' },
};

export const STAGE_STATUS_META: EnumMeta<StageStatus> = {
  pending: { textId: 'enum.agent.stage.status.pending', status: 'Default' },
  running: { textId: 'enum.agent.stage.status.running', status: 'Processing' },
  done: { textId: 'enum.agent.stage.status.done', status: 'Success' },
  skipped: { textId: 'enum.agent.stage.status.skipped', status: 'Default' },
  failed: { textId: 'enum.agent.stage.status.failed', status: 'Error' },
};

export const FEEDBACK_META: Record<Feedback, { textId: string }> = {
  0: { textId: 'enum.agent.feedback.0' },
  1: { textId: 'enum.agent.feedback.1' },
  2: { textId: 'enum.agent.feedback.2' },
};

/** 结束原因的文案键（未知原因原样显示） */
export const END_REASONS = [
  'completed',
  'no_finding',
  'max_steps',
  'timeout',
  'llm_rejected',
  'llm_unavailable',
  'session_expired',
  'lease_released',
  'cancelled',
  'error',
  'disabled',
] as const;

/** 预算 / 用量里 int64 字符串转数字 */
export const num = (v?: string | number): number => Number(v ?? 0) || 0;
