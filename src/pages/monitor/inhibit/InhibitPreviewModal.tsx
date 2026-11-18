/**
 * 抑制规则的预览结果弹窗：按表单当前内容，列出活跃告警里「满足源条件的」与「会被抑制的」两张表
 * （各至多 50 条）与各自的总数。列与「预览命中」弹窗一致。
 */
import { Modal, Table } from 'antd';
import type React from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import type {
  InhibitPreviewResult,
  MonitorAlert,
} from '@/services/monitor/typings';
import { useEnumText, useT } from '@/utils/i18n';
import { formatTime, formatValue } from '../components/format';
import { ALERT_STATUS_META } from '../components/meta';
import { LabelTags, SeverityTag } from '../components/tags';

const AlertTable: React.FC<{ alerts: MonitorAlert[] }> = ({ alerts }) => {
  const t = useT();
  const statusText = useEnumText(ALERT_STATUS_META);
  return (
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
  );
};

export const InhibitPreviewModal: React.FC<{
  /** 为空即关闭 */
  result: InhibitPreviewResult | null;
  onClose: () => void;
}> = ({ result, onClose }) => {
  const t = useT();
  const sources = result?.sources ?? [];
  const targets = result?.targets ?? [];
  return (
    <Modal
      title={t('pages.monitor.inhibit.preview.title')}
      open={result !== null}
      width={960}
      footer={null}
      destroyOnHidden
      onCancel={onClose}
    >
      <SectionTitle>
        {t('pages.monitor.inhibit.preview.sources', {
          total: result?.sourceTotal ?? 0,
          shown: sources.length,
        })}
      </SectionTitle>
      <AlertTable alerts={sources} />
      <SectionTitle>
        {t('pages.monitor.inhibit.preview.targets', {
          total: result?.targetTotal ?? 0,
          shown: targets.length,
        })}
      </SectionTitle>
      <AlertTable alerts={targets} />
    </Modal>
  );
};

export default InhibitPreviewModal;
