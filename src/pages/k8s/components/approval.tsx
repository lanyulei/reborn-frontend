/**
 * 变更审批在页面上的呈现：
 * - ApprovalBar：作用域栏下方的提示条。集群的变更需审批时常驻说明；持有「紧急变更」权限的用户
 *   可在此开启免审批（需输入集群名确认，离开页面即关闭）；写操作被转为变更单时弹出带工单与
 *   变更单链接的提示。
 * - ApprovalNotice：各变更弹窗顶部的一行说明（同一状态的只读呈现；状态存在 services/k8s/approval）。
 */
import { history } from '@umijs/max';
import { Alert, App, Button, Input, Space, Switch, Typography } from 'antd';
import type React from 'react';
import { useEffect, useSyncExternalStore } from 'react';
import type { ChangeSubmitted } from '@/services/k8s/approval';
import {
  CHANGE_SUBMITTED_EVENT,
  getApprovalCluster,
  getEmergencyCluster,
  setApprovalCluster,
  setEmergencyCluster,
  subscribeEmergency,
} from '@/services/k8s/approval';
import type { ClusterOption } from '@/services/k8s/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';

/** 当前集群是否处于紧急变更（免审批）模式 */
export const useEmergency = (clusterId: string): boolean =>
  useSyncExternalStore(subscribeEmergency, getEmergencyCluster) === clusterId &&
  clusterId !== '';

export const ApprovalNotice: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => {
  const t = useT();
  const clusterId = useSyncExternalStore(
    subscribeEmergency,
    getApprovalCluster,
  );
  const emergency = useEmergency(clusterId);
  if (!clusterId) return null;
  return (
    <Alert
      type={emergency ? 'error' : 'info'}
      showIcon
      style={{ marginBottom: 12, ...style }}
      title={t(
        emergency
          ? 'pages.k8s.approval.emergencyOn'
          : 'pages.k8s.approval.notice',
      )}
    />
  );
};

export const ApprovalBar: React.FC<{ cluster?: ClusterOption }> = ({
  cluster,
}) => {
  const t = useT();
  const { modal, notification } = App.useApp();
  const can = usePermissions();
  const clusterId = cluster?.id ?? '';
  const required = cluster?.approvalRequired === true;
  const emergency = useEmergency(clusterId);

  // 写操作被转为变更单：给出去向
  useEffect(() => {
    const onSubmitted = (event: Event) => {
      const detail = (event as CustomEvent<ChangeSubmitted>).detail;
      const key = `k8s-change-${detail.changeId}`;
      notification.success({
        key,
        duration: 12,
        title: t('pages.k8s.approval.submitted'),
        description: (
          <div>
            <div>{t('pages.k8s.approval.submitted.desc')}</div>
            <Space style={{ marginTop: 8 }}>
              {detail.ticketId && (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    notification.destroy(key);
                    history.push(`/ticket/detail/${detail.ticketId}`);
                  }}
                >
                  {t('pages.k8s.approval.viewTicket', {
                    number: detail.ticketNumber,
                  })}
                </Button>
              )}
              <Button
                size="small"
                onClick={() => {
                  notification.destroy(key);
                  history.push(`/k8s/change?id=${detail.changeId}`);
                }}
              >
                {t('pages.k8s.approval.viewChange')}
              </Button>
            </Space>
          </div>
        ),
      });
    };
    window.addEventListener(CHANGE_SUBMITTED_EVENT, onSubmitted);
    return () =>
      window.removeEventListener(CHANGE_SUBMITTED_EVENT, onSubmitted);
  }, [notification, t]);

  // 切换集群或离开页面即退出紧急变更模式；同时登记当前「变更需审批」的集群（弹窗里的说明据此显示）
  useEffect(() => {
    if (getEmergencyCluster() && getEmergencyCluster() !== clusterId) {
      setEmergencyCluster('');
    }
    setApprovalCluster(required ? clusterId : '');
    return () => {
      setEmergencyCluster('');
      setApprovalCluster('');
    };
  }, [clusterId, required]);

  if (!cluster || !required) return null;

  const enable = () => {
    const name = cluster.name;
    const instance = modal.confirm({
      title: t('pages.k8s.approval.emergency.title'),
      okButtonProps: { danger: true, disabled: true },
      okText: t('pages.k8s.approval.emergency.ok'),
      onOk: () => setEmergencyCluster(clusterId),
      content: (
        <div>
          <Typography.Paragraph>
            {t('pages.k8s.approval.emergency.content')}
          </Typography.Paragraph>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
            {t('pages.k8s.approval.emergency.type', { name })}
          </Typography.Paragraph>
          <Input
            autoFocus
            placeholder={name}
            onChange={(event) =>
              instance.update({
                okButtonProps: {
                  danger: true,
                  disabled: event.target.value.trim() !== name,
                },
              })
            }
          />
        </div>
      ),
    });
  };

  return (
    <Alert
      type={emergency ? 'error' : 'info'}
      showIcon
      style={{ marginBottom: 16 }}
      title={t(
        emergency
          ? 'pages.k8s.approval.emergencyOn'
          : 'pages.k8s.approval.notice',
      )}
      action={
        <Space>
          {can('k8s.change.bypass') && (
            <span>
              <Switch
                size="small"
                checked={emergency}
                onChange={(checked) =>
                  checked ? enable() : setEmergencyCluster('')
                }
              />
              <span style={{ marginInlineStart: 8 }}>
                {t('pages.k8s.approval.emergency')}
              </span>
            </span>
          )}
          <Button
            size="small"
            type="link"
            onClick={() => history.push('/k8s/change')}
          >
            {t('menu.k8s.change')}
          </Button>
        </Space>
      }
    />
  );
};
