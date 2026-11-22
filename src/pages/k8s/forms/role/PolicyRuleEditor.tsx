import {
  DeleteOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Button, Col, Form, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';
import { RBAC_VERB_OPTIONS } from './constants';

const useStyles = createStyles(({ token }) => ({
  editor: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  ruleCard: {
    width: '100%',
    minHeight: 64,
    padding: `${token.paddingSM}px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,
    transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}`,

    '&:hover': {
      borderColor: token.colorPrimaryBorder,
      background: token.colorFillQuaternary,
    },
  },
  ruleHeader: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 40px',
    alignItems: 'center',
    gap: token.marginLG,
  },
  ruleMain: {
    display: 'flex',
    minWidth: 0,
    alignItems: 'center',
    gap: token.marginMD,
  },
  ruleIcon: {
    flex: '0 0 auto',
    color: token.colorText,
    fontSize: 34,
    lineHeight: 1,
  },
  ruleContent: {
    minWidth: 0,
  },
  ruleTitle: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  ruleDescription: {
    overflow: 'hidden',
    marginTop: 2,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  ruleDeleteButton: {
    justifySelf: 'end',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  ruleBody: {
    marginTop: token.marginSM,
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,

    '.ant-form-item': {
      marginBottom: token.marginMD,
    },

    '.ant-row:last-child .ant-form-item': {
      marginBottom: 0,
    },
  },
  unsupportedTip: {
    marginBottom: token.marginMD,
    color: token.colorError,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  footer: {
    display: 'flex',
    width: '100%',
  },
  addButton: {
    display: 'flex',
    width: '100%',
    minHeight: 75,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: `15px 64px`,
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,
    transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}`,

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorFillQuaternary,
    },

    '&:focus-visible': {
      borderColor: token.colorPrimary,
      outline: `2px solid ${token.colorPrimaryBorder}`,
      outlineOffset: 1,
    },

    '@media (max-width: 576px)': {
      padding: token.paddingMD,
    },
  },
  addContent: {
    display: 'inline-flex',
    minWidth: 0,
    alignItems: 'center',
    gap: token.marginMD,
  },
  addIcon: {
    flex: '0 0 auto',
    color: token.colorText,
    fontSize: 40,
    lineHeight: 1,
  },
  addText: {
    display: 'inline-flex',
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: token.marginXXS,
  },
  addTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  addDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
}));

const RULE_MODE_OPTIONS = [
  { labelId: 'pages.k8s.forms.role.rule.mode.resource', value: 'resource' },
  {
    labelId: 'pages.k8s.forms.role.rule.mode.nonResource',
    value: 'nonResource',
  },
];

const API_GROUP_OPTIONS = [
  { label: 'core', value: '' },
  { label: '*', value: '*' },
  { label: 'apps', value: 'apps' },
  { label: 'batch', value: 'batch' },
  { label: 'networking.k8s.io', value: 'networking.k8s.io' },
  { label: 'rbac.authorization.k8s.io', value: 'rbac.authorization.k8s.io' },
  { label: 'storage.k8s.io', value: 'storage.k8s.io' },
  { label: 'apiextensions.k8s.io', value: 'apiextensions.k8s.io' },
  { label: 'autoscaling', value: 'autoscaling' },
  { label: 'policy', value: 'policy' },
  { label: 'coordination.k8s.io', value: 'coordination.k8s.io' },
  { label: 'discovery.k8s.io', value: 'discovery.k8s.io' },
  { label: 'events.k8s.io', value: 'events.k8s.io' },
];

const RESOURCE_OPTIONS = [
  '*',
  'pods',
  'pods/log',
  'pods/exec',
  'services',
  'endpoints',
  'configmaps',
  'secrets',
  'serviceaccounts',
  'persistentvolumeclaims',
  'deployments',
  'statefulsets',
  'daemonsets',
  'replicasets',
  'jobs',
  'cronjobs',
  'ingresses',
  'roles',
  'rolebindings',
  'clusterroles',
  'clusterrolebindings',
  'nodes',
  'namespaces',
  'persistentvolumes',
  'storageclasses',
  'customresourcedefinitions',
].map((value) => ({ label: value, value }));

const NON_RESOURCE_URL_OPTIONS = [
  '*',
  '/api',
  '/api/*',
  '/apis',
  '/apis/*',
  '/healthz',
  '/healthz/*',
  '/livez',
  '/livez/*',
  '/readyz',
  '/readyz/*',
  '/metrics',
  '/version',
].map((value) => ({ label: value, value }));

const createRule = () => ({
  mode: 'resource',
  apiGroups: [''],
  resources: [],
  verbs: ['get', 'list', 'watch'],
  resourceNames: [],
  nonResourceURLs: [],
});

type PolicyRuleEditorProps = {
  name?: string;
  clusterScoped?: boolean;
};

const PolicyRuleEditor = ({
  name = 'rules',
  clusterScoped = false,
}: PolicyRuleEditorProps) => {
  const { styles } = useStyles();
  const form = Form.useFormInstance();
  const t = useT();

  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <div className={styles.editor}>
          {fields.map((field, index) => (
            <div className={styles.ruleCard} key={field.key}>
              <div className={styles.ruleHeader}>
                <div className={styles.ruleMain}>
                  <SafetyCertificateOutlined className={styles.ruleIcon} />
                  <div className={styles.ruleContent}>
                    <div className={styles.ruleTitle}>
                      {t('pages.k8s.forms.role.rule.title', {
                        index: index + 1,
                      })}
                    </div>
                    <div className={styles.ruleDescription}>
                      {t('pages.k8s.forms.role.rule.description')}
                    </div>
                  </div>
                </div>
                <Button
                  aria-label={t('pages.k8s.forms.role.rule.delete')}
                  className={styles.ruleDeleteButton}
                  disabled={fields.length <= 1}
                  icon={<DeleteOutlined />}
                  type="text"
                  onClick={() => remove(field.name)}
                />
              </div>
              <div className={styles.ruleBody}>
                <Form.Item
                  label={t('pages.k8s.forms.role.rule.mode')}
                  name={[field.name, 'mode']}
                  rules={[
                    {
                      required: true,
                      message: t('pages.k8s.forms.role.rule.mode.required'),
                    },
                  ]}
                >
                  <Select
                    options={RULE_MODE_OPTIONS.map((option) => ({
                      label: t(option.labelId),
                      value: option.value,
                      disabled:
                        !clusterScoped && option.value === 'nonResource',
                    }))}
                    onChange={(nextMode) => {
                      if (nextMode === 'nonResource') {
                        form.setFieldValue([name, field.name, 'apiGroups'], []);
                        form.setFieldValue([name, field.name, 'resources'], []);
                        form.setFieldValue(
                          [name, field.name, 'resourceNames'],
                          [],
                        );
                        return;
                      }
                      form.setFieldValue([name, field.name, 'apiGroups'], ['']);
                      form.setFieldValue(
                        [name, field.name, 'nonResourceURLs'],
                        [],
                      );
                    }}
                  />
                </Form.Item>
                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue }) => {
                    const mode = getFieldValue([name, field.name, 'mode']);

                    if (mode === 'nonResource') {
                      return (
                        <>
                          {!clusterScoped && (
                            <div className={styles.unsupportedTip}>
                              {t(
                                'pages.k8s.forms.role.rule.nonResource.unsupported',
                              )}
                            </div>
                          )}
                          <Row gutter={16}>
                            <Col md={12} xs={24}>
                              <Form.Item
                                label={t(
                                  'pages.k8s.forms.role.rule.nonResourceURLs',
                                )}
                                name={[field.name, 'nonResourceURLs']}
                                rules={[
                                  {
                                    required: true,
                                    message: t(
                                      'pages.k8s.forms.role.rule.nonResourceURLs.required',
                                    ),
                                  },
                                ]}
                              >
                                <Select
                                  mode="tags"
                                  options={NON_RESOURCE_URL_OPTIONS}
                                  placeholder={t(
                                    'pages.k8s.forms.role.rule.nonResourceURLs.placeholder',
                                  )}
                                />
                              </Form.Item>
                            </Col>
                            <Col md={12} xs={24}>
                              <Form.Item
                                label={t('pages.k8s.forms.role.rule.verbs')}
                                name={[field.name, 'verbs']}
                                rules={[
                                  {
                                    required: true,
                                    message: t(
                                      'pages.k8s.forms.role.rule.verbs.required',
                                    ),
                                  },
                                ]}
                              >
                                <Select
                                  mode="tags"
                                  options={RBAC_VERB_OPTIONS}
                                  placeholder={t(
                                    'pages.k8s.forms.role.rule.verbs.required',
                                  )}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </>
                      );
                    }

                    return (
                      <>
                        <Row gutter={16}>
                          <Col md={12} xs={24}>
                            <Form.Item
                              label={t('pages.k8s.forms.role.rule.apiGroups')}
                              name={[field.name, 'apiGroups']}
                              rules={[
                                {
                                  required: true,
                                  message: t(
                                    'pages.k8s.forms.role.rule.apiGroups.required',
                                  ),
                                },
                              ]}
                            >
                              <Select
                                mode="tags"
                                options={API_GROUP_OPTIONS}
                                placeholder={t(
                                  'pages.k8s.forms.role.rule.apiGroups.placeholder',
                                )}
                              />
                            </Form.Item>
                          </Col>
                          <Col md={12} xs={24}>
                            <Form.Item
                              label={t('pages.k8s.forms.role.rule.resources')}
                              name={[field.name, 'resources']}
                              rules={[
                                {
                                  required: true,
                                  message: t(
                                    'pages.k8s.forms.role.rule.resources.required',
                                  ),
                                },
                              ]}
                            >
                              <Select
                                mode="tags"
                                options={RESOURCE_OPTIONS}
                                placeholder={t(
                                  'pages.k8s.forms.role.rule.resources.placeholder',
                                )}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col md={12} xs={24}>
                            <Form.Item
                              label={t('pages.k8s.forms.role.rule.verbs')}
                              name={[field.name, 'verbs']}
                              rules={[
                                {
                                  required: true,
                                  message: t(
                                    'pages.k8s.forms.role.rule.verbs.required',
                                  ),
                                },
                              ]}
                            >
                              <Select
                                mode="tags"
                                options={RBAC_VERB_OPTIONS}
                                placeholder={t(
                                  'pages.k8s.forms.role.rule.verbs.required',
                                )}
                              />
                            </Form.Item>
                          </Col>
                          <Col md={12} xs={24}>
                            <Form.Item
                              tooltip={t(
                                'pages.k8s.forms.role.rule.resourceNames.tooltip',
                              )}
                              label={t(
                                'pages.k8s.forms.role.rule.resourceNames',
                              )}
                              name={[field.name, 'resourceNames']}
                            >
                              <Select
                                mode="tags"
                                placeholder={t('common.optional')}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </>
                    );
                  }}
                </Form.Item>
              </div>
            </div>
          ))}
          <div className={styles.footer}>
            <button
              className={styles.addButton}
              type="button"
              onClick={() => add(createRule())}
            >
              <span className={styles.addContent}>
                <PlusOutlined className={styles.addIcon} />
                <span className={styles.addText}>
                  <span className={styles.addTitle}>
                    {t('pages.k8s.forms.role.rule.add')}
                  </span>
                  <span className={styles.addDescription}>
                    {t('pages.k8s.forms.role.rule.add.description')}
                  </span>
                </span>
              </span>
            </button>
          </div>
        </div>
      )}
    </Form.List>
  );
};

export { createRule };
export default PolicyRuleEditor;
