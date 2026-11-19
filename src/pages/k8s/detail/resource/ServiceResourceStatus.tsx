import { ApiOutlined, ClusterOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import SubTitle from '../shared/SubTitle';
import type { ServicePortItem } from './serviceHelpers';

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
  portItem: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 220px) 80px minmax(160px, 1fr)',
    alignItems: 'center',
    gap: token.marginLG,
    minHeight: 64,
    padding: `${token.paddingSM}px ${token.paddingLG}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: token.marginSM,
    },
  },
  portEndpoint: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginMD,
  },
  arrow: {
    color: token.colorTextTertiary,
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  item: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(260px, 1fr) minmax(160px, 220px) minmax(120px, 180px)',
    alignItems: 'center',
    gap: token.marginLG,
    minHeight: 64,
    padding: `${token.paddingSM}px ${token.paddingLG}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: token.marginSM,
    },
  },
  main: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginMD,
  },
  icon: {
    position: 'relative',
    flex: '0 0 auto',
    width: 38,
    height: 38,
    color: token.colorTextSecondary,
    fontSize: 30,
    lineHeight: '38px',
    textAlign: 'center',
  },
  iconBadge: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 10,
    height: 10,
    border: `2px solid ${token.colorBgContainer}`,
    borderRadius: '50%',
    backgroundColor: token.colorSuccess,
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
}));

type ServiceResourceStatusProps = {
  ports?: ServicePortItem[];
  /** 服务选中的容器组 */
  pods: ReactNode;
};

const ServiceResourceStatus = ({ pods, ports }: ServiceResourceStatusProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.resourceStatus}>
      <div>
        <SubTitle>端口</SubTitle>
        {ports && ports.length > 0 ? (
          <div className={styles.list}>
            {ports.map((port) => (
              <div className={styles.portItem} key={port.key}>
                <div className={styles.main}>
                  <span className={styles.icon}>
                    <ClusterOutlined />
                  </span>
                  <div className={styles.content}>
                    <div className={styles.value}>
                      {port.target_port || '-'}
                    </div>
                    <div className={styles.label}>容器端口</div>
                  </div>
                </div>
                <div className={styles.arrow}>→ {port.protocol || 'TCP'} →</div>
                <div className={styles.portEndpoint}>
                  <span className={styles.icon}>
                    <ApiOutlined />
                  </span>
                  <div className={styles.content}>
                    <div className={styles.value}>{port.port || '-'}</div>
                    <div className={styles.label}>服务端口</div>
                  </div>
                  {port.node_port ? (
                    <div className={styles.content}>
                      <div className={styles.value}>{port.node_port}</div>
                      <div className={styles.label}>节点端口</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

      <div>
        <SubTitle>容器组</SubTitle>
        {pods}
      </div>
    </div>
  );
};

export default ServiceResourceStatus;
