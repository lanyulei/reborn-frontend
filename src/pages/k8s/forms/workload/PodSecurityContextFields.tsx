import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  Tooltip,
} from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';

const useStyles = createStyles(({ token }) => ({
  securityContext: {
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    marginTop: `16px`,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  securityHeader: {
    display: 'grid',
    gridTemplateColumns: '18px minmax(0, 1fr)',
    gap: token.marginSM,
    alignItems: 'start',
    // marginBottom: `10px`,
  },
  securityCheckbox: {
    marginTop: 3,
  },
  securityTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  securityHelpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: `14px`,
  },
  securityDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  securityNote: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    gap: token.marginSM,
    marginBottom: token.marginMD,
    padding: `12px 16px`,
    borderRadius: token.borderRadiusSM,
    background: token.colorInfoBg,
    color: token.colorInfoText,
  },
  securityNoteIcon: {
    color: token.colorInfo,
    fontSize: 20,
    lineHeight: 1,
  },
  securityNoteTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  securityNoteText: {
    marginTop: token.marginXXS,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  securityGroupTitle: {
    margin: `16px 0 8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  securityGroup: {
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,
  },
  seLinuxGroup: {
    background: token.colorFillQuaternary,
  },
  nonRootRow: {
    margin: `-${token.paddingSM}px -${token.paddingSM}px 16px`,
    padding: `12px`,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorFillQuaternary,
  },
  fieldHelp: {
    marginTop: token.marginXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

const PodSecurityContextFields = () => {
  const { styles } = useStyles();
  const t = useT();
  const form = Form.useFormInstance();
  const enabled = Form.useWatch('enablePodSecurityContext', form);
  const securityContextTip = t('pages.k8s.forms.workload.podSecurity.tip');
  return (
    <div className={styles.securityContext}>
      <div className={styles.securityHeader}>
        <Form.Item
          className={styles.securityCheckbox}
          name="enablePodSecurityContext"
          valuePropName="checked"
        >
          <Checkbox
            aria-label={t('pages.k8s.forms.workload.podSecurity.enable')}
          />
        </Form.Item>
        <span>
          <div className={styles.securityTitle}>
            <span>{t('pages.k8s.forms.workload.podSecurity.title')}</span>
            <Tooltip title={securityContextTip}>
              <QuestionCircleOutlined className={styles.securityHelpIcon} />
            </Tooltip>
          </div>
          <div className={styles.securityDescription}>
            {t('pages.k8s.forms.workload.podSecurity.description')}
          </div>
        </span>
      </div>

      {enabled && (
        <>
          <div className={styles.securityGroupTitle}>
            {t('pages.k8s.forms.workload.podSecurity.userAndGroup')}
          </div>
          <div className={styles.securityGroup}>
            <div className={styles.nonRootRow}>
              <Form.Item
                label={t('pages.k8s.forms.workload.podSecurity.runAsNonRoot')}
                name="runAsNonRoot"
                valuePropName="checked"
                tooltip={t(
                  'pages.k8s.forms.workload.podSecurity.runAsNonRoot.tip',
                )}
              >
                <Switch size="small" />
              </Form.Item>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t('pages.k8s.forms.common.user')}
                  name="runAsUser"
                  tooltip={t(
                    'pages.k8s.forms.workload.podSecurity.runAsUser.tip',
                  )}
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                    placeholder={t(
                      'pages.k8s.forms.workload.podSecurity.runAsUser.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('pages.k8s.forms.workload.podSecurity.runAsGroup')}
                  name="runAsGroup"
                  tooltip={t(
                    'pages.k8s.forms.workload.podSecurity.runAsGroup.tip',
                  )}
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                    placeholder={t(
                      'pages.k8s.forms.workload.podSecurity.runAsGroup.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('pages.k8s.forms.workload.podSecurity.fsGroup')}
                  name="fsGroup"
                  tooltip={t(
                    'pages.k8s.forms.workload.podSecurity.fsGroup.tip',
                  )}
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                    placeholder={t(
                      'pages.k8s.forms.workload.podSecurity.fsGroup.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t(
                    'pages.k8s.forms.workload.podSecurity.supplementalGroupsPolicy',
                  )}
                  name="supplementalGroupsPolicy"
                  tooltip={t(
                    'pages.k8s.forms.workload.podSecurity.supplementalGroupsPolicy.tip',
                  )}
                >
                  <Select
                    allowClear
                    options={[
                      { label: 'Merge', value: 'Merge' },
                      { label: 'Strict', value: 'Strict' },
                    ]}
                    placeholder={t(
                      'pages.k8s.forms.workload.podSecurity.supplementalGroupsPolicy.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label={t(
                    'pages.k8s.forms.workload.podSecurity.supplementalGroups',
                  )}
                  name="supplementalGroups"
                  tooltip={t(
                    'pages.k8s.forms.workload.podSecurity.supplementalGroups.tip',
                  )}
                >
                  <Input.TextArea
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    placeholder={t(
                      'pages.k8s.forms.workload.podSecurity.supplementalGroups.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div
            className={styles.securityGroupTitle}
            style={{ marginTop: `16px` }}
          >
            {t('pages.k8s.forms.workload.podSecurity.seLinux')}
          </div>
          <div
            className={[styles.securityGroup, styles.seLinuxGroup].join(' ')}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t(
                    'pages.k8s.forms.workload.podSecurity.seLinux.level',
                  )}
                  name="seLinuxLevel"
                  style={{ marginBottom: `16px` }}
                >
                  <Input
                    placeholder={t(
                      'pages.k8s.forms.workload.podSecurity.seLinux.level.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('pages.k8s.kind.Role')}
                  name="seLinuxRole"
                  style={{ marginBottom: `16px` }}
                >
                  <Input
                    placeholder={t(
                      'pages.k8s.forms.workload.podSecurity.seLinux.role.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('pages.k8s.forms.common.type')}
                  name="seLinuxType"
                >
                  <Input
                    placeholder={t(
                      'pages.k8s.forms.workload.podSecurity.seLinux.type.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('pages.k8s.forms.common.user')}
                  name="seLinuxUser"
                >
                  <Input
                    placeholder={t(
                      'pages.k8s.forms.workload.podSecurity.seLinux.user.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </>
      )}
    </div>
  );
};

export default PodSecurityContextFields;
