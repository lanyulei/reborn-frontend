/**
 * 通用资源详情（抽屉）：概览（元数据、标签与注解、所有者、Conditions，以及各类资源的要点）│ Pod │ 事件 │
 * 日志 │ YAML │ 历史版本。定制资源只是多出相应的页签与要点；其余资源（含 CRD）走同一套。
 * 详情以用户身份直接读自集群（不走缓存），能否查看由集群判定。
 */
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SectionTitle from '@/components/SectionTitle';
import type { MetricsTarget } from '@/services/k8s/insight';
import { getK8sErrorMessage } from '@/services/k8s/request';
import {
  getObject,
  listObjectEvents,
  listWorkloadRevisions,
  revealSecret,
  rollbackWorkload,
} from '@/services/k8s/resource';
import type {
  GVR,
  K8sEvent,
  K8sObject,
  ListRow,
  ObjectResult,
  ResourceRef,
  Revision,
  SecretReveal,
} from '@/services/k8s/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { type DetailTab, useResourceActions } from './actions';
import { AgeText, formatTime, LabelTags, StateBadge, TextList } from './cells';
import { useDangerConfirm } from './confirm';
import {
  AskAssistantButton,
  NodeHost,
  RelationsTab,
  usePodSelector,
} from './Insight';
import { type LogContainer, LogViewer } from './LogViewer';
import { MetricsPanel } from './MetricsPanel';
import {
  GVRS,
  isNamespaced,
  isWorkloadGVR,
  KIND_GVR,
  sameGVR,
  useKindName,
} from './meta';
import { isRbacGVR, RbacSection } from './RbacSection';
import { ResourceTable } from './ResourceTable';
import { useClusterName } from './scope';
import { useK8sStyles } from './styles';
import { useTerminal } from './Terminal';
import { YamlDiff, YamlEditor } from './YamlEditor';

export interface DetailTarget {
  gvr: GVR;
  namespace?: string;
  name: string;
  tab?: DetailTab;
}

/** 节点的内网 IP（status.addresses 里的 InternalIP） */
const nodeInternalIP = (object: K8sObject): string | undefined => {
  const addresses = object.status?.addresses;
  if (!Array.isArray(addresses)) return undefined;
  return addresses.find(
    (a: { type?: string; address?: string }) => a.type === 'InternalIP',
  )?.address;
};

const is = (gvr: GVR, ...list: GVR[]) =>
  list.some((item) => sameGVR(gvr, item));

/** matchLabels → 标签选择器；有 matchExpressions 时无法简单表达，返回 undefined */
const selectorOf = (gvr: GVR, object: K8sObject): string | undefined => {
  const selector = sameGVR(gvr, GVRS.service)
    ? object.spec?.selector
    : object.spec?.selector?.matchLabels;
  if (!selector || typeof selector !== 'object') return undefined;
  const pairs = Object.entries(selector as Record<string, string>);
  return pairs.length > 0
    ? pairs.map(([key, value]) => `${key}=${value}`).join(',')
    : undefined;
};

const containersOf = (gvr: GVR, object: K8sObject): LogContainer[] => {
  const spec = sameGVR(gvr, GVRS.pod)
    ? object.spec
    : sameGVR(gvr, GVRS.cronJob)
      ? object.spec?.jobTemplate?.spec?.template?.spec
      : object.spec?.template?.spec;
  const names = (list: unknown, init: boolean): LogContainer[] =>
    Array.isArray(list)
      ? list.map((item: { name: string }) => ({ name: item.name, init }))
      : [];
  return [
    ...names(spec?.containers, false),
    ...names(spec?.initContainers, true),
  ];
};

