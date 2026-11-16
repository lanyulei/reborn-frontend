/**
 * 节点 / 分支的配置面板（右侧抽屉的内容）：编辑选中的元素并即时回写到流程结构。
 * 选人、选角色的数据来源由使用方注入，面板不依赖任何业务接口。
 */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Checkbox,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Segmented,
  Select,
  Switch,
  Typography,
} from 'antd';
import type React from 'react';
import { DeptSelect } from '@/components/DeptSelect';
import { type UserOption, UserSelect } from '@/components/UserSelect';
import { useT } from '@/utils/i18n';
import {
  type AssigneeRule,
  type AssigneeRuleKind,
  type Branch,
  type BranchCondition,
  type BranchEnd,
  type ConditionValueType,
  conditionIncomplete,
  conditionToExpr,
  DURATION_UNITS,
  type DurationUnit,
  emptyCondition,
  FIELD_PERMISSION_MAX,
  FIELD_PERMISSIONS,
  type FieldPermission,
  type FieldPermissionRow,
  type Flow,
  type FlowDuration,
  type FlowNode,
  type GroupMode,
  hasAssignee,
  invalidPermissionRows,
  isConditional,
  jumpTargetsOf,
  listTasks,
  mustJoin,
  parallelPathOf,
  SIGNAL_PATTERN,
  type StepNode,
  TIMEOUT_ACTIONS,
  TIMER_MODES,
  type TimeoutAction,
  type TimerMode,
} from './model';

const RULE_KINDS: readonly AssigneeRuleKind[] = [
  'user',
  'role',
  'initiator',
  'deptLeader',
  'deptLeaderOf',
  'formUser',
  'formDeptLeader',
];

const CONDITION_OPS = ['==', '!=', '>', '>=', '<', '<=', 'contains'] as const;
/** 条件值的类型；auto = 按值的样子推断 */
const VALUE_TYPES = ['auto', 'string', 'number', 'bool'] as const;

/** 处理人规则 / 流程管理员数量上限（与后端校验一致） */
const MAX_RULES = 10;
const MAX_RULE_TARGETS = 50;
const MAX_DEPT_LEVEL = 10;
const NAME_MAX = 32;
const CONDITION_MAX = 1024;
/** 时长上限（与后端校验一致：折合不超过一年） */
const DURATION_MAX: Record<DurationUnit, number> = {
  minute: 366 * 24 * 60,
  hour: 366 * 24,
  day: 366,
};

export interface FlowConfigDeps {
  /** 用户候选（按关键字） */
  fetchUsers: (keyword: string) => Promise<UserOption[]>;
  /** 可选角色 */
  roles: readonly { code: string; name: string }[];
  /** 表单字段（条件 / 表单人员规则的候选）；不传则手工填写字段码 */
  fields?: readonly { code: string; name: string }[];
  /** 自动任务可调用的 Webhook 端点 */
  webhooks?: readonly { id: string; name: string; enabled: boolean }[];
  /** 可作为子流程发起的流程（不含当前流程自身） */
  definitions?: readonly { key: string; name: string }[];
  /**
   * 使用该流程的表单（如绑定了它的工单模板）及各自的字段：配置表单权限时先选表单、
   * 再从它的字段里选；不传或为空则手工填写字段码
   */
  fieldGroups?: readonly FieldGroup[];
}

/** 一张使用该流程的表单及其字段 */
export interface FieldGroup {
  key: string;
  name: string;
  fields: readonly { code: string; name: string }[];
}

/** 在流程副本里定位节点或分支并修改 */
const patchFlow = (
  flow: Flow,
  id: string,
  fn: (target: { node?: StepNode; branch?: Branch }) => void,
): Flow => {
  const draft = structuredClone(flow);
  const visit = (nodes: FlowNode[]): boolean => {
    for (const node of nodes) {
      if (node.kind !== 'branch') {
        if (node.id === id) {
          fn({ node });
          return true;
        }
        continue;
      }
      for (const branch of node.branches) {
        if (branch.id === id) {
          fn({ branch });
          return true;
        }
        if (visit(branch.nodes)) return true;
      }
    }
    return false;
  };
  visit(draft.nodes);
  return draft;
};

interface Target {
  node?: StepNode;
  branch?: Branch;
  /** 分支所在分支组的类型 */
  mode?: GroupMode;
}

