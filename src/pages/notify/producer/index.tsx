import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  PageContainer,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { App, Modal, Popconfirm, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { ENABLED_META, NOTIFY_EVENT_PATTERN_REGEX } from '@/constants';
import { useBizScope } from '@/services/notify/hooks';
import type { ProducerSpecPayload } from '@/services/notify/producer';
import {
  createProducer,
  deleteProducer,
  getProducer,
  listProducers,
  rotateProducerToken,
  updateProducer,
} from '@/services/notify/producer';
import type { NotifyProducer } from '@/services/notify/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useSubmitter, useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import {
  BizIdFormField,
  BizIdReadonlyField,
  useBizIdColumn,
} from '../components/bizScope';

/** 两列栅格：半行 / 整行 */
const HALF = { span: 12 };
const FULL = { span: 24 };

/** 来源表单值（过期时间为 dayjs，提交转 RFC3339；不填 = 永不过期；biz 仅创建） */
interface ProducerFormValues {
  bizId?: string;
  name: string;
  eventWhitelist?: string[];
  expireTime?: Dayjs;
  /** 每秒接入上限，0 = 不限 */
  qpsLimit?: number;
  /** 每日（UTC）接入上限，0 = 不限 */
  dailyLimit?: number;
  enabled?: boolean;
}

/** 表单值 → 来源配置载荷（整组替换；白名单空 = 不限，过期时间不填即清除，限速空 = 0 不限） */
const buildProducerSpec = (
  values: ProducerFormValues,
): ProducerSpecPayload => ({
  name: values.name,
  ...(values.eventWhitelist?.length && {
    eventWhitelist: values.eventWhitelist,
  }),
  ...(values.expireTime && { expireTime: values.expireTime.toISOString() }),
  qpsLimit: values.qpsLimit ?? 0,
  dailyLimit: values.dailyLimit ?? 0,
});

/**
 * 事件来源：一行 = 一个事件来源（如监控引擎）的接入凭据。
 * token 明文仅在创建/轮换响应中出现一次（落库只存 SHA-256），丢失只能轮换重发；
 * 数据面以 HMAC 签名接入（Authorization: HMAC id:sig:ts），ingress 按来源限速。
 * 表单 7 字段 → 抽屉 + 两列栅格（白名单独占一行）。
 */