const EventsTab: React.FC<{ clusterId: string; target: ResourceRef }> = ({
  clusterId,
  target,
}) => {
  const t = useT();
  const [items, setItems] = useState<K8sEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [tick, setTick] = useState(0);
  const ref = useRef(target).current;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listObjectEvents(clusterId, ref, { silent: true })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items ?? []);
        setError(undefined);
      })
      .catch((err) => {
        if (!cancelled) setError(getK8sErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clusterId, ref, tick]);

  return (
    <>
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={error}
        />
      )}
      <Flex justify="end" style={{ marginBottom: 8 }}>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => setTick((n) => n + 1)}
        />
      </Flex>
      <Table<K8sEvent>
        size="small"
        loading={loading}
        rowKey={(event) =>
          `${event.object}/${event.reason}/${event.firstTime}/${event.message}`
        }
        dataSource={items}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        columns={[
          {
            title: t('pages.k8s.event.type'),
            dataIndex: 'type',
            width: 90,
            render: (_, event) => (
              <Tag color={event.type === 'Warning' ? 'warning' : undefined}>
                {event.type}
              </Tag>
            ),
          },
          {
            title: t('pages.k8s.event.reason'),
            dataIndex: 'reason',
            width: 160,
          },
          {
            title: t('pages.k8s.event.object'),
            dataIndex: 'object',
            width: 200,
          },
          { title: t('pages.k8s.event.message'), dataIndex: 'message' },
          { title: t('pages.k8s.event.count'), dataIndex: 'count', width: 70 },
          {
            title: t('pages.k8s.event.lastTime'),
            dataIndex: 'lastTime',
            width: 100,
            render: (_, event) => <AgeText value={event.lastTime} />,
          },
        ]}
      />
    </>
  );
};

export const RevisionsTab: React.FC<{
  clusterId: string;
  target: ResourceRef;
  onChanged: () => void;
}> = ({ clusterId, target, onChanged }) => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const confirm = useDangerConfirm();
  const [items, setItems] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [tick, setTick] = useState(0);
  const ref = useRef(target).current;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listWorkloadRevisions(clusterId, ref)
      .then((res) => {
        if (!cancelled) setItems(res.items ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clusterId, ref, tick]);

  const picked = selected
    .map((revision) => items.find((item) => item.revision === revision))
    .filter((item): item is Revision => !!item)
    .sort((a, b) => a.revision - b.revision);

  return (
    <>
      <Typography.Paragraph type="secondary">
        {t('pages.k8s.revision.hint')}
      </Typography.Paragraph>
      <Table<Revision>
        size="small"
        loading={loading}
        rowKey="revision"
        dataSource={items}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        rowSelection={{
          selectedRowKeys: selected,
          hideSelectAll: true,
          // 至多选两个：再选时顶掉最早选的
          onChange: (keys) => setSelected(keys.map(Number).slice(-2)),
        }}
        columns={[
          {
            title: t('pages.k8s.revision.revision'),
            dataIndex: 'revision',
            width: 120,
            render: (_, item) => (
              <span>
                #{item.revision}{' '}
                {item.current && (
                  <Tag color="success">{t('pages.k8s.revision.current')}</Tag>
                )}
              </span>
            ),
          },
          {
            title: t('pages.k8s.column.image'),
            dataIndex: 'images',
            render: (_, item) => <TextList value={item.images} max={3} />,
          },
          {
            title: t('pages.k8s.revision.changeCause'),
            dataIndex: 'changeCause',
          },
          {
            title: t('common.column.createTime'),
            dataIndex: 'createTime',
            width: 170,
            render: (_, item) => formatTime(item.createTime),
          },
          {
            title: t('common.column.action'),
            key: 'action',
            width: 90,
            render: (_, item) =>
              !item.current &&
              has('k8s.workload.rollback') && (
                <a
                  onClick={() =>
                    confirm({
                      title: t('pages.k8s.revision.rollback.title', {
                        name: ref.name ?? '',
                        revision: item.revision,
                      }),
                      content: t('pages.k8s.revision.rollback.content'),
                      name: ref.name,
                      namespace: ref.namespace,
                      onOk: () =>
                        rollbackWorkload(clusterId, ref, item.revision)
                          .then(() => {
                            message.success(
                              t('pages.k8s.revision.rollback.done'),
                            );
                            setTick((n) => n + 1);
                            onChanged();
                          })
                          .catch(() => undefined),
                    })
                  }
                >
                  {t('pages.k8s.revision.rollback')}
                </a>
              ),
          },
        ]}
      />
      {picked.length === 1 && (
        <>
          <SectionTitle>
            {t('pages.k8s.revision.template', { revision: picked[0].revision })}
          </SectionTitle>
          <YamlEditor value={picked[0].templateYaml} readOnly height={360} />
        </>
      )}
      {picked.length === 2 && (
        <>
          <SectionTitle>
            {t('pages.k8s.revision.compare', {
              from: picked[0].revision,
              to: picked[1].revision,
            })}
          </SectionTitle>
          <YamlDiff
            before={picked[0].templateYaml}
            after={picked[1].templateYaml}
            maxHeight={420}
          />
        </>
      )}
    </>
  );
};

