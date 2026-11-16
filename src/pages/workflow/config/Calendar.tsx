/**
 * 工作日历：时区、每周工作日、每日工作时段、节假日与调休上班日（全局一份）。
 * 流程里「按工作时间计」的时限（任务超时、定时等待）据此推算；修改只影响此后新算出的时限。
 */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Flex,
  Form,
  Select,
  Spin,
  TimePicker,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { usePermissions } from '@/services/system/permissions';
import { getCalendar, updateCalendar } from '@/services/workflow/config';
import { useFormRules, useT } from '@/utils/i18n';

/** 与后端校验一致的上限 */
const SEGMENT_MAX = 6;
const DAY_MAX = 400;
const TIME_FORMAT = 'HH:mm';
const DATE_FORMAT = 'YYYY-MM-DD';
/** 周一在前（0 = 周日） */
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] as const;
/** 运行环境不支持列举时区时的候选 */
const FALLBACK_TIMEZONES = [
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

const timezones = (): string[] => {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  try {
    const list = intl.supportedValuesOf?.('timeZone');
    if (list?.length) return list.includes('UTC') ? list : [...list, 'UTC'];
  } catch {
    // 落到候选列表
  }
  return FALLBACK_TIMEZONES;
};

interface FormValues {
  timezone: string;
  weekdays: number[];
  segments: { range?: [Dayjs, Dayjs] }[];
  holidays?: Dayjs[];
  workdays?: Dayjs[];
}

/** 时段结束时刻：选择器里的 23:59 表示「到当日结束」，按 24:00 保存（加载时反向转换） */
const DAY_END_PICKED = '23:59';
const DAY_END = '24:00';
const endOf = (d?: Dayjs): string => {
  const text = d?.format(TIME_FORMAT) ?? '';
  return text === DAY_END_PICKED ? DAY_END : text;
};

const toDays = (days: string[]): Dayjs[] => days.map((d) => dayjs(d));
const fromDays = (days?: Dayjs[]): string[] =>
  [...new Set((days ?? []).map((d) => d.format(DATE_FORMAT)))].sort();

export const CalendarForm: React.FC = () => {
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const rules = useFormRules();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const editable = has('workflow.config.calendar');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const calendar = await getCalendar();
      form.setFieldsValue({
        timezone: calendar.timezone,
        weekdays: calendar.weekdays,
        segments: calendar.segments.map((seg) => ({
          range: [
            dayjs(seg.start, TIME_FORMAT),
            // 24:00（当日结束）在选择器里表示为 23:59
            dayjs(seg.end === DAY_END ? DAY_END_PICKED : seg.end, TIME_FORMAT),
          ],
        })),
        holidays: toDays(calendar.holidays),
        workdays: toDays(calendar.workdays),
      });
    } catch {
      // 失败提示由请求层统一弹出
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (values: FormValues) => {
    setSaving(true);
    try {
      await updateCalendar({
        timezone: values.timezone,
        weekdays: [...values.weekdays].sort(),
        segments: values.segments.map((seg) => ({
          start: seg.range?.[0].format(TIME_FORMAT) ?? '',
          end: endOf(seg.range?.[1]),
        })),
        holidays: fromDays(values.holidays),
        workdays: fromDays(values.workdays),
      });
      message.success(t('common.msg.saved'));
    } catch {
      // 失败提示由请求层统一弹出
    } finally {
      setSaving(false);
    }
  };

  /** 各时段须按先后填写且互不重叠（与后端校验一致） */
  const segmentRule = (index: number) => ({
    validator: (_: unknown, range?: [Dayjs, Dayjs]) => {
      if (!range?.[0] || !range[1]) {
        return Promise.reject(
          new Error(t('pages.workflow.calendar.segments.required')),
        );
      }
      const minutes = (d: Dayjs) => d.hour() * 60 + d.minute();
      if (minutes(range[0]) >= minutes(range[1])) {
        return Promise.reject(
          new Error(t('pages.workflow.calendar.segments.order')),
        );
      }
      const prev = (form.getFieldValue(['segments', index - 1, 'range']) ??
        undefined) as [Dayjs, Dayjs] | undefined;
      if (index > 0 && prev?.[1] && minutes(range[0]) < minutes(prev[1])) {
        return Promise.reject(
          new Error(t('pages.workflow.calendar.segments.overlap')),
        );
      }
      return Promise.resolve();
    },
  });

  const dayLimit = {
    validator: (_: unknown, days?: Dayjs[]) =>
      (days?.length ?? 0) > DAY_MAX
        ? Promise.reject(
            new Error(t('pages.workflow.calendar.days.max', { max: DAY_MAX })),
          )
        : Promise.resolve(),
  };

  return (
    <Card variant="borderless">
      <Spin spinning={loading}>
        <Form<FormValues>
          form={form}
          layout="vertical"
          disabled={!editable}
          style={{ maxWidth: 720 }}
          onFinish={save}
        >
          <Form.Item
            name="timezone"
            label={t('pages.workflow.calendar.timezone')}
            tooltip={t('pages.workflow.calendar.timezone.tooltip')}
            rules={[rules.select(t('pages.workflow.calendar.timezone'))]}
          >
            <Select
              showSearch
              options={timezones().map((tz) => ({ value: tz, label: tz }))}
            />
          </Form.Item>
          <Form.Item
            name="weekdays"
            label={t('pages.workflow.calendar.weekdays')}
            rules={[
              {
                required: true,
                type: 'array',
                message: rules.select(t('pages.workflow.calendar.weekdays'))
                  .message,
              },
            ]}
          >
            <Checkbox.Group
              options={WEEKDAYS.map((day) => ({
                value: day,
                label: t(`pages.workflow.calendar.weekday.${day}`),
              }))}
            />
          </Form.Item>
          <Form.Item
            label={t('pages.workflow.calendar.segments')}
            tooltip={t('pages.workflow.calendar.segments.tooltip')}
            required
          >
            <Form.List name="segments">
              {(fields, { add, remove }) => (
                <Flex vertical gap={8}>
                  {fields.map((field, index) => (
                    <Flex key={field.key} gap={8} align="start">
                      <Form.Item
                        name={[field.name, 'range']}
                        noStyle
                        dependencies={[['segments']]}
                        rules={[segmentRule(index)]}
                      >
                        <TimePicker.RangePicker
                          format={TIME_FORMAT}
                          needConfirm={false}
                        />
                      </Form.Item>
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        aria-label={t('common.action.delete')}
                        disabled={fields.length <= 1}
                        onClick={() => remove(field.name)}
                      />
                    </Flex>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    style={{ alignSelf: 'flex-start' }}
                    disabled={fields.length >= SEGMENT_MAX}
                    onClick={() => add({})}
                  >
                    {t('pages.workflow.calendar.segments.add')}
                  </Button>
                </Flex>
              )}
            </Form.List>
          </Form.Item>
          <Form.Item
            name="holidays"
            label={t('pages.workflow.calendar.holidays')}
            tooltip={t('pages.workflow.calendar.holidays.tooltip')}
            rules={[dayLimit]}
          >
            <DatePicker multiple maxTagCount="responsive" />
          </Form.Item>
          <Form.Item
            name="workdays"
            label={t('pages.workflow.calendar.workdays')}
            tooltip={t('pages.workflow.calendar.workdays.tooltip')}
            rules={[dayLimit]}
          >
            <DatePicker multiple maxTagCount="responsive" />
          </Form.Item>
          {editable && (
            <Button type="primary" htmlType="submit" loading={saving}>
              {t('common.action.save')}
            </Button>
          )}
        </Form>
      </Spin>
    </Card>
  );
};

export default CalendarForm;