/** 查找选中的元素（节点或分支，及分支所在分支组的类型） */
export const findTarget = (flow: Flow, id?: string): Target => {
  if (!id) return {};
  const visit = (nodes: readonly FlowNode[]): Target | undefined => {
    for (const node of nodes) {
      if (node.kind !== 'branch') {
        if (node.id === id) return { node };
        continue;
      }
      for (const branch of node.branches) {
        if (branch.id === id) {
          return { branch, mode: node.mode };
        }
        const found = visit(branch.nodes);
        if (found) return found;
      }
    }
    return undefined;
  };
  return visit(flow.nodes) ?? {};
};

/** 字段输入：有候选字段时为下拉，否则手工填写字段码 */
const FieldInput: React.FC<{
  value?: string;
  onChange: (value: string) => void;
  fields?: FlowConfigDeps['fields'];
  placeholder: string;
  style?: React.CSSProperties;
}> = ({ value, onChange, fields, placeholder, style }) =>
  fields?.length ? (
    <Select
      style={style}
      value={value || undefined}
      placeholder={placeholder}
      showSearch={{ optionFilterProp: 'label' }}
      options={fields.map((f) => ({ value: f.code, label: f.name }))}
      onChange={(v) => onChange(v ?? '')}
    />
  ) : (
    <Input
      style={style}
      value={value}
      maxLength={64}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );

/** 一条处理人规则的取值控件 */
const RuleValue: React.FC<{
  rule: AssigneeRule;
  onChange: (rule: AssigneeRule) => void;
  deps: FlowConfigDeps;
}> = ({ rule, onChange, deps }) => {
  const t = useT();
  const fill = { flex: 1, minWidth: 0 } as const;
  switch (rule.kind) {
    case 'user':
      return (
        <UserSelect
          multiple
          maxCount={MAX_RULE_TARGETS}
          style={fill}
          fetchUsers={deps.fetchUsers}
          knownUsers={(rule.userIds ?? []).map((id) => ({
            id,
            label: rule.labels?.[id] ?? id,
          }))}
          value={rule.userIds ?? []}
          placeholder={t('component.flow.rule.user.placeholder')}
          onLabeledChange={(users) =>
            onChange({
              ...rule,
              userIds: users.map((u) => u.id),
              labels: Object.fromEntries(users.map((u) => [u.id, u.label])),
            })
          }
        />
      );
    case 'role':
      return (
        <Select
          mode="multiple"
          maxCount={MAX_RULE_TARGETS}
          style={fill}
          value={rule.roleCodes ?? []}
          placeholder={t('component.flow.rule.role.placeholder')}
          showSearch={{ optionFilterProp: 'label' }}
          options={deps.roles.map((r) => ({ value: r.code, label: r.name }))}
          onChange={(codes: string[]) =>
            onChange({
              ...rule,
              roleCodes: codes,
              labels: Object.fromEntries(
                codes.map((code) => [
                  code,
                  deps.roles.find((r) => r.code === code)?.name ??
                    rule.labels?.[code] ??
                    code,
                ]),
              ),
            })
          }
        />
      );
    case 'deptLeader':
      return (
        <InputNumber
          style={fill}
          min={1}
          max={MAX_DEPT_LEVEL}
          precision={0}
          value={rule.level ?? 1}
          prefix={t('component.flow.rule.deptLeader.prefix')}
          suffix={t('component.flow.rule.deptLeader.suffix')}
          onChange={(level) => onChange({ ...rule, level: level ?? 1 })}
        />
      );
    case 'deptLeaderOf':
      return (
        <DeptSelect
          style={fill}
          allowClear={false}
          value={rule.deptId}
          knownDepts={
            rule.deptId
              ? [
                  {
                    id: rule.deptId,
                    name: rule.labels?.[rule.deptId] ?? rule.deptId,
                  },
                ]
              : undefined
          }
          placeholder={t('component.flow.rule.deptLeaderOf.placeholder')}
          onLabeledChange={(dept) =>
            onChange({
              ...rule,
              deptId: dept?.id,
              labels: dept ? { [dept.id]: dept.name } : {},
            })
          }
        />
      );
    case 'formUser':
    case 'formDeptLeader':
      return (
        <FieldInput
          style={fill}
          value={rule.field}
          fields={deps.fields}
          placeholder={t('component.flow.rule.field.placeholder')}
          onChange={(field) => onChange({ ...rule, field })}
        />
      );
    default:
      return (
        <Typography.Text type="secondary" style={fill}>
          {t('component.flow.rule.initiator.hint')}
        </Typography.Text>
      );
  }
};

