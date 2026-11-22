/**
 * 文档导入弹窗：选空间（可锁定）+ 上传 md / txt / html / pdf / docx，后台解析成文档。
 * 「文档导入」页（空间可选）与空间文档页（锁定当前空间）共用。
 */
import { UploadOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { App, Button, Form, Space } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { FILE_MAX_SIZE, uploadFile } from '@/services/file';
import { createIngestJob } from '@/services/knowledge/ingest';
import { useFormRules, useT } from '@/utils/i18n';
import { DOC_TAGS_MAX } from './meta';
import { SpaceSelect } from './selectors';
import { useKnowledgeStyles } from './styles';

const ACCEPT = '.md,.markdown,.txt,.log,.html,.htm,.pdf,.docx';

interface IngestFormValues {
  /** 空间选择的必填校验由 Form rules 保证；锁定空间时不渲染该字段 */
  spaceId: string;
  title?: string;
  tags?: string[];
  publish?: boolean;
}

export const IngestModal: React.FC<{
  open: boolean;
  /** 打开时预选的空间（文档导入页带 ?spaceId= 进入） */
  defaultSpaceId?: string;
  /** 锁定空间（空间文档页）：不显示空间选择，直接导入到该空间 */
  lockSpaceId?: string;
  onClose: () => void;
  /** 创建成功后调用（刷新列表） */
  onDone: () => void;
}> = ({ open, defaultSpaceId, lockSpaceId, onClose, onDone }) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  const { styles } = useKnowledgeStyles();
  const [file, setFile] = useState<File>();
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <ModalForm<IngestFormValues>
      title={t('pages.knowledge.ingest.create')}
      width={520}
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setFile(undefined);
          onClose();
        }
      }}
      modalProps={{ destroyOnHidden: true }}
      initialValues={{
        spaceId: lockSpaceId ?? defaultSpaceId,
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
          spaceId: lockSpaceId ?? values.spaceId,
          fileId: uploaded.file.id,
          title: values.title?.trim() || undefined,
          tags: values.tags,
          publish: values.publish,
        });
        message.success(t('pages.knowledge.ingest.created'));
        onDone();
        return true;
      }}
    >
      {!lockSpaceId && (
        <Form.Item
          name="spaceId"
          label={t('pages.knowledge.doc.column.space')}
          rules={[rules.select(t('pages.knowledge.doc.column.space'))]}
        >
          <SpaceSelect minLevel={2} allowClear={false} />
        </Form.Item>
      )}
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
  );
};
