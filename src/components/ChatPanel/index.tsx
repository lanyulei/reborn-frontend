import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  LoadingOutlined,
  RightOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Bubble,
  Conversations,
  Sender,
  Think,
  ThoughtChain,
  XProvider,
} from '@ant-design/x';
import type {
  BubbleItemType,
  BubbleListProps,
} from '@ant-design/x/es/bubble/interface';
import type { ThoughtChainItemType } from '@ant-design/x/es/thought-chain/interface';
import XMarkdown from '@ant-design/x-markdown';
import { useModel } from '@umijs/max';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Space,
  Spin,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { JsonView } from '@/pages/notify/components/JsonView';
import type { AssistantToolStatus } from '@/services/assistant/typings';
import { type Translate, useT } from '@/utils/i18n';
import type {
  AssistantChatMessage,
  ChatMessage,
  ChatStep,
  ConversationGroup,
} from './data';
import { useStyles } from './style';
import { useAssistantChat } from './useAssistantChat';

const TypewriterTitle: React.FC = () => {
  const { styles } = useStyles();
  const t = useT();
  const text = t('component.chat.welcome');
  const [index, setIndex] = useState(0);
  const done = index >= text.length;

  useEffect(() => {
    setIndex(0);
    const timer = setInterval(() => {
      setIndex((i) => {
        if (i >= text.length) {
          clearInterval(timer);
          return i;
        }
        return i + 1;
      });
    }, 80);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <>
      {text.slice(0, index)}
      {!done && <span className={styles.cursor}>|</span>}
    </>
  );
};

const STREAMING_ACTIVE = { hasNextChunk: true, enableAnimation: true };
const STREAMING_IDLE = { hasNextChunk: false, enableAnimation: true };

/** 助手消息正文：Markdown 渲染 + 主题化排版（标题/列表/表格/代码/引用分层） */
const MarkdownBody: React.FC<{ content: string; updating: boolean }> = ({
  content,
  updating,
}) => {
  const { styles } = useStyles();
  return (
    <div className={styles.markdown}>
      <XMarkdown streaming={updating ? STREAMING_ACTIVE : STREAMING_IDLE}>
        {content}
      </XMarkdown>
    </div>
  );
};

/** 角色配置：用户气泡头像取当前登录用户头像（无头像回退图标） */
const buildRoleConfig = (avatar?: string): BubbleListProps['role'] => ({
  user: {
    placement: 'end',
    avatar: <Avatar src={avatar || undefined} icon={<UserOutlined />} />,
  },
  ai: {
    placement: 'start',
    avatar: (
      <Avatar
        style={{
          background: 'transparent',
          fontSize: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        🤖
      </Avatar>
    ),
    typing: { effect: 'typing', step: 2, interval: 20 },
    contentRender: (
      content: React.ReactNode,
      info: { status?: string; loading?: boolean },
    ) => {
      if (info?.loading || !content) return undefined;
      // 正文为空时确认卡直接作为 content 传入（ReactNode），原样渲染
      if (typeof content !== 'string') return content;
      return (
        <MarkdownBody
          content={content}
          updating={info?.status === 'updating'}
        />
      );
    },
  },
});

/** 工具步骤状态 → 思维链节点状态（pending 等待用户，不展示进度图标） */
const stepStatus = (
  status: AssistantToolStatus,
): ThoughtChainItemType['status'] => {
  switch (status) {
    case 'approved':
      return 'loading';
    case 'succeeded':
      return 'success';
    case 'failed':
    case 'denied':
      return 'error';
    case 'rejected':
    case 'cancelled':
      return 'abort';
    default:
      return undefined;
  }
};

const StepContent: React.FC<{ step: ChatStep; t: Translate }> = ({
  step,
  t,
}) => (
  <Space vertical size="small" style={{ width: '100%' }}>
    <Typography.Text type="secondary">
      {t('component.chat.step.input')}
    </Typography.Text>
    <JsonView value={step.input} maxHeight={160} />
    {step.error ? (
      <Typography.Text type="danger">{step.error}</Typography.Text>
    ) : (
      step.output !== undefined && (
        <>
          <Typography.Text type="secondary">
            {t('component.chat.step.output')}
          </Typography.Text>
          <JsonView value={step.output} maxHeight={240} />
        </>
      )
    )}
  </Space>
);

/** 步骤达到这个数量才收成一行摘要；更少时直接平铺 */
const STEPS_COLLAPSE_MIN = 3;

const formatDuration = (ms: number) =>
  ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;

/**
 * 助手消息里的操作步骤。步骤多时默认收成一行摘要（数量 / 失败数 / 总耗时；进行中显示
 * 当前步骤），点击展开完整列表，列表限高、内部滚动——调用再多也不把消息撑长。
 * 列表里每个步骤的样子与平铺时完全一样。
 */
const StepsBlock: React.FC<{
  msg: AssistantChatMessage;
  items: ThoughtChainItemType[];
  t: Translate;
}> = ({ msg, items, t }) => {
  const { styles, cx } = useStyles();
  const { steps } = msg;
  const failed = steps.filter(
    (step) => step.status === 'failed' || step.status === 'denied',
  ).length;
  // 默认：进行中收起（摘要里看当前步骤）；结束后有失败则展开。用户手动点过后以用户为准
  const [picked, setPicked] = useState<boolean>();
  const expanded = picked ?? (!msg.streaming && failed > 0);

  const chain = <ThoughtChain items={items} />;
  if (steps.length < STEPS_COLLAPSE_MIN) {
    return <div className={styles.steps}>{chain}</div>;
  }

  const last = steps[steps.length - 1];
  const running = msg.streaming && last.status === 'approved';
  const totalMs = steps.reduce((sum, step) => sum + (step.durationMs ?? 0), 0);
  return (
    <div className={styles.steps}>
      <button
        type="button"
        className={styles.stepsSummary}
        aria-expanded={expanded}
        onClick={() => setPicked(!expanded)}
      >
        {running ? (
          <LoadingOutlined className={styles.stepsIconRunning} />
        ) : failed > 0 ? (
          <ExclamationCircleFilled className={styles.stepsIconFailed} />
        ) : (
          <CheckCircleFilled className={styles.stepsIconDone} />
        )}
        <span className={styles.stepsText}>
          {running
            ? t('component.chat.steps.running', {
                name: last.title || last.tool,
                index: steps.length,
              })
            : t('component.chat.steps.summary', { count: steps.length })}
        </span>
        {!running && failed > 0 && (
          <span className={styles.stepsFailed}>
            {t('component.chat.steps.failed', { count: failed })}
          </span>
        )}
        {!running && totalMs > 0 && (
          <span className={styles.stepsMeta}>{formatDuration(totalMs)}</span>
        )}
        <RightOutlined
          className={cx(styles.stepsArrow, expanded && styles.stepsArrowOpen)}
        />
      </button>
      {expanded && <div className={styles.stepsList}>{chain}</div>}
    </div>
  );
};

const AssistantHeader: React.FC<{
  msg: AssistantChatMessage;
  t: Translate;
}> = ({ msg, t }) => {
  const items = useMemo<ThoughtChainItemType[]>(
    () =>
      msg.steps.map((step) => ({
        key: step.id,
        title: step.title || step.tool,
        description: `${t(`component.chat.step.${step.status}`)}${
          step.durationMs ? ` · ${step.durationMs} ms` : ''
        }`,
        status: stepStatus(step.status),
        collapsible: true,
        content: <StepContent step={step} t={t} />,
      })),
    [msg.steps, t],
  );
  // 思考过程：回复进行中展开，回答结束后自动收起；用户仍可手动展开/收起。
  const [thinkExpanded, setThinkExpanded] = useState(msg.streaming);
  useEffect(() => {
    setThinkExpanded(msg.streaming);
  }, [msg.streaming]);
  if (!msg.reasoning && items.length === 0) return null;
  return (
    <Space vertical size="small" style={{ width: '100%' }}>
      {msg.reasoning && (
        <Think
          title={t('component.chat.thinking')}
          loading={msg.streaming && !msg.content && items.length === 0}
          expanded={thinkExpanded}
          onExpand={setThinkExpanded}
        >
          {msg.reasoning}
        </Think>
      )}
      {items.length > 0 && <StepsBlock msg={msg} items={items} t={t} />}
    </Space>
  );
};

/**
 * 聊天主体（会话侧栏 + 气泡流 + 输入框）。
 * 智能助手整页与全局弹窗共用；自身 flex 填满父级容器，父级需为定高 flex 列。
 * 助手以当前登录用户身份经后端工具调用操作系统；写操作先在此确认。
 */
const ChatPanel: React.FC<{
  /** 外部交来的问题：填进输入框（不自动发送）；seq 变化即重新填入 */
  draft?: { text: string; seq: number };
}> = ({ draft }) => {
  const { styles } = useStyles();
  const t = useT();
  const { modal } = App.useApp();
  const [inputValue, setInputValue] = useState('');
  const chat = useAssistantChat();
  useEffect(() => {
    if (draft) setInputValue(draft.text);
  }, [draft]);
  const { initialState } = useModel('@@initialState');
  const roleConfig = useMemo(
    () => buildRoleConfig(initialState?.currentUser?.avatar),
    [initialState?.currentUser?.avatar],
  );

  const sendMessage = (content: string) => {
    setInputValue('');
    chat.send(content);
  };

  // 按消息对象缓存气泡项：流式输出时只有正在生成的那条消息对象会被替换，
  // 其余消息沿用缓存，避免每个片段都把整个列表（含确认卡等 JSX）重建一遍。
  // 其余依赖（确认回调 / 请求态 / 样式 / 语言）变化时整体作废。
  const bubbleCache = useRef<{
    deps: unknown[];
    items: WeakMap<ChatMessage, BubbleItemType>;
  }>({ deps: [], items: new WeakMap() });

  const bubbleItems = useMemo<BubbleItemType[]>(() => {
    const deps = [chat.confirm, chat.isRequesting, styles, t];
    if (deps.some((d, i) => d !== bubbleCache.current.deps[i])) {
      bubbleCache.current = { deps, items: new WeakMap() };
    }
    const cache = bubbleCache.current.items;
    const build = (msg: ChatMessage): BubbleItemType => {
      if (msg.role === 'user') {
        return { key: msg.id, role: 'user', content: msg.content };
      }
      const pendingStep = msg.pendingConfirm
        ? msg.steps.find((s) => s.id === msg.pendingConfirm)
        : undefined;
      const content = msg.error && !msg.content ? msg.error : msg.content;
      const loading =
        msg.streaming &&
        !msg.content &&
        msg.steps.length === 0 &&
        !msg.reasoning;
      const confirmCard =
        pendingStep && !msg.streaming ? (
          <Card
            key={`${msg.id}-confirm`}
            size="small"
            className={styles.confirmCard}
          >
            <Space vertical size="small" style={{ width: '100%' }}>
              <div className={styles.confirmTitle}>
                <ExclamationCircleFilled />
                <span>{pendingStep.title || pendingStep.tool}</span>
              </div>
              <Typography.Text type="secondary">
                {t('component.chat.confirm.title')}
              </Typography.Text>
              <JsonView value={pendingStep.input} maxHeight={160} />
              <Space>
                <Button
                  type="primary"
                  disabled={chat.isRequesting}
                  onClick={() => chat.confirm(msg.id, pendingStep.id, true)}
                >
                  {t('component.chat.confirm.approve')}
                </Button>
                <Button
                  danger
                  disabled={chat.isRequesting}
                  onClick={() => chat.confirm(msg.id, pendingStep.id, false)}
                >
                  {t('component.chat.confirm.reject')}
                </Button>
              </Space>
            </Space>
          </Card>
        ) : undefined;
      const item: BubbleItemType = {
        key: msg.id,
        role: 'ai',
        content,
        loading,
        status: msg.streaming ? 'updating' : 'success',
        header: <AssistantHeader msg={msg} t={t} />,
      };
      if (!content && !loading) {
        // 正文为空（仅有思考/工具步骤或待确认操作）：去掉气泡壳与内边距；
        // 确认卡直接占据正文位置，避免空正文 + footer 外边距造成的大段留白
        item.variant = 'borderless';
        item.styles = { content: { padding: 0, minHeight: 0 } };
        if (confirmCard) item.content = confirmCard;
      } else if (confirmCard) {
        item.footer = confirmCard;
      }
      return item;
    };
    return chat.messages.map((msg) => {
      let item = cache.get(msg);
      if (!item) {
        item = build(msg);
        cache.set(msg, item);
      }
      return item;
    });
  }, [chat.confirm, chat.isRequesting, chat.messages, styles, t]);

  const hasMessages = chat.messages.length > 0;

  return (
    <XProvider>
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <Conversations
            items={chat.conversations}
            activeKey={chat.activeKey}
            onActiveChange={(key) => void chat.select(key)}
            groupable={{
              label: (group) =>
                t(`component.chat.group.${group as ConversationGroup}`),
            }}
            menu={(conversation) => ({
              items: [
                {
                  key: 'delete',
                  label: t('common.action.delete'),
                  danger: true,
                },
              ],
              onClick: ({ key }) => {
                if (key !== 'delete') return;
                if (conversation.key === 'draft') {
                  void chat.remove(conversation.key);
                  return;
                }
                modal.confirm({
                  title: t('component.chat.deleteConfirm'),
                  okButtonProps: { danger: true },
                  onOk: () => chat.remove(conversation.key),
                });
              },
            })}
            creation={{
              onClick: chat.newChat,
              label: t('component.chat.create'),
            }}
          />
        </div>

        <div className={styles.main}>
          {chat.historyLoading && (
            <div className={styles.messages}>
              <Spin />
            </div>
          )}
          {!chat.historyLoading && hasMessages && (
            <div className={styles.messages}>
              <Bubble.List
                items={bubbleItems}
                role={roleConfig}
                autoScroll
                styles={{
                  root: { maxWidth: 940, containerType: 'inline-size' },
                }}
              />
            </div>
          )}

          <div className={hasMessages ? styles.footer : styles.footerCenter}>
            {!hasMessages && !chat.historyLoading && (
              <div className={styles.welcomeTitle}>
                <TypewriterTitle />
              </div>
            )}
            <Space
              vertical
              size="small"
              style={{ maxWidth: 940, width: '100%' }}
            >
              {chat.pending && !chat.isRequesting && (
                <Alert
                  type="warning"
                  showIcon
                  title={t('component.chat.pendingNotice')}
                />
              )}
              <Sender
                value={inputValue}
                onChange={setInputValue}
                loading={chat.isRequesting}
                onSubmit={sendMessage}
                onCancel={chat.stop}
                placeholder={t('component.chat.placeholder')}
                autoSize={{ minRows: 4, maxRows: 8 }}
                style={{ width: '100%' }}
                styles={{ input: { paddingBlock: 0 } }}
              />
            </Space>
          </div>
        </div>
      </div>
    </XProvider>
  );
};

export default ChatPanel;
