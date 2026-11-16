/**
 * 流程配置：工作日历（按工作时间计的时限据此推算）、自动任务可调用的 Webhook 端点，
 * 以及其他系统接入用的凭据。
 */
import { PageContainer } from '@ant-design/pro-components';
import type React from 'react';
import { useState } from 'react';
import { useT } from '@/utils/i18n';
import { CalendarForm } from './Calendar';
import { Clients } from './Clients';
import { Webhooks } from './Webhooks';

type Tab = 'calendar' | 'webhook' | 'client';
const TABS: readonly Tab[] = ['calendar', 'webhook', 'client'];

const WorkflowConfig: React.FC = () => {
  const t = useT();
  const [tab, setTab] = useState<Tab>('calendar');
  return (
    <PageContainer
      title={false}
      tabList={TABS.map((key) => ({
        key,
        tab: t(`pages.workflow.config.tab.${key}`),
      }))}
      tabActiveKey={tab}
      onTabChange={(key) => setTab(key as Tab)}
    >
      {tab === 'calendar' && <CalendarForm />}
      {tab === 'webhook' && <Webhooks />}
      {tab === 'client' && <Clients />}
    </PageContainer>
  );
};

export default WorkflowConfig;
