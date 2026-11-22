import { Col, Form, Input, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';
import type { IngressClassParameterScope } from './types';

const useStyles = createStyles(({ token }) => ({
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    width: '100%',

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  parameterFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    width: '100%',
  },
}));

const IngressClassParameterSettings = () => {
  const t = useT();
  const { styles } = useStyles();
  const enableParameters = Form.useWatch('enableParameters');
  const parameterScope = Form.useWatch('parameterScope');
  const booleanOptions = [
    { label: t('common.status.enabled'), value: 'true' },
    {
      label: t('pages.k8s.forms.ingressclass.parameters.notEnabled'),
      value: 'false',
    },
  ];
  const scopeOptions: { label: string; value: IngressClassParameterScope }[] = [
    {
      label: t('pages.k8s.forms.ingressclass.scope.cluster'),
      value: 'Cluster',
    },
    {
      label: t('pages.k8s.forms.ingressclass.scope.namespace'),
      value: 'Namespace',
    },
  ];

  return (
    <div className={styles.settings}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            extra={t('pages.k8s.forms.ingressclass.parameters.extra')}
            label={t('pages.k8s.forms.ingressclass.parameters')}
            name="enableParameters"
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.ingressclass.parameters.required'),
              },
            ]}
          >
            <Select
              options={booleanOptions}
              placeholder={t('pages.k8s.forms.common.select')}
            />
          </Form.Item>
        </Col>
      </Row>

      {enableParameters === 'true' && (
        <div className={styles.parameterFields}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                extra={t('pages.k8s.forms.ingressclass.apiGroup.extra')}
                label={t('pages.k8s.forms.ingressclass.apiGroup')}
                name="parameterApiGroup"
              >
                <Input
                  placeholder={t(
                    'pages.k8s.forms.ingressclass.apiGroup.placeholder',
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.forms.common.type')}
                name="parameterKind"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: t(
                      'pages.k8s.forms.ingressclass.parameterKind.required',
                    ),
                  },
                ]}
              >
                <Input
                  placeholder={t(
                    'pages.k8s.forms.ingressclass.parameterKind.required',
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.forms.common.name')}
                name="parameterName"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: t(
                      'pages.k8s.forms.ingressclass.parameterName.required',
                    ),
                  },
                ]}
              >
                <Input
                  placeholder={t(
                    'pages.k8s.forms.ingressclass.parameterName.required',
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.forms.ingressclass.scope')}
                name="parameterScope"
                rules={[
                  {
                    required: true,
                    message: t('pages.k8s.forms.ingressclass.scope.required'),
                  },
                ]}
              >
                <Select
                  options={scopeOptions}
                  placeholder={t(
                    'pages.k8s.forms.ingressclass.scope.placeholder',
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
          {parameterScope === 'Namespace' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t('pages.k8s.forms.common.namespace')}
                  name="parameterNamespace"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: t(
                        'pages.k8s.forms.ingressclass.parameterNamespace.required',
                      ),
                    },
                  ]}
                >
                  <Input
                    placeholder={t(
                      'pages.k8s.forms.ingressclass.parameterNamespace.required',
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
        </div>
      )}
    </div>
  );
};

export default IngressClassParameterSettings;
