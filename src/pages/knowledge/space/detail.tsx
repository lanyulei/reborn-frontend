/**
 * 空间内文档列表：按状态 / 关键字 / 标签 / 负责人筛选，快捷切换「待审核」「超期复审」；新建文档 / 导入。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, Link, useParams } from '@umijs/max';
import {
  Button,
  Card,
  Flex,
  Segmented,
  Space,
  Tag,
  Typography,
  theme,
} from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { CreateButton } from '@/components/TableActions';
import { listDocuments } from '@/services/knowledge/document';
import { getSpace } from '@/services/knowledge/space';
import type {
  KnowledgeDocStatus,
  KnowledgeDocument,
  KnowledgeSpace,
} from '@/services/knowledge/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useEnumText, useT, useValueEnum } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { IngestModal } from '../components/IngestModal';
import {
  DOC_STATUS_META,
  docPath,
  INDEX_STATUS_META,
  LEVEL_META,
  SPACE_TYPE_META,
  VISIBILITY_META,
} from '../components/meta';
import { useKnowledgeStyles } from '../components/styles';

type QuickFilter = 'all' | 'pending' | 'overdue';

const SpaceDocuments: React.FC = () => {
  const t = useT();
  const { id = '' } = useParams<{ id: string }>();
  const has = usePermissions();
  const { styles } = useKnowledgeStyles();
  const { token } = theme.useToken();
  const actionRef = useRef<ActionType>(null);
  const [space, setSpace] = useState<KnowledgeSpace>();
  const [quick, setQuick] = useState<QuickFilter>('all');
  const [ingestOpen, setIngestOpen] = useState(false);
  const statusEnum = useValueEnum(DOC_STATUS_META);
  const indexText = useEnumText(INDEX_STATUS_META);
  const typeText = useEnumText(SPACE_TYPE_META);
  const visibilityText = useEnumText(VISIBILITY_META);
  const levelText = useEnumText(LEVEL_META);

  useEffect(() => {
    if (!id) return;
    getSpace(id)
      .then((res) => setSpace(res.space))
      .catch(() => setSpace(undefined));
  }, [id]);

  useEffect(() => {
    actionRef.current?.reload();
  }, [quick]);

  const canWrite = has('knowledge.write') && (space?.level ?? 0) >= 2;

  const columns: ProColumns<KnowledgeDocument>[] = [
    {
      title: t('pages.knowledge.doc.column.title'),
      dataIndex: 'keyword',
      ellipsis: true,
      fieldProps: { placeholder: t('pages.knowledge.doc.searchPlaceholder') },
      render: (_, row) => (
        <Space size={6} wrap>
          <Link to={docPath(row.id)}>{row.title}</Link>
          {row.hasDraft && <Tag>{t('pages.knowledge.doc.hasDraft')}</Tag>}
          {row.reviewState === 1 && (
            <Tag color="processing">
              {t('pages.knowledge.doc.reviewPending')}
            </Tag>
          )}
          {row.reviewOverdue && (
            <Tag color="warning">{t('pages.knowledge.doc.reviewOverdue')}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: statusEnum,
      width: 100,
    },
    {
      title: t('pages.knowledge.doc.column.tags'),
      dataIndex: 'tag',
      width: 200,
      render: (_, row) =>
        row.tags?.length ? (
          <Space size={4} wrap>
            {row.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.knowledge.doc.column.owner'),
      dataIndex: 'ownerName',
      search: false,
      width: 120,
      ellipsis: true,
    },
    {
      title: t('pages.knowledge.doc.column.version'),
      dataIndex: 'version',
      search: false,
      width: 80,
      render: (_, row) => (row.version ? `v${row.version}` : t('common.empty')),
    },
    {
      title: t('pages.knowledge.doc.column.indexStatus'),
      dataIndex: 'indexStatus',
      search: false,
      width: 90,
      render: (_, row) => indexText(row.indexStatus ?? 0),
    },
    {
      title: t('pages.knowledge.doc.column.reviewAt'),
      dataIndex: 'reviewAt',
      search: false,
      width: 160,
      render: (_, row) =>
        row.reviewAt ? formatTime(row.reviewAt) : t('common.empty'),
    },
    {
      title: t('common.column.updateTime'),
      dataIndex: 'updateTime',
      search: false,
      width: 160,
      render: (_, row) => formatTime(row.updateTime),
    },
  ];

  return (
    <PageContainer title={false}>
      <Card variant="outlined" style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="flex-start" gap={16} wrap>
          <div style={{ minWidth: 0 }}>
            <Typography.Title level={4} className={styles.headTitle}>
              {space?.name ?? t('menu.knowledge.space-detail')}
            </Typography.Title>
            {space?.description && (
              <Typography.Paragraph
                type="secondary"
                style={{ margin: '8px 0 0' }}
              >
                {space.description}
              </Typography.Paragraph>
            )}
          </div>
          {space && (
            <Space size={4} wrap style={{ flex: 'none' }}>
              <Tag>{typeText(space.type)}</Tag>
              <Tag>{visibilityText(space.visibility ?? 1)}</Tag>
              <Tag color="blue">{levelText(space.level ?? 0)}</Tag>
              {space.reviewRequired && (
                <Tag color="processing">
                  {t('pages.knowledge.space.reviewRequired')}
                </Tag>
              )}
            </Space>
          )}
        </Flex>
        {space && (
          <div className={styles.hint} style={{ marginTop: 12 }}>
            <Space size={16} wrap>
              <span>
                {t('pages.knowledge.space.column.owner')}：
                {space.ownerName ?? t('common.empty')}
              </span>
              <span>
                {t('pages.knowledge.space.column.documentCount')}：
                {space.documentCount ?? 0}
              </span>
              <span className={styles.hint}>{space.code}</span>
            </Space>
          </div>
        )}
      </Card>
      <ProTable<KnowledgeDocument>
        cardBordered
        headerTitle={
          /* 工具栏标题容器自带 500 字重 / 16px：恢复默认字体，控件不加粗不加黑 */
          <Space style={{ fontSize: token.fontSize, fontWeight: 400 }}>
            {canWrite && (
              <CreateButton
                onClick={() => history.push(`/knowledge/doc/new?spaceId=${id}`)}
              >
                {t('pages.knowledge.doc.create')}
              </CreateButton>
            )}
            {canWrite && (
              <Button onClick={() => setIngestOpen(true)}>
                {t('pages.knowledge.ingest.create')}
              </Button>
            )}
            <Segmented<QuickFilter>
              value={quick}
              onChange={setQuick}
              options={[
                { value: 'all', label: t('pages.knowledge.doc.filter.all') },
                {
                  value: 'pending',
                  label: t('pages.knowledge.doc.filter.pending'),
                },
                {
                  value: 'overdue',
                  label: t('pages.knowledge.doc.filter.overdue'),
                },
              ]}
            />
          </Space>
        }
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        columnEmptyText={t('common.empty')}
        search={{ labelWidth: 'auto' }}
        scroll={{ x: 'max-content' }}
        request={async (params) =>
          toTableResult(
            await listDocuments({
              page: params.current,
              pageSize: params.pageSize,
              spaceId: id,
              status: params.status as KnowledgeDocStatus | undefined,
              keyword: params.keyword?.trim() || undefined,
              tag: params.tag?.trim() || undefined,
              reviewPending: quick === 'pending' || undefined,
              reviewOverdue: quick === 'overdue' || undefined,
            }),
          )
        }
      />

      {/* 批量导入：本页直接上传（空间锁定为当前空间），无需跳转文档导入页 */}
      <IngestModal
        open={ingestOpen}
        lockSpaceId={id}
        onClose={() => setIngestOpen(false)}
        onDone={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};

export default SpaceDocuments;
