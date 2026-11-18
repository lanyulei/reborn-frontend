/**
 * 排空节点：选项 → 预览（将被驱逐 / 跳过 / 阻止排空的 Pod）→ 确认 → 流式展示进度。
 * 排空会先停止调度，再逐个驱逐 Pod（遵守 PodDisruptionBudget）。
 */
import {
  Alert,
  Button,
  Checkbox,
  Flex,
  Modal,
  Progress,
  Table,
  Tag,
} from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { getK8sErrorMessage, isChangeSubmitted } from '@/services/k8s/request';
import { previewDrainNode } from '@/services/k8s/resource';
import type {
  DrainOptions,
  DrainPod,
  DrainPreview,
  DrainProgress,
} from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { ApprovalNotice } from './approval';
import { useDangerConfirm } from './confirm';
import { keepStream } from './stream';

const ACTION_COLOR: Record<DrainPod['action'], string | undefined> = {
  evict: 'warning',
  skip: undefined,
  block: 'error',
};
const STATUS_COLOR: Record<DrainProgress['status'], string> = {
  evicted: 'success',
  pending: 'processing',
  failed: 'error',
};

type Phase = 'options' | 'running' | 'done' | 'failed';

export const DrainModal: React.FC<{
  clusterId: string;
  node: string;
  onClose: () => void;
  onDone?: () => void;
}> = ({ clusterId, node, onClose, onDone }) => {
  const t = useT();
  const confirm = useDangerConfirm();
  const [deleteEmptyDir, setDeleteEmptyDir] = useState(false);
  const [force, setForce] = useState(false);
  const [preview, setPreview] = useState<DrainPreview>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [phase, setPhase] = useState<Phase>('options');
  const [progress, setProgress] = useState<Record<string, DrainProgress>>({});
  const [counts, setCounts] = useState({ done: 0, total: 0 });
  const stopRef = useRef<() => void>(undefined);

  const options: DrainOptions = {
    name: node,
    deleteEmptyDir,
    force,
    gracePeriodSeconds: -1,
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    previewDrainNode(clusterId, options)
      .then((res) => {
        if (!cancelled) setPreview(res);
      })
      .catch((err) => {
        if (!cancelled) setError(getK8sErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clusterId, node, deleteEmptyDir, force]);

  useEffect(() => () => stopRef.current?.(), []);

  const start = () => {
    setPhase('running');
    setError(undefined);
    stopRef.current = keepStream({
      clusterId,
      path: '/node:drain',
      body: () => options,
      // 排空有副作用：任何中断都不自动重新发起
      reconnect: false,
      onEvent: (event) => {
        if (event.event !== 'progress') return;
        const item = event.data as DrainProgress;
        setProgress((prev) => ({
          ...prev,
          [`${item.namespace}/${item.name}`]: item,
        }));
        setCounts({ done: item.done, total: item.total });
      },
      onState: (state, detail) => {
        if (state === 'ended') {
          setPhase('done');
          onDone?.();
        } else if (state === 'failed') {
          if (isChangeSubmitted(detail?.error)) {
            // 该集群的变更需审批：已生成变更单（提示由审批条展示），不是排空失败
            onClose();
            return;
          }
          setPhase('failed');
          setError(getK8sErrorMessage(detail?.error));
          onDone?.();
        } else if (state === 'retrying') {
          // 排空不自动续接：连接中断或服务端报错即停止（已驱逐的不受影响），由用户决定是否重新排空
          stopRef.current?.();
          setPhase('failed');
          setError(
            detail?.error
              ? getK8sErrorMessage(detail.error)
              : t('pages.k8s.drain.interrupted'),
          );
          onDone?.();
        }
      },
    });
  };

  const pods = preview?.pods ?? [];
  const evictCount = pods.filter((pod) => pod.action === 'evict').length;
  const running = phase === 'running';

  return (
    <Modal
      open
      width={960}
      title={t('pages.k8s.drain.title', { name: node })}
      mask={{ closable: false }}
      closable={!running}
      keyboard={!running}
      onCancel={onClose}
      footer={
        <Flex justify="end" gap={8}>
          <Button disabled={running} onClick={onClose}>
            {t(
              phase === 'options'
                ? 'common.action.cancel'
                : 'pages.k8s.change.close',
            )}
          </Button>
          {phase === 'options' && (
            <Button
              type="primary"
              danger
              disabled={loading || !preview || preview.blocked}
              onClick={() =>
                confirm({
                  title: t('pages.k8s.drain.confirm.title', { name: node }),
                  content: t('pages.k8s.drain.confirm.content', {
                    count: evictCount,
                  }),
                  name: node,
                  onOk: start,
                })
              }
            >
              {t('pages.k8s.drain.start')}
            </Button>
          )}
        </Flex>
      }
    >
      <ApprovalNotice />
      {phase === 'options' ? (
        <>
          <Flex gap={24} style={{ marginBottom: 12 }}>
            <Checkbox
              checked={deleteEmptyDir}
              onChange={(event) => setDeleteEmptyDir(event.target.checked)}
            >
              {t('pages.k8s.drain.deleteEmptyDir')}
            </Checkbox>
            <Checkbox
              checked={force}
              onChange={(event) => setForce(event.target.checked)}
            >
              {t('pages.k8s.drain.force')}
            </Checkbox>
          </Flex>
          {error && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 12 }}
              title={error}
            />
          )}
          {preview?.blocked && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 12 }}
              title={t('pages.k8s.drain.blocked')}
            />
          )}
          <Table<DrainPod>
            size="small"
            loading={loading}
            rowKey={(pod) => `${pod.namespace}/${pod.name}`}
            dataSource={pods}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            columns={[
              {
                title: t('pages.k8s.column.namespace'),
                dataIndex: 'namespace',
              },
              { title: 'Pod', dataIndex: 'name' },
              {
                title: t('pages.k8s.drain.column.action'),
                dataIndex: 'action',
                width: 110,
                render: (_, pod) => (
                  <Tag color={ACTION_COLOR[pod.action]}>
                    {t(`pages.k8s.drain.action.${pod.action}`)}
                  </Tag>
                ),
              },
              {
                title: t('pages.k8s.drain.column.reason'),
                dataIndex: 'reason',
              },
            ]}
          />
        </>
      ) : (
        <>
          {error && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 12 }}
              title={error}
            />
          )}
          {phase === 'done' && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 12 }}
              title={t('pages.k8s.drain.done')}
            />
          )}
          <Progress
            percent={
              counts.total > 0
                ? Math.round((counts.done / counts.total) * 100)
                : phase === 'done'
                  ? 100
                  : 0
            }
            status={
              phase === 'failed' ? 'exception' : running ? 'active' : undefined
            }
            format={() => `${counts.done} / ${counts.total}`}
          />
          <Table<DrainProgress>
            size="small"
            style={{ marginTop: 12 }}
            rowKey={(item) => `${item.namespace}/${item.name}`}
            dataSource={Object.values(progress)}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            columns={[
              {
                title: t('pages.k8s.column.namespace'),
                dataIndex: 'namespace',
              },
              { title: 'Pod', dataIndex: 'name' },
              {
                title: t('common.column.status'),
                dataIndex: 'status',
                width: 110,
                render: (_, item) => (
                  <Tag color={STATUS_COLOR[item.status]}>
                    {t(`pages.k8s.drain.status.${item.status}`)}
                  </Tag>
                ),
              },
              {
                title: t('pages.k8s.drain.column.reason'),
                dataIndex: 'message',
              },
            ]}
          />
        </>
      )}
    </Modal>
  );
};
