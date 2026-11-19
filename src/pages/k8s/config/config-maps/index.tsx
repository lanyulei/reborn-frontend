/** 配置字典：ConfigMap */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [{ key: 'configmap', gvr: GVRS.configMap }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
