/**
 * 规则表单「生效范围」一节的生效时间：先选生效方式——按时间窗（时区 + 多段「星期 + 起止时刻」），
 * 或按流程中心的工作日历（仅工作时间 / 仅非工作时间）。按日历时不显示时间窗编辑器，已填的时间窗
 * 留在表单里（切回来不丢）但不提交。放在 RuleDrawer 的整行列里使用。
 */
import { Alert, Form, Radio } from 'antd';
import type React from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import type { EffectiveTime } from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import {
  TimeWindowsEditor,
  validateEffectiveTime,
} from '../components/TimeWindowsEditor';
import type { EffectiveChoice, RuleFormValues } from './ruleForm';

const CHOICES: readonly EffectiveChoice[] = [
  'windows',
  'work_time',
  'off_time',
];

export const RuleEffectiveSection: React.FC = () => {
  const t = useT();
  const form = Form.useFormInstance<RuleFormValues>();
  const mode = Form.useWatch('effectiveMode', form);

  return (
    <>
      <SectionTitle>{t('pages.monitor.rule.section.effective')}</SectionTitle>
      <Form.Item
        name="effectiveMode"
        label={t('pages.monitor.rule.form.effectiveMode')}
      >
        <Radio.Group
          options={CHOICES.map((value) => ({
            value,
            label: t(`pages.monitor.rule.form.effectiveMode.${value}`),
          }))}
        />
      </Form.Item>
      {mode === 'work_time' || mode === 'off_time' ? (
        <Alert
          type="info"
          showIcon
          title={t('pages.monitor.rule.form.effectiveMode.calendarHint')}
          style={{ marginBottom: 24 }}
        />
      ) : (
        <Form.Item
          name="effective"
          label={t('pages.monitor.rule.form.effective')}
          tooltip={t('pages.monitor.rule.form.effective.tooltip')}
          rules={[
            {
              validator: (_: unknown, value?: EffectiveTime) =>
                validateEffectiveTime(value)
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(t('pages.monitor.window.invalid')),
                    ),
            },
          ]}
        >
          <TimeWindowsEditor
            emptyHint={t('pages.monitor.rule.form.effective.always')}
          />
        </Form.Item>
      )}
    </>
  );
};

export default RuleEffectiveSection;
