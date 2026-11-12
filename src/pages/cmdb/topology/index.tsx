/**
 * 模型关系：左侧分组列表（全部 / 单个分组，带模型数）+ 关系图（分组分列、边为关联类型）。
 * 点击节点进入模型详情；滚轮缩放 / 拖拽平移 / 适应画布见右下控制。
 */
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Card, Spin } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { listRelationTypes } from '@/services/cmdb/model';
import { useT } from '@/utils/i18n';
import { ModelGraph } from '../components/ModelGraph';
import { useCmdbStyles } from '../components/styles';
import { useCatalog } from '../components/useCatalog';

const TopologyPage: React.FC = () => {
  const t = useT();
  const { styles, cx } = useCmdbStyles();
  const { loading, models, groups } = useCatalog();
  const [relations, setRelations] = useState<
    {
      code: string;
      forwardName: string;
      srcModel: string;
      dstModel: string;
      cardinality: 'one_to_one' | 'one_to_many' | 'many_to_many';
    }[]
  >([]);
  const [relationsLoading, setRelationsLoading] = useState(true);
  // 选中的分组（undefined = 全部）
  const [activeGroup, setActiveGroup] = useState<string | undefined>();
  // 画布高度随视口（挂载时取值）
  const [height] = useState(() => Math.max(480, window.innerHeight - 190));

  useEffect(() => {
    let cancelled = false;
    listRelationTypes()
      .then((result) => {
        if (!cancelled) setRelations(result.items);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setRelationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groupNames = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.code, g.name])),
    [groups],
  );
  const groupOrder = useMemo(() => groups.map((g) => g.code), [groups]);
  const visibleModels = useMemo(
    () =>
      activeGroup ? models.filter((m) => m.category === activeGroup) : models,
    [models, activeGroup],
  );

  const graphModels = visibleModels.map((m) => ({
    code: m.code,
    name: m.name,
    icon: m.icon,
    category: m.category,
    ciCount: m.ciCount === undefined ? undefined : Number(m.ciCount),
    status: m.status,
    builtin: m.builtin,
  }));

  const groupItem = (key: string | undefined, name: string, count: number) => (
    <button
      key={key ?? 'all'}
      type="button"
      aria-pressed={activeGroup === key}
      className={cx(styles.modelRow, activeGroup === key && styles.modelRowOn)}
      onClick={() => setActiveGroup(key)}
    >
      <span className={styles.modelRowName}>{name}</span>
      <span className={styles.modelRowCount}>{count}</span>
    </button>
  );

  return (
    <PageContainer title={false}>
      <div className={styles.split}>
        <aside className={styles.splitSide} style={{ padding: '8px 0' }}>
          {groupItem(
            undefined,
            t('pages.cmdb.topology.allModels'),
            models.length,
          )}
          {groups.map((g) =>
            groupItem(
              g.code,
              g.name,
              models.filter((m) => m.category === g.code).length,
            ),
          )}
        </aside>
        <div className={styles.splitMain}>
          {loading || relationsLoading ? (
            <Card
              variant="outlined"
              styles={{ body: { padding: 96, textAlign: 'center' } }}
            >
              <Spin />
            </Card>
          ) : (
            <ModelGraph
              models={graphModels}
              relations={relations}
              groupNames={groupNames}
              groupOrder={groupOrder}
              height={height}
              title={t('menu.cmdb.topology')}
              onSelectModel={(code) => history.push(`/cmdb/model/${code}`)}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default TopologyPage;
