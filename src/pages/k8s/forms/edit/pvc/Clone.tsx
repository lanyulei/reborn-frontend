/**
 * 持久卷声明「克隆」：以当前声明为数据源，在同一命名空间创建一个新的声明。
 * 存储类、访问模式、卷模式与当前声明一致，容量不能小于当前声明。
 */
import { Form, Input } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/utils/i18n';
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

const PersistentVolumeClaimCloneDrawer = ({
  clusterId,
  target,
  onClose,
  onDone,
}: EditFormProps) => {
  const { styles } = usePvcFormStyles();
  const t = useT();
  const title = t('pages.k8s.forms.edit.pvc.clone.title');
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
        submitText={t('common.action.submitCreate')}
        title={title}
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
              label={t('pages.k8s.forms.common.name')}
              name="name"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: t('pages.k8s.forms.common.name.required'),
                },
                {
                  max: 253,
                  message: t('pages.k8s.forms.common.name.maxLength253'),
                },
                {
                  pattern: NAME_PATTERN,
                  message: t('pages.k8s.forms.edit.pvc.clone.name.pattern'),
                },
                {
                  validator: (_, value?: string) =>
                    value && value.trim() === sourceName
                      ? Promise.reject(
                          new Error(
                            t(
                              'pages.k8s.forms.edit.pvc.clone.name.sameAsSource',
                            ),
                          ),
                        )
                      : Promise.resolve(),
                },
              ]}
            >
              <Input
                className={styles.field}
                placeholder={t('pages.k8s.forms.common.name.required')}
              />
            </Form.Item>
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
              {t('pages.k8s.forms.edit.pvc.clone.help', {
                capacity: currentRequest || '-',
              })}
            </div>
          </Form>
        )}
      </PvcEditDrawerShell>
      {pending !== undefined && (
        <SubmitManifest
          clusterId={clusterId}
          namespace={target.namespace}
          title={title}
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
