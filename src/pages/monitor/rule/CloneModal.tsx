/**
 * 克隆规则弹窗：可改名、可选目标分组（须可管理）；新规则缺省停用。
 */
import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { App, Form } from 'antd';
import type React from 'react';
import { cloneRule } from '@/services/monitor/rule';
import type { MonitorRule, RuleGroup } from '@/services/monitor/typings';
import { useFormRules, useT } from '@/utils/i18n';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import { MONITOR_LIMITS } from '../components/meta';

export const CloneModal: React.FC<{
  rule: MonitorRule;
  groups: readonly RuleGroup[];
  onClose: () => void;
  /** 克隆成功后调用：刷新列表与分组计数 */
  onDone: () => void;
}> = ({ rule, groups, onClose, onDone }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  return (
    <ModalForm<{ name?: string; groupId?: string }>
      title={t('pages.monitor.rule.clone.title', { name: rule.spec.name })}
      width={480}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      initialValues={{
        groupId: rule.canManage ? rule.spec.groupId : undefined,
      }}
      onFinish={async (values) => {
        await cloneRule(rule.id, {
          name: values.name?.trim() || undefined,
          groupId: values.groupId,
        });
        message.success(t('pages.monitor.rule.clone.done'));
        onDone();
        return true;
      }}
    >
      <ProFormText
        name="name"
        label={t('pages.monitor.rule.clone.name')}
        placeholder={t('pages.monitor.rule.clone.name.placeholder', {
          name: rule.spec.name,
        })}
        rules={[rules.max(MONITOR_LIMITS.nameMax)]}
      />
      <Form.Item
        name="groupId"
        label={t('pages.monitor.common.group')}
        rules={[rules.select(t('pages.monitor.common.group'))]}
      >
        <GroupTreeSelect
          groups={groups}
          minLevel={2}
          allowClear={false}
          placeholder={t('pages.monitor.common.group.placeholder')}
        />
      </Form.Item>
    </ModalForm>
  );
};

export default CloneModal;
