import { Form } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';
import ConfigMapDataEditor from './ConfigMapDataEditor';
import { validateConfigMapDataItems } from './helpers';
import type { ConfigMapDataItem } from './types';

const useStyles = createStyles(({ token }) => ({
  section: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  sectionTitle: {
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  dataField: {
    width: '100%',

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
}));

const ConfigMapDataSettings = () => {
  const { styles } = useStyles();
  const t = useT();

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>
        {t('pages.k8s.forms.common.data')}
      </div>
      <Form.Item
        className={styles.dataField}
        name="dataItems"
        rules={[
          {
            validator: async (_, value?: ConfigMapDataItem[]) => {
              const error = validateConfigMapDataItems(value, t);
              if (error) {
                throw new Error(error);
              }
            },
          },
        ]}
      >
        <ConfigMapDataEditor />
      </Form.Item>
    </div>
  );
};

export default ConfigMapDataSettings;