/** ConfigMap / Secret 的键值：Secret 的值掩码，持有权限时可查看明文（记入审计） */
export const DataSection: React.FC<{
  clusterId: string;
  object: K8sObject;
  secret: boolean;
}> = ({ clusterId, object, secret }) => {
  const t = useT();
  const has = usePermissions();
  const { styles } = useK8sStyles();
  const [revealed, setRevealed] = useState<SecretReveal>();
  const [loading, setLoading] = useState(false);
  const data = (object.data ?? {}) as Record<string, string>;
  const keys = Object.keys(data);
  if (keys.length === 0) return null;

  const reveal = async () => {
    setLoading(true);
    try {
      setRevealed(
        await revealSecret(
          clusterId,
          object.metadata?.namespace ?? '',
          object.metadata?.name ?? '',
        ),
      );
    } catch {
      // 已由请求层提示
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SectionTitle>{t('pages.k8s.detail.data')}</SectionTitle>
      {secret && has('k8s.config.secret_reveal') && (
        <Flex gap={12} align="center" style={{ marginBottom: 12 }}>
          {revealed ? (
            <Button size="small" onClick={() => setRevealed(undefined)}>
              {t('pages.k8s.secret.hide')}
            </Button>
          ) : (
            <Button size="small" loading={loading} onClick={reveal}>
              {t('pages.k8s.secret.reveal')}
            </Button>
          )}
          <span className={styles.secondary}>
            {t('pages.k8s.secret.reveal.hint')}
          </span>
        </Flex>
      )}
      {keys.map((key) => {
        const binary = revealed?.binary?.includes(key);
        const value = secret
          ? revealed
            ? (revealed.data?.[key] ?? '')
            : '******'
          : String(data[key]);
        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <Typography.Text strong>{key}</Typography.Text>
            {binary && (
              <Tag style={{ marginInlineStart: 8 }}>
                {t('pages.k8s.secret.binary')}
              </Tag>
            )}
            <Typography.Paragraph
              className={styles.codeBlock}
              copyable={!secret || revealed ? { text: value } : false}
              style={{ marginTop: 4, marginBottom: 0 }}
            >
              {value}
            </Typography.Paragraph>
          </div>
        );
      })}
    </>
  );
};

interface ContainerStatus {
  name: string;
  ready?: boolean;
  restartCount?: number;
  image?: string;
  state?: Record<
    string,
    { reason?: string; message?: string; exitCode?: number }
  >;
  lastState?: Record<
    string,
    {
      reason?: string;
      exitCode?: number;
      finishedAt?: string;
      message?: string;
    }
  >;
}

