import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { createStyles } from 'antd-style';
import type { CSSProperties } from 'react';
import { useEffect } from 'react';

const useStyles = createStyles(
  ({ token }, props: { footerJustify: CSSProperties['justifyContent'] }) => ({
    editor: {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginSM,
    },
    editorSurface: {
      padding: token.paddingSM,
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: token.borderRadiusSM,
      backgroundColor: token.colorBgContainer,

      '@media (max-width: 576px)': {
        padding: token.paddingXS,
      },
    },
    row: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
      alignItems: 'center',
      gap: token.marginSM,
      padding: `${token.paddingXS}px ${token.paddingMD}px`,
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: 24,
      backgroundColor: token.colorFillQuaternary,
    },
    input: {
      minWidth: 0,

      '&.ant-input': {
        backgroundColor: token.colorBgContainer,
      },
    },
    deleteButton: {
      justifySelf: 'center',
      color: token.colorTextTertiary,

      '&:hover': {
        color: token.colorError,
      },
    },
    footer: {
      display: 'flex',
      justifyContent: props.footerJustify,
      marginTop: 12,
    },
  }),
);

type StringListEditorItem = {
  id: string;
  value: string;
};

type StringListEditorProps = {
  addIcon?: boolean;
  addText?: string;
  deleteAriaLabel?: string;
  footerJustify?: CSSProperties['justifyContent'];
  minRows?: number;
  placeholder?: string;
  surface?: boolean;
  value?: StringListEditorItem[];
  onAddBlocked?: () => void;
  onChange?: (value: StringListEditorItem[]) => void;
  onCreateItem: () => StringListEditorItem;
};

const StringListEditor = ({
  addIcon = true,
  addText = '添加',
  deleteAriaLabel = '删除',
  footerJustify = 'flex-end',
  minRows,
  placeholder = '请输入',
  surface = false,
  value = [],
  onAddBlocked,
  onChange,
  onCreateItem,
}: StringListEditorProps) => {
  const { styles } = useStyles({ footerJustify });
  const addDisabled = value.some((item) => !item.value.trim());

  useEffect(() => {
    if (!minRows || value.length >= minRows) {
      return;
    }

    onChange?.([
      ...value,
      ...Array.from({ length: minRows - value.length }, () => onCreateItem()),
    ]);
  }, [minRows, onChange, onCreateItem, value]);

  const updateItem = (id: string, nextValue: string) => {
    onChange?.(
      value.map((item) =>
        item.id === id ? { ...item, value: nextValue } : item,
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
        value.map((item) => (item.id === id ? { ...item, value: '' } : item)),
      );
      return;
    }

    onChange?.(value.filter((item) => item.id !== id));
  };

  const editorNode = (
    <>
      <div className={styles.editor}>
        {value.map((item) => (
          <div className={styles.row} key={item.id}>
            <Input
              className={styles.input}
              placeholder={placeholder}
              value={item.value}
              onChange={(event) => updateItem(item.id, event.target.value)}
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
        <Button disabled={addDisabled} onClick={addItem}>
          {addIcon && <PlusOutlined />}
          {addText}
        </Button>
      </div>
    </>
  );

  if (surface) {
    return <div className={styles.editorSurface}>{editorNode}</div>;
  }

  return editorNode;
};

export type { StringListEditorItem, StringListEditorProps };
export default StringListEditor;
