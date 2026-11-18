/**
 * MonitorDatasourceService 监控数据源：登记 Prometheus 兼容时序库的查询地址，供规则评估与
 * 即时查询使用。凭据只写不读；健康状态由评估引擎定期探活。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { normalizeQueryResult } from './normalize';
import { monitorRequest } from './request';
import type {
  DatasourceConnection,
  DatasourceOption,
  DatasourceSpec,
  DatasourceTestResult,
  MonitorDatasource,
  MonitorHealthStatus,
  QueryResult,
} from './typings';

/**
 * 请求头值的掩码：响应里请求头的值一律是它（键名原样）。编辑或带 id 测试时把它原样传回
 * 表示沿用该键已保存的值；传别的值即改值，去掉键即删除。
 */
export const HEADER_VALUE_MASK = '******';

export interface ListDatasourcesParams extends PageQuery {
  enabled?: boolean;
  healthStatus?: MonitorHealthStatus;
}

/** ListDatasources 分页查询数据源 */
export async function listDatasources(
  params: ListDatasourcesParams,
): Promise<PagedResult<MonitorDatasource>> {
  return monitorRequest<PagedResult<MonitorDatasource>>(
    '/api/v1/monitor/datasource',
    { method: 'GET', params },
  );
}

/** GetDatasource 查询数据源详情 */
export async function getDatasource(
  id: string,
): Promise<{ datasource: MonitorDatasource }> {
  return monitorRequest<{ datasource: MonitorDatasource }>(
    `/api/v1/monitor/datasource/${id}`,
    { method: 'GET' },
  );
}

/** CreateDatasource 新建数据源；名称重复 409 */
export async function createDatasource(
  spec: DatasourceSpec,
): Promise<{ datasource: MonitorDatasource }> {
  return monitorRequest<{ datasource: MonitorDatasource }>(
    '/api/v1/monitor/datasource',
    { method: 'POST', data: { spec } },
  );
}

/**
 * UpdateDatasource 编辑数据源（整体替换；凭据不传、请求头值传掩码则保留原值）；version 不一致 409。
 * 地址的协议 / 主机 / 端口变了就不能沿用，须重新填写（400 MONITOR_DATASOURCE_SECRET_REQUIRED）
 */
export async function updateDatasource(
  id: string,
  body: { spec: DatasourceSpec; version: number },
): Promise<{ datasource: MonitorDatasource }> {
  return monitorRequest<{ datasource: MonitorDatasource }>(
    `/api/v1/monitor/datasource/${id}`,
    { method: 'PUT', data: body },
  );
}

/** DeleteDatasource 删除数据源；仍被规则指定使用时 409（调用方自行展示原因） */
export async function deleteDatasource(id: string): Promise<void> {
  await monitorRequest<void>(`/api/v1/monitor/datasource/${id}`, {
    method: 'DELETE',
    silent: true,
  });
}

/** TestDatasourceConfig 测试尚未保存的连接配置；连接失败不报错，结果在 ok / error 里 */
export async function testDatasourceConfig(body: {
  connection: DatasourceConnection;
  /** 正在编辑的数据源；给出时未传的 secret、传掩码的请求头值沿用已保存的 */
  id?: string;
}): Promise<DatasourceTestResult> {
  return monitorRequest<DatasourceTestResult>(
    '/api/v1/monitor/datasource:test',
    { method: 'POST', data: body },
  );
}

/** TestDatasource 测试已保存的数据源，并把结果写入其健康状态 */
export async function testDatasource(
  id: string,
): Promise<DatasourceTestResult> {
  return monitorRequest<DatasourceTestResult>(
    `/api/v1/monitor/datasource/${id}:test`,
    { method: 'POST', data: {} },
  );
}

/** ListDatasourceOptions 数据源下拉选项（缺省数据源在前） */
export async function listDatasourceOptions(
  enabledOnly?: boolean,
): Promise<{ items?: DatasourceOption[] }> {
  return monitorRequest<{ items?: DatasourceOption[] }>(
    '/api/v1/monitor/datasource-option',
    {
      method: 'GET',
      params: { enabledOnly: enabledOnly || undefined },
      silent: true,
    },
  );
}

/** QueryDatasource 即时查询；失败由调用方展示（PromQL 有误 400 / 数据源不可达 502） */
export async function queryDatasource(body: {
  datasourceId: string;
  expr: string;
  /** 查询时刻，RFC3339；不传取数据源当前时间 */
  time?: string;
}): Promise<QueryResult> {
  return normalizeQueryResult(
    await monitorRequest<QueryResult>('/api/v1/monitor/query', {
      method: 'POST',
      data: body,
      silent: true,
    }),
  );
}

/** QueryDatasourceRange 区间查询；(end - start) / stepS 不得超过 11000 个点 */
export async function queryDatasourceRange(body: {
  datasourceId: string;
  expr: string;
  start: string;
  end: string;
  stepS: number;
}): Promise<QueryResult> {
  return normalizeQueryResult(
    await monitorRequest<QueryResult>('/api/v1/monitor/query-range', {
      method: 'POST',
      data: body,
      silent: true,
    }),
  );
}
