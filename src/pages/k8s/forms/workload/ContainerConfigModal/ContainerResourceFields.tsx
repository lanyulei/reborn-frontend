import { CodeSandboxOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Form } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import UnitInputNumber from '../../shared/UnitInputNumber';

const useStyles = createStyles(({ token }) => ({
  notice: {
    marginBottom: token.marginSM,
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    borderRadius: token.borderRadiusSM,
    background: token.colorInfoBg,
    color: token.colorInfoText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  panel: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: token.marginLG,
    padding: `${token.paddingMD}px ${token.paddingLG}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  group: {
    display: 'grid',
    gridTemplateColumns: '42px minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginMD,
  },
  icon: {
    display: 'inline-flex',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: token.borderRadiusSM,
    background: token.colorText,
    color: token.colorBgContainer,
    fontSize: 22,
  },
  memoryIcon: {
    background: 'transparent',
    color: token.colorText,
    fontSize: 32,
    transform: 'rotate(-45deg)',
  },
  rows: {
    display: 'flex',
    minWidth: 0,
    flexDirection: 'column',
    gap: token.marginXS,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '72px minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginXS,
  },
  label: {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
    whiteSpace: 'nowrap',
  },
  formItem: {
    marginBottom: 0,
  },
}));

type ResourceFieldProps = {
  label: string;
  name: string;
  placeholder: string;
  unit: string;
  precision: number;
  notGreaterThanField?: string;
  notGreaterThanMessage?: string;
};

const resourceFields: {
  icon: ReactNode;
  iconClassName?: string;
  fields: ResourceFieldProps[];
}[] = [
  {
    icon: <CodeSandboxOutlined />,
    fields: [
      {
        label: 'CPU 预留',
        name: 'cpuRequest',
        placeholder: '无预留',
        unit: 'Core',
        precision: 3,
        notGreaterThanField: 'cpuLimit',
        notGreaterThanMessage: 'CPU 预留不能大于 CPU 限制',
      },
      {
        label: 'CPU 限制',
        name: 'cpuLimit',
        placeholder: '无上限',
        unit: 'Core',
        precision: 3,
      },
    ],
  },
  {
    icon: <DatabaseOutlined />,
    iconClassName: 'memory',
    fields: [
      {
        label: '内存预留',
        name: 'memoryRequest',
        placeholder: '无预留',
        unit: 'Mi',
        precision: 0,
        notGreaterThanField: 'memoryLimit',
        notGreaterThanMessage: '内存预留不能大于内存限制',
      },
      {
        label: '内存限制',
        name: 'memoryLimit',
        placeholder: '无上限',
        unit: 'Mi',
        precision: 0,
      },
    ],
  },
];

const ContainerResourceFields = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.panel}>
      {resourceFields.map((group) => (
        <div className={styles.group} key={group.fields[0].name}>
          <span
            className={[
              styles.icon,
              group.iconClassName === 'memory' ? styles.memoryIcon : '',
            ].join(' ')}
          >
            {group.icon}
          </span>
          <div className={styles.rows}>
            {group.fields.map((field) => {
              const rules =
                field.notGreaterThanField && field.notGreaterThanMessage
                  ? [
                      ({
                        getFieldValue,
                      }: {
                        getFieldValue: (name: NamePath) => unknown;
                      }) => ({
                        // 预留可以等于限制，只拒绝预留大于限制
                        validator: async (_: unknown, value: unknown) => {
                          const limit = getFieldValue(
                            field.notGreaterThanField as NamePath,
                          );

                          if (
                            typeof value === 'number' &&
                            typeof limit === 'number' &&
                            value > limit
                          ) {
                            throw new Error(field.notGreaterThanMessage);
                          }
                        },
                      }),
                    ]
                  : undefined;

              return (
                <div className={styles.row} key={field.name}>
                  <span className={styles.label}>{field.label}</span>
                  <Form.Item
                    className={styles.formItem}
                    dependencies={
                      field.notGreaterThanField
                        ? [field.notGreaterThanField]
                        : undefined
                    }
                    name={field.name}
                    rules={rules}
                  >
                    <UnitInputNumber
                      min={0}
                      placeholder={field.placeholder}
                      precision={field.precision}
                      style={{ width: '100%' }}
                      unit={field.unit}
                    />
                  </Form.Item>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContainerResourceFields;
