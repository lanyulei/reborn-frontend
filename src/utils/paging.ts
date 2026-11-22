/**
 * 取全量：先取首页拿到 total，其余页并行拉取后按页序拼接。用于下拉选项 / id→名称映射
 * 这类需要完整集合的辅助查询，替代写死 `pageSize: 100` 取首页（超过一页时会被静默截断）。
 */
const PAGE_SIZE = 100;
/** 安全上限：防止 total 异常时无限翻页 */
const MAX_PAGES = 50;

export async function fetchAllPages<T>(
  fetchPage: (
    page: number,
    pageSize: number,
  ) => Promise<{ items?: T[]; total?: string | number }>,
): Promise<T[]> {
  const first = await fetchPage(1, PAGE_SIZE);
  const all: T[] = [...(first.items ?? [])];
  const total = Number(first.total) || 0;
  if (all.length < PAGE_SIZE || (total > 0 && all.length >= total)) return all;
  if (total > 0) {
    const pages = Math.min(Math.ceil(total / PAGE_SIZE), MAX_PAGES);
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) => fetchPage(i + 2, PAGE_SIZE)),
    );
    for (const result of rest) all.push(...(result.items ?? []));
    return all;
  }
  // total 缺失：无法预知页数，只能逐页取到不满一页为止
  for (let page = 2; page <= MAX_PAGES; page += 1) {
    const items = (await fetchPage(page, PAGE_SIZE)).items ?? [];
    all.push(...items);
    if (items.length < PAGE_SIZE) break;
  }
  return all;
}
