/** 通用资源详情用到的关联数据：服务的端点、使用某个持久卷声明的容器组、存储类的供应者。 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { K8sObject, ListRow } from '@/services/k8s/typings';
import { fetchObject, GVRS, listRows } from '../../forms/shared/kube';
import type { ClusterServiceEndpointItem } from './types';

/** 分批并发取对象，避免一次打出上百个请求 */
const fetchObjects = async (
  clusterId: string,
  rows: ListRow[],
  namespace: string,
  gvr: Parameters<typeof fetchObject>[1],
) => {
  const out: K8sObject[] = [];
  for (let index = 0; index < rows.length; index += 10) {
    const batch = await Promise.all(
      rows
        .slice(index, index + 10)
        .map((row) => fetchObject(clusterId, gvr, row.name, namespace)),
    );
    out.push(...batch.filter((item) => item !== undefined));
  }
  return out;
};

/** 服务的端点：取自它的 EndpointSlice */
export const useServiceEndpoints = (
  clusterId: string,
  namespace: string | undefined,
  name: string,
  enabled: boolean,
) => {
  const [items, setItems] = useState<ClusterServiceEndpointItem[]>([]);
  useEffect(() => {
    if (!enabled || !namespace) return undefined;
    let cancelled = false;
    // 失败时请求层已提示；这里吞掉拒绝，避免留下未处理的 Promise
    (async () => {
      const rows = await listRows(clusterId, GVRS.endpointSlice, namespace, {
        labelSelector: `kubernetes.io/service-name=${name}`,
      });
      const slices = await fetchObjects(
        clusterId,
        rows,
        namespace,
        GVRS.endpointSlice,
      );
      if (cancelled) return;
      setItems(
        slices.flatMap((slice) => {
          const ports = Array.isArray(slice.ports) ? slice.ports : [];
          const endpoints = Array.isArray(slice.endpoints)
            ? (slice.endpoints as Record<string, unknown>[])
            : [];
          return endpoints.flatMap((endpoint) => {
            const target = endpoint.targetRef as
              | { kind?: string; name?: string }
              | undefined;
            const addresses = Array.isArray(endpoint.addresses)
              ? (endpoint.addresses as string[])
              : [];
            return addresses.map((ip) => ({
              ip,
              targetKind: target?.kind,
              targetName: target?.name,
              ports,
            }));
          });
        }),
      );
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [clusterId, enabled, name, namespace]);
  return items;
};

/**
 * 至多检查这么多个容器组（逐个读取卷定义）。列表接口没有按卷过滤的参数
 * （只有 labelSelector / keyword / state / node / owner），只能取回再筛。
 * 页面上的提示文案用到这个数，导出给页面，免得两处各写一个。
 */
export const CLAIM_POD_LIMIT = 100;

/** 使用了某个持久卷声明的容器组（名称清单） */
export const useClaimPods = (
  clusterId: string,
  namespace: string | undefined,
  claimName: string,
  enabled: boolean,
) => {
  const [state, setState] = useState<{
    loading: boolean;
    pods: ListRow[];
    truncated: boolean;
  }>({ loading: enabled, pods: [], truncated: false });

  /** 请求序号：只采纳最后一次加载的结果（切换对象 / 卸载后丢弃在途结果） */
  const seq = useRef(0);
  const reload = useCallback(async () => {
    if (!enabled || !namespace) return;
    const id = ++seq.current;
    setState((prev) => ({ ...prev, loading: true }));
    // 失败时请求层已提示；这里把 loading 收回去，否则页签一直转圈
    try {
      const rows = await listRows(clusterId, GVRS.pod, namespace);
      if (id !== seq.current) return;
      const checked = rows.slice(0, CLAIM_POD_LIMIT);
      const objects = await fetchObjects(
        clusterId,
        checked,
        namespace,
        GVRS.pod,
      );
      if (id !== seq.current) return;
      const using = new Set(
        objects
          .filter((pod) =>
            (Array.isArray(pod.spec?.volumes) ? pod.spec.volumes : []).some(
              (volume: { persistentVolumeClaim?: { claimName?: string } }) =>
                volume?.persistentVolumeClaim?.claimName === claimName,
            ),
          )
          .map((pod) => pod.metadata?.name),
      );
      setState({
        loading: false,
        pods: checked.filter((row) => using.has(row.name)),
        truncated: rows.length > CLAIM_POD_LIMIT,
      });
    } catch {
      if (id === seq.current) {
        setState((prev) => ({ ...prev, loading: false }));
      }
    }
  }, [claimName, clusterId, enabled, namespace]);

  useEffect(() => {
    void reload();
    return () => {
      seq.current += 1;
    };
  }, [reload]);

  return { ...state, reload };
};

/** 存储类的供应者（持久卷声明上没有记录时回退用） */
export const useStorageClassProvisioner = (
  clusterId: string,
  storageClassName?: string,
) => {
  const [provisioner, setProvisioner] = useState<string>();
  useEffect(() => {
    if (!storageClassName) return undefined;
    let cancelled = false;
    fetchObject(clusterId, GVRS.storageClass, storageClassName).then(
      (object) => {
        if (!cancelled && typeof object?.provisioner === 'string') {
          setProvisioner(object.provisioner);
        }
      },
      // 失败时请求层已提示；这里吞掉拒绝，避免留下未处理的 Promise
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [clusterId, storageClassName]);
  return provisioner;
};

/** 使用某个存储类的持久卷声明 */
export const useStorageClassClaims = (
  clusterId: string,
  storageClassName: string,
  enabled: boolean,
) => {
  const [state, setState] = useState<{ loading: boolean; rows: ListRow[] }>({
    loading: enabled,
    rows: [],
  });
  const reload = useCallback(async () => {
    if (!enabled) return;
    setState((prev) => ({ ...prev, loading: true }));
    // 失败时请求层已提示；这里把 loading 收回去，否则页签一直转圈
    try {
      const rows = await listRows(clusterId, GVRS.pvc);
      setState({
        loading: false,
        rows: rows.filter(
          (row) => row.cells?.storageClass === storageClassName,
        ),
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [clusterId, enabled, storageClassName]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { ...state, reload };
};
