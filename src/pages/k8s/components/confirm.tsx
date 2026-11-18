/**
 * 危险操作确认：统一用确认弹窗（不用气泡确认）。当前集群为生产环境且给了资源名时，
 * 必须输入资源名才能确认。
 */
import { App, Input, Typography } from 'antd';
import type React from 'react';
import { useCallback } from 'react';
import { isChangeSubmitted } from '@/services/k8s/request';
import { useT } from '@/utils/i18n';
import { ApprovalNotice } from './approval';
import { useClusterName, useIsProd } from './scope';

export interface DangerConfirmOptions {
  title: React.ReactNode;
  content?: React.ReactNode;
  /** 资源名：生产集群要求输入它（给了 namespace 时要求输入 namespace/name） */
  name?: string;
  /** 资源所在的命名空间：与名称一起展示，避免不同命名空间的同名对象混淆 */
  namespace?: string;
  /** 返回的 Promise 失败时弹窗不关闭（错误已由请求层提示） */
  onOk: () => void | Promise<void>;
}

export const useDangerConfirm = () => {
  const { modal } = App.useApp();
  const t = useT();
  const isProd = useIsProd();
  const clusterName = useClusterName();

  return useCallback(
    ({ title, content, name, namespace, onOk }: DangerConfirmOptions) => {
      const full = name && namespace ? `${namespace}/${name}` : name;
      const gate = isProd && !!full;
      // 目标的完整位置：集群 + 命名空间/名称
      const where = (clusterName || full) && (
        <Typography.Paragraph style={{ marginBottom: 8 }}>
          {clusterName && (
            <>
              {t('pages.k8s.confirm.cluster')}
              <Typography.Text strong>{clusterName}</Typography.Text>
            </>
          )}
          {clusterName && full ? ' · ' : ''}
          {full && <Typography.Text code>{full}</Typography.Text>}
        </Typography.Paragraph>
      );
      const instance = modal.confirm({
        title,
        okButtonProps: { danger: true, disabled: gate },
        // 该集群的变更需审批时写操作返回 428：已生成变更单，不是失败——照常关闭确认框，
        // 否则确认按钮仍可点击，每点一次多一张变更单。
        onOk: async () => {
          try {
            await onOk();
          } catch (err) {
            if (!isChangeSubmitted(err)) throw err;
          }
        },
        content: gate ? (
          <div>
            <ApprovalNotice />
            {where}
            {content && <div style={{ marginBottom: 12 }}>{content}</div>}
            <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
              {t('pages.k8s.confirm.prod', { name: full ?? '' })}
            </Typography.Paragraph>
            <Input
              autoFocus
              placeholder={full}
              onChange={(event) =>
                instance.update({
                  okButtonProps: {
                    danger: true,
                    disabled: event.target.value.trim() !== full,
                  },
                })
              }
            />
          </div>
        ) : (
          <div>
            <ApprovalNotice />
            {where}
            {content}
          </div>
        ),
      });
    },
    [modal, t, isProd, clusterName],
  );
};
