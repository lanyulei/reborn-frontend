/**
 * 规则表单「事件处理」一节：事件标签改写（在计算事件指纹之前按顺序执行）与条件丢弃表达式。
 * 作为 FoldSection 的内容使用（外层已是栅格行）。
 */
import { Alert, Col, Form, Input } from 'antd';
import type React from 'react';
import { useT } from '@/utils/i18n';
import { useMonitorStyles } from '../components/styles';
import { RelabelEditor, validateRelabel } from './RelabelEditor';
import type { RelabelRow } from './ruleForm';
import { byteLength } from './useRuleOptions';

const DROP_EXPR_BYTES_MAX = 2048;

export const RuleProcessSection: React.FC<{
  /** 是否在编辑已有规则（显示「改写步骤变了，活跃告警会按新指纹重新产生」的警示） */
  editing: boolean;
}> = ({ editing }) => {
  const t = useT();
  const { styles } = useMonitorStyles();

  return (
    <Col span={24}>
      {editing && (
        <Alert
          type="warning"
          showIcon
          title={t('pages.monitor.rule.relabel.refire')}
          style={{ marginBottom: 16 }}
        />
      )}
      <Form.Item
        name="relabel"
        label={t('pages.monitor.rule.relabel')}
        tooltip={t('pages.monitor.rule.relabel.tooltip')}
        extra={t('pages.monitor.rule.relabel.hint')}
        rules={[
          {
            validator: (_: unknown, value?: RelabelRow[]) => {
              const error = validateRelabel(value);
              return error
                ? Promise.reject(
                    new Error(
                      t(`pages.monitor.rule.relabel.error.${error.code}`, {
                        n: error.index + 1,
                      }),
                    ),
                  )
                : Promise.resolve();
            },
          },
        ]}
      >
        <RelabelEditor />
      </Form.Item>
      <Form.Item
        name="dropExpr"
        label={t('pages.monitor.rule.dropExpr')}
        tooltip={t('pages.monitor.rule.dropExpr.tooltip')}
        extra={t('pages.monitor.rule.dropExpr.hint')}
        rules={[
          {
            validator: (_: unknown, value?: string) =>
              byteLength(value ?? '') <= DROP_EXPR_BYTES_MAX
                ? Promise.resolve()
                : Promise.reject(
                    new Error(
                      t('pages.monitor.rule.dropExpr.rule', {
                        max: DROP_EXPR_BYTES_MAX,
                      }),
                    ),
                  ),
          },
        ]}
      >
        <Input.TextArea
          className={styles.codeInput}
          autoSize={{ minRows: 1, maxRows: 6 }}
          placeholder={'{{ if eq $labels.ci_env "dev" }}true{{ end }}'}
        />
      </Form.Item>
    </Col>
  );
};

export default RuleProcessSection;
