/**
 * 公共值班地址管理（某一个范围：分组 / 值班表 / 个人）：列表、新建、查看、重置、作废。
 * 新建 / 重置后弹窗展示网页链接供复制；之后可随时在操作列"查看地址"再次打开
 * （需要该范围的管理权）。
 */

import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, App, Button, Modal, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useRef, useState } from 'react';
import {
  ConfirmLink,
  CreateButton,
  DeleteConfirmLink,
} from '@/components/TableActions';
import {
  createShareLink,
  deleteShareLink,
  getShareLinkToken,
  listShareLinks,
  publicCalendarUrl,
  resetShareLink,
} from '@/services/oncall/share';
import type {
  OncallScopeType,
  OncallShareLink,
} from '@/services/oncall/typings';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';
import { ManageLink } from './hooks';
import { ONCALL_NAME_MAX } from './meta';
import { useOncallStyles } from './styles';

const noop = () => undefined;

interface ShareFormValues {
  name: string;
  showPhone?: boolean;
  expireTime?: string;
}

export const ShareLinks: React.FC<{
  scopeType: OncallScopeType;
  /** 分组 / 值班表 ID；个人范围不传 */
  scopeId?: string;
  /** 是否展示写操作（元素权限） */
  writable?: boolean;
  /** 当前用户能否管理该范围；false 时写操作置灰并提示 */
  canManage?: boolean;
  /** 工具栏左侧附加内容（如范围切换） */
  toolbar?: React.ReactNode;
}> = ({ scopeType, scopeId, writable, canManage, toolbar }) => {
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { message } = App.useApp();
  const { styles } = useOncallStyles();
  const actionRef = useRef<ActionType>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    token: string;
  } | null>(null);

  const reload = () => actionRef.current?.reload();

  const columns: ProColumns<OncallShareLink>[] = [
    {
      title: t('pages.oncall.share.column.name'),
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: t('pages.oncall.share.column.showPhone'),
      dataIndex: 'showPhone',
      width: 110,
      render: (_, record) =>
        record.showPhone ? (
          <Tag color="warning">{t('pages.oncall.share.showPhone.on')}</Tag>
        ) : (
          t('pages.oncall.share.showPhone.off')
        ),
    },
    {
      title: t('pages.oncall.share.column.expireTime'),
      dataIndex: 'expireTime',
      width: 190,
      render: (_, record) => {
        if (!record.expireTime) return t('pages.oncall.share.neverExpire');
        const expired = dayjs(record.expireTime).isBefore(dayjs());
        return (
          <>
            {dayjs(record.expireTime).format('YYYY-MM-DD HH:mm')}
            {expired && (
              <Tag color="error" style={{ marginInlineStart: 8 }}>
                {t('pages.oncall.share.expired')}
              </Tag>
            )}
          </>
        );
      },
    },
    {
      title: t('pages.oncall.share.column.lastAccessTime'),
      dataIndex: 'lastAccessTime',
      valueType: 'dateTime',
      width: 160,
    },
    {
      title: t('pages.oncall.share.column.creator'),
      dataIndex: 'creatorName',
      width: 120,
      ellipsis: true,
    },
    {
      title: t('common.column.createTime'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 160,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 190,
      hideInTable: !writable,
      render: (_, record) =>
        canManage
          ? [
              <a
                key="view"
                onClick={async () => {
                  // 失败提示已由请求层给出
                  const result = await getShareLinkToken(record.id).catch(
                    () => null,
                  );
                  if (result) {
                    setTokenInfo({ name: record.name, token: result.token });
                  }
                }}
              >
                {t('pages.oncall.share.action.view')}
              </a>,
              <ConfirmLink
                key="reset"
                title={t('pages.oncall.share.reset.title')}
                description={t('pages.oncall.share.reset.description')}
                onConfirm={async () => {
                  const { token } = await resetShareLink(record.id);
                  setTokenInfo({ name: record.name, token });
                  reload();
                }}
              >
                {t('pages.oncall.share.action.reset')}
              </ConfirmLink>,
              <DeleteConfirmLink
                key="delete"
                title={t('pages.oncall.share.delete.title')}
                description={t('pages.oncall.share.delete.description')}
                onConfirm={async () => {
                  await deleteShareLink(record.id);
                  message.success(t('pages.oncall.share.msg.revoked'));
                  reload();
                }}
              >
                {t('pages.oncall.share.action.revoke')}
              </DeleteConfirmLink>,
            ]
          : [
              <ManageLink key="view" onClick={noop}>
                {t('pages.oncall.share.action.view')}
              </ManageLink>,
              <ManageLink key="reset" onClick={noop}>
                {t('pages.oncall.share.action.reset')}
              </ManageLink>,
              <ManageLink key="delete" onClick={noop}>
                {t('pages.oncall.share.action.revoke')}
              </ManageLink>,
            ],
    },
  ];

  const createButton = writable && (
    <Tooltip title={canManage ? undefined : t('pages.oncall.needManager')}>
      {/* 置灰按钮不触发鼠标事件，包一层保证提示可见 */}
      <span>
        {canManage ? (
          <CreateButton onClick={() => setCreateOpen(true)}>
            {t('pages.oncall.share.create.title')}
          </CreateButton>
        ) : (
          <Button type="primary" icon={<PlusOutlined />} disabled>
            {t('pages.oncall.share.create.title')}
          </Button>
        )}
      </span>
    </Tooltip>
  );

  return (
    <>
      <ProTable<OncallShareLink>
        cardBordered
        rowKey="id"
        actionRef={actionRef}
        search={false}
        options={false}
        pagination={false}
        headerTitle={
          (toolbar || createButton) && (
            <div className={styles.dutyRow}>
              {createButton}
              {toolbar}
            </div>
          )
        }
        columns={columns}
        scroll={{ x: 'max-content' }}
        params={{ scopeType, scopeId }}
        request={async () => {
          const { items } = await listShareLinks({ scopeType, scopeId });
          return { data: items ?? [], success: true };
        }}
      />

      <ModalForm<ShareFormValues>
        title={t('pages.oncall.share.create.title')}
        width={480}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{ showPhone: false }}
        submitter={submitter.create}
        onFinish={async (values) => {
          const { link, token } = await createShareLink({
            scopeType,
            scopeId,
            name: values.name,
            showPhone: values.showPhone === true,
            expireTime: values.expireTime
              ? dayjs(values.expireTime).toISOString()
              : undefined,
          });
          message.success(t('common.msg.created'));
          setTokenInfo({ name: link?.name ?? values.name, token });
          reload();
          return true;
        }}
      >
        <ProFormText
          name="name"
          label={t('pages.oncall.share.column.name')}
          placeholder={t('pages.oncall.share.form.name.placeholder')}
          rules={[
            rules.required(t('pages.oncall.share.column.name')),
            rules.max(ONCALL_NAME_MAX),
          ]}
        />
        <ProFormSwitch
          name="showPhone"
          label={t('pages.oncall.share.column.showPhone')}
          tooltip={t('pages.oncall.share.form.showPhone.tooltip')}
        />
        <ProFormDateTimePicker
          name="expireTime"
          label={t('pages.oncall.share.column.expireTime')}
          tooltip={t('pages.oncall.share.form.expireTime.tooltip')}
          fieldProps={{
            format: 'YYYY-MM-DD HH:mm',
            style: { width: '100%' },
            disabledDate: (current) => current.isBefore(dayjs(), 'day'),
          }}
          rules={[
            {
              validator: (_: unknown, value?: string) =>
                value && !dayjs(value).isAfter(dayjs())
                  ? Promise.reject(
                      new Error(t('pages.oncall.share.form.expireTime.past')),
                    )
                  : Promise.resolve(),
            },
          ]}
        />
      </ModalForm>

      <Modal
        title={t('pages.oncall.share.token.title', {
          name: tokenInfo?.name ?? '',
        })}
        open={!!tokenInfo}
        footer={null}
        onCancel={() => setTokenInfo(null)}
        width={600}
      >
        <Alert
          type="warning"
          showIcon
          title={t('pages.oncall.share.token.hint')}
        />
        {tokenInfo && (
          <div className={styles.addressItem}>
            <div className={styles.addressLabel}>
              {t('pages.oncall.share.token.web')}
            </div>
            <div className={styles.codeBlock}>
              <span className={styles.codeText}>
                {publicCalendarUrl(tokenInfo.token)}
              </span>
              <Typography.Text
                copyable={{ text: publicCalendarUrl(tokenInfo.token) }}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
