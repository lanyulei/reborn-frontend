/** 服务账号：ServiceAccount */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [{ key: 'serviceaccount', gvr: GVRS.serviceAccount }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
