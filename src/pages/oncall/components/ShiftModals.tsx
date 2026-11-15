/**
 * 班次弹窗两件：
 * - ShiftDetailModal 班次详情（值班表 / 角色 / 值班人 / 时间 / 来源 / 原值班人 / 原因），
 *   底部提供「替班」「撤销替班」；
 * - OverrideModal 替班表单：替班人从分组成员中选；以天为最小单位，只选日期
 *   （每个值班日从当天的交接时刻到次日的交接时刻），不早于当前值班日；
 *   从日历日期发起（临时安排值班）时可在候选值班表里选择，并一次配置主 / 备值班人
 *   （只展示这一天还缺的角色）。
 */
import {
  ModalForm,
  ProFormDateRangePicker,
  ProFormDependency,
  type ProFormInstance,
  ProFormRadio,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, Button, Descriptions, Modal, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useRef } from 'react';
import { listGroupMembers } from '@/services/oncall/group';
import {
  createOverride,
  listShifts,
  revokeOverride,
} from '@/services/oncall/schedule';
import type {
  OncallSchedule,
  OncallShift,
  OncallShiftRole,
} from '@/services/oncall/typings';
import { useFormRules, useOptions, useT } from '@/utils/i18n';
import { displayName } from './hooks';
import {
  ONCALL_DESC_MAX,
  ONCALL_SHIFT_ROLE_META,
  ONCALL_SHIFT_ROLE_ORDER,
  ONCALL_SHIFT_SOURCE_META,
} from './meta';
import {
  addDutyDays,
  dutyDayOf,
  dutyDayStart,
  formatRange,
  handoverClock,
} from './time';

export const ShiftDetailModal: React.FC<{
  shift: OncallShift | null;
  /** 是否展示替班 / 撤销（元素权限） */
  writable?: boolean;
  /** 当前用户能否管理该值班表 */
  canManage?: boolean;
  onClose: () => void;
  onOverride: (shift: OncallShift) => void;
  onChanged: () => void;
}> = ({ shift, writable, canManage, onClose, onOverride, onChanged }) => {
  const t = useT();
  const { message, modal } = App.useApp();
  const ended = shift ? !dayjs(shift.endTime).isAfter(dayjs()) : true;
  const isOverride = shift?.source === 2;

  const guard = (node: React.ReactElement, key: string) =>
    canManage ? (
      node
    ) : (
      <Tooltip key={key} title={t('pages.oncall.needManager')}>
        <span>{node}</span>
      </Tooltip>
    );

  const footer: React.ReactNode[] = [
    <Button key="close" onClick={onClose}>
      {t('pages.oncall.shift.close')}
    </Button>,
  ];
  if (shift && writable && !ended) {
    if (isOverride && shift.id) {
      const id = shift.id;
      footer.push(
        canManage ? (
          <Button
            key="revoke"
            danger
            onClick={() =>
              modal.confirm({
                title: t('pages.oncall.override.revoke.title'),
                content: t('pages.oncall.override.revoke.description'),
                okButtonProps: { danger: true },
                onOk: async () => {
                  await revokeOverride(id);
                  message.success(t('pages.oncall.override.msg.revoked'));
                  onClose();
                  onChanged();
                },
              })
            }
          >
            {t('pages.oncall.override.revoke')}
          </Button>
        ) : (
          guard(
            <Button danger disabled>
              {t('pages.oncall.override.revoke')}
            </Button>,
            'revoke',
          )
        ),
      );
    }
    footer.push(
      canManage ? (
        <Button
          key="override"
          type="primary"
          onClick={() => {
            onClose();
            onOverride(shift);
          }}
        >
          {t('pages.oncall.override.title')}
        </Button>
      ) : (
        guard(
          <Button type="primary" disabled>
            {t('pages.oncall.override.title')}
          </Button>,
          'override',
        )
      ),
    );
  }

  return (
    <Modal
      title={t('pages.oncall.shift.title')}
      open={!!shift}
      onCancel={onClose}
      footer={footer}
      destroyOnHidden
    >
      {shift && (
        <Descriptions
          column={1}
          size="small"
          items={[
            {
              key: 'schedule',
              label: t('pages.oncall.shift.column.schedule'),
              children: shift.scheduleName || t('common.empty'),
            },
            {
              key: 'role',
              label: t('pages.oncall.shift.column.role'),
              children: t(ONCALL_SHIFT_ROLE_META[shift.role].textId),
            },
            {
              key: 'user',
              label: t('pages.oncall.shift.column.user'),
              children: (
                <>
                  {shift.userName || t('common.empty')}
                  {shift.userAvailable === false && (
                    <Tag color="error" style={{ marginInlineStart: 8 }}>
                      {t('pages.oncall.member.unavailable')}
                    </Tag>
                  )}
                </>
              ),
            },
            {
              key: 'time',
              label: t('pages.oncall.shift.column.time'),
              children: formatRange(shift.startTime, shift.endTime),
            },
            {
              key: 'source',
              label: t('pages.oncall.shift.column.source'),
              children: (
                <Tag color={isOverride ? 'warning' : undefined}>
                  {t(ONCALL_SHIFT_SOURCE_META[shift.source ?? 1].textId)}
                </Tag>
              ),
            },
            ...(isOverride
              ? [
                  {
                    key: 'origin',
                    label: t('pages.oncall.shift.column.origin'),
                    children: shift.originUserName || t('common.empty'),
                  },
                  {
                    key: 'remark',
                    label: t('pages.oncall.shift.column.remark'),
                    children: shift.remark || t('common.empty'),
                  },
                ]
              : []),
          ]}
        />
      )}
    </Modal>
  );
};

