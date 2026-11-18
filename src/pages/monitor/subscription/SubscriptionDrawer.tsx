/**
 * 告警订阅表单抽屉（新建 / 编辑；订阅页与告警详情的「订阅同类告警」快捷入口共用）。
 * 筛选条件之间是「并且」；规则分组与级别必选，其余留空表示不限。保存前可「预览命中」。
 */
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormCheckbox,
  ProFormDependency,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Alert, App, Col, Form } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { UserSelect } from '@/components/UserSelect';
import { fetchMonitorUsers } from '@/components/UserSelect/sources';
import { NOTIFY_SEVERITY_META } from '@/constants';
import { FULL, HALF } from '@/constants/layout';
import {
  type NormalizedSubscriptionSpec,
  normalizeSubscriptionSpec,
} from '@/services/monitor/normalize';
import {
  createAlertSubscription,
  getAlertSubscription,
  previewAlertSubscription,
  updateAlertSubscription,
} from '@/services/monitor/subscription';
import type {
  AlertSubscriptionSpec,
  LabelMatcher,
  MonitorAlertSubscription,
  MonitorSeverity,
  RuleGroup,
} from '@/services/monitor/typings';
import { useFormRules, useOptions, useSubmitter, useT } from '@/utils/i18n';
import { AlertPreviewModal, useAlertPreview } from '../components/AlertPreview';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import {
  type DatasourceOptionsState,
  refsToKnown,
  useNotifyTargets,
  withRefOptions,
} from '../components/hooks';
import {
  MatchersEditor,
  normalizeMatchers,
  validateMatchers,
} from '../components/MatchersEditor';
import {
  MONITOR_LIMITS,
  ROBOT_GROUP_REGEX,
  SEVERITY_ORDER,
} from '../components/meta';
import { RuleSelect } from '../components/RuleSelect';
import { TargetsFailedAlert } from '../components/tags';

type SubscriptionEvent = 'firing' | 'resolved';

interface SubscriptionFormValues {
  name: string;
  groupIds: string[];
  ruleIds?: string[];
  datasourceIds?: string[];
  severities: MonitorSeverity[];
  events: SubscriptionEvent[];
  matchers?: LabelMatcher[];
  self?: boolean;
  userIds?: string[];
  scheduleIds?: string[];
  robotGroups?: string[];
  followRepeat?: boolean;
  enabled?: boolean;
}

const buildSpec = (values: SubscriptionFormValues): AlertSubscriptionSpec => ({
  name: values.name.trim(),
  groupIds: values.groupIds ?? [],
  ruleIds: values.ruleIds ?? [],
  datasourceIds: values.datasourceIds ?? [],
  severities: values.severities ?? [],
  onFiring: (values.events ?? []).includes('firing'),
  onResolved: (values.events ?? []).includes('resolved'),
  matchers: normalizeMatchers(values.matchers),
  receivers: {
    self: values.self ?? false,
    userIds: values.userIds ?? [],
    scheduleIds: values.scheduleIds ?? [],
    groups: values.robotGroups ?? [],
  },
  followRepeat: values.followRepeat ?? false,
  enabled: values.enabled ?? false,
});

/**
 * 已保存的订阅 → 表单值（spec 已归一化，不补缺省：缺失的 onFiring / onResolved /
 * enabled / self 即 false）。
 */
const specToValues = (
  spec: NormalizedSubscriptionSpec,
): SubscriptionFormValues => ({
  name: spec.name,
  groupIds: spec.groupIds,
  ruleIds: spec.ruleIds,
  datasourceIds: spec.datasourceIds,
  severities: spec.severities,
  events: [
    ...(spec.onFiring ? (['firing'] as const) : []),
    ...(spec.onResolved ? (['resolved'] as const) : []),
  ],
  matchers: spec.matchers,
  self: spec.receivers.self,
  userIds: spec.receivers.userIds,
  scheduleIds: spec.receivers.scheduleIds,
  robotGroups: spec.receivers.groups,
  followRepeat: spec.followRepeat,
  enabled: spec.enabled,
});

/**
 * 新建表单的初值：新建缺省值（四档级别、触发与恢复都订、通知我自己、启用）叠加调用方的
 * 预填（筛选条件）。
 */
const createValues = (
  prefill?: Partial<AlertSubscriptionSpec>,
): SubscriptionFormValues => ({
  name: prefill?.name ?? '',
  groupIds: prefill?.groupIds ?? [],
  ruleIds: prefill?.ruleIds ?? [],
  datasourceIds: prefill?.datasourceIds ?? [],
  severities: prefill?.severities ?? [...SEVERITY_ORDER],
  events: ['firing', 'resolved'],
  matchers: prefill?.matchers ?? [],
  self: true,
  userIds: [],
  scheduleIds: [],
  robotGroups: [],
  followRepeat: false,
  enabled: true,
});

