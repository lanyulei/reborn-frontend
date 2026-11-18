/**
 * 批量认领 / 批量手动关闭（活跃告警列表多选，至多 200 条）：逐条独立执行，结果逐条列出。
 * 批量关闭与单条一样只是「已受理」，由评估引擎随后执行。
 */
import { Alert, Form, Input, Modal, Table } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { batchAckAlerts, batchCloseAlerts } from '@/services/monitor/alert';
import { monitorReasonText } from '@/services/monitor/request';
import type {
  AlertActionResult,
  BatchAlertsResult,
  MonitorAlert,
} from '@/services/monitor/typings';
import { useFormRules, useT } from '@/utils/i18n';
import { ALERT_LIMITS, alertTitle } from './meta';

export type AlertBatchAction = 'ack' | 'close';

export const AlertBatchModal: React.FC<{
  action: AlertBatchAction;
  /** 当前用户可以执行该操作的事件 */
  alerts: readonly MonitorAlert[];
  /** 选中但无权执行、已被跳过的条数 */
  skipped: number;
  onClose: () => void;
  /** 执行过（无论成败）后关闭时调用：刷新列表并清空勾选 */
  onDone: () => void;
}> = ({ action, alerts, skipped, onClose, onDone }) => {
  const t = useT();
  const rules = useFormRules();
  const [form] = Form.useForm<{ reason?: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BatchAlertsResult | null>(null);

  const close = () => {
    if (result) onDone();
    onClose();
  };

  const submit = async () => {
    const values = await form.validateFields().catch(() => undefined);
    if (!values) return;
    const ids = alerts.map((alert) => alert.id);
    setSubmitting(true);
    try {
      setResult(
        action === 'ack'
          ? await batchAckAlerts(ids)
          : await batchCloseAlerts(ids, values.reason?.trim() ?? ''),
      );
    } catch {
      // 已由请求层提示
    } finally {
      setSubmitting(false);
    }
  };

  const titleOf = (id: string) => {
    const alert = alerts.find((item) => item.id === id);
    return alert ? alertTitle(alert) : id;
  };

  return (
    <Modal
      title={
        action === 'ack'
          ? t('pages.monitor.alert.batch.ack')
          : t('pages.monitor.alert.batch.close')
      }
      open
      width={result ? 720 : 520}
      destroyOnHidden
      mask={{ closable: false }}
      confirmLoading={submitting}
      okButtonProps={{ danger: action === 'close' }}
      // 结果页只有「关闭」
      footer={result ? null : undefined}
      onOk={() => void submit()}
      onCancel={close}
    >
      {result ? (
        <>
          <Alert
            type={(result.failed ?? 0) > 0 ? 'warning' : 'success'}
            showIcon
            title={t('pages.monitor.rule.batch.result', {
              succeeded: result.succeeded ?? 0,
              failed: result.failed ?? 0,
            })}
            description={
              action === 'close' && (result.succeeded ?? 0) > 0
                ? t('pages.monitor.alert.close.pending')
                : undefined
            }
            style={{ marginBottom: 12 }}
          />
          <Table<AlertActionResult>
            size="small"
            rowKey="id"
            dataSource={result.results ?? []}
            pagination={
              (result.results ?? []).length > 10
                ? { pageSize: 10, showSizeChanger: false }
                : false
            }
            columns={[
              {
                title: t('pages.monitor.alert.batch.column.alert'),
                dataIndex: 'id',
                render: (_, row) => titleOf(row.id),
              },
              {
                title: t('pages.monitor.rule.batch.column.result'),
                dataIndex: 'ok',
                width: 90,
                render: (_, row) =>
                  row.ok
                    ? t('pages.monitor.rule.batch.ok')
                    : t('pages.monitor.rule.batch.failed'),
              },
              {
                title: t('pages.monitor.rule.batch.column.reason'),
                dataIndex: 'message',
                render: (_, row) =>
                  row.ok
                    ? t('common.empty')
                    : monitorReasonText(row.reason, row.message) || row.reason,
              },
            ]}
          />
        </>
      ) : (
        <>
          <Alert
            type={action === 'close' ? 'warning' : 'info'}
            showIcon
            title={t('pages.monitor.alert.batch.affected', {
              count: alerts.length,
            })}
            description={
              (action === 'close' || skipped > 0) && (
                <>
                  {action === 'close' && (
                    <div>{t('pages.monitor.alert.close.description')}</div>
                  )}
                  {skipped > 0 && (
                    <div>
                      {t('pages.monitor.alert.batch.skipped', {
                        count: skipped,
                      })}
                    </div>
                  )}
                </>
              )
            }
            style={{ marginBottom: 16 }}
          />
          <Form form={form} layout="vertical">
            {action === 'close' && (
              <Form.Item
                name="reason"
                label={t('pages.monitor.alert.close.reason')}
                rules={[
                  {
                    ...rules.required(t('pages.monitor.alert.close.reason')),
                    whitespace: true,
                  },
                  rules.maxChars(ALERT_LIMITS.closeReasonMax),
                ]}
              >
                <Input.TextArea
                  rows={3}
                  maxLength={ALERT_LIMITS.closeReasonMax}
                  showCount
                />
              </Form.Item>
            )}
          </Form>
        </>
      )}
    </Modal>
  );
};

export default AlertBatchModal;
