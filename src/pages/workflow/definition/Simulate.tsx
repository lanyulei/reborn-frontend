/**
 * 模拟运行：拿设计器里当前的流程图（不必已保存）在服务端走一遍——不落库、不发通知、
 * 不调用外部系统；人工任务一律按「同意」推进，定时 / 自动任务 / 子流程视为顺利通过。
 * 用来在发布前确认「这份表单数据会走哪条路、每个节点是谁处理」。
 */
import { CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Drawer,
  Flex,
  Form,
  Input,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  branchSummary,
  type Flow,
  FlowCanvas,
  GROUP_ICON,
  type NodeState,
  STEP_ICON,
  stepSummary,
  toGraph,
} from '@/components/FlowDesigner';
import { UserSelect } from '@/components/UserSelect';
import { fetchWorkflowUsers } from '@/components/UserSelect/sources';
import { getErrorMessage } from '@/services/system/request';
import { simulateDefinition } from '@/services/workflow/definition';
import type { SimulatedStep } from '@/services/workflow/typings';
import { useT } from '@/utils/i18n';

const useStyles = createStyles(({ token, css }) => ({
  canvas: css`
    max-height: 420px;
    overflow: auto;
    border-radius: ${token.borderRadiusLG}px;
  `,
  alert: css`
    margin-top: 16px;
  `,
  section: css`
    margin: 20px 0 12px;
    color: ${token.colorText};
    font-weight: 600;
  `,
  stepName: css`
    display: inline-flex;
    gap: 6px;
    align-items: center;
    color: ${token.colorText};
    font-weight: 500;
  `,
  stepMeta: css`
    margin-top: 4px;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
}));

/** 后端节点类型 → 图标 */
const TYPE_ICON: Record<string, React.ReactNode> = {
  start: <UserOutlined />,
  end: <CheckCircleOutlined />,
  userTask: STEP_ICON.task,
  cc: STEP_ICON.cc,
  timer: STEP_ICON.timer,
  serviceTask: STEP_ICON.service,
  subProcess: STEP_ICON.sub,
  exclusiveGateway: GROUP_ICON.exclusive,
  parallelGateway: GROUP_ICON.parallel,
  inclusiveGateway: GROUP_ICON.inclusive,
};

/** 时间线里只列有内容的节点：网关、汇聚不单独成行 */
const LISTED = new Set([
  'start',
  'end',
  'userTask',
  'cc',
  'timer',
  'serviceTask',
  'subProcess',
]);

/** 解析表单样例数据：空 = 空对象；须是 JSON 对象 */
const parseVariables = (text: string): Record<string, unknown> | undefined => {
  if (!text.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // 落到下面统一返回
  }
  return undefined;
};

export const Simulate: React.FC<{
  definitionId: string;
  open: boolean;
  onClose: () => void;
  /** 设计器当前的流程（含未保存的修改） */
  flow: Flow;
  nameOf: (id: string) => string;
}> = ({ definitionId, open, onClose, flow, nameOf }) => {
  const { styles } = useStyles();
  const t = useT();
  const [variables, setVariables] = useState('');
  const [initiator, setInitiator] = useState<string>();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<{
    steps: SimulatedStep[];
    status: number;
  }>();

  // 流程改过之后，上一次的结果不再对应当前的图
  useEffect(() => {
    setResult(undefined);
    setError(undefined);
  }, [flow]);

  const parsed = parseVariables(variables);

  const run = async () => {
    if (!parsed) return;
    setRunning(true);
    setError(undefined);
    try {
      setResult(
        await simulateDefinition(definitionId, {
          graph: toGraph(flow, t),
          variables: parsed,
          initiator,
        }),
      );
    } catch (e) {
      setResult(undefined);
      setError(getErrorMessage(e));
    } finally {
      setRunning(false);
    }
  };

  // 被拦住的节点：处理人为空且没有明确选「自动跳过」，真实运行时流程走不到它后面
  const blockedStep = result?.steps.find((step) => step.blocked);

  const nodeStates = useMemo(() => {
    const states: Record<string, NodeState> = {};
    for (const step of result?.steps ?? [])
      states[step.nodeId] = step.blocked ? 'rejected' : 'done';
    return states;
  }, [result]);

  const stepTitle = (step: SimulatedStep) => {
    if (step.type === 'start') return t('component.flow.start');
    if (step.type === 'end') return t('component.flow.finish');
    return step.nodeName || step.nodeId;
  };

  return (
    <Drawer
      title={t('pages.workflow.simulate.title')}
      size={720}
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        {t('pages.workflow.simulate.desc')}
      </Typography.Paragraph>
      <Form layout="vertical">
        <Form.Item
          label={t('pages.workflow.start.variables')}
          tooltip={t('pages.workflow.simulate.variables.tooltip')}
          validateStatus={parsed ? undefined : 'error'}
          help={
            parsed ? undefined : t('pages.workflow.start.variables.invalid')
          }
        >
          <Input.TextArea
            value={variables}
            autoSize={{ minRows: 3, maxRows: 8 }}
            placeholder='{"amount": 20000, "type": "purchase"}'
            onChange={(e) => setVariables(e.target.value)}
          />
        </Form.Item>
        <Form.Item
          label={t('pages.workflow.simulate.initiator')}
          extra={t('pages.workflow.simulate.initiator.extra')}
        >
          <UserSelect
            style={{ width: '100%' }}
            fetchUsers={fetchWorkflowUsers}
            value={initiator}
            placeholder={t('pages.workflow.form.user.placeholder')}
            onChange={(v) => setInitiator(v as string | undefined)}
          />
        </Form.Item>
        <Button
          type="primary"
          loading={running}
          disabled={!parsed}
          onClick={() => void run()}
        >
          {t('pages.workflow.simulate.run')}
        </Button>
      </Form>

      {error && (
        <Alert
          className={styles.alert}
          type="error"
          showIcon
          title={t('pages.workflow.simulate.failed')}
          description={error}
        />
      )}

      {result && (
        <>
          <Alert
            className={styles.alert}
            type={
              blockedStep
                ? 'error'
                : result.status === 2
                  ? 'success'
                  : 'warning'
            }
            showIcon
            title={
              blockedStep
                ? t('pages.workflow.simulate.blocked', {
                    node: stepTitle(blockedStep),
                  })
                : t(
                    result.status === 2
                      ? 'pages.workflow.simulate.completed'
                      : 'pages.workflow.simulate.incomplete',
                  )
            }
          />
          <div className={styles.section}>
            {t('pages.workflow.simulate.path')}
          </div>
          <div className={styles.canvas}>
            <FlowCanvas
              flow={flow}
              nodeStates={nodeStates}
              summaryOf={(node) => stepSummary(node, t)}
              conditionOf={(branch) => branchSummary(branch, t)}
              nameOf={nameOf}
            />
          </div>
          <div className={styles.section}>
            {t('pages.workflow.simulate.steps')}
          </div>
          <Timeline
            items={result.steps
              .filter((step) => LISTED.has(step.type))
              .map((step, index) => ({
                // 同一节点可能经过多次，以顺序为键
                key: `${index}-${step.nodeId}`,
                color: step.blocked ? 'red' : step.skipped ? 'gray' : 'green',
                content: (
                  <>
                    <span className={styles.stepName}>
                      {TYPE_ICON[step.type]}
                      {stepTitle(step)}
                    </span>
                    {(step.type === 'userTask' || step.type === 'cc') && (
                      <div className={styles.stepMeta}>
                        {step.blocked ? (
                          t('pages.workflow.simulate.blockedStep')
                        ) : step.skipped ? (
                          t('pages.workflow.simulate.skipped')
                        ) : (
                          <Flex gap={4} align="center" wrap>
                            {step.type === 'userTask' &&
                              `${t(`component.flow.mode.${step.mode || 'any'}`)}：`}
                            {step.assignees.map((user) => (
                              <Tag key={user.id}>{user.name || user.id}</Tag>
                            ))}
                          </Flex>
                        )}
                      </div>
                    )}
                    {(step.type === 'timer' ||
                      step.type === 'serviceTask' ||
                      step.type === 'subProcess') && (
                      <div className={styles.stepMeta}>
                        {t('pages.workflow.simulate.auto')}
                      </div>
                    )}
                  </>
                ),
              }))}
          />
        </>
      )}
    </Drawer>
  );
};

export default Simulate;
