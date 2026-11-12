/**
 * 变更 diff 的字段级对比视图：{before, after} → 字段 / 变更前 / 变更后 三列表。
 * - labels 提供字段显示名（模型字段 code→名，或固定列名）；缺省用 key
 * - fields 提供模型字段定义时按类型渲染值（敏感字段后端已脱敏，原样展示）
 * - 嵌套纯对象（如字段规则的 rule.*、审计里的嵌套结构）展开一层；
 *   json 类型字段的值保持整体展示
 */
import { Empty } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useMemo } from 'react';
import type { CmdbField } from '@/services/cmdb/typings';
import { useT } from '@/utils/i18n';
import { renderAttrValue } from './schema';

const useStyles = createStyles(({ token, css }) => ({
  table: css`
    width: 100%;
    border-collapse: collapse;
    font-size: ${token.fontSizeSM}px;
    th {
      padding: 8px 12px;
      color: ${token.colorTextTertiary};
      font-weight: 500;
      text-align: start;
      border-bottom: 1px solid ${token.colorSplit};
      white-space: nowrap;
    }
    td {
      padding: 8px 12px;
      vertical-align: top;
      word-break: break-word;
      border-bottom: 1px solid ${token.colorSplit};
    }
    tr:last-child td {
      border-bottom: none;
    }
  `,
  field: css`
    color: ${token.colorText};
    font-weight: 500;
    white-space: nowrap;
  `,
  unchanged: css`
    color: ${token.colorTextTertiary};
  `,
  empty: css`
    padding: 24px;
  `,
}));

interface DiffRow {
  key: string;
  root: string;
  before?: unknown;
  after?: unknown;
  changed: boolean;
}

/** 展开一层纯对象（json 类型字段保持整体） */
const flatten = (
  src: Record<string, unknown> | null | undefined,
  isJsonField: (key: string) => boolean,
  out: Record<string, { root: string; value: unknown }> = {},
): Record<string, { root: string; value: unknown }> => {
  for (const [k, v] of Object.entries(src ?? {})) {
    if (
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      !isJsonField(k)
    ) {
      for (const [sub, subVal] of Object.entries(
        v as Record<string, unknown>,
      )) {
        out[`${k}.${sub}`] = { root: k, value: subVal };
      }
    } else {
      out[k] = { root: k, value: v };
    }
  }
  return out;
};

/**
 * 变更摘要（表格行内，一行）：列出前后取值不同的字段名，最多 3 个，其余折为计数；
 * 完整对比放在展开行里用 DiffView 展示。
 */
export const DiffSummary: React.FC<{
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  labels?: Record<string, string>;
}> = ({ before, after, labels }) => {
  const t = useT();
  const { styles } = useStyles();
  const names = useMemo(() => {
    const flatBefore = flatten(before, () => false);
    const flatAfter = flatten(after, () => false);
    const keys = [
      ...Object.keys(flatAfter),
      ...Object.keys(flatBefore).filter((k) => !(k in flatAfter)),
    ];
    const blank = (v: unknown) => v === undefined || v === null || v === '';
    return keys
      .filter((k) => {
        const b = flatBefore[k]?.value;
        const a = flatAfter[k]?.value;
        if (blank(b) && blank(a)) return false;
        return JSON.stringify(b) !== JSON.stringify(a);
      })
      .map(
        (k) =>
          labels?.[k] ??
          labels?.[flatAfter[k]?.root ?? flatBefore[k]?.root ?? k] ??
          k,
      );
  }, [before, after, labels]);

  if (names.length === 0) return <span className={styles.unchanged}>—</span>;
  const shown = names.slice(0, 3).join(t('pages.cmdb.diff.summary.sep'));
  return (
    <span>
      {shown}
      {names.length > 3 && (
        <span className={styles.unchanged}>
          {' '}
          {t('pages.cmdb.diff.summary.more', { n: names.length })}
        </span>
      )}
    </span>
  );
};

export const DiffView: React.FC<{
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  /** key（含展开后的 a.b 形式）→ 显示名 */
  labels?: Record<string, string>;
  /** 模型字段定义（按类型渲染值） */
  fields?: CmdbField[];
}> = ({ before, after, labels, fields }) => {
  const t = useT();
  const { styles, cx } = useStyles();

  const rows = useMemo<DiffRow[]>(() => {
    const fieldByCode = new Map((fields ?? []).map((f) => [f.code, f]));
    const isJsonField = (key: string) => fieldByCode.get(key)?.type === 'json';
    const flatBefore = flatten(before, isJsonField);
    const flatAfter = flatten(after, isJsonField);
    const keys = [
      ...Object.keys(flatAfter),
      ...Object.keys(flatBefore).filter((k) => !(k in flatAfter)),
    ];
    return keys.map((key) => {
      const b = flatBefore[key]?.value;
      const a = flatAfter[key]?.value;
      return {
        key,
        root: flatAfter[key]?.root ?? flatBefore[key]?.root ?? key,
        before: b,
        after: a,
        changed: JSON.stringify(b) !== JSON.stringify(a),
      };
    });
  }, [before, after, fields]);

  if (!rows.length) {
    return (
      <div className={styles.empty}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const renderValue = (row: DiffRow, value: unknown) => {
    if (value === undefined || value === null || value === '') {
      return <span className={styles.unchanged}>—</span>;
    }
    // attrs.<code> 展开行按字段 code 解析；顶层键（name/status/…）按原键解析
    const code = row.key.startsWith('attrs.') ? row.key.slice(6) : row.root;
    const field = (fields ?? []).find((f) => f.code === code);
    if (field) return renderAttrValue(field, value, t);
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>{t('pages.cmdb.diff.field')}</th>
          <th>{t('pages.cmdb.diff.before')}</th>
          <th>{t('pages.cmdb.diff.after')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <td className={styles.field}>
              {labels?.[row.key] ?? labels?.[row.root] ?? row.key}
            </td>
            <td className={cx(!row.changed && styles.unchanged)}>
              {renderValue(row, row.before)}
            </td>
            <td className={cx(!row.changed && styles.unchanged)}>
              {renderValue(row, row.after)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
