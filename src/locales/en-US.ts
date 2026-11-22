import agent from './en-US/agent';
import cmdb from './en-US/cmdb';
import common from './en-US/common';
import component from './en-US/component';
import enumMessages from './en-US/enum';
import globalHeader from './en-US/globalHeader';
import incident from './en-US/incident';
import job from './en-US/job';
import k8s from './en-US/k8s';
import k8sApps from './en-US/k8sApps';
import k8sChange from './en-US/k8sChange';
import k8sDetail from './en-US/k8sDetail';
import k8sForms from './en-US/k8sForms';
import k8sGov from './en-US/k8sGov';
import knowledge from './en-US/knowledge';
import menu from './en-US/menu';
import monitor from './en-US/monitor';
import network from './en-US/network';
import notify from './en-US/notify';
import oncall from './en-US/oncall';
import pages from './en-US/pages';
import settingDrawer from './en-US/settingDrawer';
import settings from './en-US/settings';
import system from './en-US/system';
import ticket from './en-US/ticket';
import workflow from './en-US/workflow';

export default {
  'navBar.lang': 'Languages',
  'layout.user.link.help': 'Help',
  'layout.user.link.privacy': 'Privacy',
  'layout.user.link.terms': 'Terms',
  'app.preview.down.block': 'Download this page to your local project',
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
