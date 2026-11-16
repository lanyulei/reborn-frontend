/**
 * 通用流程图（后端的 nodes / edges）的自动分层布局，纯函数、与界面无关。
 * 用于展示不是由设计器产生的流程图（经接口写入、没有可还原的结构）。
 *
 * 做法：从开始节点出发做深度优先，指回祖先的连线（回路）与标记为跳转的连线算
 * 「回连」、不参与分层；其余连线按最长路径分层（一个节点排在它所有前驱之下），
 * 同层节点按前驱的平均位置排序以减少交叉，每层水平居中。
 */

export interface RawNode {
  id: string;
  type?: string;
  name?: string;
}

export interface RawEdge {
  id?: string;
  source: string;
  target: string;
  condition?: string;
  isDefault?: boolean;
  jump?: boolean;
}

export interface RawLayoutOptions {
  /** 节点类型 → 占位尺寸 */
  sizeOf: (node: RawNode) => { width: number; height: number };
  gapX: number;
  gapY: number;
}

export interface PlacedNode<N extends RawNode = RawNode> {
  node: N;
  layer: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacedEdge<E extends RawEdge = RawEdge> {
  edge: E;
  /** 回连：回路或跳转，画成虚线、从侧面绕行 */
  back: boolean;
}

export interface RawLayout<
  N extends RawNode = RawNode,
  E extends RawEdge = RawEdge,
> {
  nodes: PlacedNode<N>[];
  edges: PlacedEdge<E>[];
  width: number;
  height: number;
}

export const layoutRawGraph = <N extends RawNode, E extends RawEdge>(
  nodes: readonly N[],
  edges: readonly E[],
  options: RawLayoutOptions,
): RawLayout<N, E> => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  // 两端都存在的连线才参与
  const valid = edges.filter((e) => byId.has(e.source) && byId.has(e.target));
  const out = new Map<string, E[]>();
  for (const e of valid) {
    out.set(e.source, [...(out.get(e.source) ?? []), e]);
  }

  // 1) 找回连：显式跳转 + 深度优先里指回正在访问的祖先的连线（迭代实现，不怕深图）
  const back = new Set<E>(valid.filter((e) => e.jump || e.source === e.target));
  const state = new Map<string, 1 | 2>();
  const roots = [
    ...nodes.filter((n) => n.type === 'start'),
    ...nodes.filter((n) => n.type !== 'start'),
  ];
  for (const root of roots) {
    if (state.has(root.id)) continue;
    const stack: { id: string; next: number }[] = [{ id: root.id, next: 0 }];
    state.set(root.id, 1);
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      const list = out.get(top.id) ?? [];
      if (top.next >= list.length) {
        state.set(top.id, 2);
        stack.pop();
        continue;
      }
      const e = list[top.next];
      top.next += 1;
      if (back.has(e)) continue;
      const seen = state.get(e.target);
      if (seen === 1) back.add(e);
      else if (seen === undefined) {
        state.set(e.target, 1);
        stack.push({ id: e.target, next: 0 });
      }
    }
  }

  // 2) 最长路径分层（去掉回连后是无环图，按拓扑序推进）
  const forward = valid.filter((e) => !back.has(e));
  const indegree = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  for (const e of forward) {
    indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1);
  }
  const layer = new Map<string, number>();
  const queue = nodes.filter((n) => indegree.get(n.id) === 0).map((n) => n.id);
  for (const id of queue) layer.set(id, 0);
  for (let head = 0; head < queue.length; head += 1) {
    const id = queue[head];
    for (const e of out.get(id) ?? []) {
      if (back.has(e)) continue;
      layer.set(
        e.target,
        Math.max(layer.get(e.target) ?? 0, (layer.get(id) ?? 0) + 1),
      );
      const left = (indegree.get(e.target) ?? 0) - 1;
      indegree.set(e.target, left);
      if (left === 0) queue.push(e.target);
    }
  }
  // 结束节点恒在最底层
  const maxLayer = Math.max(0, ...layer.values());
  for (const n of nodes) {
    if (n.type === 'end')
      layer.set(n.id, Math.max(maxLayer, layer.get(n.id) ?? 0));
  }

  // 3) 同层排序：第一层按入参顺序，其余按前驱的平均序号
  const rows: N[][] = [];
  for (const n of nodes) {
    const l = layer.get(n.id) ?? 0;
    rows[l] = [...(rows[l] ?? []), n];
  }
  const order = new Map<string, number>();
  const preds = new Map<string, string[]>();
  for (const e of forward) {
    preds.set(e.target, [...(preds.get(e.target) ?? []), e.source]);
  }
  for (let l = 0; l < rows.length; l += 1) {
    const row = rows[l] ?? [];
    rows[l] = row;
    if (l > 0) {
      const weight = new Map(
        row.map((n, index) => {
          const ps = (preds.get(n.id) ?? []).map((p) => order.get(p) ?? 0);
          return [
            n.id,
            ps.length > 0 ? ps.reduce((s, v) => s + v, 0) / ps.length : index,
          ];
        }),
      );
      row.sort((x, y) => (weight.get(x.id) ?? 0) - (weight.get(y.id) ?? 0));
    }
    for (const [index, n] of row.entries()) order.set(n.id, index);
  }

  // 4) 坐标：每层水平居中，层高取该层最高的节点
  const sizes = new Map(nodes.map((n) => [n.id, options.sizeOf(n)]));
  const rowWidth = (row: N[]) =>
    row.reduce((s, n) => s + (sizes.get(n.id)?.width ?? 0), 0) +
    Math.max(0, row.length - 1) * options.gapX;
  const width = Math.max(0, ...rows.map(rowWidth));
  const placed: PlacedNode<N>[] = [];
  let y = 0;
  rows.forEach((row, l) => {
    const rowHeight = Math.max(
      0,
      ...row.map((n) => sizes.get(n.id)?.height ?? 0),
    );
    let x = (width - rowWidth(row)) / 2;
    for (const n of row) {
      const size = sizes.get(n.id) ?? { width: 0, height: 0 };
      placed.push({
        node: n,
        layer: l,
        x,
        // 同层里矮的节点垂直居中
        y: y + (rowHeight - size.height) / 2,
        width: size.width,
        height: size.height,
      });
      x += size.width + options.gapX;
    }
    y += rowHeight + (l < rows.length - 1 ? options.gapY : 0);
  });

  return {
    nodes: placed,
    edges: valid.map((edge) => ({ edge, back: back.has(edge) })),
    width,
    height: y,
  };
};
