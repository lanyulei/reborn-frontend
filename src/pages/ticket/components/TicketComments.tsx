/**
 * 工单评论：顶部是输入框，下面是评论列表，最新的在最上面；评论的回复挂在该评论下面，
 * 按时间正序。回复只有一层。
 */
import { App, Button, Empty, Flex, Input } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getErrorMessage } from '@/services/system/request';
import {
  addTicketComment,
  listTicketComments,
  TICKET_COMMENT_RATE_LIMITED,
} from '@/services/ticket';
import type { TicketComment } from '@/services/ticket/typings';
import { formatTime } from '@/utils/format';
import { useT } from '@/utils/i18n';

const COMMENT_MAX = 2000;

const useStyles = createStyles(({ token, css }) => ({
  // 字数统计显示在输入框下方，按钮让出这一行
  composerActions: css`
    margin-top: 28px;
  `,
  list: css`
    margin-top: 16px;
  `,
  time: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  author: css`
    margin-inline-end: 8px;
    color: ${token.colorText};
    font-weight: 500;
  `,
  content: css`
    margin-top: 4px;
    color: ${token.colorText};
    white-space: pre-wrap;
    word-break: break-word;
  `,
  comment: css`
    padding: 10px 12px;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  replies: css`
    margin-top: 10px;
    padding-inline-start: 12px;
    border-inline-start: 2px solid ${token.colorBorderSecondary};
  `,
  reply: css`
    padding: 6px 0;
  `,
  replyAction: css`
    display: inline-block;
    margin-top: 8px;
    font-size: ${token.fontSizeSM}px;
  `,
  replyEditor: css`
    margin-top: 8px;
  `,
}));

export const TicketComments: React.FC<{
  ticketId: string;
}> = ({ ticketId }) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const t = useT();
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [draft, setDraft] = useState('');
  /** 正在回复的顶层评论 */
  const [replyTo, setReplyTo] = useState<string>();
  const [replyDraft, setReplyDraft] = useState('');
  const [posting, setPosting] = useState(false);
  // 只采纳当前工单的响应
  const current = useRef(ticketId);

  useEffect(() => {
    current.current = ticketId;
    setComments([]);
    setDraft('');
    setReplyTo(undefined);
    setReplyDraft('');
    // 失败提示由请求层统一弹出
    listTicketComments(ticketId).then(
      (result) => {
        if (current.current === ticketId) setComments(result.items ?? []);
      },
      () => undefined,
    );
  }, [ticketId]);

  /** 发表评论（parentId 非空即回复）；成功返回 true */
  const post = async (text: string, parentId?: string) => {
    const content = text.trim();
    if (!content || posting) return false;
    setPosting(true);
    try {
      const { comment } = await addTicketComment(ticketId, content, parentId);
      if (current.current === ticketId) {
        setComments((list) => [...list, comment]);
      }
      message.success(t('pages.ticket.comment.posted'));
      return true;
    } catch (error) {
      // 保留草稿；发得太频繁时说明原因和该怎么做，其余错误照常提示
      const reason = (error as { response?: { data?: { reason?: string } } })
        .response?.data?.reason;
      message.error(
        reason === TICKET_COMMENT_RATE_LIMITED
          ? t('pages.ticket.comment.rateLimited')
          : getErrorMessage(error),
      );
      return false;
    } finally {
      setPosting(false);
    }
  };

  /** 顶层评论 ID → 它的回复（接口按时间升序返回，这里保持正序） */
  const replies = useMemo(() => {
    const map = new Map<string, TicketComment[]>();
    for (const comment of comments) {
      if (!comment.parentId) continue;
      const list = map.get(comment.parentId) ?? [];
      list.push(comment);
      map.set(comment.parentId, list);
    }
    return map;
  }, [comments]);

  const commentItem = (comment: TicketComment) => (
    <div key={comment.id} className={styles.comment}>
      <div className={styles.time}>
        <span className={styles.author}>
          {comment.userName || comment.userId}
        </span>
        {formatTime(comment.createTime)}
      </div>
      <div className={styles.content}>{comment.content}</div>
      {!!replies.get(comment.id)?.length && (
        <div className={styles.replies}>
          {replies.get(comment.id)?.map((reply) => (
            <div key={reply.id} className={styles.reply}>
              <div className={styles.time}>
                <span className={styles.author}>
                  {reply.userName || reply.userId}
                </span>
                {formatTime(reply.createTime)}
              </div>
              <div className={styles.content}>{reply.content}</div>
            </div>
          ))}
        </div>
      )}
      {replyTo === comment.id ? (
        <div className={styles.replyEditor}>
          <Input.TextArea
            autoFocus
            value={replyDraft}
            maxLength={COMMENT_MAX}
            autoSize={{ minRows: 1, maxRows: 4 }}
            placeholder={t('pages.ticket.comment.reply.placeholder', {
              name: comment.userName || comment.userId,
            })}
            onChange={(e) => setReplyDraft(e.target.value)}
          />
          <Flex justify="flex-end" gap={8} style={{ marginTop: 8 }}>
            <Button size="small" onClick={() => setReplyTo(undefined)}>
              {t('common.action.cancel')}
            </Button>
            <Button
              size="small"
              type="primary"
              loading={posting}
              disabled={!replyDraft.trim()}
              onClick={async () => {
                if (await post(replyDraft, comment.id)) {
                  setReplyTo(undefined);
                  setReplyDraft('');
                }
              }}
            >
              {t('pages.ticket.comment.reply')}
            </Button>
          </Flex>
        </div>
      ) : (
        <a
          className={styles.replyAction}
          onClick={() => {
            setReplyTo(comment.id);
            setReplyDraft('');
          }}
        >
          {t('pages.ticket.comment.reply')}
        </a>
      )}
    </div>
  );

  // 顶层评论，最新的在最上面（接口按时间升序返回）
  const roots = comments.filter((c) => !c.parentId).reverse();

  return (
    <>
      <Input.TextArea
        value={draft}
        maxLength={COMMENT_MAX}
        showCount
        autoSize={{ minRows: 2, maxRows: 6 }}
        placeholder={t('pages.ticket.comment.placeholder')}
        onChange={(e) => setDraft(e.target.value)}
      />
      <Flex justify="flex-end" className={styles.composerActions}>
        <Button
          type="primary"
          loading={posting && !replyTo}
          disabled={!draft.trim()}
          onClick={async () => {
            if (await post(draft)) setDraft('');
          }}
        >
          {t('pages.ticket.comment.post')}
        </Button>
      </Flex>
      {roots.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.ticket.comment.empty')}
        />
      ) : (
        <Flex vertical gap={12} className={styles.list}>
          {roots.map(commentItem)}
        </Flex>
      )}
    </>
  );
};

export default TicketComments;
