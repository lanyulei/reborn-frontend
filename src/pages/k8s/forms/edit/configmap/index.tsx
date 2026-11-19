/**
 * 配置字典「编辑设置」：编辑 data 的键值与标签 / 注解。
 * binaryData 只列出键（不展示、不改动）；不可变（immutable）的配置字典只能改标签与注解。
 */
import { CloseOutlined } from '@ant-design/icons';
import { Alert, App, Button, Drawer, Form, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import ConfigMapDataSettings from '../../configmap/ConfigMapDataSettings';
import { getConfigMapBinaryKeys } from '../../configmap/helpers';
import type { EditFormProps } from '../../shared/edit';
import { EditSubmit, useEditObject } from '../../shared/edit';
import { toYaml } from '../../shared/kube';
import ResourceMetadataFields from '../../shared/ResourceMetadataFields';
import type { ConfigMapEditFormValues } from './helpers';
import {
  applyConfigMapEdit,
  getConfigMapEditError,
  getConfigMapEditValues,
  isConfigMapImmutable,
} from './helpers';

const useStyles = createStyles(({ token }) => ({
  drawer: {
    '.ant-drawer-header': {
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
    },
    '.ant-drawer-body': {
      padding: 0,
      background: token.colorBgLayout,
    },
    '.ant-drawer-footer': {
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      background: token.colorBgContainer,
    },
  },
  body: {
    height: 'calc(100vh - 116px)',
    overflow: 'auto',
    padding: token.paddingLG,
    background: token.colorBgContainer,

    '.ant-form-item-extra': {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
  section: {
    marginBottom: token.marginLG,
  },
  notice: {
    marginBottom: token.marginMD,
  },
}));

const TITLE = '编辑设置';

const ConfigMapSettingsEditDrawer = ({
  clusterId,
  target,
  onClose,
  onDone,
}: EditFormProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [form] = Form.useForm<ConfigMapEditFormValues>();
  const { object, resourceVersion, loading, error, reload } = useEditObject(
    clusterId,
    target,
  );
  // 待提交的对象：有值时在抽屉之上打开提交弹窗（预检 → 对比 → 提交）
  const [pending, setPending] = useState<string>();
  const immutable = isConfigMapImmutable(object);
  const binaryKeys = getConfigMapBinaryKeys(object);

  // 每次加载到对象（含冲突后的重新加载）都以它重置表单
  useEffect(() => {
    if (!object) {
      return;
    }

    form.resetFields();
    form.setFieldsValue(getConfigMapEditValues(object));
  }, [form, object]);

  const handleSubmit = async () => {
    if (!object) {
      return;
    }

    try {
      await form.validateFields();
    } catch {
      return;
    }

    const values: ConfigMapEditFormValues = form.getFieldsValue(true);
    const formError = getConfigMapEditError(object, values);

    if (formError) {
      message.warning(formError);
      return;
    }

    setPending(toYaml(applyConfigMapEdit(object, values)));
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
              onClick={handleSubmit}
            >
              保存
            </Button>
          </div>
        }
        keyboard={false}
        mask={{ closable: false }}
        open
        size="78vw"
        title={TITLE}
        onClose={onClose}
      >
        <Spin spinning={loading}>
          <div className={styles.body}>
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
              <Form form={form} layout="vertical" preserve requiredMark>
                {immutable ? (
                  <Alert
                    className={styles.notice}
                    showIcon
                    title="该配置字典已设为不可变（immutable），数据无法修改，仅可编辑标签与注解。"
                    type="warning"
                  />
                ) : (
                  <div className={styles.section}>
                    <ConfigMapDataSettings />
                  </div>
                )}
                {binaryKeys.length > 0 && (
                  <Alert
                    className={styles.notice}
                    showIcon
                    title={`二进制数据（${binaryKeys.join('、')}）不在此处编辑，保存时原样保留。`}
                    type="info"
                  />
                )}
                <ResourceMetadataFields />
              </Form>
            )}
          </div>
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

export default ConfigMapSettingsEditDrawer;
