/**
 * Profile 表单（新建 / 编辑）：720 宽抽屉、两列栅格，分五组——基本信息、适用范围与配额、阶段与工具白名单、单任务预算、
 * 自动通过条件（仅故障诊断）。类型决定阶段集合：故障诊断四阶段；经验沉淀两阶段并要指定知识空间。
 * 工具只能从后端给出的目录里选（只读工具 + 允许的写工具，按阶段与类型过滤）。
 */
import {
  DrawerForm,
  ProForm,
  ProFormCheckbox,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, Col } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { FULL, HALF } from '@/constants/layout';
import { useIncidentOptions } from '@/pages/incident/components/hooks';
import {
  SEVERITY_META,
  SEVERITY_ORDER,
} from '@/pages/incident/components/meta';
import { useIncidentStyles } from '@/pages/incident/components/styles';
import {
  createProfile,
  listProfileTools,
  updateProfile,
} from '@/services/agent/profile';
import type {
  AgentProfile,
  ProfileKind,
  ProfileSpec,
  StageKey,
  ToolOption,
} from '@/services/agent/typings';
import { STAGE_KEYS_BY_KIND } from '@/services/agent/typings';
import { listSpaces } from '@/services/knowledge/space';
import { getUser, listUsers } from '@/services/system/user';
import { useEnumText, useFormRules, useSubmitter, useT } from '@/utils/i18n';
import { STAGE_META } from '../components/meta';

type StageForm = { maxSteps: number; tools?: string[] };

/** 内置缺省（与后端 DefaultStagesFor / DefaultBudget / DefaultAuto 一致） */
const DEFAULT_STAGES: Record<
  ProfileKind,
  Partial<Record<StageKey, Required<StageForm>>>
> = {
  diagnose: {
    collect: {
      maxSteps: 6,
      tools: [
        'IncidentService_GetIncidentContext',
        'MonitorAlertService_GetAlert',
        'CmdbCIService_GetCI',
        'CmdbRelationService_ListRelated',
        'IncidentService_ListChanges',
      ],
    },
    hypothesize: { maxSteps: 1, tools: [] },
    verify: {
      maxSteps: 9,
      tools: [
        'MonitorDatasourceService_ListDatasources',
        'MonitorDatasourceService_QueryDatasource',
        'MonitorDatasourceService_QueryDatasourceRange',
        'K8sInsightService_DiagnosePod',
        'K8sInsightService_DiagnoseWorkload',
        'K8sResourceService_ListObjectEvents',
        'K8sInsightService_QueryMetrics',
        'JobExecutionService_GetJobExecution',
        'JobExecutionService_GetJobExecutionLog',
        'WorkflowInstanceService_GetInstance',
        'KnowledgeService_Search',
        'IncidentService_SearchIncidents',
        'IncidentPostmortemService_ListPostmortemVersions',
      ],
    },
    conclude: {
      maxSteps: 4,
      tools: [
        'IncidentService_AddFinding',
        'IncidentService_MarkChange',
        'IncidentProposalService_CreateProposal',
        'IncidentService_AttachAlerts',
        'IncidentService_AddComment',
      ],
    },
  },
  postmortem: {
    collect: {
      maxSteps: 6,
      tools: [
        'IncidentService_GetIncidentContext',
        'IncidentPostmortemService_GetPostmortem',
        'IncidentPostmortemService_ListPostmortemVersions',
        'IncidentService_ListTimeline',
        'IncidentService_ListChanges',
        'KnowledgeService_Search',
      ],
    },
    conclude: { maxSteps: 3, tools: ['KnowledgeService_CreateDocument'] },
  },
};

/** 各类型允许的写工具（与后端 writeToolsByKind 一致）：诊断不建知识文档；经验沉淀只建草稿、可留评论 */
const WRITE_TOOLS_BY_KIND: Record<ProfileKind, string[]> = {
  diagnose: [
    'IncidentService_AddFinding',
    'IncidentService_MarkChange',
    'IncidentService_AttachAlerts',
    'IncidentService_AddComment',
    'IncidentProposalService_CreateProposal',
  ],
  postmortem: ['KnowledgeService_CreateDocument', 'IncidentService_AddComment'],
};

const defaultStages = (kind: ProfileKind): Record<string, StageForm> =>
  Object.fromEntries(
    STAGE_KEYS_BY_KIND[kind].map((key) => [
      key,
      DEFAULT_STAGES[kind][key] ?? { maxSteps: 1, tools: [] },
    ]),
  );

