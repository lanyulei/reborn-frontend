/**
 * 图标组件（全站共用）：裸图标 IconGlyph、圆形徽标 IconBadge、图标选择器 IconPicker。
 * 图标集见 ./icons；数据里存的是图标标识（键）。
 */
import { DownOutlined, SearchOutlined } from '@ant-design/icons';
import { Empty, Input, Popover } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { useT } from '@/utils/i18n';
import {
  FALLBACK_ICON,
  ICON_GROUPS,
  ICON_KEYS_BY_GROUP,
  ICON_PATHS,
  type IconGroup,
  matchIcon,
  resolveIcon,
} from './icons';

export {
  ICON_GROUPS,
  ICON_KEYS_BY_GROUP,
  type IconGroup,
  matchIcon,
  resolveIcon,
};

/** 24×24 描边图标的 SVG 外壳（其他内联图标复用，保持同一线宽与端点样式） */
export const IconSvg: React.FC<{ size: number; children: React.ReactNode }> = ({
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

/** 裸图标（无底色），随 currentColor 着色；fallback 是没有配置图标时用的图标 */
export const IconGlyph: React.FC<{
  icon?: string;
  size?: number;
  fallback?: string;
}> = ({ icon, size = 18, fallback }) => (
  <IconSvg size={size}>{ICON_PATHS[resolveIcon(icon, fallback)]}</IconSvg>
);

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
  /** 选择器的触发按钮：当前图标 + 名称，外观同输入框 */
  trigger: css`
    display: inline-flex;
    gap: 8px;
    align-items: center;
    min-width: 180px;
    height: ${token.controlHeight}px;
    padding: 0 ${token.paddingSM}px 0 4px;
    color: ${token.colorText};
    font-size: ${token.fontSize}px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadius}px;
    cursor: pointer;
    transition:
      border-color ${token.motionDurationMid},
      box-shadow ${token.motionDurationMid};
    &:hover {
      border-color: ${token.colorPrimaryHover};
    }
    &:focus-visible {
      border-color: ${token.colorPrimary};
      outline: none;
      box-shadow: 0 0 0 2px ${token.controlOutline};
    }
  `,
  triggerOpen: css`
    border-color: ${token.colorPrimary};
    box-shadow: 0 0 0 2px ${token.controlOutline};
  `,
  triggerName: css`
    flex: 1;
    overflow: hidden;
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  triggerPlaceholder: css`
    color: ${token.colorTextTertiary};
  `,
  triggerArrow: css`
    color: ${token.colorTextQuaternary};
    font-size: 12px;
  `,
  panel: css`
    width: 344px;
  `,
  list: css`
    max-height: 320px;
    margin-top: 4px;
    /* 留出滚动条与焦点描边的位置 */
    padding: 2px;
    overflow-y: auto;
  `,
  groupTitle: css`
    margin: 10px 0 6px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
    gap: 6px;
  `,
  item: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    padding: 0;
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
    &:focus-visible {
      color: ${token.colorPrimary};
      border-color: ${token.colorPrimary};
      outline: 2px solid ${token.colorPrimaryBorder};
      outline-offset: 1px;
    }
  `,
  itemActive: css`
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
    border-color: ${token.colorPrimary};
  `,
}));

/** 图标徽标：圆形浅主色底 + 图标；muted 用于停用状态 */
export const IconBadge: React.FC<{
  icon?: string;
  /** 徽标直径，缺省 40 */
  size?: number;
  muted?: boolean;
  /** 没有配置图标时用的图标 */
  fallback?: string;
}> = ({ icon, size = 40, muted, fallback }) => {
  const { styles, cx } = useStyles();
  return (
    <span
      className={cx(styles.badge, muted && styles.muted)}
      style={{ width: size, height: size }}
    >
      <IconGlyph
        icon={icon}
        size={Math.round(size * 0.5)}
        fallback={fallback}
      />
    </span>
  );
};

/** 「不指定图标」在选项里的取值（表单值为空串） */
const NONE = '';

/**
 * 图标选择器（受控：可直接作为表单项的子组件）。点开面板按分组挑选，支持搜索；
 * 第一项是「默认」（不指定图标，展示时用 defaultIcon），再点一次已选的图标也会取消选择。
 * 面板里用方向键在图标间移动，回车 / 空格选中。
 */
