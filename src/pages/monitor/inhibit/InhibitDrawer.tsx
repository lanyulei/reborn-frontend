/**
 * 抑制规则表单抽屉（新建 / 编辑）：存在满足「源条件」的活跃告警时，抑制满足「目标条件」且相等标签
 * 取值相同的告警的通知。两侧条件各自是「规则 + 级别 + 标签匹配」的并且关系，留空的不作限制；
 * 源条件不得为空，目标条件与相等标签不得同时为空。保存前可「预览」当前活跃告警里的源与被抑制者。
 */
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, App, Button, Col, Form } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { NOTIFY_SEVERITY_META } from '@/constants';
import { FULL, HALF } from '@/constants/layout';
import {
  createInhibit,
  getInhibit,
  previewInhibit,
  updateInhibit,
} from '@/services/monitor/inhibit';
import {
  type NormalizedInhibitSpec,
  normalizeInhibitSpec,
} from '@/services/monitor/normalize';
import type {
  InhibitPreviewResult,
  InhibitSpec,
  LabelMatcher,
  MonitorInhibit,
  MonitorSeverity,
  NamedRef,
  RuleGroup,
} from '@/services/monitor/typings';
import { useFormRules, useOptions, useSubmitter, useT } from '@/utils/i18n';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import { refsToKnown } from '../components/hooks';
import {
  MatchersEditor,
  normalizeMatchers,
  validateMatchers,
} from '../components/MatchersEditor';
import {
  LABEL_NAME_REGEX,
  MONITOR_LIMITS,
  SEVERITY_ORDER,
} from '../components/meta';
import { RuleSelect } from '../components/RuleSelect';
import { InhibitPreviewModal } from './InhibitPreviewModal';

/** 与 inhibit.proto 的校验上限一致（规则数、标签匹配行数沿用 MONITOR_LIMITS） */
const INHIBIT_LIMITS = {
  descMax: 255,
  equalLabelMax: 10,
  labelNameMax: 128,
} as const;

type Side = 'source' | 'target';

interface InhibitFormValues {
  name: string;
  description?: string;
  groupId?: string;
  sourceRuleIds?: string[];
  sourceSeverities?: MonitorSeverity[];
  sourceMatchers?: LabelMatcher[];
  targetRuleIds?: string[];
  targetSeverities?: MonitorSeverity[];
  targetMatchers?: LabelMatcher[];
  equalLabels?: string[];
  enabled?: boolean;
}

const buildSpec = (values: InhibitFormValues): InhibitSpec => ({
  ...(values.groupId ? { groupId: values.groupId } : {}),
  name: (values.name ?? '').trim(),
  description: (values.description ?? '').trim(),
  source: {
    ruleIds: values.sourceRuleIds ?? [],
    severities: values.sourceSeverities ?? [],
    matchers: normalizeMatchers(values.sourceMatchers),
  },
  target: {
    ruleIds: values.targetRuleIds ?? [],
    severities: values.targetSeverities ?? [],
    matchers: normalizeMatchers(values.targetMatchers),
  },
  equalLabels: values.equalLabels ?? [],
  enabled: values.enabled ?? false,
});

/** 已保存的规则 → 表单值（spec 已归一化，不补缺省：缺失的一侧条件即不限，缺失的 enabled 即已停用） */
const specToValues = (spec: NormalizedInhibitSpec): InhibitFormValues => ({
  name: spec.name,
  description: spec.description,
  groupId: spec.groupId,
  sourceRuleIds: spec.source.ruleIds,
  sourceSeverities: spec.source.severities,
  sourceMatchers: spec.source.matchers,
  targetRuleIds: spec.target.ruleIds,
  targetSeverities: spec.target.severities,
  targetMatchers: spec.target.matchers,
  equalLabels: spec.equalLabels,
  enabled: spec.enabled,
});

/** 新建表单的初值：两侧条件都空、启用 */
const createValues = (): InhibitFormValues => ({
  name: '',
  sourceRuleIds: [],
  sourceSeverities: [],
  sourceMatchers: [],
  targetRuleIds: [],
  targetSeverities: [],
  targetMatchers: [],
  equalLabels: [],
  enabled: true,
});

export interface InhibitDrawerProps {
  /** 编辑的抑制规则；为空即新建 */
  row?: MonitorInhibit | null;
  /** 规则分组与是否超级管理员：页面取一次下传 */
  groups: readonly RuleGroup[];
  isAdmin: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const InhibitDrawer: React.FC<InhibitDrawerProps> = ({
  row,
  groups,
  isAdmin,
  onClose,
  onSaved,
}) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const severityOptions = useOptions(NOTIFY_SEVERITY_META, SEVERITY_ORDER);
  const formRef = useRef<ProFormInstance<InhibitFormValues> | undefined>(
    undefined,
  );
  const [saved, setSaved] = useState<MonitorInhibit | null>(row ?? null);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<InhibitPreviewResult | null>(null);

  const runPreview = async () => {
    const form = formRef.current;
    if (!form) return;
    const values = await form.validateFields().catch(() => undefined);
    // 校验不通过：错误已显示在表单项上
    if (!values) return;
    setPreviewing(true);
    try {
      setPreview(await previewInhibit(buildSpec(values)));
    } catch {
      // 已由请求层提示
    } finally {
      setPreviewing(false);
    }
  };

  const matchersRule = {
    validator: (_: unknown, value?: LabelMatcher[]) =>
      validateMatchers(value)
        ? Promise.resolve()
        : Promise.reject(new Error(t('pages.monitor.matcher.invalid'))),
  };

