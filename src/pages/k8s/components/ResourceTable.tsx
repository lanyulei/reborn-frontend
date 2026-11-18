/**
 * 通用资源列表：列定义来自接口（k8scontract.ListResponse.columns），按列类型渲染。
 * - 走缓存的资源：服务端分页、关键字、状态筛选、排序与准确总数；订阅变更通知后自动刷新当前页。
 * - 其余资源（含 CRD）：只支持标签筛选，用 continue 游标「加载更多」，需手动刷新。
 */
import { ReloadOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, Flex, Input, Select, Tag, Tooltip } from 'antd';
import type React from 'react';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getK8sErrorMessage } from '@/services/k8s/request';
import { listResources } from '@/services/k8s/resource';
import type {
  GVR,
  ListCapabilities,
  ListColumn,
  ListQuery,
  ListRow,
} from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { AgeText, renderCell, StateBadge } from './cells';
import { gvrKey, STATE_META, STATE_ORDER } from './meta';
import { keepStream } from './stream';

/** 行里已单独成列的键：接口若也返回这些列则跳过，避免重复 */
const BUILTIN_KEYS = new Set(['name', 'namespace', 'age', 'createTime']);
const DEFAULT_PAGE_SIZE = 20;
/** 变更通知触发的刷新至少间隔这么久 */
const WATCH_REFRESH_MS = 1500;

export interface ResourceTableHandle {
  reload: () => void;
}

export interface ExtraColumn {
  key: string;
  title: string;
  width?: number;
  render: (row: ListRow) => React.ReactNode;
}

export interface ResourceTableProps {
  clusterId: string;
  gvr: GVR;
  /** 命名空间；空 = 全部命名空间（集群级资源恒为空） */
  namespace?: string;
  /** 是否命名空间级资源：全部命名空间时显示命名空间列 */
  namespaced?: boolean;
  /** 固定的筛选条件（如某节点上的 Pod、某工作负载下的 Pod） */
  fixed?: Pick<ListQuery, 'node' | 'owner' | 'labelSelector'>;
  /** 表头左侧的内容（新建按钮等） */
  toolbar?: React.ReactNode;
  /** 点击名称 */
  onOpen?: (row: ListRow) => void;
  /** 操作列 */
  rowActions?: (row: ListRow) => React.ReactNode[];
  /** 嵌在抽屉里：小号表格、无卡片边框 */
  compact?: boolean;
  /** 接口返回的列之后追加的列（数据由调用方另行提供，如命名空间的配额用量） */
  extraColumns?: ExtraColumn[];
  tableRef?: React.Ref<ResourceTableHandle>;
}