/** 时长输入：数值 + 单位（+ 是否按工作时间） */
const DurationInput: React.FC<{
  value: FlowDuration;
  onChange: (value: FlowDuration) => void;
  /** 单位与日历由外部决定时锁定（超时提醒的提前量跟随时限） */
  lockUnit?: boolean;
  max?: number;
}> = ({ value, onChange, lockUnit, max }) => {
  const t = useT();
  return (
    <Flex gap={8} align="center" wrap>
      <InputNumber
        style={{ width: 120 }}
        min={1}
        max={max ?? DURATION_MAX[value.unit]}
        precision={0}
        value={value.value}
        onChange={(v) => onChange({ ...value, value: v ?? 1 })}
      />
      <Select
        style={{ width: 96 }}
        disabled={lockUnit}
        value={value.unit}
        options={DURATION_UNITS.map((unit) => ({
          value: unit,
          label: t(`component.flow.unit.${unit}`),
        }))}
        onChange={(unit: DurationUnit) =>
          onChange({
            ...value,
            unit,
            value: Math.min(value.value, DURATION_MAX[unit]),
          })
        }
      />
      {!lockUnit && (
        <Checkbox
          checked={!!value.workTime}
          onChange={(e) =>
            onChange({ ...value, workTime: e.target.checked || undefined })
          }
        >
          {t('component.flow.duration.workTime')}
        </Checkbox>
      )}
    </Flex>
  );
};

/** 定时 / 自动任务 / 子流程节点的配置 */
const WaitForm: React.FC<{
  node: StepNode;
  deps: FlowConfigDeps;
  update: (fn: (node: StepNode) => void) => void;
}> = ({ node, deps, update }) => {
  const t = useT();
  const name = (
    <Form.Item label={t('component.flow.field.name')} required>
      <Input
        value={node.name}
        maxLength={NAME_MAX}
        showCount
        onChange={(e) =>
          update((n) => {
            n.name = e.target.value;
          })
        }
      />
    </Form.Item>
  );
  if (node.kind === 'timer') {
    const timer = node.timer ?? { mode: 'delay' as const };
    const signal = timer.signal ?? '';
    return (
      <Form layout="vertical">
        {name}
        <Form.Item label={t('component.flow.field.timerMode')} required>
          <Radio.Group
            value={timer.mode}
            options={TIMER_MODES.map((mode) => ({
              value: mode,
              label: t(`component.flow.timer.${mode}`),
            }))}
            onChange={(e) =>
              update((n) => {
                const mode = e.target.value as TimerMode;
                n.timer = {
                  ...timer,
                  mode,
                  duration:
                    mode === 'delay'
                      ? (timer.duration ?? { value: 1, unit: 'hour' })
                      : timer.duration,
                };
              })
            }
          />
        </Form.Item>
        {timer.mode === 'delay' && (
          <Form.Item label={t('component.flow.field.duration')} required>
            <DurationInput
              value={timer.duration ?? { value: 1, unit: 'hour' }}
              onChange={(duration) =>
                update((n) => {
                  n.timer = { ...timer, duration };
                })
              }
            />
          </Form.Item>
        )}
        {timer.mode === 'until' && (
          <Form.Item
            label={t('component.flow.field.untilField')}
            required
            extra={t('component.flow.field.untilField.extra')}
          >
            <FieldInput
              value={timer.field}
              fields={deps.fields}
              placeholder={t('component.flow.rule.field.placeholder')}
              onChange={(field) =>
                update((n) => {
                  n.timer = { ...timer, field };
                })
              }
            />
          </Form.Item>
        )}
        {timer.mode === 'signal' && (
          <Form.Item
            label={t('component.flow.field.signal')}
            required
            validateStatus={
              signal && !SIGNAL_PATTERN.test(signal) ? 'error' : undefined
            }
            help={
              signal && !SIGNAL_PATTERN.test(signal)
                ? t('component.flow.field.signal.pattern')
                : undefined
            }
            extra={t('component.flow.field.signal.extra')}
          >
            <Input
              value={signal}
              maxLength={64}
              placeholder="payment.confirmed"
              onChange={(e) =>
                update((n) => {
                  n.timer = { ...timer, signal: e.target.value.trim() };
                })
              }
            />
          </Form.Item>
        )}
      </Form>
    );
  }
  if (node.kind === 'service') {
    const id = node.service?.webhookId ?? '';
    const hooks = deps.webhooks ?? [];
    const current = hooks.find((h) => h.id === id);
    return (
      <Form layout="vertical">
        {name}
        <Form.Item
          label={t('component.flow.field.webhook')}
          required
          extra={t('component.flow.field.webhook.extra')}
        >
          <Select
            value={id || undefined}
            placeholder={t('component.flow.field.webhook.placeholder')}
            showSearch={{ optionFilterProp: 'label' }}
            options={[
              ...hooks.map((h) => ({
                value: h.id,
                label: h.enabled
                  ? h.name
                  : t('component.flow.field.webhook.disabled', {
                      name: h.name,
                    }),
              })),
              // 已选的端点不在列表里（被删除 / 无权查看）：仍列出以便看清并改掉
              ...(id && !current
                ? [{ value: id, label: node.service?.label || id }]
                : []),
            ]}
            onChange={(webhookId: string) =>
              update((n) => {
                n.service = {
                  webhookId,
                  label: hooks.find((h) => h.id === webhookId)?.name,
                };
              })
            }
          />
        </Form.Item>
        {id && deps.webhooks && !current?.enabled && (
          <Alert
            type="warning"
            showIcon
            title={t(
              current
                ? 'component.flow.field.webhook.warn.disabled'
                : 'component.flow.field.webhook.warn.missing',
            )}
          />
        )}
      </Form>
    );
  }
  const key = node.subProcess?.definitionKey ?? '';
  const definitions = deps.definitions ?? [];
  return (
    <Form layout="vertical">
      {name}
      <Form.Item
        label={t('component.flow.field.subProcess')}
        required
        extra={t('component.flow.field.subProcess.extra')}
      >
        <Select
          value={key || undefined}
          placeholder={t('component.flow.field.subProcess.placeholder')}
          showSearch={{ optionFilterProp: 'label' }}
          options={[
            ...definitions.map((d) => ({ value: d.key, label: d.name })),
            ...(key && !definitions.some((d) => d.key === key)
              ? [{ value: key, label: node.subProcess?.label || key }]
              : []),
          ]}
          onChange={(definitionKey: string) =>
            update((n) => {
              n.subProcess = {
                definitionKey,
                label: definitions.find((d) => d.key === definitionKey)?.name,
              };
            })
          }
        />
      </Form.Item>
    </Form>
  );
};

