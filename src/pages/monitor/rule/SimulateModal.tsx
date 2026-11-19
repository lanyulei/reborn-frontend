/**
 * 模拟触发：不保存规则、不产生告警事件，按表单当前的规则内容在选定的数据源上走一遍与评估引擎
 * 相同的处理流程，逐阶段给出结论。查询没有结果时用这里填的样例标签 / 取值合成一个事件。
 * 默认干跑；关掉干跑会真实发送一条带 [TEST] 的通知，须二次确认。
 * 接口没有「级别」「恢复」之类的入参（级别取命中的那条查询，不模拟恢复），这里也不提供。
 */
import { PlayCircleOutlined } from '@ant-design/icons';
import { Link, useAccess } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Form,
  InputNumber,
  Modal,
  Select,
  Spin,
  Switch,
  Table,
  Tag,
} from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  type KeyValue,
  KeyValueEditor,
  kvToRecord,
  validateKeyValues,
} from '@/components/KeyValueEditor';
import { SectionTitle } from '@/components/SectionTitle';
import { getMonitorErrorMessage } from '@/services/monitor/request';
import { simulateRule } from '@/services/monitor/rule';
import type {
  NamedRef,
  RuleSpec,
  SimulateEvent,
  SimulateQueryResult,
  SimulateRuleResult,
} from '@/services/monitor/typings';
import { useFormRules, useT } from '@/utils/i18n';
import { formatValue, labelEntries } from '../components/format';
import type { DatasourceOptionsState } from '../components/hooks';
import {
  ESCALATION_TRIGGER_META,
  LABEL_NAME_REGEX,
  MONITOR_LIMITS,
} from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { SeverityTag } from '../components/tags';

export interface SimulateModalProps {
  /** 表单当前内容组装出的规则（不要求已保存） */
  spec: RuleSpec;
  /** 正在编辑的规则 ID；新建时没有 */
  ruleId?: string;
  /** 全部数据源选项（页面取一次下传） */
  datasources: DatasourceOptionsState;
  onClose: () => void;
}

/** 与后端 SimulateRuleRequest.sample_labels 的校验一致 */
const SAMPLE_LABEL_MAX = 30;
const SAMPLE_LABEL_KEY_MAX = 128;

/** 阶段的固定顺序（后端约定）；不在其中的阶段名原样显示并排在最后 */
const STAGE_ORDER = [
  'query',
  'effective',
  'relabel',
  'ci',
  'drop',
  'scope',
  'level_inhibit',
  'inhibit',
  'mute',
  'notify',
  'send',
];

/** 阶段结论 → Tag 预设色 */
const STATUS_COLOR: Record<string, string | undefined> = {
  pass: 'success',
  warn: 'warning',
  block: 'error',
  error: 'magenta',
  skip: undefined,
};

/** 事件去向 → Tag 预设色 */
const OUTCOME_COLOR: Record<string, string | undefined> = {
  notify: 'success',
  dropped: undefined,
  out_of_scope: undefined,
  level_inhibited: 'purple',
  inhibited: 'purple',
  muted_event: 'warning',
  muted_notify: 'warning',
  maintenance: 'cyan',
};

/** 关联资源的结论 → Tag 预设色 */
const CI_STATUS_COLOR: Record<string, string | undefined> = {
  matched: 'success',
  disabled: undefined,
  no_label: undefined,
  not_found: undefined,
  ambiguous: 'warning',
  unavailable: 'warning',
};

interface SimulateFormValues {
  datasourceId?: string;
  sampleLabels?: KeyValue[];
  sampleValue?: number | null;
}

/** 接收方名单；这里不折叠（模拟就是为了看清到底通知到谁） */
const Recipients: React.FC<{ refs?: NamedRef[]; emptyText: string }> = ({
  refs,
  emptyText,
}) => {
  const { styles } = useMonitorStyles();
  if (!refs?.length) return <span className={styles.hint}>{emptyText}</span>;
  return (
    <span className={styles.tagList}>
      {refs.map((ref) => (
        <Tag key={ref.id}>{ref.name || ref.id}</Tag>
      ))}
    </span>
  );
};

