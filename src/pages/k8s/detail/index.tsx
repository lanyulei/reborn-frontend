/**
 * 资源详情页：/k8s/detail/:group/:version/:resource/:namespace/:name?cluster=<id>[&tab=]
 * - group 为核心组时写 `-`，集群级资源的 namespace 写 `-`；
 * - 工作负载（部署 / 有状态副本集 / 守护进程集）、节点、命名空间各有专门的详情页，
 *   其余资源走通用资源详情（./resource，按类型给出不同的基本信息与页签）；
 */
import { Link, useParams, useSearchParams } from '@umijs/max';
import type React from 'react';
import { useMemo } from 'react';
import type { GVR } from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { DETAIL_NONE, GVRS, kindOf, sameGVR } from '../components/meta';
import { K8sPage, useK8sScope } from '../components/scope';
import type { WorkloadKind } from '../forms/workload/types';
import NamespaceDetail from './namespace';
import NodeDetail from './node';
import { listPageOf } from './parents';
import ResourceDetailPage from './resource';
import WorkloadDetail from './workload';

const WORKLOAD_KINDS: readonly string[] = [
  'Deployment',
  'StatefulSet',
  'DaemonSet',
] satisfies WorkloadKind[];

const NONE = DETAIL_NONE;
const part = (value?: string): string =>
  !value || value === NONE ? '' : value;

const Body: React.FC<{
  gvr: GVR;
  namespace?: string;
  name: string;
  tab?: string;
}> = ({ gvr, namespace, name, tab }) => {
  const scope = useK8sScope();

  const kind = kindOf(gvr);
  const key = `${gvr.group}/${gvr.resource}/${namespace}/${name}`;
  if (kind && WORKLOAD_KINDS.includes(kind) && namespace) {
    return (
      <WorkloadDetail
        key={key}
        clusterId={scope.clusterId}
        gvr={gvr}
        kind={kind as WorkloadKind}
        namespace={namespace}
        name={name}
      />
    );
  }
  if (sameGVR(gvr, GVRS.node)) {
    return (
      <NodeDetail key={key} clusterId={scope.clusterId} name={name} tab={tab} />
    );
  }
  if (sameGVR(gvr, GVRS.namespace)) {
    return (
      <NamespaceDetail
        key={key}
        clusterId={scope.clusterId}
        name={name}
        tab={tab}
      />
    );
  }

  return (
    <ResourceDetailPage
      key={key}
      clusterId={scope.clusterId}
      gvr={gvr}
      namespace={namespace}
      name={name}
      tab={tab}
    />
  );
};

const DetailPage: React.FC = () => {
  const t = useT();
  const params = useParams<{
    group: string;
    version: string;
    resource: string;
    namespace: string;
    name: string;
  }>();
  const [query] = useSearchParams();
  const gvr = useMemo(
    () => ({
      group: part(params.group),
      version: params.version ?? '',
      resource: params.resource ?? '',
    }),
    [params.group, params.version, params.resource],
  );
  const namespace = part(params.namespace) || undefined;
  const name = params.name ?? '';
  const tab = query.get('tab') ?? undefined;

  // 面包屑：容器平台 / 所在列表页（保留集群与命名空间作用域）/ 资源详情
  const breadcrumbItems = useMemo(() => {
    const listPage = listPageOf(gvr);
    const listQuery = new URLSearchParams({
      cluster: query.get('cluster') ?? '',
    });
    if (namespace) listQuery.set('ns', namespace);
    return [
      { title: t('menu.k8s') },
      {
        title: (
          <Link to={`${listPage.path}?${listQuery.toString()}`}>
            {t(listPage.menuKey)}
          </Link>
        ),
      },
      { title: name || t('menu.k8s.detail') },
    ];
  }, [gvr, name, namespace, query, t]);

  const tabs = useMemo(
    () => [
      {
        key: 'detail',
        label: '',
        scope: 'cluster' as const,
        render: () => (
          <Body gvr={gvr} namespace={namespace} name={name} tab={tab} />
        ),
      },
    ],
    [gvr, namespace, name, tab],
  );
  return <K8sPage breadcrumb={{ items: breadcrumbItems }} tabs={tabs} />;
};

export default DetailPage;
