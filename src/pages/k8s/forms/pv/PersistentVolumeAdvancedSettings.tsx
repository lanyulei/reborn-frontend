import { App, Col, Form, Input, Row } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';
import CollapsibleField from '../shared/CollapsibleField';
import KeyValueEditor from '../shared/KeyValueEditor';
import StringListEditor from '../shared/StringListEditor';
import { createKeyValueItem, createStringItem } from './helpers';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
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
  optionBody: {
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

const PersistentVolumeAdvancedSettings = () => {
  const { styles } = useStyles();
  const t = useT();
  const { message } = App.useApp();

  return (
    <div className={styles.stack}>
      <div className={styles.option}>
        <CollapsibleField
          description={t('pages.k8s.forms.pv.mountOptions.desc')}
          title={t('pages.k8s.forms.pv.mountOptions')}
        >
          <Form.Item name="mountOptions">
            <StringListEditor
              addText={t('pages.k8s.form.add')}
              deleteAriaLabel={t('pages.k8s.forms.pv.mountOptions.delete')}
              minRows={1}
              placeholder={t('pages.k8s.forms.pv.mountOptions.placeholder')}
              surface
              onAddBlocked={() =>
                message.warning(t('pages.k8s.forms.pv.mountOptions.first'))
              }
              onCreateItem={createStringItem}
            />
          </Form.Item>
        </CollapsibleField>
      </div>

      <div className={styles.option}>
        <CollapsibleField
          defaultOpen={false}
          description={t('pages.k8s.forms.pv.claimRef.desc')}
          title={t('pages.k8s.forms.pv.claimRef')}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.forms.common.namespace')}
                name="claimNamespace"
              >
                <Input
                  placeholder={t(
                    'pages.k8s.forms.pv.claimRef.namespace.placeholder',
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.forms.pv.claimRef.name')}
                name="claimName"
              >
                <Input
                  placeholder={t(
                    'pages.k8s.forms.pv.claimRef.name.placeholder',
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </CollapsibleField>
      </div>

      <div className={styles.option}>
        <CollapsibleField
          description={t('pages.k8s.forms.pv.metadata.desc')}
          title={t('pages.k8s.forms.common.metadata')}
        >
          <div className={styles.optionBody}>
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

export default PersistentVolumeAdvancedSettings;