/** 表单权限里「所有表单」这一项的取值（行上的 form 留空） */
const ALL_FORMS = '';

/**
 * 表单字段权限：流程走到这个节点时，处理人对各表单字段能做什么。每条权限属于一张使用该流程
 * 的表单（如工单模板），或对所有表单生效；同一字段在某张表单上有专属配置时以专属为准。
 * 没列出的字段只读可见。
 */
const PermissionsField: React.FC<{
  node: StepNode;
  update: (fn: (node: StepNode) => void) => void;
  groups?: readonly FieldGroup[];
}> = ({ node, update, groups = [] }) => {
  const t = useT();
  const rows = node.formPermissions ?? [];
  const bad = invalidPermissionRows(rows);
  const setRow = (index: number, patch: Partial<FieldPermissionRow>) =>
    update((n) => {
      n.formPermissions = rows.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      );
    });
  // 「所有表单」可选的字段：各表单字段的并集（按字段码去重）
  const allFields = [
    ...new Map(
      groups.flatMap((g) => g.fields).map((f) => [f.code, f] as const),
    ).values(),
  ];
  const fieldsOf = (form?: string) =>
    form ? (groups.find((g) => g.key === form)?.fields ?? []) : allFields;
  return (
    <Form.Item
      label={t('component.flow.field.permissions')}
      tooltip={t('component.flow.field.permissions.tooltip')}
      validateStatus={bad.size ? 'error' : undefined}
      help={
        bad.size ? t('component.flow.field.permissions.invalid') : undefined
      }
    >
      <Flex vertical gap={8}>
        {rows.map((row, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 行没有稳定标识，且只在末尾增删
          <Flex key={index} gap={8} align="center">
            {groups.length > 0 ? (
              <>
                {/* 这条权限属于哪张表单；换表单后原来选的字段不一定还在，清空重选 */}
                <Select
                  style={{ width: 170, flex: 'none' }}
                  value={row.form ?? ALL_FORMS}
                  aria-label={t('component.flow.field.permissions.template')}
                  showSearch={{ optionFilterProp: 'label' }}
                  options={[
                    {
                      value: ALL_FORMS,
                      label: t('component.flow.field.permissions.allForms'),
                    },
                    ...groups.map((g) => ({ value: g.key, label: g.name })),
                  ]}
                  onChange={(value: string) =>
                    setRow(index, {
                      form: value === ALL_FORMS ? undefined : value,
                      field: '',
                    })
                  }
                />
                <Select
                  style={{ flex: 1, minWidth: 0 }}
                  value={row.field || undefined}
                  status={bad.has(index) ? 'error' : undefined}
                  placeholder={t('component.flow.field.permissions.select')}
                  aria-label={t('component.flow.field.permissions.code')}
                  showSearch={{ optionFilterProp: 'label' }}
                  options={fieldsOf(row.form).map((f) => ({
                    value: f.code,
                    label: `${f.name}（${f.code}）`,
                  }))}
                  onChange={(field: string) => setRow(index, { field })}
                />
              </>
            ) : (
              // 没有可选的表单（没有模板绑定这个流程，或无权查看模板）：手工填写字段码
              <Input
                style={{ flex: 1 }}
                value={row.field}
                maxLength={32}
                status={bad.has(index) ? 'error' : undefined}
                placeholder={t('component.flow.field.permissions.code')}
                aria-label={t('component.flow.field.permissions.code')}
                onChange={(e) =>
                  setRow(index, { field: e.target.value.trim() })
                }
              />
            )}
            <Select
              style={{ width: 110, flex: 'none' }}
              value={row.perm}
              aria-label={t('component.flow.field.permissions')}
              options={FIELD_PERMISSIONS.map((perm) => ({
                value: perm,
                label: t(`component.flow.permission.${perm}`),
              }))}
              onChange={(perm: FieldPermission) => setRow(index, { perm })}
            />
            <Button
              type="text"
              icon={<DeleteOutlined />}
              aria-label={t('common.action.delete')}
              onClick={() =>
                update((n) => {
                  const next = rows.filter((_r, i) => i !== index);
                  n.formPermissions = next.length ? next : undefined;
                })
              }
            />
          </Flex>
        ))}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          disabled={rows.length >= FIELD_PERMISSION_MAX}
          onClick={() =>
            update((n) => {
              // 新的一行沿用上一行的表单；第一行缺省为第一张表单
              const form = rows.length
                ? rows[rows.length - 1].form
                : groups[0]?.key;
              n.formPermissions = [
                ...rows,
                { form, field: '', perm: 'editable' },
              ];
            })
          }
        >
          {t('component.flow.field.permissions.add')}
        </Button>
      </Flex>
    </Form.Item>
  );
};

