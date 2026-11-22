/**
 * 告警详情里的「所属故障」块（由故障域提供，告警详情页只引入并放置）：这条告警关联到的故障（当前有效的在前），
 * 以及「升级为故障」「关联到故障」入口。没有故障列表菜单的用户不出现这个块，也不发请求。
 */

import { ModalForm, ProFormSwitch } from '@ant-design/pro-components';
import { Link, useAccess } from '@umijs/max';
import { App, Button, Form, Space, Tag, Typography } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import {
  attachAlerts,
  listIncidentsByAlert,
} from '@/services/incident/incident';
import type { Incident } from '@/services/incident/typings';
import type { MonitorAlert } from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useT } from '@/utils/i18n';
import { IncidentSearchSelect } from '../detail/Dialogs';
import { CreateIncidentModal } from './CreateIncidentModal';
import { incidentPath } from './meta';
import { SeverityTag, StatusBadge } from './tags';

/** 告警的建议等级：致命 → S2、严重 → S3、其余 → S4 */
const suggestSeverity = (alert: MonitorAlert): 2 | 3 | 4 =>
  (alert.severity ?? 1) >= 4 ? 2 : alert.severity === 3 ? 3 : 4;

export const AlertIncidentBlock: React.FC<{ alert: MonitorAlert }> = ({
  alert,
}) => {
  const t = useT();
  const access = useAccess();
  const has = usePermissions();
  const rules = useFormRules();
  const { message } = App.useApp();
  const [items, setItems] = useState<Incident[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const enabled = Boolean(access.canIncidentList);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const result = await listIncidentsByAlert(alert.id);
      setItems(result.items ?? []);
    } catch {
      setItems([]);
    }
  }, [alert.id, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!enabled) return null;
  const active = items.find((i) => i.status <= 3);
  const canLink = has('incident.list.create') && alert.status === 1 && !active;

  return (
    <>
      <SectionTitle>{t('pages.incident.alertBlock.title')}</SectionTitle>
      {items.length === 0 ? (
        <Typography.Text type="secondary">
          {t('pages.incident.alertBlock.none')}
        </Typography.Text>
      ) : (
        <Space vertical size={4}>
          {items.map((inc) => (
            <Space key={inc.id} size={6} wrap>
              <SeverityTag severity={inc.severity} />
              <Link to={incidentPath(inc.id)}>
                {inc.number} {inc.title}
              </Link>
              <StatusBadge status={inc.status} />
              {inc.status > 3 && (
                <Tag>{t('pages.incident.alertBlock.released')}</Tag>
              )}
            </Space>
          ))}
        </Space>
      )}
      {canLink && (
        <Space style={{ marginTop: 8 }}>
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            {t('pages.incident.alertBlock.promote')}
          </Button>
          <Button onClick={() => setAttachOpen(true)}>
            {t('pages.incident.alertBlock.attach')}
          </Button>
        </Space>
      )}
      <CreateIncidentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        alertIds={[alert.id]}
        initial={{
          title: alert.ruleName,
          severity: suggestSeverity(alert),
          summary: alert.annotations?.summary ?? alert.annotations?.description,
        }}
        onCreated={() => void load()}
      />
      {attachOpen && (
        <ModalForm<{ incidentId: string; move?: boolean }>
          title={t('pages.incident.alertBlock.attach')}
          width={520}
          open
          onOpenChange={(open) => {
            if (!open) setAttachOpen(false);
          }}
          modalProps={{ destroyOnHidden: true }}
          onFinish={async (values) => {
            const result = await attachAlerts(
              values.incidentId,
              [alert.id],
              values.move,
            );
            if ((result.attached ?? 0) > 0) {
              message.success(t('pages.incident.alertBlock.attached'));
            } else {
              message.warning(t('pages.incident.alertBlock.skipped'));
            }
            void load();
            return true;
          }}
        >
          <Form.Item
            name="incidentId"
            label={t('pages.incident.merge.target')}
            rules={[rules.select(t('pages.incident.merge.target'))]}
          >
            <IncidentSearchSelect />
          </Form.Item>
          <ProFormSwitch name="move" label={t('pages.incident.attach.move')} />
        </ModalForm>
      )}
    </>
  );
};
