/**
 * 分发文件的上传项（受控，值为已上传文件的 ID / 文件名 / 大小）：沿用通用附件上传接口，只收一个文件，
 * 至多 4MB。上传中或失败时值为空（表单的必填校验据此拦住提交）。
 */
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { App, Button, Upload } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { type FileMeta, uploadFile } from '@/services/file';
import { formatBytes } from '@/utils/format';
import { useT } from '@/utils/i18n';
import { JOB_LIMITS } from '../components/meta';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
}

export const FileField: React.FC<{
  value?: UploadedFile;
  onChange?: (value?: UploadedFile) => void;
}> = ({ value, onChange }) => {
  const t = useT();
  const { message } = App.useApp();
  // 初始列表从表单值还原：组件被重建（如切换模式又切回）时仍能显示已上传的文件
  const [fileList, setFileList] = useState<UploadFile<Pick<FileMeta, 'id'>>[]>(
    () =>
      value
        ? [
            {
              uid: value.id,
              name: value.name,
              size: value.size,
              status: 'done',
              response: { id: value.id },
            },
          ]
        : [],
  );
  return (
    <Upload<Pick<FileMeta, 'id'>>
      maxCount={1}
      fileList={fileList}
      beforeUpload={(file) => {
        if (file.size > JOB_LIMITS.adhocFileMaxBytes) {
          message.error(
            t('pages.job.adhoc.file.tooLarge', {
              max: formatBytes(JOB_LIMITS.adhocFileMaxBytes),
            }),
          );
          return Upload.LIST_IGNORE;
        }
        return true;
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
        const done = next.find((f) => f.status === 'done' && f.response);
        onChange?.(
          done?.response
            ? { id: done.response.id, name: done.name, size: done.size ?? 0 }
            : undefined,
        );
      }}
    >
      <Button icon={<UploadOutlined />}>
        {t('pages.job.adhoc.file.upload')}
      </Button>
    </Upload>
  );
};