/** 展开行：最终标签（标出改写 / 富化新增与改动的）、被去掉的原始标签、渲染后的附加信息 */
const EventDetail: React.FC<{ event: SimulateEvent }> = ({ event }) => {
  const t = useT();
  const { styles } = useMonitorStyles();
  const source = event.sourceLabels ?? {};
  const labels = event.labels ?? {};
  const removed = labelEntries(source).filter(([key]) => !(key in labels));
  const annotations = labelEntries(event.annotations);
  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className={styles.hint}>
          {t('pages.monitor.rule.simulate.event.labels')}
        </div>
        <span className={styles.tagList}>
          {labelEntries(labels).map(([key, value]) => {
            const added = !(key in source);
            const changed = !added && source[key] !== value;
            return (
              <Tag
                key={key}
                color={added ? 'success' : changed ? 'warning' : undefined}
                title={
                  added
                    ? t('pages.monitor.rule.simulate.event.added')
                    : changed
                      ? t('pages.monitor.rule.simulate.event.changed', {
                          from: source[key],
                        })
                      : undefined
                }
              >
                {key}={value}
              </Tag>
            );
          })}
          {removed.map(([key, value]) => (
            <Tag
              key={`removed-${key}`}
              variant="outlined"
              title={t('pages.monitor.rule.simulate.event.removed')}
            >
              <del>
                {key}={value}
              </del>
            </Tag>
          ))}
        </span>
        <div className={styles.hint}>
          {t('pages.monitor.rule.simulate.event.legend')}
        </div>
      </div>
      <div>
        <div className={styles.hint}>
          {t('pages.monitor.rule.simulate.event.sourceLabels')}
        </div>
        <span className={styles.tagList}>
          {labelEntries(source).length === 0
            ? t('common.empty')
            : labelEntries(source).map(([key, value]) => (
                <Tag key={key}>
                  {key}={value}
                </Tag>
              ))}
        </span>
      </div>
      <div>
        <div className={styles.hint}>
          {t('pages.monitor.rule.form.annotations')}
        </div>
        {annotations.length === 0
          ? t('common.empty')
          : annotations.map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className={styles.hint}>{key}</span>
                <span className="min-w-0 whitespace-pre-wrap break-all">
                  {value}
                </span>
              </div>
            ))}
      </div>
    </div>
  );
};

