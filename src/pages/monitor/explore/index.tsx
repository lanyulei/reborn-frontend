/**
 * 即时查询（最小版，仅用于调试 PromQL，不是仪表盘）：选数据源、输入表达式、选即时 / 区间与
 * 时间，看返回的序列表格与一张折线图。支持查询参数 ?datasourceId=&expr=（告警详情
 * 「在即时查询中打开」带入），带参数进入时自动执行一次。
 */
import { useSearchParams } from '@umijs/max';
import { Card, Flex, Input, Segmented, Select } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { useT } from '@/utils/i18n';
import { METRIC_TABS } from '../components/groups';
import { useDatasourceOptions } from '../components/hooks';
import { MONITOR_LIMITS } from '../components/meta';
import { type QueryMode, QueryRunner } from '../components/QueryRunner';
import { useMonitorStyles } from '../components/styles';

const Explore: React.FC = () => {
  const t = useT();
  const { styles } = useMonitorStyles();
  const [searchParams] = useSearchParams();
  const initialDatasource = searchParams.get('datasourceId') ?? undefined;
  const initialExpr = searchParams.get('expr') ?? '';
  const { options, defaultId, loaded } = useDatasourceOptions();

  const [datasourceId, setDatasourceId] = useState(initialDatasource);
  const [expr, setExpr] = useState(initialExpr);
  const [mode, setMode] = useState<QueryMode>('range');
  // 带参数进入时自动执行一次；之后（切换模式会重建查询面板）不再自动执行半编辑的表达式
  const [autoRun, setAutoRun] = useState(
    Boolean(initialDatasource && initialExpr),
  );

  // 未带数据源参数时预选缺省数据源
  useEffect(() => {
    if (!datasourceId && defaultId) setDatasourceId(defaultId);
  }, [datasourceId, defaultId]);

  return (
    <RouteTabsPage tabs={METRIC_TABS}>
      <Card variant="outlined">
        <Flex gap={12} wrap align="center" style={{ marginBottom: 12 }}>
          <Select
            style={{ width: 280 }}
            showSearch={{ optionFilterProp: 'label' }}
            loading={!loaded}
            value={datasourceId}
            options={options}
            placeholder={t('pages.monitor.explore.datasource.placeholder')}
            onChange={setDatasourceId}
          />
          <Segmented<QueryMode>
            value={mode}
            options={[
              { value: 'range', label: t('pages.monitor.explore.mode.range') },
              {
                value: 'instant',
                label: t('pages.monitor.explore.mode.instant'),
              },
            ]}
            onChange={(next) => {
              setAutoRun(false);
              setMode(next);
            }}
          />
        </Flex>
        <Input.TextArea
          className={styles.codeInput}
          autoSize={{ minRows: 3, maxRows: 12 }}
          maxLength={MONITOR_LIMITS.exprMax}
          value={expr}
          placeholder={t('pages.monitor.explore.expr.placeholder')}
          onChange={(e) => setExpr(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <QueryRunner
          // 切换即时 / 区间时清掉上一种模式的结果
          key={mode}
          datasourceId={datasourceId}
          expr={expr}
          mode={mode}
          autoRun={autoRun}
        />
      </Card>
    </RouteTabsPage>
  );
};

export default Explore;
