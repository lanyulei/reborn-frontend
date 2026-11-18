/**
 * 「引用规则」弹窗：列出引用了某个升级策略的告警规则（只读）。走规则列表接口，
 * 因此只对有告警规则菜单权限的用户提供入口（见列表页）。
 */
import { ProTable } from '@ant-design/pro-components';
import { Modal } from 'antd';
import type React from 'react';
import { ENABLED_META } from '@/constants';
import { listRules } from '@/services/monitor/rule';
import type { MonitorRule } from '@/services/monitor/typings';
import { useEnumText, useT } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { SeverityTag } from '../components/tags';

export const RulesModal: React.FC<{
  /** 为空即关闭 */
  escalation: { id: string; name: string } | null;
  onClose: () => void;
}> = ({ escalation, onClose }) => {
  const t = useT();
  const enabledText = useEnumText(ENABLED_META);
  return (
    <Modal
      title={t('pages.monitor.escalation.rules.title', {
        name: escalation?.name ?? '',
      })}
      open={escalation !== null}
      width={720}
      footer={null}
      destroyOnHidden
      onCancel={onClose}
    >
      {escalation && (
        <ProTable<MonitorRule>
          rowKey="id"
          size="small"
          search={false}
          options={false}
          ghost
          columnEmptyText={t('common.empty')}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            {
              title: t('pages.monitor.rule.column.name'),
              dataIndex: ['spec', 'name'],
              ellipsis: true,
            },
            {
              title: t('pages.monitor.common.group'),
              dataIndex: 'groupName',
              ellipsis: true,
            },
            {
              title: t('pages.monitor.alert.column.severity'),
              dataIndex: 'maxSeverity',
              width: 90,
              render: (_, rule) => <SeverityTag severity={rule.maxSeverity} />,
            },
            {
              title: t('common.column.status'),
              dataIndex: ['spec', 'enabled'],
              width: 90,
              render: (_, rule) =>
                enabledText(rule.spec.enabled ? 'true' : 'false'),
            },
          ]}
          request={async (params) =>
            toTableResult(
              await listRules({
                page: params.current,
                pageSize: params.pageSize,
                escalationId: escalation.id,
              }),
            )
          }
        />
      )}
    </Modal>
  );
};

export default RulesModal;
