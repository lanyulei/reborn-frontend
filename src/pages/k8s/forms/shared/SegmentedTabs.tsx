import { createStyles } from 'antd-style';
import type { CSSProperties, ReactNode } from 'react';

type SegmentedTabItem<Value extends string> = {
  label: ReactNode;
  value: Value;
};

type SegmentedTabsProps<Value extends string> = {
  className?: string;
  items: SegmentedTabItem<Value>[];
  value: Value;
  width?: number | string;
  onChange: (value: Value) => void;
};

const useStyles = createStyles(
  ({ token }, props: { width?: number | string }) => ({
    tabs: {
      display: 'grid',
      width:
        typeof props.width === 'number'
          ? `min(${props.width}px, 100%)`
          : props.width || 'min(454px, 100%)',
      gridTemplateColumns: `repeat(var(--segmented-tabs-count), minmax(0, 1fr))`,
      gap: 2,
      // padding: 2,
      border: `1px solid #f0f0f0`,
      borderRadius: 6,
      background: token.colorFillQuaternary,

      '@media (max-width: 576px)': {
        gridTemplateColumns: '1fr',
        borderRadius: token.borderRadiusSM,
      },
    },
    tab: {
      height: 28,
      border: 0,
      borderRadius: 6,
      background: 'transparent',
      color: token.colorText,
      cursor: 'pointer',
      fontSize: token.fontSizeSM,
      lineHeight: '28px',
      textAlign: 'center',
      whiteSpace: 'nowrap',
      transition: `background ${token.motionDurationMid}, color ${token.motionDurationMid}`,

      '&:hover': {
        background: token.colorFillSecondary,
      },

      '&:focus-visible': {
        outline: `2px solid ${token.colorPrimaryBorder}`,
        outlineOffset: 1,
      },

      '@media (max-width: 576px)': {
        borderRadius: token.borderRadiusSM,
        fontSize: 12,
      },
    },
    activeTab: {
      '&&': {
        background: token.colorPrimaryBg,
        color: token.colorPrimaryText,
        // boxShadow: `inset 0 0 0 1px #c0e3f9`,
      },

      '&&:hover': {
        background: token.colorPrimaryBgHover,
        color: token.colorPrimaryText,
      },
    },
  }),
);

const SegmentedTabs = <Value extends string>({
  className,
  items,
  value,
  width,
  onChange,
}: SegmentedTabsProps<Value>) => {
  const { styles, cx } = useStyles({ width });

  return (
    <div
      className={cx(styles.tabs, className)}
      style={
        {
          '--segmented-tabs-count': items.length,
        } as CSSProperties
      }
    >
      {items.map((item) => (
        <button
          className={cx(styles.tab, item.value === value && styles.activeTab)}
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export type { SegmentedTabItem, SegmentedTabsProps };
export default SegmentedTabs;
