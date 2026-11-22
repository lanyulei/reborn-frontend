import { App, Form } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';
import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import KeyValueEditor from '../shared/KeyValueEditor';
import { createId } from './helpers';

const useStyles = createStyles(({ token }) => ({
  metadataWrapper: {
    marginTop: `16px`,
  },
  metadataLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  metadata: {
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  description: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  content: {
    marginTop: `10px`,

    '.ant-form-item-label': {
      paddingBottom: `10px`,
    },

    '.ant-form-item-label > label': {
      height: 'auto',
      color: token.colorText,
      fontSize: token.fontSizeSM,
      fontWeight: 600,
      lineHeight: token.lineHeight,
    },
  },
}));

const createKeyValueItem = (): KeyValueEditorItem => ({
  id: createId(),
  keyName: '',
  value: '',
});

const PodMetadataFields = () => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const t = useT();
  const metadataTip = t('pages.k8s.forms.workload.podMetadata.tip');

  return (
    <div className={styles.metadataWrapper}>
      <div className={styles.metadataLabel}>
        <span>{t('pages.k8s.forms.common.metadata')}</span>
      </div>
      <div className={styles.metadata}>
        <div className={styles.description}>{metadataTip}</div>
        <div className={styles.content}>
          <Form.Item
            label={t('pages.k8s.forms.common.annotations')}
            name="podAnnotations"
          >
            <KeyValueEditor
              addIcon={false}
              addText={t('pages.k8s.form.add')}
              deleteAriaLabel={t('pages.k8s.forms.common.deleteAnnotation')}
              footerJustify="flex-end"
              minRows={1}
              onAddBlocked={() =>
                message.warning(t('pages.k8s.forms.common.annotationKeyFirst'))
              }
              onCreateItem={createKeyValueItem}
            />
          </Form.Item>
        </div>
      </div>
    </div>
  );
};

export default PodMetadataFields;