/** 替班的预填：值班表必填；从班次发起时带角色与时间段 */
export interface OverrideTarget {
  schedule: OncallSchedule;
  /**
   * 临时安排值班（从日历日期发起）：可选的值班表，表单内可切换；
   * 此时表单为「主值班人 + 备值班人」，一次可配齐两个角色
   */
  candidates?: OncallSchedule[];
  /** 临时安排值班：各值班表在这一天还缺的角色（值班表 ID → 角色）；只展示缺的角色 */
  missing?: Record<string, OncallShiftRole[]>;
  role?: OncallShiftRole;
  /** 从班次发起：班次的起止时刻，预填为它覆盖的值班日 */
  startTime?: string;
  endTime?: string;
  /** 直接指定预填的值班日（YYYY-MM-DD，含首尾）；优先于起止时刻 */
  dates?: [string, string];
}

interface OverrideFormValues {
  scheduleId: string;
  /** 替班：角色 + 替班人 */
  role: OncallShiftRole;
  userId?: string;
  /** 临时安排值班：主 / 备值班人 */
  primaryUserId?: string;
  backupUserId?: string;
  /** 值班日（YYYY-MM-DD，含首尾） */
  range: [string, string];
  remark?: string;
}

export const OverrideModal: React.FC<{
  target: OverrideTarget | null;
  onClose: () => void;
  onDone: () => void;
}> = ({ target, onClose, onDone }) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  const roleOptions = useOptions(
    ONCALL_SHIFT_ROLE_META,
    ONCALL_SHIFT_ROLE_ORDER,
  );
  const formRef = useRef<ProFormInstance<OverrideFormValues>>(undefined);
  if (!target) return null;
  const { schedule, candidates } = target;
  /** 临时安排值班（否则为替班） */
  const assign = !!candidates;
  const scheduleOf = (id?: string) =>
    candidates?.find((item) => item.id === id) ?? schedule;
  /** 临时安排时要配置的角色：这一天还缺的；未指定时为主值班 + 备值班（值班表开启时） */
  const rolesOf = (item: OncallSchedule): OncallShiftRole[] =>
    target.missing?.[item.id] ?? (item.config.backupEnabled ? [1, 2] : [1]);
  const rangeLabel = t(
    assign
      ? 'pages.oncall.override.assign.range'
      : 'pages.oncall.override.form.range',
  );
  // 预填的值班日：已经开始的班次从当前值班日起（更早的部分已成历史）
  const today = dutyDayOf(schedule.config, dayjs());
  let initialRange: [string, string] | undefined = target.dates;
  if (!initialRange && target.startTime && target.endTime) {
    const from = dutyDayOf(schedule.config, target.startTime);
    const to = dutyDayOf(
      schedule.config,
      dayjs(target.endTime).subtract(1, 'second'),
    );
    // 已经开始的班次从当前值班日起
    let first = from;
    if (first < today) first = today;
    if (to >= first) initialRange = [first, to];
  }

  /** 分组内可用的成员 */
  const memberOptions = async ({ groupId }: { groupId: string }) => {
    const { items } = await listGroupMembers(groupId);
    return (items ?? [])
      .filter((member) => member.available !== false)
      .map((member) => ({
        label: displayName(member),
        value: member.userId,
      }));
  };

  return (
    <ModalForm<OverrideFormValues>
      key={`${schedule.id}-${target.role}-${target.startTime}-${target.dates?.[0]}`}
      title={
        assign
          ? t('pages.oncall.override.assign.title')
          : t('pages.oncall.override.titleOf', { name: schedule.config.name })
      }
      width={520}
      formRef={formRef}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      initialValues={{
        scheduleId: schedule.id,
        role: target.role ?? 1,
        range: initialRange,
      }}
      onFinish={async (values) => {
        // 值班日 → 时刻：首日的交接时刻 ~ 末日次日的交接时刻
        const current = scheduleOf(values.scheduleId);
        const { config } = current;
        const [from, to] = values.range.map((d) =>
          dayjs(d).format('YYYY-MM-DD'),
        );
        const scheduleId = current.id;
        const startTime = dutyDayStart(config, from).toISOString();
        const endTime = dutyDayStart(config, addDutyDays(to, 1)).toISOString();
        // 本次要写入的（角色, 值班人）：替班一条；临时安排为填了的主 / 备
        const jobs: { role: OncallShiftRole; userId: string }[] = [];
        if (assign) {
          const roles = rolesOf(current);
          if (roles.includes(1) && values.primaryUserId) {
            jobs.push({ role: 1, userId: values.primaryUserId });
          }
          if (roles.includes(2) && values.backupUserId) {
            jobs.push({ role: 2, userId: values.backupUserId });
          }
        } else if (values.userId) {
          jobs.push({ role: values.role, userId: values.userId });
        }
        if (jobs.length === 0) return false;
        // 主备值班人不能是同一个人：所选日期内另一角色已是此人时不提交（后端同样会拒绝）。
        // 本次一并重新安排的角色不算；班次查询最多 100 天，更长的范围直接交给后端校验
        const { items } =
          dayjs(endTime).diff(dayjs(startTime), 'day') <= 100
            ? await listShifts({ scheduleId, startTime, endTime })
            : { items: [] };
        const clash = (items ?? []).find(
          (item) =>
            dayjs(item.endTime).isAfter(dayjs()) &&
            !jobs.some((job) => job.role === item.role) &&
            jobs.some((job) => job.userId === item.userId),
        );
        if (clash) {
          message.error(
            t('pages.oncall.override.samePerson', {
              role: t(ONCALL_SHIFT_ROLE_META[clash.role].textId),
              date: dutyDayOf(config, clash.startTime),
            }),
          );
          return false;
        }
        const remark = values.remark?.trim() || undefined;
        let saved = 0;
        try {
          // 逐个角色写入（先主后备）
          for (const job of jobs) {
            await createOverride({
              scheduleId,
              ...job,
              startTime,
              endTime,
              remark,
            });
            saved += 1;
          }
        } catch (error) {
          // 主值班已写入、备值班失败：关闭并刷新，避免重复提交已生效的部分
          if (saved > 0) {
            onDone();
            return true;
          }
          throw error;
        }
        message.success(
          t(
            assign
              ? 'pages.oncall.override.assign.done'
              : 'pages.oncall.override.msg.created',
          ),
        );
        onDone();
        return true;
      }}
    >
      {assign && (
        <ProFormSelect
          name="scheduleId"
          label={t('pages.oncall.shift.column.schedule')}
          allowClear={false}
          showSearch
          options={candidates.map((item) => ({
            value: item.id,
            label: item.groupName
              ? `${item.groupName} / ${item.config.name}`
              : item.config.name,
          }))}
          fieldProps={{
            // 换值班表后已选的人不再适用：重置
            onChange: () =>
              formRef.current?.setFieldsValue({
                primaryUserId: undefined,
                backupUserId: undefined,
              }),
          }}
          rules={[rules.select(t('pages.oncall.shift.column.schedule'))]}
        />
      )}
      <ProFormDependency name={['scheduleId']}>
        {({ scheduleId }) => {
          const current = scheduleOf(scheduleId);
          const roles = rolesOf(current);
          return (
            <>
              {assign ? (
                <>
                  {roles.includes(1) && (
                    <ProFormSelect
                      name="primaryUserId"
                      label={t('pages.oncall.override.assign.primary')}
                      showSearch
                      params={{ groupId: current.groupId }}
                      request={memberOptions}
                      rules={[
                        rules.select(t('pages.oncall.override.assign.primary')),
                      ]}
                    />
                  )}
                  {roles.includes(2) && (
                    <ProFormSelect
                      name="backupUserId"
                      label={t('pages.oncall.override.assign.backup')}
                      showSearch
                      params={{ groupId: current.groupId }}
                      request={memberOptions}
                      dependencies={['primaryUserId']}
                      rules={[
                        // 只缺备值班时必填；同时配主备时备值班可以先不填
                        ...(roles.includes(1)
                          ? []
                          : [
                              rules.select(
                                t('pages.oncall.override.assign.backup'),
                              ),
                            ]),
                        ({ getFieldValue }) => ({
                          validator: (_: unknown, value?: string) =>
                            value && value === getFieldValue('primaryUserId')
                              ? Promise.reject(
                                  new Error(
                                    t('pages.oncall.override.assign.same'),
                                  ),
                                )
                              : Promise.resolve(),
                        }),
                      ]}
                    />
                  )}
                </>
              ) : (
                <>
                  <ProFormRadio.Group
                    name="role"
                    label={t('pages.oncall.shift.column.role')}
                    options={roleOptions.filter(
                      (option) =>
                        option.value === 1 || current.config.backupEnabled,
                    )}
                    rules={[rules.select(t('pages.oncall.shift.column.role'))]}
                  />
                  <ProFormSelect
                    name="userId"
                    label={t('pages.oncall.override.form.user')}
                    tooltip={t('pages.oncall.override.form.user.tooltip')}
                    showSearch
                    params={{ groupId: current.groupId }}
                    request={memberOptions}
                    rules={[rules.select(t('pages.oncall.override.form.user'))]}
                  />
                </>
              )}
              <ProFormDateRangePicker
                name="range"
                label={rangeLabel}
                extra={t('pages.oncall.override.form.range.hint', {
                  time: handoverClock(current.config),
                  timezone: current.config.timezone,
                })}
                fieldProps={{
                  style: { width: '100%' },
                  // 不早于当前值班日
                  disabledDate: (day) =>
                    day.format('YYYY-MM-DD') <
                    dutyDayOf(current.config, dayjs()),
                }}
                rules={[rules.select(rangeLabel)]}
              />
            </>
          );
        }}
      </ProFormDependency>
      <ProFormTextArea
        name="remark"
        label={t(
          assign
            ? 'pages.oncall.override.assign.remark'
            : 'pages.oncall.shift.column.remark',
        )}
        fieldProps={{ rows: 2, maxLength: ONCALL_DESC_MAX, showCount: true }}
      />
    </ModalForm>
  );
};
