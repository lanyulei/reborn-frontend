/**
 * 故障详情里的操作弹窗：状态流转（响应 / 缓解 / 解决 / 关闭 / 重开）、改等级、改指挥官、成员、合并、
 * 关联告警、转工单、标记变更、编辑基本信息。成功后由调用方刷新（onDone）。
 */
import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, App, Form, Select } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useEffect, useState } from 'react';
import { UserSelect } from '@/components/UserSelect';
import {
  TICKET_PRIORITY_DEFAULT,
  TICKET_PRIORITY_META,
  TICKET_PRIORITY_ORDER,
} from '@/pages/ticket/components/meta';
import {
  assignCommander,
  attachAlerts,
  changeSeverity,
  createIncidentTicket,
  markChange,
  mergeIncident,
  searchIncidents,
  transitionIncident,
  updateIncident,
  updateMembers,
} from '@/services/incident/incident';
import type {
  ChangeRelation,
  Incident,
  IncidentSeverity,
  MemberRole,
  SimilarIncident,
  TransitionAction,
} from '@/services/incident/typings';
import { useFormRules, useOptions, useSubmitter, useT } from '@/utils/i18n';
import { randomUUID } from '@/utils/uuid';
import {
  fetchCIs,
  fetchIncidentUsers,
  refsToKnown,
  useIncidentOptions,
} from '../components/hooks';
import {
  INCIDENT_LIMITS,
  RELATION_META,
  RELATION_ORDER,
  SEVERITY_META,
  SEVERITY_ORDER,
} from '../components/meta';

interface DialogProps {
  incident: Incident;
  onClose: () => void;
  onDone: () => void;
}

const modalProps = { destroyOnHidden: true } as const;

/** 状态流转：解决要选根因（可不选）并填说明；关闭时复盘未完成要勾选强制并填原因 */
export const TransitionModal: React.FC<
  DialogProps & { action: TransitionAction }
> = ({ incident, action, onClose, onDone }) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  const { options } = useIncidentOptions(['root_causes'], action === 'resolve');
  const reviewPending =
    action === 'close' &&
    (incident.reviewStatus === 1 || incident.reviewStatus === 2);
  return (
    <ModalForm<{ note?: string; rootCauseCode?: string; force?: boolean }>
      title={t(`pages.incident.action.${action}`)}
      width={480}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={modalProps}
      onFinish={async (values) => {
        await transitionIncident(incident.id, {
          action,
          note: values.note?.trim(),
          rootCauseCode: values.rootCauseCode,
          force: values.force,
        });
        message.success(t('pages.incident.msg.transitioned'));
        onDone();
        return true;
      }}
    >
      {reviewPending && (
        <Alert
          type="warning"
          showIcon
          title={t('pages.incident.close.reviewPending')}
          style={{ marginBottom: 16 }}
        />
      )}
      {action === 'resolve' && (
        <ProFormSelect
          name="rootCauseCode"
          label={t('pages.incident.field.rootCause')}
          options={(options.rootCauses ?? []).map((rc) => ({
            value: rc.code,
            label: rc.name,
          }))}
        />
      )}
      <ProFormTextArea
        name="note"
        label={t('pages.incident.field.note')}
        rules={
          action === 'resolve' || reviewPending
            ? [rules.required(t('pages.incident.field.note'))]
            : undefined
        }
        fieldProps={{
          rows: 3,
          maxLength: INCIDENT_LIMITS.noteMax,
          showCount: true,
        }}
      />
      {reviewPending && (
        <ProFormSwitch
          name="force"
          label={t('pages.incident.close.force')}
          rules={[
            {
              validator: (_, v) =>
                v
                  ? Promise.resolve()
                  : Promise.reject(t('pages.incident.close.forceRequired')),
            },
          ]}
        />
      )}
    </ModalForm>
  );
};

export const SeverityModal: React.FC<DialogProps> = ({
  incident,
  onClose,
  onDone,
}) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  return (
    <ModalForm<{ severity: IncidentSeverity; note?: string }>
      title={t('pages.incident.action.severity')}
      width={480}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={modalProps}
      initialValues={{ severity: incident.severity }}
      onFinish={async (values) => {
        await changeSeverity(incident.id, values.severity, values.note?.trim());
        message.success(t('pages.incident.msg.updated'));
        onDone();
        return true;
      }}
    >
      <ProFormSelect
        name="severity"
        label={t('pages.incident.field.severity')}
        rules={[rules.select(t('pages.incident.field.severity'))]}
        options={SEVERITY_ORDER.map((s) => ({
          value: s,
          label: t(SEVERITY_META[s].textId),
        }))}
      />
      <ProFormTextArea
        name="note"
        label={t('pages.incident.field.note')}
        fieldProps={{ rows: 2, maxLength: INCIDENT_LIMITS.noteMax }}
      />
    </ModalForm>
  );
};

