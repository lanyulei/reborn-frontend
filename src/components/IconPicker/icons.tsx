/**
 * 图标库：全站共用的一套业务图标（资源模型、工单模板等的图标都从这里选）。
 * 全部为内联 SVG（24×24 描边），不依赖图标库——随主题色（currentColor）变化。
 * 键即存进数据里的图标标识：只能新增，不要改名或删除（历史数据会失配，改名请加别名）。
 */
import type React from 'react';

export type IconGroup = 'infra' | 'office' | 'general';

/** 基础设施 */
const INFRA_PATHS: Record<string, React.ReactNode> = {
  server: (
    <>
      <rect x="3" y="4" width="18" height="7" rx="1.5" />
      <rect x="3" y="13" width="18" height="7" rx="1.5" />
      <path d="M7 7.5h.01M7 16.5h.01M11 7.5h6M11 16.5h6" />
    </>
  ),
  vm: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
      <rect x="7.5" y="7.5" width="9" height="5" rx="0.8" />
    </>
  ),
  network: (
    <>
      <rect x="9" y="3" width="6" height="5" rx="1" />
      <rect x="3" y="16" width="6" height="5" rx="1" />
      <rect x="15" y="16" width="6" height="5" rx="1" />
      <path d="M12 8v4M6 16v-4h12v4" />
    </>
  ),
  switch: (
    <>
      <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
      <path d="M6 12h.01M9.5 12h.01M13 12h.01M16.5 12h1.5" />
    </>
  ),
  router: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v10M7 12h10M9.5 9.5 12 7l2.5 2.5M9.5 14.5 12 17l2.5-2.5" />
    </>
  ),
  firewall: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3.2 7.8 7.5 9.5 4.3-1.7 7.5-5 7.5-9.5V6L12 3Z" />
      <path d="M8.5 10.5h7M8.5 14h7M12 10.5V14" />
    </>
  ),
  balancer: (
    <>
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="5.5" r="2" />
      <circle cx="19" cy="12" r="2" />
      <circle cx="19" cy="18.5" r="2" />
      <path d="M7 12h10M7 11l10-5M7 13l10 5" />
    </>
  ),
  cloud: (
    <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96 6 6 0 0 1 11.5 1.5A3.75 3.75 0 0 1 17.5 18.5H7Z" />
  ),
  'cloud-server': (
    <>
      <path d="M7 14.5a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.6 1.3 3.4 3.4 0 0 1 .4 6.67" />
      <rect x="7" y="14" width="10" height="6" rx="1.2" />
      <path d="M10 17h.01M13 17h2" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6M4.5 12v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" />
    </>
  ),
  storage: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 12h.01M17.5 16.5h.01" />
    </>
  ),
  chip: (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.6" />
      <path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3" />
    </>
  ),
  app: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  container: (
    <>
      <path d="M12 2.8 20 7v10l-8 4.2L4 17V7l8-4.2Z" />
      <path d="M4 7l8 4.2L20 7M12 11.2v10" />
    </>
  ),
  cluster: (
    <>
      <circle cx="12" cy="5.5" r="2.5" />
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="18.5" cy="17.5" r="2.5" />
      <path d="M10.8 7.7 6.7 15.3M13.2 7.7l4.1 7.6M8 17.5h8" />
    </>
  ),
  service: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </>
  ),
  domain: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5S9.5 5.8 12 3.5Z" />
    </>
  ),
  certificate: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path d="M7 9h6M7 12.5h4" />
      <circle cx="16.5" cy="13" r="2.2" />
      <path d="m15.3 15 -.6 4.5 1.8-1.2 1.8 1.2-.6-4.5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8.5-8.5M16 7l2.5 2.5M13.5 9.5 15.5 11.5" />
    </>
  ),
  rack: (
    <>
      <rect x="5" y="2.5" width="14" height="19" rx="1.5" />
      <path d="M8 7h8M8 11h8M8 15h8M8 18.5h.01" />
    </>
  ),
  datacenter: (
    <>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 10h6M9 13.5h6M10 21v-4h4v4" />
    </>
  ),
  monitor: (
    <>
      <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />
    </>
  ),
  queue: (
    <>
      <rect x="3" y="6" width="5" height="12" rx="1" />
      <rect x="9.5" y="6" width="5" height="12" rx="1" />
      <rect x="16" y="6" width="5" height="12" rx="1" />
    </>
  ),
};

