/**
 * AssistantChatService 流式对话：POST /api/v1/assistant/chat | /confirm，
 * 响应为 SSE（text/event-stream）。不走 umi request（axios 不支持流式读取），
 * 用 fetch + x-sdk XStream 解析；令牌由 ensureFreshToken 预刷新，401 跳登录。
 */
import { XStream } from '@ant-design/x-sdk';
import { ensureFreshToken, redirectToLogin } from '@/services/system/request';
import { getAccessToken } from '@/utils/auth';
import type { AssistantEvent, ChatParams, ConfirmParams } from './typings';

/** 助手请求失败（非 2xx）：携带后端 Kratos 错误 reason，供界面按错误码提示 */
export class AssistantRequestError extends Error {
  readonly status: number;
  readonly reason: string;

  constructor(status: number, reason: string, message: string) {
    super(message);
    this.name = 'AssistantRequestError';
    this.status = status;
    this.reason = reason;
  }
}

interface StreamOptions {
  signal?: AbortSignal;
  onEvent: (event: AssistantEvent) => void;
}

async function stream(
  url: string,
  body: ChatParams | ConfirmParams,
  { signal, onEvent }: StreamOptions,
): Promise<void> {
  if (!(await ensureFreshToken())) {
    redirectToLogin();
    throw new AssistantRequestError(401, 'TOKEN_INVALID', 'unauthenticated');
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${getAccessToken() ?? ''}`,
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    let reason = String(response.status);
    let message = response.statusText;
    try {
      const err = (await response.json()) as {
        reason?: string;
        message?: string;
      };
      reason = err.reason ?? reason;
      message = err.message ?? message;
    } catch {
      // 非 JSON 错误体：保留状态文案
    }
    if (response.status === 401) {
      redirectToLogin();
    }
    throw new AssistantRequestError(response.status, reason, message);
  }
  if (!response.body) {
    throw new AssistantRequestError(0, 'NO_BODY', 'empty response body');
  }
  for await (const chunk of XStream({ readableStream: response.body })) {
    if (!chunk.event || chunk.data === undefined) continue;
    let data: unknown;
    try {
      data = JSON.parse(String(chunk.data));
    } catch {
      continue;
    }
    onEvent({ type: chunk.event, data } as AssistantEvent);
  }
}

/** Chat 发送用户消息，流式接收事件 */
export function streamChat(
  params: ChatParams,
  options: StreamOptions,
): Promise<void> {
  return stream('/api/v1/assistant/chat', params, options);
}

/** Confirm 对待确认操作做裁决，流式接收后续事件 */
export function streamConfirm(
  params: ConfirmParams,
  options: StreamOptions,
): Promise<void> {
  return stream('/api/v1/assistant/confirm', params, options);
}
