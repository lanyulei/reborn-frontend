import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  NOTIFY_TEMPLATE_CHANNEL_ENUM,
  NOTIFY_TEMPLATE_CHANNEL_TEXT,
} from '@/constants';
import { useBizScope } from '@/services/notify/hooks';
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
} from '@/services/notify/template';
import type {
  NotifyTemplate,
  NotifyTemplateChannelType,
} from '@/services/notify/typings';
import { usePermissions } from '@/services/system/permissions';
import {
  BizIdFormField,
  BizIdReadonlyField,
  bizIdColumn,
} from '../components/bizScope';

/** 模板状态枚举（表格筛选 + 展示）；查询参数经 request 归一化为布尔 */
const TEMPLATE_ENABLED_ENUM: NonNullable<ProColumns['valueEnum']> = {
  true: { text: '启用', status: 'Success' },
  false: { text: '停用', status: 'Error' },
};

/** 两列栅格：半行 / 整行 */
const HALF = { span: 12 };
const FULL = { span: 24 };

/** 模板表单值（扁平结构，与更新接口的可选字段一一对应；biz 仅创建） */
interface TemplateFormValues {
  bizId?: string;
  eventType: string;
  channelType: NotifyTemplateChannelType;
  subject: string;
  body: string;
  enabled?: boolean;
}

/**
 * 通知模板：按 biz × 事件类型 × 渠道类型三维覆盖（'*' 通配），渲染解析链
 * (biz,event,channel) > (biz,event,*) > (biz,*,channel) > (biz,*,*) > 内置默认。
 * subject/body 为 Go template；任何更新 version+1，历史通知可复现。
 * 表单 6 字段 → 模态框 + 两列栅格（正文独占一行）。
 */
