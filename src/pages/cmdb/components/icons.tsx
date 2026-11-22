/**
 * CMDB 专用的小图标：字段类型图标、收藏星标与界面上的通用小图标。
 * 模型图标与图标选择器在全站共用的图标库里（@/components/IconPicker）。
 */
import { createStyles } from 'antd-style';
import type React from 'react';
import { IconSvg } from '@/components/IconPicker';
import type { CmdbFieldType } from '@/services/cmdb/typings';

const useStyles = createStyles(({ token, css }) => ({
  typeGlyph: css`
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    color: ${token.colorTextTertiary};
  `,
}));

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
      <IconSvg size={size}>
        {FIELD_TYPE_PATHS[type] ?? FIELD_TYPE_PATHS.string}
      </IconSvg>
    </span>
  );
};

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
}> = ({ name, size = 16 }) => <IconSvg size={size}>{UI_PATHS[name]}</IconSvg>;
