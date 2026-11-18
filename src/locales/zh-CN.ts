import cmdb from './zh-CN/cmdb';
import common from './zh-CN/common';
import component from './zh-CN/component';
import enumMessages from './zh-CN/enum';
import globalHeader from './zh-CN/globalHeader';
import job from './zh-CN/job';
import k8s from './zh-CN/k8s';
import k8sApps from './zh-CN/k8sApps';
import k8sChange from './zh-CN/k8sChange';
import k8sGov from './zh-CN/k8sGov';
import menu from './zh-CN/menu';
import monitor from './zh-CN/monitor';
import network from './zh-CN/network';
import notify from './zh-CN/notify';
import oncall from './zh-CN/oncall';
import pages from './zh-CN/pages';
import settingDrawer from './zh-CN/settingDrawer';
import settings from './zh-CN/settings';
import system from './zh-CN/system';
import ticket from './zh-CN/ticket';
import workflow from './zh-CN/workflow';

export default {
  'navBar.lang': '语言',
  'layout.user.link.help': '帮助',
  'layout.user.link.privacy': '隐私',
  'layout.user.link.terms': '条款',
  'app.preview.down.block': '下载此页面到本地项目',
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
  ...ticket,
  ...workflow,
};