/** 人工任务的处理时限：多久算超时、超时后做什么、是否提前提醒 */
const TimeoutField: React.FC<{
  node: StepNode;
  update: (fn: (node: StepNode) => void) => void;
}> = ({ node, update }) => {
  const t = useT();
  const timeout = node.timeout;
  return (
    <Form.Item
      label={t('component.flow.field.timeout')}
      tooltip={t('component.flow.field.timeout.tooltip')}
    >
      <Flex vertical gap={12}>
        <Switch
          style={{ alignSelf: 'flex-start' }}
          checked={!!timeout}
          aria-label={t('component.flow.field.timeout')}
          onChange={(on) =>
            update((n) => {
              n.timeout = on
                ? { value: 1, unit: 'day', workTime: true, action: 'remind' }
                : undefined;
            })
          }
        />
        {timeout && (
          <>
            <DurationInput
              value={timeout}
              onChange={(d) =>
                update((n) => {
                  // 提前量须小于时限：时限改小后不再成立的提前量清掉
                  n.timeout = {
                    ...timeout,
                    ...d,
                    remind:
                      timeout.remind && timeout.remind < d.value
                        ? timeout.remind
                        : undefined,
                  };
                })
              }
            />
            <Select
              value={timeout.action}
              aria-label={t('component.flow.field.timeout.action')}
              options={TIMEOUT_ACTIONS.map((action) => ({
                value: action,
                label: t(`component.flow.timeout.${action}`),
              }))}
              onChange={(action: TimeoutAction) =>
                update((n) => {
                  n.timeout = { ...timeout, action };
                })
              }
            />
            <Flex gap={8} align="center" wrap>
              <Checkbox
                checked={!!timeout.remind}
                // 时限只有 1 个单位时没有「提前」的余地
                disabled={timeout.value <= 1}
                onChange={(e) =>
                  update((n) => {
                    n.timeout = {
                      ...timeout,
                      remind: e.target.checked ? 1 : undefined,
                    };
                  })
                }
              >
                {t('component.flow.field.timeout.remind')}
              </Checkbox>
              {!!timeout.remind && (
                <InputNumber
                  style={{ width: 140 }}
                  min={1}
                  max={timeout.value - 1}
                  precision={0}
                  value={timeout.remind}
                  suffix={t(`component.flow.unit.${timeout.unit}`)}
                  onChange={(v) =>
                    update((n) => {
                      n.timeout = { ...timeout, remind: v ?? 1 };
                    })
                  }
                />
              )}
            </Flex>
          </>
        )}
      </Flex>
    </Form.Item>
  );
};

