import {
  CaretDownOutlined,
  CaretRightOutlined,
  CaretUpOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
  HddOutlined,
  KeyOutlined,
  SettingOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Empty, Spin, Tooltip, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import SegmentedTabs from '../../forms/shared/SegmentedTabs';
import KeyValueList from '../shared/KeyValueList';
import type { ContainerInfo } from './helpers';

type ContainerStatusManagementProps = {
  loading?: boolean;
  /** Pod 模板里的容器 */
  containers?: ContainerInfo[];
};

type ManagedContainer = ContainerInfo;

type ContainerConfigKey = 'env' | 'ports' | 'mounts';

const useStyles = createStyles(({ token }) => ({
  container: {
    borderRadius: token.borderRadiusSM,
    overflow: 'visible',
    backgroundColor: token.colorBgContainer,
  },
  selector: {
    position: 'relative',
  },
  selectorScroll: {
    width: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  selectedRow: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(220px, 1.25fr) repeat(4, minmax(132px, 1fr)) 28px',
    alignItems: 'center',
    boxSizing: 'border-box',
    width: 'max(100%, 920px)',
    minHeight: 64,
    padding: `0 ${token.padding}px`,
    columnGap: token.marginLG,
    border: 0,
    cursor: 'pointer',
    textAlign: 'left',
    font: 'inherit',
    backgroundColor: token.colorBgContainer,
    transition: 'background-color 0.2s ease',

    '&:hover': {
      backgroundColor: token.colorFillQuaternary,
    },

    '&:focus-visible': {
      outline: `2px solid ${token.colorPrimary}`,
      outlineOffset: -2,
    },
  },
  selectorList: {
    position: 'absolute',
    top: '100%',
    right: 0,
    left: 0,
    zIndex: 10,
    maxHeight: 256,
    overflow: 'hidden',
    border: `1px solid ${token.colorBorder}`,
    borderTop: 0,
    boxShadow: token.boxShadowSecondary,
    backgroundColor: token.colorBgContainer,
  },
  selectorListScroll: {
    maxHeight: 256,
    overflow: 'auto',
  },
  row: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(220px, 1.25fr) repeat(4, minmax(132px, 1fr)) 28px',
    alignItems: 'center',
    boxSizing: 'border-box',
    width: 'max(100%, 920px)',
    minHeight: 64,
    padding: `0 ${token.padding}px`,
    columnGap: token.marginLG,
    border: 0,
    cursor: 'pointer',
    textAlign: 'left',
    font: 'inherit',
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s ease',

    '&:hover': {
      backgroundColor: token.colorFillQuaternary,
    },

    '&:focus-visible': {
      outline: `2px solid ${token.colorPrimary}`,
      outlineOffset: -2,
    },
  },
  activeRow: {
    backgroundColor: token.colorFillAlter,
  },
  selectedIndicator: {
    boxShadow: `inset 3px 0 0 ${token.colorPrimary}`,
  },
  identity: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginSM,
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    flex: '0 0 auto',
    borderRadius: token.borderRadiusLG,
    color: token.colorTextSecondary,
    backgroundColor: token.colorFillSecondary,
    fontSize: 18,
  },
  itemText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  label: {
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: 1.5,
  },
  description: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: 1.5,
  },
  field: {
    minWidth: 0,
  },
  toggle: {
    color: token.colorTextSecondary,
    textAlign: 'right',
  },
  panel: {
    borderTop: `1px solid ${token.colorBorderSecondary}`,
    padding: `${token.paddingMD}px ${token.padding}px ${token.padding}px`,
    backgroundColor: token.colorBgContainer,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSize,
  },
  configTabs: {
    marginBottom: token.marginSM,
  },
  tabContent: {
    minHeight: 160,
    padding: `12px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    backgroundColor: token.colorFillQuaternary,
  },
  portTable: {
    // 外边框与全局表格一致（global.less 中 .ant-table 的边框配方），跟随明暗主题
    backgroundColor: token.colorBgContainer,
    width: '100%',
    border:
      '1px solid color-mix(in srgb, var(--ant-color-border) 25%, var(--ant-color-border-secondary))',
    borderRadius: token.borderRadiusLG,
    overflow: 'hidden',
  },
  portRow: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 0.65fr 0.65fr',
    alignItems: 'center',
    minHeight: 40,
    padding: `0 ${token.paddingSM}px`,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    // 末行的下分隔线与外框重叠成双线：去掉（与全局表格的处理一致）
    '&:last-child': {
      borderBottom: 0,
    },
    color: token.colorTextSecondary,
    fontSize: token.fontSize,
  },
  portHeader: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
  },
  portCell: {
    minWidth: 0,
  },
  empty: {
    padding: `${token.paddingLG}px 0`,
  },
  mountList: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  mountCard: {
    border: `1px solid #f0f0f0`,
    borderRadius: token.borderRadiusSM,
    padding: `${token.padding}px`,
    backgroundColor: token.colorBgContainer,
  },
  mountInfo: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr)',
    columnGap: token.marginXL,
    rowGap: token.marginSM,
    marginBottom: token.marginMD,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  mountSummary: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginSM,
  },
  mountIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    flex: '0 0 auto',
    color: '#3a4b63',
    fontSize: 24,
  },
  mountContent: {
    minWidth: 0,
  },
  mountTitle: {
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: 1.5,
  },
  mountDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: 1.5,
  },
  mountRows: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr)',
    columnGap: token.marginXL,
    rowGap: token.marginXS,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid #f0f0f0`,
    borderRadius: token.borderRadiusSM,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  mountRow: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
    minWidth: 0,
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: 1.5,
  },
  mountRowIcon: {
    flex: '0 0 auto',
    color: '#3a4b63',
  },
  mountPath: {
    minWidth: 0,
  },
}));

