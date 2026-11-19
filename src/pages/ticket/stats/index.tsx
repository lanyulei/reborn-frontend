/**
 * 工单统计：统计卡（总量、处理中、平均处理时长、SLA 达成率、满意度）+ 每日趋势 +
 * 按状态 / 优先级 / 服务的分布。统计窗口 7 / 30 / 90 天（按提交时间）。
 * 图表沿用 CMDB 统计的手写 SVG 组件（统计卡、排序横条），不引图表库。
 */
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  StarOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Empty, Row, Segmented, Spin } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BarList, StatCard } from '@/components/Charts';
import { getTicketStats } from '@/services/ticket';
import type {
  TicketPriority,
  TicketStats,
  TicketStatus,
  TicketTrendPoint,
} from '@/services/ticket/typings';
import { useEnumText, useT } from '@/utils/i18n';
import {
  formatSpan,
  TICKET_PRIORITY_META,
  TICKET_STATUS_META,
} from '../components/meta';
import { TrendChart } from './TrendChart';

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
    /* 六张指标卡：宽屏一行，常规宽度两行三列，窄屏两列——任何宽度下每行都排满，不留孤零零的一张 */
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
}));

/** 达成率：分母为 0（没有配置时限 / 尚无结果）显示「—」 */
const rate = (met: number, total: number): string =>
  total > 0 ? `${Math.round((met / total) * 1000) / 10}%` : '—';

/** 趋势补齐：窗口内每一天一个点（后端只返回有工单的日期） */
const fillTrend = (
  trend: readonly TicketTrendPoint[],
  days: number,
): TicketTrendPoint[] => {
  const byDay = new Map(trend.map((p) => [p.day, p]));
  const start = dayjs()
    .startOf('day')
    .subtract(days - 1, 'day');
  return Array.from({ length: days }, (_, i) => {
    const day = start.add(i, 'day').format('YYYY-MM-DD');
    return byDay.get(day) ?? { day, created: 0, closed: 0 };
  });
};

const TicketStatsPage: React.FC = () => {
  const { styles } = useStyles();
  const t = useT();
  const statusText = useEnumText(TICKET_STATUS_META);
  const priorityText = useEnumText(TICKET_PRIORITY_META);
  const [days, setDays] = useState<Days>('30');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TicketStats>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTicketStats(Number(days))
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

  const processing =
    data?.byStatus.find((c) => c.key === '1')?.count ?? undefined;

  return (
    <PageContainer title={false}>
      <div className={styles.toolbar}>
        <span>{t('pages.ticket.stats.days')}</span>
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
              label={t('pages.ticket.stats.total')}
              value={data.total}
              icon={<FileTextOutlined />}
            />
            <StatCard
              label={t('pages.ticket.stats.processing')}
              value={processing ?? 0}
              icon={<SyncOutlined />}
            />
            <StatCard
              label={t('pages.ticket.stats.avgResolve')}
              value={
                data.avgResolveSeconds > 0
                  ? formatSpan(data.avgResolveSeconds * 1000, t)
                  : '—'
              }
              icon={<FieldTimeOutlined />}
            />
            <StatCard
              label={t('pages.ticket.stats.responseSla')}
              value={rate(data.responseSlaMet, data.responseSlaTotal)}
              icon={<ClockCircleOutlined />}
            />
            <StatCard
              label={t('pages.ticket.stats.resolveSla')}
              value={rate(data.resolveSlaMet, data.resolveSlaTotal)}
              icon={<CheckCircleOutlined />}
            />
            <StatCard
              label={t('pages.ticket.stats.rating', { n: data.rated })}
              value={data.rated > 0 ? data.avgRating.toFixed(1) : '—'}
              icon={<StarOutlined />}
            />
          </div>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              {panel(
                t('pages.ticket.stats.trend'),
                <TrendChart points={trend} />,
              )}
            </Col>
            <Col xs={24} lg={8}>
              {panel(
                t('pages.ticket.stats.byStatus'),
                <BarList
                  items={data.byStatus
                    .filter((c) => c.count > 0)
                    .map((c) => ({
                      key: c.key,
                      label: statusText(Number(c.key) as TicketStatus),
                      count: c.count,
                    }))}
                />,
              )}
            </Col>
            <Col xs={24} lg={8}>
              {panel(
                t('pages.ticket.stats.byPriority'),
                <BarList
                  items={data.byPriority
                    .filter((c) => c.count > 0)
                    .map((c) => ({
                      key: c.key,
                      label: priorityText(Number(c.key) as TicketPriority),
                      count: c.count,
                    }))}
                />,
              )}
            </Col>
            <Col xs={24} lg={8}>
              {panel(
                t('pages.ticket.stats.byTemplate'),
                <BarList
                  items={data.byTemplate.map((c) => ({
                    key: c.key,
                    label: c.key,
                    count: c.count,
                  }))}
                />,
              )}
            </Col>
          </Row>
        </>
      )}
    </PageContainer>
  );
};

export default TicketStatsPage;
