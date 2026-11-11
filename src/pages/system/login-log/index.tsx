import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { LOGIN_LOG_RESULT_ENUM } from '@/constants';
import { listLoginLogs } from '@/services/system/loginLog';
import type { LoginLog, LoginLogResult } from '@/services/system/typings';

/**
 * 登录日志：审计查询页（append-only 只读，无写操作）。
 * 日志由登录链路自动落库；用户名 / 登录结果 / 时间范围走服务端筛选，
 * 时间范围经 search.transform 转为后端要求的 RFC3339 时间戳。
 */
const LoginLogList: React.FC = () => {
  const columns: ProColumns<LoginLog>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      copyable: true,
      // 自动布局下按内容自适应，最窄 120px
      minWidth: 120,
      fieldProps: { placeholder: '用户名' },
    },
    {
      title: '登录结果',
      dataIndex: 'result',
      valueEnum: LOGIN_LOG_RESULT_ENUM,
      minWidth: 120,
    },
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      search: false,
      minWidth: 120,
      render: (_, record) => record.ip || '-',
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
          '-'
        ),
    },
    {
      title: '登录时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      minWidth: 180,
    },
    {
      title: '时间范围',
      dataIndex: 'timeRange',
      valueType: 'dateTimeRange',
      hideInTable: true,
      search: {
        // 本地时间 → UTC ISO（RFC3339），映射为 startTime/endTime 查询参数
        transform: (value: [string, string]) => ({
          startTime: value?.[0] ? dayjs(value[0]).toISOString() : undefined,
          endTime: value?.[1] ? dayjs(value[1]).toISOString() : undefined,
        }),
      },
    },
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
          return {
            data: result.items,
            total: Number(result.total),
            success: true,
          };
        }}
      />
    </PageContainer>
  );
};

export default LoginLogList;
