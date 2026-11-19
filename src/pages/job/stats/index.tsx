/**
 * 执行统计：统计卡（总执行数、成功率、平均耗时、主机执行次数、进行中、在线节点）+ 每日趋势 +
 * 按状态 / 类型 / 来源的分布 + 执行最多的模板。统计窗口 7 / 30 / 90 天（按提交时间）。
 * 图表沿用 CMDB 统计的手写 SVG 组件（统计卡、排序横条），不引图表库。
 */
import {
  CheckCircleOutlined,
  ClusterOutlined,
  CodeOutlined,
  DesktopOutlined,
  FieldTimeOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Empty, Row, Segmented, Spin, Table } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BarList, StatCard } from '@/components/Charts';
import { getJobStats } from '@/services/job/execution';
import type {
  JobExecutionStatus,
  JobKind,
  JobStatCount,
  JobStats,
  JobStatTrendPoint,
  JobTriggerSource,
} from '@/services/job/typings';
import { useT } from '@/utils/i18n';
import { formatDuration } from '../components/format';
import {
  EXECUTION_STATUS_META,
  KIND_META,
  TRIGGER_SOURCE_META,
} from '../components/meta';
import { type JobTrendPoint, TrendChart } from './TrendChart';

type Days = '7' | '30' | '90';
const DAY_OPTIONS: readonly Days[] = ['7', '30', '90'];

const useStyles = createStyles(({ token, css }) => ({
  toolbar: css`
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 16px;
    color: ${token.colorTextSecondary};
  `,
  statGrid: css`
    display: grid;
    /* 六张指标卡：宽屏一行，常规宽度两行三列，窄屏两列——任何宽度下每行都排满 */
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
    @media (max-width: 1680px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    @media (max-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  loading: css`
    padding: 96px;
    text-align: center;
  `,
  full: css`
    height: 100%;
  `,
  failed: css`
    color: ${token.colorError};
  `,
}));

/** int64 字符串（零值省略）→ 数字 */
const num = (value?: string | number): number => Number(value ?? 0) || 0;

/** 趋势补齐：窗口内每一天一个点（后端只返回有数据的日期） */
const fillTrend = (
  trend: readonly JobStatTrendPoint[],
  days: number,
): JobTrendPoint[] => {
  const byDay = new Map(trend.map((p) => [p.day, p]));
  const start = dayjs()
    .startOf('day')
    .subtract(days - 1, 'day');
  return Array.from({ length: days }, (_, i) => {
    const day = start.add(i, 'day').format('YYYY-MM-DD');
    const point = byDay.get(day);
    return {
      day,
      total: num(point?.total),
      success: num(point?.success),
      failed: num(point?.failed),
    };
  });
};

const JobStatsPage: React.FC = () => {
  const { styles } = useStyles();
  const t = useT();
  const [days, setDays] = useState<Days>('30');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JobStats>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // 按浏览器时区分天，与趋势补齐用的本地日期一致
    getJobStats({
      days: Number(days),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        // 失败提示由请求层统一弹出
        if (!cancelled) setData(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const trend = useMemo(
    () => fillTrend(data?.trend ?? [], Number(days)),
    [data, days],
  );

  const panel = (title: string, children: React.ReactNode) => (
    <Card variant="outlined" title={title} className={styles.full}>
      {children}
    </Card>
  );

  /** 分组计数 → 排序横条的数据；键对不上枚举（后端新增了取值）时显示原键 */
  const bars = (
    counts: readonly JobStatCount[] | undefined,
    textId: (key: number) => string | undefined,
  ) =>
    (counts ?? [])
      .filter((c) => num(c.count) > 0)
      .map((c) => {
        const id = textId(Number(c.key));
        return { key: c.key, label: id ? t(id) : c.key, count: num(c.count) };
      });

  const finished = num(data?.finished);

  return (
    <PageContainer title={false}>
      <div className={styles.toolbar}>
        <span>{t('pages.job.stats.days')}</span>
        <Segmented
          value={days}
          onChange={(v) => setDays(v as Days)}
          options={DAY_OPTIONS.map((value) => ({ value, label: value }))}
        />
      </div>
      {loading ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : !data ? (
        <Empty />
      ) : (
        <>
          <div className={styles.statGrid}>
            <StatCard
              label={t('pages.job.stats.total')}
              value={num(data.total)}
              icon={<CodeOutlined />}
            />
            <StatCard
              label={t('pages.job.stats.successRate')}
              value={
                finished > 0
                  ? `${Math.round((num(data.success) / finished) * 1000) / 10}%`
                  : '—'
              }
              icon={<CheckCircleOutlined />}
            />
            <StatCard
              label={t('pages.job.stats.avgDuration')}
              value={
                num(data.avgDurationSeconds) > 0
                  ? formatDuration(num(data.avgDurationSeconds), t)
                  : '—'
              }
              icon={<FieldTimeOutlined />}
            />
            <StatCard
              label={t('pages.job.stats.hostRuns')}
              value={num(data.hostRuns)}
              icon={<DesktopOutlined />}
            />
            <StatCard
              label={t('pages.job.stats.active')}
              value={num(data.active)}
              icon={<SyncOutlined />}
            />
            <StatCard
              label={t('pages.job.stats.runners')}
              value={`${data.runnersOnline ?? 0} / ${data.runnersTotal ?? 0}`}
              icon={<ClusterOutlined />}
            />
          </div>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              {panel(t('pages.job.stats.trend'), <TrendChart points={trend} />)}
            </Col>
            <Col xs={24} lg={8}>
              {panel(
                t('pages.job.stats.byStatus'),
                <BarList
                  items={bars(
                    data.byStatus,
                    (key) =>
                      EXECUTION_STATUS_META[key as JobExecutionStatus]?.textId,
                  )}
                />,
              )}
            </Col>
            <Col xs={24} lg={8}>
              {panel(
                t('pages.job.stats.byKind'),
                <BarList
                  items={bars(
                    data.byKind,
                    (key) => KIND_META[key as JobKind]?.textId,
                  )}
                />,
              )}
            </Col>
            <Col xs={24} lg={8}>
              {panel(
                t('pages.job.stats.byTrigger'),
                <BarList
                  items={bars(
                    data.byTrigger,
                    (key) =>
                      TRIGGER_SOURCE_META[key as JobTriggerSource]?.textId,
                  )}
                />,
              )}
            </Col>
            <Col span={24}>
              {panel(
                t('pages.job.stats.topTemplates'),
                <Table<JobStatCount>
                  size="small"
                  rowKey="key"
                  dataSource={data.topTemplates ?? []}
                  pagination={false}
                  columns={[
                    {
                      title: t('pages.job.execution.column.template'),
                      dataIndex: 'name',
                      render: (value: string | undefined, record) =>
                        value || record.key,
                    },
                    {
                      title: t('pages.job.stats.count'),
                      dataIndex: 'count',
                      width: 140,
                      align: 'right',
                      render: (value?: string) => num(value).toLocaleString(),
                    },
                    {
                      title: t('pages.job.stats.failed'),
                      dataIndex: 'failed',
                      width: 140,
                      align: 'right',
                      render: (value?: string) => (
                        <span
                          className={num(value) > 0 ? styles.failed : undefined}
                        >
                          {num(value).toLocaleString()}
                        </span>
                      ),
                    },
                  ]}
                />,
              )}
            </Col>
          </Row>
        </>
      )}
    </PageContainer>
  );
};

export default JobStatsPage;
