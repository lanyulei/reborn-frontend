import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { createStyles } from 'antd-style';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect } from 'react';
import { useT } from '@/utils/i18n';

/**
 * 样式入参。footerJustify 写成 string 而非 CSSProperties['justifyContent']：样式对象的类型会进到
 * 导出的 useKeyValueEditorStyles 里，带上 csstype 的内部类型就无法按名引用（TS2883）。
 */
interface StyleProps {
  footerJustify: string | undefined;
}

const useStyles = createStyles(({ token }, props: StyleProps) => ({
  editor: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 576px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  input: {
    minWidth: 0,

    '&.ant-input': {
      backgroundColor: token.colorBgContainer,
    },
  },
  valueInput: {
    '@media (max-width: 576px)': {
      gridColumn: '1 / -1',
      gridRow: 2,
    },
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: props.footerJustify,
    marginTop: `12px`,
  },
  footerExtra: {
    flex: '0 0 auto',
  },
}));

type KeyValueEditorItem = {
  id: string;
  keyName: string;
  value: string;
};

type KeyValueEditorProps = {
  addIcon?: boolean;
  addText?: string;
  deleteAriaLabel?: string;
  footerJustify?: CSSProperties['justifyContent'];
  keyPlaceholder?: string;
  minRows?: number;
  value?: KeyValueEditorItem[];
  valuePlaceholder?: string;
  footerExtra?: ReactNode;
  onAddBlocked?: () => void;
  onChange?: (value: KeyValueEditorItem[]) => void;
  onCreateItem: () => KeyValueEditorItem;
  /** 键的格式校验：不通过的键输入框标红并在悬停时给出说明（不拦截输入） */
  validateKey?: (key: string) => boolean;
  invalidKeyHint?: string;
};

const KeyValueEditor = ({
  addIcon = true,
  addText: addTextProp,
  deleteAriaLabel: deleteAriaLabelProp,
  footerJustify = 'flex-end',
  keyPlaceholder: keyPlaceholderProp,
  minRows,
  value = [],
  valuePlaceholder: valuePlaceholderProp,
  footerExtra,
  onAddBlocked,
  onChange,
  onCreateItem,
  validateKey,
  invalidKeyHint,
}: KeyValueEditorProps) => {
  const t = useT();
  const addText = addTextProp ?? t('pages.k8s.form.add');
  const deleteAriaLabel = deleteAriaLabelProp ?? t('common.action.delete');
  const keyPlaceholder = keyPlaceholderProp ?? t('pages.k8s.form.key');
  const valuePlaceholder = valuePlaceholderProp ?? t('pages.k8s.form.value');
  const { styles } = useStyles({ footerJustify });
  const addDisabled = value.some((item) => !item.keyName.trim());

  useEffect(() => {
    if (!minRows || value.length >= minRows) {
      return;
    }

    onChange?.([
      ...value,
      ...Array.from({ length: minRows - value.length }, () => onCreateItem()),
    ]);
  }, [minRows, onChange, onCreateItem, value]);

  const updateItem = (
    id: string,
    field: 'keyName' | 'value',
    nextValue: string,
  ) => {
    onChange?.(
      value.map((item) =>
        item.id === id ? { ...item, [field]: nextValue } : item,
      ),
    );
  };

  const addItem = () => {
    if (addDisabled) {
      onAddBlocked?.();
      return;
    }

    onChange?.([...value, onCreateItem()]);
  };

  const deleteItem = (id: string) => {
    if (minRows && value.length <= minRows) {
      onChange?.(
        value.map((item) =>
          item.id === id ? { ...item, keyName: '', value: '' } : item,
        ),
      );
      return;
    }

    onChange?.(value.filter((item) => item.id !== id));
  };

  return (
    <>
      <div className={styles.editor}>
        {value.map((item) => (
          <div className={styles.row} key={item.id}>
            <Input
              className={styles.input}
              placeholder={keyPlaceholder}
              status={
                validateKey && item.keyName.trim() && !validateKey(item.keyName)
                  ? 'error'
                  : undefined
              }
              title={
                validateKey && item.keyName.trim() && !validateKey(item.keyName)
                  ? invalidKeyHint
                  : undefined
              }
              value={item.keyName}
              onChange={(event) =>
                updateItem(item.id, 'keyName', event.target.value)
              }
            />
            <Input
              className={[styles.input, styles.valueInput].join(' ')}
              placeholder={valuePlaceholder}
              value={item.value}
              onChange={(event) =>
                updateItem(item.id, 'value', event.target.value)
              }
            />
            <Button
              aria-label={deleteAriaLabel}
              className={styles.deleteButton}
              icon={<DeleteOutlined />}
              type="text"
              onClick={() => deleteItem(item.id)}
            />
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        {footerExtra && <div className={styles.footerExtra}>{footerExtra}</div>}
        <Button disabled={addDisabled} onClick={addItem}>
          {addIcon && <PlusOutlined />}
          {addText}
        </Button>
      </div>
    </>
  );
};

/**
 * 键值行的样式（圆角行、白底输入框、删除图标、右下角的添加按钮）。
 * 带逐行校验、不能直接用本组件的表单列表（标签、污点等）用它保持同一外观。
 */
export const useKeyValueEditorStyles = useStyles;

export type { KeyValueEditorItem, KeyValueEditorProps };
export default KeyValueEditor;