export const CommanderModal: React.FC<DialogProps> = ({
  incident,
  onClose,
  onDone,
}) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  return (
    <ModalForm<{ userId: string; note?: string }>
      title={t('pages.incident.action.commander')}
      width={480}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={modalProps}
      onFinish={async (values) => {
        await assignCommander(incident.id, values.userId, values.note?.trim());
        message.success(t('pages.incident.msg.updated'));
        onDone();
        return true;
      }}
    >
      <Form.Item
        name="userId"
        label={t('pages.incident.field.commander')}
        rules={[rules.select(t('pages.incident.field.commander'))]}
      >
        <UserSelect
          fetchUsers={fetchIncidentUsers}
          knownUsers={refsToKnown(
            incident.commander ? [incident.commander] : [],
          )}
          placeholder={t('pages.incident.field.commanderPlaceholder')}
        />
      </Form.Item>
      <ProFormTextArea
        name="note"
        label={t('pages.incident.field.note')}
        fieldProps={{ rows: 2, maxLength: INCIDENT_LIMITS.noteMax }}
      />
    </ModalForm>
  );
};

/** 成员：处理人 / 关注人整体编辑，提交时算差集 */
export const MembersModal: React.FC<DialogProps & { role: MemberRole }> = ({
  incident,
  role,
  onClose,
  onDone,
}) => {
  const t = useT();
  const { message } = App.useApp();
  const current = (role === 2 ? incident.responders : incident.watchers) ?? [];
  const currentIds = current.map((u) => u.id);
  return (
    <ModalForm<{ userIds: string[] }>
      title={t(
        role === 2
          ? 'pages.incident.action.responders'
          : 'pages.incident.action.watchers',
      )}
      width={520}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={modalProps}
      initialValues={{ userIds: currentIds }}
      onFinish={async (values) => {
        const next = values.userIds ?? [];
        const add = next.filter((id) => !currentIds.includes(id));
        const remove = currentIds.filter((id) => !next.includes(id));
        if (add.length || remove.length) {
          await updateMembers(incident.id, role, add, remove);
          message.success(t('pages.incident.msg.updated'));
          onDone();
        }
        return true;
      }}
    >
      <Form.Item name="userIds" label={t('pages.incident.field.users')}>
        <UserSelect
          multiple
          maxCount={50}
          fetchUsers={fetchIncidentUsers}
          knownUsers={refsToKnown(current)}
          placeholder={t('pages.incident.field.userPlaceholder')}
        />
      </Form.Item>
    </ModalForm>
  );
};

/** 故障检索选择器（合并目标 / 关联到故障共用） */
export const IncidentSearchSelect: React.FC<{
  value?: string;
  onChange?: (v?: string) => void;
  excludeId?: string;
  placeholder?: string;
}> = ({ value, onChange, excludeId, placeholder }) => {
  const t = useT();
  const [items, setItems] = useState<SimilarIncident[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { items: hits } = await searchIncidents(
          keyword || '*',
          excludeId,
          20,
        );
        if (!cancelled) setItems(hits ?? []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [keyword, excludeId]);
  return (
    <Select
      showSearch={{ filterOption: false, onSearch: setKeyword }}
      allowClear
      value={value}
      loading={loading}
      placeholder={placeholder ?? t('pages.incident.field.incidentPlaceholder')}
      onChange={(v) => onChange?.(v)}
      options={items.map((it) => ({
        value: it.id,
        label: `${it.number ?? ''} ${it.title ?? ''}`.trim(),
      }))}
    />
  );
};

export const MergeModal: React.FC<DialogProps> = ({
  incident,
  onClose,
  onDone,
}) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  return (
    <ModalForm<{ targetId: string; note?: string }>
      title={t('pages.incident.action.merge')}
      width={520}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={modalProps}
      onFinish={async (values) => {
        await mergeIncident(incident.id, values.targetId, values.note?.trim());
        message.success(t('pages.incident.msg.merged'));
        onDone();
        return true;
      }}
    >
      <Alert
        type="info"
        showIcon
        title={t('pages.incident.merge.hint')}
        style={{ marginBottom: 16 }}
      />
      <Form.Item
        name="targetId"
        label={t('pages.incident.merge.target')}
        rules={[rules.select(t('pages.incident.merge.target'))]}
      >
        <IncidentSearchSelect excludeId={incident.id} />
      </Form.Item>
      <ProFormTextArea
        name="note"
        label={t('pages.incident.field.note')}
        fieldProps={{ rows: 2, maxLength: INCIDENT_LIMITS.noteMax }}
      />
    </ModalForm>
  );
};

