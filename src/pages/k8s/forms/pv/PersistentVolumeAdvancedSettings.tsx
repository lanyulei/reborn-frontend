import { App, Col, Form, Input, Row } from 'antd';
import { createStyles } from 'antd-style';
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
  const { message } = App.useApp();

  return (
    <div className={styles.stack}>
      <div className={styles.option}>
        <CollapsibleField
          description="为 PV 添加挂载选项，例如 nfsvers=4.1 或 noatime。"
          title="挂载选项"
        >
          <Form.Item name="mountOptions">
            <StringListEditor
              addText="添加"
              deleteAriaLabel="删除挂载选项"
              minRows={1}
              placeholder="请输入挂载选项"
              surface
              onAddBlocked={() => message.warning('请先填写已有挂载选项。')}
              onCreateItem={createStringItem}
            />
          </Form.Item>
        </CollapsibleField>
      </div>

      <div className={styles.option}>
        <CollapsibleField
          defaultOpen={false}
          description="预绑定到指定 PVC，通常只有确需静态绑定时才填写。"
          title="预绑定声明"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="命名空间" name="claimNamespace">
                <Input placeholder="请输入 PVC 命名空间" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="声明名称" name="claimName">
                <Input placeholder="请输入 PVC 名称" />
              </Form.Item>
            </Col>
          </Row>
        </CollapsibleField>
      </div>

      <div className={styles.option}>
        <CollapsibleField description="为持久卷添加标签和注解。" title="元数据">
          <div className={styles.optionBody}>
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

export default PersistentVolumeAdvancedSettings;
