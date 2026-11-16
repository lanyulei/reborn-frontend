/**
 * 流程详情页（/workflow/instance/:id）：查看与处理一个流程实例。从流程监控进入，
 * 也可以直接用链接打开。
 */
import { PageContainer } from '@ant-design/pro-components';
import { history, useAccess, useParams } from '@umijs/max';
import type React from 'react';
import { InstanceDetail } from '../components/InstanceDetail';

const InstanceDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const access = useAccess();
  return (
    <PageContainer title={false}>
      <InstanceDetail
        // 换一个实例即整页重置
        key={id}
        instanceId={id}
        onBack={() => history.back()}
        // 管理动作（终止 / 改派等）随「流程监控」授权；处理动作（同意 / 拒绝等）的接口
        // 随「工单列表」授权
        manage={!!access.canWorkflowInstance}
        canHandle={!!access.canTicketMine}
      />
    </PageContainer>
  );
};

export default InstanceDetailPage;
