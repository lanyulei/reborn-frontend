import { userLabel } from '@/components/UserSelect';
import { listDeptUserCandidates } from '@/services/system/dept';

/** 负责人 / 成员候选：部门域的最小披露接口（可用用户，按登录名 / 昵称搜索） */
export const fetchDeptUserCandidates = async (keyword: string) => {
  const { items } = await listDeptUserCandidates(keyword);
  return (items ?? []).map((u) => ({ id: u.id, label: userLabel(u) }));
};
