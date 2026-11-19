/** 持久卷声明：PersistentVolumeClaim */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [{ key: 'pvc', gvr: GVRS.pvc }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
