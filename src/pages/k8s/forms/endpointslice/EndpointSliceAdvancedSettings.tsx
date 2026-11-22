import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { useT } from '@/utils/i18n';
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
  const t = useT();
  const [metadataOpen, setMetadataOpen] = useState(true);

  return (
    <div>
      <div className={styles.sectionTitle}>
        {t('pages.k8s.forms.common.metadata')}
      </div>
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
            <div className={styles.title}>
              {t('pages.k8s.forms.common.addMetadata')}
            </div>
            <div className={styles.description}>
              {t('pages.k8s.forms.endpointslice.metadata.description')}
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
