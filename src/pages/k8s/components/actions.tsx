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
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { isChangeSubmitted } from '@/services/k8s/request';
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
import type {
  GVR,
  K8sObject,
  ListRow,
  ResourceRef,
} from '@/services/k8s/typings';
import {
  type ElementPermissionCode,
  usePermissions,
} from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { type EditEntry, editEntriesOf } from '../forms/editRegistry';
import { ApprovalNotice } from './approval';
import { EditObjectModal } from './ChangePreview';
import { useDangerConfirm } from './confirm';
import { DrainModal } from './DrainModal';
import { PodFileModal } from './FileTransferModal';
import { NamespaceQuotaModal, NodeMetaModal } from './MetaEditors';
import { elementCode, GVRS, isNamespaced, sameGVR } from './meta';
import { PodResizeModal } from './PodResizeModal';
import { RollbackModal } from './RollbackModal';
import { useTerminal } from './Terminal';

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
  | 'metrics'
  | 'yaml'
  | 'revisions';

/** 操作的分组：菜单里按此顺序排列，组与组之间用分隔线隔开 */
export type ActionGroup = 'view' | 'ops' | 'edit' | 'danger';
const GROUP_ORDER: ActionGroup[] = ['view', 'ops', 'edit', 'danger'];

interface Action {
  key: string;
  label: string;
  group: ActionGroup;
  danger?: boolean;
  run: () => void;
}

/** 下拉菜单项：组与组之间插入分隔线 */
const actionMenuItems = (actions: Action[]) =>
  actions.flatMap((action, index) => [
    ...(index > 0 && actions[index - 1].group !== action.group
      ? [{ type: 'divider' as const, key: `divider:${action.key}` }]
      : []),
    { key: action.key, label: action.label, danger: action.danger },
  ]);

type ModalState =
  | {
      type:
        | 'edit'
        | 'scale'
        | 'image'
        | 'drain'
        | 'nodeMeta'
        | 'quota'
        | 'file'
        | 'resize'
        | 'rollback'
        | 'settings';
      target: ActionTarget;
    }
  // 登记表里的表单编辑项（详情内的编辑抽屉）
  | { type: 'entry'; entry: EditEntry; target: ActionTarget }
  | undefined;

const is = (gvr: GVR, ...list: GVR[]) =>
  list.some((item) => sameGVR(gvr, item));

// 「编辑设置」抽屉按需加载
const WorkloadSettingsEdit = lazy(() => import('../forms/edit/workload'));
type WorkloadSettingsKind =
  | 'Deployment'
  | 'StatefulSet'
  | 'DaemonSet'
  | 'CronJob';

/** 支持「编辑设置」的类型 */
const settingsKindOf = (gvr: GVR): WorkloadSettingsKind | undefined =>
  sameGVR(gvr, GVRS.deployment)
    ? 'Deployment'
    : sameGVR(gvr, GVRS.statefulSet)
      ? 'StatefulSet'
      : sameGVR(gvr, GVRS.daemonSet)
        ? 'DaemonSet'
        : sameGVR(gvr, GVRS.cronJob)
          ? 'CronJob'
          : undefined;

/**
 * 列表行里数据面渲染的「已暂停」状态文案（backend/k8s/internal/data/kube/columns.go），
 * 连同可能的英文写法一起比对。
 * TODO: 数据面给行加 spec.paused / spec.suspend / spec.unschedulable 的布尔字段后改读字段，不再比对文案。
 */
const PAUSED_STATUS_TEXTS = new Set(['已暂停', 'Paused', 'Suspended']);

/**
 * 列表行没有对象原文：从行的状态推出「暂停 / 禁止调度」等开关的当前值，
 * 这样行操作只给出适用的那一个（暂停 ↔ 恢复、停止调度 ↔ 恢复调度）。
 */
