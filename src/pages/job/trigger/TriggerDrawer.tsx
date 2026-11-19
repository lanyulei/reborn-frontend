/**
 * 新建 / 编辑触发器抽屉。类型创建后不可改：
 * - 开放接口：供流程的服务节点或外部系统调用；可允许调用方传参、作业结束后给流程实例回发信号。
 * - 告警：监控告警触发时执行（告警自愈），按规则 / 级别 / 标签匹配。
 */
import {
  DrawerForm,
  ProFormDependency,
  ProFormRadio,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, App, Checkbox, Col, Form } from 'antd';
import type React from 'react';
import { useMemo, useRef } from 'react';
import {
  type KeyValue,
  KeyValueEditor,
  kvToRecord,
  recordToKv,
  validateKeyValues,
} from '@/components/KeyValueEditor';
import { SectionTitle } from '@/components/SectionTitle';
import { NOTIFY_SEVERITY_META } from '@/constants';
import { FULL, HALF } from '@/constants/layout';
import { RuleSelect } from '@/pages/monitor/components/RuleSelect';
import { createJobTrigger, updateJobTrigger } from '@/services/job/trigger';
import type {
  JobParam,
  JobTrigger,
  JobTriggerSpec,
  JobTriggerType,
} from '@/services/job/typings';
import { useFormRules, useOptions, useSubmitter, useT } from '@/utils/i18n';
import { DurationInput } from '../components/inputs';
import {
  ALERT_LABEL_REGEX,
  JOB_LIMITS,
  SIGNAL_REGEX,
  TRIGGER_TYPE_META,
  TRIGGER_TYPE_ORDER,
} from '../components/meta';
import {
  collectParamValues,
  type ParamValues,
} from '../components/ParamFields';
import { TemplateParams } from '../components/TemplateParams';
import { TemplateSelect } from '../components/TemplateSelect';

const SEVERITIES = [1, 2, 3, 4] as const;

interface TriggerFormValues {
  name: string;
  type: JobTriggerType;
  templateId?: string;
  params?: ParamValues;
  passParams?: boolean;
  signal?: string;
  ruleIds?: string[];
  severities?: number[];
  labels?: KeyValue[];
  hostLabel?: string;
  cooldownS?: number;
  enabled?: boolean;
  description?: string;
}

const buildSpec = (
  values: TriggerFormValues,
  params: readonly JobParam[],
): JobTriggerSpec => ({
  name: values.name.trim(),
  type: values.type,
  templateId: values.templateId ?? '',
  params: collectParamValues(params, values.params),
  passParams: values.type === 1 ? (values.passParams ?? false) : false,
  signal: values.type === 1 ? (values.signal?.trim() ?? '') : '',
  ...(values.type === 2
    ? {
        alert: {
          ruleIds: values.ruleIds ?? [],
          severities: values.severities ?? [],
          labels: kvToRecord(values.labels),
          hostLabel: values.hostLabel?.trim() ?? '',
        },
      }
    : {}),
  cooldownS: values.cooldownS ?? 0,
  enabled: values.enabled ?? false,
  description: values.description?.trim() ?? '',
});

