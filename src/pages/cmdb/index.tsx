/**
 * /cmdb 落地：按权限跳到第一个可访问的子页。
 * 静态 redirect 固定指向全局搜索，只有模型 / 同步 / 审计权限的用户会落到 403。
 */
import type React from 'react';
import { AccessLanding, type Landing } from '@/components/RouteTabs';

const LANDINGS: Landing[] = [
  ['canCmdbCI', '/cmdb/search'],
  ['canCmdbModel', '/cmdb/model'],
  ['canCmdbSync', '/cmdb/sync'],
  ['canCmdbAudit', '/cmdb/audit'],
  ['canCmdbStats', '/cmdb/stats'],
];

const CmdbIndex: React.FC = () => <AccessLanding landings={LANDINGS} />;

export default CmdbIndex;
