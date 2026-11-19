/**
 * 记录规则表单抽屉（新建 / 编辑）：指标名、分组、数据源、PromQL（可校验、可预览数据）、执行周期、
 * 附加标签。规则名称即写回的指标名；所选数据源必须配置了 Remote Write 地址。
 * 只对有新建 / 编辑权限的用户打开——校验与数据预览（查询接口）也只由这两个权限放行。
 */
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import { Alert, App, Button, Col, Form, Segmented } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import {
  type KeyValue,
  KeyValueEditor,
  kvToRecord,
  recordToKv,
  validateKeyValues,
} from '@/components/KeyValueEditor';
import { SectionTitle } from '@/components/SectionTitle';
import { FULL, HALF } from '@/constants/layout';
import {
  type NormalizedRecordRuleSpec,
  normalizeRecordRuleSpec,
} from '@/services/monitor/normalize';
import {
  createRecordRule,
  getRecordRule,
  updateRecordRule,
  validateRecordRule,
} from '@/services/monitor/recordRule';
import { getErrorReason, monitorReasonText } from '@/services/monitor/request';
import type {
  MonitorRecordRule,
  RecordRuleIssue,
  RecordRuleSpec,
  RuleGroup,
} from '@/services/monitor/typings';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import {
  type DatasourceOptionsState,
  withRefOptions,
} from '../components/hooks';
import { LABEL_NAME_REGEX } from '../components/meta';
import { type QueryMode, QueryRunner } from '../components/QueryRunner';
import { useMonitorStyles } from '../components/styles';
import { probeDatasourceWritable, useWritableDatasources } from './datasources';
import {
  ISSUE_FIELD,
  METRIC_NAME_REGEX,
  NO_WRITE_URL,
  RECORD_LIMITS,
} from './meta';

interface RecordFormValues {
  name: string;
  groupId: string;
  description?: string;
  datasourceId: string;
  expr: string;
  intervalS: number;
  labels?: KeyValue[];
  enabled?: boolean;
}

/** ProForm 提交时会去掉空串字段：逐项补回，保证整份 spec 都传回 */
const buildSpec = (values: Partial<RecordFormValues>): RecordRuleSpec => ({
  groupId: values.groupId ?? '',
  name: (values.name ?? '').trim(),
  description: (values.description ?? '').trim(),
  datasourceId: values.datasourceId ?? '',
  expr: values.expr ?? '',
  intervalS: values.intervalS as number,
  labels: kvToRecord(
    (values.labels ?? []).map((row) => ({ ...row, value: row.value ?? '' })),
  ),
  enabled: values.enabled ?? false,
});

/** 已保存的规则 → 表单值（spec 已归一化，不补缺省） */
const specToValues = (
  spec: NormalizedRecordRuleSpec,
): Partial<RecordFormValues> => ({
  name: spec.name,
  groupId: spec.groupId,
  description: spec.description,
  datasourceId: spec.datasourceId,
  expr: spec.expr,
  intervalS: spec.intervalS,
  labels: recordToKv(spec.labels),
  enabled: spec.enabled,
});

const byteLength = (text: string) => new TextEncoder().encode(text).length;

export interface RecordDrawerProps {
  /** 编辑的记录规则；为空即新建 */
  row?: MonitorRecordRule | null;
  /** 规则分组、数据源候选：页面取一次下传 */
  groups: readonly RuleGroup[];
  datasources: DatasourceOptionsState;
  onClose: () => void;
  onSaved?: () => void;
}

