/**
 * 状态原文（集群给出的英文，如 Running / CrashLoopBackOff）→ 展示文案。全模块同一张表：
 * 列表的状态列、详情的基本信息、容器组表格、容器卡片都用它，悬停处再给出原文。
 * 只在中文界面下翻译；不认识的原文原样展示。
 */
import { getLocale } from '@umijs/max';

const LABELS: Record<string, string> = {
  running: '运行中',
  pending: '等待中',
  waiting: '等待中',
  succeeded: '已完成',
  completed: '已完成',
  complete: '已完成',
  failed: '失败',
  error: '异常',
  unknown: '未知',
  terminating: '删除中',
  terminated: '已终止',
  containercreating: '容器创建中',
  podinitializing: '初始化中',
  crashloopbackoff: '崩溃循环',
  imagepullbackoff: '镜像拉取失败',
  errimagepull: '镜像拉取失败',
  invalidimagename: '镜像名称无效',
  createcontainerconfigerror: '容器配置错误',
  oomkilled: '内存溢出',
  evicted: '已驱逐',
  unschedulable: '无法调度',
  ready: '就绪',
  notready: '未就绪',
  'ready,schedulingdisabled': '已禁止调度',
  schedulingdisabled: '已禁止调度',
  active: '活跃',
  suspended: '已暂停',
  bound: '已绑定',
  available: '可用',
  released: '已释放',
  lost: '丢失',
};

/** 状态原文的展示文案；没有对应文案（或非中文界面）时返回原文 */
export const statusLabel = (status?: string): string => {
  if (!status) return '';
  if (!getLocale()?.startsWith('zh')) return status;
  return LABELS[status.toLowerCase()] ?? status;
};

/** 展示文案与原文不同（做了翻译）时返回原文，供悬停提示 */
export const statusOrigin = (status?: string): string | undefined =>
  status && statusLabel(status) !== status ? status : undefined;
