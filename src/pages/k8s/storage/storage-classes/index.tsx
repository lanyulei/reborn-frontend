/** 存储类：StorageClass（集群级） */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [
  { key: 'storageclass', gvr: GVRS.storageClass, namespaced: false },
];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
