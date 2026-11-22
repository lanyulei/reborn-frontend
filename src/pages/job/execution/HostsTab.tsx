/**
 * 执行详情 · 主机：一次执行的主机及其结果（服务端分页）。上方的筛选项带数量——数量取自执行的
 * 主机计数（随详情轮询更新）；执行未结束时列表每 5 秒刷新。
 */
import { Link } from '@umijs/max';
import { Flex, Input, Table, Tag } from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { listJobExecutionHosts } from '@/services/job/execution';
import type {
  JobExecution,
  JobExecutionHost,
  JobHostStatus,
} from '@/services/job/typings';
import { useT } from '@/utils/i18n';
import { usePageVisible } from '../components/hooks';
import { isActiveStatus, JOB_LIMITS } from '../components/meta';
import { useJobStyles } from '../components/styles';
import { HostStatusTag } from '../components/tags';

const REFRESH_MS = 5000;

type FilterKey = 'all' | 'ok' | 'failed' | 'unreachable' | 'other';

/** 筛选项 → 主机结果（成功含「有变更」；其他 = 未执行 / 已跳过） */
const FILTER_STATUSES: Record<FilterKey, JobHostStatus[] | undefined> = {
  all: undefined,
  ok: [1, 2],
  failed: [3],
  unreachable: [4],
  other: [0, 5],
};
const FILTER_ORDER: readonly FilterKey[] = [
  'all',
  'ok',
  'failed',
  'unreachable',
  'other',
];

export const HostsTab: React.FC<{
  execution: JobExecution;
  /** 当前用户能否打开 CMDB 资源详情 */
  canViewCI: boolean;
}> = ({ execution, canViewCI }) => {
  const t = useT();
  const { styles, cx } = useJobStyles();
  const visible = usePageVisible();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<JobExecutionHost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // 递增即重取（定时刷新）
  const [tick, setTick] = useState(0);
  const lastTick = useRef(0);

  const { id, status } = execution;
  const active = isActiveStatus(status);

  useEffect(() => {
    if (!active || !visible) return;
    const timer = setInterval(() => setTick((n) => n + 1), REFRESH_MS);
    return () => clearInterval(timer);
  }, [active, visible]);

  useEffect(() => {
    let cancelled = false;
    const auto = tick !== lastTick.current;
    lastTick.current = tick;
    listJobExecutionHosts(
      id,
      {
        page,
        pageSize,
        statuses: FILTER_STATUSES[filter],
        keyword: keyword || undefined,
      },
      // 定时刷新失败不打扰：保留上次的数据
      { silent: auto },
    )
      .then((result) => {
        if (cancelled) return;
        setItems(result.items ?? []);
        setTotal(Number(result.total ?? 0));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, page, pageSize, filter, keyword, tick, status]);

  const hostTotal = execution.hostTotal ?? 0;
  const counts: Record<FilterKey, number> = {
    all: hostTotal,
    ok: execution.hostOk ?? 0,
    failed: execution.hostFailed ?? 0,
    unreachable: execution.hostUnreachable ?? 0,
    other: Math.max(
      0,
      hostTotal -
        (execution.hostOk ?? 0) -
        (execution.hostFailed ?? 0) -
        (execution.hostUnreachable ?? 0),
    ),
  };

  const counter = (value: number | undefined, className?: string) => (
    <span className={cx(styles.tabular, (value ?? 0) > 0 && className)}>
      {value ?? 0}
    </span>
  );

  return (
    <div>
      <Flex
        align="center"
        justify="space-between"
        gap={12}
        wrap
        style={{ marginBottom: 12 }}
      >
        <Flex gap={4} wrap>
          {FILTER_ORDER.map((key) => (
            <Tag.CheckableTag
              key={key}
              checked={filter === key}
              onChange={() => {
                setFilter(key);
                setPage(1);
                setLoading(true);
              }}
            >
              {t(`pages.job.execution.hostFilter.${key}`)} {counts[key]}
            </Tag.CheckableTag>
          ))}
        </Flex>
        <Input.Search
          allowClear
          style={{ width: 260 }}
          maxLength={JOB_LIMITS.keywordMax}
          placeholder={t('pages.job.execution.hostSearch.placeholder')}
          onSearch={(value) => {
            setKeyword(value.trim());
            setPage(1);
            setLoading(true);
          }}
        />
      </Flex>
      <Table<JobExecutionHost>
        size="small"
        rowKey="seq"
        loading={loading}
        dataSource={items}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [20, 50, 100, 500],
          onChange: (nextPage, nextSize) => {
            setPage(nextSize === pageSize ? nextPage : 1);
            setPageSize(nextSize);
            setLoading(true);
          },
        }}
        columns={[
          {
            title: '#',
            dataIndex: 'seq',
            width: 56,
          },
          {
            title: t('common.column.status'),
            dataIndex: 'status',
            width: 110,
            render: (value?: JobHostStatus) => <HostStatusTag status={value} />,
          },
          {
            title: t('pages.job.host.column.name'),
            dataIndex: 'name',
            render: (value: string | undefined, record) =>
              canViewCI ? (
                <Link to={`/cmdb/ci/${record.ciId}`}>
                  {value || record.ciId}
                </Link>
              ) : (
                value || record.ciId
              ),
          },
          {
            title: t('pages.job.host.column.env'),
            dataIndex: 'env',
            width: 110,
            render: (value?: string) => value || t('common.empty'),
          },
          {
            title: t('pages.job.host.column.address'),
            dataIndex: 'address',
            render: (value: string | undefined, record) => (
              <span className={styles.code}>
                {value}
                {record.port ? `:${record.port}` : ''}
              </span>
            ),
          },
          {
            title: t('pages.job.execution.hostCol.ok'),
            dataIndex: 'ok',
            width: 70,
            align: 'right',
            render: (value?: number) => counter(value, styles.success),
          },
          {
            title: t('pages.job.execution.hostCol.changed'),
            dataIndex: 'changed',
            width: 80,
            align: 'right',
            render: (value?: number) => counter(value, styles.warning),
          },
          {
            title: t('pages.job.execution.hostCol.failed'),
            dataIndex: 'failed',
            width: 70,
            align: 'right',
            render: (value?: number) => counter(value, styles.danger),
          },
          {
            title: t('pages.job.execution.hostCol.unreachable'),
            dataIndex: 'unreachable',
            width: 100,
            align: 'right',
            render: (value?: number) => counter(value, styles.danger),
          },
          {
            title: t('pages.job.execution.hostCol.skipped'),
            dataIndex: 'skipped',
            width: 80,
            align: 'right',
            render: (value?: number) => counter(value),
          },
        ]}
      />
    </div>
  );
};
