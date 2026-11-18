/**
 * 告警事件详情页（深链 /monitor/alert/:id，通知里的「查看详情」指向这里）。
 * 路由不受监控告警菜单权限约束（登录即可进入）：事件的通知对象即使没有任何监控告警菜单
 * 也能打开，能否看到这一条由接口判定；事件不存在或无权查看时显示空状态。
 */
import { LeftOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useAccess, useParams } from '@umijs/max';
import { Button, Card } from 'antd';
import type React from 'react';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { useDatasourceOptions, useRuleGroups } from '../components/hooks';
import {
  AlertDetailView,
  canQuickMute,
  canQuickSubscribe,
} from './AlertDetail';

const AlertDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const t = useT();
  const access = useAccess();
  const has = usePermissions();
  // 分组与数据源只服务于「屏蔽」「订阅」快捷入口：没有相应权限（这两个接口也无权）时不请求——
  // 仅作为通知对象打开本页的用户，除事件详情外的监控告警接口一概调不通
  const canQuick = canQuickMute(access, has) || canQuickSubscribe(access, has);
  const { groups, isAdmin } = useRuleGroups(canQuick);
  const datasources = useDatasourceOptions(undefined, canQuick);
  return (
    <PageContainer title={false}>
      {/* 仅作为通知对象打开（没有告警事件菜单权限）时不提供返回列表 */}
      {access.canMonitorAlert && (
        <Button
          type="link"
          icon={<LeftOutlined />}
          style={{ paddingInline: 0, marginBottom: 12 }}
          onClick={() => history.push('/monitor/alert')}
        >
          {t('pages.monitor.alert.backToList')}
        </Button>
      )}
      <Card variant="outlined">
        <AlertDetailView
          key={id}
          id={id}
          groups={groups}
          isAdmin={isAdmin}
          datasources={datasources}
        />
      </Card>
    </PageContainer>
  );
};

export default AlertDetailPage;
