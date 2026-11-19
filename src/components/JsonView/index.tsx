/**
 * JSON 只读展示：缩进美化 + 等宽字体 + 主题色块 + 右上角一键复制，
 * 超高滚动。供运行表展开行展示载荷 / 渲染快照等任意 JSON 值。
 */
import { Typography } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useT } from '@/utils/i18n';

const useStyles = createStyles(({ token }) => ({
  root: { position: 'relative' },
  pre: {
    margin: 0,
    padding: `${token.paddingXS}px ${token.paddingSM}px`,
    // 右侧留出复制按钮位置
    paddingRight: token.paddingXL,
    overflow: 'auto',
    fontFamily: token.fontFamilyCode,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    color: token.colorText,
    backgroundColor: token.colorFillQuaternary,
    border: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  copy: {
    position: 'absolute',
    top: token.paddingXXS,
    right: token.paddingXS,
  },
}));

export const JsonView: React.FC<{
  value?: unknown;
  /** 超出后内部滚动，默认 240px */
  maxHeight?: number;
  /** 值为空时的占位文案（缺省 common.empty） */
  emptyText?: string;
}> = ({ value, maxHeight = 240, emptyText }) => {
  const { styles } = useStyles();
  const t = useT();
  if (value == null) {
    return (
      <Typography.Text type="secondary">
        {emptyText ?? t('common.empty')}
      </Typography.Text>
    );
  }
  const text = JSON.stringify(value, null, 2);
  return (
    <div className={styles.root}>
      <pre className={styles.pre} style={{ maxHeight }}>
        {text}
      </pre>
      <Typography.Text
        className={styles.copy}
        copyable={{
          text,
          tooltips: [t('common.action.copyJson'), t('common.action.copied')],
        }}
      />
    </div>
  );
};
