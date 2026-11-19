import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';

const useStyles = createStyles(({ token }) => ({
  section: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  optionTitle: {
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  option: {
    padding: '12px 16px',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  title: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  description: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  content: {},
  helpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: 12,
  },
}));

type ResourceFormSectionProps = {
  bordered?: boolean;
  children: ReactNode;
  description?: ReactNode;
  title: ReactNode;
  tooltip?: ReactNode;
};

const ResourceFormSection = ({
  bordered = true,
  children,
  description,
  title,
  tooltip,
}: ResourceFormSectionProps) => {
  const { styles } = useStyles();
  const titleNode = (
    <span className={styles.title}>
      {title}
      {tooltip && (
        <Tooltip title={tooltip}>
          <QuestionCircleOutlined className={styles.helpIcon} />
        </Tooltip>
      )}
    </span>
  );

  return (
    <div className={styles.section}>
      <div className={styles.optionTitle}>{titleNode}</div>
      {bordered ? (
        <div className={styles.option}>
          {description && (
            <div className={styles.description}>{description}</div>
          )}
          <div className={styles.content}>{children}</div>
        </div>
      ) : (
        <div className={styles.content}>
          {description && (
            <div className={styles.description}>{description}</div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export type { ResourceFormSectionProps };
export default ResourceFormSection;
