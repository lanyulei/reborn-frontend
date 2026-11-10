import type React from 'react';
import { TabContainer, type TabItem } from '../components/TabContainer';

/** 通知规则：事件如何被处理——路由（分发）/ 静默（抑制）/ 模板（渲染）三页聚合 */
const RULE_TABS: TabItem[] = [
  {
    key: 'route',
    path: '/notify/rule/route',
    labelKey: 'menu.notify.rule.route',
    accessKey: 'canNotifyRoute',
  },
  {
    key: 'silence',
    path: '/notify/rule/silence',
    labelKey: 'menu.notify.rule.silence',
    accessKey: 'canNotifySilence',
  },
  {
    key: 'template',
    path: '/notify/rule/template',
    labelKey: 'menu.notify.rule.template',
    accessKey: 'canNotifyTemplate',
  },
];

const NotifyRule: React.FC = () => (
  <TabContainer basePath="/notify/rule" tabs={RULE_TABS} />
);

export default NotifyRule;
