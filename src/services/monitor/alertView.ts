/**
 * MonitorAlertViewService 告警聚合视图：把活跃告警的聚合方式与过滤条件保存下来。个人视图只有
 * 本人可见；公共视图所有人可见，只有超级管理员能建 / 改 / 删（403 MONITOR_FORBIDDEN）。
 */
import { monitorRequest } from './request';
import type { AlertViewSpec, MonitorAlertView } from './typings';

/** ListAlertViews 公共视图在前，其后是我的个人视图；至多 200 个。失败由调用方处理 */
export async function listAlertViews(): Promise<{
  items?: MonitorAlertView[];
}> {
  return monitorRequest<{ items?: MonitorAlertView[] }>(
    '/api/v1/monitor/alert-view',
    { method: 'GET', silent: true },
  );
}

/** CreateAlertView 保存视图；本人已有同名视图 409 MONITOR_ALERT_VIEW_NAME_EXISTS */
export async function createAlertView(
  spec: AlertViewSpec,
): Promise<{ view: MonitorAlertView }> {
  return monitorRequest<{ view: MonitorAlertView }>(
    '/api/v1/monitor/alert-view',
    { method: 'POST', data: { spec } },
  );
}

/** UpdateAlertView 修改视图（整体替换） */
export async function updateAlertView(
  id: string,
  spec: AlertViewSpec,
): Promise<{ view: MonitorAlertView }> {
  return monitorRequest<{ view: MonitorAlertView }>(
    `/api/v1/monitor/alert-view/${id}`,
    { method: 'PUT', data: { spec } },
  );
}

/** DeleteAlertView 删除视图 */
export async function deleteAlertView(id: string): Promise<void> {
  await monitorRequest<void>(`/api/v1/monitor/alert-view/${id}`, {
    method: 'DELETE',
  });
}