/** 节点配置：名称、处理人规则、多人模式、处理人为空策略、拒绝去向、处理时限 */
const StepForm: React.FC<{
  flow: Flow;
  node: StepNode;
  deps: FlowConfigDeps;
  update: (fn: (node: StepNode) => void) => void;
}> = ({ flow, node, deps, update }) => {
  const t = useT();
  const path = parallelPathOf(flow, node.id);
  // 拒绝去向只能是同一并行分支内的其他人工任务
  const rejectTargets = listTasks(flow).filter(
    (n) => n.id !== node.id && parallelPathOf(flow, n.id) === path,
  );
  const setRule = (index: number, rule: AssigneeRule) =>
    update((n) => {
      n.assignee.rules[index] = rule;
    });
  return (
    <Form layout="vertical">
      <Form.Item label={t('component.flow.field.name')} required>
        <Input
          value={node.name}
          maxLength={NAME_MAX}
          showCount
          onChange={(e) =>
            update((n) => {
              n.name = e.target.value;
            })
          }
        />
      </Form.Item>
      <Form.Item
        label={t(`component.flow.field.assignee.${node.kind}`)}
        required
        tooltip={t('component.flow.field.assignee.tooltip')}
      >
        <Flex vertical gap={8}>
          {node.assignee.rules.map((rule, index) => (
            // 规则没有稳定标识，顺序即身份
            // biome-ignore lint/suspicious/noArrayIndexKey: 规则列表按位置编辑
            <Flex gap={8} align="center" key={index}>
              <Select
                style={{ width: 132 }}
                value={rule.kind}
                options={RULE_KINDS.map((kind) => ({
                  value: kind,
                  label: t(`component.flow.rule.${kind}`),
                }))}
                onChange={(kind: AssigneeRuleKind) =>
                  setRule(index, {
                    kind,
                    level: kind === 'deptLeader' ? 1 : undefined,
                  })
                }
              />
              <RuleValue
                rule={rule}
                deps={deps}
                onChange={(next) => setRule(index, next)}
              />
              <Button
                type="text"
                icon={<DeleteOutlined />}
                aria-label={t('common.action.delete')}
                onClick={() =>
                  update((n) => {
                    n.assignee.rules.splice(index, 1);
                  })
                }
              />
            </Flex>
          ))}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            disabled={node.assignee.rules.length >= MAX_RULES}
            onClick={() =>
              update((n) => {
                n.assignee.rules.push({ kind: 'user', userIds: [] });
              })
            }
          >
            {t('component.flow.rule.add')}
          </Button>
        </Flex>
      </Form.Item>
      {node.kind === 'task' && (
        <Form.Item
          label={t('component.flow.field.mode')}
          tooltip={t('component.flow.field.mode.tooltip')}
        >
          <Radio.Group
            value={node.assignee.mode ?? 'any'}
            options={(['any', 'all', 'sequential'] as const).map((mode) => ({
              value: mode,
              label: t(`component.flow.mode.${mode}`),
            }))}
            onChange={(e) =>
              update((n) => {
                n.assignee.mode = e.target.value;
              })
            }
          />
        </Form.Item>
      )}
      <Form.Item
        label={t('component.flow.field.onEmpty')}
        tooltip={t('component.flow.field.onEmpty.tooltip')}
      >
        <Radio.Group
          value={node.assignee.onEmpty ?? 'skip'}
          options={(['skip', 'admin'] as const).map((v) => ({
            value: v,
            label: t(`component.flow.onEmpty.${v}`),
          }))}
          onChange={(e) =>
            update((n) => {
              n.assignee.onEmpty = e.target.value;
            })
          }
        />
      </Form.Item>
      {node.kind === 'task' && (
        <Form.Item
          label={t('component.flow.field.rejectTo')}
          tooltip={t('component.flow.field.rejectTo.tooltip')}
        >
          <Select
            allowClear
            value={node.rejectTo}
            placeholder={t('component.flow.field.rejectTo.placeholder')}
            options={rejectTargets.map((n) => ({
              value: n.id,
              label: n.name,
            }))}
            onChange={(to?: string) =>
              update((n) => {
                n.rejectTo = to || undefined;
              })
            }
          />
        </Form.Item>
      )}
      {node.kind === 'task' && <TimeoutField node={node} update={update} />}
      <PermissionsField node={node} update={update} groups={deps.fieldGroups} />
    </Form>
  );
};

