import { KeyOutlined, ToolOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import type { WorkloadConfigResourceType } from '../types';
import useStyles from './styles';

type ResourcePlaceholderProps = {
  description: string;
  icon: ReactNode;
  title: string;
};

type ResourceOptionContentProps = ResourcePlaceholderProps & {
  metrics?: { label: string; value?: string }[];
};

export const getConfigResourceLabel = (type?: WorkloadConfigResourceType) =>
  type === 'secret' ? '保密字典' : '配置字典';

export const getResourceIcon = (type?: WorkloadConfigResourceType) =>
  type === 'secret' ? <KeyOutlined /> : <ToolOutlined />;

/** 持久卷声明候选项（取自资源列表行） */
export type PvcOption = {
  name: string;
  capacity?: string;
  accessModes?: string[];
  storageClassName?: string;
};

export const getPvcMetrics = (item: PvcOption) => [
  { label: '容量', value: item.capacity || '-' },
  { label: '访问模式', value: item.accessModes?.join(', ') || '-' },
];

export const ResourceOptionContent = ({
  description,
  icon,
  metrics = [],
  title,
}: ResourceOptionContentProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.resourceOption}>
      <span className={styles.resourceIcon}>{icon}</span>
      <div className={styles.resourceText}>
        <div className={styles.resourceTitle}>{title}</div>
        <div className={styles.resourceDescription}>{description}</div>
      </div>
      {metrics.slice(0, 2).map((metric) => (
        <div className={styles.resourceMetric} key={metric.label}>
          {metric.value || '-'}
          <span className={styles.metricLabel}>{metric.label}</span>
        </div>
      ))}
    </div>
  );
};

export const ResourcePlaceholder = ({
  description,
  icon,
  title,
}: ResourcePlaceholderProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.resourcePlaceholder}>
      <span className={styles.resourceIcon}>{icon}</span>
      <div className={styles.resourceText}>
        <div className={styles.resourceTitle}>{title}</div>
        <div className={styles.resourceDescription}>{description}</div>
      </div>
    </div>
  );
};
