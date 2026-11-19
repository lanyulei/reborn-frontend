import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { App, Button, Col, Form, Input, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
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

const CONDITION_OPTIONS: {
  label: string;
  value: EndpointSliceConditionValue;
}[] = [
  { label: '不输出', value: 'unset' },
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
];

const getAddressPlaceholder = (addressType?: EndpointSliceAddressType) => {
  if (addressType === 'FQDN') {
    return '例如 api.example.local';
  }
  if (addressType === 'IPv6') {
    return '例如 fd00::10';
  }
  return '例如 10.0.0.10';
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
  const { message } = App.useApp();
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
      description="至少填写一个端点地址，格式需匹配地址类型。"
      title="端点"
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
                throw new Error('请至少添加一个端点地址');
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
                        端点 {index + 1}
                      </div>
                      <Button
                        aria-label="删除端点"
                        className={styles.deleteButton}
                        disabled={fields.length <= 1}
                        icon={<DeleteOutlined />}
                        type="text"
                        onClick={() => remove(field.name)}
                      />
                    </div>

                    <div>
                      <div className={styles.fieldSectionHeader}>
                        <div className={styles.fieldSectionTitle}>地址配置</div>
                      </div>
                      <Form.Item
                        extra="格式需匹配 IPv4、IPv6 或 FQDN。"
                        name={[field.name, 'addresses']}
                      >
                        <StringListEditor
                          addText="添加地址"
                          deleteAriaLabel="删除地址"
                          minRows={1}
                          placeholder={getAddressPlaceholder(addressType)}
                          surface
                          onAddBlocked={() =>
                            message.warning('请先填写已有地址')
                          }
                          onCreateItem={() => createStringListItem()}
                        />
                      </Form.Item>
                    </div>

                    <div className={styles.separatedFieldSection}>
                      <div className={styles.fieldSectionHeader}>
                        <div className={styles.fieldSectionTitle}>位置标识</div>
                      </div>
                      <Row gutter={16}>
                        <Col md={8} xs={24}>
                          <Form.Item
                            label="主机名"
                            name={[field.name, 'hostname']}
                            rules={[
                              { max: 63, message: '主机名最长 63 个字符' },
                            ]}
                          >
                            <Input placeholder="可选" />
                          </Form.Item>
                        </Col>
                        <Col md={8} xs={24}>
                          <Form.Item
                            label="节点名称"
                            name={[field.name, 'nodeName']}
                            rules={[
                              { max: 253, message: '节点名称最长 253 个字符' },
                            ]}
                          >
                            <CreatableSelect
                              allowClear
                              names={nodeNames}
                              placeholder="可选"
                            />
                          </Form.Item>
                        </Col>
                        <Col md={8} xs={24}>
                          <Form.Item
                            label="可用区"
                            name={[field.name, 'zone']}
                            rules={[
                              { max: 63, message: '可用区最长 63 个字符' },
                            ]}
                          >
                            <Input placeholder="例如 cn-shanghai-a" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    <div className={styles.advancedBlock}>
                      <CollapsibleField
                        contentClassName={styles.advancedCollapseContent}
                        defaultOpen={false}
                        description="条件、目标引用、流量提示。"
                        title="高级端点字段"
                      >
                        <div className={styles.advancedContent}>
                          <div className={styles.advancedSection}>
                            <div className={styles.sectionTitle}>端点条件</div>
                            <Row gutter={[16, 8]}>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label="Ready"
                                  name={[field.name, 'ready']}
                                >
                                  <Select options={CONDITION_OPTIONS} />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label="Serving"
                                  name={[field.name, 'serving']}
                                >
                                  <Select options={CONDITION_OPTIONS} />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label="Terminating"
                                  name={[field.name, 'terminating']}
                                >
                                  <Select options={CONDITION_OPTIONS} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>

                          <div className={styles.advancedSection}>
                            <div className={styles.sectionTitle}>目标引用</div>
                            <Row gutter={[16, 13]}>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label="API 版本"
                                  name={[field.name, 'targetRef', 'apiVersion']}
                                  rules={[
                                    {
                                      max: 100,
                                      message: 'API 版本最长 100 个字符',
                                    },
                                  ]}
                                >
                                  <Input placeholder="例如 v1" />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label="类型"
                                  name={[field.name, 'targetRef', 'kind']}
                                  rules={[
                                    { max: 63, message: '类型最长 63 个字符' },
                                  ]}
                                >
                                  <Input placeholder="例如 Pod" />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label="名称"
                                  name={[field.name, 'targetRef', 'name']}
                                  rules={[
                                    {
                                      max: 253,
                                      message: '名称最长 253 个字符',
                                    },
                                  ]}
                                >
                                  <Input placeholder="可选" />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label="命名空间"
                                  name={[field.name, 'targetRef', 'namespace']}
                                  rules={[
                                    {
                                      max: 63,
                                      message: '命名空间最长 63 个字符',
                                    },
                                  ]}
                                >
                                  <Input placeholder="可选" />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label="字段路径"
                                  name={[field.name, 'targetRef', 'fieldPath']}
                                  rules={[
                                    {
                                      max: 250,
                                      message: '字段路径最长 250 个字符',
                                    },
                                  ]}
                                >
                                  <Input placeholder="可选" />
                                </Form.Item>
                              </Col>
                              <Col md={8} xs={24}>
                                <Form.Item
                                  label="资源版本"
                                  name={[
                                    field.name,
                                    'targetRef',
                                    'resourceVersion',
                                  ]}
                                  rules={[
                                    {
                                      max: 100,
                                      message: '资源版本最长 100 个字符',
                                    },
                                  ]}
                                >
                                  <Input placeholder="可选" />
                                </Form.Item>
                              </Col>
                              <Col span={24}>
                                <Form.Item
                                  label="UID"
                                  name={[field.name, 'targetRef', 'uid']}
                                  rules={[
                                    {
                                      max: 100,
                                      message: 'UID 最长 100 个字符',
                                    },
                                  ]}
                                >
                                  <Input placeholder="可选" />
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>

                          <div className={styles.advancedSection}>
                            <div className={styles.sectionTitle}>流量提示</div>
                            <Row gutter={[16, 8]}>
                              <Col md={12} xs={24}>
                                <Form.Item
                                  label="节点提示"
                                  name={[field.name, 'forNodes']}
                                >
                                  <StringListEditor
                                    addText="添加节点"
                                    deleteAriaLabel="删除节点"
                                    minRows={1}
                                    placeholder="节点名称"
                                    onAddBlocked={() =>
                                      message.warning('请先填写已有节点名称')
                                    }
                                    onCreateItem={() => createStringListItem()}
                                  />
                                </Form.Item>
                              </Col>
                              <Col md={12} xs={24}>
                                <Form.Item
                                  label="可用区提示"
                                  name={[field.name, 'forZones']}
                                >
                                  <StringListEditor
                                    addText="添加可用区"
                                    deleteAriaLabel="删除可用区"
                                    minRows={1}
                                    placeholder="可用区名称"
                                    onAddBlocked={() =>
                                      message.warning('请先填写已有可用区名称')
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
                  添加端点
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
