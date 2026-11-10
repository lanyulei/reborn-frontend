import type React from 'react';
import { TabContainer, type TabItem } from '../components/TabContainer';

/** 投递追踪：排障链路 事件 → 发送任务 → 投递明细 → 死信队列 四页聚合，页间按 ID 下钻 */
const TRACE_TABS: TabItem[] = [
  {
    key: 'event',
    path: '/notify/trace/event',
    labelKey: 'menu.notify.trace.event',
    accessKey: 'canNotifyEvent',
  },
  {
    key: 'dispatch',
    path: '/notify/trace/dispatch',
    labelKey: 'menu.notify.trace.dispatch',
    accessKey: 'canNotifyDispatch',
  },
  {
    key: 'delivery-log',
    path: '/notify/trace/delivery-log',
    labelKey: 'menu.notify.trace.delivery-log',
    accessKey: 'canNotifyDeliveryLog',
  },
  {
    key: 'dlq',
    path: '/notify/trace/dlq',
    labelKey: 'menu.notify.trace.dlq',
    accessKey: 'canNotifyDlq',
  },
];

const NotifyTrace: React.FC = () => (
  <TabContainer basePath="/notify/trace" tabs={TRACE_TABS} />
);

export default NotifyTrace;
