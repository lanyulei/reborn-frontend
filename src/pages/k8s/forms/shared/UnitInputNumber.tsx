import { InputNumber, Space } from 'antd';
import type { InputNumberProps } from 'antd/es/input-number';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';

const useStyles = createStyles(({ token }) => ({
  compact: {
    width: '100%',

    '.ant-input-number': {
      flex: 1,
    },
  },
  unit: {
    display: 'inline-flex',
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    padding: `0 ${token.paddingSM}px`,
    border: `1px solid ${token.colorBorder}`,
    borderInlineStart: 0,
    borderStartEndRadius: token.borderRadius,
    borderEndEndRadius: token.borderRadius,
    background: token.colorFillAlter,
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    whiteSpace: 'nowrap',
  },
}));

type UnitInputNumberProps = Omit<InputNumberProps, 'addonAfter'> & {
  unit: ReactNode;
};

const UnitInputNumber = ({ unit, style, ...props }: UnitInputNumberProps) => {
  const { styles } = useStyles();

  return (
    <Space.Compact block className={styles.compact}>
      <InputNumber {...props} style={{ width: '100%', ...style }} />
      <span className={styles.unit}>{unit}</span>
    </Space.Compact>
  );
};

export type { UnitInputNumberProps };
export default UnitInputNumber;