/** 办公协作 */
const OFFICE_PATHS: Record<string, React.ReactNode> = {
  ticket: (
    <>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <rect x="9" y="3" width="6" height="3" rx="1" />
      <path d="M9 10.5h6M9 14h6M9 17.5h3.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  file: (
    <>
      <path d="M6.5 3.5H14l4 4v13H6.5v-17Z" />
      <path d="M14 3.5v4h4M9.5 12h5M9.5 15.5h5" />
    </>
  ),
  chat: (
    <>
      <path d="M4.5 5.5h15v10h-8l-4 3.5v-3.5h-3v-10Z" />
      <path d="M8.5 9.5h7M8.5 12.5h4" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 8 7.5 5.5L19.5 8" />
    </>
  ),
  phone: (
    <>
      <rect x="7.5" y="3" width="9" height="18" rx="2" />
      <path d="M11 17.5h2" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5h-14l1.5-1.5Z" />
      <path d="M10.5 20.5h3" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
      <path d="M15.5 6.2a3 3 0 0 1 0 5.6M17 14.8c1.9.6 3.1 2 3.5 4.2" />
    </>
  ),
  idcard: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <circle cx="8.5" cy="10.8" r="1.8" />
      <path d="M5.8 15.8c.5-1.4 1.5-2 2.7-2s2.2.6 2.7 2M14 10h4.5M14 13.5h3" />
    </>
  ),
  wallet: (
    <>
      <rect x="3.5" y="6" width="17" height="12.5" rx="2" />
      <path d="M3.5 10h17M15 14.5h2.5" />
    </>
  ),
  cart: (
    <>
      <path d="M3.5 5H6l2 10h9.5l2-7H7" />
      <circle cx="9.5" cy="18.5" r="1.3" />
      <circle cx="16.5" cy="18.5" r="1.3" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6.5h10.5v10H3v-10ZM13.5 10h4l3 3v3.5h-7V10Z" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
    </>
  ),
  printer: (
    <>
      <path d="M7 8.5V4h10v4.5" />
      <rect x="4" y="8.5" width="16" height="8" rx="1.5" />
      <path d="M7.5 14h9v6h-9v-6Z" />
    </>
  ),
  laptop: (
    <>
      <rect x="5" y="5" width="14" height="10" rx="1.5" />
      <path d="M3 18.5h18" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.5h13v15H7.5A2.5 2.5 0 0 1 5 17V4.5Z" />
      <path d="M5 17a2.5 2.5 0 0 1 2.5-2.5H18M9 8.5h5" />
    </>
  ),
};

/** 通用 */
const GENERAL_PATHS: Record<string, React.ReactNode> = {
  project: (
    <>
      <path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7Z" />
    </>
  ),
  business: (
    <>
      <rect x="3" y="7.5" width="18" height="12" rx="1.5" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3 13h18M11 13v1.5h2V13" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20c.8-3.8 3.8-5.8 7.5-5.8s6.7 2 7.5 5.8" />
    </>
  ),
  cube: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M4 10h16M10 10v10" />
    </>
  ),
  sliders: (
    <>
      <path d="M4.5 7h8M17 7h2.5M4.5 12h2.5M11.5 12h8M4.5 17h9.5M18.5 17h1" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9.5" cy="12" r="2" />
      <circle cx="16.5" cy="17" r="2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 10v4M12 16.5h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2" />
    </>
  ),
  bug: (
    <>
      <path d="M8.5 9.5a3.5 3.5 0 0 1 7 0v5a3.5 3.5 0 0 1-7 0v-5Z" />
      <path d="M12 9.5V18M4.5 12.5h4M15.5 12.5h4M5.5 7l3 2M18.5 7l-3 2M5.5 18.5l3-2M18.5 18.5l-3-2" />
    </>
  ),
  rocket: (
    <>
      <path d="M12 3.5c3 2 4.5 5 4.5 8.5v4h-9v-4c0-3.5 1.5-6.5 4.5-8.5Z" />
      <circle cx="12" cy="10" r="1.5" />
      <path d="M7.5 13.5 5 16.5V19l2.5-1.5M16.5 13.5l2.5 3V19l-2.5-1.5M10.5 18.5v2M13.5 18.5v2" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h7.5l8.5 8.5-7.5 7.5L4 11.5V4Z" />
      <circle cx="8" cy="8" r="1.2" />
    </>
  ),
  home: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 9.5V20h12V9.5M10 20v-5.5h4V20" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 16.5h.01" />
    </>
  ),
};

/** 分组（选择器的展示顺序）→ 该组的图标路径 */
const GROUP_PATHS: Record<IconGroup, Record<string, React.ReactNode>> = {
  infra: INFRA_PATHS,
  office: OFFICE_PATHS,
  general: GENERAL_PATHS,
};

export const ICON_GROUPS = Object.keys(GROUP_PATHS) as IconGroup[];

/** 各分组里的图标标识（选择器展示顺序） */
export const ICON_KEYS_BY_GROUP: Record<IconGroup, readonly string[]> = {
  infra: Object.keys(INFRA_PATHS),
  office: Object.keys(OFFICE_PATHS),
  general: Object.keys(GENERAL_PATHS),
};

/** 全部图标路径：键即图标标识 */
export const ICON_PATHS: Record<string, React.ReactNode> = {
  ...INFRA_PATHS,
  ...OFFICE_PATHS,
  ...GENERAL_PATHS,
};

/** 历史数据里的图标标识 → 现有图标（迁移预置模型用的是 antd 图标名） */
const ICON_ALIAS: Record<string, string> = {
  hdd: 'server',
  apartment: 'network',
  appstore: 'chip',
  desktop: 'vm',
  cluster: 'cluster',
  global: 'domain',
  safety: 'firewall',
  api: 'service',
  folder: 'project',
};

/** 没有配置图标、或标识不认识时用的图标 */
export const FALLBACK_ICON = 'cube';

/** 数据里的图标标识对应库里的哪个键：认识的原样返回，历史别名换成现有图标，不认识返回 undefined */
export const matchIcon = (icon?: string): string | undefined => {
  if (!icon) return undefined;
  if (icon in ICON_PATHS) return icon;
  return ICON_ALIAS[icon];
};

/** 把图标标识解析成一定能画出来的键：不认识或没配置时用 fallback（它也不认识时用通用图标） */
export const resolveIcon = (icon?: string, fallback = FALLBACK_ICON) =>
  matchIcon(icon) ?? matchIcon(fallback) ?? FALLBACK_ICON;
