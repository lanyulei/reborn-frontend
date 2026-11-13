import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDependency,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTimePicker,
  ProTable,
} from '@ant-design/pro-components';
import { App } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  ENABLED_META,
  NOTIFY_EVENT_PATTERN_REGEX,
  NOTIFY_SEVERITY_META,
} from '@/constants';
import { useBizScope } from '@/services/notify/hooks';
import type { SilenceSpecPayload } from '@/services/notify/silence';
import {
  createSilence,
  deleteSilence,
  getSilence,
  listSilences,
  updateSilence,
} from '@/services/notify/silence';
import type { NotifySilence } from '@/services/notify/typings';
import { usePermissions } from '@/services/system/permissions';
import {
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import {
  BizIdFormField,
  BizIdReadonlyField,
  useBizIdColumn,
} from '../components/bizScope';

const SEVERITY_ORDER = [1, 2, 3, 4] as const;

/** 两列栅格：半行 */
const HALF = { span: 12 };

/** 静默表单值（时间窗开关在提交时折叠为可选 time_window；biz 仅创建） */
interface SilenceFormValues {
  bizId?: string;
  name?: string;
  description?: string;
  eventPattern: string;
  severityMax?: number;
  /** 是否限制时间窗（关 = 全程静默；更新时语义为清除窗口） */
  windowEnabled?: boolean;
  windowStart?: Dayjs;
  windowEnd?: Dayjs;
  tz?: string;
  enabled?: boolean;
}

/** 表单值 → 静默规则载荷（未开时间窗则不携带，整组替换语义下即清除） */
const buildSilenceSpec = (values: SilenceFormValues): SilenceSpecPayload => ({
  // 名称 / 说明恒携带：spec 整组替换，留空即清除
  name: values.name?.trim() ?? '',
  description: values.description?.trim() ?? '',
  eventPattern: values.eventPattern,
  ...(values.severityMax != null && { severityMax: values.severityMax }),
  ...(values.windowEnabled && {
    timeWindow: {
      start: values.windowStart?.format('HH:mm') ?? '00:00',
      end: values.windowEnd?.format('HH:mm') ?? '00:00',
      ...(values.tz ? { tz: values.tz } : {}),
    },
  }),
});

/**
 * 通知静默（免打扰）：事件命中任一启用规则（模式匹配 + 严重级 ≤ 上限 +
 * 当前时间落时间窗）即抑制，不再生成通知任务；多条规则重叠，任一命中即抑制。
 * 表单最多 8 字段（含时间窗展开）→ 抽屉 + 两列栅格。
 */
const SilenceList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const scope = useBizScope();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const enabledEnum = useValueEnum(ENABLED_META);
  const severityEnum = useValueEnum(NOTIFY_SEVERITY_META);
  // 表单用数值选项：valueEnum 的键是字符串，编辑回显的数值匹配不到标签
  const severityOptions = useOptions(NOTIFY_SEVERITY_META, SEVERITY_ORDER);
  const bizIdColumn = useBizIdColumn<NotifySilence>(scope);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<NotifySilence | null>(null);

  const reload = () => actionRef.current?.reload();

  const hasAnyAction =
    has('notify.silence.edit') || has('notify.silence.delete');

  /** 时间窗摘要（表格展示）：支持跨午夜（22:00-08:00），未设置 = 全程 */
  const windowText = (window?: NotifySilence['timeWindow']) =>
    window
      ? t('pages.notify.silence.window.summary', {
          start: window.start,
          end: window.end,
          tz: window.tz || 'UTC',
        })
      : t('pages.notify.silence.window.always');

  const columns: ProColumns<NotifySilence>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.notify.common.keyword.placeholder') },
    },
    bizIdColumn,
    {
      title: t('pages.notify.common.name'),
      dataIndex: 'name',
      ellipsis: true,
      search: false,
      render: (_, record) =>
        record.name ? (
          <span title={record.description || undefined}>{record.name}</span>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.notify.common.eventPattern'),
      dataIndex: 'eventPattern',
      copyable: true,
      ellipsis: true,
      // 模糊搜索由「关键字」字段覆盖（后端 keyword 匹配 name / event_pattern）
      search: false,
    },
    {
      title: t('pages.notify.silence.column.severityMax'),
      dataIndex: 'severityMax',
      valueEnum: severityEnum,
      width: 110,
      search: false,
    },
    {
      title: t('pages.notify.silence.column.timeWindow'),
      dataIndex: 'timeWindow',
      search: false,
      ellipsis: true,
      render: (_, record) => windowText(record.timeWindow),
    },
    {
      title: t('common.column.status'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
    },
    {
      title: t('common.column.updateTime'),
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 100,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('notify.silence.edit')) {
          actions.push(
            <a
              key="edit"
              onClick={() => {
                setEditRow(record);
              }}
            >
              {t('common.action.edit')}
            </a>,
          );
        }
        if (has('notify.silence.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.notify.silence.delete.title')}
              description={t('pages.notify.silence.delete.description')}
              onConfirm={async () => {
                await deleteSilence(record.id);
                message.success(t('common.msg.deleted'));
                reload();
              }}
            />,
          );
        }
        return actions;
      },
    },
  ];

  /**
   * 新建/编辑共用字段组（业务字段由调用方置于最前，与事件模式同行）：
   * 事件模式 / 严重级上限 + 限制时间窗 / [起点 + 终点 / 时区] / 启用。
   */
  const silenceFields = (
    <>
      <ProFormText
        name="eventPattern"
        label={t('pages.notify.common.eventPattern')}
        colProps={HALF}
        tooltip={t('pages.notify.common.eventPattern.rule')}
        placeholder="monitor.alert.*"
        rules={[
          rules.required(t('pages.notify.common.eventPattern')),
          {
            pattern: NOTIFY_EVENT_PATTERN_REGEX,
            message: t('pages.notify.common.eventPattern.rule'),
          },
        ]}
      />
      <ProFormText
        name="name"
        label={t('pages.notify.common.name')}
        colProps={HALF}
        placeholder={t('pages.notify.common.name.placeholder')}
        rules={[rules.max(64)]}
      />
      <ProFormText
        name="description"
        label={t('pages.notify.common.description')}
        colProps={HALF}
        rules={[rules.max(255)]}
      />
      <ProFormSelect
        name="severityMax"
        label={t('pages.notify.silence.column.severityMax')}
        colProps={HALF}
        tooltip={t('pages.notify.silence.form.severityMax.tooltip')}
        options={severityOptions}
        allowClear
        placeholder={t('pages.notify.silence.form.severityMax.placeholder')}
      />
      <ProFormSwitch
        name="windowEnabled"
        label={t('pages.notify.silence.form.windowEnabled')}
        colProps={HALF}
        tooltip={t('pages.notify.silence.form.windowEnabled.tooltip')}
      />
      <ProFormDependency name={['windowEnabled']}>
        {({ windowEnabled }) =>
          windowEnabled ? (
            <>
              <ProFormTimePicker
                name="windowStart"
                label={t('pages.notify.silence.form.windowStart')}
                colProps={HALF}
                tooltip={t('pages.notify.silence.form.windowStart.tooltip')}
                fieldProps={{
                  format: 'HH:mm',
                  minuteStep: 5,
                  style: { width: '100%' },
                }}
                rules={[
                  rules.select(t('pages.notify.silence.form.windowStart')),
                ]}
              />
              {/* 终点校验依赖起点：经 ProFormDependency 闭包取值（与起点相同 = 零长窗口非法） */}
              <ProFormDependency name={['windowStart']}>
                {({ windowStart }) => (
                  <ProFormTimePicker
                    name="windowEnd"
                    label={t('pages.notify.silence.form.windowEnd')}
                    colProps={HALF}
                    fieldProps={{
                      format: 'HH:mm',
                      minuteStep: 5,
                      style: { width: '100%' },
                    }}
                    rules={[
                      rules.select(t('pages.notify.silence.form.windowEnd')),
                      {
                        validator: (_: unknown, value?: Dayjs) =>
                          value &&
                          windowStart?.format('HH:mm') === value.format('HH:mm')
                            ? Promise.reject(
                                new Error(
                                  t(
                                    'pages.notify.silence.form.windowEnd.sameAsStart',
                                  ),
                                ),
                              )
                            : Promise.resolve(),
                      },
                    ]}
                  />
                )}
              </ProFormDependency>
              <ProFormText
                name="tz"
                label={t('pages.notify.silence.form.tz')}
                colProps={HALF}
                tooltip={t('pages.notify.silence.form.tz.tooltip')}
                placeholder="Asia/Shanghai"
                rules={[
                  rules.max(64),
                  {
                    pattern: /^[A-Za-z_]+\/[A-Za-z_+\-0-9]+$/,
                    message: t('pages.notify.silence.form.tz.rule'),
                  },
                ]}
              />
            </>
          ) : null
        }
      </ProFormDependency>
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        colProps={HALF}
      />
    </>
  );

  return (
    <>
      <ProTable<NotifySilence>
        cardBordered
        headerTitle={
          has('notify.silence.create') && (
            <CreateButton
              onClick={() => {
                setCreateOpen(true);
              }}
            >
              {t('pages.notify.silence.create.title')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          const result = await listSilences({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            bizId: params.bizId || undefined,
            enabled: parseBoolParam(params.enabled),
          });
          return toTableResult(result);
        }}
      />

      {/* 新建静默规则（抽屉）：spec 一次成型；biz 创建后不可改 */}
      <DrawerForm<SilenceFormValues>
        // 保持 Dayjs 原值：默认 string 会转成字符串，提交时 .format / .toISOString 抛错
        dateFormatter={false}
        key="create-silence"
        title={t('pages.notify.silence.create.title')}
        width={720}
        grid
        rowProps={{ gutter: 16 }}
        open={createOpen}
        onOpenChange={setCreateOpen}
        drawerProps={{ destroyOnHidden: true }}
        initialValues={{
          enabled: true,
          severityMax: 2,
          bizId: scope.restricted ? scope.defaultBizId : undefined,
        }}
        submitter={submitter.create}
        onFinish={async (values) => {
          await createSilence({
            bizId: values.bizId || undefined,
            spec: buildSilenceSpec(values),
            enabled: values.enabled ?? true,
          });
          message.success(t('common.msg.created'));
          reload();
          return true;
        }}
      >
        <BizIdFormField scope={scope} colProps={HALF} />
        {silenceFields}
      </DrawerForm>

      {/* 编辑静默规则（抽屉）：spec 整组替换，enabled 独立启停；打开时拉取详情；业务只读占位 */}
      {editRow && (
        <DrawerForm<SilenceFormValues>
          // 保持 Dayjs 原值：默认 string 会转成字符串，提交时 .format / .toISOString 抛错
          dateFormatter={false}
          key={`edit-silence-${editRow.id}`}
          title={t('pages.notify.silence.edit.title', {
            name: editRow.name || editRow.eventPattern,
          })}
          width={720}
          grid
          rowProps={{ gutter: 16 }}
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          drawerProps={{ destroyOnHidden: true }}
          params={{ id: editRow.id }}
          request={async ({ id }) => {
            const { silence } = await getSilence(id);
            return {
              name: silence.name,
              description: silence.description,
              eventPattern: silence.eventPattern,
              severityMax: silence.severityMax,
              windowEnabled: !!silence.timeWindow,
              windowStart: silence.timeWindow
                ? dayjs(silence.timeWindow.start, 'HH:mm')
                : undefined,
              windowEnd: silence.timeWindow
                ? dayjs(silence.timeWindow.end, 'HH:mm')
                : undefined,
              tz: silence.timeWindow?.tz,
              enabled: silence.enabled,
            };
          }}
          submitter={submitter.save}
          onFinish={async (values) => {
            await updateSilence(editRow.id, {
              spec: buildSilenceSpec(values),
              enabled: values.enabled ?? true,
            });
            message.success(t('common.msg.saved'));
            reload();
            return true;
          }}
        >
          <BizIdReadonlyField bizId={editRow.bizId} colProps={HALF} />
          {silenceFields}
        </DrawerForm>
      )}
    </>
  );
};

export default SilenceList;
