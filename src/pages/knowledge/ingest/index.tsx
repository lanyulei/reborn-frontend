/**
 * 文档导入：上传 md / txt / html / pdf / docx 到目标空间，后台解析成文档；任务列表可重试失败任务。
 */
import { UploadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Link, useSearchParams } from '@umijs/max';
import { App, Button, Form, Space, Tag, Typography } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { ConfirmLink, CreateButton } from '@/components/TableActions';
import { FILE_MAX_SIZE, uploadFile } from '@/services/file';
import {
  createIngestJob,
  listIngestJobs,
  retryIngestJob,
} from '@/services/knowledge/ingest';
import type {
  KnowledgeIngestJob,
  KnowledgeJobStatus,
} from '@/services/knowledge/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useFormRules, useT, useValueEnum } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { DOC_TAGS_MAX, docPath, JOB_STATUS_META } from '../components/meta';
import { SpaceSelect, useSpaces } from '../components/selectors';
import { useKnowledgeStyles } from '../components/styles';

const ACCEPT = '.md,.markdown,.txt,.log,.html,.htm,.pdf,.docx';

interface IngestFormValues {
  spaceId: string;
  title?: string;
  tags?: string[];
  publish?: boolean;
}

const IngestPage: React.FC = () => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  const has = usePermissions();
  const { styles } = useKnowledgeStyles();
  const [params] = useSearchParams();
  const actionRef = useRef<ActionType>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File>();
  const fileInput = useRef<HTMLInputElement>(null);
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

      <ModalForm<IngestFormValues>
        title={t('pages.knowledge.ingest.create')}
        width={520}
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setFile(undefined);
        }}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{
          spaceId: params.get('spaceId') ?? undefined,
          publish: false,
        }}
        onFinish={async (values) => {
          if (!file) {
            message.error(t('pages.knowledge.ingest.fileRequired'));
            return false;
          }
          if (file.size > FILE_MAX_SIZE) {
            message.error(t('pages.knowledge.ingest.fileTooLarge'));
            return false;
          }
          const uploaded = await uploadFile(file);
          await createIngestJob({
            spaceId: values.spaceId,
            fileId: uploaded.file.id,
            title: values.title?.trim() || undefined,
            tags: values.tags,
            publish: values.publish,
          });
          message.success(t('pages.knowledge.ingest.created'));
          actionRef.current?.reload();
          return true;
        }}
      >
        <Form.Item
          name="spaceId"
          label={t('pages.knowledge.doc.column.space')}
          rules={[rules.select(t('pages.knowledge.doc.column.space'))]}
        >
          <SpaceSelect minLevel={2} allowClear={false} />
        </Form.Item>
        <Form.Item
          label={t('pages.knowledge.ingest.file')}
          required
          extra={t('pages.knowledge.ingest.fileHint')}
        >
          <Space>
            <Button
              icon={<UploadOutlined />}
              onClick={() => fileInput.current?.click()}
            >
              {t('pages.knowledge.ingest.chooseFile')}
            </Button>
            <span className={file ? undefined : styles.hint}>
              {file?.name ?? t('common.empty')}
            </span>
          </Space>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              const picked = e.target.files?.[0];
              setFile(picked);
              e.target.value = '';
            }}
          />
        </Form.Item>
        <ProFormText
          name="title"
          label={t('pages.knowledge.doc.column.title')}
          tooltip={t('pages.knowledge.ingest.titleTip')}
          rules={[rules.maxChars(255)]}
        />
        <ProFormSelect
          name="tags"
          label={t('pages.knowledge.doc.column.tags')}
          fieldProps={{
            mode: 'tags',
            open: false,
            maxCount: DOC_TAGS_MAX,
            tokenSeparators: [',', ' '],
          }}
        />
        <ProFormSwitch
          name="publish"
          label={t('pages.knowledge.ingest.publish')}
          tooltip={t('pages.knowledge.ingest.publishTip')}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default IngestPage;
