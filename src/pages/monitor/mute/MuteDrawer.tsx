/**
 * 屏蔽规则表单抽屉（新建 / 编辑；屏蔽规则页与告警详情的「屏蔽」快捷入口共用）。
 * 条件之间是「并且」，留空的条件不作限制；保存前可「预览命中」当前活跃告警。
 */
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDependency,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, Button, Col, DatePicker, Form, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type React from 'react';
import { useRef, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { NOTIFY_SEVERITY_META } from '@/constants';
import { FULL, HALF } from '@/constants/layout';
import {
  createMute,
  getMute,
  previewMute,
  updateMute,
} from '@/services/monitor/mute';
import {
  type NormalizedMuteSpec,
  normalizeMuteSpec,
} from '@/services/monitor/normalize';
import type {
  EffectiveTime,
  LabelMatcher,
  MonitorMute,
  MonitorMuteMode,
  MonitorMuteTimeType,
  MonitorSeverity,
  MuteSpec,
  RuleGroup,
} from '@/services/monitor/typings';
import { useFormRules, useOptions, useSubmitter, useT } from '@/utils/i18n';
import { AlertPreviewModal, useAlertPreview } from '../components/AlertPreview';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import {
  type DatasourceOptionsState,
  refsToKnown,
  withRefOptions,
} from '../components/hooks';
import {
  MatchersEditor,
  normalizeMatchers,
  validateMatchers,
} from '../components/MatchersEditor';
import {
  MONITOR_LIMITS,
  MUTE_MODE_META,
  MUTE_MODE_ORDER,
  MUTE_TIME_TYPE_META,
  MUTE_TIME_TYPE_ORDER,
  SEVERITY_ORDER,
} from '../components/meta';
import { RuleSelect } from '../components/RuleSelect';
import {
  localTimezone,
  TimeWindowsEditor,
  validateEffectiveTime,
} from '../components/TimeWindowsEditor';

/** 一次性屏蔽的快捷时长（分钟） */
const QUICK_MINUTES = [30, 60, 120, 360, 1440, 10080];

interface MuteFormValues {
  name: string;
  reason: string;
  groupId?: string;
  ruleIds?: string[];
  datasourceIds?: string[];
  severities?: MonitorSeverity[];
  matchers?: LabelMatcher[];
  mode: MonitorMuteMode;
  timeType: MonitorMuteTimeType;
  /** 一次性：起止时间 */
  range?: [Dayjs, Dayjs];
  /** 周期：时间窗 */
  periodic?: EffectiveTime;
  /** 周期：有效期（可只填一端或都不填） */
  validity?: [Dayjs | null, Dayjs | null];
  enabled?: boolean;
}

const buildSpec = (values: MuteFormValues): MuteSpec => ({
  ...(values.groupId ? { groupId: values.groupId } : {}),
  name: values.name.trim(),
  reason: values.reason.trim(),
  ruleIds: values.ruleIds ?? [],
  datasourceIds: values.datasourceIds ?? [],
  severities: values.severities ?? [],
  matchers: normalizeMatchers(values.matchers),
  mode: values.mode,
  timeType: values.timeType,
  ...(values.timeType === 1
    ? {
        startTime: values.range?.[0].toISOString(),
        endTime: values.range?.[1].toISOString(),
      }
    : {
        periodic: {
          timezone: values.periodic?.timezone ?? '',
          windows: values.periodic?.windows ?? [],
        },
        ...(values.validity?.[0]
          ? { startTime: values.validity[0].toISOString() }
          : {}),
        ...(values.validity?.[1]
          ? { endTime: values.validity[1].toISOString() }
          : {}),
      }),
  enabled: values.enabled ?? false,
});

/** 起止时间 → 表单的两个时间项（一次性用 range，周期用 validity） */
const timeValues = (
  spec: Partial<Pick<MuteSpec, 'timeType' | 'startTime' | 'endTime'>>,
): Pick<MuteFormValues, 'range' | 'validity'> => ({
  range:
    spec.timeType !== 2 && spec.startTime && spec.endTime
      ? [dayjs(spec.startTime), dayjs(spec.endTime)]
      : undefined,
  validity:
    spec.timeType === 2
      ? [
          spec.startTime ? dayjs(spec.startTime) : null,
          spec.endTime ? dayjs(spec.endTime) : null,
        ]
      : undefined,
});

/** 尚未配置周期时间窗时的起始值：时区取浏览器时区（改成周期屏蔽时从它开始填） */
const blankPeriodic = (): EffectiveTime => ({
  timezone: localTimezone(),
  windows: [],
});

/**
 * 已保存的屏蔽规则 → 表单值（spec 已归一化，不补缺省：缺失的 enabled 即已停用，
 * 周期时间窗的空时区即 UTC）。一次性屏蔽没有周期时间窗，该项给空白起始值。
 */
const specToValues = (spec: NormalizedMuteSpec): Partial<MuteFormValues> => ({
  name: spec.name,
  reason: spec.reason,
  groupId: spec.groupId,
  ruleIds: spec.ruleIds,
  datasourceIds: spec.datasourceIds,
  severities: spec.severities,
  matchers: spec.matchers,
  mode: spec.mode,
  timeType: spec.timeType,
  ...timeValues(spec),
  periodic: spec.periodic ?? blankPeriodic(),
  enabled: spec.enabled,
});

/** 新建表单的初值：新建缺省值（只屏蔽通知、一次性、启用）叠加调用方的预填 */
const createValues = (prefill?: Partial<MuteSpec>): Partial<MuteFormValues> => {
  const timeType = prefill?.timeType ?? 1;
  return {
    name: prefill?.name,
    reason: prefill?.reason,
    groupId: prefill?.groupId,
    ruleIds: prefill?.ruleIds ?? [],
    datasourceIds: prefill?.datasourceIds ?? [],
    severities: prefill?.severities ?? [],
    matchers: prefill?.matchers ?? [],
    mode: prefill?.mode ?? 1,
    timeType,
    ...timeValues({
      timeType,
      startTime: prefill?.startTime,
      endTime: prefill?.endTime,
    }),
    periodic: prefill?.periodic ?? blankPeriodic(),
    enabled: true,
  };
};

export interface MuteDrawerProps {
  /** 编辑的屏蔽规则；为空即新建 */
  row?: MonitorMute | null;
  /** 新建时的预填内容（从告警详情「屏蔽」带入）与其中引用对象的显示名 */
  prefill?: Partial<MuteSpec>;
  prefillRules?: { id: string; label: string }[];
  /** 规则分组、是否超级管理员、数据源选项：页面取一次下传 */
  groups: readonly RuleGroup[];
  isAdmin: boolean;
  datasources: DatasourceOptionsState;
  onClose: () => void;
  onSaved?: () => void;
}

export const MuteDrawer: React.FC<MuteDrawerProps> = ({
  row,
  prefill,
  prefillRules,
  groups,
  isAdmin,
  datasources,
  onClose,
  onSaved,
}) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const severityOptions = useOptions(NOTIFY_SEVERITY_META, SEVERITY_ORDER);
  const modeOptions = useOptions(MUTE_MODE_META, MUTE_MODE_ORDER);
  const timeTypeOptions = useOptions(MUTE_TIME_TYPE_META, MUTE_TIME_TYPE_ORDER);
  const formRef = useRef<ProFormInstance<MuteFormValues> | undefined>(
    undefined,
  );
  const [saved, setSaved] = useState<MonitorMute | null>(row ?? null);
  const preview = useAlertPreview(formRef, buildSpec, previewMute);

  return (
    <>
      <DrawerForm<MuteFormValues>
        // 保持 Dayjs 原值：默认会转成字符串，提交时 .toISOString 抛错
        dateFormatter={false}
        title={
          row
            ? t('pages.monitor.mute.edit.title', { name: row.spec.name })
            : t('pages.monitor.mute.create.title')
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
          if (!row) return createValues(prefill) as MuteFormValues;
          const { mute } = await getMute(row.id);
          setSaved(mute);
          return specToValues(normalizeMuteSpec(mute.spec)) as MuteFormValues;
        }}
        submitter={{
          ...(row ? submitter.save : submitter.create),
          render: preview.submitterRender,
        }}
        onFinish={async (values) => {
          const spec = buildSpec(values);
          if (row) {
            await updateMute(row.id, {
              spec,
              version: saved?.version ?? row.version,
            });
            message.success(t('common.msg.saved'));
          } else {
            await createMute(spec);
            message.success(t('pages.monitor.mute.created'));
          }
          onSaved?.();
          return true;
        }}
      >
        <ProFormText
          name="name"
          label={t('pages.monitor.common.name')}
          colProps={HALF}
          rules={[
            rules.required(t('pages.monitor.common.name')),
            rules.max(MONITOR_LIMITS.nameMax),
          ]}
        />
        <Col span={12}>
          <Form.Item
            name="groupId"
            label={t('pages.monitor.mute.form.group')}
            tooltip={t('pages.monitor.mute.form.group.tooltip')}
            // 作用于全部分组（留空）仅超级管理员
            rules={
              isAdmin ? [] : [rules.select(t('pages.monitor.mute.form.group'))]
            }
          >
            <GroupTreeSelect
              groups={groups}
              minLevel={2}
              knownGroups={
                saved?.spec.groupId && saved.groupName
                  ? [{ id: saved.spec.groupId, name: saved.groupName }]
                  : undefined
              }
              placeholder={
                isAdmin
                  ? t('pages.monitor.mute.form.group.all')
                  : t('pages.monitor.mute.form.group.placeholder')
              }
            />
          </Form.Item>
        </Col>
        <ProFormTextArea
          name="reason"
          label={t('pages.monitor.mute.form.reason')}
          colProps={FULL}
          fieldProps={{
            rows: 2,
            maxLength: MONITOR_LIMITS.muteReasonMax,
            showCount: true,
          }}
          rules={[rules.required(t('pages.monitor.mute.form.reason'))]}
        />

        <Col span={24}>
          <SectionTitle>{t('pages.monitor.mute.section.match')}</SectionTitle>
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
          placeholder={t('pages.monitor.common.unlimited')}
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
          <SectionTitle>
            {t('pages.monitor.mute.section.behaviour')}
          </SectionTitle>
        </Col>
        <ProFormDependency name={['mode']}>
          {({ mode }) => (
            <ProFormRadio.Group
              name="mode"
              label={t('pages.monitor.mute.form.mode')}
              colProps={FULL}
              options={modeOptions}
              extra={
                mode ? t(`pages.monitor.mute.form.mode.${mode}.hint`) : null
              }
              rules={[rules.select(t('pages.monitor.mute.form.mode'))]}
            />
          )}
        </ProFormDependency>
        <ProFormRadio.Group
          name="timeType"
          label={t('pages.monitor.mute.form.timeType')}
          colProps={FULL}
          options={timeTypeOptions}
          rules={[rules.select(t('pages.monitor.mute.form.timeType'))]}
        />
        <ProFormDependency name={['timeType']}>
          {({ timeType }) =>
            timeType === 2 ? (
              <Col span={24}>
                <Form.Item
                  name="periodic"
                  label={t('pages.monitor.mute.form.periodic')}
                  rules={[
                    {
                      validator: (_: unknown, value?: EffectiveTime) =>
                        (value?.windows?.length ?? 0) > 0 &&
                        validateEffectiveTime(value)
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(
                                t('pages.monitor.mute.form.periodic.required'),
                              ),
                            ),
                    },
                  ]}
                >
                  <TimeWindowsEditor />
                </Form.Item>
                <Form.Item
                  name="validity"
                  label={t('pages.monitor.mute.form.validity')}
                  tooltip={t('pages.monitor.mute.form.validity.tooltip')}
                >
                  <DatePicker.RangePicker
                    showTime
                    allowEmpty={[true, true]}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            ) : (
              <Col span={24}>
                <Form.Item
                  name="range"
                  label={t('pages.monitor.mute.form.range')}
                  rules={[rules.select(t('pages.monitor.mute.form.range'))]}
                  extra={
                    <Space size={4} wrap style={{ marginTop: 8 }}>
                      {QUICK_MINUTES.map((minutes) => (
                        <Button
                          key={minutes}
                          size="small"
                          onClick={() =>
                            formRef.current?.setFieldValue('range', [
                              dayjs(),
                              dayjs().add(minutes, 'minute'),
                            ])
                          }
                        >
                          {t(`pages.monitor.mute.quick.${minutes}`)}
                        </Button>
                      ))}
                    </Space>
                  }
                >
                  <DatePicker.RangePicker
                    showTime
                    allowClear={false}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            )
          }
        </ProFormDependency>
        <ProFormSwitch
          name="enabled"
          label={t('common.column.enabled')}
          colProps={HALF}
        />
      </DrawerForm>
      <AlertPreviewModal
        result={preview.result}
        summaryId="pages.monitor.mute.preview.summary"
        onClose={preview.close}
      />
    </>
  );
};

export default MuteDrawer;
