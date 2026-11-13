import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { ENABLED_META, NOTIFY_TEMPLATE_CHANNEL_META } from '@/constants';
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
  NotifyTemplateFormat,
} from '@/services/notify/typings';
import { usePermissions } from '@/services/system/permissions';
import {
  useEnumText,
  useFormRules,
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

/** 输出格式（格式名是协议值，不翻译）：渠道按能力降级，见表单提示 */
const FORMAT_LABELS: Record<string, string> = {
  text: 'Text',
  markdown: 'Markdown',
  html: 'HTML',
  card: 'Card',
};
const FORMAT_OPTIONS = Object.entries(FORMAT_LABELS).map(([value, label]) => ({
  value,
  label,
}));

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
  /** 输出格式（缺省 text） */
  format?: NotifyTemplateFormat;
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
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const enabledEnum = useValueEnum(ENABLED_META);
  const channelEnum = useValueEnum(NOTIFY_TEMPLATE_CHANNEL_META);
  const channelText = useEnumText(NOTIFY_TEMPLATE_CHANNEL_META);
  const bizIdColumn = useBizIdColumn<NotifyTemplate>(scope);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<NotifyTemplate | null>(null);

  const reload = () => actionRef.current?.reload();

  const hasAnyAction =
    has('notify.template.edit') || has('notify.template.delete');

  const columns: ProColumns<NotifyTemplate>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.notify.template.search.placeholder'),
      },
    },
    bizIdColumn,
    {
      title: t('pages.notify.template.column.eventType'),
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
      title: t('pages.notify.template.column.channelType'),
      dataIndex: 'channelType',
      valueEnum: channelEnum,
      width: 120,
      render: (_, record) =>
        record.channelType === '*' ? (
          <Tag>{record.channelType}</Tag>
        ) : (
          channelText(record.channelType)
        ),
    },
    {
      title: t('pages.notify.template.column.subject'),
      dataIndex: 'subject',
      ellipsis: true,
      width: 200,
      search: false,
    },
    {
      title: t('pages.notify.template.column.format'),
      dataIndex: 'format',
      width: 100,
      search: false,
      renderText: (value?: string) => FORMAT_LABELS[value || 'text'] ?? value,
    },
    {
      title: t('pages.notify.template.column.version'),
      dataIndex: 'version',
      width: 80,
      search: false,
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
        if (has('notify.template.edit')) {
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
        if (has('notify.template.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.notify.template.delete.title')}
              description={t('pages.notify.template.delete.description')}
              onConfirm={async () => {
                await deleteTemplate(record.id);
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
   * 新建/编辑共用字段组（业务字段由调用方置于最前）：
   * 事件类型 + 渠道类型 / 标题 / 正文独占一行 / 启用。
   * Go template 示例经 ICU 占位传入（{{ }} 是 ICU 语法字符，不能直接写进语言包）。
   */
  const templateFields = (
    <>
      <ProFormText
        name="eventType"
        label={t('pages.notify.template.column.eventType')}
        colProps={HALF}
        tooltip={t('pages.notify.template.form.eventType.tooltip')}
        placeholder={t('pages.notify.template.form.eventType.placeholder')}
        rules={[
          rules.required(t('pages.notify.template.column.eventType')),
          {
            pattern: /^(\*|[a-z0-9][a-z0-9._-]{0,127})$/,
            message: t('pages.notify.template.form.eventType.rule'),
          },
        ]}
      />
      <ProFormSelect
        name="channelType"
        label={t('pages.notify.template.column.channelType')}
        colProps={HALF}
        tooltip={t('pages.notify.template.form.channelType.tooltip')}
        valueEnum={channelEnum}
        rules={[rules.select(t('pages.notify.template.column.channelType'))]}
      />
      <ProFormText
        name="subject"
        label={t('pages.notify.template.column.subject')}
        colProps={HALF}
        tooltip={t('pages.notify.template.form.subject.tooltip')}
        placeholder={t('pages.notify.template.form.subject.placeholder', {
          title: '{{ .Title }}',
        })}
        rules={[
          rules.required(t('pages.notify.template.column.subject')),
          rules.max(255),
        ]}
      />
      <ProFormTextArea
        name="body"
        label={t('pages.notify.template.form.body')}
        colProps={FULL}
        tooltip={{
          title: t('pages.notify.template.form.body.tooltip.title'),
          content: t('pages.notify.template.form.body.tooltip.content'),
        }}
        fieldProps={{
          rows: 8,
          placeholder: t('pages.notify.template.form.body.placeholder', {
            title: '{{ .Title }}',
            biz: '{{ .BizID }}',
          }),
        }}
        rules={[
          rules.required(t('pages.notify.template.form.body')),
          rules.max(32768),
        ]}
      />
      <ProFormSelect
        name="format"
        label={t('pages.notify.template.column.format')}
        colProps={HALF}
        tooltip={t('pages.notify.template.form.format.tooltip')}
        allowClear={false}
        options={FORMAT_OPTIONS}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        colProps={HALF}
      />
    </>
  );

  return (
    <>
      <ProTable<NotifyTemplate>
        cardBordered
        headerTitle={
          has('notify.template.create') && (
            <CreateButton
              onClick={() => {
                setCreateOpen(true);
              }}
            >
              {t('pages.notify.template.create.title')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          const result = await listTemplates({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            bizId: params.bizId || undefined,
            channelType: params.channelType as
              | NotifyTemplateChannelType
              | undefined,
            enabled: parseBoolParam(params.enabled),
          });
          return toTableResult(result);
        }}
      />

      {/* 新建模板：同 biz 内 (事件类型, 渠道类型) 组合唯一；biz 创建后不可改。
          栅格：业务 + 事件类型 / 渠道类型 + 标题 / 正文 / 启用 */}
      <ModalForm<TemplateFormValues>
        key="create-template"
        title={t('pages.notify.template.create.title')}
        width={640}
        grid
        rowProps={{ gutter: 16 }}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{
          enabled: true,
          format: 'text',
          bizId: scope.restricted ? scope.defaultBizId : undefined,
        }}
        submitter={submitter.create}
        onFinish={async (values) => {
          await createTemplate({
            bizId: values.bizId || undefined,
            eventType: values.eventType,
            channelType: values.channelType,
            subject: values.subject,
            body: values.body,
            format: values.format ?? 'text',
            enabled: values.enabled ?? true,
          });
          message.success(t('common.msg.created'));
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
          title={t('pages.notify.template.edit.title', {
            name: editRow.eventType,
          })}
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
              format: template.format || 'text',
              enabled: template.enabled,
            };
          }}
          submitter={submitter.save}
          onFinish={async (values) => {
            await updateTemplate(editRow.id, {
              eventType: values.eventType,
              channelType: values.channelType,
              subject: values.subject,
              body: values.body,
              format: values.format ?? 'text',
              enabled: values.enabled ?? true,
            });
            message.success(t('common.msg.saved'));
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
