/**
 * 告警规则表单抽屉（新建 / 编辑 / 只读查看）。与工单模板等大表单同一做法：一个抽屉、
 * 用分节标题分段——基本信息 → 数据源与查询 → 生效范围 → 事件内容 → 关联资源 → 事件处理 →
 * 通知配置 → 事件动作。保存即生效（秒级）；每次保存记一个版本，编辑时可填变更说明。
 *
 * 关联资源 / 事件处理 / 事件动作三节默认收起（已保存的规则在其中配置了内容时自动展开），没展开过
 * 的节不渲染表单项；按条件显示的项（自定义关联方式、动作的模板与代理用户…）隐藏时同样不在表单的
 * 提交值里。所以保存与模拟触发都从表单存储里取全量值（allValues），而不是 onFinish 给的那份。
 */
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, Button, Col, Form, theme } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import {
  type KeyValue,
  KeyValueEditor,
  validateKeyValues,
} from '@/components/KeyValueEditor';
import { SectionTitle } from '@/components/SectionTitle';
import { FULL, HALF } from '@/constants/layout';
import {
  type NormalizedRuleSpec,
  normalizeRuleSpec,
} from '@/services/monitor/normalize';
import { createRule, getRule, updateRule } from '@/services/monitor/rule';
import type {
  MonitorRule,
  RuleGroup,
  RuleSpec,
} from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import type { DatasourceOptionsState } from '../components/hooks';
import { LABEL_NAME_REGEX, MONITOR_LIMITS } from '../components/meta';
import { RuleActionsSection } from './RuleActionsSection';
import { RuleCmdbSection } from './RuleCmdbSection';
import { RuleEffectiveSection } from './RuleEffectiveSection';
import { FoldSection } from './RuleFold';
import { RuleNotifySection } from './RuleNotifySection';
import { RuleProcessSection } from './RuleProcessSection';
import { RuleQuerySection } from './RuleQuerySection';
import {
  buildSpec,
  configuredFolds,
  createValues,
  type FoldKey,
  foldOfField,
  type RuleFormValues,
  specToValues,
} from './ruleForm';
import { SimulateModal } from './SimulateModal';
import { useRuleOptions } from './useRuleOptions';

/**
 * 规则表单比其他表单抽屉（720）宽：一行要放三个时长输入，PromQL 与键值编辑器也需要横向空间。
 */
const DRAWER_WIDTH = 960;

