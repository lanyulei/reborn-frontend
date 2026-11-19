/** 编辑外部访问：访问模式（无 / NodePort / LoadBalancer）及 LoadBalancer 相关设置、注解 */
import type { FormInstance } from 'antd';
import { App, Checkbox, Form, Input, Select } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createKeyValueItem } from '../../service/helpers';
import type { CreateServiceFormValues } from '../../service/types';
import type { EditFormProps } from '../../shared/edit';
import { useEditObject } from '../../shared/edit';
import KeyValueEditor from '../../shared/KeyValueEditor';
import EditDrawer, { useEditFormValues } from './EditDrawer';
import { applyServiceExternalAccess, buildServiceEditValues } from './helpers';

const useStyles = createStyles(({ token }) => ({
  formStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
  externalAccessField: {
    width: 'min(460px, 100%)',
  },
  serviceSection: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
  },
  sectionTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionContent: {
    marginTop: 8,
  },
}));

type ServiceEditSectionProps = {
  children: ReactNode;
  description?: ReactNode;
  title: ReactNode;
};

const ServiceEditSection = ({
  children,
  description,
  title,
}: ServiceEditSectionProps) => {
  const { styles } = useStyles();

  return (
    <section className={styles.serviceSection}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>{title}</div>
          {description && (
            <div className={styles.sectionDescription}>{description}</div>
          )}
        </div>
      </div>
      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
};

type ServiceExternalAccessFormProps = {
  form: FormInstance<CreateServiceFormValues>;
};

const ServiceExternalAccessForm = ({
  form,
}: ServiceExternalAccessFormProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const externalAccessMode = Form.useWatch('externalAccessMode', form);
  const externalAccessAnnotations =
    Form.useWatch('externalAccessAnnotations', form) || [];

  useEffect(() => {
    if (
      externalAccessMode === 'LoadBalancer' &&
      externalAccessAnnotations.length === 0
    ) {
      form.setFieldValue('externalAccessAnnotations', [createKeyValueItem()]);
    }
  }, [externalAccessAnnotations.length, externalAccessMode, form]);

  return (
    <div className={styles.formStack}>
      <ServiceEditSection
        description="设置从集群外访问服务的方式。"
        title="访问模式"
      >
        <Form.Item name="externalAccessMode">
          <Select
            aria-label="访问模式"
            className={styles.externalAccessField}
            options={[
              { label: '无', value: 'None' },
              { label: 'NodePort', value: 'NodePort' },
              { label: 'LoadBalancer', value: 'LoadBalancer' },
            ]}
          />
        </Form.Item>
      </ServiceEditSection>

      {externalAccessMode === 'LoadBalancer' && (
        <ServiceEditSection
          description="指定由哪类负载均衡器实现接管该 Service。"
          title="LoadBalancer Class"
        >
          <Form.Item name="loadBalancerClass">
            <Input
              className={styles.externalAccessField}
              placeholder="例如 service.k8s.aws/nlb"
            />
          </Form.Item>
        </ServiceEditSection>
      )}

      {externalAccessMode === 'LoadBalancer' && (
        <ServiceEditSection
          description="控制 LoadBalancer 是否自动分配 NodePort。"
          title="NodePort 分配"
        >
          <Form.Item
            name="allocateLoadBalancerNodePorts"
            valuePropName="checked"
          >
            <Checkbox>为 LoadBalancer 服务自动分配 NodePort</Checkbox>
          </Form.Item>
        </ServiceEditSection>
      )}

      {(externalAccessMode === 'NodePort' ||
        externalAccessMode === 'LoadBalancer') && (
        <ServiceEditSection
          description="Local 可保留客户端源 IP，Cluster 会在集群范围内转发。"
          title="外部流量策略"
        >
          <Form.Item name="externalTrafficPolicy">
            <Select
              allowClear
              className={styles.externalAccessField}
              options={[
                { label: 'Cluster', value: 'Cluster' },
                { label: 'Local', value: 'Local' },
              ]}
              placeholder="默认由集群决定"
            />
          </Form.Item>
        </ServiceEditSection>
      )}

      {externalAccessMode === 'LoadBalancer' && (
        <ServiceEditSection
          description="通过注解补充负载均衡器相关配置。"
          title="注解"
        >
          <Form.Item name="externalAccessAnnotations">
            <KeyValueEditor
              addIcon={false}
              addText="添加"
              deleteAriaLabel="删除注解"
              keyPlaceholder="键"
              valuePlaceholder="值"
              onAddBlocked={() => message.warning('请先填写已有注解的键。')}
              onCreateItem={() => createKeyValueItem()}
            />
          </Form.Item>
        </ServiceEditSection>
      )}
    </div>
  );
};

const ServiceExternalAccessEdit = (props: EditFormProps) => {
  const state = useEditObject(props.clusterId, props.target);
  const [form] = Form.useForm<CreateServiceFormValues>();
  const initial = useEditFormValues(form, state.object, buildServiceEditValues);

  return (
    <EditDrawer
      {...props}
      size="600px"
      state={state}
      title="编辑外部访问"
      onBuild={async (object) => {
        if (!initial) {
          return undefined;
        }
        try {
          await form.validateFields();
        } catch {
          // 校验错误已由表单项展示
          return undefined;
        }
        return applyServiceExternalAccess(
          object,
          initial,
          form.getFieldsValue(true),
        );
      }}
    >
      <Form form={form} layout="vertical">
        <ServiceExternalAccessForm form={form} />
      </Form>
    </EditDrawer>
  );
};

export default ServiceExternalAccessEdit;
