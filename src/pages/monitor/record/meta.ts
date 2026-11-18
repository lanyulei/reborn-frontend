/** 记录规则的枚举元数据与表单上限（record_rule.proto 的 buf.validate）。 */
import type { MonitorRecordStatus } from '@/services/monitor/typings';
import type { EnumMeta } from '@/utils/i18n';

/** 最近一次执行结果：0 未执行 / 1 已写回 / 2 查询无结果 / 3 查询失败 / 4 写回失败 */
export const RECORD_STATUS_META: EnumMeta<MonitorRecordStatus> = {
  0: { textId: 'enum.monitor.recordStatus.0', status: 'Default' },
  1: { textId: 'enum.monitor.recordStatus.1', status: 'Success' },
  2: { textId: 'enum.monitor.recordStatus.2', status: 'Warning' },
  3: { textId: 'enum.monitor.recordStatus.3', status: 'Error' },
  4: { textId: 'enum.monitor.recordStatus.4', status: 'Error' },
};

/** 指标名：字母、下划线或冒号开头，只含字母、数字、下划线、冒号 */
export const METRIC_NAME_REGEX = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;

export const RECORD_LIMITS = {
  nameMax: 128,
  descMax: 512,
  /** 表达式上限按字节计（UTF-8） */
  exprBytesMax: 8192,
  interval: { min: 15, max: 3600 },
  /** 新建时的执行周期 */
  intervalDefault: 60,
  labelMax: 20,
  labelKeyMax: 128,
  labelValueMax: 256,
} as const;

/** 校验结果里的字段名（proto 字段名）→ 表单项 */
export const ISSUE_FIELD: Record<string, string> = {
  expr: 'expr',
  name: 'name',
  labels: 'labels',
  datasource_id: 'datasourceId',
  group_id: 'groupId',
};

export const NO_WRITE_URL = 'MONITOR_RECORD_RULE_NO_WRITE_URL';
