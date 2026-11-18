/** 容器平台的通用单元格：统一状态徽标、相对时间、标签组、镜像列表，以及按列类型渲染。 */
import { Badge, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import type { ListColumn, RowState, StateCell } from '@/services/k8s/typings';
import { DATE_TIME_SECONDS_FORMAT } from '@/utils/format';
import { useT } from '@/utils/i18n';
import { STATE_META } from './meta';

export const formatTime = (value?: string): string =>
  value ? dayjs(value).format(DATE_TIME_SECONDS_FORMAT) : '';

/** 时长的紧凑写法（同 kubectl 的 AGE）：3d2h / 5h12m / 12m / 30s */
export const formatAge = (from: string | undefined, now = Date.now()) => {
  if (!from) return '';
  const start = dayjs(from).valueOf();
  if (Number.isNaN(start)) return '';
  const s = Math.max(0, Math.floor((now - start) / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d >= 10) return `${d}d`;
  if (d > 0) return h > 0 ? `${d}d${h}h` : `${d}d`;
  if (h > 0) return m > 0 ? `${h}h${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
};

/** 相对时间，悬停显示完整时间 */
export const AgeText: React.FC<{ value?: string }> = ({ value }) => {
  const t = useT();
  if (!value) return <>{t('common.empty')}</>;
  return (
    <Tooltip title={formatTime(value)}>
      <span>{formatAge(value)}</span>
    </Tooltip>
  );
};

const isRowState = (state: unknown): state is RowState =>
  typeof state === 'string' && state in STATE_META;

/** 统一状态徽标：text 缺省取状态名；reason 悬停显示 */
export const StateBadge: React.FC<{
  state?: string;
  text?: string;
  reason?: string;
}> = ({ state, text, reason }) => {
  const t = useT();
  if (!isRowState(state)) return <>{text || t('common.empty')}</>;
  const meta = STATE_META[state];
  const badge = <Badge status={meta.badge} text={text || t(meta.textId)} />;
  return reason ? <Tooltip title={reason}>{badge}</Tooltip> : badge;
};

/** 键值标签组；超过 max 个折叠为 +N（悬停显示全部） */
export const LabelTags: React.FC<{
  value?: Record<string, string> | null;
  max?: number;
}> = ({ value, max = 3 }) => {
  const t = useT();
  const entries = Object.entries(value ?? {});
  if (entries.length === 0) return <>{t('common.empty')}</>;
  const text = ([k, v]: [string, string]) => (v === '' ? k : `${k}=${v}`);
  const shown = max > 0 ? entries.slice(0, max) : entries;
  const rest = entries.slice(shown.length);
  return (
    <span>
      {shown.map((entry) => (
        <Tag key={entry[0]} style={{ maxWidth: 280 }}>
          <Typography.Text
            ellipsis={{ tooltip: text(entry) }}
            style={{ maxWidth: 260, fontSize: 'inherit' }}
          >
            {text(entry)}
          </Typography.Text>
        </Tag>
      ))}
      {rest.length > 0 && (
        <Tooltip
          title={rest.map((entry) => <div key={entry[0]}>{text(entry)}</div>)}
        >
          <Tag>+{rest.length}</Tag>
        </Tooltip>
      )}
    </span>
  );
};

/** 字符串列表（镜像等）：一行一个，超过 max 个折叠 */
export const TextList: React.FC<{ value?: string[] | null; max?: number }> = ({
  value,
  max = 2,
}) => {
  const t = useT();
  const items = value ?? [];
  if (items.length === 0) return <>{t('common.empty')}</>;
  const shown = items.slice(0, max);
  const rest = items.slice(max);
  return (
    <div>
      {shown.map((item) => (
        <div key={item}>
          <Typography.Text
            ellipsis={{ tooltip: item }}
            style={{ maxWidth: 360 }}
          >
            {item}
          </Typography.Text>
        </div>
      ))}
      {rest.length > 0 && (
        <Tooltip title={rest.map((item) => <div key={item}>{item}</div>)}>
          <Tag>+{rest.length}</Tag>
        </Tooltip>
      )}
    </div>
  );
};

/** 按列类型渲染单元格（k8scontract.Col*） */
export const renderCell = (
  column: ListColumn,
  value: unknown,
  empty: string,
): React.ReactNode => {
  if (value === undefined || value === null || value === '') return empty;
  switch (column.type) {
    case 'state': {
      const cell = value as StateCell;
      return (
        <StateBadge state={cell.state} text={cell.text} reason={cell.reason} />
      );
    }
    case 'time':
      return <AgeText value={String(value)} />;
    case 'images':
    case 'list':
      return <TextList value={value as string[]} />;
    case 'labels':
      return <LabelTags value={value as Record<string, string>} />;
    case 'number':
      return String(value);
    default:
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
};
