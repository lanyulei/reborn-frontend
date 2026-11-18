/**
 * 安全策略：高危命令规则（快速执行的命令 / 脚本内容匹配）与全局策略（受保护环境、审批流程、主机数上限）。
 */
import { PageContainer } from '@ant-design/pro-components';
import { Card } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { useT } from '@/utils/i18n';
import { GlobalPolicy } from './GlobalPolicy';
import { RiskRules } from './RiskRules';

type TabKey = 'rules' | 'global';

const PolicyPage: React.FC = () => {
  const t = useT();
  const [tab, setTab] = useState<TabKey>('rules');
  return (
    <PageContainer
      title={false}
      tabList={[
        { key: 'rules', tab: t('pages.job.policy.tab.rules') },
        { key: 'global', tab: t('pages.job.policy.tab.global') },
      ]}
      tabActiveKey={tab}
      onTabChange={(key) => setTab(key as TabKey)}
    >
      {tab === 'rules' ? (
        <RiskRules />
      ) : (
        <Card variant="outlined">
          <GlobalPolicy />
        </Card>
      )}
    </PageContainer>
  );
};

export default PolicyPage;
