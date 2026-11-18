/**
 * 工单附件：附件字段的上传控件（AttachmentUpload，表单受控，值为文件 ID 列表）与
 * 详情里的下载列表（AttachmentList）。文件先上传为临时文件，提单 / 保存表单时由后端绑定到工单。
 */
import { PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { App, Button, Flex, Typography, Upload, type UploadFile } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  downloadFile,
  FILE_MAX_SIZE,
  type FileMeta,
  uploadFile,
} from '@/services/file';
import type { TicketFile } from '@/services/ticket/typings';
import { saveBlob } from '@/utils/download';
import { formatBytes } from '@/utils/format';
import { useT } from '@/utils/i18n';

/** 一个附件字段的文件数上限（与后端校验一致）：允许多个文件时 */
export const ATTACHMENT_MAX = 10;

/** 携带登录态取回文件内容后保存；失败提示由请求层统一弹出 */
const download = async (id: string, filename: string) => {
  try {
    saveBlob(await downloadFile(id), filename);
  } catch {
    // 已提示
  }
};

type Item = UploadFile<Pick<FileMeta, 'id'>>;

export interface AttachmentUploadProps {
  /** 已上传完成的文件 ID（由表单注入；列表以组件内部状态为准，随表单一起重建） */
  value?: string[];
  onChange?: (value: string[]) => void;
  /** 是否有文件仍在上传（提交前须等待）；控件卸载时回报 false */
  onUploadingChange?: (uploading: boolean) => void;
  /** 最多几个文件；1 = 单个文件（再选一个即替换） */
  max?: number;
  /** 初始取值里各文件的名称（修改已有工单时）：没有名称的显示文件 ID */
  knownFiles?: readonly TicketFile[];
  disabled?: boolean;
  /** 只看样子：选了文件不上传、不产生取值（模板的表单预览） */
  dryRun?: boolean;
}

/** 上传控件：逐个上传，超过大小 / 数量上限的文件不进入列表 */
export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  value,
  onChange,
  onUploadingChange,
  max = 1,
  knownFiles,
  disabled,
  dryRun,
}) => {
  const t = useT();
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<Item[]>(() =>
    (value ?? []).map((id) => ({
      uid: id,
      name: knownFiles?.find((f) => f.id === id)?.filename ?? id,
      status: 'done',
      response: { id },
    })),
  );
  // 卸载时（如显示条件不再满足）不能把「上传中」留给表单：否则提交按钮一直不可用
  const report = useRef(onUploadingChange);
  report.current = onUploadingChange;
  useEffect(() => () => report.current?.(false), []);

  return (
    <Upload<Pick<FileMeta, 'id'>>
      multiple={max > 1}
      maxCount={max}
      disabled={disabled}
      fileList={fileList}
      beforeUpload={(file, batch) => {
        // 超出数量上限的文件不上传（否则会留下用不上的临时文件）；单个文件时再选即替换
        if (max > 1 && fileList.length + batch.indexOf(file) >= max) {
          if (batch.indexOf(file) === Math.max(0, max - fileList.length)) {
            message.warning(t('pages.ticket.attachment.tooMany', { max }));
          }
          return Upload.LIST_IGNORE;
        }
        if (file.size > FILE_MAX_SIZE) {
          message.error(
            t('pages.ticket.attachment.tooLarge', { name: file.name }),
          );
          return Upload.LIST_IGNORE;
        }
        return !dryRun;
      }}
      customRequest={({ file, onSuccess, onError }) => {
        uploadFile(file as File).then(
          (result) => onSuccess?.({ id: result.file.id }),
          // 失败提示由请求层统一弹出，这里只把条目标成失败
          (error: Error) => onError?.(error),
        );
      }}
      onChange={({ fileList: next }) => {
        setFileList(next);
        if (dryRun) return;
        onUploadingChange?.(next.some((f) => f.status === 'uploading'));
        onChange?.(
          next.flatMap((f) =>
            f.status === 'done' && f.response ? [f.response.id] : [],
          ),
        );
      }}
      // 点文件名即下载（已上传完成的）
      onPreview={(file) => {
        if (file.status === 'done' && file.response) {
          download(file.response.id, file.name);
        }
      }}
    >
      <Button icon={<UploadOutlined />} disabled={disabled}>
        {t('pages.ticket.attachment.upload')}
      </Button>
    </Upload>
  );
};

/**
 * 一张表单里各附件字段的上传状态：有任一字段仍在上传时 uploading 为真（提交前须等待）。
 * onChange 交给各字段的上传控件回报；reset 在换一张表单 / 重新进入编辑时清零。
 * 两个回调都是稳定引用。
 */
export const useUploadingFields = () => {
  const [uploading, setUploading] = useState(false);
  const fields = useRef(new Set<string>());
  const onChange = useCallback((code: string, busy: boolean) => {
    if (busy) fields.current.add(code);
    else fields.current.delete(code);
    setUploading(fields.current.size > 0);
  }, []);
  const reset = useCallback(() => {
    fields.current.clear();
    setUploading(false);
  }, []);
  return { uploading, onChange, reset };
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
              await download(file.id, file.filename);
              setDownloading(undefined);
            }}
          >
            {file.filename}
          </Typography.Link>
          <Typography.Text type="secondary">
            {formatBytes(file.size)}
          </Typography.Text>
        </Flex>
      ))}
    </Flex>
  );
};
