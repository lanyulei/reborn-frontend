/**
 * Agent Profile 列表：名称 / 机器账号 / 适用范围 / 预算 / 自动通过 / 熔断状态；新建 / 编辑 / 删除 / 干跑 / 变更历史按元素权限展示。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProTable,
} from '@ant-design/pro-components';
import { App, Drawer, Space, Table, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { ENABLED_META } from '@/constants';
import { SEVERITY_META } from '@/pages/incident/components/meta';
import { useIncidentStyles } from '@/pages/incident/components/styles';
import {
  deleteProfile,
  getProfile,
  listProfileHistory,
  listProfiles,
  testProfile,
} from '@/services/agent/profile';
import type { AgentProfile, ProfileHistory } from '@/services/agent/typings';
import { listIncidents } from '@/services/incident/incident';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useEnumText, useFormRules, useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { num } from '../components/meta';
import { ProfileDrawer } from './ProfileDrawer';

const ProfileList: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const rules = useFormRules();
  const { message } = App.useApp();
  const { styles } = useIncidentStyles();
  const actionRef = useRef<ActionType>(null);
  const enabledEnum = useValueEnum(ENABLED_META);
  const enabledText = useEnumText(ENABLED_META);
  const severityText = useEnumText(SEVERITY_META);
  const [formRow, setFormRow] = useState<AgentProfile | null | undefined>(
    undefined,
  );
  const [historyRow, setHistoryRow] = useState<AgentProfile | null>(null);
  const [testRow, setTestRow] = useState<AgentProfile | null>(null);
  const reload = () => actionRef.current?.reload();

  const columns: ProColumns<AgentProfile>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.agent.profile.keywordPlaceholder') },
    },
    {
      title: t('pages.agent.profile.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      render: (_, r) => (
        <div>
          <Space size={6}>
            <span>{r.spec.name}</span>
            {r.spec.kind === 'postmortem' && (
              <Tag color="purple">
                {t('pages.agent.profile.kind.postmortem')}
              </Tag>
            )}
            {r.breakerOpen && (
              <Tag color="error">{t('pages.agent.profile.breaker')}</Tag>
            )}
          </Space>
          {r.spec.description && (
            <div className={styles.hint}>{r.spec.description}</div>
          )}
        </div>
      ),
    },
    {
      title: t('pages.agent.profile.agentUser'),
      dataIndex: 'agentUser',
      search: false,
      width: 160,
      ellipsis: true,
      render: (_, r) =>
        r.agentUser?.missing ? (
          <Tag color="warning">{t('common.empty')}</Tag>
        ) : (
          (r.agentUser?.name ?? t('common.empty'))
        ),
    },
    {
      title: t('pages.agent.profile.column.scope'),
      key: 'scope',
      search: false,
      width: 220,
      render: (_, r) => (
        <Space size={4} wrap>
          {(r.spec.severities ?? []).map((s) => (
            <Tag key={s} color={SEVERITY_META[s as 1 | 2 | 3 | 4]?.color}>
              {severityText(s as 1 | 2 | 3 | 4)}
            </Tag>
          ))}
          <span className={styles.hint}>
            {r.spec.businessIds?.length
              ? `${r.spec.businessIds.length} ${t('pages.agent.profile.businesses')}`
              : t('pages.agent.profile.businessesHint')}
            {' · '}
            {t('pages.agent.profile.hourlyLimit')} {r.spec.hourlyLimit ?? 30}
          </span>
        </Space>
      ),
    },
    {
      title: t('pages.agent.profile.column.budget'),
      key: 'budget',
      search: false,
      width: 200,
      render: (_, r) => (
        <span className={styles.hint}>
          {r.spec.budget?.maxSteps ?? 20} {t('pages.agent.steps')} ·{' '}
          {r.spec.budget?.timeoutS ?? 480}s ·{' '}
          {num(r.spec.budget?.promptTokens).toLocaleString()} /{' '}
          {num(r.spec.budget?.completionTokens).toLocaleString()}
        </span>
      ),
    },
    {
      title: t('pages.agent.profile.column.auto'),
      key: 'auto',
      search: false,
      width: 110,
      render: (_, r) =>
        r.spec.auto?.enabled ? (
          <Tag color={r.breakerOpen ? 'error' : 'processing'}>
            {t('pages.agent.profile.auto.enabled')} ≥{' '}
            {r.spec.auto.minConfidence ?? 80}
          </Tag>
        ) : (
          <Tag>{enabledText('false')}</Tag>
        ),
    },
    {
      title: t('pages.agent.profile.priority'),
      dataIndex: ['spec', 'priority'],
      search: false,
      width: 80,
      align: 'right',
    },
    {
      title: t('common.column.status'),
      dataIndex: 'enabled',
      valueType: 'select',
      valueEnum: enabledEnum,
      width: 90,
      render: (_, r) => enabledText(r.spec.enabled ? 'true' : 'false'),
    },
    {
      title: t('pages.agent.profile.column.updateTime'),
      dataIndex: 'updateTime',
      search: false,
      width: 160,
      render: (_, r) => formatTime(r.updateTime),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, r) => [
        has('agent.profile.update') ? (
          <a
            key="edit"
            onClick={async () => setFormRow(await getProfile(r.id))}
          >
            {t('common.action.edit')}
          </a>
        ) : null,
        has('agent.profile.test') ? (
          <a key="test" onClick={() => setTestRow(r)}>
            {t('pages.agent.profile.test')}
          </a>
        ) : null,
        <a key="history" onClick={() => setHistoryRow(r)}>
          {t('pages.agent.profile.history')}
        </a>,
        has('agent.profile.delete') ? (
          <DeleteConfirmLink
            key="delete"
            title={t('pages.agent.profile.deleteConfirm')}
            onConfirm={async () => {
              await deleteProfile(r.id, r.version);
              message.success(t('common.msg.deleted'));
              reload();
            }}
          />
        ) : null,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<AgentProfile>
        cardBordered
        headerTitle={
          has('agent.profile.create') && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.agent.profile.create')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        columnEmptyText={t('common.empty')}
        search={{ labelWidth: 'auto' }}
        scroll={{ x: 'max-content' }}
        request={async (p) =>
          toTableResult(
            await listProfiles({
              page: p.current,
              pageSize: p.pageSize,
              keyword: (p.keyword as string | undefined)?.trim() || undefined,
              enabled: parseBoolParam(p.enabled),
            }),
          )
        }
      />
      {formRow !== undefined && (
        <ProfileDrawer
          profile={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={() => {
            message.success(
              formRow ? t('common.msg.updated') : t('common.msg.created'),
            );
            setFormRow(undefined);
            reload();
          }}
        />
      )}
      <Drawer
        size={720}
        open={!!historyRow}
        onClose={() => setHistoryRow(null)}
        destroyOnHidden
        title={`${t('pages.agent.profile.history')} · ${historyRow?.spec.name ?? ''}`}
      >
        {historyRow && (
          <ProTable<ProfileHistory>
            rowKey="id"
            search={false}
            options={false}
            size="small"
            columnEmptyText={t('common.empty')}
            columns={[
              {
                title: t('pages.agent.profile.history.version'),
                dataIndex: 'version',
                width: 70,
              },
              {
                title: t('pages.agent.profile.history.actor'),
                dataIndex: 'actor',
                width: 120,
                render: (_, h) => h.actor?.name ?? t('common.empty'),
              },
              {
                title: t('pages.agent.profile.history.note'),
                dataIndex: 'note',
                ellipsis: true,
              },
              {
                title: t('pages.agent.profile.history.time'),
                dataIndex: 'createTime',
                width: 160,
                render: (_, h) => formatTime(h.createTime),
              },
            ]}
            expandable={{
              expandedRowRender: (h) => (
                <Table
                  size="small"
                  pagination={false}
                  rowKey="k"
                  dataSource={[
                    {
                      k: 'before',
                      v: h.before ? JSON.stringify(h.before, null, 2) : '',
                    },
                    { k: 'after', v: JSON.stringify(h.after ?? {}, null, 2) },
                  ]}
                  columns={[
                    { dataIndex: 'k', width: 80 },
                    {
                      dataIndex: 'v',
                      render: (v: string) => (
                        <pre
                          className={styles.summaryBox}
                          style={{ margin: 0 }}
                        >
                          {v || t('common.empty')}
                        </pre>
                      ),
                    },
                  ]}
                  showHeader={false}
                />
              ),
            }}
            request={async (p) =>
              toTableResult(
                await listProfileHistory(historyRow.id, {
                  page: p.current,
                  pageSize: p.pageSize,
                }),
              )
            }
          />
        )}
      </Drawer>
      {testRow && (
        <ModalForm<{ incidentId: string }>
          title={`${t('pages.agent.profile.test.title')} · ${testRow.spec.name}`}
          width={520}
          open
          onOpenChange={(open) => {
            if (!open) setTestRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          onFinish={async (values) => {
            await testProfile(testRow.id, values.incidentId);
            message.success(t('pages.agent.profile.test.queued'));
            return true;
          }}
        >
          <div className={styles.hint} style={{ marginBottom: 12 }}>
            {t('pages.agent.profile.test.hint')}
          </div>
          <ProFormSelect
            name="incidentId"
            label={t('pages.agent.profile.test.incident')}
            showSearch
            debounceTime={300}
            placeholder={t('pages.agent.profile.test.incidentPlaceholder')}
            rules={[rules.select(t('pages.agent.profile.test.incident'))]}
            request={async ({ keyWords }) => {
              const res = await listIncidents(
                { page: 1, pageSize: 20, keyword: keyWords || undefined },
                { silent: true },
              );
              return res.items.map((i) => ({
                value: i.id,
                label: `${i.number} ${i.title}`,
              }));
            }}
          />
        </ModalForm>
      )}
    </PageContainer>
  );
};

export default ProfileList;