/** 分支条件编辑：可视化行（且 / 或）或手写表达式 */
const ConditionEditor: React.FC<{
  value: BranchCondition;
  onChange: (value: BranchCondition) => void;
  fields?: FlowConfigDeps['fields'];
}> = ({ value, onChange, fields }) => {
  const t = useT();
  const setRow = (
    index: number,
    patch: Partial<BranchCondition['rows'][number]>,
  ) =>
    onChange({
      ...value,
      rows: value.rows.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    });
  return (
    <Flex vertical gap={8}>
      <Segmented
        block
        value={value.mode}
        options={[
          { value: 'builder', label: t('component.flow.condition.builder') },
          { value: 'expr', label: t('component.flow.condition.expr') },
        ]}
        onChange={(mode) =>
          onChange({
            ...value,
            mode: mode as BranchCondition['mode'],
            // 切到手写表达式时，把已经搭好的条件带过去作为起点（已有手写内容则保留）
            expr:
              mode === 'expr' && value.expr.trim() === ''
                ? conditionToExpr({ ...value, mode: 'builder' })
                : value.expr,
          })
        }
      />
      {value.mode === 'expr' ? (
        <>
          <Input.TextArea
            value={value.expr}
            maxLength={CONDITION_MAX}
            autoSize={{ minRows: 3, maxRows: 8 }}
            placeholder="form.amount >= 10000 && form.type == 'purchase'"
            onChange={(e) => onChange({ ...value, expr: e.target.value })}
          />
          <Typography.Text type="secondary">
            {t('component.flow.condition.expr.hint')}
          </Typography.Text>
        </>
      ) : (
        <>
          {value.rows.length > 1 && (
            <Radio.Group
              value={value.join}
              options={[
                { value: '&&', label: t('component.flow.condition.and') },
                { value: '||', label: t('component.flow.condition.or') },
              ]}
              onChange={(e) => onChange({ ...value, join: e.target.value })}
            />
          )}
          {value.rows.map((row, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 条件行按位置编辑
            <Flex gap={8} align="center" key={index}>
              <FieldInput
                style={{ flex: 1, minWidth: 0 }}
                value={row.field}
                fields={fields}
                placeholder={t('component.flow.condition.field')}
                onChange={(field) => setRow(index, { field })}
              />
              <Select
                style={{ width: 116 }}
                value={row.op}
                options={CONDITION_OPS.map((op) => ({
                  value: op,
                  label: t(`component.flow.condition.op.${op}`),
                }))}
                onChange={(op) => setRow(index, { op })}
              />
              {row.op !== 'contains' && (
                <Select
                  style={{ width: 84 }}
                  value={row.valueType ?? 'auto'}
                  aria-label={t('component.flow.condition.type')}
                  options={VALUE_TYPES.map((type) => ({
                    value: type,
                    label: t(`component.flow.condition.type.${type}`),
                  }))}
                  onChange={(type: (typeof VALUE_TYPES)[number]) =>
                    setRow(index, {
                      valueType:
                        type === 'auto'
                          ? undefined
                          : (type as ConditionValueType),
                    })
                  }
                />
              )}
              <Input
                style={{ flex: 1, minWidth: 0 }}
                value={row.value}
                maxLength={128}
                placeholder={t('component.flow.condition.value')}
                onChange={(e) => setRow(index, { value: e.target.value })}
              />
              <Button
                type="text"
                icon={<DeleteOutlined />}
                aria-label={t('common.action.delete')}
                disabled={value.rows.length <= 1}
                onClick={() =>
                  onChange({
                    ...value,
                    rows: value.rows.filter((_, i) => i !== index),
                  })
                }
              />
            </Flex>
          ))}
          {conditionIncomplete(value) && (
            <Typography.Text type="warning">
              {t('component.flow.condition.incomplete')}
            </Typography.Text>
          )}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            disabled={value.rows.length >= 10}
            onClick={() =>
              onChange({
                ...value,
                rows: [...value.rows, { field: '', op: '==', value: '' }],
              })
            }
          >
            {t('component.flow.condition.add')}
          </Button>
        </>
      )}
    </Flex>
  );
};

