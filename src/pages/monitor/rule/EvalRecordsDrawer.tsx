/**
 * 规则判定记录抽屉：回答「为什么告警 / 为什么没告警」。上方是规则在各数据源上的当前评估状态，
 * 下方是逐轮记录（保留 7 天）——查询返回多少条序列、判为异常 / 恢复多少条、耗时、错误原文；
 * 展开一行可看每条查询的执行情况，以及每个异常点停在哪一步（待触发 / 已触发 / 被屏蔽 / 被抑制…）。
 */
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import { Alert, Drawer, Table, Tag, Tooltip } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import {
  isIncompleteResult,
  isPartialQuery,
  upstreamErrorText,
} from '@/services/monitor/errorText';
import { getRule, listRuleEvalRecords } from '@/services/monitor/rule';
import type {
  EvalPoint,
  EvalQueryDetail,
  MonitorEvalStatus,
  MonitorRule,
  RuleEvalRecord,
  RuleEvalTask,
} from '@/services/monitor/typings';
import { useEnumText, useT, useValueEnum } from '@/utils/i18n';
import { timeRangeColumn, toTableResult } from '@/utils/table';
import { formatTime } from '../components/format';
import { EVAL_STATUS_META, EVAL_STEP_META } from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { LabelTags, SeverityTag } from '../components/tags';

/** 判定记录里不会出现「未评估」 */
const { 0: _unevaluated, ...RECORD_STATUS_META } = EVAL_STATUS_META;

