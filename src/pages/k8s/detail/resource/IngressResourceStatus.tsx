import { GlobalOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Empty, Tooltip, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';
import SubTitle from '../shared/SubTitle';
import { formatIngressRuleValue, type IngressRuleItem } from './ingressHelpers';

const useStyles = createStyles(({ token }) => ({
  resourceStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  ruleItem: {
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,
  },
  ruleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginLG,

    '@media (max-width: 768px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
    },
  },
  main: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginMD,
  },
  icon: {
    flex: '0 0 auto',
    width: 38,
    height: 38,
    color: token.colorTextSecondary,
    fontSize: 30,
    lineHeight: '38px',
    textAlign: 'center',
  },
  content: {
    minWidth: 0,
  },
  value: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  label: {
    marginTop: 3,
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  access: {
    display: 'flex',
    alignItems: 'center',
    flex: '0 0 auto',
    gap: token.marginSM,
    color: token.colorTextTertiary,
    fontSize: 13,
  },
  accessHelp: {
    color: token.colorTextQuaternary,
  },
  pathPanel: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(180px, 1fr) minmax(160px, 1fr) minmax(120px, 180px) auto',
    alignItems: 'center',
    gap: token.marginLG,
    marginTop: token.marginSM,
    padding: `${token.paddingXS + token.paddingXXS / 2}px ${token.padding + token.paddingXXS}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 32,
    backgroundColor: token.colorBgContainer,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      borderRadius: token.borderRadiusLG,
      gap: token.marginSM,
    },
  },
  pathInfo: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginXS,
  },
}));

type IngressResourceStatusProps = {
  rules?: IngressRuleItem[];
};

const IngressResourceStatus = ({ rules }: IngressResourceStatusProps) => {
  const t = useT();
  const { styles } = useStyles();

  return (
    <div className={styles.resourceStatus}>
      <div>
        <SubTitle>{t('pages.k8s.detail.ingress.rules')}</SubTitle>
        {rules && rules.length > 0 ? (
          <div className={styles.list}>
            {rules.map((rule) => (
              <div className={styles.ruleItem} key={rule.key}>
                <div className={styles.ruleHeader}>
                  <div className={styles.main}>
                    <span className={styles.icon}>
                      <GlobalOutlined />
                    </span>
                    <div className={styles.content}>
                      <div className={styles.value}>
                        {formatIngressRuleValue(rule.host)}
                      </div>
                      <div className={styles.label}>
                        {t('pages.k8s.detail.ingress.protocol', {
                          protocol: rule.protocol || '-',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className={styles.access}>
                    {t('pages.k8s.detail.ingress.inaccessible')}
                    <Tooltip
                      title={
                        rule.accessible_url ||
                        t('pages.k8s.detail.ingress.noAddress')
                      }
                    >
                      <QuestionCircleOutlined className={styles.accessHelp} />
                    </Tooltip>
                  </div>
                </div>
                <div className={styles.pathPanel}>
                  <div className={styles.pathInfo}>
                    <div className={styles.label}>
                      {t('pages.k8s.detail.ingress.path')}
                    </div>
                    <div className={styles.value}>
                      {formatIngressRuleValue(rule.path)}
                    </div>
                  </div>
                  <div className={styles.pathInfo}>
                    <div className={styles.label}>
                      {t('pages.k8s.detail.ingress.service')}
                    </div>
                    <div className={styles.value}>
                      {formatIngressRuleValue(rule.service_name)}
                    </div>
                  </div>
                  <div className={styles.pathInfo}>
                    <div className={styles.label}>
                      {t('pages.k8s.detail.ingress.port')}
                    </div>
                    <div className={styles.value}>
                      {formatIngressRuleValue(rule.service_port)}
                    </div>
                  </div>
                  <Typography.Link
                    disabled={!rule.accessible_url}
                    href={rule.accessible_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('pages.k8s.detail.ingress.visit')}
                  </Typography.Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
};

export type { IngressResourceStatusProps };
export default IngressResourceStatus;
