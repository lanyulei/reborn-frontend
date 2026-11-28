/**
 * 节点卡片与分支卡片上的摘要文字：把处理人规则 / 分支条件转成一句可读的话。
 */
import type { Translate } from '@/utils/i18n';
import {
  type AssigneeRule,
  type Branch,
  conditionToExpr,
  type FlowDuration,
  SIGNAL_PATTERN,
  type StepNode,
} from './model';

const OP_TEXT: Record<string, string> = {
  '==': '=',
  '!=': '≠',
  '>': '>',
  '>=': '≥',
  '<': '<',
  '<=': '≤',
};

/** 规则是否已填写完整 */
export const ruleComplete = (rule: AssigneeRule): boolean => {
  switch (rule.kind) {
    case 'user':
      return (rule.userIds?.length ?? 0) > 0;
    case 'role':
      return (rule.roleCodes?.length ?? 0) > 0;
    case 'initiator':
      return true;
    case 'superAdmin':
      return true;
    case 'deptLeader':
      return (rule.level ?? 0) >= 1;
    case 'deptLeaderOf':
      return !!rule.deptId;
    case 'formUser':
    case 'formDeptLeader':
      return !!rule.field;
    case 'oncall':
      return !!rule.groupId && !!rule.scheduleId;
    default:
      return false;
  }
};

/** 一条处理人规则的可读文字；未填完整返回空串 */
export const ruleText = (rule: AssigneeRule, t: Translate): string => {
  if (!ruleComplete(rule)) return '';
  const names = (ids?: string[]) =>
    (ids ?? [])
      .map((id) => rule.labels?.[id] ?? id)
      .join(t('component.flow.separator'));
  switch (rule.kind) {
    case 'user':
      return names(rule.userIds);
    case 'role':
      return t('component.flow.rule.role.text', {
        names: names(rule.roleCodes),
      });
    case 'initiator':
      return t('component.flow.rule.initiator');
    case 'superAdmin':
      return t('component.flow.rule.superAdmin');
    case 'deptLeader':
      return rule.level === 1
        ? t('component.flow.rule.deptLeader.direct')
        : t('component.flow.rule.deptLeader.text', { level: rule.level });
    case 'deptLeaderOf':
      return t('component.flow.rule.deptLeaderOf.text', {
        name: rule.labels?.[rule.deptId ?? ''] ?? rule.deptId,
      });
    case 'formUser':
      return t('component.flow.rule.formUser.text', { field: rule.field });
    case 'formDeptLeader':
      return t('component.flow.rule.formDeptLeader.text', {
        field: rule.field,
      });
    case 'oncall':
      return t('component.flow.rule.oncall.text', {
        group: rule.labels?.[rule.groupId ?? ''] ?? rule.groupId,
        schedule: rule.labels?.[rule.scheduleId ?? ''] ?? rule.scheduleId,
      });
    default:
      return '';
  }
};

/** 时长的可读文字，如「2 小时」「3 个工作日」 */
export const durationText = (d: FlowDuration, t: Translate): string =>
  t(`component.flow.duration.${d.unit}${d.workTime ? '.work' : ''}`, {
    n: d.value,
  });

/** 时长是否有效（正整数） */
export const durationValid = (d?: FlowDuration): d is FlowDuration =>
  !!d && Number.isInteger(d.value) && d.value >= 1;

/**
 * 节点摘要；配置未完成返回空串（卡片显示「未配置」）。
 * 人工任务 / 抄送：处理人 + 多人模式（+ 处理时限）；定时：等多久 / 等到何时 / 等什么信号；
 * 自动任务：调用的端点；子流程：发起的流程。
 */
export const stepSummary = (node: StepNode, t: Translate): string => {
  switch (node.kind) {
    case 'timer': {
      const timer = node.timer;
      if (timer?.mode === 'delay' && durationValid(timer.duration)) {
        return t('component.flow.timer.delay.text', {
          duration: durationText(timer.duration, t),
        });
      }
      if (timer?.mode === 'until' && timer.field) {
        return t('component.flow.timer.until.text', { field: timer.field });
      }
      if (timer?.mode === 'signal' && SIGNAL_PATTERN.test(timer.signal ?? '')) {
        return t('component.flow.timer.signal.text', { signal: timer.signal });
      }
      return '';
    }
    case 'service':
      return node.service?.webhookId
        ? t('component.flow.service.text', {
            name: node.service.label || node.service.webhookId,
          })
        : '';
    case 'sub':
      return node.subProcess?.definitionKey
        ? t('component.flow.sub.text', {
            name: node.subProcess.label || node.subProcess.definitionKey,
          })
        : '';
    default:
  }
  const parts = node.assignee.rules.map((r) => ruleText(r, t)).filter(Boolean);
  if (parts.length === 0) return '';
  const who = parts.join(t('component.flow.separator'));
  if (node.kind === 'cc') return who;
  const mode = t(`component.flow.mode.${node.assignee.mode ?? 'any'}`);
  return durationValid(node.timeout)
    ? `${who} · ${mode} · ${t('component.flow.timeout.text', {
        duration: durationText(node.timeout, t),
      })}`
    : `${who} · ${mode}`;
};

/** 分支条件摘要：可视化行转成「字段 运算符 值」，手写表达式原样显示 */
export const branchSummary = (branch: Branch, t: Translate): string => {
  const c = branch.condition;
  if (!c) return '';
  if (c.mode === 'expr') return conditionToExpr(c);
  const parts = c.rows
    .filter((r) => r.field.trim() !== '' && r.value !== '')
    .map((r) =>
      r.op === 'contains'
        ? t('component.flow.condition.contains.text', {
            field: r.field,
            value: r.value,
          })
        : `${r.field} ${OP_TEXT[r.op]} ${r.value}`,
    );
  return parts.join(
    c.join === '&&'
      ? t('component.flow.condition.and.sep')
      : t('component.flow.condition.or.sep'),
  );
};
