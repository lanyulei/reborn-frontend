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
  const { styles } = useStyles();
  const resourceStatusItems = [
    {
      key: 'pods',
      label: '容器组',
      value: resourceStatus.pods,
      icon: <ClusterOutlined />,
    },
    {
      key: 'deployments',
      label: '部署',
      value: resourceStatus.deployments,
      icon: <DeploymentUnitOutlined />,
      active: (resourceStatus.deployments ?? 0) > 0,
    },
    {
      key: 'statefulsets',
      label: '有状态副本集',
      value: resourceStatus.statefulsets,
      icon: <PlaySquareOutlined />,
    },
    {
      key: 'daemonsets',
      label: '守护进程集',
      value: resourceStatus.daemonsets,
      icon: <ApartmentOutlined />,
    },
    {
      key: 'jobs',
      label: '任务',
      value: resourceStatus.jobs,
      icon: <AppstoreOutlined />,
    },
    {
      key: 'cronjobs',
      label: '定时任务',
      value: resourceStatus.cronjobs,
      icon: <FieldTimeOutlined />,
    },
    {
      key: 'persistentVolumeClaims',
      label: '持久卷声明',
      value: resourceStatus.persistentVolumeClaims,
      icon: <HddOutlined />,
    },
    {
      key: 'services',
      label: '服务',
      value: resourceStatus.services,
      icon: <DatabaseOutlined />,
    },
    {
      key: 'ingresses',
      label: '应用路由',
      value: resourceStatus.ingresses,
      icon: <ApiOutlined />,
    },
  ];

  return (
    <div>
      <SubTitle>资源状态</SubTitle>
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
