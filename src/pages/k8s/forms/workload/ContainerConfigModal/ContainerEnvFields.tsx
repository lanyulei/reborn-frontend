import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Link } from '@umijs/max';
import { Button, Form, Input, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
import CreatableSelect from '../CreatableSelect';
import { useWizardScope } from '../context';
import { createId } from '../helpers';
import { useConfigResourceKeys, useConfigResources } from '../resources';
import type {
  ContainerEnvItem,
  ContainerEnvSourceType,
  WorkloadConfigResourceType,
} from '../types';

const ENV_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

const envSourceOptions: {
  label: string;
  value: ContainerEnvSourceType;
}[] = [
  { label: '自定义', value: 'custom' },
  { label: '来自配置字典', value: 'configMap' },
  { label: '来自保密字典', value: 'secret' },
];

const useStyles = createStyles(({ token }) => ({
  envs: {
    display: 'flex',
    flexDirection: 'column',
    // gap: token.marginSM,
  },
  row: {
    display: 'grid',
    minHeight: 46,
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    background: token.colorFillQuaternary,

    '.ant-form-item': {
      marginBottom: 0,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',

      '.ant-form-item': {
        gridColumn: '1 / -1',
      },

      '.ant-form-item:first-of-type': {
        gridColumn: 1,
        gridRow: 1,
      },
    },
  },
  customRow: {
    gridTemplateColumns:
      'minmax(132px, 0.7fr) minmax(180px, 1fr) minmax(180px, 1fr) 40px',
  },
  referenceRow: {
    gridTemplateColumns:
      'minmax(132px, 0.7fr) minmax(160px, 0.9fr) minmax(180px, 1fr) minmax(180px, 1fr) 40px',
  },
  control: {
    minWidth: 0,
    width: '100%',
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },

    '@media (max-width: 768px)': {
      gridColumn: 2,
      gridRow: 1,
    },
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
  },
  helper: {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    marginTop: 12,
  },
}));

const createContainerEnvItem = (): ContainerEnvItem => ({
  id: createId(),
  sourceType: 'custom',
  keyName: '',
  value: '',
});

const isResourceSource = (sourceType?: ContainerEnvSourceType) =>
  sourceType === 'configMap' || sourceType === 'secret';

const isEnvItemIncomplete = (item: ContainerEnvItem) => {
  if (!item.keyName?.trim()) {
    return true;
  }

  if (!isResourceSource(item.sourceType)) {
    return false;
  }

  return !item.resourceName || !item.resourceKey;
};

type EnvReferenceFieldsProps = {
  fieldName: number;
  item: ContainerEnvItem;
  sourceType: WorkloadConfigResourceType;
  resourceNames: string[];
  resourcesLoading: boolean;
  onChange: (index: number, nextValue: Partial<ContainerEnvItem>) => void;
};

/** 引用配置字典 / 保密字典的环境变量：选择资源后再读取该资源里的键 */
const EnvReferenceFields = ({
  fieldName,
  item,
  sourceType,
  resourceNames,
  resourcesLoading,
  onChange,
}: EnvReferenceFieldsProps) => {
  const { styles } = useStyles();
  const { clusterId, namespace } = useWizardScope();
  const { keys, loading: keysLoading } = useConfigResourceKeys(
    clusterId,
    namespace,
    sourceType,
    item.resourceName,
  );

  return (
    <>
      <Form.Item
        name={[fieldName, 'resourceName']}
        rules={[{ required: true, message: '请选择资源' }]}
      >
        <CreatableSelect
          className={styles.control}
          disabled={!namespace}
          items={resourceNames}
          loading={resourcesLoading}
          placeholder="资源"
          onChange={(resourceName) =>
            onChange(fieldName, { resourceName, resourceKey: undefined })
          }
        />
      </Form.Item>
      <Form.Item
        name={[fieldName, 'resourceKey']}
        rules={[{ required: true, message: '请选择资源中的键' }]}
      >
        <CreatableSelect
          className={styles.control}
          disabled={!item.resourceName}
          items={keys}
          loading={keysLoading}
          placeholder="资源中的键"
          onChange={(resourceKey) =>
            onChange(fieldName, {
              resourceKey,
              keyName: item.keyName?.trim() ? item.keyName : resourceKey,
            })
          }
        />
      </Form.Item>
    </>
  );
};