const objectHintOf = (
  gvr: GVR,
  target: ActionTarget,
): K8sObject | undefined => {
  const status = (target as Partial<ListRow>).cells?.status as
    | { text?: string }
    | undefined;
  const text = status?.text;
  if (text === undefined) return undefined;
  if (sameGVR(gvr, GVRS.deployment)) {
    return { spec: { paused: PAUSED_STATUS_TEXTS.has(text) } };
  }
  if (sameGVR(gvr, GVRS.cronJob)) {
    return { spec: { suspend: PAUSED_STATUS_TEXTS.has(text) } };
  }
  if (sameGVR(gvr, GVRS.node)) {
    return { spec: { unschedulable: text.includes('SchedulingDisabled') } };
  }
  return undefined;
};

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
      group: ActionGroup,
      code: ElementPermissionCode,
      key: string,
      run: () => void,
    ) => {
      if (has(code)) {
        list.push({
          key,
          label: t(`pages.k8s.action.${key}`),
          group,
          danger: group === 'danger',
          run,
        });
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
        add('view', 'k8s.workload.log', 'logs', () =>
          onOpenTab(target, 'logs'),
        );
      }
      add('view', 'k8s.workload.exec', 'terminal', () =>
        terminal.open({
          clusterId,
          namespace: target.namespace ?? '',
          pod: name,
        }),
      );
      add('view', 'k8s.workload.debug', 'debug', () =>
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
      add('view', 'k8s.workload.file', 'file', () =>
        setModal({ type: 'file', target }),
      );
    }
    if (is(gvr, GVRS.deployment, GVRS.statefulSet, GVRS.replicaSet)) {
      add('ops', 'k8s.workload.scale', 'scale', () =>
        setModal({ type: 'scale', target }),
      );
    }
    if (is(gvr, GVRS.deployment, GVRS.statefulSet, GVRS.daemonSet)) {
      add('ops', 'k8s.workload.restart', 'restart', () =>
        ask('restart', () => restartWorkload(clusterId, ref)),
      );
      add('ops', 'k8s.workload.edit', 'image', () =>
        setModal({ type: 'image', target }),
      );
      add('ops', 'k8s.workload.rollback', 'rollback', () =>
        setModal({ type: 'rollback', target }),
      );
    }
    if (settingsKindOf(gvr)) {
      add('edit', 'k8s.workload.edit', 'settings', () =>
        setModal({ type: 'settings', target }),
      );
    }
    if (sameGVR(gvr, GVRS.deployment)) {
      const paused = object?.spec?.paused;
      if (paused !== true) {
        add('ops', 'k8s.workload.edit', 'pause', () =>
          exec(() => pauseWorkload(clusterId, ref, true)),
        );
      }
      if (paused === true || !object) {
        add('ops', 'k8s.workload.edit', 'resume', () =>
          exec(() => pauseWorkload(clusterId, ref, false)),
        );
      }
    }
    if (sameGVR(gvr, GVRS.cronJob)) {
      add('ops', 'k8s.workload.create', 'trigger', () =>
        exec(
          () => triggerCronJob(clusterId, ref),
          'pages.k8s.action.trigger.done',
        ),
      );
      const suspended = object?.spec?.suspend;
      if (suspended !== true) {
        add('ops', 'k8s.workload.edit', 'suspend', () =>
          exec(() => suspendCronJob(clusterId, ref, true)),
        );
      }
      if (suspended === true || !object) {
        add('ops', 'k8s.workload.edit', 'unsuspend', () =>
          exec(() => suspendCronJob(clusterId, ref, false)),
        );
      }
    }
    if (sameGVR(gvr, GVRS.node)) {
      const off = object?.spec?.unschedulable;
      if (off !== true) {
        add('ops', 'k8s.cluster.node_schedule', 'cordon', () =>
          ask('cordon', () => cordonNode(clusterId, name, true)),
        );
      }
      if (off === true || !object) {
        add('ops', 'k8s.cluster.node_schedule', 'uncordon', () =>
          exec(() => cordonNode(clusterId, name, false)),
        );
      }
      add('danger', 'k8s.cluster.node_drain', 'drain', () =>
        setModal({ type: 'drain', target }),
      );
    }
    if (sameGVR(gvr, GVRS.node)) {
      add('edit', 'k8s.cluster.node_edit', 'nodeMeta', () =>
        setModal({ type: 'nodeMeta', target }),
      );
    }
    if (sameGVR(gvr, GVRS.namespace)) {
      add('edit', 'k8s.cluster.namespace_edit', 'quota', () =>
        setModal({ type: 'quota', target }),
      );
    }
    // 表单编辑项（按资源类型登记）：与「编辑 YAML」同一元素权限
    if (has(elementCode(gvr, 'edit'))) {
      for (const entry of editEntriesOf(gvr)) {
        list.push({
          key: `entry:${entry.key}`,
          label: entry.label,
          group: 'edit',
          run: () => setModal({ type: 'entry', entry, target }),
        });
      }
    }
    add('edit', elementCode(gvr, 'edit'), 'editYaml', () =>
      setModal({ type: 'edit', target }),
    );
    if (sameGVR(gvr, GVRS.pod)) {
      // 原地调整资源：与伸缩同一元素权限
      add('ops', 'k8s.workload.scale', 'resize', () =>
        setModal({ type: 'resize', target }),
      );
      add('danger', 'k8s.workload.delete', 'evict', () =>
        ask('evict', () => evictPod(clusterId, ref)),
      );
    }
    if (!sameGVR(gvr, GVRS.node)) {
      add('danger', elementCode(gvr, 'delete'), 'delete', () =>
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
      );
    }
    // 按分组排列（组内保持登记顺序）
    return list
      .map((action, index) => ({ action, index }))
      .sort(
        (x, y) =>
          GROUP_ORDER.indexOf(x.action.group) -
            GROUP_ORDER.indexOf(y.action.group) || x.index - y.index,
      )
      .map((item) => item.action);
  };

  /** 渲染为若干链接：前 inline 个直接展示，其余收进「更多」 */
  const render = (
    target: ActionTarget,
    options: { object?: K8sObject; inline?: number } = {},
  ): React.ReactNode[] => {
    const actions = actionsOf(
      target,
      options.object ?? objectHintOf(gvr, target),
    );
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
            items: actionMenuItems(rest),
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

  /** 批量操作（列表勾选后出现）：逐个执行，汇总成功 / 失败 / 转为变更单的数量 */
  const batch = (
    rows: ActionTarget[],
    clear: () => void,
  ): React.ReactNode[] => {
    const run = (
      key: 'restart' | 'delete',
      call: (target: ActionTarget) => Promise<unknown>,
    ) =>
      confirm({
        title: `${t(`pages.k8s.action.${key}`)} ${rows.length} 个对象？`,
        content: (
          <div style={{ maxHeight: 220, overflow: 'auto' }}>
            {rows.map((row) => (
              <div key={`${row.namespace}/${row.name}`}>
                {row.namespace ? `${row.namespace}/` : ''}
                {row.name}
              </div>
            ))}
          </div>
        ),
        // 生产集群：输入数量确认
        name: String(rows.length),
        onOk: async () => {
          let failed = 0;
          let submitted = 0;
          for (const row of rows) {
            try {
              await call(row);
            } catch (err) {
              // 需审批的集群：每个对象各生成一张变更单，不算失败
              if (isChangeSubmitted(err)) submitted += 1;
              else failed += 1;
            }
          }
          const done = rows.length - failed - submitted;
          if (failed > 0) {
            message.warning(`成功 ${done} 个，失败 ${failed} 个`);
          } else if (submitted > 0) {
            message.info(`已提交 ${submitted} 张变更单`);
          } else {
            message.success(t('common.msg.updated'));
          }
          clear();
          onChanged();
        },
      });
    const nodes: React.ReactNode[] = [];
    if (
      is(gvr, GVRS.deployment, GVRS.statefulSet, GVRS.daemonSet) &&
      has('k8s.workload.restart')
    ) {
      nodes.push(
        <a
          key="restart"
          onClick={() =>
            run('restart', (row) => restartWorkload(clusterId, refOf(row)))
          }
        >
          批量{t('pages.k8s.action.restart')}
        </a>,
      );
    }
    if (!sameGVR(gvr, GVRS.node) && has(elementCode(gvr, 'delete'))) {
      nodes.push(
        <a
          key="delete"
          style={{ color: token.colorError }}
          onClick={() =>
            run('delete', (row) =>
              deleteObject(clusterId, { ref: refOf(row), uid: row.uid }),
            )
          }
        >
          批量{t('pages.k8s.action.delete')}
        </a>,
      );
    }
    return nodes;
  };

  const close = () => setModal(undefined);
  const holder = modal && (
    <>
      {modal.type === 'entry' && (
        <Suspense fallback={null}>
          <modal.entry.component
            clusterId={clusterId}
            target={refOf(modal.target)}
            onClose={close}
            onDone={onChanged}
          />
        </Suspense>
      )}
      {modal.type === 'edit' && (
        <EditObjectModal
          clusterId={clusterId}
          target={refOf(modal.target)}
          onClose={close}
          onDone={onChanged}
        />
      )}
      {modal.type === 'rollback' && (
        <RollbackModal
          clusterId={clusterId}
          target={refOf(modal.target)}
          onClose={close}
          onDone={onChanged}
        />
      )}
      {modal.type === 'settings' && settingsKindOf(gvr) && (
        <Suspense fallback={null}>
          <WorkloadSettingsEdit
            clusterId={clusterId}
            kind={settingsKindOf(gvr) ?? 'Deployment'}
            target={refOf(modal.target)}
            onClose={close}
            onDone={onChanged}
          />
        </Suspense>
      )}
      {modal.type === 'resize' && (
        <PodResizeModal
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
    batch,
    holder,
    hasAny: (target: ActionTarget) => actionsOf(target).length > 0,
  };
};
