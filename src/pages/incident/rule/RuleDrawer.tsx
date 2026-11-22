/**
 * 触发规则表单抽屉（新建 / 编辑）：匹配条件（最低级别 / 分组 / 规则 / 标签 / 资源类型）、归并（键 / 窗口 /
 * 阈值）、生成故障（等级 / 标题模板 / 业务）、响应人选（指挥值班表或固定人、处理人来源、通知群）、
 * 动作（预案 / 自动恢复 / AI 摘要）；「回放测试」拿最近几小时的告警试算归并结果，不落库。
 */
import {
  DrawerForm,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import { Alert, App, Button, Col, Form, Space, Table, Tag } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { UserSelect } from '@/components/UserSelect';
import { FULL, HALF } from '@/constants/layout';
import { GroupTreeSelect } from '@/pages/monitor/components/GroupTreeSelect';
import {
  fetchMonitorRules,
  useRuleGroups,
} from '@/pages/monitor/components/hooks';
import {
  MatchersEditor,
  normalizeMatchers,
  validateMatchers,
} from '@/pages/monitor/components/MatchersEditor';
import { listModels } from '@/services/cmdb/model';
import { createRule, testRule, updateRule } from '@/services/incident/config';
import type {
  IncidentRule,
  IncidentSeverity,
  LabelMatcher,
  RuleSpec,
  TestRuleResult,
} from '@/services/incident/typings';
import { listOncallGroupOptions } from '@/services/monitor/escalation';
import type { LabelMatcher as MonitorMatcher } from '@/services/monitor/typings';
import { useFormRules, useT } from '@/utils/i18n';
import {
  fetchIncidentUsers,
  refOptions,
  refsToKnown,
  useIncidentOptions,
} from '../components/hooks';
import {
  CORRELATION_KEYS,
  INCIDENT_LIMITS,
  SEVERITY_META,
  SEVERITY_ORDER,
} from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import { SeverityTag } from '../components/tags';

const GROUP_PATTERN = /^\$[\w-]{1,64}$/;

/** 表单值与 RuleSpec 同形（嵌套对象直接映射） */
type FormValues = RuleSpec;

const toValues = (rule?: IncidentRule | null): FormValues =>
  rule
    ? rule.spec
    : {
        name: '',
        enabled: true,
        sort: 100,
        match: { minSeverity: 3 },
        correlation: {
          keys: ['business'],
          windowM: 10,
          minAlerts: 1,
          minCis: 0,
        },
        incident: { severity: 0 },
        response: { responderBackup: false, responderCiOwner: true },
        action: {
          playbookMode: 1,
          autoResolve: 0,
          aiSummary: true,
          agent: false,
        },
      };

const normalize = (v: FormValues): RuleSpec => ({
  ...v,
  name: v.name.trim(),
  description: v.description?.trim(),
  match: {
    ...v.match,
    matchers: normalizeMatchers(
      v.match?.matchers as MonitorMatcher[] | undefined,
    ) as LabelMatcher[],
  },
  correlation: { ...v.correlation, keys: v.correlation?.keys ?? [] },
  response: {
    ...v.response,
    groups: v.response?.groups ?? [],
    responderUserIds: v.response?.responderUserIds ?? [],
  },
});

export const RuleDrawer: React.FC<{
  rule: IncidentRule | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ rule, onClose, onSaved }) => {
  const t = useT();
  const rules = useFormRules();
  const access = useAccess();
  const { message } = App.useApp();
  const { styles } = useIncidentStyles();
  const { groups } = useRuleGroups(Boolean(access.canMonitorRule));
  const { options } = useIncidentOptions([
    'schedules',
    'businesses',
    'playbooks',
  ]);
  const [models, setModels] = useState<{ value: string; label: string }[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [oncallGroups, setOncallGroups] = useState<
    { value: string; label: string }[]
  >([]);
  const [test, setTest] = useState<{
    loading: boolean;
    result?: TestRuleResult;
  }>({ loading: false });
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (access.canCmdbModel) {
      setModelsLoading(true);
      listModels({ page: 1, pageSize: 200 })
        .then((r) =>
          setModels(
            (r.items ?? []).map((m) => ({
              value: m.code,
              label: `${m.name} (${m.code})`,
            })),
          ),
        )
        .catch(() => setModels([]))
        .finally(() => setModelsLoading(false));
    }
    listOncallGroupOptions()
      .then((r) =>
        setOncallGroups(
          (r.items ?? []).map((g) => ({ value: g.id, label: g.name ?? g.id })),
        ),
      )
      .catch(() => setOncallGroups([]));
  }, [access.canCmdbModel]);

  const runTest = async () => {
    const values = await form.validateFields();
    setTest({ loading: true });
    try {
      setTest({
        loading: false,
        result: await testRule(normalize(values), 24),
      });
    } catch {
      setTest({ loading: false });
    }
  };

  return (
    <DrawerForm<FormValues>
      title={t(
        rule ? 'pages.incident.rule.edit' : 'pages.incident.rule.create',
      )}
      form={form}
      open
      width={720}
      rowProps={{ gutter: 16 }}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true }}
      grid
      initialValues={toValues(rule)}
      submitter={{
        render: (_, dom) => (
          <Space>
            <Button loading={test.loading} onClick={() => void runTest()}>
              {t('pages.incident.rule.test')}
            </Button>
            {dom}
          </Space>
        ),
      }}
      onFinish={async (values) => {
        const spec = normalize(values);
        if (
          !validateMatchers(
            spec.match?.matchers as MonitorMatcher[] | undefined,
          )
        ) {
          message.error(t('pages.incident.rule.matchersInvalid'));
          return false;
        }
        if (rule) {
          await updateRule(rule.id, spec, rule.version ?? 0);
          message.success(t('common.msg.saved'));
        } else {
          await createRule(spec);
          message.success(t('common.msg.created'));
        }
        onSaved();
        return true;
      }}
    >
      <SectionTitle style={{ marginTop: 0 }}>
        {t('pages.incident.rule.section.basic')}
      </SectionTitle>
      <ProFormText
        name="name"
        label={t('pages.incident.rule.name')}
        colProps={HALF}
        rules={[
          rules.required(t('pages.incident.rule.name')),
          rules.maxChars(INCIDENT_LIMITS.nameMax),
        ]}
      />
      <ProFormDigit
        name="sort"
        label={t('pages.incident.rule.sort')}
        colProps={{ span: 6 }}
        min={0}
        max={9999}
        fieldProps={{ precision: 0 }}
        extra={t('pages.incident.rule.sortHint')}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        colProps={{ span: 6 }}
      />
      <ProFormTextArea
        name="description"
        label={t('pages.incident.business.description')}
        colProps={FULL}
        fieldProps={{ rows: 2, maxLength: INCIDENT_LIMITS.descriptionMax }}
      />

      <SectionTitle>{t('pages.incident.rule.section.match')}</SectionTitle>
      <ProFormSelect
        name={['match', 'minSeverity']}
        label={t('pages.incident.rule.minSeverity')}
        colProps={HALF}
        options={[
          { value: 0, label: t('pages.incident.rule.anySeverity') },
          ...[1, 2, 3, 4].map((s) => ({
            value: s,
            label: t(`enum.severity.${s}`),
          })),
        ]}
        extra={t('pages.incident.rule.minSeverityHint')}
      />
      <ProFormSelect
        name={['match', 'modelCodes']}
        label={t('pages.incident.rule.modelCodes')}
        colProps={HALF}
        // 能读模型目录就从目录里多选（加载中显示 loading），否则自由输入编码
        mode={access.canCmdbModel ? 'multiple' : 'tags'}
        options={models}
        fieldProps={{ tokenSeparators: [',', ' '], loading: modelsLoading }}
        placeholder={t('pages.incident.rule.modelCodesPlaceholder')}
      />
      {access.canMonitorRule ? (
        <>
          <Col span={12}>
            <Form.Item
              name={['match', 'groupIds']}
              label={t('pages.incident.rule.groups')}
            >
              <GroupTreeSelect
                groups={groups}
                multiple
                placeholder={t('pages.incident.rule.groupsPlaceholder')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={['match', 'ruleIds']}
              label={t('pages.incident.rule.monitorRules')}
            >
              <UserSelect
                multiple
                maxCount={50}
                fetchUsers={fetchMonitorRules}
                knownUsers={refsToKnown(rule?.ruleRefs)}
                placeholder={t('pages.incident.rule.monitorRulesPlaceholder')}
              />
            </Form.Item>
          </Col>
        </>
      ) : (
        <Col span={24}>
          <Alert
            type="info"
            showIcon
            title={t('pages.incident.rule.noMonitorAccess')}
            style={{ marginBottom: 16 }}
          />
        </Col>
      )}
      <Col span={24}>
        <Form.Item
          name={['match', 'matchers']}
          label={t('pages.incident.rule.matchers')}
        >
          <MatchersEditor />
        </Form.Item>
      </Col>

      <SectionTitle>
        {t('pages.incident.rule.section.correlation')}
      </SectionTitle>
      <ProFormSelect
        name={['correlation', 'keys']}
        label={t('pages.incident.rule.keys')}
        colProps={FULL}
        mode="tags"
        options={CORRELATION_KEYS.map((k) => ({
          value: k,
          label: t(`pages.incident.rule.key.${k}`),
        }))}
        fieldProps={{ tokenSeparators: [',', ' '] }}
        rules={[
          {
            validator: (_, v: string[] | undefined) =>
              (v ?? []).every(
                (k) =>
                  (CORRELATION_KEYS as readonly string[]).includes(k) ||
                  /^label:[A-Za-z_][\w]{0,127}$/.test(k),
              )
                ? Promise.resolve()
                : Promise.reject(t('pages.incident.rule.keysRule')),
          },
        ]}
        extra={t('pages.incident.rule.keysHint')}
      />
      <ProFormDigit
        name={['correlation', 'windowM']}
        label={t('pages.incident.rule.windowM')}
        colProps={{ span: 8 }}
        min={1}
        max={1440}
        fieldProps={{ precision: 0 }}
      />
      <ProFormDigit
        name={['correlation', 'minAlerts']}
        label={t('pages.incident.rule.minAlerts')}
        colProps={{ span: 8 }}
        min={1}
        max={1000}
        fieldProps={{ precision: 0 }}
      />
      <ProFormDigit
        name={['correlation', 'minCis']}
        label={t('pages.incident.rule.minCis')}
        colProps={{ span: 8 }}
        min={0}
        max={1000}
        fieldProps={{ precision: 0 }}
        extra={t('pages.incident.rule.minCisHint')}
      />

      <SectionTitle>{t('pages.incident.rule.section.incident')}</SectionTitle>
      <ProFormSelect
        name={['incident', 'severity']}
        label={t('pages.incident.field.severity')}
        colProps={HALF}
        options={[
          { value: 0, label: t('pages.incident.rule.severityAuto') },
          ...SEVERITY_ORDER.map((s) => ({
            value: s,
            label: t(SEVERITY_META[s].textId),
          })),
        ]}
        extra={t('pages.incident.rule.severityHint')}
      />
      <ProFormSwitch
        name={['incident', 'isDrill']}
        label={t('pages.incident.field.isDrill')}
        colProps={HALF}
      />
      <ProFormText
        name={['incident', 'titleTemplate']}
        label={t('pages.incident.rule.titleTemplate')}
        colProps={FULL}
        fieldProps={{ maxLength: INCIDENT_LIMITS.titleMax }}
        extra={t('pages.incident.rule.titleTemplateHint')}
      />
      <ProFormSelect
        name={['incident', 'businessId']}
        label={t('pages.incident.field.business')}
        colProps={HALF}
        showSearch
        options={refOptions(options.businesses)}
      />
      <ProFormText
        name={['incident', 'businessLabel']}
        label={t('pages.incident.rule.businessLabel')}
        colProps={HALF}
        fieldProps={{ maxLength: 128 }}
        extra={t('pages.incident.rule.businessLabelHint')}
      />

      <SectionTitle>{t('pages.incident.rule.section.response')}</SectionTitle>
      <ProFormSelect
        name={['response', 'commanderScheduleId']}
        label={t('pages.incident.rule.commanderSchedule')}
        colProps={HALF}
        showSearch
        options={refOptions(options.schedules)}
        extra={t('pages.incident.rule.commanderScheduleHint')}
      />
      <Col span={12}>
        <Form.Item
          name={['response', 'commanderUserId']}
          label={t('pages.incident.rule.commanderUser')}
        >
          <UserSelect
            fetchUsers={fetchIncidentUsers}
            knownUsers={refsToKnown(
              rule?.commanderUser ? [rule.commanderUser] : [],
            )}
          />
        </Form.Item>
      </Col>
      <ProFormSwitch
        name={['response', 'responderBackup']}
        label={t('pages.incident.rule.responderBackup')}
        colProps={{ span: 6 }}
      />
      <ProFormSwitch
        name={['response', 'responderCiOwner']}
        label={t('pages.incident.rule.responderCiOwner')}
        colProps={{ span: 6 }}
      />
      <ProFormSelect
        name={['response', 'responderOncallGroupId']}
        label={t('pages.incident.rule.responderOncallGroup')}
        colProps={HALF}
        showSearch
        options={oncallGroups}
      />
      <Col span={12}>
        <Form.Item
          name={['response', 'responderUserIds']}
          label={t('pages.incident.rule.responderUsers')}
        >
          <UserSelect multiple maxCount={20} fetchUsers={fetchIncidentUsers} />
        </Form.Item>
      </Col>
      <ProFormSelect
        name={['response', 'groups']}
        label={t('pages.incident.business.groups')}
        colProps={HALF}
        mode="tags"
        fieldProps={{ tokenSeparators: [',', ' '] }}
        rules={[
          {
            validator: (_, v: string[] | undefined) =>
              (v ?? []).every((g) => GROUP_PATTERN.test(g))
                ? Promise.resolve()
                : Promise.reject(t('pages.incident.business.groupsRule')),
          },
        ]}
        extra={t('pages.incident.business.groupsHint')}
      />

      <SectionTitle>{t('pages.incident.rule.section.action')}</SectionTitle>
      <ProFormSelect
        name={['action', 'playbookId']}
        label={t('pages.incident.proposal.playbook')}
        colProps={HALF}
        showSearch
        options={(options.playbooks ?? []).map((p) => ({
          value: p.id,
          label: p.name,
        }))}
      />
      <ProFormDependency name={[['action', 'playbookId']]}>
        {({ action }) => (
          <ProFormSelect
            name={['action', 'playbookMode']}
            label={t('pages.incident.rule.playbookMode')}
            colProps={HALF}
            disabled={!action?.playbookId}
            options={[1, 2].map((m) => ({
              value: m,
              label: t(`pages.incident.rule.playbookMode.${m}`),
            }))}
            extra={t('pages.incident.rule.playbookModeHint')}
          />
        )}
      </ProFormDependency>
      <ProFormSelect
        name={['action', 'autoResolve']}
        label={t('pages.incident.rule.autoResolve')}
        colProps={HALF}
        options={[0, 1, 2].map((m) => ({
          value: m,
          label: t(`pages.incident.rule.autoResolve.${m}`),
        }))}
        extra={t('pages.incident.rule.autoResolveHint')}
      />
      <ProFormSwitch
        name={['action', 'aiSummary']}
        label={t('pages.incident.rule.aiSummary')}
        colProps={HALF}
        extra={t('pages.incident.rule.aiSummaryHint')}
      />
      <ProFormSwitch
        name={['action', 'agent']}
        label={t('pages.incident.rule.agent')}
        colProps={HALF}
        extra={t('pages.incident.rule.agentHint')}
      />

      {test.result && (
        <Col span={24}>
          <SectionTitle>{t('pages.incident.rule.testResult')}</SectionTitle>
          <div className={styles.hint} style={{ marginBottom: 8 }}>
            {t('pages.incident.rule.testSummary', {
              scanned: test.result.scanned ?? 0,
              matched: test.result.matched ?? 0,
              groups: test.result.groups?.length ?? 0,
            })}
          </div>
          <Table
            rowKey={(r) => r.correlationKey ?? ''}
            size="small"
            pagination={false}
            dataSource={test.result.groups ?? []}
            columns={[
              {
                title: t('pages.incident.candidate.key'),
                dataIndex: 'correlationKey',
                ellipsis: true,
                render: (v: string) => <span className={styles.mono}>{v}</span>,
              },
              {
                title: t('pages.incident.field.title'),
                dataIndex: 'title',
                ellipsis: true,
              },
              {
                title: t('pages.incident.field.severity'),
                dataIndex: 'severity',
                width: 80,
                render: (v: IncidentSeverity) => <SeverityTag severity={v} />,
              },
              {
                title: t('pages.incident.candidate.alerts'),
                dataIndex: 'alertCount',
                width: 80,
              },
              {
                title: t('pages.incident.candidate.cis'),
                dataIndex: 'ciCount',
                width: 80,
              },
              {
                title: t('pages.incident.rule.wouldOpen'),
                dataIndex: 'wouldOpen',
                width: 100,
                render: (v: boolean) =>
                  v ? (
                    <Tag color="success">
                      {t('pages.incident.rule.wouldOpen.yes')}
                    </Tag>
                  ) : (
                    <Tag>{t('pages.incident.rule.wouldOpen.no')}</Tag>
                  ),
              },
            ]}
          />
        </Col>
      )}
    </DrawerForm>
  );
};
