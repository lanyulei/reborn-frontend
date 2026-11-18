/**
 * MonitorEngineService 平台自监控（只读）：评估引擎各实例、任务积压与评估延迟、当前存在问题的
 * 数据源与规则。失败由调用方展示（silent）。
 */
import { monitorRequest } from './request';
import type { EngineStatus } from './typings';

/** GetEngineStatus 查询评估引擎状态 */
export async function getEngineStatus(): Promise<EngineStatus> {
  return monitorRequest<EngineStatus>('/api/v1/monitor/engine/status', {
    method: 'GET',
    silent: true,
  });
}