/** Pod 的容器状态：当前状态、重启次数、上次终止原因与退出码；可直接进终端 */
const PodContainers: React.FC<{ clusterId: string; object: K8sObject }> = ({
  clusterId,
  object,
}) => {
  const t = useT();
  const has = usePermissions();
  const terminal = useTerminal();
  const statuses: ContainerStatus[] = [
    ...(object.status?.initContainerStatuses ?? []),
    ...(object.status?.containerStatuses ?? []),
  ];
  if (statuses.length === 0) return null;
  return (
    <>
      <SectionTitle>{t('pages.k8s.detail.containers')}</SectionTitle>
      <Table<ContainerStatus>
        size="small"
        rowKey="name"
        pagination={false}
        dataSource={statuses}
        columns={[
          { title: t('pages.k8s.column.container'), dataIndex: 'name' },
          {
            title: t('common.column.status'),
            key: 'state',
            render: (_, item) => {
              const [kind, detail] = Object.entries(item.state ?? {})[0] ?? [];
              const state =
                kind === 'running'
                  ? item.ready
                    ? 'ok'
                    : 'pending'
                  : kind === 'terminated'
                    ? detail?.exitCode === 0
                      ? 'done'
                      : 'abnormal'
                    : kind === 'waiting' &&
                        detail?.reason &&
                        detail.reason !== 'ContainerCreating' &&
                        detail.reason !== 'PodInitializing'
                      ? 'abnormal'
                      : 'pending';
              return (
                <StateBadge
                  state={state}
                  text={detail?.reason || kind}
                  reason={detail?.message}
                />
              );
            },
          },
          {
            title: t('pages.k8s.detail.restarts'),
            dataIndex: 'restartCount',
            width: 90,
          },
          {
            title: t('pages.k8s.detail.lastTermination'),
            key: 'last',
            render: (_, item) => {
              const last = item.lastState?.terminated;
              return last
                ? `${last.reason ?? ''} (exit ${last.exitCode ?? '?'}) ${formatTime(last.finishedAt)}`
                : t('common.empty');
            },
          },
          {
            title: t('pages.k8s.column.image'),
            dataIndex: 'image',
            render: (_, item) => (
              <TextList value={item.image ? [item.image] : []} />
            ),
          },
          {
            title: t('common.column.action'),
            key: 'action',
            width: 80,
            render: (_, item) =>
              has('k8s.workload.exec') &&
              item.state?.running && (
                <a
                  onClick={() =>
                    terminal.open({
                      clusterId,
                      namespace: object.metadata?.namespace ?? '',
                      pod: object.metadata?.name ?? '',
                      container: item.name,
                    })
                  }
                >
                  {t('pages.k8s.action.terminal')}
                </a>
              ),
          },
        ]}
      />
    </>
  );
};

interface ContainerSpec {
  name: string;
  image?: string;
  ports?: { containerPort?: number; protocol?: string }[];
  resources?: {
    requests?: Record<string, string>;
    limits?: Record<string, string>;
  };
}

/** 工作负载 Pod 模板里的容器：镜像、端口、资源 */
const TemplateContainers: React.FC<{ gvr: GVR; object: K8sObject }> = ({
  gvr,
  object,
}) => {
  const t = useT();
  const spec = sameGVR(gvr, GVRS.cronJob)
    ? object.spec?.jobTemplate?.spec?.template?.spec
    : object.spec?.template?.spec;
  const containers: ContainerSpec[] = [
    ...(spec?.initContainers ?? []),
    ...(spec?.containers ?? []),
  ];
  if (containers.length === 0) return null;
  const quantity = (value?: Record<string, string>) =>
    value
      ? Object.entries(value)
          .map(([key, v]) => `${key}=${v}`)
          .join(' ')
      : t('common.empty');
  return (
    <>
      <SectionTitle>{t('pages.k8s.detail.containers')}</SectionTitle>
      <Table<ContainerSpec>
        size="small"
        rowKey="name"
        pagination={false}
        dataSource={containers}
        columns={[
          { title: t('pages.k8s.column.container'), dataIndex: 'name' },
          {
            title: t('pages.k8s.column.image'),
            dataIndex: 'image',
            render: (_, item) => (
              <TextList value={item.image ? [item.image] : []} />
            ),
          },
          {
            title: t('pages.k8s.detail.ports'),
            key: 'ports',
            render: (_, item) =>
              (item.ports ?? [])
                .map(
                  (port) => `${port.containerPort}/${port.protocol ?? 'TCP'}`,
                )
                .join(', ') || t('common.empty'),
          },
          {
            title: t('pages.k8s.detail.requests'),
            key: 'requests',
            render: (_, item) => quantity(item.resources?.requests),
          },
          {
            title: t('pages.k8s.detail.limits'),
            key: 'limits',
            render: (_, item) => quantity(item.resources?.limits),
          },
        ]}
      />
    </>
  );
};

