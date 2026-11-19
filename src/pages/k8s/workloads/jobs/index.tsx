/** 任务：Job */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [{ key: 'job', gvr: GVRS.job }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
