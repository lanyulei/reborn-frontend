/** 容器组：Pod */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [{ key: 'pod', gvr: GVRS.pod }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
