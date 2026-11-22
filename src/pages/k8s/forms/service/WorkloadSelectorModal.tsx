import { AppstoreOutlined } from '@ant-design/icons';
import { Button, Empty, Modal, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/utils/i18n';
import { fetchObject, GVRS, listRows } from '../shared/kube';
import SegmentedTabs from '../shared/SegmentedTabs';
import { getWorkloadSelectorDetail } from './helpers';
import type { WorkloadSelectorItem, WorkloadSelectorType } from './types';

export type WorkloadSelectorTab = {
  label: string;
  value: WorkloadSelectorType;
};

const WORKLOAD_GVRS = {
  Deployment: GVRS.deployment,
  StatefulSet: GVRS.statefulSet,
  DaemonSet: GVRS.daemonSet,
} as const;

const useStyles = createStyles(({ token }) => ({
  hint: {
    marginBottom: token.marginSM,
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  tabs: {
    marginBottom: token.marginSM,
  },
  list: {
    minHeight: 188,
    maxHeight: 280,
    overflow: 'auto',
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
    width: '100%',
    padding: `${token.paddingXS}px ${token.paddingSM}px`,
    border: 0,
    borderRadius: token.borderRadiusSM,
    background: 'transparent',
    color: token.colorText,
    cursor: 'pointer',
    textAlign: 'left',

    '&:hover': {
      background: token.colorFillQuaternary,
    },
  },
  selectedItem: {
    '&&': {
      background: token.colorPrimaryBg,
      color: token.colorPrimaryText,
    },
  },
  icon: {
    color: token.colorTextSecondary,
  },
  itemNamespace: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
}));

type WorkloadSelectorModalProps = {
  clusterId: string;
  /** 确认时是否读取所选工作负载的标签、选择器与容器端口（只需要名称时关掉） */
  detail?: boolean;
  hint?: string;
  namespace?: string;
  open: boolean;
  tabs?: WorkloadSelectorTab[];
  title?: string;
  onCancel: () => void;
  onOk: (workload: WorkloadSelectorItem) => void;
};

const WorkloadSelectorModal = ({
  clusterId,
  detail = true,
  hint,
  namespace,
  open,
  tabs,
  title,
  onCancel,
  onOk,
}: WorkloadSelectorModalProps) => {
  const { styles, cx } = useStyles();
  const t = useT();
  const enabledTabs = useMemo<WorkloadSelectorTab[]>(
    () =>
      tabs && tabs.length > 0
        ? tabs
        : [
            { label: t('pages.k8s.kind.Deployment'), value: 'Deployment' },
            { label: t('pages.k8s.kind.StatefulSet'), value: 'StatefulSet' },
            { label: t('pages.k8s.kind.DaemonSet'), value: 'DaemonSet' },
          ],
    [t, tabs],
  );
  const [activeType, setActiveType] = useState<WorkloadSelectorType>(
    enabledTabs[0].value,
  );
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [items, setItems] = useState<WorkloadSelectorItem[]>([]);
  const [selected, setSelected] = useState<WorkloadSelectorItem>();

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveType(enabledTabs[0].value);
    setSelected(undefined);
  }, [enabledTabs, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let ignore = false;
    setLoading(true);
    setSelected(undefined);
    setItems([]);
    listRows(clusterId, WORKLOAD_GVRS[activeType], namespace)
      .then((rows) => {
        if (!ignore) {
          setItems(
            rows.map((row) => ({
              id: row.uid || `${row.namespace}-${row.name}`,
              name: row.name,
              namespace: row.namespace,
              type: activeType,
            })),
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeType, clusterId, namespace, open]);

  // 列表行不含对象内容：确认时再读取所选工作负载的标签、选择器与容器端口
  const handleOk = async () => {
    if (!selected) {
      return;
    }
    if (!detail) {
      onOk(selected);
      return;
    }

    setConfirming(true);
    try {
      const object = await fetchObject(
        clusterId,
        WORKLOAD_GVRS[selected.type],
        selected.name,
        selected.namespace,
      );
      onOk({ ...selected, ...getWorkloadSelectorDetail(object) });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal
      destroyOnHidden
      footer={
        <div className={styles.footer}>
          <Button onClick={onCancel}>{t('common.action.cancel')}</Button>
          <Button
            disabled={!selected}
            loading={confirming}
            type="primary"
            onClick={handleOk}
          >
            {t('common.action.confirm')}
          </Button>
        </div>
      }
      open={open}
      title={title ?? t('pages.k8s.forms.service.workloadSelector.pick')}
      width={520}
      onCancel={onCancel}
    >
      <div className={styles.hint}>
        {hint ?? t('pages.k8s.forms.service.workloadSelector.hint')}
      </div>
      <SegmentedTabs
        className={styles.tabs}
        items={enabledTabs}
        value={activeType}
        width="100%"
        onChange={setActiveType}
      />
      <div className={styles.list}>
        <Spin spinning={loading}>
          {!items.length && !loading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('pages.k8s.metrics.noData')}
            />
          ) : (
            items.map((item) => (
              <button
                className={cx(
                  styles.item,
                  selected?.id === item.id && styles.selectedItem,
                )}
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
              >
                <AppstoreOutlined className={styles.icon} />
                <span>{item.name}</span>
                {!namespace && item.namespace && (
                  <span className={styles.itemNamespace}>{item.namespace}</span>
                )}
              </button>
            ))
          )}
        </Spin>
      </div>
    </Modal>
  );
};

export default WorkloadSelectorModal;
