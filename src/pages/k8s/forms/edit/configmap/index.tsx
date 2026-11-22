/**
 * 配置字典「编辑设置」：编辑 data 的键值与标签 / 注解。
 * binaryData 只列出键（不展示、不改动）；不可变（immutable）的配置字典只能改标签与注解。
 */
import { CloseOutlined } from '@ant-design/icons';
import { Alert, App, Button, Drawer, Form, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import { useT } from '@/utils/i18n';
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

const ConfigMapSettingsEditDrawer = ({
  clusterId,
  target,
  onClose,
  onDone,
}: EditFormProps) => {
  const { styles } = useStyles();
  const t = useT();
  const title = t('pages.k8s.forms.common.editSettings');
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
    const formError = getConfigMapEditError(object, values, t);

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
            <Button onClick={onClose}>{t('common.action.cancel')}</Button>
            <Button
              disabled={!object || loading}
              type="primary"
              onClick={handleSubmit}
            >
              {t('common.action.save')}
            </Button>
          </div>
        }
        keyboard={false}
        mask={{ closable: false }}
        open
        size="78vw"
        title={title}
        onClose={onClose}
      >
        <Spin spinning={loading}>
          <div className={styles.body}>
            {error && (
              <Alert
                action={
                  <Button size="small" onClick={reload}>
                    {t('pages.k8s.table.retry')}
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
                    title={t('pages.k8s.forms.edit.configmap.immutable')}
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
                    title={t(
                      'pages.k8s.forms.edit.configmap.binaryKeysNotice',
                      {
                        keys: binaryKeys.join(', '),
                      },
                    )}
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
          title={title}
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
