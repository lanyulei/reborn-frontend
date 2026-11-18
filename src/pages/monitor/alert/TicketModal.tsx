/**
 * 转工单：选工单模板，标题与优先级按事件预填，事件关联的资源由后端自动带入工单。
 * 监控告警域的候选接口不返回模板的表单字段定义，这里无法渲染模板表单，因此不提交表单数据（data）。
 * 幂等键在弹窗打开时生成一次：同一弹窗内重试（网络超时后再点）不会建出两张工单。
 */
import { Link, useAccess } from '@umijs/max';
import { Alert, Button, Form, Input, Modal, Select } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NOTIFY_SEVERITY_META } from '@/constants';
import {
  TICKET_PRIORITY_META,
  TICKET_PRIORITY_ORDER,
} from '@/pages/ticket/components/meta';
import { createAlertTicket } from '@/services/monitor/alert';
import {
  getErrorReason,
  getMonitorErrorMessage,
} from '@/services/monitor/request';
import { listRuleOptions } from '@/services/monitor/rule';
import type {
  AlertTicket,
  MonitorAlert,
  MonitorRuleOptions,
} from '@/services/monitor/typings';
import { useFormRules, useOptions, useT } from '@/utils/i18n';
import { randomUUID } from '@/utils/uuid';
import { ALERT_LIMITS, alertTitle } from './meta';

interface TicketFormValues {
  templateId?: string;
  title?: string;
  priority?: number;
}

/** 工单编号：能查看且有工单菜单时链接到工单详情 */
export const TicketLink: React.FC<{
  ticket: Pick<AlertTicket, 'id' | 'number' | 'canView'>;
}> = ({ ticket }) => {
  const access = useAccess();
  const text = ticket.number || ticket.id;
  return ticket.canView && access.canTicket ? (
    <Link to={`/ticket/detail/${ticket.id}`}>{text}</Link>
  ) : (
    <span>{text}</span>
  );
};

export const TicketModal: React.FC<{
  alert: MonitorAlert;
  onClose: () => void;
  /** 建单成功，或发现事件已有工单：刷新事件 */
  onChanged: () => void;
}> = ({ alert, onClose, onChanged }) => {
  const t = useT();
  const rules = useFormRules();
  const [form] = Form.useForm<TicketFormValues>();
  const priorityOptions = useOptions(
    TICKET_PRIORITY_META,
    TICKET_PRIORITY_ORDER,
  );
  const requestId = useRef(randomUUID());
  const [options, setOptions] = useState<MonitorRuleOptions>();
  const [optionsFailed, setOptionsFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  // 事件已有工单：不能再提交
  const [exists, setExists] = useState(false);
  const [ticket, setTicket] = useState<AlertTicket>();

  const loadOptions = useCallback(async () => {
    setLoading(true);
    try {
      setOptions(await listRuleOptions());
      setOptionsFailed(false);
    } catch {
      setOptionsFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const severity = alert.severity && NOTIFY_SEVERITY_META[alert.severity];
  const submit = async () => {
    const values = await form.validateFields().catch(() => undefined);
    if (!values) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const result = await createAlertTicket(alert.id, {
        templateId: values.templateId ?? '',
        title: values.title?.trim() ?? '',
        priority: values.priority,
        requestId: requestId.current,
      });
      setTicket(result.ticket);
      onChanged();
    } catch (e) {
      setError(getMonitorErrorMessage(e));
      if (getErrorReason(e) === 'MONITOR_ALERT_TICKET_EXISTS') {
        // 别人（或规则的自动建单）已经建了：刷新事件，详情里会显示那张工单
        setExists(true);
        onChanged();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const templates = options?.ticketTemplates ?? [];
  return (
    <Modal
      title={t('pages.monitor.alert.ticket.title')}
      open
      width={560}
      destroyOnHidden
      mask={{ closable: false }}
      confirmLoading={submitting}
      okText={t('pages.monitor.alert.ticket.ok')}
      okButtonProps={{ disabled: exists || loading || optionsFailed }}
      // 建单成功后只剩「关闭」
      footer={
        ticket ? (
          <Button onClick={onClose}>
            {t('pages.monitor.alert.dialog.close')}
          </Button>
        ) : undefined
      }
      onOk={() => void submit()}
      onCancel={onClose}
    >
      {ticket ? (
        <Alert
          type="success"
          showIcon
          title={t('pages.monitor.alert.ticket.done')}
          description={
            <>
              <TicketLink ticket={ticket} />
              {ticket.title ? ` · ${ticket.title}` : ''}
            </>
          }
        />
      ) : (
        <>
          {optionsFailed && (
            <Alert
              type="warning"
              showIcon
              title={t('pages.monitor.alert.ticket.optionsFailed')}
              action={
                <Button
                  size="small"
                  loading={loading}
                  onClick={() => void loadOptions()}
                >
                  {t('pages.monitor.retry')}
                </Button>
              }
              style={{ marginBottom: 16 }}
            />
          )}
          {error && (
            <Alert
              type="error"
              showIcon
              title={error}
              style={{ marginBottom: 16 }}
            />
          )}
          <Form<TicketFormValues>
            form={form}
            layout="vertical"
            initialValues={{
              // 与后端的缺省一致：【级别】规则名称；级别 1-4 对应优先级 低 / 普通 / 高 / 紧急
              title: t('pages.monitor.alert.ticket.titlePrefill', {
                severity: severity ? t(severity.textId) : '',
                name: alert.ruleName ?? '',
              }).slice(0, ALERT_LIMITS.ticketTitleMax),
              priority: alert.severity,
            }}
          >
            <Form.Item
              name="templateId"
              label={t('pages.monitor.alert.ticket.template')}
              rules={[rules.select(t('pages.monitor.alert.ticket.template'))]}
              extra={t('pages.monitor.alert.ticket.template.extra')}
            >
              <Select
                loading={loading}
                showSearch={{ optionFilterProp: 'label' }}
                placeholder={t(
                  'pages.monitor.alert.ticket.template.placeholder',
                )}
                notFoundContent={
                  loading
                    ? undefined
                    : t('pages.monitor.alert.ticket.noTemplate')
                }
                options={templates.map((template) => ({
                  value: template.id,
                  label: template.categoryName
                    ? `${template.categoryName} / ${template.name || template.id}`
                    : template.name || template.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="title"
              label={t('pages.monitor.alert.ticket.titleField')}
              rules={[
                {
                  ...rules.required(t('pages.monitor.alert.ticket.titleField')),
                  whitespace: true,
                },
                rules.maxChars(ALERT_LIMITS.ticketTitleMax),
              ]}
            >
              <Input maxLength={ALERT_LIMITS.ticketTitleMax} />
            </Form.Item>
            <Form.Item
              name="priority"
              label={t('pages.monitor.alert.ticket.priority')}
              rules={[rules.select(t('pages.monitor.alert.ticket.priority'))]}
            >
              <Select options={priorityOptions} />
            </Form.Item>
            <Form.Item label={t('pages.monitor.alert.ticket.alert')}>
              <span>{alertTitle(alert)}</span>
            </Form.Item>
            <Form.Item
              label={t('pages.monitor.alert.ci.title')}
              extra={
                alert.ciId
                  ? t('pages.monitor.alert.ticket.ci.extra')
                  : undefined
              }
              style={{ marginBottom: 0 }}
            >
              <span>
                {alert.ciId
                  ? alert.ciName || alert.ciId
                  : t('pages.monitor.alert.ticket.ci.none')}
              </span>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default TicketModal;
