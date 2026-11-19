/** 编辑服务设置：工作负载选择器、端口、会话保持、网络策略 */
import { App, Form } from 'antd';
import { createStyles } from 'antd-style';
import { getServicePortsError } from '../../service/helpers';
import {
  ServiceNetworkingSection,
  ServiceSessionAffinitySection,
} from '../../service/ServiceAdvancedSettings';
import ServiceSettings from '../../service/ServiceSettings';
import type { CreateServiceFormValues } from '../../service/types';
import type { EditFormProps } from '../../shared/edit';
import { useEditObject } from '../../shared/edit';
import EditDrawer, { useEditFormValues } from './EditDrawer';
import { applyServiceSettings, buildServiceEditValues } from './helpers';

const useStyles = createStyles(({ token }) => ({
  formStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
}));

const ServiceSettingsEdit = (props: EditFormProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const state = useEditObject(props.clusterId, props.target);
  const [form] = Form.useForm<CreateServiceFormValues>();
  const initial = useEditFormValues(form, state.object, buildServiceEditValues);

  return (
    <EditDrawer
      {...props}
      state={state}
      title="编辑服务设置"
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
        const values: CreateServiceFormValues = form.getFieldsValue(true);
        const error = getServicePortsError(values.ports);
        if (error) {
          message.error(error);
          return undefined;
        }
        return applyServiceSettings(object, initial, values);
      }}
    >
      <Form
        className={styles.formStack}
        form={form}
        layout="vertical"
        requiredMark
      >
        <ServiceSettings
          clusterId={props.clusterId}
          form={form}
          showInternalAccess={false}
        />
        <ServiceSessionAffinitySection form={form} />
        <ServiceNetworkingSection form={form} />
      </Form>
    </EditDrawer>
  );
};

export default ServiceSettingsEdit;
