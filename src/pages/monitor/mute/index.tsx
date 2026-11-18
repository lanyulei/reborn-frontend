import type React from 'react';
import {
  TabContainer,
  type TabItem,
} from '@/pages/notify/components/TabContainer';

/** 降噪规则：屏蔽规则（按时间屏蔽）/ 抑制规则（按告警之间的因果关系抑制）两页聚合，同属 monitor.mute 菜单 */
const MUTE_TABS: TabItem[] = [
  {
    key: 'silence',
    path: '/monitor/mute/silence',
    labelKey: 'menu.monitor.mute.silence',
    accessKey: 'canMonitorMute',
  },
  {
    key: 'inhibit',
    path: '/monitor/mute/inhibit',
    labelKey: 'menu.monitor.mute.inhibit',
    accessKey: 'canMonitorMute',
  },
];

const MonitorMute: React.FC = () => (
  <TabContainer basePath="/monitor/mute" tabs={MUTE_TABS} />
);

export default MonitorMute;
