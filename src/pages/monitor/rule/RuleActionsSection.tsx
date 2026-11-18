/**
 * 规则表单「事件动作」一节：触发时自动建单、触发流程、AI 摘要；每个事件每种动作至多执行一次。
 * 候选（工单模板 / 流程）来自规则配置候选接口，已保存的引用靠规则详情返回的显示名回显。
 * 作为 FoldSection 的内容使用（外层已是栅格行）。
 */
import { Alert, Col, Form, Select, Switch } from 'antd';
import type React from 'react';
import { UserSelect } from '@/components/UserSelect';
import { fetchMonitorUsers } from '@/components/UserSelect/sources';
import type { MonitorRule } from '@/services/monitor/typings';
import { useFormRules, useT } from '@/utils/i18n';
import { refsToKnown, withRefOptions } from '../components/hooks';
import type { RuleFormValues } from './ruleForm';
import {
  CandidatesFailedAlert,
  type RuleOptionsState,
  refList,
} from './useRuleOptions';

/** 流程变量名（RuleWorkflowAction 的约定，不翻译） */
const WORKFLOW_VARIABLES =
  'alert_id, alert_url, rule_id, rule_name, group_name, datasource_name, severity, value, labels, annotations, first_fire_time, ci_id, ci_name';

export const RuleActionsSection: React.FC<{
  options: RuleOptionsState;
  /** 正在编辑 / 查看的规则（详情；用于回显模板、流程、代理用户的显示名） */
  rule: MonitorRule | null;
}> = ({ options, rule }) => {
  const t = useT();
  const rules = useFormRules();
  const form = Form.useFormInstance<RuleFormValues>();
  const ticketEnabled = Form.useWatch('ticketEnabled', form);
  const workflowEnabled = Form.useWatch('workflowEnabled', form);

  const templateOptions = withRefOptions(
    (options.data.ticketTemplates ?? []).map((template) => ({
      value: template.id,
      label: [template.categoryName, template.name || template.id]
        .filter(Boolean)
        .join(' / '),
    })),
    refList(rule?.ticketTemplate),
    t,
  );
  const workflowOptions = withRefOptions(
    (options.data.workflows ?? []).map((workflow) => ({
      value: workflow.key,
      label: workflow.name || workflow.key,
    })),
    refList(rule?.workflowDefinition),
    t,
  );

  return (
    <>
      <Col span={24}>
        <CandidatesFailedAlert
          state={options}
          title={t('pages.monitor.rule.options.failed')}
        />
        <Form.Item
          name="ticketEnabled"
          label={t('pages.monitor.rule.action.ticket')}
          valuePropName="checked"
          extra={t('pages.monitor.rule.action.ticket.hint')}
        >
          <Switch />
        </Form.Item>
      </Col>
      {ticketEnabled && (
        <>
          <Col span={12}>
            <Form.Item
              name="ticketTemplateId"
              label={t('pages.monitor.rule.action.ticket.template')}
              rules={[
                rules.select(t('pages.monitor.rule.action.ticket.template')),
              ]}
            >
              <Select
                showSearch={{ optionFilterProp: 'label' }}
                options={templateOptions}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="ticketAgentUserId"
              label={t('pages.monitor.rule.action.ticket.agent')}
              tooltip={t('pages.monitor.rule.action.ticket.agent.tooltip')}
              rules={[
                rules.select(t('pages.monitor.rule.action.ticket.agent')),
              ]}
            >
              <UserSelect
                fetchUsers={fetchMonitorUsers}
                knownUsers={refsToKnown(refList(rule?.ticketAgent))}
                placeholder={t('pages.monitor.common.users.placeholder')}
              />
            </Form.Item>
          </Col>
        </>
      )}
      <Col span={24}>
        <Form.Item
          name="workflowEnabled"
          label={t('pages.monitor.rule.action.workflow')}
          valuePropName="checked"
          tooltip={t('pages.monitor.rule.action.workflow.tooltip', {
            variables: WORKFLOW_VARIABLES,
          })}
          extra={t('pages.monitor.rule.action.workflow.hint')}
        >
          <Switch />
        </Form.Item>
      </Col>
      {workflowEnabled && (
        <>
          <Col span={12}>
            <Form.Item
              name="workflowDefinitionKey"
              label={t('pages.monitor.rule.action.workflow.definition')}
              tooltip={t(
                'pages.monitor.rule.action.workflow.definition.tooltip',
              )}
              rules={[
                rules.select(
                  t('pages.monitor.rule.action.workflow.definition'),
                ),
              ]}
            >
              <Select
                showSearch={{ optionFilterProp: 'label' }}
                options={workflowOptions}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="workflowAgentUserId"
              label={t('pages.monitor.rule.action.workflow.agent')}
              rules={[
                rules.select(t('pages.monitor.rule.action.workflow.agent')),
              ]}
            >
              <UserSelect
                fetchUsers={fetchMonitorUsers}
                knownUsers={refsToKnown(refList(rule?.workflowAgent))}
                placeholder={t('pages.monitor.common.users.placeholder')}
              />
            </Form.Item>
          </Col>
        </>
      )}
      <Col span={24}>
        <Form.Item
          name="aiSummary"
          label={t('pages.monitor.rule.action.ai')}
          valuePropName="checked"
          extra={t('pages.monitor.rule.action.ai.hint')}
        >
          <Switch />
        </Form.Item>
        {/* 候选取到了才能断言「未配置」：零值被省略的编码下 aiAvailable 缺失即 false */}
        {options.loaded && !options.data.aiAvailable && (
          <Alert
            type="warning"
            showIcon
            title={t('pages.monitor.rule.action.ai.unavailable')}
          />
        )}
      </Col>
    </>
  );
};

export default RuleActionsSection;
