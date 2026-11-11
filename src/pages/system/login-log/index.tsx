import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Typography } from 'antd';
import React from 'react';
import { LOGIN_LOG_RESULT_META } from '@/constants';
import { listLoginLogs } from '@/services/system/loginLog';
import type { LoginLog, LoginLogResult } from '@/services/system/typings';
import { useT, useValueEnum } from '@/utils/i18n';
import { timeRangeColumn, toTableResult } from '@/utils/table';

/**
 * 登录日志：审计查询页（append-only 只读，无写操作）。
 * 日志由登录链路自动落库；用户名 / 登录结果 / 时间范围走服务端筛选，
 * 时间范围经 search.transform 转为后端要求的 RFC3339 时间戳。
 */
const LoginLogList: React.FC = () => {
  const t = useT();
  const resultEnum = useValueEnum(LOGIN_LOG_RESULT_META);

  const columns: ProColumns<LoginLog>[] = [
    {
      title: t('pages.system.user.column.username'),
      dataIndex: 'username',
      copyable: true,
      // 自动布局下按内容自适应，最窄 120px
      minWidth: 120,
      fieldProps: { placeholder: t('pages.system.user.column.username') },
    },
    {
      title: t('pages.system.loginLog.column.result'),
      dataIndex: 'result',
      valueEnum: resultEnum,
      minWidth: 120,
    },
    {
      title: t('pages.system.loginLog.column.ip'),
      dataIndex: 'ip',
      search: false,
      minWidth: 120,
      render: (_, record) => record.ip || t('common.dash'),
    },
    {
      title: 'User-Agent',
      dataIndex: 'userAgent',
      search: false,
      // 自动布局下吸收全部剩余宽度（width 100% + 单元格 maxWidth 0 是自动布局做省略的标准写法），
      // 单行省略、悬停气泡显示全文
      width: '100%',
      onCell: () => ({ style: { maxWidth: 0 } }),
      render: (_, record) =>
        record.userAgent ? (
          <Typography.Text ellipsis={{ tooltip: record.userAgent }}>
            {record.userAgent}
          </Typography.Text>
        ) : (
          t('common.dash')
        ),
    },
    {
      title: t('pages.system.loginLog.column.loginTime'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      minWidth: 180,
    },
    timeRangeColumn<LoginLog>(t, { start: 'startTime', end: 'endTime' }),
  ];

  return (
    <PageContainer title={false}>
      <ProTable<LoginLog>
        rowKey="id"
        // 自动布局：各列按内容自适应、以 minWidth 兜底（minWidth 仅在 auto 下生效）
        tableLayout="auto"
        search={{ labelWidth: 'auto' }}
        columns={columns}
        request={async (params) => {
          const result = await listLoginLogs({
            page: params.current,
            pageSize: params.pageSize,
            username: params.username || undefined,
            result: params.result as LoginLogResult | undefined,
            startTime: params.startTime,
            endTime: params.endTime,
          });
          return toTableResult(result);
        }}
      />
    </PageContainer>
  );
};

export default LoginLogList;
