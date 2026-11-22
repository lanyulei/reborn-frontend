/** 编辑注解：应用路由的 metadata.annotations */
import { EditOutlined } from '@ant-design/icons';
import { App } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/utils/i18n';
import { createKeyValueItem } from '../../ingress/helpers';
import type { EditFormProps } from '../../shared/edit';
import { useEditObject } from '../../shared/edit';
import type { KeyValueEditorItem } from '../../shared/KeyValueEditor';
import KeyValueEditor from '../../shared/KeyValueEditor';
import EditDrawer from '../service/EditDrawer';
import {
  applyIngressAnnotations,
  buildAnnotationRows,
  getAnnotationRowsError,
} from './helpers';

const useStyles = createStyles(({ token }) => ({
  sectionTitle: {
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  option: {
    padding: '12px 16px',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  optionHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
  },
  headerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  },
  title: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  description: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  metadataBody: {
    marginTop: 14,
    borderRadius: token.borderRadiusSM,
  },
  fieldLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

const IngressAnnotationsEdit = (props: EditFormProps) => {
  const { styles } = useStyles();
  const t = useT();
  const { message } = App.useApp();
  const state = useEditObject(props.clusterId, props.target);
  const initial = useMemo(
    () => (state.object ? buildAnnotationRows(state.object) : undefined),
    [state.object],
  );
  const [rows, setRows] = useState<KeyValueEditorItem[]>([]);

  // 对象加载（或重新加载）后重置编辑行
  useEffect(() => {
    if (initial) {
      setRows(initial);
    }
  }, [initial]);

  return (
    <EditDrawer
      {...props}
      state={state}
      title={t('pages.k8s.forms.edit.ingress.annotationsTitle')}
      onBuild={async (object) => {
        if (!initial) {
          return undefined;
        }
        const error = getAnnotationRowsError(rows, t);
        if (error) {
          message.warning(error);
          return undefined;
        }
        return applyIngressAnnotations(object, initial, rows);
      }}
    >
      <div className={styles.sectionTitle}>
        {t('pages.k8s.forms.common.metadata')}
      </div>
      <div className={styles.option}>
        <div className={styles.optionHeader}>
          <span className={styles.headerIcon}>
            <EditOutlined />
          </span>
          <span>
            <div className={styles.title}>
              {t('pages.k8s.forms.edit.ingress.annotationsTitle')}
            </div>
            <div className={styles.description}>
              {t('pages.k8s.forms.edit.ingress.annotations.description')}
            </div>
          </span>
        </div>
        <div className={styles.metadataBody}>
          <div className={styles.fieldLabel}>
            {t('pages.k8s.forms.common.annotations')}
          </div>
          <KeyValueEditor
            addIcon={false}
            addText={t('pages.k8s.form.add')}
            deleteAriaLabel={t('pages.k8s.forms.common.deleteAnnotation')}
            value={rows}
            onAddBlocked={() =>
              message.warning(t('pages.k8s.forms.common.annotationKeyFirst'))
            }
            onChange={setRows}
            onCreateItem={() => createKeyValueItem()}
          />
        </div>
      </div>
    </EditDrawer>
  );
};

export default IngressAnnotationsEdit;
