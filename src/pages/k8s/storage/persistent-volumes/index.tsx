/** 持久卷：PersistentVolume（集群级） */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [{ key: 'pv', gvr: GVRS.pv, namespaced: false }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
