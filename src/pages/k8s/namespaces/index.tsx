/** 命名空间：列表、配额用量、创建 / 申请；配额与删除在行操作里 */
import type React from 'react';
import { useMemo } from 'react';
import { NamespaceList } from '../cluster';
import { K8sPage } from '../components/scope';

const Page: React.FC = () => {
  const tabs = useMemo(
    () => [
      {
        key: 'namespace',
        label: '',
        scope: 'cluster' as const,
        render: () => <NamespaceList />,
      },
    ],
    [],
  );
  return <K8sPage tabs={tabs} />;
};

export default Page;
