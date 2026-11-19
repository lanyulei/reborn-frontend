/**
 * 一个菜单页 = 一类（或并列的几类）资源：每类是同一套通用资源视图（列表 + 详情 + 操作 + 创建）。
 * 并列的几类用页头页签切换（?tab=），页签名取资源名的本地化文案（如 部署 / 有状态副本集 / 守护进程集）。
 */
import type React from 'react';
import { useMemo } from 'react';
import type { GVR } from '@/services/k8s/typings';
import { kindOf, useKindName } from './meta';
import { ResourceView } from './ResourceView';
import { K8sPage } from './scope';

export interface KindDef {
  /** 页签键（?tab=） */
  key: string;
  gvr: GVR;
  /** 集群级资源传 false；缺省命名空间级 */
  namespaced?: boolean;
  creatable?: boolean;
}

export const KindPage: React.FC<{ kinds: KindDef[] }> = ({ kinds }) => {
  const kindName = useKindName();
  const tabs = useMemo(
    () =>
      kinds.map((kind) => ({
        key: kind.key,
        label: kindName(kindOf(kind.gvr)) || kind.key,
        scope:
          kind.namespaced === false
            ? ('cluster' as const)
            : ('namespace' as const),
        render: () => (
          <ResourceView
            gvr={kind.gvr}
            namespaced={kind.namespaced !== false}
            creatable={kind.creatable}
          />
        ),
      })),
    [kinds, kindName],
  );
  return <K8sPage tabs={tabs} />;
};
