/** 工作负载的容器组：按选择器列出 Pod，并补上所在节点的内网 IP。 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ResourceRef } from '@/services/k8s/typings';
import { usePodSelector } from '../../components/Insight';
import { GVRS, listRows } from '../../forms/shared/kube';
import type { WorkloadKind } from '../../forms/workload/types';
import { matchWorkloadPod, toWorkloadPod, type WorkloadPod } from './helpers';

/** 节点名 → 内网 IP（无权查看节点时为空表，节点 IP 一列留空） */
const useNodeIPs = (clusterId: string): Record<string, string> => {
  const [ips, setIPs] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    listRows(clusterId, GVRS.node).then((rows) => {
      if (cancelled) return;
      setIPs(
        Object.fromEntries(
          rows.flatMap((row) => {
            const ip = row.cells?.internalIP;
            return typeof ip === 'string' && ip ? [[row.name, ip]] : [];
          }),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [clusterId]);
  return ips;
};

const useWorkloadPods = (
  clusterId: string,
  kind: WorkloadKind,
  ref: ResourceRef,
  /** 对象自己的 matchLabels：服务端解析结果回来之前（或解析失败时）先用它；对象未取到时为 undefined */
  fallbackSelector?: string,
) => {
  // 选择器由服务端解析（含 matchExpressions）
  const selector = usePodSelector(clusterId, ref, true);
  const nodeIPs = useNodeIPs(clusterId);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listRows>>>([]);
  const labelSelector = selector
    ? selector.empty
      ? ''
      : selector.labelSelector
    : fallbackSelector;
  const namespace = ref.namespace;
  const name = ref.name ?? '';

  const reload = useCallback(async () => {
    // 选择器还不知道：保持加载中
    if (labelSelector === undefined) return;
    if (!labelSelector || !namespace) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(
        await listRows(clusterId, GVRS.pod, namespace, { labelSelector }),
      );
    } finally {
      setLoading(false);
    }
  }, [clusterId, labelSelector, namespace]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const pods = useMemo<WorkloadPod[]>(
    () =>
      rows
        .filter((row) => matchWorkloadPod(row.name, kind, name))
        .map((row) => toWorkloadPod(row, nodeIPs)),
    [rows, kind, name, nodeIPs],
  );

  return { loading, pods, reload };
};

export default useWorkloadPods;
