/** 保密字典：Secret。值默认掩码，持有权限时可在详情里查看明文（记入审计） */
import type React from 'react';
import { type KindDef, KindPage } from '../../components/KindPage';
import { GVRS } from '../../components/meta';

const KINDS: KindDef[] = [{ key: 'secret', gvr: GVRS.secret }];

const Page: React.FC = () => <KindPage kinds={KINDS} />;

export default Page;
