/** 页签内的小节标题（比页面级的分节标题小一号） */
import { createStyles } from 'antd-style';
import type { CSSProperties, ReactNode } from 'react';

const useStyles = createStyles(({ token }) => ({
  title: {
    marginBottom: 8,
    color: token.colorTextSecondary,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.67,
  },
}));

const SubTitle = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) => {
  const { styles } = useStyles();
  return (
    <div className={styles.title} style={style}>
      {children}
    </div>
  );
};

export default SubTitle;