export const ResourceTable: React.FC<ResourceTableProps> = ({
  clusterId,
  gvr,
  namespace = '',
  namespaced = true,
  fixed,
  toolbar,
  onOpen,
  rowActions,
  compact,
  extraColumns,
  tableRef,
}) => {
  const t = useT();
  const [rows, setRows] = useState<ListRow[]>([]);
  const [columns, setColumns] = useState<ListColumn[]>([]);
  const [caps, setCaps] = useState<ListCapabilities>();
  const [total, setTotal] = useState(0);
  const [next, setNext] = useState('');
  const [partial, setPartial] = useState<string[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [keyword, setKeyword] = useState('');
  const [state, setState] = useState<string>();
  const [labelSelector, setLabelSelector] = useState('');
  const [sort, setSort] = useState<{ by: string; desc: boolean }>();
  const [showWide, setShowWide] = useState(false);
  /** 请求序号：只采纳最后一次请求的结果 */
  const seq = useRef(0);

  const resource = gvrKey(gvr);
  const fixedKey = JSON.stringify(fixed ?? {});

  const query = useMemo<ListQuery>(
    () => ({
      ...gvr,
      namespace: namespaced ? namespace : '',
      keyword: keyword || undefined,
      state,
      sortBy: sort?.by,
      sortDesc: sort?.desc,
      ...(JSON.parse(fixedKey) as ResourceTableProps['fixed']),
      // 固定的标签选择器与用户输入的取并（K8s 语法以逗号表示「且」）
      labelSelector:
        [
          (JSON.parse(fixedKey) as { labelSelector?: string }).labelSelector,
          labelSelector,
        ]
          .filter(Boolean)
          .join(',') || undefined,
    }),
    [
      resource,
      namespace,
      namespaced,
      keyword,
      state,
      sort,
      fixedKey,
      labelSelector,
    ],
  );

  const load = useCallback(
    async (opts: { silent?: boolean; more?: string } = {}) => {
      const id = ++seq.current;
      if (!opts.silent) setLoading(true);
      try {
        const res = await listResources(
          clusterId,
          { ...query, page, pageSize, continue: opts.more },
          { silent: true },
        );
        if (id !== seq.current) return;
        const list = res.rows ?? [];
        setRows((prev) => (opts.more ? [...prev, ...list] : list));
        setColumns(res.columns ?? []);
        setCaps(res.capabilities);
        setTotal(res.total);
        setNext(res.continue ?? '');
        setPartial(res.partialNamespaces);
        setError(undefined);
      } catch (err) {
        if (id !== seq.current) return;
        // 自动刷新失败时保留已有数据，只更新错误提示
        setError(getK8sErrorMessage(err));
        if (!opts.silent && !opts.more) setRows([]);
      } finally {
        if (id === seq.current) setLoading(false);
      }
    },
    [clusterId, query, page, pageSize],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const loadRef = useRef(load);
  loadRef.current = load;
  useImperativeHandle(
    tableRef,
    () => ({ reload: () => void loadRef.current() }),
    [],
  );

  // 走缓存的资源：订阅变更通知，收到后静默刷新当前页（节流）
  const watchable = caps?.watch === true;
  // 订阅因不可重试的错误（无权限、并发流超限等）停止后的标记；点击提示可重新订阅
  const [watchStopped, setWatchStopped] = useState(false);
  const [watchTick, setWatchTick] = useState(0);
  // 页面不可见时关闭订阅（不占用连接），恢复可见后重新订阅并刷新一次
  const [pageVisible, setPageVisible] = useState(
    () => document.visibilityState === 'visible',
  );
  useEffect(() => {
    const onVisibility = () =>
      setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  const wasHidden = useRef(false);
  useEffect(() => {
    if (!watchable) return;
    if (!pageVisible) {
      wasHidden.current = true;
      return;
    }
    if (wasHidden.current) {
      wasHidden.current = false;
      void loadRef.current({ silent: true });
    }
    setWatchStopped(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = 0;
    const refresh = () => {
      timer = undefined;
      last = Date.now();
      // 页面不可见时不刷新；恢复可见后下一条通知再刷
      if (document.visibilityState === 'visible') {
        void loadRef.current({ silent: true });
      }
    };
    const stop = keepStream({
      clusterId,
      path: '/watch',
      body: () => ({ ...gvr, namespace: namespaced ? namespace : '' }),
      onEvent: (event) => {
        if (event.event !== 'change' || timer) return;
        timer = setTimeout(
          refresh,
          Math.max(0, WATCH_REFRESH_MS - (Date.now() - last)),
        );
      },
      onState: (state) => {
        if (state === 'failed') setWatchStopped(true);
      },
    });
    return () => {
      stop();
      if (timer) clearTimeout(timer);
    };
  }, [
    watchable,
    clusterId,
    resource,
    namespace,
    namespaced,
    pageVisible,
    watchTick,
  ]);

  const empty = t('common.empty');
  const showNamespace = namespaced && !namespace;
  const sortable = caps?.sort === true;
  const hasWide = columns.some((column) => (column.priority ?? 0) > 0);

  const tableColumns = useMemo(() => {
    const sortOrder = (key: string) =>
      sort?.by === key ? (sort.desc ? 'descend' : 'ascend') : null;
    const list: ProColumns<ListRow>[] = [
      {
        title: t('pages.k8s.column.name'),
        key: 'name',
        dataIndex: 'name',
        fixed: 'left',
        sorter: sortable,
        sortOrder: sortOrder('name'),
        render: (_, row) =>
          onOpen ? <a onClick={() => onOpen(row)}>{row.name}</a> : row.name,
      },
    ];
    if (showNamespace) {
      list.push({
        title: t('pages.k8s.column.namespace'),
        key: 'namespace',
        dataIndex: 'namespace',
        sorter: sortable,
        sortOrder: sortOrder('namespace'),
      });
    }
    const hasStateColumn = columns.some((column) => column.type === 'state');
    if (!hasStateColumn && rows.some((row) => row.state)) {
      list.push({
        title: t('common.column.status'),
        key: '__state',
        render: (_, row) => <StateBadge state={row.state || undefined} />,
      });
    }
    for (const column of columns) {
      if (BUILTIN_KEYS.has(column.key)) continue;
      if ((column.priority ?? 0) > 0 && !showWide) continue;
      list.push({
        title: column.title,
        key: column.key,
        sorter: sortable && column.sortable === true,
        sortOrder: sortOrder(column.key),
        render: (_, row) => renderCell(column, row.cells?.[column.key], empty),
      });
    }
    for (const extra of extraColumns ?? []) {
      list.push({
        title: extra.title,
        key: extra.key,
        width: extra.width,
        render: (_, row) => extra.render(row),
      });
    }
    list.push({
      title: t('pages.k8s.column.age'),
      key: 'createTime',
      width: 90,
      sorter: sortable,
      sortOrder: sortOrder('createTime'),
      render: (_, row) => <AgeText value={row.createTime} />,
    });
    if (rowActions) {
      list.push({
        title: t('common.column.action'),
        key: '__action',
        fixed: 'right',
        render: (_, row) => (
          <Flex gap={12} wrap={false}>
            {rowActions(row)}
          </Flex>
        ),
      });
    }
    return list;
  }, [
    columns,
    rows,
    sort,
    sortable,
    showNamespace,
    showWide,
    onOpen,
    rowActions,
    extraColumns,
    t,
    empty,
  ]);

  const resetPage = () => setPage(1);

  return (
    <>
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          title={error}
          action={
            <Button size="small" onClick={() => void load()}>
              {t('pages.k8s.table.retry')}
            </Button>
          }
        />
      )}
      {partial && partial.length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title={t('pages.k8s.table.partial', {
            namespaces: partial.join('、'),
          })}
        />
      )}
      <ProTable<ListRow>
        cardBordered={!compact}
        ghost={compact}
        size={compact ? 'small' : undefined}
        rowKey="uid"
        search={false}
        options={false}
        loading={loading}
        dataSource={rows}
        columns={tableColumns}
        scroll={{ x: 'max-content' }}
        headerTitle={toolbar}
        toolBarRender={() => [
          caps?.keyword && (
            <Input.Search
              key="keyword"
              allowClear
              style={{ width: 220 }}
              placeholder={t('pages.k8s.table.keyword')}
              maxLength={253}
              onSearch={(value) => {
                setKeyword(value.trim());
                resetPage();
              }}
            />
          ),
          caps?.filters?.includes('state') && (
            <Select
              key="state"
              allowClear
              style={{ width: 130 }}
              placeholder={t('common.column.status')}
              value={state}
              onChange={(value) => {
                setState(value);
                resetPage();
              }}
              options={STATE_ORDER.map((value) => ({
                value,
                label: t(STATE_META[value].textId),
              }))}
            />
          ),
          <Input.Search
            key="label"
            allowClear
            style={{ width: 220 }}
            placeholder={t('pages.k8s.table.labelSelector')}
            maxLength={1024}
            onSearch={(value) => {
              setLabelSelector(value.trim());
              resetPage();
            }}
          />,
          hasWide && (
            <Button key="wide" onClick={() => setShowWide((v) => !v)}>
              {t(
                showWide
                  ? 'pages.k8s.table.lessColumns'
                  : 'pages.k8s.table.moreColumns',
              )}
            </Button>
          ),
          caps && !caps.cached && (
            <Tooltip
              key="uncached"
              title={t('pages.k8s.table.uncached.tooltip')}
            >
              <Tag>{t('pages.k8s.table.uncached')}</Tag>
            </Tooltip>
          ),
          watchable && watchStopped && (
            <Tooltip key="watch" title={t('pages.k8s.table.watchStopped.tip')}>
              <Tag
                color="warning"
                style={{ cursor: 'pointer', marginInlineEnd: 0 }}
                onClick={() => setWatchTick((n) => n + 1)}
              >
                {t('pages.k8s.table.watchStopped')}
              </Tag>
            </Tooltip>
          ),
          <Tooltip key="reload" title={t('pages.k8s.table.reload')}>
            <Button icon={<ReloadOutlined />} onClick={() => void load()} />
          </Tooltip>,
        ]}
        pagination={
          caps?.total
            ? {
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                pageSizeOptions: [20, 50, 100, 200],
              }
            : false
        }
        onChange={(pagination, _filters, sorter) => {
          const single = Array.isArray(sorter) ? sorter[0] : sorter;
          const by = single?.order ? String(single.columnKey ?? '') : '';
          const nextSort = by
            ? { by, desc: single.order === 'descend' }
            : undefined;
          if (nextSort?.by !== sort?.by || nextSort?.desc !== sort?.desc) {
            setSort(nextSort);
            setPage(1);
          } else {
            setPage(pagination.current ?? 1);
          }
          setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
        }}
      />
      {!caps?.total && next && (
        <Flex justify="center" style={{ marginTop: 12 }}>
          <Button loading={loading} onClick={() => void load({ more: next })}>
            {t('pages.k8s.table.loadMore')}
          </Button>
        </Flex>
      )}
    </>
  );
};
