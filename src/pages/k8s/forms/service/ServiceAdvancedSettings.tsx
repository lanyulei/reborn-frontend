import { DownOutlined, UpOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Checkbox, Form, Input, InputNumber, Select } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import KubernetesCompatibilityNotice from '../shared/KubernetesCompatibilityNotice';
import ResourceMetadataFields from '../shared/ResourceMetadataFields';
import { NODE_PORT_MAX, NODE_PORT_MIN } from './helpers';
import type { CreateServiceFormValues, ServicePortItem } from './types';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  sectionTitle: {
    marginBottom: 8,
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
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
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    marginTop: 14,
    borderRadius: token.borderRadiusSM,

    '.ant-form-item-label > label': {
      fontSize: token.fontSizeSM,
    },
  },
  field: {
    width: 'min(460px, 100%)',
  },
  extra: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  metadataBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
    marginTop: 14,
    borderRadius: token.borderRadiusSM,
  },
  fieldLabel: {
    marginBottom: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  nodePortRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    width: 'min(460px, 100%)',
  },
  nodePortRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorFillQuaternary,
  },
  nodePortLabel: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  nodePortInput: {
    width: '100%',
  },
}));

type ServiceAdvancedSettingsProps = {
  form: FormInstance<CreateServiceFormValues>;
};

type ServiceAdvancedOptionProps = {
  children?: ReactNode;
  description: ReactNode;
  formItemName: keyof CreateServiceFormValues;
  title: ReactNode;
};

const ServiceAdvancedOption = ({
  children,
  description,
  formItemName,
  title,
}: ServiceAdvancedOptionProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.option}>
      <div className={styles.optionHeader}>
        <Form.Item
          className={styles.checkbox}
          name={formItemName}
          valuePropName="checked"
        >
          <Checkbox aria-label={String(title)} />
        </Form.Item>
        <span>
          <div className={styles.title}>{title}</div>
          <div className={styles.description}>{description}</div>
        </span>
      </div>
      {children}
    </div>
  );
};

const SERVICE_EXTERNAL_ACCESS_OPTIONS = [
  { label: 'NodePort', value: 'NodePort' },
  { label: 'LoadBalancer', value: 'LoadBalancer' },
];

const SERVICE_IP_FAMILY_POLICY_OPTIONS = [
  { label: 'SingleStack', value: 'SingleStack' },
  { label: 'PreferDualStack', value: 'PreferDualStack' },
  { label: 'RequireDualStack', value: 'RequireDualStack' },
];

const SERVICE_IP_FAMILY_OPTIONS = [
  { label: 'IPv4', value: 'IPv4' },
  { label: 'IPv6', value: 'IPv6' },
];

const SERVICE_TRAFFIC_DISTRIBUTION_OPTIONS = [
  { label: 'PreferClose', value: 'PreferClose' },
  { label: 'PreferSameZone', value: 'PreferSameZone' },
  { label: 'PreferSameNode', value: 'PreferSameNode' },
];

const SERVICE_TRAFFIC_POLICY_OPTIONS = [
  { label: 'Cluster', value: 'Cluster' },
  { label: 'Local', value: 'Local' },
];

type ServiceExternalAccessSectionProps = {
  form: FormInstance<CreateServiceFormValues>;
};

const getTransportProtocol = (port?: ServicePortItem) =>
  port?.protocol === 'UDP' || port?.protocol === 'SCTP' ? port.protocol : 'TCP';

