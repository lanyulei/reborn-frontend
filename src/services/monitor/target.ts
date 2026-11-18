/**
 * 通知对象候选项（规则的通知对象、订阅的接收方选择器用）：启用的值班表、全部部门、按关键字
 * 匹配的可用用户（最小披露）。随规则与订阅的新建 / 编辑 / 导入权限开放，不要求值班管理或
 * 组织架构的权限——监控告警域的选择器一律用它，不用其他域的候选接口。
 */
import { monitorRequest } from './request';

export type TargetKind = 'schedule' | 'dept' | 'user';

export interface TargetSchedule {
  id: string;
  name?: string;
  /** 所属值班组名称 */
  groupName?: string;
}

export interface TargetDept {
  id: string;
  name?: string;
  /** 上级部门；顶级部门没有 */
  parentId?: string;
}

export interface TargetUser {
  id: string;
  username?: string;
  nickname?: string;
}

export interface TargetOptions {
  /** 启用的值班表，按值班组、名称排序 */
  schedules?: TargetSchedule[];
  /** 全部部门，平铺、上级在前 */
  depts?: TargetDept[];
  /** 可用用户，至多 50 个 */
  users?: TargetUser[];
}

/**
 * ListMonitorTargetOptions：kinds 不传返回三种；keyword 只影响 users（逐字搜索用户时只传
 * kinds=['user']）。未请求的种类与空结果在响应里不出现。失败由调用方处理（不弹提示）。
 */
export async function listTargetOptions(params: {
  keyword?: string;
  kinds?: TargetKind[];
}): Promise<TargetOptions> {
  return monitorRequest<TargetOptions>('/api/v1/monitor/target-option', {
    method: 'GET',
    params: { keyword: params.keyword || undefined, kinds: params.kinds },
    silent: true,
  });
}
