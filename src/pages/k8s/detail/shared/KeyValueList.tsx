import { Empty, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';

const defaultItemBackgroundColor = 'rgba(0, 0, 0, 0.03)';

const useStyles = createStyles(({ token }) => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  item: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: token.marginLG,
    alignItems: 'center',
    minHeight: 46,
    padding: '0 16px',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    color: token.colorText,
    lineHeight: 1.5,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      rowGap: token.marginXS,
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      borderRadius: token.borderRadiusLG,
    },
  },
  field: {
    display: 'flex',
    gap: token.marginSM,
    minWidth: 0,
  },
  label: {
    flex: '0 0 auto',
    color: token.colorTextTertiary,
    fontSize: 13,
  },
  value: {
    minWidth: 0,
    overflow: 'hidden',
    color: token.colorText,
    fontSize: 13,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

type KeyValueListItem = {
  key: string;
  value?: ReactNode;
};

type KeyValueListProps = {
  data?: Record<string, ReactNode>;
  items?: KeyValueListItem[];
  itemBackgroundColor?: string;
  keyLabel?: ReactNode;
  keyTextColor?: string;
  valueLabel?: ReactNode;
};

const getItems = (
  data?: Record<string, ReactNode>,
  items?: KeyValueListItem[],
) => {
  if (items) {
    return items.filter((item) => Boolean(item.key));
  }

  return Object.entries(data || {})
    .filter(([key]) => Boolean(key))
    .map(([key, value]) => ({ key, value }));
};

const getTooltipTitle = (value?: ReactNode) =>
  typeof value === 'string' || typeof value === 'number' ? value : undefined;

const hasLabel = (label?: ReactNode) =>
  label !== undefined && label !== null && label !== '';

const KeyValueList = ({
  data,
  items,
  itemBackgroundColor = defaultItemBackgroundColor,
  keyLabel = '键:',
  keyTextColor,
  valueLabel = '值:',
}: KeyValueListProps) => {
  const { styles } = useStyles();
  const list = getItems(data, items);
  const showKeyLabel = hasLabel(keyLabel);
  const showValueLabel = hasLabel(valueLabel);
  const keyTextStyle = keyTextColor ? { color: keyTextColor } : undefined;

  if (list.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className={styles.list}>
      {list.map((item) => {
        const value = item.value || '-';

        return (
          <div
            className={styles.item}
            key={item.key}
            style={{ backgroundColor: itemBackgroundColor }}
          >
            <div className={styles.field}>
              {showKeyLabel ? (
                <span className={styles.label}>{keyLabel}</span>
              ) : null}
              <Tooltip title={item.key} placement="topLeft">
                <span className={styles.value} style={keyTextStyle}>
                  {item.key}
                </span>
              </Tooltip>
            </div>
            <div className={styles.field}>
              {showValueLabel ? (
                <span className={styles.label}>{valueLabel}</span>
              ) : null}
              <Tooltip title={getTooltipTitle(value)} placement="topLeft">
                <span className={styles.value}>{value}</span>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export type { KeyValueListItem, KeyValueListProps };
export default KeyValueList;