export const IconPicker: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  /** 不指定图标时展示用的图标（与列表、卡片上的缺省图标保持一致）；缺省为通用图标 */
  defaultIcon?: string;
  disabled?: boolean;
  id?: string;
}> = ({ value, onChange, defaultIcon = FALLBACK_ICON, disabled, id }) => {
  const { styles, cx } = useStyles();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  // 历史别名（如 antd 图标名）按解析后的图标显示为已选；不认识的标识当作没选
  const current = matchIcon(value) ?? NONE;
  const nameOf = (key: string) => t(`component.icon.${key}`);

  const groups = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return ICON_GROUPS.map((group) => ({
      group,
      keys: ICON_KEYS_BY_GROUP[group].filter(
        (key) =>
          !kw ||
          key.includes(kw) ||
          t(`component.icon.${key}`).toLowerCase().includes(kw),
      ),
    })).filter((g) => g.keys.length > 0);
  }, [keyword, t]);

  // 面板里只有一个图标在 Tab 序列里：已选的那个；它不在当前结果里时为第一个
  const visible = [
    ...(keyword.trim() ? [] : [NONE]),
    ...groups.flatMap((g) => g.keys),
  ];
  const tabStop = visible.includes(current) ? current : visible[0];

  const pick = (key: string) => {
    // 再点一次已选的图标 = 取消选择（回到默认）
    onChange?.(key === current ? NONE : key);
    setOpen(false);
  };

  /** 方向键在面板里的图标间移动焦点（左 / 上 = 前一个，右 / 下 = 后一个） */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (!step && event.key !== 'Home' && event.key !== 'End') return;
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ??
        [],
    );
    if (items.length === 0) return;
    event.preventDefault();
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (Math.max(index, 0) + step + items.length) % items.length;
    items[next].focus();
  };

  const cell = (key: string, label: string, icon: string) => {
    const active = key === current;
    return (
      // biome-ignore lint/a11y/useSemanticElements: 图标格子是带图形的自绘单选项，原生单选框无法这样呈现；键盘与读屏语义已按单选组补齐
      <button
        type="button"
        key={key || 'none'}
        role="radio"
        aria-checked={active}
        aria-label={label}
        title={label}
        // 其余图标用方向键到达
        tabIndex={key === tabStop ? 0 : -1}
        className={cx(styles.item, active && styles.itemActive)}
        onClick={() => pick(key)}
      >
        <IconGlyph icon={icon} size={18} />
      </button>
    );
  };

  const panel = (
    <div className={styles.panel}>
      <Input
        allowClear
        autoFocus
        prefix={<SearchOutlined />}
        placeholder={t('component.icon.search')}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => {
          // 从搜索框按「下」进入图标列表
          if (e.key !== 'ArrowDown') return;
          e.preventDefault();
          (
            listRef.current?.querySelector<HTMLButtonElement>(
              '[role="radio"][tabindex="0"]',
            ) ??
            listRef.current?.querySelector<HTMLButtonElement>('[role="radio"]')
          )?.focus();
        }}
      />
      <div
        ref={listRef}
        className={styles.list}
        role="radiogroup"
        aria-label={t('component.icon.select')}
        onKeyDown={onKeyDown}
      >
        {!keyword.trim() && (
          <div>
            <div className={styles.groupTitle}>
              {t('component.icon.default')}
            </div>
            <div className={styles.grid}>
              {cell(NONE, t('component.icon.default'), defaultIcon)}
            </div>
          </div>
        )}
        {groups.map(({ group, keys }) => (
          <div key={group}>
            <div className={styles.groupTitle}>
              {t(`component.icon.group.${group}`)}
            </div>
            <div className={styles.grid}>
              {keys.map((key) => cell(key, nameOf(key), key))}
            </div>
          </div>
        ))}
        {keyword.trim() && groups.length === 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('component.icon.empty')}
          />
        )}
      </div>
    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottomLeft"
      arrow={false}
      open={open}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
        if (next) setKeyword('');
      }}
      content={panel}
      destroyOnHidden
    >
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cx(styles.trigger, open && styles.triggerOpen)}
      >
        <IconBadge icon={current || defaultIcon} size={24} />
        <span
          className={cx(
            styles.triggerName,
            !current && styles.triggerPlaceholder,
          )}
        >
          {current ? nameOf(current) : t('component.icon.default')}
        </span>
        <DownOutlined className={styles.triggerArrow} />
      </button>
    </Popover>
  );
};

export default IconPicker;
