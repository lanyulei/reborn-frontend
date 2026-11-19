import {
  CheckCircleFilled,
  DashboardOutlined,
  DatabaseOutlined,
  ExclamationCircleFilled,
  HddOutlined,
  PartitionOutlined,
} from '@ant-design/icons';
import { Empty, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import SubTitle from '../shared/SubTitle';

export type NodeRunningView = {
  conditions?: { type?: string; status?: string }[];
  taints?: { key?: string; value?: string; effect?: string }[];
};

const useStyles = createStyles(({ token }) => ({
  runningStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    // paddingTop: token.paddingXS,
  },
  statusSectionTitle: {
    marginBottom: token.marginXS,
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
  },
  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '12px',
    // padding: token.paddingMD,
    borderRadius: token.borderRadiusLG,

    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  healthCard: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
    // minHeight: 72,
    padding: `${token.paddingSM}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,
  },
  healthIconWrap: {
    position: 'relative',
    flex: '0 0 auto',
    width: 42,
    height: 42,
    color: token.colorTextSecondary,
    fontSize: 34,
    lineHeight: '42px',
    textAlign: 'center',
  },
  healthStateIcon: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    borderRadius: '50%',
    backgroundColor: token.colorBgContainer,
    fontSize: 14,
  },
  healthStateIconSuccess: {
    color: token.colorSuccess,
  },
  healthStateIconWarning: {
    color: token.colorWarning,
  },
  healthContent: {
    minWidth: 0,
  },
  healthTitle: {
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
  },
  healthDesc: {
    marginTop: 2,
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  taintList: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    // padding: token.paddingSM,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorBgContainer,
  },
  taintItem: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    columnGap: token.marginLG,
    alignItems: 'center',
    minHeight: 46,
    padding: '0 16px',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,
    color: token.colorText,
    lineHeight: 1.5,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      rowGap: token.marginXS,
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      borderRadius: token.borderRadiusLG,
    },
  },
  taintField: {
    display: 'flex',
    gap: token.marginSM,
    minWidth: 0,
  },
  taintLabel: {
    flex: '0 0 auto',
    color: token.colorTextTertiary,
  },
  taintValue: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

type RunningStatusProps = {
  node?: NodeRunningView;
};

const healthStatusItems = [
  {
    type: 'MemoryPressure',
    title: '内存压力',
    description: '节点的剩余内存是否小于阈值。',
    icon: <DatabaseOutlined />,
  },
  {
    type: 'DiskPressure',
    title: '磁盘压力',
    description: '节点的剩余磁盘空间或 Inode 数量是否小于阈值。',
    icon: <HddOutlined />,
  },
  {
    type: 'PIDPressure',
    title: '进程压力',
    description: '允许在节点上创建的进程数量是否小于阈值。',
    icon: <DashboardOutlined />,
  },
  {
    type: 'Ready',
    title: '就绪',
    description: '节点是否可以接收容器组。',
    icon: <PartitionOutlined />,
  },
];

const getNodeCondition = (node: NodeRunningView, type: string) =>
  node.conditions?.find((condition) => condition.type === type);

const isConditionHealthy = (type: string, status?: string) => {
  if (type === 'Ready') {
    return status === 'True';
  }
  return status === 'False';
};

const getTaintValue = (value?: string) => value || '-';

const RunningStatus = ({ node }: RunningStatusProps) => {
  const { styles } = useStyles();

  if (!node) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className={styles.runningStatus}>
      <div>
        <SubTitle>健康状态</SubTitle>
        <div className={styles.healthGrid}>
          {healthStatusItems.map((item) => {
            const condition = getNodeCondition(node, item.type);
            const healthy = isConditionHealthy(item.type, condition?.status);

            return (
              <div className={styles.healthCard} key={item.type}>
                <div className={styles.healthIconWrap}>
                  {item.icon}
                  {healthy ? (
                    <CheckCircleFilled
                      className={[
                        styles.healthStateIcon,
                        styles.healthStateIconSuccess,
                      ].join(' ')}
                    />
                  ) : (
                    <ExclamationCircleFilled
                      className={[
                        styles.healthStateIcon,
                        styles.healthStateIconWarning,
                      ].join(' ')}
                    />
                  )}
                </div>
                <div className={styles.healthContent}>
                  <div className={styles.healthTitle}>{item.title}</div>
                  <Tooltip title={item.description} placement="topLeft">
                    <div className={styles.healthDesc}>{item.description}</div>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <SubTitle>污点</SubTitle>
        {node.taints && node.taints.length > 0 ? (
          <div className={styles.taintList}>
            {node.taints.map((taint, index) => {
              const taintKey = getTaintValue(taint.key);
              const taintValue = getTaintValue(taint.value);

              return (
                <div
                  className={styles.taintItem}
                  key={`${taint.key || index}-${taint.effect || ''}`}
                >
                  <div className={styles.taintField}>
                    <span className={styles.taintLabel}>键:</span>
                    <Tooltip title={taintKey} placement="topLeft">
                      <span className={styles.taintValue}>{taintKey}</span>
                    </Tooltip>
                  </div>
                  <div className={styles.taintField}>
                    <span className={styles.taintLabel}>值:</span>
                    <Tooltip title={taintValue} placement="topLeft">
                      <span className={styles.taintValue}>{taintValue}</span>
                    </Tooltip>
                  </div>
                  <div className={styles.taintField}>
                    <span className={styles.taintLabel}>策略:</span>
                    <span className={styles.taintValue}>
                      {getTaintValue(taint.effect)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
};

export default RunningStatus;
