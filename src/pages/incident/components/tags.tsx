/**
 * 故障页面共享的小展示件：等级 / 状态 / 复盘状态标签，引用对象名称，时长。
 */
import { Link, useAccess } from '@umijs/max';
import { Badge, Tag, Typography } from 'antd';
import type React from 'react';
import type {
  IncidentSeverity,
  IncidentStatus,
  NamedRef,
  ReviewStatus,
} from '@/services/incident/typings';
import { useT } from '@/utils/i18n';
import { REVIEW_META, SEVERITY_META, STATUS_META } from './meta';

const isSeverity = (v?: number): v is IncidentSeverity =>
  v === 1 || v === 2 || v === 3 || v === 4;

export const SeverityTag: React.FC<{ severity?: number }> = ({ severity }) => {
  const t = useT();
  if (!isSeverity(severity)) return <>{t('common.empty')}</>;
  const meta = SEVERITY_META[severity];
  return (
    <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
      {t(meta.textId)}
    </Tag>
  );
};

const badge = (status?: string) =>
  (status?.toLowerCase() ?? 'default') as
    | 'success'
    | 'processing'
    | 'error'
    | 'default'
    | 'warning';

export const StatusBadge: React.FC<{ status?: IncidentStatus }> = ({
  status,
}) => {
  const t = useT();
  const meta = status ? STATUS_META[status] : undefined;
  if (!meta) return <>{t('common.empty')}</>;
  return <Badge status={badge(meta.status)} text={t(meta.textId)} />;
};

export const ReviewBadge: React.FC<{
  status?: ReviewStatus;
  overdue?: boolean;
}> = ({ status, overdue }) => {
  const t = useT();
  const meta = REVIEW_META[status ?? 0];
  return (
    <>
      <Badge status={badge(meta.status)} text={t(meta.textId)} />
      {overdue && (
        <Tag color="error" style={{ marginInlineStart: 6 }}>
          {t('pages.incident.review.overdue')}
        </Tag>
      )}
    </>
  );
};

/** 引用对象的显示名：已删除标灰并注明；无对象显示占位 */
export const RefName: React.FC<{ ref?: NamedRef | null }> = ({ ref }) => {
  const t = useT();
  if (!ref?.id) return <>{t('common.empty')}</>;
  if (ref.missing) {
    return (
      <Typography.Text type="secondary" delete>
        {ref.name || ref.id} ({t('pages.incident.missing')})
      </Typography.Text>
    );
  }
  return <>{ref.name || ref.id}</>;
};

/** 引用对象列表（逗号分隔） */
export const RefNames: React.FC<{ refs?: NamedRef[] }> = ({ refs }) => {
  const t = useT();
  if (!refs?.length) return <>{t('common.empty')}</>;
  return (
    <>
      {refs.map((ref, i) => (
        <span key={ref.id}>
          {i > 0 && '、'}
          <RefName ref={ref} />
        </span>
      ))}
    </>
  );
};

/** 资源名：有权限时链接到资源详情 */
export const CiLink: React.FC<{ ci?: NamedRef | null; canView?: boolean }> = ({
  ci,
  canView = true,
}) => {
  const access = useAccess();
  if (!ci?.id) return null;
  const text = ci.name || ci.id;
  return canView && !ci.missing && access.canCmdbCI ? (
    <Link to={`/cmdb/ci/${ci.id}`}>{text}</Link>
  ) : (
    <span>{text}</span>
  );
};

/** 秒数 → 可读时长（后端 int64 字符串） */
export const formatSeconds = (s?: string | number): string => {
  const n = Number(s ?? 0);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n < 60) return `${Math.round(n)}s`;
  if (n < 3600) return `${(n / 60).toFixed(1)}m`;
  if (n < 86400) return `${(n / 3600).toFixed(1)}h`;
  return `${(n / 86400).toFixed(1)}d`;
};
