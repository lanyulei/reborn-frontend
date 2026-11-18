/**
 * 记录规则：按固定周期预计算一条 PromQL，经数据源的 Remote Write 地址写回为新指标（名称即指标名），
 * 供告警规则引用。元素权限决定操作是否展示；编辑、启停、删除另要求对所在分组「可管理」（canManage）。
 * 数据源不可写（不存在、已停用或没有配置写入地址）的规则不会执行，列表里另行标出。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Badge, Switch, Tag, Tooltip } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { ENABLED_META } from '@/constants';
import { upstreamErrorText } from '@/services/monitor/errorText';
import {
  deleteRecordRule,
  listRecordRules,
  toggleRecordRule,
} from '@/services/monitor/recordRule';
import type {
  MonitorRecordRule,
  MonitorRecordStatus,
} from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useEnumText, useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { formatTime } from '../components/format';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import { METRIC_TABS } from '../components/groups';
import { useDatasourceOptions, useRuleGroups } from '../components/hooks';
import { MONITOR_LIMITS } from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { ManageLink } from '../components/tags';
import { RECORD_STATUS_META } from './meta';
import { RecordDrawer } from './RecordDrawer';

/** ProTable 徽标状态 → Badge 的 status */
const BADGE_STATUS = {
  Default: 'default',
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
  Processing: 'processing',
} as const;

