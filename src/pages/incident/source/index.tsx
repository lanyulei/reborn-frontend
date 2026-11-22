/**
 * 接入与 Webhook：接入源（外部系统凭 Bearer 令牌开故障 / 追加备注 / 恢复；令牌只在创建 / 重置时显示一次）
 * 与 Webhook 订阅（故障事件以 HMAC 签名回调到外部地址）。
 */
import { CopyOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, App, Card, Modal, Space, Table, Tag, Typography } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import {
  ConfirmLink,
  CreateButton,
  DeleteConfirmLink,
} from '@/components/TableActions';
import {
  createSource,
  createWebhook,
  deleteSource,
  deleteWebhook,
  listSources,
  listWebhooks,
  resetSourceToken,
  updateSource,
  updateWebhook,
} from '@/services/incident/config';
import type {
  IncidentSourceClient,
  IncidentWebhook,
  SourceSpec,
  WebhookSpec,
} from '@/services/incident/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';
import { refOptions, useIncidentOptions } from '../components/hooks';
import {
  CONFIG_TABS,
  INCIDENT_LIMITS,
  SEVERITY_META,
  SEVERITY_ORDER,
  WEBHOOK_EVENTS,
} from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import { RefName } from '../components/tags';

const CIDR = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^[0-9a-fA-F:]+(\/\d{1,3})?$/;

