/** 自动伸缩：HorizontalPodAutoscaler */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [{ key: 'hpa', gvr: GVRS.hpa }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
