/**
 * 生成 UUID（v4）。crypto.randomUUID 只在安全上下文（HTTPS / localhost）可用，
 * 经内网 HTTP 地址访问时退回到 getRandomValues 拼装——后者在任何上下文都可用。
 * 用于提交类请求的幂等键。
 */
export const randomUUID = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
    .slice(6, 8)
    .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
};
