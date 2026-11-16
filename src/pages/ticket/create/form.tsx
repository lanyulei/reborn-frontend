/**
 * 填写工单页（/ticket/create/:templateId）：填写指定工单模板的表单并提交，
 * 提交后进入该工单的详情页。模板在提交工单页（/ticket/create）里选。
 * 表单项由模板的字段定义驱动（通用 SchemaForm），人员 / 部门字段用工单域的控件。
 */
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  type ProFormInstance,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { history, useAccess, useParams } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Result,
  Spin,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { formToValues, SchemaFormItems } from '@/components/SchemaForm';
import { listCIs } from '@/services/cmdb/ci';
import { createTicket, getTemplate } from '@/services/ticket';
import type { TicketPriority, TicketTemplate } from '@/services/ticket/typings';
import { useFormRules, useOptions, useT } from '@/utils/i18n';
import { randomUUID } from '@/utils/uuid';
import { AttachmentUpload } from '../components/Attachments';
import {
  formColSpan,
  TICKET_FIELD_RENDERERS,
  TICKET_PRIORITY_DEFAULT,
  TICKET_PRIORITY_META,
  TICKET_PRIORITY_ORDER,
} from '../components/meta';

const TITLE_MAX = 255;
/** 单张工单关联的资源数上限（与后端 proto 校验一致） */
const RESOURCE_MAX = 20;
const DATA_PATH = ['data'] as const;

interface FormValues {
  title: string;
  priority: TicketPriority;
  data?: Record<string, unknown>;
  fileIds?: string[];
  ciIds?: string[];
}

/** 表单区的阅读宽度：字段不随宽屏无限拉长 */
const FORM_MAX_WIDTH = 800;
const CATALOG_PATH = '/ticket/create';
const FULL = { span: 24 };