/** 关联告警：粘贴告警 ID（每行一个）；已关联到别的活跃故障的可勾选「移动过来」 */
export const AttachAlertsModal: React.FC<DialogProps> = ({
  incident,
  onClose,
  onDone,
}) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  return (
    <ModalForm<{ ids: string; move?: boolean }>
      title={t('pages.incident.action.attach')}
      width={520}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={modalProps}
      onFinish={async (values) => {
        const ids = Array.from(
          new Set(
            values.ids
              .split(/[\s,，]+/)
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        ).slice(0, 200);
        const result = await attachAlerts(incident.id, ids, values.move);
        message.success(
          t('pages.incident.attach.done', {
            attached: result.attached ?? 0,
            skipped: result.skipped ?? 0,
          }),
        );
        onDone();
        return true;
      }}
    >
      <ProFormTextArea
        name="ids"
        label={t('pages.incident.attach.ids')}
        rules={[rules.required(t('pages.incident.attach.ids'))]}
        fieldProps={{
          rows: 5,
          placeholder: t('pages.incident.attach.idsPlaceholder'),
        }}
        extra={t('pages.incident.attach.hint')}
      />
      <ProFormSwitch name="move" label={t('pages.incident.attach.move')} />
    </ModalForm>
  );
};

/** 转工单：选模板，标题 / 描述按故障预填；幂等键在弹窗打开时生成一次 */
export const TicketModal: React.FC<DialogProps> = ({
  incident,
  onClose,
  onDone,
}) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  const [requestId] = useState(() => randomUUID());
  const { options } = useIncidentOptions(['ticket_templates']);
  const priorityOptions = useOptions(
    TICKET_PRIORITY_META,
    TICKET_PRIORITY_ORDER,
  );
  return (
    <ModalForm<{
      templateId: string;
      title: string;
      priority: number;
      description?: string;
    }>
      title={t('pages.incident.action.ticket')}
      width={560}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={modalProps}
      initialValues={{
        title: `[${incident.number}] ${incident.title}`.slice(
          0,
          INCIDENT_LIMITS.titleMax,
        ),
        priority: incident.severity <= 2 ? 4 : TICKET_PRIORITY_DEFAULT,
        description: incident.summary,
      }}
      onFinish={async (values) => {
        const result = await createIncidentTicket(incident.id, {
          templateId: values.templateId,
          title: values.title.trim(),
          priority: values.priority,
          description: values.description?.trim(),
          requestId,
        });
        message.success(
          t('pages.incident.ticket.done', { n: result.ticketNumber ?? '' }),
        );
        onDone();
        return true;
      }}
    >
      <ProFormSelect
        name="templateId"
        label={t('pages.incident.ticket.template')}
        rules={[rules.select(t('pages.incident.ticket.template'))]}
        showSearch
        options={(options.ticketTemplates ?? []).map((x) => ({
          value: x.id,
          label: x.name || x.id,
        }))}
      />
      <ProFormText
        name="title"
        label={t('pages.incident.field.title')}
        rules={[
          rules.required(t('pages.incident.field.title')),
          rules.maxChars(INCIDENT_LIMITS.titleMax),
        ]}
      />
      <ProFormSelect
        name="priority"
        label={t('pages.incident.ticket.priority')}
        options={priorityOptions}
      />
      <ProFormTextArea
        name="description"
        label={t('pages.incident.ticket.description')}
        fieldProps={{ rows: 3, maxLength: INCIDENT_LIMITS.summaryMax }}
      />
    </ModalForm>
  );
};

