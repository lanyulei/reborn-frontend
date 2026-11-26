/**
 * 故障详情「AI 诊断」页签：召唤 / 停止 Agent，当前任务状态，历次运行（状态 / Profile / 发现标题 / 评价），运行详情抽屉。
 */
import {
  ModalForm,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  App,
  Badge,
  Button,
  Empty,
  Space,
  Spin,
  Table,
  Tag,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  num,
  RUN_STATUS_META,
  TASK_STATUS_META,
} from '@/pages/agent/components/meta';
import { badgeStatus, RunDrawer } from '@/pages/agent/components/RunDrawer';
import { listProfiles } from '@/services/agent/profile';
import { getAgentErrorMessage } from '@/services/agent/request';
import {
  cancelTask,
  listIncidentRuns,
  runForIncident,
} from '@/services/agent/task';
import type { AgentRun, AgentTask } from '@/services/agent/typings';
import type { Incident } from '@/services/incident/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useEnumText, useT } from '@/utils/i18n';
import { ACTIVE_STATUSES } from '../components/meta';
import { useIncidentStyles } from '../components/styles';

const REFRESH_MS = 10_000;

export const AgentPanel: React.FC<{
  incident: Incident;
  refreshKey: number;
  onChanged: () => void;
}> = ({ incident, refreshKey, onChanged }) => {
  const t = useT();
  const has = usePermissions();
  const { message, modal } = App.useApp();
  const { styles } = useIncidentStyles();
  const statusText = useEnumText(RUN_STATUS_META);
  const taskStatusText = useEnumText(TASK_STATUS_META);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [active, setActive] = useState<AgentTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [runId, setRunId] = useState<string>();
  const [summon, setSummon] = useState(false);
  const seq = useRef(0);

  const load = useCallback(
    async (silent = false) => {
      // 只采纳最后一次加载的结果：切换故障、轮询与手动刷新交错时，旧响应不覆盖新数据
      const current = ++seq.current;
      if (!silent) setLoading(true);
      try {
        const res = await listIncidentRuns(incident.id, { silent: true });
        if (current !== seq.current) return;
        setRuns(res.items ?? []);
        setActive(res.activeTask ?? null);
        setError(undefined);
      } catch (e) {
        if (current !== seq.current) return;
        setError(getAgentErrorMessage(e));
      } finally {
        if (current === seq.current) setLoading(false);
      }
    },
    [incident.id],
  );

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  // 有进行中的任务时自动刷新
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load(true);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [active, load]);

  const canRun =
    has('incident.list.diagnose') && ACTIVE_STATUSES.includes(incident.status);

  const stop = () => {
    if (!active) return;
    modal.confirm({
      title: t('pages.incident.agent.stop'),
      content: t('pages.agent.task.cancelConfirm'),
      okButtonProps: { danger: true },
      onOk: async () => {
        await cancelTask(active.id);
        message.success(t('pages.agent.task.cancelled'));
        void load(true);
        onChanged();
      },
    });
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        {canRun && !active && (
          <Button type="primary" onClick={() => setSummon(true)}>
            {t('pages.incident.agent.run')}
          </Button>
        )}
        {canRun && active && (
          <Button danger onClick={stop}>
            {t('pages.incident.agent.stop')}
          </Button>
        )}
        {active && (
          <Space size={6}>
            <span className={styles.hint}>
              {t('pages.incident.agent.active')}：
            </span>
            <Badge
              status={active.status === 'running' ? 'processing' : 'default'}
              text={taskStatusText(active.status)}
            />
            {active.profile?.name && <Tag>{active.profile.name}</Tag>}
            <span className={styles.hint}>{formatTime(active.queuedTime)}</span>
          </Space>
        )}
      </Space>
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          style={{ marginBottom: 16 }}
        />
      )}
      <Spin spinning={loading}>
        {runs.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.incident.agent.empty')}
          />
        ) : (
          <Table<AgentRun>
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={runs}
            onRow={(r) => ({
              onClick: () => setRunId(r.id),
              style: { cursor: 'pointer' },
            })}
            columns={[
              {
                title: t('pages.agent.task.column.status'),
                dataIndex: 'status',
                width: 120,
                render: (_, r) => (
                  <Space size={4}>
                    <Badge
                      status={badgeStatus(r.status)}
                      text={statusText(r.status)}
                    />
                    {r.dryRun && <Tag>{t('pages.agent.task.dryRun')}</Tag>}
                  </Space>
                ),
              },
              {
                title: t('pages.agent.run.finding'),
                dataIndex: 'finding',
                ellipsis: true,
                render: (_, r) =>
                  r.finding?.title ? (
                    <Space size={6}>
                      <span>{r.finding.title}</span>
                      {r.finding.confidence !== undefined && (
                        <Tag>
                          {t('pages.agent.run.confidence', {
                            n: r.finding.confidence,
                          })}
                        </Tag>
                      )}
                    </Space>
                  ) : (
                    <span className={styles.hint}>
                      {t('pages.agent.run.noFinding')}
                    </span>
                  ),
              },
              {
                title: t('pages.agent.task.column.profile'),
                dataIndex: 'profile',
                width: 140,
                ellipsis: true,
                render: (_, r) => r.profile?.name ?? t('common.empty'),
              },
              {
                title: t('pages.agent.tokens'),
                dataIndex: 'promptTokens',
                width: 120,
                align: 'right',
                render: (_, r) =>
                  `${num(r.promptTokens).toLocaleString()} / ${num(r.completionTokens).toLocaleString()}`,
              },
              {
                title: t('pages.agent.run.rate'),
                dataIndex: 'feedback',
                width: 90,
                render: (_, r) =>
                  r.feedback
                    ? t(`enum.agent.feedback.${r.feedback}`)
                    : t('common.empty'),
              },
              {
                title: t('pages.agent.task.column.queuedTime'),
                dataIndex: 'startTime',
                width: 160,
                render: (_, r) => formatTime(r.startTime),
              },
            ]}
          />
        )}
      </Spin>
      <RunDrawer
        runId={runId}
        onClose={() => setRunId(undefined)}
        onChanged={() => load(true)}
      />
      {summon && (
        <ModalForm<{ profileId?: string; input?: string }>
          title={t('pages.incident.agent.run')}
          width={520}
          open
          onOpenChange={(open) => {
            if (!open) setSummon(false);
          }}
          modalProps={{ destroyOnHidden: true }}
          onFinish={async (values) => {
            const res = await runForIncident({
              incidentId: incident.id,
              profileId: values.profileId,
              input: values.input?.trim() || undefined,
            });
            message.success(
              res.existing
                ? t('pages.incident.agent.existing')
                : t('pages.incident.agent.queued'),
            );
            void load(true);
            onChanged();
            return true;
          }}
        >
          <ProFormSelect
            name="profileId"
            label={t('pages.incident.agent.profile')}
            allowClear
            request={async () => {
              const res = await listProfiles(
                { enabled: true, page: 1, pageSize: 100 },
                { silent: true },
              );
              // 「让 Agent 分析」只用诊断类 Profile；经验沉淀由复盘完成自动触发
              return res.items
                .filter((p) => p.spec.kind !== 'postmortem')
                .map((p) => ({
                  label: p.spec.name,
                  value: p.id,
                }));
            }}
          />
          <ProFormTextArea
            name="input"
            label={t('pages.incident.agent.runInput')}
            placeholder={t('pages.incident.agent.runInputPlaceholder')}
            fieldProps={{ rows: 3, maxLength: 2000, showCount: true }}
          />
        </ModalForm>
      )}
    </div>
  );
};

export default AgentPanel;
