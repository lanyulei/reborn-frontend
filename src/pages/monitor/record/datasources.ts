/**
 * 记录规则抽屉可选的数据源。记录规则经数据源的 Remote Write 地址写回，但候选接口
 * （datasource-option，记录规则菜单唯一能调的数据源接口）不带「是否配置了写入地址」：
 * - 同时有数据源管理菜单的用户：取数据源列表，只提供配置了 Remote Write 地址的（filtered = true）；
 * - 其余用户：提供全部已启用的候选，选中后由抽屉立即调校验接口确认可写。
 */
import { useAccess } from '@umijs/max';
import { useEffect, useMemo, useState } from 'react';
import { listDatasources } from '@/services/monitor/datasource';
import { monitorRequest } from '@/services/monitor/request';
import type {
  MonitorDatasource,
  RecordRuleSpec,
  RecordRuleValidateResult,
} from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import type { DatasourceOptionsState } from '../components/hooks';
import { NO_WRITE_URL } from './meta';

/** 数据源列表每页条数（后端上限）与至多翻的页数 */
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

const loadAllDatasources = async (): Promise<MonitorDatasource[]> => {
  const all: MonitorDatasource[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await listDatasources({ page, pageSize: PAGE_SIZE });
    const items = result.items ?? [];
    all.push(...items);
    if (items.length < PAGE_SIZE || all.length >= Number(result.total ?? 0)) {
      break;
    }
  }
  return all;
};

export const useWritableDatasources = (datasources: DatasourceOptionsState) => {
  const t = useT();
  const access = useAccess();
  const canList = access.canMonitorDatasource === true;
  const [list, setList] = useState<MonitorDatasource[]>();
  // 列表取不到（失败提示由请求层弹出）时退回候选接口的做法
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!canList) return;
    let cancelled = false;
    loadAllDatasources()
      .then((items) => {
        if (!cancelled) setList(items);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [canList]);

  return useMemo(() => {
    const filtered = canList && !failed;
    if (!filtered) {
      const enabled = new Set(
        datasources.items.filter((item) => item.enabled).map((item) => item.id),
      );
      return {
        filtered,
        loaded: datasources.loaded,
        options: datasources.options.filter((option) =>
          enabled.has(option.value),
        ),
      };
    }
    return {
      filtered,
      loaded: list !== undefined,
      options: (list ?? [])
        .filter((item) => !!item.spec.remoteWriteUrl)
        .map((item) => ({
          value: item.id,
          label: [
            item.spec.name,
            item.spec.isDefault && t('pages.monitor.datasource.defaultSuffix'),
            !item.spec.enabled && t('pages.monitor.datasource.disabledSuffix'),
          ]
            .filter(Boolean)
            .join(' '),
        })),
    };
  }, [canList, failed, list, datasources, t]);
};

/**
 * 所选数据源能否用于记录规则：静默调校验接口，只看数据源一项的结论（表单其余内容多半还没填完，
 * 那些问题留给「校验」按钮与保存）。请求本身失败（如内容还过不了参数校验）时不下结论。
 */
export const probeDatasourceWritable = async (
  spec: RecordRuleSpec,
  id?: string,
): Promise<boolean | undefined> => {
  try {
    const result = await monitorRequest<RecordRuleValidateResult>(
      '/api/v1/monitor/record-rule:validate',
      { method: 'POST', data: { spec, ...(id ? { id } : {}) }, silent: true },
    );
    return !(result.issues ?? []).some(
      (issue) => issue.reason === NO_WRITE_URL,
    );
  } catch {
    return undefined;
  }
};
