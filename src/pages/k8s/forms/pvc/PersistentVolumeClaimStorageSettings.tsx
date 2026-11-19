import { CloudServerOutlined, DatabaseOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  AutoComplete,
  Form,
  Input,
  InputNumber,
  Select,
  Slider,
  Space,
  Spin,
} from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { parseQuantity, STORAGE_UNITS } from './helpers';
import type {
  CreatePersistentVolumeClaimFormValues,
  PersistentVolumeClaimCreateMode,
} from './types';

const SLIDER_MAX = 2048;

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
  compactField: {
    maxWidth: 456,

    '.ant-form-item': {
      marginBottom: token.marginMD,
    },

    '.ant-form-item:last-child': {
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
  modeOption: {
    display: 'grid',
    gridTemplateColumns: '34px minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginMD,
    width: '100%',
    padding: `${token.paddingXXS}px 0`,
  },
  modeIcon: {
    display: 'inline-flex',
    width: 30,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    color: token.colorTextSecondary,
    fontSize: 28,
  },
  modeTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  modeDescription: {
    marginTop: 2,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    whiteSpace: 'normal',
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

type CreateModeOption = {
  description: string;
  icon: ReactNode;
  label: string;
  value: PersistentVolumeClaimCreateMode;
};

/** 存储类候选项（来自集群的存储类列表） */
type StorageClassOption = {
  isDefault: boolean;
  name: string;
  provisioner?: string;
};

/** 持久卷候选项（来自集群的持久卷列表） */
type PersistentVolumeOption = {
  accessModes?: string[];
  capacity?: string;
  claim?: string;
  name: string;
  storageClass: string;
};

type PersistentVolumeClaimStorageSettingsProps = {
  form: FormInstance<CreatePersistentVolumeClaimFormValues>;
  loading?: boolean;
  persistentVolumes: PersistentVolumeOption[];
  storageClasses: StorageClassOption[];
};

const accessModeOptions = [
  { label: 'ReadWriteOnce', value: 'ReadWriteOnce' },
  { label: 'ReadOnlyMany', value: 'ReadOnlyMany' },
  { label: 'ReadWriteMany', value: 'ReadWriteMany' },
  { label: 'ReadWriteOncePod', value: 'ReadWriteOncePod' },
];

const volumeModeOptions = [
  { label: 'Filesystem', value: 'Filesystem' },
  { label: 'Block', value: 'Block' },
];

const createModeOptions: CreateModeOption[] = [
  {
    description: '选择已有的存储类来创建卷。',
    icon: <DatabaseOutlined />,
    label: '通过存储类创建',
    value: 'storageClass',
  },
  {
    description: '选择已有的持久卷来创建卷。',
    icon: <CloudServerOutlined />,
    label: '绑定已有持久卷创建',
    value: 'persistentVolume',
  },
];

const filterByValue = (input: string, option?: { value?: unknown }) =>
  String(option?.value ?? '')
    .toLowerCase()
    .includes(input.toLowerCase());

const ModeOption = ({ description, icon, label }: CreateModeOption) => {
  const { styles } = useStyles();

  return (
    <div className={styles.modeOption}>
      <span className={styles.modeIcon}>{icon}</span>
      <span>
        <div className={styles.modeTitle}>{label}</div>
        <div className={styles.modeDescription}>{description}</div>
      </span>
    </div>
  );
};

const PersistentVolumeClaimStorageSettings = ({
  form,
  loading = false,
  persistentVolumes,
  storageClasses,
}: PersistentVolumeClaimStorageSettingsProps) => {
  const { styles } = useStyles();
  const createMode = Form.useWatch('createMode', form);
  const storageSize = Form.useWatch('storageSize', {
    form,
    preserve: true,
  });
  const storageUnit =
    Form.useWatch('storageUnit', { form, preserve: true }) || 'Gi';
  const storageClassOptions = useMemo(
    () =>
      storageClasses.map((item) => ({
        label: item.isDefault ? `${item.name}（默认）` : item.name,
        value: item.name,
      })),
    [storageClasses],
  );
  // 已被声明占用的持久卷无法再绑定，不列入候选
  const persistentVolumeOptions = useMemo(
    () =>
      persistentVolumes
        .filter((item) => !item.claim)
        .map((item) => ({
          label: [item.name, item.capacity, item.storageClass]
            .filter(Boolean)
            .join(' · '),
          value: item.name,
        })),
    [persistentVolumes],
  );
  const bindVolume = createMode === 'persistentVolume';

  const handleCreateModeChange = (
    nextMode: PersistentVolumeClaimCreateMode,
  ) => {
    form.setFieldsValue({
      createMode: nextMode,
      storageClassName:
        nextMode === 'persistentVolume'
          ? undefined
          : form.getFieldValue('storageClassName') ||
            (storageClasses.find((item) => item.isDefault) || storageClasses[0])
              ?.name,
      volumeName: undefined,
      volumeStorageClassName: undefined,
    });
    form.setFields(
      (['storageClassName', 'volumeName'] as const).map((name) => ({
        name,
        errors: [],
      })),
    );
  };

  // 选中集群里已有的持久卷时，带出它的存储类、容量与访问模式（声明须与持久卷匹配才能绑定）
  const handleVolumeNameChange = (volumeName?: string) => {
    const volume = persistentVolumes.find(
      (item) => item.name === volumeName?.trim(),
    );
    if (!volume) {
      return;
    }
    const capacity = parseQuantity(volume.capacity);
    form.setFieldsValue({
      volumeStorageClassName: volume.storageClass,
      ...(capacity
        ? { storageSize: capacity.size, storageUnit: capacity.unit }
        : {}),
      ...(volume.accessModes?.length
        ? { accessModes: volume.accessModes }
        : {}),
    });
  };

  return (
    <div className={styles.settings}>
      <Form.Item
        className={styles.compactField}
        label="创建方式"
        name="createMode"
        rules={[{ required: true, message: '请选择创建方式' }]}
      >
        <Select
          labelRender={({ value }) => {
            const option = createModeOptions.find(
              (item) => item.value === value,
            );
            return option ? <ModeOption {...option} /> : value;
          }}
          optionRender={(option) => (
            <ModeOption {...(option.data as CreateModeOption)} />
          )}
          options={createModeOptions}
          onChange={handleCreateModeChange}
        />
      </Form.Item>

      <div className={styles.fieldGroup}>
        {!bindVolume && (
          <Form.Item
            className={styles.compactField}
            extra="选择一个存储类来创建特定种类的卷。"
            label="存储类"
            name="storageClassName"
            rules={[{ required: true, message: '请选择存储类' }]}
          >
            <AutoComplete
              allowClear
              showSearch={{ filterOption: filterByValue }}
              notFoundContent={
                loading ? <Spin size="small" /> : '未发现可用存储类'
              }
              options={storageClassOptions}
              placeholder="请选择或输入存储类"
            />
          </Form.Item>
        )}
        {bindVolume && (
          <>
            <Form.Item
              className={styles.compactField}
              extra="选择或输入需要绑定的持久卷名称（仅列出尚未被声明绑定的持久卷）。"
              label="持久卷"
              name="volumeName"
              rules={[{ required: true, message: '请输入卷名称' }]}
            >
              <AutoComplete
                allowClear
                showSearch={{ filterOption: filterByValue }}
                notFoundContent={
                  loading ? <Spin size="small" /> : '未发现可绑定的持久卷'
                }
                options={persistentVolumeOptions}
                placeholder="请输入卷名称"
                onChange={handleVolumeNameChange}
              />
            </Form.Item>
            <Form.Item
              className={styles.compactField}
              extra="须与持久卷的存储类一致；持久卷未设置存储类时留空。"
              label="持久卷的存储类"
              name="volumeStorageClassName"
            >
              <Input allowClear placeholder="留空表示持久卷没有存储类" />
            </Form.Item>
          </>
        )}
        <Form.Item
          className={styles.compactField}
          extra={
            bindVolume
              ? '须包含在持久卷支持的访问模式之内。'
              : '选择存储类支持的一种或多种访问模式。'
          }
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
        <Form.Item
          className={styles.compactField}
          extra="Filesystem 以目录形式挂载；Block 以裸块设备形式提供给容器。"
          label="卷模式"
          name="volumeMode"
          rules={[{ required: true, message: '请选择卷模式' }]}
        >
          <Select options={volumeModeOptions} placeholder="请选择卷模式" />
        </Form.Item>
      </div>

      <Form.Item
        className={styles.capacityFormItem}
        extra={bindVolume ? '申请容量不能超过所绑定持久卷的容量。' : undefined}
        label="卷容量"
        required
      >
        <div className={styles.capacityRow}>
          <Slider
            className={styles.capacitySlider}
            marks={Object.fromEntries(
              [0, 512, 1024, 1536, 2048].map((mark) => [
                mark,
                mark === 0 ? '0' : `${mark}${storageUnit}`,
              ]),
            )}
            max={SLIDER_MAX}
            min={0}
            value={Math.min(storageSize ?? 10, SLIDER_MAX)}
            onChange={(value) =>
              form.setFieldValue('storageSize', Math.max(value, 1))
            }
          />
          <Space.Compact block>
            <Form.Item
              name="storageSize"
              noStyle
              rules={[
                { required: true, message: '请输入卷容量' },
                {
                  validator: (_, value?: number | null) =>
                    value === undefined || value === null || value > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error('卷容量必须大于 0')),
                },
              ]}
            >
              <InputNumber
                className={styles.capacityInput}
                controls={false}
                min={0}
                placeholder="请输入卷容量"
              />
            </Form.Item>
            <Form.Item name="storageUnit" noStyle>
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
    </div>
  );
};

export type { PersistentVolumeOption, StorageClassOption };
export default PersistentVolumeClaimStorageSettings;
