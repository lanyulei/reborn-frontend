/** 网络策略：NetworkPolicy */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [{ key: 'networkpolicy', gvr: GVRS.networkPolicy }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
