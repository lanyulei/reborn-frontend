import type { FormInstance } from 'antd';
import { Alert, Form } from 'antd';
import { createStyles } from 'antd-style';
import { type Translate, useT } from '@/utils/i18n';
import ResourceFormSection from '../shared/ResourceFormSection';
import NetworkPolicyRuleEditor from './NetworkPolicyRuleEditor';
import type {
  CreateNetworkPolicyFormValues,
  NetworkPolicyPolicyType,
} from './types';

type NetworkPolicyRuleDirection = 'egress' | 'ingress';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
}));

type NetworkPolicyRuleSettingsProps = {
  direction: NetworkPolicyRuleDirection;
  form: FormInstance<CreateNetworkPolicyFormValues>;
};

const getDirectionMeta = (
  direction: NetworkPolicyRuleDirection,
  t: Translate,
) =>
  direction === 'ingress'
    ? {
        denyAllMessage: t('pages.k8s.forms.networkpolicy.ingress.denyAll'),
        disabledMessage: t('pages.k8s.forms.networkpolicy.ingress.disabled'),
        fieldName: 'ingress' as const,
        policyType: 'Ingress' as NetworkPolicyPolicyType,
        title: t('pages.k8s.forms.networkpolicy.ingress'),
        tooltip: t('pages.k8s.forms.networkpolicy.ingress.tooltip'),
      }
    : {
        denyAllMessage: t('pages.k8s.forms.networkpolicy.egress.denyAll'),
        disabledMessage: t('pages.k8s.forms.networkpolicy.egress.disabled'),
        fieldName: 'egress' as const,
        policyType: 'Egress' as NetworkPolicyPolicyType,
        title: t('pages.k8s.forms.networkpolicy.egress'),
        tooltip: t('pages.k8s.forms.networkpolicy.egress.tooltip'),
      };

const NetworkPolicyRuleSettings = ({
  direction,
  form,
}: NetworkPolicyRuleSettingsProps) => {
  const t = useT();
  const { styles } = useStyles();
  const meta = getDirectionMeta(direction, t);
  const policyTypes =
    (Form.useWatch('policyTypes', {
      form,
      preserve: true,
    }) as NetworkPolicyPolicyType[]) || [];
  const enabled = policyTypes.includes(meta.policyType);
  const rules = Form.useWatch(meta.fieldName, { form, preserve: true });

  return (
    <div className={styles.stack}>
      <ResourceFormSection
        bordered={false}
        title={meta.title}
        tooltip={meta.tooltip}
      >
        {enabled ? (
          <div className={styles.stack}>
            {!rules?.length && (
              <Alert showIcon title={meta.denyAllMessage} type="warning" />
            )}
            <Form.Item name={meta.fieldName}>
              <NetworkPolicyRuleEditor direction={direction} />
            </Form.Item>
          </div>
        ) : (
          <Alert showIcon title={meta.disabledMessage} type="info" />
        )}
      </ResourceFormSection>
    </div>
  );
};

export default NetworkPolicyRuleSettings;
