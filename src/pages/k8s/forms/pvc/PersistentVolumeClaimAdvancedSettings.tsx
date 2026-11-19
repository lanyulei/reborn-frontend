import { App, Form } from 'antd';
import { createStyles } from 'antd-style';
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
  const { message } = App.useApp();

  return (
    <div className={styles.stack}>
      <div className={styles.sectionTitle}>元数据</div>
      <div className={styles.option}>
        <CollapsibleField description="为卷添加元数据。" title="添加元数据">
          <div className={styles.metadataBody}>
            <div>
              <div className={styles.fieldLabel}>标签</div>
              <Form.Item name="labels">
                <KeyValueEditor
                  addIcon={false}
                  addText="添加"
                  deleteAriaLabel="删除标签"
                  minRows={1}
                  onAddBlocked={() => message.warning('请先填写已有标签的键。')}
                  onCreateItem={createKeyValueItem}
                />
              </Form.Item>
            </div>
            <div>
              <div className={styles.fieldLabel}>注解</div>
              <Form.Item name="annotations">
                <KeyValueEditor
                  addIcon={false}
                  addText="添加"
                  deleteAriaLabel="删除注解"
                  minRows={1}
                  onAddBlocked={() => message.warning('请先填写已有注解的键。')}
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
