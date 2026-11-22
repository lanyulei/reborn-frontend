/**
 * 告警事件：活跃告警（告警中）/ 历史告警（已恢复或已关闭）两个页签。活跃告警可切换聚合视图
 * （按规则 / 级别 / 分组 / 某个标签折成卡片，点击卡片即按它筛选表格；聚合方式与筛选可存为视图）
 * 并自动刷新。事件操作：行内与详情里认领 / 取消认领 / 转交 / 备注 / 转工单 / 手动关闭，活跃告警
 * 多选后批量认领 / 关闭；详情抽屉里另有「屏蔽」「订阅同类告警」快捷入口。
 */
import { DownOutlined, SyncOutlined } from '@ant-design/icons';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Drawer,
  Dropdown,
  Input,
  type MenuProps,
  Select,
  Space,
  Spin,
  Tag,
  theme,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NOTIFY_SEVERITY_META } from '@/constants';
import {
  type AlertFilterParams,
  aggregateAlerts,
  type ListAlertsParams,
  listAlerts,
} from '@/services/monitor/alert';
import { getMonitorErrorMessage } from '@/services/monitor/request';
import type {
  AlertAggregate,
  MonitorAlert,
  MonitorAlertView,
  MonitorHandleState,
  MonitorSeverity,
} from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, timeRangeColumn, toTableResult } from '@/utils/table';
import { usePageVisible } from '@/utils/usePageVisible';
import {
  formatDuration,
  formatTime,
  formatValue,
  parseLabelFilters,
} from '../components/format';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import { useDatasourceOptions, useRuleGroups } from '../components/hooks';
import { labelFilterSearch } from '../components/LabelFilter';
import {
  ALERT_STATUS_META,
  HANDLE_STATE_META,
  HANDLE_STATE_ORDER,
  LABEL_NAME_REGEX,
  MONITOR_LIMITS,
} from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { LabelTags, SeverityBar, SeverityTag } from '../components/tags';
import { AlertDetailView } from './AlertDetail';
import { type AlertBatchAction, AlertBatchModal } from './BatchModal';
import { type AlertOp, alertOpStates } from './meta';
import { OpLink, useAlertOps, useOpDisabledTip } from './OpDialogs';
import { HandleStateTags, muteText } from './Related';
import { InhibitSource } from './Timeline';
import { AlertViewBar } from './Views';

type TabKey = 'active' | 'history';
type AggBy = 'none' | 'rule' | 'severity' | 'group' | 'label';

const AGG_OPTIONS: readonly AggBy[] = [
  'none',
  'rule',
  'severity',
  'group',
  'label',
];
/** 自动刷新间隔（秒；0 = 关闭） */
const REFRESH_OPTIONS = [0, 10, 30, 60] as const;
/** 紧凑模式下每行显示的标签数 */
const COMPACT_LABELS = 3;
/** 操作列「更多」里的操作（认领 / 取消认领直接列在外面） */
const MORE_OPS: readonly AlertOp[] = ['transfer', 'comment', 'ticket', 'close'];
/** 是 / 否筛选项的表单值 */
const boolField = (value?: boolean | null) =>
  value === true ? 'true' : value === false ? 'false' : undefined;

/** 点击聚合卡片后附加到表格上的筛选 */
interface CardFilter {
  by: Exclude<AggBy, 'none'>;
  key: string;
  name: string;
  /** by=label 时的标签名 */
  label?: string;
}

