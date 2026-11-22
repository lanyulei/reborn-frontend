/**
 * 文档导入：上传 md / txt / html / pdf / docx 到目标空间，后台解析成文档；任务列表可重试失败任务。
 * 上传弹窗与空间文档页共用（components/IngestModal）。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Link, useSearchParams } from '@umijs/max';
import { App, Tag, Typography } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { ConfirmLink, CreateButton } from '@/components/TableActions';
import { listIngestJobs, retryIngestJob } from '@/services/knowledge/ingest';
import type {
  KnowledgeIngestJob,
  KnowledgeJobStatus,
} from '@/services/knowledge/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useT, useValueEnum } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { IngestModal } from '../components/IngestModal';
import { docPath, JOB_STATUS_META } from '../components/meta';
import { useSpaces } from '../components/selectors';
import { useKnowledgeStyles } from '../components/styles';

const IngestPage: React.FC = () => {
  const t = useT();
  const { message } = App.useApp();
  const has = usePermissions();
  const { styles } = useKnowledgeStyles();
  const [params] = useSearchParams();
  const actionRef = useRef<ActionType>(null);
  const [open, setOpen] = useState(false);
  const statusEnum = useValueEnum(JOB_STATUS_META);
  const { spaces } = useSpaces(1);
  const spaceName = (id: string) => spaces.find((s) => s.id === id)?.name ?? id;

  const columns: ProColumns<KnowledgeIngestJob>[] = [
    {
      title: t('pages.knowledge.ingest.column.filename'),
      dataIndex: 'filename',
      search: false,
      ellipsis: true,
      render: (_, row) => (
        <div>
          <div>{row.filename}</div>
          {row.documentId && (
            <Link to={docPath(row.documentId)} className={styles.hint}>
              {t('pages.knowledge.ingest.openDocument')}
            </Link>
          )}
        </div>
      ),
    },
    {
      title: t('pages.knowledge.doc.column.space'),
      dataIndex: 'spaceId',
      valueType: 'select',
      width: 160,
      ellipsis: true,
      fieldProps: {
        showSearch: { optionFilterProp: 'label' },
        options: spaces.map((s) => ({ value: s.id, label: s.name })),
      },
      render: (_, row) => row.spaceName ?? spaceName(row.spaceId),
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: statusEnum,
      width: 100,
    },
    {
      title: t('pages.knowledge.ingest.column.result'),
      search: false,
      width: 240,
      render: (_, row) =>
        row.status === 4 ? (
          <Typography.Text
            type="danger"
            ellipsis={{ tooltip: row.error }}
            style={{ maxWidth: 220 }}
          >
            {row.error}
          </Typography.Text>
        ) : row.status === 3 ? (
          <Tag color="success">
            {t('pages.knowledge.ingest.chunks', { count: row.chunkCount ?? 0 })}
          </Tag>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.knowledge.ingest.column.attempts'),
      dataIndex: 'attempts',
      search: false,
      width: 80,
      render: (_, row) => row.attempts ?? 0,
    },
    {
      title: t('common.column.createTime'),
      dataIndex: 'createTime',
      search: false,
      width: 160,
      render: (_, row) => formatTime(row.createTime),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 80,
      hideInTable: !has('knowledge.write'),
      render: (_, row) =>
        row.status === 4 ? (
          <ConfirmLink
            title={t('pages.knowledge.ingest.retryTitle')}
            onConfirm={async () => {
              await retryIngestJob(row.id);
              message.success(t('pages.knowledge.ingest.retryQueued'));
              actionRef.current?.reload();
            }}
          >
            {t('pages.knowledge.ingest.retry')}
          </ConfirmLink>
        ) : null,
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<KnowledgeIngestJob>
        cardBordered
        headerTitle={
          has('knowledge.write') && (
            <CreateButton onClick={() => setOpen(true)}>
              {t('pages.knowledge.ingest.create')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        columnEmptyText={t('common.empty')}
        search={{ labelWidth: 'auto' }}
        form={{
          initialValues: { spaceId: params.get('spaceId') ?? undefined },
        }}
        scroll={{ x: 'max-content' }}
        polling={5000}
        request={async (p) =>
          toTableResult(
            await listIngestJobs({
              page: p.current,
              pageSize: p.pageSize,
              spaceId: (p.spaceId as string | undefined) || undefined,
              status: p.status as KnowledgeJobStatus | undefined,
            }),
          )
        }
      />

      <IngestModal
        open={open}
        defaultSpaceId={params.get('spaceId') ?? undefined}
        onClose={() => setOpen(false)}
        onDone={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};

export default IngestPage;
