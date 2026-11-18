/**
 * MonitorMuteService 屏蔽规则：在一段时间内（一次性或按周重复）屏蔽命中条件的告警——只屏蔽
 * 通知，或连事件一并不产生。查看要求对作用分组「只读」以上，维护要求「可管理」；作用于
 * 全部分组的屏蔽规则仅超级管理员可维护。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { monitorRequest } from './request';
import type {
  AlertPreviewResult,
  MonitorMute,
  MonitorMuteMode,
  MonitorMuteState,
  MuteSpec,
} from './typings';

export interface ListMutesParams extends PageQuery {
  /** 作用分组过滤：作用于该分组、其上级或下级的，以及作用于全部分组的 */
  groupId?: string;
  enabled?: boolean;
  mode?: MonitorMuteMode;
  state?: MonitorMuteState;
}

/** ListMutes 分页查询屏蔽规则 */
export async function listMutes(
  params: ListMutesParams,
): Promise<PagedResult<MonitorMute>> {
  return monitorRequest<PagedResult<MonitorMute>>('/api/v1/monitor/mute', {
    method: 'GET',
    params,
  });
}

/** GetMute 查询屏蔽规则详情 */
export async function getMute(id: string): Promise<{ mute: MonitorMute }> {
  return monitorRequest<{ mute: MonitorMute }>(`/api/v1/monitor/mute/${id}`, {
    method: 'GET',
  });
}

/** CreateMute 新建屏蔽规则；至多 5 秒后对评估引擎生效 */
export async function createMute(
  spec: MuteSpec,
): Promise<{ mute: MonitorMute }> {
  return monitorRequest<{ mute: MonitorMute }>('/api/v1/monitor/mute', {
    method: 'POST',
    data: { spec },
  });
}

/** UpdateMute 编辑屏蔽规则（整体替换）；version 不一致 409 */
export async function updateMute(
  id: string,
  body: { spec: MuteSpec; version: number },
): Promise<{ mute: MonitorMute }> {
  return monitorRequest<{ mute: MonitorMute }>(`/api/v1/monitor/mute/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteMute 删除屏蔽规则 */
export async function deleteMute(id: string): Promise<void> {
  await monitorRequest<void>(`/api/v1/monitor/mute/${id}`, {
    method: 'DELETE',
  });
}

/** PreviewMute 保存前预览：当前活跃告警中会被命中的事件（不考虑时间范围，不落库） */
export async function previewMute(spec: MuteSpec): Promise<AlertPreviewResult> {
  return monitorRequest<AlertPreviewResult>('/api/v1/monitor/mute:preview', {
    method: 'POST',
    data: { spec },
  });
}