interface FormValues {
  name: string;
  description?: string;
  kind: ProfileKind;
  agentUserId: string;
  knowledgeSpaceId?: string;
  priority: number;
  enabled: boolean;
  severities: number[];
  businessIds?: string[];
  hourlyLimit: number;
  stages: Record<string, StageForm>;
  budget: {
    maxSteps: number;
    timeoutS: number;
    promptTokens: number;
    completionTokens: number;
  };
  auto: {
    enabled: boolean;
    minConfidence: number;
    requireMetricEvidence: boolean;
    maxTargets: number;
    envs?: string[];
  };
}

const toForm = (p?: AgentProfile | null): FormValues => {
  const s = p?.spec;
  const kind: ProfileKind =
    s?.kind === 'postmortem' ? 'postmortem' : 'diagnose';
  const stages = defaultStages(kind);
  for (const key of STAGE_KEYS_BY_KIND[kind]) {
    const st = s?.stages?.find((x) => x.key === key);
    if (st) stages[key] = { maxSteps: st.maxSteps, tools: st.tools ?? [] };
  }
  return {
    name: s?.name ?? '',
    description: s?.description,
    kind,
    agentUserId: s?.agentUserId ?? '',
    knowledgeSpaceId: s?.knowledgeSpaceId,
    priority: s?.priority ?? 100,
    enabled: s?.enabled ?? true,
    severities: s?.severities ?? [1, 2, 3],
    businessIds: s?.businessIds ?? [],
    hourlyLimit: s?.hourlyLimit ?? 30,
    stages,
    budget: {
      maxSteps: s?.budget?.maxSteps ?? 20,
      timeoutS: s?.budget?.timeoutS ?? 480,
      promptTokens: Number(s?.budget?.promptTokens ?? 150_000),
      completionTokens: Number(s?.budget?.completionTokens ?? 20_000),
    },
    auto: {
      enabled: s?.auto?.enabled ?? false,
      minConfidence: s?.auto?.minConfidence ?? 80,
      requireMetricEvidence: s?.auto?.requireMetricEvidence ?? true,
      maxTargets: s?.auto?.maxTargets ?? 3,
      envs: s?.auto?.envs ?? ['dev', 'test', 'staging'],
    },
  };
};

const toSpec = (v: FormValues): ProfileSpec => ({
  name: v.name.trim(),
  description: v.description?.trim(),
  kind: v.kind,
  agentUserId: v.agentUserId,
  knowledgeSpaceId: v.kind === 'postmortem' ? v.knowledgeSpaceId : undefined,
  priority: v.priority,
  enabled: v.enabled,
  severities: v.severities,
  businessIds: v.businessIds,
  hourlyLimit: v.hourlyLimit,
  stages: STAGE_KEYS_BY_KIND[v.kind].map((key) => ({
    key,
    maxSteps: v.stages[key]?.maxSteps ?? 1,
    tools: v.stages[key]?.tools ?? [],
  })),
  budget: {
    maxSteps: v.budget.maxSteps,
    timeoutS: v.budget.timeoutS,
    promptTokens: String(v.budget.promptTokens),
    completionTokens: String(v.budget.completionTokens),
  },
  auto:
    v.kind === 'diagnose' ? v.auto : { ...v.auto, enabled: false, envs: [] },
});

