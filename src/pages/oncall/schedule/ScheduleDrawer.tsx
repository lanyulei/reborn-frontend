/**
 * 值班表新建 / 编辑抽屉（分组详情页的值班表列表打开）。保存即重排全部尚未开始的自动
 * 班次。编辑时若改动了轮转名单或周期，轮转需要重新起算：首次交接时间预填为当前主值班
 * 班次的结束时间，起始人预填为当前主值班在新名单中的下一位（可再手动调整）。
 * 表单为双列栅格（与项目内其它表单一致：gutter 16、每项半宽，名单与说明整行）。
 * 排班预览在列表操作列（SchedulePreviewDrawer）。
 * 调用方每次打开须换一个 key 重新挂载本组件：表单实例只在首次挂载时采用初值，
 * 复用实例会带出上一次的内容。
 */
import {
  Alert,
  App,
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  TimePicker,
  Tooltip,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createSchedule,
  getCurrentDuty,
  getSchedule,
  updateSchedule,
} from '@/services/oncall/schedule';
import type {
  OncallCurrentDuty,
  OncallGroupMember,
  OncallRotationUnit,
  OncallSchedule,
  OncallScheduleConfig,
} from '@/services/oncall/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useOptions, useT } from '@/utils/i18n';
import { displayName } from '../components/hooks';
import {
  ONCALL_DESC_MAX,
  ONCALL_HORIZON_RANGE,
  ONCALL_NAME_MAX,
  ONCALL_REMIND_MAX,
  ONCALL_REMIND_PRESETS,
  ONCALL_ROTATION_INTERVAL_MAX,
  ONCALL_ROTATION_UNIT_META,
  ONCALL_ROTATION_UNIT_ORDER,
} from '../components/meta';
import {
  browserTimezone,
  DATE_TIME_FORMAT,
  instantToWall,
  timezoneList,
  wallToInstant,
} from '../components/time';
import { type RotationCandidate, RotationList } from './RotationList';

interface ScheduleFormValues {
  name: string;
  description?: string;
  timezone: string;
  rotationUnit: OncallRotationUnit;
  rotationInterval: number;
  /** 值班表时区下的钟面时间 */
  anchorTime: Dayjs;
  memberIds: string[];
  startUserId?: string;
  backupEnabled: boolean;
  horizonDays: number;
  remindMinutes: number[];
  digestTime?: Dayjs | null;
}

const DIGEST_FORMAT = 'HH:mm';

/** 下周一 10:00（新建值班表的缺省首次交接时间） */
const nextMonday = (): Dayjs => {
  const today = dayjs().startOf('day');
  return today.add((8 - today.day()) % 7 || 7, 'day').hour(10);
};

const sameList = (a: string[] = [], b: string[] = []) =>
  a.length === b.length && a.every((item, index) => item === b[index]);

/** 表单值 → 接口配置；必填项不全（无法预览 / 保存）返回 null */
const toConfig = (
  values: Partial<ScheduleFormValues>,
): OncallScheduleConfig | null => {
  const name = values.name?.trim();
  if (
    !name ||
    !values.timezone ||
    !values.rotationUnit ||
    !values.rotationInterval ||
    !values.anchorTime ||
    !values.horizonDays
  ) {
    return null;
  }
  const memberIds = values.memberIds ?? [];
  return {
    name,
    description: values.description?.trim() ?? '',
    timezone: values.timezone,
    rotationUnit: values.rotationUnit,
    rotationInterval: values.rotationInterval,
    anchorTime: wallToInstant(values.anchorTime, values.timezone),
    memberIds,
    startUserId:
      values.startUserId && memberIds.includes(values.startUserId)
        ? values.startUserId
        : undefined,
    backupEnabled: values.backupEnabled === true,
    horizonDays: values.horizonDays,
    remindMinutes: [...(values.remindMinutes ?? [])].sort((a, b) => b - a),
    digestTime: values.digestTime
      ? values.digestTime.format(DIGEST_FORMAT)
      : undefined,
  };
};

const toFormValues = (config: OncallScheduleConfig): ScheduleFormValues => ({
  name: config.name,
  description: config.description,
  timezone: config.timezone,
  rotationUnit: config.rotationUnit,
  rotationInterval: config.rotationInterval,
  anchorTime: instantToWall(config.anchorTime, config.timezone),
  memberIds: config.memberIds ?? [],
  startUserId: config.startUserId || config.memberIds?.[0],
  backupEnabled: config.backupEnabled === true,
  horizonDays: config.horizonDays,
  remindMinutes: config.remindMinutes ?? [],
  digestTime: config.digestTime
    ? dayjs(`2000-01-01T${config.digestTime}:00`)
    : null,
});

