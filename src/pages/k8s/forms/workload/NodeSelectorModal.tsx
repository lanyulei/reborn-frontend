import { ClusterOutlined } from '@ant-design/icons';
import { Checkbox, Empty, Modal, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import type { Translate } from '@/utils/i18n';
import { useT } from '@/utils/i18n';
import { GVRS, listRows } from '../shared/kube';
import { useWizardScope } from './context';

type NodeStatusType = 'default' | 'error' | 'success' | 'warning';

/** 节点候选项（取自资源列表行） */
type NodeOption = {
  uid: string;
  name: string;
  ip: string;
  roles: string[];
  statusLabel: string;
  statusType: NodeStatusType;
};

const getNodeRoleLabel = (role: string, t: Translate) => {
  const normalizedRole = role.trim().toLowerCase();

  if (normalizedRole === 'control-plane' || normalizedRole === 'master') {
    return t('pages.k8s.forms.workload.node.role.controlPlane');
  }
  if (normalizedRole === 'worker') {
    return t('pages.k8s.forms.workload.node.role.worker');
  }
  return role;
};

/** 列表行的状态（ok / pending / abnormal / unknown）→ 展示文案与颜色 */
const getNodeStatus = (
  state: string | undefined,
  t: Translate,
): Pick<NodeOption, 'statusLabel' | 'statusType'> => {
  switch (state) {
    case 'ok':
      return {
        statusLabel: t('pages.k8s.metrics.series.running'),
        statusType: 'success',
      };
    case 'pending':
      return {
        statusLabel: t('pages.k8s.forms.workload.node.status.unschedulable'),
        statusType: 'warning',
      };
    case 'abnormal':
      return {
        statusLabel: t('pages.k8s.state.abnormal'),
        statusType: 'error',
      };
    case 'unknown':
      return { statusLabel: t('pages.k8s.state.unknown'), statusType: 'error' };
    default:
      return { statusLabel: '-', statusType: 'default' };
  }
};

const useStyles = createStyles(({ token }) => ({
  description: {
    marginBottom: token.marginSM,
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  list: {
    maxHeight: 360,
    overflowY: 'auto',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  nodeItem: {
    display: 'grid',
    gridTemplateColumns:
      '28px 28px minmax(160px, 1.2fr) minmax(100px, 0.8fr) minmax(120px, 0.8fr)',
    alignItems: 'center',
    gap: token.marginSM,
    width: '100%',
    minHeight: 58,
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',

    '& + &': {
      borderTop: `1px solid ${token.colorBorderSecondary}`,
    },

    '&:hover': {
      background: token.colorFillQuaternary,
    },

    '@media (max-width: 576px)': {
      gridTemplateColumns: '28px 28px minmax(0, 1fr)',
    },
  },
  nodeItemDisabled: {
    cursor: 'not-allowed',
    opacity: 0.58,

    '&:hover': {
      background: 'transparent',
    },
  },
  nodeIcon: {
    color: token.colorTextSecondary,
    fontSize: 16,
  },
  nodeName: {
    display: 'flex',
    minWidth: 0,
    flexDirection: 'column',
    gap: 2,
  },
  nodeNameText: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  nodeIp: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  field: {
    display: 'flex',
    minWidth: 0,
    flexDirection: 'column',
    gap: 2,

    '@media (max-width: 576px)': {
      gridColumn: '3 / -1',
    },
  },
  statusValue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    flex: '0 0 auto',
    borderRadius: '50%',
  },
  statusDotDefault: {
    backgroundColor: token.colorTextQuaternary,
    boxShadow: `0 0 0 3px ${token.colorFillSecondary}`,
  },
  statusDotError: {
    backgroundColor: token.colorError,
    boxShadow: `0 0 0 3px ${token.colorErrorBg}`,
  },
  statusDotSuccess: {
    backgroundColor: token.colorSuccess,
    boxShadow: `0 0 0 3px ${token.colorSuccessBg}`,
  },
  statusDotWarning: {
    backgroundColor: token.colorWarning,
    boxShadow: `0 0 0 3px ${token.colorWarningBg}`,
  },
  fieldLabel: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  roleValue: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: `${token.paddingXL}px 0`,
  },
}));

type NodeSelectorModalProps = {
  open: boolean;
  selectedNodeNames?: string[];
  onCancel: () => void;
  onOk: (nodeNames: string[]) => void;
};

const NodeSelectorModal = ({
  open,
  selectedNodeNames = [],
  onCancel,
  onOk,
}: NodeSelectorModalProps) => {
  const { styles } = useStyles();
  const t = useT();
  const { clusterId } = useWizardScope();
  const [nodes, setNodes] = useState<NodeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [draftSelectedNodeNames, setDraftSelectedNodeNames] =
    useState<string[]>(selectedNodeNames);
  const statusDotClassNames: Record<NodeStatusType, string> = {
    default: styles.statusDotDefault,
    error: styles.statusDotError,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };

  // 用内容而不是数组引用做依赖：调用方每次渲染可能传入新的空数组
  const selectedKey = selectedNodeNames.join('\n');

  useEffect(() => {
    if (!open) {
      return;
    }

    let ignore = false;
    setLoading(true);
    setDraftSelectedNodeNames(selectedKey ? selectedKey.split('\n') : []);
    listRows(clusterId, GVRS.node).then((rows) => {
      if (ignore) {
        return;
      }
      setNodes(
        rows.map((row) => ({
          uid: row.uid || row.name,
          name: row.name,
          ip:
            typeof row.cells?.internalIP === 'string' && row.cells.internalIP
              ? row.cells.internalIP
              : '-',
          roles: Array.isArray(row.cells?.roles)
            ? row.cells.roles.map(String)
            : [],
          ...getNodeStatus(row.state, t),
        })),
      );
      setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [clusterId, open, selectedKey, t]);

  const toggleNode = (nodeName: string, checked: boolean) => {
    setDraftSelectedNodeNames((current) =>
      checked
        ? Array.from(new Set([...current, nodeName]))
        : current.filter((item) => item !== nodeName),
    );
  };

  const renderNodeItem = (node: NodeOption) => {
    const nodeName = node.name;
    const disabled = node.statusType !== 'success';
    const checked = draftSelectedNodeNames.includes(nodeName);
    const roles = node.roles.map((role) => getNodeRoleLabel(role, t));
    const checkboxId = `node-selector-${node.uid.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

    return (
      <label
        className={[
          styles.nodeItem,
          disabled ? styles.nodeItemDisabled : '',
        ].join(' ')}
        htmlFor={checkboxId}
        key={node.uid}
      >
        <Checkbox
          checked={checked}
          disabled={disabled}
          id={checkboxId}
          onChange={(event) => toggleNode(nodeName, event.target.checked)}
        />
        <ClusterOutlined className={styles.nodeIcon} />
        <span className={styles.nodeName}>
          <span className={styles.nodeNameText}>{node.name}</span>
          <span className={styles.nodeIp}>{node.ip}</span>
        </span>
        <span className={styles.field}>
          <span className={styles.statusValue}>
            <span
              className={[
                styles.statusDot,
                statusDotClassNames[node.statusType],
              ].join(' ')}
            />
            {node.statusLabel}
          </span>
          <span className={styles.fieldLabel}>{t('common.column.status')}</span>
        </span>
        <span className={styles.field}>
          <span className={styles.roleValue}>
            {roles.length > 0
              ? roles.join(t('pages.k8s.forms.workload.listSeparator'))
              : '-'}
          </span>
          <span className={styles.fieldLabel}>{t('pages.k8s.kind.Role')}</span>
        </span>
      </label>
    );
  };

  return (
    <Modal
      destroyOnHidden
      cancelText={t('common.action.cancel')}
      okText={t('common.action.confirm')}
      open={open}
      title={t('pages.k8s.forms.workload.node.assign')}
      width={600}
      onCancel={onCancel}
      onOk={() => onOk(draftSelectedNodeNames)}
    >
      <div className={styles.description}>
        {t('pages.k8s.forms.workload.node.assign.description')}
      </div>
      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>
            <Spin />
          </div>
        ) : nodes.length > 0 ? (
          nodes.map(renderNodeItem)
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </Modal>
  );
};

export type { NodeSelectorModalProps };
export default NodeSelectorModal;
