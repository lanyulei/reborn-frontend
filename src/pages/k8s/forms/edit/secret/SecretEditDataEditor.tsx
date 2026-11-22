/**
 * 保密字典编辑里的数据列表：与创建向导的数据列表同款卡片，但已有键的值是隐藏的——
 * 值显示为「已隐藏」，直到查看了明文或输入新值替换。
 */
import {
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  PlusOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Alert, Button, Form, Input, Modal, Tag, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/utils/i18n';
import { BINARY_VALUE_TEXT_ID, SECRET_KEY_PATTERN } from '../../secret/helpers';
import type { SecretEditItem } from './helpers';
import { createSecretEditItem, SECRET_MASK } from './helpers';

const { TextArea } = Input;

const useStyles = createStyles(({ token }) => ({
  editor: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    width: '100%',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  card: {
    minHeight: 64,
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    border: `1px solid color-mix(in srgb, ${token.colorBorder} 72%, ${token.colorBgContainer})`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    transition: `border-color ${token.motionDurationMid} ${token.motionEaseOut}, box-shadow ${token.motionDurationMid} ${token.motionEaseOut}`,

    '&:hover': {
      borderColor: token.colorBorder,
      boxShadow: token.boxShadowTertiary,
    },
  },
  cardHeader: {
    display: 'grid',
    gridTemplateColumns: '40px minmax(0, 1fr) max-content',
    alignItems: 'center',
    gap: token.marginLG,
    minHeight: 40,
  },
  icon: {
    color: token.colorTextDescription,
    fontSize: 32,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    minWidth: 0,
  },
  title: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tag: {
    flex: '0 0 auto',
    marginInlineEnd: 0,
  },
  description: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXL,
  },
  actionButton: {
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorPrimary,
    },
  },
  add: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    gap: token.marginSM,
    minHeight: 64,
    padding: '12px 20px',
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,
    cursor: 'pointer',
    font: 'inherit',
    textAlign: 'left',

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorFillQuaternary,
    },

    '&:focus-visible': {
      outline: `${token.lineWidthFocus}px solid ${token.colorPrimaryBorder}`,
      outlineOffset: 2,
    },
  },
  addText: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginXXS,
  },
  addTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  addDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  modalNotice: {
    marginBottom: token.marginMD,
  },
}));

type DataModalValues = {
  keyName: string;
  value: string;
};

type SecretEditDataEditorProps = {
  /** 由专用表单项维护的键：不能再作为数据键添加 */
  forbiddenKeys?: string[];
  /** 不可删除、不可改名的键（该类型必需的键）；值仍可整体替换 */
  lockedKeys?: string[];
  /** 由专用表单项生成的键 → 展示的内容；这些键在列表里只读 */
  reserved?: Record<string, string | undefined>;
  value?: SecretEditItem[];
  onChange?: (value: SecretEditItem[]) => void;
};

const isModified = (item: SecretEditItem) =>
  item.sourceKey !== undefined &&
  (item.value !== undefined || item.keyName !== item.sourceKey);

/** 该条目的值当前是否看不到（已有键、未查看明文、未输入新值） */
const isHidden = (item?: SecretEditItem) =>
  item !== undefined &&
  item.sourceKey !== undefined &&
  item.value === undefined &&
  item.revealed === undefined;

