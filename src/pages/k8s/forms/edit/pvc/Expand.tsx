/**
 * 持久卷声明「扩容」：只改声明的容量（spec.resources.requests.storage），且只能增大。
 * 所用存储类不允许卷扩容时给出提示并禁止保存。
 */
import { Alert, Form } from 'antd';
import { useEffect, useMemo, useState } from 'react';
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

const TITLE = '扩容持久卷声明';

const PersistentVolumeClaimExpandDrawer = ({
  clusterId,
  target,
  onClose,
  onDone,
}: EditFormProps) => {
  const { styles } = usePvcFormStyles();
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
          title={`存储类 ${storageClassName} 未开启「允许卷扩容」，无法扩容。请先在存储类上开启后再试。`}
          type="warning"
        />
      );
    }
    if (support === 'none') {
      return (
        <Alert
          className={styles.notice}
          showIcon
          title="该持久卷声明没有指定存储类，无法扩容。"
          type="warning"
        />
      );
    }
    if (support === 'unknown') {
      return (
        <Alert
          className={styles.notice}
          showIcon
          title={`无法读取存储类 ${storageClassName}，不能确认它是否允许卷扩容；不允许时提交会被集群拒绝。`}
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
        title={TITLE}
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
                label="容量"
                name="size"
                rules={[
                  { required: true, message: '请输入容量' },
                  {
                    validator: (_, value?: number | null) => {
                      if (value === undefined || value === null) {
                        return Promise.resolve();
                      }

                      const sizeError = getPvcSizeError(
                        object,
                        formatPvcQuantity(value, current.unit),
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
                当前容量 {currentRequest || '-'}
                。仅支持增大容量，且要求所用存储类允许卷扩容。
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

export default PersistentVolumeClaimExpandDrawer;