const AlertList: React.FC = () => {
  const t = useT();
  const { styles, cx } = useMonitorStyles();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  // 规则列表「活跃告警数」带规则 ID（与显示用的名称）跳转过来
  const [searchParams, setSearchParams] = useSearchParams();
  const [ruleFilter, setRuleFilter] = useState(() => {
    const id = searchParams.get('ruleId');
    return id ? { id, name: searchParams.get('ruleName') || id } : undefined;
  });
  /** 取消按规则查看：地址栏里的参数一并去掉，否则刷新或分享链接又会带上这个筛选 */
  const clearRuleFilter = () => {
    setRuleFilter(undefined);
    const next = new URLSearchParams(searchParams);
    next.delete('ruleId');
    next.delete('ruleName');
    setSearchParams(next, { replace: true });
  };
  // 资源详情页、事件详情的「该资源的告警」带资源 ID（与显示用的名称）跳转过来
  const [ciFilter, setCiFilter] = useState(() => {
    const id = searchParams.get('ciId');
    return id ? { id, name: searchParams.get('ciName') || id } : undefined;
  });
  const clearCiFilter = () => {
    setCiFilter(undefined);
    const next = new URLSearchParams(searchParams);
    next.delete('ciId');
    next.delete('ciName');
    setSearchParams(next, { replace: true });
  };
  const has = usePermissions();
  const opTip = useOpDisabledTip();
  const { groups, isAdmin } = useRuleGroups();
  const datasources = useDatasourceOptions();
  const severityEnum = useValueEnum(NOTIFY_SEVERITY_META);
  const statusEnum = useValueEnum(ALERT_STATUS_META);

  const [tab, setTab] = useState<TabKey>('active');
  const [detailId, setDetailId] = useState<string>();
  const [compact, setCompact] = useState(true);
  const [refreshS, setRefreshS] = useState<number>(0);
  /** 查看同一对象（指纹）的历次告警 */
  const [fingerprint, setFingerprint] = useState<string>();

  const [aggBy, setAggBy] = useState<AggBy>('none');
  const [aggLabel, setAggLabel] = useState('instance');
  const [aggItems, setAggItems] = useState<AlertAggregate[]>([]);
  const [aggTotal, setAggTotal] = useState(0);
  const [aggLoading, setAggLoading] = useState(false);
  /** 展示中的聚合结果对应的 aggKey；与当前 aggKey 不一致（刚切换 / 刚回到页签）时按加载中处理 */
  const [aggLoadedKey, setAggLoadedKey] = useState<string>();
  /** 聚合请求失败的提示；失败不能装作「没有活跃告警」 */
  const [aggError, setAggError] = useState<string>();
  const [cardFilter, setCardFilter] = useState<CardFilter>();
  // 表格最近一次请求用的公共筛选（聚合沿用同一组条件）；tick 变化即重取聚合
  const lastFilter = useRef<AlertFilterParams>({});
  const [tick, setTick] = useState(0);
  // 表格最近一次请求里是否带了聚合接口不支持的条件（关键字 / 我负责的 / 处理状态 / 指定规则 / 指定资源）
  const [aggPartial, setAggPartial] = useState(false);
  // 表格最近一次请求里是否带了聚合也会套用的筛选（分组 / 数据源 / 级别 / 标签 / 屏蔽 / 认领 / 抑制）
  const [aggFiltered, setAggFiltered] = useState(false);
  // 表格最近一次请求里表单的标签筛选项数（卡片的标签筛选要占其中一个名额）
  const formLabelCount = useRef(0);

  // 事件操作（行内）与批量操作
  const ops = useAlertOps(() => actionRef.current?.reload());
  const [selectedRows, setSelectedRows] = useState<MonitorAlert[]>([]);
  const [batch, setBatch] = useState<AlertBatchAction>();
  const canBatchAck = has('monitor.alert.ack');
  const canBatchClose = has('monitor.alert.close');
  // 聚合视图：当前套用的视图、保存弹窗是否开着
  const [viewId, setViewId] = useState<string>();
  const [viewDialog, setViewDialog] = useState(false);
  const paused = Boolean(detailId || ops.open || batch || viewDialog);

  const aggKey =
    aggBy === 'none'
      ? undefined
      : aggBy === 'label'
        ? LABEL_NAME_REGEX.test(aggLabel)
          ? `label:${aggLabel}`
          : undefined
        : aggBy;
  // 新聚合方式的结果还没回来：不显示空态，避免闪「当前没有活跃告警」
  const aggStale = aggLoadedKey !== aggKey;

  useEffect(() => {
    if (tab !== 'active' || !aggKey) {
      setAggItems([]);
      setAggLoadedKey(undefined);
      return;
    }
    let cancelled = false;
    setAggLoading(true);
    setAggError(undefined);
    aggregateAlerts({ ...lastFilter.current, by: aggKey })
      .then((result) => {
        if (cancelled) return;
        setAggItems(result.items ?? []);
        setAggTotal(result.total ?? 0);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setAggItems([]);
        setAggError(getMonitorErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) {
          setAggLoading(false);
          setAggLoadedKey(aggKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab, aggKey, tick]);

  // 自动刷新：只在活跃告警页签生效，抽屉或任一弹窗打开时暂停（避免正在看的内容跳动）；
  // 后台标签页不轮询，回到前台时补一次刷新
  const autoRefresh = Boolean(refreshS) && tab === 'active' && !paused;
  const autoRefreshRef = useRef(autoRefresh);
  autoRefreshRef.current = autoRefresh;
  const visible = usePageVisible(() => {
    if (autoRefreshRef.current) actionRef.current?.reload();
  });
  useEffect(() => {
    if (!autoRefresh || !visible) return;
    const timer = setInterval(
      () => actionRef.current?.reload(),
      refreshS * 1000,
    );
    return () => clearInterval(timer);
  }, [autoRefresh, refreshS, visible]);

  const showHistory = useCallback((value: string) => {
    setDetailId(undefined);
    setCardFilter(undefined);
    setFingerprint(value);
    setTab('history');
  }, []);

  /** 详情里「该资源的告警」：关掉抽屉，按资源筛选当前页签 */
  const showCi = (ci: { id: string; name: string }) => {
    setDetailId(undefined);
    setCardFilter(undefined);
    setCiFilter(ci);
    const next = new URLSearchParams(searchParams);
    next.set('ciId', ci.id);
    next.set('ciName', ci.name);
    setSearchParams(next, { replace: true });
  };

  /** 套用视图：聚合方式与筛选条件写进页面与搜索表单，然后重新查询 */
  const applyView = (view: MonitorAlertView) => {
    const by = view.spec.by ?? '';
    if (by.startsWith('label:')) {
      setAggBy('label');
      setAggLabel(by.slice('label:'.length));
    } else if (by === 'rule' || by === 'severity' || by === 'group') {
      setAggBy(by);
    }
    setCardFilter(undefined);
    const filters = view.spec.filters;
    // 视图没有设的条件要清掉，否则残留的旧条件会混进来
    formRef.current?.setFieldsValue({
      groupId: filters?.groupId || undefined,
      datasourceId: filters?.datasourceId || undefined,
      // 级别下拉的取值是字符串（valueEnum 的键）
      severities: (filters?.severities ?? []).map(String),
      muted: boolField(filters?.muted),
      acked: boolField(filters?.acked),
      inhibited: boolField(filters?.inhibited),
      labels: filters?.labels?.length ? filters.labels : undefined,
    });
    formRef.current?.submit();
  };

  const openBatch = (action: AlertBatchAction) => {
    if (batchTargets(action).length === 0) {
      message.warning(t('pages.monitor.alert.batch.none'));
      return;
    }
    setBatch(action);
  };
  /** 选中的事件里当前用户能执行该操作的（数据范围不够的跳过，并在弹窗里说明） */
  const batchTargets = (action: AlertBatchAction) =>
    selectedRows.filter((alert) =>
      action === 'ack' ? alert.canAck : alert.canManage && !alert.closing,
    );

  const columns: ProColumns<MonitorAlert>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.monitor.alert.search.placeholder'),
        maxLength: MONITOR_LIMITS.keywordMax,
      },
    },
    {
      title: t('pages.monitor.alert.column.severity'),
      dataIndex: 'severities',
      valueType: 'select',
      valueEnum: severityEnum,
      fieldProps: { mode: 'multiple' },
      width: 96,
      render: (_, record) => (
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <SeverityBar severity={record.severity} />
          <SeverityTag severity={record.severity} />
        </span>
      ),
    },
    {
      title: t('pages.monitor.alert.column.rule'),
      dataIndex: 'ruleName',
      search: false,
      render: (_, record) => (
        <>
          <a onClick={() => setDetailId(record.id)}>{record.ruleName}</a>
          {record.muted && (
            <Tag
              style={{ marginInlineStart: 8 }}
              title={record.muteName || undefined}
            >
              {t('pages.monitor.alert.muted')}
            </Tag>
          )}
        </>
      ),
    },
    {
      title: t('pages.monitor.alert.column.labels'),
      dataIndex: 'labels',
      tooltip: t('pages.monitor.alert.search.labels.tooltip'),
      ...labelFilterSearch<MonitorAlert>(t, 'instance=web-01'),
      render: (_, record) => (
        <LabelTags
          labels={record.labels}
          max={compact ? COMPACT_LABELS : undefined}
        />
      ),
    },
    {
      title: t('pages.monitor.alert.column.value'),
      dataIndex: 'value',
      search: false,
      width: 100,
      render: (_, record) => formatValue(record.value) || t('common.empty'),
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
      render: (_, record) => record.groupName || t('common.empty'),
    },
    {
      title: t('pages.monitor.common.datasource'),
      dataIndex: 'datasourceId',
      valueType: 'select',
      fieldProps: { options: datasources.options, showSearch: true },
      render: (_, record) => record.datasourceName || t('common.empty'),
    },
    {
      title: t('pages.monitor.alert.search.muted'),
      dataIndex: 'muted',
      hideInTable: true,
      valueEnum: {
        true: { text: t('pages.monitor.alert.muted') },
        false: { text: t('pages.monitor.alert.notMuted') },
      },
    },
    {
      title: t('pages.monitor.alert.column.handleState'),
      dataIndex: 'handleState',
      valueType: 'select',
      fieldProps: {
        options: HANDLE_STATE_ORDER.map((state) => ({
          value: state,
          label: t(HANDLE_STATE_META[state].textId),
        })),
      },
      // 处理状态只对告警中的事件有意义
      hideInTable: tab !== 'active',
      search: tab === 'active' ? undefined : false,
      render: (_, record) => {
        const mute = record.muted ? muteText(record, t) : '';
        return (
          <>
            <HandleStateTags alert={record} />
            {record.ackUserId && (
              <div className={styles.hint}>
                {record.ackUserName || record.ackUserId}
              </div>
            )}
            {record.inhibited && (
              <div className={styles.hint}>
                <InhibitSource
                  kind={record.inhibitKind}
                  inhibitId={record.inhibitId}
                  inhibitName={record.inhibitName}
                  alertId={record.inhibitAlertId}
                  alertName={record.inhibitAlertName}
                />
              </div>
            )}
            {mute && <div className={styles.hint}>{mute}</div>}
          </>
        );
      },
    },
    {
      title: t('pages.monitor.alert.search.acked'),
      dataIndex: 'acked',
      hideInTable: true,
      valueEnum: {
        true: { text: t('pages.monitor.alert.acked') },
        false: { text: t('pages.monitor.alert.notAcked') },
      },
    },
    {
      title: t('pages.monitor.alert.search.inhibited'),
      dataIndex: 'inhibited',
      hideInTable: true,
      valueEnum: {
        true: { text: t('pages.monitor.alert.inhibited') },
        false: { text: t('pages.monitor.alert.notInhibited') },
      },
    },
    {
      title: t('pages.monitor.alert.search.mine'),
      dataIndex: 'mine',
      hideInTable: true,
      tooltip: t('pages.monitor.alert.search.mine.tooltip'),
      valueEnum: { true: { text: t('pages.monitor.alert.search.mine.only') } },
    },
    // 触发时间范围只在历史告警页签提供
    ...(tab === 'history'
      ? [
          {
            ...timeRangeColumn<MonitorAlert>(t, {
              start: 'fireTimeStart',
              end: 'fireTimeEnd',
            }),
            title: t('pages.monitor.alert.search.fireTime'),
          },
        ]
      : []),
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      search: false,
      width: 90,
      hideInTable: tab !== 'history',
    },
    {
      title: t('pages.monitor.alert.column.firstFireTime'),
      dataIndex: 'firstFireTime',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    {
      title: t('pages.monitor.alert.column.resolveTime'),
      dataIndex: 'resolveTime',
      valueType: 'dateTime',
      search: false,
      width: 170,
      hideInTable: tab !== 'history',
    },
    {
      title: t('pages.monitor.alert.column.duration'),
      dataIndex: 'durationS',
      search: false,
      width: 130,
      renderText: (value?: string) => formatDuration(value, t),
    },
    {
      title: t('pages.monitor.alert.column.notifyCount'),
      dataIndex: 'notifyCount',
      search: false,
      width: 90,
      renderText: (value?: number) => value ?? 0,
    },
    {
      title: t('pages.monitor.alert.column.ackUser'),
      dataIndex: 'ackUserName',
      search: false,
      hideInTable: tab !== 'history',
      render: (_, record) =>
        record.ackUserName || record.ackUserId || t('common.empty'),
    },
    {
      title: t('pages.monitor.alert.column.ackDuration'),
      dataIndex: 'ackDurationS',
      search: false,
      width: 130,
      hideInTable: tab !== 'history',
      render: (_, record) =>
        record.ackUserId
          ? formatDuration(record.ackDurationS, t)
          : t('common.empty'),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      render: (_, record) => {
        const states = alertOpStates(record, has);
        const links = [
          <a key="detail" onClick={() => setDetailId(record.id)}>
            {t('pages.monitor.alert.action.detail')}
          </a>,
        ];
        for (const op of ['ack', 'unack'] as const) {
          if (states[op].show) {
            links.push(
              <OpLink
                key={op}
                op={op}
                state={states[op]}
                onClick={() => void ops.run(op, record)}
              />,
            );
          }
        }
        const items: MenuProps['items'] = MORE_OPS.filter(
          (op) => states[op].show,
        ).map((op) => ({
          key: op,
          danger: op === 'close',
          disabled: !states[op].enabled,
          title: states[op].enabled ? undefined : opTip(op),
          label: t(`pages.monitor.alert.op.${op}`),
          onClick: () => void ops.run(op, record),
        }));
        if (items.length > 0) {
          links.push(
            <Dropdown key="more" menu={{ items }}>
              <a>
                {t('common.action.more')} <DownOutlined />
              </a>
            </Dropdown>,
          );
        }
        return links;
      },
    },
  ];

  const cardKey = (item: AlertAggregate) => item.key ?? '';
  const pickCard = (item: AlertAggregate) => {
    if (aggBy === 'none') return;
    const key = cardKey(item);
    const picked = cardFilter?.by === aggBy && cardFilter.key === key;
    // 标签筛选至多 5 项：表单里已填满时卡片的那一项加不进去，不能装作已按它筛选
    if (
      aggBy === 'label' &&
      !picked &&
      formLabelCount.current >= MONITOR_LIMITS.labelFilterMax
    ) {
      message.warning(
        t('pages.monitor.alert.agg.labelLimit', {
          max: MONITOR_LIMITS.labelFilterMax,
        }),
      );
      return;
    }
    setCardFilter(
      picked
        ? undefined
        : {
            by: aggBy,
            key,
            name: item.name || key,
            label: aggBy === 'label' ? aggLabel : undefined,
          },
    );
  };

  return (
    <PageContainer
      title={false}
      tabList={[
        { key: 'active', tab: t('pages.monitor.alert.tab.active') },
        { key: 'history', tab: t('pages.monitor.alert.tab.history') },
      ]}
      tabActiveKey={tab}
      onTabChange={(key) => {
        setTab(key as TabKey);
        setCardFilter(undefined);
        setFingerprint(undefined);
        setSelectedRows([]);
      }}
    >
      {tab === 'active' && aggKey && aggPartial && (
        <Alert
          type="warning"
          showIcon
          title={t('pages.monitor.alert.agg.partial')}
          style={{ marginBottom: 12 }}
        />
      )}
      {tab === 'active' && aggKey && (
        <Spin spinning={aggLoading || aggStale}>
          {aggItems.length === 0 ? (
            aggError ? (
              <Alert
                type="error"
                showIcon
                title={t('pages.monitor.alert.agg.error')}
                description={aggError}
              />
            ) : (
              // 没有可聚合的告警：没有筛选时不占位（下方表格自有空态）；有筛选时用一行字说明
              // 是筛选条件下没有，而不是系统里没有活跃告警
              !aggLoading &&
              !aggStale &&
              aggFiltered && (
                <div className={styles.hint} style={{ marginBottom: 8 }}>
                  {t('pages.monitor.alert.agg.emptyFiltered')}
                </div>
              )
            )
          ) : (
            <>
              <div className={styles.hint} style={{ marginBottom: 8 }}>
                {t('pages.monitor.alert.agg.summary', {
                  total: aggTotal,
                  count: aggItems.length,
                })}
              </div>
              <div className={styles.aggGrid}>
                {aggItems.map((item) => {
                  const active =
                    cardFilter?.by === aggBy &&
                    cardFilter.key === cardKey(item);
                  const body = (
                    <>
                      <SeverityBar
                        severity={item.maxSeverity}
                        className={styles.aggCardBar}
                      />
                      <div className={styles.aggCardName} title={item.name}>
                        {item.name ||
                          t('pages.monitor.alert.agg.noLabel', {
                            label: aggLabel,
                          })}
                      </div>
                      <div className={styles.aggCardCount}>
                        {item.count ?? 0}
                      </div>
                      <div className={styles.hint}>
                        {formatTime(item.lastFireTime)}
                      </div>
                    </>
                  );
                  // 没有该标签的事件无法用「标签=值」筛选：卡片只展示
                  return aggBy === 'label' && !item.key ? (
                    <div key={cardKey(item)} className={styles.aggCard}>
                      {body}
                    </div>
                  ) : (
                    <button
                      type="button"
                      key={cardKey(item)}
                      className={cx(
                        styles.aggCard,
                        styles.aggCardButton,
                        active && styles.aggCardActive,
                      )}
                      aria-pressed={active}
                      onClick={() => pickCard(item)}
                    >
                      {body}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Spin>
      )}

      {cardFilter && (
        <Alert
          type="info"
          showIcon
          closable={{ onClose: () => setCardFilter(undefined) }}
          title={t('pages.monitor.alert.agg.filtered', {
            name: cardFilter.name,
          })}
          style={{ marginBottom: 16 }}
        />
      )}
      {ruleFilter && (
        <Alert
          type="info"
          showIcon
          closable={{ onClose: clearRuleFilter }}
          title={t('pages.monitor.alert.rule.filtered', {
            name: ruleFilter.name,
          })}
          style={{ marginBottom: 16 }}
        />
      )}
      {ciFilter && (
        <Alert
          type="info"
          showIcon
          closable={{ onClose: clearCiFilter }}
          title={t('pages.monitor.alert.ci.filtered', {
            name: ciFilter.name,
          })}
          style={{ marginBottom: 16 }}
        />
      )}
      {fingerprint && (
        <Alert
          type="info"
          showIcon
          closable={{ onClose: () => setFingerprint(undefined) }}
          title={t('pages.monitor.alert.fingerprint.filtered', { fingerprint })}
          style={{ marginBottom: 16 }}
        />
      )}

      <ProTable<MonitorAlert>
        cardBordered
        // 换页签即重建：两个页签的筛选项与列不同
        key={tab}
        rowKey="id"
        actionRef={actionRef}
        formRef={formRef}
        search={{ labelWidth: 'auto' }}
        // 标签筛选项带校验：不合法时在表单项内提示并阻止查询
        form={{ ignoreRules: false }}
        columns={columns}
        columnEmptyText={t('common.empty')}
        scroll={{ x: 'max-content' }}
        params={{ cardFilter, fingerprint, ruleFilter, ciFilter }}
        rowSelection={
          tab === 'active' && (canBatchAck || canBatchClose)
            ? {
                selectedRowKeys: selectedRows.map((alert) => alert.id),
                // 勾选只保留当前页：每次刷新按返回的数据收敛，已恢复 / 翻页离开的告警不再滞留在勾选里
                onChange: (_, rows) => {
                  const picked = rows.filter(Boolean);
                  // 批量操作一次至多 200 条：超出的不保留勾选，并说明（而不是悄悄丢掉）
                  if (picked.length > MONITOR_LIMITS.batchMax) {
                    message.warning(
                      t('pages.monitor.alert.batch.limit', {
                        max: MONITOR_LIMITS.batchMax,
                      }),
                    );
                  }
                  setSelectedRows(picked.slice(0, MONITOR_LIMITS.batchMax));
                },
              }
            : undefined
        }
        tableAlertOptionRender={() => (
          <Space size={8}>
            {canBatchAck && (
              <Button type="link" size="small" onClick={() => openBatch('ack')}>
                {t('pages.monitor.alert.batch.ack')}
              </Button>
            )}
            {canBatchClose && (
              <Button
                type="link"
                size="small"
                danger
                onClick={() => openBatch('close')}
              >
                {t('pages.monitor.alert.batch.close')}
              </Button>
            )}
            <Button
              type="link"
              size="small"
              onClick={() => setSelectedRows([])}
            >
              {t('pages.monitor.rule.batch.clear')}
            </Button>
          </Space>
        )}
        headerTitle={
          tab === 'active' && (
            <span
              style={{
                display: 'inline-flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
                /* 工具栏标题容器自带 500 字重 / 16px：恢复默认字体，控件不加粗不加黑 */
                fontSize: token.fontSize,
                fontWeight: 400,
              }}
            >
              <Select<AggBy>
                style={{ width: 110 }}
                value={aggBy}
                options={AGG_OPTIONS.map((by) => ({
                  value: by,
                  label: t(`pages.monitor.alert.agg.by.${by}`),
                }))}
                onChange={(by) => {
                  setAggBy(by);
                  setCardFilter(undefined);
                }}
              />
              {aggBy === 'label' && (
                <Input
                  style={{ width: 160 }}
                  value={aggLabel}
                  maxLength={128}
                  status={LABEL_NAME_REGEX.test(aggLabel) ? undefined : 'error'}
                  placeholder={t('pages.monitor.matcher.label')}
                  onChange={(e) => {
                    setAggLabel(e.target.value.trim());
                    setCardFilter(undefined);
                  }}
                />
              )}
              <AlertViewBar
                isAdmin={isAdmin}
                activeId={viewId}
                onActiveChange={setViewId}
                onApply={applyView}
                getCurrent={() => ({ by: aggKey, filters: lastFilter.current })}
                onOpenChange={setViewDialog}
              />
              {/* 标签展示（紧凑 / 完整）也是筛选类操作：与聚合一起放在左侧。
                  Select 的选项值不支持 boolean，用字符串映射回 compact 状态 */}
              <Select<string>
                style={{ width: 100 }}
                value={compact ? 'compact' : 'full'}
                options={[
                  {
                    value: 'compact',
                    label: t('pages.monitor.alert.labels.compact'),
                  },
                  {
                    value: 'full',
                    label: t('pages.monitor.alert.labels.full'),
                  },
                ]}
                onChange={(value) => setCompact(value === 'compact')}
              />
              {/* 刷新配置同样放在左侧（历史页签不显示：headerTitle 本就只在活跃页签渲染） */}
              <Select<number>
                style={{ width: 150 }}
                value={refreshS}
                prefix={<SyncOutlined spin={refreshS > 0} />}
                options={REFRESH_OPTIONS.map((seconds) => ({
                  value: seconds,
                  label: t(`pages.monitor.alert.refresh.${seconds}`),
                }))}
                onChange={setRefreshS}
              />
            </span>
          )
        }
        request={async (params) => {
          const severities = ((params.severities as string[]) ?? []).map(
            (value) => Number(value) as MonitorSeverity,
          );
          const labels = parseLabelFilters(params.labels as string[]);
          const common: AlertFilterParams = {
            groupId: params.groupId || undefined,
            datasourceId: params.datasourceId || undefined,
            severities: severities.length ? severities : undefined,
            muted: parseBoolParam(params.muted),
            acked: parseBoolParam(params.acked),
            inhibited: parseBoolParam(params.inhibited),
            // 聚合与视图只带表单里的标签筛选（卡片的那一项是叠加在其上的）
            labels: labels.length ? [...labels] : undefined,
          };
          lastFilter.current = common;
          setAggFiltered(Object.values(common).some((v) => v !== undefined));
          setTick((n) => n + 1);

          const mine = parseBoolParam(params.mine);
          const handleState = params.handleState
            ? (Number(params.handleState) as MonitorHandleState)
            : undefined;
          formLabelCount.current = labels.length;
          setAggPartial(
            Boolean(
              params.keyword || mine || handleState || ruleFilter || ciFilter,
            ),
          );
          const query: ListAlertsParams = {
            ...common,
            page: params.current,
            pageSize: params.pageSize,
            statuses: tab === 'active' ? [1] : [2, 3],
            ruleId: ruleFilter?.id,
            ciId: ciFilter?.id,
            handleState: tab === 'active' ? handleState : undefined,
            keyword: params.keyword || undefined,
            mine,
            fingerprint: tab === 'history' ? fingerprint : undefined,
            fireTimeStart: params.fireTimeStart,
            fireTimeEnd: params.fireTimeEnd,
          };
          // 聚合卡片的筛选叠加在表单条件之上
          if (cardFilter?.by === 'rule') query.ruleId = cardFilter.key;
          if (cardFilter?.by === 'group') query.groupId = cardFilter.key;
          if (cardFilter?.by === 'severity') {
            query.severities = [Number(cardFilter.key) as MonitorSeverity];
          }
          if (cardFilter?.by === 'label' && cardFilter.label) {
            if (labels.length < MONITOR_LIMITS.labelFilterMax) {
              labels.push(`${cardFilter.label}=${cardFilter.key}`);
            } else {
              // 选中卡片之后表单里的标签又填满了：卡片的筛选放不下，撤掉并说明（横幅随之消失）
              message.warning(
                t('pages.monitor.alert.agg.labelLimit', {
                  max: MONITOR_LIMITS.labelFilterMax,
                }),
              );
              setCardFilter(undefined);
            }
          }
          query.labels = labels.length ? labels : undefined;
          const result = await listAlerts(query);
          // 勾选与当前页对齐：刷新后已不在列表里的（已恢复、已关闭）从勾选中剔除
          const ids = new Set((result.items ?? []).map((alert) => alert.id));
          setSelectedRows((prev) => prev.filter((alert) => ids.has(alert.id)));
          return toTableResult(result);
        }}
      />

      <Drawer
        title={t('pages.monitor.alert.detail.title')}
        size={960}
        open={!!detailId}
        destroyOnHidden
        onClose={() => {
          setDetailId(undefined);
          // 详情里可能新建了屏蔽规则：关闭后刷新列表的「已屏蔽」标记
          actionRef.current?.reload();
        }}
      >
        {detailId && (
          <AlertDetailView
            key={detailId}
            id={detailId}
            groups={groups}
            isAdmin={isAdmin}
            datasources={datasources}
            onShowHistory={showHistory}
            onShowCi={showCi}
          />
        )}
      </Drawer>
      {ops.dialogs}
      {batch && (
        <AlertBatchModal
          action={batch}
          alerts={batchTargets(batch)}
          skipped={selectedRows.length - batchTargets(batch).length}
          onClose={() => setBatch(undefined)}
          onDone={() => {
            setSelectedRows([]);
            actionRef.current?.reload();
          }}
        />
      )}
    </PageContainer>
  );
};

export default AlertList;
