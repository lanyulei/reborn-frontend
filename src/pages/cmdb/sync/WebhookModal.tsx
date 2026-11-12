/**
 * 回调令牌：展示数据面回调路径与请求头；轮换后令牌明文只显示一次；可停用。
 */
import { App, Button, Descriptions, Modal, Space, Typography } from 'antd';
import type React from 'react';
import { useState } from 'react';
import {
  disableWebhook,
  rotateWebhook,
  type SyncSource,
  type WebhookRotateResult,
} from '@/services/cmdb/sync';
import { useT } from '@/utils/i18n';

export const WebhookModal: React.FC<{
  source: SyncSource | null;
  onClose: () => void;
  onChanged: () => void;
}> = ({ source, onClose, onChanged }) => {
  const t = useT();
  const { message, modal } = App.useApp();
  const [rotated, setRotated] = useState<WebhookRotateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const enabled = rotated !== null || !!source?.webhookEnabled;

  const close = () => {
    setRotated(null);
    onClose();
  };

  const rotate = () => {
    if (!source) return;
    const run = async () => {
      setLoading(true);
      try {
        setRotated(await rotateWebhook(source.id));
        message.success(t('pages.cmdb.sync.webhook.rotated'));
        onChanged();
      } catch {
        // authRequest 已提示
      } finally {
        setLoading(false);
      }
    };
    if (source.webhookEnabled || rotated) {
      modal.confirm({
        title: t('pages.cmdb.sync.webhook.rotate'),
        content: t('pages.cmdb.sync.webhook.rotate.confirm'),
        onOk: run,
      });
    } else {
      void run();
    }
  };

  const disable = () => {
    if (!source) return;
    modal.confirm({
      title: t('pages.cmdb.sync.webhook.disable'),
      content: t('pages.cmdb.sync.webhook.disable.confirm'),
      onOk: async () => {
        await disableWebhook(source.id);
        message.success(t('common.msg.updated'));
        setRotated(null);
        onChanged();
        close();
      },
    });
  };

  return (
    <Modal
      title={
        source ? t('pages.cmdb.sync.webhook.title', { name: source.name }) : ''
      }
      open={!!source}
      onCancel={close}
      destroyOnHidden
      footer={
        <Space>
          {enabled && (
            <Button danger onClick={disable}>
              {t('pages.cmdb.sync.webhook.disable')}
            </Button>
          )}
          <Button type="primary" loading={loading} onClick={rotate}>
            {enabled
              ? t('pages.cmdb.sync.webhook.rotate')
              : t('pages.cmdb.sync.webhook.enable')}
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        {t('pages.cmdb.sync.webhook.hint')}
      </Typography.Paragraph>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label={t('pages.cmdb.sync.webhook.path')}>
          <Typography.Text code copyable>
            {source?.webhookPath ?? ''}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('pages.cmdb.sync.webhook.header')}>
          <Typography.Text code>X-Cmdb-Webhook-Token</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('pages.cmdb.sync.webhook.token')}>
          {rotated ? (
            <Typography.Text code copyable>
              {rotated.token}
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">
              {enabled
                ? t('pages.cmdb.sync.webhook.token.hidden')
                : t('pages.cmdb.sync.webhook.token.none')}
            </Typography.Text>
          )}
        </Descriptions.Item>
      </Descriptions>
      {rotated && (
        <Typography.Paragraph type="warning" style={{ marginTop: 12 }}>
          {t('pages.cmdb.sync.webhook.token.once')}
        </Typography.Paragraph>
      )}
    </Modal>
  );
};
