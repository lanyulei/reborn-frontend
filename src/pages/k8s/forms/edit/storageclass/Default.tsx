/**
 * 存储类「设为默认存储类 / 取消默认」：按当前状态给出相反的操作，确认后进入提交（预检 → 对比 → 提交）。
 * 设为默认时，若已有其它默认存储类则给出提示（集群允许多个默认，但新建的声明会无法确定用哪个）。
 */
import { Alert, Button, Modal, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import { useT } from '@/utils/i18n';
import type { EditFormProps } from '../../shared/edit';
import { EditSubmit, useEditObject } from '../../shared/edit';
import { GVRS, listRows, toYaml } from '../../shared/kube';
import { applyStorageClassDefault, isDefaultStorageClass } from './helpers';

const useStyles = createStyles(({ token }) => ({
  body: {
    minHeight: 64,
    paddingTop: token.paddingXS,
  },
  text: {
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
  },
  hint: {
    marginTop: token.marginXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  notice: {
    marginBottom: token.marginSM,
  },
}));

const StorageClassDefaultModal = ({
  clusterId,
  target,
  onClose,
  onDone,
}: EditFormProps) => {
  const { styles } = useStyles();
  const t = useT();
  const { object, resourceVersion, loading, error, reload } = useEditObject(
    clusterId,
    target,
  );
  // 其它已是默认的存储类
  const [otherDefaults, setOtherDefaults] = useState<string[]>([]);
  // 待提交的对象：有值时在弹窗之上打开提交弹窗（预检 → 对比 → 提交）
  const [pending, setPending] = useState<string>();
  const isDefault = isDefaultStorageClass(object);
  const name = target.name || '';
  const title = isDefault
    ? t('pages.k8s.forms.edit.storageclass.default.unset.title')
    : t('pages.k8s.forms.edit.storageclass.default.set.title');

  useEffect(() => {
    if (!object) {
      return;
    }

    let cancelled = false;
    listRows(clusterId, GVRS.storageClass).then((rows) => {
      if (!cancelled) {
        setOtherDefaults(
          rows
            .filter((row) => row.name !== name && row.cells?.default === '是')
            .map((row) => row.name),
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [clusterId, name, object]);

  return (
    <>
      <Modal
        destroyOnHidden
        keyboard={false}
        mask={{ closable: false }}
        okButtonProps={{ disabled: !object || loading }}
        okText={t('common.action.confirm')}
        open
        title={title}
        width={520}
        onCancel={onClose}
        onOk={() => {
          if (object) {
            setPending(toYaml(applyStorageClassDefault(object, !isDefault)));
          }
        }}
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
            {object && !isDefault && otherDefaults.length > 0 && (
              <Alert
                className={styles.notice}
                showIcon
                title={t('pages.k8s.forms.edit.storageclass.default.others', {
                  names: otherDefaults.join(
                    t('pages.k8s.forms.storageclass.listSeparator'),
                  ),
                })}
                type="warning"
              />
            )}
            {object &&
              (isDefault ? (
                <>
                  <div className={styles.text}>
                    {t(
                      'pages.k8s.forms.edit.storageclass.default.unset.confirm',
                      { name },
                    )}
                  </div>
                  <div className={styles.hint}>
                    {t('pages.k8s.forms.edit.storageclass.default.unset.hint')}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.text}>
                    {t(
                      'pages.k8s.forms.edit.storageclass.default.set.confirm',
                      { name },
                    )}
                  </div>
                  <div className={styles.hint}>
                    {t('pages.k8s.forms.edit.storageclass.default.set.hint')}
                  </div>
                </>
              ))}
          </div>
        </Spin>
      </Modal>
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

export default StorageClassDefaultModal;
