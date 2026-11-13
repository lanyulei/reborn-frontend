/**
 * /cmdb 落地：按权限跳到第一个可访问的子页。
 * 静态 redirect 固定指向全局搜索，只有模型 / 同步 / 审计权限的用户会落到 403。
 */
import { history, useAccess } from '@umijs/max';
import type React from 'react';
import { useEffect } from 'react';

const LANDINGS: [accessKey: string, path: string][] = [
  ['canCmdbCI', '/cmdb/search'],
  ['canCmdbModel', '/cmdb/model'],
  ['canCmdbSync', '/cmdb/sync'],
  ['canCmdbAudit', '/cmdb/audit'],
  ['canCmdbStats', '/cmdb/stats'],
];

const CmdbIndex: React.FC = () => {
  const access = useAccess() as Record<string, unknown>;
  useEffect(() => {
    const target = LANDINGS.find(([key]) => access[key]);
    history.replace(target ? target[1] : '/');
  }, [access]);
  return null;
};

export default CmdbIndex;
