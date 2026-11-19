/**
 * 保密字典「编辑设置」：按类型编辑数据，并可编辑标签 / 注解。
 * 加载到的值都是隐藏的：持有权限时可「查看明文」（记入审计），否则只能输入新值替换。
 */
import { CloseOutlined } from '@ant-design/icons';
import { Alert, App, Button, Drawer, Form, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import { revealSecret } from '@/services/k8s/resource';
import { usePermissions } from '@/services/system/permissions';
import type { EditFormProps } from '../../shared/edit';
import { EditSubmit, useEditObject } from '../../shared/edit';
import { toYaml } from '../../shared/kube';
import ResourceMetadataFields from '../../shared/ResourceMetadataFields';
import type { SecretEditFormValues, SecretPlaintext } from './helpers';
import {
  applySecretEdit,
  applySecretReveal,
  getSecretDataKeys,
  getSecretEditError,
  getSecretEditValues,
  isSecretImmutable,
} from './helpers';
import SecretEditDataSettings from './SecretEditDataSettings';

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
    minHeight: 'calc(100vh - 116px)',
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
  notice: {
    marginBottom: token.marginMD,
  },
  reveal: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
    marginBottom: token.marginMD,
  },
  revealHint: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  metadata: {
    marginTop: token.marginLG,
  },
}));

const TITLE = '编辑设置';

const SecretSettingsEditDrawer = ({
  clusterId,
  target,
  onClose,
  onDone,
}: EditFormProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const has = usePermissions();
  const canReveal = has('k8s.config.secret_reveal');
  const [form] = Form.useForm<SecretEditFormValues>();
  const { object, resourceVersion, loading, error, reload } = useEditObject(
    clusterId,
    target,
  );
  // 已查看的明文：只在本次编辑内使用，重新加载对象后作废
  const [reveal, setReveal] = useState<SecretPlaintext>();
  const [revealing, setRevealing] = useState(false);
  // 待提交的对象：有值时在抽屉之上打开提交弹窗（预检 → 对比 → 提交）
  const [pending, setPending] = useState<string>();
  const hasData = getSecretDataKeys(object).length > 0;

  // 每次加载到对象（含冲突后的重新加载）都以它重置表单
  useEffect(() => {
    if (!object) {
      return;
    }

    setReveal(undefined);
    form.resetFields();
    form.setFieldsValue(getSecretEditValues(object));
  }, [form, object]);

  const handleReveal = async () => {
    if (!object) {
      return;
    }

    setRevealing(true);
    try {
      const res = await revealSecret(
        clusterId,
        target.namespace ?? '',
        target.name ?? '',
      );
      const plaintext: SecretPlaintext = {
        data: res.data ?? {},
        binary: res.binary ?? [],
      };

      setReveal(plaintext);
      form.setFieldsValue(
        applySecretReveal(object, form.getFieldsValue(true), plaintext),
      );
    } catch {
      // 已由请求层提示
    } finally {
      setRevealing(false);
    }
  };

  const handleSubmit = async () => {
    if (!object) {
      return;
    }

    try {
      await form.validateFields();
    } catch {
      return;
    }

    const values: SecretEditFormValues = form.getFieldsValue(true);
    const formError = getSecretEditError(object, values, reveal);

    if (formError) {
      message.warning(formError);
      return;
    }

    setPending(toYaml(applySecretEdit(object, values, reveal)));
  };

  const renderRevealBar = () => {
    if (!hasData) {
      return null;
    }
    if (reveal) {
      return (
        <div className={styles.reveal}>
          <span className={styles.revealHint}>
            已显示明文。未修改的数据保存时保持原值。
          </span>
        </div>
      );
    }
    if (!canReveal) {
      return (
        <div className={styles.reveal}>
          <span className={styles.revealHint}>
            已有数据的值已隐藏，当前账号没有查看明文的权限；可以直接输入新值替换。
          </span>
        </div>
      );
    }

    return (
      <div className={styles.reveal}>
        <Button loading={revealing} size="small" onClick={handleReveal}>
          查看明文
        </Button>
        <span className={styles.revealHint}>
          已有数据的值已隐藏。查看明文会记入操作审计；也可以直接输入新值替换。
        </span>
      </div>
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
                {isSecretImmutable(object) ? (
                  <Alert
                    className={styles.notice}
                    showIcon
                    title="该保密字典已设为不可变（immutable），数据无法修改，仅可编辑标签与注解。"
                    type="warning"
                  />
                ) : (
                  <>
                    {renderRevealBar()}
                    <SecretEditDataSettings
                      canReveal={canReveal}
                      form={form}
                      manifest={object}
                      reveal={reveal}
                    />
                  </>
                )}
                <div className={styles.metadata}>
                  <ResourceMetadataFields />
                </div>
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

export default SecretSettingsEditDrawer;