/** 每个服务端口可选的节点端口（留空由集群自动分配） */
const ServiceNodePortFields = ({ form }: ServiceExternalAccessSectionProps) => {
  const { styles } = useStyles();
  const ports = (
    (Form.useWatch('ports', { form, preserve: true }) as ServicePortItem[]) ||
    []
  )
    .map((port, index) => ({ index, port }))
    .filter(({ port }) => port?.servicePort);

  if (ports.length === 0) {
    return null;
  }

  return (
    <div>
      <div className={styles.fieldLabel}>节点端口</div>
      <div className={styles.nodePortRows}>
        {ports.map(({ index, port }) => (
          <div className={styles.nodePortRow} key={port.id || index}>
            <span className={styles.nodePortLabel}>
              {port.name ? `${port.name} · ` : ''}
              {port.servicePort}/{getTransportProtocol(port)}
            </span>
            <Form.Item
              name={['ports', index, 'nodePort']}
              rules={[
                {
                  type: 'number',
                  min: NODE_PORT_MIN,
                  max: NODE_PORT_MAX,
                  message: `节点端口范围为 ${NODE_PORT_MIN}-${NODE_PORT_MAX}`,
                },
                {
                  validator: async (_, value?: number | null) => {
                    if (value === undefined || value === null) {
                      return;
                    }
                    const allPorts =
                      (form.getFieldValue('ports') as ServicePortItem[]) || [];
                    const duplicated = allPorts.some(
                      (item, itemIndex) =>
                        itemIndex !== index &&
                        item?.nodePort === value &&
                        getTransportProtocol(item) ===
                          getTransportProtocol(allPorts[index]),
                    );
                    if (duplicated) {
                      throw new Error(`节点端口 ${value} 重复`);
                    }
                  },
                },
              ]}
            >
              <InputNumber
                aria-label={`服务端口 ${port.servicePort} 的节点端口`}
                className={styles.nodePortInput}
                placeholder="自动分配"
                precision={0}
              />
            </Form.Item>
          </div>
        ))}
      </div>
      <div className={styles.extra}>
        可选。取值范围为 {NODE_PORT_MIN} 到 {NODE_PORT_MAX}
        ，留空时由集群自动分配。
      </div>
    </div>
  );
};

const ServiceExternalAccessSection = ({
  form,
}: ServiceExternalAccessSectionProps) => {
  const { styles } = useStyles();
  const enableExternalAccess = Form.useWatch('enableExternalAccess', form);
  const externalAccessMode = Form.useWatch('externalAccessMode', form);
  const external =
    externalAccessMode === 'NodePort' || externalAccessMode === 'LoadBalancer';

  return (
    <div>
      <div className={styles.sectionTitle}>外部访问</div>
      <ServiceAdvancedOption
        description="设置从集群外访问服务的方式。"
        formItemName="enableExternalAccess"
        title="外部访问"
      >
        {enableExternalAccess && (
          <div className={styles.body}>
            <Form.Item label="访问模式" name="externalAccessMode">
              <Select
                className={styles.field}
                options={SERVICE_EXTERNAL_ACCESS_OPTIONS}
              />
            </Form.Item>
            {external && (
              <Form.Item
                label="外部流量策略"
                name="externalTrafficPolicy"
                extra="Local 可保留客户端源 IP，Cluster 会在集群范围内转发。"
              >
                <Select
                  allowClear
                  className={styles.field}
                  options={SERVICE_TRAFFIC_POLICY_OPTIONS}
                  placeholder="默认由集群决定"
                />
              </Form.Item>
            )}
            {external && <ServiceNodePortFields form={form} />}
            {externalAccessMode === 'LoadBalancer' && (
              <>
                <Form.Item
                  label="LoadBalancer Class"
                  name="loadBalancerClass"
                  extra="指定由哪类负载均衡器实现接管该 Service。"
                >
                  <Input
                    className={styles.field}
                    placeholder="例如 service.k8s.aws/nlb"
                  />
                </Form.Item>
                <Form.Item
                  label="分配 NodePort"
                  name="allocateLoadBalancerNodePorts"
                  valuePropName="checked"
                >
                  <Checkbox>为 LoadBalancer 服务自动分配 NodePort</Checkbox>
                </Form.Item>
              </>
            )}
          </div>
        )}
      </ServiceAdvancedOption>
    </div>
  );
};

