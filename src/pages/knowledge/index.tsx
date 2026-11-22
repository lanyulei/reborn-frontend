/**
 * 知识库首页：检索入口（回车进结果页 / 问 AI）、概览计数、最近更新 / 我负责的 / 待我审核 / 待复审。
 */
import {
  AppstoreOutlined,
  ImportOutlined,
  RobotOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, Link, useAccess } from '@umijs/max';
import { Button, Card, Col, Empty, Flex, Input, Row, Space, Tag } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { askAssistant } from '@/components/GlobalChat/ask';
import { StatTile } from '@/pages/monitor/stats/StatTile';
import { getOverview } from '@/services/knowledge/document';
import type {
  KnowledgeDocument,
  KnowledgeOverview,
} from '@/services/knowledge/typings';
import { formatTime } from '@/utils/format';
import { useEnumText, useT } from '@/utils/i18n';
import { DOC_STATUS_META, docPath } from './components/meta';
import { useKnowledgeStyles } from './components/styles';

const DocList: React.FC<{
  title: string;
  items?: KnowledgeDocument[];
  emptyText: string;
}> = ({ title, items, emptyText }) => {
  const t = useT();
  const statusText = useEnumText(DOC_STATUS_META);
  const { styles } = useKnowledgeStyles();
  return (
    <Card variant="outlined" title={title} className="h-full">
      {!items || items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
      ) : (
        <div>
          {items.map((doc) => (
            <div key={doc.id} className={styles.listRow}>
              <Space size={6} wrap>
                <Link to={docPath(doc.id)}>{doc.title}</Link>
                {doc.status && doc.status !== 2 && (
                  <Tag>{statusText(doc.status)}</Tag>
                )}
                {doc.reviewState === 1 && (
                  <Tag color="processing">
                    {t('pages.knowledge.doc.reviewPending')}
                  </Tag>
                )}
                {doc.reviewOverdue && (
                  <Tag color="warning">
                    {t('pages.knowledge.doc.reviewOverdue')}
                  </Tag>
                )}
              </Space>
              <span className={styles.hint}>
                {doc.spaceName}
                {doc.updateTime ? ` · ${formatTime(doc.updateTime)}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const KnowledgeHome: React.FC = () => {
  const t = useT();
  const access = useAccess();
  const { styles } = useKnowledgeStyles();
  const [overview, setOverview] = useState<KnowledgeOverview>();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    getOverview()
      .then(setOverview)
      .catch(() => setOverview(undefined))
      .finally(() => setLoading(false));
  }, []);

  const goSearch = (q: string) => {
    const text = q.trim();
    if (!text) return;
    history.push(`/knowledge/search?q=${encodeURIComponent(text)}`);
  };

  return (
    <PageContainer title={false} loading={loading && !overview}>
      <Flex vertical gap={16}>
        <Card
          variant="outlined"
          title={t('menu.knowledge.home')}
          extra={
            <Space wrap>
              <Link to="/knowledge/space">
                <Button icon={<AppstoreOutlined />}>
                  {t('menu.knowledge.space')}
                </Button>
              </Link>
              <Link to="/knowledge/ingest">
                <Button icon={<ImportOutlined />}>
                  {t('menu.knowledge.ingest')}
                </Button>
              </Link>
              {access.canKnowledgeAdmin && (
                <Link to="/knowledge/admin">
                  <Button icon={<SettingOutlined />}>
                    {t('menu.knowledge.admin')}
                  </Button>
                </Link>
              )}
            </Space>
          }
        >
          <Flex gap={8} wrap>
            <Input.Search
              size="large"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onSearch={goSearch}
              enterButton={t('pages.knowledge.home.search')}
              placeholder={t('pages.knowledge.home.searchPlaceholder')}
              style={{ flex: 1, minWidth: 280 }}
              allowClear
            />
            {access.canAssistant && (
              <Button
                size="large"
                icon={<RobotOutlined />}
                onClick={() =>
                  askAssistant(
                    query.trim()
                      ? t('pages.knowledge.home.askPrefix', { q: query.trim() })
                      : t('pages.knowledge.home.askDefault'),
                  )
                }
              >
                {t('pages.knowledge.askAi')}
              </Button>
            )}
          </Flex>
          <div className={styles.tileGrid} style={{ marginTop: 16 }}>
            <StatTile
              label={t('pages.knowledge.home.spaceCount')}
              value={overview?.spaceCount ?? 0}
            />
            <StatTile
              label={t('pages.knowledge.home.documentCount')}
              value={overview?.documentCount ?? 0}
            />
            <StatTile
              label={t('pages.knowledge.home.pendingReviewRecent')}
              value={overview?.pendingReview?.length ?? 0}
              tone={overview?.pendingReview?.length ? 'warning' : undefined}
            />
            <StatTile
              label={t('pages.knowledge.home.reviewDueRecent')}
              value={overview?.reviewDue?.length ?? 0}
              tone={overview?.reviewDue?.length ? 'warning' : undefined}
            />
          </div>
        </Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <DocList
              title={t('pages.knowledge.home.recent')}
              items={overview?.recent}
              emptyText={t('pages.knowledge.home.empty')}
            />
          </Col>
          <Col xs={24} md={12}>
            <DocList
              title={t('pages.knowledge.home.mine')}
              items={overview?.mine}
              emptyText={t('pages.knowledge.home.empty')}
            />
          </Col>
          <Col xs={24} md={12}>
            <DocList
              title={t('pages.knowledge.home.pendingReview')}
              items={overview?.pendingReview}
              emptyText={t('pages.knowledge.home.empty')}
            />
          </Col>
          <Col xs={24} md={12}>
            <DocList
              title={t('pages.knowledge.home.reviewDue')}
              items={overview?.reviewDue}
              emptyText={t('pages.knowledge.home.empty')}
            />
          </Col>
        </Row>
      </Flex>
    </PageContainer>
  );
};

export default KnowledgeHome;
