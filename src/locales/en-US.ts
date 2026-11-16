import cmdb from './en-US/cmdb';
import common from './en-US/common';
import component from './en-US/component';
import enumMessages from './en-US/enum';
import globalHeader from './en-US/globalHeader';
import menu from './en-US/menu';
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
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...network,
  ...component,
  ...pages,
  ...common,
  ...enumMessages,
  ...system,
  ...notify,
  ...cmdb,
  ...oncall,
  ...ticket,
  ...workflow,
};
