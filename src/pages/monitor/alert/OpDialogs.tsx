/**
 * 事件操作（列表行、详情头部共用）：认领 / 取消认领直接执行；转交、备注、手动关闭、转工单各开一个
 * 弹窗。操作成功后由调用方刷新（onChanged）。权限判断见 meta.ts 的 alertOpStates。
 */
import { ModalForm, ProFormTextArea } from '@ant-design/pro-components';
import { Alert, App, Button, Form, Tooltip, Typography } from 'antd';
import type React from 'react';
import { useCallback, useState } from 'react';
import { UserSelect } from '@/components/UserSelect';
import { fetchMonitorUsers } from '@/components/UserSelect/sources';
import {
  ackAlert,
  closeAlert,
  commentAlert,
  transferAlert,
  unackAlert,
} from '@/services/monitor/alert';
import type { MonitorAlert } from '@/services/monitor/typings';
import { useFormRules, useT } from '@/utils/i18n';
import {
  ALERT_LIMITS,
  type AlertOp,
  type AlertOpState,
  alertTitle,
} from './meta';
import { TicketModal } from './TicketModal';

type DialogOp = Exclude<AlertOp, 'ack' | 'unack'>;

/** 手动关闭、转工单要求对分组「可管理」，其余「只读」以上即可 */
const NEED_MANAGE: readonly AlertOp[] = ['close', 'ticket'];

/** 操作置灰时的提示：缺的是哪一级数据范围 */
export const useOpDisabledTip = () => {
  const t = useT();
  return useCallback(
    (op: AlertOp) =>
      NEED_MANAGE.includes(op)
        ? t('pages.monitor.needManage')
        : t('pages.monitor.alert.op.needScope'),
    [t],
  );
};

/** 操作列里的操作链接：不可用时置灰并提示 */
export const OpLink: React.FC<{
  op: AlertOp;
  state: AlertOpState;
  onClick: () => void;
}> = ({ op, state, onClick }) => {
  const t = useT();
  const tip = useOpDisabledTip();
  if (state.enabled) {
    return <a onClick={onClick}>{t(`pages.monitor.alert.op.${op}`)}</a>;
  }
  return (
    <Tooltip title={tip(op)}>
      <Typography.Link disabled>
        {t(`pages.monitor.alert.op.${op}`)}
      </Typography.Link>
    </Tooltip>
  );
};

/** 详情头部的操作按钮：不可用时置灰并提示 */
export const OpButton: React.FC<{
  op: AlertOp;
  state: AlertOpState;
  loading?: boolean;
  onClick: () => void;
}> = ({ op, state, loading, onClick }) => {
  const t = useT();
  const tip = useOpDisabledTip();
  const button = (
    <Button
      type={op === 'ack' ? 'primary' : undefined}
      danger={op === 'close'}
      disabled={!state.enabled}
      loading={loading}
      onClick={onClick}
    >
      {t(`pages.monitor.alert.op.${op}`)}
    </Button>
  );
  return state.enabled ? button : <Tooltip title={tip(op)}>{button}</Tooltip>;
};

const TransferModal: React.FC<{
  alert: MonitorAlert;
  onClose: () => void;
  onDone: () => void;
}> = ({ alert, onClose, onDone }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  return (
    <ModalForm<{ userId?: string; note?: string }>
      title={t('pages.monitor.alert.transfer.title')}
      width={480}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      onFinish={async (values) => {
        await transferAlert(alert.id, {
          userId: values.userId ?? '',
          note: values.note?.trim() ?? '',
        });
        message.success(t('pages.monitor.alert.transfer.done'));
        onDone();
        return true;
      }}
    >
      <Alert
        type="info"
        showIcon
        title={alertTitle(alert)}
        description={
          alert.ackUserId
            ? t('pages.monitor.alert.transfer.from', {
                name: alert.ackUserName || alert.ackUserId,
              })
            : t('pages.monitor.alert.transfer.assign')
        }
        style={{ marginBottom: 16 }}
      />
      <Form.Item
        name="userId"
        label={t('pages.monitor.alert.transfer.user')}
        rules={[rules.select(t('pages.monitor.alert.transfer.user'))]}
      >
        {/* 候选来自 target-option（认领 / 转交权限开放）：只在本弹窗里请求 */}
        <UserSelect
          fetchUsers={fetchMonitorUsers}
          // 不能转交给当前的认领人
          disabledIds={alert.ackUserId ? new Set([alert.ackUserId]) : undefined}
          disabledLabel={t('pages.monitor.alert.transfer.current')}
          placeholder={t('pages.monitor.alert.transfer.user.placeholder')}
        />
      </Form.Item>
      <ProFormTextArea
        name="note"
        label={t('pages.monitor.alert.transfer.note')}
        fieldProps={{
          maxLength: ALERT_LIMITS.transferNoteMax,
          showCount: true,
          rows: 3,
        }}
        rules={[rules.maxChars(ALERT_LIMITS.transferNoteMax)]}
      />
    </ModalForm>
  );
};

