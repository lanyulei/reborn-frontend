/**
 * 执行详情（/job/execution/:id）：状态、执行人、执行节点、提交号与时长；日志（实时）/ 主机 / 执行内容。
 * 执行未结束时每 2 秒刷新一次状态与主机计数（页面可见时）。可取消、重新执行、仅重试失败主机。
 */
import { LeftOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, Link, useAccess, useParams } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Result,
  Skeleton,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelJobExecution,
  getJobExecution,
  listJobExecutionHosts,
} from '@/services/job/execution';
import { getErrorStatus, getJobErrorMessage } from '@/services/job/request';
import type { JobExecution } from '@/services/job/typings';
import { usePermissions } from '@/services/system/permissions';
import { useEnumText, useT } from '@/utils/i18n';
import {
  formatDuration,
  formatTime,
  secondsBetween,
  shortCommit,
} from '../components/format';
import { useNow, usePageVisible } from '../components/hooks';
import {
  isActiveStatus,
  JOB_LIMITS,
  TRIGGER_SOURCE_META,
} from '../components/meta';
import { RiskHits } from '../components/RiskHits';
import { RunModal } from '../components/RunModal';
import { useJobStyles } from '../components/styles';
import {
  CheckModeTag,
  CodeText,
  ExecutionStatusTag,
  KindTag,
} from '../components/tags';
import { ContentTab } from './ContentTab';
import { HostsTab } from './HostsTab';
import { LogViewer } from './LogViewer';

const POLL_MS = 2000;
const BACKOFF_MAX_MS = 15_000;
/** 排队超过这么久仍未被领取：提示检查执行节点 */
const QUEUED_WARN_S = 30;

interface RunPreset {
  params?: Record<string, unknown>;
  ciIds?: string[];
}