const TicketCreateForm: React.FC = () => {
  const { templateId = '' } = useParams<{ templateId: string }>();
  const { message, modal } = App.useApp();
  const access = useAccess();
  const t = useT();
  const rules = useFormRules();
  const priorityOptions = useOptions(
    TICKET_PRIORITY_META,
    TICKET_PRIORITY_ORDER,
  );
  const formRef = useRef<ProFormInstance<FormValues>>(undefined);
  /** 模板加载失败（不存在、已停用或无权使用） */
  const [failed, setFailed] = useState(false);
  const [template, setTemplate] = useState<TicketTemplate>();
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // 幂等键：每次进入一张模板的表单对应一个，重复点击提交不会创建两张工单
  const requestId = useRef('');
  // 提交中的标记用 ref：连续两次点击之间来不及等状态重渲染
  const submittingRef = useRef(false);
  // 只采纳最近一次打开的模板的响应（地址里的模板切换时）
  const pickSeq = useRef(0);

  useEffect(() => {
    pickSeq.current += 1;
    const seq = pickSeq.current;
    setTemplate(undefined);
    setFailed(false);
    getTemplate(templateId)
      .then((result) => {
        if (seq !== pickSeq.current) return;
        requestId.current = randomUUID();
        setUploading(false);
        setTemplate(result.template);
      })
      // 失败提示由请求层统一弹出；页面给出返回入口
      .catch(() => {
        if (seq === pickSeq.current) setFailed(true);
      });
    return () => {
      // 离开或换模板后，丢弃还在路上的响应
      pickSeq.current += 1;
    };
  }, [templateId]);

  const fields = template?.form ?? [];
  const colSpan = formColSpan(template?.formColumns);
  // 关联资源要在 CMDB 里搜索：没有资源查看权限的人选不了；模板又要求必填时无法提单
  const ciLink = template?.ciLink ?? 0;
  const canPickCI = !!access.canCmdbCI;
  const blocked = ciLink === 2 && !canPickCI;

  const submit = async (values: FormValues) => {
    // 附件仍在上传时不提交（回车提交会绕过置灰的按钮）
    if (!template || blocked || uploading || submittingRef.current) return;
    // 未填写的字段不提交（后端按「未提供」处理）
    const data = Object.fromEntries(
      Object.entries(formToValues(fields, values.data)).filter(
        ([, v]) => v !== null,
      ),
    );
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const { ticket } = await createTicket({
        templateId: template.id,
        title: values.title.trim(),
        priority: values.priority,
        data,
        fileIds: values.fileIds,
        ciIds: ciLink !== 0 && canPickCI ? values.ciIds : undefined,
        requestId: requestId.current,
      });
      message.success(
        t('pages.ticket.create.success', { number: ticket.number }),
      );
      // replace：从详情页返回时回到模板列表，而不是这张已提交的表单
      history.replace(`/ticket/detail/${ticket.id}`);
    } catch {
      // 失败提示由请求层统一弹出，保留已填内容
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  /** 已填了内容（或附件还在上传）时，离开前先确认，避免误触丢失 */
  const leave = (action: () => void) => {
    if (!template || !(formRef.current?.isFieldsTouched() || uploading)) {
      action();
      return;
    }
    modal.confirm({
      title: t('pages.ticket.create.discard.title'),
      content: t('pages.ticket.create.discard.description'),
      okText: t('pages.ticket.create.discard.ok'),
      okButtonProps: { danger: true },
      onOk: action,
    });
  };

  const back = () => leave(() => history.push(CATALOG_PATH));

  return (
    <PageContainer title={false}>
      {!template ? (
        failed ? (
          <Result
            status="warning"
            title={t('pages.ticket.create.loadFailed')}
            extra={
              <Button onClick={() => history.push(CATALOG_PATH)}>
                {t('common.action.back')}
              </Button>
            }
          />
        ) : (
          <div style={{ padding: 96, textAlign: 'center' }}>
            <Spin />
          </div>
        )
      ) : (
        <>
          <Card
            variant="outlined"
            // 给底部固定的操作栏让出位置
            style={{ marginBottom: 64 }}
            title={t('pages.ticket.create.titleOf', { name: template.name })}
          >
            <div style={{ maxWidth: FORM_MAX_WIDTH }}>
              {template.description && (
                <Typography.Paragraph type="secondary">
                  {template.description}
                </Typography.Paragraph>
              )}
              {blocked && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  title={t('pages.ticket.create.ci.blocked')}
                />
              )}
              <ProForm<FormValues>
                // 换一张模板即换一张表单
                key={template.id}
                formRef={formRef}
                submitter={false}
                // 栅格布局：字段的列宽随模板的表单布局（单列占满一行、双列一行两个）；
                // 标题、优先级、关联资源、附件始终独占一行
                grid
                rowProps={{ gutter: 16 }}
                colProps={{ span: colSpan }}
                initialValues={{
                  priority: TICKET_PRIORITY_DEFAULT,
                  // 开关缺省即「否」：不预置的话，未拨动的开关不会随表单提交
                  data: Object.fromEntries(
                    fields
                      .filter((f) => f.type === 'bool')
                      .map((f) => [f.code, false]),
                  ),
                }}
                onFinish={submit}
              >
                <ProFormText
                  name="title"
                  colProps={FULL}
                  label={t('pages.ticket.column.title')}
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: t('common.validation.required', {
                        label: t('pages.ticket.column.title'),
                      }),
                    },
                    rules.max(TITLE_MAX),
                  ]}
                />
                <ProFormRadio.Group
                  name="priority"
                  colProps={FULL}
                  label={t('pages.ticket.column.priority')}
                  options={priorityOptions}
                  rules={[rules.select(t('pages.ticket.column.priority'))]}
                />
                <SchemaFormItems
                  fields={fields}
                  namePath={DATA_PATH}
                  renderers={TICKET_FIELD_RENDERERS}
                  customColSpan={colSpan}
                />
                {ciLink !== 0 && canPickCI && (
                  <ProFormSelect
                    name="ciIds"
                    colProps={FULL}
                    label={t('pages.ticket.resource.label')}
                    placeholder={t('pages.ticket.resource.placeholder')}
                    mode="multiple"
                    showSearch
                    debounceTime={300}
                    fieldProps={{ filterOption: false, maxCount: RESOURCE_MAX }}
                    request={async ({ keyWords }) => {
                      const result = await listCIs({
                        page: 1,
                        pageSize: 20,
                        keyword: keyWords || undefined,
                      });
                      return (result.items ?? []).map((ci) => ({
                        value: ci.id,
                        label: `${ci.name} · ${ci.modelName || ci.modelCode}`,
                      }));
                    }}
                    rules={
                      ciLink === 2
                        ? [
                            {
                              required: true,
                              type: 'array',
                              message: t('common.validation.select', {
                                label: t('pages.ticket.resource.label'),
                              }),
                            },
                          ]
                        : undefined
                    }
                  />
                )}
                <Col span={24}>
                  <Form.Item
                    name="fileIds"
                    label={t('pages.ticket.attachment.label')}
                    extra={t('pages.ticket.attachment.hint')}
                  >
                    <AttachmentUpload onUploadingChange={setUploading} />
                  </Form.Item>
                </Col>
              </ProForm>
            </div>
          </Card>
          <FooterToolbar
            // 按钮居中（缺省布局靠右）
            renderContent={() => (
              <Flex
                justify="center"
                align="center"
                gap={8}
                style={{ width: '100%', minHeight: 64 }}
              >
                <Button onClick={back}>{t('common.action.cancel')}</Button>
                <Button
                  type="primary"
                  loading={submitting}
                  disabled={uploading || blocked}
                  onClick={() => formRef.current?.submit()}
                >
                  {t('pages.ticket.create.submit')}
                </Button>
              </Flex>
            )}
          />
        </>
      )}
    </PageContainer>
  );
};

export default TicketCreateForm;
