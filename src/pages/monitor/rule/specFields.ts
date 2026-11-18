/**
 * 规则内容 → 「字段 / 显示值」列表：变更历史里查看某个版本的快照、对比两个版本时共用。
 * 值一律折成可读文本（多项的每项一行），两版逐字段比较文本即可得出差异。
 */
import { NOTIFY_SEVERITY_META } from '@/constants';
import { normalizeRuleSpec } from '@/services/monitor/normalize';
import type { RuleSpec, TimeWindow } from '@/services/monitor/typings';
import type { Translate } from '@/utils/i18n';
import { labelEntries } from '../components/format';
import { DATASOURCE_SCOPE_META } from '../components/meta';

export interface SpecField {
  key: string;
  label: string;
  value: string;
  /** PromQL 等代码类文本（等宽显示） */
  code?: boolean;
}

export interface SpecFieldContext {
  t: Translate;
  /** 所属分组的显示名（版本接口随快照返回） */
  groupName?: string;
  /**
   * ID → 显示名（数据源 / 用户 / 值班表 / 部门 / 升级策略 / 工单模板 / 流程）；查不到的显示 ID。
   * 快照里只有 ID，名称取自当前规则的详情与候选：历史版本引用的对象现在已不在其中时只能显示 ID
   */
  names: ReadonlyMap<string, string>;
  windowText: (window: TimeWindow) => string;
}

