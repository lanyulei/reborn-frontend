/**
 * 知识检索结果页：关键字进 URL ?q=；可限定空间；结果带命中片段（高亮）、所在整节、来源空间；
 * 向量检索不可用时提示降级；对本次检索整体反馈有用 / 没用（后端按检索记录计反馈）。
 */
import {
  DislikeOutlined,
  LikeOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Link, useAccess, useSearchParams } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Space,
  Spin,
  Tag,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { askAssistant } from '@/components/GlobalChat/ask';
import {
  searchKnowledge,
  submitSearchFeedback,
} from '@/services/knowledge/search';
import type { KnowledgeSearchResult } from '@/services/knowledge/typings';
import { useT } from '@/utils/i18n';
import { docPath } from './components/meta';
import { Snippet } from './components/Snippet';
import { SpaceSelect } from './components/selectors';
import { useKnowledgeStyles } from './components/styles';

const KnowledgeSearch: React.FC = () => {
  const t = useT();
  const access = useAccess();
  const { message } = App.useApp();
  const { styles } = useKnowledgeStyles();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [input, setInput] = useState(q);
  const [spaceIds, setSpaceIds] = useState<string[]>([]);
  const [result, setResult] = useState<KnowledgeSearchResult>();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<boolean>();
  // 只采纳最后一次检索的结果（含 searchLogId），旧请求晚到直接丢弃
  const seq = useRef(0);

  const run = useCallback(async (query: string, spaces: string[]) => {
    const current = ++seq.current;
    const text = query.trim();
    if (!text) {
      setResult(undefined);
      return;
    }
    setLoading(true);
    setFeedback(undefined);
    try {
      const res = await searchKnowledge({
        query: text,
        spaceIds: spaces.length ? spaces : undefined,
        topK: 20,
      });
      if (current !== seq.current) return;
      setResult(res);
    } catch {
      if (current === seq.current) setResult(undefined);
    } finally {
      if (current === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setInput(q);
    void run(q, spaceIds);
    // spaceIds 变化由 onChange 处理，这里只跟 URL
  }, [q, run]);

  const submit = (value: string) => {
    const text = value.trim();
    if (!text) return;
    if (text === q) {
      void run(text, spaceIds);
    } else {
      setParams({ q: text });
    }
  };

  const giveFeedback = async (helpful: boolean) => {
    if (!result?.searchLogId) return;
    try {
      await submitSearchFeedback(result.searchLogId, helpful);
      setFeedback(helpful);
      message.success(t('pages.knowledge.search.feedbackThanks'));
    } catch {
      // 全局已提示
    }
  };

  const items = result?.items ?? [];

  return (
    <PageContainer title={false}>
      <Flex vertical gap={16}>
        <Card variant="outlined" title={t('menu.knowledge.search')}>
          <Flex gap={8} wrap>
            <Input.Search
              size="large"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onSearch={submit}
              enterButton={t('pages.knowledge.home.search')}
              placeholder={t('pages.knowledge.home.searchPlaceholder')}
              style={{ flex: 1, minWidth: 280 }}
              allowClear
            />
            <SpaceSelect
              multiple
              value={spaceIds}
              onChange={(v) => {
                const next = Array.isArray(v) ? v : [];
                setSpaceIds(next);
                void run(q, next);
              }}
              style={{ minWidth: 220 }}
              placeholder={t('pages.knowledge.search.allSpaces')}
            />
            {access.canAssistant && q && (
              <Button
                size="large"
                icon={<RobotOutlined />}
                onClick={() =>
                  askAssistant(t('pages.knowledge.home.askPrefix', { q }))
                }
              >
                {t('pages.knowledge.askAi')}
              </Button>
            )}
          </Flex>
        </Card>

        {result?.degraded && (
          <Alert
            type="info"
            showIcon
            title={t('pages.knowledge.search.degraded')}
          />
        )}

        {q && (
          <Card
            variant="outlined"
            title={
              result
                ? t('pages.knowledge.search.summary', {
                    count: items.length,
                    ms: result.durationMs ?? '0',
                  })
                : t('pages.knowledge.search.results')
            }
            extra={
              result?.searchLogId && (
                <Space>
                  <span className={styles.hint}>
                    {t('pages.knowledge.search.feedbackAsk')}
                  </span>
                  <Button
                    size="small"
                    type={feedback === true ? 'primary' : 'default'}
                    icon={<LikeOutlined />}
                    onClick={() => giveFeedback(true)}
                  >
                    {t('pages.knowledge.search.helpful')}
                  </Button>
                  <Button
                    size="small"
                    type={feedback === false ? 'primary' : 'default'}
                    icon={<DislikeOutlined />}
                    onClick={() => giveFeedback(false)}
                  >
                    {t('pages.knowledge.search.unhelpful')}
                  </Button>
                </Space>
              )
            }
          >
            <Spin spinning={loading}>
              {!loading && items.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('pages.knowledge.search.empty')}
                />
              ) : (
                <Flex vertical gap={12}>
                  {items.map((hit) => (
                    <div
                      key={`${hit.documentId}-${hit.chunkSeq ?? 0}`}
                      className={styles.card}
                    >
                      <Space size={8} wrap>
                        <Link
                          className={styles.hitTitle}
                          to={`${docPath(hit.documentId)}#chunk-${hit.chunkSeq ?? 0}`}
                        >
                          {hit.title}
                        </Link>
                        {hit.spaceName && <Tag>{hit.spaceName}</Tag>}
                        {hit.reviewOverdue && (
                          <Tag color="warning">
                            {t('pages.knowledge.doc.reviewOverdue')}
                          </Tag>
                        )}
                      </Space>
                      {hit.headingPath && (
                        <div className={styles.meta}>
                          <span>{hit.headingPath}</span>
                        </div>
                      )}
                      <Snippet text={hit.snippet} className={styles.snippet} />
                      {hit.section && (
                        <div className={styles.section}>{hit.section}</div>
                      )}
                    </div>
                  ))}
                </Flex>
              )}
            </Spin>
          </Card>
        )}
      </Flex>
    </PageContainer>
  );
};

export default KnowledgeSearch;
