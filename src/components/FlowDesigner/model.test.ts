/**
 * 流程设计器「处理人为空」策略的回归测试（与后端 biz/workflow 的 onEmpty 规则一致）：
 * - 新建的人工任务缺省「拦住流程」，抄送节点缺省「自动跳过」；
 * - 随图没写这一项的节点按后端的缺省值还原（人工任务拦住、抄送跳过），不能一律当成「自动跳过」——
 *   否则保存之后，原本会被拦住的审批节点就真的变成跳过了；
 * - 显式选的策略在「流程 → 图 → 流程」往返后保持不变，并原样写进图。
 */
import { describe, expect, it } from 'vitest';
import type { Translate } from '@/utils/i18n';
import {
  defaultOnEmpty,
  type Flow,
  fromGraph,
  newStep,
  toGraph,
} from './model';
import { ruleComplete, ruleText } from './summary';

const t: Translate = (id) => id;

const nodeOf = (graph: Record<string, unknown>, id: string) =>
  (graph.nodes as Record<string, unknown>[]).find((node) => node.id === id);

describe('flow designer: policy when no assignee is found', () => {
  it('new approval steps hold the flow by default, cc steps skip', () => {
    expect(newStep('task', '审批').assignee.onEmpty).toBe('block');
    expect(newStep('cc', '抄送').assignee.onEmpty).toBe('skip');
    expect(defaultOnEmpty('task')).toBe('block');
    expect(defaultOnEmpty('cc')).toBe('skip');
  });

  it.each(['skip', 'admin', 'block'] as const)(
    'keeps an explicit %s through the graph and writes it to the graph',
    (policy) => {
      const step = newStep('task', '审批');
      const flow: Flow = {
        nodes: [
          {
            ...step,
            assignee: { rules: [{ kind: 'initiator' }], onEmpty: policy },
          },
        ],
        admins: [],
      };

      const graph = toGraph(flow, t);
      expect(nodeOf(graph, step.id)?.assignee).toMatchObject({
        onEmpty: policy,
      });

      const restored = fromGraph(graph);
      expect(restored?.nodes[0]).toMatchObject({
        kind: 'task',
        assignee: { onEmpty: policy },
      });
    },
  );

  it("restores a step that doesn't record the policy with the backend default", () => {
    const graph = {
      nodes: [
        { id: 's', type: 'start' },
        // 旧版设计器保存的图：节点上没有 onEmpty（后端对人工任务按拦住处理）
        {
          id: 'a',
          type: 'userTask',
          assignee: { rules: [{ kind: 'initiator' }] },
        },
        { id: 'c', type: 'cc', assignee: { rules: [{ kind: 'initiator' }] } },
        { id: 'e', type: 'end' },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'a' },
        { id: 'e2', source: 'a', target: 'c' },
        { id: 'e3', source: 'c', target: 'e' },
      ],
      design: {
        nodes: [
          { kind: 'task', id: 'a', name: '审批', assignee: {} },
          { kind: 'cc', id: 'c', name: '抄送', assignee: {} },
        ],
        admins: [],
      },
    };

    const restored = fromGraph(graph);
    const [task, cc] = restored?.nodes ?? [];
    expect(task).toMatchObject({
      kind: 'task',
      assignee: { onEmpty: 'block' },
    });
    expect(cc).toMatchObject({ kind: 'cc', assignee: { onEmpty: 'skip' } });

    // 再保存时把缺省值明确写进图：人工任务写 block（与后端的缺省一致），抄送写 skip
    if (!restored) throw new Error('the design must be restorable');
    expect(nodeOf(toGraph(restored, t), 'a')?.assignee).toMatchObject({
      onEmpty: 'block',
    });
    expect(nodeOf(toGraph(restored, t), 'c')?.assignee).toMatchObject({
      onEmpty: 'skip',
    });
  });
});

/**
 * 「系统管理员」审批人规则（与后端 biz/workflow 的 superAdmin 一致）：不需要任何取值，规则本身即完整；
 * 原样写进图，随图保存的结构还原后不丢。内置审批流程的审批人都是它。
 */
describe('flow designer: the system administrator rule', () => {
  it('is complete on its own and survives the graph round trip', () => {
    const rule = { kind: 'superAdmin' as const };
    expect(ruleComplete(rule)).toBe(true);
    expect(ruleText(rule, t)).toBe('component.flow.rule.superAdmin');

    const step = { ...newStep('task', '系统管理员审批'), id: 'approve' };
    const graph = toGraph(
      {
        nodes: [
          { ...step, assignee: { rules: [rule], onEmpty: 'block' as const } },
        ],
        admins: [],
      },
      t,
    );
    expect(nodeOf(graph, 'approve')?.assignee).toMatchObject({
      rules: [{ kind: 'superAdmin' }],
      onEmpty: 'block',
    });
    expect(fromGraph(graph)?.nodes[0]).toMatchObject({
      kind: 'task',
      assignee: { rules: [{ kind: 'superAdmin' }], onEmpty: 'block' },
    });
  });
});
