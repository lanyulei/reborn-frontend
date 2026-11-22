/**
 * 知识库管理：索引状态（pgvector / embedding / 熔断 / 计数）、重建索引、统计、检索日志。
 */
import { ReloadOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Input,
  Segmented,
  Space,
  Tag,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { StatTile } from '@/pages/monitor/stats/StatTile';
import {
  getIndexStatus,
  getStats,
  listSearchLogs,
  rebuildIndex,
} from '@/services/knowledge/admin';
import type {
  KnowledgeIndexStatus,
  KnowledgeSearchLog,
  KnowledgeStats,
} from '@/services/knowledge/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useT } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { SpaceSelect } from '../components/selectors';
import { useKnowledgeStyles } from '../components/styles';

const AdminPage: React.FC = () => {
  const t = useT();
  const { modal, message } = App.useApp();
  const has = usePermissions();
  const { styles } = useKnowledgeStyles();
  const [status, setStatus] = useState<KnowledgeIndexStatus>();
  const [stats, setStats] = useState<KnowledgeStats>();
  const [days, setDays] = useState(30);
  const [rebuildSpace, setRebuildSpace] = useState<string>();
  const [rebuildDoc, setRebuildDoc] = useState('');

  const loadStatus = useCallback(() => {
    getIndexStatus()
      .then(setStatus)
      .catch(() => setStatus(undefined));
  }, []);
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);
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

  const rebuild = () => {
    const documentId = rebuildDoc.trim() || undefined;
    if (!rebuildSpace && !documentId) {
      message.warning(t('pages.knowledge.admin.rebuildTarget'));
      return;
    }
    modal.confirm({
      title: t('pages.knowledge.admin.rebuildTitle'),
      content: t('pages.knowledge.admin.rebuildDesc'),
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await rebuildIndex({
          spaceId: documentId ? undefined : rebuildSpace,
          documentId,
        });
        message.success(
          t('pages.knowledge.admin.rebuildQueued', { count: res.queued ?? 0 }),
        );
        loadStatus();
      },
    });
  };

  const logColumns: ProColumns<KnowledgeSearchLog>[] = [
    {
      title: t('pages.knowledge.admin.log.query'),
      dataIndex: 'keyword',
      ellipsis: true,
      render: (_, row) => row.query,
    },
    {
      title: t('pages.knowledge.admin.log.user'),
      dataIndex: 'userName',
      search: false,
      width: 120,
      ellipsis: true,
    },
    {
      title: t('pages.knowledge.admin.log.source'),
      dataIndex: 'source',
      valueType: 'select',
      width: 100,
      valueEnum: {
        web: { text: t('pages.knowledge.admin.log.source.web') },
        assistant: { text: t('pages.knowledge.admin.log.source.assistant') },
        related: { text: t('pages.knowledge.admin.log.source.related') },
      },
    },
    {
      title: t('pages.knowledge.admin.log.hits'),
      dataIndex: 'hitCount',
      search: false,
      width: 80,
      render: (_, row) =>
        row.hitCount ? row.hitCount : <Tag color="warning">0</Tag>,
    },
    {
      title: t('pages.knowledge.admin.log.noResult'),
      dataIndex: 'noResult',
      valueType: 'switch',
      hideInTable: true,
    },
    {
      title: t('pages.knowledge.admin.log.feedback'),
      dataIndex: 'feedback',
      search: false,
      width: 90,
      render: (_, row) =>
        row.feedback === 1 ? (
          <Tag color="success">{t('pages.knowledge.search.helpful')}</Tag>
        ) : row.feedback === 2 ? (
          <Tag color="error">{t('pages.knowledge.search.unhelpful')}</Tag>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.knowledge.admin.log.duration'),
      dataIndex: 'durationMs',
      search: false,
      width: 140,
      render: (_, row) =>
        `${row.durationMs ?? 0} ms${row.degraded ? ` · ${t('pages.knowledge.admin.log.degraded')}` : ''}`,
    },
    {
      title: t('common.column.createTime'),
      dataIndex: 'createTime',
      search: false,
      width: 160,
      render: (_, row) => formatTime(row.createTime),
    },
  ];

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
      tone: 'success',
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
        <Card
          variant="outlined"
          title={t('pages.knowledge.admin.index')}
          extra={
            <Button icon={<ReloadOutlined />} onClick={loadStatus}>
              {t('pages.knowledge.admin.refresh')}
            </Button>
          }
        >
          {status?.hint && (
            <Alert
              type="warning"
              showIcon
              title={status.hint}
              style={{ marginBottom: 12 }}
            />
          )}
          <Descriptions
            size="small"
            column={{ xs: 1, sm: 2, md: 3 }}
            items={[
              {
                key: 'vector',
                label: t('pages.knowledge.admin.vector'),
                children: status?.vectorAvailable ? (
                  <Tag color="success">
                    {t('pages.knowledge.admin.available')}
                  </Tag>
                ) : (
                  <Tag>{t('pages.knowledge.admin.unavailable')}</Tag>
                ),
              },
              {
                key: 'embedding',
                label: t('pages.knowledge.admin.embedding'),
                children: status?.embeddingConfigured ? (
                  <Tag color="success">{status.embeddingModel}</Tag>
                ) : (
                  <Tag>{t('pages.knowledge.admin.unconfigured')}</Tag>
                ),
              },
              {
                key: 'breaker',
                label: t('pages.knowledge.admin.breaker'),
                children: status?.embeddingOpen ? (
                  <Tag color="error">
                    {t('pages.knowledge.admin.breakerOpen')}
                  </Tag>
                ) : (
                  <Tag color="success">
                    {t('pages.knowledge.admin.breakerClosed')}
                  </Tag>
                ),
              },
              {
                key: 'chunks',
                label: t('pages.knowledge.admin.embedded'),
                children: `${status?.embeddedCount ?? 0} / ${status?.chunkCount ?? 0}`,
              },
              {
                key: 'pending',
                label: t('pages.knowledge.admin.pendingJobs'),
                children: status?.pendingJobs ?? 0,
              },
              {
                key: 'failed',
                label: t('pages.knowledge.admin.failedJobs'),
                children: status?.failedJobs ?? 0,
              },
            ]}
          />
          {has('knowledge.admin.rebuild') && (
            <>
              <SectionTitle>
                {t('pages.knowledge.admin.rebuildSection')}
              </SectionTitle>
              <Flex gap={8} wrap align="center">
                <SpaceSelect
                  value={rebuildSpace}
                  onChange={(v) =>
                    setRebuildSpace(typeof v === 'string' ? v : undefined)
                  }
                  style={{ minWidth: 220 }}
                />
                <Input
                  value={rebuildDoc}
                  onChange={(e) => setRebuildDoc(e.target.value)}
                  placeholder={t('pages.knowledge.admin.rebuildDocPlaceholder')}
                  style={{ width: 320 }}
                  allowClear
                />
                <Button danger onClick={rebuild}>
                  {t('pages.knowledge.admin.rebuild')}
                </Button>
              </Flex>
              <div className={styles.hint} style={{ marginTop: 8 }}>
                {t('pages.knowledge.admin.rebuildDesc')}
              </div>
            </>
          )}
        </Card>

        <Card
          variant="outlined"
          title={t('pages.knowledge.admin.stats')}
          extra={
            <Segmented<number>
              value={days}
              onChange={setDays}
              options={[7, 30, 90].map((d) => ({
                value: d,
                label: t('pages.knowledge.admin.days', { days: d }),
              }))}
            />
          }
        >
          <div className={styles.tileGrid}>
            {tiles.map((tile) => (
              <StatTile
                key={tile.key}
                label={tile.label}
                value={Number(tile.value ?? 0)}
                tone={tile.tone}
              />
            ))}
          </div>
          {stats?.topQueries && stats.topQueries.length > 0 && (
            <>
              <SectionTitle>{t('pages.knowledge.admin.gaps')}</SectionTitle>
              <Space size={[8, 8]} wrap>
                {stats.topQueries.map((q) => (
                  <Tag key={q.query}>
                    {q.query} × {q.count ?? 0}
                  </Tag>
                ))}
              </Space>
            </>
          )}
        </Card>

        <ProTable<KnowledgeSearchLog>
          cardBordered
          headerTitle={t('pages.knowledge.admin.logs')}
          rowKey="id"
          columns={logColumns}
          columnEmptyText={t('common.empty')}
          search={{ labelWidth: 'auto' }}
          scroll={{ x: 'max-content' }}
          request={async (p) =>
            toTableResult(
              await listSearchLogs({
                page: p.current,
                pageSize: p.pageSize,
                source: p.source as string | undefined,
                noResult: parseBoolParam(p.noResult) || undefined,
                keyword: (p.keyword as string | undefined)?.trim() || undefined,
              }),
            )
          }
        />
      </Flex>
    </PageContainer>
  );
};

export default AdminPage;
