/**
 * 持久卷声明「扩容」：只改声明的容量（spec.resources.requests.storage），且只能增大。
 * 所用存储类不允许卷扩容时给出提示并禁止保存。
 */
import { Alert, Form } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/utils/i18n';
import type { EditFormProps } from '../../shared/edit';
import { EditSubmit, useEditObject } from '../../shared/edit';
import { fetchObject, GVRS, toYaml } from '../../shared/kube';
import UnitInputNumber from '../../shared/UnitInputNumber';
import {
  applyPvcExpand,
  formatPvcQuantity,
  getPvcSizeError,
  getPvcStorageClassName,
  getPvcStorageRequest,
  getPvcStorageSize,
} from './helpers';
import PvcEditDrawerShell, { usePvcFormStyles } from './PvcEditDrawerShell';

type ExpandFormValues = {
  size?: number;
};

/** 存储类是否允许卷扩容：checking 查询中；unknown 取不到存储类（无权限或已删除） */
type ExpansionSupport = 'allowed' | 'checking' | 'denied' | 'none' | 'unknown';

const PersistentVolumeClaimExpandDrawer = ({
  clusterId,
  target,
  onClose,
  onDone,
}: EditFormProps) => {
  const { styles } = usePvcFormStyles();
  const t = useT();
  const title = t('pages.k8s.forms.edit.pvc.expand.title');
  const [form] = Form.useForm<ExpandFormValues>();
  const { object, resourceVersion, loading, error, reload } = useEditObject(
    clusterId,
    target,
  );
  const [support, setSupport] = useState<ExpansionSupport>('checking');
  // 待提交的对象：有值时在抽屉之上打开提交弹窗（预检 → 对比 → 提交）
  const [pending, setPending] = useState<string>();
  const current = useMemo(() => getPvcStorageSize(object), [object]);
  const currentRequest = getPvcStorageRequest(object);
  const storageClassName = getPvcStorageClassName(object);

  // 每次加载到对象（含冲突后的重新加载）都以它重置表单，并重新确认存储类是否允许扩容
  useEffect(() => {
    if (!object) {
      return;
    }

    form.setFieldsValue({ size: current.size });

    if (!storageClassName) {
      setSupport('none');
      return;
    }

    let cancelled = false;
    setSupport('checking');
    fetchObject(clusterId, GVRS.storageClass, storageClassName).then(
      (storageClass) => {
        if (cancelled) {
          return;
        }
        if (!storageClass) {
          setSupport('unknown');
          return;
        }
        setSupport(
          (storageClass as Record<string, unknown>).allowVolumeExpansion ===
            true
            ? 'allowed'
            : 'denied',
        );
      },
    );

    return () => {
      cancelled = true;
    };
  }, [clusterId, current, form, object, storageClassName]);

  const handleSubmit = async () => {
    if (!object) {
      return;
    }

    let values: ExpandFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setPending(
      toYaml(
        applyPvcExpand(
          object,
          formatPvcQuantity(values.size ?? current.size, current.unit),
        ),
      ),
    );
  };

  const renderSupportNotice = () => {
    if (support === 'denied') {
      return (
        <Alert
          className={styles.notice}
          showIcon
          title={t('pages.k8s.forms.edit.pvc.expand.denied', {
            name: storageClassName,
          })}
          type="warning"
        />
      );
    }
    if (support === 'none') {
      return (
        <Alert
          className={styles.notice}
          showIcon
          title={t('pages.k8s.forms.edit.pvc.expand.noStorageClass')}
          type="warning"
        />
      );
    }
    if (support === 'unknown') {
      return (
        <Alert
          className={styles.notice}
          showIcon
          title={t('pages.k8s.forms.edit.pvc.expand.unknown', {
            name: storageClassName,
          })}
          type="info"
        />
      );
    }

    return null;
  };

  return (
    <>
      <PvcEditDrawerShell
        error={error}
        loading={loading}
        submitDisabled={
          !object ||
          support === 'checking' ||
          support === 'denied' ||
          support === 'none'
        }
        title={title}
        onCancel={onClose}
        onReload={reload}
        onSubmit={handleSubmit}
      >
        {object && (
          <>
            {renderSupportNotice()}
            <Form
              className={styles.form}
              form={form}
              layout="vertical"
              requiredMark
            >
              <Form.Item
                label={t('pages.k8s.forms.common.capacity')}
                name="size"
                rules={[
                  {
                    required: true,
                    message: t('pages.k8s.forms.common.capacity.required'),
                  },
                  {
                    validator: (_, value?: number | null) => {
                      if (value === undefined || value === null) {
                        return Promise.resolve();
                      }

                      const sizeError = getPvcSizeError(
                        object,
                        formatPvcQuantity(value, current.unit),
                        t,
                      );

                      return sizeError
                        ? Promise.reject(new Error(sizeError))
                        : Promise.resolve();
                    },
                  },
                ]}
              >
                <UnitInputNumber
                  className={styles.field}
                  min={current.size}
                  precision={Number.isInteger(current.size) ? 0 : undefined}
                  unit={current.unit}
                />
              </Form.Item>
              <div className={styles.helpText}>
                {t('pages.k8s.forms.edit.pvc.expand.help', {
                  capacity: currentRequest || '-',
                })}
              </div>
            </Form>
          </>
        )}
      </PvcEditDrawerShell>
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

export default PersistentVolumeClaimExpandDrawer;
