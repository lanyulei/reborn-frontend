/**
 * 降噪效果：产生的告警事件里，发出过通知的、从未打扰任何人的（其中被屏蔽 / 被抑制的）各占多少，
 * 以同一基准（产生的事件数）的横条对比；另列实际发出的通知次数及其来源构成。
 * 被屏蔽与被抑制可能重叠（同一事件两者都发生过），所以是并排对比而不是一根堆叠条。
 */
import { Col, Empty, Row } from 'antd';
import type React from 'react';
import type { AlertNoise } from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import { useSeriesColors } from '../components/SeriesChart';
import { StatTile } from './StatTile';
import { useStatsStyles } from './styles';

const percent = (part: number, whole: number): string =>
  whole > 0 ? `${Math.round((part / whole) * 1000) / 10}%` : '';

export const NoisePanel: React.FC<{ data: AlertNoise }> = ({ data }) => {
  const t = useT();
  const { styles, cx } = useStatsStyles();
  const colors = useSeriesColors();
  const alerts = data.alerts ?? 0;
  const notifications = data.notifications ?? 0;
  if (alerts === 0 && notifications === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('pages.monitor.stats.empty')}
      />
    );
  }

  const rows: { id: string; value: number; sub?: boolean; muted?: boolean }[] =
    [
      { id: 'alerts', value: alerts, muted: true },
      { id: 'notified', value: data.notified ?? 0 },
      { id: 'silent', value: data.silent ?? 0 },
      { id: 'muted', value: data.muted ?? 0, sub: true },
      { id: 'inhibited', value: data.inhibited ?? 0, sub: true },
    ];
  const sources = [
    { id: 'rule', value: data.ruleNotifications ?? 0, color: colors[0] },
    {
      id: 'subscription',
      value: data.subscriptionNotifications ?? 0,
      color: colors[1],
    },
    {
      id: 'escalation',
      value: data.escalationNotifications ?? 0,
      color: colors[2],
    },
  ];

  return (
    <Row gutter={[32, 16]}>
      <Col xs={24} lg={14}>
        {rows.map((row) => (
          <div key={row.id} className={styles.compareRow}>
            <span className={row.sub ? styles.compareSub : undefined}>
              {t(`pages.monitor.stats.noise.${row.id}`)}
            </span>
            <div className={styles.track}>
              <div
                className={cx(styles.bar, row.muted && styles.barMuted)}
                style={{
                  width: `${alerts > 0 ? Math.min(100, (row.value / alerts) * 100) : 0}%`,
                }}
              />
            </div>
            <span className={styles.compareValue}>
              {row.value.toLocaleString()}
              {row.id !== 'alerts' && alerts > 0 && (
                <span className={styles.hint}>
                  {' '}
                  {percent(row.value, alerts)}
                </span>
              )}
            </span>
          </div>
        ))}
        <div className={styles.hint}>{t('pages.monitor.stats.noise.hint')}</div>
      </Col>
      <Col xs={24} lg={10}>
        <div className={styles.tileGrid}>
          <StatTile
            label={t('pages.monitor.stats.noise.rate')}
            tooltip={t('pages.monitor.stats.noise.rate.tooltip')}
            value={percent(data.silent ?? 0, alerts) || t('common.empty')}
          />
          <StatTile
            label={t('pages.monitor.stats.noise.notifications')}
            tooltip={t('pages.monitor.stats.noise.notifications.tooltip')}
            value={notifications.toLocaleString()}
          />
        </div>
        {notifications > 0 && (
          <div className={styles.split}>
            {sources
              .filter((source) => source.value > 0)
              .map((source) => (
                <span
                  key={source.id}
                  title={`${t(`pages.monitor.stats.noise.source.${source.id}`)}: ${source.value}`}
                  style={{ flex: source.value, background: source.color }}
                />
              ))}
          </div>
        )}
        <div className={styles.legend} style={{ marginTop: 8 }}>
          {sources.map((source) => (
            <span key={source.id} className={styles.legendItem}>
              <span
                className={styles.swatch}
                style={{ background: source.color }}
              />
              <span>{t(`pages.monitor.stats.noise.source.${source.id}`)}</span>
              <span className={styles.strong}>
                {source.value.toLocaleString()}
              </span>
            </span>
          ))}
        </div>
      </Col>
    </Row>
  );
};

export default NoisePanel;
