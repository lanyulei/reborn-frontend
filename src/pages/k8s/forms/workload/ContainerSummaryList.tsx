import {
  CodeSandboxOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DockerOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { createStyles } from 'antd-style';

type ContainerSummaryItem = {
  cpuLimit?: number;
  cpuRequest?: number;
  image?: string;
  key: string;
  memoryLimit?: number;
  memoryRequest?: number;
  name?: string;
};

type ContainerSummaryListProps = {
  addDescription?: string;
  items: ContainerSummaryItem[];
  onAdd: () => void;
  /** 删除容器；不传则不显示删除按钮。只剩一个容器时不可删除 */
  onDelete?: (item: ContainerSummaryItem, index: number) => void;
  onEdit: (item: ContainerSummaryItem, index: number) => void;
  showAdd?: boolean;
};

const useStyles = createStyles(({ token }) => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: token.marginXS,
  },
  deleteButton: {
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  item: {
    display: 'grid',
    width: '100%',
    minHeight: 64,
    gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, auto)',
    alignItems: 'center',
    gap: token.marginLG,
    padding: `${token.paddingSM}px ${token.paddingLG}px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,
    cursor: 'pointer',
    textAlign: 'left',
    transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}`,

    '&:hover': {
      borderColor: token.colorPrimaryBorder,
      background: token.colorFillQuaternary,
    },

    '&:focus-visible': {
      borderColor: token.colorPrimary,
      outline: `2px solid ${token.colorPrimaryBorder}`,
      outlineOffset: 1,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      alignItems: 'flex-start',
      gap: token.marginSM,
    },
  },
  main: {
    display: 'flex',
    minWidth: 0,
    alignItems: 'center',
    gap: token.marginMD,
  },
  icon: {
    flex: '0 0 auto',
    color: token.colorText,
    fontSize: 34,
    lineHeight: 1,
  },
  content: {
    minWidth: 0,
  },
  name: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  image: {
    overflow: 'hidden',
    marginTop: 2,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  resources: {
    display: 'flex',
    minWidth: 0,
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: `${token.marginSM}px ${token.marginLG}px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,

    '@media (max-width: 768px)': {
      justifyContent: 'flex-start',
      paddingLeft: 48,
    },

    '@media (max-width: 576px)': {
      paddingLeft: 0,
    },
  },
  metric: {
    display: 'inline-flex',
    minWidth: 0,
    alignItems: 'center',
    gap: token.marginXS,
    whiteSpace: 'nowrap',
  },
  metricIcon: {
    color: token.colorTextSecondary,
    fontSize: 16,
  },
  memoryIcon: {
    transform: 'rotate(-45deg)',
  },
  emptyMetric: {
    color: token.colorText,
  },
  add: {
    display: 'flex',
    width: '100%',
    minHeight: 82,
    alignItems: 'center',
    padding: `${token.paddingMD}px 64px`,
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,
    cursor: 'pointer',
    textAlign: 'left',
    transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}`,
    justifyContent: 'space-evenly',

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorFillQuaternary,
    },

    '&:focus-visible': {
      borderColor: token.colorPrimary,
      outline: `2px solid ${token.colorPrimaryBorder}`,
      outlineOffset: 1,
    },

    '@media (max-width: 576px)': {
      padding: token.paddingMD,
    },
  },
  addContent: {
    display: 'inline-flex',
    minWidth: 0,
    alignItems: 'center',
    gap: token.marginMD,
  },
  addIcon: {
    flex: '0 0 auto',
    color: token.colorText,
    fontSize: 40,
    lineHeight: 1,
  },
  addText: {
    display: 'inline-flex',
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: token.marginXXS,
  },
  addTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  addDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
}));

const isValidNumber = (value?: number): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const formatNumber = (value: number) =>
  Number.isInteger(value) ? `${value}` : `${value}`;

const formatMemory = (value: number) => `${formatNumber(value)} MiB`;

const formatCpuRange = (request?: number, limit?: number) => {
  if (!isValidNumber(request) && !isValidNumber(limit)) {
    return undefined;
  }

  if (isValidNumber(request) && isValidNumber(limit)) {
    return `${formatNumber(request)} - ${formatNumber(limit)}`;
  }

  return isValidNumber(limit)
    ? `<= ${formatNumber(limit)}`
    : `${formatNumber(request || 0)} - 无上限`;
};

const formatMemoryRange = (request?: number, limit?: number) => {
  if (!isValidNumber(request) && !isValidNumber(limit)) {
    return undefined;
  }

  if (isValidNumber(request) && isValidNumber(limit)) {
    return `${formatMemory(request)} - ${formatMemory(limit)}`;
  }

  return isValidNumber(limit)
    ? `<= ${formatMemory(limit)}`
    : `${formatMemory(request || 0)} - 无上限`;
};

const ContainerSummaryList = ({
  addDescription = '自定义容器的设置以创建容器',
  items,
  onAdd,
  onDelete,
  onEdit,
  showAdd = true,
}: ContainerSummaryListProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.list}>
      {items.map((item, index) => {
        const cpuText = formatCpuRange(item.cpuRequest, item.cpuLimit);
        const memoryText = formatMemoryRange(
          item.memoryRequest,
          item.memoryLimit,
        );

        return (
          <div className={styles.row} key={item.key}>
            <Tooltip title="编辑容器配置">
              <button
                aria-label={`编辑 ${item.name || '容器'} 配置`}
                className={styles.item}
                type="button"
                onClick={() => onEdit(item, index)}
              >
                <div className={styles.main}>
                  <DockerOutlined className={styles.icon} />
                  <div className={styles.content}>
                    <div className={styles.name}>{item.name || '新容器'}</div>
                    <div className={styles.image}>
                      镜像： {item.image || '未填写'}
                    </div>
                  </div>
                </div>
                <div className={styles.resources}>
                  {cpuText ? (
                    <span className={styles.metric}>
                      <CodeSandboxOutlined className={styles.metricIcon} />
                      {cpuText}
                    </span>
                  ) : null}
                  {memoryText ? (
                    <span className={styles.metric}>
                      <DatabaseOutlined
                        className={`${styles.metricIcon} ${styles.memoryIcon}`}
                      />
                      {memoryText}
                    </span>
                  ) : null}
                  {!cpuText && !memoryText ? (
                    <span className={`${styles.metric} ${styles.emptyMetric}`}>
                      <ExclamationCircleOutlined
                        className={styles.metricIcon}
                      />
                      无资源上限
                    </span>
                  ) : null}
                </div>
              </button>
            </Tooltip>
            {onDelete && (
              <Tooltip
                title={items.length <= 1 ? '至少保留一个容器' : '删除容器'}
              >
                <Button
                  aria-label={`删除 ${item.name || '容器'}`}
                  className={styles.deleteButton}
                  disabled={items.length <= 1}
                  icon={<DeleteOutlined />}
                  type="text"
                  onClick={() => onDelete(item, index)}
                />
              </Tooltip>
            )}
          </div>
        );
      })}
      {showAdd ? (
        <button className={styles.add} type="button" onClick={onAdd}>
          <span className={styles.addContent}>
            <DockerOutlined className={styles.addIcon} />
            <span className={styles.addText}>
              <span className={styles.addTitle}>添加容器</span>
              <span className={styles.addDescription}>{addDescription}</span>
            </span>
          </span>
        </button>
      ) : null}
    </div>
  );
};

export type { ContainerSummaryItem };
export default ContainerSummaryList;