export const RecordDrawer: React.FC<RecordDrawerProps> = ({
  row,
  groups,
  datasources,
  onClose,
  onSaved,
}) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { styles } = useMonitorStyles();
  const formRef = useRef<ProFormInstance<RecordFormValues> | undefined>(
    undefined,
  );
  const [saved, setSaved] = useState<MonitorRecordRule | null>(row ?? null);
  const [validating, setValidating] = useState(false);
  /** 校验返回的、对不上表单项的问题 */
  const [otherIssues, setOtherIssues] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<QueryMode>('range');
  // 只采纳最后一次「数据源是否可写」的结论
  const probeSeq = useRef(0);
  const writable = useWritableDatasources(datasources);
  // 有数据源列表可筛、却没有一个配置了写入地址：没法保存
  const noneWritable =
    writable.filtered && writable.loaded && writable.options.length === 0;

  const issueText = (issue: RecordRuleIssue) =>
    monitorReasonText(issue.reason, issue.message) ||
    issue.message ||
    issue.reason ||
    '';

  const setFieldError = (name: keyof RecordFormValues, errors: string[]) =>
    formRef.current?.setFields([{ name, errors }]);

  /** 「校验」：先过表单自己的规则（否则请求过不了参数校验），再把服务端逐项的问题落到对应的表单项 */
  const validate = async () => {
    const form = formRef.current;
    if (!form) return;
    try {
      await form.validateFields();
    } catch {
      return;
    }
    setValidating(true);
    try {
      const result = await validateRecordRule({
        spec: buildSpec(form.getFieldsValue()),
        ...(row ? { id: row.id } : {}),
      });
      const issues = result.issues ?? [];
      const byField = new Map<keyof RecordFormValues, string[]>();
      const rest: string[] = [];
      for (const issue of issues) {
        const name = ISSUE_FIELD[issue.field ?? ''] as
          | keyof RecordFormValues
          | undefined;
        if (name)
          byField.set(name, [...(byField.get(name) ?? []), issueText(issue)]);
        else rest.push(issueText(issue));
      }
      form.setFields([...byField].map(([name, errors]) => ({ name, errors })));
      setOtherIssues(rest);
      if (issues.length === 0) {
        message.success(t('pages.monitor.record.validate.ok'));
      }
    } catch {
      // 失败提示由请求层弹出
    } finally {
      setValidating(false);
    }
  };

  /**
   * 候选里看不出数据源有没有写入地址时，选中即确认。表单多半还没填完：没填的项用占位内容，
   * 只看数据源一项的结论。
   */
  const probe = async (datasourceId?: string) => {
    const current = ++probeSeq.current;
    if (writable.filtered || !datasourceId) return;
    const values: Partial<RecordFormValues> =
      formRef.current?.getFieldsValue() ?? {};
    const groupId =
      values.groupId || groups.find((group) => (group.level ?? 0) >= 2)?.id;
    if (!groupId) return;
    const ok = await probeDatasourceWritable(
      {
        groupId,
        name: METRIC_NAME_REGEX.test(values.name ?? '')
          ? (values.name as string)
          : 'record:probe',
        datasourceId,
        expr: values.expr?.trim() ? values.expr : '1',
        intervalS: values.intervalS || RECORD_LIMITS.intervalDefault,
        labels: {},
        enabled: false,
      },
      row?.id,
    );
    if (current !== probeSeq.current || ok !== false) return;
    if (formRef.current?.getFieldValue('datasourceId') !== datasourceId) return;
    setFieldError('datasourceId', [
      monitorReasonText(NO_WRITE_URL, undefined) ?? '',
    ]);
  };

  return (
    <DrawerForm<RecordFormValues>
      title={
        row
          ? t('pages.monitor.record.edit.title', { name: row.spec.name })
          : t('pages.monitor.record.create.title')
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
        if (!row) {
          return {
            intervalS: RECORD_LIMITS.intervalDefault,
            labels: [],
            enabled: true,
          } as unknown as RecordFormValues;
        }
        const { recordRule } = await getRecordRule(row.id);
        setSaved(recordRule);
        return specToValues(
          normalizeRecordRuleSpec(recordRule.spec),
        ) as RecordFormValues;
      }}
      submitter={{
        ...(row ? submitter.save : submitter.create),
        submitButtonProps: { disabled: noneWritable },
      }}
      onFinish={async (values) => {
        const spec = buildSpec(values);
        try {
          if (row) {
            await updateRecordRule(row.id, {
              spec,
              version: saved?.version ?? row.version,
            });
            message.success(t('common.msg.saved'));
          } else {
            await createRecordRule(spec);
            message.success(t('common.msg.created'));
          }
        } catch (e) {
          // 提示已由请求层弹出；数据源不可写的另落到数据源一项上
          if (getErrorReason(e) === NO_WRITE_URL) {
            setFieldError('datasourceId', [
              monitorReasonText(NO_WRITE_URL, undefined) ?? '',
            ]);
          }
          return false;
        }
        onSaved?.();
        return true;
      }}
    >
      <ProFormText
        name="name"
        label={t('pages.monitor.record.form.name')}
        tooltip={t('pages.monitor.record.form.name.tooltip')}
        colProps={FULL}
        placeholder="job:http_requests:rate5m"
        extra={t('pages.monitor.record.form.name.hint')}
        fieldProps={{
          className: styles.codeInput,
          maxLength: RECORD_LIMITS.nameMax,
        }}
        rules={[
          rules.required(t('pages.monitor.record.form.name')),
          {
            pattern: METRIC_NAME_REGEX,
            message: t('pages.monitor.record.form.name.rule'),
          },
          rules.max(RECORD_LIMITS.nameMax),
        ]}
      />
      <Col span={12}>
        <Form.Item
          name="groupId"
          label={t('pages.monitor.common.group')}
          rules={[rules.select(t('pages.monitor.common.group'))]}
        >
          <GroupTreeSelect
            groups={groups}
            minLevel={2}
            allowClear={false}
            knownGroups={
              saved?.spec.groupId && saved.groupName
                ? [{ id: saved.spec.groupId, name: saved.groupName }]
                : undefined
            }
            placeholder={t('pages.monitor.common.group.placeholder')}
          />
        </Form.Item>
      </Col>
      <ProFormSelect
        name="datasourceId"
        label={t('pages.monitor.common.datasource')}
        tooltip={t('pages.monitor.record.form.datasource.tooltip')}
        colProps={HALF}
        options={withRefOptions(
          writable.options,
          saved?.spec.datasourceId
            ? [
                {
                  id: saved.spec.datasourceId,
                  name: saved.datasourceName ?? '',
                  missing: !saved.datasourceName,
                },
              ]
            : undefined,
          t,
        )}
        fieldProps={{
          loading: !writable.loaded,
          showSearch: { optionFilterProp: 'label' },
          onChange: (value) => void probe(value as string | undefined),
        }}
        rules={[rules.select(t('pages.monitor.common.datasource'))]}
      />
      {noneWritable && (
        <Col span={24}>
          <Alert
            type="warning"
            showIcon
            title={t('pages.monitor.record.noWritable.title')}
            description={
              <>
                {t('pages.monitor.record.noWritable.description')}{' '}
                <Link to="/monitor/datasource">
                  {t('pages.monitor.record.noWritable.link')}
                </Link>
              </>
            }
            style={{ marginBottom: 16 }}
          />
        </Col>
      )}
      <ProFormTextArea
        name="description"
        label={t('pages.monitor.common.description')}
        colProps={FULL}
        fieldProps={{
          rows: 2,
          maxLength: RECORD_LIMITS.descMax,
          showCount: true,
        }}
      />

      <Col span={24}>
        <SectionTitle>{t('pages.monitor.record.section.query')}</SectionTitle>
      </Col>
      <ProFormTextArea
        name="expr"
        label="PromQL"
        colProps={FULL}
        placeholder={t('pages.monitor.record.form.expr.placeholder')}
        fieldProps={{
          className: styles.codeInput,
          autoSize: { minRows: 3, maxRows: 12 },
        }}
        extra={
          <Button
            size="small"
            loading={validating}
            style={{ marginTop: 8 }}
            onClick={() => void validate()}
          >
            {t('pages.monitor.record.validate')}
          </Button>
        }
        rules={[
          {
            validator: (_: unknown, value?: string) =>
              !value?.trim()
                ? Promise.reject(
                    new Error(
                      t('common.validation.required', { label: 'PromQL' }),
                    ),
                  )
                : byteLength(value) > RECORD_LIMITS.exprBytesMax
                  ? Promise.reject(
                      new Error(
                        t('pages.monitor.record.form.expr.rule', {
                          max: RECORD_LIMITS.exprBytesMax,
                        }),
                      ),
                    )
                  : Promise.resolve(),
          },
        ]}
      />
      {otherIssues.length > 0 && (
        <Col span={24}>
          <Alert
            type="error"
            showIcon
            title={t('pages.monitor.record.validate.issues')}
            description={otherIssues.map((text) => (
              <div key={text}>{text}</div>
            ))}
            style={{ marginBottom: 16 }}
          />
        </Col>
      )}
      <ProFormDependency name={['datasourceId', 'expr']}>
        {({ datasourceId, expr }) => (
          <Col span={24}>
            <Form.Item
              label={t('pages.monitor.record.preview')}
              tooltip={t('pages.monitor.record.preview.tooltip')}
            >
              <Segmented<QueryMode>
                size="small"
                value={previewMode}
                options={[
                  {
                    value: 'range',
                    label: t('pages.monitor.explore.mode.range'),
                  },
                  {
                    value: 'instant',
                    label: t('pages.monitor.explore.mode.instant'),
                  },
                ]}
                onChange={setPreviewMode}
                style={{ marginBottom: 12 }}
              />
              <QueryRunner
                // 切换即时 / 区间时清掉上一种模式的结果
                key={previewMode}
                datasourceId={datasourceId as string | undefined}
                expr={expr as string | undefined}
                mode={previewMode}
              />
            </Form.Item>
          </Col>
        )}
      </ProFormDependency>
      <ProFormDigit
        name="intervalS"
        label={t('pages.monitor.record.form.interval')}
        tooltip={t('pages.monitor.record.form.interval.tooltip')}
        colProps={HALF}
        min={RECORD_LIMITS.interval.min}
        max={RECORD_LIMITS.interval.max}
        fieldProps={{ precision: 0, suffix: t('pages.monitor.unit.second') }}
        rules={[rules.required(t('pages.monitor.record.form.interval'))]}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        colProps={HALF}
      />
      <Col span={24}>
        <Form.Item
          name="labels"
          label={t('pages.monitor.record.form.labels')}
          tooltip={t('pages.monitor.record.form.labels.tooltip')}
          rules={[
            {
              validator: (_: unknown, value?: KeyValue[]) =>
                (value ?? []).length <= RECORD_LIMITS.labelMax &&
                validateKeyValues(
                  (value ?? []).map((item) => ({
                    ...item,
                    value: item.value ?? '',
                  })),
                  {
                    keyPattern: LABEL_NAME_REGEX,
                    keyMax: RECORD_LIMITS.labelKeyMax,
                    valueMax: RECORD_LIMITS.labelValueMax,
                    valueRequired: true,
                    forbidKeyPrefix: '__',
                  },
                )
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(t('pages.monitor.record.form.labels.rule')),
                    ),
            },
          ]}
        >
          <KeyValueEditor
            max={RECORD_LIMITS.labelMax}
            keyPlaceholder="team"
            valuePlaceholder="infra"
            addText={t('pages.monitor.record.form.labels.add')}
          />
        </Form.Item>
      </Col>
    </DrawerForm>
  );
};

export default RecordDrawer;
