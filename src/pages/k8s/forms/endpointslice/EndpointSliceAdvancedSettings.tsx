import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import ResourceMetadataFields from '../shared/ResourceMetadataFields';

const useStyles = createStyles(({ token }) => ({
  sectionTitle: {
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

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  optionHeaderButton: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
    width: '100%',
    padding: 0,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
  },
  headerIcon: {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
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
  metadataBody: {
    marginTop: 14,
    borderRadius: token.borderRadiusSM,
  },
}));

const EndpointSliceAdvancedSettings = () => {
  const { styles } = useStyles();
  const [metadataOpen, setMetadataOpen] = useState(true);

  return (
    <div>
      <div className={styles.sectionTitle}>元数据</div>
      <div className={styles.option}>
        <button
          aria-expanded={metadataOpen}
          className={styles.optionHeaderButton}
          type="button"
          onClick={() => setMetadataOpen((open) => !open)}
        >
          <span className={styles.headerIcon}>
            {metadataOpen ? <UpOutlined /> : <DownOutlined />}
          </span>
          <span>
            <div className={styles.title}>添加元数据</div>
            <div className={styles.description}>
              为端点切片资源添加自定义标签和注解。
            </div>
          </span>
        </button>
        {metadataOpen && (
          <div className={styles.metadataBody}>
            <ResourceMetadataFields />
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointSliceAdvancedSettings;
