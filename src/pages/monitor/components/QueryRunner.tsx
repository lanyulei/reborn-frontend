/**
 * 查询执行面板（即时查询页与规则表单的数据预览共用）：时间控件 + 「执行查询」+ 结果。
 * 数据源与表达式由调用方给出；即时查询取某一时刻的值，区间查询取一段时间并画折线图。
 */
import { PlayCircleOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  DatePicker,
  Flex,
  InputNumber,
  Select,
  Spin,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  queryDatasource,
  queryDatasourceRange,
} from '@/services/monitor/datasource';
import { getMonitorErrorMessage } from '@/services/monitor/request';
import type { QueryResult } from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import { QueryResultView } from './QueryResultView';

export type QueryMode = 'instant' | 'range';

/** 快捷时间范围（秒） */
const RANGES = [300, 900, 3600, 10800, 21600, 43200, 86400, 172800, 604800];
const CUSTOM = -1;
/** 后端限制 (end - start) / step ≤ 11000；自动步长按约 300 个点取整 */
const MAX_POINTS = 11000;
const autoStep = (spanS: number) => Math.max(15, Math.ceil(spanS / 300));

export const QueryRunner: React.FC<{
  datasourceId?: string;
  expr?: string;
  mode: QueryMode;
  /** 挂载时若数据源与表达式齐全则自动执行一次（带参数跳转进来） */
  autoRun?: boolean;
}> = ({ datasourceId, expr, mode, autoRun }) => {
  const t = useT();
  const [rangeS, setRangeS] = useState(3600);
  const [custom, setCustom] = useState<[Dayjs, Dayjs] | null>(null);
  const [instant, setInstant] = useState<Dayjs | null>(null);
  const [stepS, setStepS] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ data: QueryResult; chart: boolean }>();
  const [error, setError] = useState<string>();
  // 只采纳最后一次查询的结果
  const seq = useRef(0);

  const query = expr?.trim();
  const ready = Boolean(datasourceId && query);

  const run = async () => {
    if (!datasourceId || !query) return;
    const current = ++seq.current;
    setLoading(true);
    setError(undefined);
    try {
      let data: QueryResult;
      if (mode === 'instant') {
        data = await queryDatasource({
          datasourceId,
          expr: query,
          time: instant?.toISOString(),
        });
      } else {
        const end = rangeS === CUSTOM && custom ? custom[1] : dayjs();
        const start =
          rangeS === CUSTOM && custom
            ? custom[0]
            : end.subtract(rangeS, 'second');
        const span = Math.max(1, end.diff(start, 'second'));
        data = await queryDatasourceRange({
          datasourceId,
          expr: query,
          start: start.toISOString(),
          end: end.toISOString(),
          // 手填步长过小时抬到点数上限以内
          stepS: Math.max(
            stepS ?? autoStep(span),
            Math.ceil(span / MAX_POINTS),
          ),
        });
      }
      if (current === seq.current) {
        setResult({ data, chart: mode === 'range' });
      }
    } catch (e) {
      if (current === seq.current) {
        setResult(undefined);
        setError(getMonitorErrorMessage(e));
      }
    } finally {
      if (current === seq.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRun && ready) void run();
  }, []);

  return (
    <div>
      <Flex gap={8} wrap align="center" style={{ marginBottom: 12 }}>
        {mode === 'instant' ? (
          <DatePicker
            showTime
            value={instant}
            placeholder={t('pages.monitor.query.time.now')}
            onChange={(value) => setInstant(value)}
          />
        ) : (
          <>
            <Select<number>
              style={{ width: 160 }}
              value={rangeS}
              options={[
                ...RANGES.map((seconds) => ({
                  value: seconds,
                  label: t(`pages.monitor.query.range.${seconds}`),
                })),
                { value: CUSTOM, label: t('pages.monitor.query.range.custom') },
              ]}
              onChange={setRangeS}
            />
            {rangeS === CUSTOM && (
              <DatePicker.RangePicker
                showTime
                allowClear={false}
                value={custom}
                onChange={(range) =>
                  setCustom(
                    range?.[0] && range[1] ? [range[0], range[1]] : null,
                  )
                }
              />
            )}
            <InputNumber
              style={{ width: 160 }}
              min={1}
              max={86400}
              precision={0}
              value={stepS}
              placeholder={t('pages.monitor.query.step.auto')}
              prefix={t('pages.monitor.query.step')}
              suffix={t('pages.monitor.unit.second')}
              onChange={(value) => setStepS(value)}
            />
          </>
        )}
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={loading}
          disabled={
            !ready || (rangeS === CUSTOM && mode === 'range' && !custom)
          }
          onClick={() => void run()}
        >
          {t('pages.monitor.query.run')}
        </Button>
      </Flex>
      {error && (
        <Alert
          type="error"
          showIcon
          title={t('pages.monitor.query.failed')}
          description={error}
          style={{ marginBottom: 12 }}
        />
      )}
      <Spin spinning={loading}>
        {result && (
          <QueryResultView result={result.data} chart={result.chart} />
        )}
      </Spin>
    </div>
  );
};

export default QueryRunner;
