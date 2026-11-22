/**
 * 文档编辑页：新建（/knowledge/doc/new?spaceId=）与编辑（/knowledge/doc/:id/edit）共用。
 * 上半是基本信息（两列栅格），下半是 Markdown 编辑器（@uiw/react-md-editor）；保存草稿 / 发布。
 * 正文含疑似密钥时后端拒绝并给出行号。
 */
import { LeftOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import MDEditor from '@uiw/react-md-editor';
import { history, useModel, useParams, useSearchParams } from '@umijs/max';
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  createDocument,
  getDocument,
  publishDocument,
  updateDocument,
} from '@/services/knowledge/document';
import type { KnowledgeDocument } from '@/services/knowledge/typings';
import {
  getErrorMetadata,
  getErrorReason,
} from '@/services/system/domainRequest';
import { useFormRules, useT } from '@/utils/i18n';
import { DOC_CONTENT_MAX, DOC_TAGS_MAX, docPath } from '../components/meta';
import { OwnerSelect, SpaceSelect } from '../components/selectors';
import { useKnowledgeStyles } from '../components/styles';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface FormValues {
  spaceId: string;
  title: string;
  slug?: string;
  tags?: string[];
  summary?: string;
  ownerId?: string;
  reviewAt?: Dayjs | null;
}

