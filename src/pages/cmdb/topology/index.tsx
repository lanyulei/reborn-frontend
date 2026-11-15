/**
 * 模型关系：左侧分组菜单（全部 / 单个分组，带模型数；与资源实例左侧面板同款）+ 关系图（分组分列、边为关联类型）。
 * 点击节点进入模型详情；滚轮缩放 / 拖拽平移 / 适应画布见右下控制。
 */
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Card, Menu, Spin } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { listRelationTypes } from '@/services/cmdb/model';
import { useT } from '@/utils/i18n';
import { ModelGraph } from '../components/ModelGraph';
import { useCmdbStyles } from '../components/styles';
import { useCatalog } from '../components/useCatalog';

const TopologyPage: React.FC = () => {
  const t = useT();
  const { styles } = useCmdbStyles();
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
  // 画布高度随视口（挂载时取值；容器内还有工具栏一行）
  const [height] = useState(() => Math.max(440, window.innerHeight - 248));

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

  // 菜单项：全部模型 + 各分组（名称 + 模型数）；key 加前缀，避免分组编码与 all 撞名
  const menuItem = (key: string, name: string, count: number) => ({
    key,
    label: (
      <span className={styles.modelMenuItem}>
        <span className={styles.modelMenuName}>{name}</span>
        <span className={styles.modelMenuCount}>{count}</span>
      </span>
    ),
  });
  const menuItems = [
    menuItem('all', t('pages.cmdb.topology.allModels'), models.length),
    ...groups.map((g) =>
      menuItem(
        `group-${g.code}`,
        g.name,
        models.filter((m) => m.category === g.code).length,
      ),
    ),
  ];

  return (
    <PageContainer title={false}>
      <div className={styles.split}>
        <aside className={styles.splitSide}>
          <div className={styles.splitSideTitle}>
            {t('pages.cmdb.topology.groups')}
          </div>
          {loading && groups.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : (
            <Menu
              mode="inline"
              inlineIndent={12}
              className={styles.modelMenu}
              selectedKeys={[activeGroup ? `group-${activeGroup}` : 'all']}
              items={menuItems}
              onClick={({ key }) =>
                setActiveGroup(
                  key === 'all' ? undefined : key.slice('group-'.length),
                )
              }
              style={{
                borderInlineEnd: 0,
                marginTop: 4,
                marginBottom: 6,
                background: 'transparent',
              }}
            />
          )}
        </aside>
        <div className={styles.splitMain}>
          {loading || relationsLoading ? (
            <Card
              variant="outlined"
              styles={{
                body: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // 与关系图同高（画布 + 工具栏一行），加载完成后不跳动
                  height: height + 57,
                },
              }}
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