const getImageRegistry = (image?: string) => {
  const firstSegment = image?.split('/')[0] || '';

  if (
    !firstSegment ||
    !image?.includes('/') ||
    (!firstSegment.includes('.') &&
      !firstSegment.includes(':') &&
      firstSegment !== 'localhost')
  ) {
    return 'Docker Hub';
  }

  return firstSegment;
};

const formatResources = (resources?: Record<string, string>) => {
  const values = [
    resources?.cpu ? `CPU ${resources.cpu}` : '',
    resources?.memory ? `内存 ${resources.memory}` : '',
  ].filter(Boolean);

  return values.length > 0 ? values.join(' / ') : undefined;
};

const getPullPolicyLabel = (policy?: string) => {
  if (policy === 'Always') {
    return '每次拉取镜像';
  }
  if (policy === 'Never') {
    return '仅使用本地镜像';
  }

  return '优先使用本地镜像';
};

const getVolumeSourceLabel = (type?: string) => {
  if (type === 'ConfigMap') {
    return '配置字典';
  }
  if (type === 'Secret') {
    return '保密字典';
  }
  if (type === 'HostPath') {
    return 'HostPath';
  }
  if (type === 'EmptyDir') {
    return 'EmptyDir';
  }
  if (type === 'PersistentVolumeClaim') {
    return '存储卷声明';
  }
  if (type === 'Projected') {
    return '投射卷';
  }
  if (type === 'DownwardAPI') {
    return 'DownwardAPI';
  }

  return type || 'Volume';
};

const getVolumeIcon = (type?: string) => {
  if (type === 'ConfigMap') {
    return <ToolOutlined />;
  }
  if (type === 'Secret') {
    return <KeyOutlined />;
  }
  if (type === 'HostPath' || type === 'EmptyDir') {
    return <HddOutlined />;
  }
  if (type === 'PersistentVolumeClaim') {
    return <DatabaseOutlined />;
  }

  return <FolderOpenOutlined />;
};

