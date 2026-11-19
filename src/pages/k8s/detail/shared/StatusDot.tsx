import { Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import type { CSSProperties, ReactNode } from 'react';

export type StatusType =
  | 'default'
  | 'error'
  | 'processing'
  | 'success'
  | 'warning';

type StatusTextProps = {
  className?: string;
  ellipsis?: boolean;
  label?: ReactNode;
  style?: CSSProperties;
  type?: StatusType;
};

const useStyles = createStyles(({ token }) => ({
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    maxWidth: '100%',
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  },
  ellipsis: {
    minWidth: 0,
  },
  textEllipsis: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
  },
  dotDefault: {
    backgroundColor: token.colorTextQuaternary,
    boxShadow: `0 0 0 3px ${token.colorFillSecondary}`,
  },
  dotError: {
    backgroundColor: token.colorError,
    boxShadow: `0 0 0 3px ${token.colorErrorBg}`,
  },
  dotProcessing: {
    backgroundColor: token.colorInfo,
    boxShadow: `0 0 0 3px ${token.colorInfoBg}`,
  },
  dotSuccess: {
    backgroundColor: token.colorSuccess,
    boxShadow: `0 0 0 3px ${token.colorSuccessBg}`,
  },
  dotWarning: {
    backgroundColor: token.colorWarning,
    boxShadow: `0 0 0 3px ${token.colorWarningBg}`,
  },
}));

const StatusText = ({
  className,
  ellipsis,
  label,
  style,
  type = 'default',
}: StatusTextProps) => {
  const { styles, cx } = useStyles();
  const statusLabel = label || '-';
  const statusDotClassMap: Record<StatusType, string> = {
    default: styles.dotDefault,
    error: styles.dotError,
    processing: styles.dotProcessing,
    success: styles.dotSuccess,
    warning: styles.dotWarning,
  };
  const content = (
    <span
      className={cx(styles.status, ellipsis && styles.ellipsis, className)}
      style={style}
    >
      <span className={cx(styles.dot, statusDotClassMap[type])} />
      <span className={ellipsis ? styles.textEllipsis : undefined}>
        {statusLabel}
      </span>
    </span>
  );

  // 表格列开启 ellipsis 时保留完整状态文案，避免窄列下只看到状态点。
  if (ellipsis && typeof statusLabel === 'string') {
    return <Tooltip title={statusLabel}>{content}</Tooltip>;
  }

  return content;
};

export default StatusText;