const CommentModal: React.FC<{
  alert: MonitorAlert;
  onClose: () => void;
  onDone: () => void;
}> = ({ alert, onClose, onDone }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  return (
    <ModalForm<{ text?: string }>
      title={t('pages.monitor.alert.comment.title')}
      width={520}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      onFinish={async (values) => {
        await commentAlert(alert.id, values.text?.trim() ?? '');
        message.success(t('pages.monitor.alert.comment.done'));
        onDone();
        return true;
      }}
    >
      <ProFormTextArea
        name="text"
        label={t('pages.monitor.alert.comment.text')}
        fieldProps={{
          maxLength: ALERT_LIMITS.commentMax,
          showCount: true,
          rows: 5,
        }}
        rules={[
          // 不能全是空白
          {
            ...rules.required(t('pages.monitor.alert.comment.text')),
            whitespace: true,
          },
          rules.maxChars(ALERT_LIMITS.commentMax),
        ]}
      />
    </ModalForm>
  );
};

/** 手动关闭：破坏性操作，弹窗确认并要求填写原因（接口不强制，界面上必填，便于事后追溯） */
const CloseModal: React.FC<{
  alert: MonitorAlert;
  onClose: () => void;
  onDone: () => void;
}> = ({ alert, onClose, onDone }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  return (
    <ModalForm<{ reason?: string }>
      title={t('pages.monitor.alert.close.title')}
      width={520}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      submitter={{
        submitButtonProps: { danger: true },
        searchConfig: { submitText: t('pages.monitor.alert.close.ok') },
      }}
      onFinish={async (values) => {
        const result = await closeAlert(alert.id, values.reason?.trim() ?? '');
        // 关闭由评估引擎在下一轮执行：此时事件多半还是告警中，不是失败
        const pending =
          result.pending === true || (result.alert?.status ?? 1) === 1;
        message.success(
          pending
            ? t('pages.monitor.alert.close.pending')
            : t('pages.monitor.alert.close.done'),
        );
        onDone();
        return true;
      }}
    >
      <Alert
        type="warning"
        showIcon
        title={alertTitle(alert)}
        description={t('pages.monitor.alert.close.description')}
        style={{ marginBottom: 16 }}
      />
      <ProFormTextArea
        name="reason"
        label={t('pages.monitor.alert.close.reason')}
        fieldProps={{
          maxLength: ALERT_LIMITS.closeReasonMax,
          showCount: true,
          rows: 3,
        }}
        rules={[
          {
            ...rules.required(t('pages.monitor.alert.close.reason')),
            whitespace: true,
          },
          rules.maxChars(ALERT_LIMITS.closeReasonMax),
        ]}
      />
    </ModalForm>
  );
};

/**
 * 事件操作的执行与弹窗。run 执行一个操作（认领 / 取消认领立即请求，其余开弹窗）；dialogs 要渲染
 * 在页面里；open 表示有弹窗开着（列表据此暂停自动刷新）；pending 是正在请求的「操作:事件 ID」。
 */
export const useAlertOps = (onChanged: () => void) => {
  const t = useT();
  const { message } = App.useApp();
  const [dialog, setDialog] = useState<{ op: DialogOp; alert: MonitorAlert }>();
  const [pending, setPending] = useState<string>();

  const run = async (op: AlertOp, alert: MonitorAlert) => {
    if (op !== 'ack' && op !== 'unack') {
      setDialog({ op, alert });
      return;
    }
    setPending(`${op}:${alert.id}`);
    try {
      await (op === 'ack' ? ackAlert : unackAlert)(alert.id);
      message.success(
        op === 'ack'
          ? t('pages.monitor.alert.ack.done')
          : t('pages.monitor.alert.unack.done'),
      );
    } catch {
      // 已由请求层提示（如已被他人认领、只有认领人或管理者能取消）
    } finally {
      setPending(undefined);
      // 失败多半是事件状态已变（被他人认领、已恢复）：同样刷新
      onChanged();
    }
  };

  const close = () => setDialog(undefined);
  const dialogs = dialog && (
    <>
      {dialog.op === 'transfer' && (
        <TransferModal
          alert={dialog.alert}
          onClose={close}
          onDone={onChanged}
        />
      )}
      {dialog.op === 'comment' && (
        <CommentModal alert={dialog.alert} onClose={close} onDone={onChanged} />
      )}
      {dialog.op === 'close' && (
        <CloseModal alert={dialog.alert} onClose={close} onDone={onChanged} />
      )}
      {dialog.op === 'ticket' && (
        <TicketModal
          alert={dialog.alert}
          onClose={close}
          onChanged={onChanged}
        />
      )}
    </>
  );
  return { run, dialogs, open: !!dialog, pending };
};
