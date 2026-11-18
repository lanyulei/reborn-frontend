/**
 * 升级策略「各级」的表单模型：表单值 ↔ 接口内容的转换、取值上限、逐级校验。
 * 表单里通知对象的四类平铺在一级上（接口里收在 targets 下），值班表 / 部门是可增删的行。
 */
import type { NormalizedEscalationLevel } from '@/services/monitor/normalize';
import type {
  EscalationLevel,
  MonitorEscalationTrigger,
} from '@/services/monitor/typings';

/** 与 escalation.proto 的校验上限一致 */
export const ESCALATION_LIMITS = {
  descMax: 255,
  levelMax: 10,
  afterM: { min: 1, max: 10080 },
  targetMax: 20,
  deptUpMax: 5,
  repeatInterval: { min: 5, max: 10080 },
  maxNotify: { min: 0, max: 100 },
  /** 24 小时通知量超过它即按「过于频繁」提示（界面口径，后端不限制） */
  estimateWarn: 50,
} as const;

export interface LevelScheduleValue {
  id?: string;
  backupOnly?: boolean;
}

export interface LevelDeptValue {
  id?: string;
  up?: number | null;
}

/** 一级的表单值；数字输入框清空后为 null */
export interface LevelValue {
  trigger?: MonitorEscalationTrigger;
  afterM?: number | null;
  userIds?: string[];
  schedules?: LevelScheduleValue[];
  oncallGroupIds?: string[];
  depts?: LevelDeptValue[];
  repeatIntervalM?: number | null;
  maxNotify?: number | null;
}

/** 已保存的各级（已归一化）→ 表单值，不补缺省 */
export const levelsToValues = (
  levels: readonly NormalizedEscalationLevel[],
): LevelValue[] =>
  levels.map((level) => ({
    trigger: level.trigger,
    afterM: level.afterM,
    userIds: level.targets.userIds,
    schedules: level.targets.schedules,
    oncallGroupIds: level.targets.oncallGroupIds,
    depts: level.targets.depts,
    repeatIntervalM: level.repeatIntervalM,
    maxNotify: level.maxNotify,
  }));

/** 表单值 → 接口内容（调用前须已通过 levelError 校验） */
export const buildLevels = (
  levels?: readonly LevelValue[],
): EscalationLevel[] =>
  (levels ?? []).map((level) => ({
    trigger: level.trigger as MonitorEscalationTrigger,
    afterM: level.afterM ?? 0,
    targets: {
      userIds: level.userIds ?? [],
      schedules: (level.schedules ?? []).map((schedule) => ({
        id: schedule.id ?? '',
        backupOnly: schedule.backupOnly ?? false,
      })),
      oncallGroupIds: level.oncallGroupIds ?? [],
      depts: (level.depts ?? []).map((dept) => ({
        id: dept.id ?? '',
        up: dept.up ?? 0,
      })),
    },
    repeatIntervalM: level.repeatIntervalM ?? 0,
    maxNotify: level.maxNotify ?? 0,
  }));

/** 追加一级时的起始值：未认领触发，时间接在上一级之后（各级须严格递增） */
export const nextLevel = (levels: readonly LevelValue[]): LevelValue => {
  const last = levels[levels.length - 1]?.afterM;
  return {
    trigger: 1,
    afterM: last ? Math.min(last + 15, ESCALATION_LIMITS.afterM.max) : 15,
    userIds: [],
    schedules: [],
    oncallGroupIds: [],
    depts: [],
    repeatIntervalM: 0,
    maxNotify: 0,
  };
};

const isInt = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max;

/** 校验不通过的原因（文案键 pages.monitor.escalation.level.error.<code>） */
export type LevelErrorCode =
  | 'trigger'
  | 'afterM'
  | 'increasing'
  | 'schedule'
  | 'scheduleDup'
  | 'dept'
  | 'targets'
  | 'repeat'
  | 'maxNotify';

export interface LevelError {
  /** 第几级（从 0 起） */
  index: number;
  code: LevelErrorCode;
}

/**
 * 逐级校验，返回第一处问题；全部合法返回 null。与后端一致：proto 的取值范围 + 业务校验
 * （afterM 逐级严格递增——proto 只查互不相同）。
 */
export const levelError = (
  levels?: readonly LevelValue[],
): LevelError | null => {
  let previous = 0;
  for (const [index, level] of (levels ?? []).entries()) {
    const fail = (code: LevelErrorCode): LevelError => ({ index, code });
    if (level.trigger !== 1 && level.trigger !== 2) return fail('trigger');
    const { afterM, repeatIntervalM, maxNotify } = level;
    const { min, max } = ESCALATION_LIMITS.afterM;
    if (!isInt(afterM, min, max)) return fail('afterM');
    if (afterM <= previous) return fail('increasing');
    previous = afterM;

    const schedules = level.schedules ?? [];
    if (schedules.some((schedule) => !schedule.id)) return fail('schedule');
    if (new Set(schedules.map((s) => s.id)).size !== schedules.length) {
      return fail('scheduleDup');
    }
    const depts = level.depts ?? [];
    if (
      depts.some(
        (dept) =>
          !dept.id || !isInt(dept.up ?? 0, 0, ESCALATION_LIMITS.deptUpMax),
      )
    ) {
      return fail('dept');
    }
    if (
      !(level.userIds?.length || 0) &&
      !schedules.length &&
      !(level.oncallGroupIds?.length || 0) &&
      !depts.length
    ) {
      return fail('targets');
    }
    const repeat = repeatIntervalM ?? 0;
    if (
      repeat !== 0 &&
      !isInt(
        repeat,
        ESCALATION_LIMITS.repeatInterval.min,
        ESCALATION_LIMITS.repeatInterval.max,
      )
    ) {
      return fail('repeat');
    }
    if (
      !isInt(
        maxNotify ?? 0,
        ESCALATION_LIMITS.maxNotify.min,
        ESCALATION_LIMITS.maxNotify.max,
      )
    ) {
      return fail('maxNotify');
    }
  }
  return null;
};
