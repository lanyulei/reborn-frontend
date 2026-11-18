/**
 * 容器文件传输：下载容器内的文件或目录（目录打包为 tar），或把本地文件上传到容器的某个目录。
 * 经容器内的 tar 实现，所以容器镜像里需要有 tar；能否访问由集群按当前用户判定。
 */
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Alert, App, Button, Form, Input, Modal, Select, Upload } from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import SectionTitle from '@/components/SectionTitle';
import { downloadPodFile, uploadPodFile } from '@/services/k8s/governance';
import { getK8sErrorMessage, isChangeSubmitted } from '@/services/k8s/request';
import { getObject } from '@/services/k8s/resource';
import { saveBlob } from '@/utils/download';
import { formatBytes } from '@/utils/format';
import { useT } from '@/utils/i18n';
import { useDangerConfirm } from './confirm';
import { GVRS } from './meta';

/** 与后端缺省上限一致（plane.max_file_mb）；后端配置更小时以后端的报错为准 */
const MAX_BYTES = 100 * 1024 * 1024;

const cleanPath = (value: string): boolean =>
  value.startsWith('/') &&
  !value.split('/').some((seg) => seg === '.' || seg === '..') &&
  !value.includes('//') &&
  (value === '/' || !value.endsWith('/'));

export const FileTransferModal: React.FC<{
  clusterId: string;
  namespace: string;
  pod: string;
  containers: string[];
  onClose: () => void;
}> = ({ clusterId, namespace, pod, containers, onClose }) => {
  const t = useT();
  const { message } = App.useApp();
  const [container, setContainer] = useState(containers[0]);
  const [downloadPath, setDownloadPath] = useState('');
  const [uploadDir, setUploadDir] = useState('/tmp');
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState<'download' | 'upload'>();
  const confirm = useDangerConfirm();
  const target = { namespace, pod, container };

  const pathError = (value: string, allowRoot: boolean): string | undefined => {
    if (!value) return undefined;
    if (!cleanPath(value) || (!allowRoot && value === '/')) {
      return t('pages.k8s.file.path.invalid');
    }
    return undefined;
  };

  // 关闭弹窗时中止进行中的传输
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const download = async () => {
    setBusy('download');
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const { blob, filename } = await downloadPodFile(
        clusterId,
        target,
        downloadPath,
        controller.signal,
      );
      saveBlob(blob, filename);
      message.success(
        t('pages.k8s.file.downloaded', { size: formatBytes(blob.size) }),
      );
    } catch (error) {
      if (abortRef.current?.signal.aborted) return;
      message.error(getK8sErrorMessage(error));
    } finally {
      setBusy(undefined);
    }
  };

  const doUpload = async () => {
    if (!file) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy('upload');
    try {
      await uploadPodFile(
        clusterId,
        target,
        uploadDir,
        file,
        controller.signal,
      );
      message.success(
        t('pages.k8s.file.uploaded', { path: `${uploadDir}/${file.name}` }),
      );
      setFile(undefined);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (isChangeSubmitted(error)) {
        onClose();
        return;
      }
      message.error(getK8sErrorMessage(error));
    } finally {
      setBusy(undefined);
    }
  };

  /** 上传会覆盖容器里的同名文件：先确认（生产集群需输入 namespace/pod） */
  const upload = () => {
    if (!file) return;
    confirm({
      title: t('pages.k8s.file.upload.confirm.title'),
      content: t('pages.k8s.file.upload.confirm.content', {
        container: container || '-',
        path: `${uploadDir.replace(/\/$/, '')}/${file.name}`,
      }),
      name: pod,
      namespace,
      onOk: doUpload,
    });
  };

  const downloadError = pathError(downloadPath, false);
  const uploadError = pathError(uploadDir, true);
  const tooLarge = Boolean(file && file.size > MAX_BYTES);

  return (
    <Modal
      open
      width={560}
      title={t('pages.k8s.file.title', { pod })}
      footer={null}
      onCancel={onClose}
      mask={{ closable: !busy }}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title={t('pages.k8s.file.hint')}
      />
      <Form layout="vertical">
        {containers.length > 1 && (
          <Form.Item label={t('pages.k8s.column.container')}>
            <Select
              value={container}
              options={containers.map((c) => ({ value: c, label: c }))}
              onChange={setContainer}
            />
          </Form.Item>
        )}
        <SectionTitle>{t('pages.k8s.file.download')}</SectionTitle>
        <Form.Item
          label={t('pages.k8s.file.download.path')}
          validateStatus={downloadError ? 'error' : undefined}
          help={downloadError ?? t('pages.k8s.file.download.help')}
        >
          <Input
            value={downloadPath}
            placeholder="/var/log/app.log"
            maxLength={4096}
            onChange={(e) => setDownloadPath(e.target.value.trim())}
          />
        </Form.Item>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          loading={busy === 'download'}
          disabled={
            !downloadPath || Boolean(downloadError) || busy === 'upload'
          }
          onClick={download}
        >
          {t('pages.k8s.file.download')}
        </Button>

        <SectionTitle>{t('pages.k8s.file.upload')}</SectionTitle>
        <Form.Item
          label={t('pages.k8s.file.upload.dir')}
          validateStatus={uploadError ? 'error' : undefined}
          help={uploadError}
        >
          <Input
            value={uploadDir}
            placeholder="/tmp"
            maxLength={4096}
            onChange={(e) => setUploadDir(e.target.value.trim())}
          />
        </Form.Item>
        <Form.Item
          validateStatus={tooLarge ? 'error' : undefined}
          help={tooLarge ? t('pages.k8s.file.tooLarge') : undefined}
        >
          <Upload
            maxCount={1}
            showUploadList={false}
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>
              {t('pages.k8s.file.upload.choose')}
            </Button>
            {file && (
              <span style={{ marginInlineStart: 8 }}>
                {file.name}（{formatBytes(file.size)}）
              </span>
            )}
          </Upload>
        </Form.Item>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          loading={busy === 'upload'}
          disabled={
            !file ||
            !uploadDir ||
            Boolean(uploadError) ||
            tooLarge ||
            busy === 'download'
          }
          onClick={upload}
        >
          {t('pages.k8s.file.upload')}
        </Button>
      </Form>
    </Modal>
  );
};

/** 按 Pod 打开文件传输：先读 Pod 取容器清单 */
export const PodFileModal: React.FC<{
  clusterId: string;
  namespace: string;
  pod: string;
  onClose: () => void;
}> = ({ clusterId, namespace, pod, onClose }) => {
  const [containers, setContainers] = useState<string[]>();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    let cancelled = false;
    getObject(clusterId, { ...GVRS.pod, namespace, name: pod })
      .then((res) => {
        if (cancelled) return;
        const spec = (res.object?.spec ?? {}) as {
          containers?: { name: string }[];
        };
        setContainers((spec.containers ?? []).map((c) => c.name));
      })
      .catch(() => {
        if (!cancelled) onCloseRef.current();
      });
    return () => {
      cancelled = true;
    };
  }, [clusterId, namespace, pod]);
  if (!containers) return null;
  return (
    <FileTransferModal
      clusterId={clusterId}
      namespace={namespace}
      pod={pod}
      containers={containers}
      onClose={onClose}
    />
  );
};

export default FileTransferModal;
