/**
 * 知识统计：空间 / 文档 / 分块为全量计数，检索与反馈跟随所选时间范围；
 * 无结果高频检索词即「知识缺口」。数据与知识库管理共用 admin 接口。
 */
import { PageContainer } from '@ant-design/pro-components';
import { Card, Flex, Segmented } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { BarList } from '@/components/Charts';
import { StatTile } from '@/pages/monitor/stats/StatTile';
import { getStats } from '@/services/knowledge/admin';
import type { KnowledgeStats } from '@/services/knowledge/typings';
import { useT } from '@/utils/i18n';
import { useKnowledgeStyles } from '../components/styles';

const KnowledgeStatsPage: React.FC = () => {
  const t = useT();
  const { styles } = useKnowledgeStyles();
  const [stats, setStats] = useState<KnowledgeStats>();
  const [days, setDays] = useState(30);

  useEffect(() => {
    let cancelled = false;
    getStats(days)
      .then((res) => {
        if (!cancelled) setStats(res);
      })
      .catch(() => {
        if (!cancelled) setStats(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const tiles: {
    key: string;
    label: string;
    value?: string;
    tone?: 'warning' | 'error' | 'success';
  }[] = [
    {
      key: 'space',
      label: t('pages.knowledge.admin.stat.spaces'),
      value: stats?.spaceCount,
    },
    {
      key: 'doc',
      label: t('pages.knowledge.admin.stat.documents'),
      value: stats?.documentCount,
    },
    {
      key: 'draft',
      label: t('pages.knowledge.admin.stat.drafts'),
      value: stats?.draftCount,
    },
    {
      key: 'chunk',
      label: t('pages.knowledge.admin.stat.chunks'),
      value: stats?.chunkCount,
    },
    {
      key: 'overdue',
      label: t('pages.knowledge.admin.stat.overdue'),
      value: stats?.reviewOverdueCount,
      tone: Number(stats?.reviewOverdueCount ?? 0) > 0 ? 'warning' : undefined,
    },
    {
      key: 'pending',
      label: t('pages.knowledge.admin.stat.pending'),
      value: stats?.pendingReviewCount,
    },
    {
      key: 'search',
      label: t('pages.knowledge.admin.stat.searches'),
      value: stats?.searchCount,
    },
    {
      key: 'noresult',
      label: t('pages.knowledge.admin.stat.noResult'),
      value: stats?.noResultCount,
      tone: Number(stats?.noResultCount ?? 0) > 0 ? 'warning' : undefined,
    },
    {
      key: 'helpful',
      label: t('pages.knowledge.search.helpful'),
      value: stats?.helpfulCount,
      tone: Number(stats?.helpfulCount ?? 0) > 0 ? 'success' : undefined,
    },
    {
      key: 'unhelpful',
      label: t('pages.knowledge.search.unhelpful'),
      value: stats?.unhelpfulCount,
      tone: Number(stats?.unhelpfulCount ?? 0) > 0 ? 'error' : undefined,
    },
  ];

  return (
    <PageContainer title={false}>
      <Flex vertical gap={16}>
        {/* 统计：时间范围工具条 + 指标瓦片平铺（同故障 / Agent 统计页的形态） */}
        <div className={styles.toolbar}>
          <Segmented<number>
            value={days}
            onChange={setDays}
            options={[7, 30, 90].map((d) => ({
              value: d,
              label: t('pages.knowledge.admin.days', { days: d }),
            }))}
          />
          <span className={styles.hint}>
            {t('pages.knowledge.admin.statsHint')}
          </span>
        </div>
        <div className={styles.statGrid}>
          {tiles.map((tile) => (
            <StatTile
              key={tile.key}
              label={tile.label}
              value={Number(tile.value ?? 0).toLocaleString()}
              tone={tile.tone}
            >
              {tile.key === 'noresult' &&
                Number(stats?.searchCount ?? 0) > 0 &&
                t('pages.knowledge.admin.stat.noResultRatio', {
                  pct: Math.round(
                    (Number(stats?.noResultCount ?? 0) /
                      Number(stats?.searchCount ?? 1)) *
                      100,
                  ),
                })}
            </StatTile>
          ))}
        </div>
        <Card
          variant="outlined"
          title={t('pages.knowledge.admin.gaps')}
          extra={
            <span className={styles.hint}>
              {t('pages.knowledge.admin.gapsCount', {
                n: (stats?.topQueries ?? []).length,
              })}
            </span>
          }
        >
          <BarList
            items={(stats?.topQueries ?? []).map((q) => ({
              key: q.query,
              label: q.query,
              count: Number(q.count ?? 0),
            }))}
          />
        </Card>
      </Flex>
    </PageContainer>
  );
};

export default KnowledgeStatsPage;
