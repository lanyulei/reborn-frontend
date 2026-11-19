/**
 * 规则批量操作弹窗（单条「移动」也走它）：先填该操作的参数并确认影响的规则数，执行后在
 * 同一弹窗里给出逐条结果（成功 / 失败原因）。逐条独立执行，部分失败不影响其余。
 */
import {
  Alert,
  App,
  Checkbox,
  Form,
  InputNumber,
  Modal,
  Radio,
  Select,
  Switch,
  Table,
  Tag,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { DeptSelect } from '@/components/DeptSelect';
import {
  type KeyValue,
  KeyValueEditor,
  kvToRecord,
  validateKeyValues,
} from '@/components/KeyValueEditor';
import { UserSelect } from '@/components/UserSelect';
import { fetchMonitorUsers } from '@/components/UserSelect/sources';
import { NOTIFY_SEVERITY_META } from '@/constants';
import { listEscalationOptions } from '@/services/monitor/escalation';
import { monitorReasonText } from '@/services/monitor/request';
import { batchRules } from '@/services/monitor/rule';
import type {
  BatchRuleResult,
  BatchRulesBody,
  BatchRulesResult,
  EscalationOption,
  MonitorSeverity,
  RuleBatchAction,
  RuleGroup,
} from '@/services/monitor/typings';
import { useEnumText, useFormRules, useOptions, useT } from '@/utils/i18n';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import { useNotifyTargets } from '../components/hooks';
import {
  BATCH_ACTION_META,
  ESCALATION_MODE_META,
  LABEL_NAME_REGEX,
  MONITOR_LIMITS,
  SEVERITY_ORDER,
} from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { TargetsFailedAlert } from '../components/tags';
import { CandidatesFailedAlert } from './useRuleOptions';

/** 「设置升级策略」逐个分组取候选再求交集；所选规则跨的分组超过这个数时只提供全局策略 */
const ESCALATION_GROUP_MAX = 10;

interface BatchFormValues {
  groupId?: string;
  severity?: MonitorSeverity;
  evalIntervalS?: number | null;
  forS?: number | null;
  recoverS?: number | null;
  labels?: KeyValue[];
  labelNames?: string[];
  /** set_notify：勾选的项才会被修改 */
  setTargets?: boolean;
  userIds?: string[];
  scheduleIds?: string[];
  deptIds?: string[];
  setRecovery?: boolean;
  notifyRecovery?: boolean;
  setRepeat?: boolean;
  repeatIntervalM?: number | null;
  setMaxNotify?: boolean;
  maxNotify?: number | null;
  /** set_escalation：改为指定策略，或取消升级策略 */
  escalationChoice?: 'set' | 'clear';
  escalationId?: string;
}

const DANGER_ACTIONS: readonly RuleBatchAction[] = ['disable', 'delete'];

/** 表单值 → 该操作的请求参数；参数不全时返回 null */
const buildBody = (
  ids: string[],
  action: RuleBatchAction,
  values: BatchFormValues,
): BatchRulesBody | null => {
  const body: BatchRulesBody = { ids, action };
  switch (action) {
    case 'move':
      return values.groupId ? { ...body, groupId: values.groupId } : null;
    case 'set_severity':
      return values.severity ? { ...body, severity: values.severity } : null;
    case 'set_timing': {
      const timing = {
        ...(values.evalIntervalS != null && {
          evalIntervalS: values.evalIntervalS,
        }),
        ...(values.forS != null && { forS: values.forS }),
        ...(values.recoverS != null && { recoverS: values.recoverS }),
      };
      return Object.keys(timing).length ? { ...body, ...timing } : null;
    }
    case 'add_labels':
      return values.labels?.length
        ? { ...body, labels: kvToRecord(values.labels) }
        : null;
    case 'remove_labels':
      return values.labelNames?.length
        ? { ...body, labelNames: values.labelNames }
        : null;
    case 'set_notify': {
      const notify = {
        ...(values.setTargets && {
          notify: {
            userIds: values.userIds ?? [],
            scheduleIds: values.scheduleIds ?? [],
            deptIds: values.deptIds ?? [],
          },
        }),
        ...(values.setRecovery && {
          notifyRecovery: values.notifyRecovery ?? false,
        }),
        ...(values.setRepeat && {
          repeatIntervalM: values.repeatIntervalM ?? 0,
        }),
        ...(values.setMaxNotify && { maxNotify: values.maxNotify ?? 0 }),
      };
      return Object.keys(notify).length ? { ...body, ...notify } : null;
    }
    case 'set_escalation':
      // 取消升级策略 = 不带 escalationId
      if (values.escalationChoice === 'clear') return body;
      return values.escalationId
        ? { ...body, escalationId: values.escalationId }
        : null;
    default:
      return body;
  }
};

export const BatchModal: React.FC<{
  ids: string[];
  action: RuleBatchAction;
  groups: readonly RuleGroup[];
  /** 所选规则所在的分组（去重）：「设置升级策略」据此取这些分组都能引用的策略 */
  ruleGroupIds?: readonly string[];
  onClose: () => void;
  /** 执行过（无论成败）后关闭时调用：刷新列表与分组计数 */
  onDone: () => void;
}> = ({ ids, action, groups, ruleGroupIds, onClose, onDone }) => {
  const t = useT();
  const { message } = App.useApp();
  const { styles } = useMonitorStyles();
  const modeText = useEnumText(ESCALATION_MODE_META);
  const rules = useFormRules();
  const [form] = Form.useForm<BatchFormValues>();
  const severityOptions = useOptions(NOTIFY_SEVERITY_META, SEVERITY_ORDER);
  // 只有「设置通知配置」用到通知对象候选
  const targets = useNotifyTargets(action === 'set_notify');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BatchRulesResult | null>(null);
  const setTargets = Form.useWatch('setTargets', form);
  const setRecovery = Form.useWatch('setRecovery', form);
  const setRepeat = Form.useWatch('setRepeat', form);
  const setMaxNotify = Form.useWatch('setMaxNotify', form);
  const escalationChoice = Form.useWatch('escalationChoice', form);

  // 「设置升级策略」的候选：每条所选规则都能引用的策略 = 各分组候选的交集。分组太多时不逐个请求，
  // 只提供全局策略（任何分组都能引用；任取一个分组的候选即含全部全局策略）。
  const groupKey = [...(ruleGroupIds ?? [])].sort().join(',');
  const globalOnly = (ruleGroupIds ?? []).length > ESCALATION_GROUP_MAX;
  const [escalations, setEscalations] = useState<EscalationOption[]>([]);
  const [escalationsFailed, setEscalationsFailed] = useState(false);
  const [escalationsLoading, setEscalationsLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // attempt 只用来触发重试
  useEffect(() => {
    if (action !== 'set_escalation' || !groupKey) return;
    const groupIds = groupKey.split(',');
    const queried =
      groupIds.length > ESCALATION_GROUP_MAX ? groupIds.slice(0, 1) : groupIds;
    let cancelled = false;
    setEscalationsLoading(true);
    Promise.all(queried.map((groupId) => listEscalationOptions(groupId)))
      .then((results) => {
        if (cancelled) return;
        const [first, ...rest] = results.map((result) => result.items ?? []);
        setEscalations(
          first.filter((item) =>
            groupIds.length > ESCALATION_GROUP_MAX
              ? item.global
              : rest.every((list) => list.some((o) => o.id === item.id)),
          ),
        );
        setEscalationsFailed(false);
      })
      .catch(() => {
        if (!cancelled) setEscalationsFailed(true);
      })
      .finally(() => {
        if (!cancelled) setEscalationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [action, groupKey, attempt]);
  const escalationById = new Map(escalations.map((item) => [item.id, item]));

  const close = () => {
    if (result) onDone();
    onClose();
  };

  const submit = async () => {
    const values = await form.validateFields().catch(() => undefined);
    // 校验不通过：错误已显示在表单项上
    if (!values) return;
    const body = buildBody(ids, action, values);
    if (!body) {
      // 参数都没填（修改时间参数 / 通知配置时每项都是可选的）
      message.warning(t('pages.monitor.rule.batch.nothing'));
      return;
    }
    setSubmitting(true);
    try {
      setResult(await batchRules(body));
    } catch {
      // 已由请求层提示
    } finally {
      setSubmitting(false);
    }
  };

  const fields = () => {
    switch (action) {
      case 'move':
        return (
          <Form.Item
            name="groupId"
            label={t('pages.monitor.rule.batch.targetGroup')}
            rules={[rules.select(t('pages.monitor.rule.batch.targetGroup'))]}
          >
            <GroupTreeSelect
              groups={groups}
              minLevel={2}
              allowClear={false}
              placeholder={t('pages.monitor.common.group.placeholder')}
            />
          </Form.Item>
        );
      case 'set_severity':
        return (
          <Form.Item
            name="severity"
            label={t('pages.monitor.alert.column.severity')}
            extra={t('pages.monitor.rule.batch.severity.hint')}
            rules={[rules.select(t('pages.monitor.alert.column.severity'))]}
          >
            <Select options={severityOptions} />
          </Form.Item>
        );
      case 'set_timing':
        return (
          <>
            <Alert
              type="info"
              showIcon
              title={t('pages.monitor.rule.batch.timing.hint')}
              style={{ marginBottom: 16 }}
            />
            <Form.Item
              name="evalIntervalS"
              label={t('pages.monitor.rule.form.evalInterval')}
            >
              <InputNumber
                style={{ width: '100%' }}
                precision={0}
                min={MONITOR_LIMITS.evalInterval.min}
                max={MONITOR_LIMITS.evalInterval.max}
                suffix={t('pages.monitor.unit.second')}
              />
            </Form.Item>
            <Form.Item name="forS" label={t('pages.monitor.rule.form.for')}>
              <InputNumber
                style={{ width: '100%' }}
                precision={0}
                min={MONITOR_LIMITS.holdSeconds.min}
                max={MONITOR_LIMITS.holdSeconds.max}
                suffix={t('pages.monitor.unit.second')}
              />
            </Form.Item>
            <Form.Item
              name="recoverS"
              label={t('pages.monitor.rule.form.recover')}
            >
              <InputNumber
                style={{ width: '100%' }}
                precision={0}
                min={MONITOR_LIMITS.holdSeconds.min}
                max={MONITOR_LIMITS.holdSeconds.max}
                suffix={t('pages.monitor.unit.second')}
              />
            </Form.Item>
          </>
        );
      case 'add_labels':
        return (
          <Form.Item
            name="labels"
            label={t('pages.monitor.rule.form.labels')}
            extra={t('pages.monitor.rule.batch.addLabels.hint')}
            rules={[
              {
                validator: (_: unknown, value?: KeyValue[]) =>
                  (value ?? []).length > 0 &&
                  validateKeyValues(value, {
                    keyPattern: LABEL_NAME_REGEX,
                    keyMax: 128,
                    valueMax: MONITOR_LIMITS.labelValueMax,
                    valueRequired: true,
                    forbidKeyPrefix: '__',
                  })
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(t('pages.monitor.rule.form.labels.rule')),
                      ),
              },
            ]}
          >
            <KeyValueEditor
              max={MONITOR_LIMITS.ruleLabelMax}
              keyPlaceholder="team"
              valuePlaceholder="infra"
              addText={t('pages.monitor.rule.form.labels.add')}
            />
          </Form.Item>
        );
      case 'remove_labels':
        return (
          <Form.Item
            name="labelNames"
            label={t('pages.monitor.rule.batch.labelNames')}
            rules={[
              {
                validator: (_: unknown, value?: string[]) =>
                  (value ?? []).length > 0 &&
                  (value ?? []).every((item) => LABEL_NAME_REGEX.test(item))
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(
                          t('pages.monitor.rule.batch.labelNames.rule'),
                        ),
                      ),
              },
            ]}
          >
            <Select
              mode="tags"
              open={false}
              suffix={null}
              maxCount={MONITOR_LIMITS.ruleLabelMax}
              tokenSeparators={[',', ' ']}
              placeholder="team"
            />
          </Form.Item>
        );
      case 'set_notify':
        return (
          <>
            <Alert
              type="info"
              showIcon
              title={t('pages.monitor.rule.batch.notify.hint')}
              style={{ marginBottom: 16 }}
            />
            <Form.Item name="setTargets" valuePropName="checked">
              <Checkbox>
                {t('pages.monitor.rule.batch.notify.targets')}
              </Checkbox>
            </Form.Item>
            {setTargets && (
              <>
                <TargetsFailedAlert targets={targets} />
                <Form.Item
                  name="userIds"
                  label={t('pages.monitor.common.users')}
                >
                  <UserSelect
                    multiple
                    maxCount={MONITOR_LIMITS.notifyUserMax}
                    fetchUsers={fetchMonitorUsers}
                    placeholder={t('pages.monitor.common.users.placeholder')}
                  />
                </Form.Item>
                <Form.Item
                  name="scheduleIds"
                  label={t('pages.monitor.common.schedules')}
                >
                  <Select
                    mode="multiple"
                    maxCount={MONITOR_LIMITS.notifyScheduleMax}
                    showSearch={{ optionFilterProp: 'label' }}
                    options={targets.scheduleOptions}
                    placeholder={t(
                      'pages.monitor.common.schedules.placeholder',
                    )}
                  />
                </Form.Item>
                <Form.Item
                  name="deptIds"
                  label={t('pages.monitor.rule.form.depts')}
                >
                  <DeptSelect
                    multiple
                    maxCount={MONITOR_LIMITS.notifyDeptMax}
                    depts={targets.depts}
                    placeholder={t('pages.monitor.rule.form.depts.placeholder')}
                  />
                </Form.Item>
              </>
            )}
            <Form.Item name="setRecovery" valuePropName="checked">
              <Checkbox>{t('pages.monitor.rule.form.notifyRecovery')}</Checkbox>
            </Form.Item>
            {setRecovery && (
              <Form.Item name="notifyRecovery" valuePropName="checked">
                <Switch />
              </Form.Item>
            )}
            <Form.Item name="setRepeat" valuePropName="checked">
              <Checkbox>{t('pages.monitor.rule.form.repeatInterval')}</Checkbox>
            </Form.Item>
            {setRepeat && (
              <Form.Item
                name="repeatIntervalM"
                extra={t('pages.monitor.rule.form.repeatInterval.tooltip')}
                rules={[
                  {
                    validator: (_: unknown, value?: number | null) =>
                      !value || value >= MONITOR_LIMITS.repeatInterval.min
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              t('pages.monitor.rule.form.repeatInterval.rule'),
                            ),
                          ),
                  },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  precision={0}
                  min={0}
                  max={MONITOR_LIMITS.repeatInterval.max}
                  suffix={t('pages.monitor.unit.minute')}
                />
              </Form.Item>
            )}
            <Form.Item name="setMaxNotify" valuePropName="checked">
              <Checkbox>{t('pages.monitor.rule.form.maxNotify')}</Checkbox>
            </Form.Item>
            {setMaxNotify && (
              <Form.Item
                name="maxNotify"
                extra={t('pages.monitor.rule.form.maxNotify.tooltip')}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  precision={0}
                  min={MONITOR_LIMITS.maxNotify.min}
                  max={MONITOR_LIMITS.maxNotify.max}
                />
              </Form.Item>
            )}
          </>
        );
      case 'set_escalation':
        return (
          <>
            <CandidatesFailedAlert
              state={{
                failed: escalationsFailed,
                loading: escalationsLoading,
                retry: () => setAttempt((n) => n + 1),
              }}
              title={t('pages.monitor.rule.form.escalation.failed')}
            />
            <Form.Item name="escalationChoice">
              <Radio.Group
                options={[
                  {
                    value: 'set',
                    label: t('pages.monitor.rule.batch.escalation.set'),
                  },
                  {
                    value: 'clear',
                    label: t('pages.monitor.rule.batch.escalation.clear'),
                  },
                ]}
              />
            </Form.Item>
            {escalationChoice === 'clear' ? (
              <div className={styles.hint}>
                {t('pages.monitor.rule.batch.escalation.clear.hint')}
              </div>
            ) : (
              <Form.Item
                name="escalationId"
                label={t('pages.monitor.rule.form.escalation')}
                extra={t(
                  globalOnly
                    ? 'pages.monitor.rule.batch.escalation.globalOnly'
                    : 'pages.monitor.rule.batch.escalation.hint',
                  { max: ESCALATION_GROUP_MAX },
                )}
                rules={[rules.select(t('pages.monitor.rule.form.escalation'))]}
              >
                <Select
                  loading={escalationsLoading}
                  showSearch={{ optionFilterProp: 'label' }}
                  options={escalations.map((item) => ({
                    value: item.id,
                    label: item.name || item.id,
                  }))}
                  optionRender={(option) => {
                    const item = escalationById.get(String(option.value));
                    return (
                      <span className="flex items-center gap-2">
                        <span>{option.label}</span>
                        {item?.global && (
                          <Tag style={{ marginInlineEnd: 0 }}>
                            {t('pages.monitor.rule.form.escalation.global')}
                          </Tag>
                        )}
                        <span className={styles.hint}>
                          {t('pages.monitor.rule.form.escalation.option', {
                            levels: item?.levelCount ?? 0,
                            mode: item?.mode ? modeText(item.mode) : '',
                          })}
                        </span>
                      </span>
                    );
                  }}
                  placeholder={t(
                    'pages.monitor.rule.form.escalation.placeholder',
                  )}
                />
              </Form.Item>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={t(BATCH_ACTION_META[action].textId)}
      open
      width={result ? 720 : 560}
      destroyOnHidden
      mask={{ closable: false }}
      confirmLoading={submitting}
      okButtonProps={{ danger: DANGER_ACTIONS.includes(action) }}
      // 结果页只有「关闭」
      footer={result ? null : undefined}
      onOk={() => void submit()}
      onCancel={close}
    >
      {result ? (
        <>
          <Alert
            type={(result.failed ?? 0) > 0 ? 'warning' : 'success'}
            showIcon
            title={t('pages.monitor.rule.batch.result', {
              succeeded: result.succeeded ?? 0,
              failed: result.failed ?? 0,
            })}
            style={{ marginBottom: 12 }}
          />
          <Table<BatchRuleResult>
            size="small"
            rowKey="id"
            dataSource={result.results ?? []}
            pagination={
              (result.results ?? []).length > 10
                ? { pageSize: 10, showSizeChanger: false }
                : false
            }
            columns={[
              {
                title: t('pages.monitor.rule.column.name'),
                dataIndex: 'name',
                render: (_, row) => row.name || row.id,
              },
              {
                title: t('pages.monitor.rule.batch.column.result'),
                dataIndex: 'ok',
                width: 90,
                render: (_, row) =>
                  row.ok
                    ? t('pages.monitor.rule.batch.ok')
                    : t('pages.monitor.rule.batch.failed'),
              },
              {
                title: t('pages.monitor.rule.batch.column.reason'),
                dataIndex: 'message',
                render: (_, row) =>
                  row.ok
                    ? t('common.empty')
                    : monitorReasonText(row.reason, row.message) || row.reason,
              },
            ]}
          />
        </>
      ) : (
        <>
          <Alert
            type={DANGER_ACTIONS.includes(action) ? 'warning' : 'info'}
            showIcon
            title={t('pages.monitor.rule.batch.affected', {
              count: ids.length,
            })}
            description={
              action === 'delete'
                ? t('pages.monitor.rule.delete.description')
                : action === 'disable'
                  ? t('pages.monitor.rule.disable.description')
                  : undefined
            }
            style={{ marginBottom: 16 }}
          />
          <Form
            form={form}
            layout="vertical"
            initialValues={{ escalationChoice: 'set' }}
          >
            {fields()}
          </Form>
        </>
      )}
    </Modal>
  );
};

export default BatchModal;