export interface RuleDrawerProps {
  /** 编辑 / 查看的规则；为空即新建 */
  row?: MonitorRule | null;
  /** 新建时预选的分组（左侧树当前选中的） */
  defaultGroupId?: string;
  groups: readonly RuleGroup[];
  /** 全部数据源选项（页面取一次下传） */
  datasources: DatasourceOptionsState;
  /** 只读查看（对所在分组没有管理权限，或没有编辑权限） */
  readOnly?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const RuleDrawer: React.FC<RuleDrawerProps> = ({
  row,
  defaultGroupId,
  groups,
  datasources,
  readOnly,
  onClose,
  onSaved,
}) => {
  const t = useT();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const formRef = useRef<ProFormInstance<RuleFormValues> | undefined>(
    undefined,
  );
  const [saved, setSaved] = useState<MonitorRule | null>(row ?? null);
  // 加载时的规则内容（已归一化）：保存时用它决定未显示项的取值
  const [loaded, setLoaded] = useState<NormalizedRuleSpec>();
  const has = usePermissions();
  // 只读查看不请求候选（该接口随新建 / 编辑权限开放）：已选项靠详情返回的显示名回显
  const ruleOptions = useRuleOptions(!readOnly);
  const [folds, setFolds] = useState<Record<FoldKey, boolean>>({
    ci: false,
    process: false,
    actions: false,
  });
  // 模拟触发：按表单当前（未保存）内容组装出的规则
  const [simulating, setSimulating] = useState<RuleSpec | null>(null);

  /** 表单存储里的全量值：含没渲染出来的项（收起的节、按条件隐藏的项） */
  const allValues = () =>
    formRef.current?.getFieldsValue(true) as RuleFormValues;
  const setFold = (key: FoldKey) => (open: boolean) =>
    setFolds((current) => ({ ...current, [key]: open }));
  /** 校验不通过的项在收起的节里：展开它，否则看不到错误提示 */
  const revealErrors = (errorFields?: { name: (string | number)[] }[]) => {
    const keys = (errorFields ?? [])
      .map((field) => foldOfField(String(field.name[0])))
      .filter((key): key is FoldKey => key !== undefined);
    if (keys.length === 0) return;
    setFolds((current) => ({
      ...current,
      ...Object.fromEntries(keys.map((key) => [key, true])),
    }));
  };
  const simulate = async () => {
    try {
      await formRef.current?.validateFields();
    } catch (error) {
      revealErrors(
        (error as { errorFields?: { name: string[] }[] }).errorFields,
      );
      return;
    }
    setSimulating(buildSpec(allValues(), loaded));
  };

  const kvRule = (
    max: number,
    valueMax: number,
    messageId: string,
    forbidKeyPrefix?: string,
  ) => ({
    validator: (_: unknown, value?: KeyValue[]) =>
      (value ?? []).length <= max &&
      validateKeyValues(value, {
        keyPattern: LABEL_NAME_REGEX,
        keyMax: 128,
        valueMax,
        valueRequired: true,
        forbidKeyPrefix,
      })
        ? Promise.resolve()
        : Promise.reject(new Error(t(messageId))),
  });

  const baseSubmitter = row ? submitter.save : submitter.create;

  return (
    <>
      <DrawerForm<RuleFormValues>
        title={
          row
            ? t(
                readOnly
                  ? 'pages.monitor.rule.view.title'
                  : 'pages.monitor.rule.edit.title',
                { name: row.spec.name },
              )
            : t('pages.monitor.rule.create.title')
        }
        width={DRAWER_WIDTH}
        grid
        rowProps={{ gutter: 16 }}
        open
        formRef={formRef}
        disabled={readOnly}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        drawerProps={{ destroyOnHidden: true }}
        request={async () => {
          if (!row) return createValues(defaultGroupId);
          const { rule } = await getRule(row.id);
          const spec = normalizeRuleSpec(rule.spec);
          setSaved(rule);
          setLoaded(spec);
          setFolds(configuredFolds(spec));
          return specToValues(spec) as RuleFormValues;
        }}
        submitter={
          readOnly
            ? false
            : {
                ...baseSubmitter,
                // 「模拟触发」放在「取消」与「保存」之间
                render: (_, dom) =>
                  has('monitor.rule.simulate')
                    ? [
                        dom[0],
                        <Button key="simulate" onClick={() => void simulate()}>
                          {t('pages.monitor.rule.form.simulate')}
                        </Button>,
                        ...dom.slice(1),
                      ]
                    : dom,
              }
        }
        onFinishFailed={(info) => revealErrors(info.errorFields)}
        onFinish={async () => {
          const values = allValues();
          const spec = buildSpec(values, loaded);
          if (row) {
            await updateRule(row.id, {
              spec,
              version: saved?.version ?? row.version,
              summary: values.summary?.trim() || undefined,
            });
            message.success(t('common.msg.saved'));
          } else {
            await createRule(spec);
            message.success(t('common.msg.created'));
          }
          onSaved();
          return true;
        }}
      >
        {/* ---------- 基本信息 ---------- */}
        <Col span={24}>
          <SectionTitle>{t('pages.monitor.rule.section.basic')}</SectionTitle>
        </Col>
        <ProFormText
          name="name"
          label={t('pages.monitor.rule.column.name')}
          colProps={HALF}
          rules={[
            rules.required(t('pages.monitor.rule.column.name')),
            rules.max(MONITOR_LIMITS.nameMax),
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
                saved?.groupName
                  ? [{ id: saved.spec.groupId, name: saved.groupName }]
                  : undefined
              }
              placeholder={t('pages.monitor.common.group.placeholder')}
            />
          </Form.Item>
        </Col>
        <ProFormTextArea
          name="description"
          label={t('pages.monitor.common.description')}
          colProps={FULL}
          fieldProps={{
            rows: 2,
            maxLength: MONITOR_LIMITS.ruleDescMax,
            showCount: true,
          }}
        />
        <Col span={24}>
          <Form.Item
            name="labels"
            label={t('pages.monitor.rule.form.labels')}
            tooltip={t('pages.monitor.rule.form.labels.tooltip')}
            extra={row ? t('pages.monitor.rule.form.labels.refire') : undefined}
            rules={[
              kvRule(
                MONITOR_LIMITS.ruleLabelMax,
                MONITOR_LIMITS.labelValueMax,
                'pages.monitor.rule.form.labels.rule',
                '__',
              ),
            ]}
          >
            <KeyValueEditor
              max={MONITOR_LIMITS.ruleLabelMax}
              keyPlaceholder="team"
              valuePlaceholder="infra"
              addText={t('pages.monitor.rule.form.labels.add')}
            />
          </Form.Item>
        </Col>
        <ProFormSwitch
          name="enabled"
          label={t('common.column.enabled')}
          colProps={HALF}
        />

        <RuleQuerySection
          datasources={datasources}
          savedDatasources={saved?.datasources}
          editing={!!row}
          readOnly={readOnly}
        />

        {/* ---------- 生效范围 ---------- */}
        <Col span={24}>
          <RuleEffectiveSection />

          {/* ---------- 事件内容 ---------- */}
          <SectionTitle>{t('pages.monitor.rule.section.content')}</SectionTitle>
          <Form.Item
            name="annotations"
            label={t('pages.monitor.rule.form.annotations')}
            tooltip={t('pages.monitor.rule.form.annotations.tooltip')}
            extra={t('pages.monitor.rule.form.annotations.hint')}
            rules={[
              kvRule(
                MONITOR_LIMITS.annotationMax,
                MONITOR_LIMITS.annotationValueMax,
                'pages.monitor.rule.form.annotations.rule',
              ),
            ]}
          >
            <KeyValueEditor
              multiline
              max={MONITOR_LIMITS.annotationMax}
              keyPlaceholder="summary"
              valuePlaceholder={
                '{{ $labels.instance }} CPU {{ printf "%.1f" $value }}%'
              }
              addText={t('pages.monitor.rule.form.annotations.add')}
            />
          </Form.Item>
        </Col>
        <ProFormTextArea
          name="recoveryExpr"
          label={t('pages.monitor.rule.form.recoveryExpr')}
          tooltip={t('pages.monitor.rule.form.recoveryExpr.tooltip')}
          colProps={FULL}
          fieldProps={{
            autoSize: { minRows: 1, maxRows: 6 },
            maxLength: MONITOR_LIMITS.exprMax,
            style: { fontFamily: token.fontFamilyCode },
          }}
          placeholder={'cpu_usage{instance="{{ $labels.instance }}"}'}
        />

        <FoldSection
          foldKey="ci"
          title={t('pages.monitor.rule.section.ci')}
          summary={t('pages.monitor.rule.section.ci.summary')}
          open={folds.ci}
          onOpenChange={setFold('ci')}
        >
          <RuleCmdbSection options={ruleOptions} />
        </FoldSection>
        <FoldSection
          foldKey="process"
          title={t('pages.monitor.rule.section.process')}
          summary={t('pages.monitor.rule.section.process.summary')}
          open={folds.process}
          onOpenChange={setFold('process')}
        >
          <RuleProcessSection editing={!!row} />
        </FoldSection>

        <RuleNotifySection rule={saved} readOnly={readOnly} />

        <FoldSection
          foldKey="actions"
          title={t('pages.monitor.rule.section.actions')}
          summary={t('pages.monitor.rule.section.actions.summary')}
          open={folds.actions}
          onOpenChange={setFold('actions')}
        >
          <RuleActionsSection options={ruleOptions} rule={saved} />
        </FoldSection>
        {row && !readOnly && (
          <ProFormText
            name="summary"
            label={t('pages.monitor.rule.form.summary')}
            tooltip={t('pages.monitor.rule.form.summary.tooltip')}
            colProps={FULL}
            rules={[rules.max(MONITOR_LIMITS.summaryMax)]}
          />
        )}
      </DrawerForm>
      {simulating && (
        <SimulateModal
          spec={simulating}
          ruleId={row?.id}
          datasources={datasources}
          onClose={() => setSimulating(null)}
        />
      )}
    </>
  );
};

export default RuleDrawer;