/** 一次模拟的结果；sendRequested 记下发起时是否要求真实发送（之后开关可能又被拨动） */
const Report: React.FC<{
  result: SimulateRuleResult;
  sendRequested: boolean;
}> = ({ result, sendRequested }) => {
  const t = useT();
  const access = useAccess();
  const { styles } = useMonitorStyles();

  const rank = (name?: string) => {
    const index = STAGE_ORDER.indexOf(name ?? '');
    return index < 0 ? STAGE_ORDER.length : index;
  };
  // 按约定的阶段顺序排（稳定排序：未知阶段保持后端给出的先后）；后端没返回的阶段不补
  const stages = [...(result.stages ?? [])].sort(
    (a, b) => rank(a.stage) - rank(b.stage),
  );
  const stageOf = (name: string) =>
    stages.find((stage) => stage.stage === name);
  // 布尔结论只在对应阶段真的执行过时才解读：前面已被拦下（skip）时 false 只是零值
  const ran = (name: string) => stageOf(name)?.status !== 'skip';

  const events = (result.events ?? []).map((event, key) => ({ ...event, key }));
  const queries = (result.queries ?? []).map((query, key) => ({
    ...query,
    key,
  }));
  const recipients = result.recipients ?? [];
  const notes = result.recipientNotes ?? [];
  const subscriptions = result.subscriptions ?? [];
  const escalation = result.escalation ?? [];
  const notifyEventIds = result.notifyEventIds ?? [];

  return (
    <div>
      <div className="flex flex-col gap-2">
        {!result.routeMatched && ran('notify') && (
          <Alert
            type="warning"
            showIcon
            title={t('pages.monitor.rule.simulate.noRoute')}
            description={t('pages.monitor.rule.simulate.noRoute.description')}
          />
        )}
        {!result.inEffect && ran('effective') && (
          <Alert
            type="warning"
            showIcon
            title={t('pages.monitor.rule.simulate.notInEffect')}
          />
        )}
        {result.synthetic && (
          <Alert
            type="info"
            showIcon
            title={t('pages.monitor.rule.simulate.synthetic')}
          />
        )}
        {sendRequested &&
          (result.sent ? (
            <Alert
              type="success"
              showIcon
              title={t('pages.monitor.rule.simulate.sent')}
              description={
                access.canNotifyDispatch && notifyEventIds.length > 0 ? (
                  <span>
                    {notifyEventIds.map((eventId, index) => (
                      // 新窗口打开：规则表单多半还没保存，不能把当前页带走
                      <Link
                        key={eventId}
                        to={`/notify/trace/dispatch?eventId=${eventId}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ marginInlineEnd: 12 }}
                      >
                        {t('pages.monitor.alert.notify.delivery', {
                          n: index + 1,
                        })}
                      </Link>
                    ))}
                  </span>
                ) : undefined
              }
            />
          ) : (
            <Alert
              type="warning"
              showIcon
              title={t('pages.monitor.rule.simulate.notSent')}
            />
          ))}
      </div>

      <SectionTitle>{t('pages.monitor.rule.simulate.stages')}</SectionTitle>
      {stages.length === 0 ? (
        <span className={styles.hint}>{t('common.empty')}</span>
      ) : (
        <div className="flex flex-col gap-2" data-testid="simulate-stages">
          {stages.map((stage, index) => {
            const name = stage.stage ?? '';
            const status = stage.status ?? '';
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: 阶段名理论上不重复，但未知阶段不作保证
              <div key={index} className="flex items-start gap-3">
                <span
                  className={styles.hint}
                  style={{ width: 20, flex: 'none', lineHeight: '22px' }}
                >
                  {index + 1}
                </span>
                <span style={{ width: 140, flex: 'none' }}>
                  {STAGE_ORDER.includes(name)
                    ? t(`pages.monitor.rule.simulate.stage.${name}`)
                    : name}
                </span>
                <span style={{ width: 64, flex: 'none' }}>
                  <Tag color={STATUS_COLOR[status]}>
                    {status in STATUS_COLOR
                      ? t(`pages.monitor.rule.simulate.status.${status}`)
                      : status}
                  </Tag>
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                  {stage.message}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <SectionTitle>{t('pages.monitor.rule.simulate.queries')}</SectionTitle>
      <Table<SimulateQueryResult & { key: number }>
        size="small"
        rowKey="key"
        dataSource={queries}
        pagination={false}
        columns={[
          {
            title: t('pages.monitor.rule.simulate.query.index'),
            width: 80,
            render: (_, row) => `#${(row.index ?? 0) + 1}`,
          },
          {
            title: t('pages.monitor.alert.column.severity'),
            width: 100,
            render: (_, row) => <SeverityTag severity={row.severity} />,
          },
          {
            title: t('pages.monitor.rule.simulate.query.series'),
            width: 160,
            render: (_, row) => (
              <span>
                {row.series ?? 0}
                {row.truncated && (
                  <Tag color="warning" style={{ marginInlineStart: 8 }}>
                    {t('pages.monitor.rule.simulate.query.truncated')}
                  </Tag>
                )}
              </span>
            ),
          },
          {
            title: t('pages.monitor.rule.simulate.query.duration'),
            width: 100,
            render: (_, row) => `${row.durationMs ?? 0} ms`,
          },
          {
            title: t('pages.monitor.rule.simulate.query.error'),
            render: (_, row) =>
              row.error ? (
                <span className={styles.code}>{row.error}</span>
              ) : (
                t('common.empty')
              ),
          },
        ]}
      />

      <SectionTitle>
        {t('pages.monitor.rule.simulate.events', {
          shown: events.length,
          total: Math.max(result.eventTotal ?? 0, events.length),
        })}
      </SectionTitle>
      <Table<SimulateEvent & { key: number }>
        size="small"
        rowKey="key"
        dataSource={events}
        pagination={false}
        scroll={{ x: 'max-content' }}
        expandable={{
          expandedRowRender: (event) => <EventDetail event={event} />,
        }}
        columns={[
          {
            title: t('pages.monitor.alert.column.severity'),
            width: 90,
            render: (_, row) => <SeverityTag severity={row.severity} />,
          },
          {
            title: t('pages.monitor.alert.column.value'),
            width: 100,
            render: (_, row) => formatValue(row.value) || t('common.empty'),
          },
          {
            title: t('pages.monitor.rule.simulate.event.outcome'),
            render: (_, row) => {
              const outcome = row.outcome ?? '';
              return (
                <div style={{ maxWidth: 320 }}>
                  {outcome ? (
                    <Tag color={OUTCOME_COLOR[outcome]}>
                      {outcome in OUTCOME_COLOR
                        ? t(`pages.monitor.rule.simulate.outcome.${outcome}`)
                        : outcome}
                    </Tag>
                  ) : (
                    t('common.empty')
                  )}
                  {row.reason && (
                    <div className={styles.hint}>{row.reason}</div>
                  )}
                </div>
              );
            },
          },
          {
            title: t('pages.monitor.rule.simulate.event.ci'),
            render: (_, row) => {
              const status = row.ciStatus ?? '';
              return (
                <div>
                  {status ? (
                    <Tag color={CI_STATUS_COLOR[status]}>
                      {status in CI_STATUS_COLOR
                        ? t(`pages.monitor.rule.simulate.ciStatus.${status}`)
                        : status}
                    </Tag>
                  ) : (
                    t('common.empty')
                  )}
                  {row.ci && (
                    <div className={styles.hint}>
                      {row.ci.name || row.ci.id}
                    </div>
                  )}
                </div>
              );
            },
          },
          {
            title: t('pages.monitor.rule.simulate.event.fingerprint'),
            render: (_, row) =>
              row.fingerprint ? (
                <span className={styles.code}>{row.fingerprint}</span>
              ) : (
                t('common.empty')
              ),
          },
        ]}
      />

      <SectionTitle>{t('pages.monitor.rule.simulate.recipients')}</SectionTitle>
      <Recipients
        refs={recipients}
        emptyText={t('pages.monitor.rule.simulate.recipients.empty')}
      />
      {notes.map((note) => (
        <div key={note} className={styles.hint}>
          {note}
        </div>
      ))}

      <SectionTitle>
        {t('pages.monitor.rule.simulate.subscriptions')}
      </SectionTitle>
      {subscriptions.length === 0 ? (
        <span className={styles.hint}>
          {t('pages.monitor.rule.simulate.subscriptions.empty')}
        </span>
      ) : (
        <div className="flex flex-col gap-2">
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className="flex items-start gap-3">
              <span style={{ width: 200, flex: 'none' }}>
                {subscription.name || subscription.id}
              </span>
              <Recipients
                refs={subscription.recipients ?? []}
                emptyText={t(
                  'pages.monitor.rule.simulate.subscriptions.noRecipients',
                )}
              />
            </div>
          ))}
        </div>
      )}

      <SectionTitle>{t('pages.monitor.rule.simulate.escalation')}</SectionTitle>
      {escalation.length === 0 ? (
        <span className={styles.hint}>
          {t('pages.monitor.rule.simulate.escalation.empty')}
        </span>
      ) : (
        <div className="flex flex-col gap-2">
          {escalation.map((level, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 级别序号由后端给出，不保证唯一
            <div key={index} className="flex items-start gap-3">
              <span style={{ width: 200, flex: 'none' }}>
                {t('pages.monitor.rule.simulate.escalation.level', {
                  level: level.level ?? 0,
                  minutes: level.afterM ?? 0,
                })}
                {level.trigger && ESCALATION_TRIGGER_META[level.trigger] && (
                  <div className={styles.hint}>
                    {t(ESCALATION_TRIGGER_META[level.trigger].textId)}
                  </div>
                )}
              </span>
              <Recipients
                refs={level.recipients ?? []}
                emptyText={t(
                  'pages.monitor.rule.simulate.escalation.noRecipients',
                )}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SimulateModal: React.FC<SimulateModalProps> = ({
  spec,
  ruleId,
  datasources,
  onClose,
}) => {
  const t = useT();
  const { modal } = App.useApp();
  const rules = useFormRules();
  const [form] = Form.useForm<SimulateFormValues>();

  // 后端只接受规则数据源范围内的数据源：指定数据源时就是规则选的那几个；全部数据源时任选一个已启用的
  const candidates = useMemo(
    () =>
      datasources.items.filter((item) =>
        spec.datasourceScope === 2
          ? item.enabled === true
          : (spec.datasourceIds ?? []).includes(item.id),
      ),
    [datasources.items, spec.datasourceScope, spec.datasourceIds],
  );
  const options = useMemo(() => {
    const ids = new Set(candidates.map((item) => item.id));
    return datasources.options.filter((option) => ids.has(option.value));
  }, [candidates, datasources.options]);

  const [send, setSend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [report, setReport] = useState<{
    result: SimulateRuleResult;
    sendRequested: boolean;
  }>();

  // 预选：缺省数据源在候选里就用它，否则第一个（数据源选项可能晚于弹窗到达）
  useEffect(() => {
    const current = form.getFieldValue('datasourceId');
    if (current && candidates.some((item) => item.id === current)) return;
    form.setFieldValue(
      'datasourceId',
      (candidates.find((item) => item.isDefault) ?? candidates[0])?.id,
    );
  }, [candidates, form]);

  /** 关掉干跑 = 真实发通知：必须确认；取消则保持干跑 */
  const onDryRunChange = (dryRun: boolean) => {
    if (dryRun) {
      setSend(false);
      return;
    }
    modal.confirm({
      title: t('pages.monitor.rule.simulate.send.confirm.title'),
      content: t('pages.monitor.rule.simulate.send.confirm.content'),
      okText: t('pages.monitor.rule.simulate.send.confirm.ok'),
      okButtonProps: { danger: true },
      onOk: () => setSend(true),
    });
  };

  const run = async () => {
    const values = await form.validateFields().catch(() => undefined);
    // 校验不通过：错误已显示在表单项上
    if (!values?.datasourceId) return;
    setLoading(true);
    setError(undefined);
    try {
      const result = await simulateRule({
        spec,
        datasourceId: values.datasourceId,
        sampleLabels: kvToRecord(values.sampleLabels),
        sampleValue: values.sampleValue ?? 0,
        send,
        ...(ruleId ? { ruleId } : {}),
      });
      setReport({ result, sendRequested: send });
      // 真实发送只管这一次：再发须重新确认，免得反复点「开始模拟」时连发通知
      setSend(false);
    } catch (e) {
      // 上一次的结果与这次的入参已不对应，不再保留
      setReport(undefined);
      setError(getMonitorErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('pages.monitor.rule.simulate.title')}
      open
      width={960}
      destroyOnHidden
      mask={{ closable: false }}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('pages.monitor.rule.simulate.close')}
        </Button>,
        <Button
          key="run"
          type="primary"
          danger={send}
          icon={<PlayCircleOutlined />}
          loading={loading}
          disabled={candidates.length === 0}
          onClick={() => void run()}
        >
          {t(
            send
              ? 'pages.monitor.rule.simulate.runAndSend'
              : 'pages.monitor.rule.simulate.run',
          )}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={{ sampleValue: 0 }}>
        {datasources.loaded && candidates.length === 0 && (
          <Alert
            type="warning"
            showIcon
            title={t('pages.monitor.rule.simulate.noDatasource')}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form.Item
          name="datasourceId"
          label={t('pages.monitor.common.datasource')}
          extra={t(
            spec.datasourceScope === 2
              ? 'pages.monitor.rule.simulate.datasource.hint.all'
              : 'pages.monitor.rule.simulate.datasource.hint.listed',
          )}
          rules={[rules.select(t('pages.monitor.common.datasource'))]}
        >
          <Select
            showSearch={{ optionFilterProp: 'label' }}
            options={options}
            style={{ maxWidth: 420 }}
          />
        </Form.Item>
        <Form.Item
          name="sampleLabels"
          label={t('pages.monitor.rule.simulate.sampleLabels')}
          extra={t('pages.monitor.rule.simulate.sample.hint')}
          rules={[
            {
              validator: (_: unknown, value?: KeyValue[]) =>
                validateKeyValues(value, {
                  keyPattern: LABEL_NAME_REGEX,
                  keyMax: SAMPLE_LABEL_KEY_MAX,
                  valueMax: MONITOR_LIMITS.labelValueMax,
                })
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(
                        t('pages.monitor.rule.simulate.sampleLabels.rule'),
                      ),
                    ),
            },
          ]}
        >
          <KeyValueEditor
            max={SAMPLE_LABEL_MAX}
            keyPlaceholder="instance"
            valuePlaceholder="web-01:9100"
            addText={t('pages.monitor.rule.form.labels.add')}
          />
        </Form.Item>
        <Form.Item
          name="sampleValue"
          label={t('pages.monitor.rule.simulate.sampleValue')}
        >
          <InputNumber style={{ width: 200 }} />
        </Form.Item>
        <Form.Item
          label={t('pages.monitor.rule.simulate.dryRun')}
          extra={t(
            send
              ? 'pages.monitor.rule.simulate.dryRun.off'
              : 'pages.monitor.rule.simulate.dryRun.on',
          )}
        >
          <Switch checked={!send} onChange={onDryRunChange} />
        </Form.Item>
      </Form>

      {error && (
        <Alert
          type="error"
          showIcon
          title={t('pages.monitor.rule.simulate.failed')}
          description={error}
        />
      )}
      <Spin spinning={loading}>
        {report && (
          <Report result={report.result} sendRequested={report.sendRequested} />
        )}
      </Spin>
    </Modal>
  );
};

export default SimulateModal;
