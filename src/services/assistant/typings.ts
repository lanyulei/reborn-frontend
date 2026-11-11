/**
 * 智能助手域类型：会话 / 展示消息 / 工具调用审计 / SSE 事件。
 * 接口契约见 backend/core/api/assistant/v1/assistant.proto。
 */

/** 工具调用状态（与后端 assistant_tool_call.status 一致） */
export type AssistantToolStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'denied'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

/** 会话 */
export interface AssistantConversation {
  id: string;
  title: string;
  createTime?: string;
  updateTime?: string;
}

/** 工具调用审计记录（历史接口返回；input/output 为脱敏后的 JSON 文本） */
export interface AssistantToolCall {
  id: string;
  toolName: string;
  title?: string;
  status: AssistantToolStatus;
  input?: string;
  output?: string;
  error?: string;
  /** int64 字符串 */
  durationMs?: string;
  write?: boolean;
  createTime?: string;
}

/** 展示消息：user 为用户消息；assistant 为一轮回复（文本 + 工具步骤聚合） */
export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  toolCalls?: AssistantToolCall[];
  createTime?: string;
}

/** SSE 工具事件载荷（tool_call / tool_result / tool_confirm_required） */
export interface AssistantToolEvent {
  id: string;
  tool: string;
  title?: string;
  write?: boolean;
  status: AssistantToolStatus;
  input?: unknown;
  output?: unknown;
  error?: string;
  durationMs?: number;
}

/** 轮次结束状态 */
export type AssistantDoneStatus =
  | 'completed'
  | 'awaiting_confirmation'
  | 'cancelled';

/** SSE 事件联合类型 */
export type AssistantEvent =
  | { type: 'conversation'; data: { id: string; title: string } }
  | { type: 'thinking_delta' | 'text_delta'; data: { text: string } }
  | {
      type: 'tool_call' | 'tool_result' | 'tool_confirm_required';
      data: AssistantToolEvent;
    }
  | { type: 'done'; data: { status: AssistantDoneStatus } }
  | { type: 'error'; data: { reason: string; message: string } };

/** 发送用户消息 */
export interface ChatParams {
  conversationId?: string;
  content: string;
}

/** 确认 / 拒绝待执行的写操作 */
export interface ConfirmParams {
  conversationId: string;
  toolCallId: string;
  approved: boolean;
}
