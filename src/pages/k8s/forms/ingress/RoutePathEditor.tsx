import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { AutoComplete, Button, Form, Input, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import { type Translate, useT } from '@/utils/i18n';
import {
  createIngressPathItem,
  INGRESS_PATH_TYPE_OPTIONS,
  isValidIngressPath,
} from './helpers';
import type {
  IngressRoutePathItem,
  IngressRouteRuleItem,
  IngressServiceOption,
  IngressServicePortOption,
} from './types';

const useStyles = createStyles(({ token }) => ({
  pathRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  pathRow: {
    display: 'grid',
    minHeight: 46,
    gridTemplateColumns:
      'minmax(140px, 0.9fr) minmax(150px, 0.8fr) minmax(160px, 1fr) minmax(128px, 0.75fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    background: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  formItem: {
    '&.ant-form-item': {
      marginBottom: 0,
    },

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
  },
  rawBackend: {
    gridColumn: 'span 2',

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
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
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
}));

type RoutePathEditorProps = {
  form: FormInstance<IngressRouteRuleItem>;
  serviceOptions: IngressServiceOption[];
  /** 选中 / 输入服务后按需读取它的端口 */
  onServiceSelect: (serviceName: string) => void;
};

type ServicePortSelectProps = {
  className?: string;
  disabled?: boolean;
  options: IngressServicePortOption[];
  value?: number | string;
  onChange?: (value?: number | string) => void;
};

/** 端口下拉：候选来自所选服务，也可以直接输入端口号或端口名称 */
const ServicePortSelect = ({
  className,
  disabled,
  options,
  value,
  onChange,
}: ServicePortSelectProps) => {
  const t = useT();
  const [search, setSearch] = useState('');
  const keyword = search.trim();
  const typedValue = /^\d+$/.test(keyword) ? Number(keyword) : keyword;
  const mergedOptions = [...options];

  // 当前值、正在输入的值不在候选里时补一个选项，保证可以手输
  for (const item of [value, keyword ? typedValue : undefined]) {
    if (
      item !== undefined &&
      item !== '' &&
      !mergedOptions.some((option) => option.value === item)
    ) {
      mergedOptions.push({ label: String(item), value: item });
    }
  }

  return (
    <Select<number | string>
      allowClear
      className={className}
      disabled={disabled}
      notFoundContent={t('pages.k8s.forms.ingress.port.notFound')}
      options={mergedOptions}
      placeholder={t('pages.k8s.form.port')}
      showSearch={{
        optionFilterProp: 'label',
        onSearch: setSearch,
      }}
      value={value}
      onChange={(nextValue) => {
        setSearch('');
        onChange?.(nextValue ?? undefined);
      }}
    />
  );
};

const getBackendSummary = (t: Translate, backend?: Record<string, unknown>) => {
  const resource = backend?.resource as
    | { kind?: unknown; name?: unknown }
    | undefined;

  return resource && typeof resource === 'object'
    ? t('pages.k8s.forms.ingress.resourceBackend', {
        kind: String(resource.kind ?? '-'),
        name: String(resource.name ?? '-'),
      })
    : t('pages.k8s.forms.ingress.customBackend');
};

const RoutePathEditor = ({
  form,
  serviceOptions,
  onServiceSelect,
}: RoutePathEditorProps) => {
  const t = useT();
  const { styles } = useStyles();
  const paths = (Form.useWatch('paths', form) as IngressRoutePathItem[]) || [];
  const addDisabled = paths.some((path) => !isValidIngressPath(path));
  const serviceSelectOptions = serviceOptions.map(({ label, value }) => ({
    label,
    value,
  }));

  useEffect(() => {
    if (paths.length === 0) {
      form.setFieldValue('paths', [createIngressPathItem()]);
    }
  }, [form, paths.length]);

  const getPortOptions = (serviceName?: string) =>
    serviceOptions.find((service) => service.value === serviceName)?.ports ||
    [];

  return (
    <Form.List
      name="paths"
      rules={[
        {
          validator: async (_, value?: IngressRoutePathItem[]) => {
            if ((value || []).some(isValidIngressPath)) {
              return;
            }
            throw new Error(t('pages.k8s.forms.ingress.paths.required'));
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <>
          <div className={styles.pathRows}>
            {fields.map((field) => {
              const serviceName = paths[field.name]?.serviceName;
              const rawBackend = paths[field.name]?.backend;

              return (
                <div className={styles.pathRow} key={field.key}>
                  <Form.Item
                    className={styles.formItem}
                    name={[field.name, 'path']}
                    rules={[
                      {
                        required: true,
                        message: t('pages.k8s.forms.ingress.path.required'),
                      },
                      {
                        validator: async (_, value?: string) => {
                          if (!value || value.startsWith('/')) {
                            return;
                          }
                          throw new Error(
                            t('pages.k8s.forms.ingress.path.leadingSlash'),
                          );
                        },
                      },
                    ]}
                  >
                    <Input className={styles.control} placeholder="/" />
                  </Form.Item>
                  <Form.Item
                    className={styles.formItem}
                    name={[field.name, 'pathType']}
                    rules={[
                      {
                        required: true,
                        message: t('pages.k8s.forms.ingress.pathType.required'),
                      },
                    ]}
                  >
                    <Select
                      className={styles.control}
                      options={INGRESS_PATH_TYPE_OPTIONS}
                      placeholder={t('pages.k8s.forms.ingress.pathType')}
                    />
                  </Form.Item>
                  {rawBackend ? (
                    <Input
                      className={styles.rawBackend}
                      disabled
                      value={getBackendSummary(t, rawBackend)}
                    />
                  ) : (
                    <>
                      <Form.Item
                        className={styles.formItem}
                        name={[field.name, 'serviceName']}
                        rules={[
                          {
                            required: true,
                            message: t(
                              'pages.k8s.forms.ingress.service.required',
                            ),
                          },
                        ]}
                      >
                        <AutoComplete
                          allowClear
                          className={styles.control}
                          options={serviceSelectOptions}
                          placeholder={t('pages.k8s.kind.Service')}
                          showSearch={{
                            filterOption: (inputValue, option) =>
                              String(option?.value || '')
                                .toLowerCase()
                                .includes(inputValue.toLowerCase()),
                          }}
                          onBlur={() => {
                            const current = form.getFieldValue([
                              'paths',
                              field.name,
                              'serviceName',
                            ]) as string | undefined;
                            if (current?.trim()) {
                              onServiceSelect(current.trim());
                            }
                          }}
                          onChange={() => {
                            form.setFieldValue(
                              ['paths', field.name, 'servicePort'],
                              undefined,
                            );
                          }}
                          onSelect={(value) => onServiceSelect(String(value))}
                        />
                      </Form.Item>
                      <Form.Item
                        className={styles.formItem}
                        name={[field.name, 'servicePort']}
                        rules={[
                          {
                            required: true,
                            message: t('pages.k8s.forms.ingress.port.required'),
                          },
                          {
                            validator: async (_, value?: number | string) => {
                              if (typeof value === 'number') {
                                if (value >= 1 && value <= 65535) {
                                  return;
                                }
                                throw new Error(
                                  t('pages.k8s.forms.common.port.range'),
                                );
                              }
                              if (value?.trim()) {
                                return;
                              }
                              throw new Error(
                                t('pages.k8s.forms.ingress.port.required'),
                              );
                            },
                          },
                        ]}
                      >
                        <ServicePortSelect
                          className={styles.control}
                          disabled={!serviceName}
                          options={getPortOptions(serviceName)}
                        />
                      </Form.Item>
                    </>
                  )}
                  <Button
                    aria-label={t('pages.k8s.forms.ingress.path.delete')}
                    className={styles.deleteButton}
                    icon={<DeleteOutlined />}
                    type="text"
                    onClick={() => remove(field.name)}
                  />
                </div>
              );
            })}
          </div>
          <Form.ErrorList errors={errors} />
          <div className={styles.footer}>
            <Button
              disabled={addDisabled}
              onClick={async () => {
                try {
                  await form.validateFields(
                    fields.flatMap((field) => [
                      ['paths', field.name, 'path'],
                      ['paths', field.name, 'serviceName'],
                      ['paths', field.name, 'servicePort'],
                    ]),
                  );
                  add(createIngressPathItem());
                } catch {
                  // Validation errors are displayed by Form.Item.
                }
              }}
            >
              <PlusOutlined />
              {t('pages.k8s.form.add')}
            </Button>
          </div>
        </>
      )}
    </Form.List>
  );
};

export default RoutePathEditor;
