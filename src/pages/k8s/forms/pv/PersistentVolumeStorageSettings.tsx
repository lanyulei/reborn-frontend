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
import { useT } from '@/utils/i18n';
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
  const t = useT();
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
        extra={t('pages.k8s.forms.pv.capacity.extra')}
        label={t('pages.k8s.forms.common.capacity')}
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
                {
                  required: true,
                  message: t('pages.k8s.forms.common.capacity.required'),
                },
                {
                  validator: (_, value?: number | null) =>
                    value === undefined || value === null || value > 0
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error(t('pages.k8s.forms.pv.capacity.positive')),
                        ),
                },
              ]}
            >
              <InputNumber
                className={styles.capacityInput}
                controls={false}
                min={0}
                placeholder={t('pages.k8s.forms.common.capacity.required')}
              />
            </Form.Item>
            <Form.Item name="capacityUnit" noStyle>
              <Select
                aria-label={t('pages.k8s.forms.pv.capacity.unit')}
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
            extra={t('pages.k8s.forms.pv.accessModes.extra')}
            label={t('pages.k8s.forms.common.accessMode')}
            name="accessModes"
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.common.accessMode.required'),
              },
            ]}
          >
            <Select
              mode="multiple"
              options={accessModeOptions}
              placeholder={t('pages.k8s.forms.common.accessMode.required')}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            extra={t('pages.k8s.forms.pv.reclaimPolicy.extra')}
            label={t('pages.k8s.forms.pv.reclaimPolicy')}
            name="persistentVolumeReclaimPolicy"
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.pv.reclaimPolicy.required'),
              },
            ]}
          >
            <Select
              options={reclaimPolicyOptions}
              placeholder={t('pages.k8s.forms.pv.reclaimPolicy.required')}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={t('pages.k8s.forms.pv.volumeMode')}
            name="volumeMode"
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.common.volumeMode.required'),
              },
            ]}
          >
            <Select
              options={volumeModeOptions}
              placeholder={t('pages.k8s.forms.common.volumeMode.required')}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            extra={t('pages.k8s.forms.pv.storageClass.extra')}
            label={t('pages.k8s.forms.common.storageClass')}
            name="storageClassName"
          >
            <AutoComplete
              allowClear
              options={storageClassNames.map((item) => ({
                label: item,
                value: item,
              }))}
              placeholder={t('pages.k8s.forms.pv.storageClass.placeholder')}
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
