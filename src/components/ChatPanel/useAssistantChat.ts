/**
 * 智能助手会话状态：会话列表 / 当前会话消息 / 流式发送与确认 / 停止。
 * 直接用 fetch + SSE（services/assistant/chat.ts），消息状态本地维护，
 * 确认流程（写操作挂起 → 用户裁决 → 继续）与会话切换、中止全部可控。
 */
import { App } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AssistantRequestError,
  streamChat,
  streamConfirm,
} from '@/services/assistant/chat';
import {
  deleteConversation,
  listConversations,
  listMessages,
} from '@/services/assistant/conversation';
import type {
  AssistantConversation,
  AssistantEvent,
  AssistantMessage,
  AssistantToolEvent,
} from '@/services/assistant/typings';
import { getErrorMessage } from '@/services/system/request';
import { useT } from '@/utils/i18n';
import type {
  AssistantChatMessage,
  ChatMessage,
  ChatStep,
  ConversationGroup,
  ConversationItem,
} from './data';

/** 草稿会话的本地 key（后端尚无记录） */
export const DRAFT_KEY = 'draft';

const groupOf = (time?: string): ConversationGroup => {
  if (!time) return 'today';
  const day = dayjs(time);
  if (day.isSame(dayjs(), 'day')) return 'today';
  if (day.isSame(dayjs().subtract(1, 'day'), 'day')) return 'yesterday';
  return 'earlier';
};

const toItem = (c: AssistantConversation): ConversationItem => ({
  key: c.id,
  label: c.title,
  group: groupOf(c.updateTime),
  raw: c,
});

