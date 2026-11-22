import { App, Form } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';
import CollapsibleField from '../shared/CollapsibleField';
import KeyValueEditor from '../shared/KeyValueEditor';
import { createKeyValueItem } from './helpers';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  sectionTitle: {
    marginBottom: 0,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  option: {
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  metadataBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
  fieldLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

const PersistentVolumeClaimAdvancedSettings = () => {
  const { styles } = useStyles();
  const t = useT();
  const { message } = App.useApp();

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>
        {t('pages.k8s.forms.common.metadata')}
      </div>
      <div className={styles.option}>
        <CollapsibleField
          description={t('pages.k8s.forms.pvc.metadata.desc')}
          title={t('pages.k8s.forms.common.addMetadata')}
        >
          <div className={styles.metadataBody}>
            <div>
              <div className={styles.fieldLabel}>
                {t('pages.k8s.forms.common.labels')}
              </div>
              <Form.Item name="labels">
                <KeyValueEditor
                  addIcon={false}
                  addText={t('pages.k8s.form.add')}
                  deleteAriaLabel={t('pages.k8s.forms.common.deleteLabel')}
                  minRows={1}
                  onAddBlocked={() =>
                    message.warning(t('pages.k8s.forms.common.labelKeyFirst'))
                  }
                  onCreateItem={createKeyValueItem}
                />
              </Form.Item>
            </div>
            <div>
              <div className={styles.fieldLabel}>
                {t('pages.k8s.forms.common.annotations')}
              </div>
              <Form.Item name="annotations">
                <KeyValueEditor
                  addIcon={false}
                  addText={t('pages.k8s.form.add')}
                  deleteAriaLabel={t('pages.k8s.forms.common.deleteAnnotation')}
                  minRows={1}
                  onAddBlocked={() =>
                    message.warning(
                      t('pages.k8s.forms.common.annotationKeyFirst'),
                    )
                  }
                  onCreateItem={createKeyValueItem}
                />
              </Form.Item>
            </div>
          </div>
        </CollapsibleField>
      </div>
    </div>
  );
};

export default PersistentVolumeClaimAdvancedSettings;