const SourcePage: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { message } = App.useApp();
  const { styles } = useIncidentStyles();
  const [sources, setSources] = useState<IncidentSourceClient[]>([]);
  const [webhooks, setWebhooks] = useState<IncidentWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceForm, setSourceForm] = useState<
    IncidentSourceClient | null | undefined
  >(undefined);
  const [webhookForm, setWebhookForm] = useState<
    IncidentWebhook | null | undefined
  >(undefined);
  const [token, setToken] = useState<{ name: string; token: string } | null>(
    null,
  );
  const { options } = useIncidentOptions(
    ['businesses'],
    sourceForm !== undefined,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([listSources(), listWebhooks()]);
      setSources(s.items ?? []);
      setWebhooks(w.items ?? []);
    } catch {
      // 域级 request 已提示
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const canManage = has('incident.source.manage');
  const canWebhook = has('incident.source.webhook');

  return (
    <RouteTabsPage tabs={CONFIG_TABS}>
      <Card
        variant="outlined"
        title={t('pages.incident.source.title')}
        extra={
          canManage && (
            <CreateButton onClick={() => setSourceForm(null)}>
              {t('pages.incident.source.create')}
            </CreateButton>
          )
        }
        style={{ marginBottom: 16 }}
      >
        <Alert
          type="info"
          showIcon
          title={t('pages.incident.source.hint')}
          style={{ marginBottom: 12 }}
        />
        <Table<IncidentSourceClient>
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={sources}
          pagination={false}
          columns={[
            {
              title: t('pages.incident.source.name'),
              dataIndex: 'name',
              render: (_, r) => (
                <div>
                  <div>{r.name}</div>
                  {r.description && (
                    <div className={styles.hint}>{r.description}</div>
                  )}
                </div>
              ),
            },
            {
              title: t('pages.incident.source.tokenPrefix'),
              dataIndex: 'tokenPrefix',
              width: 120,
              render: (_, r) => (
                <span className={styles.mono}>{r.tokenPrefix}…</span>
              ),
            },
            {
              title: t('pages.incident.source.defaultSeverity'),
              dataIndex: 'defaultSeverity',
              width: 100,
              render: (_, r) =>
                r.defaultSeverity
                  ? t(SEVERITY_META[r.defaultSeverity].textId)
                  : t('common.empty'),
            },
            {
              title: t('pages.incident.field.business'),
              dataIndex: 'business',
              width: 120,
              render: (_, r) => <RefName ref={r.business} />,
            },
            {
              title: t('pages.incident.source.allowedIps'),
              dataIndex: 'allowedIps',
              width: 200,
              render: (_, r) =>
                r.allowedIps?.length
                  ? r.allowedIps.map((ip) => <Tag key={ip}>{ip}</Tag>)
                  : t('pages.incident.source.anyIp'),
            },
            {
              title: t('pages.incident.source.lastUsed'),
              dataIndex: 'lastUsedTime',
              width: 160,
              render: (_, r) => formatTime(r.lastUsedTime) || t('common.empty'),
            },
            {
              title: t('common.column.enabled'),
              dataIndex: 'enabled',
              width: 80,
              render: (_, r) =>
                r.enabled ? (
                  <Tag color="success">{t('common.status.enabled')}</Tag>
                ) : (
                  <Tag>{t('common.status.disabled')}</Tag>
                ),
            },
            {
              title: t('common.column.action'),
              key: 'op',
              width: 200,
              hidden: !(
                canManage ||
                has('incident.source.reset') ||
                has('incident.source.delete')
              ),
              render: (_, r) => (
                <Space size={8}>
                  {canManage && (
                    <a onClick={() => setSourceForm(r)}>
                      {t('common.action.edit')}
                    </a>
                  )}
                  {has('incident.source.reset') && (
                    <ConfirmLink
                      danger
                      title={t('pages.incident.source.reset.title')}
                      description={t('pages.incident.source.reset.desc')}
                      onConfirm={async () => {
                        const result = await resetSourceToken(r.id);
                        setToken({ name: r.name, token: result.token });
                        void load();
                      }}
                    >
                      {t('pages.incident.source.reset')}
                    </ConfirmLink>
                  )}
                  {has('incident.source.delete') && (
                    <DeleteConfirmLink
                      title={t('pages.incident.source.delete.title', {
                        name: r.name,
                      })}
                      onConfirm={async () => {
                        await deleteSource(r.id);
                        message.success(t('common.msg.deleted'));
                        void load();
                      }}
                    />
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Card
        variant="outlined"
        title={t('pages.incident.webhook.title')}
        extra={
          canWebhook && (
            <CreateButton onClick={() => setWebhookForm(null)}>
              {t('pages.incident.webhook.create')}
            </CreateButton>
          )
        }
      >
        <Alert
          type="info"
          showIcon
          title={t('pages.incident.webhook.hint')}
          style={{ marginBottom: 12 }}
        />
        <Table<IncidentWebhook>
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={webhooks}
          pagination={false}
          columns={[
            {
              title: t('pages.incident.webhook.name'),
              dataIndex: 'name',
              width: 160,
            },
            {
              title: t('pages.incident.webhook.url'),
              dataIndex: 'url',
              ellipsis: true,
              render: (_, r) => <span className={styles.mono}>{r.url}</span>,
            },
            {
              title: t('pages.incident.webhook.events'),
              dataIndex: 'events',
              width: 220,
              render: (_, r) =>
                r.events?.length
                  ? r.events.map((e) => (
                      <Tag key={e}>
                        {t(`pages.incident.webhook.event.${e}`)}
                      </Tag>
                    ))
                  : t('pages.incident.webhook.allEvents'),
            },
            {
              title: t('pages.incident.webhook.secret'),
              dataIndex: 'hasSecret',
              width: 90,
              render: (_, r) =>
                r.hasSecret
                  ? t('pages.incident.webhook.signed')
                  : t('common.empty'),
            },
            {
              title: t('pages.incident.webhook.queue'),
              key: 'queue',
              width: 140,
              render: (_, r) => (
                <>
                  {t('pages.incident.webhook.pending', { n: r.pending ?? 0 })}
                  {(r.failed ?? 0) > 0 && (
                    <Tag color="error" style={{ marginInlineStart: 6 }}>
                      {t('pages.incident.webhook.failed', { n: r.failed })}
                    </Tag>
                  )}
                </>
              ),
            },
            {
              title: t('common.column.enabled'),
              dataIndex: 'enabled',
              width: 80,
              render: (_, r) =>
                r.enabled ? (
                  <Tag color="success">{t('common.status.enabled')}</Tag>
                ) : (
                  <Tag>{t('common.status.disabled')}</Tag>
                ),
            },
            {
              title: t('common.column.action'),
              key: 'op',
              width: 120,
              hidden: !canWebhook,
              render: (_, r) => (
                <Space size={8}>
                  <a onClick={() => setWebhookForm(r)}>
                    {t('common.action.edit')}
                  </a>
                  <DeleteConfirmLink
                    title={t('pages.incident.webhook.delete.title', {
                      name: r.name,
                    })}
                    onConfirm={async () => {
                      await deleteWebhook(r.id);
                      message.success(t('common.msg.deleted'));
                      void load();
                    }}
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {sourceForm !== undefined && (
        <ModalForm<SourceSpec>
          title={t(
            sourceForm
              ? 'pages.incident.source.edit'
              : 'pages.incident.source.create',
          )}
          width={560}
          open
          onOpenChange={(open) => {
            if (!open) setSourceForm(undefined);
          }}
          modalProps={{ destroyOnHidden: true }}
          submitter={sourceForm ? submitter.save : submitter.create}
          initialValues={
            sourceForm
              ? {
                  name: sourceForm.name,
                  description: sourceForm.description,
                  defaultSeverity: sourceForm.defaultSeverity ?? 3,
                  businessId: sourceForm.business?.id,
                  groups: sourceForm.groups ?? [],
                  allowedIps: sourceForm.allowedIps ?? [],
                  enabled: sourceForm.enabled ?? true,
                }
              : { defaultSeverity: 3, enabled: true }
          }
          onFinish={async (values) => {
            const spec: SourceSpec = {
              ...values,
              name: values.name.trim(),
              groups: values.groups ?? [],
              allowedIps: values.allowedIps ?? [],
            };
            if (sourceForm) {
              await updateSource(sourceForm.id, spec, sourceForm.version ?? 0);
              message.success(t('common.msg.saved'));
            } else {
              const result = await createSource(spec);
              setToken({ name: result.source.name, token: result.token });
            }
            void load();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.incident.source.name')}
            rules={[
              rules.required(t('pages.incident.source.name')),
              rules.maxChars(INCIDENT_LIMITS.nameMax),
            ]}
          />
          <ProFormTextArea
            name="description"
            label={t('pages.incident.business.description')}
            fieldProps={{ rows: 2, maxLength: INCIDENT_LIMITS.descriptionMax }}
          />
          <ProFormSelect
            name="defaultSeverity"
            label={t('pages.incident.source.defaultSeverity')}
            options={SEVERITY_ORDER.map((s) => ({
              value: s,
              label: t(SEVERITY_META[s].textId),
            }))}
          />
          <ProFormSelect
            name="businessId"
            label={t('pages.incident.field.business')}
            showSearch
            options={refOptions(options.businesses)}
          />
          <ProFormSelect
            name="groups"
            label={t('pages.incident.business.groups')}
            mode="tags"
            fieldProps={{ tokenSeparators: [',', ' '] }}
            rules={[
              {
                validator: (_, v: string[] | undefined) =>
                  (v ?? []).every((g) => /^\$[\w-]{1,64}$/.test(g))
                    ? Promise.resolve()
                    : Promise.reject(t('pages.incident.business.groupsRule')),
              },
            ]}
            extra={t('pages.incident.business.groupsHint')}
          />
          <ProFormSelect
            name="allowedIps"
            label={t('pages.incident.source.allowedIps')}
            mode="tags"
            fieldProps={{ tokenSeparators: [',', ' '] }}
            rules={[
              {
                validator: (_, v: string[] | undefined) =>
                  (v ?? []).every((ip) => CIDR.test(ip))
                    ? Promise.resolve()
                    : Promise.reject(t('pages.incident.source.ipRule')),
              },
            ]}
            extra={t('pages.incident.source.allowedIpsHint')}
          />
          <ProFormSwitch name="enabled" label={t('common.column.enabled')} />
        </ModalForm>
      )}

      {webhookForm !== undefined && (
        <ModalForm<WebhookSpec>
          title={t(
            webhookForm
              ? 'pages.incident.webhook.edit'
              : 'pages.incident.webhook.create',
          )}
          width={560}
          open
          onOpenChange={(open) => {
            if (!open) setWebhookForm(undefined);
          }}
          modalProps={{ destroyOnHidden: true }}
          submitter={webhookForm ? submitter.save : submitter.create}
          initialValues={
            webhookForm
              ? {
                  name: webhookForm.name,
                  url: webhookForm.url,
                  events: webhookForm.events ?? [],
                  enabled: webhookForm.enabled ?? true,
                }
              : { enabled: true }
          }
          onFinish={async (values) => {
            const spec: WebhookSpec = {
              ...values,
              name: values.name.trim(),
              url: values.url.trim(),
              secret: values.secret?.trim() || undefined,
              events: values.events ?? [],
            };
            if (webhookForm) {
              await updateWebhook(
                webhookForm.id,
                spec,
                webhookForm.version ?? 0,
              );
              message.success(t('common.msg.saved'));
            } else {
              await createWebhook(spec);
              message.success(t('common.msg.created'));
            }
            void load();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.incident.webhook.name')}
            rules={[
              rules.required(t('pages.incident.webhook.name')),
              rules.maxChars(INCIDENT_LIMITS.nameMax),
            ]}
          />
          <ProFormText
            name="url"
            label={t('pages.incident.webhook.url')}
            rules={[
              rules.required(t('pages.incident.webhook.url')),
              {
                pattern: /^https?:\/\/\S+$/,
                message: t('pages.incident.webhook.urlRule'),
              },
            ]}
            extra={t('pages.incident.webhook.urlHint')}
          />
          <ProFormText.Password
            name="secret"
            label={t('pages.incident.webhook.secret')}
            fieldProps={{ autoComplete: 'new-password' }}
            extra={t(
              webhookForm?.hasSecret
                ? 'pages.incident.webhook.secretKeep'
                : 'pages.incident.webhook.secretHint',
            )}
          />
          <ProFormSelect
            name="events"
            label={t('pages.incident.webhook.events')}
            mode="multiple"
            options={WEBHOOK_EVENTS.map((e) => ({
              value: e,
              label: t(`pages.incident.webhook.event.${e}`),
            }))}
            extra={t('pages.incident.webhook.eventsHint')}
          />
          <ProFormSwitch name="enabled" label={t('common.column.enabled')} />
        </ModalForm>
      )}

      <Modal
        open={!!token}
        title={token?.name}
        footer={null}
        onCancel={() => setToken(null)}
        destroyOnHidden
      >
        <Alert
          type="warning"
          showIcon
          title={t('pages.incident.source.tokenOnce')}
          style={{ marginBottom: 12 }}
        />
        <Typography.Paragraph
          className={styles.mono}
          copyable={{ text: token?.token ?? '', icon: <CopyOutlined /> }}
        >
          {token?.token}
        </Typography.Paragraph>
        <div className={styles.hint}>
          {t('pages.incident.source.tokenUsage')}
        </div>
        <pre className={styles.mono} style={{ marginTop: 8 }}>
          {`POST /api/v1/open/incident\nAuthorization: Bearer ${token?.token ?? ''}\n{"externalKey":"...","title":"...","severity":3}`}
        </pre>
      </Modal>
    </RouteTabsPage>
  );
};

export default SourcePage;
