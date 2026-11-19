/** 服务：Service */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [{ key: 'service', gvr: GVRS.service }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
