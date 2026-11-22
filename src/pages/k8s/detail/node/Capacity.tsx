/**
 * 节点的资源用量：可分配资源（CPU、内存、临时存储）与容器组的调度占用。
 * 卡片样式与「运行状态」页签的健康状态卡片一致。
 */
import {
  ClusterOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  HddOutlined,
} from '@ant-design/icons';
import { createStyles } from 'antd-style';
import { type ReactNode, useEffect, useState } from 'react';
import { listResources } from '@/services/k8s/resource';
import type { K8sObject } from '@/services/k8s/typings';
import { type Translate, useT } from '@/utils/i18n';
import { GVRS } from '../../components/meta';
import SubTitle from '../shared/SubTitle';

const useStyles = createStyles(({ token }) => ({
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,

    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,
  },
  icon: {
    flex: '0 0 auto',
    width: 42,
    height: 42,
    color: token.colorTextSecondary,
    fontSize: 34,
    lineHeight: '42px',
    textAlign: 'center',
  },
  content: {
    minWidth: 0,
  },
  value: {
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
  },
  label: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // 容器组占用：一行内「已调度 / 容量 / 用量条」
  usageRow: {
    display: 'grid',
    gridTemplateColumns:
      '42px minmax(120px, 1fr) minmax(120px, 1fr) minmax(0, 3fr)',
    alignItems: 'center',
    gap: token.marginMD,
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '42px 1fr 1fr',
    },
  },
  usage: {
    minWidth: 0,

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
  },
  usageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  bar: {
    height: 8,
    marginTop: 6,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: token.colorFillSecondary,
  },
  barInner: {
    height: '100%',
    borderRadius: 4,
    transition: `width ${token.motionDurationMid}`,
  },
}));

const BINARY: Record<string, number> = {
  Ki: 1024,
  Mi: 1024 ** 2,
  Gi: 1024 ** 3,
  Ti: 1024 ** 4,
};
const DECIMAL: Record<string, number> = {
  k: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
};

/** 数量 → 字节；解析不了返回 undefined */
const toBytes = (value?: string): number | undefined => {
  const matched = value?.match(/^([\d.]+)(Ki|Mi|Gi|Ti|k|M|G|T)?$/);
  if (!matched) return undefined;
  const amount = Number(matched[1]);
  if (!Number.isFinite(amount)) return undefined;
  const unit = matched[2];
  return amount * (unit ? (BINARY[unit] ?? DECIMAL[unit]) : 1);
};

/** 字节数量的易读写法：7.75 GiB / 512 MiB；解析不了时原样展示 */
const formatBytes = (value?: string): string => {
  const bytes = toBytes(value);
  if (bytes === undefined) return value || '-';
  const trim = (n: number) => String(Number(n.toFixed(2)));
  if (bytes >= BINARY.Ti) return `${trim(bytes / BINARY.Ti)} TiB`;
  if (bytes >= BINARY.Gi) return `${trim(bytes / BINARY.Gi)} GiB`;
  return `${trim(bytes / BINARY.Mi)} MiB`;
};

/** CPU 数量的易读写法：4 核 / 500m → 0.5 核 */
const formatCpu = (t: Translate, value?: string): string => {
  if (!value) return '-';
  const cores = value.endsWith('m')
    ? Number(value.slice(0, -1)) / 1000
    : Number(value);
  return Number.isFinite(cores)
    ? t('pages.k8s.detail.node.cores', { value: Number(cores.toFixed(2)) })
    : value;
};

type CapacityProps = {
  clusterId: string;
  name: string;
  object?: K8sObject;
};

const Capacity = ({ clusterId, name, object }: CapacityProps) => {
  const t = useT();
  const { styles, theme: token } = useStyles();
  const [pods, setPods] = useState<number>();

  // 已调度到该节点的容器组数
  useEffect(() => {
    let cancelled = false;
    listResources(
      clusterId,
      { ...GVRS.pod, node: name, pageSize: 1 },
      { silent: true },
    )
      .then((res) => {
        if (!cancelled && res.total >= 0) setPods(res.total);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [clusterId, name]);

  const allocatable = (object?.status?.allocatable ?? {}) as Record<
    string,
    string
  >;
  const capacity = (object?.status?.capacity ?? {}) as Record<string, string>;
  const podCapacity = Number(allocatable.pods);
  const percent =
    pods !== undefined && podCapacity > 0
      ? Math.min(100, Math.round((pods / podCapacity) * 100))
      : 0;
  const barColor =
    percent >= 90
      ? token.colorError
      : percent >= 75
        ? token.colorWarning
        : token.colorPrimary;

  const cards: {
    key: string;
    icon: ReactNode;
    value: string;
    label: string;
  }[] = [
    {
      key: 'cpu',
      icon: <DashboardOutlined />,
      value: formatCpu(t, allocatable.cpu),
      label: t('pages.k8s.detail.node.allocatableCpu', {
        total: formatCpu(t, capacity.cpu),
      }),
    },
    {
      key: 'memory',
      icon: <DatabaseOutlined />,
      value: formatBytes(allocatable.memory),
      label: t('pages.k8s.detail.node.allocatableMemory', {
        total: formatBytes(capacity.memory),
      }),
    },
    {
      key: 'storage',
      icon: <HddOutlined />,
      value: formatBytes(allocatable['ephemeral-storage']),
      label: t('pages.k8s.detail.node.allocatableStorage', {
        total: formatBytes(capacity['ephemeral-storage']),
      }),
    },
  ];

  return (
    <div className={styles.wrap}>
      <div>
        <SubTitle>{t('pages.k8s.detail.node.allocatable')}</SubTitle>
        <div className={styles.grid}>
          {cards.map((card) => (
            <div className={styles.card} key={card.key}>
              <div className={styles.icon}>{card.icon}</div>
              <div className={styles.content}>
                <div className={styles.value}>{card.value}</div>
                <div className={styles.label}>{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SubTitle>{t('pages.k8s.kind.Pod')}</SubTitle>
        <div className={styles.usageRow}>
          <div className={styles.icon}>
            <ClusterOutlined />
          </div>
          <div className={styles.content}>
            <div className={styles.value}>{pods ?? '-'}</div>
            <div className={styles.label}>
              {t('pages.k8s.detail.node.scheduled')}
            </div>
          </div>
          <div className={styles.content}>
            <div className={styles.value}>{allocatable.pods || '-'}</div>
            <div className={styles.label}>{t('pages.k8s.detail.capacity')}</div>
          </div>
          <div className={styles.usage}>
            <div className={styles.usageHeader}>
              <span>{t('pages.k8s.detail.usage')}</span>
              <span>{t('pages.k8s.detail.usedPercent', { percent })}</span>
            </div>
            <div className={styles.bar}>
              <div
                className={styles.barInner}
                style={{ width: `${percent}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Capacity;