const RecordRuleList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const { styles } = useMonitorStyles();
  const { groups, isAdmin } = useRuleGroups();
  const datasources = useDatasourceOptions();
  const enabledEnum = useValueEnum(ENABLED_META);
  const enabledText = useEnumText(ENABLED_META);
  const statusEnum = useValueEnum(RECORD_STATUS_META);
  const statusText = useEnumText(RECORD_STATUS_META);

  // undefined = 抽屉关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<MonitorRecordRule | null | undefined>(
    undefined,
  );
  const [toggling, setToggling] = useState<string>();

  const reload = () => actionRef.current?.reload();
  const canEdit = has('monitor.record.edit');
  const hasAnyAction = canEdit || has('monitor.record.delete');
  // 记录规则必须落在某个可管理的分组上：没有可管理的分组就不提供入口
  const canCreate =
    has('monitor.record.create') &&
    (isAdmin || groups.some((group) => (group.level ?? 0) >= 2));

  const toggle = async (record: MonitorRecordRule, enabled: boolean) => {
    setToggling(record.id);
    try {
      await toggleRecordRule(record.id, enabled);
      message.success(t('common.msg.updated'));
      reload();
    } finally {
      setToggling(undefined);
    }
  };

  /** 启用直接生效；停用会让指标不再产生，先确认 */
  const onToggle = (record: MonitorRecordRule, enabled: boolean) => {
    if (enabled) {
      void toggle(record, true).catch(() => undefined);
      return;
    }
    modal.confirm({
      title: t('pages.monitor.record.disable.title', {
        name: record.spec.name,
      }),
      content: t('pages.monitor.record.disable.description'),
      okButtonProps: { danger: true },
      onOk: () => toggle(record, false),
    });
  };

  const columns: ProColumns<MonitorRecordRule>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.monitor.record.search.placeholder'),
        maxLength: MONITOR_LIMITS.keywordMax,
      },
    },
    {
      title: t('pages.monitor.record.form.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      render: (_, record) => (
        <div>
          <code className={styles.code}>{record.spec.name}</code>
          {record.spec.description && (
            <div className={styles.hint}>{record.spec.description}</div>
          )}
        </div>
      ),
    },
    // 启停紧跟名称：表格横向滚动时不会被右侧固定的操作列挡住
    {
      title: t('common.column.status'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
      render: (_, record) => {
        const enabled = record.spec.enabled === true;
        if (!canEdit) {
          return (
            <Badge
              status={enabled ? 'success' : 'error'}
              text={enabledText(enabled ? 'true' : 'false')}
            />
          );
        }
        return (
          <Tooltip
            title={record.canManage ? undefined : t('pages.monitor.needManage')}
          >
            <Switch
              size="small"
              checked={enabled}
              disabled={!record.canManage}
              loading={toggling === record.id}
              aria-label={t('common.column.enabled')}
              onChange={(checked) => onToggle(record, checked)}
            />
          </Tooltip>
        );
      },
    },
    {
      title: t('pages.monitor.common.group'),
      dataIndex: 'groupId',
      // value / onChange 由搜索表单注入到返回的元素上，这里不要自己传（见 LabelFilter 的说明）
      formItemRender: () => (
        <GroupTreeSelect
          groups={groups}
          placeholder={t('pages.monitor.common.group.placeholder')}
        />
      ),
      render: (_, record) => record.groupName || record.spec.groupId,
    },
    {
      title: t('pages.monitor.common.datasource'),
      dataIndex: 'datasourceId',
      valueType: 'select',
      fieldProps: {
        options: datasources.options,
        showSearch: { optionFilterProp: 'label' },
      },
      render: (_, record) => (
        <span>
          {record.datasourceName || (
            <Tooltip title={t('pages.monitor.ref.missing')}>
              <del>{record.spec.datasourceId}</del>
            </Tooltip>
          )}
          {!record.writable && (
            <Tooltip title={t('pages.monitor.record.notWritable.tooltip')}>
              <Tag color="warning" style={{ marginInlineStart: 8 }}>
                {t('pages.monitor.record.notWritable')}
              </Tag>
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      title: 'PromQL',
      dataIndex: ['spec', 'expr'],
      search: false,
      width: 320,
      render: (_, record) => (
        <div
          className={styles.code}
          style={{
            maxWidth: 320,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
          title={record.spec.expr}
        >
          {record.spec.expr}
        </div>
      ),
    },
    {
      title: t('pages.monitor.record.form.interval'),
      dataIndex: ['spec', 'intervalS'],
      search: false,
      width: 100,
      renderText: (value?: number) =>
        value ? t('pages.monitor.unit.seconds', { n: value }) : undefined,
    },
    {
      title: t('pages.monitor.record.column.lastStatus'),
      dataIndex: 'lastStatus',
      valueEnum: statusEnum,
      width: 130,
      render: (_, record) => {
        const status = (record.lastStatus ?? 0) as MonitorRecordStatus;
        const error = upstreamErrorText(record.lastError);
        return (
          <Tooltip title={error || undefined}>
            <Badge
              status={
                BADGE_STATUS[RECORD_STATUS_META[status]?.status ?? 'Default']
              }
              text={statusText(status)}
            />
          </Tooltip>
        );
      },
    },
    {
      title: t('pages.monitor.record.column.lastEval'),
      dataIndex: 'lastEvalTime',
      search: false,
      render: (_, record) =>
        record.lastEvalTime ? (
          <div>
            <div>{formatTime(record.lastEvalTime)}</div>
            <div className={styles.hint}>
              {t('pages.monitor.record.column.lastEval.detail', {
                ms: record.lastDurationMs ?? 0,
                series: record.lastSeries ?? 0,
              })}
            </div>
          </div>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('common.column.updateTime'),
      dataIndex: 'updateTime',
      search: false,
      width: 170,
      render: (_, record) =>
        record.updateTime ? (
          <div>
            <div>{formatTime(record.updateTime)}</div>
            {record.updateUserName && (
              <div className={styles.hint}>{record.updateUserName}</div>
            )}
          </div>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 120,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (canEdit) {
          actions.push(
            <ManageLink
              key="edit"
              canManage={record.canManage}
              onClick={() => setFormRow(record)}
            >
              {t('common.action.edit')}
            </ManageLink>,
          );
        }
        if (has('monitor.record.delete')) {
          actions.push(
            record.canManage ? (
              <DeleteConfirmLink
                key="delete"
                title={t('pages.monitor.record.delete.title', {
                  name: record.spec.name,
                })}
                description={t('pages.monitor.record.delete.description')}
                onConfirm={async () => {
                  await deleteRecordRule(record.id);
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
    <RouteTabsPage tabs={METRIC_TABS}>
      <ProTable<MonitorRecordRule>
        cardBordered
        headerTitle={
          canCreate && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.monitor.record.create.title')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        columnEmptyText={t('common.empty')}
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          const result = await listRecordRules({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            groupId: params.groupId || undefined,
            datasourceId: params.datasourceId || undefined,
            enabled: parseBoolParam(params.enabled),
            // 0（未执行）也是有效的筛选值
            lastStatus:
              params.lastStatus !== undefined && params.lastStatus !== ''
                ? (Number(params.lastStatus) as MonitorRecordStatus)
                : undefined,
          });
          return toTableResult(result);
        }}
      />
      {formRow !== undefined && (
        <RecordDrawer
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

export default RecordRuleList;
