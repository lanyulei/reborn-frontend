import { Alert } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';

type KubernetesCompatibilityNoticeProps = {
  description?: ReactNode;
  items?: ReactNode[];
  message: ReactNode;
  type?: 'info' | 'warning';
};

const useStyles = createStyles(({ token }) => ({
  notice: {
    marginBottom: token.marginSM,

    '.ant-alert-description': {
      color: token.colorTextSecondary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeight,
    },
  },
  list: {
    margin: 0,
    paddingInlineStart: 18,
  },
}));

const KubernetesCompatibilityNotice = ({
  description,
  items,
  message,
  type = 'info',
}: KubernetesCompatibilityNoticeProps) => {
  const { styles } = useStyles();
  const nextDescription =
    items && items.length > 0 ? (
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={String(index)}>{item}</li>
        ))}
      </ul>
    ) : (
      description
    );

  return (
    <Alert
      className={styles.notice}
      description={nextDescription}
      title={message}
      showIcon
      type={type}
    />
  );
};

export type { KubernetesCompatibilityNoticeProps };
export default KubernetesCompatibilityNotice;
