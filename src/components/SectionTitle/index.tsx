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

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { styles } = useStyles();
  return <div className={styles.section}>{children}</div>;
};

export default SectionTitle;
