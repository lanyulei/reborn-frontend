/**
 * 目标主机清单（预览目标主机、执行前确认共用）：紧凑表格，不能执行的主机排在最前并高亮，
 * 上方给出数量汇总。
 */
import { Table, Tag } from 'antd';
import type React from 'react';
import { useMemo } from 'react';
import type { JobHostProblem, JobTargetHost } from '@/services/job/typings';
import { useT } from '@/utils/i18n';
import { HOST_PROBLEM_TEXT_ID } from './meta';
import { useJobStyles } from './styles';

/** 主机数量汇总：总数 / 可执行 / 有问题 */
export const summarizeHosts = (hosts: readonly JobTargetHost[]) => {
  const problems = hosts.filter((host) => host.problem).length;
  return { total: hosts.length, runnable: hosts.length - problems, problems };
};

export const HostTable: React.FC<{
  hosts: readonly JobTargetHost[];
  /** 每页行数，缺省 10 */
  pageSize?: number;
}> = ({ hosts, pageSize = 10 }) => {
  const t = useT();
  const { styles } = useJobStyles();
  // 有问题的排在最前（稳定排序，其余保持后端顺序）
  const rows = useMemo(
    () =>
      [...hosts].sort(
        (a, b) => Number(Boolean(b.problem)) - Number(Boolean(a.problem)),
      ),
    [hosts],
  );
  return (
    <Table<JobTargetHost>
      size="small"
      rowKey="ciId"
      dataSource={rows}
      rowClassName={(record) => (record.problem ? styles.problemRow : '')}
      pagination={
        rows.length > pageSize
          ? { pageSize, size: 'small', showSizeChanger: false }
          : false
      }
      columns={[
        {
          title: t('pages.job.host.column.name'),
          dataIndex: 'name',
          ellipsis: true,
          render: (value?: string) => value || t('common.empty'),
        },
        {
          title: t('pages.job.host.column.env'),
          dataIndex: 'env',
          width: 110,
          render: (value?: string) => value || t('common.empty'),
        },
        {
          title: t('pages.job.host.column.address'),
          dataIndex: 'address',
          ellipsis: true,
          render: (value?: string) =>
            value ? (
              <span className={styles.code}>{value}</span>
            ) : (
              t('common.empty')
            ),
        },
        {
          title: t('pages.job.host.column.problem'),
          dataIndex: 'problem',
          width: 170,
          render: (value?: JobHostProblem | '') =>
            value ? (
              <Tag color="error" style={{ marginInlineEnd: 0 }}>
                {HOST_PROBLEM_TEXT_ID[value]
                  ? t(HOST_PROBLEM_TEXT_ID[value])
                  : value}
              </Tag>
            ) : (
              <Tag color="success" style={{ marginInlineEnd: 0 }}>
                {t('pages.job.host.runnable')}
              </Tag>
            ),
        },
      ]}
    />
  );
};