const containerConfigOptions: { label: string; value: ContainerConfigKey }[] = [
  { label: '容器环境变量', value: 'env' },
  { label: '容器端口', value: 'ports' },
  { label: '容器挂载', value: 'mounts' },
];

const ContainerStatusManagement = ({
  loading = false,
  containers = [],
}: ContainerStatusManagementProps) => {
  const { styles, cx, theme: token } = useStyles();
  const [activeKey, setActiveKey] = useState<string>();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [activeConfigKey, setActiveConfigKey] =
    useState<ContainerConfigKey>('env');
  const activeContainer =
    containers.find((container) => container.key === activeKey) ||
    containers[0];

  useEffect(() => {
    if (containers.length === 0) {
      setActiveKey(undefined);
      setSelectorOpen(false);
      return;
    }

    if (
      !activeKey ||
      !containers.some((container) => container.key === activeKey)
    ) {
      setActiveKey(containers[0].key);
    }
  }, [activeKey, containers]);

  const selectContainer = (container: ManagedContainer) => {
    setActiveKey(container.key);
    setSelectorOpen(false);
  };

  const renderContainerRow = (
    container: ManagedContainer,
    options?: {
      className?: string;
      onClick?: () => void;
      toggleIcon?: boolean;
    },
  ) => (
    <button
      className={cx(options?.className)}
      key={container.key}
      onClick={options?.onClick}
      type="button"
    >
      <div className={styles.identity}>
        <span className={styles.icon}>
          <CloudServerOutlined />
        </span>
        <div className={styles.itemText}>
          <Tooltip title={container.name || '-'}>
            <Typography.Text className={styles.label} ellipsis>
              {container.name || '-'}
            </Typography.Text>
          </Tooltip>
          <Tooltip title={container.image || '-'}>
            <Typography.Text className={styles.description} ellipsis>
              {container.image || '-'}
            </Typography.Text>
          </Tooltip>
        </div>
      </div>
      <div className={styles.field}>
        <Typography.Text className={styles.label} ellipsis>
          {getImageRegistry(container.image)}
        </Typography.Text>
        <div className={styles.description}>镜像仓库地址</div>
      </div>
      <div className={styles.field}>
        <Typography.Text className={styles.label} ellipsis>
          {formatResources(container.requests) || '无预留'}
        </Typography.Text>
        <div className={styles.description}>资源预留</div>
      </div>
      <div className={styles.field}>
        <Typography.Text className={styles.label} ellipsis>
          {formatResources(container.limits) || '无上限'}
        </Typography.Text>
        <div className={styles.description}>资源上限</div>
      </div>
      <div className={styles.field}>
        <Typography.Text className={styles.label} ellipsis>
          {getPullPolicyLabel(container.imagePullPolicy)}
        </Typography.Text>
        <div className={styles.description}>镜像拉取策略</div>
      </div>
      <div className={styles.toggle}>
        {options?.toggleIcon ? (
          selectorOpen ? (
            <CaretUpOutlined />
          ) : (
            <CaretDownOutlined />
          )
        ) : (
          <CaretRightOutlined />
        )}
      </div>
    </button>
  );

  const renderConfigContent = (container: ManagedContainer) => {
    if (activeConfigKey === 'env') {
      return (
        <div className={styles.tabContent}>
          <KeyValueList
            itemBackgroundColor={token.colorBgContainer}
            items={container.env}
          />
        </div>
      );
    }

    if (activeConfigKey === 'ports') {
      return (
        <div className={styles.tabContent}>
          {container.ports.length > 0 ? (
            <div className={styles.portTable}>
              <div className={`${styles.portRow} ${styles.portHeader}`}>
                <div className={styles.portCell}>名称</div>
                <div className={styles.portCell}>协议</div>
                <div className={styles.portCell}>端口</div>
              </div>
              {container.ports.map((port) => (
                <div
                  className={styles.portRow}
                  key={`${port.name || ''}-${port.containerPort}-${
                    port.protocol || ''
                  }`}
                >
                  <Typography.Text className={styles.portCell} ellipsis>
                    {port.name || '-'}
                  </Typography.Text>
                  <div className={styles.portCell}>{port.protocol || '-'}</div>
                  <div className={styles.portCell}>
                    {port.containerPort || '-'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              className={styles.empty}
              description="暂无数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      );
    }

    return (
      <div className={styles.tabContent}>
        {container.mounts.length > 0 ? (
          <div className={styles.mountList}>
            {container.mounts.map((mount) => {
              const sourceLabel = getVolumeSourceLabel(mount.volumeType);
              const sourceValue = mount.volumeSource || '-';
              const mountPath = mount.mountPath || '-';

              return (
                <div
                  className={styles.mountCard}
                  key={`${mount.name || ''}-${mount.mountPath || ''}`}
                >
                  <div className={styles.mountInfo}>
                    <div className={styles.mountSummary}>
                      <span className={styles.mountIcon}>
                        {getVolumeIcon(mount.volumeType)}
                      </span>
                      <div className={styles.mountContent}>
                        <Tooltip title={mount.name || '-'}>
                          <Typography.Text
                            className={styles.mountTitle}
                            ellipsis
                          >
                            {mount.name || '-'}
                          </Typography.Text>
                        </Tooltip>
                        <div className={styles.mountDescription}>
                          卷类型：{sourceLabel}
                        </div>
                      </div>
                    </div>
                    <div className={styles.mountContent}>
                      <Tooltip title={sourceValue} placement="topLeft">
                        <Typography.Text className={styles.mountTitle} ellipsis>
                          {sourceValue}
                        </Typography.Text>
                      </Tooltip>
                      <div className={styles.mountDescription}>
                        {sourceLabel}
                      </div>
                    </div>
                  </div>
                  <div className={styles.mountRows}>
                    <div className={styles.mountRow}>
                      <CloudServerOutlined className={styles.mountRowIcon} />
                      <Tooltip
                        title={container.name || '-'}
                        placement="topLeft"
                      >
                        <Typography.Text className={styles.mountPath} ellipsis>
                          {container.name || '-'}
                        </Typography.Text>
                      </Tooltip>
                    </div>
                    <div className={styles.mountRow}>
                      <SettingOutlined className={styles.mountRowIcon} />
                      <Tooltip title={mountPath} placement="topLeft">
                        <Typography.Text className={styles.mountPath} ellipsis>
                          {mountPath}
                          {mount.subPath ? ` / ${mount.subPath}` : ''}
                          {mount.readOnly ? '（只读）' : ''}
                        </Typography.Text>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            className={styles.empty}
            description="暂无数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    );
  };

  return (
    <Spin spinning={loading}>
      <div className={styles.container}>
        {containers.length > 0 && activeContainer ? (
          <>
            <div className={styles.selector}>
              <div className={styles.selectorScroll}>
                {renderContainerRow(activeContainer, {
                  className: styles.selectedRow,
                  onClick: () => setSelectorOpen((open) => !open),
                  toggleIcon: true,
                })}
              </div>
              {selectorOpen ? (
                <div className={styles.selectorList}>
                  <div className={styles.selectorListScroll}>
                    {containers.map((container) =>
                      renderContainerRow(container, {
                        className: cx(
                          styles.row,
                          container.key === activeContainer.key &&
                            styles.activeRow,
                          container.key === activeContainer.key &&
                            styles.selectedIndicator,
                        ),
                        onClick: () => selectContainer(container),
                      }),
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            {activeContainer ? (
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <CaretDownOutlined />
                  容器: {activeContainer.name || '-'}
                </div>
                <SegmentedTabs
                  className={styles.configTabs}
                  items={containerConfigOptions}
                  onChange={setActiveConfigKey}
                  value={activeConfigKey}
                />
                {renderConfigContent(activeContainer)}
              </div>
            ) : null}
          </>
        ) : (
          <Empty
            className={styles.empty}
            description="暂无容器"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </Spin>
  );
};

export default ContainerStatusManagement;
