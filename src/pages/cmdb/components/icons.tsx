/**
 * CMDB 图标：模型图标（按 icon 标识取图）、图标选择器、字段类型与通用小图标。
 * 全部为内联 SVG（24×24 描边），不依赖图标库——随主题色（currentColor）变化。
 */
import { createStyles } from 'antd-style';
import type React from 'react';
import type { CmdbFieldType } from '@/services/cmdb/typings';

/** 图标路径集：键即模型的 icon 标识（创建/编辑模型时选择） */
const ICON_PATHS: Record<string, React.ReactNode> = {
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
  cube: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M4 10h16M10 10v10" />
    </>
  ),
};

/** 可选图标（选择器展示顺序） */
export const MODEL_ICON_KEYS = Object.keys(ICON_PATHS);

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

const resolveIcon = (icon?: string) => {
  if (!icon) return 'cube';
  if (icon in ICON_PATHS) return icon;
  return ICON_ALIAS[icon] ?? 'cube';
};

const Svg: React.FC<{ size: number; children: React.ReactNode }> = ({
  size,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

/** 裸图标（无底色），随 currentColor 着色 */
export const ModelGlyph: React.FC<{ icon?: string; size?: number }> = ({
  icon,
  size = 18,
}) => <Svg size={size}>{ICON_PATHS[resolveIcon(icon)]}</Svg>;

const useStyles = createStyles(({ token, css }) => ({
  badge: css`
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
    border-radius: 50%;
  `,
  muted: css`
    color: ${token.colorTextTertiary};
    background: ${token.colorFillTertiary};
  `,
  picker: css`
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: 6px;
  `,
  pickerItem: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    color: ${token.colorTextSecondary};
    background: transparent;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
    cursor: pointer;
    transition: all ${token.motionDurationMid};
    &:hover {
      color: ${token.colorPrimary};
      border-color: ${token.colorPrimaryBorder};
    }
  `,
  pickerActive: css`
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
    border-color: ${token.colorPrimary};
  `,
  typeGlyph: css`
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    color: ${token.colorTextTertiary};
  `,
}));

/** 模型图标徽标：圆形浅主色底 + 图标；muted 用于停用模型 */
export const ModelIcon: React.FC<{
  icon?: string;
  /** 徽标直径，缺省 40 */
  size?: number;
  muted?: boolean;
}> = ({ icon, size = 40, muted }) => {
  const { styles, cx } = useStyles();
  return (
    <span
      className={cx(styles.badge, muted && styles.muted)}
      style={{ width: size, height: size }}
    >
      <ModelGlyph icon={icon} size={Math.round(size * 0.5)} />
    </span>
  );
};

/** 图标选择器（受控：可直接作为表单项的子组件） */
export const IconPicker: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value, onChange }) => {
  const { styles, cx } = useStyles();
  const current = value ? resolveIcon(value) : undefined;
  return (
    <div className={styles.picker}>
      {MODEL_ICON_KEYS.map((key) => (
        <button
          type="button"
          key={key}
          title={key}
          aria-pressed={current === key}
          className={cx(
            styles.pickerItem,
            current === key && styles.pickerActive,
          )}
          onClick={() => onChange?.(key)}
        >
          <ModelGlyph icon={key} size={18} />
        </button>
      ))}
    </div>
  );
};

const FIELD_TYPE_PATHS: Record<CmdbFieldType, React.ReactNode> = {
  string: <path d="M6 19 12 5l6 14M8.3 14h7.4" />,
  int: <path d="M9 4 7 20M17 4l-2 16M4.5 9h15M4 15h15" />,
  float: (
    <>
      <path d="M5 6.5 7.5 5v14M11.5 19h.01" />
      <path d="M15 9.5a2.5 2.5 0 1 1 5 0c0 3-5 4.5-5 9.5h5" />
    </>
  ),
  bool: (
    <>
      <rect x="2.5" y="7" width="19" height="10" rx="5" />
      <circle cx="16.5" cy="12" r="2.6" />
    </>
  ),
  enum: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  datetime: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  json: (
    <path d="M9 4c-2 0-3 1-3 3v2.5c0 1.2-.7 2-2 2.5 1.3.5 2 1.3 2 2.5V17c0 2 1 3 3 3M15 4c2 0 3 1 3 3v2.5c0 1.2.7 2 2 2.5-1.3.5-2 1.3-2 2.5V17c0 2-1 3-3 3" />
  ),
  ip: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5Z" />
    </>
  ),
  ref: (
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  ),
};

/** 字段类型图标 */
export const FieldTypeIcon: React.FC<{
  type: CmdbFieldType;
  size?: number;
}> = ({ type, size = 18 }) => {
  const { styles } = useStyles();
  return (
    <span className={styles.typeGlyph}>
      <Svg size={size}>{FIELD_TYPE_PATHS[type] ?? FIELD_TYPE_PATHS.string}</Svg>
    </span>
  );
};

/** 星标（收藏）：filled 为已收藏 */
export const StarIcon: React.FC<{ filled?: boolean; size?: number }> = ({
  filled,
  size = 16,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 3.5Z" />
  </svg>
);

/** 通用小图标：more（纵向三点）/ edit / trash / drag / back / fit / plus / minus */
const UI_PATHS = {
  more: <path d="M12 5.5h.01M12 12h.01M12 18.5h.01" strokeWidth={2.6} />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />,
  trash: (
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5" />
  ),
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  fit: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
} as const;

export const UiIcon: React.FC<{
  name: keyof typeof UI_PATHS;
  size?: number;
}> = ({ name, size = 16 }) => <Svg size={size}>{UI_PATHS[name]}</Svg>;
