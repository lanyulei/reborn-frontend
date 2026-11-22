import { Alert, Checkbox, Form } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';
import ResourceFormSection from '../shared/ResourceFormSection';
import { hasSelectorContent } from './helpers';
import LabelSelectorEditor from './LabelSelectorEditor';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
  policyTypes: {
    '.ant-checkbox-wrapper': {
      minHeight: 32,
      alignItems: 'center',
    },
  },
  hint: {
    marginTop: token.marginSM,
  },
}));

const NetworkPolicySelectorSettings = () => {
  const t = useT();
  const { styles } = useStyles();
  const podSelector = Form.useWatch('podSelector');
  const policyTypeOptions = [
    {
      label: t('pages.k8s.forms.networkpolicy.policyTypes.ingress'),
      value: 'Ingress',
    },
    {
      label: t('pages.k8s.forms.networkpolicy.policyTypes.egress'),
      value: 'Egress',
    },
  ];

  return (
    <div className={styles.stack}>
      <ResourceFormSection
        description={t('pages.k8s.forms.networkpolicy.podSelector.description')}
        title={t('pages.k8s.forms.common.podSelector')}
        tooltip={t('pages.k8s.forms.networkpolicy.podSelector.tooltip')}
      >
        <Form.Item name="podSelector">
          <LabelSelectorEditor />
        </Form.Item>
        {!hasSelectorContent(podSelector) && (
          <Alert
            className={styles.hint}
            showIcon
            title={t('pages.k8s.forms.networkpolicy.podSelector.emptyHint')}
            type="info"
          />
        )}
      </ResourceFormSection>

      <ResourceFormSection
        description={t('pages.k8s.forms.networkpolicy.policyTypes.description')}
        title={t('pages.k8s.forms.networkpolicy.policyTypes')}
        tooltip={t('pages.k8s.forms.networkpolicy.policyTypes.tooltip')}
      >
        <Form.Item
          className={styles.policyTypes}
          name="policyTypes"
          rules={[
            {
              validator: async (_, value) => {
                if (!value?.length) {
                  throw new Error(
                    t('pages.k8s.forms.networkpolicy.policyTypes.required'),
                  );
                }
              },
            },
          ]}
        >
          <Checkbox.Group options={policyTypeOptions} />
        </Form.Item>
      </ResourceFormSection>
    </div>
  );
};

export default NetworkPolicySelectorSettings;
