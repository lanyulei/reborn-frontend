/**
 * 值班域枚举元数据：只保存结构与 i18n 键（文案在 locales/<lang>/oncall.ts）。
 */
import type {
  OncallIssueType,
  OncallMemberRole,
  OncallRotationUnit,
  OncallScheduleStatus,
  OncallScopeType,
  OncallShiftRole,
  OncallShiftSource,
} from '@/services/oncall/typings';
import type { EnumMeta } from '@/utils/i18n';

export const ONCALL_MEMBER_ROLE_META: EnumMeta<OncallMemberRole> = {
  1: { textId: 'enum.oncall.memberRole.1' },
  2: { textId: 'enum.oncall.memberRole.2' },
};
export const ONCALL_MEMBER_ROLE_ORDER: readonly OncallMemberRole[] = [2, 1];

export const ONCALL_SCHEDULE_STATUS_META: EnumMeta<OncallScheduleStatus> = {
  1: { textId: 'common.status.enabled', status: 'Success' },
  2: { textId: 'common.status.disabled', status: 'Default' },
};

export const ONCALL_ROTATION_UNIT_META: EnumMeta<OncallRotationUnit> = {
  1: { textId: 'enum.oncall.rotationUnit.1' },
  2: { textId: 'enum.oncall.rotationUnit.2' },
};
export const ONCALL_ROTATION_UNIT_ORDER: readonly OncallRotationUnit[] = [1, 2];
/** 轮转间隔上限：按天 1-30，按周 1-4（与后端校验一致） */
export const ONCALL_ROTATION_INTERVAL_MAX: Record<OncallRotationUnit, number> =
  { 1: 30, 2: 4 };

export const ONCALL_SHIFT_ROLE_META: EnumMeta<OncallShiftRole> = {
  1: { textId: 'enum.oncall.shiftRole.1' },
  2: { textId: 'enum.oncall.shiftRole.2' },
};
/** 日历单元格内的角色简称（主 / 备） */
export const ONCALL_SHIFT_ROLE_SHORT: Record<
  OncallShiftRole,
  { textId: string }
> = {
  1: { textId: 'enum.oncall.shiftRoleShort.1' },
  2: { textId: 'enum.oncall.shiftRoleShort.2' },
};
export const ONCALL_SHIFT_ROLE_ORDER: readonly OncallShiftRole[] = [1, 2];

export const ONCALL_SHIFT_SOURCE_META: EnumMeta<OncallShiftSource> = {
  1: { textId: 'enum.oncall.shiftSource.1', status: 'Default' },
  2: { textId: 'enum.oncall.shiftSource.2', status: 'Warning' },
};

export const ONCALL_ISSUE_TYPE_META: EnumMeta<OncallIssueType> = {
  1: { textId: 'enum.oncall.issueType.1' },
  2: { textId: 'enum.oncall.issueType.2' },
  3: { textId: 'enum.oncall.issueType.3' },
  4: { textId: 'enum.oncall.issueType.4' },
  5: { textId: 'enum.oncall.issueType.5' },
};

export const ONCALL_SCOPE_TYPE_META: EnumMeta<OncallScopeType> = {
  1: { textId: 'enum.oncall.scopeType.1' },
  2: { textId: 'enum.oncall.scopeType.2' },
  3: { textId: 'enum.oncall.scopeType.3' },
};

/** 变更记录操作码（后端 ChangeLog.action） */
export const ONCALL_CHANGE_ACTIONS = [
  'group.create',
  'group.update',
  'member.add',
  'member.update',
  'member.remove',
  'schedule.create',
  'schedule.update',
  'schedule.status',
  'schedule.delete',
  'schedule.notify',
  'shift.override',
  'shift.revoke',
  'share.create',
  'share.reset',
  'share.delete',
] as const;

/** 上班提醒提前量预设（分钟）；最多选两个 */
export const ONCALL_REMIND_PRESETS: readonly number[] = [
  0, 15, 30, 60, 120, 720, 1440, 2880, 10080,
];
export const ONCALL_REMIND_MAX = 2;

/** 表单长度上限（与后端 proto 校验一致） */
export const ONCALL_NAME_MAX = 64;
export const ONCALL_DESC_MAX = 255;
export const ONCALL_ROTATION_MEMBER_MAX = 50;
export const ONCALL_ADD_MEMBER_MAX = 50;
export const ONCALL_HORIZON_RANGE = { min: 7, max: 180 } as const;
