/**
 * 详情内「表单编辑」的公共部分：
 * - useEditObject：取对象原文（去掉 status）与 resourceVersion；
 * - EditSubmit：把改好的对象交给统一的写路径——预检（dry-run）→ 对比 → 提交，冲突时提示重新加载。
 * 编辑表单只在取到的对象上就地修改它建模的字段，其余字段原样保留。
 */
import { Alert, App, Button, Flex, Modal, Spin } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getErrorReason,
  getK8sErrorMessage,
  isChangeSubmitted,
} from '@/services/k8s/request';
import { applyObject, getObject, previewObject } from '@/services/k8s/resource';
import type { PreviewResult, ResourceRef } from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { ApprovalNotice } from '../../components/approval';
import { parseObject } from '../../components/workloadForm';
import { YamlDiff } from '../../components/YamlEditor';

// 任意资源类型的对象，结构不定
export type KubeObject = Record<string, any>;

/** 编辑表单的统一入参：由行操作 / 详情页的「更多」菜单渲染，挂载期间目标不变 */
export interface EditFormProps {
  clusterId: string;
  target: ResourceRef;
  onClose: () => void;
  /** 提交成功后调用（刷新列表 / 详情） */
  onDone?: () => void;
}

export interface EditObjectState {
  /** 对象原文（已去掉 status）；加载中或失败为 undefined。每次加载是新的对象，可就地修改 */
  object?: KubeObject;
  resourceVersion: string;
  loading: boolean;
  error?: string;
  reload: () => void;
}

export const useEditObject = (
  clusterId: string,
  targetProp: ResourceRef,
): EditObjectState => {
  // 目标在挂载期间不变（调用方每次渲染都会新建 ref 对象）
  const target = useRef(targetProp).current;
  const [state, setState] = useState<Omit<EditObjectState, 'reload'>>({
    resourceVersion: '',
    loading: true,
  });
  const [tick, setTick] = useState(0);

  // tick 只用于触发重新加载
  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: undefined }));
    getObject(clusterId, target, { silent: true })
      .then((res) => {
        if (cancelled) return;
        const object = parseObject(res.yaml);
        // 运行状态不属于期望配置：不带进编辑与提交
        delete object.status;
        setState({
          object,
          resourceVersion: res.resourceVersion,
          loading: false,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            resourceVersion: '',
            loading: false,
            error: getK8sErrorMessage(err),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [clusterId, target, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { ...state, reload };
};

/**
 * 提交步骤：打开即预检，展示「当前 → 变更后」的对比，确认后提交。
 * - 返回修改 / 取消：回到编辑表单（onBack）；
 * - 提交成功或被转为变更单：关闭整个编辑（onClose）；
 * - 版本冲突：提示并提供「重新加载」（onReload，由表单重新取对象）。
 */
export const EditSubmit: React.FC<{
  clusterId: string;
  target: ResourceRef;
  title: string;
  /** 改好的对象的 YAML */
  yaml: string;
  /** 取对象时的 resourceVersion（并发修改检测） */
  resourceVersion: string;
  onBack: () => void;
  onClose: () => void;
  onDone?: () => void;
  onReload?: () => void;
}> = ({
  clusterId,
  target: targetProp,
  title,
  yaml,
  resourceVersion,
  onBack,
  onClose,
  onDone,
  onReload,
}) => {
  const t = useT();
  const { message } = App.useApp();
  const target = useRef(targetProp).current;
  const [preview, setPreview] = useState<PreviewResult>();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string>();
  const [conflict, setConflict] = useState(false);

  const fail = useCallback(
    (err: unknown) => {
      if (isChangeSubmitted(err)) {
        // 已转为变更单（去向由审批条提示）：集群未改动，收起编辑
        onClose();
        return;
      }
      setConflict(getErrorReason(err) === 'K8S_CONFLICT');
      setError(getK8sErrorMessage(err));
    },
    [onClose],
  );

  // 只在打开时预检一次
  useEffect(() => {
    let cancelled = false;
    previewObject(
      clusterId,
      { ref: target, yaml, resourceVersion },
      { silent: true },
    )
      .then((res) => {
        if (!cancelled) setPreview(res);
      })
      .catch((err) => {
        if (!cancelled) fail(err);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const apply = async () => {
    if (!preview) return;
    setBusy(true);
    setError(undefined);
    try {
      await applyObject(
        clusterId,
        { ref: target, yaml, resourceVersion: preview.resourceVersion },
        { silent: true },
      );
      message.success(t('common.msg.updated'));
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
      title={title}
      destroyOnHidden
      mask={{ closable: false }}
      onCancel={onBack}
      footer={
        <Flex justify="end" gap={8}>
          <Button disabled={busy && !!preview} onClick={onBack}>
            {t('pages.k8s.change.back')}
          </Button>
          <Button
            type="primary"
            loading={busy}
            disabled={!preview?.changed}
            onClick={() => void apply()}
          >
            {t('pages.k8s.change.apply')}
          </Button>
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
          action={
            conflict &&
            onReload && (
              <Button
                size="small"
                onClick={() => {
                  onReload();
                  onBack();
                }}
              >
                {t('pages.k8s.change.reload')}
              </Button>
            )
          }
        />
      )}
      <Spin spinning={busy && !preview}>
        <div style={{ minHeight: 120, maxHeight: '68vh', overflow: 'auto' }}>
          {preview &&
            (preview.changed ? (
              <YamlDiff before={preview.beforeYaml} after={preview.afterYaml} />
            ) : (
              <Alert
                type="info"
                showIcon
                title={t('pages.k8s.change.noChange')}
              />
            ))}
        </div>
      </Spin>
    </Modal>
  );
};