/** 手动标记一条变更（不在系统里的变更，如线下操作） */
export const MarkChangeModal: React.FC<DialogProps> = ({
  incident,
  onClose,
  onDone,
}) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  return (
    <ModalForm<{ summary: string; refTime?: string; relation: ChangeRelation }>
      title={t('pages.incident.change.mark')}
      width={520}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={modalProps}
      initialValues={{ relation: 1 }}
      onFinish={async (values) => {
        await markChange(incident.id, {
          domain: 'manual',
          kind: 'manual',
          summary: values.summary.trim(),
          refTime: values.refTime
            ? dayjs(values.refTime).toISOString()
            : undefined,
          relation: values.relation,
        });
        message.success(t('pages.incident.msg.updated'));
        onDone();
        return true;
      }}
    >
      <ProFormTextArea
        name="summary"
        label={t('pages.incident.change.summary')}
        rules={[rules.required(t('pages.incident.change.summary'))]}
        fieldProps={{
          rows: 3,
          maxLength: INCIDENT_LIMITS.descriptionMax,
          showCount: true,
        }}
      />
      <ProFormDateTimePicker
        name="refTime"
        label={t('pages.incident.change.time')}
        fieldProps={{ format: 'YYYY-MM-DD HH:mm', style: { width: '100%' } }}
      />
      <ProFormSelect
        name="relation"
        label={t('pages.incident.change.relation')}
        options={RELATION_ORDER.map((r) => ({
          value: r,
          label: t(RELATION_META[r].textId),
        }))}
      />
    </ModalForm>
  );
};

/** 编辑基本信息（标题 / 业务 / 摘要 / 受影响资源 / 发生时间 / 演练）；乐观锁 version */
export const EditModal: React.FC<DialogProps> = ({
  incident,
  onClose,
  onDone,
}) => {
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { message } = App.useApp();
  const { options } = useIncidentOptions(['businesses']);
  return (
    <ModalForm<{
      title: string;
      businessId?: string;
      summary?: string;
      affectedCiIds?: string[];
      occurTime?: string;
      isDrill?: boolean;
    }>
      title={t('pages.incident.action.edit')}
      width={640}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={modalProps}
      submitter={submitter.save}
      initialValues={{
        title: incident.title,
        businessId: incident.business?.id,
        summary: incident.summary,
        affectedCiIds: (incident.affectedCis ?? []).map((c) => c.id),
        occurTime: incident.occurTime,
        isDrill: incident.isDrill,
      }}
      onFinish={async (values) => {
        await updateIncident(incident.id, {
          title: values.title.trim(),
          businessId: values.businessId ?? '',
          summary: values.summary?.trim() ?? '',
          affectedCiIds: values.affectedCiIds ?? [],
          occurTime: values.occurTime
            ? dayjs(values.occurTime).toISOString()
            : undefined,
          isDrill: values.isDrill ?? false,
          version: incident.version ?? 0,
        });
        message.success(t('common.msg.saved'));
        onDone();
        return true;
      }}
    >
      <ProFormText
        name="title"
        label={t('pages.incident.field.title')}
        rules={[
          rules.required(t('pages.incident.field.title')),
          rules.maxChars(INCIDENT_LIMITS.titleMax),
        ]}
        fieldProps={{ maxLength: INCIDENT_LIMITS.titleMax, showCount: true }}
      />
      <ProFormSelect
        name="businessId"
        label={t('pages.incident.field.business')}
        showSearch
        options={(options.businesses ?? []).map((b) => ({
          value: b.id,
          label: b.name || b.id,
        }))}
      />
      <ProFormTextArea
        name="summary"
        label={t('pages.incident.field.summary')}
        fieldProps={{
          rows: 3,
          maxLength: INCIDENT_LIMITS.summaryMax,
          showCount: true,
        }}
      />
      <Form.Item
        name="affectedCiIds"
        label={t('pages.incident.field.affectedCis')}
      >
        <UserSelect
          multiple
          maxCount={50}
          fetchUsers={fetchCIs}
          knownUsers={refsToKnown(incident.affectedCis)}
          placeholder={t('pages.incident.field.ciPlaceholder')}
        />
      </Form.Item>
      <ProFormDateTimePicker
        name="occurTime"
        label={t('pages.incident.field.occurTime')}
        fieldProps={{ format: 'YYYY-MM-DD HH:mm', style: { width: '100%' } }}
      />
      <ProFormSwitch name="isDrill" label={t('pages.incident.field.isDrill')} />
    </ModalForm>
  );
};