interface Condition {
  type: string;
  status?: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

const Overview: React.FC<{
  clusterId: string;
  gvr: GVR;
  data: ObjectResult;
  onOpen: (target: DetailTarget) => void;
}> = ({ clusterId, gvr, data, onOpen }) => {
  const t = useT();
  const kindName = useKindName();
  const { object } = data;
  const meta = object.metadata ?? {};
  const conditions: Condition[] = Array.isArray(object.status?.conditions)
    ? object.status.conditions
    : [];
  const summary: { key: string; label: string; children: React.ReactNode }[] = [
    { key: 'name', label: t('pages.k8s.column.name'), children: meta.name },
    ...(meta.namespace
      ? [
          {
            key: 'namespace',
            label: t('pages.k8s.column.namespace'),
            children: meta.namespace,
          },
        ]
      : []),
    {
      key: 'kind',
      label: 'Kind',
      children: `${object.apiVersion} / ${data.kind}`,
    },
    {
      key: 'created',
      label: t('common.column.createTime'),
      children: formatTime(meta.creationTimestamp),
    },
    { key: 'uid', label: 'UID', children: data.uid },
  ];
  if (meta.deletionTimestamp) {
    summary.push({
      key: 'deleting',
      label: t('pages.k8s.detail.deleting'),
      children: <Tag color="warning">{formatTime(meta.deletionTimestamp)}</Tag>,
    });
  }
  if (typeof object.spec?.replicas === 'number') {
    summary.push({
      key: 'replicas',
      label: t('pages.k8s.detail.replicas'),
      children: `${object.status?.readyReplicas ?? 0} / ${object.spec.replicas}`,
    });
  }
  if (object.spec?.strategy?.type || object.spec?.updateStrategy?.type) {
    summary.push({
      key: 'strategy',
      label: t('pages.k8s.detail.strategy'),
      children: object.spec.strategy?.type ?? object.spec.updateStrategy?.type,
    });
  }
  if (object.spec?.paused === true) {
    summary.push({
      key: 'paused',
      label: t('pages.k8s.detail.rollout'),
      children: <Tag color="warning">{t('pages.k8s.detail.paused')}</Tag>,
    });
  }
  if (sameGVR(gvr, GVRS.cronJob)) {
    summary.push(
      {
        key: 'schedule',
        label: t('pages.k8s.detail.schedule'),
        children: object.spec?.schedule,
      },
      {
        key: 'suspend',
        label: t('pages.k8s.detail.suspend'),
        children: object.spec?.suspend ? t('pages.k8s.yes') : t('pages.k8s.no'),
      },
    );
  }
  if (sameGVR(gvr, GVRS.pod)) {
    summary.push(
      {
        key: 'phase',
        label: t('pages.k8s.detail.phase'),
        children: object.status?.phase,
      },
      {
        key: 'node',
        label: t('pages.k8s.detail.node'),
        children: object.spec?.nodeName,
      },
      { key: 'podIP', label: 'Pod IP', children: object.status?.podIP },
    );
  }
  if (sameGVR(gvr, GVRS.node) && object.spec?.unschedulable) {
    summary.push({
      key: 'unschedulable',
      label: t('pages.k8s.detail.scheduling'),
      children: (
        <Tag color="warning">{t('pages.k8s.detail.unschedulable')}</Tag>
      ),
    });
  }
  const owners = meta.ownerReferences ?? [];

  return (
    <>
      <Descriptions
        bordered
        size="small"
        column={2}
        styles={{ label: { width: 130, whiteSpace: 'nowrap' } }}
        items={summary.map((item) => ({
          ...item,
          children: item.children || t('common.empty'),
        }))}
      />
      {owners.length > 0 && (
        <>
          <SectionTitle>{t('pages.k8s.detail.owners')}</SectionTitle>
          <Flex gap={8} wrap>
            {owners.map((owner) => {
              const target = KIND_GVR[owner.kind ?? ''];
              const text = `${kindName(owner.kind)}/${owner.name}`;
              return target && owner.name ? (
                <a
                  key={owner.uid}
                  onClick={() =>
                    onOpen({
                      gvr: target,
                      namespace: isNamespaced(target)
                        ? meta.namespace
                        : undefined,
                      name: owner.name ?? '',
                    })
                  }
                >
                  {text}
                </a>
              ) : (
                <span key={owner.uid}>{text}</span>
              );
            })}
          </Flex>
        </>
      )}
      <SectionTitle>{t('pages.k8s.detail.labels')}</SectionTitle>
      <LabelTags value={meta.labels} max={0} />
      <SectionTitle>{t('pages.k8s.detail.annotations')}</SectionTitle>
      <LabelTags value={meta.annotations} max={0} />
      {sameGVR(gvr, GVRS.pod) && (
        <PodContainers clusterId={clusterId} object={object} />
      )}
      {isWorkloadGVR(gvr) && !sameGVR(gvr, GVRS.pod) && (
        <TemplateContainers gvr={gvr} object={object} />
      )}
      {is(gvr, GVRS.configMap, GVRS.secret) && (
        <DataSection
          clusterId={clusterId}
          object={object}
          secret={sameGVR(gvr, GVRS.secret)}
        />
      )}
      {isRbacGVR(gvr) && (
        <RbacSection clusterId={clusterId} gvr={gvr} object={object} />
      )}
      {conditions.length > 0 && (
        <>
          <SectionTitle>Conditions</SectionTitle>
          <Table<Condition>
            size="small"
            rowKey="type"
            pagination={false}
            dataSource={conditions}
            columns={[
              { title: t('pages.k8s.event.type'), dataIndex: 'type' },
              {
                title: t('common.column.status'),
                dataIndex: 'status',
                width: 90,
              },
              { title: t('pages.k8s.event.reason'), dataIndex: 'reason' },
              { title: t('pages.k8s.event.message'), dataIndex: 'message' },
              {
                title: t('pages.k8s.event.lastTime'),
                dataIndex: 'lastTransitionTime',
                width: 100,
                render: (_, item) => (
                  <AgeText value={item.lastTransitionTime} />
                ),
              },
            ]}
          />
        </>
      )}
    </>
  );
};

export const ResourceDetail: React.FC<{
  clusterId: string;
  target: DetailTarget;
  onClose: () => void;
  /** 对象被修改或删除后调用（刷新列表） */
  onChanged?: () => void;
  /** 嵌套层级：从详情里再打开另一个对象的详情 */
  depth?: number;
  /** 整页模式：内容直接铺在页面里（带返回），而不是抽屉；从中打开的关联对象仍用抽屉 */
  page?: boolean;
}> = ({ clusterId, target, onClose, onChanged, depth = 0, page = false }) => {
  const t = useT();
  const kindName = useKindName();
  const has = usePermissions();
  const { gvr } = target;
  const [data, setData] = useState<ObjectResult>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [tab, setTab] = useState<string>(target.tab ?? 'overview');
  const [child, setChild] = useState<DetailTarget>();

  const ref = useMemo<ResourceRef>(
    () => ({
      ...gvr,
      namespace: isNamespaced(gvr) ? target.namespace : undefined,
      name: target.name,
    }),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getObject(clusterId, ref, { silent: true }));
      setError(undefined);
    } catch (err) {
      setError(getK8sErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clusterId, ref]);