const ContainerEnvFields = () => {
  const { styles } = useStyles();
  const form = Form.useFormInstance();
  // 命名空间来自向导表单（容器弹窗自己的表单里没有这个字段）
  const { clusterId, namespace } = useWizardScope();
  const envItems =
    (Form.useWatch('containerEnv', {
      form,
      preserve: true,
    }) as ContainerEnvItem[]) || [];
  const { configMaps, secrets, loading } = useConfigResources(
    clusterId,
    namespace,
  );
  const addDisabled = envItems.some(isEnvItemIncomplete);

  // 依赖 envItems.length：列表被清空后重新补一行
  useEffect(() => {
    // useWatch 首次渲染拿不到值：以表单里实际保存的列表为准，避免编辑容器时覆盖已有环境变量
    const storedItems = form.getFieldValue('containerEnv') as
      | ContainerEnvItem[]
      | undefined;

    if (!storedItems?.length) {
      form.setFieldValue('containerEnv', [createContainerEnvItem()]);
    }
  }, [envItems.length, form]);

  const updateEnvItem = (
    index: number,
    nextValue: Partial<ContainerEnvItem>,
  ) => {
    const currentItems = (form.getFieldValue('containerEnv') ||
      []) as ContainerEnvItem[];

    form.setFieldValue(
      'containerEnv',
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...nextValue } : item,
      ),
    );
  };

  const addEnvItem = (add: (defaultValue?: ContainerEnvItem) => void) => {
    if (addDisabled) {
      return;
    }

    add(createContainerEnvItem());
  };

  return (
    <div className={styles.envs}>
      <Form.List name="containerEnv">
        {(fields, { add, remove }) => (
          <>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: `12px` }}
            >
              {fields.map((field) => {
                const item = envItems[field.name] || {};
                const sourceType = item.sourceType || 'custom';

                return (
                  <div
                    className={[
                      styles.row,
                      isResourceSource(sourceType)
                        ? styles.referenceRow
                        : styles.customRow,
                    ].join(' ')}
                    key={field.key}
                  >
                    <Form.Item
                      initialValue="custom"
                      name={[field.name, 'sourceType']}
                    >
                      <Select
                        className={styles.control}
                        options={envSourceOptions}
                        placeholder="请选择来源"
                        onChange={(nextSourceType) =>
                          updateEnvItem(field.name, {
                            sourceType: nextSourceType,
                            value: '',
                            resourceName: undefined,
                            resourceKey: undefined,
                          })
                        }
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'keyName']}
                      rules={[
                        { required: true, message: '请输入键' },
                        {
                          pattern: ENV_NAME_PATTERN,
                          message:
                            '键只能包含字母、数字和下划线，且不能以数字开头',
                        },
                      ]}
                    >
                      <Input className={styles.control} placeholder="键" />
                    </Form.Item>
                    {sourceType === 'configMap' || sourceType === 'secret' ? (
                      <EnvReferenceFields
                        fieldName={field.name}
                        item={item}
                        resourceNames={
                          sourceType === 'secret' ? secrets : configMaps
                        }
                        resourcesLoading={loading}
                        sourceType={sourceType}
                        onChange={updateEnvItem}
                      />
                    ) : (
                      <Form.Item name={[field.name, 'value']}>
                        <Input className={styles.control} placeholder="值" />
                      </Form.Item>
                    )}
                    <Button
                      aria-label="删除环境变量"
                      className={styles.deleteButton}
                      icon={<DeleteOutlined />}
                      type="text"
                      onClick={() => remove(field.name)}
                    />
                  </div>
                );
              })}
            </div>
            <div className={styles.footer}>
              <div className={styles.helper}>
                如果没有配置字典或保密字典满足要求，您可以{' '}
                <Link target="_blank" to="/k8s/config/config-maps">
                  创建配置字典
                </Link>{' '}
                或{' '}
                <Link target="_blank" to="/k8s/config/secrets">
                  创建保密字典
                </Link>
                。
              </div>
              <div className={styles.actions}>
                <Button disabled={addDisabled} onClick={() => addEnvItem(add)}>
                  <PlusOutlined />
                  添加环境变量
                </Button>
              </div>
            </div>
          </>
        )}
      </Form.List>
    </div>
  );
};

export { createContainerEnvItem };
export default ContainerEnvFields;
