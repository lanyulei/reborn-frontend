/** 回退工作负载：选择一条历史修改记录，回退到它的 Pod 模板。 */
import { RollbackOutlined } from '@ant-design/icons';
import { App, Form, Input, Modal, Select, Spin } from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { isChangeSubmitted } from '@/services/k8s/request';
import {
  listWorkloadRevisions,
  rollbackWorkload,
} from '@/services/k8s/resource';
import type { ResourceRef, Revision } from '@/services/k8s/typings';
import { ApprovalNotice } from './approval';

export const RollbackModal: React.FC<{
  clusterId: string;
  target: ResourceRef;
  onClose: () => void;
  onDone?: () => void;
}> = ({ clusterId, target: targetProp, onClose, onDone }) => {
  const { message } = App.useApp();
  // 弹窗按目标对象挂载：目标在生命周期内不变
  const target = useRef(targetProp).current;
  const [form] = Form.useForm<{ revision?: number }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);

  useEffect(() => {
    let cancelled = false;
    listWorkloadRevisions(clusterId, target)
      .then((res) => {
        if (!cancelled) setRevisions(res.items ?? []);
      })
      // 失败已由请求层提示
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clusterId, target]);

  const current = revisions.find((item) => item.current)?.revision;

  const submit = async () => {
    const values = await form.validateFields();
    if (!values.revision) return;
    setSaving(true);
    try {
      await rollbackWorkload(clusterId, target, values.revision);
      message.success('工作负载已回退');
      onDone?.();
      onClose();
    } catch (err) {
      // 已转为变更单：集群未改动，收起弹窗避免重复提交；其余失败已由请求层提示
      if (isChangeSubmitted(err)) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={
        <>
          <RollbackOutlined /> 回退
        </>
      }
      destroyOnHidden
      mask={{ closable: false }}
      confirmLoading={saving}
      okButtonProps={{ disabled: loading }}
      onCancel={onClose}
      onOk={() => void submit().catch(() => undefined)}
    >
      <ApprovalNotice />
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          <Form.Item label="资源名称">
            <Input disabled value={target.name} />
          </Form.Item>
          <Form.Item label="当前修改记录">
            <Input disabled value={current ? `#${current}` : '-'} />
          </Form.Item>
          <Form.Item
            label="目标修改记录"
            name="revision"
            rules={[{ required: true, message: '请选择目标修改记录' }]}
          >
            <Select<number>
              placeholder="请选择目标修改记录"
              showSearch={{ optionFilterProp: 'label' }}
              options={revisions
                .filter((item) => !item.current)
                .map((item) => ({
                  label: `#${item.revision}`,
                  value: item.revision,
                }))}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};