  useEffect(() => {
    void load();
  }, [load]);

  const changed = useCallback(() => {
    void load();
    onChanged?.();
  }, [load, onChanged]);

  const actions = useResourceActions({
    clusterId,
    gvr,
    onChanged: changed,
    onDeleted: onClose,
    onOpenTab: (_, next) => setTab(next),
  });
  const podActions = useResourceActions({
    clusterId,
    gvr: GVRS.pod,
    onChanged: changed,
    onOpenTab: (pod, next) =>
      setChild({
        gvr: GVRS.pod,
        namespace: pod.namespace,
        name: pod.name,
        tab: next,
      }),
  });

  const object = data?.object;
  // Pod 选择器由服务端解析（含 matchExpressions）；解析结果回来之前先用本地的 matchLabels
  const selectable = is(
    gvr,
    GVRS.deployment,
    GVRS.statefulSet,
    GVRS.daemonSet,
    GVRS.replicaSet,
    GVRS.job,
    GVRS.service,
  );
  const resolved = usePodSelector(clusterId, ref, selectable);
  const selector = resolved
    ? resolved.empty
      ? undefined
      : resolved.labelSelector
    : object
      ? selectorOf(gvr, object)
      : undefined;
  const clusterName = useClusterName();
  const workloadKind = is(gvr, GVRS.deployment)
    ? ('Deployment' as const)
    : is(gvr, GVRS.statefulSet)
      ? ('StatefulSet' as const)
      : is(gvr, GVRS.daemonSet)
        ? ('DaemonSet' as const)
        : undefined;
  const metricsTarget: MetricsTarget | undefined = sameGVR(gvr, GVRS.node)
    ? { kind: 'node', name: target.name }
    : sameGVR(gvr, GVRS.pod)
      ? { kind: 'pod', namespace: target.namespace ?? '', name: target.name }
      : workloadKind
        ? {
            kind: 'workload',
            namespace: target.namespace ?? '',
            name: target.name,
            workloadKind,
          }
        : undefined;
  const hasRelations = is(
    gvr,
    GVRS.ingress,
    GVRS.service,
    GVRS.configMap,
    GVRS.secret,
  );
  const containers = object ? containersOf(gvr, object) : [];
  const isPod = sameGVR(gvr, GVRS.pod);
  const hasPods =
    is(
      gvr,
      GVRS.deployment,
      GVRS.statefulSet,
      GVRS.daemonSet,
      GVRS.replicaSet,
      GVRS.job,
      GVRS.service,
    ) && !!selector;
  const canLog =
    has('k8s.workload.log') &&
    (isPod ||
      (is(gvr, GVRS.deployment, GVRS.statefulSet, GVRS.daemonSet, GVRS.job) &&
        !!selector));

