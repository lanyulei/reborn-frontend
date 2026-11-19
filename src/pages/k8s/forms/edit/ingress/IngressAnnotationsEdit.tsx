/** 编辑注解：应用路由的 metadata.annotations */
import { EditOutlined } from '@ant-design/icons';
import { App } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
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
      title="编辑注解"
      onBuild={async (object) => {
        if (!initial) {
          return undefined;
        }
        const error = getAnnotationRowsError(rows);
        if (error) {
          message.warning(error);
          return undefined;
        }
        return applyIngressAnnotations(object, initial, rows);
      }}
    >
      <div className={styles.sectionTitle}>元数据</div>
      <div className={styles.option}>
        <div className={styles.optionHeader}>
          <span className={styles.headerIcon}>
            <EditOutlined />
          </span>
          <span>
            <div className={styles.title}>编辑注解</div>
            <div className={styles.description}>为应用路由配置注解信息。</div>
          </span>
        </div>
        <div className={styles.metadataBody}>
          <div className={styles.fieldLabel}>注解</div>
          <KeyValueEditor
            addIcon={false}
            addText="添加"
            deleteAriaLabel="删除注解"
            value={rows}
            onAddBlocked={() => message.warning('请先填写已有注解的键。')}
            onChange={setRows}
            onCreateItem={() => createKeyValueItem()}
          />
        </div>
      </div>
    </EditDrawer>
  );
};

export default IngressAnnotationsEdit;
