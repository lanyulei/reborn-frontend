/**
 * 文档阅读页：Markdown 正文 + 目录、元数据、关联对象、版本历史；
 * 操作：问 AI（带页内上下文）/ 编辑 / 发布 / 审核 / 确认有效 / 归档 / 恢复 / 删除。破坏性操作一律 modal.confirm。
 */
import {
  CheckCircleOutlined,
  EditOutlined,
  HistoryOutlined,
  LeftOutlined,
  RobotOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import XMarkdown from '@ant-design/x-markdown';
import { history, Link, useAccess, useLocation, useParams } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { askAssistant } from '@/components/GlobalChat/ask';
import { ConfirmLink } from '@/components/TableActions';
import {
  addLink,
  archiveDocument,
  confirmDocumentReview,
  deleteDocument,
  getDocument,
  getVersion,
  listVersions,
  publishDocument,
  removeLink,
  restoreDocument,
  reviewDocument,
  rollbackDocument,
} from '@/services/knowledge/document';
import type {
  KnowledgeDocument,
  KnowledgeLinkTargetType,
  KnowledgeVersion,
} from '@/services/knowledge/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useEnumText, useFormRules, useOptions, useT } from '@/utils/i18n';
import {
  DOC_STATUS_META,
  docEditPath,
  INDEX_STATUS_META,
  LINK_TARGET_META,
  LINK_TARGET_ORDER,
  spacePath,
} from '../components/meta';
import { useKnowledgeStyles } from '../components/styles';

const DocumentDetail: React.FC = () => {
  const t = useT();
  const { id = '' } = useParams<{ id: string }>();
  const { modal, message } = App.useApp();
  const has = usePermissions();
  const access = useAccess();
  const rules = useFormRules();
  const { styles } = useKnowledgeStyles();
  const statusText = useEnumText(DOC_STATUS_META);
  const indexText = useEnumText(INDEX_STATUS_META);
  const linkTypeText = useEnumText(LINK_TARGET_META);
  const linkTypeOptions = useOptions(LINK_TARGET_META, LINK_TARGET_ORDER);
  const [doc, setDoc] = useState<KnowledgeDocument>();
  const [loading, setLoading] = useState(true);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<KnowledgeVersion[]>([]);
  const [viewing, setViewing] = useState<KnowledgeVersion>();
  const [linkOpen, setLinkOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState<'approve' | 'reject' | null>(
    null,
  );
  const bodyRef = useRef<HTMLDivElement>(null);
  // 引用链接 #chunk-N：详情接口不返回分块边界，先滚到正文并提示来自第 N 段
  const { hash } = useLocation();
  const chunkSeq = /^#chunk-(\d+)$/.exec(hash)?.[1];

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getDocument(id);
      setDoc(res.document);
    } catch {
      setDoc(undefined);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!doc || !chunkSeq) return;
    bodyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [doc, chunkSeq]);

  const level = doc?.level ?? 0;
  const canWrite = has('knowledge.write') && level >= 2;
  // 负责人判定由后端兜底（归档 / 删除对负责人放行），前端按空间级别显示入口
  const canManage = level >= 3;
  const canReview =
    has('knowledge.review') && level >= 3 && doc?.reviewState === 1;
  const canArchive = has('knowledge.archive') && canManage;
  const canDelete = has('knowledge.delete') && canManage;

  const run = async (action: () => Promise<unknown>, successText: string) => {
    await action();
    message.success(successText);
    await load();
  };

  const publish = () =>
    modal.confirm({
      title: t('pages.knowledge.doc.publishTitle'),
      content: t('pages.knowledge.doc.publishDesc'),
      onOk: async () => {
        const res = await publishDocument(id);
        message.success(
          res.pendingReview
            ? t('pages.knowledge.doc.publishPending')
            : t('pages.knowledge.doc.publishSuccess'),
        );
        await load();
      },
    });

  const dangerous = (
    title: string,
    desc: string,
    action: () => Promise<unknown>,
    successText: string,
    after?: () => void,
  ) =>
    modal.confirm({
      title,
      content: desc,
      okButtonProps: { danger: true },
      onOk: async () => {
        await action();
        message.success(successText);
        if (after) after();
        else await load();
      },
    });

  const openVersions = async () => {
    setVersionsOpen(true);
    const res = await listVersions(id);
    setVersions(res.items ?? []);
  };

  const jumpTo = (heading: string) => {
    const last = heading.split(' > ').pop()?.trim();
    if (!last || !bodyRef.current) return;
    const nodes = bodyRef.current.querySelectorAll('h1,h2,h3,h4,h5,h6');
    for (const node of Array.from(nodes)) {
      if (node.textContent?.trim() === last) {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  };

  const content = useMemo(() => doc?.content ?? '', [doc]);
  const back = () =>
    doc ? history.push(spacePath(doc.spaceId)) : history.back();

  if (loading && !doc) {
    return (
      <PageContainer title={false}>
        <Spin />
      </PageContainer>
    );
  }
  if (!doc) {
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

  const moreItems = [
    doc.status !== 3 && canArchive
      ? { key: 'archive', label: t('pages.knowledge.doc.archive') }
      : null,
    doc.status === 3 && canArchive
      ? { key: 'restore', label: t('pages.knowledge.doc.restore') }
      : null,
    canDelete
      ? { key: 'delete', label: t('common.action.delete'), danger: true }
      : null,
  ].filter(Boolean) as { key: string; label: string; danger?: boolean }[];

  const onMore = (key: string) => {
    if (key === 'archive') {
      dangerous(
        t('pages.knowledge.doc.archiveTitle'),
        t('pages.knowledge.doc.archiveDesc'),
        () => archiveDocument(id),
        t('pages.knowledge.doc.archiveSuccess'),
      );
    } else if (key === 'restore') {
      modal.confirm({
        title: t('pages.knowledge.doc.restoreTitle'),
        onOk: () =>
          run(
            () => restoreDocument(id),
            t('pages.knowledge.doc.restoreSuccess'),
          ),
      });
    } else if (key === 'delete') {
      dangerous(
        t('pages.knowledge.doc.deleteTitle'),
        t('pages.knowledge.doc.deleteDesc'),
        () => deleteDocument(id),
        t('pages.knowledge.msg.deleted'),
        () => history.push(spacePath(doc.spaceId)),
      );
    }
  };

  return (
    <PageContainer title={false}>
      <Button
        type="link"
        icon={<LeftOutlined />}
        style={{ paddingInline: 0, marginBottom: 12 }}
        onClick={back}
      >
        {t('pages.knowledge.doc.backToSpace')}
      </Button>
      <Flex vertical gap={16}>
        <Card variant="outlined">
          <Flex justify="space-between" align="flex-start" gap={16} wrap>
            <div style={{ minWidth: 0 }}>
              <Typography.Title level={4} className={styles.headTitle}>
                {doc.title}
              </Typography.Title>
              <Space size={4} wrap style={{ marginTop: 8 }}>
                <Tag>{statusText(doc.status ?? 1)}</Tag>
                {doc.version ? <Tag color="blue">v{doc.version}</Tag> : null}
                {doc.hasDraft && <Tag>{t('pages.knowledge.doc.hasDraft')}</Tag>}
                {doc.reviewState === 1 && (
                  <Tag color="processing">
                    {t('pages.knowledge.doc.reviewPending')}
                  </Tag>
                )}
                {doc.reviewOverdue && (
                  <Tag color="warning">
                    {t('pages.knowledge.doc.reviewOverdue')}
                  </Tag>
                )}
              </Space>
            </div>
            <Space wrap style={{ flex: 'none' }}>
              {access.canAssistant && (
                <Button
                  icon={<RobotOutlined />}
                  onClick={() =>
                    askAssistant(
                      t('pages.knowledge.doc.askPrefix', { title: doc.title }),
                      { type: 'knowledge_document', id: doc.id },
                    )
                  }
                >
                  {t('pages.knowledge.askAi')}
                </Button>
              )}
              <Button icon={<HistoryOutlined />} onClick={openVersions}>
                {t('pages.knowledge.doc.versions')}
              </Button>
              {canWrite && doc.status !== 3 && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => history.push(docEditPath(doc.id))}
                >
                  {t('common.action.edit')}
                </Button>
              )}
              {canWrite &&
                doc.status !== 3 &&
                (doc.status === 1 || doc.hasDraft) &&
                doc.reviewState !== 1 && (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={publish}
                  >
                    {t('pages.knowledge.doc.publish')}
                  </Button>
                )}
              {canReview && (
                <>
                  <Button
                    type="primary"
                    onClick={() => setReviewOpen('approve')}
                  >
                    {t('pages.knowledge.doc.approve')}
                  </Button>
                  <Button danger onClick={() => setReviewOpen('reject')}>
                    {t('pages.knowledge.doc.reject')}
                  </Button>
                </>
              )}
              {doc.status === 2 && canWrite && (
                <Button
                  icon={<CheckCircleOutlined />}
                  onClick={() =>
                    modal.confirm({
                      title: t('pages.knowledge.doc.confirmReviewTitle'),
                      content: t('pages.knowledge.doc.confirmReviewDesc'),
                      onOk: () =>
                        run(
                          () => confirmDocumentReview(id),
                          t('pages.knowledge.doc.confirmReviewSuccess'),
                        ),
                    })
                  }
                >
                  {t('pages.knowledge.doc.confirmReview')}
                </Button>
              )}
              {moreItems.length > 0 && (
                <Dropdown
                  menu={{ items: moreItems, onClick: ({ key }) => onMore(key) }}
                >
                  <Button>{t('common.action.more')}</Button>
                </Dropdown>
              )}
            </Space>
          </Flex>
          {doc.hasDraft && doc.status === 2 && (
            <Alert
              type="info"
              showIcon
              title={t('pages.knowledge.doc.draftNotice')}
              style={{ marginTop: 12 }}
              action={
                canWrite && doc.reviewState !== 1 ? (
                  <Button size="small" type="primary" onClick={publish}>
                    {t('pages.knowledge.doc.publish')}
                  </Button>
                ) : undefined
              }
            />
          )}
          {doc.reviewState === 1 && (
            <Alert
              type="warning"
              showIcon
              title={t('pages.knowledge.doc.reviewNotice')}
              style={{ marginTop: 12 }}
            />
          )}
          <Descriptions
            className={styles.headMeta}
            size="small"
            column={{ xs: 1, md: 2, xl: 4 }}
            items={[
              {
                key: 'space',
                label: t('pages.knowledge.doc.column.space'),
                children: (
                  <Link to={spacePath(doc.spaceId)}>
                    {doc.spaceName ?? t('common.empty')}
                  </Link>
                ),
              },
              {
                key: 'owner',
                label: t('pages.knowledge.doc.column.owner'),
                children: doc.ownerName ?? t('common.empty'),
              },
              {
                key: 'tags',
                label: t('pages.knowledge.doc.column.tags'),
                children: doc.tags?.length
                  ? doc.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                  : t('common.empty'),
              },
              {
                key: 'source',
                label: t('pages.knowledge.doc.column.source'),
                children: doc.source
                  ? t(`enum.knowledge.source.${doc.source}`)
                  : t('common.empty'),
              },
              {
                key: 'publish',
                label: t('pages.knowledge.doc.column.publishTime'),
                children: doc.publishTime
                  ? formatTime(doc.publishTime)
                  : t('common.empty'),
              },
              {
                key: 'reviewAt',
                label: t('pages.knowledge.doc.column.reviewAt'),
                children: doc.reviewAt
                  ? formatTime(doc.reviewAt)
                  : t('pages.knowledge.doc.noReview'),
              },
              {
                key: 'index',
                label: t('pages.knowledge.doc.column.indexStatus'),
                children: indexText(doc.indexStatus ?? 0),
              },
              {
                key: 'slug',
                label: 'slug',
                children: (
                  <Typography.Text className={styles.hint} copyable>
                    {doc.slug}
                  </Typography.Text>
                ),
              },
            ]}
          />
          {doc.summary && <div className={styles.summary}>{doc.summary}</div>}
        </Card>

        <div className="flex gap-4 items-start">
          {doc.headings && doc.headings.length > 0 && (
            <div className={`${styles.outline} hidden lg:block w-56 shrink-0`}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {t('pages.knowledge.doc.outline')}
              </div>
              {doc.headings.map((h) => (
                <a key={h} onClick={() => jumpTo(h)} title={h}>
                  {h.split(' > ').pop()}
                </a>
              ))}
            </div>
          )}
          <Card
            variant="outlined"
            title={t('pages.knowledge.doc.section.body')}
            className="flex-1 min-w-0"
          >
            {chunkSeq && (
              <Alert
                type="info"
                showIcon
                closable
                title={t('pages.knowledge.doc.chunkHint', { n: chunkSeq })}
                style={{ marginBottom: 12 }}
              />
            )}
            <div ref={bodyRef} className={styles.markdown}>
              {content ? (
                <XMarkdown>{content}</XMarkdown>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('pages.knowledge.doc.emptyContent')}
                />
              )}
            </div>
          </Card>
        </div>

        <Card
          variant="outlined"
          title={t('pages.knowledge.doc.links')}
          extra={
            canWrite && (
              <Button onClick={() => setLinkOpen(true)}>
                {t('pages.knowledge.doc.addLink')}
              </Button>
            )
          }
        >
          {doc.links && doc.links.length > 0 ? (
            <div>
              {doc.links.map((link) => (
                <div key={link.id} className={styles.listRow}>
                  <Space>
                    <Tag>{linkTypeText(link.targetType)}</Tag>
                    <span>{link.targetName || link.targetId}</span>
                    {link.targetName && (
                      <Typography.Text
                        className={styles.hint}
                        copyable={{ text: link.targetId }}
                      >
                        {link.targetId}
                      </Typography.Text>
                    )}
                  </Space>
                  {canWrite && (
                    <ConfirmLink
                      danger
                      title={t('pages.knowledge.doc.removeLinkTitle')}
                      onConfirm={() =>
                        run(
                          () => removeLink(id, link.id),
                          t('pages.knowledge.msg.deleted'),
                        )
                      }
                    >
                      {t('pages.knowledge.doc.removeLink')}
                    </ConfirmLink>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('pages.knowledge.doc.noLinks')}
            />
          )}
        </Card>
      </Flex>

      <ModalForm<{
        targetType: KnowledgeLinkTargetType;
        targetId: string;
        targetName?: string;
      }>
        title={t('pages.knowledge.doc.addLink')}
        width={480}
        open={linkOpen}
        onOpenChange={setLinkOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          await addLink(id, {
            ...values,
            targetId: values.targetId.trim(),
            targetName: values.targetName?.trim() || undefined,
          });
          message.success(t('pages.knowledge.msg.created'));
          await load();
          return true;
        }}
      >
        <ProFormSelect
          name="targetType"
          label={t('pages.knowledge.doc.link.type')}
          options={linkTypeOptions}
          rules={[rules.select(t('pages.knowledge.doc.link.type'))]}
        />
        <ProFormText
          name="targetId"
          label={t('pages.knowledge.doc.link.id')}
          rules={[
            rules.required(t('pages.knowledge.doc.link.id')),
            rules.maxChars(128),
          ]}
        />
        <ProFormText
          name="targetName"
          label={t('pages.knowledge.doc.link.name')}
          rules={[rules.maxChars(255)]}
        />
      </ModalForm>

      <ModalForm<{ note?: string }>
        title={
          reviewOpen === 'approve'
            ? t('pages.knowledge.doc.approve')
            : t('pages.knowledge.doc.reject')
        }
        width={480}
        open={!!reviewOpen}
        onOpenChange={(open) => !open && setReviewOpen(null)}
        modalProps={{ destroyOnHidden: true }}
        submitter={{
          submitButtonProps:
            reviewOpen === 'reject' ? { danger: true } : undefined,
        }}
        onFinish={async (values) => {
          await reviewDocument(id, reviewOpen === 'approve', values.note);
          message.success(t('pages.knowledge.doc.reviewDone'));
          await load();
          return true;
        }}
      >
        <ProFormTextArea
          name="note"
          label={t('pages.knowledge.doc.reviewNote')}
          fieldProps={{ rows: 3, maxLength: 255, showCount: true }}
          rules={
            reviewOpen === 'reject'
              ? [rules.required(t('pages.knowledge.doc.reviewNote'))]
              : undefined
          }
        />
      </ModalForm>

      <Drawer
        title={t('pages.knowledge.doc.versions')}
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        size={560}
        destroyOnHidden
      >
        {versions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.knowledge.doc.noVersions')}
          />
        ) : (
          <div>
            {versions.map((v) => (
              <div key={v.version} className={styles.listRow}>
                <div>
                  <Space>
                    <Tag color={v.version === doc.version ? 'blue' : undefined}>
                      v{v.version}
                    </Tag>
                    <span>{v.title}</span>
                  </Space>
                  <div className={styles.listMeta}>
                    {`${v.publishUserName ?? v.publishUser ?? ''} · ${formatTime(v.createTime)}${v.note ? ` · ${v.note}` : ''}`}
                  </div>
                </div>
                <Space>
                  <a
                    onClick={async () => {
                      const res = await getVersion(id, v.version);
                      setViewing(res.version);
                    }}
                  >
                    {t('common.action.view')}
                  </a>
                  {canWrite &&
                    doc.status !== 3 &&
                    v.version !== doc.version && (
                      <ConfirmLink
                        title={t('pages.knowledge.doc.rollbackTitle', {
                          version: v.version,
                        })}
                        description={t('pages.knowledge.doc.rollbackDesc')}
                        onConfirm={async () => {
                          await rollbackDocument(id, v.version);
                          message.success(
                            t('pages.knowledge.doc.rollbackSuccess'),
                          );
                          setVersionsOpen(false);
                          await load();
                        }}
                      >
                        {t('pages.knowledge.doc.rollback')}
                      </ConfirmLink>
                    )}
                </Space>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      <Modal
        title={viewing ? `v${viewing.version} · ${viewing.title}` : ''}
        open={!!viewing}
        onCancel={() => setViewing(undefined)}
        footer={null}
        width={860}
        destroyOnHidden
      >
        {viewing && (
          <div
            className={styles.markdown}
            style={{ maxHeight: '70vh', overflow: 'auto' }}
          >
            <XMarkdown>{viewing.content ?? ''}</XMarkdown>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default DocumentDetail;
