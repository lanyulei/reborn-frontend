import { PlusOutlined } from '@ant-design/icons';
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
import { App, Button, Modal, Popconfirm, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useRef, useState } from 'react';
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
import {
  BizIdFormField,
  BizIdReadonlyField,
  bizIdColumn,
} from '../components/bizScope';

/** 来源状态枚举（表格筛选 + 展示）；查询参数经 request 归一化为布尔 */
const PRODUCER_ENABLED_ENUM: NonNullable<ProColumns['valueEnum']> = {
  true: { text: '启用', status: 'Success' },
  false: { text: '停用', status: 'Error' },
};

/** 两列栅格：半行 / 整行 */
const HALF = { span: 12 };
const FULL = { span: 24 };

/** 事件白名单条目规则（与事件匹配模式同式，'*' 或前缀通配） */
const WHITELIST_ITEM_PATTERN = {
  pattern: /^(\*|[a-z0-9][a-z0-9._-]{0,127}|[a-z0-9][a-z0-9._-]{0,125}\.\*)$/,
  message: '精确 / 前缀通配（monitor.alert.*）/ 全匹配（*）',
};

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

/** 接入限速摘要（表格展示）：0 = 不限 */
const limitText = (record: NotifyProducer) => {
  const qps = record.qpsLimit > 0 ? `${record.qpsLimit}/秒` : '不限';
  const daily = record.dailyLimit > 0 ? `${record.dailyLimit}/日` : '不限';
  return `${qps} · ${daily}`;
};

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

  const columns: ProColumns<NotifyProducer>[] = [
    {
      title: '搜索项',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '名称' },
    },
    bizIdColumn<NotifyProducer>(scope),
    {
      title: '名称',
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
      // 模糊搜索由「关键字」字段覆盖（后端 keyword 匹配名称）
      search: false,
    },
    {
      title: '事件白名单',
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
          '不限'
        );
      },
    },
    {
      title: '接入限速',
      dataIndex: 'qpsLimit',
      tooltip: '每秒 / 每日（UTC）接入事件上限，超限 429',
      search: false,
      width: 150,
      render: (_, record) => limitText(record),
    },
    {
      title: '过期时间',
      dataIndex: 'expireTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
      render: (_, record) => record.expireTime || '永不过期',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      valueEnum: PRODUCER_ENABLED_ENUM,
      width: 90,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
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
              编辑
            </a>,
          );
        }
        if (has('notify.producer.rotate')) {
          actions.push(
            <Popconfirm
              key="rotate"
              title="轮换令牌"
              description="旧令牌立即失效（≤10s 生效），新令牌仅展示一次，确定轮换？"
              onConfirm={async () => {
                const { producer, token } = await rotateProducerToken(
                  record.id,
                );
                message.success('轮换成功');
                reload();
                setTokenInfo({ name: producer.name, token });
              }}
            >
              <a>轮换令牌</a>
            </Popconfirm>,
          );
        }
        if (has('notify.producer.delete')) {
          actions.push(
            <Popconfirm
              key="delete"
              title="删除来源"
              description="删除后令牌随之作废（名称可复用），确定删除？"
              onConfirm={async () => {
                await deleteProducer(record.id);
                message.success('删除成功');
                reload();
              }}
            >
              <a style={{ color: '#ff4d4f' }}>删除</a>
            </Popconfirm>,
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
        label="名称"
        colProps={HALF}
        tooltip="同业务内未删除行唯一"
        placeholder="1-64 位"
        rules={[
          { required: true, message: '请输入名称' },
          { max: 64, message: '最多 64 位' },
        ]}
      />
      <ProFormSelect
        name="eventWhitelist"
        label="事件类型白名单"
        colProps={FULL}
        tooltip="空 = 不限事件类型（令牌范围仍限定业务）；条目为事件模式"
        fieldProps={{
          mode: 'tags',
          open: false,
          tokenSeparators: [',', ' '],
          placeholder: 'monitor.alert.*（回车确认，最多 32 项）',
        }}
        rules={[
          {
            validator: (_, value?: string[]) => {
              const list = value ?? [];
              if (list.length > 32) {
                return Promise.reject(new Error('最多 32 项'));
              }
              if (new Set(list).size !== list.length) {
                return Promise.reject(new Error('条目不可重复'));
              }
              if (
                list.some((item) => !WHITELIST_ITEM_PATTERN.pattern.test(item))
              ) {
                return Promise.reject(
                  new Error(WHITELIST_ITEM_PATTERN.message),
                );
              }
              return Promise.resolve();
            },
          },
        ]}
      />
      <ProFormDigit
        name="qpsLimit"
        label="每秒接入上限"
        colProps={HALF}
        tooltip="管道 ingress 按来源计数，超限 429；0 = 不限"
        placeholder="0 = 不限"
        min={0}
        max={1000000}
        fieldProps={{ precision: 0 }}
      />
      <ProFormDigit
        name="dailyLimit"
        label="每日接入上限"
        colProps={HALF}
        tooltip="按 UTC 日计数；0 = 不限"
        placeholder="0 = 不限"
        min={0}
        max={1000000000}
        fieldProps={{ precision: 0 }}
      />
      <ProFormDateTimePicker
        name="expireTime"
        label="过期时间"
        colProps={HALF}
        tooltip="留空 = 永不过期；更新保存时留空即清除过期时间"
        fieldProps={{ showTime: true, style: { width: '100%' } }}
      />
      <ProFormSwitch name="enabled" label="启用" colProps={HALF} />
    </>
  );

  return (
    <>
      <PageContainer title={false}>
        <ProTable<NotifyProducer>
          headerTitle={
            has('notify.producer.create') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCreateOpen(true);
                }}
              >
                新建来源
              </Button>
            )
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          request={async (params) => {
            const result = await listProducers({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              bizId: params.bizId || undefined,
              enabled:
                params.enabled === 'true'
                  ? true
                  : params.enabled === 'false'
                    ? false
                    : undefined,
            });
            return {
              data: result.items,
              total: Number(result.total),
              success: true,
            };
          }}
        />
      </PageContainer>

      {/* 新建来源（抽屉）：响应返回一次性接入令牌；biz（令牌范围）创建后不可改 */}
      <DrawerForm<ProducerFormValues>
        key="create-producer"
        title="新建来源"
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
        submitter={{
          searchConfig: { submitText: '创建', resetText: '取消' },
        }}
        onFinish={async (values) => {
          const { producer, token } = await createProducer({
            bizId: values.bizId || undefined,
            spec: buildProducerSpec(values),
            enabled: values.enabled ?? true,
          });
          message.success('创建成功');
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
          key={`edit-producer-${editRow.id}`}
          title={`编辑来源：${editRow.name}`}
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
          submitter={{
            searchConfig: { submitText: '保存', resetText: '取消' },
          }}
          onFinish={async (values) => {
            await updateProducer(editRow.id, {
              spec: buildProducerSpec(values),
              enabled: values.enabled ?? true,
            });
            message.success('保存成功');
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
        title={`接入令牌：${tokenInfo?.name ?? ''}`}
        open={!!tokenInfo}
        okText="我已保存"
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
          令牌仅此一次展示：落库只存哈希，任何接口不可再取，丢失只能轮换重发，请立即妥善保存。
        </Typography.Paragraph>
        <Typography.Paragraph copyable={{ text: tokenInfo?.token ?? '' }}>
          {tokenInfo?.token}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary">
          数据面接入：Authorization: HMAC &lt;id&gt;:&lt;sig&gt;:&lt;ts&gt;（±5
          分钟防重放）
        </Typography.Paragraph>
      </Modal>
    </>
  );
};

export default ProducerList;
