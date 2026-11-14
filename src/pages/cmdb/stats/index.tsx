/**
 * 运营统计：四张统计卡 + 按模型 / 状态 / 环境 / 来源的分布 + 近 N 天变更趋势。
 * 概览接口为增强能力（旧后端 / 未授权角色可能 404 / 403）：失败时降级为用模型目录
 * 与关联类型拼出的基础统计（模型数 / 资源数 / 关联数 / 按模型分布）并给出提示，
 * 不影响其他页面；天数范围 7 / 30 / 90。
 */
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Alert,
  Card,
  Col,
  Row,
  Segmented,
  Spin,
  Table,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { getOverview, getQuality } from '@/services/cmdb/insight';
import { listAllModels, listRelationTypes } from '@/services/cmdb/model';
import type {
  CmdbCIStatus,
  CmdbOverview,
  CmdbQualityIssue,
  CmdbQualityRow,
} from '@/services/cmdb/typings';
import { useEnumText, useT } from '@/utils/i18n';
import {
  BarList,
  StatCard,
  TrendChart,
  type TrendPoint,
} from '../components/charts';
import { ModelGlyph } from '../components/icons';
import { CMDB_CI_STATUS_META } from '../components/meta';
import { useCmdbStyles } from '../components/styles';

/** 数据质量各问题列：问题类别 → 计数字段 */
const QUALITY_ISSUES: {
  issue: CmdbQualityIssue;
  field: 'missingRequired' | 'noOwner' | 'orphan' | 'stale' | 'outdated';
}[] = [
  { issue: 'missing_required', field: 'missingRequired' },
  { issue: 'no_owner', field: 'noOwner' },
  { issue: 'orphan', field: 'orphan' },
  { issue: 'stale', field: 'stale' },
  { issue: 'outdated', field: 'outdated' },
];