const ProducerList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const scope = useBizScope();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const enabledEnum = useValueEnum(ENABLED_META);
  const bizIdColumn = useBizIdColumn<NotifyProducer>(scope);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<NotifyProducer | null>(null);
  // 一次性令牌展示（创建/轮换响应；关闭即丢弃，任何接口不可再取）
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    token: string;
  } | null>(null);

  const reload = () => actionRef.current?.reload();

  const hasAnyAction =
    has('notify.producer.edit') ||
    has('notify.producer.rotate') ||
    has('notify.producer.delete');

  /** 接入限速摘要（表格展示）：0 = 不限 */
  const limitText = (record: NotifyProducer) => {
    const unlimited = t('pages.notify.common.unlimited');
    const qps =
      record.qpsLimit > 0
        ? t('pages.notify.producer.limit.perSecond', { n: record.qpsLimit })
        : unlimited;
    const daily =
      record.dailyLimit > 0
        ? t('pages.notify.producer.limit.perDay', { n: record.dailyLimit })
        : unlimited;
    return t('pages.notify.producer.limit.summary', { qps, daily });
  };

  const columns: ProColumns<NotifyProducer>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.notify.producer.column.name') },
    },
    bizIdColumn,
    {
      title: t('pages.notify.producer.column.name'),
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
      // 模糊搜索由「关键字」字段覆盖（后端 keyword 匹配名称）
      search: false,
    },
    {
      title: t('pages.notify.producer.column.whitelist'),
      dataIndex: 'eventWhitelist',
      search: false,
      ellipsis: true,
      render: (_, record) => {
        const list = record.eventWhitelist ?? [];
        return list.length ? (
          <span>
            {list.map((pattern) => (
              <Tag key={pattern}>{pattern}</Tag>
            ))}
          </span>
        ) : (
          t('pages.notify.common.unlimited')
        );
      },
    },
    {
      title: t('pages.notify.producer.column.limit'),
      dataIndex: 'qpsLimit',
      tooltip: t('pages.notify.producer.column.limit.tooltip'),
      search: false,
      width: 150,
      render: (_, record) => limitText(record),
    },
    {
      title: t('pages.notify.producer.column.expireTime'),
      dataIndex: 'expireTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
      render: (_, record) =>
        record.expireTime || t('pages.notify.producer.neverExpire'),
    },
    {
      title: t('common.column.status'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
    },
    {
      title: t('common.column.updateTime'),
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 160,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('notify.producer.edit')) {
          actions.push(
            <a
              key="edit"
              onClick={() => {
                setEditRow(record);
              }}
            >
              {t('common.action.edit')}
            </a>,
          );
        }
        if (has('notify.producer.rotate')) {
          actions.push(
            <Popconfirm
              key="rotate"
              title={t('pages.notify.producer.rotate.title')}
              description={t('pages.notify.producer.rotate.description')}
              onConfirm={async () => {
                const { producer, token } = await rotateProducerToken(
                  record.id,
                );
                message.success(t('pages.notify.producer.rotate.success'));
                reload();
                setTokenInfo({ name: producer.name, token });
              }}
            >
              <a>{t('pages.notify.producer.rotate.title')}</a>
            </Popconfirm>,
          );
        }
        if (has('notify.producer.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.notify.producer.delete.title')}
              description={t('pages.notify.producer.delete.description')}
              onConfirm={async () => {
                await deleteProducer(record.id);
                message.success(t('common.msg.deleted'));
                reload();
              }}
            />,
          );
        }
        return actions;
      },
    },
  ];

  /**
   * 新建/编辑共用字段组（业务字段由调用方置于最前，与名称同行）：
   * 名称 / 白名单独占一行 / 每秒上限 + 每日上限 / 过期时间 + 启用。
   */
  const producerFields = (
    <>
      <ProFormText
        name="name"
        label={t('pages.notify.producer.column.name')}
        colProps={HALF}
        tooltip={t('pages.notify.producer.form.name.tooltip')}
        placeholder={t('pages.notify.producer.form.name.placeholder')}
        rules={[
          rules.required(t('pages.notify.producer.column.name')),
          rules.max(64),
        ]}
      />
      <ProFormSelect
        name="eventWhitelist"
        label={t('pages.notify.producer.form.whitelist')}
        colProps={FULL}
        tooltip={t('pages.notify.producer.form.whitelist.tooltip')}
        fieldProps={{
          mode: 'tags',
          open: false,
          tokenSeparators: [',', ' '],
          placeholder: t('pages.notify.producer.form.whitelist.placeholder'),
        }}
        rules={[
          {
            validator: (_, value?: string[]) => {
              const list = value ?? [];
              if (list.length > 32) {
                return Promise.reject(
                  new Error(t('pages.notify.producer.form.whitelist.max')),
                );
              }
              if (new Set(list).size !== list.length) {
                return Promise.reject(
                  new Error(t('pages.notify.common.noDuplicate')),
                );
              }
              if (list.some((item) => !NOTIFY_EVENT_PATTERN_REGEX.test(item))) {
                return Promise.reject(
                  new Error(t('pages.notify.common.eventPattern.rule')),
                );
              }
              return Promise.resolve();
            },
          },
        ]}
      />
      <ProFormDigit
        name="qpsLimit"
        label={t('pages.notify.producer.form.qpsLimit')}
        colProps={HALF}
        tooltip={t('pages.notify.producer.form.qpsLimit.tooltip')}
        placeholder={t('pages.notify.common.zeroUnlimited')}
        min={0}
        max={1000000}
        fieldProps={{ precision: 0 }}
      />
      <ProFormDigit
        name="dailyLimit"
        label={t('pages.notify.producer.form.dailyLimit')}
        colProps={HALF}
        tooltip={t('pages.notify.producer.form.dailyLimit.tooltip')}
        placeholder={t('pages.notify.common.zeroUnlimited')}
        min={0}
        max={1000000000}
        fieldProps={{ precision: 0 }}
      />
      <ProFormDateTimePicker
        name="expireTime"
        label={t('pages.notify.producer.column.expireTime')}
        colProps={HALF}
        tooltip={t('pages.notify.producer.form.expireTime.tooltip')}
        fieldProps={{ showTime: true, style: { width: '100%' } }}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        colProps={HALF}
      />
    </>
  );

  return (
    <>
      <PageContainer title={false}>
        <ProTable<NotifyProducer>
          cardBordered
          headerTitle={
            has('notify.producer.create') && (
              <CreateButton
                onClick={() => {
                  setCreateOpen(true);
                }}
              >
                {t('pages.notify.producer.create.title')}
              </CreateButton>
            )
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          scroll={{ x: 'max-content' }}
          request={async (params) => {
            const result = await listProducers({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              bizId: params.bizId || undefined,
              enabled: parseBoolParam(params.enabled),
            });
            return toTableResult(result);
          }}
        />
      </PageContainer>

      {/* 新建来源（抽屉）：响应返回一次性接入令牌；biz（令牌范围）创建后不可改 */}
      <DrawerForm<ProducerFormValues>
        // 保持 Dayjs 原值：默认 string 会转成字符串，提交时 .format / .toISOString 抛错
        dateFormatter={false}
        key="create-producer"
        title={t('pages.notify.producer.create.title')}
        width={720}
        grid
        rowProps={{ gutter: 16 }}
        open={createOpen}
        onOpenChange={setCreateOpen}
        drawerProps={{ destroyOnHidden: true }}
        initialValues={{
          enabled: true,
          bizId: scope.restricted ? scope.defaultBizId : undefined,
        }}
        submitter={submitter.create}
        onFinish={async (values) => {
          const { producer, token } = await createProducer({
            bizId: values.bizId || undefined,
            spec: buildProducerSpec(values),
            enabled: values.enabled ?? true,
          });
          message.success(t('common.msg.created'));
          reload();
          setTokenInfo({ name: producer.name, token });
          return true;
        }}
      >
        <BizIdFormField scope={scope} colProps={HALF} />
        {producerFields}
      </DrawerForm>

      {/* 编辑来源（抽屉）：spec 整组替换（留空过期时间即清除）；打开时拉取详情；业务只读占位 */}
      {editRow && (
        <DrawerForm<ProducerFormValues>
          // 保持 Dayjs 原值：默认 string 会转成字符串，提交时 .format / .toISOString 抛错
          dateFormatter={false}
          key={`edit-producer-${editRow.id}`}
          title={t('pages.notify.producer.edit.title', { name: editRow.name })}
          width={720}
          grid
          rowProps={{ gutter: 16 }}
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          drawerProps={{ destroyOnHidden: true }}
          params={{ id: editRow.id }}
          request={async ({ id }) => {
            const { producer } = await getProducer(id);
            return {
              name: producer.name,
              eventWhitelist: producer.eventWhitelist ?? [],
              expireTime: producer.expireTime
                ? dayjs(producer.expireTime)
                : undefined,
              qpsLimit: producer.qpsLimit,
              dailyLimit: producer.dailyLimit,
              enabled: producer.enabled,
            };
          }}
          submitter={submitter.save}
          onFinish={async (values) => {
            await updateProducer(editRow.id, {
              spec: buildProducerSpec(values),
              enabled: values.enabled ?? true,
            });
            message.success(t('common.msg.saved'));
            reload();
            return true;
          }}
        >
          <BizIdReadonlyField bizId={editRow.bizId} colProps={HALF} />
          {producerFields}
        </DrawerForm>
      )}

      {/* 一次性令牌：仅此一次展示，关闭后任何接口不可再取 */}
      <Modal
        title={t('pages.notify.producer.token.title', {
          name: tokenInfo?.name ?? '',
        })}
        open={!!tokenInfo}
        okText={t('pages.notify.producer.token.ok')}
        onOk={() => {
          setTokenInfo(null);
        }}
        onCancel={() => {
          setTokenInfo(null);
        }}
        cancelButtonProps={{ style: { display: 'none' } }}
        mask={{ closable: false }}
      >
        <Typography.Paragraph type="warning" strong>
          {t('pages.notify.producer.token.warning')}
        </Typography.Paragraph>
        <Typography.Paragraph copyable={{ text: tokenInfo?.token ?? '' }}>
          {tokenInfo?.token}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary">
          {t('pages.notify.producer.token.hint', {
            id: '<id>',
            sig: '<sig>',
            ts: '<ts>',
          })}
        </Typography.Paragraph>
      </Modal>
    </>
  );
};

export default ProducerList;
