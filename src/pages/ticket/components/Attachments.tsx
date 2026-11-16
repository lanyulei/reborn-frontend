/**
 * 工单附件：提单时的上传控件（AttachmentUpload，表单受控，值为文件 ID 列表）与
 * 详情里的下载列表（AttachmentList）。文件先上传为临时文件，提单时由后端绑定到工单。
 */
import { PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { App, Button, Flex, Typography, Upload, type UploadFile } from 'antd';
import type React from 'react';
import { useState } from 'react';
import {
  downloadFile,
  FILE_MAX_SIZE,
  type FileMeta,
  uploadFile,
} from '@/services/file';
import type { TicketFile } from '@/services/ticket/typings';
import { useT } from '@/utils/i18n';

/** 单张工单的附件数上限（与后端 proto 校验一致） */
export const ATTACHMENT_MAX = 20;

/** 字节数 → 可读大小 */
const formatSize = (size?: string): string => {
  const n = Number(size ?? 0);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export interface AttachmentUploadProps {
  /** 已上传完成的文件 ID（由表单注入；列表以组件内部状态为准，随表单一起重建） */
  value?: string[];
  onChange?: (value: string[]) => void;
  /** 是否有文件仍在上传（提交前须等待） */
  onUploadingChange?: (uploading: boolean) => void;
}

/** 上传控件：逐个上传，超过大小 / 数量上限的文件不进入列表 */
export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  onChange,
  onUploadingChange,
}) => {
  const t = useT();
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile<FileMeta>[]>([]);

  return (
    <Upload<FileMeta>
      multiple
      maxCount={ATTACHMENT_MAX}
      fileList={fileList}
      beforeUpload={(file, batch) => {
        // 超出数量上限的文件不上传（否则会留下用不上的临时文件）
        if (fileList.length + batch.indexOf(file) >= ATTACHMENT_MAX) {
          if (
            batch.indexOf(file) ===
            Math.max(0, ATTACHMENT_MAX - fileList.length)
          ) {
            message.warning(
              t('pages.ticket.attachment.tooMany', { max: ATTACHMENT_MAX }),
            );
          }
          return Upload.LIST_IGNORE;
        }
        if (file.size > FILE_MAX_SIZE) {
          message.error(
            t('pages.ticket.attachment.tooLarge', { name: file.name }),
          );
          return Upload.LIST_IGNORE;
        }
        return true;
      }}
      customRequest={({ file, onSuccess, onError }) => {
        uploadFile(file as File).then(
          (result) => onSuccess?.(result.file),
          // 失败提示由请求层统一弹出，这里只把条目标成失败
          (error: Error) => onError?.(error),
        );
      }}
      onChange={({ fileList: next }) => {
        setFileList(next);
        onUploadingChange?.(next.some((f) => f.status === 'uploading'));
        onChange?.(
          next.flatMap((f) =>
            f.status === 'done' && f.response ? [f.response.id] : [],
          ),
        );
      }}
    >
      <Button icon={<UploadOutlined />}>
        {t('pages.ticket.attachment.upload')}
      </Button>
    </Upload>
  );
};

/** 触发浏览器保存 */
const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // 稍后再释放：个别浏览器在点击后立即释放会中断下载
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

/** 下载列表：携带登录态取回内容后保存 */
export const AttachmentList: React.FC<{ files: readonly TicketFile[] }> = ({
  files,
}) => {
  const [downloading, setDownloading] = useState<string>();
  return (
    <Flex vertical gap={4}>
      {files.map((file) => (
        <Flex key={file.id} gap={8} align="center">
          <PaperClipOutlined />
          <Typography.Link
            disabled={downloading === file.id}
            onClick={async () => {
              setDownloading(file.id);
              try {
                saveBlob(await downloadFile(file.id), file.filename);
              } catch {
                // 失败提示由请求层统一弹出
              } finally {
                setDownloading(undefined);
              }
            }}
          >
            {file.filename}
          </Typography.Link>
          <Typography.Text type="secondary">
            {formatSize(file.size)}
          </Typography.Text>
        </Flex>
      ))}
    </Flex>
  );
};
