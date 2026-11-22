import {
  ApartmentOutlined,
  ApiOutlined,
  AppstoreOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  FieldTimeOutlined,
  HddOutlined,
  PlaySquareOutlined,
} from '@ant-design/icons';
import { Spin } from 'antd';
import { useT } from '@/utils/i18n';
import SubTitle from '../shared/SubTitle';
import type { NamespaceResourceStatus } from './helpers';
import useStyles from './styles';

type ResourceOverviewProps = {
  loading: boolean;
  resourceStatus: NamespaceResourceStatus;
};

const ResourceOverview = ({
  loading,
  resourceStatus,
}: ResourceOverviewProps) => {
  const t = useT();
  const { styles } = useStyles();
  const resourceStatusItems = [
    {
      key: 'pods',
      label: t('pages.k8s.kind.Pod'),
      value: resourceStatus.pods,
      icon: <ClusterOutlined />,
    },
    {
      key: 'deployments',
      label: t('pages.k8s.kind.Deployment'),
      value: resourceStatus.deployments,
      icon: <DeploymentUnitOutlined />,
      active: (resourceStatus.deployments ?? 0) > 0,
    },
    {
      key: 'statefulsets',
      label: t('pages.k8s.kind.StatefulSet'),
      value: resourceStatus.statefulsets,
      icon: <PlaySquareOutlined />,
    },
    {
      key: 'daemonsets',
      label: t('pages.k8s.kind.DaemonSet'),
      value: resourceStatus.daemonsets,
      icon: <ApartmentOutlined />,
    },
    {
      key: 'jobs',
      label: t('pages.k8s.kind.Job'),
      value: resourceStatus.jobs,
      icon: <AppstoreOutlined />,
    },
    {
      key: 'cronjobs',
      label: t('pages.k8s.kind.CronJob'),
      value: resourceStatus.cronjobs,
      icon: <FieldTimeOutlined />,
    },
    {
      key: 'persistentVolumeClaims',
      label: t('pages.k8s.kind.PersistentVolumeClaim'),
      value: resourceStatus.persistentVolumeClaims,
      icon: <HddOutlined />,
    },
    {
      key: 'services',
      label: t('pages.k8s.kind.Service'),
      value: resourceStatus.services,
      icon: <DatabaseOutlined />,
    },
    {
      key: 'ingresses',
      label: t('pages.k8s.kind.Ingress'),
      value: resourceStatus.ingresses,
      icon: <ApiOutlined />,
    },
  ];

  return (
    <div>
      <SubTitle>{t('pages.k8s.detail.namespace.resourceStatus')}</SubTitle>
      <Spin spinning={loading} className={styles.resourceSpin}>
        <div className={styles.overview}>
          {resourceStatusItems.map((item) => (
            <div className={styles.resourceItem} key={item.key}>
              <div className={styles.resourceIcon}>{item.icon}</div>
              <div className={styles.resourceContent}>
                <div
                  className={[
                    styles.resourceCount,
                    item.active ? styles.resourceCountActive : '',
                  ].join(' ')}
                >
                  {item.value ?? '-'}
                </div>
                <div className={styles.resourceLabel}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </Spin>
    </div>
  );
};

export default ResourceOverview;