const DocumentEdit: React.FC = () => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  const { styles } = useKnowledgeStyles();
  const { id } = useParams<{ id?: string }>();
  const [params] = useSearchParams();
  const [form] = Form.useForm<FormValues>();
  const [content, setContent] = useState('');
  const [doc, setDoc] = useState<KnowledgeDocument>();
  const [loading, setLoading] = useState(!!id);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const { initialState } = useModel('@@initialState');
  const dark = initialState?.settings?.navTheme === 'realDark';
  const isNew = !id;

  useEffect(() => {
    if (!id) {
      const spaceId = params.get('spaceId') ?? undefined;
      form.setFieldsValue({ spaceId });
      return;
    }
    getDocument(id)
      .then((res) => {
        const d = res.document;
        setDoc(d);
        setContent(d.draftContent ?? d.content ?? '');
        form.setFieldsValue({
          spaceId: d.spaceId,
          title: d.title,
          slug: d.slug,
          tags: d.tags ?? [],
          summary: d.summary,
          ownerId: d.ownerId,
          reviewAt: d.reviewAt ? dayjs(d.reviewAt) : null,
        });
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, [id, params, form]);

  const explainError = (error: unknown) => {
    if (getErrorReason(error) === 'KNOWLEDGE_SECRET_DETECTED') {
      const meta = getErrorMetadata(error);
      message.error(
        t('pages.knowledge.edit.secretDetected', {
          line: meta?.line ?? '?',
          kind: meta?.kind ?? '',
        }),
      );
      return true;
    }
    return false;
  };

  const back = () => (id ? history.push(docPath(id)) : history.back());

  const save = async (publish: boolean) => {
    const values = await form.validateFields();
    if (content.length > DOC_CONTENT_MAX) {
      message.error(t('pages.knowledge.edit.tooLarge'));
      return;
    }
    setSaving(true);
    try {
      let docId = id;
      if (isNew) {
        const res = await createDocument({
          spaceId: values.spaceId,
          title: values.title.trim(),
          slug: values.slug?.trim() || undefined,
          content,
          tags: values.tags,
          summary: values.summary?.trim(),
          ownerId: values.ownerId,
          publish,
        });
        docId = res.document.id;
      } else if (docId) {
        await updateDocument(docId, {
          title: values.title.trim(),
          content,
          tags: { items: values.tags ?? [] },
          summary: values.summary?.trim() ?? '',
          ownerId: values.ownerId,
          reviewAt: values.reviewAt ? values.reviewAt.toISOString() : undefined,
          clearReviewAt: !values.reviewAt && !!doc?.reviewAt,
        });
        if (publish) {
          const res = await publishDocument(docId);
          message.success(
            res.pendingReview
              ? t('pages.knowledge.doc.publishPending')
              : t('pages.knowledge.doc.publishSuccess'),
          );
          history.push(docPath(docId));
          return;
        }
      }
      message.success(t('pages.knowledge.msg.saved'));
      if (docId) history.push(docPath(docId));
    } catch (error) {
      // 非密钥类错误域级 request 已提示，不再向上抛
      explainError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loadFailed) {
    return (
      <PageContainer title={false}>
        <Button
          type="link"
          icon={<LeftOutlined />}
          style={{ paddingInline: 0, marginBottom: 12 }}
          onClick={() => history.back()}
        >
          {t('common.action.back')}
        </Button>
        <Card variant="outlined">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.knowledge.doc.notFound')}
          />
        </Card>
      </PageContainer>
    );
  }

  const actions = (
    <Space>
      <Button onClick={back}>{t('common.action.cancel')}</Button>
      <Button loading={saving} onClick={() => save(false)}>
        {t('pages.knowledge.edit.saveDraft')}
      </Button>
      <Button type="primary" loading={saving} onClick={() => save(true)}>
        {t('pages.knowledge.doc.publish')}
      </Button>
    </Space>
  );

  return (
    <PageContainer title={false}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Button
          type="link"
          icon={<LeftOutlined />}
          style={{ paddingInline: 0 }}
          onClick={back}
        >
          {t('pages.knowledge.edit.back')}
        </Button>
        {actions}
      </Flex>
      <Spin spinning={loading}>
        <Flex vertical gap={16}>
          <Card
            variant="outlined"
            title={
              isNew
                ? t('pages.knowledge.doc.create')
                : t('pages.knowledge.edit.title', { title: doc?.title ?? '' })
            }
          >
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="spaceId"
                    label={t('pages.knowledge.doc.column.space')}
                    rules={[
                      rules.select(t('pages.knowledge.doc.column.space')),
                    ]}
                  >
                    <SpaceSelect
                      minLevel={2}
                      disabled={!isNew}
                      allowClear={false}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="title"
                    label={t('pages.knowledge.doc.column.title')}
                    rules={[
                      rules.required(t('pages.knowledge.doc.column.title')),
                      rules.maxChars(255),
                    ]}
                  >
                    <Input maxLength={255} showCount />
                  </Form.Item>
                </Col>
                {isNew && (
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="slug"
                      label="slug"
                      tooltip={t('pages.knowledge.edit.slugTip')}
                      rules={[
                        {
                          pattern: /^([a-z0-9][a-z0-9-]*)?$/,
                          message: t('pages.knowledge.edit.slugPattern'),
                        },
                      ]}
                    >
                      <Input
                        maxLength={128}
                        placeholder={t('pages.knowledge.edit.slugPlaceholder')}
                      />
                    </Form.Item>
                  </Col>
                )}
                <Col xs={24} md={12}>
                  <Form.Item
                    name="tags"
                    label={t('pages.knowledge.doc.column.tags')}
                  >
                    <Select
                      mode="tags"
                      maxCount={DOC_TAGS_MAX}
                      tokenSeparators={[',', ' ']}
                      placeholder={t('pages.knowledge.edit.tagsPlaceholder')}
                      open={false}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="ownerId"
                    label={t('pages.knowledge.doc.column.owner')}
                  >
                    <OwnerSelect
                      known={
                        doc?.ownerName
                          ? [{ id: doc.ownerId, label: doc.ownerName }]
                          : undefined
                      }
                    />
                  </Form.Item>
                </Col>
                {!isNew && (
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="reviewAt"
                      label={t('pages.knowledge.doc.column.reviewAt')}
                      tooltip={t('pages.knowledge.edit.reviewAtTip')}
                    >
                      <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                )}
                <Col span={24}>
                  <Form.Item
                    name="summary"
                    label={t('pages.knowledge.edit.summary')}
                    style={{ marginBottom: 0 }}
                  >
                    <Input.TextArea
                      rows={2}
                      maxLength={1000}
                      showCount
                      placeholder={t('pages.knowledge.edit.summaryPlaceholder')}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
          <Card
            variant="outlined"
            title={t('pages.knowledge.edit.section.content')}
            extra={
              <span className={styles.hint}>
                {t('pages.knowledge.edit.contentPlaceholder')}
              </span>
            }
          >
            <div data-color-mode={dark ? 'dark' : 'light'}>
              <MDEditor
                value={content}
                onChange={(v) => setContent(v ?? '')}
                height={560}
                preview="live"
                textareaProps={{
                  placeholder: t('pages.knowledge.edit.contentPlaceholder'),
                }}
              />
            </div>
          </Card>
          <Flex justify="flex-end">{actions}</Flex>
        </Flex>
      </Spin>
    </PageContainer>
  );
};

export default DocumentEdit;
