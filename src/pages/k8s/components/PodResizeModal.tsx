/**
 * Pod 原地调整资源：不重建 Pod，直接修改运行中容器的 CPU / 内存请求与上限（集群的 resize 子资源，
 * 需要 Kubernetes 1.33+）。集群接受后由节点异步生效；改变 QoS 等级等不允许的调整由集群拒绝并返回原因。
 */
import {
  Alert,
  App,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Spin,
  Tag,
} from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import SectionTitle from '@/components/SectionTitle';
import { getK8sErrorMessage, isChangeSubmitted } from '@/services/k8s/request';
import { getObject, resizePod } from '@/services/k8s/resource';
import type { ResourceRef } from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { ApprovalNotice } from './approval';
import {
  buildResize,
  RESIZE_FIELDS,
  type ResizeContainer,
  type ResizeValues,
  removedFields,
  resizableContainers,
} from './podResize';
import { QUANTITY } from './workloadForm';

type Values = Record<string, ResizeValues | undefined>;

export const PodResizeModal: React.FC<{
  clusterId: string;
  target: ResourceRef;
  onClose: () => void;
  onDone?: () => void;
}> = ({ clusterId, target: targetProp, onClose, onDone }) => {
  const t = useT();
  const { message } = App.useApp();
  // 弹窗按目标对象挂载：目标在生命周期内不变
  const target = useRef(targetProp).current;
  const [form] = Form.useForm<Values>();
  const [containers, setContainers] = useState<ResizeContainer[]>();
  const [qos, setQos] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getObject(clusterId, target, { silent: true })
      .then((res) => {
        if (cancelled) return;
        const list = resizableContainers(res.object);
        setContainers(list);
        setQos(res.object.status?.qosClass);
        form.setFieldsValue(
          Object.fromEntries(list.map((c) => [c.name, { ...c.current }])),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setContainers([]);
          setError(getK8sErrorMessage(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [clusterId, target, form]);

  const submit = async () => {
    if (!containers) return;
    let values: Values;
    try {
      await form.validateFields();
      values = form.getFieldsValue(true) as Values;
    } catch {
      return; // 字段已就地标红
    }
    setError(undefined);
    const removed = removedFields(containers, values);
    if (removed.length > 0) {
      setError(
        t('pages.k8s.resize.noRemove', {
          fields: removed
            .map(
              (item) =>
                `${item.container} / ${t(`pages.k8s.form.${item.field}`)}`,
            )
            .join('、'),
        }),
      );
      return;
    }
    const body = buildResize(containers, values);
    if (body.length === 0) {
      setError(t('pages.k8s.change.noChange'));
      return;
    }
    setBusy(true);
    try {
      await resizePod(clusterId, target, body);
      message.success(t('pages.k8s.resize.accepted'));
      onDone?.();
      onClose();
    } catch (err) {
      if (isChangeSubmitted(err)) {
        onClose();
        return;
      }
      setError(getK8sErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      width={760}
      title={t('pages.k8s.resize.title', { name: target.name ?? '' })}
      destroyOnHidden
      mask={{ closable: false }}
      okText={t('common.action.confirm')}
      okButtonProps={{ disabled: !containers?.length }}
      confirmLoading={busy}
      onOk={() => void submit()}
      onCancel={onClose}
    >
      <ApprovalNotice />
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        title={t('pages.k8s.resize.hint')}
        description={qos ? t('pages.k8s.resize.qos', { qos }) : undefined}
      />
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={error}
        />
      )}
      <Spin spinning={!containers}>
        <Form
          form={form}
          layout="vertical"
          disabled={busy}
          onValuesChange={() => setError(undefined)}
        >
          {containers?.length === 0 && !error && <Empty />}
          {containers?.map((c) => (
            <div key={c.name}>
              <SectionTitle>
                {c.name}
                {c.sidecar && (
                  <Tag style={{ marginInlineStart: 8 }}>Sidecar</Tag>
                )}
              </SectionTitle>
              <Row gutter={16}>
                {RESIZE_FIELDS.map(([field]) => (
                  <Col span={12} key={field}>
                    <Form.Item
                      name={[c.name, field]}
                      label={t(`pages.k8s.form.${field}`)}
                      rules={[
                        {
                          pattern: QUANTITY,
                          message: t('pages.k8s.namespace.quantity.rule'),
                        },
                      ]}
                    >
                      <Input
                        placeholder={
                          c.current[field] ?? t('pages.k8s.form.unset')
                        }
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </Form>
      </Spin>
    </Modal>
  );
};
