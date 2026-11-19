/** 应用路由：Ingress */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [{ key: 'ingress', gvr: GVRS.ingress }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
