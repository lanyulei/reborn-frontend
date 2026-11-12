/**
 * 变更历史 diff 渲染（实例详情 / 变更审计共用；summary 时只出一行变更字段摘要）：
 * - link/unlink 的 diff 为 {relationType, direction, target} → 关系摘要
 * - create/update/transition/delete 的 diff 为 {before, after} → DiffView 字段级对比，
 *   顶层 status 枚举翻译为文案；attrs.<code> 的字段名与取值按模型字段渲染
 */
import { Space, Tag } from 'antd';
import type React from 'react';
import { useMemo } from 'react';
import type {
  CmdbCIStatus,
  CmdbField,
  CmdbHistory,
} from '@/services/cmdb/typings';
import { useEnumText, useT } from '@/utils/i18n';
import { DiffSummary, DiffView } from './DiffView';
import { CMDB_CI_STATUS_META } from './meta';

/** link / unlink 的 diff 是关系摘要而非字段对比（行内直接展示，不可展开） */
export const isRelationAction = (action: CmdbHistory['action']) =>
  action === 'link' || action === 'unlink';

export const HistoryDiff: React.FC<{
  action: CmdbHistory['action'];
  diff?: Record<string, unknown>;
  fields: CmdbField[];
  /** 行内摘要：只列变更字段名（完整对比由展开行渲染） */
  summary?: boolean;
}> = ({ action, diff, fields, summary }) => {
  const t = useT();
  const statusText = useEnumText(CMDB_CI_STATUS_META);
  const d = diff ?? {};

  // diff 键 → 显示名（顶层固定列 + attrs.<code> → 模型字段名）
  const labels = useMemo(() => {
    const out: Record<string, string> = {
      name: t('pages.cmdb.ci.column.name'),
      status: t('common.column.status'),
      env: t('pages.cmdb.ci.column.env'),
      owner: t('pages.cmdb.ci.column.owner'),
      tags: t('pages.cmdb.ci.column.tags'),
      externalId: t('pages.cmdb.ci.column.externalId'),
    };
    for (const f of fields) out[`attrs.${f.code}`] = f.name;
    return out;
  }, [t, fields]);

  // 顶层 status 的枚举值翻译为文案（其余值保持原样）
  const translateSide = (
    side: unknown,
  ): Record<string, unknown> | undefined => {
    if (!side || typeof side !== 'object') return undefined;
    const out = { ...(side as Record<string, unknown>) };
    if (typeof out.status === 'string') {
      out.status = statusText(out.status as CmdbCIStatus);
    }
    return out;
  };

  if (isRelationAction(action)) {
    const target = (d.target ?? {}) as { id?: string; name?: string };
    return (
      <Space size={8} wrap>
        <Tag
          color={action === 'link' ? 'blue' : 'red'}
          style={{ marginInlineEnd: 0 }}
        >
          {t(
            action === 'link'
              ? 'pages.cmdb.detail.history.link'
              : 'pages.cmdb.detail.history.unlink',
            { target: target.name ?? target.id ?? '—' },
          )}
        </Tag>
        {typeof d.relationType === 'string' && (
          <Tag style={{ marginInlineEnd: 0 }}>{d.relationType}</Tag>
        )}
      </Space>
    );
  }
  if (summary) {
    return (
      <DiffSummary
        before={translateSide(d.before)}
        after={translateSide(d.after)}
        labels={labels}
      />
    );
  }
  return (
    <DiffView
      before={translateSide(d.before)}
      after={translateSide(d.after)}
      labels={labels}
      fields={fields}
    />
  );
};
