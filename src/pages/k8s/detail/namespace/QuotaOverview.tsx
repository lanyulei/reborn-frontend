import {
  ClusterOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  HddOutlined,
} from '@ant-design/icons';
import { Empty, Spin } from 'antd';
import { useT } from '@/utils/i18n';
import SubTitle from '../shared/SubTitle';
import {
  formatQuotaValue,
  getQuotaUsagePercent,
  type NamespaceQuotaSummary,
  parseCpuQuantity,
  parseMemoryQuantity,
} from './helpers';
import useStyles from './styles';

type QuotaOverviewProps = {
  loading: boolean;
  quotaSummary: NamespaceQuotaSummary;
};

const QuotaOverview = ({ loading, quotaSummary }: QuotaOverviewProps) => {
  const t = useT();
  const { styles } = useStyles();
  const defaultQuotaItems = [
    {
      key: 'cpu',
      icon: <DatabaseOutlined />,
      request: quotaSummary.defaultContainer.cpuRequest,
      requestLabel: t('pages.k8s.detail.quota.cpuRequest'),
      limit: quotaSummary.defaultContainer.cpuLimit,
      limitLabel: t('pages.k8s.detail.quota.cpuLimit'),
    },
    {
      key: 'memory',
      icon: <HddOutlined />,
      request: quotaSummary.defaultContainer.memoryRequest,
      requestLabel: t('pages.k8s.detail.quota.memoryRequest'),
      limit: quotaSummary.defaultContainer.memoryLimit,
      limitLabel: t('pages.k8s.detail.quota.memoryLimit'),
    },
  ];
  const projectQuotaItems = [
    {
      key: 'cpuLimit',
      icon: <DatabaseOutlined />,
      title: t('pages.k8s.form.cpuLimit'),
      quota: quotaSummary.project.cpuLimit,
      parser: parseCpuQuantity,
    },
    {
      key: 'memoryLimit',
      icon: <HddOutlined />,
      title: t('pages.k8s.detail.quota.memoryLimit'),
      quota: quotaSummary.project.memoryLimit,
      parser: parseMemoryQuantity,
    },
    {
      key: 'pods',
      icon: <ClusterOutlined />,
      title: t('pages.k8s.kind.Pod'),
      quota: quotaSummary.project.pods,
    },
    {
      key: 'deployments',
      icon: <DeploymentUnitOutlined />,
      title: t('pages.k8s.kind.Deployment'),
      quota: quotaSummary.project.deployments,
    },
    {
      key: 'persistentVolumeClaims',
      icon: <HddOutlined />,
      title: t('pages.k8s.kind.PersistentVolumeClaim'),
      quota: quotaSummary.project.persistentVolumeClaims,
    },
  ];

  const unset =
    !loading &&
    Object.values(quotaSummary.defaultContainer).every((value) => !value) &&
    Object.values(quotaSummary.project).every((quota) => !quota.hard);
  if (unset) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('pages.k8s.detail.quota.empty')}
      />
    );
  }

  return (
    <Spin spinning={loading}>
      <div className={styles.quotaPanel}>
        <div>
          <SubTitle>{t('pages.k8s.detail.quota.defaultContainer')}</SubTitle>
          <div className={styles.defaultQuota}>
            {defaultQuotaItems.map((item) => (
              <div className={styles.defaultQuotaGroup} key={item.key}>
                <div className={styles.quotaIcon}>{item.icon}</div>
                <div className={styles.quotaMetric}>
                  <div className={styles.quotaMetricValue}>
                    {item.request || t('pages.k8s.detail.noRequest')}
                  </div>
                  <div className={styles.quotaMetricLabel}>
                    {item.requestLabel}
                  </div>
                </div>
                <div className={styles.quotaMetric}>
                  <div className={styles.quotaMetricValue}>
                    {formatQuotaValue(item.limit)}
                  </div>
                  <div className={styles.quotaMetricLabel}>
                    {item.limitLabel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SubTitle>{t('pages.k8s.detail.quota.project')}</SubTitle>
          <div className={styles.projectQuota}>
            {projectQuotaItems.map((item) => {
              const usagePercent = getQuotaUsagePercent(
                item.quota.used,
                item.quota.hard,
                item.parser,
              );

              return (
                <div className={styles.projectQuotaItem} key={item.key}>
                  <div className={styles.quotaIcon}>{item.icon}</div>
                  <div className={styles.quotaMetric}>
                    <div className={styles.quotaMetricValue}>{item.title}</div>
                    <div className={styles.quotaMetricLabel}>
                      {t('pages.k8s.detail.quota.resourceType')}
                    </div>
                  </div>
                  <div className={styles.quotaMetric}>
                    <div className={styles.quotaMetricValue}>
                      {item.quota.used || '0'}
                    </div>
                    <div className={styles.quotaMetricLabel}>
                      {t('pages.k8s.detail.used')}
                    </div>
                  </div>
                  <div className={styles.quotaMetric}>
                    <div className={styles.quotaMetricValue}>
                      {formatQuotaValue(item.quota.hard)}
                    </div>
                    <div className={styles.quotaMetricLabel}>
                      {t('pages.k8s.action.quota')}
                    </div>
                  </div>
                  <div className={styles.quotaUsage}>
                    <div className={styles.usageHeader}>
                      <span className={styles.usageTitle}>
                        {t('pages.k8s.detail.usage')}
                      </span>
                      <span>
                        {t('pages.k8s.detail.usedPercent', {
                          percent: usagePercent,
                        })}
                      </span>
                    </div>
                    <div className={styles.usageBar}>
                      <div
                        className={styles.usageBarInner}
                        style={{ width: `${usagePercent}%` }}
                      />
                      <span className={styles.usageLimit}>
                        {formatQuotaValue(item.quota.hard)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Spin>
  );
};

export default QuotaOverview;
