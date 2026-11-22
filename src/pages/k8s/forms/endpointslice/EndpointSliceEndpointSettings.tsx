import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { App, Button, Col, Form, Input, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useMemo } from 'react';
import type { Translate } from '@/utils/i18n';
import { useT } from '@/utils/i18n';
import CollapsibleField from '../shared/CollapsibleField';
import ResourceFormSection from '../shared/ResourceFormSection';
import StringListEditor from '../shared/StringListEditor';
import CreatableSelect from './CreatableSelect';
import {
  createEndpointSliceEndpointItem,
  createStringListItem,
  hasStringListContent,
} from './helpers';
import type {
  CreateEndpointSliceFormValues,
  EndpointSliceAddressType,
  EndpointSliceConditionValue,
  EndpointSliceEndpointItem,
} from './types';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  endpointCard: {
    padding: '8px 15px 15px',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    backgroundColor: token.colorFillQuaternary,
  },
  endpointHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
    marginBottom: 12,
    paddingBottom: token.paddingXS,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
  },
  endpointTitle: {
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  deleteButton: {
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  separatedFieldSection: {
    marginTop: 10,
    paddingTop: token.paddingSM,
    borderTop: `1px solid ${token.colorBorderSecondary}`,
  },
  fieldSectionHeader: {
    marginBottom: token.marginXS,
  },
  fieldSectionTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  section: {
    marginTop: token.marginSM,
  },
  sectionTitle: {
    marginBottom: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  unframedContent: {
    marginTop: token.marginSM,
  },
  advancedBlock: {
    marginTop: token.marginMD,
    paddingTop: token.paddingSM,
    borderTop: `1px solid ${token.colorBorderSecondary}`,

    '& > div > button': {
      minHeight: 44,
      padding: 0,
    },
  },
  advancedContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    padding: '13px 15px 15px',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    backgroundColor: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  advancedCollapseContent: {
    marginTop: 0,
  },
  advancedSection: {
    paddingTop: 15,
    borderTop: `1px solid ${token.colorBorderSecondary}`,

    '&:first-of-type': {
      paddingTop: 0,
      borderTop: 0,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: token.marginSM,
  },
}));

const getAddressPlaceholder = (
  addressType: EndpointSliceAddressType | undefined,
  t: Translate,
) => {
  if (addressType === 'FQDN') {
    return t('pages.k8s.forms.endpointslice.example', {
      value: 'api.example.local',
    });
  }
  if (addressType === 'IPv6') {
    return t('pages.k8s.forms.endpointslice.example', { value: 'fd00::10' });
  }
  return t('pages.k8s.forms.endpointslice.example', { value: '10.0.0.10' });
};

const getDefaultAddress = (addressType?: EndpointSliceAddressType) => {
  if (addressType === 'FQDN') {
    return 'api.example.local';
  }
  if (addressType === 'IPv6') {
    return 'fd00::10';
  }
  return '10.0.0.10';
};

type EndpointSliceEndpointSettingsProps = {
  form: FormInstance<CreateEndpointSliceFormValues>;
  /** 集群节点名称候选项（取不到时为空，可手输） */
  nodeNames: string[];
};

const EndpointSliceEndpointSettings = ({
  form,
  nodeNames,
}: EndpointSliceEndpointSettingsProps) => {
  const { styles } = useStyles();
  const t = useT();
  const { message } = App.useApp();
  const conditionOptions = useMemo<
    { label: string; value: EndpointSliceConditionValue }[]
  >(
    () => [
      {
        label: t('pages.k8s.forms.endpointslice.condition.unset'),
        value: 'unset',
      },
      { label: t('pages.k8s.forms.common.yes'), value: 'true' },
      { label: t('pages.k8s.forms.common.no'), value: 'false' },
    ],
    [t],
  );
  // 地址类型在「基本信息」步骤，本步骤未挂载该表单项：需 preserve 才能读到
  const addressType = Form.useWatch('addressType', { form, preserve: true });
  const endpoints =
    (Form.useWatch('endpoints', form) as EndpointSliceEndpointItem[]) || [];
  const addDisabled = endpoints.some(
    (endpoint) => !hasStringListContent(endpoint.addresses),
  );

  return (
    <ResourceFormSection
      bordered={false}
      description={t('pages.k8s.forms.endpointslice.endpoints.description')}
      title={t('pages.k8s.forms.endpointslice.endpoints')}
    >
      <div className={styles.unframedContent}>
        <Form.List
          name="endpoints"
          rules={[
            {
              validator: async (_, value?: EndpointSliceEndpointItem[]) => {
                if (
                  (value || []).some((item) =>
                    hasStringListContent(item.addresses),
                  )
                ) {
                  return;
                }
                throw new Error(
                  t('pages.k8s.forms.endpointslice.endpoints.addressRequired'),
                );
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              <div className={styles.stack}>
                {fields.map((field, index) => (
                  <div className={styles.endpointCard} key={field.key}>
                    <div className={styles.endpointHeader}>
                      <div className={styles.endpointTitle}>
                        {t('pages.k8s.forms.endpointslice.endpoint.title', {
                          index: index + 1,
                        })}
                      </div>
                      <Button
                        aria-label={t(
                          'pages.k8s.forms.endpointslice.endpoint.delete',
                        )}
                        className={styles.deleteButton}
                        disabled={fields.length <= 1}
                        icon={<DeleteOutlined />}
                        type="text"
                        onClick={() => remove(field.name)}
                      />
                    </div>

                    <div>
                      <div className={styles.fieldSectionHeader}>
                        <div className={styles.fieldSectionTitle}>
                          {t(
                            'pages.k8s.forms.endpointslice.endpoint.addresses',
                          )}
                        </div>
                      </div>
                      <Form.Item
                        extra={t(
                          'pages.k8s.forms.endpointslice.endpoint.addresses.extra',
                        )}
                        name={[field.name, 'addresses']}
                      >
                        <StringListEditor
                          addText={t(
                            'pages.k8s.forms.endpointslice.endpoint.addresses.add',
                          )}
                          deleteAriaLabel={t(
                            'pages.k8s.forms.endpointslice.endpoint.addresses.delete',
                          )}
                          minRows={1}
                          placeholder={getAddressPlaceholder(addressType, t)}
                          surface
                          onAddBlocked={() =>
                            message.warning(
                              t(
                                'pages.k8s.forms.endpointslice.endpoint.addresses.fillFirst',
                              ),
                            )
                          }
                          onCreateItem={() => createStringListItem()}
                        />
                      </Form.Item>
                    </div>

                    <div className={styles.separatedFieldSection}>
                      <div className={styles.fieldSectionHeader}>
                        <div className={styles.fieldSectionTitle}>
                          {t('pages.k8s.forms.endpointslice.endpoint.location')}
                        </div>
                      </div>
                      <Row gutter={16}>
                        <Col md={8} xs={24}>
                          <Form.Item
                            label={t(
                              'pages.k8s.forms.endpointslice.endpoint.hostname',
                            )}
                            name={[field.name, 'hostname']}
                            rules={[
                              {
                                max: 63,
                                message: t(
                                  'pages.k8s.forms.endpointslice.endpoint.hostname.maxLength',
                                ),
                              },
                            ]}
                          >
                            <Input placeholder={t('common.optional')} />
                          </Form.Item>
                        </Col>
                        <Col md={8} xs={24}>
                          <Form.Item
                            label={t(
                              'pages.k8s.forms.endpointslice.endpoint.nodeName',
                            )}
                            name={[field.name, 'nodeName']}
                            rules={[
                              {
                                max: 253,
                                message: t(
                                  'pages.k8s.forms.endpointslice.endpoint.nodeName.maxLength',
                                ),
                              },
                            ]}
                          >
                            <CreatableSelect
                              allowClear
                              names={nodeNames}
                              placeholder={t('common.optional')}
                            />
                          </Form.Item>
                        </Col>
                        <Col md={8} xs={24}>
                          <Form.Item
                            label={t(
                              'pages.k8s.forms.endpointslice.endpoint.zone',
                            )}
                            name={[field.name, 'zone']}
                            rules={[
                              {
                                max: 63,
                                message: t(
                                  'pages.k8s.forms.endpointslice.endpoint.zone.maxLength',
                                ),
                              },
                            ]}
                          >
                            <Input
                              placeholder={t(
                                'pages.k8s.forms.endpointslice.example',
                                {
                                  value: 'cn-shanghai-a',
                                },
                              )}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    <div className={styles.advancedBlock}>
                      <CollapsibleField
                        contentClassName={styles.advancedCollapseContent}
                        defaultOpen={false}
                        description={t(
                          'pages.k8s.forms.endpointslice.endpoint.advanced.description',
                        )}
                        title={t(
                          'pages.k8s.forms.endpointslice.endpoint.advanced',
                        )}
                      >
                        <div className={styles.advancedContent}>
                          <div className={styles.advancedSection}>
                            <div className={styles.sectionTitle}>
                              {t(
                                'pages.k8s.forms.endpointslice.endpoint.conditions',
                              )}
                            </div>
                            <Row gutter={[16, 8]}>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label="Ready"
                                  name={[field.name, 'ready']}
                                >
                                  <Select options={conditionOptions} />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label="Serving"
                                  name={[field.name, 'serving']}
                                >
                                  <Select options={conditionOptions} />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label="Terminating"
                                  name={[field.name, 'terminating']}
                                >
                                  <Select options={conditionOptions} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>

                          <div className={styles.advancedSection}>
                            <div className={styles.sectionTitle}>
                              {t(
                                'pages.k8s.forms.endpointslice.endpoint.targetRef',
                              )}
                            </div>
                            <Row gutter={[16, 13]}>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label={t(
                                    'pages.k8s.forms.endpointslice.endpoint.targetRef.apiVersion',
                                  )}
                                  name={[field.name, 'targetRef', 'apiVersion']}
                                  rules={[
                                    {
                                      max: 100,
                                      message: t(
                                        'pages.k8s.forms.endpointslice.endpoint.targetRef.apiVersion.maxLength',
                                      ),
                                    },
                                  ]}
                                >
                                  <Input
                                    placeholder={t(
                                      'pages.k8s.forms.endpointslice.example',
                                      { value: 'v1' },
                                    )}
                                  />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label={t('pages.k8s.forms.common.type')}
                                  name={[field.name, 'targetRef', 'kind']}
                                  rules={[
                                    {
                                      max: 63,
                                      message: t(
                                        'pages.k8s.forms.endpointslice.endpoint.targetRef.kind.maxLength',
                                      ),
                                    },
                                  ]}
                                >
                                  <Input
                                    placeholder={t(
                                      'pages.k8s.forms.endpointslice.example',
                                      { value: 'Pod' },
                                    )}
                                  />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label={t('pages.k8s.forms.common.name')}
                                  name={[field.name, 'targetRef', 'name']}
                                  rules={[
                                    {
                                      max: 253,
                                      message: t(
                                        'pages.k8s.forms.common.name.maxLength253',
                                      ),
                                    },
                                  ]}
                                >
                                  <Input placeholder={t('common.optional')} />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label={t('pages.k8s.forms.common.namespace')}
                                  name={[field.name, 'targetRef', 'namespace']}
                                  rules={[
                                    {
                                      max: 63,
                                      message: t(
                                        'pages.k8s.forms.endpointslice.endpoint.targetRef.namespace.maxLength',
                                      ),
                                    },
                                  ]}
                                >
                                  <Input placeholder={t('common.optional')} />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label={t(
                                    'pages.k8s.forms.endpointslice.endpoint.targetRef.fieldPath',
                                  )}
                                  name={[field.name, 'targetRef', 'fieldPath']}
                                  rules={[
                                    {
                                      max: 250,
                                      message: t(
                                        'pages.k8s.forms.endpointslice.endpoint.targetRef.fieldPath.maxLength',
                                      ),
                                    },
                                  ]}
                                >
                                  <Input placeholder={t('common.optional')} />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label={t(
                                    'pages.k8s.forms.endpointslice.endpoint.targetRef.resourceVersion',
                                  )}
                                  name={[
                                    field.name,
                                    'targetRef',
                                    'resourceVersion',
                                  ]}
                                  rules={[
                                    {
                                      max: 100,
                                      message: t(
                                        'pages.k8s.forms.endpointslice.endpoint.targetRef.resourceVersion.maxLength',
                                      ),
                                    },
                                  ]}
                                >
                                  <Input placeholder={t('common.optional')} />
                                </Form.Item>
                              </Col>
                              <Col span={24}>
                                <Form.Item
                                  label="UID"
                                  name={[field.name, 'targetRef', 'uid']}
                                  rules={[
                                    {
                                      max: 100,
                                      message: t(
                                        'pages.k8s.forms.endpointslice.endpoint.targetRef.uid.maxLength',
                                      ),
                                    },
                                  ]}
                                >
                                  <Input placeholder={t('common.optional')} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>

                          <div className={styles.advancedSection}>
                            <div className={styles.sectionTitle}>
                              {t(
                                'pages.k8s.forms.endpointslice.endpoint.hints',
                              )}
                            </div>
                            <Row gutter={[16, 8]}>
                              <Col md={12} xs={24}>
                                <Form.Item
                                  label={t(
                                    'pages.k8s.forms.endpointslice.endpoint.hints.forNodes',
                                  )}
                                  name={[field.name, 'forNodes']}
                                >
                                  <StringListEditor
                                    addText={t(
                                      'pages.k8s.forms.endpointslice.endpoint.hints.forNodes.add',
                                    )}
                                    deleteAriaLabel={t(
                                      'pages.k8s.forms.endpointslice.endpoint.hints.forNodes.delete',
                                    )}
                                    minRows={1}
                                    placeholder={t(
                                      'pages.k8s.forms.endpointslice.endpoint.nodeName',
                                    )}
                                    onAddBlocked={() =>
                                      message.warning(
                                        t(
                                          'pages.k8s.forms.endpointslice.endpoint.hints.forNodes.fillFirst',
                                        ),
                                      )
                                    }
                                    onCreateItem={() => createStringListItem()}
                                  />
                                </Form.Item>
                              </Col>
                              <Col md={12} xs={24}>
                                <Form.Item
                                  label={t(
                                    'pages.k8s.forms.endpointslice.endpoint.hints.forZones',
                                  )}
                                  name={[field.name, 'forZones']}
                                >
                                  <StringListEditor
                                    addText={t(
                                      'pages.k8s.forms.endpointslice.endpoint.hints.forZones.add',
                                    )}
                                    deleteAriaLabel={t(
                                      'pages.k8s.forms.endpointslice.endpoint.hints.forZones.delete',
                                    )}
                                    minRows={1}
                                    placeholder={t(
                                      'pages.k8s.forms.endpointslice.endpoint.hints.forZones.placeholder',
                                    )}
                                    onAddBlocked={() =>
                                      message.warning(
                                        t(
                                          'pages.k8s.forms.endpointslice.endpoint.hints.forZones.fillFirst',
                                        ),
                                      )
                                    }
                                    onCreateItem={() => createStringListItem()}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>
                        </div>
                      </CollapsibleField>
                    </div>
                  </div>
                ))}
              </div>
              <Form.ErrorList errors={errors} />
              <div className={styles.footer}>
                <Button
                  disabled={addDisabled}
                  icon={<PlusOutlined />}
                  onClick={async () => {
                    try {
                      await form.validateFields(['endpoints'], {
                        recursive: true,
                      });
                      add(
                        createEndpointSliceEndpointItem({
                          addresses: [
                            createStringListItem(
                              getDefaultAddress(addressType),
                            ),
                          ],
                        }),
                      );
                    } catch {
                      // Form.Item displays validation errors in place.
                    }
                  }}
                >
                  {t('pages.k8s.forms.endpointslice.endpoint.add')}
                </Button>
              </div>
            </>
          )}
        </Form.List>
      </div>
    </ResourceFormSection>
  );
};

export default EndpointSliceEndpointSettings;
