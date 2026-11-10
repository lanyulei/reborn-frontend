import { PlusOutlined } from '@ant-design/icons';
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
import { App, Button, Popconfirm } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useRef, useState } from 'react';
import { NOTIFY_SEVERITY_ENUM } from '@/constants';
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
  BizIdFormField,
  BizIdReadonlyField,
  bizIdColumn,
} from '../components/bizScope';

/** 静默规则状态枚举（表格筛选 + 展示）；查询参数经 request 归一化为布尔 */
const SILENCE_ENABLED_ENUM: NonNullable<ProColumns['valueEnum']> = {
  true: { text: '启用', status: 'Success' },
  false: { text: '停用', status: 'Error' },
};

/** 两列栅格：半行 */
const HALF = { span: 12 };

/** 静默表单值（时间窗开关在提交时折叠为可选 time_window；biz 仅创建） */
interface SilenceFormValues {
  bizId?: string;
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

/** 时间窗摘要（表格展示）：支持跨午夜（22:00-08:00），未设置 = 全程 */
const windowText = (window?: NotifySilence['timeWindow']) =>
  window ? `${window.start}-${window.end}（${window.tz || 'UTC'}）` : '全程';

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

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<NotifySilence | null>(null);

  const reload = () => actionRef.current?.reload();

  const hasAnyAction =
    has('notify.silence.edit') || has('notify.silence.delete');

  const columns: ProColumns<NotifySilence>[] = [
    {
      title: '搜索项',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '事件匹配模式' },
    },
    bizIdColumn<NotifySilence>(scope),
    {
      title: '事件匹配模式',
      dataIndex: 'eventPattern',
      copyable: true,
      ellipsis: true,
      // 模糊搜索由「关键字」字段覆盖（后端 keyword 匹配 event_pattern）
      search: false,
    },
    {
      title: '严重级上限',
      dataIndex: 'severityMax',
      valueEnum: NOTIFY_SEVERITY_ENUM,
      width: 110,
      search: false,
    },
    {
      title: '时间窗',
      dataIndex: 'timeWindow',
      search: false,
      ellipsis: true,
      render: (_, record) => windowText(record.timeWindow),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      valueEnum: SILENCE_ENABLED_ENUM,
      width: 90,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: '操作',
      valueType: 'option',
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
              编辑
            </a>,
          );
        }
        if (has('notify.silence.delete')) {
          actions.push(
            <Popconfirm
              key="delete"
              title="删除静默规则"
              description="删除后该规则不再参与匹配，确定删除？"
              onConfirm={async () => {
                await deleteSilence(record.id);
                message.success('删除成功');
                reload();
              }}
            >
              <a style={{ color: '#ff4d4f' }}>删除</a>
            </Popconfirm>,
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
        label="事件匹配模式"
        colProps={HALF}
        tooltip="精确 / 前缀通配（monitor.alert.*）/ 全匹配（*）"
        placeholder="monitor.alert.*"
        rules={[
          { required: true, message: '请输入事件匹配模式' },
          {
            pattern:
              /^(\*|[a-z0-9][a-z0-9._-]{0,127}|[a-z0-9][a-z0-9._-]{0,125}\.\*)$/,
            message: '精确 / 前缀通配（monitor.alert.*）/ 全匹配（*）',
          },
        ]}
      />
      <ProFormSelect
        name="severityMax"
        label="严重级上限"
        colProps={HALF}
        tooltip="该级及以下的事件才可被静默；缺省 2（警告）"
        valueEnum={NOTIFY_SEVERITY_ENUM}
        allowClear
        placeholder="缺省 2（警告）"
      />
      <ProFormSwitch
        name="windowEnabled"
        label="限制时间窗"
        colProps={HALF}
        tooltip="关闭 = 全程静默；更新保存时关闭即清除时间窗"
      />
      <ProFormDependency name={['windowEnabled']}>
        {({ windowEnabled }) =>
          windowEnabled ? (
            <>
              <ProFormTimePicker
                name="windowStart"
                label="窗口起点"
                colProps={HALF}
                tooltip="24 小时制 HH:MM，支持跨午夜（如 22:00→08:00 覆盖夜间）"
                fieldProps={{
                  format: 'HH:mm',
                  minuteStep: 5,
                  style: { width: '100%' },
                }}
                rules={[{ required: true, message: '请选择窗口起点' }]}
              />
              {/* 终点校验依赖起点：经 ProFormDependency 闭包取值（与起点相同 = 零长窗口非法） */}
              <ProFormDependency name={['windowStart']}>
                {({ windowStart }) => (
                  <ProFormTimePicker
                    name="windowEnd"
                    label="窗口终点"
                    colProps={HALF}
                    fieldProps={{
                      format: 'HH:mm',
                      minuteStep: 5,
                      style: { width: '100%' },
                    }}
                    rules={[
                      { required: true, message: '请选择窗口终点' },
                      {
                        validator: (_: unknown, value?: Dayjs) =>
                          value &&
                          windowStart?.format('HH:mm') === value.format('HH:mm')
                            ? Promise.reject(new Error('终点不能与起点相同'))
                            : Promise.resolve(),
                      },
                    ]}
                  />
                )}
              </ProFormDependency>
              <ProFormText
                name="tz"
                label="时区"
                colProps={HALF}
                tooltip="IANA 时区名，缺省 UTC"
                placeholder="Asia/Shanghai"
                rules={[
                  { max: 64, message: '最多 64 位' },
                  {
                    pattern: /^[A-Za-z_]+\/[A-Za-z_+\-0-9]+$/,
                    message: 'IANA 时区名，如 Asia/Shanghai',
                  },
                ]}
              />
            </>
          ) : null
        }
      </ProFormDependency>
      <ProFormSwitch name="enabled" label="启用" colProps={HALF} />
    </>
  );

  return (
    <>
      <ProTable<NotifySilence>
        headerTitle={
          has('notify.silence.create') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setCreateOpen(true);
              }}
            >
              新建静默规则
            </Button>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        request={async (params) => {
          const result = await listSilences({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            bizId: params.bizId || undefined,
            enabled:
              params.enabled === 'true'
                ? true
                : params.enabled === 'false'
                  ? false
                  : undefined,
          });
          return {
            data: result.items,
            total: Number(result.total),
            success: true,
          };
        }}
      />

      {/* 新建静默规则（抽屉）：spec 一次成型；biz 创建后不可改 */}
      <DrawerForm<SilenceFormValues>
        key="create-silence"
        title="新建静默规则"
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
        submitter={{
          searchConfig: { submitText: '创建', resetText: '取消' },
        }}
        onFinish={async (values) => {
          await createSilence({
            bizId: values.bizId || undefined,
            spec: buildSilenceSpec(values),
            enabled: values.enabled ?? true,
          });
          message.success('创建成功');
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
          key={`edit-silence-${editRow.id}`}
          title={`编辑静默规则：${editRow.eventPattern}`}
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
          submitter={{
            searchConfig: { submitText: '保存', resetText: '取消' },
          }}
          onFinish={async (values) => {
            await updateSilence(editRow.id, {
              spec: buildSilenceSpec(values),
              enabled: values.enabled ?? true,
            });
            message.success('保存成功');
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
