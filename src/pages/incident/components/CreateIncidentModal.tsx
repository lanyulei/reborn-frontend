/**
 * 新建故障（故障列表的「新建」、告警详情的「升级为故障」共用）：标题、等级、业务、摘要、受影响资源、
 * 指挥官、处理人、发生时间、是否演练；从告警升级时带上 alertIds（后端同事务关联并带入告警的资源）。
 */
import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, Form } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { UserSelect } from '@/components/UserSelect';
import { createIncident } from '@/services/incident/incident';
import type { Incident, IncidentSeverity } from '@/services/incident/typings';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';
import { fetchCIs, fetchIncidentUsers, useIncidentOptions } from './hooks';
import { INCIDENT_LIMITS, SEVERITY_META, SEVERITY_ORDER } from './meta';

interface FormValues {
  title: string;
  severity: IncidentSeverity;
  businessId?: string;
  summary?: string;
  affectedCiIds?: string[];
  commanderId?: string;
  responderIds?: string[];
  occurTime?: string;
  isDrill?: boolean;
}

export const CreateIncidentModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreated: (incident: Incident) => void;
  /** 从告警升级：预填标题 / 等级并关联这些告警 */
  alertIds?: string[];
  initial?: Partial<Pick<FormValues, 'title' | 'severity' | 'summary'>>;
}> = ({ open, onClose, onCreated, alertIds, initial }) => {
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { message } = App.useApp();
  const { options } = useIncidentOptions(['businesses'], open);
  return (
    <ModalForm<FormValues>
      title={
        alertIds?.length
          ? t('pages.incident.create.fromAlert', { n: alertIds.length })
          : t('pages.incident.create.title')
      }
      width={640}
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      submitter={submitter.create}
      initialValues={{ severity: 3, ...initial }}
      onFinish={async (values) => {
        const incident = await createIncident({
          title: values.title.trim(),
          severity: values.severity,
          businessId: values.businessId,
          summary: values.summary?.trim(),
          alertIds,
          affectedCiIds: values.affectedCiIds,
          commanderId: values.commanderId,
          responderIds: values.responderIds,
          occurTime: values.occurTime
            ? dayjs(values.occurTime).toISOString()
            : undefined,
          isDrill: values.isDrill,
        });
        message.success(
          t('pages.incident.msg.created', { n: incident.number }),
        );
        onCreated(incident);
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
        name="severity"
        label={t('pages.incident.field.severity')}
        rules={[rules.select(t('pages.incident.field.severity'))]}
        options={SEVERITY_ORDER.map((s) => ({
          value: s,
          label: t(SEVERITY_META[s].textId),
        }))}
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
          placeholder={t('pages.incident.field.ciPlaceholder')}
        />
      </Form.Item>
      <Form.Item name="commanderId" label={t('pages.incident.field.commander')}>
        <UserSelect
          fetchUsers={fetchIncidentUsers}
          placeholder={t('pages.incident.field.commanderPlaceholder')}
        />
      </Form.Item>
      <Form.Item
        name="responderIds"
        label={t('pages.incident.field.responders')}
      >
        <UserSelect
          multiple
          maxCount={20}
          fetchUsers={fetchIncidentUsers}
          placeholder={t('pages.incident.field.userPlaceholder')}
        />
      </Form.Item>
      <ProFormDateTimePicker
        name="occurTime"
        label={t('pages.incident.field.occurTime')}
        fieldProps={{ format: 'YYYY-MM-DD HH:mm', style: { width: '100%' } }}
        extra={t('pages.incident.field.occurTimeHint')}
      />
      <ProFormSwitch
        name="isDrill"
        label={t('pages.incident.field.isDrill')}
        extra={t('pages.incident.field.isDrillHint')}
      />
    </ModalForm>
  );
};
