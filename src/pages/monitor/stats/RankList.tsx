/**
 * 告警排行（最吵的规则 / 告警最多的资源）：一行一个对象——名称、最高级别、仍在告警的数量、
 * 所在分组，下面一根长度即告警事件数的横条。对象仍存在且调用方给出地址时名称可跳转。
 */
import { Link } from '@umijs/max';
import { Empty, Tag } from 'antd';
import type React from 'react';
import type { AlertTopItem } from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import { SeverityTag } from '../components/tags';
import { useStatsStyles } from './styles';

export const RankList: React.FC<{
  items: readonly AlertTopItem[];
  /** 可跳转时返回地址（对象已不存在、或没有目标页面的权限时返回 undefined） */
  linkTo?: (item: AlertTopItem) => string | undefined;
}> = ({ items, linkTo }) => {
  const t = useT();
  const { styles, cx } = useStatsStyles();
  if (items.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('pages.monitor.stats.empty')}
      />
    );
  }
  const max = Math.max(1, ...items.map((item) => item.count ?? 0));
  return (
    <div className={styles.rankList}>
      {items.map((item, index) => {
        const name = item.name || item.key || t('common.empty');
        const to = item.exists ? linkTo?.(item) : undefined;
        const count = item.count ?? 0;
        return (
          <div key={item.key ?? index}>
            <div className={styles.rankHead}>
              <span className={styles.rankIndex}>{index + 1}</span>
              <span
                className={cx(styles.rankName, !item.exists && styles.rankGone)}
                title={name}
              >
                {to ? <Link to={to}>{name}</Link> : name}
              </span>
              {!item.exists && (
                <Tag variant="outlined" style={{ marginInlineEnd: 0 }}>
                  {t('pages.monitor.stats.top.gone')}
                </Tag>
              )}
              <SeverityTag severity={item.maxSeverity || undefined} />
              {(item.firing ?? 0) > 0 && (
                <Tag color="error" style={{ marginInlineEnd: 0 }}>
                  {t('pages.monitor.stats.top.firing', { n: item.firing ?? 0 })}
                </Tag>
              )}
              <span className={styles.rankCount}>{count.toLocaleString()}</span>
            </div>
            {item.groupName && (
              <div className={styles.rankSub} title={item.groupName}>
                {item.groupName}
              </div>
            )}
            <div className={cx(styles.track, styles.rankTrack)}>
              <div
                className={styles.bar}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RankList;
