import {
  CheckCircleFilled,
  ClusterOutlined,
  ExclamationCircleFilled,
  PartitionOutlined,
  QuestionCircleFilled,
} from '@ant-design/icons';
import { Empty, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { statusLabel } from '../../components/statusText';
import SubTitle from '../shared/SubTitle';
import { formatValue } from './helpers';
import type { PodConditionItem } from './podHelpers';
import type { ClusterNodePodItem } from './types';

const useStyles = createStyles(({ token }) => ({
  schedulingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.margin,
  },
  resultCard: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 64,
    gap: token.marginMD,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,
  },
  resultIcon: {
    position: 'relative',
    flex: '0 0 auto',
    width: 42,
    height: 42,
    color: token.colorTextSecondary,
    fontSize: 34,
    lineHeight: '42px',
    textAlign: 'center',
  },
  resultStateIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: '50%',
    backgroundColor: token.colorBgContainer,
    color: token.colorSuccess,
    fontSize: 14,
  },
  resultContent: {
    minWidth: 0,
  },
  title: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
  },
  helpIcon: {
    color: token.colorTextTertiary,
    fontSize: 14,
  },
  description: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  currentStatus: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 56,
    gap: token.marginMD,
    padding: `${token.paddingSM}px ${token.padding}px`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorBgContainer,
  },
  currentIcon: {
    position: 'relative',
    flex: '0 0 auto',
    width: 36,
    height: 36,
    color: token.colorTextSecondary,
    fontSize: 30,
    lineHeight: '36px',
    textAlign: 'center',
  },
  conditionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginSM,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  conditionCard: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 64,
    gap: token.marginMD,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,
  },
  conditionIcon: {
    position: 'relative',
    flex: '0 0 auto',
    width: 38,
    height: 38,
    color: token.colorTextSecondary,
    fontSize: 30,
    lineHeight: '38px',
    textAlign: 'center',
  },
  stateIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: '50%',
    backgroundColor: token.colorBgContainer,
    fontSize: 14,
  },
  success: {
    color: token.colorSuccess,
  },
  warning: {
    color: token.colorWarning,
  },
}));

type PodSchedulingInfoProps = {
  conditions?: PodConditionItem[];
  pod?: ClusterNodePodItem;
};

const conditionContent: Record<
  string,
  { title: string; description: string; icon: ReactNode }
> = {
  PodScheduled: {
    title: '容器组调度完成',
    description: '将容器组调度到集群中的一个节点。',
    icon: <PartitionOutlined />,
  },
  Initialized: {
    title: '初始化完成',
    description: '启动所有初始化容器。',
    icon: <ClusterOutlined />,
  },
  ContainersReady: {
    title: '所有容器就绪',
    description: '启动容器组中的所有容器。',
    icon: <ClusterOutlined />,
  },
  Ready: {
    title: '容器组就绪',
    description: '开始运行并允许访问容器组。',
    icon: <CheckCircleFilled />,
  },
};

const conditionOrder = [
  'PodScheduled',
  'Initialized',
  'ContainersReady',
  'Ready',
];

const getCondition = (conditions: PodConditionItem[], type: string) =>
  conditions.find((condition) => condition.type === type);

const isConditionReady = (condition?: PodConditionItem) =>
  condition?.status === 'True';

const PodSchedulingInfo = ({
  conditions = [],
  pod,
}: PodSchedulingInfoProps) => {
  const { styles } = useStyles();

  if (!pod) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const scheduledCondition = getCondition(conditions, 'PodScheduled');
  const scheduled = isConditionReady(scheduledCondition);

  return (
    <div className={styles.schedulingInfo}>
      <div>
        <SubTitle>调度结果</SubTitle>
        <div className={styles.resultCard}>
          <div className={styles.resultIcon}>
            <PartitionOutlined />
            {scheduled ? (
              <CheckCircleFilled className={styles.resultStateIcon} />
            ) : null}
          </div>
          <div className={styles.resultContent}>
            <div className={styles.title}>
              <span>调度至 {formatValue(pod.node_name)}</span>
              <Tooltip title={scheduledCondition?.message || '容器组调度结果'}>
                <QuestionCircleFilled className={styles.helpIcon} />
              </Tooltip>
            </div>
            <div className={styles.description}>
              {formatValue(scheduledCondition?.last_transition_time)}
            </div>
          </div>
        </div>
      </div>
      <div>
        <SubTitle>状态信息</SubTitle>
        <div className={styles.currentStatus}>
          <div className={styles.currentIcon}>
            <ClusterOutlined />
            <CheckCircleFilled
              className={`${styles.stateIcon} ${styles.success}`}
            />
          </div>
          <div className={styles.resultContent}>
            <div className={styles.title}>{statusLabel(pod.status) || '-'}</div>
            <div className={styles.description}>当前状态</div>
          </div>
        </div>
      </div>
      <div className={styles.conditionGrid}>
        {conditionOrder.map((type) => {
          const condition = getCondition(conditions, type);
          const content = conditionContent[type];
          const healthy = isConditionReady(condition);
          const description =
            condition?.message || condition?.reason || content.description;

          return (
            <div className={styles.conditionCard} key={type}>
              <div className={styles.conditionIcon}>
                {content.icon}
                {healthy ? (
                  <CheckCircleFilled
                    className={`${styles.stateIcon} ${styles.success}`}
                  />
                ) : (
                  <ExclamationCircleFilled
                    className={`${styles.stateIcon} ${styles.warning}`}
                  />
                )}
              </div>
              <div className={styles.resultContent}>
                <div className={styles.title}>{content.title}</div>
                <Tooltip title={description} placement="topLeft">
                  <div className={styles.description}>{description}</div>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PodSchedulingInfo;
