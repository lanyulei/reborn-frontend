/**
 * 持久卷声明「克隆」：以当前声明为数据源，在同一命名空间创建一个新的声明。
 * 存储类、访问模式、卷模式与当前声明一致，容量不能小于当前声明。
 */
import { Form, Input } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { NAME_PATTERN } from '../../pvc/helpers';
import type { EditFormProps } from '../../shared/edit';
import { useEditObject } from '../../shared/edit';
import { toYaml } from '../../shared/kube';
import { SubmitManifest } from '../../shared/SubmitManifest';
import UnitInputNumber from '../../shared/UnitInputNumber';
import {
  buildPvcCloneManifest,
  formatPvcQuantity,
  getPvcSizeError,
  getPvcStorageRequest,
  getPvcStorageSize,
} from './helpers';
import PvcEditDrawerShell, { usePvcFormStyles } from './PvcEditDrawerShell';

type CloneFormValues = {
  name?: string;
  size?: number;
};

const TITLE = '克隆持久卷声明';

const PersistentVolumeClaimCloneDrawer = ({
  clusterId,
  target,
  onClose,
  onDone,
}: EditFormProps) => {
  const { styles } = usePvcFormStyles();
  const [form] = Form.useForm<CloneFormValues>();
  const { object, loading, error, reload } = useEditObject(clusterId, target);
  // 待提交的清单：有值时在抽屉之上打开清单弹窗（预检 → 提交）
  const [pending, setPending] = useState<string>();
  const current = useMemo(() => getPvcStorageSize(object), [object]);
  const currentRequest = getPvcStorageRequest(object);
  const sourceName = target.name;

  useEffect(() => {
    if (!object) {
      return;
    }

    form.setFieldsValue({
      name: sourceName ? `${sourceName}-clone` : undefined,
      size: current.size,
    });
  }, [current, form, object, sourceName]);

  const handleSubmit = async () => {
    if (!object) {
      return;
    }

    let values: CloneFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setPending(
      toYaml(
        buildPvcCloneManifest(
          object,
          values.name?.trim() || '',
          formatPvcQuantity(values.size ?? current.size, current.unit),
        ),
      ),
    );
  };

  return (
    <>
      <PvcEditDrawerShell
        error={error}
        loading={loading}
        submitDisabled={!object}
        submitText="创建"
        title={TITLE}
        onCancel={onClose}
        onReload={reload}
        onSubmit={handleSubmit}
      >
        {object && (
          <Form
            className={styles.form}
            form={form}
            layout="vertical"
            requiredMark
          >
            <Form.Item
              label="名称"
              name="name"
              rules={[
                { required: true, whitespace: true, message: '请输入名称' },
                { max: 253, message: '名称最长 253 个字符' },
                {
                  pattern: NAME_PATTERN,
                  message: '名称只能包含小写字母、数字和中划线',
                },
                {
                  validator: (_, value?: string) =>
                    value && value.trim() === sourceName
                      ? Promise.reject(
                          new Error('名称不能与当前持久卷声明相同'),
                        )
                      : Promise.resolve(),
                },
              ]}
            >
              <Input className={styles.field} placeholder="请输入名称" />
            </Form.Item>
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
              克隆会基于当前 PVC（容量 {currentRequest || '-'}
              ）创建新的持久卷声明，访问模式、卷模式和存储类保持一致。
            </div>
          </Form>
        )}
      </PvcEditDrawerShell>
      {pending !== undefined && (
        <SubmitManifest
          clusterId={clusterId}
          namespace={target.namespace}
          title={TITLE}
          yaml={pending}
          onBack={() => setPending(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default PersistentVolumeClaimCloneDrawer;
