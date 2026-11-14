/**
 * 模型关系图：有关联的模型按关系方向从左到右分层排布（最长路径分层 + 重心法减少交叉，
 * 跨层的边经占位槽绕开中间列），未建立关联的模型收拢到下方网格；节点 = 模型卡片，
 * 边 = 关联类型（正向名 + 基数）。手写 SVG（不引图库）。
 * 交互：悬停聚焦（邻接高亮、其余淡出）、关键字搜索高亮、浮层详情；
 * 支持滚轮缩放 / 拖拽平移 / 适应画布，点击节点回调。
 * 节点身份不靠颜色（名称 + 图标 + 分组名）；图标徽标底色仅区分内置 / 自定义（工具栏图例），
 * 配色全部走主题 token；画布为随视口平移 / 缩放的点阵底。
 */
import { SearchOutlined } from '@ant-design/icons';
import { Empty, Input, Tooltip } from 'antd';
import { createStyles, useTheme } from 'antd-style';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CmdbCardinality } from '@/services/cmdb/typings';
import { useT } from '@/utils/i18n';
import { useSize } from './charts';
import { ModelGlyph, UiIcon } from './icons';
import { CMDB_ANY_MODEL } from './meta';

const useStyles = createStyles(({ token, css }) => ({
  /** 容器：工具栏 + 点阵画布 */
  container: css`
    overflow: hidden;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
  `,
  toolbar: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
    padding: 12px 16px;
    border-block-end: 1px solid ${token.colorSplit};
  `,
  /** 与模型管理 / 资源实例的搜索框同规格（默认尺寸、280 宽） */
  search: css`
    width: 280px;
  `,
  summary: css`
    color: ${token.colorTextSecondary};
  `,
  spacer: css`
    flex: 1;
  `,
  legend: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    align-items: center;
    color: ${token.colorTextSecondary};
  `,
  legendItem: css`
    display: inline-flex;
    gap: 6px;
    align-items: center;
  `,
  /** 图例徽标（与节点图标徽标同款式）：内置 / 自定义 */
  legendBadgeBuiltin: css`
    width: 14px;
    height: 14px;
    background: ${token.colorFillTertiary};
    border-radius: 4px;
  `,
  legendBadgeCustom: css`
    width: 14px;
    height: 14px;
    background: ${token.colorPrimaryBg};
    border: 1px solid ${token.colorPrimaryBorder};
    border-radius: 4px;
  `,
  /** 点阵画布 */
  wrap: css`
    position: relative;
    overflow: hidden;
    background-color: ${token.colorBgLayout};
    background-image: radial-gradient(
      circle at 1px 1px,
      ${token.colorFill} 1px,
      transparent 0
    );
    cursor: grab;
    touch-action: none;
    user-select: none;
    &:active {
      cursor: grabbing;
    }
  `,
  /** 未关联区：标题 + 分隔线 */
  sectionLabel: css`
    fill: ${token.colorTextTertiary};
    font-size: 12px;
    font-weight: 500;
  `,
  sectionLine: css`
    stroke: ${token.colorBorder};
    stroke-width: 1;
    stroke-dasharray: 4 4;
  `,
  nodeCard: css`
    fill: ${token.colorBgContainer};
    stroke: ${token.colorBorderSecondary};
    stroke-width: 1;
    cursor: pointer;
    transition: stroke ${token.motionDurationMid};
  `,
  nodeG: css`
    transition: opacity ${token.motionDurationMid};
  `,
  /** 节点语义链接（SVG a）：焦点样式由卡片描边高亮表达 */
  nodeLink: css`
    text-decoration: none;
    &:focus {
      outline: none;
    }
  `,
  nodeName: css`
    fill: ${token.colorText};
    font-size: 13px;
    font-weight: 500;
  `,
  nodeCode: css`
    fill: ${token.colorTextTertiary};
    font-size: 11px;
  `,
  nodeCountChip: css`
    fill: ${token.colorFillTertiary};
  `,
  nodeCountText: css`
    fill: ${token.colorTextTertiary};
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  `,
  edge: css`
    transition: opacity ${token.motionDurationMid};
  `,
  edgePath: css`
    stroke: ${token.colorTextQuaternary};
    stroke-width: 1.4;
    fill: none;
    transition: stroke ${token.motionDurationMid};
  `,
  edgeOn: css`
    stroke: ${token.colorPrimary};
    stroke-width: 1.8;
  `,
  edgeHit: css`
    stroke: transparent;
    stroke-width: 14;
    fill: none;
    cursor: pointer;
  `,
  edgeLabelBg: css`
    fill: ${token.colorBgContainer};
    stroke: ${token.colorBorderSecondary};
    transition: fill ${token.motionDurationMid};
  `,
  edgeLabelBgOn: css`
    fill: ${token.colorPrimaryBg};
    stroke: ${token.colorPrimaryBorder};
  `,
  edgeLabelText: css`
    fill: ${token.colorTextSecondary};
    font-size: 11px;
    transition: fill ${token.motionDurationMid};
  `,
  edgeLabelTextOn: css`
    fill: ${token.colorPrimary};
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
    cursor: default;
  `,
  hint: css`
    position: absolute;
    bottom: 14px;
    left: 16px;
    color: ${token.colorTextQuaternary};
    font-size: ${token.fontSizeSM}px;
    pointer-events: none;
  `,
  empty: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
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
  tooltipHint: css`
    margin-top: 4px;
    padding-top: 4px;
    color: ${token.colorTextQuaternary};
    font-size: ${token.fontSizeSM}px;
    border-top: 1px solid ${token.colorSplit};
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

const NODE_W = 220;
const NODE_H = 52;
/** 层间距（容纳关系标签）：左右布局 / 上下布局 */
const GAP_LR = 150;
const GAP_TB = 72;
/** 未关联网格的间距、与上方关系图的间隔（含标题） */
const GRID_GAP = 16;
const SECTION_GAP = 56;
const SECTION_HEAD = 28;
const PAD = 40;
/** 关联数不超过该值时边标签常显，否则仅悬停高亮时显示 */
const LABEL_ALWAYS_MAX = 24;

const CARDINALITY_TEXT: Record<CmdbCardinality, string> = {
  one_to_one: '1-1',
  one_to_many: '1-N',
  many_to_many: 'N-N',
};

interface Pt {
  x: number;
  y: number;
}

/** 估宽（CJK 全宽 / 其余近似 0.58em），用于 SVG 文本截断 */
const charWidth = (ch: string, cjk: number) =>
  ch.charCodeAt(0) > 0x2e7f ? cjk : cjk * 0.58;
const textWidth = (s: string, cjk = 12) => {
  let w = 0;
  for (const ch of s) w += charWidth(ch, cjk);
  return w;
};
/** 按估宽截断：超出 maxW 时保留前缀 + 省略号 */
const truncate = (s: string, maxW: number, cjk = 12) => {
  if (textWidth(s, cjk) <= maxW) return s;
  let out = '';
  let w = 0;
  for (const ch of s) {
    const cw = charWidth(ch, cjk);
    if (w + cw + cjk > maxW) break;
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

interface LaidEdge {
  rel: GraphRelation;
  d: string;
  /** 标签中心与宽度（文本已按可用宽度截断） */
  mid: Pt;
  label: string;
  labelW: number;
  /** 为破环而反向排布的边：箭头画在路径起点 */
  reversed: boolean;
}

/**
 * 布局：
 * 1. 有关联的模型：DFS 破环 → 最长路径分层（无入边的源点贴近其下游）→ 跨层边插入占位槽
 *    → 重心法往返扫描减少交叉 → 每层居中排布；分层方向 orient 可为左→右 / 上→下；
 * 2. 未关联的模型：下方网格（按分组顺序）；
 * 3. 边：相邻层间贝塞尔，经占位槽时走直线；同一节点的多条边端口沿卡片边错开。
 */
const buildLayout = (
  models: GraphModel[],
  relations: GraphRelation[],
  groupOrder: string[] | undefined,
  orient: 'LR' | 'TB',
) => {
  const rank = new Map((groupOrder ?? []).map((g, i) => [g, i]));
  const ordered = models
    .map((m, i) => ({ m, i }))
    .sort(
      (a, b) =>
        (rank.get(a.m.category) ?? 1e9) - (rank.get(b.m.category) ?? 1e9) ||
        a.i - b.i,
    )
    .map((x) => x.m);
  const byCode = new Map(ordered.map((m) => [m.code, m]));
  const rels = relations.filter(
    (r) =>
      r.srcModel !== CMDB_ANY_MODEL &&
      r.dstModel !== CMDB_ANY_MODEL &&
      r.srcModel !== r.dstModel &&
      byCode.has(r.srcModel) &&
      byCode.has(r.dstModel),
  );
  const linkedSet = new Set(rels.flatMap((r) => [r.srcModel, r.dstModel]));
  const linked = ordered.filter((m) => linkedSet.has(m.code));
  const unlinked = ordered.filter((m) => !linkedSet.has(m.code));

  // 1) 破环（Eades 贪心排序）：反复摘掉汇点（放右）/ 源点（放左），都没有时摘
  //    出度 - 入度最大的点；排序中从右指向左的边在分层时反向，反向边数量尽量少
  const outs = new Map<string, string[]>(linked.map((m) => [m.code, []]));
  const ins = new Map<string, string[]>(linked.map((m) => [m.code, []]));
  for (const r of rels) {
    outs.get(r.srcModel)?.push(r.dstModel);
    ins.get(r.dstModel)?.push(r.srcModel);
  }
  const remaining = new Set(linked.map((m) => m.code));
  const degree = (nb: Map<string, string[]>, v: string) =>
    (nb.get(v) ?? []).filter((x) => remaining.has(x)).length;
  const left: string[] = [];
  const right: string[] = [];
  while (remaining.size) {
    let moved = true;
    while (moved) {
      moved = false;
      for (const v of [...remaining]) {
        if (degree(outs, v) === 0) {
          right.unshift(v);
          remaining.delete(v);
          moved = true;
        }
      }
      for (const v of [...remaining]) {
        if (degree(ins, v) === 0) {
          left.push(v);
          remaining.delete(v);
          moved = true;
        }
      }
    }
    let best: string | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const v of remaining) {
      const score = degree(outs, v) - degree(ins, v);
      if (score > bestScore) {
        best = v;
        bestScore = score;
      }
    }
    if (best !== null) {
      left.push(best);
      remaining.delete(best);
    }
  }
  const seq = new Map([...left, ...right].map((code, i) => [code, i]));
  /** 每条关系在图上的起 → 止端点（反向边起止对调） */
  const spans = rels.map((r) => {
    const reversed = (seq.get(r.srcModel) ?? 0) > (seq.get(r.dstModel) ?? 0);
    return {
      rel: r,
      reversed,
      a: reversed ? r.dstModel : r.srcModel,
      b: reversed ? r.srcModel : r.dstModel,
    };
  });

  // 2) 最长路径分层
  const preds = new Map<string, string[]>(linked.map((m) => [m.code, []]));
  const succs = new Map<string, string[]>(linked.map((m) => [m.code, []]));
  for (const s of spans) {
    preds.get(s.b)?.push(s.a);
    succs.get(s.a)?.push(s.b);
  }
  const layerOf = new Map<string, number>();
  const calc = (v: string): number => {
    const known = layerOf.get(v);
    if (known !== undefined) return known;
    let l = 0;
    for (const u of preds.get(v) ?? []) l = Math.max(l, calc(u) + 1);
    layerOf.set(v, l);
    return l;
  };
  for (const m of linked) calc(m.code);
  // 源点贴近下游，缩短跨层边
  for (const m of linked) {
    const ss = succs.get(m.code) ?? [];
    if (!(preds.get(m.code) ?? []).length && ss.length) {
      layerOf.set(m.code, Math.min(...ss.map((v) => layerOf.get(v) ?? 1)) - 1);
    }
  }
  const layerCount = linked.length
    ? Math.max(...linked.map((m) => layerOf.get(m.code) ?? 0)) + 1
    : 0;
  const layers: string[][] = Array.from({ length: layerCount }, () => []);
  for (const m of linked) layers[layerOf.get(m.code) ?? 0].push(m.code);

  // 3) 跨层边的占位槽（id 以 ~ 开头）+ 相邻层邻接
  const up = new Map<string, string[]>();
  const down = new Map<string, string[]>();
  const connect = (x: string, y: string) => {
    down.set(x, [...(down.get(x) ?? []), y]);
    up.set(y, [...(up.get(y) ?? []), x]);
  };
  const chains = spans.map((s) => {
    const la = layerOf.get(s.a) ?? 0;
    const lb = layerOf.get(s.b) ?? 0;
    const chain = [s.a];
    for (let l = la + 1; l < lb; l++) {
      const id = `~${s.rel.code}~${l}`;
      layers[l].push(id);
      chain.push(id);
    }
    chain.push(s.b);
    for (let i = 1; i < chain.length; i++) connect(chain[i - 1], chain[i]);
    return chain;
  });

  // 4) 重心法：按相邻层邻居的平均位置排序，往返 4 轮
  const sweep = (layer: string[], ref: string[], nb: Map<string, string[]>) => {
    const refIdx = new Map(ref.map((id, i) => [id, i]));
    const key = new Map(
      layer.map((id, i) => {
        const ns = (nb.get(id) ?? [])
          .map((n) => refIdx.get(n))
          .filter((x): x is number => x !== undefined);
        return [
          id,
          ns.length
            ? ns.reduce((p, c) => p + c, 0) / ns.length
            : (i / Math.max(1, layer.length - 1)) * Math.max(0, ref.length - 1),
        ];
      }),
    );
    const idx = new Map(layer.map((id, i) => [id, i]));
    layer.sort(
      (x, y) =>
        (key.get(x) ?? 0) - (key.get(y) ?? 0) ||
        (idx.get(x) ?? 0) - (idx.get(y) ?? 0),
    );
  };
  for (let round = 0; round < 4; round++) {
    for (let l = 1; l < layerCount; l++) sweep(layers[l], layers[l - 1], up);
    for (let l = layerCount - 2; l >= 0; l--)
      sweep(layers[l], layers[l + 1], down);
  }

  // 5) 坐标（抽象轴：main = 分层方向，cross = 层内方向；LR 时 main 为 x，TB 时为 y）
  const lr = orient === 'LR';
  const mainSize = lr ? NODE_W : NODE_H;
  const crossSize = lr ? NODE_H : NODE_W;
  const mainGap = lr ? GAP_LR : GAP_TB;
  const crossGap = lr ? 18 : 28;
  /** 跨层边在中间层占的槽宽 */
  const slotSize = lr ? 26 : 28;
  const isSlot = (id: string) => id.startsWith('~');
  /** id → main 起点、cross 中线（相对关系图块） */
  const place = new Map<string, { m: number; c: number }>();
  let lo = 0;
  let hi = 0;
  layers.forEach((layer, l) => {
    const sizes = layer.map((id) => (isSlot(id) ? slotSize : crossSize));
    const total =
      sizes.reduce((p, c) => p + c, 0) +
      crossGap * Math.max(0, layer.length - 1);
    let c = -total / 2;
    lo = Math.min(lo, c);
    hi = Math.max(hi, c + total);
    layer.forEach((id, i) => {
      place.set(id, { m: l * (mainSize + mainGap), c: c + sizes[i] / 2 });
      c += sizes[i] + crossGap;
    });
  });
  const mainLen = layerCount
    ? layerCount * mainSize + (layerCount - 1) * mainGap
    : 0;
  const linkedW = lr ? mainLen : hi - lo;
  const linkedH = lr ? hi - lo : mainLen;

  // 未关联网格
  const cols = unlinked.length
    ? Math.min(
        unlinked.length,
        linked.length
          ? clamp(Math.floor((linkedW + GRID_GAP) / (NODE_W + GRID_GAP)), 3, 6)
          : clamp(Math.ceil(Math.sqrt(unlinked.length * 1.5)), 1, 5),
      )
    : 0;
  const gridRows = cols ? Math.ceil(unlinked.length / cols) : 0;
  const gridW = cols ? cols * NODE_W + (cols - 1) * GRID_GAP : 0;
  const gridH = gridRows ? gridRows * NODE_H + (gridRows - 1) * GRID_GAP : 0;
  const innerW = Math.max(linkedW, gridW);
  const linkedX = PAD + (innerW - linkedW) / 2;
  const gridX = PAD + (innerW - gridW) / 2;
  const sectionY = PAD + linkedH + (linked.length ? SECTION_GAP : 0);
  const gridY = sectionY + SECTION_HEAD;
  const toXY = (m: number, c: number): Pt =>
    lr
      ? { x: linkedX + m, y: PAD + c - lo }
      : { x: linkedX + c - lo, y: PAD + m };

  const nodes = new Map<string, { model: GraphModel; x: number; y: number }>();
  for (const m of linked) {
    const p = place.get(m.code);
    if (!p) continue;
    const o = toXY(p.m, p.c);
    nodes.set(m.code, {
      model: m,
      x: lr ? o.x : o.x - NODE_W / 2,
      y: lr ? o.y - NODE_H / 2 : o.y,
    });
  }
  unlinked.forEach((m, i) => {
    nodes.set(m.code, {
      model: m,
      x: gridX + (i % cols) * (NODE_W + GRID_GAP),
      y: gridY + Math.floor(i / cols) * (NODE_H + GRID_GAP),
    });
  });

  // 6) 端口：同一节点同侧的多条边按对端位置排序，沿卡片边均匀错开
  const startOff = new Array<number>(spans.length).fill(0);
  const endOff = new Array<number>(spans.length).fill(0);
  const outPorts = new Map<string, { si: number; c: number }[]>();
  const inPorts = new Map<string, { si: number; c: number }[]>();
  spans.forEach((s, si) => {
    const chain = chains[si];
    const next = place.get(chain[1]);
    const prev = place.get(chain[chain.length - 2]);
    if (next)
      outPorts.set(s.a, [...(outPorts.get(s.a) ?? []), { si, c: next.c }]);
    if (prev)
      inPorts.set(s.b, [...(inPorts.get(s.b) ?? []), { si, c: prev.c }]);
  });
  const spread = (
    ports: Map<string, { si: number; c: number }[]>,
    target: number[],
  ) => {
    for (const list of ports.values()) {
      const n = list.length;
      if (n < 2) continue;
      const step = Math.min(lr ? 10 : 22, (crossSize * 0.6) / (n - 1));
      list
        .sort((x, y) => x.c - y.c || x.si - y.si)
        .forEach((p, i) => {
          target[p.si] = (i - (n - 1) / 2) * step;
        });
    }
  };
  spread(outPorts, startOff);
  spread(inPorts, endOff);

  // 7) 边几何
  const outDeg = new Map<string, number>();
  const inDeg = new Map<string, number>();
  for (const s of spans) {
    outDeg.set(s.a, (outDeg.get(s.a) ?? 0) + 1);
    inDeg.set(s.b, (inDeg.get(s.b) ?? 0) + 1);
  }
  const maxLabelW = lr ? GAP_LR - 24 : 150;
  /** 已放置的标签（中心 + 宽），用于避让 */
  const placed: { x: number; y: number; w: number }[] = [];
  const collides = (p: Pt, w: number) =>
    placed.some(
      (q) =>
        Math.abs(q.y - p.y) < 20 && Math.abs(q.x - p.x) < (q.w + w) / 2 + 4,
    );
  const edges: LaidEdge[] = [];
  spans.forEach((s, si) => {
    const chain = chains[si];
    const pa = place.get(s.a);
    const pb = place.get(s.b);
    if (!pa || !pb) return;
    // 箭头端留 3px 空隙
    const start = {
      m: pa.m + mainSize + (s.reversed ? 3 : 0),
      c: pa.c + startOff[si],
    };
    const end = { m: pb.m - (s.reversed ? 0 : 3), c: pb.c + endOff[si] };
    const o = toXY(start.m, start.c);
    let d = `M${o.x},${o.y}`;
    let cur = start;
    const label = truncate(
      `${s.rel.forwardName} · ${CARDINALITY_TEXT[s.rel.cardinality]}`,
      maxLabelW,
      11,
    );
    const labelW = textWidth(label, 11) + 16;
    /** 标签候选位（按优先级）：依次为各段曲线上的点、占位槽直线段中点 */
    const cands: Pt[] = [];
    const curveTo = (to: { m: number; c: number }, t: number) => {
      const from = cur;
      const mm = (from.m + to.m) / 2;
      const c1 = toXY(mm, from.c);
      const c2 = toXY(mm, to.c);
      const p = toXY(to.m, to.c);
      d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p.x},${p.y}`;
      // 标签候选位：本段曲线上首选 t，其次沿曲线换位
      for (const tt of [t, 0.5, 0.36, 0.64, 0.26, 0.74]) {
        cands.push(
          toXY(
            bezierAt(from.m, mm, mm, to.m, tt),
            bezierAt(from.c, from.c, to.c, to.c, tt),
          ),
        );
      }
    };
    // 标签偏向分叉更少的一端，避免扇形边的标签叠在出口处
    const fanOut = outDeg.get(s.a) ?? 1;
    const fanIn = inDeg.get(s.b) ?? 1;
    const t = fanIn > fanOut ? 0.36 : fanOut > fanIn ? 0.64 : 0.5;
    for (const id of chain.slice(1, -1)) {
      const p = place.get(id);
      if (!p) continue;
      curveTo({ m: p.m, c: p.c }, 0.5);
      const exit = toXY(p.m + mainSize, p.c);
      d += ` L${exit.x},${exit.y}`;
      cands.push(toXY(p.m + mainSize / 2, p.c));
      cur = { m: p.m + mainSize, c: p.c };
    }
    curveTo(end, t);
    // 取第一个不与已放置标签重叠的候选位；都重叠则用首选位
    const mid = cands.find((q) => !collides(q, labelW)) ?? cands[0];
    placed.push({ ...mid, w: labelW });
    edges.push({
      rel: s.rel,
      d,
      mid,
      label,
      labelW,
      reversed: s.reversed,
    });
  });

  return {
    nodes,
    edges,
    /** 未关联区（无则 null）：标题位置与分隔线范围 */
    section: unlinked.length
      ? {
          x: PAD,
          y: sectionY,
          w: innerW,
          count: unlinked.length,
          showHead: linked.length > 0,
        }
      : null,
    contentW: innerW + PAD * 2,
    contentH: (unlinked.length ? gridY + gridH : PAD + linkedH) + PAD,
  };
};

