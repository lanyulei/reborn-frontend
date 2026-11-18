/** 触发浏览器把一段已取回的内容保存为文件（携带登录态的下载：先请求拿到 Blob，再保存）。 */
export const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // 稍后再释放：个别浏览器在点击后立即释放会中断下载
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
