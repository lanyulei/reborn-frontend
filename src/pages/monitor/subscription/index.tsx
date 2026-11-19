/**
 * 告警订阅：按规则分组 / 规则 / 数据源 / 级别 / 事件标签订阅「不归我管，但我想知道」的告警。
 * 页签：我的订阅 / 全部订阅（数据范围内）。它与「通知管理 → 订阅」按事件类型的订阅是两回事。
 * 元素权限决定操作是否展示；编辑、启停、删除另要求 canManage（所有者或对全部订阅分组可管理）。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, App, Select, Space, Tag, Tooltip, theme } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import {
  ConfirmLink,
  CreateButton,
  DeleteConfirmLink,
} from '@/components/TableActions';
import { ENABLED_META } from '@/constants';
import {
  deleteAlertSubscription,
  listAlertSubscriptions,
  updateAlertSubscription,
} from '@/services/monitor/subscription';
import type { MonitorAlertSubscription } from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { formatTime } from '../components/format';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import { NOTICE_TABS } from '../components/groups';
import { useDatasourceOptions, useRuleGroups } from '../components/hooks';
import { MatcherTags } from '../components/MatchersEditor';
import { MONITOR_LIMITS } from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { ManageLink, RefTags, SeverityTag } from '../components/tags';
import { SubscriptionDrawer } from './SubscriptionDrawer';

type Scope = 'mine' | 'all';

const SubscriptionList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const { styles } = useMonitorStyles();
  const { token } = theme.useToken();
  const { groups } = useRuleGroups();
  const datasources = useDatasourceOptions();
  const enabledEnum = useValueEnum(ENABLED_META);

  const [scope, setScope] = useState<Scope>('mine');
  // undefined = 抽屉关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<
    MonitorAlertSubscription | null | undefined
  >(undefined);

  const reload = () => actionRef.current?.reload();
  const hasAnyAction =
    has('monitor.subscription.edit') || has('monitor.subscription.delete');

  /** 启停：没有独立接口，整组回传 spec 只改 enabled */
  const toggle = async (record: MonitorAlertSubscription, enabled: boolean) => {
    await updateAlertSubscription(record.id, {
      spec: { ...record.spec, enabled },
      version: record.version,
    });
    message.success(t('common.msg.updated'));
    reload();
  };

  const columns: ProColumns<MonitorAlertSubscription>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.monitor.subscription.search.placeholder'),
        maxLength: MONITOR_LIMITS.keywordMax,
      },
    },
    {
      title: t('pages.monitor.common.name'),
      dataIndex: ['spec', 'name'],
      search: false,
    },
    // 启停状态紧跟名称（同资源实例列表）：表格放不下而横向滚动时，它不会被右侧固定的操作列挡住
    {
      title: t('common.column.status'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
      renderText: (_, record) => String(record.spec.enabled ?? false),
    },
    {
      title: t('pages.monitor.subscription.column.owner'),
      dataIndex: 'ownerName',
      search: false,
      width: 110,
      hideInTable: scope === 'mine',
      renderText: (value?: string) => value || t('common.empty'),
    },
    {
      title: t('pages.monitor.subscription.form.groups'),
      dataIndex: 'groupId',
      // value / onChange 由搜索表单注入到返回的元素上，这里不要自己传（见 LabelFilter 的说明）
      formItemRender: () => (
        <GroupTreeSelect
          groups={groups}
          placeholder={t('pages.monitor.common.group.placeholder')}
        />
      ),
      render: (_, record) => {
        const outOfScope = new Set(record.outOfScopeGroupIds ?? []);
        return (
          <span className={styles.tagList} style={{ maxWidth: 180 }}>
            {(record.groups ?? []).map((ref) =>
              ref.missing || outOfScope.has(ref.id) ? (
                <Tooltip
                  key={ref.id}
                  title={t(
                    ref.missing
                      ? 'pages.monitor.ref.missing'
                      : 'pages.monitor.subscription.outOfScope',
                  )}
                >
                  <Tag color="warning">
                    <del>{ref.name || ref.id}</del>
                  </Tag>
                </Tooltip>
              ) : (
                <Tag key={ref.id}>{ref.name || ref.id}</Tag>
              ),
            )}
          </span>
        );
      },
    },
    {
      title: t('pages.monitor.subscription.column.filter'),
      dataIndex: 'filter',
      search: false,
      render: (_, record) => {
        const { spec } = record;
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              maxWidth: 220,
            }}
          >
            <span>
              {(spec.severities ?? []).map((severity) => (
                <span key={severity} style={{ marginInlineEnd: 4 }}>
                  <SeverityTag severity={severity} />
                </span>
              ))}
              {spec.onFiring && (
                <Tag>{t('pages.monitor.subscription.event.firing')}</Tag>
              )}
              {spec.onResolved && (
                <Tag>{t('pages.monitor.subscription.event.resolved')}</Tag>
              )}
            </span>
            {!!record.rules?.length && <RefTags refs={record.rules} max={2} />}
            {!!record.datasources?.length && (
              <RefTags refs={record.datasources} max={2} />
            )}
            {!!spec.matchers?.length && (
              <MatcherTags matchers={spec.matchers} />
            )}
          </div>
        );
      },
    },
    {
      title: t('pages.monitor.subscription.column.receivers'),
      dataIndex: 'receivers',
      search: false,
      render: (_, record) => {
        const receivers = record.spec.receivers ?? {};
        return (
          <span className={styles.tagList} style={{ maxWidth: 200 }}>
            {receivers.self && (
              <Tag color="blue">
                {scope === 'mine'
                  ? t('pages.monitor.subscription.receiver.me')
                  : t('pages.monitor.subscription.receiver.owner')}
              </Tag>
            )}
            {!!record.receiverUsers?.length && (
              <RefTags refs={record.receiverUsers} max={3} />
            )}
            {!!record.receiverSchedules?.length && (
              <RefTags refs={record.receiverSchedules} max={2} />
            )}
            {(receivers.groups ?? []).map((group) => (
              <Tag key={group} color="cyan">
                {group}
              </Tag>
            ))}
          </span>
        );
      },
    },
    {
      title: t('pages.monitor.subscription.column.lastHitTime'),
      dataIndex: 'lastHitTime',
      search: false,
      width: 170,
      renderText: (value?: string) =>
        formatTime(value) || t('pages.monitor.subscription.neverHit'),
    },
    {
      title: t('pages.monitor.subscription.column.hitCount7d'),
      dataIndex: 'hitCount7d',
      search: false,
      width: 100,
      renderText: (value?: number) => value ?? 0,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 170,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('monitor.subscription.edit')) {
          actions.push(
            <ManageLink
              key="edit"
              canManage={record.canManage}
              onClick={() => setFormRow(record)}
            >
              {t('common.action.edit')}
            </ManageLink>,
          );
          if (record.canManage) {
            actions.push(
              record.spec.enabled ? (
                <ConfirmLink
                  key="toggle"
                  title={t('pages.monitor.subscription.disable.title', {
                    name: record.spec.name,
                  })}
                  description={t(
                    'pages.monitor.subscription.disable.description',
                  )}
                  onConfirm={() => toggle(record, false)}
                >
                  {t('pages.monitor.action.disable')}
                </ConfirmLink>
              ) : (
                <a
                  key="toggle"
                  onClick={() =>
                    void toggle(record, true).catch(() => undefined)
                  }
                >
                  {t('pages.monitor.action.enable')}
                </a>
              ),
            );
          }
        }
        if (has('monitor.subscription.delete')) {
          actions.push(
            record.canManage ? (
              <DeleteConfirmLink
                key="delete"
                title={t('pages.monitor.subscription.delete.title', {
                  name: record.spec.name,
                })}
                description={t('pages.monitor.subscription.delete.description')}
                onConfirm={async () => {
                  await deleteAlertSubscription(record.id);
                  message.success(t('common.msg.deleted'));
                  reload();
                }}
              />
            ) : (
              <ManageLink key="delete" onClick={() => undefined}>
                {t('common.action.delete')}
              </ManageLink>
            ),
          );
        }
        return actions.length ? actions : t('common.empty');
      },
    },
  ];

  return (
    <RouteTabsPage tabs={NOTICE_TABS}>
      <Alert
        type="info"
        showIcon
        title={t('pages.monitor.subscription.notice')}
        style={{ marginBottom: 16 }}
      />
      <ProTable<MonitorAlertSubscription>
        cardBordered
        // 换范围即重建：筛选与分页不串
        key={scope}
        headerTitle={
          /* 工具栏标题容器自带 500 字重 / 16px：恢复默认字体，控件不加粗不加黑 */
          <Space
            size={12}
            style={{ fontSize: token.fontSize, fontWeight: 400 }}
          >
            {has('monitor.subscription.create') && (
              <CreateButton onClick={() => setFormRow(null)}>
                {t('pages.monitor.subscription.create.title')}
              </CreateButton>
            )}
            {/* 范围切换：我的订阅 / 全部订阅 */}
            <Select<Scope>
              style={{ width: 110 }}
              value={scope}
              onChange={setScope}
              options={[
                {
                  value: 'mine',
                  label: t('pages.monitor.subscription.tab.mine'),
                },
                {
                  value: 'all',
                  label: t('pages.monitor.subscription.tab.all'),
                },
              ]}
            />
          </Space>
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        columnEmptyText={t('common.empty')}
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          const result = await listAlertSubscriptions({
            page: params.current,
            pageSize: params.pageSize,
            scope,
            keyword: params.keyword || undefined,
            enabled: parseBoolParam(params.enabled),
            groupId: params.groupId || undefined,
          });
          return toTableResult(result);
        }}
      />
      {formRow !== undefined && (
        <SubscriptionDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          groups={groups}
          datasources={datasources}
          onClose={() => setFormRow(undefined)}
          onSaved={reload}
        />
      )}
    </RouteTabsPage>
  );
};

export default SubscriptionList;
