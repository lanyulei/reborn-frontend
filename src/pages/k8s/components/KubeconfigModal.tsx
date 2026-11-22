/**
 * 签发限时 kubeconfig：选择集群与有效期 → 展示 kubeconfig（只显示这一次）。kubeconfig 指向平台的集群代理
 * 入口，权限与平台内一致；吊销、过期或账号停用后立即失效。
 */
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { Alert, App, Button, Form, Input, Modal, Select, Space } from 'antd';
import type React from 'react';
import { useState } from 'react';
import {
  type IssuedKubeconfig,
  issueKubeconfig,
} from '@/services/k8s/governance';
import { useClusterOptions } from '@/services/k8s/useClusterOptions';
import { saveBlob } from '@/utils/download';
import { useT } from '@/utils/i18n';
import { formatTime } from './cells';
import { YamlEditor } from './YamlEditor';

const HOUR = 3600;
const TTL_OPTIONS = [1, 4, 8, 24, 72, 168];

interface FormValues {
  clusterId: string;
  ttlHours: number;
  note?: string;
}

/** server 为相对路径时（后端未配置对外地址）拼上当前站点地址 */
const resolveKubeconfig = (issued: IssuedKubeconfig): string =>
  issued.server.startsWith('/')
    ? issued.kubeconfig.replace(
        JSON.stringify(issued.server),
        JSON.stringify(window.location.origin + issued.server),
      )
    : issued.kubeconfig;

export const KubeconfigModal: React.FC<{
  defaultClusterId?: string;
  onClose: () => void;
  onIssued: () => void;
}> = ({ defaultClusterId, onClose, onIssued }) => {
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const { data: clusterItems } = useClusterOptions();
  const clusters = clusterItems ?? [];
  const [loading, setLoading] = useState(false);
  const [issued, setIssued] = useState<IssuedKubeconfig>();

  const submit = async () => {
    const values = await form.validateFields().catch(() => undefined);
    if (!values) return;
    setLoading(true);
    try {
      setIssued(
        await issueKubeconfig(values.clusterId, {
          ttlSeconds: values.ttlHours * HOUR,
          note: values.note?.trim() || undefined,
        }),
      );
      onIssued();
    } catch {
      // 失败已由请求层提示
    } finally {
      setLoading(false);
    }
  };

  const text = issued ? resolveKubeconfig(issued) : '';

  return (
    <Modal
      open
      width={720}
      title={t('pages.k8s.kubeconfig.issue')}
      onCancel={onClose}
      mask={{ closable: false }}
      // 凭证只显示这一次：签发后只能点「已保存」关闭，Esc 与右上角关闭按钮都不生效
      keyboard={!issued}
      closable={!issued}
      destroyOnHidden
      footer={
        issued ? (
          <Button type="primary" onClick={onClose}>
            {t('pages.k8s.kubeconfig.saved')}
          </Button>
        ) : (
          <Space>
            <Button onClick={onClose}>{t('common.action.cancel')}</Button>
            <Button type="primary" loading={loading} onClick={submit}>
              {t('pages.k8s.kubeconfig.issue')}
            </Button>
          </Space>
        )
      }
    >
      {!issued && (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ clusterId: defaultClusterId, ttlHours: 8 }}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title={t('pages.k8s.kubeconfig.hint')}
          />
          <Form.Item
            name="clusterId"
            label={t('pages.k8s.scope.cluster')}
            rules={[{ required: true }]}
          >
            <Select
              showSearch={{ optionFilterProp: 'label' }}
              options={clusters.map((c) => ({
                value: c.id,
                label: c.displayName ? `${c.displayName}（${c.name}）` : c.name,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="ttlHours"
            label={t('pages.k8s.kubeconfig.ttl')}
            rules={[{ required: true }]}
          >
            <Select
              options={TTL_OPTIONS.map((h) => ({
                value: h,
                label:
                  h < 24
                    ? t('pages.k8s.kubeconfig.ttl.hours', { n: h })
                    : t('pages.k8s.kubeconfig.ttl.days', { n: h / 24 }),
              }))}
            />
          </Form.Item>
          <Form.Item name="note" label={t('pages.k8s.kubeconfig.note')}>
            <Input maxLength={128} />
          </Form.Item>
        </Form>
      )}
      {issued && (
        <>
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            title={t('pages.k8s.kubeconfig.once', {
              time: formatTime(issued.token.expireTime),
            })}
          />
          <YamlEditor value={text} readOnly height={300} />
          <Space style={{ marginTop: 12 }}>
            <Button
              icon={<CopyOutlined />}
              onClick={() =>
                navigator.clipboard
                  .writeText(text)
                  .then(() => message.success(t('pages.k8s.kubeconfig.copied')))
                  .catch(() =>
                    message.error(t('pages.k8s.kubeconfig.copyFailed')),
                  )
              }
            >
              {t('common.action.copy')}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                saveBlob(
                  new Blob([text], { type: 'application/yaml' }),
                  `kubeconfig-${issued.token.clusterName ?? 'cluster'}.yaml`,
                )
              }
            >
              {t('pages.k8s.kubeconfig.download')}
            </Button>
          </Space>
          <Alert
            type="info"
            style={{ marginTop: 12 }}
            title={t('pages.k8s.kubeconfig.usage')}
          />
        </>
      )}
    </Modal>
  );
};

export default KubeconfigModal;