const SecretEditDataEditor = ({
  forbiddenKeys = [],
  lockedKeys = [],
  reserved = {},
  value = [],
  onChange,
}: SecretEditDataEditorProps) => {
  const { styles, theme } = useStyles();
  const t = useT();
  const [form] = Form.useForm<DataModalValues>();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const editingItem = useMemo(
    () => value.find((item) => item.id === editingId),
    [editingId, value],
  );
  const editingHidden = isHidden(editingItem);
  // 值已隐藏时改不了键（拿不到内容搬到新键）；必需的键也不能改名
  const keyDisabled =
    editingItem?.sourceKey !== undefined &&
    (editingHidden || lockedKeys.includes(editingItem.sourceKey));

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      keyName: editingItem?.keyName || '',
      value: editingItem?.value ?? editingItem?.revealed ?? '',
    });
  }, [editingItem, form, open]);

  const openCreateModal = () => {
    setEditingId(undefined);
    form.resetFields();
    setOpen(true);
  };

  const openEditModal = (item: SecretEditItem) => {
    setEditingId(item.id);
    setOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields().catch(() => undefined);
    // 校验未通过：字段已就地标红，停在弹窗里
    if (!values) return;
    const keyName = values.keyName.trim();
    const text = values.value ?? '';
    // 与已查看的明文相同且没改键：按没动过处理
    const untouched =
      editingItem?.sourceKey === keyName && editingItem.revealed === text;
    const nextItem: SecretEditItem = editingItem
      ? { ...editingItem, keyName, value: untouched ? undefined : text }
      : createSecretEditItem(keyName, text);

    onChange?.(
      editingItem
        ? value.map((item) => (item.id === editingItem.id ? nextItem : item))
        : [...value, nextItem],
    );
    setOpen(false);
  };

  const deleteItem = (id: string) => {
    onChange?.(value.filter((item) => item.id !== id));
  };

  const restoreItem = (id: string) => {
    onChange?.(
      value.map((item) =>
        item.id === id && item.sourceKey !== undefined
          ? { ...item, keyName: item.sourceKey, value: undefined }
          : item,
      ),
    );
  };

  const getValueText = (item: SecretEditItem) => {
    const reservedText = reserved[item.keyName];
    const emptyText = t('pages.k8s.forms.common.empty');

    if (reservedText !== undefined) {
      return reservedText || emptyText;
    }
    if (item.value !== undefined) {
      return item.value || emptyText;
    }
    if (item.binary) {
      return t(BINARY_VALUE_TEXT_ID);
    }
    if (item.revealed !== undefined) {
      return item.revealed || emptyText;
    }

    return t('pages.k8s.forms.common.hidden');
  };

  return (
    <>
      <div className={styles.editor}>
        {value.length > 0 && (
          <div className={styles.list}>
            {value.map((item) => {
              const valueText = getValueText(item);
              const isReserved = item.keyName in reserved;
              const locked =
                item.sourceKey !== undefined &&
                lockedKeys.includes(item.sourceKey);

              return (
                <div className={styles.card} key={item.id}>
                  <div className={styles.cardHeader}>
                    <KeyOutlined className={styles.icon} />
                    <div>
                      <div className={styles.titleRow}>
                        <Tooltip title={item.keyName} placement="topLeft">
                          <div className={styles.title}>
                            {item.keyName || '-'}
                          </div>
                        </Tooltip>
                        {item.sourceKey === undefined && (
                          <Tag className={styles.tag} color="success">
                            {t('pages.k8s.forms.edit.secret.tag.new')}
                          </Tag>
                        )}
                        {isModified(item) && (
                          <Tag className={styles.tag} color="warning">
                            {t('pages.k8s.forms.edit.secret.tag.modified')}
                          </Tag>
                        )}
                      </div>
                      <Tooltip title={valueText} placement="topLeft">
                        <div className={styles.description}>{valueText}</div>
                      </Tooltip>
                    </div>
                    {!isReserved && (
                      <div className={styles.actions}>
                        {!locked && (
                          <Tooltip
                            title={t('pages.k8s.forms.common.deleteData')}
                          >
                            <Button
                              aria-label={t(
                                'pages.k8s.forms.common.deleteData',
                              )}
                              className={styles.actionButton}
                              icon={<DeleteOutlined />}
                              type="text"
                              onClick={() => deleteItem(item.id)}
                            />
                          </Tooltip>
                        )}
                        {isModified(item) && (
                          <Tooltip
                            title={t('pages.k8s.forms.edit.secret.undo')}
                          >
                            <Button
                              aria-label={t('pages.k8s.forms.edit.secret.undo')}
                              className={styles.actionButton}
                              icon={<UndoOutlined />}
                              type="text"
                              onClick={() => restoreItem(item.id)}
                            />
                          </Tooltip>
                        )}
                        {!item.binary && (
                          <Tooltip
                            title={
                              isHidden(item)
                                ? t('pages.k8s.forms.edit.secret.replaceData')
                                : t('pages.k8s.forms.common.editData')
                            }
                          >
                            <Button
                              aria-label={
                                isHidden(item)
                                  ? t('pages.k8s.forms.edit.secret.replaceData')
                                  : t('pages.k8s.forms.common.editData')
                              }
                              className={styles.actionButton}
                              icon={<EditOutlined />}
                              type="text"
                              onClick={() => openEditModal(item)}
                            />
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button className={styles.add} type="button" onClick={openCreateModal}>
          <PlusOutlined />
          <span className={styles.addText}>
            <span className={styles.addTitle}>
              {t('pages.k8s.forms.common.addData')}
            </span>
            <span className={styles.addDescription}>
              {t('pages.k8s.forms.secret.dataEditor.addDescription')}
            </span>
          </span>
        </button>
      </div>
      <Modal
        destroyOnHidden
        mask={{ closable: false }}
        okText={editingItem ? t('common.action.save') : t('pages.k8s.form.add')}
        open={open}
        styles={{ body: { paddingTop: theme.paddingMD } }}
        title={
          editingItem
            ? editingHidden
              ? t('pages.k8s.forms.edit.secret.replaceData')
              : t('pages.k8s.forms.common.editData')
            : t('pages.k8s.forms.common.addData')
        }
        width={720}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
      >
        {editingHidden && (
          <Alert
            className={styles.modalNotice}
            showIcon
            title={t('pages.k8s.forms.edit.secret.replaceNotice')}
            type="info"
          />
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('pages.k8s.form.key')}
            name="keyName"
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.common.key.required'),
              },
              { max: 253, message: t('pages.k8s.forms.common.key.maxLength') },
              {
                pattern: SECRET_KEY_PATTERN,
                message: t('pages.k8s.forms.common.key.pattern'),
              },
              {
                validator: (_, fieldValue?: string) => {
                  const keyName = fieldValue?.trim();

                  if (!keyName) {
                    return Promise.resolve();
                  }
                  if (keyName in reserved && editingItem?.keyName !== keyName) {
                    return Promise.reject(
                      new Error(
                        t('pages.k8s.forms.secret.dataEditor.systemKey', {
                          keyName,
                        }),
                      ),
                    );
                  }
                  if (forbiddenKeys.includes(keyName)) {
                    return Promise.reject(
                      new Error(
                        t('pages.k8s.forms.edit.secret.dataEditor.fillAbove', {
                          keyName,
                        }),
                      ),
                    );
                  }
                  if (
                    value.some(
                      (item) =>
                        item.id !== editingId &&
                        item.keyName.trim() === keyName,
                    )
                  ) {
                    return Promise.reject(
                      new Error(
                        t('pages.k8s.forms.secret.dataEditor.keyDuplicate'),
                      ),
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input autoFocus={!keyDisabled} disabled={keyDisabled} />
          </Form.Item>
          <Form.Item
            label={t('pages.k8s.form.value')}
            name="value"
            rules={[
              {
                validator: (_, fieldValue?: string) =>
                  fieldValue === SECRET_MASK
                    ? Promise.reject(
                        new Error(
                          t(
                            'pages.k8s.forms.edit.secret.mask.valueNotAllowed',
                            {
                              mask: SECRET_MASK,
                            },
                          ),
                        ),
                      )
                    : Promise.resolve(),
              },
            ]}
          >
            <TextArea
              autoFocus={keyDisabled}
              autoSize={{ minRows: 5, maxRows: 10 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SecretEditDataEditor;
