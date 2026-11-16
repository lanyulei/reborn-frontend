/**
 * 工单模板的新建 / 编辑抽屉：基本信息（所属分类、绑定的流程、编号前缀）、表单字段、
 * SLA（按优先级的响应 / 解决时限与超时升级对象）以及提单时是否关联 CMDB 资源。
 * 模板保存后只影响之后提交的工单：已有工单保存的是提单时的表单。
 */
import {
  DrawerForm,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, Col, Form } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { IconPicker } from '@/components/IconPicker';
import { type UserOption, UserSelect } from '@/components/UserSelect';
import { SectionTitle } from '@/pages/workflow/components/InstanceDetail';
import { fetchWorkflowUsers } from '@/pages/workflow/components/meta';
import { createTemplate, getTemplate, updateTemplate } from '@/services/ticket';
import type {
  CiLink,
  FormColumns,
  SlaRule,
  TemplateStatus,
  TicketCategory,
  TicketFormField,
} from '@/services/ticket/typings';
import { listDefinitions } from '@/services/workflow/definition';
import { useFormRules, useOptions, useSubmitter, useT } from '@/utils/i18n';
import { fetchAllPages } from '@/utils/paging';
import {
  FORM_COLUMNS,
  TEMPLATE_STATUS_META,
  TEMPLATE_STATUS_ORDER,
  TICKET_ICON,
} from '../components/meta';
import { FieldsEditor } from './FieldsEditor';
import { SlaEditor, slaRuleComplete, slaRuleInverted } from './SlaEditor';

const NAME_MAX = 64;
const DESCRIPTION_MAX = 255;
/** 复制时为名称后缀（「 副本」/「 (copy)」）预留的长度 */
const COPY_SUFFIX_RESERVE = 8;
const SORT_MAX = 9999;
/** 编号前缀格式（与后端 proto 校验一致） */
const PREFIX_PATTERN = /^[A-Z]{2,8}$/;
const HALF = { span: 12 };
/** 升级通知对象人数上限（与后端 proto 校验一致） */
const ESCALATE_MAX = 10;
const CI_LINKS: readonly CiLink[] = [0, 1, 2];

interface TemplateValues {
  name: string;
  categoryId: string;
  workflowKey: string;
  numberPrefix: string;
  status: TemplateStatus;
  sort?: number;
  icon?: string;
  description?: string;
  formColumns?: FormColumns;
  form?: TicketFormField[];
  sla?: SlaRule[];
  slaEscalateTo?: string[];
  ciLink?: CiLink;
}