export const ProfileDrawer: React.FC<{
  /** null = 新建；对象 = 编辑 */
  profile: AgentProfile | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ profile, onClose, onSaved }) => {
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { styles } = useIncidentStyles();
  const stageText = useEnumText(STAGE_META);
  const severityText = useEnumText(SEVERITY_META);
  const { options } = useIncidentOptions(['businesses']);
  const [form] = ProForm.useForm<FormValues>();
  const [tools, setTools] = useState<ToolOption[]>([]);

  useEffect(() => {
    listProfileTools()
      .then(setTools)
      .catch(() => setTools([]));
  }, []);

  const toolOptions = useMemo(() => {
    const byKind = {} as Record<
      ProfileKind,
      Record<string, { value: string; label: string }[]>
    >;
    for (const kind of Object.keys(STAGE_KEYS_BY_KIND) as ProfileKind[]) {
      byKind[kind] = Object.fromEntries(
        STAGE_KEYS_BY_KIND[kind].map((key) => [
          key,
          tools
            .filter((o) => !o.stages?.length || o.stages.includes(key))
            .filter(
              (o) => !o.write || WRITE_TOOLS_BY_KIND[kind].includes(o.name),
            )
            .map((o) => ({
              value: o.name,
              label: `${o.title || o.name}${o.write ? ' · write' : ''}`,
            })),
        ]),
      );
    }
    return byKind;
  }, [tools]);

  return (
    <DrawerForm<FormValues>
      form={form}
      title={
        profile
          ? t('pages.agent.profile.edit')
          : t('pages.agent.profile.create')
      }
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true }}
      initialValues={toForm(profile)}
      submitter={profile ? submitter.save : submitter.create}
      onFinish={async (values) => {
        if (profile) {
          await updateProfile(
            profile.id,
            toSpec(values),
            profile.version,
            profile.breakerOpen,
          );
        } else {
          await createProfile(toSpec(values));
        }
        onSaved();
        return true;
      }}
    >
      {profile?.breakerOpen && (
        <Col span={24}>
          <Alert
            type="warning"
            showIcon
            title={t('pages.agent.profile.breakerHint', {
              reason: profile.breakerReason ?? '',
            })}
            description={t('pages.agent.profile.resetBreaker')}
            style={{ marginBottom: 16 }}
          />
        </Col>
      )}
      <SectionTitle style={{ marginTop: 0 }}>
        {t('pages.agent.profile.section.basic')}
      </SectionTitle>
      <ProFormText
        name="name"
        label={t('pages.agent.profile.name')}
        colProps={HALF}
        rules={[
          rules.required(t('pages.agent.profile.name')),
          rules.maxChars(64),
        ]}
      />
      <ProFormSelect
        name="kind"
        label={t('pages.agent.profile.kind')}
        colProps={HALF}
        allowClear={false}
        tooltip={t('pages.agent.profile.kindHint')}
        options={(Object.keys(STAGE_KEYS_BY_KIND) as ProfileKind[]).map(
          (k) => ({ value: k, label: t(`pages.agent.profile.kind.${k}`) }),
        )}
        fieldProps={{
          // 切换类型 = 换一套阶段：工具白名单按新类型的缺省重置
          onChange: (kind: ProfileKind) =>
            form.setFieldsValue({ stages: defaultStages(kind) }),
        }}
      />
      <ProFormSelect
        name="agentUserId"
        label={t('pages.agent.profile.agentUser')}
        colProps={HALF}
        showSearch
        tooltip={t('pages.agent.profile.agentUserHint')}
        rules={[rules.select(t('pages.agent.profile.agentUser'))]}
        request={async ({ keyWords }) => {
          const res = await listUsers(
            { page: 1, pageSize: 50, kind: 2, keyword: keyWords || undefined },
            { silent: true },
          );
          const items = res.items.map((u) => ({
            value: u.id,
            label: `${u.nickname}（${u.username}）`,
          }));
          // 编辑时已绑定的账号不在首页结果里也要能显示名字
          const current = profile?.spec.agentUserId;
          if (current && !items.some((i) => i.value === current)) {
            try {
              const { user } = await getUser(current);
              items.unshift({
                value: user.id,
                label: `${user.nickname}（${user.username}）`,
              });
            } catch {
              items.unshift({ value: current, label: current });
            }
          }
          return items;
        }}
      />
      <ProFormDependency name={['kind']}>
        {({ kind }) =>
          kind === 'postmortem' ? (
            <ProFormSelect
              name="knowledgeSpaceId"
              label={t('pages.agent.profile.knowledgeSpace')}
              colProps={HALF}
              showSearch
              tooltip={t('pages.agent.profile.knowledgeSpaceHint')}
              rules={[rules.select(t('pages.agent.profile.knowledgeSpace'))]}
              request={async ({ keyWords }) => {
                const res = await listSpaces(
                  { keyword: keyWords || undefined },
                  { silent: true },
                );
                return (res.items ?? []).map((s) => ({
                  value: s.id,
                  label: s.name,
                }));
              }}
            />
          ) : null
        }
      </ProFormDependency>
      <ProFormTextArea
        name="description"
        label={t('pages.agent.profile.description')}
        colProps={FULL}
        fieldProps={{ rows: 2, maxLength: 512 }}
      />
      <ProFormDigit
        name="priority"
        label={t('pages.agent.profile.priority')}
        colProps={HALF}
        min={0}
        max={1000}
        fieldProps={{ precision: 0 }}
        extra={t('pages.agent.profile.priorityHint')}
      />
      <ProFormSwitch
        name="enabled"
        label={t('pages.agent.profile.enabled')}
        colProps={HALF}
      />

      <SectionTitle>{t('pages.agent.profile.section.scope')}</SectionTitle>
      <ProFormCheckbox.Group
        name="severities"
        label={t('pages.agent.profile.severities')}
        colProps={FULL}
        options={SEVERITY_ORDER.map((s) => ({
          value: s,
          label: severityText(s),
        }))}
        rules={[rules.select(t('pages.agent.profile.severities'))]}
      />
      <ProFormSelect
        name="businessIds"
        label={t('pages.agent.profile.businesses')}
        colProps={HALF}
        fieldProps={{
          mode: 'multiple',
          showSearch: { optionFilterProp: 'label' },
        }}
        options={(options.businesses ?? []).map((b) => ({
          value: b.id,
          label: b.name || b.id,
        }))}
        extra={t('pages.agent.profile.businessesHint')}
      />
      <ProFormDigit
        name="hourlyLimit"
        label={t('pages.agent.profile.hourlyLimit')}
        colProps={HALF}
        min={1}
        max={500}
        fieldProps={{ precision: 0 }}
        extra={t('pages.agent.profile.hourlyLimitHint')}
      />

      <SectionTitle>{t('pages.agent.profile.section.stages')}</SectionTitle>
      <Col span={24}>
        <div className={styles.hint} style={{ marginBottom: 8 }}>
          {t('pages.agent.profile.stage.toolsHint')}
        </div>
      </Col>
      <ProFormDependency name={['kind']}>
        {({ kind }) => {
          const k: ProfileKind =
            kind === 'postmortem' ? 'postmortem' : 'diagnose';
          return STAGE_KEYS_BY_KIND[k].map((key) => (
            <Col span={24} key={`${k}-${key}`}>
              <div className={styles.step}>
                <div className={styles.stepHead}>{stageText(key)}</div>
                <div className={styles.stepGrid}>
                  <ProFormDigit
                    name={['stages', key, 'maxSteps']}
                    label={t('pages.agent.profile.stage.maxSteps')}
                    min={1}
                    max={15}
                    fieldProps={{ precision: 0 }}
                    rules={[
                      rules.required(t('pages.agent.profile.stage.maxSteps')),
                    ]}
                  />
                  <div style={{ gridColumn: 'span 2' }}>
                    <ProFormSelect
                      name={['stages', key, 'tools']}
                      label={t('pages.agent.profile.stage.tools')}
                      options={toolOptions[k]?.[key] ?? []}
                      fieldProps={{
                        mode: 'multiple',
                        showSearch: { optionFilterProp: 'label' },
                        maxTagCount: 'responsive',
                      }}
                    />
                  </div>
                </div>
              </div>
            </Col>
          ));
        }}
      </ProFormDependency>

      <SectionTitle>{t('pages.agent.profile.section.budget')}</SectionTitle>
      <ProFormDigit
        name={['budget', 'maxSteps']}
        label={t('pages.agent.profile.budget.maxSteps')}
        colProps={HALF}
        min={1}
        max={40}
        fieldProps={{ precision: 0 }}
      />
      <ProFormDigit
        name={['budget', 'timeoutS']}
        label={t('pages.agent.profile.budget.timeoutS')}
        colProps={HALF}
        min={60}
        max={1800}
        fieldProps={{ precision: 0 }}
      />
      <ProFormDigit
        name={['budget', 'promptTokens']}
        label={t('pages.agent.profile.budget.promptTokens')}
        colProps={HALF}
        min={1000}
        max={2_000_000}
        fieldProps={{ precision: 0 }}
      />
      <ProFormDigit
        name={['budget', 'completionTokens']}
        label={t('pages.agent.profile.budget.completionTokens')}
        colProps={HALF}
        min={500}
        max={200_000}
        fieldProps={{ precision: 0 }}
      />

      <ProFormDependency name={['kind']}>
        {({ kind }) =>
          kind === 'postmortem' ? null : (
            <>
              <SectionTitle>
                {t('pages.agent.profile.section.auto')}
              </SectionTitle>
              <ProFormSwitch
                name={['auto', 'enabled']}
                label={t('pages.agent.profile.auto.enabled')}
                colProps={FULL}
                extra={t('pages.agent.profile.auto.enabledHint')}
              />
              <ProFormDependency name={[['auto', 'enabled']]}>
                {({ auto }) =>
                  auto?.enabled ? (
                    <>
                      <ProFormDigit
                        name={['auto', 'minConfidence']}
                        label={t('pages.agent.profile.auto.minConfidence')}
                        colProps={HALF}
                        min={0}
                        max={100}
                        fieldProps={{ precision: 0 }}
                      />
                      <ProFormDigit
                        name={['auto', 'maxTargets']}
                        label={t('pages.agent.profile.auto.maxTargets')}
                        colProps={HALF}
                        min={1}
                        max={20}
                        fieldProps={{ precision: 0 }}
                      />
                      <ProFormSwitch
                        name={['auto', 'requireMetricEvidence']}
                        label={t(
                          'pages.agent.profile.auto.requireMetricEvidence',
                        )}
                        colProps={HALF}
                      />
                      <ProFormSelect
                        name={['auto', 'envs']}
                        label={t('pages.agent.profile.auto.envs')}
                        colProps={HALF}
                        fieldProps={{
                          mode: 'tags',
                          open: false,
                          tokenSeparators: [',', ' '],
                        }}
                        extra={t('pages.agent.profile.auto.envsHint')}
                      />
                    </>
                  ) : null
                }
              </ProFormDependency>
            </>
          )
        }
      </ProFormDependency>
    </DrawerForm>
  );
};

export default ProfileDrawer;
