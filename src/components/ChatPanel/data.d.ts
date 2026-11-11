// src/components/ChatPanel/data.d.ts
import type {
  AssistantConversation,
  AssistantToolStatus,
} from '@/services/assistant/typings';

/** 会话分组键（展示文案经 groupable.label 按当前语言解析） */
export type ConversationGroup = 'today' | 'yesterday' | 'earlier';

export interface ConversationItem {
  key: string;
  label: string;
  group: ConversationGroup;
  /** 草稿：尚未发送首条消息、后端无记录 */
  isDraft?: boolean;
  raw?: AssistantConversation;
}

/** 一次工具调用步骤（SSE 事件与历史记录统一形态） */
export interface ChatStep {
  id: string;
  tool: string;
  title?: string;
  write: boolean;
  status: AssistantToolStatus;
  input?: unknown;
  output?: unknown;
  error?: string;
  durationMs?: number;
}

export interface UserChatMessage {
  id: string;
  role: 'user';
  content: string;
}

export interface AssistantChatMessage {
  id: string;
  role: 'assistant';
  content: string;
  reasoning: string;
  steps: ChatStep[];
  /** 等待用户确认的步骤 id */
  pendingConfirm?: string;
  /** 正在流式接收 */
  streaming: boolean;
  /** 流内错误文案 */
  error?: string;
}

export type ChatMessage = UserChatMessage | AssistantChatMessage;
