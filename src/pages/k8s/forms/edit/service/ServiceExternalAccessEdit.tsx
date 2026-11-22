/** 编辑外部访问：访问模式（无 / NodePort / LoadBalancer）及 LoadBalancer 相关设置、注解 */
import type { FormInstance } from 'antd';
import { App, Checkbox, Form, Input, Select } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useT } from '@/utils/i18n';
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
  const t = useT();
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
        description={t('pages.k8s.forms.edit.service.accessMode.description')}
        title={t('pages.k8s.forms.common.accessMode')}
      >
        <Form.Item name="externalAccessMode">
          <Select
            aria-label={t('pages.k8s.forms.common.accessMode')}
            className={styles.externalAccessField}
            options={[
              {
                label: t('pages.k8s.forms.edit.service.accessMode.none'),
                value: 'None',
              },
              { label: 'NodePort', value: 'NodePort' },
              { label: 'LoadBalancer', value: 'LoadBalancer' },
            ]}
          />
        </Form.Item>
      </ServiceEditSection>

      {externalAccessMode === 'LoadBalancer' && (
        <ServiceEditSection
          description={t('pages.k8s.forms.edit.service.lbClass.description')}
          title="LoadBalancer Class"
        >
          <Form.Item name="loadBalancerClass">
            <Input
              className={styles.externalAccessField}
              placeholder={t(
                'pages.k8s.forms.edit.service.lbClass.placeholder',
              )}
            />
          </Form.Item>
        </ServiceEditSection>
      )}

      {externalAccessMode === 'LoadBalancer' && (
        <ServiceEditSection
          description={t(
            'pages.k8s.forms.edit.service.nodePortAllocation.description',
          )}
          title={t('pages.k8s.forms.edit.service.nodePortAllocation')}
        >
          <Form.Item
            name="allocateLoadBalancerNodePorts"
            valuePropName="checked"
          >
            <Checkbox>
              {t('pages.k8s.forms.edit.service.nodePortAllocation.checkbox')}
            </Checkbox>
          </Form.Item>
        </ServiceEditSection>
      )}

      {(externalAccessMode === 'NodePort' ||
        externalAccessMode === 'LoadBalancer') && (
        <ServiceEditSection
          description={t(
            'pages.k8s.forms.edit.service.externalTrafficPolicy.description',
          )}
          title={t('pages.k8s.forms.edit.service.externalTrafficPolicy')}
        >
          <Form.Item name="externalTrafficPolicy">
            <Select
              allowClear
              className={styles.externalAccessField}
              options={[
                { label: 'Cluster', value: 'Cluster' },
                { label: 'Local', value: 'Local' },
              ]}
              placeholder={t(
                'pages.k8s.forms.edit.service.externalTrafficPolicy.placeholder',
              )}
            />
          </Form.Item>
        </ServiceEditSection>
      )}

      {externalAccessMode === 'LoadBalancer' && (
        <ServiceEditSection
          description={t(
            'pages.k8s.forms.edit.service.annotations.description',
          )}
          title={t('pages.k8s.forms.common.annotations')}
        >
          <Form.Item name="externalAccessAnnotations">
            <KeyValueEditor
              addIcon={false}
              addText={t('pages.k8s.form.add')}
              deleteAriaLabel={t('pages.k8s.forms.common.deleteAnnotation')}
              keyPlaceholder={t('pages.k8s.form.key')}
              valuePlaceholder={t('pages.k8s.form.value')}
              onAddBlocked={() =>
                message.warning(t('pages.k8s.forms.common.annotationKeyFirst'))
              }
              onCreateItem={() => createKeyValueItem()}
            />
          </Form.Item>
        </ServiceEditSection>
      )}
    </div>
  );
};

const ServiceExternalAccessEdit = (props: EditFormProps) => {
  const t = useT();
  const state = useEditObject(props.clusterId, props.target);
  const [form] = Form.useForm<CreateServiceFormValues>();
  const initial = useEditFormValues(form, state.object, buildServiceEditValues);

  return (
    <EditDrawer
      {...props}
      size="600px"
      state={state}
      title={t('pages.k8s.forms.edit.service.externalAccessTitle')}
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
