/**
 * 监控告警页面共享的小展示件：级别标签 / 色条、标签集（可紧凑折叠）、引用对象名称列表。
 */
import { Alert, Button, Popover, Tag, Tooltip, Typography } from 'antd';
import type React from 'react';
import { NOTIFY_SEVERITY_META } from '@/constants';
import type { MonitorSeverity, NamedRef } from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import { labelEntries } from './format';
import { useMonitorStyles } from './styles';

/** 级别元数据的徽标状态 → Tag 预设色（与通知域的级别徽标同色） */
const STATUS_TAG_COLOR = {
  Default: undefined,
  Warning: 'warning',
  Error: 'error',
  Success: 'success',
  Processing: 'processing',
} as const;

/** 级别标签：提示 / 警告 / 严重 / 致命 */
export const SeverityTag: React.FC<{ severity?: MonitorSeverity }> = ({
  severity,
}) => {
  const t = useT();
  if (!severity || !NOTIFY_SEVERITY_META[severity]) return t('common.empty');
  return (
    <Tag
      color={
        STATUS_TAG_COLOR[NOTIFY_SEVERITY_META[severity].status ?? 'Default']
      }
      style={{ marginInlineEnd: 0 }}
    >
      {t(NOTIFY_SEVERITY_META[severity].textId)}
    </Tag>
  );
};

/** 级别色条（表格首列、卡片左缘）；className 用于覆盖尺寸 / 定位 */
export const SeverityBar: React.FC<{
  severity?: MonitorSeverity;
  className?: string;
}> = ({ severity, className }) => {
  const { styles, cx } = useMonitorStyles();
  const status = severity && NOTIFY_SEVERITY_META[severity]?.status;
  const color =
    status === 'Error'
      ? styles.severityError
      : status === 'Warning'
        ? styles.severityWarning
        : styles.severityDefault;
  return <span className={cx(className ?? styles.severityBar, color)} />;
};

const labelTag = ([key, value]: [string, string]) => (
  <Tag key={key} style={{ maxWidth: 320 }}>
    <span
      style={{
        display: 'inline-block',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        verticalAlign: 'bottom',
      }}
      title={`${key}=${value}`}
    >
      {key}={value}
    </span>
  </Tag>
);

/**
 * 标签集：每个标签一枚 Tag（name=value）。给出 max 即紧凑模式——只显示前 max 个，
 * 其余折叠为「+N」，悬停展开全部。
 */
export const LabelTags: React.FC<{
  labels?: Record<string, string>;
  max?: number;
}> = ({ labels, max }) => {
  const t = useT();
  const { styles } = useMonitorStyles();
  const entries = labelEntries(labels);
  if (entries.length === 0) return t('common.empty');
  const shown = max ? entries.slice(0, max) : entries;
  const rest = entries.length - shown.length;
  return (
    <span className={styles.tagList}>
      {shown.map(labelTag)}
      {rest > 0 && (
        <Popover
          content={
            <div className={styles.tagListPopover}>{entries.map(labelTag)}</div>
          }
        >
          <Tag>+{rest}</Tag>
        </Popover>
      )}
    </span>
  );
};

/**
 * 引用对象名称列表（规则 / 数据源 / 分组 / 用户 / 值班表）：已删除或不可用的置灰并提示。
 * 为空时显示 emptyText（如「不限」）。
 */
export const RefTags: React.FC<{
  refs?: readonly NamedRef[];
  emptyText?: React.ReactNode;
  max?: number;
}> = ({ refs, emptyText, max = 3 }) => {
  const t = useT();
  const { styles } = useMonitorStyles();
  if (!refs?.length) return emptyText ?? t('common.empty');
  const render = (ref: NamedRef) =>
    ref.missing ? (
      <Tooltip key={ref.id} title={t('pages.monitor.ref.missing')}>
        <Tag variant="outlined" color="default">
          <del>{ref.name || ref.id}</del>
        </Tag>
      </Tooltip>
    ) : (
      <Tag key={ref.id}>{ref.name || ref.id}</Tag>
    );
  const shown = refs.slice(0, max);
  const rest = refs.length - shown.length;
  return (
    <span className={styles.tagList}>
      {shown.map(render)}
      {rest > 0 && (
        <Popover
          content={
            <div className={styles.tagListPopover}>{refs.map(render)}</div>
          }
        >
          <Tag>+{rest}</Tag>
        </Popover>
      )}
    </span>
  );
};

/** 通知对象候选（值班表 / 部门）加载失败的提示，带「重试」（各表单共用） */
export const TargetsFailedAlert: React.FC<{
  targets: { failed: boolean; loading: boolean; retry: () => void };
}> = ({ targets }) => {
  const t = useT();
  if (!targets.failed) return null;
  return (
    <Alert
      type="warning"
      showIcon
      title={t('pages.monitor.targets.failed')}
      action={
        <Button size="small" loading={targets.loading} onClick={targets.retry}>
          {t('pages.monitor.retry')}
        </Button>
      }
      style={{ marginBottom: 16 }}
    />
  );
};

/**
 * 受数据范围约束的操作链接：元素权限决定是否渲染（调用方判断），对所在分组「可管理」才可用——
 * 否则置灰并提示。
 */
export const ManageLink: React.FC<{
  canManage?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ canManage, onClick, children }) => {
  const t = useT();
  if (canManage) return <a onClick={onClick}>{children}</a>;
  return (
    <Tooltip title={t('pages.monitor.needManage')}>
      <Typography.Link disabled>{children}</Typography.Link>
    </Tooltip>
  );
};
