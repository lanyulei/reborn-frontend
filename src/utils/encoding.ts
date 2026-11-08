/**
 * 敏感字段编码（Base64，与后端约定 `b64$` 前缀标记）。
 * 后端识别前缀则解码，无前缀按明文处理（兼容）。
 * 注意：Base64 是编码不是加密，仅避免密码明文直出请求体/日志。
 */
export function encodeSensitive(plaintext: string): string {
  const bytes = new TextEncoder().encode(plaintext);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `b64$${btoa(binary)}`;
}