/** 分支配置：名称、条件、末尾去向 */
const BranchForm: React.FC<{
  flow: Flow;
  branch: Branch;
  mode: GroupMode;
  deps: FlowConfigDeps;
  update: (fn: (branch: Branch) => void) => void;
}> = ({ flow, branch, mode, deps, update }) => {
  const t = useT();
  const conditional = isConditional(mode);
  // 并行分支内部不能直接结束流程：其他并行分支还在进行，汇聚永远等不齐
  const insideParallel = !!parallelPathOf(flow, branch.id);
  const jumpTargets = jumpTargetsOf(flow, branch.id);
  const endOptions = [
    { value: 'join', label: t('component.flow.end.join') },
    ...(insideParallel && branch.end.type !== 'end'
      ? []
      : [{ value: 'end', label: t('component.flow.end.finish') }]),
    ...jumpTargets.map((n) => ({
      value: `jump:${n.id}`,
      label: t('component.flow.end.jump', { name: n.name }),
    })),
  ];
  // 已保存的去向如今不再合法（流程后来改了）：仍列出来以便看清并改掉，由后端校验报问题
  if (
    branch.end.type === 'jump' &&
    !jumpTargets.some(
      (n) => branch.end.type === 'jump' && n.id === branch.end.to,
    )
  ) {
    const to = branch.end.to;
    endOptions.push({
      value: `jump:${to}`,
      label: t('component.flow.end.jump', {
        name: listTasks(flow).find((n) => n.id === to)?.name ?? to,
      }),
    });
  }
  const endValue =
    branch.end.type === 'jump' ? `jump:${branch.end.to}` : branch.end.type;
  return (
    <Form layout="vertical">
      <Form.Item label={t('component.flow.field.branchName')} required>
        <Input
          value={branch.name}
          maxLength={NAME_MAX}
          showCount
          onChange={(e) =>
            update((b) => {
              b.name = e.target.value;
            })
          }
        />
      </Form.Item>
      {conditional && !branch.isDefault && (
        <Form.Item
          label={t('component.flow.field.condition')}
          required
          tooltip={t('component.flow.field.condition.tooltip')}
        >
          <ConditionEditor
            value={branch.condition ?? emptyCondition()}
            fields={deps.fields}
            onChange={(condition) =>
              update((b) => {
                b.condition = condition;
              })
            }
          />
        </Form.Item>
      )}
      {conditional && branch.isDefault && (
        <Typography.Paragraph type="secondary">
          {t(
            mode === 'inclusive'
              ? 'component.flow.branch.default.desc.inclusive'
              : 'component.flow.branch.default.desc',
          )}
        </Typography.Paragraph>
      )}
      {mustJoin(mode) ? (
        <Typography.Paragraph type="secondary">
          {t(`component.flow.branch.${mode}.desc`)}
        </Typography.Paragraph>
      ) : (
        <Form.Item
          label={t('component.flow.field.end')}
          tooltip={t('component.flow.field.end.tooltip')}
        >
          <Select
            value={endValue}
            options={endOptions}
            onChange={(v: string) =>
              update((b) => {
                const end: BranchEnd = v.startsWith('jump:')
                  ? { type: 'jump', to: v.slice('jump:'.length) }
                  : { type: v as 'join' | 'end' };
                b.end = end;
              })
            }
          />
        </Form.Item>
      )}
    </Form>
  );
};

/** 配置面板：按选中的元素渲染节点表单或分支表单 */
export const ConfigPanel: React.FC<{
  flow: Flow;
  selectedId?: string;
  onChange: (flow: Flow) => void;
  deps: FlowConfigDeps;
}> = ({ flow, selectedId, onChange, deps }) => {
  const target = findTarget(flow, selectedId);
  if (!selectedId) return null;
  if (target.node) {
    const update = (fn: (node: StepNode) => void) =>
      onChange(patchFlow(flow, selectedId, ({ node }) => node && fn(node)));
    return hasAssignee(target.node) ? (
      <StepForm flow={flow} node={target.node} deps={deps} update={update} />
    ) : (
      <WaitForm node={target.node} deps={deps} update={update} />
    );
  }
  if (target.branch) {
    return (
      <BranchForm
        flow={flow}
        branch={target.branch}
        mode={target.mode ?? 'exclusive'}
        deps={deps}
        update={(fn) =>
          onChange(
            patchFlow(flow, selectedId, ({ branch }) => branch && fn(branch)),
          )
        }
      />
    );
  }
  return null;
};

export default ConfigPanel;
