/**
 * 工单详情（整页）：在流程实例详情（当前处理、流程图、处理动作）的基础上补充工单内容——
 * 顶部摘要（编号、服务、提单人、SLA、满意度），左栏的表单内容、关联资源、附件与评论；
 * 流转记录在右栏的流程进度里。当前处理人可以修改流程本环节允许编辑的表单字段。
 * 工单详情页（/ticket/detail/:id）使用。
 */
import { ProForm, type ProFormInstance } from '@ant-design/pro-components';
import { history, useAccess } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Input,
  Rate,
  Result,
  Spin,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  formToValues,
  groupFields,
  hiddenFieldCodes,
  SchemaFormItems,
  valuesToForm,
} from '@/components/SchemaForm';
import { InstanceDetail } from '@/pages/workflow/components/InstanceDetail';
import { getTicket, rateTicket, updateTicketForm } from '@/services/ticket';
import type {
  TicketDetail as TicketDetailData,
  TicketFormField,
} from '@/services/ticket/typings';
import { useT } from '@/utils/i18n';
import { AttachmentList } from './Attachments';
import {
  formColSpan,
  PriorityTag,
  renderTicketValue,
  SlaTag,
  ticketFieldRenderers,
  ticketSla,
} from './meta';
import { TicketComments } from './TicketComments';

const RATING_COMMENT_MAX = 500;
const DATA_PATH = ['data'] as const;

/** 取值是否为空（未填） */
const isEmpty = (v: unknown) => v === undefined || v === null || v === '';