const ExecutionDetailView: React.FC<{ id: string }> = ({ id }) => {
  const t = useT();
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const access = useAccess();
  const { styles } = useJobStyles();
  const visible = usePageVisible();
  const triggerText = useEnumText(TRIGGER_SOURCE_META);

  const [execution, setExecution] = useState<JobExecution>();
  const [loadError, setLoadError] = useState<string>();
  const [runPreset, setRunPreset] = useState<RunPreset>();
  const [retryLoading, setRetryLoading] = useState(false);
  // 递增即立即重取（取消之后）
  const [refreshKey, setRefreshKey] = useState(0);
  const finished = useRef(false);

  const active = isActiveStatus(execution?.status);
  const now = useNow(active && visible);

  // 轮询详情：未结束且页面可见时每 2 秒一次；出错退避重试；结束后停止
  useEffect(() => {
    if (!visible || finished.current) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let backoff = POLL_MS;

    const tick = async () => {
      try {
        const { execution: loaded } = await getJobExecution(id);
        if (stopped) return;
        backoff = POLL_MS;
        setExecution(loaded);
        setLoadError(undefined);
        // 结果未知（节点失联）：节点恢复连接后状态还会变，放慢轮询而不是停下
        if (loaded.status === 8) {
          timer = setTimeout(() => void tick(), POLL_MS * 6);
          return;
        }
        if (!isActiveStatus(loaded.status)) {
          finished.current = true;
          return;
        }
        timer = setTimeout(() => void tick(), POLL_MS);
      } catch (error) {
        if (stopped) return;
        const status = getErrorStatus(error);
        // 首次加载失败才整页报错；轮询中的偶发失败保留已有内容继续重试
        setLoadError(getJobErrorMessage(error));
        if (status === 403 || status === 404) {
          finished.current = true;
          return;
        }
        timer = setTimeout(() => void tick(), backoff);
        backoff = Math.min(backoff * 2, BACKOFF_MAX_MS);
      }
    };

    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [id, visible, refreshKey]);

  const refresh = useCallback(() => {
    finished.current = false;
    setRefreshKey((n) => n + 1);
  }, []);

  if (!execution) {
    return loadError ? (
      <Result
        status="warning"
        title={t('pages.job.execution.loadFailed')}
        subTitle={loadError}
      />
    ) : (
      <Skeleton active paragraph={{ rows: 8 }} />
    );
  }

  const { status, detail } = execution;
  const duration = secondsBetween(
    execution.startTime,
    execution.finishTime,
    now,
  );
  const queuedSeconds =
    status === 1
      ? (secondsBetween(execution.createTime, undefined, now) ?? 0)
      : 0;
  const failedHosts =
    (execution.hostFailed ?? 0) + (execution.hostUnreachable ?? 0);
  const kind = execution.kind ?? 1;
  const isTemplate = kind === 1;
  // 作业模板：打开执行弹窗重跑；快速执行：带着本次内容回到快速执行页
  const canRun = isTemplate
    ? has('job.template.run') && Boolean(execution.templateId)
    : has('job.adhoc.run');
  const triggerSource = execution.trigger ?? 1;
  // 触发来源对象所在的页面：定时作业 / 触发器
  const triggerPath =
    triggerSource === 2
      ? access.canJobSchedule && '/job/schedule'
      : triggerSource !== 1 && access.canJobTrigger && '/job/trigger';

  const confirmCancel = () =>
    modal.confirm({
      autoFocusButton: 'cancel',
      title: t('pages.job.execution.cancel.title', {
        name: execution.templateName ?? '',
      }),
      content: t(
        status === 8
          ? 'pages.job.execution.cancel.description.unknown'
          : status === 9
            ? 'pages.job.execution.cancel.description.approval'
            : status === 2
              ? 'pages.job.execution.cancel.description.running'
              : 'pages.job.execution.cancel.description.queued',
      ),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const { execution: cancelled } = await cancelJobExecution(id);
          // 取消接口的返回不含执行内容：只合并状态类字段
          setExecution((prev) =>
            prev ? { ...prev, ...cancelled, detail: prev.detail } : prev,
          );
          message.success(t('pages.job.execution.cancel.requested'));
        } catch {
          // 已由请求层提示（已结束等）
        }
        refresh();
      },
    });

  const retryFailed = async () => {
    setRetryLoading(true);
    try {
      const { items } = await listJobExecutionHosts(id, {
        page: 1,
        pageSize: JOB_LIMITS.targetCiMax,
        statuses: [3, 4],
      });
      const ciIds = (items ?? []).map((host) => host.ciId);
      if (ciIds.length === 0) {
        message.info(t('pages.job.execution.retryFailed.none'));
        return;
      }
      setRunPreset({ params: detail?.params, ciIds });
    } catch {
      // 已由请求层提示
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <div>
      {/* ---------- 标题与操作 ---------- */}
      <Flex align="center" justify="space-between" gap={12} wrap>
        <Flex align="center" gap={12} wrap>
          <ExecutionStatusTag status={status} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            {execution.templateName || execution.id}
          </Typography.Title>
          {isTemplate ? (
            <span className={styles.secondary}>
              v{execution.templateVersion ?? 1}
            </span>
          ) : (
            <KindTag kind={execution.kind} />
          )}
          {execution.check && <CheckModeTag />}
          {(execution.sliceTotal ?? 0) > 0 && execution.groupId && (
            <Tooltip title={t('pages.job.execution.slice.tooltip')}>
              <Link to={`/job/execution?groupId=${execution.groupId}`}>
                <Tag color="cyan" style={{ marginInlineEnd: 0 }}>
                  {t('pages.job.execution.slice', {
                    no: execution.sliceNo ?? 0,
                    total: execution.sliceTotal ?? 0,
                  })}
                </Tag>
              </Link>
            </Tooltip>
          )}
        </Flex>
        <Flex gap={8} wrap>
          {active &&
            has('job.execution.cancel') &&
            (execution.cancelRequested ? (
              <Button danger loading disabled>
                {t('pages.job.execution.cancelling')}
              </Button>
            ) : (
              <Button danger onClick={confirmCancel}>
                {t(
                  status === 9
                    ? 'pages.job.execution.withdraw'
                    : 'pages.job.execution.cancel',
                )}
              </Button>
            ))}
          {/* 结果未知：作业可能仍在运行，可登记终止请求（节点恢复连接后生效） */}
          {status === 8 &&
            has('job.execution.cancel') &&
            !execution.cancelRequested && (
              <Button danger onClick={confirmCancel}>
                {t('pages.job.execution.cancel.unknown')}
              </Button>
            )}
          {canRun && isTemplate && !active && failedHosts > 0 && (
            <Button loading={retryLoading} onClick={() => void retryFailed()}>
              {t('pages.job.execution.retryFailed', { n: failedHosts })}
            </Button>
          )}
          {canRun && (
            <Button
              onClick={() =>
                isTemplate
                  ? setRunPreset({ params: detail?.params })
                  : history.push(`/job/adhoc?rerun=${id}`)
              }
            >
              {t('pages.job.execution.rerun')}
            </Button>
          )}
        </Flex>
      </Flex>

      {/* ---------- 状态提示 ---------- */}
      {status === 9 && (
        <Alert
          type="info"
          showIcon
          title={t('pages.job.execution.approval.pending')}
          description={
            <>
              {execution.approvalReason && (
                <div>
                  {t('pages.job.execution.approval.reason', {
                    reason: execution.approvalReason,
                  })}
                </div>
              )}
              <div>{t('pages.job.execution.approval.pending.hint')}</div>
            </>
          }
          action={
            execution.approvalInstanceId && (
              <Link to={`/workflow/instance/${execution.approvalInstanceId}`}>
                {t('pages.job.execution.approval.view')}
              </Link>
            )
          }
          style={{ marginTop: 12 }}
        />
      )}
      {status === 10 && (
        <Alert
          type="error"
          showIcon
          title={t('pages.job.execution.approval.rejected')}
          description={
            execution.approvalReason
              ? t('pages.job.execution.approval.reason', {
                  reason: execution.approvalReason,
                })
              : undefined
          }
          action={
            execution.approvalInstanceId && (
              <Link to={`/workflow/instance/${execution.approvalInstanceId}`}>
                {t('pages.job.execution.approval.view')}
              </Link>
            )
          }
          style={{ marginTop: 12 }}
        />
      )}
      {(execution.riskHits?.length ?? 0) > 0 && (
        <Alert
          type="warning"
          showIcon
          title={t('pages.job.execution.riskHits')}
          description={<RiskHits hits={execution.riskHits ?? []} />}
          style={{ marginTop: 12 }}
        />
      )}
      {status === 8 && (
        <Alert
          type="warning"
          showIcon
          title={t('pages.job.execution.unknown.title')}
          description={
            <>
              {t('pages.job.execution.unknown.description')}
              {execution.cancelRequested && (
                <div style={{ marginTop: 4 }}>
                  {t('pages.job.execution.unknown.cancelRequested')}
                </div>
              )}
            </>
          }
          style={{ marginTop: 12 }}
        />
      )}
      {status === 1 &&
        !execution.cancelRequested &&
        (queuedSeconds > QUEUED_WARN_S ? (
          <Alert
            type="warning"
            showIcon
            title={t('pages.job.execution.queued.slow', {
              text: formatDuration(queuedSeconds, t),
            })}
            description={t(
              detail?.runnerZone
                ? 'pages.job.execution.queued.slow.zone'
                : 'pages.job.execution.queued.slow.any',
              { zone: detail?.runnerZone ?? '' },
            )}
            style={{ marginTop: 12 }}
          />
        ) : (
          <Alert
            type="info"
            showIcon
            title={t('pages.job.execution.queued')}
            style={{ marginTop: 12 }}
          />
        ))}
      {active && execution.cancelRequested && (
        <Alert
          type="info"
          showIcon
          title={t('pages.job.execution.cancelling.hint', {
            name: execution.cancelUserName ?? '',
          })}
          style={{ marginTop: 12 }}
        />
      )}
      {execution.error && (
        <Alert
          type="error"
          showIcon
          title={t('pages.job.execution.error')}
          description={
            <span style={{ whiteSpace: 'pre-wrap' }}>{execution.error}</span>
          }
          style={{ marginTop: 12 }}
        />
      )}
      {loadError && (
        <Alert
          type="warning"
          showIcon
          title={t('pages.job.execution.refreshFailed')}
          description={loadError}
          style={{ marginTop: 12 }}
        />
      )}

      {/* ---------- 概要 ---------- */}
      <Descriptions
        bordered
        size="small"
        column={3}
        style={{ marginTop: 16 }}
        styles={{ label: { width: 110, whiteSpace: 'nowrap' } }}
        items={[
          {
            key: 'creator',
            label: t('pages.job.execution.column.creator'),
            children: execution.creatorName || t('common.empty'),
          },
          {
            key: 'runner',
            label: t('pages.job.execution.column.runner'),
            children: execution.runnerName || t('common.empty'),
          },
          {
            key: 'commit',
            label: t('pages.job.execution.column.commit'),
            children: (
              <CodeText
                value={execution.commitId}
                display={shortCommit(execution.commitId)}
                copyable
              />
            ),
          },
          {
            key: 'createTime',
            label: t('pages.job.execution.column.createTime'),
            children: formatTime(execution.createTime) || t('common.empty'),
          },
          {
            key: 'startTime',
            label: t('pages.job.execution.column.startTime'),
            children: formatTime(execution.startTime) || t('common.empty'),
          },
          {
            key: 'finishTime',
            label: t('pages.job.execution.column.finishTime'),
            children: formatTime(execution.finishTime) || t('common.empty'),
          },
          {
            key: 'duration',
            label: t('pages.job.execution.column.duration'),
            children: (
              <span className={styles.tabular}>
                {duration === undefined
                  ? t('common.empty')
                  : formatDuration(duration, t)}
              </span>
            ),
          },
          {
            key: 'hosts',
            label: t('pages.job.execution.column.hosts'),
            span: 2,
            children: (
              <span className={styles.tabular}>
                {t('pages.job.execution.hosts.tooltip', {
                  ok: execution.hostOk ?? 0,
                  failed: execution.hostFailed ?? 0,
                  unreachable: execution.hostUnreachable ?? 0,
                  total: execution.hostTotal ?? 0,
                })}
              </span>
            ),
          },
          {
            key: 'trigger',
            label: t('pages.job.execution.column.trigger'),
            span: execution.approvalInstanceId ? 2 : 3,
            children: (
              <span>
                {triggerText(triggerSource)}
                {execution.triggerName && (
                  <span style={{ marginInlineStart: 8 }}>
                    {triggerPath ? (
                      <Link
                        to={`${triggerPath}?keyword=${encodeURIComponent(execution.triggerName)}`}
                      >
                        {execution.triggerName}
                      </Link>
                    ) : (
                      execution.triggerName
                    )}
                  </span>
                )}
              </span>
            ),
          },
          ...(execution.approvalInstanceId
            ? [
                {
                  key: 'approval',
                  label: t('pages.job.execution.column.approval'),
                  children: (
                    <Link
                      to={`/workflow/instance/${execution.approvalInstanceId}`}
                    >
                      {t('pages.job.execution.approval.view')}
                    </Link>
                  ),
                },
              ]
            : []),
          ...(execution.cancelUserName
            ? [
                {
                  key: 'cancelUser',
                  label: t('pages.job.execution.column.cancelUser'),
                  span: 3,
                  children: execution.cancelUserName,
                },
              ]
            : []),
        ]}
      />

      <Tabs
        style={{ marginTop: 8 }}
        items={[
          {
            key: 'log',
            label: t('pages.job.execution.tab.log'),
            children: (
              <LogViewer
                id={id}
                truncated={detail?.logTruncated}
                filename={`job-${execution.templateName ?? 'execution'}-${id.slice(0, 8)}`}
              />
            ),
          },
          {
            key: 'hosts',
            label: t('pages.job.execution.tab.hosts', {
              n: execution.hostTotal ?? 0,
            }),
            children: (
              <HostsTab
                execution={execution}
                canViewCI={Boolean(access.canCmdbCI)}
              />
            ),
          },
          {
            key: 'content',
            label: t('pages.job.execution.tab.content'),
            children: <ContentTab execution={execution} />,
          },
        ]}
      />

      {runPreset && isTemplate && execution.templateId && (
        <RunModal
          templateId={execution.templateId}
          params={runPreset.params}
          ciIds={runPreset.ciIds}
          onClose={() => setRunPreset(undefined)}
        />
      )}
    </div>
  );
};

const ExecutionDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const t = useT();
  return (
    <PageContainer title={false}>
      <Button
        type="link"
        icon={<LeftOutlined />}
        style={{ paddingInline: 0, marginBottom: 12 }}
        onClick={() => history.push('/job/execution')}
      >
        {t('pages.job.execution.backToList')}
      </Button>
      <Card variant="outlined">
        <ExecutionDetailView key={id} id={id} />
      </Card>
    </PageContainer>
  );
};

export default ExecutionDetailPage;
