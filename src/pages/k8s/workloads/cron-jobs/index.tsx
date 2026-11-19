/** 定时任务：CronJob */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [{ key: 'cronjob', gvr: GVRS.cronJob }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
