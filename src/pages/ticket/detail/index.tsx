/**
 * 工单详情页（/ticket/detail/:id）：查看与处理一张工单。从工单列表、全部工单进入，
 * 也可以直接用链接打开。
 */
import { PageContainer } from '@ant-design/pro-components';
import { history, useAccess, useParams } from '@umijs/max';
import type React from 'react';
import { TicketDetail } from '../components/TicketDetail';

const TicketDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const access = useAccess();
  return (
    <PageContainer title={false}>
      <TicketDetail
        // 换一张工单即整页重置
        key={id}
        ticketId={id}
        onBack={() => history.back()}
        // 管理动作（终止 / 改派）随「全部工单」授权，处理动作随「工单列表」授权
        manage={!!access.canTicketAll}
        canHandle={!!access.canTicketMine}
      />
    </PageContainer>
  );
};

export default TicketDetailPage;