  const openPod = (row: ListRow) =>
    setChild({ gvr: GVRS.pod, namespace: row.namespace, name: row.name });
  const podTable = (
    fixed: { node?: string; labelSelector?: string },
    ns?: string,
  ) => (
    <ResourceTable
      compact
      clusterId={clusterId}
      gvr={GVRS.pod}
      namespace={ns ?? ''}
      fixed={fixed}
      onOpen={openPod}
      rowActions={(row) => podActions.render(row, { inline: 1 })}
    />
  );

  const items = object
    ? [
        {
          key: 'overview',
          label: t('pages.k8s.detail.tab.overview'),
          children: (
            <>
              <Overview
                clusterId={clusterId}
                gvr={gvr}
                data={data}
                onOpen={setChild}
              />
              {sameGVR(gvr, GVRS.node) && (
                <NodeHost clusterId={clusterId} ip={nodeInternalIP(object)} />
              )}
            </>
          ),
        },
        ...(hasPods
          ? [
              {
                key: 'pods',
                label: 'Pod',
                children: podTable(
                  { labelSelector: selector },
                  target.namespace,
                ),
              },
            ]
          : []),
        ...(sameGVR(gvr, GVRS.node)
          ? [
              {
                key: 'pods',
                label: 'Pod',
                children: podTable({ node: target.name }),
              },
            ]
          : []),
        ...(hasRelations
          ? [
              {
                key: 'relations',
                label: t('pages.k8s.detail.tab.relations'),
                children: (
                  <RelationsTab
                    clusterId={clusterId}
                    target={ref}
                    onOpen={(g, name) =>
                      setChild({ gvr: g, namespace: target.namespace, name })
                    }
                  />
                ),
              },
            ]
          : []),
        {
          key: 'events',
          label: t('pages.k8s.detail.tab.events'),
          children: <EventsTab clusterId={clusterId} target={ref} />,
        },
        ...(metricsTarget
          ? [
              {
                key: 'metrics',
                label: t('pages.k8s.detail.tab.metrics'),
                children: (
                  <MetricsPanel clusterId={clusterId} target={metricsTarget} />
                ),
              },
            ]
          : []),
        ...(canLog
          ? [
              {
                key: 'logs',
                label: t('pages.k8s.detail.tab.logs'),
                children: (
                  <LogViewer
                    clusterId={clusterId}
                    height="calc(100vh - 300px)"
                    target={
                      isPod
                        ? {
                            mode: 'pod' as const,
                            namespace: target.namespace ?? '',
                            pod: target.name,
                            containers,
                          }
                        : { mode: 'workload' as const, ref, containers }
                    }
                  />
                ),
              },
            ]
          : []),
        {
          key: 'yaml',
          label: 'YAML',
          children: (
            <YamlEditor
              value={data.yaml}
              readOnly
              height="calc(100vh - 220px)"
            />
          ),
        },
        ...(is(gvr, GVRS.deployment, GVRS.statefulSet, GVRS.daemonSet)
          ? [
              {
                key: 'revisions',
                label: t('pages.k8s.detail.tab.revisions'),
                children: (
                  <RevisionsTab
                    clusterId={clusterId}
                    target={ref}
                    onChanged={changed}
                  />
                ),
              },
            ]
          : []),
      ]
    : [];

