/**
 * 模型关系图：按分组分列布局，节点 = 模型，边 = 关联类型（正向名 + 基数）。
 * 手写 SVG（不引图库）；支持滚轮缩放 / 拖拽平移 / 适应画布；点击节点回调。
 * 节点身份不靠颜色（名称 + 图标）；图标着色仅区分内置 / 自定义（右上图例），
 * 配色全部走主题 token；画布为点阵底。
 */
import { Button, Empty } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CmdbCardinality } from '@/services/cmdb/typings';
import { useT } from '@/utils/i18n';
import { useSize } from './charts';
import { ModelGlyph, UiIcon } from './icons';
import { CMDB_ANY_MODEL } from './meta';

const useStyles = createStyles(({ token, css }) => ({
  wrap: css`
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(
        circle at 1px 1px,
        ${token.colorFillSecondary} 1px,
        transparent 0
      )
      0 0 / 16px 16px,
      ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
    cursor: grab;
    touch-action: none;
    user-select: none;
    &:active {
      cursor: grabbing;
    }
  `,
  groupLabel: css`
    fill: ${token.colorTextSecondary};
    font-size: 12px;
    font-weight: 600;
  `,
  nodeRect: css`
    fill: ${token.colorBgContainer};
    stroke: ${token.colorSplit};
    stroke-width: 1;
    cursor: pointer;
    transition: stroke ${token.motionDurationMid};
    &:hover {
      stroke: ${token.colorPrimary};
    }
  `,
  /** 节点图标着色：内置模型中性色、自定义模型主色（图例同色） */
  glyphBuiltin: css`
    color: ${token.colorTextSecondary};
  `,
  glyphCustom: css`
    color: ${token.colorPrimary};
  `,
  legend: css`
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 12px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    background: ${token.colorBgElevated};
    border-radius: ${token.borderRadius}px;
    box-shadow: ${token.boxShadowTertiary};
    cursor: default;
  `,
  legendItem: css`
    display: flex;
    align-items: center;
    gap: 6px;
    &::before {
      width: 10px;
      height: 10px;
      background: currentColor;
      border-radius: 2px;
      content: '';
    }
  `,
  nodeText: css`
    fill: ${token.colorText};
    font-size: 13px;
  `,
  nodeCount: css`
    fill: ${token.colorTextTertiary};
    font-size: 11px;
  `,
  edge: css`
    color: ${token.colorBorder};
    &:hover {
      color: ${token.colorPrimary};
    }
  `,
  edgePath: css`
    stroke: currentColor;
    stroke-width: 1.5;
    fill: none;
  `,
  edgeArrow: css`
    fill: currentColor;
  `,
  edgeLabelBg: css`
    fill: ${token.colorBgContainer};
    stroke: ${token.colorSplit};
  `,
  edgeLabelText: css`
    fill: ${token.colorTextTertiary};
    font-size: 11px;
  `,
  controls: css`
    position: absolute;
    right: 12px;
    bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
}));

export interface GraphModel {
  code: string;
  name: string;
  icon?: string;
  category: string;
  ciCount?: number;
  /** 1 启用 / 2 停用 */
  status?: number;
  builtin?: boolean;
}

export interface GraphRelation {
  code: string;
  forwardName: string;
  srcModel: string;
  dstModel: string;
  cardinality: CmdbCardinality;
}

const COL_W = 220;
const NODE_H = 48;
const NODE_GAP = 28;
const HEAD_H = 36;
const COL_GAP = 72;
const PAD = 28;

const CARDINALITY_TEXT: Record<CmdbCardinality, string> = {
  one_to_one: '1-1',
  one_to_many: '1-N',
  many_to_many: 'N-N',
};

interface Pt {
  x: number;
  y: number;
}

const textWidth = (s: string, cjk = 11, ascii = 6.2) =>
  [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 255 ? cjk : ascii), 0);

const truncate = (s: string, maxW: number) => {
  let w = 0;
  let i = 0;
  for (const ch of s) {
    w += ch.charCodeAt(0) > 255 ? 13 : 7;
    if (w > maxW) return `${s.slice(0, i)}…`;
    i += 1;
  }
  return s;
};

export const ModelGraph: React.FC<{
  models: GraphModel[];
  relations: GraphRelation[];
  /** 分组 code → 展示名 */
  groupNames?: Record<string, string>;
  /** 分组展示顺序；缺省按首次出现 */
  groupOrder?: string[];
  onSelectModel?: (code: string) => void;
  height?: number;
  /** 无障碍标题（svg title） */
  title?: string;
}> = ({
  models,
  relations,
  groupNames = {},
  groupOrder,
  onSelectModel,
  height = 520,
  title,
}) => {
  const { styles, cx } = useStyles();
  const t = useT();
  const [wrapRef, { width }] = useSize<HTMLDivElement>();
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const dragRef = useRef<{
    px: number;
    py: number;
    vx: number;
    vy: number;
  } | null>(null);
  /** 拖拽过则吞掉随后的 click（不用指针捕获：捕获会把 click 改派给容器） */
  const movedRef = useRef(false);

  /** 布局：分组分列、列内纵向排布 */
  const layout = useMemo(() => {
    const groupList: string[] = [];
    const seen = new Set<string>();
    for (const code of groupOrder ?? []) {
      if (models.some((m) => m.category === code)) {
        groupList.push(code);
        seen.add(code);
      }
    }
    for (const m of models) {
      if (!seen.has(m.category)) {
        groupList.push(m.category);
        seen.add(m.category);
      }
    }
    const nodes = new Map<
      string,
      { model: GraphModel; x: number; y: number; group: string }
    >();
    let maxRows = 0;
    groupList.forEach((g, gi) => {
      const list = models.filter((m) => m.category === g);
      maxRows = Math.max(maxRows, list.length);
      list.forEach((m, ri) => {
        nodes.set(m.code, {
          model: m,
          x: PAD + gi * (COL_W + COL_GAP),
          y: PAD + HEAD_H + ri * (NODE_H + NODE_GAP),
          group: g,
        });
      });
    });
    const contentW =
      PAD * 2 + Math.max(0, groupList.length * (COL_W + COL_GAP) - COL_GAP);
    const contentH =
      PAD * 2 +
      HEAD_H +
      Math.max(1, maxRows) * NODE_H +
      Math.max(0, maxRows - 1) * NODE_GAP;

    const edges = relations.flatMap((r) => {
      if (r.srcModel === CMDB_ANY_MODEL || r.dstModel === CMDB_ANY_MODEL)
        return [];
      const s = nodes.get(r.srcModel);
      const d = nodes.get(r.dstModel);
      if (!s || !d) return [];
      let p0: Pt;
      let p3: Pt;
      let c1: Pt;
      let c2: Pt;
      if (s.group === d.group) {
        // 同列：纵向连线
        const down = d.y > s.y;
        p0 = { x: s.x + COL_W / 2, y: down ? s.y + NODE_H : s.y };
        p3 = { x: d.x + COL_W / 2, y: down ? d.y : d.y + NODE_H };
        c1 = { x: p0.x, y: p0.y + (down ? 40 : -40) };
        c2 = { x: p3.x, y: p3.y + (down ? -40 : 40) };
      } else {
        // 跨列：横向连线
        const right = d.x > s.x;
        p0 = { x: right ? s.x + COL_W : s.x, y: s.y + NODE_H / 2 };
        p3 = { x: right ? d.x : d.x + COL_W, y: d.y + NODE_H / 2 };
        const off = Math.max(40, Math.abs(p3.x - p0.x) * 0.35);
        c1 = { x: p0.x + (right ? off : -off), y: p0.y };
        c2 = { x: p3.x + (right ? -off : off), y: p3.y };
      }
      const mid = {
        x: (p0.x + 3 * c1.x + 3 * c2.x + p3.x) / 8,
        y: (p0.y + 3 * c1.y + 3 * c2.y + p3.y) / 8,
      };
      // 箭头：沿 c2→p3 方向
      const ang = Math.atan2(p3.y - c2.y, p3.x - c2.x);
      const u = { x: Math.cos(ang), y: Math.sin(ang) };
      const n = { x: -u.y, y: u.x };
      const L = 8;
      const W = 3.5;
      const arrow = [
        `${p3.x},${p3.y}`,
        `${p3.x - L * u.x + W * n.x},${p3.y - L * u.y + W * n.y}`,
        `${p3.x - L * u.x - W * n.x},${p3.y - L * u.y - W * n.y}`,
      ].join(' ');
      const label = `${r.forwardName} · ${CARDINALITY_TEXT[r.cardinality]}`;
      return { rel: r, p0, c1, c2, p3, mid, arrow, label };
    });

    return { groupList, nodes, edges, contentW, contentH };
  }, [models, relations, groupOrder]);

  const fitView = useCallback(() => {
    if (!width || !layout.contentW || !layout.contentH) return;
    // 内容少时适度放大（上限 1.4），避免小图在大画布里缩成一角
    const k = Math.min(width / layout.contentW, height / layout.contentH, 1.4);
    setView({
      k,
      x: (width - layout.contentW * k) / 2,
      // 纵向不居中：内容靠上（最多留 56px），与列表类页面的阅读起点一致
      y: Math.min((height - layout.contentH * k) / 2, 56),
    });
  }, [width, height, layout.contentW, layout.contentH]);

  const zoomAt = useCallback((sx: number, sy: number, factor: number) => {
    setView((v) => {
      const k = Math.min(2.5, Math.max(0.4, v.k * factor));
      return {
        k,
        x: sx - ((sx - v.x) * k) / v.k,
        y: sy - ((sy - v.y) * k) / v.k,
      };
    });
  }, []);

  // 滚轮缩放（需 non-passive 才能 preventDefault）
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(
        e.clientX - rect.left,
        e.clientY - rect.top,
        e.deltaY < 0 ? 1.12 : 1 / 1.12,
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [wrapRef, zoomAt]);

  // 布局或容器变化后回到适应画布
  useEffect(() => {
    fitView();
  }, [fitView]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    movedRef.current = false;
    dragRef.current = {
      px: e.clientX,
      py: e.clientY,
      vx: view.x,
      vy: view.y,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (Math.abs(dx) + Math.abs(dy) > 3) movedRef.current = true;
    if (movedRef.current)
      setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  };
  const endDrag = () => {
    dragRef.current = null;
  };

  const clickNode = (code: string) => {
    if (movedRef.current) return;
    onSelectModel?.(code);
  };

  if (!models.length) {
    return (
      <div style={{ height }} className={styles.wrap}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ lineHeight: `${height}px` }}
        />
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      style={{ height }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <svg width={width} height={height}>
        <title>{title ?? ''}</title>
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {/* 分组标题 */}
          {layout.groupList.map((g, gi) => (
            <text
              key={g}
              className={styles.groupLabel}
              x={PAD + gi * (COL_W + COL_GAP)}
              y={PAD + 14}
            >
              {groupNames[g] ?? g}
            </text>
          ))}
          {/* 边 */}
          {layout.edges.map(({ rel, p0, c1, c2, p3, mid, arrow, label }) => {
            const lw = textWidth(label) + 12;
            return (
              <g key={rel.code} className={styles.edge}>
                <path
                  className={styles.edgePath}
                  d={`M${p0.x},${p0.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${p3.x},${p3.y}`}
                />
                <polygon className={styles.edgeArrow} points={arrow} />
                <g transform={`translate(${mid.x},${mid.y})`}>
                  <rect
                    className={styles.edgeLabelBg}
                    x={-lw / 2}
                    y={-9}
                    width={lw}
                    height={18}
                    rx={4}
                  />
                  <text
                    className={styles.edgeLabelText}
                    textAnchor="middle"
                    dy="0.32em"
                    pointerEvents="none"
                  >
                    {label}
                  </text>
                </g>
              </g>
            );
          })}
          {/* 节点 */}
          {[...layout.nodes.values()].map(({ model, x, y }) => (
            <g
              key={model.code}
              transform={`translate(${x},${y})`}
              opacity={model.status === 2 ? 0.55 : 1}
              onClick={() => clickNode(model.code)}
            >
              <title>{`${model.name} · ${model.code}`}</title>
              <rect
                className={styles.nodeRect}
                width={COL_W}
                height={NODE_H}
                rx={8}
              />
              <g
                className={
                  model.builtin ? styles.glyphBuiltin : styles.glyphCustom
                }
                transform={`translate(12,${(NODE_H - 18) / 2})`}
                pointerEvents="none"
              >
                <ModelGlyph icon={model.icon} size={18} />
              </g>
              <text
                className={styles.nodeText}
                x={40}
                y={NODE_H / 2}
                dy="0.32em"
                pointerEvents="none"
              >
                {truncate(model.name, COL_W - 40 - 52)}
              </text>
              {model.ciCount !== undefined && (
                <text
                  className={styles.nodeCount}
                  x={COL_W - 10}
                  y={NODE_H / 2}
                  dy="0.32em"
                  textAnchor="end"
                  pointerEvents="none"
                >
                  {Number(model.ciCount).toLocaleString()}
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>
      <div className={styles.legend}>
        <span className={cx(styles.legendItem, styles.glyphBuiltin)}>
          {t('pages.cmdb.model.tag.builtin')}
        </span>
        <span className={cx(styles.legendItem, styles.glyphCustom)}>
          {t('pages.cmdb.model.tag.custom')}
        </span>
      </div>
      <div className={styles.controls}>
        <Button size="small" onClick={() => zoomAt(width / 2, height / 2, 1.2)}>
          <UiIcon name="plus" />
        </Button>
        <Button
          size="small"
          onClick={() => zoomAt(width / 2, height / 2, 1 / 1.2)}
        >
          <UiIcon name="minus" />
        </Button>
        <Button size="small" onClick={fitView}>
          <UiIcon name="fit" />
        </Button>
      </div>
    </div>
  );
};
