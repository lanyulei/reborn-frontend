/** 角色：Role（命名空间级）/ ClusterRole（集群级） */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [
  { key: 'role', gvr: GVRS.role },
  { key: 'clusterrole', gvr: GVRS.clusterRole, namespaced: false },
];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