  // 标题里的资源名走本地化；未知类型（CRD 等）展示原始 Kind / 资源名
  const title = `${kindName(data?.kind) || gvr.resource} / ${target.name}`;
  const extra = (
    <Flex gap={16} align="center">
      {object && (isPod || workloadKind) && (
        <AskAssistantButton
          clusterName={clusterName}
          kind={data?.kind ?? ''}
          namespace={target.namespace}
          name={target.name}
        />
      )}
      {object &&
        actions.render(
          {
            namespace: target.namespace,
            name: target.name,
            uid: data?.uid,
          },
          { object, inline: 3 },
        )}
      <Button icon={<ReloadOutlined />} onClick={() => void load()} />
    </Flex>
  );
  const content = (
    <>
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={error}
        />
      )}
      {loading && !data ? (
        <Spin style={{ display: 'block', margin: '80px auto' }} />
      ) : object ? (
        <Tabs
          activeKey={items.some((item) => item.key === tab) ? tab : 'overview'}
          onChange={setTab}
          destroyOnHidden
          items={items}
        />
      ) : (
        !error && <Empty />
      )}
      {actions.holder}
      {podActions.holder}
      {child && (
        <ResourceDetail
          key={`${child.gvr.resource}/${child.namespace}/${child.name}`}
          clusterId={clusterId}
          target={child}
          depth={depth + 1}
          onClose={() => setChild(undefined)}
          onChanged={changed}
        />
      )}
    </>
  );

  if (page) {
    return (
      <>
        <Flex
          justify="space-between"
          align="center"
          gap={16}
          wrap
          style={{ marginBottom: 12 }}
        >
          <Flex align="center" gap={8} style={{ minWidth: 0 }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={onClose}
              aria-label={t('common.action.back')}
            />
            <Typography.Title level={5} style={{ margin: 0 }} ellipsis>
              {title}
            </Typography.Title>
            {target.namespace && (
              <Typography.Text type="secondary">
                {target.namespace}
              </Typography.Text>
            )}
          </Flex>
          {extra}
        </Flex>
        {content}
      </>
    );
  }

  return (
    <Drawer
      open
      size={Math.max(760, 1120 - depth * 60)}
      destroyOnHidden
      title={title}
      onClose={onClose}
      extra={extra}
    >
      {content}
    </Drawer>
  );
};
