/**
 * /monitor 落地：按权限跳到第一个可访问的子页（同 /oncall 的落地方式）。
 */
import type React from 'react';
import { AccessLanding, type Landing } from '@/components/RouteTabs';

const LANDINGS: Landing[] = [
  ['canMonitorAlert', '/monitor/alert'],
  ['canMonitorRule', '/monitor/rule'],
  ['canMonitorMute', '/monitor/mute'],
  ['canMonitorNotice', '/monitor/notice'],
  ['canMonitorMetric', '/monitor/metric'],
  ['canMonitorInsight', '/monitor/insight'],
  ['canMonitorDatasource', '/monitor/datasource'],
];

const MonitorIndex: React.FC = () => <AccessLanding landings={LANDINGS} />;

export default MonitorIndex;