type HoverTarget = { kind: 'node' | 'edge'; key: string };

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
  const token = useTheme();
  const t = useT();
  const [wrapRef, { width }] = useSize<HTMLDivElement>();
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [keyword, setKeyword] = useState('');
  const [hover, setHover] = useState<HoverTarget | null>(null);
  const dragRef = useRef<{
    px: number;
    py: number;
    vx: number;
    vy: number;
  } | null>(null);
  /** 拖拽过则吞掉随后的 click（不用指针捕获：捕获会把 click 改派给容器） */
  const movedRef = useRef(false);
  // 浮层定位：跟随指针的最近位置（不触发渲染，直接改 style）
  const tipRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  // 左→右 / 上→下两种分层方向各算一遍，取在当前画布里缩放更大的（持平时左→右）
  const layout = useMemo(() => {
    const a = buildLayout(models, relations, groupOrder, 'LR');
    if (!width) return a;
    const b = buildLayout(models, relations, groupOrder, 'TB');
    const scaleOf = (l: typeof a) =>
      Math.min(width / l.contentW, height / l.contentH, 1.1);
    return scaleOf(b) > scaleOf(a) + 0.01 ? b : a;
  }, [models, relations, groupOrder, width, height]);

  const fitView = useCallback(() => {
    if (!width || !layout.contentW || !layout.contentH) return;
    // 整图可见并居中；内容少时不过度放大（上限 1.1），保持卡片的正常观感
    const k = clamp(
      Math.min(width / layout.contentW, height / layout.contentH),
      0.4,
      1.1,
    );
    setView({
      k,
      x: (width - layout.contentW * k) / 2,
      y: (height - layout.contentH * k) / 2,
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
    setHover(null);
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

  // ===== 悬停聚焦 + 搜索高亮 =====
  const hoverNode = hover?.kind === 'node' ? hover.key : null;
  const hoverEdge =
    hover?.kind === 'edge'
      ? layout.edges.find((e) => e.rel.code === hover.key)
      : undefined;
  // 邻接表
  const adjacency = useMemo(() => {
    const m = new Map<string, Set<string>>();
    const add = (a: string, b: string) => {
      const s = m.get(a) ?? new Set<string>();
      s.add(b);
      m.set(a, s);
    };
    for (const e of layout.edges) {
      add(e.rel.srcModel, e.rel.dstModel);
      add(e.rel.dstModel, e.rel.srcModel);
    }
    return m;
  }, [layout.edges]);
  // 高亮集：悬停节点 → 其自身 + 邻居；悬停边 → 两端
  const activeNodes = useMemo(() => {
    if (hoverNode)
      return new Set<string>([hoverNode, ...(adjacency.get(hoverNode) ?? [])]);
    if (hoverEdge)
      return new Set<string>([hoverEdge.rel.srcModel, hoverEdge.rel.dstModel]);
    return null;
  }, [hoverNode, hoverEdge, adjacency]);
  // 搜索匹配集（名称 / 标识包含关键字，忽略大小写）
  const kw = keyword.trim().toLowerCase();
  const matchSet = useMemo(() => {
    if (!kw) return null;
    return new Set(
      models
        .filter(
          (m) =>
            m.name.toLowerCase().includes(kw) ||
            m.code.toLowerCase().includes(kw),
        )
        .map((m) => m.code),
    );
  }, [kw, models]);

  /** 节点透明度：悬停聚焦优先，其次搜索匹配 */
  const nodeOpacity = (code: string) => {
    if (activeNodes) return activeNodes.has(code) ? 1 : 0.3;
    if (matchSet) return matchSet.has(code) ? 1 : 0.25;
    return 1;
  };
  /** 边透明度：悬停时只亮相关边；搜索时两端均命中才全亮 */
  const edgeOpacity = (src: string, dst: string) => {
    if (hoverNode) return src === hoverNode || dst === hoverNode ? 1 : 0.12;
    if (hoverEdge)
      return hoverEdge.rel.srcModel === src && hoverEdge.rel.dstModel === dst
        ? 1
        : 0.12;
    if (matchSet) {
      const a = matchSet.has(src);
      const b = matchSet.has(dst);
      return a && b ? 1 : a || b ? 0.3 : 0.08;
    }
    return 1;
  };
  const edgeActive = (code: string, src: string, dst: string) =>
    (!!hoverNode && (src === hoverNode || dst === hoverNode)) ||
    hoverEdge?.rel.code === code;

  // ===== 浮层定位 =====
  const placeTip = useCallback(() => {
    const tip = tipRef.current;
    const box = wrapRef.current;
    if (!tip || !box) return;
    // 默认在指针上方，贴近画布顶部时翻到下方；水平限制在容器内
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const { x, y } = pointerRef.current;
    tip.style.left = `${clamp(x - w / 2, 8, Math.max(8, box.clientWidth - w - 8))}px`;
    tip.style.top = `${y - h - 14 < 8 ? y + 18 : y - h - 14}px`;
  }, [wrapRef]);
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
  /** 键盘聚焦节点：浮层摆到节点当前屏幕位置（含缩放） */
  const focusNode = (code: string) => {
    const n = layout.nodes.get(code);
    const box = wrapRef.current;
    if (!n || !box) return;
    pointerRef.current = {
      x: view.x + (n.x + NODE_W / 2) * view.k,
      y: view.y + n.y * view.k,
    };
    setHover({ kind: 'node', key: code });
  };

  if (!models.length) {
    return (
      <div className={styles.container}>
        <div className={styles.wrap} style={{ height }}>
          <div className={styles.empty}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        </div>
      </div>
    );
  }

  const modelName = (code: string) =>
    layout.nodes.get(code)?.model.name ?? code;
  const labelsAlways = layout.edges.length <= LABEL_ALWAYS_MAX;
  // 点阵间距随缩放；缩得太小时间距翻倍，避免点阵过密
  let gridStep = 20 * view.k;
  while (gridStep < 14) gridStep *= 2;

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

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Input
          className={styles.search}
          allowClear
          prefix={<SearchOutlined />}
          placeholder={t('pages.cmdb.modelGraph.search.placeholder')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <span className={styles.spacer} />
        <span className={styles.summary}>
          {t('pages.cmdb.modelGraph.summary', {
            models: models.length,
            relations: layout.edges.length,
          })}
        </span>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <i className={styles.legendBadgeBuiltin} />
            {t('pages.cmdb.model.tag.builtin')}
          </span>
          <span className={styles.legendItem}>
            <i className={styles.legendBadgeCustom} />
            {t('pages.cmdb.model.tag.custom')}
          </span>
        </div>
      </div>
      <div
        ref={wrapRef}
        className={styles.wrap}
        style={{
          height,
          backgroundSize: `${gridStep}px ${gridStep}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => {
          endDrag();
          setHover(null);
        }}
      >
        <svg width={width} height={height}>
          <title>{title ?? ''}</title>
          <defs>
            <marker
              id="cmdb-mg-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
            >
              <path
                d="M 1 1.5 L 9 5 L 1 8.5 z"
                fill={token.colorTextQuaternary}
              />
            </marker>
            <marker
              id="cmdb-mg-arrow-on"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="9"
              markerHeight="9"
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
            >
              <path d="M 1 1.5 L 9 5 L 1 8.5 z" fill={token.colorPrimary} />
            </marker>
            <filter
              id="cmdb-mg-shadow"
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
          </defs>
          <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
            {/* 未关联区：标题 + 分隔线 */}
            {layout.section?.showHead &&
              (() => {
                const sec = layout.section;
                const text = `${t('pages.cmdb.modelGraph.unlinked')} · ${sec.count}`;
                const tw = textWidth(text, 12) + 12;
                return (
                  <g pointerEvents="none">
                    <text
                      className={styles.sectionLabel}
                      x={sec.x}
                      y={sec.y + 12}
                    >
                      {text}
                    </text>
                    <line
                      className={styles.sectionLine}
                      x1={sec.x + tw}
                      x2={sec.x + sec.w}
                      y1={sec.y + 8}
                      y2={sec.y + 8}
                    />
                  </g>
                );
              })()}
            {/* 关系边 */}
            {layout.edges.map(({ rel, d, reversed }) => {
              const on = edgeActive(rel.code, rel.srcModel, rel.dstModel);
              const marker = `url(#cmdb-mg-arrow${on ? '-on' : ''})`;
              return (
                <g
                  key={rel.code}
                  className={styles.edge}
                  style={{ opacity: edgeOpacity(rel.srcModel, rel.dstModel) }}
                >
                  <path
                    className={cx(styles.edgePath, on && styles.edgeOn)}
                    d={d}
                    markerStart={reversed ? marker : undefined}
                    markerEnd={reversed ? undefined : marker}
                  />
                  <path
                    className={styles.edgeHit}
                    d={d}
                    onPointerEnter={(e) => {
                      if (dragRef.current) return;
                      trackPointer(e);
                      setHover({ kind: 'edge', key: rel.code });
                    }}
                    onPointerMove={trackPointer}
                    onPointerLeave={() => setHover(null)}
                  />
                </g>
              );
            })}
            {/* 模型节点 */}
            {[...layout.nodes.values()].map(({ model, x, y }) => {
              const countText =
                model.ciCount !== undefined
                  ? Number(model.ciCount).toLocaleString()
                  : null;
              const chipW = countText
                ? Math.max(30, textWidth(countText, 11) + 14)
                : 0;
              const textBudget = NODE_W - 52 - (chipW ? chipW + 22 : 12);
              const disabled = model.status === 2;
              const groupLabel = groupNames[model.category] ?? model.category;
              return (
                <g
                  key={model.code}
                  className={styles.nodeG}
                  transform={`translate(${x},${y})`}
                  style={{ opacity: nodeOpacity(model.code) }}
                  onPointerEnter={(e) => {
                    if (dragRef.current) return;
                    trackPointer(e);
                    setHover({ kind: 'node', key: model.code });
                  }}
                  onPointerMove={trackPointer}
                  onPointerLeave={() => setHover(null)}
                >
                  <a
                    className={styles.nodeLink}
                    href={`/cmdb/model/${model.code}`}
                    aria-label={`${model.name}（${model.code}），${groupLabel}，${
                      model.builtin
                        ? t('pages.cmdb.model.tag.builtin')
                        : t('pages.cmdb.model.tag.custom')
                    }`}
                    onFocus={() => focusNode(model.code)}
                    onBlur={() => setHover(null)}
                    onClick={(e) => {
                      // 修饰键交给浏览器（新标签打开）；拖拽平移不触发跳转
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
                        return;
                      e.preventDefault();
                      clickNode(model.code);
                    }}
                  >
                    <rect
                      className={styles.nodeCard}
                      width={NODE_W}
                      height={NODE_H}
                      rx={10}
                      filter="url(#cmdb-mg-shadow)"
                      stroke={
                        activeNodes?.has(model.code)
                          ? token.colorPrimary
                          : undefined
                      }
                      strokeDasharray={disabled ? '4 3' : undefined}
                    />
                    {/* 图标徽标：内置中性底 / 自定义主色底（与图例一致） */}
                    <rect
                      x={11}
                      y={(NODE_H - 30) / 2}
                      width={30}
                      height={30}
                      rx={8}
                      fill={
                        model.builtin
                          ? token.colorFillTertiary
                          : token.colorPrimaryBg
                      }
                      pointerEvents="none"
                    />
                    <g
                      transform={`translate(17,${(NODE_H - 18) / 2})`}
                      style={{
                        color: model.builtin
                          ? token.colorTextSecondary
                          : token.colorPrimary,
                      }}
                      pointerEvents="none"
                    >
                      <ModelGlyph icon={model.icon} size={18} />
                    </g>
                    <text
                      className={styles.nodeName}
                      x={52}
                      y={22}
                      pointerEvents="none"
                    >
                      {truncate(model.name, textBudget, 13)}
                    </text>
                    <text
                      className={styles.nodeCode}
                      x={52}
                      y={40}
                      pointerEvents="none"
                    >
                      {truncate(
                        `${groupLabel} · ${model.code}`,
                        textBudget,
                        11,
                      )}
                    </text>
                    {countText && (
                      <>
                        <rect
                          className={styles.nodeCountChip}
                          x={NODE_W - 11 - chipW}
                          y={(NODE_H - 20) / 2}
                          width={chipW}
                          height={20}
                          rx={10}
                          pointerEvents="none"
                        />
                        <text
                          className={styles.nodeCountText}
                          x={NODE_W - 11 - chipW / 2}
                          y={NODE_H / 2}
                          dy="0.32em"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          {countText}
                        </text>
                      </>
                    )}
                  </a>
                </g>
              );
            })}
            {/* 关系标签（正向名 · 基数）：关联少时常显，否则仅高亮的边显示 */}
            {layout.edges.map(({ rel, mid, label, labelW: lw }) => {
              const on = edgeActive(rel.code, rel.srcModel, rel.dstModel);
              const op = edgeOpacity(rel.srcModel, rel.dstModel);
              if (!on && (!labelsAlways || op < 1)) return null;
              return (
                <g
                  key={rel.code}
                  transform={`translate(${mid.x},${mid.y})`}
                  pointerEvents="none"
                >
                  <rect
                    className={cx(
                      styles.edgeLabelBg,
                      on && styles.edgeLabelBgOn,
                    )}
                    x={-lw / 2}
                    y={-10}
                    width={lw}
                    height={20}
                    rx={10}
                  />
                  <text
                    className={cx(
                      styles.edgeLabelText,
                      on && styles.edgeLabelTextOn,
                    )}
                    textAnchor="middle"
                    dy="0.34em"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        {/* 悬停浮层：模型详情 / 关系详情 */}
        {hover && (
          <div ref={tipRef} className={styles.tooltip}>
            {hover.kind === 'node'
              ? (() => {
                  const n = layout.nodes.get(hover.key);
                  if (!n) return null;
                  const m = n.model;
                  return (
                    <>
                      <div className={styles.tooltipTitle}>{m.name}</div>
                      <div className={styles.tooltipRow}>
                        <span>{t('pages.cmdb.modelGraph.tooltip.code')}</span>
                        <span className={styles.tooltipVal}>{m.code}</span>
                      </div>
                      <div className={styles.tooltipRow}>
                        <span>{t('pages.cmdb.modelGraph.tooltip.group')}</span>
                        <span className={styles.tooltipVal}>
                          {groupNames[m.category] ?? m.category}
                        </span>
                      </div>
                      {m.ciCount !== undefined && (
                        <div className={styles.tooltipRow}>
                          <span>
                            {t('pages.cmdb.modelGraph.tooltip.instances')}
                          </span>
                          <span className={styles.tooltipVal}>
                            {Number(m.ciCount).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className={styles.tooltipRow}>
                        <span>{t('pages.cmdb.modelGraph.tooltip.type')}</span>
                        <span className={styles.tooltipVal}>
                          {m.builtin
                            ? t('pages.cmdb.model.tag.builtin')
                            : t('pages.cmdb.model.tag.custom')}
                        </span>
                      </div>
                      {m.status === 2 && (
                        <div className={styles.tooltipRow}>
                          <span>{t('common.column.status')}</span>
                          <span className={styles.tooltipVal}>
                            {t('pages.cmdb.modelGraph.tooltip.disabled')}
                          </span>
                        </div>
                      )}
                      <div className={styles.tooltipHint}>
                        {t('pages.cmdb.modelGraph.tooltip.view')}
                      </div>
                    </>
                  );
                })()
              : (() => {
                  const e = hoverEdge;
                  if (!e) return null;
                  return (
                    <>
                      <div className={styles.tooltipTitle}>
                        {e.rel.forwardName}
                      </div>
                      <div className={styles.tooltipRow}>
                        <span>
                          {modelName(e.rel.srcModel)} →{' '}
                          {modelName(e.rel.dstModel)}
                        </span>
                      </div>
                      <div className={styles.tooltipRow}>
                        <span>
                          {t('pages.cmdb.modelGraph.tooltip.cardinality')}
                        </span>
                        <span className={styles.tooltipVal}>
                          {CARDINALITY_TEXT[e.rel.cardinality]}
                        </span>
                      </div>
                    </>
                  );
                })()}
          </div>
        )}
        <div className={styles.controls}>
          {controlBtn('in', t('pages.cmdb.topology.zoomIn'), 'plus', () =>
            zoomAt(width / 2, height / 2, 1.2),
          )}
          {controlBtn('out', t('pages.cmdb.topology.zoomOut'), 'minus', () =>
            zoomAt(width / 2, height / 2, 1 / 1.2),
          )}
          {controlBtn('fit', t('pages.cmdb.topology.fit'), 'fit', fitView)}
        </div>
        <div className={styles.hint}>{t('pages.cmdb.topology.hint')}</div>
      </div>
    </div>
  );
};

export default ModelGraph;
