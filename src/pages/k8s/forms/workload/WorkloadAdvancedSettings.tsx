import { DownOutlined, UpOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { App, Button, Checkbox, Form } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import KeyValueEditor from '../shared/KeyValueEditor';
import { createId } from './helpers';
import NodeSelectorModal from './NodeSelectorModal';
import type { CreateWorkloadFormValues, WorkloadKind } from './types';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  sectionTitle: {
    marginBottom: `8px`,
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
  optionHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
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
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    marginTop: 2,
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
  body: {
    marginTop: `14px`,
    // padding: token.paddingSM,
    borderRadius: token.borderRadiusSM,
    // background: token.colorFillQuaternary,
  },
  metadataBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
    marginTop: `14px`,
    // padding: token.paddingSM,
    borderRadius: token.borderRadiusSM,
    // background: token.colorFillQuaternary,
  },
  fieldLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type WorkloadAdvancedSettingsProps = {
  defaultMetadataOpen?: boolean;
  form: FormInstance<CreateWorkloadFormValues>;
  type: WorkloadKind;
};

const createKeyValueItem = (): KeyValueEditorItem => ({
  id: createId(),
  keyName: '',
  value: '',
});

const WorkloadAdvancedSettings = ({
  defaultMetadataOpen = true,
  form,
  type,
}: WorkloadAdvancedSettingsProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [metadataOpen, setMetadataOpen] = useState(defaultMetadataOpen);
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const showNodeSelector = type !== 'DaemonSet';
  const enableNodeSelector = Form.useWatch('enableNodeSelector', form);
  const selectedNodeNames =
    (Form.useWatch('selectedNodeNames', {
      form,
      preserve: true,
    }) as string[]) || [];

  return (
    <div className={styles.stack}>
      {showNodeSelector && (
        <div>
          <div className={styles.sectionTitle}>选择节点</div>
          <div className={styles.option}>
            <div className={styles.optionHeader}>
              <Form.Item
                className={styles.checkbox}
                name="enableNodeSelector"
                valuePropName="checked"
              >
                <Checkbox aria-label="选择节点" />
              </Form.Item>
              <span>
                <div className={styles.title}>选择节点</div>
                <div className={styles.description}>
                  将容器组副本分配给特定的节点。您可以使用标签选择节点或手动指定节点
                </div>
              </span>
            </div>
            {enableNodeSelector && (
              <div className={styles.body}>
                <Form.Item name="nodeSelectors">
                  <KeyValueEditor
                    addIcon={false}
                    addText="添加节点选择器"
                    deleteAriaLabel="删除节点选择器"
                    minRows={1}
                    footerExtra={
                      <Button onClick={() => setNodeModalOpen(true)}>
                        指定节点
                      </Button>
                    }
                    footerJustify="space-between"
                    onAddBlocked={() =>
                      message.warning('请先填写已有节点选择器的键。')
                    }
                    onCreateItem={createKeyValueItem}
                  />
                </Form.Item>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <div className={styles.sectionTitle}>元数据</div>
        <div className={styles.option}>
          <button
            className={styles.optionHeaderButton}
            type="button"
            onClick={() => setMetadataOpen((open) => !open)}
          >
            <span className={styles.headerIcon}>
              {metadataOpen ? <UpOutlined /> : <DownOutlined />}
            </span>
            <span>
              <div className={styles.title}>添加元数据</div>
              <div className={styles.description}>为资源添加元数据</div>
            </span>
          </button>
          {metadataOpen && (
            <div className={styles.metadataBody}>
              <div>
                <div className={styles.fieldLabel}>标签</div>
                <Form.Item name="labels">
                  <KeyValueEditor
                    addIcon={false}
                    addText="添加"
                    deleteAriaLabel="删除标签"
                    minRows={1}
                    onAddBlocked={() =>
                      message.warning('请先填写已有标签的键。')
                    }
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
                    onAddBlocked={() =>
                      message.warning('请先填写已有注解的键。')
                    }
                    onCreateItem={createKeyValueItem}
                  />
                </Form.Item>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNodeSelector && (
        <NodeSelectorModal
          open={nodeModalOpen}
          selectedNodeNames={selectedNodeNames}
          onCancel={() => setNodeModalOpen(false)}
          onOk={(nodeNames) => {
            form.setFieldValue('selectedNodeNames', nodeNames);
            setNodeModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default WorkloadAdvancedSettings;