export const EvalRecordsDrawer: React.FC<{
  rule: MonitorRule;
  onClose: () => void;
}> = ({ rule, onClose }) => {
  const t = useT();
  const { styles } = useMonitorStyles();
  const recordStatusEnum = useValueEnum(RECORD_STATUS_META);
  const statusText = useEnumText(EVAL_STATUS_META);
  const [tasks, setTasks] = useState<RuleEvalTask[]>([]);
  /** 「结果不完整」标记：查询成功但序列被截断 / 数据源只返回了部分结果，没返回的序列保持原状态 */
  const incompleteTag = (
    <Tooltip title={t('pages.monitor.rule.eval.incomplete.tooltip')}>
      <Tag color="warning" style={{ marginInlineStart: 8 }}>
        {t('pages.monitor.rule.eval.incomplete')}
      </Tag>
    </Tooltip>
  );

  useEffect(() => {
    getRule(rule.id)
      .then((result) => setTasks(result.rule.evalTasks ?? []))
      .catch(() => undefined);
  }, [rule.id]);

  const columns: ProColumns<RuleEvalRecord>[] = [
    {
      title: t('pages.monitor.rule.eval.column.time'),
      dataIndex: 'evalTime',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    timeRangeColumn<RuleEvalRecord>(t, {
      start: 'evalTimeStart',
      end: 'evalTimeEnd',
    }),
    {
      title: t('pages.monitor.common.datasource'),
      dataIndex: 'datasourceId',
      valueType: 'select',
      fieldProps: {
        options: tasks.map((task) => ({
          value: task.datasourceId,
          label: task.datasourceName || task.datasourceId,
        })),
      },
      render: (_, record) => record.datasourceName || t('common.empty'),
    },
    {
      title: t('pages.monitor.rule.eval.column.status'),
      dataIndex: 'status',
      valueEnum: recordStatusEnum,
      width: 120,
      render: (dom, record) => (
        <>
          {dom}
          {isIncompleteResult(record.error, record.status) && incompleteTag}
        </>
      ),
    },
    {
      title: t('pages.monitor.rule.eval.column.series'),
      dataIndex: 'series',
      search: false,
      width: 90,
      renderText: (value?: number) => value ?? 0,
    },
    {
      title: t('pages.monitor.rule.eval.column.anomalies'),
      dataIndex: 'anomalies',
      search: false,
      width: 90,
      renderText: (value?: number) => value ?? 0,
    },
    {
      title: t('pages.monitor.rule.eval.column.recovered'),
      dataIndex: 'recovered',
      search: false,
      width: 90,
      renderText: (value?: number) => value ?? 0,
    },
    {
      title: t('pages.monitor.rule.eval.column.duration'),
      dataIndex: 'durationMs',
      search: false,
      width: 90,
      renderText: (value?: number) => `${value ?? 0} ms`,
    },
    {
      title: t('pages.monitor.rule.eval.column.error'),
      dataIndex: 'error',
      search: false,
      ellipsis: true,
      renderText: (value?: string) =>
        upstreamErrorText(value) || t('common.empty'),
    },
  ];

  const expanded = (record: RuleEvalRecord) => (
    <div>
      {record.error && (
        <Alert
          type={
            isIncompleteResult(record.error, record.status)
              ? 'warning'
              : 'error'
          }
          showIcon
          title={upstreamErrorText(record.error)}
          style={{ marginBottom: 12 }}
        />
      )}
      <Table<EvalQueryDetail>
        size="small"
        rowKey={(row) => row.index ?? 0}
        pagination={false}
        dataSource={record.queries ?? []}
        columns={[
          {
            title: t('pages.monitor.rule.eval.query'),
            width: 120,
            // 记录里只有查询的序号与级别，没有当时的表达式：不拿规则现在的表达式顶替
            render: (_, row) =>
              t('pages.monitor.rule.eval.query.index', {
                n: (row.index ?? 0) + 1,
              }),
          },
          {
            title: t('pages.monitor.alert.column.severity'),
            width: 90,
            render: (_, row) => <SeverityTag severity={row.severity} />,
          },
          {
            title: t('pages.monitor.rule.eval.column.series'),
            width: 200,
            render: (_, row) => (
              <>
                {row.series ?? 0}
                {row.truncated && (
                  <Tag color="warning" style={{ marginInlineStart: 8 }}>
                    {t('pages.monitor.rule.eval.truncated')}
                  </Tag>
                )}
                {isPartialQuery(row.error) && (
                  <Tag color="warning" style={{ marginInlineStart: 8 }}>
                    {t('pages.monitor.rule.eval.partial')}
                  </Tag>
                )}
              </>
            ),
          },
          {
            title: t('pages.monitor.rule.eval.column.error'),
            // 「部分结果」不是出错：已在序列数旁标出
            render: (_, row) =>
              (!isPartialQuery(row.error) && upstreamErrorText(row.error)) ||
              t('common.empty'),
          },
        ]}
      />
      {(record.queries ?? []).length > 0 && (
        <div className={styles.hint} style={{ marginTop: 8 }}>
          {t('pages.monitor.rule.eval.query.note')}
        </div>
      )}
      {(record.points ?? []).length > 0 && (
        <Table<EvalPoint>
          size="small"
          style={{ marginTop: 12 }}
          rowKey={(row) => `${row.fingerprint}-${row.severity}`}
          pagination={false}
          dataSource={record.points ?? []}
          columns={[
            {
              title: t('pages.monitor.alert.column.labels'),
              render: (_, row) => <LabelTags labels={row.labels} max={4} />,
            },
            {
              title: t('pages.monitor.alert.column.severity'),
              width: 90,
              render: (_, row) => <SeverityTag severity={row.severity} />,
            },
            {
              title: t('pages.monitor.alert.column.value'),
              dataIndex: 'value',
              width: 110,
            },
            {
              title: t('pages.monitor.rule.eval.step'),
              width: 220,
              render: (_, row) => {
                const meta = row.step && EVAL_STEP_META[row.step];
                return (
                  <>
                    {meta ? (
                      <Tag color={meta.color}>{t(meta.textId)}</Tag>
                    ) : (
                      row.step || t('common.empty')
                    )}
                    {row.alertId && (
                      <Link to={`/monitor/alert/${row.alertId}`}>
                        {t('pages.monitor.rule.eval.viewAlert')}
                      </Link>
                    )}
                    {/* 被抑制规则 / 拓扑抑制拦下时：造成抑制的源告警 */}
                    {row.inhibitAlertId && (
                      <Link
                        to={`/monitor/alert/${row.inhibitAlertId}`}
                        style={{ marginInlineStart: row.alertId ? 8 : 0 }}
                      >
                        {t('pages.monitor.rule.eval.viewInhibitor')}
                      </Link>
                    )}
                  </>
                );
              },
            },
          ]}
        />
      )}
      {record.pointsTruncated && (
        <div className={styles.hint} style={{ marginTop: 8 }}>
          {t('pages.monitor.rule.eval.pointsTruncated')}
        </div>
      )}
    </div>
  );

  return (
    <Drawer
      title={t('pages.monitor.rule.eval.drawer', { name: rule.spec.name })}
      size={1080}
      open
      destroyOnHidden
      onClose={onClose}
    >
      <SectionTitle>{t('pages.monitor.rule.eval.tasks')}</SectionTitle>
      <Table<RuleEvalTask>
        size="small"
        rowKey="datasourceId"
        pagination={false}
        dataSource={tasks}
        columns={[
          {
            title: t('pages.monitor.common.datasource'),
            dataIndex: 'datasourceName',
            render: (_, row) => row.datasourceName || row.datasourceId,
          },
          {
            title: t('pages.monitor.rule.eval.column.status'),
            width: 220,
            render: (_, row) => (
              <>
                {statusText(row.lastStatus ?? 0)}
                {isIncompleteResult(row.lastError, row.lastStatus) &&
                  incompleteTag}
              </>
            ),
          },
          {
            title: t('pages.monitor.rule.column.firing'),
            dataIndex: 'firingCount',
            width: 100,
            render: (_, row) => row.firingCount ?? 0,
          },
          {
            title: t('pages.monitor.rule.eval.column.time'),
            width: 170,
            render: (_, row) =>
              formatTime(row.lastEvalTime) || t('common.empty'),
          },
          {
            title: t('pages.monitor.rule.eval.nextTime'),
            width: 170,
            render: (_, row) =>
              formatTime(row.nextEvalTime) || t('common.empty'),
          },
          {
            title: t('pages.monitor.rule.eval.column.error'),
            render: (_, row) =>
              upstreamErrorText(row.lastError) || t('common.empty'),
          },
        ]}
      />

      <SectionTitle>{t('pages.monitor.rule.eval.records')}</SectionTitle>
      <ProTable<RuleEvalRecord>
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        options={false}
        columns={columns}
        columnEmptyText={t('common.empty')}
        scroll={{ x: 'max-content' }}
        expandable={{
          expandedRowRender: expanded,
          rowExpandable: (record) =>
            (record.queries ?? []).length > 0 ||
            (record.points ?? []).length > 0,
        }}
        pagination={{ defaultPageSize: 20 }}
        request={async (params) =>
          toTableResult(
            await listRuleEvalRecords(rule.id, {
              page: params.current,
              pageSize: params.pageSize,
              datasourceId: params.datasourceId || undefined,
              status: params.status
                ? (Number(params.status) as Exclude<MonitorEvalStatus, 0>)
                : undefined,
              evalTimeStart: params.evalTimeStart,
              evalTimeEnd: params.evalTimeEnd,
            }),
          )
        }
      />
    </Drawer>
  );
};

export default EvalRecordsDrawer;
