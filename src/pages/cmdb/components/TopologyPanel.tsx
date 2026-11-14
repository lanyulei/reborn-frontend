/**
 * 资源拓扑（资源详情 · 拓扑 Tab）：以当前资源为中心的左右分层布局，纯 SVG 渲染
 * （不引图表库，规避 utoopack 新增模块崩溃）。
 * 视觉参考主流依赖视图（服务依赖图 / 脑图）：卡片节点（图标 + 名称 + 模型 · 环境 + 状态点），
 * 指向当前资源的关系在左、由当前资源指出的在右，逐层向两侧展开；同父节点相邻排列、
 * 水平贝塞尔连线，关系名以边上标签展示（关系少时常显，多时悬停显示）。
 * 悬停 / 聚焦时高亮相邻子图（其余淡出）并浮层展示节点 / 关系详情，点击节点跳转；
 * 视口支持滚轮缩放（以指针为中心）/ 拖拽平移 / 适应画布（右下控制），层深 1-3 可切换。
 */

import { history } from '@umijs/max';
import { Alert, Card, Empty, Segmented, Spin, Tooltip, Typography } from 'antd';
import { createStyles, useTheme } from 'antd-style';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getNeighbors,
  type TopologyNode,
  type TopologyResult,
} from '@/services/cmdb/relation';
import type { CmdbCIStatus, CmdbModel } from '@/services/cmdb/typings';
import { useEnumText, useT } from '@/utils/i18n';
import { useSize } from './charts';
import { ModelGlyph, UiIcon } from './icons';
import { CMDB_CI_STATUS_META, CMDB_CI_STATUS_ORDER } from './meta';

/** 画布最小高度（px）；实际高度随视口（挂载时取值） */
const MIN_HEIGHT = 520;
/** 卡片节点 / 中心节点尺寸，列间距（容纳关系标签）与行间距 */
const CARD_W = 212;
const CARD_H = 46;
const CENTER_W = 236;
const CENTER_H = 60;
const GAP_X = 112;
const GAP_Y = 10;
/** 内容边界外的留白 */
const PADDING = 36;
/** 缩放范围（px / 单位）；适应画布时不放大超过 1 */
const K_MIN = 0.25;
const K_MAX = 2;
/** 关系数不超过该值时边标签常显，否则仅悬停高亮时显示 */
const LABEL_ALWAYS_MAX = 8;