export interface SubscriptionDrawerProps {
  /** 编辑的订阅；为空即新建 */
  row?: MonitorAlertSubscription | null;
  /** 新建时的预填内容（从告警详情「订阅同类告警」带入）与其中引用对象的显示名 */
  prefill?: Partial<AlertSubscriptionSpec>;
  prefillRules?: { id: string; label: string }[];
  /** 规则分组与数据源选项：页面取一次下传 */
  groups: readonly RuleGroup[];
  datasources: DatasourceOptionsState;
  onClose: () => void;
  onSaved?: () => void;
}

export const SubscriptionDrawer: React.FC<SubscriptionDrawerProps> = ({
  row,
  prefill,
  prefillRules,
  groups,
  datasources,
  onClose,
  onSaved,
}) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const severityOptions = useOptions(NOTIFY_SEVERITY_META, SEVERITY_ORDER);
  const formRef = useRef<ProFormInstance<SubscriptionFormValues> | undefined>(
    undefined,
  );
  const [saved, setSaved] = useState<MonitorAlertSubscription | null>(
    row ?? null,
  );
  const targets = useNotifyTargets();
  const preview = useAlertPreview(formRef, buildSpec, previewAlertSubscription);

  return (
    <>
      <DrawerForm<SubscriptionFormValues>
        title={
          row
            ? t('pages.monitor.subscription.edit.title', {
                name: row.spec.name,
              })
            : t('pages.monitor.subscription.create.title')
        }
        width={720}
        grid
        rowProps={{ gutter: 16 }}
        open
        formRef={formRef}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        drawerProps={{ destroyOnHidden: true }}
        request={async () => {
          if (!row) return createValues(prefill);
          const { subscription } = await getAlertSubscription(row.id);
          setSaved(subscription);
          return specToValues(normalizeSubscriptionSpec(subscription.spec));
        }}
        submitter={{
          ...(row ? submitter.save : submitter.create),
          render: preview.submitterRender,
        }}
        onFinish={async (values) => {
          const spec = buildSpec(values);
          if (row) {
            await updateAlertSubscription(row.id, {
              spec,
              version: saved?.version ?? row.version,
            });
            message.success(t('common.msg.saved'));
          } else {
            await createAlertSubscription(spec);
            message.success(t('common.msg.created'));
          }
          onSaved?.();
          return true;
        }}
      >
        <ProFormText
          name="name"
          label={t('pages.monitor.common.name')}
          colProps={FULL}
          rules={[
            rules.required(t('pages.monitor.common.name')),
            rules.max(MONITOR_LIMITS.nameMax),
          ]}
        />

        <Col span={24}>
          <SectionTitle>
            {t('pages.monitor.subscription.section.filter')}
          </SectionTitle>
          <Form.Item
            name="groupIds"
            label={t('pages.monitor.subscription.form.groups')}
            tooltip={t('pages.monitor.subscription.form.groups.tooltip')}
            rules={[
              {
                required: true,
                type: 'array',
                message: t('common.validation.select', {
                  label: t('pages.monitor.subscription.form.groups'),
                }),
              },
            ]}
          >
            <GroupTreeSelect
              multiple
              maxCount={MONITOR_LIMITS.subscriptionGroupMax}
              groups={groups}
              knownGroups={(saved?.groups ?? []).map((ref) => ({
                id: ref.id,
                name: ref.name || ref.id,
              }))}
              placeholder={t('pages.monitor.common.group.placeholder')}
            />
          </Form.Item>
          <Form.Item
            name="ruleIds"
            label={t('pages.monitor.common.rules')}
            tooltip={t('pages.monitor.common.unlimitedIfEmpty')}
          >
            <RuleSelect
              maxCount={MONITOR_LIMITS.refRuleMax}
              knownUsers={[
                ...refsToKnown(saved?.rules),
                ...(prefillRules ?? []),
              ]}
              placeholder={t('pages.monitor.common.unlimited')}
            />
          </Form.Item>
        </Col>
        <ProFormSelect
          name="datasourceIds"
          label={t('pages.monitor.common.datasources')}
          colProps={HALF}
          options={withRefOptions(datasources.options, saved?.datasources, t)}
          fieldProps={{
            mode: 'multiple',
            maxCount: MONITOR_LIMITS.refDatasourceMax,
            showSearch: { optionFilterProp: 'label' },
          }}
          placeholder={t('pages.monitor.common.unlimited')}
        />
        <ProFormSelect
          name="severities"
          label={t('pages.monitor.common.severities')}
          colProps={HALF}
          options={severityOptions}
          fieldProps={{ mode: 'multiple' }}
          rules={[
            {
              required: true,
              type: 'array',
              message: t('common.validation.select', {
                label: t('pages.monitor.common.severities'),
              }),
            },
          ]}
        />
        <ProFormCheckbox.Group
          name="events"
          label={t('pages.monitor.subscription.form.events')}
          colProps={FULL}
          options={[
            {
              value: 'firing',
              label: t('pages.monitor.subscription.event.firing'),
            },
            {
              value: 'resolved',
              label: t('pages.monitor.subscription.event.resolved'),
            },
          ]}
          rules={[
            {
              required: true,
              type: 'array',
              message: t('common.validation.select', {
                label: t('pages.monitor.subscription.form.events'),
              }),
            },
          ]}
        />
        <Col span={24}>
          <Form.Item
            name="matchers"
            label={t('pages.monitor.common.matchers')}
            tooltip={t('pages.monitor.matcher.tooltip')}
            rules={[
              {
                validator: (_: unknown, value?: LabelMatcher[]) =>
                  validateMatchers(value)
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(t('pages.monitor.matcher.invalid')),
                      ),
              },
            ]}
          >
            <MatchersEditor />
          </Form.Item>
        </Col>
        {/* 规则 / 数据源 / 标签都留空：将收到所选分组内这些级别的全部告警 */}
        <ProFormDependency name={['ruleIds', 'datasourceIds', 'matchers']}>
          {({ ruleIds, datasourceIds, matchers }) =>
            !ruleIds?.length && !datasourceIds?.length && !matchers?.length ? (
              <Col span={24}>
                <Alert
                  type="warning"
                  showIcon
                  title={t('pages.monitor.subscription.form.broad')}
                  style={{ marginBottom: 16 }}
                />
              </Col>
            ) : null
          }
        </ProFormDependency>

        <Col span={24}>
          <SectionTitle>
            {t('pages.monitor.subscription.section.receiver')}
          </SectionTitle>
          <TargetsFailedAlert targets={targets} />
        </Col>
        <ProFormSwitch
          name="self"
          label={t('pages.monitor.subscription.form.self')}
          colProps={HALF}
          // 接收方至少一个：四类全空时在此项报错
          dependencies={['userIds', 'scheduleIds', 'robotGroups']}
          rules={[
            ({ getFieldValue }) => ({
              validator: (_: unknown, self?: boolean) =>
                self ||
                getFieldValue('userIds')?.length ||
                getFieldValue('scheduleIds')?.length ||
                getFieldValue('robotGroups')?.length
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(
                        t('pages.monitor.subscription.form.receiver.required'),
                      ),
                    ),
            }),
          ]}
        />
        <ProFormSwitch
          name="followRepeat"
          label={t('pages.monitor.subscription.form.followRepeat')}
          tooltip={t('pages.monitor.subscription.form.followRepeat.tooltip')}
          colProps={HALF}
        />
        <Col span={24}>
          <Form.Item
            name="userIds"
            label={t('pages.monitor.common.users')}
            tooltip={t('pages.monitor.subscription.form.others.tooltip')}
          >
            <UserSelect
              multiple
              maxCount={MONITOR_LIMITS.notifyUserMax}
              fetchUsers={fetchMonitorUsers}
              knownUsers={refsToKnown(saved?.receiverUsers)}
              placeholder={t('pages.monitor.common.users.placeholder')}
            />
          </Form.Item>
        </Col>
        <ProFormSelect
          name="scheduleIds"
          label={t('pages.monitor.common.schedules')}
          tooltip={t('pages.monitor.common.schedules.tooltip')}
          colProps={FULL}
          options={withRefOptions(
            targets.scheduleOptions,
            saved?.receiverSchedules,
            t,
          )}
          fieldProps={{
            mode: 'multiple',
            maxCount: MONITOR_LIMITS.notifyScheduleMax,
            showSearch: { optionFilterProp: 'label' },
          }}
          placeholder={t('pages.monitor.common.schedules.placeholder')}
        />
        <ProFormSelect
          name="robotGroups"
          label={t('pages.monitor.subscription.form.robotGroups')}
          tooltip={t('pages.monitor.subscription.form.robotGroups.tooltip')}
          colProps={FULL}
          fieldProps={{
            mode: 'tags',
            open: false,
            suffix: null,
            maxCount: MONITOR_LIMITS.robotGroupMax,
            tokenSeparators: [',', ' '],
          }}
          placeholder="$group:ops"
          rules={[
            {
              validator: (_: unknown, value?: string[]) =>
                (value ?? []).every((item) => ROBOT_GROUP_REGEX.test(item))
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(
                        t('pages.monitor.subscription.form.robotGroups.rule'),
                      ),
                    ),
            },
          ]}
        />
        <ProFormSwitch
          name="enabled"
          label={t('common.column.enabled')}
          colProps={HALF}
        />
      </DrawerForm>
      <AlertPreviewModal
        result={preview.result}
        summaryId="pages.monitor.subscription.preview.summary"
        onClose={preview.close}
      />
    </>
  );
};

export default SubscriptionDrawer;