const ServiceNetworkingSection = ({
  form,
}: ServiceExternalAccessSectionProps) => {
  const { styles } = useStyles();
  const ipFamilyPolicy = Form.useWatch('ipFamilyPolicy', form);

  useEffect(() => {
    if (!ipFamilyPolicy) {
      form.setFieldValue('ipFamilies', undefined);
    }
  }, [form, ipFamilyPolicy]);

  return (
    <div>
      <div className={styles.sectionTitle}>网络策略</div>
      <div className={styles.option}>
        <KubernetesCompatibilityNotice
          message="Kubernetes 1.35+ Service 网络能力"
          items={[
            '双栈集群建议显式设置 IP Family Policy 与 IP Families。',
            'trafficDistribution 会通过 EndpointSlice 影响就近转发偏好。',
          ]}
        />
        <div className={styles.metadataBody}>
          <Form.Item label="IP Family Policy" name="ipFamilyPolicy">
            <Select
              allowClear
              className={styles.field}
              options={SERVICE_IP_FAMILY_POLICY_OPTIONS}
              placeholder="默认由集群决定"
            />
          </Form.Item>
          {ipFamilyPolicy && (
            <Form.Item label="IP Families" name="ipFamilies">
              <Select
                allowClear
                className={styles.field}
                mode="multiple"
                options={SERVICE_IP_FAMILY_OPTIONS}
                placeholder="请选择 IP 协议族"
              />
            </Form.Item>
          )}
          <Form.Item
            label="内部流量策略"
            name="internalTrafficPolicy"
            extra="Local 仅转发到节点本地端点，Cluster 在集群范围内转发。"
          >
            <Select
              allowClear
              className={styles.field}
              options={SERVICE_TRAFFIC_POLICY_OPTIONS}
              placeholder="默认 Cluster"
            />
          </Form.Item>
          <Form.Item
            label="流量分布"
            name="trafficDistribution"
            extra="在支持的集群中用于表达就近或同节点转发偏好。"
          >
            <Select
              allowClear
              className={styles.field}
              options={SERVICE_TRAFFIC_DISTRIBUTION_OPTIONS}
              placeholder="默认不指定"
            />
          </Form.Item>
        </div>
      </div>
    </div>
  );
};

type ServiceSessionAffinitySectionProps = {
  form: FormInstance<CreateServiceFormValues>;
};

const ServiceSessionAffinitySection = ({
  form,
}: ServiceSessionAffinitySectionProps) => {
  const { styles } = useStyles();
  const enableSessionAffinity = Form.useWatch('enableSessionAffinity', form);

  return (
    <div>
      <div className={styles.sectionTitle}>会话保持</div>
      <ServiceAdvancedOption
        description="设置系统在指定的时间内将同一个会话中来自同一个客户端的请求全部转发给同一个容器组。"
        formItemName="enableSessionAffinity"
        title="会话保持"
      >
        {enableSessionAffinity && (
          <div className={styles.body}>
            <Form.Item
              label="最长会话保持时间（s）"
              name="sessionAffinityTimeoutSeconds"
              rules={[
                { required: true, message: '请输入最长会话保持时间' },
                {
                  type: 'number',
                  min: 1,
                  max: 86400,
                  message: '取值范围为 1 到 86400',
                },
              ]}
            >
              <InputNumber
                className={styles.field}
                min={1}
                max={86400}
                precision={0}
              />
            </Form.Item>
            <div className={styles.extra}>
              设置最大会话保持时间。取值范围为 1 到 86400，默认值 10800。
            </div>
          </div>
        )}
      </ServiceAdvancedOption>
    </div>
  );
};

const ServiceAdvancedSettings = ({ form }: ServiceAdvancedSettingsProps) => {
  const { styles } = useStyles();
  const [metadataOpen, setMetadataOpen] = useState(true);

  return (
    <div className={styles.stack}>
      <ServiceExternalAccessSection form={form} />
      <ServiceSessionAffinitySection form={form} />
      <ServiceNetworkingSection form={form} />

      <div>
        <div className={styles.sectionTitle}>元数据</div>
        <div className={styles.option}>
          <button
            aria-expanded={metadataOpen}
            className={styles.optionHeaderButton}
            type="button"
            onClick={() => setMetadataOpen((open) => !open)}
          >
            <span className={styles.headerIcon}>
              {metadataOpen ? <UpOutlined /> : <DownOutlined />}
            </span>
            <span>
              <div className={styles.title}>添加元数据</div>
              <div className={styles.description}>为服务添加元数据。</div>
            </span>
          </button>
          {metadataOpen && (
            <div className={styles.metadataBody}>
              <ResourceMetadataFields />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export {
  ServiceExternalAccessSection,
  ServiceNetworkingSection,
  ServiceSessionAffinitySection,
};
export default ServiceAdvancedSettings;
