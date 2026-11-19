/**
 * /job 落地：按权限跳到第一个可访问的子页（同 /monitor 的落地方式）。
 */
import type React from 'react';
import { AccessLanding, type Landing } from '@/components/RouteTabs';

const LANDINGS: Landing[] = [
  ['canJobAdhoc', '/job/adhoc'],
  ['canJobLibrary', '/job/library'],
  ['canJobAutomation', '/job/automation'],
  ['canJobResource', '/job/resource'],
  ['canJobPolicy', '/job/policy'],
  // 执行记录 / 执行统计已拆为独立页面：分别按各自权限落到对应页（菜单顺序也在最后）
  ['canJobExecution', '/job/history'],
  ['canJobStats', '/job/stats'],
];

const JobIndex: React.FC = () => <AccessLanding landings={LANDINGS} />;

export default JobIndex;
