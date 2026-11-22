/**
 * 应用（Helm）：Release │ Helm 仓库。Release 在当前集群与命名空间内，仓库是平台级配置。
 * 两个页签的内容分别在 releases.tsx / repos.tsx。
 */
import type React from 'react';
import { useMemo } from 'react';
import { useT } from '@/utils/i18n';
import { K8sPage } from '../components/scope';
import { Releases } from './releases';
import { Repos } from './repos';

const AppPage: React.FC = () => {
  const t = useT();
  const tabs = useMemo(
    () => [
      { key: 'release', label: 'Release', render: () => <Releases /> },
      {
        key: 'repo',
        label: t('pages.k8s.app.tab.repo'),
        scope: 'none' as const,
        render: () => <Repos />,
      },
    ],
    [t],
  );
  return <K8sPage tabs={tabs} />;
};

export default AppPage;
