/**
 * 变更预检与提交（所有 YAML 改动的统一路径）：
 * - EditObjectModal：编辑单个对象 → 预检（服务端 dry-run）→ 对比「当前 → 变更后」→ 确认后提交；
 *   提交带预检时读到的资源版本，对象已被他人修改（409）时提示并可重新加载。
 * - ManifestModal：多文档 YAML 的创建 / 更新，逐个对象预检，全部通过才允许提交，提交后给出每个对象的结果。
 */
import { Alert, App, Button, Collapse, Flex, Modal, Spin, Tag } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getErrorReason,
  getK8sErrorMessage,
  isChangeSubmitted,
} from '@/services/k8s/request';
import {
  applyManifest,
  applyObject,
  getObject,
  previewManifest,
  previewObject,
} from '@/services/k8s/resource';
import type {
  ManifestItem,
  ManifestResult,
  PreviewResult,
  ResourceRef,
} from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { ApprovalNotice } from './approval';
import { YamlDiff, YamlEditor } from './YamlEditor';

const refText = (ref: ResourceRef, kind?: string): string =>
  `${kind || ref.resource} ${ref.namespace ? `${ref.namespace}/` : ''}${ref.name ?? ''}`;

export const EditObjectModal: React.FC<{
  clusterId: string;
  target: ResourceRef;
  title?: string;
  onClose: () => void;
  /** 提交成功后调用 */
  onDone?: () => void;
}> = ({ clusterId, target: targetProp, title, onClose, onDone }) => {
  const t = useT();
  const { message } = App.useApp();
  // 弹窗按目标对象挂载：目标在生命周期内不变（调用方每次渲染都会新建 ref 对象）
  const target = useRef(targetProp).current;
  const [loading, setLoading] = useState(true);
  const [yaml, setYaml] = useState('');
  const [preview, setPreview] = useState<PreviewResult>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [conflict, setConflict] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    setConflict(false);
    setPreview(undefined);
    try {
      const res = await getObject(clusterId, target, { silent: true });
      setYaml(res.yaml);
    } catch (err) {
      setError(getK8sErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clusterId, target]);

  useEffect(() => {
    void load();
  }, [load]);

  const fail = (err: unknown) => {
    if (isChangeSubmitted(err)) {
      // 已转为变更单（去向由审批条提示）：收起弹窗，避免重复提交
      onClose();
      return;
    }
    setConflict(getErrorReason(err) === 'K8S_CONFLICT');
    setError(getK8sErrorMessage(err));
  };

  const doPreview = async () => {
    setBusy(true);
    setError(undefined);
    setConflict(false);
    try {
      setPreview(
        await previewObject(clusterId, { ref: target, yaml }, { silent: true }),
      );
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const doApply = async () => {
    if (!preview) return;
    setBusy(true);
    setError(undefined);
    try {
      await applyObject(
        clusterId,
        { ref: target, yaml, resourceVersion: preview.resourceVersion },
        { silent: true },
      );
      message.success(t('common.msg.saved'));
      onDone?.();
      onClose();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      width={1080}
      title={
        title ?? t('pages.k8s.yaml.edit.title', { name: target.name ?? '' })
      }
      destroyOnHidden
      mask={{ closable: false }}
      onCancel={onClose}
      footer={
        <Flex justify="end" gap={8}>
          <Button onClick={onClose}>{t('common.action.cancel')}</Button>
          {preview ? (
            <>
              <Button disabled={busy} onClick={() => setPreview(undefined)}>
                {t('pages.k8s.change.back')}
              </Button>
              <Button
                type="primary"
                loading={busy}
                disabled={!preview.changed || conflict}
                onClick={doApply}
              >
                {t('pages.k8s.change.apply')}
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              loading={busy}
              disabled={loading || !yaml.trim()}
              onClick={doPreview}
            >
              {t('pages.k8s.change.preview')}
            </Button>
          )}
        </Flex>
      }
    >
      <ApprovalNotice />
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={conflict ? t('pages.k8s.change.conflict') : error}
          description={conflict ? error : undefined}
          action={
            conflict ? (
              <Button size="small" onClick={load}>
                {t('pages.k8s.change.reload')}
              </Button>
            ) : undefined
          }
        />
      )}
      {loading ? (
        <Spin style={{ display: 'block', margin: '80px auto' }} />
      ) : preview ? (
        <>
          <Alert
            type={preview.changed ? 'info' : 'warning'}
            showIcon
            style={{ marginBottom: 12 }}
            title={t(
              preview.changed
                ? 'pages.k8s.change.diff.hint'
                : 'pages.k8s.change.noChange',
            )}
          />
          <YamlDiff before={preview.beforeYaml} after={preview.afterYaml} />
        </>
      ) : (
        <YamlEditor value={yaml} onChange={setYaml} height={520} />
      )}
    </Modal>
  );
};

const ItemTag: React.FC<{ item: ManifestItem; applied: boolean }> = ({
  item,
  applied,
}) => {
  const t = useT();
  if (item.error)
    return <Tag color="error">{t('pages.k8s.manifest.failed')}</Tag>;
  if (item.skipped) return <Tag>{t('pages.k8s.manifest.skipped')}</Tag>;
  if (applied) return <Tag color="success">{t('pages.k8s.manifest.done')}</Tag>;
  return (
    <Tag color={item.create ? 'processing' : 'warning'}>
      {t(
        item.create ? 'pages.k8s.manifest.create' : 'pages.k8s.manifest.update',
      )}
    </Tag>
  );
};

export const ManifestModal: React.FC<{
  clusterId: string;
  /** 未写命名空间的对象的缺省命名空间 */
  namespace?: string;
  title: string;
  initialYaml?: string;
  onClose: () => void;
  /** 有对象提交成功后调用（含部分成功） */
  onDone?: () => void;
}> = ({ clusterId, namespace, title, initialYaml = '', onClose, onDone }) => {
  const t = useT();
  const [yaml, setYaml] = useState(initialYaml);
  const [result, setResult] = useState<ManifestResult>();
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const run = async (apply: boolean) => {
    setBusy(true);
    setError(undefined);
    try {
      const body = { yaml, namespace: namespace || undefined };
      const res = apply
        ? await applyManifest(clusterId, body, { silent: true })
        : await previewManifest(clusterId, body, { silent: true });
      setResult(res);
      setApplied(apply);
      if (
        apply &&
        (res.items ?? []).some((item) => !item.error && !item.skipped)
      ) {
        onDone?.();
      }
    } catch (err) {
      if (isChangeSubmitted(err)) {
        onClose();
        return;
      }
      setError(getK8sErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const items = result?.items ?? [];

  return (
    <Modal
      open
      width={1080}
      title={title}
      destroyOnHidden
      mask={{ closable: false }}
      onCancel={onClose}
      footer={
        <Flex justify="end" gap={8}>
          <Button onClick={onClose}>
            {t(applied ? 'pages.k8s.change.close' : 'common.action.cancel')}
          </Button>
          {result && !applied && (
            <Button
              disabled={busy}
              onClick={() => {
                setResult(undefined);
                setError(undefined);
              }}
            >
              {t('pages.k8s.change.back')}
            </Button>
          )}
          {!result && (
            <Button
              type="primary"
              loading={busy}
              disabled={!yaml.trim()}
              onClick={() => run(false)}
            >
              {t('pages.k8s.change.preview')}
            </Button>
          )}
          {result && !applied && (
            <Button
              type="primary"
              loading={busy}
              disabled={!result.ok}
              onClick={() => run(true)}
            >
              {t('pages.k8s.change.apply')}
            </Button>
          )}
        </Flex>
      }
    >
      <ApprovalNotice />
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={error}
        />
      )}
      {!result ? (
        <>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            title={t('pages.k8s.manifest.hint')}
          />
          <YamlEditor value={yaml} onChange={setYaml} height={480} />
        </>
      ) : (
        <>
          <Alert
            type={result.ok ? (applied ? 'success' : 'info') : 'error'}
            showIcon
            style={{ marginBottom: 12 }}
            title={t(
              applied
                ? result.ok
                  ? 'pages.k8s.manifest.applied'
                  : 'pages.k8s.manifest.applyFailed'
                : result.ok
                  ? 'pages.k8s.manifest.previewOk'
                  : 'pages.k8s.manifest.previewFailed',
              { count: items.length },
            )}
          />
          <Collapse
            size="small"
            defaultActiveKey={items
              .map((item, index) => (item.error ? String(index) : ''))
              .filter(Boolean)}
            items={items.map((item, index) => ({
              key: String(index),
              label: (
                <span>
                  <ItemTag item={item} applied={applied} />
                  {refText(item.ref, item.kind)}
                </span>
              ),
              children: item.error ? (
                <Alert type="error" title={item.error} />
              ) : item.afterYaml ? (
                <YamlDiff
                  before={item.beforeYaml ?? ''}
                  after={item.afterYaml}
                  maxHeight={360}
                />
              ) : null,
            }))}
          />
        </>
      )}
    </Modal>
  );
};
