import {
  ClusterOutlined,
  CodeOutlined,
  DatabaseOutlined,
  EditOutlined,
  FileTextOutlined,
  HddOutlined,
} from '@ant-design/icons';
import { Button, Empty, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { type Translate, useT } from '@/utils/i18n';
import { statusLabel } from '../../components/statusText';
import SubTitle from '../shared/SubTitle';
import { formatValue } from './helpers';
import {
  getPodResizeDisabledReason,
  getResizePolicy,
  hasSameResourceValue,
} from './podResizeHelpers';
import type {
  ClusterNodePodContainer,
  ClusterNodePodContainerPort,
  ClusterNodePodContainerResources,
  ClusterNodePodItem,
  ClusterNodePodVolume,
} from './types';

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
  containerItem: {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 1fr) 140px 140px 180px',
    gap: token.marginLG,
    alignItems: 'center',
    minHeight: 64,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 992px)': {
      gridTemplateColumns: '1fr 1fr',
      alignItems: 'start',
    },

    '@media (max-width: 576px)': {
      gridTemplateColumns: '1fr',
    },
  },
  resourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginSM,
    marginTop: token.marginSM,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorBgContainer,

    '@media (max-width: 576px)': {
      gridTemplateColumns: '1fr',
    },
  },
  resourceItem: {
    minWidth: 0,
  },
  resourceValue: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  resourceChanged: {
    color: token.colorWarning,
  },
  containerMain: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
    minWidth: 0,
  },
  iconWrap: {
    position: 'relative',
    flex: '0 0 auto',
    width: 36,
    height: 36,
    color: token.colorTextSecondary,
    fontSize: 28,
    lineHeight: '36px',
    textAlign: 'center',
  },
  statusBadge: {
    position: 'absolute',
    right: 1,
    bottom: 0,
    width: 8,
    height: 8,
    border: `2px solid ${token.colorBgContainer}`,
    borderRadius: '50%',
    backgroundColor: token.colorSuccess,
  },
  content: {
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    minWidth: 0,
  },
  name: {
    minWidth: 0,
    overflow: 'hidden',
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    padding: 0,
    border: 0,
    backgroundColor: 'transparent',
    color: token.colorTextSecondary,
    cursor: 'default',
    fontSize: 13,
    lineHeight: 1,
  },
  triggerButton: {
    '&.ant-btn': {
      minWidth: 20,
      color: token.colorTextSecondary,
      boxShadow: 'none',
    },
    '&.ant-btn-icon-only': {
      width: 20,
    },
    '&:not(:disabled)': {
      cursor: 'pointer',
    },
  },
  image: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metricValue: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metricLabel: {
    marginTop: 2,
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  volumeItem: {
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorBgContainer,
  },
  volumeHeader: {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, 1fr)',
    gap: token.marginLG,
    alignItems: 'center',

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: token.marginSM,
    },
  },
  volumeMain: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
    minWidth: 0,
  },
  volumeIcon: {
    flex: '0 0 auto',
    color: token.colorTextSecondary,
    fontSize: 32,
  },
  volumeMounts: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: token.marginSM,
  },
  mountItem: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 220px) minmax(0, 1fr)',
    gap: token.marginMD,
    alignItems: 'center',
    minHeight: 36,
    padding: `0 ${token.paddingSM}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 576px)': {
      gridTemplateColumns: '1fr',
      padding: `${token.paddingSM}px`,
    },
  },
  mountContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    minWidth: 0,
    color: token.colorText,
    fontWeight: 600,
  },
  mountPath: {
    minWidth: 0,
    overflow: 'hidden',
    color: token.colorText,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

type PodResourceStatusProps = {
  pod?: ClusterNodePodItem;
  onResize?: (container: ClusterNodePodContainer) => void;
  /** 查看某个容器的日志 / 进入终端；不传则不显示入口 */
  onLog?: (container: ClusterNodePodContainer) => void;
  onTerminal?: (container: ClusterNodePodContainer) => void;
};

const formatContainerPorts = (ports?: ClusterNodePodContainerPort[]) => {
  if (!ports || ports.length === 0) {
    return '-';
  }

  return ports
    .map((port) =>
      port.container_port
        ? `${port.container_port}/${port.protocol || 'TCP'}`
        : undefined,
    )
    .filter(Boolean)
    .join('、');
};

const getVolumeSource = (volume: ClusterNodePodVolume) =>
  volume.source_path || volume.source_name || volume.type || '-';

const getVolumeMounts = (pod: ClusterNodePodItem, volumeName?: string) =>
  (pod.containers || []).flatMap((container) =>
    (container.volume_mounts || [])
      .filter((mount) => mount.name === volumeName)
      .map((mount) => ({
        container: container.name,
        mount,
      })),
  );

const getResourcePair = (
  t: Translate,
  resources: ClusterNodePodContainerResources | undefined,
  resourceName: 'cpu' | 'memory',
) => {
  const request = resources?.requests?.[resourceName];
  const limit = resources?.limits?.[resourceName];

  if (!request && !limit) {
    return '-';
  }

  return `${request || t('pages.k8s.detail.noRequest')} / ${
    limit || t('pages.k8s.detail.noLimit')
  }`;
};

const pickSingleResource = (
  resources: ClusterNodePodContainerResources | undefined,
  resourceName: 'cpu' | 'memory',
) => ({
  requests: {
    [resourceName]: resources?.requests?.[resourceName] || '',
  },
  limits: {
    [resourceName]: resources?.limits?.[resourceName] || '',
  },
});

const isResourceSynced = (
  container: ClusterNodePodContainer,
  resourceName: 'cpu' | 'memory',
) =>
  hasSameResourceValue(
    pickSingleResource(container.resources, resourceName),
    pickSingleResource(container.status_resources, resourceName),
  );

const PodResourceStatus = ({
  pod,
  onResize,
  onLog,
  onTerminal,
}: PodResourceStatusProps) => {
  const t = useT();
  const { styles } = useStyles();

  if (!pod) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className={styles.resourceStatus}>
      <div>
        <SubTitle>{t('pages.k8s.detail.containers')}</SubTitle>
        {pod.containers && pod.containers.length > 0 ? (
          <div className={styles.list}>
            {pod.containers.map((container) => {
              const resizeDisabledReason = getPodResizeDisabledReason(
                pod,
                container,
              );
              const resizeActionDisabled =
                Boolean(resizeDisabledReason) || !onResize;
              const cpuSynced = isResourceSynced(container, 'cpu');
              const memorySynced = isResourceSynced(container, 'memory');

              return (
                <div key={container.name}>
                  <div className={styles.containerItem}>
                    <div className={styles.containerMain}>
                      <div className={styles.iconWrap}>
                        <ClusterOutlined />
                        <span className={styles.statusBadge} />
                      </div>
                      <div className={styles.content}>
                        <div className={styles.titleRow}>
                          <Tooltip title={container.name || '-'}>
                            <div className={styles.name}>
                              {container.name || '-'}
                            </div>
                          </Tooltip>
                          {onLog && (
                            <Tooltip
                              title={t('pages.k8s.detail.pod.containerLogs')}
                            >
                              <Button
                                aria-label={t(
                                  'pages.k8s.detail.pod.containerLogs',
                                )}
                                className={[
                                  styles.trigger,
                                  styles.triggerButton,
                                ].join(' ')}
                                icon={<FileTextOutlined />}
                                type="text"
                                onClick={() => onLog(container)}
                              />
                            </Tooltip>
                          )}
                          {onTerminal && (
                            <Tooltip title={t('pages.k8s.action.terminal')}>
                              <Button
                                aria-label={t('pages.k8s.action.terminal')}
                                className={[
                                  styles.trigger,
                                  styles.triggerButton,
                                ].join(' ')}
                                disabled={container.status !== 'Running'}
                                icon={<CodeOutlined />}
                                type="text"
                                onClick={() => onTerminal(container)}
                              />
                            </Tooltip>
                          )}
                          <Tooltip
                            title={
                              resizeDisabledReason ||
                              (onResize
                                ? t('pages.k8s.detail.resize.action')
                                : t('pages.k8s.detail.resize.noPermission'))
                            }
                          >
                            <Button
                              aria-label={t('pages.k8s.detail.resize.action')}
                              className={[
                                styles.trigger,
                                styles.triggerButton,
                              ].join(' ')}
                              disabled={resizeActionDisabled}
                              icon={<EditOutlined />}
                              type="text"
                              onClick={() => onResize?.(container)}
                            />
                          </Tooltip>
                        </div>
                        <Tooltip title={container.image || '-'}>
                          <div className={styles.image}>
                            {t('pages.k8s.detail.pod.image', {
                              image: container.image || '-',
                            })}
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                    <div>
                      <div className={styles.metricValue}>
                        {statusLabel(container.status) || '-'}
                      </div>
                      <div className={styles.metricLabel}>
                        {t('common.column.status')}
                      </div>
                    </div>
                    <div>
                      <div className={styles.metricValue}>
                        {container.restart_count || 0}
                      </div>
                      <div className={styles.metricLabel}>
                        {t('pages.k8s.detail.restarts')}
                      </div>
                    </div>
                    <div>
                      <Tooltip title={formatContainerPorts(container.ports)}>
                        <div className={styles.metricValue}>
                          {formatContainerPorts(container.ports)}
                        </div>
                      </Tooltip>
                      <div className={styles.metricLabel}>
                        {t('pages.k8s.detail.ports')}
                      </div>
                    </div>
                  </div>
                  <div className={styles.resourceGrid}>
                    <div className={styles.resourceItem}>
                      <div
                        className={[
                          styles.resourceValue,
                          cpuSynced ? '' : styles.resourceChanged,
                        ].join(' ')}
                      >
                        {getResourcePair(t, container.resources, 'cpu')}
                      </div>
                      <div className={styles.metricLabel}>
                        {t('pages.k8s.detail.pod.desiredCpu')}
                      </div>
                    </div>
                    <div className={styles.resourceItem}>
                      <div
                        className={[
                          styles.resourceValue,
                          cpuSynced ? '' : styles.resourceChanged,
                        ].join(' ')}
                      >
                        {getResourcePair(t, container.status_resources, 'cpu')}
                      </div>
                      <div className={styles.metricLabel}>
                        {t('pages.k8s.detail.pod.actualCpu')}
                      </div>
                    </div>
                    <div className={styles.resourceItem}>
                      <div
                        className={[
                          styles.resourceValue,
                          memorySynced ? '' : styles.resourceChanged,
                        ].join(' ')}
                      >
                        {getResourcePair(t, container.resources, 'memory')}
                      </div>
                      <div className={styles.metricLabel}>
                        {t('pages.k8s.detail.pod.desiredMemory')}
                      </div>
                    </div>
                    <div className={styles.resourceItem}>
                      <div
                        className={[
                          styles.resourceValue,
                          memorySynced ? '' : styles.resourceChanged,
                        ].join(' ')}
                      >
                        {getResourcePair(
                          t,
                          container.status_resources,
                          'memory',
                        )}
                      </div>
                      <div className={styles.metricLabel}>
                        {t('pages.k8s.detail.pod.actualMemory')}
                      </div>
                    </div>
                    <div className={styles.resourceItem}>
                      <div className={styles.resourceValue}>
                        {container.allocated_resources?.cpu || '-'}
                      </div>
                      <div className={styles.metricLabel}>
                        {t('pages.k8s.detail.pod.allocatedCpu')}
                      </div>
                    </div>
                    <div className={styles.resourceItem}>
                      <div className={styles.resourceValue}>
                        {container.allocated_resources?.memory || '-'}
                      </div>
                      <div className={styles.metricLabel}>
                        {t('pages.k8s.detail.pod.allocatedMemory')}
                      </div>
                    </div>
                    <div className={styles.resourceItem}>
                      <div className={styles.resourceValue}>
                        {getResizePolicy(container, 'cpu') || '-'}
                      </div>
                      <div className={styles.metricLabel}>
                        {t('pages.k8s.detail.pod.cpuPolicy')}
                      </div>
                    </div>
                    <div className={styles.resourceItem}>
                      <div className={styles.resourceValue}>
                        {getResizePolicy(container, 'memory') || '-'}
                      </div>
                      <div className={styles.metricLabel}>
                        {t('pages.k8s.detail.pod.memoryPolicy')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.k8s.detail.container.empty')}
          />
        )}
      </div>
      <div>
        <SubTitle>{t('pages.k8s.detail.pod.volumes')}</SubTitle>
        {pod.volumes && pod.volumes.length > 0 ? (
          <div className={styles.list}>
            {pod.volumes.map((volume) => {
              const mounts = getVolumeMounts(pod, volume.name);

              return (
                <div className={styles.volumeItem} key={volume.name}>
                  <div className={styles.volumeHeader}>
                    <div className={styles.volumeMain}>
                      <HddOutlined className={styles.volumeIcon} />
                      <div className={styles.content}>
                        <Tooltip title={volume.name || '-'}>
                          <div className={styles.name}>
                            {volume.name || '-'}
                          </div>
                        </Tooltip>
                        <div className={styles.image}>
                          {t('pages.k8s.detail.container.volumeType', {
                            type: formatValue(volume.type),
                          })}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Tooltip title={getVolumeSource(volume)}>
                        <div className={styles.metricValue}>
                          {getVolumeSource(volume)}
                        </div>
                      </Tooltip>
                      <div className={styles.metricLabel}>
                        {volume.source_path
                          ? t('pages.k8s.detail.pod.path')
                          : t('pages.k8s.detail.source')}
                      </div>
                    </div>
                  </div>
                  {mounts.length > 0 ? (
                    <div className={styles.volumeMounts}>
                      {mounts.map(({ container, mount }) => (
                        <div
                          className={styles.mountItem}
                          key={`${container || '-'}-${mount.mount_path || '-'}`}
                        >
                          <span className={styles.mountContainer}>
                            <DatabaseOutlined />
                            <span>{container || '-'}</span>
                          </span>
                          <Tooltip title={mount.mount_path || '-'}>
                            <span className={styles.mountPath}>
                              {mount.mount_path || '-'}
                              {mount.read_only
                                ? t('pages.k8s.detail.container.readOnly')
                                : ''}
                            </span>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.k8s.detail.pod.noVolumes')}
          />
        )}
      </div>
    </div>
  );
};

export default PodResourceStatus;
