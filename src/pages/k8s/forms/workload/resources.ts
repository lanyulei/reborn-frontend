/** 向导里用到的集群候选项查询（全部经 shared/kube，失败时返回空，表单仍可手输） */
import { useEffect, useState } from 'react';
import { fetchObject, GVRS, listNames } from '../shared/kube';
import type { WorkloadConfigResourceType } from './types';

type ConfigResources = {
  configMaps: string[];
  secrets: string[];
  loading: boolean;
};

const EMPTY_CONFIG_RESOURCES: ConfigResources = {
  configMaps: [],
  secrets: [],
  loading: false,
};

/** 某命名空间下的配置字典与保密字典名称 */
const useConfigResources = (
  clusterId: string,
  namespace?: string,
  enabled = true,
): ConfigResources => {
  const [state, setState] = useState<ConfigResources>(EMPTY_CONFIG_RESOURCES);

  useEffect(() => {
    if (!namespace || !enabled) {
      setState(EMPTY_CONFIG_RESOURCES);
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));
    Promise.all([
      listNames(clusterId, GVRS.configMap, namespace),
      listNames(clusterId, GVRS.secret, namespace),
    ]).then(([configMaps, secrets]) => {
      if (!cancelled) {
        setState({ configMaps, secrets, loading: false });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [clusterId, enabled, namespace]);

  return state;
};

const keysOf = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value)
    : [];

/** 读取一个配置字典 / 保密字典里的键（列表行不含内容，需要取对象原文） */
const fetchConfigResourceKeys = async (
  clusterId: string,
  type: WorkloadConfigResourceType,
  name: string,
  namespace: string,
): Promise<string[]> => {
  const object = (await fetchObject(
    clusterId,
    type === 'secret' ? GVRS.secret : GVRS.configMap,
    name,
    namespace,
  )) as Record<string, unknown> | undefined;

  return Array.from(
    new Set([
      ...keysOf(object?.data),
      ...keysOf(object?.binaryData),
      ...keysOf(object?.stringData),
    ]),
  ).sort();
};

/** 某个配置字典 / 保密字典的键；未选择资源或读取失败时为空数组 */
const useConfigResourceKeys = (
  clusterId: string,
  namespace: string | undefined,
  type: WorkloadConfigResourceType | undefined,
  name: string | undefined,
): { keys: string[]; loading: boolean } => {
  const [state, setState] = useState<{ keys: string[]; loading: boolean }>({
    keys: [],
    loading: false,
  });

  useEffect(() => {
    if (!namespace || !type || !name) {
      setState({ keys: [], loading: false });
      return;
    }

    let cancelled = false;
    setState({ keys: [], loading: true });
    fetchConfigResourceKeys(clusterId, type, name, namespace).then((keys) => {
      if (!cancelled) {
        setState({ keys, loading: false });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [clusterId, name, namespace, type]);

  return state;
};

export { useConfigResourceKeys, useConfigResources };
