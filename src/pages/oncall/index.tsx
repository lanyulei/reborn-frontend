/**
 * /oncall 落地：按权限跳到第一个可访问的子页（同 /cmdb 的落地方式）。
 */
import { history, useAccess } from '@umijs/max';
import type React from 'react';
import { useEffect } from 'react';

const LANDINGS: [accessKey: string, path: string][] = [
  ['canOncallCalendar', '/oncall/calendar'],
  ['canOncallGroup', '/oncall/group'],
];

const OncallIndex: React.FC = () => {
  const access = useAccess() as Record<string, unknown>;
  useEffect(() => {
    const target = LANDINGS.find(([key]) => access[key]);
    history.replace(target ? target[1] : '/');
  }, [access]);
  return null;
};

export default OncallIndex;
