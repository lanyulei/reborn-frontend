import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Progress, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';

// 副本摘要卡片仅收敛视觉色值，避免影响组件布局和伸缩交互。
const replicaCardColors = {
  background: 'linear-gradient(90deg, #cfe2f3 0%, #eaf4fd 100%)',
  border: '#b7d4ee',
  text: '#000000',
  progress: '#68a4d8',
  progressText: '#3d82c2',
  progressTrail: 'rgba(255, 255, 255, 0.34)',
  actionText: '#0f376f',
  actionBorder: '#56718f',
  actionBg: '#f8fbff',
  actionBgHover: '#eef5ff',
  actionDisabledText: '#2f5f91',
  actionDisabledBorder: 'rgba(86, 113, 143, 0.42)',
  actionDisabledBg: 'rgba(248, 251, 255, 0.72)',
};

export type ReplicaSummaryData = {
  desiredReplicas?: number;
  currentReplicas?: number;
  scalable?: boolean;
};

type ReplicaSummaryProps = {
  loading?: boolean;
  data?: ReplicaSummaryData;
  disabledReason?: string;
  onScale?: (replicas: number) => void;
};

const useStyles = createStyles(({ token }) => ({
  card: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    boxSizing: 'border-box',
    width: 316,
    minHeight: 0,
    padding: `${token.paddingSM}px ${token.paddingXL}px ${token.paddingSM}px ${token.paddingLG}px`,
    overflow: 'hidden',
    border: `1px solid ${replicaCardColors.border}`,
    borderRadius: token.borderRadiusSM,
    background: replicaCardColors.background,
  },
  halo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 72,
    opacity: 0.32,
  },
  progress: {
    flex: '0 0 auto',

    '.ant-progress-indicator': {
      // 与圆圈同色系、略深一档：数字与圆圈视觉统一，又比描边清晰。
      // v6 的文字元素类名是 -indicator，且 100% 时 success 状态会把它变绿，须覆盖。
      color: `${replicaCardColors.progressText} !important`,
      fontSize: 18,
      fontWeight: 500,
    },
  },
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    marginLeft: token.marginMD,
    paddingRight: token.paddingMD,
    color: replicaCardColors.text,
  },
  title: {
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: 1.5,
  },
  metaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginTop: 4,
  },
  meta: {
    color: replicaCardColors.text,
    fontSize: token.fontSizeSM,
    lineHeight: 1.5,
  },
  actions: {
    position: 'absolute',
    top: '50%',
    right: token.paddingMD,
    zIndex: 1,
    display: 'flex',
    transform: 'translateY(-50%)',
    flexDirection: 'column',
    gap: `10px`,
  },
  actionButton: {
    width: 22,
    minWidth: 22,
    height: 22,
    color: replicaCardColors.actionText,
    border: `1px solid ${replicaCardColors.actionBorder}`,
    borderRadius: token.borderRadiusSM,
    backgroundColor: replicaCardColors.actionBg,

    '&:hover': {
      color: `${replicaCardColors.actionText} !important`,
      borderColor: `${replicaCardColors.actionText} !important`,
      backgroundColor: `${replicaCardColors.actionBgHover} !important`,
    },

    '&[disabled]': {
      color: `${replicaCardColors.actionDisabledText} !important`,
      borderColor: `${replicaCardColors.actionDisabledBorder} !important`,
      backgroundColor: `${replicaCardColors.actionDisabledBg} !important`,
    },
  },
}));

const getReplicaPercent = (current: number, desired: number) => {
  if (desired <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.min(100, Math.round((current / desired) * 100));
};

const ReplicaSummary = ({
  loading = false,
  data,
  disabledReason: disabledReasonProp,
  onScale,
}: ReplicaSummaryProps) => {
  const t = useT();
  const disabledReason =
    disabledReasonProp ?? t('pages.k8s.detail.replica.unsupported');
  const { styles } = useStyles();
  const desiredReplicas = data?.desiredReplicas || 0;
  const currentReplicas = data?.currentReplicas || 0;
  const canScale = Boolean(data?.scalable && onScale);
  const canScaleDown = canScale && desiredReplicas > 0;

  return (
    <div className={styles.card}>
      <div className={styles.halo} />
      <Progress
        className={styles.progress}
        format={() => `${currentReplicas}/${desiredReplicas}`}
        percent={getReplicaPercent(currentReplicas, desiredReplicas)}
        size={60}
        strokeColor={replicaCardColors.progress}
        strokeWidth={10}
        railColor={replicaCardColors.progressTrail}
        type="circle"
      />
      <div className={styles.content}>
        <div className={styles.title}>
          {t('pages.k8s.detail.replica.title')}
        </div>
        <div className={styles.metaList}>
          <div className={styles.meta}>
            {t('pages.k8s.detail.replica.desired', { count: desiredReplicas })}
          </div>
          <div className={styles.meta}>
            {t('pages.k8s.detail.replica.current', { count: currentReplicas })}
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <Tooltip
          title={
            canScale ? t('pages.k8s.detail.replica.increase') : disabledReason
          }
        >
          <Button
            className={styles.actionButton}
            disabled={!canScale}
            icon={<PlusOutlined />}
            loading={loading}
            onClick={() => onScale?.(desiredReplicas + 1)}
            size="small"
            type="text"
          />
        </Tooltip>
        <Tooltip
          title={
            canScale ? t('pages.k8s.detail.replica.decrease') : disabledReason
          }
        >
          <Button
            className={styles.actionButton}
            disabled={!canScaleDown}
            icon={<MinusOutlined />}
            loading={loading}
            onClick={() => onScale?.(Math.max(0, desiredReplicas - 1))}
            size="small"
            type="text"
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default ReplicaSummary;
