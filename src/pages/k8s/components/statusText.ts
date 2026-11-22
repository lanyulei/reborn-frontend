/**
 * 状态原文（集群给出的英文，如 Running / CrashLoopBackOff）→ 展示文案。全模块同一张表：
 * 列表的状态列、详情的基本信息、容器组表格、容器卡片都用它，悬停处再给出原文。
 * 文案随当前语言；不认识的原文原样展示。
 */
import { t } from '@/utils/i18n';

const LABEL_IDS: Record<string, string> = {
  running: 'pages.k8s.metrics.series.running',
  pending: 'pages.k8s.metrics.series.pending',
  waiting: 'pages.k8s.metrics.series.pending',
  succeeded: 'pages.k8s.detail.status.succeeded',
  completed: 'pages.k8s.detail.status.succeeded',
  complete: 'pages.k8s.detail.status.succeeded',
  failed: 'pages.k8s.metrics.series.failed',
  error: 'pages.k8s.state.abnormal',
  unknown: 'pages.k8s.state.unknown',
  terminating: 'pages.k8s.detail.deleting',
  terminated: 'pages.k8s.detail.status.terminated',
  containercreating: 'pages.k8s.detail.status.containerCreating',
  podinitializing: 'pages.k8s.detail.status.podInitializing',
  crashloopbackoff: 'pages.k8s.detail.status.crashLoopBackOff',
  imagepullbackoff: 'pages.k8s.detail.status.imagePullFailed',
  errimagepull: 'pages.k8s.detail.status.imagePullFailed',
  invalidimagename: 'pages.k8s.detail.status.invalidImageName',
  createcontainerconfigerror:
    'pages.k8s.detail.status.createContainerConfigError',
  oomkilled: 'pages.k8s.detail.status.oomKilled',
  evicted: 'pages.k8s.drain.status.evicted',
  unschedulable: 'pages.k8s.detail.status.unschedulable',
  ready: 'pages.k8s.metrics.series.ready',
  notready: 'pages.k8s.detail.status.notReady',
  'ready,schedulingdisabled': 'pages.k8s.detail.status.schedulingDisabled',
  schedulingdisabled: 'pages.k8s.detail.status.schedulingDisabled',
  active: 'pages.k8s.detail.status.active',
  suspended: 'pages.k8s.detail.paused',
  bound: 'pages.k8s.detail.status.bound',
  available: 'pages.k8s.detail.status.available',
  released: 'pages.k8s.detail.status.released',
  lost: 'pages.k8s.detail.status.lost',
};

/** 状态原文的展示文案；没有对应文案时返回原文 */
export const statusLabel = (status?: string): string => {
  if (!status) return '';
  const id = LABEL_IDS[status.toLowerCase()];
  return id ? t(id) : status;
};

/** 展示文案与原文不同（做了翻译）时返回原文，供悬停提示 */
export const statusOrigin = (status?: string): string | undefined =>
  status && statusLabel(status) !== status ? status : undefined;