export const specFields = (
  spec: RuleSpec | undefined,
  ctx: SpecFieldContext,
): SpecField[] => {
  const { t, names } = ctx;
  if (!spec) return [];
  // 第二、三期的字段在旧版本的快照里缺失或为 null：补成零值再显示（缺失 = 未配置）
  const full = normalizeRuleSpec(spec);
  const name = (id: string) => names.get(id) ?? id;
  const lines = (items: (string | false)[]) => items.filter(Boolean).join('\n');
  const list = (items: string[]) =>
    items.join(t('pages.monitor.listSeparator'));
  const calendar =
    full.effective.mode === 'work_time' || full.effective.mode === 'off_time';
  const { ciMatch, resourceScope, actions } = full;
  const or = (text: string, fallback: string) => text || fallback;
  const unlimited = t('pages.monitor.common.unlimited');
  const yesNo = (value?: boolean) =>
    t(value ? 'pages.monitor.common.yes' : 'pages.monitor.common.no');
  const seconds = (value?: number) =>
    t('pages.monitor.unit.seconds', { n: value ?? 0 });
  const refs = (ids?: string[]) =>
    (ids ?? []).map((id) => names.get(id) ?? id).join('\n');
  const kv = (record?: Record<string, string>) =>
    labelEntries(record)
      .map(([key, value]) => `${key} = ${value}`)
      .join('\n');

  return [
    {
      key: 'name',
      label: t('pages.monitor.rule.column.name'),
      value: spec.name,
    },
    {
      key: 'group',
      label: t('pages.monitor.common.group'),
      value: ctx.groupName || spec.groupId,
    },
    {
      key: 'description',
      label: t('pages.monitor.common.description'),
      value: spec.description ?? '',
    },
    {
      key: 'enabled',
      label: t('common.column.enabled'),
      value: yesNo(spec.enabled),
    },
    {
      key: 'labels',
      label: t('pages.monitor.rule.form.labels'),
      value: kv(spec.labels),
    },
    {
      key: 'datasourceScope',
      label: t('pages.monitor.rule.form.datasourceScope'),
      value: t(DATASOURCE_SCOPE_META[spec.datasourceScope]?.textId ?? ''),
    },
    {
      key: 'datasourceIds',
      label: t('pages.monitor.common.datasources'),
      value: refs(spec.datasourceIds),
    },
    {
      key: 'queries',
      label: t('pages.monitor.rule.form.queries'),
      value: (spec.queries ?? [])
        .map(
          (q) =>
            `[${t(NOTIFY_SEVERITY_META[q.severity]?.textId ?? '')}] ${q.expr}`,
        )
        .join('\n'),
      code: true,
    },
    {
      key: 'levelInhibit',
      label: t('pages.monitor.rule.form.levelInhibit'),
      value: yesNo(spec.levelInhibit),
    },
    {
      key: 'evalIntervalS',
      label: t('pages.monitor.rule.form.evalInterval'),
      value: seconds(spec.evalIntervalS),
    },
    {
      key: 'forS',
      label: t('pages.monitor.rule.form.for'),
      value: seconds(spec.forS),
    },
    {
      key: 'recoverS',
      label: t('pages.monitor.rule.form.recover'),
      value: seconds(spec.recoverS),
    },
    {
      key: 'nodataKeepS',
      label: t('pages.monitor.rule.form.nodataKeep'),
      value: seconds(spec.nodataKeepS),
    },
    {
      key: 'effective',
      label: t('pages.monitor.rule.form.effective'),
      value: calendar
        ? t(`pages.monitor.rule.form.effectiveMode.${full.effective.mode}`)
        : spec.effective?.windows?.length
          ? [
              ...spec.effective.windows.map(ctx.windowText),
              spec.effective.timezone || 'UTC',
            ].join('\n')
          : t('pages.monitor.rule.form.effective.always'),
    },
    {
      key: 'annotations',
      label: t('pages.monitor.rule.form.annotations'),
      value: kv(spec.annotations),
    },
    {
      key: 'recoveryExpr',
      label: t('pages.monitor.rule.form.recoveryExpr'),
      value: spec.recoveryExpr ?? '',
      code: true,
    },
    {
      key: 'ciMatch',
      label: t('pages.monitor.rule.ci.mode'),
      value: ciMatch.disabled
        ? t('pages.monitor.rule.ci.mode.off')
        : lines([
            ciMatch.label
              ? t('pages.monitor.rule.version.ciMatch.custom', {
                  label: ciMatch.label,
                  target:
                    ciMatch.by === 'attr'
                      ? t('pages.monitor.rule.version.ciMatch.attr', {
                          attr: ciMatch.attr || 'ip',
                        })
                      : t('pages.monitor.rule.ci.by.name'),
                })
              : t('pages.monitor.rule.ci.mode.default'),
            ciMatch.modelCodes.length > 0 &&
              t('pages.monitor.rule.version.models', {
                items: list(ciMatch.modelCodes),
              }),
          ]),
    },
    {
      key: 'enrichTags',
      label: t('pages.monitor.rule.ci.enrichTags'),
      value: ciMatch.enrichTags.join('\n'),
    },
    {
      key: 'resourceScope',
      label: t('pages.monitor.rule.ci.scope'),
      value: resourceScope.enabled
        ? lines([
            t('pages.monitor.rule.version.models', {
              items: or(list(resourceScope.modelCodes), unlimited),
            }),
            t('pages.monitor.rule.version.envs', {
              items: or(list(resourceScope.envs), unlimited),
            }),
            t('pages.monitor.rule.version.tags', {
              items: or(list(resourceScope.tags), unlimited),
            }),
          ])
        : yesNo(false),
    },
    {
      key: 'topologyInhibit',
      label: t('pages.monitor.rule.ci.topology'),
      value: yesNo(full.topologyInhibit),
    },
    {
      key: 'relabel',
      label: t('pages.monitor.rule.relabel'),
      // 每步一行，只列该动作用得到的字段（留空的写出实际生效的缺省值）
      value: full.relabel
        .map((step, index) => {
          const head = `${index + 1}. ${step.action ?? '?'}`;
          if (step.action === 'replace') {
            return `${head}  [${step.sourceLabels.join(', ')}] sep="${step.separator || ';'}" regex="${step.regex || '(.*)'}" → ${step.targetLabel} = "${step.replacement || '$1'}"`;
          }
          if (step.action === 'labelmap') {
            return `${head}  regex="${step.regex}" → "${step.replacement || '$1'}"`;
          }
          return `${head}  regex="${step.regex}"`;
        })
        .join('\n'),
      code: true,
    },
    {
      key: 'dropExpr',
      label: t('pages.monitor.rule.dropExpr'),
      value: full.dropExpr,
      code: true,
    },
    {
      key: 'userIds',
      label: t('pages.monitor.common.users'),
      value: refs(spec.notify?.userIds),
    },
    {
      key: 'scheduleIds',
      label: t('pages.monitor.common.schedules'),
      value: refs(spec.notify?.scheduleIds),
    },
    {
      key: 'deptIds',
      label: t('pages.monitor.rule.form.depts'),
      value: refs(spec.notify?.deptIds),
    },
    {
      key: 'ciOwner',
      label: t('pages.monitor.rule.ci.owner'),
      value: yesNo(full.notify.ciOwner),
    },
    {
      key: 'notifyRecovery',
      label: t('pages.monitor.rule.form.notifyRecovery'),
      value: yesNo(spec.notifyRecovery),
    },
    {
      key: 'repeatIntervalM',
      label: t('pages.monitor.rule.form.repeatInterval'),
      value: spec.repeatIntervalM
        ? t('pages.monitor.unit.minutes', { n: spec.repeatIntervalM })
        : t('pages.monitor.rule.noRepeat'),
    },
    {
      key: 'maxNotify',
      label: t('pages.monitor.rule.form.maxNotify'),
      value: spec.maxNotify
        ? String(spec.maxNotify)
        : t('pages.monitor.common.unlimited'),
    },
    {
      key: 'groupKeyLabels',
      label: t('pages.monitor.rule.form.groupKeyLabels'),
      value: (spec.groupKeyLabels ?? []).join(', '),
    },
    {
      key: 'escalationId',
      label: t('pages.monitor.rule.form.escalation'),
      value: full.escalationId ? name(full.escalationId) : '',
    },
    {
      key: 'ticketAction',
      label: t('pages.monitor.rule.action.ticket'),
      value: actions.ticket.enabled
        ? lines([
            t('pages.monitor.rule.version.ticket.template', {
              name: name(actions.ticket.templateId),
            }),
            t('pages.monitor.rule.version.ticket.agent', {
              name: name(actions.ticket.agentUserId),
            }),
          ])
        : yesNo(false),
    },
    {
      key: 'workflowAction',
      label: t('pages.monitor.rule.action.workflow'),
      value: actions.workflow.enabled
        ? lines([
            t('pages.monitor.rule.version.workflow.definition', {
              name: name(actions.workflow.definitionKey),
            }),
            t('pages.monitor.rule.version.workflow.agent', {
              name: name(actions.workflow.agentUserId),
            }),
          ])
        : yesNo(false),
    },
    {
      key: 'aiSummary',
      label: t('pages.monitor.rule.action.ai'),
      value: yesNo(actions.aiSummary),
    },
  ];
};
