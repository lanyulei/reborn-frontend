/**
 * /monitor 落地：按权限跳到第一个可访问的子页（同 /oncall 的落地方式）。
 */
import { history, useAccess } from '@umijs/max';
import type React from 'react';
import { useEffect } from 'react';

const LANDINGS: [accessKey: string, path: string][] = [
  ['canMonitorAlert', '/monitor/alert'],
  ['canMonitorRule', '/monitor/rule'],
  ['canMonitorMute', '/monitor/mute'],
  ['canMonitorNotice', '/monitor/notice'],
  ['canMonitorMetric', '/monitor/metric'],
  ['canMonitorInsight', '/monitor/insight'],
];

const MonitorIndex: React.FC = () => {
  const access = useAccess() as Record<string, unknown>;
  useEffect(() => {
    const target = LANDINGS.find(([key]) => access[key]);
    history.replace(target ? target[1] : '/');
  }, [access]);
  return null;
};

export default MonitorIndex;
