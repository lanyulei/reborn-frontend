import type { FormInstance } from 'antd';
import {
  AutoComplete,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Slider,
  Space,
} from 'antd';
import { createStyles } from 'antd-style';
import { STORAGE_UNITS } from './helpers';
import type { CreatePersistentVolumeFormValues } from './types';

const useStyles = createStyles(({ token }) => ({
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    width: '100%',

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  capacityFormItem: {
    marginBottom: 0,
  },
  capacityRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 200px',
    alignItems: 'center',
    gap: token.marginLG,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: token.marginSM,
    },
  },
  capacitySlider: {
    marginInline: 6,
  },
  capacityInput: {
    width: '100%',
  },
  capacityUnit: {
    width: 76,
    flex: 'none',
  },
}));

type PersistentVolumeStorageSettingsProps = {
  form: FormInstance<CreatePersistentVolumeFormValues>;
  /** 集群里已有的存储类名称（候选项，可手输） */
  storageClassNames: string[];
};

const SLIDER_MAX = 2048;

const accessModeOptions = [
  { label: 'ReadWriteOnce', value: 'ReadWriteOnce' },
  { label: 'ReadOnlyMany', value: 'ReadOnlyMany' },
  { label: 'ReadWriteMany', value: 'ReadWriteMany' },
  { label: 'ReadWriteOncePod', value: 'ReadWriteOncePod' },
];

const reclaimPolicyOptions = [
  { label: 'Retain', value: 'Retain' },
  { label: 'Delete', value: 'Delete' },
];

const volumeModeOptions = [
  { label: 'Filesystem', value: 'Filesystem' },
  { label: 'Block', value: 'Block' },
];

const PersistentVolumeStorageSettings = ({
  form,
  storageClassNames,
}: PersistentVolumeStorageSettingsProps) => {
  const { styles } = useStyles();
  const capacitySize = Form.useWatch('capacitySize', {
    form,
    preserve: true,
  });
  const capacityUnit =
    Form.useWatch('capacityUnit', { form, preserve: true }) || 'Gi';

  return (
    <div className={styles.settings}>
      <Form.Item
        className={styles.capacityFormItem}
        extra="定义持久卷对外声明的存储容量。"
        label="容量"
        required
      >
        <div className={styles.capacityRow}>
          <Slider
            className={styles.capacitySlider}
            marks={Object.fromEntries(
              [0, 512, 1024, 1536, 2048].map((mark) => [
                mark,
                mark === 0 ? '0' : `${mark}${capacityUnit}`,
              ]),
            )}
            max={SLIDER_MAX}
            min={0}
            value={Math.min(capacitySize ?? 10, SLIDER_MAX)}
            onChange={(value) =>
              form.setFieldValue('capacitySize', Math.max(value, 1))
            }
          />
          <Space.Compact block>
            <Form.Item
              name="capacitySize"
              noStyle
              rules={[
                { required: true, message: '请输入容量' },
                {
                  validator: (_, value?: number | null) =>
                    value === undefined || value === null || value > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error('容量必须大于 0')),
                },
              ]}
            >
              <InputNumber
                className={styles.capacityInput}
                controls={false}
                min={0}
                placeholder="请输入容量"
              />
            </Form.Item>
            <Form.Item name="capacityUnit" noStyle>
              <Select
                aria-label="容量单位"
                className={styles.capacityUnit}
                options={STORAGE_UNITS.map((unit) => ({
                  label: unit,
                  value: unit,
                }))}
              />
            </Form.Item>
          </Space.Compact>
        </div>
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            extra="选择一个或多个访问模式，需与后端卷能力保持一致。"
            label="访问模式"
            name="accessModes"
            rules={[{ required: true, message: '请选择访问模式' }]}
          >
            <Select
              mode="multiple"
              options={accessModeOptions}
              placeholder="请选择访问模式"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            extra="删除 PVC 后，持久卷应如何处理。"
            label="回收策略"
            name="persistentVolumeReclaimPolicy"
            rules={[{ required: true, message: '请选择回收策略' }]}
          >
            <Select
              options={reclaimPolicyOptions}
              placeholder="请选择回收策略"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="卷模式"
            name="volumeMode"
            rules={[{ required: true, message: '请选择卷模式' }]}
          >
            <Select options={volumeModeOptions} placeholder="请选择卷模式" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            extra="留空表示不指定存储类。"
            label="存储类"
            name="storageClassName"
          >
            <AutoComplete
              allowClear
              options={storageClassNames.map((item) => ({
                label: item,
                value: item,
              }))}
              placeholder="请输入存储类名称"
              showSearch={{
                filterOption: (input, option) =>
                  String(option?.value ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase()),
              }}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default PersistentVolumeStorageSettings;
