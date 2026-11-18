/**
 * 查询结果展示（即时查询页与规则表单的数据预览共用）：截断 / 警告提示 + 折线图（区间查询）+
 * 序列表格（标签与最新值）。
 */
import { Alert, Table } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import type { QueryResult, QuerySeries } from '@/services/monitor/typings';
import { DATE_TIME_SECONDS_FORMAT } from '@/utils/format';
import { useT } from '@/utils/i18n';
import { formatValue, seriesName } from './format';
import { MAX_LINES, SeriesChart, useSeriesColors } from './SeriesChart';
import { useMonitorStyles } from './styles';

export const QueryResultView: React.FC<{
  result: QueryResult;
  /** 是否画折线图（区间查询） */
  chart?: boolean;
  /** 表格每页行数 */
  pageSize?: number;
}> = ({ result, chart, pageSize = 10 }) => {
  const t = useT();
  const { styles } = useMonitorStyles();
  const colors = useSeriesColors();
  const series = result.series ?? [];
  const rows = series.map((s, index) => ({ ...s, index }));

  return (
    <div>
      {result.truncated && (
        <Alert
          type="warning"
          showIcon
          title={t('pages.monitor.query.truncated')}
          style={{ marginBottom: 12 }}
        />
      )}
      {(result.warnings ?? []).map((warning) => (
        <Alert
          key={warning}
          type="warning"
          showIcon
          title={warning}
          style={{ marginBottom: 12 }}
        />
      ))}
      <div className={styles.hint} style={{ marginBottom: 8 }}>
        {t('pages.monitor.query.summary', {
          count: series.length,
          ms: result.durationMs ?? 0,
        })}
        {chart &&
          series.length > MAX_LINES &&
          ` · ${t('pages.monitor.query.chartLimit', { max: MAX_LINES })}`}
      </div>
      {chart && series.length > 0 && <SeriesChart series={series} />}
      <Table<QuerySeries & { index: number }>
        size="small"
        rowKey="index"
        style={{ marginTop: chart ? 12 : 0 }}
        dataSource={rows}
        pagination={
          rows.length > pageSize ? { pageSize, showSizeChanger: false } : false
        }
        scroll={{ x: 'max-content' }}
        columns={[
          {
            title: t('pages.monitor.query.column.series'),
            dataIndex: 'labels',
            render: (_, row) => (
              <span className={styles.code}>
                {chart && row.index < MAX_LINES && (
                  <span
                    className={styles.chartSwatch}
                    style={{
                      background: colors[row.index % colors.length],
                      marginInlineEnd: 8,
                      verticalAlign: 'middle',
                    }}
                  />
                )}
                {seriesName(row.labels)}
              </span>
            ),
          },
          {
            title: chart
              ? t('pages.monitor.query.column.latest')
              : t('pages.monitor.query.column.value'),
            width: 140,
            align: 'end',
            render: (_, row) => formatValue(row.points?.at(-1)?.value),
          },
          {
            title: t('pages.monitor.query.column.time'),
            width: 180,
            render: (_, row) => {
              const ts = Number(row.points?.at(-1)?.timestampMs);
              return Number.isFinite(ts) && ts > 0
                ? dayjs(ts).format(DATE_TIME_SECONDS_FORMAT)
                : t('common.empty');
            },
          },
        ]}
      />
    </div>
  );
};

export default QueryResultView;
