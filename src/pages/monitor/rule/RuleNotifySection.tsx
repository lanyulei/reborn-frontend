/**
 * 规则表单「通知配置」一节：通知对象（用户 / 值班表 / 部门负责人）、恢复通知、重复通知间隔、
 * 最大通知次数、升级策略、聚合键标签。作为 RuleDrawer（栅格 ProForm）的直接子节点使用。
 * 升级策略的候选跟随表单里的规则分组：策略归属某个分组（或为全局），只有该分组及其下级分组内的
 * 规则能引用。
 */
import {
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components';
import { Alert, App, Col, Form, Tag } from 'antd';
import type React from 'react';
import { useEffect } from 'react';
import { DeptSelect } from '@/components/DeptSelect';
import { SectionTitle } from '@/components/SectionTitle';
import { UserSelect } from '@/components/UserSelect';
import { fetchMonitorUsers } from '@/components/UserSelect/sources';
import { FULL, HALF } from '@/constants/layout';
import type { MonitorRule } from '@/services/monitor/typings';
import { useEnumText, useT } from '@/utils/i18n';
import {
  refsToKnown,
  useNotifyTargets,
  withRefOptions,
} from '../components/hooks';
import {
  ESCALATION_MODE_META,
  LABEL_NAME_REGEX,
  MONITOR_LIMITS,
} from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { TargetsFailedAlert } from '../components/tags';
import type { RuleFormValues } from './ruleForm';
import {
  CandidatesFailedAlert,
  refList,
  useEscalationOptions,
} from './useRuleOptions';

const THIRD = { span: 8 } as const;

export const RuleNotifySection: React.FC<{
  /** 正在编辑 / 查看的规则（详情；用于回显通知对象的显示名） */
  rule: MonitorRule | null;
  readOnly?: boolean;
}> = ({ rule, readOnly }) => {
  const t = useT();
  const { message } = App.useApp();
  const { styles } = useMonitorStyles();
  const modeText = useEnumText(ESCALATION_MODE_META);
  const form = Form.useFormInstance<RuleFormValues>();
  const groupId = Form.useWatch('groupId', form);
  // 只读查看不请求候选：已选项靠详情返回的显示名回显
  const targets = useNotifyTargets(!readOnly);
  const escalations = useEscalationOptions(groupId, !readOnly);
  const escalationById = new Map(
    escalations.items.map((item) => [item.id, item]),
  );
  const escalationOptions = withRefOptions(
    escalations.items.map((item) => ({
      value: item.id,
      label: item.name || item.id,
    })),
    refList(rule?.escalation),
    t,
  );
  const savedGroupId = rule?.spec.groupId;
  const savedEscalationId = rule?.spec.escalationId;

  // 换了规则分组、新分组的候选回来之后：已选的策略不在其中（新分组引用不了）就清掉并提示。
  // 没换分组时不动——已保存的策略可能已停用或删除（候选里只有已启用的），保留并标注，由用户决定
  useEffect(() => {
    if (!groupId || escalations.groupId !== groupId) return;
    const current = form.getFieldValue('escalationId') as string | undefined;
    if (!current || escalations.items.some((item) => item.id === current)) {
      return;
    }
    if (groupId === savedGroupId && current === savedEscalationId) return;
    form.setFieldValue('escalationId', undefined);
    message.warning(t('pages.monitor.rule.form.escalation.cleared'));
  }, [
    groupId,
    escalations.groupId,
    escalations.items,
    savedGroupId,
    savedEscalationId,
    form,
    message,
    t,
  ]);
  const scheduleOptions = withRefOptions(
    targets.scheduleOptions,
    rule?.notifySchedules,
    t,
  );

  return (
    <>
      <Col span={24}>
        <SectionTitle>{t('pages.monitor.rule.section.notify')}</SectionTitle>
        <Alert
          type="info"
          showIcon
          title={t('pages.monitor.rule.form.notify.hint')}
          style={{ marginBottom: 16 }}
        />
        <TargetsFailedAlert targets={targets} />
        <Form.Item name="userIds" label={t('pages.monitor.common.users')}>
          <UserSelect
            multiple
            maxCount={MONITOR_LIMITS.notifyUserMax}
            fetchUsers={fetchMonitorUsers}
            knownUsers={refsToKnown(rule?.notifyUsers)}
            placeholder={t('pages.monitor.common.users.placeholder')}
          />
        </Form.Item>
      </Col>
      <ProFormSelect
        name="scheduleIds"
        label={t('pages.monitor.common.schedules')}
        tooltip={t('pages.monitor.common.schedules.tooltip')}
        colProps={HALF}
        options={scheduleOptions}
        fieldProps={{
          mode: 'multiple',
          maxCount: MONITOR_LIMITS.notifyScheduleMax,
          showSearch: { optionFilterProp: 'label' },
        }}
        placeholder={t('pages.monitor.common.schedules.placeholder')}
      />
      <Col span={12}>
        <Form.Item
          name="deptIds"
          label={t('pages.monitor.rule.form.depts')}
          tooltip={t('pages.monitor.rule.form.depts.tooltip')}
        >
          <DeptSelect
            multiple
            maxCount={MONITOR_LIMITS.notifyDeptMax}
            depts={targets.depts}
            knownDepts={(rule?.notifyDepts ?? []).map((ref) => ({
              id: ref.id,
              name: ref.name || ref.id,
            }))}
            placeholder={t('pages.monitor.rule.form.depts.placeholder')}
          />
        </Form.Item>
      </Col>
      <ProFormSwitch
        name="notifyRecovery"
        label={t('pages.monitor.rule.form.notifyRecovery')}
        colProps={THIRD}
      />
      <ProFormDigit
        name="repeatIntervalM"
        label={t('pages.monitor.rule.form.repeatInterval')}
        tooltip={t('pages.monitor.rule.form.repeatInterval.tooltip')}
        colProps={THIRD}
        min={0}
        max={MONITOR_LIMITS.repeatInterval.max}
        fieldProps={{ precision: 0, suffix: t('pages.monitor.unit.minute') }}
        rules={[
          {
            validator: (_: unknown, value?: number) =>
              !value || value >= MONITOR_LIMITS.repeatInterval.min
                ? Promise.resolve()
                : Promise.reject(
                    new Error(t('pages.monitor.rule.form.repeatInterval.rule')),
                  ),
          },
        ]}
      />
      <ProFormDigit
        name="maxNotify"
        label={t('pages.monitor.rule.form.maxNotify')}
        tooltip={t('pages.monitor.rule.form.maxNotify.tooltip')}
        colProps={THIRD}
        min={MONITOR_LIMITS.maxNotify.min}
        max={MONITOR_LIMITS.maxNotify.max}
        fieldProps={{ precision: 0 }}
      />
      <Col span={24}>
        <CandidatesFailedAlert
          state={escalations}
          title={t('pages.monitor.rule.form.escalation.failed')}
        />
      </Col>
      <ProFormSelect
        name="escalationId"
        label={t('pages.monitor.rule.form.escalation')}
        tooltip={t('pages.monitor.rule.form.escalation.tooltip')}
        colProps={FULL}
        options={escalationOptions}
        fieldProps={{
          allowClear: true,
          loading: escalations.loading,
          showSearch: { optionFilterProp: 'label' },
          optionRender: (option) => {
            const item = escalationById.get(String(option.value));
            return (
              <span className="flex items-center gap-2">
                <span>{option.label}</span>
                {item?.global && (
                  <Tag style={{ marginInlineEnd: 0 }}>
                    {t('pages.monitor.rule.form.escalation.global')}
                  </Tag>
                )}
                {item && (
                  <span className={styles.hint}>
                    {t('pages.monitor.rule.form.escalation.option', {
                      levels: item.levelCount ?? 0,
                      mode: item.mode ? modeText(item.mode) : '',
                    })}
                  </span>
                )}
              </span>
            );
          },
        }}
        placeholder={
          groupId
            ? t('pages.monitor.rule.form.escalation.placeholder')
            : t('pages.monitor.rule.form.escalation.needGroup')
        }
      />
      <ProFormSelect
        name="groupKeyLabels"
        label={t('pages.monitor.rule.form.groupKeyLabels')}
        tooltip={t('pages.monitor.rule.form.groupKeyLabels.tooltip')}
        colProps={FULL}
        fieldProps={{
          mode: 'tags',
          open: false,
          suffix: null,
          maxCount: MONITOR_LIMITS.groupKeyLabelMax,
          tokenSeparators: [',', ' '],
        }}
        placeholder={t('pages.monitor.rule.form.groupKeyLabels.placeholder')}
        rules={[
          {
            validator: (_: unknown, value?: string[]) =>
              (value ?? []).every(
                (item) => LABEL_NAME_REGEX.test(item) && item.length <= 128,
              )
                ? Promise.resolve()
                : Promise.reject(
                    new Error(t('pages.monitor.rule.form.groupKeyLabels.rule')),
                  ),
          },
        ]}
      />
    </>
  );
};

export default RuleNotifySection;
