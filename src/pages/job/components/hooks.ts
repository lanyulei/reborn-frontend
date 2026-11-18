/**
 * 作业中心页面共享 hook：项目 / 凭据 / 区域选项，页面可见性，随时间跳动的「当前时刻」，
 * 自动刷新的表格请求。
 */
import { App } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listJobCredentialOptions } from '@/services/job/credential';
import { listJobProjectOptions } from '@/services/job/project';
import { getErrorStatus, getJobErrorMessage } from '@/services/job/request';
import { listJobRunnerZones } from '@/services/job/runner';
import type {
  JobCredentialOption,
  JobProjectOption,
} from '@/services/job/typings';
import type { PagedResult } from '@/services/system/typings';
import { useT } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { BECOME_METHOD_META, CREDENTIAL_TYPE_META, toBecomeKey } from './meta';

/** 加载一次的选项列表；失败静默为空 */
const useLoadOnce = <T>(load: () => Promise<T[]>): T[] => {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    let cancelled = false;
    load()
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return items;
};

const loadProjects = async () => (await listJobProjectOptions()).items ?? [];
const loadCredentials = async () =>
  (await listJobCredentialOptions()).items ?? [];
const loadZones = async () => (await listJobRunnerZones()).zones ?? [];

/** 项目下拉选项 */
export const useProjectOptions = (): JobProjectOption[] =>
  useLoadOnce(loadProjects);

/** 凭据下拉选项 */
export const useCredentialOptions = (): JobCredentialOption[] =>
  useLoadOnce(loadCredentials);

/** 凭据下拉选项，标签含类型、登录用户名与提权方式（作业模板、快速执行共用） */
export const useCredentialSelectOptions = () => {
  const t = useT();
  const credentials = useCredentialOptions();
  const options = useMemo(
    () =>
      credentials.map((credential) => ({
        value: credential.id,
        label: [
          credential.name,
          credential.type
            ? t(CREDENTIAL_TYPE_META[credential.type].textId)
            : '',
          credential.username ?? '',
          toBecomeKey(credential.becomeMethod) === 'none'
            ? ''
            : t(
                BECOME_METHOD_META[toBecomeKey(credential.becomeMethod)].textId,
              ),
        ]
          .filter(Boolean)
          .join(' · '),
      })),
    [credentials, t],
  );
  return { credentials, options };
};

/** 已登记的执行节点区域 → AutoComplete 选项 */
export const useZoneOptions = () => {
  const zones = useLoadOnce(loadZones);
  return useMemo(() => zones.map((zone) => ({ value: zone })), [zones]);
};

/** 页面（浏览器标签页）是否可见；轮询只在可见时进行 */
export const usePageVisible = (): boolean => {
  const [visible, setVisible] = useState(
    () => document.visibilityState === 'visible',
  );
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
};

/** 每 intervalMs 更新一次的当前时刻（毫秒）；enabled 为 false 时停止跳动 */
export const useNow = (enabled: boolean, intervalMs = 1000): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [enabled, intervalMs]);
  return now;
};

/**
 * 自动刷新的表格请求包装：请求层静默，连续失败只提示一次；失败时返回 success: false，
 * ProTable 保留上次的数据并继续轮询。
 */
export const usePolledRequest = () => {
  const { message } = App.useApp();
  const failing = useRef(false);
  return useCallback(
    async <T>(load: () => Promise<PagedResult<T>>) => {
      try {
        const result = await load();
        failing.current = false;
        return toTableResult(result);
      } catch (error) {
        if (!failing.current && getErrorStatus(error) !== 401) {
          message.error(getJobErrorMessage(error));
        }
        failing.current = true;
        return { data: [] as T[], total: 0, success: false };
      }
    },
    [message],
  );
};