/** 新建 / 编辑触发器抽屉（row 为空即新建）；新建接口触发器成功后经 onSaved 带回一次性令牌 */
export const TriggerDrawer: React.FC<{
  row: JobTrigger | null;
  onClose: () => void;
  onSaved: (created?: { trigger: JobTrigger; token: string }) => void;
}> = ({ row, onClose, onSaved }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const typeOptions = useOptions(TRIGGER_TYPE_META, TRIGGER_TYPE_ORDER);
  const [form] = Form.useForm<TriggerFormValues>();
  const templateId = Form.useWatch('templateId', form);
  const type = Form.useWatch('type', form);
  const passParams = Form.useWatch('passParams', form);
  // 所选模板的参数定义（提交时据此整理参数取值）
  const paramDefs = useRef<JobParam[] | undefined>([]);
  // 表单里展示的参数定义所属的模板版本：随保存提交，模板在此期间被改过则后端拒绝
  const templateVersion = useRef<number | undefined>(undefined);

  const severityOptions = useMemo(
    () =>
      SEVERITIES.map((value) => ({
        value,
        label: t(NOTIFY_SEVERITY_META[value].textId),
      })),
    [t],
  );
  // 已选规则的名称（回显用）；规则已不存在的显示 ID
  const knownRules = useMemo(
    () =>
      (row?.spec.alert?.ruleIds ?? []).map((id, index) => ({
        id,
        label: row?.ruleNames?.[index] || id,
      })),
    [row],
  );

  return (
    <DrawerForm<TriggerFormValues>
      title={
        row
          ? t('pages.job.trigger.edit.title', { name: row.spec.name })
          : t('pages.job.trigger.create.title')
      }
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      open
      form={form}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true, mask: { closable: false } }}
      initialValues={
        row
          ? {
              name: row.spec.name,
              type: row.spec.type,
              templateId: row.spec.templateId,
              passParams: row.spec.passParams ?? false,
              signal: row.spec.signal,
              ruleIds: row.spec.alert?.ruleIds ?? [],
              severities: row.spec.alert?.severities ?? [],
              labels: recordToKv(row.spec.alert?.labels),
              hostLabel: row.spec.alert?.hostLabel,
              cooldownS: row.spec.cooldownS ?? 0,
              enabled: row.spec.enabled ?? false,
              description: row.spec.description,
            }
          : {
              name: '',
              type: 1,
              passParams: false,
              ruleIds: [],
              severities: [],
              labels: [],
              cooldownS: 0,
              enabled: true,
            }
      }
      submitter={row ? submitter.save : submitter.create}
      onFinish={async (values) => {
        if (!paramDefs.current) {
          message.warning(t('pages.job.params.notReady'));
          return false;
        }
        const spec = {
          ...buildSpec(values, paramDefs.current),
          templateVersion: templateVersion.current,
        };
        if (row) {
          await updateJobTrigger(row.id, { spec, version: row.version });
          message.success(t('common.msg.saved'));
          onSaved();
        } else {
          const { trigger, token } = await createJobTrigger(spec);
          if (token) {
            onSaved({ trigger, token });
          } else {
            message.success(t('common.msg.created'));
            onSaved();
          }
        }
        return true;
      }}
    >
      <Col span={24}>
        <Alert
          type="info"
          showIcon
          title={t('pages.job.trigger.notice.owner')}
          style={{ marginBottom: 16 }}
        />
      </Col>
      <ProFormRadio.Group
        name="type"
        label={t('pages.job.trigger.column.type')}
        colProps={FULL}
        options={typeOptions}
        disabled={Boolean(row)}
        extra={t(
          type === 2
            ? 'pages.job.trigger.form.type.2.extra'
            : 'pages.job.trigger.form.type.1.extra',
        )}
      />
      <ProFormText
        name="name"
        label={t('pages.job.common.name')}
        colProps={HALF}
        rules={[
          rules.required(t('pages.job.common.name')),
          rules.max(JOB_LIMITS.nameMax),
        ]}
      />
      <Col span={12}>
        <Form.Item
          name="templateId"
          label={t('pages.job.execution.column.template')}
          rules={[rules.select(t('pages.job.execution.column.template'))]}
        >
          <TemplateSelect />
        </Form.Item>
      </Col>

      <ProFormDependency name={['type']}>
        {({ type: current }) =>
          current === 2 ? (
            <>
              <Col span={24}>
                <SectionTitle>
                  {t('pages.job.trigger.section.alert')}
                </SectionTitle>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="ruleIds"
                  label={t('pages.job.trigger.form.rules')}
                  extra={t('pages.job.trigger.form.rules.extra')}
                  dependencies={['labels']}
                  rules={[
                    {
                      // 不限规则时必须给出标签条件，否则会匹配全部告警
                      validator: (_: unknown, value?: string[]) =>
                        (value ?? []).length > 0 ||
                        (
                          (form.getFieldValue('labels') as
                            | KeyValue[]
                            | undefined) ?? []
                        ).length > 0
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(t('pages.job.trigger.form.rules.rule')),
                            ),
                    },
                  ]}
                >
                  <RuleSelect
                    knownUsers={knownRules}
                    maxCount={JOB_LIMITS.alertRuleMax}
                    placeholder={t('pages.job.trigger.form.rules.placeholder')}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="severities"
                  label={t('pages.job.trigger.form.severities')}
                  extra={t('pages.job.trigger.form.severities.extra')}
                >
                  <Checkbox.Group options={severityOptions} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="labels"
                  label={t('pages.job.trigger.form.labels')}
                  extra={t('pages.job.trigger.form.labels.extra')}
                  rules={[
                    {
                      validator: (_: unknown, value?: KeyValue[]) =>
                        validateKeyValues(value, {
                          keyPattern: ALERT_LABEL_REGEX,
                          keyMax: 128,
                          valueMax: JOB_LIMITS.alertLabelValueMax,
                        })
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(
                                t('pages.job.trigger.form.labels.rule'),
                              ),
                            ),
                    },
                  ]}
                >
                  <KeyValueEditor
                    max={JOB_LIMITS.alertLabelMax}
                    keyPlaceholder={t('pages.job.trigger.form.labels.key')}
                    valuePlaceholder={t('pages.job.trigger.form.labels.value')}
                    addText={t('pages.job.trigger.form.labels.add')}
                  />
                </Form.Item>
              </Col>
              <ProFormText
                name="hostLabel"
                label={t('pages.job.trigger.form.hostLabel')}
                colProps={FULL}
                placeholder="instance"
                tooltip={t('pages.job.trigger.form.hostLabel.tooltip')}
                extra={t('pages.job.trigger.form.hostLabel.extra')}
                rules={[
                  {
                    pattern: ALERT_LABEL_REGEX,
                    message: t('pages.job.trigger.form.hostLabel.rule'),
                  },
                ]}
              />
            </>
          ) : (
            <>
              <Col span={24}>
                <SectionTitle>
                  {t('pages.job.trigger.section.api')}
                </SectionTitle>
              </Col>
              <ProFormSwitch
                name="passParams"
                label={t('pages.job.trigger.form.passParams')}
                colProps={HALF}
                extra={t('pages.job.trigger.form.passParams.extra')}
              />
              <ProFormText
                name="signal"
                label={t('pages.job.trigger.form.signal')}
                colProps={HALF}
                placeholder="job_done"
                tooltip={t('pages.job.trigger.form.signal.tooltip')}
                extra={t('pages.job.trigger.form.signal.extra')}
                rules={[
                  {
                    pattern: SIGNAL_REGEX,
                    message: t('pages.job.trigger.form.signal.rule'),
                  },
                ]}
              />
            </>
          )
        }
      </ProFormDependency>

      <Col span={12}>
        <Form.Item
          name="cooldownS"
          label={t('pages.job.trigger.column.cooldown')}
          extra={t('pages.job.trigger.form.cooldown.extra')}
          rules={[
            {
              validator: (_: unknown, value?: number) =>
                value === undefined ||
                (value >= 0 && value <= JOB_LIMITS.cooldownMaxS)
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(t('pages.job.trigger.form.cooldown.rule')),
                    ),
            },
          ]}
        >
          <DurationInput />
        </Form.Item>
      </Col>
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        colProps={HALF}
      />

      <ProFormTextArea
        name="description"
        label={t('pages.job.common.description')}
        colProps={FULL}
        fieldProps={{
          rows: 2,
          maxLength: JOB_LIMITS.descMax,
          showCount: true,
        }}
      />
      <Col span={24}>
        <SectionTitle>{t('pages.job.schedule.section.params')}</SectionTitle>
        <TemplateParams
          templateId={templateId}
          saved={
            row
              ? { templateId: row.spec.templateId, params: row.spec.params }
              : undefined
          }
          // 接口触发器允许调用方传参时，必填项可由调用方补齐
          enforceRequired={!(type === 1 && passParams === true)}
          onParams={(params, version) => {
            paramDefs.current = params;
            templateVersion.current = version;
          }}
        />
      </Col>
    </DrawerForm>
  );
};