const parseJson = (raw?: string): unknown => {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const toStep = (event: AssistantToolEvent): ChatStep => ({
  id: event.id,
  tool: event.tool,
  title: event.title,
  write: event.write ?? false,
  status: event.status,
  input: event.input,
  output: event.output,
  error: event.error,
  durationMs: event.durationMs,
});

/** 历史消息 → 本地消息形态（工具步骤从审计记录还原） */
const fromHistory = (items: AssistantMessage[]): ChatMessage[] =>
  items.map((m) => {
    if (m.role === 'user') {
      return { id: m.id, role: 'user', content: m.content };
    }
    const steps: ChatStep[] = (m.toolCalls ?? []).map((tc) => ({
      id: tc.id,
      tool: tc.toolName,
      title: tc.title,
      write: tc.write ?? false,
      status: tc.status,
      input: parseJson(tc.input),
      output: parseJson(tc.output),
      error: tc.error || undefined,
      durationMs: tc.durationMs ? Number(tc.durationMs) : undefined,
    }));
    return {
      id: m.id,
      role: 'assistant',
      content: m.content,
      reasoning: m.reasoning ?? '',
      steps,
      pendingConfirm: steps.find((s) => s.status === 'pending')?.id,
      streaming: false,
    };
  });

let localId = 0;
const nextId = (prefix: string) => `${prefix}-${++localId}-${Date.now()}`;

export const useAssistantChat = () => {
  const t = useT();
  const { message } = App.useApp();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeKey, setActiveKeyState] = useState<string>(DRAFT_KEY);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isRequesting, setRequesting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const activeRef = useRef(activeKey);

  const draftItem = useCallback(
    (): ConversationItem => ({
      key: DRAFT_KEY,
      label: t('component.chat.newConversation'),
      group: 'today',
      isDraft: true,
    }),
    [t],
  );

  const setActive = useCallback((key: string) => {
    activeRef.current = key;
    setActiveKeyState(key);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** 拉取会话列表；当前为草稿时保留草稿项置顶 */
  const reloadConversations = useCallback(async () => {
    try {
      const result = await listConversations({ page: 1, pageSize: 100 });
      const items = result.items.map(toItem);
      setConversations(
        activeRef.current === DRAFT_KEY ? [draftItem(), ...items] : items,
      );
    } catch (error) {
      message.error(
        getErrorMessage(error, t('component.chat.error.loadFailed')),
      );
    }
  }, [draftItem, message, t]);

  useEffect(() => {
    void reloadConversations();
  }, [reloadConversations]);

  const newChat = useCallback(() => {
    stop();
    setActive(DRAFT_KEY);
    setMessages([]);
    setConversations((prev) =>
      prev.some((c) => c.isDraft) ? prev : [draftItem(), ...prev],
    );
  }, [draftItem, setActive, stop]);

  const select = useCallback(
    async (key: string) => {
      if (key === activeRef.current) return;
      stop();
      setActive(key);
      if (key === DRAFT_KEY) {
        setMessages([]);
        return;
      }
      setHistoryLoading(true);
      try {
        const result = await listMessages(key);
        if (activeRef.current === key) setMessages(fromHistory(result.items));
      } catch (error) {
        message.error(
          getErrorMessage(error, t('component.chat.error.loadFailed')),
        );
      } finally {
        setHistoryLoading(false);
      }
    },
    [message, setActive, stop, t],
  );

  const remove = useCallback(
    async (key: string) => {
      if (key !== DRAFT_KEY) {
        try {
          await deleteConversation(key);
        } catch {
          return; // authRequest 已提示
        }
      }
      setConversations((prev) => prev.filter((c) => c.key !== key));
      if (activeRef.current === key) newChat();
    },
    [newChat],
  );

  /** 更新当前会话中某条 assistant 消息 */
  const patchAssistant = useCallback(
    (
      id: string,
      update: (msg: AssistantChatMessage) => AssistantChatMessage,
    ) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.role === 'assistant' ? update(m) : m,
        ),
      );
    },
    [],
  );

  const showRequestError = useCallback(
    (error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (error instanceof AssistantRequestError) {
        const byReason: Record<string, string> = {
          ASSISTANT_DISABLED: t('component.chat.error.disabled'),
          ASSISTANT_RUN_BUSY: t('component.chat.error.busy'),
          ASSISTANT_CONFIRMATION_NOT_PENDING: t(
            'component.chat.error.notPending',
          ),
        };
        message.error(
          byReason[error.reason] ??
            error.message ??
            t('component.chat.error.generic'),
        );
        return;
      }
      message.error(getErrorMessage(error, t('component.chat.error.generic')));
    },
    [message, t],
  );

  /**
   * 运行一次流式请求，事件写入 targetId 对应的 assistant 消息。
   * 用户切换会话后不再更新界面，但请求继续直到完成（后端已落库）。
   */
  const runStream = useCallback(
    async (
      targetId: string,
      request: (opts: {
        signal: AbortSignal;
        onEvent: (event: AssistantEvent) => void;
      }) => Promise<void>,
    ) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setRequesting(true);
      let conversationKey = activeRef.current;
      let gotEvent = false;
      const apply = (
        update: (msg: AssistantChatMessage) => AssistantChatMessage,
      ) => {
        if (activeRef.current !== conversationKey) return;
        patchAssistant(targetId, update);
      };
      const onEvent = (event: AssistantEvent) => {
        gotEvent = true;
        switch (event.type) {
          case 'conversation': {
            const { id, title } = event.data;
            if (conversationKey === DRAFT_KEY) {
              // 草稿落地为真实会话：替换 key，后续事件继续写入同一条消息
              conversationKey = id;
              if (activeRef.current === DRAFT_KEY) setActive(id);
              setConversations((prev) => [
                { key: id, label: title, group: 'today' },
                ...prev.filter((c) => !c.isDraft && c.key !== id),
              ]);
            } else {
              setConversations((prev) => {
                const current = prev.find((c) => c.key === id);
                if (!current) return prev;
                return [
                  { ...current, group: 'today' },
                  ...prev.filter((c) => c.key !== id),
                ];
              });
            }
            break;
          }
          case 'text_delta':
            apply((m) => ({ ...m, content: m.content + event.data.text }));
            break;
          case 'thinking_delta':
            apply((m) => ({ ...m, reasoning: m.reasoning + event.data.text }));
            break;
          case 'tool_call':
            apply((m) => ({ ...m, steps: [...m.steps, toStep(event.data)] }));
            break;
          case 'tool_result':
          case 'tool_confirm_required': {
            const step = toStep(event.data);
            apply((m) => ({
              ...m,
              steps: m.steps.some((s) => s.id === step.id)
                ? m.steps.map((s) => (s.id === step.id ? step : s))
                : [...m.steps, step],
              pendingConfirm:
                event.type === 'tool_confirm_required'
                  ? step.id
                  : m.pendingConfirm === step.id
                    ? undefined
                    : m.pendingConfirm,
            }));
            break;
          }
          case 'done':
            apply((m) => ({
              ...m,
              streaming: false,
              pendingConfirm:
                event.data.status === 'awaiting_confirmation'
                  ? m.pendingConfirm
                  : undefined,
            }));
            break;
          case 'error':
            apply((m) => ({
              ...m,
              streaming: false,
              error: event.data.message || event.data.reason,
            }));
            break;
          default:
            break;
        }
      };
      try {
        await request({ signal: controller.signal, onEvent });
      } catch (error) {
        const aborted =
          error instanceof DOMException && error.name === 'AbortError';
        if (!aborted) showRequestError(error);
        if (!gotEvent && !aborted) {
          // 未开始输出即失败：移除占位消息
          if (activeRef.current === conversationKey) {
            setMessages((prev) => prev.filter((m) => m.id !== targetId));
          }
        } else {
          apply((m) => ({
            ...m,
            streaming: false,
            error: aborted ? t('component.chat.stopped') : m.error,
          }));
        }
      } finally {
        apply((m) => (m.streaming ? { ...m, streaming: false } : m));
        if (abortRef.current === controller) abortRef.current = null;
        setRequesting(false);
      }
    },
    [patchAssistant, setActive, showRequestError, t],
  );

  const send = useCallback(
    (content: string) => {
      const text = content.trim();
      if (!text || isRequesting) return;
      const conversationId =
        activeRef.current === DRAFT_KEY ? undefined : activeRef.current;
      const assistantId = nextId('a');
      setMessages((prev) => [
        // 发送新消息会作废上一条未决确认（后端同样处理）
        ...prev.map((m) =>
          m.role === 'assistant' && m.pendingConfirm
            ? { ...m, pendingConfirm: undefined }
            : m,
        ),
        { id: nextId('u'), role: 'user', content: text },
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          reasoning: '',
          steps: [],
          streaming: true,
        },
      ]);
      void runStream(assistantId, (opts) =>
        streamChat({ conversationId, content: text }, opts),
      );
    },
    [isRequesting, runStream],
  );

  const confirm = useCallback(
    (messageId: string, toolCallId: string, approved: boolean) => {
      const conversationId = activeRef.current;
      if (conversationId === DRAFT_KEY || isRequesting) return;
      patchAssistant(messageId, (m) => ({
        ...m,
        streaming: true,
        pendingConfirm: undefined,
        steps: m.steps.map((s) =>
          s.id === toolCallId
            ? { ...s, status: approved ? 'approved' : 'rejected' }
            : s,
        ),
      }));
      void runStream(messageId, (opts) =>
        streamConfirm({ conversationId, toolCallId, approved }, opts),
      );
    },
    [isRequesting, patchAssistant, runStream],
  );

  const pending = useMemo(() => {
    const last = messages.at(-1);
    if (last?.role !== 'assistant' || !last.pendingConfirm) {
      return undefined;
    }
    const step = last.steps.find((s) => s.id === last.pendingConfirm);
    return step ? { messageId: last.id, step } : undefined;
  }, [messages]);

  return {
    conversations,
    activeKey,
    messages,
    historyLoading,
    isRequesting,
    pending,
    send,
    confirm,
    stop,
    newChat,
    select,
    remove,
  };
};
