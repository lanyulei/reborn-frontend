import { Form } from 'antd';
import { createStyles } from 'antd-style';
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

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>数据</div>
      <Form.Item
        className={styles.dataField}
        name="dataItems"
        rules={[
          {
            validator: async (_, value?: ConfigMapDataItem[]) => {
              const error = validateConfigMapDataItems(value);
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
