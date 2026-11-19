/** 存储类「设置卷操作」：允许卷扩容的开关（只改 allowVolumeExpansion） */
import { CloseOutlined } from '@ant-design/icons';
import { Alert, Button, Drawer, Form, Spin, Switch } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import type { EditFormProps } from '../../shared/edit';
import { EditSubmit, useEditObject } from '../../shared/edit';
import { toYaml } from '../../shared/kube';
import {
  applyStorageClassVolumeExpansion,
  isVolumeExpansionAllowed,
} from './helpers';

const useStyles = createStyles(({ token }) => ({
  drawer: {
    '.ant-drawer-header': {
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
    },
    '.ant-drawer-body': {
      padding: token.paddingLG,
      background: token.colorBgContainer,
    },
    '.ant-drawer-footer': {
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      background: token.colorBgContainer,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
  form: {
    width: '100%',
  },
  notice: {
    marginBottom: token.marginMD,
  },
  operationList: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
  },
  operationItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginLG,
    minHeight: 56,
    padding: `${token.paddingSM}px ${token.padding}px`,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,

    '&:last-child': {
      borderBottom: 0,
    },

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  operationLabel: {
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
  },
  helpText: {
    marginTop: token.marginSM,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
}));

type VolumeOperationFormValues = {
  allowVolumeExpansion?: boolean;
};

const TITLE = '设置卷操作';

const StorageClassVolumeOperationDrawer = ({
  clusterId,
  target,
  onClose,
  onDone,
}: EditFormProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<VolumeOperationFormValues>();
  const { object, resourceVersion, loading, error, reload } = useEditObject(
    clusterId,
    target,
  );
  // 待提交的对象：有值时在抽屉之上打开提交弹窗（预检 → 对比 → 提交）
  const [pending, setPending] = useState<string>();

  // 每次加载到对象（含冲突后的重新加载）都以它重置表单
  useEffect(() => {
    if (object) {
      form.setFieldsValue({
        allowVolumeExpansion: isVolumeExpansionAllowed(object),
      });
    }
  }, [form, object]);

  const handleOk = () => {
    if (!object) {
      return;
    }

    const values: VolumeOperationFormValues = form.getFieldsValue(true);
    setPending(
      toYaml(
        applyStorageClassVolumeExpansion(
          object,
          Boolean(values.allowVolumeExpansion),
        ),
      ),
    );
  };

  return (
    <>
      <Drawer
        className={styles.drawer}
        closeIcon={<CloseOutlined />}
        destroyOnHidden
        footer={
          <div className={styles.footer}>
            <Button onClick={onClose}>取消</Button>
            <Button
              disabled={!object || loading}
              type="primary"
              onClick={handleOk}
            >
              保存
            </Button>
          </div>
        }
        keyboard={false}
        mask={{ closable: false }}
        open
        size={520}
        title={TITLE}
        onClose={onClose}
      >
        <Spin spinning={loading}>
          {error && (
            <Alert
              action={
                <Button size="small" onClick={reload}>
                  重试
                </Button>
              }
              className={styles.notice}
              showIcon
              title={error}
              type="error"
            />
          )}
          {object && (
            <Form<VolumeOperationFormValues>
              className={styles.form}
              form={form}
              layout="horizontal"
            >
              <div className={styles.operationList}>
                <div className={styles.operationItem}>
                  <span className={styles.operationLabel}>允许卷扩容</span>
                  <Form.Item
                    name="allowVolumeExpansion"
                    valuePropName="checked"
                  >
                    <Switch aria-label="允许卷扩容" />
                  </Form.Item>
                </div>
              </div>
              <div className={styles.helpText}>
                开启后，使用该存储类的持久卷声明可以扩容（还需存储插件支持）；关闭只影响之后的扩容请求。
              </div>
            </Form>
          )}
        </Spin>
      </Drawer>
      {pending !== undefined && (
        <EditSubmit
          clusterId={clusterId}
          resourceVersion={resourceVersion}
          target={target}
          title={TITLE}
          yaml={pending}
          onBack={() => setPending(undefined)}
          onClose={onClose}
          onDone={onDone}
          onReload={reload}
        />
      )}
    </>
  );
};

export default StorageClassVolumeOperationDrawer;
