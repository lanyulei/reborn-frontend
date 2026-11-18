/**
 * 规则表单「数据源与查询」一节：数据源范围与所选数据源、查询与级别（含校验 / 数据预览）、
 * 级别抑制、执行频率与三个时长。作为 RuleDrawer（栅格 ProForm）的直接子节点使用。
 */
import {
  ProFormDependency,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components';
import { Alert, Col, Form } from 'antd';
import type React from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { FULL } from '@/constants/layout';
import type { NamedRef, RuleQuery } from '@/services/monitor/typings';
import { useFormRules, useOptions, useT } from '@/utils/i18n';
import {
  type DatasourceOptionsState,
  withRefOptions,
} from '../components/hooks';
import {
  DATASOURCE_SCOPE_META,
  DATASOURCE_SCOPE_ORDER,
  MONITOR_LIMITS,
} from '../components/meta';
import { QueriesEditor, validateQueries } from './QueriesEditor';

const THIRD = { span: 8 } as const;

export const RuleQuerySection: React.FC<{
  /** 全部数据源（已停用的带标注，供回显） */
  datasources: DatasourceOptionsState;
  /** 规则当前引用的数据源（详情返回；其中已删除的补进选项用于回显） */
  savedDatasources?: readonly NamedRef[];
  /** 是否在编辑已有规则（显示「修改会使活跃告警先恢复再触发」的提示） */
  editing: boolean;
  readOnly?: boolean;
}> = ({ datasources, savedDatasources, editing, readOnly }) => {
  const t = useT();
  const rules = useFormRules();
  const scopeOptions = useOptions(
    DATASOURCE_SCOPE_META,
    DATASOURCE_SCOPE_ORDER,
  );
  // 全局范围实际生效的是其中已启用的
  const enabledDatasources = datasources.items.filter((item) => item.enabled);
  const datasourceOptions = withRefOptions(
    datasources.options,
    savedDatasources,
    t,
  );

  return (
    <>
      <Col span={24}>
        <SectionTitle>{t('pages.monitor.rule.section.query')}</SectionTitle>
      </Col>
      <ProFormRadio.Group
        name="datasourceScope"
        label={t('pages.monitor.rule.form.datasourceScope')}
        colProps={FULL}
        options={scopeOptions}
        rules={[rules.select(t('pages.monitor.rule.form.datasourceScope'))]}
      />
      <ProFormDependency name={['datasourceScope']}>
        {({ datasourceScope }) =>
          datasourceScope === 2 ? (
            <Col span={24}>
              <Alert
                type="info"
                showIcon
                title={t('pages.monitor.rule.form.datasourceScope.allHint', {
                  count: enabledDatasources.length,
                })}
                style={{ marginBottom: 16 }}
              />
            </Col>
          ) : (
            <ProFormSelect
              name="datasourceIds"
              label={t('pages.monitor.common.datasources')}
              colProps={FULL}
              options={datasourceOptions}
              fieldProps={{
                mode: 'multiple',
                maxCount: MONITOR_LIMITS.ruleDatasourceMax,
                showSearch: { optionFilterProp: 'label' },
              }}
              extra={t('pages.monitor.rule.form.datasourceScope.eachHint')}
              rules={[
                {
                  required: true,
                  type: 'array',
                  message: t('common.validation.select', {
                    label: t('pages.monitor.common.datasources'),
                  }),
                },
              ]}
            />
          )
        }
      </ProFormDependency>
      <ProFormDependency name={['datasourceScope', 'datasourceIds']}>
        {({ datasourceScope, datasourceIds }) => (
          <Col span={24}>
            <Form.Item
              name="queries"
              label={t('pages.monitor.rule.form.queries')}
              tooltip={t('pages.monitor.rule.form.queries.tooltip')}
              required
              rules={[
                {
                  validator: (_: unknown, value?: RuleQuery[]) =>
                    validateQueries(value)
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error(t('pages.monitor.rule.form.queries.rule')),
                        ),
                },
              ]}
            >
              <QueriesEditor
                readOnly={readOnly}
                datasourceOptions={
                  datasourceScope === 2
                    ? enabledDatasources.map((item) => ({
                        value: item.id,
                        label: item.name,
                      }))
                    : datasources.options.filter((option) =>
                        ((datasourceIds as string[]) ?? []).includes(
                          option.value,
                        ),
                      )
                }
              />
            </Form.Item>
          </Col>
        )}
      </ProFormDependency>
      <ProFormDependency name={['queries']}>
        {({ queries }) =>
          ((queries as RuleQuery[]) ?? []).length > 1 ? (
            <ProFormSwitch
              name="levelInhibit"
              label={t('pages.monitor.rule.form.levelInhibit')}
              tooltip={t('pages.monitor.rule.form.levelInhibit.tooltip')}
              extra={
                editing
                  ? t('pages.monitor.rule.form.levelInhibit.refire')
                  : undefined
              }
              colProps={FULL}
            />
          ) : null
        }
      </ProFormDependency>
      <ProFormDigit
        name="evalIntervalS"
        label={t('pages.monitor.rule.form.evalInterval')}
        tooltip={t('pages.monitor.rule.form.evalInterval.tooltip')}
        colProps={THIRD}
        min={MONITOR_LIMITS.evalInterval.min}
        max={MONITOR_LIMITS.evalInterval.max}
        fieldProps={{ precision: 0, suffix: t('pages.monitor.unit.second') }}
        rules={[rules.required(t('pages.monitor.rule.form.evalInterval'))]}
      />
      <ProFormDigit
        name="forS"
        label={t('pages.monitor.rule.form.for')}
        tooltip={t('pages.monitor.rule.form.for.tooltip')}
        colProps={THIRD}
        min={MONITOR_LIMITS.holdSeconds.min}
        max={MONITOR_LIMITS.holdSeconds.max}
        fieldProps={{ precision: 0, suffix: t('pages.monitor.unit.second') }}
        rules={[rules.required(t('pages.monitor.rule.form.for'))]}
      />
      <ProFormDigit
        name="recoverS"
        label={t('pages.monitor.rule.form.recover')}
        tooltip={t('pages.monitor.rule.form.recover.tooltip')}
        colProps={THIRD}
        min={MONITOR_LIMITS.holdSeconds.min}
        max={MONITOR_LIMITS.holdSeconds.max}
        fieldProps={{ precision: 0, suffix: t('pages.monitor.unit.second') }}
        rules={[rules.required(t('pages.monitor.rule.form.recover'))]}
      />
      <ProFormDigit
        name="nodataKeepS"
        label={t('pages.monitor.rule.form.nodataKeep')}
        tooltip={t('pages.monitor.rule.form.nodataKeep.tooltip')}
        colProps={THIRD}
        min={MONITOR_LIMITS.holdSeconds.min}
        max={MONITOR_LIMITS.holdSeconds.max}
        fieldProps={{ precision: 0, suffix: t('pages.monitor.unit.second') }}
        rules={[rules.required(t('pages.monitor.rule.form.nodataKeep'))]}
      />
    </>
  );
};

export default RuleQuerySection;
