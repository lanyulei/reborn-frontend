import agent from './zh-TW/agent';
import cmdb from './zh-TW/cmdb';
import common from './zh-TW/common';
import component from './zh-TW/component';
import enumMessages from './zh-TW/enum';
import globalHeader from './zh-TW/globalHeader';
import incident from './zh-TW/incident';
import job from './zh-TW/job';
import k8s from './zh-TW/k8s';
import k8sApps from './zh-TW/k8sApps';
import k8sChange from './zh-TW/k8sChange';
import k8sDetail from './zh-TW/k8sDetail';
import k8sForms from './zh-TW/k8sForms';
import k8sGov from './zh-TW/k8sGov';
import knowledge from './zh-TW/knowledge';
import menu from './zh-TW/menu';
import monitor from './zh-TW/monitor';
import network from './zh-TW/network';
import notify from './zh-TW/notify';
import oncall from './zh-TW/oncall';
import pages from './zh-TW/pages';
import settingDrawer from './zh-TW/settingDrawer';
import settings from './zh-TW/settings';
import system from './zh-TW/system';
import ticket from './zh-TW/ticket';
import workflow from './zh-TW/workflow';

export default {
  'navBar.lang': '語言',
  'layout.user.link.help': '幫助',
  'layout.user.link.privacy': '隱私',
  'layout.user.link.terms': '條款',
  'app.preview.down.block': '下載此頁面到本地項目',
  ...pages,
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...network,
  ...component,
  ...common,
  ...enumMessages,
  ...system,
  ...notify,
  ...cmdb,
  ...oncall,
  ...monitor,
  ...job,
  ...k8s,
  ...k8sApps,
  ...k8sChange,
  ...k8sGov,
  ...k8sDetail,
  ...k8sForms,
  ...knowledge,
  ...incident,
  ...agent,
  ...ticket,
  ...workflow,
};
