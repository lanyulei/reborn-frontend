/**
 * 容器组的健康检查与启动命令：按容器列出就绪 / 存活 / 启动探针（方式、目标、各项参数），
 * 以及启动命令与参数。卡片样式与「调度信息」页签一致。
 */
import {
  ApiOutlined,
  ClusterOutlined,
  CodeOutlined,
  HeartOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Empty, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import SubTitle from '../shared/SubTitle';
import type { ClusterNodePodContainerProbe, ClusterNodePodItem } from './types';

const useStyles = createStyles(({ token }) => ({
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.margin,
  },
  containerTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: token.marginSM,

    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    minWidth: 0,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,
  },
  cardMuted: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
    minWidth: 0,
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
  iconMuted: {
    color: token.colorTextQuaternary,
  },
  content: {
    minWidth: 0,
  },
  title: {
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
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
  params: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: token.marginXS,
    padding: `${token.paddingXS}px ${token.paddingSM}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorBgContainer,
  },
  paramValue: {
    color: token.colorText,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.5,
  },
  paramLabel: {
    color: token.colorTextTertiary,
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: 'nowrap',
  },
  command: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginSM,
    marginTop: token.marginSM,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  code: {
    minWidth: 0,
    padding: `${token.paddingXS}px ${token.paddingSM}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorBgContainer,
    color: token.colorText,
    fontFamily: token.fontFamilyCode,
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
}));

const PROBES: { type: string; description: string; icon: ReactNode }[] = [
  {
    type: '就绪探针',
    description: '通过后容器组才接收流量。',
    icon: <SafetyCertificateOutlined />,
  },
  {
    type: '存活探针',
    description: '失败时重启容器。',
    icon: <HeartOutlined />,
  },
  {
    type: '启动探针',
    description: '通过前不执行其它探针。',
    icon: <RocketOutlined />,
  },
];

const seconds = (value?: number) => (value === undefined ? '-' : `${value}s`);
const times = (value?: number) => (value === undefined ? '-' : `${value} 次`);

type PodHealthChecksProps = {
  pod?: ClusterNodePodItem;
};

const PodHealthChecks = ({ pod }: PodHealthChecksProps) => {
  const { styles, cx } = useStyles();
  const containers = pod?.containers ?? [];

  if (containers.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const renderProbe = (
    item: (typeof PROBES)[number],
    probe?: ClusterNodePodContainerProbe,
  ) => {
    const target = probe ? `${probe.handler} · ${probe.detail}` : '未配置';
    return (
      <div
        className={cx(styles.card, !probe && styles.cardMuted)}
        key={item.type}
      >
        <div className={styles.head}>
          <div className={cx(styles.icon, !probe && styles.iconMuted)}>
            {item.icon}
          </div>
          <div className={styles.content}>
            <div className={styles.title}>{item.type}</div>
            <Tooltip
              placement="topLeft"
              title={probe ? target : item.description}
            >
              <div className={styles.description}>{target}</div>
            </Tooltip>
          </div>
        </div>
        {probe && (
          <div className={styles.params}>
            {[
              ['初始延迟', seconds(probe.initial_delay_seconds ?? 0)],
              ['超时', seconds(probe.timeout_seconds ?? 1)],
              ['间隔', seconds(probe.period_seconds ?? 10)],
              ['成功阈值', times(probe.success_threshold ?? 1)],
              ['失败阈值', times(probe.failure_threshold ?? 3)],
            ].map(([label, value]) => (
              <div key={label}>
                <div className={styles.paramValue}>{value}</div>
                <div className={styles.paramLabel}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.wrap}>
      {containers.map((container) => (
        <div key={container.name}>
          <SubTitle>
            <span className={styles.containerTitle}>
              <ClusterOutlined />
              容器：{container.name || '-'}
            </span>
          </SubTitle>
          <div className={styles.grid}>
            {PROBES.map((item) =>
              renderProbe(
                item,
                container.probes?.find((probe) => probe.type === item.type),
              ),
            )}
          </div>
          <div className={styles.command}>
            {(
              [
                ['启动命令', <CodeOutlined key="i" />, container.command],
                ['启动参数', <ApiOutlined key="i" />, container.args],
              ] as const
            ).map(([label, icon, list]) => (
              <div className={styles.card} key={label}>
                <div className={styles.head}>
                  <div className={styles.icon}>{icon}</div>
                  <div className={styles.content}>
                    <div className={styles.title}>{label}</div>
                    <div className={styles.description}>
                      {list?.length ? `${list.length} 项` : '使用镜像默认值'}
                    </div>
                  </div>
                </div>
                {list?.length ? (
                  // 每个参数一行：保留原样（可含空格），不拼接成一条命令
                  <div className={styles.code}>{list.join('\n')}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PodHealthChecks;
