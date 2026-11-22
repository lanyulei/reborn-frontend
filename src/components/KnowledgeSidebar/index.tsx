/**
 * 相关知识侧栏：按运维对象（告警事件 / 故障 / CI / 规则 / 工单…）查显式关联与语义检索命中的知识文档。
 * 无权限（接口 403 / 404）或无结果时不渲染任何内容；请求静默，不弹全局错误。
 */
import { Link } from '@umijs/max';
import { Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useEffect, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { listRelated } from '@/services/knowledge/document';
import type {
  KnowledgeRelatedDocument,
  KnowledgeRelatedTargetType,
} from '@/services/knowledge/typings';
import { useT } from '@/utils/i18n';

const useStyles = createStyles(({ token, css }) => ({
  item: css`
    padding: 8px 0;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    &:last-child {
      border-bottom: none;
    }
  `,
  title: css`
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  `,
  summary: css`
    margin-top: 2px;
    color: ${token.colorTextSecondary};
    font-size: 12px;
  `,
}));

export interface KnowledgeSidebarProps {
  targetType: KnowledgeRelatedTargetType;
  targetId: string;
  /** 对象描述（标题 / 规则名等），用于语义检索补足；空 = 只看显式关联 */
  query?: string;
  limit?: number;
  /** 有 SectionTitle 的页面传 false 可由外部给标题 */
  withTitle?: boolean;
}

export const KnowledgeSidebar: React.FC<KnowledgeSidebarProps> = ({
  targetType,
  targetId,
  query,
  limit = 5,
  withTitle = true,
}) => {
  const t = useT();
  const { styles } = useStyles();
  const [items, setItems] = useState<KnowledgeRelatedDocument[]>([]);

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    listRelated(
      { targetType, targetId, query: query?.slice(0, 500), limit },
      { silent: true },
    )
      .then((res) => {
        if (!cancelled) setItems(res.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId, query, limit]);

  if (items.length === 0) return null;
  return (
    <div>
      {withTitle && (
        <SectionTitle>{t('pages.knowledge.related.title')}</SectionTitle>
      )}
      {items.map((item) => (
        <div key={item.documentId} className={styles.item}>
          <div className={styles.title}>
            <Link to={`/knowledge/doc/${item.documentId}`}>{item.title}</Link>
            {item.linked && (
              <Tag color="blue">{t('pages.knowledge.related.linked')}</Tag>
            )}
            {item.reviewOverdue && (
              <Tag color="warning">
                {t('pages.knowledge.doc.reviewOverdue')}
              </Tag>
            )}
            {item.spaceName && (
              <Typography.Text type="secondary">
                {item.spaceName}
              </Typography.Text>
            )}
          </div>
          {item.summary && (
            <Typography.Paragraph
              className={styles.summary}
              ellipsis={{ rows: 2 }}
            >
              {item.summary.replace(/<\/?mark>/g, '')}
            </Typography.Paragraph>
          )}
        </div>
      ))}
    </div>
  );
};

export default KnowledgeSidebar;