/** 两个取值是否相同：日期时间按时刻比，其余按 JSON 比；空值之间视为相同 */
const sameValue = (field: TicketFormField, a: unknown, b: unknown) => {
  if (isEmpty(a) || isEmpty(b)) return isEmpty(a) && isEmpty(b);
  if (field.type === 'datetime') {
    return dayjs(String(a)).valueOf() === dayjs(String(b)).valueOf();
  }
  return JSON.stringify(a) === JSON.stringify(b);
};
const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export const TicketDetail: React.FC<{
  ticketId: string;
  /** 返回上一页 */
  onBack: () => void;
  /** 是否展示管理动作（终止 / 改派） */
  manage?: boolean;
  /** 当前用户是否有处理权限（同意 / 拒绝 / 退回 / 转办 / 撤回）；缺省有 */
  canHandle?: boolean;
}> = ({ ticketId, onBack, manage, canHandle }) => {
  const { message } = App.useApp();
  const t = useT();
  const [detail, setDetail] = useState<TicketDetailData>();
  /** 工单加载失败（不存在或无权查看） */
  const [failed, setFailed] = useState(false);
  /** 是否正在修改表单（当前处理人） */
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingBusy, setRatingBusy] = useState(false);
  /** 递增即让流程部分重新加载（表单改动会同步到流程变量） */
  const [reloadToken, setReloadToken] = useState(0);
  const formRef = useRef<ProFormInstance>(undefined);
  const access = useAccess();
  // 只采纳最近一次打开的工单的响应
  const current = useRef<string>(undefined);

  const loadTicket = useCallback((id: string) => {
    // 失败提示由请求层统一弹出；首次加载失败时页面给出返回入口
    getTicket(id).then(
      (result) => {
        if (current.current === id) setDetail(result);
      },
      () => {
        if (current.current === id) setFailed(true);
      },
    );
  }, []);

  useEffect(() => {
    current.current = ticketId;
    setDetail(undefined);
    setFailed(false);
    setEditing(false);
    setRating(0);
    setRatingComment('');
    loadTicket(ticketId);
  }, [ticketId, loadTicket]);

  const ticket = detail?.ticket;
  // 只有查看权限的页面（如仅「全部工单」）不展示改表单 / 评价：对应接口不在其权限内
  const mayHandle = canHandle !== false;
  const fields = ticket?.form ?? [];
  const perms = detail?.fieldPermissions ?? {};
  /** 流程本环节允许当前处理人修改的字段（必填的标为必填） */
  const editable = fields
    .filter((f) => perms[f.code] === 'editable' || perms[f.code] === 'required')
    .map((f) => ({
      ...f,
      required: f.required || perms[f.code] === 'required',
    }));
  /** 本环节必填、目前还空着的字段：不填不能同意 */
  const missing = fields.filter(
    (f) => perms[f.code] === 'required' && isEmpty(ticket?.data?.[f.code]),
  );
  const sla = ticket && ticketSla(ticket);
  const colSpan = formColSpan(ticket?.formColumns);
  // 显示条件不满足的字段不展示
  const hidden = hiddenFieldCodes(fields, ticket?.data);
  const visible = fields.filter((f) => !hidden.has(f.code));

  const saveForm = async (values: { data?: Record<string, unknown> }) => {
    if (!ticket) return;
    const next = formToValues(editable, values.data);
    // 只提交改动过的字段；清空的字段传 null
    const changed = Object.fromEntries(
      editable
        .filter((f) => !sameValue(f, next[f.code], ticket.data?.[f.code]))
        .map((f) => [f.code, next[f.code] ?? null]),
    );
    if (Object.keys(changed).length === 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateTicketForm(ticketId, changed);
      message.success(t('common.msg.saved'));
      setEditing(false);
      loadTicket(ticketId);
      setReloadToken((n) => n + 1);
    } catch {
      // 失败提示由请求层统一弹出，保留已填内容
    } finally {
      setSaving(false);
    }
  };

  const submitRating = async () => {
    if (rating < 1) return;
    setRatingBusy(true);
    try {
      await rateTicket(ticketId, rating, ratingComment.trim());
      message.success(t('pages.ticket.rating.done'));
      loadTicket(ticketId);
    } catch {
      // 失败提示由请求层统一弹出
    } finally {
      setRatingBusy(false);
    }
  };

  if (!ticket) {
    return failed ? (
      <Result
        status="warning"
        title={t('pages.ticket.detail.loadFailed')}
        extra={<Button onClick={onBack}>{t('common.action.back')}</Button>}
      />
    ) : (
      <div style={{ padding: 96, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  const formatTime = (time?: string) =>
    time ? dayjs(time).format(TIME_FORMAT) : t('common.empty');

  const meta = [
    {
      key: 'number',
      label: t('pages.ticket.column.number'),
      children: <Typography.Text copyable>{ticket.number}</Typography.Text>,
    },
    {
      key: 'template',
      label: t('pages.ticket.column.template'),
      children: `${ticket.categoryName} / ${ticket.templateName}`,
    },
    {
      key: 'creator',
      label: t('pages.ticket.column.creator'),
      children: ticket.creatorName || ticket.creator,
    },
    {
      key: 'createTime',
      label: t('pages.ticket.column.createTime'),
      children: formatTime(ticket.createTime),
    },
    {
      key: 'responseDue',
      label: t('pages.ticket.sla.response'),
      children: ticket.responseDue ? (
        <Flex gap={8} align="center" wrap>
          {dayjs(ticket.responseDue).format(TIME_FORMAT)}
          {sla && <SlaTag {...sla.response} />}
        </Flex>
      ) : (
        t('pages.ticket.sla.none')
      ),
    },
    {
      key: 'resolveDue',
      label: t('pages.ticket.sla.resolve'),
      children: ticket.resolveDue ? (
        <Flex gap={8} align="center" wrap>
          {dayjs(ticket.resolveDue).format(TIME_FORMAT)}
          {sla && <SlaTag {...sla.resolve} />}
        </Flex>
      ) : (
        t('pages.ticket.sla.none')
      ),
    },
    ...(ticket.endTime
      ? [
          {
            key: 'endTime',
            label: t('pages.ticket.column.endTime'),
            children: formatTime(ticket.endTime),
          },
        ]
      : []),
    ...(ticket.rating
      ? [
          {
            key: 'rating',
            label: t('pages.ticket.rating.label'),
            children: (
              <Flex gap={12} align="center" wrap>
                <Rate disabled value={ticket.rating} />
                {ticket.ratingComment && (
                  <Typography.Text type="secondary">
                    {ticket.ratingComment}
                  </Typography.Text>
                )}
              </Flex>
            ),
          },
        ]
      : []),
  ];

  // 工单结束后提单人的评价入口：摘要下方单独一条
  const notice = detail.canRate && mayHandle && (
    <Card variant="outlined" title={t('pages.ticket.rating.prompt')}>
      <Flex vertical gap={12}>
        <Rate value={rating} onChange={setRating} />
        <Input.TextArea
          value={ratingComment}
          maxLength={RATING_COMMENT_MAX}
          autoSize={{ minRows: 2, maxRows: 4 }}
          placeholder={t('pages.ticket.rating.placeholder')}
          onChange={(e) => setRatingComment(e.target.value)}
        />
        <Flex justify="flex-end">
          <Button
            type="primary"
            loading={ratingBusy}
            disabled={rating < 1}
            onClick={() => void submitRating()}
          >
            {t('pages.ticket.rating.submit')}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );

  const main = (
    <>
      {fields.length > 0 && (
        <Card
          variant="outlined"
          title={t('pages.ticket.detail.form')}
          extra={
            detail.canEditForm &&
            mayHandle &&
            !editing && (
              <Button size="small" onClick={() => setEditing(true)}>
                {t('pages.ticket.form.edit')}
              </Button>
            )
          }
        >
          {missing.length > 0 && !editing && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              title={t('pages.ticket.form.missing', {
                fields: missing.map((f) => f.name).join('、'),
              })}
            />
          )}
          {editing ? (
            <ProForm
              formRef={formRef}
              // 与提单时同一种布局：单列 / 双列
              grid
              rowProps={{ gutter: 16 }}
              colProps={{ span: colSpan }}
              initialValues={{ data: valuesToForm(editable, ticket.data) }}
              submitter={{
                searchConfig: {
                  submitText: t('common.action.save'),
                  resetText: t('common.action.cancel'),
                },
                submitButtonProps: { loading: saving },
                onReset: () => setEditing(false),
              }}
              onFinish={saveForm}
            >
              <SchemaFormItems
                fields={editable}
                namePath={DATA_PATH}
                renderers={ticketFieldRenderers(ticket.data, detail.labels)}
                customColSpan={colSpan}
                // 显示条件的控制字段不一定在可编辑的字段里：用工单现有的取值判断
                baseValues={ticket.data}
              />
            </ProForm>
          ) : (
            // 按分组分段展示；显示条件不满足的字段不展示
            groupFields(visible).map((group, index) => (
              <Descriptions
                // biome-ignore lint/suspicious/noArrayIndexKey: 分组按位置切分，没有稳定标识
                key={index}
                title={
                  group.title ? (
                    <Typography.Text type="secondary">
                      {group.title}
                    </Typography.Text>
                  ) : undefined
                }
                style={index > 0 ? { marginTop: 12 } : undefined}
                // 展示也跟随表单布局：单列一行一个字段，双列一行两个（窄屏退回一个）
                column={ticket.formColumns === 2 ? { xs: 1, md: 2 } : 1}
                size="small"
                items={group.fields.map((field) => ({
                  key: field.code,
                  label: field.name,
                  // 多行文本独占一行
                  span: field.type === 'text' ? 'filled' : 1,
                  children: renderTicketValue(
                    field,
                    ticket.data?.[field.code],
                    detail.labels,
                    t,
                  ),
                }))}
              />
            ))
          )}
        </Card>
      )}
      {!!detail.resources?.length && (
        <Card variant="outlined" title={t('pages.ticket.resource.label')}>
          <Flex vertical gap={4}>
            {detail.resources.map((res) => (
              <Flex key={res.id} gap={8} align="center">
                {access.canCmdbCI ? (
                  <a onClick={() => history.push(`/cmdb/ci/${res.id}`)}>
                    {res.name}
                  </a>
                ) : (
                  res.name
                )}
                {res.modelName && <Tag>{res.modelName}</Tag>}
              </Flex>
            ))}
          </Flex>
        </Card>
      )}
      {!!detail.files?.length && (
        <Card variant="outlined" title={t('pages.ticket.attachment.label')}>
          <AttachmentList files={detail.files} />
        </Card>
      )}
      <Card variant="outlined" title={t('pages.ticket.comment.heading')}>
        <TicketComments ticketId={ticketId} />
      </Card>
    </>
  );

  return (
    <InstanceDetail
      instanceId={ticket.instanceId}
      onBack={onBack}
      onChanged={() => {
        // 流程动作会改变工单的可编辑字段、评价入口与 SLA 状态：工单部分一并重载
        loadTicket(ticketId);
        setEditing(false);
      }}
      manage={manage}
      canHandle={canHandle}
      reloadToken={reloadToken}
      business={{
        tags: <PriorityTag priority={ticket.priority} />,
        meta,
        notice,
        main,
      }}
    />
  );
};

export default TicketDetail;
