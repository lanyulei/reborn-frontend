/**
 * 资源操作：列表操作列与详情页头共用。每种资源的可用操作固定在这里，按元素权限过滤；
 * 能否对具体对象操作成功由集群按数据范围判定。删除、重启、缩容到 0、驱逐、排空等用确认弹窗，
 * 生产集群要求输入资源名。
 */
import { DownOutlined } from '@ant-design/icons';
import {
  App,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
  theme,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cordonNode,
  deleteObject,
  evictPod,
  getObject,
  pauseWorkload,
  restartWorkload,
  scaleWorkload,
  setWorkloadImage,
  suspendCronJob,
  triggerCronJob,
} from '@/services/k8s/resource';
import type { GVR, K8sObject, ResourceRef } from '@/services/k8s/typings';
import {
  type ElementPermissionCode,
  usePermissions,
} from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { ApprovalNotice } from './approval';
import { EditObjectModal } from './ChangePreview';
import { useDangerConfirm } from './confirm';
import { DrainModal } from './DrainModal';
import { PodFileModal } from './FileTransferModal';
import { NamespaceQuotaModal, NodeMetaModal } from './MetaEditors';
import { elementCode, GVRS, isNamespaced, sameGVR } from './meta';
import { useTerminal } from './Terminal';
import { formKindOf, WorkloadFormModal } from './WorkloadFormModal';

export interface ActionTarget {
  namespace?: string;
  name: string;
  uid?: string;
}

export type DetailTab =
  | 'overview'
  | 'pods'
  | 'events'
  | 'logs'
  | 'yaml'
  | 'revisions';

interface Action {
  key: string;
  label: string;
  danger?: boolean;
  run: () => void;
}

type ModalState =
  | {
      type:
        | 'edit'
        | 'scale'
        | 'image'
        | 'drain'
        | 'form'
        | 'nodeMeta'
        | 'quota'
        | 'file';
      target: ActionTarget;
    }
  | undefined;

const is = (gvr: GVR, ...list: GVR[]) =>
  list.some((item) => sameGVR(gvr, item));

/** 伸缩 / 更新镜像弹窗：打开时读取对象的当前值 */
const QuickModal: React.FC<{
  clusterId: string;
  type: 'scale' | 'image';
  target: ResourceRef;
  onClose: () => void;
  onDone: () => void;
}> = ({ clusterId, type, target: targetProp, onClose, onDone }) => {
  const t = useT();
  // 弹窗按目标对象挂载：目标在生命周期内不变
  const target = useRef(targetProp).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { message } = App.useApp();
  const confirm = useDangerConfirm();
  const [form] = Form.useForm<{
    replicas: number;
    container: string;
    image: string;
  }>();
  const [object, setObject] = useState<K8sObject>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getObject(clusterId, target)
      .then((res) => {
        if (cancelled) return;
        setObject(res.object);
        const containers = res.object.spec?.template?.spec?.containers ?? [];
        form.setFieldsValue({
          replicas: res.object.spec?.replicas ?? 1,
          container: containers[0]?.name,
          image: containers[0]?.image,
        });
      })
      .catch(() => onCloseRef.current());
    return () => {
      cancelled = true;
    };
  }, [clusterId, target, form]);

  const containers: { name: string; image: string }[] =
    object?.spec?.template?.spec?.containers ?? [];

  const submit = async () => {
    const values = await form.validateFields();
    const run = async () => {
      setSaving(true);
      try {
        if (type === 'scale') {
          await scaleWorkload(clusterId, target, values.replicas);
        } else {
          await setWorkloadImage(
            clusterId,
            target,
            values.container,
            values.image.trim(),
          );
        }
        message.success(t('common.msg.updated'));
        onDone();
        onClose();
      } finally {
        setSaving(false);
      }
    };
    if (type === 'scale' && values.replicas === 0) {
      confirm({
        title: t('pages.k8s.action.scaleZero.title', {
          name: target.name ?? '',
        }),
        content: t('pages.k8s.action.scaleZero.content'),
        name: target.name,
        namespace: target.namespace,
        onOk: run,
      });
      return;
    }
    await run().catch(() => undefined);
  };

  return (
    <Modal
      open
      title={t(
        type === 'scale'
          ? 'pages.k8s.action.scale.title'
          : 'pages.k8s.action.image.title',
        { name: target.name ?? '' },
      )}
      destroyOnHidden
      mask={{ closable: false }}
      confirmLoading={saving}
      okButtonProps={{ disabled: !object }}
      onOk={submit}
      onCancel={onClose}
    >
      <ApprovalNotice />
      <Spin spinning={!object}>
        <Form form={form} layout="vertical">
          {type === 'scale' ? (
            <Form.Item
              name="replicas"
              label={t('pages.k8s.action.scale.replicas')}
              rules={[{ required: true }]}
            >
              <InputNumber
                min={0}
                max={10000}
                precision={0}
                style={{ width: 200 }}
              />
            </Form.Item>
          ) : (
            <>
              <Form.Item
                name="container"
                label={t('pages.k8s.column.container')}
                rules={[{ required: true }]}
              >
                <Select
                  options={containers.map((item) => ({
                    value: item.name,
                    label: item.name,
                  }))}
                  onChange={(name) =>
                    form.setFieldValue(
                      'image',
                      containers.find((item) => item.name === name)?.image,
                    )
                  }
                />
              </Form.Item>
              <Form.Item
                name="image"
                label={t('pages.k8s.column.image')}
                rules={[{ required: true, whitespace: true, max: 1024 }]}
              >
                <Input />
              </Form.Item>
            </>
          )}
        </Form>
      </Spin>
    </Modal>
  );
};