interface ScheduleDrawerProps {
  open: boolean;
  groupId: string;
  /** 编辑的值班表；不传为新建 */
  scheduleId?: string;
  /** 当前用户能否管理本分组 */
  canManage: boolean;
  /** 分组成员（轮转名单的候选） */
  members: OncallGroupMember[];
  onClose: () => void;
  onSaved: () => void;
}

export const ScheduleDrawer: React.FC<ScheduleDrawerProps> = ({
  open,
  groupId,
  scheduleId,
  canManage,
  members,
  onClose,
  onSaved,
}) => {
  const isNew = !scheduleId;
  const t = useT();
  const has = usePermissions();
  const rules = useFormRules();
  const { message } = App.useApp();
  const unitOptions = useOptions(
    ONCALL_ROTATION_UNIT_META,
    ONCALL_ROTATION_UNIT_ORDER,
  );
  const [form] = Form.useForm<ScheduleFormValues>();

  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<OncallSchedule | null>(null);
  const [duty, setDuty] = useState<OncallCurrentDuty | null>(null);
  // 表单初值：就绪后才渲染表单
  const [initialValues, setInitialValues] =
    useState<Partial<ScheduleFormValues>>();
  const [reanchored, setReanchored] = useState(false);
  const [saving, setSaving] = useState(false);

  const zones = useMemo(
    () => timezoneList().map((zone) => ({ value: zone, label: zone })),
    [],
  );

  useEffect(() => {
    if (!open) return;
    setSchedule(null);
    setDuty(null);
    setReanchored(false);
    setInitialValues(undefined);
    if (!scheduleId) {
      setInitialValues({
        timezone: browserTimezone(),
        rotationUnit: 2,
        rotationInterval: 1,
        anchorTime: nextMonday(),
        memberIds: [],
        backupEnabled: true,
        horizonDays: 60,
        // 上班提醒默认不设置，需要时手动选择
        remindMinutes: [],
        digestTime: null,
      });
      return;
    }
    let cancelled = false;
    setLoading(true);
    getSchedule(scheduleId)
      .then((result) => {
        if (cancelled) return;
        setSchedule(result.schedule);
        setInitialValues(toFormValues(result.schedule.config));
      })
      // 失败提示已由请求层给出（如值班表已被删除）：关闭抽屉
      .catch(() => !cancelled && onClose())
      .finally(() => !cancelled && setLoading(false));
    // 当前值班用于"重新起算"的预填；取不到（停用 / 无人值班）则不预填
    getCurrentDuty({ scheduleId }, { silent: true })
      .then(({ items }) => !cancelled && setDuty(items?.[0] ?? null))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // onClose 为调用方的内联函数，不作为依赖（否则每次渲染都会重新加载）
  }, [open, scheduleId]);

  // 可选成员：分组成员为准；名单里已不在分组内的人（异常数据）用值班表自带的显示名兜底
  const candidates = useMemo<RotationCandidate[]>(() => {
    const list: RotationCandidate[] = members.map((m) => ({
      userId: m.userId,
      name: displayName(m),
      available: m.available !== false,
    }));
    const known = new Set(list.map((c) => c.userId));
    for (const m of schedule?.members ?? []) {
      if (!known.has(m.userId)) {
        list.push({
          userId: m.userId,
          name: displayName(m),
          available: m.available !== false,
        });
      }
    }
    return list;
  }, [members, schedule]);
  const nameOf = useCallback(
    (userId: string) =>
      candidates.find((c) => c.userId === userId)?.name ?? userId,
    [candidates],
  );

  const writable = has('oncall.group.schedule') && canManage;
  const values = Form.useWatch([], form) as
    | Partial<ScheduleFormValues>
    | undefined;
  const memberIds = values?.memberIds ?? [];
  const rotationUnit = values?.rotationUnit ?? 2;

  const onValuesChange = (
    changed: Partial<ScheduleFormValues>,
    all: ScheduleFormValues,
  ) => {
    const patch: Partial<ScheduleFormValues> = {};
    const ids = all.memberIds ?? [];
    if ('rotationUnit' in changed) {
      const max = ONCALL_ROTATION_INTERVAL_MAX[all.rotationUnit];
      if (all.rotationInterval > max) patch.rotationInterval = max;
    }
    const rotationTouched =
      'memberIds' in changed ||
      'rotationUnit' in changed ||
      'rotationInterval' in changed;
    const original = schedule?.config;
    if (rotationTouched && original && duty?.nextHandoverTime) {
      const rotationChanged =
        !sameList(ids, original.memberIds) ||
        all.rotationUnit !== original.rotationUnit ||
        (patch.rotationInterval ?? all.rotationInterval) !==
          original.rotationInterval;
      if (rotationChanged) {
        // 轮转重新起算：从当前班次结束时刻开始，由当前主值班在新名单中的下一位接班
        const index = duty.primary?.userId
          ? ids.indexOf(duty.primary.userId)
          : -1;
        patch.anchorTime = instantToWall(duty.nextHandoverTime, all.timezone);
        patch.startUserId = ids.length
          ? ids[(index + 1) % ids.length]
          : undefined;
        setReanchored(true);
      } else {
        patch.anchorTime = instantToWall(original.anchorTime, all.timezone);
        patch.startUserId = original.startUserId || original.memberIds?.[0];
        setReanchored(false);
      }
    }
    // 起始人必须在名单内：被移出或尚未选择时回落到第一位
    const startUserId =
      'startUserId' in patch ? patch.startUserId : all.startUserId;
    if (!startUserId || !ids.includes(startUserId)) {
      patch.startUserId = ids[0];
    }
    if (Object.keys(patch).length) form.setFieldsValue(patch);
  };

  const save = async () => {
    // 校验未通过：错误已标在表单项上
    const formValues = await form.validateFields().catch(() => null);
    const config = formValues && toConfig(formValues);
    if (!config) return;
    setSaving(true);
    try {
      if (scheduleId) {
        await updateSchedule(scheduleId, config);
        message.success(t('pages.oncall.schedule.msg.saved'));
      } else {
        await createSchedule({ groupId, config });
        message.success(t('common.msg.created'));
      }
      onSaved();
      onClose();
    } catch {
      // 失败提示已由请求层给出
    } finally {
      setSaving(false);
    }
  };

  const remindLabel = useCallback(
    (minutes: number) => {
      if (minutes === 0) return t('pages.oncall.schedule.remind.atStart');
      if (minutes % 1440 === 0) {
        return t('pages.oncall.schedule.remind.days', {
          count: minutes / 1440,
        });
      }
      if (minutes % 60 === 0) {
        return t('pages.oncall.schedule.remind.hours', { count: minutes / 60 });
      }
      return t('pages.oncall.schedule.remind.minutes', { count: minutes });
    },
    [t],
  );
  const remindOptions = useMemo(() => {
    const all = new Set([
      ...ONCALL_REMIND_PRESETS,
      ...(values?.remindMinutes ?? []),
    ]);
    return [...all]
      .sort((a, b) => a - b)
      .map((minutes) => ({ value: minutes, label: remindLabel(minutes) }));
  }, [values?.remindMinutes, remindLabel]);

  const canSave = has('oncall.group.schedule');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size={672}
      destroyOnHidden
      loading={loading}
      title={
        isNew
          ? t('pages.oncall.schedule.create.title')
          : t('pages.oncall.schedule.edit.title')
      }
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>{t('common.action.cancel')}</Button>
          {canSave && (
            <Tooltip
              title={canManage ? undefined : t('pages.oncall.needManager')}
            >
              <span>
                <Button
                  type="primary"
                  loading={saving}
                  disabled={!canManage || !initialValues}
                  onClick={() => void save()}
                >
                  {isNew
                    ? t('common.action.submitCreate')
                    : t('common.action.save')}
                </Button>
              </span>
            </Tooltip>
          )}
        </Space>
      }
    >
      {initialValues && (
        <>
          {!isNew && (
            <Alert
              type={reanchored ? 'warning' : 'info'}
              showIcon
              style={{ marginBottom: 16 }}
              title={
                reanchored
                  ? t('pages.oncall.schedule.form.reanchored')
                  : t('pages.oncall.schedule.form.saveHint')
              }
            />
          )}
          <Form<ScheduleFormValues>
            form={form}
            layout="vertical"
            disabled={!writable}
            initialValues={initialValues}
            onValuesChange={onValuesChange}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label={t('pages.oncall.schedule.column.name')}
                  rules={[
                    rules.required(t('pages.oncall.schedule.column.name')),
                    rules.max(ONCALL_NAME_MAX),
                  ]}
                >
                  <Input
                    placeholder={t(
                      'pages.oncall.schedule.form.name.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="timezone"
                  label={t('pages.oncall.schedule.column.timezone')}
                  tooltip={t('pages.oncall.schedule.form.timezone.tooltip')}
                  rules={[
                    rules.select(t('pages.oncall.schedule.column.timezone')),
                  ]}
                >
                  <Select
                    showSearch={{ optionFilterProp: 'label' }}
                    options={zones}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('pages.oncall.schedule.column.rotation')}
                  tooltip={t('pages.oncall.schedule.form.rotation.tooltip')}
                  required
                >
                  <Space.Compact block>
                    <Form.Item
                      name="rotationInterval"
                      noStyle
                      rules={[
                        rules.required(
                          t('pages.oncall.schedule.column.rotation'),
                        ),
                      ]}
                    >
                      <InputNumber
                        min={1}
                        max={ONCALL_ROTATION_INTERVAL_MAX[rotationUnit]}
                        precision={0}
                        prefix={t('pages.oncall.schedule.form.rotation.every')}
                        style={{ width: '60%' }}
                      />
                    </Form.Item>
                    <Form.Item name="rotationUnit" noStyle>
                      <Select options={unitOptions} style={{ width: '40%' }} />
                    </Form.Item>
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="anchorTime"
                  label={t('pages.oncall.schedule.form.anchorTime')}
                  tooltip={t('pages.oncall.schedule.form.anchorTime.tooltip')}
                  rules={[
                    rules.select(t('pages.oncall.schedule.form.anchorTime')),
                  ]}
                >
                  <DatePicker
                    showTime={{ format: 'HH:mm' }}
                    format={DATE_TIME_FORMAT}
                    allowClear={false}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="memberIds"
                  label={t('pages.oncall.schedule.form.members')}
                  tooltip={t('pages.oncall.schedule.form.members.tooltip')}
                  rules={[
                    {
                      required: true,
                      type: 'array',
                      message: t('pages.oncall.schedule.form.members.required'),
                    },
                  ]}
                >
                  <RotationList candidates={candidates} disabled={!writable} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="startUserId"
                  label={t('pages.oncall.schedule.form.startUser')}
                  tooltip={t('pages.oncall.schedule.form.startUser.tooltip')}
                >
                  <Select
                    options={memberIds.map((userId) => ({
                      value: userId,
                      label: nameOf(userId),
                    }))}
                    placeholder={t(
                      'pages.oncall.schedule.form.startUser.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="backupEnabled"
                  label={t('pages.oncall.schedule.column.backup')}
                  tooltip={t('pages.oncall.schedule.form.backup.tooltip')}
                  valuePropName="checked"
                  dependencies={['memberIds']}
                  rules={[
                    {
                      // 主备值班人不能是同一个人：开启备值班时名单至少两人
                      validator: (_, value?: boolean) =>
                        value && memberIds.length < 2
                          ? Promise.reject(
                              new Error(
                                t('pages.oncall.schedule.form.backup.needTwo'),
                              ),
                            )
                          : Promise.resolve(),
                    },
                  ]}
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="horizonDays"
                  label={t('pages.oncall.schedule.form.horizonDays')}
                  tooltip={t('pages.oncall.schedule.form.horizonDays.tooltip')}
                  rules={[
                    rules.required(t('pages.oncall.schedule.form.horizonDays')),
                  ]}
                >
                  <InputNumber
                    min={ONCALL_HORIZON_RANGE.min}
                    max={ONCALL_HORIZON_RANGE.max}
                    precision={0}
                    suffix={t('pages.oncall.schedule.form.days')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="remindMinutes"
                  label={t('pages.oncall.schedule.form.remind')}
                  tooltip={t('pages.oncall.schedule.form.remind.tooltip', {
                    max: ONCALL_REMIND_MAX,
                  })}
                >
                  <Select
                    mode="multiple"
                    maxCount={ONCALL_REMIND_MAX}
                    options={remindOptions}
                    placeholder={t(
                      'pages.oncall.schedule.form.remind.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="digestTime"
                  label={t('pages.oncall.schedule.form.digestTime')}
                  tooltip={t('pages.oncall.schedule.form.digestTime.tooltip')}
                >
                  <TimePicker
                    format={DIGEST_FORMAT}
                    minuteStep={5}
                    placeholder={t(
                      'pages.oncall.schedule.form.digestTime.placeholder',
                    )}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="description"
                  label={t('pages.oncall.schedule.form.description')}
                >
                  <Input.TextArea
                    rows={2}
                    maxLength={ONCALL_DESC_MAX}
                    showCount
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </>
      )}
    </Drawer>
  );
};
