/**
 * 「预览命中」（屏蔽规则、订阅规则表单共用）：表单底部的预览按钮与请求状态（useAlertPreview），
 * 以及结果弹窗——列出会被命中的告警事件（至多 50 条）与总数。
 */
import type { ProFormInstance } from '@ant-design/pro-components';
import { Button, Modal, Table } from 'antd';
import type React from 'react';
import { useState } from 'react';
import type {
  AlertPreviewResult,
  MonitorAlert,
} from '@/services/monitor/typings';
import { useEnumText, useT } from '@/utils/i18n';
import { formatTime, formatValue } from './format';
import { ALERT_STATUS_META } from './meta';
import { LabelTags, SeverityTag } from './tags';

/**
 * 表单的「预览命中」：校验表单 → 用当前表单值组装 spec → 请求预览。返回值里的
 * submitterRender 把预览按钮放在提交按钮之前，result / close 交给 AlertPreviewModal。
 */
export const useAlertPreview = <Values, Spec>(
  formRef: React.RefObject<ProFormInstance<Values> | undefined>,
  toSpec: (values: Values) => Spec,
  request: (spec: Spec) => Promise<AlertPreviewResult>,
) => {
  const t = useT();
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult] = useState<AlertPreviewResult | null>(null);

  const run = async () => {
    const form = formRef.current;
    if (!form) return;
    const values = await form.validateFields().catch(() => undefined);
    // 校验不通过：错误已显示在表单项上
    if (!values) return;
    setPreviewing(true);
    try {
      setResult(await request(toSpec(values)));
    } catch {
      // 已由请求层提示
    } finally {
      setPreviewing(false);
    }
  };

  return {
    result,
    close: () => setResult(null),
    submitterRender: (_: unknown, dom: React.ReactNode[]) => [
      <Button key="preview" loading={previewing} onClick={() => void run()}>
        {t('pages.monitor.preview.action')}
      </Button>,
      ...dom,
    ],
  };
};

export const AlertPreviewModal: React.FC<{
  /** 为空即关闭 */
  result: AlertPreviewResult | null;
  /** 总数说明文案的 i18n 键（含 {total}、{shown}） */
  summaryId: string;
  onClose: () => void;
}> = ({ result, summaryId, onClose }) => {
  const t = useT();
  const statusText = useEnumText(ALERT_STATUS_META);
  const alerts = result?.alerts ?? [];
  return (
    <Modal
      title={t('pages.monitor.preview.title')}
      open={result !== null}
      width={960}
      footer={null}
      destroyOnHidden
      onCancel={onClose}
    >
      <div style={{ marginBottom: 12 }}>
        {t(summaryId, { total: result?.total ?? 0, shown: alerts.length })}
      </div>
      <Table<MonitorAlert>
        size="small"
        rowKey="id"
        dataSource={alerts}
        pagination={
          alerts.length > 10 ? { pageSize: 10, showSizeChanger: false } : false
        }
        scroll={{ x: 'max-content' }}
        columns={[
          {
            title: t('pages.monitor.alert.column.severity'),
            dataIndex: 'severity',
            width: 80,
            render: (_, row) => <SeverityTag severity={row.severity} />,
          },
          {
            title: t('pages.monitor.alert.column.rule'),
            dataIndex: 'ruleName',
            ellipsis: true,
          },
          {
            title: t('pages.monitor.alert.column.labels'),
            dataIndex: 'labels',
            render: (_, row) => <LabelTags labels={row.labels} max={3} />,
          },
          {
            title: t('pages.monitor.alert.column.value'),
            dataIndex: 'value',
            width: 100,
            render: (_, row) => formatValue(row.value) || t('common.empty'),
          },
          {
            title: t('common.column.status'),
            dataIndex: 'status',
            width: 90,
            render: (_, row) =>
              row.status ? statusText(row.status) : t('common.empty'),
          },
          {
            title: t('pages.monitor.alert.column.firstFireTime'),
            dataIndex: 'firstFireTime',
            width: 170,
            render: (_, row) => formatTime(row.firstFireTime),
          },
        ]}
      />
    </Modal>
  );
};

export default AlertPreviewModal;
