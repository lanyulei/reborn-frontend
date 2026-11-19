import { App, AutoComplete, Col, Form, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import KeyValueEditor from '../shared/KeyValueEditor';
import StringListEditor from '../shared/StringListEditor';
import { createKeyValueItem, createStringItem } from './helpers';

const useStyles = createStyles(({ token }) => ({
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    width: '100%',

    '& > .ant-form-item': {
      marginBottom: 0,
    },
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    width: '100%',

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  parameterField: {
    width: '100%',
  },
}));

const booleanOptions = [
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
];

const reclaimPolicyOptions = [
  { label: 'Delete', value: 'Delete' },
  { label: 'Retain', value: 'Retain' },
];

const volumeBindingModeOptions = [
  { label: '立即绑定', value: 'Immediate' },
  { label: '延迟绑定', value: 'WaitForFirstConsumer' },
];

type StorageClassSettingsProps = {
  /** 集群里已有存储类使用的供应者（候选项，可手输） */
  provisioners: string[];
};

const StorageClassSettings = ({ provisioners }: StorageClassSettingsProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();

  return (
    <div className={styles.settings}>
      <div className={styles.fieldGroup}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              extra="填写 CSI 驱动或卷插件的名称，例如 ebs.csi.aws.com。"
              label="供应者"
              name="provisioner"
              rules={[
                { required: true, whitespace: true, message: '请输入供应者' },
              ]}
            >
              <AutoComplete
                allowClear
                options={provisioners.map((item) => ({
                  label: item,
                  value: item,
                }))}
                placeholder="请输入供应者"
                showSearch={{
                  filterOption: (input, option) =>
                    String(option?.value ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase()),
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="回收机制"
              name="reclaimPolicy"
              rules={[{ required: true, message: '请选择回收机制' }]}
            >
              <Select
                options={reclaimPolicyOptions}
                placeholder="请选择回收机制"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              extra="延迟绑定会等到有容器组使用卷时才创建并绑定持久卷。"
              label="卷绑定模式"
              name="volumeBindingMode"
              rules={[{ required: true, message: '请选择卷绑定模式' }]}
            >
              <Select
                options={volumeBindingModeOptions}
                placeholder="请选择卷绑定模式"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              extra="选择存储类是否允许创建后扩展卷容量。"
              label="卷扩展"
              name="allowVolumeExpansion"
              rules={[{ required: true, message: '请选择是否允许卷扩展' }]}
            >
              <Select options={booleanOptions} placeholder="请选择" />
            </Form.Item>
          </Col>
        </Row>
      </div>
      <Form.Item
        className={styles.parameterField}
        extra="按供应者（CSI 驱动）的要求填写，参数会原样传给供应者。"
        label="参数"
        name="parameters"
      >
        <KeyValueEditor
          addText="添加"
          deleteAriaLabel="删除参数"
          minRows={1}
          onAddBlocked={() => message.warning('请先填写已有参数的键。')}
          onCreateItem={createKeyValueItem}
        />
      </Form.Item>
      <Form.Item
        className={styles.parameterField}
        extra="由该存储类动态创建的持久卷会带上这些挂载选项，例如 noatime 或 nfsvers=4.1。"
        label="挂载选项"
        name="mountOptions"
      >
        <StringListEditor
          addText="添加"
          deleteAriaLabel="删除挂载选项"
          minRows={1}
          placeholder="请输入挂载选项"
          onAddBlocked={() => message.warning('请先填写已有挂载选项。')}
          onCreateItem={createStringItem}
        />
      </Form.Item>
    </div>
  );
};

export default StorageClassSettings;