export interface UseResourceActionsOptions {
  clusterId: string;
  gvr: GVR;
  /** 操作成功后刷新 */
  onChanged: () => void;
  /** 对象被删除后（详情页据此关闭） */
  onDeleted?: () => void;
  /** 打开详情并定位到某个页签（日志） */
  onOpenTab?: (target: ActionTarget, tab: DetailTab) => void;
}

export const useResourceActions = ({
  clusterId,
  gvr,
  onChanged,
  onDeleted,
  onOpenTab,
}: UseResourceActionsOptions) => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const confirm = useDangerConfirm();
  const terminal = useTerminal();
  const [modal, setModal] = useState<ModalState>();

  const refOf = useCallback(
    (target: ActionTarget): ResourceRef => ({
      ...gvr,
      namespace: isNamespaced(gvr) ? target.namespace : undefined,
      name: target.name,
    }),
    [gvr],
  );

  const actionsOf = (target: ActionTarget, object?: K8sObject): Action[] => {
    const ref = refOf(target);
    const name = target.name;
    const list: Action[] = [];
    const add = (
      code: ElementPermissionCode,
      key: string,
      run: () => void,
      danger?: boolean,
    ) => {
      if (has(code)) {
        list.push({ key, label: t(`pages.k8s.action.${key}`), run, danger });
      }
    };
    /** 直接执行并提示；失败已由请求层提示 */
    const exec = (call: () => Promise<unknown>, done = 'common.msg.updated') =>
      call()
        .then(() => {
          message.success(t(done));
          onChanged();
        })
        .catch(() => undefined);
    /** 确认后执行 */
    const ask = (key: string, call: () => Promise<unknown>, done?: string) =>
      confirm({
        title: t(`pages.k8s.action.${key}.title`, { name }),
        content: t(`pages.k8s.action.${key}.content`),
        name,
        namespace: ref.namespace,
        onOk: () => exec(call, done),
      });

    if (sameGVR(gvr, GVRS.pod)) {
      if (onOpenTab) {
        add('k8s.workload.log', 'logs', () => onOpenTab(target, 'logs'));
      }
      add('k8s.workload.exec', 'terminal', () =>
        terminal.open({
          clusterId,
          namespace: target.namespace ?? '',
          pod: name,
        }),
      );
      add('k8s.workload.debug', 'debug', () =>
        confirm({
          title: t('pages.k8s.action.debug.title', { name }),
          content: t('pages.k8s.action.debug.content'),
          name,
          onOk: () =>
            terminal.open({
              clusterId,
              namespace: target.namespace ?? '',
              pod: name,
              debug: true,
            }),
        }),
      );
      add('k8s.workload.file', 'file', () =>
        setModal({ type: 'file', target }),
      );
    }
    if (is(gvr, GVRS.deployment, GVRS.statefulSet, GVRS.replicaSet)) {
      add('k8s.workload.scale', 'scale', () =>
        setModal({ type: 'scale', target }),
      );
    }
    if (is(gvr, GVRS.deployment, GVRS.statefulSet, GVRS.daemonSet)) {
      add('k8s.workload.restart', 'restart', () =>
        ask('restart', () => restartWorkload(clusterId, ref)),
      );
      add('k8s.workload.edit', 'image', () =>
        setModal({ type: 'image', target }),
      );
    }
    if (sameGVR(gvr, GVRS.deployment)) {
      const paused = object?.spec?.paused;
      if (paused !== true) {
        add('k8s.workload.edit', 'pause', () =>
          exec(() => pauseWorkload(clusterId, ref, true)),
        );
      }
      if (paused === true || !object) {
        add('k8s.workload.edit', 'resume', () =>
          exec(() => pauseWorkload(clusterId, ref, false)),
        );
      }
    }
    if (sameGVR(gvr, GVRS.cronJob)) {
      add('k8s.workload.create', 'trigger', () =>
        exec(
          () => triggerCronJob(clusterId, ref),
          'pages.k8s.action.trigger.done',
        ),
      );
      const suspended = object?.spec?.suspend;
      if (suspended !== true) {
        add('k8s.workload.edit', 'suspend', () =>
          exec(() => suspendCronJob(clusterId, ref, true)),
        );
      }
      if (suspended === true || !object) {
        add('k8s.workload.edit', 'unsuspend', () =>
          exec(() => suspendCronJob(clusterId, ref, false)),
        );
      }
    }
    if (sameGVR(gvr, GVRS.node)) {
      const off = object?.spec?.unschedulable;
      if (off !== true) {
        add('k8s.cluster.node_schedule', 'cordon', () =>
          ask('cordon', () => cordonNode(clusterId, name, true)),
        );
      }
      if (off === true || !object) {
        add('k8s.cluster.node_schedule', 'uncordon', () =>
          exec(() => cordonNode(clusterId, name, false)),
        );
      }
      add(
        'k8s.cluster.node_drain',
        'drain',
        () => setModal({ type: 'drain', target }),
        true,
      );
    }
    if (formKindOf(gvr)) {
      add('k8s.workload.edit', 'editForm', () =>
        setModal({ type: 'form', target }),
      );
    }
    if (sameGVR(gvr, GVRS.node)) {
      add('k8s.cluster.node_edit', 'nodeMeta', () =>
        setModal({ type: 'nodeMeta', target }),
      );
    }
    if (sameGVR(gvr, GVRS.namespace)) {
      add('k8s.cluster.namespace_edit', 'quota', () =>
        setModal({ type: 'quota', target }),
      );
    }
    add(elementCode(gvr, 'edit'), 'editYaml', () =>
      setModal({ type: 'edit', target }),
    );
    if (sameGVR(gvr, GVRS.pod)) {
      add(
        'k8s.workload.delete',
        'evict',
        () => ask('evict', () => evictPod(clusterId, ref)),
        true,
      );
    }
    if (!sameGVR(gvr, GVRS.node)) {
      add(
        elementCode(gvr, 'delete'),
        'delete',
        () =>
          confirm({
            title: t('pages.k8s.action.delete.title', { name }),
            content: t('pages.k8s.action.delete.content'),
            name,
            namespace: ref.namespace,
            onOk: () =>
              deleteObject(clusterId, { ref, uid: target.uid })
                .then(() => {
                  message.success(t('common.msg.deleted'));
                  onChanged();
                  onDeleted?.();
                })
                .catch(() => undefined),
          }),
        true,
      );
    }
    return list;
  };

  /** 渲染为若干链接：前 inline 个直接展示，其余收进「更多」 */
  const render = (
    target: ActionTarget,
    options: { object?: K8sObject; inline?: number } = {},
  ): React.ReactNode[] => {
    const actions = actionsOf(target, options.object);
    const inline = options.inline ?? 2;
    const head =
      actions.length > inline + 1 ? actions.slice(0, inline) : actions;
    const rest = actions.slice(head.length);
    const nodes: React.ReactNode[] = head.map((action) => (
      <a
        key={action.key}
        style={action.danger ? { color: token.colorError } : undefined}
        onClick={action.run}
      >
        {action.label}
      </a>
    ));
    if (rest.length > 0) {
      nodes.push(
        <Dropdown
          key="more"
          trigger={['click']}
          menu={{
            items: rest.map((action) => ({
              key: action.key,
              label: action.label,
              danger: action.danger,
            })),
            onClick: ({ key }) =>
              rest.find((action) => action.key === key)?.run(),
          }}
        >
          <a>
            {t('common.action.more')} <DownOutlined />
          </a>
        </Dropdown>,
      );
    }
    return nodes;
  };

  const close = () => setModal(undefined);
  const holder = modal && (
    <>
      {modal.type === 'edit' && (
        <EditObjectModal
          clusterId={clusterId}
          target={refOf(modal.target)}
          onClose={close}
          onDone={onChanged}
        />
      )}
      {(modal.type === 'scale' || modal.type === 'image') && (
        <QuickModal
          clusterId={clusterId}
          type={modal.type}
          target={refOf(modal.target)}
          onClose={close}
          onDone={onChanged}
        />
      )}
      {modal.type === 'form' && formKindOf(gvr) && (
        <WorkloadFormModal
          clusterId={clusterId}
          kind={formKindOf(gvr) ?? 'Deployment'}
          target={refOf(modal.target)}
          onClose={close}
          onDone={onChanged}
        />
      )}
      {modal.type === 'nodeMeta' && (
        <NodeMetaModal
          clusterId={clusterId}
          node={modal.target.name}
          onClose={close}
          onDone={onChanged}
        />
      )}
      {modal.type === 'quota' && (
        <NamespaceQuotaModal
          clusterId={clusterId}
          namespace={modal.target.name}
          onClose={close}
          onDone={onChanged}
        />
      )}
      {modal.type === 'file' && (
        <PodFileModal
          clusterId={clusterId}
          namespace={modal.target.namespace ?? ''}
          pod={modal.target.name}
          onClose={close}
        />
      )}
      {modal.type === 'drain' && (
        <DrainModal
          clusterId={clusterId}
          node={modal.target.name}
          onClose={close}
          onDone={onChanged}
        />
      )}
    </>
  );

  return {
    render,
    holder,
    hasAny: (target: ActionTarget) => actionsOf(target).length > 0,
  };
};