  /**
   * 一侧条件的三个表单项。extraRule 挂在第一项（指定规则）上，用于跨项校验
   * （源条件不得为空），其余两项变化时随之重新校验。
   */
  const selectorFields = (
    side: Side,
    known: readonly NamedRef[] | undefined,
    extraRule?: { validator: () => Promise<void> },
  ) => (
    <>
      <Col span={24}>
        <Form.Item
          name={`${side}RuleIds`}
          label={t('pages.monitor.common.rules')}
          tooltip={t('pages.monitor.common.unlimitedIfEmpty')}
          dependencies={[`${side}Severities`, `${side}Matchers`]}
          rules={extraRule ? [extraRule] : []}
        >
          <RuleSelect
            maxCount={MONITOR_LIMITS.refRuleMax}
            knownUsers={refsToKnown(known)}
            placeholder={t('pages.monitor.common.unlimited')}
          />
        </Form.Item>
      </Col>
      <ProFormSelect
        name={`${side}Severities`}
        label={t('pages.monitor.common.severities')}
        colProps={FULL}
        options={severityOptions}
        fieldProps={{ mode: 'multiple' }}
        placeholder={t('pages.monitor.common.unlimited')}
      />
      <Col span={24}>
        <Form.Item
          name={`${side}Matchers`}
          label={t('pages.monitor.common.matchers')}
          tooltip={t('pages.monitor.matcher.tooltip')}
          rules={[matchersRule]}
        >
          <MatchersEditor />
        </Form.Item>
      </Col>
    </>
  );

  const sideEmpty = (side: Side) => {
    const form = formRef.current;
    return (
      !form?.getFieldValue(`${side}RuleIds`)?.length &&
      !form?.getFieldValue(`${side}Severities`)?.length &&
      !form?.getFieldValue(`${side}Matchers`)?.length
    );
  };

  return (
    <>
      <DrawerForm<InhibitFormValues>
        title={
          row
            ? t('pages.monitor.inhibit.edit.title', { name: row.spec.name })
            : t('pages.monitor.inhibit.create.title')
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
          if (!row) return createValues();
          const { inhibit } = await getInhibit(row.id);
          setSaved(inhibit);
          return specToValues(normalizeInhibitSpec(inhibit.spec));
        }}
        submitter={{
          ...(row ? submitter.save : submitter.create),
          render: (_, dom) => [
            <Button
              key="preview"
              loading={previewing}
              onClick={() => void runPreview()}
            >
              {t('pages.monitor.inhibit.preview.action')}
            </Button>,
            ...dom,
          ],
        }}
        onFinish={async (values) => {
          const spec = buildSpec(values);
          if (row) {
            await updateInhibit(row.id, {
              spec,
              version: saved?.version ?? row.version,
            });
            message.success(t('common.msg.saved'));
          } else {
            await createInhibit(spec);
            message.success(t('common.msg.created'));
          }
          onSaved?.();
          return true;
        }}
      >
        <Col span={24}>
          <Alert
            type="info"
            showIcon
            title={t('pages.monitor.inhibit.form.hint')}
            description={t('pages.monitor.inhibit.form.hint.example')}
            style={{ marginBottom: 16 }}
          />
        </Col>
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
            tooltip={t('pages.monitor.inhibit.form.group.tooltip')}
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
          name="description"
          label={t('pages.monitor.common.description')}
          colProps={FULL}
          fieldProps={{
            rows: 2,
            maxLength: INHIBIT_LIMITS.descMax,
            showCount: true,
          }}
        />

        <Col span={24}>
          <SectionTitle>
            {t('pages.monitor.inhibit.section.source')}
          </SectionTitle>
        </Col>
        {selectorFields('source', saved?.sourceRules, {
          validator: () =>
            sideEmpty('source')
              ? Promise.reject(
                  new Error(t('pages.monitor.inhibit.form.source.required')),
                )
              : Promise.resolve(),
        })}

        <Col span={24}>
          <SectionTitle>
            {t('pages.monitor.inhibit.section.target')}
          </SectionTitle>
        </Col>
        {selectorFields('target', saved?.targetRules)}

        <ProFormSelect
          name="equalLabels"
          label={t('pages.monitor.inhibit.form.equalLabels')}
          tooltip={t('pages.monitor.inhibit.form.equalLabels.tooltip')}
          colProps={FULL}
          fieldProps={{
            mode: 'tags',
            open: false,
            suffix: null,
            maxCount: INHIBIT_LIMITS.equalLabelMax,
            tokenSeparators: [',', ' '],
          }}
          placeholder={t('pages.monitor.inhibit.form.equalLabels.placeholder')}
          // 目标条件与相等标签不得同时为空：目标条件变化时随之重新校验
          dependencies={['targetRuleIds', 'targetSeverities', 'targetMatchers']}
          rules={[
            {
              validator: (_: unknown, value?: string[]) => {
                const labels = value ?? [];
                if (
                  !labels.every(
                    (item) =>
                      LABEL_NAME_REGEX.test(item) &&
                      item.length <= INHIBIT_LIMITS.labelNameMax,
                  )
                ) {
                  return Promise.reject(
                    new Error(t('pages.monitor.inhibit.form.equalLabels.rule')),
                  );
                }
                return !labels.length && sideEmpty('target')
                  ? Promise.reject(
                      new Error(
                        t('pages.monitor.inhibit.form.target.required'),
                      ),
                    )
                  : Promise.resolve();
              },
            },
          ]}
        />
        <ProFormSwitch
          name="enabled"
          label={t('common.column.enabled')}
          colProps={HALF}
        />
      </DrawerForm>
      <InhibitPreviewModal result={preview} onClose={() => setPreview(null)} />
    </>
  );
};

export default InhibitDrawer;