/** 估宽（CJK 全宽 / 其余近似 0.58em），用于 SVG 文本截断 */
const textWidth = (s: string, fs: number) => {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 0x2e7f ? fs : fs * 0.58;
  return w;
};
/** 按估宽截断：超出 maxW 时保留前缀 + 省略号 */
const fitLabel = (s: string, maxW: number, fs: number) => {
  if (textWidth(s, fs) <= maxW) return s;
  let out = '';
  let w = 0;
  for (const ch of s) {
    const cw = ch.charCodeAt(0) > 0x2e7f ? fs : fs * 0.58;
    if (w + cw + fs > maxW) break;
    out += ch;
    w += cw;
  }
  return `${out}…`;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** 三次贝塞尔在 t 处的分量值 */
const bezierAt = (
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
) => {
  const u = 1 - t;
  return (
    u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
  );
};

const useStyles = createStyles(({ token, css }) => ({
  toolbar: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  summary: css`
    padding-left: 12px;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    border-left: 1px solid ${token.colorSplit};
  `,
  spacer: css`
    flex: 1;
  `,
  legend: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    align-items: center;
  `,
  legendItem: css`
    display: inline-flex;
    gap: 6px;
    align-items: center;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  legendDot: css`
    width: 8px;
    height: 8px;
    border-radius: 50%;
  `,
  alert: css`
    border-radius: 0;
    border-width: 0 0 1px;
  `,
  canvas: css`
    position: relative;
    overflow: hidden;
    background: ${token.colorBgLayout};
    border-radius: 0 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px;
  `,
  /** 加载 / 空态：铺满画布居中；已有图时半透明遮罩在图上 */
  overlay: css`
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  overlayMask: css`
    background: ${token.colorBgMask};
    background: color-mix(in srgb, ${token.colorBgLayout} 60%, transparent);
  `,
  svg: css`
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    user-select: none;
  `,
  edge: css`
    fill: none;
    transition:
      opacity ${token.motionDurationMid},
      stroke ${token.motionDurationMid};
  `,
  /** 关系边命中区：透明宽描边，便于悬停 */
  hit: css`
    fill: none;
    stroke: transparent;
    stroke-width: 12;
    cursor: pointer;
  `,
  node: css`
    transition: opacity ${token.motionDurationMid};
    &:focus {
      outline: none;
    }
    &:focus-visible > rect:first-of-type {
      stroke: ${token.colorPrimary};
      stroke-width: 2;
    }
  `,
  nodeBox: css`
    transition:
      stroke ${token.motionDurationMid},
      stroke-width ${token.motionDurationMid};
  `,
  controls: css`
    position: absolute;
    right: 12px;
    bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 3px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
    box-shadow: ${token.boxShadowTertiary};
  `,
  controlBtn: css`
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    color: ${token.colorTextTertiary};
    background: transparent;
    border: none;
    border-radius: ${token.borderRadiusSM}px;
    cursor: pointer;
    transition: all ${token.motionDurationMid};
    &:hover {
      color: ${token.colorPrimary};
      background: ${token.colorFillQuaternary};
    }
  `,
  hint: css`
    position: absolute;
    bottom: 14px;
    left: 16px;
    color: ${token.colorTextQuaternary};
    font-size: ${token.fontSizeSM}px;
    pointer-events: none;
  `,
  tooltip: css`
    position: absolute;
    z-index: 10;
    min-width: 156px;
    max-width: 264px;
    padding: 8px 12px;
    pointer-events: none;
    background: ${token.colorBgElevated};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
    box-shadow: ${token.boxShadowSecondary};
  `,
  tooltipTitle: css`
    margin-bottom: 4px;
    color: ${token.colorText};
    font-weight: 600;
    font-size: ${token.fontSizeSM}px;
    word-break: break-all;
  `,
  tooltipRow: css`
    display: flex;
    justify-content: space-between;
    gap: 16px;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    line-height: 20px;
  `,
  tooltipVal: css`
    display: inline-flex;
    gap: 6px;
    align-items: center;
    color: ${token.colorText};
  `,
  tipDot: css`
    width: 8px;
    height: 8px;
    flex: none;
    border-radius: 50%;
  `,
  tooltipHint: css`
    margin-top: 4px;
    padding-top: 4px;
    color: ${token.colorTextQuaternary};
    font-size: ${token.fontSizeSM}px;
    border-top: 1px solid ${token.colorSplit};
  `,
}));

type HoverTarget = { kind: 'node' | 'edge'; id: string };
type Point = { x: number; y: number };
/** 视口：中心点（图坐标）+ 缩放（px / 单位） */
type View = { cx: number; cy: number; k: number };

const halfSize = (depth: number) =>
  depth === 0
    ? { w: CENTER_W / 2, h: CENTER_H / 2 }
    : { w: CARD_W / 2, h: CARD_H / 2 };

export const TopologyPanel: React.FC<{
  ciId: string;
  /** 全部模型（详情页已加载）：用于取模型图标渲染节点 */
  models?: CmdbModel[];
}> = ({ ciId, models }) => {
  const t = useT();
  const token = useTheme();
  const { styles, cx: cls } = useStyles();
  const statusText = useEnumText(CMDB_CI_STATUS_META);
  const [depth, setDepth] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TopologyResult | null>(null);
  const [hover, setHover] = useState<HoverTarget | null>(null);
  // 画布高度随视口（挂载时取值）
  const [height] = useState(() =>
    Math.max(MIN_HEIGHT, window.innerHeight - 420),
  );

  const modelByCode = useMemo(
    () => new Map((models ?? []).map((m) => [m.code, m])),
    [models],
  );

  const statusColor: Record<string, string> = {
    planning: token.colorTextTertiary,
    active: token.colorSuccess,
    maintenance: token.colorWarning,
    retired: token.colorError,
  };

  const hasGraph = !!data && data.nodes.length > 1;
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Point | null>(null);
  const movedRef = useRef(false);
  const pointerRef = useRef<Point>({ x: 0, y: 0 });
  const tipRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState<View>({ cx: 0, cy: 0, k: 1 });
  const [sizeRef, { width }] = useSize<HTMLDivElement>();
  // 同一容器的两个 ref（尺寸观测 + 浮层定位基准）合并
  const combinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      sizeRef.current = el;
      wrapRef.current = el;
    },
    [sizeRef],
  );
  // 容器宽度未测得前用兜底值，避免 viewBox 出现 0 宽
  const canvasW = width > 0 ? width : 960;

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

  /**
   * 布局：以后端给出的层深建 BFS 树（父 = 任一上一层邻居），第一层按与中心的关系方向
   * 分到左（指向中心）/ 右（中心指出），更深层随父同侧；每侧做紧凑树布局
   * （叶子逐行排、父居中于子），列按层深向两侧展开。
   * 同时给出邻接表（悬停高亮）与内容边界（适应画布）。
   */
  const layout = useMemo(() => {
    if (!data) return null;
    const nodeById = new Map<string, TopologyNode>();
    for (const n of data.nodes) nodeById.set(n.id, n);
    const center = data.nodes.find((n) => n.depth === 0);
    if (!center) return null;

    const adjacency = new Map<string, Set<string>>();
    const link = (x: string, y: string) => {
      const s = adjacency.get(x) ?? new Set<string>();
      s.add(y);
      adjacency.set(x, s);
    };
    for (const e of data.edges) {
      if (!nodeById.has(e.srcId) || !nodeById.has(e.dstId)) continue;
      link(e.srcId, e.dstId);
      link(e.dstId, e.srcId);
    }

    // 父子：父取上一层的邻居；数据不一致（找不到）时挂到中心
    const children = new Map<string, TopologyNode[]>();
    const side = new Map<string, 1 | -1>();
    // 第一层排序键：同一关系类型的相邻
    const groupKey = new Map<string, string>();
    const sorted = [...data.nodes].sort((a, b) => a.depth - b.depth);
    for (const n of sorted) {
      if (n.id === center.id) continue;
      let parentId = center.id;
      for (const nb of adjacency.get(n.id) ?? []) {
        if (nodeById.get(nb)?.depth === n.depth - 1) {
          parentId = nb;
          break;
        }
      }
      const list = children.get(parentId) ?? [];
      list.push(n);
      children.set(parentId, list);
      if (parentId === center.id) {
        const e = data.edges.find(
          (x) =>
            (x.srcId === center.id && x.dstId === n.id) ||
            (x.dstId === center.id && x.srcId === n.id),
        );
        side.set(n.id, e && e.dstId === center.id ? -1 : 1);
        groupKey.set(n.id, e?.relationType ?? '');
      } else {
        side.set(n.id, side.get(parentId) ?? 1);
      }
    }
    for (const [pid, list] of children) {
      list.sort(
        (a, b) =>
          (pid === center.id
            ? (groupKey.get(a.id) ?? '').localeCompare(groupKey.get(b.id) ?? '')
            : 0) ||
          a.modelCode.localeCompare(b.modelCode) ||
          a.name.localeCompare(b.name),
      );
    }

    const pos = new Map<string, Point>();
    pos.set(center.id, { x: 0, y: 0 });
    const colX = (d: number, s: 1 | -1) =>
      s * (CENTER_W / 2 + GAP_X + CARD_W / 2 + (d - 1) * (CARD_W + GAP_X));
    const row = CARD_H + GAP_Y;
    for (const s of [-1, 1] as const) {
      const roots = (children.get(center.id) ?? []).filter(
        (n) => side.get(n.id) === s,
      );
      if (!roots.length) continue;
      let cursor = 0;
      const ys = new Map<string, number>();
      const place = (n: TopologyNode): number => {
        const kids = children.get(n.id) ?? [];
        let y: number;
        if (!kids.length) {
          y = cursor;
          cursor += row;
        } else {
          const first = place(kids[0]);
          let last = first;
          for (let i = 1; i < kids.length; i++) last = place(kids[i]);
          y = (first + last) / 2;
        }
        ys.set(n.id, y);
        return y;
      };
      const rootYs = roots.map(place);
      // 该侧整体以第一层的跨度居中对齐中心节点
      const shift = (rootYs[0] + rootYs[rootYs.length - 1]) / 2;
      for (const [id, y] of ys) {
        const n = nodeById.get(id);
        if (n) pos.set(id, { x: colX(n.depth, s), y: y - shift });
      }
    }

    const bounds = {
      minX: -CENTER_W / 2,
      maxX: CENTER_W / 2,
      minY: -CENTER_H / 2,
      maxY: CENTER_H / 2,
    };
    for (const [id, p] of pos) {
      const h = halfSize(nodeById.get(id)?.depth ?? 1);
      bounds.minX = Math.min(bounds.minX, p.x - h.w);
      bounds.maxX = Math.max(bounds.maxX, p.x + h.w);
      bounds.minY = Math.min(bounds.minY, p.y - h.h);
      bounds.maxY = Math.max(bounds.maxY, p.y + h.h);
    }
    bounds.minX -= PADDING;
    bounds.maxX += PADDING;
    bounds.minY -= PADDING;
    bounds.maxY += PADDING;
    return { pos, adjacency, nodeById, bounds };
  }, [data]);

  /**
   * 关系边几何：水平贝塞尔，从源卡片侧边到目标卡片侧边（箭头指向目标）；
   * 同列节点间的边向外侧鼓出；同一对节点的多条关系上下错开。
   * mid 为标签位置：取曲线上偏向外层节点的一点（兄弟边在此处已分开，标签不互相遮挡）。
   */
  const edgePaths = useMemo(() => {
    if (!data || !layout) return [];
    const seen = new Map<string, number>();
    const out: { id: string; d: string; mid: Point }[] = [];
    for (const e of data.edges) {
      const a = layout.pos.get(e.srcId);
      const b = layout.pos.get(e.dstId);
      if (!a || !b || e.srcId === e.dstId) continue;
      const ha = halfSize(layout.nodeById.get(e.srcId)?.depth ?? 1);
      const hb = halfSize(layout.nodeById.get(e.dstId)?.depth ?? 1);
      const pairKey =
        e.srcId < e.dstId ? `${e.srcId}|${e.dstId}` : `${e.dstId}|${e.srcId}`;
      const k = seen.get(pairKey) ?? 0;
      seen.set(pairKey, k + 1);
      // 0, -9, 9, -18, …
      const off = Math.ceil(k / 2) * 9 * (k % 2 === 1 ? -1 : 1);
      const y1 = a.y + off;
      const y2 = b.y + off;
      if (Math.abs(a.x - b.x) < 1) {
        const s = a.x >= 0 ? 1 : -1;
        const x1 = a.x + s * ha.w;
        const x2 = b.x + s * (hb.w + 3);
        const bulge = s * Math.min(GAP_X * 0.7, 28 + Math.abs(y2 - y1) * 0.12);
        out.push({
          id: e.id,
          d: `M ${x1} ${y1} C ${x1 + bulge} ${y1} ${x2 + bulge} ${y2} ${x2} ${y2}`,
          mid: { x: (x1 + x2) / 2 + bulge * 0.75, y: (y1 + y2) / 2 },
        });
      } else {
        const dir = b.x > a.x ? 1 : -1;
        const x1 = a.x + dir * ha.w;
        const x2 = b.x - dir * (hb.w + 3);
        const mx = (x1 + x2) / 2;
        const tt = Math.abs(b.x) >= Math.abs(a.x) ? 0.6 : 0.4;
        out.push({
          id: e.id,
          d: `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`,
          mid: {
            x: bezierAt(x1, mx, mx, x2, tt),
            // 同一对节点的多条关系：标签间距拉到一个标签高
            y: bezierAt(y1, y1, y2, y2, tt) + off * 1.3,
          },
        });
      }
    }
    return out;
  }, [data, layout]);

  const edgeById = useMemo(
    () => new Map((data?.edges ?? []).map((e) => [e.id, e])),
    [data],
  );

  /** 适应画布：整图缩放到可见并居中（概览优先）；超出最小缩放时尽量让中心资源居中 */
  const fitView = useCallback(() => {
    const b = layout?.bounds;
    if (!b) return;
    const bw = b.maxX - b.minX;
    const bh = b.maxY - b.minY;
    const k = clamp(Math.min(canvasW / bw, height / bh), K_MIN, 1);
    const hx = canvasW / 2 / k;
    const hy = height / 2 / k;
    setView({
      k,
      cx:
        bw <= hx * 2
          ? (b.minX + b.maxX) / 2
          : clamp(0, b.minX + hx, b.maxX - hx),
      cy:
        bh <= hy * 2
          ? (b.minY + b.maxY) / 2
          : clamp(0, b.minY + hy, b.maxY - hy),
    });
  }, [layout, canvasW, height]);

  // 数据 / 层深 / 容器宽度变化后重置视口
  useEffect(() => {
    fitView();
  }, [fitView]);

  /** 缩放：保持锚点（容器内像素坐标，缺省为画布中心）下的图坐标不动 */
  const zoomBy = useCallback(
    (factor: number, anchor?: Point) => {
      setView((v) => {
        const k = clamp(v.k * factor, K_MIN, K_MAX);
        if (k === v.k) return v;
        const ax = (anchor?.x ?? canvasW / 2) - canvasW / 2;
        const ay = (anchor?.y ?? height / 2) - height / 2;
        return {
          k,
          cx: v.cx + ax / v.k - ax / k,
          cy: v.cy + ay / v.k - ay / k,
        };
      });
    },
    [canvasW, height],
  );

  // 滚轮缩放需要非被动监听（阻止页面滚动）
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      zoomBy(e.deltaY > 0 ? 1 / 1.15 : 1.15, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
    // svg 只在有图时渲染：随其出现 / 消失重新挂载监听
  }, [zoomBy, hasGraph]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
    setHover(null);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const start = dragRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!movedRef.current) {
      // 超过 3px 才算拖拽（否则视为点击）
      if (Math.abs(dx) + Math.abs(dy) <= 3) return;
      movedRef.current = true;
      setDragging(true);
    }
    setView((v) => ({ ...v, cx: v.cx - dx / v.k, cy: v.cy - dy / v.k }));
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  // 悬停高亮集：悬停节点 → 其自身 + 邻居；悬停边 → 两端节点
  const hoverNode = hover?.kind === 'node' ? hover.id : null;
  const hoverEdge = hover?.kind === 'edge' ? edgeById.get(hover.id) : undefined;
  const activeNodeIds = useMemo(() => {
    if (!layout) return null;
    if (hoverNode) {
      return new Set<string>([
        hoverNode,
        ...(layout.adjacency.get(hoverNode) ?? []),
      ]);
    }
    if (hoverEdge) return new Set<string>([hoverEdge.srcId, hoverEdge.dstId]);
    return null;
  }, [layout, hoverNode, hoverEdge]);

  // 图例只列数据中出现的状态
  const presentStatuses = useMemo(() => {
    if (!data) return [] as CmdbCIStatus[];
    const present = new Set(data.nodes.map((n) => n.status));
    return CMDB_CI_STATUS_ORDER.filter((s) => present.has(s));
  }, [data]);

  /** 浮层定位：跟随指针，默认在指针上方，贴近画布顶部时翻到下方；水平限制在容器内 */
  const placeTip = useCallback(() => {
    const tip = tipRef.current;
    const box = wrapRef.current;
    if (!tip || !box) return;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const { x, y } = pointerRef.current;
    const left = clamp(x - w / 2, 8, Math.max(8, box.clientWidth - w - 8));
    const top = y - h - 14 < 8 ? y + 18 : y - h - 14;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }, []);
  const trackPointer = useCallback(
    (e: React.PointerEvent) => {
      if (dragRef.current) return;
      const box = wrapRef.current;
      if (!box) return;
      const rect = box.getBoundingClientRect();
      pointerRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      placeTip();
    },
    [placeTip],
  );
  useEffect(() => {
    if (hover) placeTip();
  }, [hover, placeTip]);

  /** 键盘聚焦节点：浮层摆到节点当前屏幕位置（与悬停同效） */
  const focusNode = (n: TopologyNode) => {
    const p = layout?.pos.get(n.id);
    if (!p) return;
    pointerRef.current = {
      x: (p.x - view.cx) * view.k + canvasW / 2,
      y: (p.y - halfSize(n.depth).h - view.cy) * view.k + height / 2,
    };
    setHover({ kind: 'node', id: n.id });
  };

  const nodeName = (id: string) => layout?.nodeById.get(id)?.name ?? id;

  const controlBtn = (
    key: string,
    label: string,
    icon: 'plus' | 'minus' | 'fit',
    onClick: () => void,
  ) => (
    <Tooltip key={key} title={label} placement="left">
      <button
        type="button"
        className={styles.controlBtn}
        aria-label={label}
        onClick={onClick}
      >
        <UiIcon name={icon} />
      </button>
    </Tooltip>
  );

  const hx = canvasW / 2 / view.k;
  const hy = height / 2 / view.k;
  const labelsAlways = (data?.edges.length ?? 0) <= LABEL_ALWAYS_MAX;

  return (
    <Card variant="outlined" styles={{ body: { padding: 0 } }}>
      <div className={styles.toolbar}>
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
          <span className={styles.summary}>
            {t('pages.cmdb.topology.summary', {
              nodes: data.nodes.length,
              edges: data.edges.length,
            })}
          </span>
        )}
        <span className={styles.spacer} />
        {hasGraph && (
          <div className={styles.legend}>
            {presentStatuses.map((s) => (
              <span key={s} className={styles.legendItem}>
                <i
                  className={styles.legendDot}
                  style={{ background: statusColor[s] }}
                />
                {statusText(s)}
              </span>
            ))}
          </div>
        )}
      </div>
      {data?.truncated && (
        <Alert
          type="warning"
          showIcon
          banner
          className={styles.alert}
          title={t('pages.cmdb.topology.truncated')}
        />
      )}
      <div ref={combinedRef} className={styles.canvas} style={{ height }}>
        {hasGraph && layout && (
          <>
            <svg
              ref={svgRef}
              className={styles.svg}
              role="img"
              aria-label={t('pages.cmdb.topology.title')}
              viewBox={`${view.cx - hx} ${view.cy - hy} ${hx * 2} ${hy * 2}`}
              style={{ cursor: dragging ? 'grabbing' : 'grab' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={() => {
                onPointerUp();
                setHover(null);
              }}
            >
              <title>{t('pages.cmdb.topology.title')}</title>
              <defs>
                <marker
                  id="cmdb-topo-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  markerUnits="userSpaceOnUse"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M 1 1.5 L 9 5 L 1 8.5 z"
                    fill={token.colorTextQuaternary}
                  />
                </marker>
                <marker
                  id="cmdb-topo-arrow-on"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  markerUnits="userSpaceOnUse"
                  orient="auto-start-reverse"
                >
                  <path d="M 1 1.5 L 9 5 L 1 8.5 z" fill={token.colorPrimary} />
                </marker>
                <filter
                  id="cmdb-topo-shadow"
                  x="-20%"
                  y="-40%"
                  width="140%"
                  height="200%"
                >
                  <feDropShadow
                    dx="0"
                    dy="1"
                    stdDeviation="2"
                    floodColor="#000"
                    floodOpacity="0.06"
                  />
                </filter>
                {/* 点阵底纹：随视口平移 / 缩放 */}
                <pattern
                  id="cmdb-topo-grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r="1" fill={token.colorFill} />
                </pattern>
              </defs>
              <rect
                x={view.cx - hx}
                y={view.cy - hy}
                width={hx * 2}
                height={hy * 2}
                fill="url(#cmdb-topo-grid)"
                pointerEvents="none"
              />
              {/* 关系边 */}
              {edgePaths.map(({ id, d }) => {
                const e = edgeById.get(id);
                if (!e) return null;
                const on =
                  (!!hoverNode &&
                    (e.srcId === hoverNode || e.dstId === hoverNode)) ||
                  (hover?.kind === 'edge' && hover.id === id);
                return (
                  <g
                    key={id}
                    style={{
                      opacity: !on && activeNodeIds ? 0.25 : 1,
                      transition: `opacity ${token.motionDurationMid}`,
                    }}
                  >
                    <path
                      className={styles.edge}
                      d={d}
                      stroke={
                        on ? token.colorPrimary : token.colorTextQuaternary
                      }
                      strokeWidth={on ? 1.8 : 1.4}
                      markerEnd={`url(#cmdb-topo-arrow${on ? '-on' : ''})`}
                    />
                    <path
                      className={styles.hit}
                      d={d}
                      onPointerEnter={(ev) => {
                        if (dragRef.current) return;
                        trackPointer(ev);
                        setHover({ kind: 'edge', id });
                      }}
                      onPointerMove={trackPointer}
                      onPointerLeave={() => setHover(null)}
                    />
                  </g>
                );
              })}
              {/* 节点卡片：图标块 + 名称 + 模型 · 环境 + 状态点；当前资源主色强调 */}
              {data.nodes.map((n) => {
                const p = layout.pos.get(n.id);
                if (!p) return null;
                const center = n.depth === 0;
                const { w, h } = halfSize(n.depth);
                const tile = center ? 36 : 30;
                const iconSize = center ? 20 : 16;
                const active = activeNodeIds?.has(n.id) ?? false;
                const dim = !!activeNodeIds && !active;
                const textX = -w + 10 + tile + 10;
                const textW = w - 24 - textX;
                const nameFs = center ? 14 : 13;
                const sub = n.env ? `${n.modelName} · ${n.env}` : n.modelName;
                const statusLabel = statusText(n.status as CmdbCIStatus);
                const dotColor = statusColor[n.status] ?? token.colorBorder;
                return (
                  <g
                    key={n.id}
                    className={styles.node}
                    role={center ? 'img' : 'link'}
                    tabIndex={0}
                    aria-label={`${n.modelName} ${n.name}，${statusLabel}${n.env ? `，${t('pages.cmdb.topology.tooltip.env')} ${n.env}` : ''}`}
                    transform={`translate(${p.x} ${p.y})`}
                    style={{
                      opacity: dim ? 0.35 : 1,
                      cursor: center ? 'default' : 'pointer',
                    }}
                    onPointerEnter={(e) => {
                      if (dragRef.current) return;
                      trackPointer(e);
                      setHover({ kind: 'node', id: n.id });
                    }}
                    onPointerMove={trackPointer}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => focusNode(n)}
                    onBlur={() => setHover(null)}
                    onClick={() => {
                      if (!center && !movedRef.current)
                        history.push(`/cmdb/ci/${n.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (!center && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        history.push(`/cmdb/ci/${n.id}`);
                      }
                    }}
                  >
                    {center && (
                      <rect
                        x={-w - 5}
                        y={-h - 5}
                        width={w * 2 + 10}
                        height={h * 2 + 10}
                        rx={15}
                        fill={token.colorPrimary}
                        opacity={0.1}
                        pointerEvents="none"
                      />
                    )}
                    <rect
                      className={styles.nodeBox}
                      x={-w}
                      y={-h}
                      width={w * 2}
                      height={h * 2}
                      rx={10}
                      fill={token.colorBgContainer}
                      stroke={
                        center || active
                          ? token.colorPrimary
                          : token.colorBorderSecondary
                      }
                      strokeWidth={center ? 1.5 : active ? 1.4 : 1}
                      filter="url(#cmdb-topo-shadow)"
                    />
                    <rect
                      x={-w + 10}
                      y={-tile / 2}
                      width={tile}
                      height={tile}
                      rx={8}
                      fill={
                        center ? token.colorPrimary : token.colorFillTertiary
                      }
                      pointerEvents="none"
                    />
                    <g
                      pointerEvents="none"
                      transform={`translate(${-w + 10 + (tile - iconSize) / 2} ${-iconSize / 2})`}
                      style={{
                        color: center
                          ? token.colorTextLightSolid
                          : token.colorTextSecondary,
                      }}
                    >
                      <ModelGlyph
                        icon={modelByCode.get(n.modelCode)?.icon}
                        size={iconSize}
                      />
                    </g>
                    <text
                      x={textX}
                      y={-3}
                      fontSize={nameFs}
                      fontWeight={center ? 600 : 500}
                      fill={token.colorText}
                      pointerEvents="none"
                    >
                      {fitLabel(n.name, textW, nameFs)}
                    </text>
                    <text
                      x={textX}
                      y={14}
                      fontSize={11}
                      fill={token.colorTextTertiary}
                      pointerEvents="none"
                    >
                      {fitLabel(sub, textW, 11)}
                    </text>
                    {/* 状态点（带同色光晕），与图例对照 */}
                    <circle
                      cx={w - 14}
                      r={7}
                      fill={dotColor}
                      opacity={0.16}
                      pointerEvents="none"
                    />
                    <circle
                      cx={w - 14}
                      r={3.5}
                      fill={dotColor}
                      pointerEvents="none"
                    />
                  </g>
                );
              })}
              {/* 关系名标签：关系少时常显，否则仅高亮的边显示 */}
              {edgePaths.map(({ id, mid }) => {
                const e = edgeById.get(id);
                if (!e?.name) return null;
                const on =
                  (!!hoverNode &&
                    (e.srcId === hoverNode || e.dstId === hoverNode)) ||
                  (hover?.kind === 'edge' && hover.id === id);
                if (!on && (!labelsAlways || activeNodeIds)) return null;
                const label = fitLabel(e.name, GAP_X - 40, 11);
                const lw = textWidth(label, 11) + 14;
                return (
                  <g
                    key={id}
                    transform={`translate(${mid.x} ${mid.y})`}
                    pointerEvents="none"
                  >
                    <rect
                      x={-lw / 2}
                      y={-9}
                      width={lw}
                      height={18}
                      rx={9}
                      fill={on ? token.colorPrimaryBg : token.colorBgContainer}
                      stroke={
                        on
                          ? token.colorPrimaryBorder
                          : token.colorBorderSecondary
                      }
                    />
                    <text
                      textAnchor="middle"
                      y={4}
                      fontSize={11}
                      fill={on ? token.colorPrimary : token.colorTextSecondary}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
            {/* 悬停浮层：节点详情 / 关系名 + 两端资源 */}
            {hover && (
              <div ref={tipRef} className={styles.tooltip}>
                {hover.kind === 'node'
                  ? (() => {
                      const n = layout.nodeById.get(hover.id);
                      if (!n) return null;
                      return (
                        <>
                          <div className={styles.tooltipTitle}>{n.name}</div>
                          <div className={styles.tooltipRow}>
                            <span>
                              {t('pages.cmdb.topology.tooltip.model')}
                            </span>
                            <span className={styles.tooltipVal}>
                              {n.modelName}
                            </span>
                          </div>
                          <div className={styles.tooltipRow}>
                            <span>
                              {t('pages.cmdb.topology.tooltip.status')}
                            </span>
                            <span className={styles.tooltipVal}>
                              <i
                                className={styles.tipDot}
                                style={{
                                  background:
                                    statusColor[n.status] ?? token.colorBorder,
                                }}
                              />
                              {statusText(n.status as CmdbCIStatus)}
                            </span>
                          </div>
                          {n.env && (
                            <div className={styles.tooltipRow}>
                              <span>
                                {t('pages.cmdb.topology.tooltip.env')}
                              </span>
                              <span className={styles.tooltipVal}>{n.env}</span>
                            </div>
                          )}
                          {n.depth > 0 && (
                            <div className={styles.tooltipRow}>
                              <span>
                                {t('pages.cmdb.topology.tooltip.layer')}
                              </span>
                              <span className={styles.tooltipVal}>
                                {n.depth}
                              </span>
                            </div>
                          )}
                          {n.depth > 0 && (
                            <div className={styles.tooltipHint}>
                              {t('pages.cmdb.topology.tooltip.view')}
                            </div>
                          )}
                        </>
                      );
                    })()
                  : (() => {
                      const e = edgeById.get(hover.id);
                      if (!e) return null;
                      return (
                        <>
                          <div className={styles.tooltipTitle}>{e.name}</div>
                          <div className={styles.tooltipRow}>
                            <span>
                              {nodeName(e.srcId)} → {nodeName(e.dstId)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
              </div>
            )}
            <div className={styles.controls}>
              {controlBtn('in', t('pages.cmdb.topology.zoomIn'), 'plus', () =>
                zoomBy(1.2),
              )}
              {controlBtn(
                'out',
                t('pages.cmdb.topology.zoomOut'),
                'minus',
                () => zoomBy(1 / 1.2),
              )}
              {controlBtn('fit', t('pages.cmdb.topology.fit'), 'fit', fitView)}
            </div>
            <div className={styles.hint}>{t('pages.cmdb.topology.hint')}</div>
          </>
        )}
        {loading ? (
          <div className={cls(styles.overlay, hasGraph && styles.overlayMask)}>
            <Spin />
          </div>
        ) : (
          !hasGraph && (
            <div className={styles.overlay}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('pages.cmdb.topology.empty')}
              />
            </div>
          )
        )}
      </div>
    </Card>
  );
};
