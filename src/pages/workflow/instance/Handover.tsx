/**
 * 交接待办：把某个用户名下全部未了结的待办换给另一个用户（离职 / 调岗）。
 * 后端一次至多处理 100 个流程实例，这里循环调用直到处理完。
 */
import { ModalForm, ProFormTextArea } from '@ant-design/pro-components';
import { App, Form, Typography } from 'antd';
import type React from 'react';
import { UserSelect } from '@/components/UserSelect';
import { fetchWorkflowUsers } from '@/components/UserSelect/sources';
import { handoverTasks } from '@/services/workflow/runtime';
import { useFormRules, useT } from '@/utils/i18n';

const REASON_MAX = 1000;
/** 循环上限：防止异常情况下无休止地请求（100 批 = 1 万个实例） */
const MAX_ROUNDS = 100;

interface HandoverValues {
  fromUserId: string;
  toUserId: string;
  reason: string;
}

export const Handover: React.FC<{
  open: boolean;
  onClose: () => void;
  /** 交接完成后回调（刷新列表） */
  onDone: () => void;
}> = ({ open, onClose, onDone }) => {
  const { message, modal } = App.useApp();
  const t = useT();
  const rules = useFormRules();

  /** 逐批交接，返回换手的待办总数、没能交接的流程数与是否还有剩余 */
  const run = async (values: HandoverValues) => {
    let total = 0;
    let failed = 0;
    let more = true;
    let cursor = '';
    for (let round = 0; more && round < MAX_ROUNDS; round += 1) {
      const result = await handoverTasks({
        ...values,
        reason: values.reason.trim(),
        cursor: cursor || undefined,
      });
      total += result.moved;
      // 游标逐批向后推进，没能交接的流程不会被再次取到：各批的失败数直接累加
      failed += result.failed;
      cursor = result.nextCursor;
      // 还有剩余却没给游标（异常响应）：不再原地重复请求
      more = result.more && !!cursor;
    }
    return { total, failed, more };
  };

  return (
    <ModalForm<HandoverValues>
      title={t('pages.workflow.handover.title')}
      width={480}
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      submitter={{
        searchConfig: {
          submitText: t('pages.workflow.handover.submit'),
          resetText: t('common.action.cancel'),
        },
        submitButtonProps: { danger: true },
      }}
      onFinish={(values) =>
        new Promise<boolean>((resolve) => {
          modal.confirm({
            title: t('pages.workflow.handover.confirm.title'),
            content: t('pages.workflow.handover.confirm.content'),
            okButtonProps: { danger: true },
            onCancel: () => resolve(false),
            onOk: async () => {
              try {
                const { total, failed, more } = await run(values);
                if (failed > 0) {
                  message.warning(
                    t(
                      // 还有剩余：除了这些失败的，可能还有没轮到的流程
                      more
                        ? 'pages.workflow.handover.failedMore'
                        : 'pages.workflow.handover.failed',
                      { n: total, failed },
                    ),
                  );
                } else if (more) {
                  message.warning(
                    t('pages.workflow.handover.partial', { n: total }),
                  );
                } else {
                  message.success(
                    t('pages.workflow.handover.done', { n: total }),
                  );
                }
                onDone();
                resolve(true);
              } catch {
                // 失败提示由请求层统一弹出；已交接的部分保持生效
                onDone();
                resolve(false);
              }
            },
          });
        })
      }
    >
      <Typography.Paragraph type="secondary">
        {t('pages.workflow.handover.desc')}
      </Typography.Paragraph>
      <Form.Item
        name="fromUserId"
        label={t('pages.workflow.handover.from')}
        rules={[rules.select(t('pages.workflow.handover.from'))]}
      >
        <UserSelect
          fetchUsers={fetchWorkflowUsers}
          placeholder={t('pages.workflow.form.user.placeholder')}
        />
      </Form.Item>
      <Form.Item
        name="toUserId"
        label={t('pages.workflow.handover.to')}
        dependencies={['fromUserId']}
        rules={[
          rules.select(t('pages.workflow.handover.to')),
          ({ getFieldValue }) => ({
            validator: (_: unknown, value?: string) =>
              value && value === getFieldValue('fromUserId')
                ? Promise.reject(new Error(t('pages.workflow.handover.same')))
                : Promise.resolve(),
          }),
        ]}
      >
        <UserSelect
          fetchUsers={fetchWorkflowUsers}
          placeholder={t('pages.workflow.form.user.placeholder')}
        />
      </Form.Item>
      <ProFormTextArea
        name="reason"
        label={t('pages.workflow.form.reason')}
        rules={[
          {
            ...rules.required(t('pages.workflow.form.reason')),
            whitespace: true,
          },
        ]}
        fieldProps={{
          maxLength: REASON_MAX,
          showCount: true,
          autoSize: { minRows: 2, maxRows: 4 },
        }}
      />
    </ModalForm>
  );
};

export default Handover;
