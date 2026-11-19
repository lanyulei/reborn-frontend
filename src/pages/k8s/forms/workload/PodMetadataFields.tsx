import { App, Form } from 'antd';
import { createStyles } from 'antd-style';
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
  const metadataTip = '为容器组副本添加元数据。';

  return (
    <div className={styles.metadataWrapper}>
      <div className={styles.metadataLabel}>
        <span>元数据</span>
      </div>
      <div className={styles.metadata}>
        <div className={styles.description}>{metadataTip}</div>
        <div className={styles.content}>
          <Form.Item label="注解" name="podAnnotations">
            <KeyValueEditor
              addIcon={false}
              addText="添加"
              deleteAriaLabel="删除注解"
              footerJustify="flex-end"
              minRows={1}
              onAddBlocked={() => message.warning('请先填写已有注解的键。')}
              onCreateItem={createKeyValueItem}
            />
          </Form.Item>
        </div>
      </div>
    </div>
  );
};

export default PodMetadataFields;
