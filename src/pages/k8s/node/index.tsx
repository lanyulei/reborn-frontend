/** 节点：停止 / 恢复调度、排空、标签与污点在行操作与详情里 */
import type React from 'react';
import { type KindDef, KindPage } from '../components/KindPage';
import { GVRS } from '../components/meta';

const KINDS: KindDef[] = [
  { key: 'node', gvr: GVRS.node, namespaced: false, creatable: false },
];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