const TemplateList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const scope = useBizScope();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<NotifyTemplate | null>(null);

  const reload = () => actionRef.current?.reload();

  const hasAnyAction =
    has('notify.template.edit') || has('notify.template.delete');

  const columns: ProColumns<NotifyTemplate>[] = [
    {
      title: '搜索项',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '事件类型 / 渠道 / 标题' },
    },
    bizIdColumn<NotifyTemplate>(scope),
    {
      title: '事件类型',
      dataIndex: 'eventType',
      copyable: true,
      ellipsis: true,
      // 模糊搜索由「关键字」字段覆盖（后端 keyword 匹配三维与标题）
      search: false,
      render: (_, record) =>
        record.eventType === '*' ? (
          <Tag>{record.eventType}</Tag>
        ) : (
          record.eventType
        ),
    },
    {
      title: '渠道类型',
      dataIndex: 'channelType',
      valueEnum: NOTIFY_TEMPLATE_CHANNEL_ENUM,
      width: 120,
      render: (_, record) =>
        record.channelType === '*' ? (
          <Tag>{record.channelType}</Tag>
        ) : (
          NOTIFY_TEMPLATE_CHANNEL_TEXT[record.channelType]
        ),
    },
    {
      title: '标题模板',
      dataIndex: 'subject',
      ellipsis: true,
      search: false,
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 80,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      valueEnum: TEMPLATE_ENABLED_ENUM,
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
        if (has('notify.template.edit')) {
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
        if (has('notify.template.delete')) {
          actions.push(
            <Popconfirm
              key="delete"
              title="删除模板"
              description="删除后三维组合可复用，历史投递记录不受影响，确定删除？"
              onConfirm={async () => {
                await deleteTemplate(record.id);
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
   * 新建/编辑共用字段组（业务字段由调用方置于最前）：
   * 事件类型 + 渠道类型 / 标题 / 正文独占一行 / 启用。
   */
  const templateFields = (
    <>
      <ProFormText
        name="eventType"
        label="事件类型"
        colProps={HALF}
        tooltip="精确匹配或 '*' 通配；'*' 之外的值为小写字母/数字开头的点分串"
        placeholder="monitor.alert.firing 或 *"
        rules={[
          { required: true, message: '请输入事件类型' },
          {
            pattern: /^(\*|[a-z0-9][a-z0-9._-]{0,127})$/,
            message: "'*' 或小写字母/数字开头的点分串，最长 128 位",
          },
        ]}
      />
      <ProFormSelect
        name="channelType"
        label="渠道类型"
        colProps={HALF}
        tooltip="三维覆盖的渠道维度，可选 '*' 通配"
        valueEnum={NOTIFY_TEMPLATE_CHANNEL_ENUM}
        rules={[{ required: true, message: '请选择渠道类型' }]}
      />
      <ProFormText
        name="subject"
        label="标题模板"
        colProps={HALF}
        tooltip="邮件主题/机器人标题，Go template 语法"
        placeholder="告警：{{ .Title }}"
        rules={[
          { required: true, message: '请输入标题模板' },
          { max: 255, message: '最多 255 位' },
        ]}
      />
      <ProFormTextArea
        name="body"
        label="正文模板"
        colProps={FULL}
        tooltip={{
          title: 'Go template 语法',
          content:
            '可用变量：Title / Payload / Severity / Count / Samples / BizID / EventTime',
        }}
        fieldProps={{
          rows: 8,
          placeholder: '事件：{{ .Title }}\n业务：{{ .BizID }}',
        }}
        rules={[
          { required: true, message: '请输入正文模板' },
          { max: 32768, message: '最多 32768 位' },
        ]}
      />
      <ProFormSwitch name="enabled" label="启用" colProps={HALF} />
    </>
  );

  return (
    <>
      <ProTable<NotifyTemplate>
        headerTitle={
          has('notify.template.create') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setCreateOpen(true);
              }}
            >
              新建模板
            </Button>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        request={async (params) => {
          const result = await listTemplates({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            bizId: params.bizId || undefined,
            channelType: params.channelType as
              | NotifyTemplateChannelType
              | undefined,
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

      {/* 新建模板：同 biz 内 (事件类型, 渠道类型) 组合唯一；biz 创建后不可改。
          栅格：业务 + 事件类型 / 渠道类型 + 标题 / 正文 / 启用 */}
      <ModalForm<TemplateFormValues>
        key="create-template"
        title="新建模板"
        width={640}
        grid
        rowProps={{ gutter: 16 }}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{
          enabled: true,
          bizId: scope.restricted ? scope.defaultBizId : undefined,
        }}
        submitter={{
          searchConfig: { submitText: '创建', resetText: '取消' },
        }}
        onFinish={async (values) => {
          await createTemplate({
            bizId: values.bizId || undefined,
            eventType: values.eventType,
            channelType: values.channelType,
            subject: values.subject,
            body: values.body,
            enabled: values.enabled ?? true,
          });
          message.success('创建成功');
          reload();
          return true;
        }}
      >
        <BizIdFormField scope={scope} colProps={HALF} />
        {templateFields}
      </ModalForm>

      {/* 编辑模板：任何更新 version+1；打开时拉取详情；业务只读占位保持栅格一致 */}
      {editRow && (
        <ModalForm<TemplateFormValues>
          key={`edit-template-${editRow.id}`}
          title={`编辑模板：${editRow.eventType}`}
          width={640}
          grid
          rowProps={{ gutter: 16 }}
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          params={{ id: editRow.id }}
          request={async ({ id }) => {
            const { template } = await getTemplate(id);
            return {
              eventType: template.eventType,
              channelType: template.channelType,
              subject: template.subject,
              body: template.body,
              enabled: template.enabled,
            };
          }}
          submitter={{
            searchConfig: { submitText: '保存', resetText: '取消' },
          }}
          onFinish={async (values) => {
            await updateTemplate(editRow.id, {
              eventType: values.eventType,
              channelType: values.channelType,
              subject: values.subject,
              body: values.body,
              enabled: values.enabled ?? true,
            });
            message.success('保存成功');
            reload();
            return true;
          }}
        >
          <BizIdReadonlyField bizId={editRow.bizId} colProps={HALF} />
          {templateFields}
        </ModalForm>
      )}
    </>
  );
};

export default TemplateList;
