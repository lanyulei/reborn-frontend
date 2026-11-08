import { UserOutlined } from '@ant-design/icons';
import { Bubble, Conversations, Sender, Think, XProvider } from '@ant-design/x';
import type {
  BubbleItemType,
  BubbleListProps,
} from '@ant-design/x/es/bubble/interface';
import XMarkdown from '@ant-design/x-markdown';
import { useXChat } from '@ant-design/x-sdk';
import { Avatar } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { ConversationItem, ParsedMessage } from './data';
import { createChatProvider } from './service';
import { useStyles } from './style';

const WELCOME_TEXT = '🤖 你好，有什么可以帮你？';

const TypewriterTitle: React.FC = () => {
  const { styles } = useStyles();
  const [index, setIndex] = useState(0);
  const done = index >= WELCOME_TEXT.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => {
        if (i >= WELCOME_TEXT.length) {
          clearInterval(timer);
          return i;
        }
        return i + 1;
      });
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {WELCOME_TEXT.slice(0, index)}
      {!done && <span className={styles.cursor}>|</span>}
    </>
  );
};

const parser = (message: { content: string; role: string }): ParsedMessage => {
  const { content, role } = message;
  if (role !== 'assistant') return { role: 'user', content };

  const trimmed = content.trimStart();

  const fullMatch = trimmed.match(/^<think>([\s\S]*?)<\/think>([\s\S]*)$/);
  if (fullMatch) {
    return {
      role: 'assistant',
      thinkContent: fullMatch[1],
      content: fullMatch[2].trimStart(),
    };
  }

  const partialMatch = trimmed.match(/^<think>([\s\S]*)$/);
  if (partialMatch) {
    return { role: 'assistant', thinkContent: partialMatch[1], content: '' };
  }

  return { role: 'assistant', content };
};

const STREAMING_ACTIVE = { hasNextChunk: true, enableAnimation: true };
const STREAMING_IDLE = { hasNextChunk: false, enableAnimation: true };

const roleConfig: BubbleListProps['role'] = {
  user: {
    placement: 'end',
    avatar: <Avatar icon={<UserOutlined />} />,
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
      content: string,
      info: { status?: string; loading?: boolean },
    ) => {
      if (info?.loading || !content) return undefined;
      return (
        <XMarkdown
          streaming={
            info?.status === 'updating' ? STREAMING_ACTIVE : STREAMING_IDLE
          }
        >
          {content}
        </XMarkdown>
      );
    },
  },
};

/**
 * 聊天主体（会话侧栏 + 气泡流 + 输入框）。
 * 智能助手整页与全局弹窗共用；自身 flex 填满父级容器，父级需为定高 flex 列。
 */
const ChatPanel: React.FC = () => {
  const { styles } = useStyles();
  const idCounter = useRef(0);
  const generateId = useCallback(() => `conv-${++idCounter.current}`, []);

  const [conversations, setConversations] = useState<ConversationItem[]>([
    { key: 'default', label: '💬 新对话', group: '今天', isDraft: true },
    {
      key: 'preset-1',
      label: '🧩 LanYuLei 的 Form 表单如何做联动校验？',
      group: '今天',
    },
    {
      key: 'preset-2',
      label: '📋 ProTable 如何自定义工具栏按钮？',
      group: '今天',
    },
    {
      key: 'preset-3',
      label: '🎨 如何用 antd-style 实现暗色主题切换？',
      group: '昨天',
    },
    {
      key: 'preset-4',
      label: '🗂️ ProLayout 侧边菜单如何动态生成？',
      group: '昨天',
    },
    {
      key: 'preset-5',
      label: '📊 LanYuLei Charts 折线图数据格式',
      group: '昨天',
    },
    {
      key: 'preset-6',
      label: '🚀 LanYuLei 如何接入后端权限系统？',
      group: '更早',
    },
    {
      key: 'preset-7',
      label: '🔍 ProForm 中 Select 远程搜索怎么实现？',
      group: '更早',
    },
    {
      key: 'preset-8',
      label: '⚙️ LanYuLei Token 定制主题最佳实践',
      group: '更早',
    },
  ]);
  const [activeKey, setActiveKey] = useState<string>('default');
  const [inputValue, setInputValue] = useState('');

  const provider = useMemo(() => createChatProvider() as any, []);
  const { onRequest, abort, isRequesting, parsedMessages } = useXChat<
    any,
    ParsedMessage
  >({
    provider,
    conversationKey: activeKey,
    parser,
    requestPlaceholder: { role: 'assistant', content: '' },
  });

  const sendMessage = (content: string) => {
    setInputValue('');
    setConversations((prev) =>
      prev.map((c) =>
        c.key === activeKey && c.isDraft
          ? { ...c, label: content.slice(0, 20), isDraft: false }
          : c,
      ),
    );
    onRequest({ messages: [{ role: 'user', content }] });
  };

  const newChat = () => {
    const key = generateId();
    setConversations((prev) => [
      { key, label: '新对话', group: '今天', isDraft: true },
      ...prev,
    ]);
    setActiveKey(key);
  };

  const bubbleItems = useMemo<BubbleItemType[]>(
    () =>
      parsedMessages.map((msg) => {
        const parsed = msg.message as ParsedMessage;
        const isAI = parsed.role === 'assistant';
        const thinkContent =
          parsed.role === 'assistant' ? parsed.thinkContent : undefined;

        const item: BubbleItemType = {
          key: msg.id,
          role: isAI ? 'ai' : 'user',
          content: parsed.content,
          loading: isAI && msg.status === 'loading',
          status: msg.status,
        };

        if (isAI && thinkContent) {
          item.header = <Think>{thinkContent}</Think>;
        }

        return item;
      }),
    [parsedMessages],
  );

  const hasMessages = parsedMessages.length > 0;

  return (
    <XProvider>
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <Conversations
            items={conversations}
            activeKey={activeKey}
            onActiveChange={setActiveKey}
            groupable
            menu={(conversation) => ({
              items: [{ key: 'delete', label: '删除', danger: true }],
              onClick: ({ key }) => {
                if (key === 'delete') {
                  setConversations((prev) => {
                    const next = prev.filter((c) => c.key !== conversation.key);
                    if (next.length === 0) {
                      const key = generateId();
                      next.push({
                        key,
                        label: '💬 新对话',
                        group: '今天',
                        isDraft: true,
                      });
                      setActiveKey(key);
                    } else if (activeKey === conversation.key) {
                      setActiveKey(next[0]?.key ?? '');
                    }
                    return next;
                  });
                }
              },
            })}
            creation={{ onClick: newChat, label: '新建对话' }}
          />
        </div>

        <div className={styles.main}>
          {hasMessages && (
            <div className={styles.messages}>
              <Bubble.List
                items={bubbleItems}
                role={roleConfig}
                autoScroll
                styles={{ root: { maxWidth: 940 } }}
              />
            </div>
          )}

          <div className={hasMessages ? styles.footer : styles.footerCenter}>
            {!hasMessages && (
              <div className={styles.welcomeTitle}>
                <TypewriterTitle />
              </div>
            )}
            <Sender
              value={inputValue}
              onChange={setInputValue}
              loading={isRequesting}
              onSubmit={sendMessage}
              onCancel={abort}
              placeholder="输入消息，按 Enter 发送..."
              autoSize={{ minRows: 4, maxRows: 8 }}
              style={{ maxWidth: 940, width: '100%' }}
              styles={{ input: { paddingBlock: 0 } }}
            />
          </div>
        </div>
      </div>
    </XProvider>
  );
};

export default ChatPanel;
