/**
 * 触发规则：告警如何归并成故障。列表展示匹配摘要、归并键、等级、业务、预案、累计开出的故障数；
 * 新建 / 编辑 / 删除 / 回放测试按元素权限展示。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Space, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { ENABLED_META } from '@/constants';
import { deleteRule, getRule, listRules } from '@/services/incident/config';
import type { IncidentRule } from '@/services/incident/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { CONFIG_TABS } from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import { RefName, SeverityTag } from '../components/tags';
import { RuleDrawer } from './RuleDrawer';

const RuleList: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const { styles } = useIncidentStyles();
  const actionRef = useRef<ActionType>(null);
  const enabledEnum = useValueEnum(ENABLED_META);
  const [formRow, setFormRow] = useState<IncidentRule | null | undefined>(
    undefined,
  );
  const reload = () => actionRef.current?.reload();

  const columns: ProColumns<IncidentRule>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.incident.rule.keywordPlaceholder') },
    },
    {
      title: t('pages.incident.rule.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      render: (_, r) => (
        <div>
          <div>{r.spec.name}</div>
          {r.spec.description && (
            <div className={styles.hint}>{r.spec.description}</div>
          )}
        </div>
      ),
    },
    {
      title: t('pages.incident.rule.section.match'),
      key: 'match',
      search: false,
      render: (_, r) => {
        const m = r.spec.match ?? {};
        const parts: string[] = [];
        if (m.minSeverity)
          parts.push(
            t('pages.incident.rule.summary.minSeverity', {
              s: t(`enum.severity.${m.minSeverity}`),
            }),
          );
        if (r.groupRefs?.length)
          parts.push(
            t('pages.incident.rule.summary.groups', { n: r.groupRefs.length }),
          );
        if (r.ruleRefs?.length)
          parts.push(
            t('pages.incident.rule.summary.rules', { n: r.ruleRefs.length }),
          );
        if (m.matchers?.length)
          parts.push(
            t('pages.incident.rule.summary.matchers', { n: m.matchers.length }),
          );
        if (m.modelCodes?.length)
          parts.push(
            t('pages.incident.rule.summary.models', { n: m.modelCodes.length }),
          );
        return parts.length
          ? parts.join(' · ')
          : t('pages.incident.rule.summary.all');
      },
    },
    {
      title: t('pages.incident.rule.keys'),
      key: 'keys',
      search: false,
      width: 200,
      render: (_, r) => {
        const c = r.spec.correlation ?? {};
        return (
          <>
            {(c.keys ?? []).length ? (
              c.keys?.map((k) => <Tag key={k}>{k}</Tag>)
            ) : (
              <Tag>*</Tag>
            )}
            <span className={styles.hint}>
              {t('pages.incident.rule.summary.window', {
                m: c.windowM ?? 0,
                n: c.minAlerts ?? 1,
              })}
            </span>
          </>
        );
      },
    },
    {
      title: t('pages.incident.field.severity'),
      key: 'severity',
      search: false,
      width: 90,
      render: (_, r) =>
        r.spec.incident?.severity ? (
          <SeverityTag severity={r.spec.incident.severity} />
        ) : (
          <Tag>{t('pages.incident.rule.severityAuto')}</Tag>
        ),
    },
    {
      title: t('pages.incident.field.business'),
      dataIndex: 'business',
      search: false,
      width: 120,
      ellipsis: true,
      render: (_, r) =>
        r.business?.id ? (
          <RefName ref={r.business} />
        ) : r.spec.incident?.businessLabel ? (
          <Tag>{`label:${r.spec.incident.businessLabel}`}</Tag>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.incident.proposal.playbook'),
      dataIndex: 'playbook',
      search: false,
      width: 120,
      ellipsis: true,
      render: (_, r) => <RefName ref={r.playbook} />,
    },
    {
      title: t('pages.incident.rule.incidentCount'),
      dataIndex: 'incidentCount',
      search: false,
      width: 90,
    },
    {
      title: t('common.column.enabled'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
      render: (_, r) =>
        r.spec.enabled ? (
          <Tag color="success">{t('common.status.enabled')}</Tag>
        ) : (
          <Tag>{t('common.status.disabled')}</Tag>
        ),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 120,
      hideInTable: !(
        has('incident.rule.update') || has('incident.rule.delete')
      ),
      render: (_, r) => (
        <Space size={8}>
          {has('incident.rule.update') && (
            <a
              onClick={async () => {
                setFormRow(await getRule(r.id));
              }}
            >
              {t('common.action.edit')}
            </a>
          )}
          {has('incident.rule.delete') && (
            <DeleteConfirmLink
              title={t('pages.incident.rule.delete.title', {
                name: r.spec.name,
              })}
              description={t('pages.incident.rule.delete.desc')}
              onConfirm={async () => {
                await deleteRule(r.id);
                message.success(t('common.msg.deleted'));
                reload();
              }}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <RouteTabsPage tabs={CONFIG_TABS}>
      <ProTable<IncidentRule>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        cardBordered
        headerTitle={
          has('incident.rule.create') && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.incident.rule.create')}
            </CreateButton>
          )
        }
        request={async (params) =>
          toTableResult(
            await listRules({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword?.trim() || undefined,
              enabled: parseBoolParam(params.enabled),
            }),
          )
        }
        columnEmptyText={t('common.empty')}
        search={{ labelWidth: 'auto' }}
        scroll={{ x: 'max-content' }}
      />
      {formRow !== undefined && (
        <RuleDrawer
          rule={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={() => {
            setFormRow(undefined);
            reload();
          }}
        />
      )}
    </RouteTabsPage>
  );
};

export default RuleList;
