/** 工作负载：Deployment / StatefulSet / DaemonSet */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [
  { key: 'deployment', gvr: GVRS.deployment },
  { key: 'statefulset', gvr: GVRS.statefulSet },
  { key: 'daemonset', gvr: GVRS.daemonSet },
];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