export const TemplateDrawer: React.FC<{
  /** 编辑的模板 ID；空串 = 新建；undefined = 关闭 */
  templateId?: string;
  /** 复制的来源模板 ID（仅新建时有效）：以它的内容预填，名称加「副本」后缀 */
  copyFrom?: string;
  categories: readonly TicketCategory[];
  onClose: () => void;
  /** 保存成功后回调（重新加载目录） */
  onSaved: () => void;
}> = ({ templateId, copyFrom, categories, onClose, onSaved }) => {
  const { message } = App.useApp();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const statusOptions = useOptions(TEMPLATE_STATUS_META, TEMPLATE_STATUS_ORDER);
  const editing = !!templateId;
  // 升级通知对象的显示名（编辑时由模板详情带回，用于回显）
  const [knownUsers, setKnownUsers] = useState<UserOption[]>([]);

  if (templateId === undefined) return null;

  return (
    <DrawerForm<TemplateValues>
      key={templateId || (copyFrom ? `copy-${copyFrom}` : 'create-template')}
      title={t(
        editing
          ? 'pages.ticket.template.edit'
          : copyFrom
            ? 'pages.ticket.template.copy'
            : 'pages.ticket.template.create',
      )}
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true }}
      submitter={editing ? submitter.save : submitter.create}
      params={{ id: templateId || copyFrom }}
      request={async ({ id }) => {
        if (!id) {
          return {
            status: 1,
            sort: 0,
            formColumns: 1,
            form: [],
            sla: [],
            slaEscalateTo: [],
            ciLink: 0,
          } as Partial<TemplateValues> as TemplateValues;
        }
        let template: Awaited<ReturnType<typeof getTemplate>>['template'];
        try {
          ({ template } = await getTemplate(id));
        } catch {
          // 失败提示由请求层统一弹出；关掉抽屉，而不是一直转圈
          onClose();
          return {} as TemplateValues;
        }
        setKnownUsers(
          Object.entries(template.labels ?? {}).map(([uid, label]) => ({
            id: uid,
            label,
          })),
        );
        return {
          // 模板名称不能重复：复制时加后缀，超长则截短原名
          name: editing
            ? template.name
            : t('pages.ticket.template.copy.name', {
                name: template.name.slice(0, NAME_MAX - COPY_SUFFIX_RESERVE),
              }),
          categoryId: template.categoryId,
          workflowKey: template.workflowKey,
          numberPrefix: template.numberPrefix,
          status: template.status ?? 0,
          sort: template.sort ?? 0,
          icon: template.icon ?? '',
          formColumns: template.formColumns ?? 1,
          description: template.description ?? '',
          form: template.form ?? [],
          sla: template.sla ?? [],
          slaEscalateTo: template.slaEscalateTo ?? [],
          ciLink: template.ciLink ?? 0,
        };
      }}
      onFinish={async (values) => {
        const spec = {
          name: values.name.trim(),
          categoryId: values.categoryId,
          workflowKey: values.workflowKey,
          numberPrefix: values.numberPrefix,
          status: values.status,
          sort: values.sort ?? 0,
          icon: values.icon ?? '',
          formColumns: values.formColumns ?? 1,
          description: values.description ?? '',
          form: values.form ?? [],
          sla: values.sla ?? [],
          slaEscalateTo: values.slaEscalateTo ?? [],
          ciLink: values.ciLink ?? 0,
        };
        if (editing) await updateTemplate(templateId, spec);
        else await createTemplate(spec);
        message.success(t(editing ? 'common.msg.saved' : 'common.msg.created'));
        onSaved();
        return true;
      }}
    >
      <ProFormText
        colProps={HALF}
        name="name"
        label={t('pages.ticket.template.name')}
        rules={[
          {
            required: true,
            whitespace: true,
            message: t('common.validation.required', {
              label: t('pages.ticket.template.name'),
            }),
          },
          rules.max(NAME_MAX),
        ]}
      />
      <ProFormSelect
        colProps={HALF}
        name="categoryId"
        label={t('pages.ticket.template.category')}
        allowClear={false}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
        rules={[rules.select(t('pages.ticket.template.category'))]}
      />
      <ProFormSelect
        colProps={HALF}
        name="workflowKey"
        label={t('pages.ticket.template.workflow')}
        tooltip={t('pages.ticket.template.workflow.tooltip')}
        showSearch
        allowClear={false}
        // 只列出已发布且启用的流程：其余的提单时无法发起
        request={async () => {
          const items = await fetchAllPages((page, pageSize) =>
            listDefinitions({ page, pageSize, status: 1, published: true }),
          );
          return items.map((d) => ({ value: d.key, label: d.name }));
        }}
        rules={[rules.select(t('pages.ticket.template.workflow'))]}
      />
      <ProFormText
        colProps={HALF}
        name="numberPrefix"
        label={t('pages.ticket.template.prefix')}
        tooltip={t('pages.ticket.template.prefix.tooltip')}
        placeholder="REQ"
        rules={[
          rules.required(t('pages.ticket.template.prefix')),
          {
            pattern: PREFIX_PATTERN,
            message: t('pages.ticket.template.prefix.pattern'),
          },
        ]}
      />
      <Col span={12}>
        <Form.Item
          name="icon"
          label={t('pages.ticket.template.icon')}
          tooltip={t('pages.ticket.template.icon.tooltip')}
        >
          <IconPicker defaultIcon={TICKET_ICON} />
        </Form.Item>
      </Col>
      <ProFormRadio.Group
        colProps={HALF}
        name="formColumns"
        label={t('pages.ticket.template.formColumns')}
        tooltip={t('pages.ticket.template.formColumns.tooltip')}
        options={FORM_COLUMNS.map((value) => ({
          value,
          label: t(`pages.ticket.template.formColumns.${value}`),
        }))}
      />
      <Col span={24}>
        <Form.Item
          name="form"
          label={t('pages.ticket.template.form')}
          tooltip={t('pages.ticket.template.form.tooltip')}
        >
          <FieldsEditor />
        </Form.Item>
      </Col>
      <ProFormRadio.Group
        colProps={HALF}
        name="status"
        label={t('common.column.status')}
        tooltip={t('pages.ticket.template.status.tooltip')}
        options={statusOptions}
      />
      <ProFormDigit
        colProps={HALF}
        name="sort"
        label={t('pages.ticket.column.sort')}
        tooltip={t('pages.ticket.form.sort.tooltip')}
        min={0}
        max={SORT_MAX}
        fieldProps={{ precision: 0 }}
      />
      <ProFormTextArea
        name="description"
        label={t('pages.ticket.column.description')}
        tooltip={t('pages.ticket.template.description.tooltip')}
        fieldProps={{
          maxLength: DESCRIPTION_MAX,
          showCount: true,
          autoSize: { minRows: 2, maxRows: 4 },
        }}
      />
      <Col span={24}>
        <SectionTitle>{t('pages.ticket.sla.title')}</SectionTitle>
        <Form.Item
          name="sla"
          rules={[
            {
              validator: (_: unknown, value?: SlaRule[]) =>
                (value ?? []).every(slaRuleComplete)
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('pages.ticket.sla.incomplete'))),
            },
            {
              // 解决时限短于响应时限多半是填反了：只提醒，不拦保存
              warningOnly: true,
              validator: (_: unknown, value?: SlaRule[]) =>
                (value ?? []).some(slaRuleInverted)
                  ? Promise.reject(new Error(t('pages.ticket.sla.inverted')))
                  : Promise.resolve(),
            },
          ]}
        >
          <SlaEditor />
        </Form.Item>
        <Form.Item
          name="slaEscalateTo"
          label={t('pages.ticket.sla.escalate')}
          tooltip={t('pages.ticket.sla.escalate.tooltip')}
        >
          <UserSelect
            multiple
            maxCount={ESCALATE_MAX}
            fetchUsers={fetchWorkflowUsers}
            knownUsers={knownUsers}
            placeholder={t('pages.ticket.sla.escalate.placeholder')}
          />
        </Form.Item>
        <SectionTitle>{t('pages.ticket.ciLink.title')}</SectionTitle>
      </Col>
      <ProFormRadio.Group
        name="ciLink"
        label={t('pages.ticket.ciLink.label')}
        tooltip={t('pages.ticket.ciLink.tooltip')}
        options={CI_LINKS.map((value) => ({
          value,
          label: t(`pages.ticket.ciLink.${value}`),
        }))}
      />
    </DrawerForm>
  );
};

export default TemplateDrawer;
