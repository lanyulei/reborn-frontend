/** 角色绑定：RoleBinding（命名空间级）/ ClusterRoleBinding（集群级） */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [
  { key: 'rolebinding', gvr: GVRS.roleBinding },
  {
    key: 'clusterrolebinding',
    gvr: GVRS.clusterRoleBinding,
    namespaced: false,
  },
];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
