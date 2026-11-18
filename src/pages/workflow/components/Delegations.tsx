/**
 * 我的代理设置：休假 / 出差期间，把新到达自己的待办交给代理人处理（只转一层；
 * 已经在自己手上的待办不受影响，可用「转办」单独处理）。
 */
import {
  ModalForm,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, DatePicker, Drawer, Form, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import dayjs, { type Dayjs } from 'dayjs';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { UserSelect } from '@/components/UserSelect';
import { fetchWorkflowUsers } from '@/components/UserSelect/sources';
import {
  createDelegation,
  deleteDelegation,
  listMyDelegations,
} from '@/services/workflow/config';
import type { WorkflowDelegation } from '@/services/workflow/typings';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';

const REASON_MAX = 255;
const TIME_FORMAT = 'YYYY-MM-DD HH:mm';

interface DelegationValues {
  delegateId: string;
  range: [Dayjs | string, Dayjs | string];
  reason?: string;
}

/** 按当前时间判断一条设置的状态 */
const stateOf = (d: WorkflowDelegation): 'active' | 'upcoming' | 'ended' => {
  const now = dayjs();
  if (now.isBefore(dayjs(d.startTime))) return 'upcoming';
  return now.isBefore(dayjs(d.endTime)) ? 'active' : 'ended';
};

const STATE_COLOR = {
  active: 'processing',
  upcoming: 'blue',
  ended: undefined,
} as const;

const useStyles = createStyles(({ css }) => ({
  /** 「新建代理」所在的工具栏：上方紧跟说明文字，不再留上内边距 */
  table: css`
    .ant-pro-table-list-toolbar-container {
      padding-top: 0;
    }
  `,
}));

export const Delegations: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const [items, setItems] = useState<WorkflowDelegation[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listMyDelegations());
    } catch {
      // 失败提示由请求层统一弹出
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  return (
    <Drawer
      title={t('pages.workflow.delegation.title')}
      size={720}
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        {t('pages.workflow.delegation.desc')}
      </Typography.Paragraph>
      <ProTable<WorkflowDelegation>
        className={styles.table}
        rowKey="id"
        search={false}
        options={false}
        pagination={false}
        ghost
        loading={loading}
        headerTitle={
          <CreateButton onClick={() => setCreating(true)}>
            {t('pages.workflow.delegation.create')}
          </CreateButton>
        }
        dataSource={items}
        columns={[
          {
            title: t('pages.workflow.delegation.delegate'),
            dataIndex: 'delegateName',
            width: 140,
            ellipsis: true,
            renderText: (_, record) => record.delegateName || record.delegateId,
          },
          {
            title: t('pages.workflow.delegation.period'),
            dataIndex: 'startTime',
            renderText: (_, record) =>
              `${dayjs(record.startTime).format(TIME_FORMAT)} ~ ${dayjs(record.endTime).format(TIME_FORMAT)}`,
          },
          {
            title: t('pages.workflow.delegation.reason'),
            dataIndex: 'reason',
            ellipsis: true,
          },
          {
            title: t('common.column.status'),
            width: 90,
            render: (_, record) => {
              const state = stateOf(record);
              return (
                <Tag color={STATE_COLOR[state]}>
                  {t(`pages.workflow.delegation.state.${state}`)}
                </Tag>
              );
            },
          },
          {
            title: t('common.column.action'),
            valueType: 'option',
            width: 70,
            render: (_, record) => (
              <DeleteConfirmLink
                title={t('pages.workflow.delegation.delete.title')}
                description={t('pages.workflow.delegation.delete.description')}
                onConfirm={async () => {
                  await deleteDelegation(record.id);
                  message.success(t('common.msg.deleted'));
                  void load();
                }}
              />
            ),
          },
        ]}
      />

      {creating && (
        <ModalForm<DelegationValues>
          title={t('pages.workflow.delegation.create')}
          width={480}
          open
          onOpenChange={(next) => {
            if (!next) setCreating(false);
          }}
          modalProps={{ destroyOnHidden: true }}
          submitter={submitter.create}
          onFinish={async (values) => {
            await createDelegation({
              delegateId: values.delegateId,
              // ModalForm 提交前会把 dayjs 值格式化成字符串，这里统一再解析一次
              startTime: dayjs(values.range[0]).toISOString(),
              endTime: dayjs(values.range[1]).toISOString(),
              reason: values.reason?.trim() ?? '',
            });
            message.success(t('common.msg.created'));
            void load();
            return true;
          }}
        >
          <Form.Item
            name="delegateId"
            label={t('pages.workflow.delegation.delegate')}
            rules={[rules.select(t('pages.workflow.delegation.delegate'))]}
          >
            <UserSelect
              fetchUsers={fetchWorkflowUsers}
              placeholder={t('pages.workflow.form.user.placeholder')}
            />
          </Form.Item>
          <Form.Item
            name="range"
            label={t('pages.workflow.delegation.period')}
            extra={t('pages.workflow.delegation.period.extra')}
            rules={[
              {
                required: true,
                type: 'array',
                message: rules.select(t('pages.workflow.delegation.period'))
                  .message,
              },
              {
                validator: (_: unknown, range?: [Dayjs, Dayjs]) =>
                  range?.[1] && !range[1].isAfter(dayjs())
                    ? Promise.reject(
                        new Error(t('pages.workflow.delegation.period.past')),
                      )
                    : Promise.resolve(),
              },
            ]}
          >
            <DatePicker.RangePicker
              showTime={{ format: 'HH:mm' }}
              format={TIME_FORMAT}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <ProFormTextArea
            name="reason"
            label={t('pages.workflow.delegation.reason')}
            fieldProps={{
              maxLength: REASON_MAX,
              showCount: true,
              autoSize: { minRows: 2, maxRows: 4 },
            }}
          />
        </ModalForm>
      )}
    </Drawer>
  );
};

export default Delegations;
