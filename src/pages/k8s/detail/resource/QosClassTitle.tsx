import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';

const useStyles = createStyles(({ token }) => ({
  qosTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
  },
  qosHelpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: 13,
    marginTop: 2,
  },
  qosTooltip: {
    display: 'grid',
    gap: token.marginXXS,
    maxWidth: 360,
    lineHeight: token.lineHeight,
  },
}));

const QosClassTitle = () => {
  const t = useT();
  const { styles } = useStyles();

  return (
    <span className={styles.qosTitle}>
      {t('pages.k8s.detail.qos.title')}
      <Tooltip
        placement="top"
        title={
          <div className={styles.qosTooltip}>
            <div>
              <strong>Guaranteed：</strong>
              {t('pages.k8s.detail.qos.guaranteed')}
            </div>
            <div>
              <strong>Burstable：</strong>
              {t('pages.k8s.detail.qos.burstable')}
            </div>
            <div>
              <strong>BestEffort：</strong>
              {t('pages.k8s.detail.qos.bestEffort')}
            </div>
          </div>
        }
      >
        <QuestionCircleOutlined
          aria-label={t('pages.k8s.detail.qos.help')}
          className={styles.qosHelpIcon}
          tabIndex={0}
        />
      </Tooltip>
    </span>
  );
};

export default QosClassTitle;
