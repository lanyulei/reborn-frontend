/**
 * 资源拓扑：以当前资源为中心的环形布局（第 N 层节点均匀分布在半径 N×R 的圆上），
 * 纯 SVG 渲染，无图形库依赖；节点按状态着色，点击跳转详情，边悬停显示关系名。
 * 视口支持滚轮缩放 / 拖拽平移 / 适应画布（右下控制），拖拽超过阈值不触发点击。
 */

import { history } from '@umijs/max';
import { Alert, Button, Empty, Segmented, Space, Spin, Typography } from 'antd';
import { useTheme } from 'antd-style';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getNeighbors,
  type TopologyNode,
  type TopologyResult,
} from '@/services/cmdb/relation';
import { useT } from '@/utils/i18n';
import { UiIcon } from './icons';

const RING_RADIUS = 150;
const NODE_RADIUS = 18;
const LABEL_MAX = 14;

const truncateLabel = (s: string) =>
  s.length > LABEL_MAX ? `${s.slice(0, LABEL_MAX - 1)}…` : s;

export const TopologyPanel: React.FC<{ ciId: string }> = ({ ciId }) => {
  const t = useT();
  const token = useTheme();
  const [depth, setDepth] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TopologyResult | null>(null);
  // 视口（viewBox 中心 + 半宽）与拖拽状态
  const svgRef = useRef<SVGSVGElement>(null);
  const extentRef = useRef(RING_RADIUS);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const [view, setView] = useState({ cx: 0, cy: 0, half: RING_RADIUS });

  const fitView = useCallback(() => {
    setView({ cx: 0, cy: 0, half: extentRef.current });
  }, []);
  const zoomBy = useCallback((factor: number) => {
    setView((v) => ({
      ...v,
      half: Math.max(
        extentRef.current / 4,
        Math.min(extentRef.current * 2, v.half * factor),
      ),
    }));
  }, []);

  // 滚轮缩放需要非被动监听（阻止页面滚动）
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY > 0 ? 1.15 : 1 / 1.15);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const start = dragRef.current;
    const svg = svgRef.current;
    if (!start || !svg) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) movedRef.current = true;
    const unitsPerPx = (view.half * 2) / Math.max(1, svg.clientWidth);
    setView((v) => ({
      ...v,
      cx: v.cx - dx * unitsPerPx,
      cy: v.cy - dy * unitsPerPx,
    }));
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getNeighbors(ciId, { depth, maxNodes: 200 })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ciId, depth]);

  const statusColor: Record<string, string> = {
    planning: token.colorTextTertiary,
    active: token.colorSuccess,
    maintenance: token.colorWarning,
    retired: token.colorError,
  };

  // 布局：按层分组，每层均匀分布角度；中心在原点
  const layout = useMemo(() => {
    if (!data) return null;
    const byDepth = new Map<number, TopologyNode[]>();
    for (const n of data.nodes) {
      const list = byDepth.get(n.depth) ?? [];
      list.push(n);
      byDepth.set(n.depth, list);
    }
    const pos = new Map<string, { x: number; y: number }>();
    let maxDepth = 0;
    for (const [d, list] of byDepth) {
      maxDepth = Math.max(maxDepth, d);
      if (d === 0) {
        for (const n of list) pos.set(n.id, { x: 0, y: 0 });
        continue;
      }
      // 外层节点越多，半径按需放大以避免重叠
      const r = Math.max(
        RING_RADIUS * d,
        (list.length * NODE_RADIUS * 3) / (2 * Math.PI),
      );
      list.forEach((n, i) => {
        const angle = (2 * Math.PI * i) / list.length - Math.PI / 2;
        pos.set(n.id, { x: r * Math.cos(angle), y: r * Math.sin(angle) });
      });
    }
    let extent = RING_RADIUS;
    for (const p of pos.values()) {
      extent = Math.max(extent, Math.abs(p.x), Math.abs(p.y));
    }
    extent += NODE_RADIUS * 3;
    return { pos, extent, maxDepth };
  }, [data]);

  // 数据 / 层深变化后重置视口
  useEffect(() => {
    extentRef.current = layout?.extent ?? RING_RADIUS;
    fitView();
  }, [layout, fitView]);

  return (
    <Space vertical size="middle" style={{ width: '100%' }}>
      <Space>
        <Typography.Text type="secondary">
          {t('pages.cmdb.topology.depth')}
        </Typography.Text>
        <Segmented
          size="small"
          options={[1, 2, 3]}
          value={depth}
          onChange={(v) => setDepth(Number(v))}
        />
        {data && (
          <Typography.Text type="secondary">
            {t('pages.cmdb.topology.summary', {
              nodes: data.nodes.length,
              edges: data.edges.length,
            })}
          </Typography.Text>
        )}
      </Space>
      {data?.truncated && (
        <Alert
          type="warning"
          showIcon
          title={t('pages.cmdb.topology.truncated')}
        />
      )}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : !data || !layout || data.nodes.length <= 1 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.cmdb.topology.empty')}
        />
      ) : (
        <div style={{ position: 'relative' }}>
          <svg
            ref={svgRef}
            role="img"
            aria-label={t('pages.cmdb.topology.title')}
            viewBox={`${view.cx - view.half} ${view.cy - view.half} ${view.half * 2} ${view.half * 2}`}
            style={{
              width: '100%',
              maxHeight: 640,
              touchAction: 'none',
              cursor: dragRef.current ? 'grabbing' : 'grab',
              background: token.colorBgLayout,
              borderRadius: token.borderRadius,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              <marker
                id="cmdb-topo-arrow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill={token.colorTextQuaternary}
                />
              </marker>
            </defs>
            {data.edges.map((e) => {
              const a = layout.pos.get(e.srcId);
              const b = layout.pos.get(e.dstId);
              if (!a || !b) return null;
              // 终点缩回节点半径，让箭头落在圆周
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.hypot(dx, dy) || 1;
              const ex = b.x - (dx / len) * NODE_RADIUS;
              const ey = b.y - (dy / len) * NODE_RADIUS;
              return (
                <line
                  key={e.id}
                  x1={a.x}
                  y1={a.y}
                  x2={ex}
                  y2={ey}
                  stroke={token.colorTextQuaternary}
                  strokeWidth={1.5}
                  markerEnd="url(#cmdb-topo-arrow)"
                >
                  <title>{e.name}</title>
                </line>
              );
            })}
            {data.nodes.map((n) => {
              const p = layout.pos.get(n.id);
              if (!p) return null;
              const center = n.depth === 0;
              return (
                <g
                  key={n.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  style={{ cursor: center ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (!center && !movedRef.current)
                      history.push(`/cmdb/ci/${n.id}`);
                  }}
                >
                  <title>{`${n.modelName} · ${n.name}${n.env ? ` · ${n.env}` : ''}`}</title>
                  <circle
                    r={center ? NODE_RADIUS + 4 : NODE_RADIUS}
                    fill={token.colorBgContainer}
                    stroke={statusColor[n.status] ?? token.colorBorder}
                    strokeWidth={center ? 3 : 2}
                  />
                  <text
                    textAnchor="middle"
                    dy={4}
                    fontSize={10}
                    fill={token.colorTextSecondary}
                  >
                    {truncateLabel(n.modelName)}
                  </text>
                  <text
                    textAnchor="middle"
                    dy={NODE_RADIUS + 16}
                    fontSize={12}
                    fontWeight={center ? 600 : 400}
                    fill={token.colorText}
                  >
                    {truncateLabel(n.name)}
                  </text>
                </g>
              );
            })}
          </svg>
          <div
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <Button size="small" onClick={() => zoomBy(1.2)}>
              <UiIcon name="plus" />
            </Button>
            <Button size="small" onClick={() => zoomBy(1 / 1.2)}>
              <UiIcon name="minus" />
            </Button>
            <Button size="small" onClick={fitView}>
              <UiIcon name="fit" />
            </Button>
          </div>
        </div>
      )}
    </Space>
  );
};
