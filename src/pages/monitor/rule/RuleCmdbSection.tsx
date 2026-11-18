/**
 * 规则表单「关联资源（CMDB）」一节：事件如何关联 CMDB 资源（全局缺省 / 自定义 / 不关联）、富化标签、
 * 仅对指定资源生效、拓扑抑制、通知资源负责人。作为 FoldSection 的内容使用（外层已是栅格行）。
 */
import { Alert, Col, Form, Input, Radio, Select, Switch } from 'antd';
import type React from 'react';
import { useFormRules, useT } from '@/utils/i18n';
import { LABEL_NAME_REGEX } from '../components/meta';
import type { CiMatchMode, RuleFormValues } from './ruleForm';
import {
  byteLength,
  CandidatesFailedAlert,
  type RuleOptionsState,
} from './useRuleOptions';

/** 后端的上限（rule.proto 的 buf.validate） */
const LIMITS = {
  labelMax: 128,
  modelMax: 20,
  enrichTagMax: 10,
  scopeItemMax: 20,
  itemBytesMax: 64,
} as const;

const MODES: readonly CiMatchMode[] = ['default', 'custom', 'off'];

export const RuleCmdbSection: React.FC<{
  options: RuleOptionsState;
}> = ({ options }) => {
  const t = useT();
  const rules = useFormRules();
  const form = Form.useFormInstance<RuleFormValues>();
  const mode = Form.useWatch('ciMode', form);
  const by = Form.useWatch('ciBy', form);
  const scopeEnabled = Form.useWatch('scopeEnabled', form);
  const off = mode === 'off';
  // 显式的 disabled={false} 会盖过表单整体的只读状态：只在需要禁用时才给值
  const offDisabled = off || undefined;

  const modelOptions = (options.data.ciModels ?? []).map((model) => ({
    value: model.code,
    label: model.name ? `${model.name} (${model.code})` : model.code,
  }));
  const envOptions = (options.data.ciEnvs ?? []).map((env) => ({
    value: env,
    label: env,
  }));
  const attrOptions = (options.data.ciMatchAttrs ?? []).map((attr) => ({
    value: attr,
    label: attr,
  }));

  /** 列表项：个数不超限，每项非空且不超过 64 字节 */
  const itemsRule = (max: number) => ({
    validator: (_: unknown, value?: string[]) =>
      (value ?? []).length <= max &&
      (value ?? []).every(
        (item) => item.trim() !== '' && byteLength(item) <= LIMITS.itemBytesMax,
      )
        ? Promise.resolve()
        : Promise.reject(
            new Error(
              t('pages.monitor.rule.ci.items.rule', {
                max,
                bytes: LIMITS.itemBytesMax,
              }),
            ),
          ),
  });
  /** 自由输入的资源标签（标签里可以有空格，只按逗号拆分） */
  const tagsSelect = (max: number, disabled?: boolean) => (
    <Select
      mode="tags"
      open={false}
      suffix={null}
      maxCount={max}
      tokenSeparators={[',', '，']}
      disabled={disabled}
      placeholder={t('pages.monitor.rule.ci.tags.placeholder')}
    />
  );

  return (
    <>
      <Col span={24}>
        <CandidatesFailedAlert
          state={options}
          title={t('pages.monitor.rule.options.failed')}
        />
        <Form.Item
          name="ciMode"
          label={t('pages.monitor.rule.ci.mode')}
          tooltip={t('pages.monitor.rule.ci.mode.tooltip')}
          extra={
            mode && !off ? t(`pages.monitor.rule.ci.mode.${mode}.hint`) : null
          }
        >
          <Radio.Group
            // 第一次切到「自定义」时先选中「资源名称」（之前没有可沿用的取值）
            onChange={(e) => {
              if (e.target.value === 'custom' && !form.getFieldValue('ciBy')) {
                form.setFieldValue('ciBy', 'name');
              }
            }}
            options={MODES.map((value) => ({
              value,
              label: t(`pages.monitor.rule.ci.mode.${value}`),
            }))}
          />
        </Form.Item>
        {off && (
          <Alert
            type="warning"
            showIcon
            title={t('pages.monitor.rule.ci.mode.off.hint')}
            description={
              scopeEnabled ? t('pages.monitor.rule.ci.mode.off.scope') : null
            }
            style={{ marginBottom: 24 }}
          />
        )}
      </Col>
      {mode === 'custom' && (
        <>
          <Col span={8}>
            <Form.Item
              name="ciLabel"
              label={t('pages.monitor.rule.ci.label')}
              tooltip={t('pages.monitor.rule.ci.label.tooltip')}
              rules={[
                rules.required(t('pages.monitor.rule.ci.label')),
                rules.max(LIMITS.labelMax),
                {
                  pattern: LABEL_NAME_REGEX,
                  message: t('pages.monitor.rule.ci.label.rule'),
                },
              ]}
            >
              <Input placeholder="instance" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="ciBy"
              label={t('pages.monitor.rule.ci.by')}
              rules={[rules.select(t('pages.monitor.rule.ci.by'))]}
            >
              <Radio.Group
                options={[
                  { value: 'name', label: t('pages.monitor.rule.ci.by.name') },
                  { value: 'attr', label: t('pages.monitor.rule.ci.by.attr') },
                ]}
              />
            </Form.Item>
          </Col>
          {by === 'attr' && (
            <Col span={8}>
              <Form.Item
                name="ciAttr"
                label={t('pages.monitor.rule.ci.attr')}
                tooltip={t('pages.monitor.rule.ci.attr.tooltip')}
              >
                <Select
                  allowClear
                  options={attrOptions}
                  placeholder={t('pages.monitor.rule.ci.attr.placeholder')}
                />
              </Form.Item>
            </Col>
          )}
        </>
      )}
      {!off && (
        <Col span={24}>
          <Form.Item
            name="ciModelCodes"
            label={t('pages.monitor.rule.ci.models')}
            extra={t('pages.monitor.rule.ci.models.hint')}
            rules={[itemsRule(LIMITS.modelMax)]}
          >
            <Select
              mode="multiple"
              maxCount={LIMITS.modelMax}
              showSearch={{ optionFilterProp: 'label' }}
              options={modelOptions}
              placeholder={t('pages.monitor.common.unlimitedIfEmpty')}
            />
          </Form.Item>
        </Col>
      )}
      <Col span={24}>
        <Form.Item
          name="ciEnrichTags"
          label={t('pages.monitor.rule.ci.enrichTags')}
          tooltip={t('pages.monitor.rule.ci.enrichTags.tooltip')}
          extra={t('pages.monitor.rule.ci.enrichTags.hint')}
          rules={[itemsRule(LIMITS.enrichTagMax)]}
        >
          {tagsSelect(LIMITS.enrichTagMax, offDisabled)}
        </Form.Item>
        <Form.Item
          name="scopeEnabled"
          label={t('pages.monitor.rule.ci.scope')}
          valuePropName="checked"
          extra={t('pages.monitor.rule.ci.scope.hint')}
        >
          <Switch />
        </Form.Item>
      </Col>
      {scopeEnabled && (
        <>
          <Col span={8}>
            <Form.Item
              name="scopeModelCodes"
              label={t('pages.monitor.rule.ci.scope.models')}
              rules={[itemsRule(LIMITS.scopeItemMax)]}
            >
              <Select
                mode="multiple"
                maxCount={LIMITS.scopeItemMax}
                showSearch={{ optionFilterProp: 'label' }}
                options={modelOptions}
                placeholder={t('pages.monitor.common.unlimitedIfEmpty')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="scopeEnvs"
              label={t('pages.monitor.rule.ci.scope.envs')}
              rules={[itemsRule(LIMITS.scopeItemMax)]}
            >
              <Select
                mode="multiple"
                maxCount={LIMITS.scopeItemMax}
                options={envOptions}
                placeholder={t('pages.monitor.common.unlimitedIfEmpty')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="scopeTags"
              label={t('pages.monitor.rule.ci.scope.tags')}
              tooltip={t('pages.monitor.rule.ci.scope.tags.tooltip')}
              rules={[itemsRule(LIMITS.scopeItemMax)]}
            >
              {tagsSelect(LIMITS.scopeItemMax)}
            </Form.Item>
          </Col>
        </>
      )}
      <Col span={12}>
        <Form.Item
          name="topologyInhibit"
          label={t('pages.monitor.rule.ci.topology')}
          valuePropName="checked"
          extra={t('pages.monitor.rule.ci.topology.hint')}
        >
          <Switch disabled={offDisabled} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="ciOwner"
          label={t('pages.monitor.rule.ci.owner')}
          valuePropName="checked"
          extra={t('pages.monitor.rule.ci.owner.hint')}
        >
          <Switch disabled={offDisabled} />
        </Form.Item>
      </Col>
    </>
  );
};

export default RuleCmdbSection;