const StatsPage: React.FC = () => {
  const t = useT();
  const { styles } = useCmdbStyles();
  const statusText = useEnumText(CMDB_CI_STATUS_META);
  const [days, setDays] = useState<'7' | '30' | '90'>('30');
  const [loading, setLoading] = useState(true);
  // failed 且有 data = 降级：只有模型数 / 资源数 / 关联数 / 按模型分布
  const [data, setData] = useState<Partial<CmdbOverview> | null>(null);
  const [failed, setFailed] = useState(false);
  // 数据质量：独立加载（接口不可用 / 未授权时整块不展示）
  const [quality, setQuality] = useState<{
    items: CmdbQualityRow[];
    outdatedDays: number;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    getQuality()
      .then((res) => {
        if (!cancelled)
          setQuality({
            items: res.items ?? [],
            outdatedDays: res.outdatedDays ?? 180,
          });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    getOverview(Number(days))
      .then((overview) => {
        if (!cancelled) setData(overview);
      })
      .catch(async () => {
        // 概览接口不可用（旧后端 / 未授权）：用模型目录与关联类型拼出基础统计
        try {
          const [modelsRes, relRes] = await Promise.all([
            listAllModels(),
            listRelationTypes(),
          ]);
          if (cancelled) return;
          const sum = (list: (string | undefined)[]) =>
            String(list.reduce((n, v) => n + Number(v ?? 0), 0));
          setData({
            modelCount: String(modelsRes.items.length),
            ciCount: sum(modelsRes.items.map((m) => m.ciCount)),
            relationCount: sum(relRes.items.map((r) => r.relationCount)),
            byModel: modelsRes.items
              .map((m) => ({
                key: m.code,
                name: m.name,
                count: m.ciCount ?? '0',
              }))
              .sort((a, b) => Number(b.count) - Number(a.count)),
          });
          setFailed(true);
        } catch {
          if (!cancelled) {
            setData(null);
            setFailed(true);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  // 趋势点：逐日动作计数聚合为 {date, byAction}
  const points = useMemo<TrendPoint[]>(() => {
    const byDate = new Map<string, Record<string, number>>();
    for (const p of data?.trend ?? []) {
      const actions = byDate.get(p.date) ?? {};
      actions[p.action] = (actions[p.action] ?? 0) + Number(p.count);
      byDate.set(p.date, actions);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, byAction]) => ({ date, byAction }));
  }, [data]);

  const barItems = (dim: 'byModel' | 'byStatus' | 'byEnv' | 'bySource') =>
    (data?.[dim] ?? []).map((c) => ({
      key: c.key,
      label:
        dim === 'byStatus'
          ? statusText(c.key as CmdbCIStatus)
          : dim === 'byEnv'
            ? c.key || t('pages.cmdb.stats.envEmpty')
            : dim === 'bySource'
              ? c.key === 'manual'
                ? t('pages.cmdb.detail.source.manual')
                : c.name || c.key
              : c.name || c.key,
      count: Number(c.count),
    }));

  const statCards = data && (
    <div className={styles.statGrid}>
      <StatCard
        label={t('pages.cmdb.stats.modelCount')}
        value={Number(data.modelCount)}
        icon={<ModelGlyph icon="cube" size={26} />}
      />
      <StatCard
        label={t('pages.cmdb.stats.ciCount')}
        value={Number(data.ciCount)}
        icon={<ModelGlyph icon="server" size={26} />}
      />
      <StatCard
        label={t('pages.cmdb.stats.relationCount')}
        value={Number(data.relationCount)}
        icon={<ModelGlyph icon="network" size={26} />}
      />
      {data.changeCount !== undefined && (
        <StatCard
          label={t('pages.cmdb.stats.changeCount', {
            days: data.days ?? Number(days),
          })}
          value={Number(data.changeCount)}
          icon={<ModelGlyph icon="monitor" size={26} />}
        />
      )}
    </div>
  );

  return (
    <PageContainer title={false}>
      {!failed && (
        <div className={styles.toolbar}>
          <span>{t('pages.cmdb.stats.days')}</span>
          <Segmented
            value={days}
            onChange={(v) => setDays(v as '7' | '30' | '90')}
            options={[
              { value: '7', label: '7' },
              { value: '30', label: '30' },
              { value: '90', label: '90' },
            ]}
          />
        </div>
      )}
      {loading ? (
        <div style={{ padding: 96, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : !data ? (
        <Alert type="info" showIcon title={t('pages.cmdb.stats.unavailable')} />
      ) : failed ? (
        <>
          <Alert
            type="warning"
            showIcon
            title={t('pages.cmdb.stats.partial')}
            style={{ marginBottom: 16 }}
          />
          {statCards}
          <Card
            variant="outlined"
            size="small"
            title={t('pages.cmdb.stats.byModel')}
          >
            <BarList items={barItems('byModel')} />
          </Card>
        </>
      ) : (
        <>
          {statCards}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                variant="outlined"
                size="small"
                title={t('pages.cmdb.stats.byModel')}
              >
                <BarList items={barItems('byModel')} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                variant="outlined"
                size="small"
                title={t('pages.cmdb.stats.byStatus')}
              >
                <BarList items={barItems('byStatus')} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                variant="outlined"
                size="small"
                title={t('pages.cmdb.stats.byEnv')}
              >
                <BarList items={barItems('byEnv')} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                variant="outlined"
                size="small"
                title={t('pages.cmdb.stats.bySource')}
              >
                <BarList items={barItems('bySource')} />
              </Card>
            </Col>
          </Row>
          {quality && quality.items.length > 0 && (
            <Card
              variant="outlined"
              size="small"
              title={t('pages.cmdb.quality.title')}
              extra={
                <Typography.Text type="secondary">
                  {t('pages.cmdb.quality.tip')}
                </Typography.Text>
              }
              style={{ marginTop: 16 }}
            >
              <Table<CmdbQualityRow>
                rowKey="modelCode"
                size="small"
                pagination={false}
                dataSource={quality.items}
                columns={[
                  {
                    title: t('pages.cmdb.ci.column.model'),
                    dataIndex: 'modelName',
                    render: (_, r) => r.modelName || r.modelCode,
                  },
                  {
                    title: t('pages.cmdb.quality.total'),
                    dataIndex: 'total',
                    align: 'right',
                    width: 110,
                    render: (_, r) => Number(r.total ?? 0).toLocaleString(),
                  },
                  ...QUALITY_ISSUES.map(({ issue, field }) => ({
                    title:
                      issue === 'outdated'
                        ? t('pages.cmdb.quality.issue.outdated', {
                            days: quality.outdatedDays,
                          })
                        : t(`pages.cmdb.quality.issue.${issue}`),
                    align: 'right' as const,
                    width: 130,
                    render: (_: unknown, r: CmdbQualityRow) => {
                      const n = Number(r[field] ?? 0);
                      // 有问题的数字可点：跳到该模型的资源列表并带上问题筛选
                      return n > 0 ? (
                        <a
                          onClick={() =>
                            history.push(
                              `/cmdb/ci?model=${r.modelCode}&issue=${issue}`,
                            )
                          }
                        >
                          {n.toLocaleString()}
                        </a>
                      ) : (
                        <Typography.Text type="secondary">0</Typography.Text>
                      );
                    },
                  })),
                ]}
              />
            </Card>
          )}
          <Card
            variant="outlined"
            size="small"
            title={t('pages.cmdb.stats.trend')}
            style={{ marginTop: 16 }}
          >
            <TrendChart
              points={points}
              height={260}
              title={t('pages.cmdb.stats.trend')}
            />
          </Card>
        </>
      )}
    </PageContainer>
  );
};

export default StatsPage;
