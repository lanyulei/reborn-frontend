/** 分节标题：详情页与表单抽屉里一段内容的小标题（左侧带主色竖条），全站同一样式。 */
import { createStyles } from 'antd-style';
import type React from 'react';

const useStyles = createStyles(({ token, css }) => ({
  section: css`
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 20px 0 12px;
    color: ${token.colorText};
    font-weight: 600;
    &::before {
      width: 3px;
      height: 14px;
      background: ${token.colorPrimary};
      border-radius: 2px;
      content: '';
    }
  `,
}));

export const SectionTitle: React.FC<{
  children: React.ReactNode;
  /** 覆盖默认边距（如表单分组标题去掉顶部外边距，与表单行距对齐） */
  style?: React.CSSProperties;
}> = ({ children, style }) => {
  const { styles } = useStyles();
  return (
    <div className={styles.section} style={style}>
      {children}
    </div>
  );
};

export default SectionTitle;
