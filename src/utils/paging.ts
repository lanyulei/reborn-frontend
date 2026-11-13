/**
 * 取全量：按页拉完为止。用于下拉选项 / id→名称映射这类需要完整集合的辅助查询，
 * 替代写死 `pageSize: 100` 取首页（超过一页时会被静默截断）。
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
  const all: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await fetchPage(page, PAGE_SIZE);
    const items = result.items ?? [];
    all.push(...items);
    const total = Number(result.total) || 0;
    // 页未取满或已达 total 即停止（total 缺失时靠前者兜底）
    if (items.length < PAGE_SIZE || (total > 0 && all.length >= total)) break;
  }
  return all;
}
