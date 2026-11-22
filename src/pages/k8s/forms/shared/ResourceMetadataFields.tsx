import { DownOutlined, UpOutlined } from '@ant-design/icons';
import type { FormItemProps } from 'antd';
import { App, Form } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import type { Translate } from '@/utils/i18n';
import { useT } from '@/utils/i18n';
import { validLabelKey } from '../../components/workloadForm';
import type { KeyValueEditorItem } from './KeyValueEditor';
import KeyValueEditor from './KeyValueEditor';
import { createId } from './manifest';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  fieldTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  // 折叠外观：与工作负载向导「高级设置」里的「添加元数据」一致
  option: {
    padding: '12px 16px',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  optionHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
    width: '100%',
    padding: 0,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
  },
  headerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  },
  optionTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  optionDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  optionBody: {
    marginTop: 14,
  },
  hidden: {
    display: 'none',
  },
}));

/** 标签 / 注解的键：[前缀/]名称（i18n 键，渲染时经 t 翻译） */
export const METADATA_KEY_HINT = 'pages.k8s.form.key.rule';

const createMetadataItem = (keyName = '', value = ''): KeyValueEditorItem => ({
  id: createId(),
  keyName,
  value,
});

type MetadataFieldConfig = {
  addBlockedMessage: string;
  deleteAriaLabel: string;
  itemName: FormItemProps['name'];
  title: string;
};

type ResourceMetadataFieldsProps = {
  annotationsName?: FormItemProps['name'];
  labelsName?: FormItemProps['name'];
  order?: ('annotations' | 'labels')[];
  /** 收进默认折叠的「添加元数据」（没有「高级设置」步骤的向导用）；缺省直接展开 */
  collapsible?: boolean;
};

const getFieldConfig = (
  type: 'annotations' | 'labels',
  names: Pick<ResourceMetadataFieldsProps, 'annotationsName' | 'labelsName'>,
  t: Translate,
): MetadataFieldConfig => {
  if (type === 'labels') {
    return {
      addBlockedMessage: t('pages.k8s.forms.common.labelKeyFirst'),
      deleteAriaLabel: t('pages.k8s.forms.common.deleteLabel'),
      itemName: names.labelsName ?? 'labels',
      title: t('pages.k8s.forms.common.labels'),
    };
  }

  return {
    addBlockedMessage: t('pages.k8s.forms.common.annotationKeyFirst'),
    deleteAriaLabel: t('pages.k8s.forms.common.deleteAnnotation'),
    itemName: names.annotationsName ?? 'annotations',
    title: t('pages.k8s.forms.common.annotations'),
  };
};

const ResourceMetadataFields = ({
  annotationsName = 'annotations',
  labelsName = 'labels',
  order = ['labels', 'annotations'],
  collapsible = false,
}: ResourceMetadataFieldsProps) => {
  const t = useT();
  const { styles, cx } = useStyles();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);

  const fields = (
    <div className={styles.stack}>
      {order.map((type) => {
        const field = getFieldConfig(
          type,
          {
            annotationsName,
            labelsName,
          },
          t,
        );

        return (
          <div className={styles.field} key={type}>
            <div className={styles.fieldTitle}>{field.title}</div>
            <Form.Item name={field.itemName}>
              <KeyValueEditor
                addIcon={false}
                addText={t('pages.k8s.form.add')}
                deleteAriaLabel={field.deleteAriaLabel}
                minRows={1}
                onAddBlocked={() => message.warning(field.addBlockedMessage)}
                onCreateItem={() => createMetadataItem()}
                validateKey={validLabelKey}
                invalidKeyHint={t(METADATA_KEY_HINT)}
              />
            </Form.Item>
          </div>
        );
      })}
    </div>
  );

  if (!collapsible) {
    return fields;
  }

  return (
    <div className={styles.option}>
      <button
        aria-expanded={open}
        className={styles.optionHeader}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.headerIcon}>
          {open ? <UpOutlined /> : <DownOutlined />}
        </span>
        <span>
          <div className={styles.optionTitle}>
            {t('pages.k8s.forms.common.addMetadata')}
          </div>
          <div className={styles.optionDescription}>
            {t('pages.k8s.forms.shared.metadata.description')}
          </div>
        </span>
      </button>
      {/* 折叠时只是隐藏：字段保持挂载，已填的内容不会丢，提交时照常带上 */}
      <div className={cx(styles.optionBody, !open && styles.hidden)}>
        {fields}
      </div>
    </div>
  );
};

export type { ResourceMetadataFieldsProps };
export default ResourceMetadataFields;
