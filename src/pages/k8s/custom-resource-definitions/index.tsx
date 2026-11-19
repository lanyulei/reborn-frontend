/** 自定义资源定义：CustomResourceDefinition（集群级） */
import type React from 'react';
import { type KindDef, KindPage } from '../components/KindPage';
import { GVRS } from '../components/meta';

const KINDS: KindDef[] = [{ key: 'crd', gvr: GVRS.crd, namespaced: false }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
