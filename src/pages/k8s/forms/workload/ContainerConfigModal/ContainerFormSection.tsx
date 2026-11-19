import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';

const useStyles = createStyles(({ token }) => ({
  section: {
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  title: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  description: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  content: {
    marginTop: token.marginSM,
  },
}));

type ContainerFormSectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

const ContainerFormSection = ({
  title,
  description,
  children,
}: ContainerFormSectionProps) => {
  const { styles } = useStyles();

  return (
    <section className={styles.section}>
      {title && <div className={styles.title}>{title}</div>}
      {description && <div className={styles.description}>{description}</div>}
      <div className={styles.content}>{children}</div>
    </section>
  );
};

export default ContainerFormSection;
