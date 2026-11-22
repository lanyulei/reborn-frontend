/**
 * 知识库枚举元数据：文档状态、索引状态、任务状态、空间类型、可见性、权限级别、关联对象类型。
 * 文案见 src/locales/<lang>/knowledge.ts（enum.knowledge.*）。
 */
import type {
  KnowledgeDocStatus,
  KnowledgeIndexStatusCode,
  KnowledgeJobStatus,
  KnowledgeLevel,
  KnowledgeLinkTargetType,
  KnowledgeSpaceType,
  KnowledgeVisibility,
} from '@/services/knowledge/typings';
import type { EnumMeta } from '@/utils/i18n';

export const DOC_STATUS_META: EnumMeta<KnowledgeDocStatus> = {
  1: { textId: 'enum.knowledge.docStatus.1', status: 'Default' },
  2: { textId: 'enum.knowledge.docStatus.2', status: 'Success' },
  3: { textId: 'enum.knowledge.docStatus.3', status: 'Warning' },
};
export const DOC_STATUS_ORDER: readonly KnowledgeDocStatus[] = [1, 2, 3];

export const INDEX_STATUS_META: EnumMeta<KnowledgeIndexStatusCode> = {
  0: { textId: 'enum.knowledge.indexStatus.0', status: 'Default' },
  1: { textId: 'enum.knowledge.indexStatus.1', status: 'Processing' },
  2: { textId: 'enum.knowledge.indexStatus.2', status: 'Success' },
  3: { textId: 'enum.knowledge.indexStatus.3', status: 'Error' },
};

export const JOB_STATUS_META: EnumMeta<KnowledgeJobStatus> = {
  1: { textId: 'enum.knowledge.jobStatus.1', status: 'Default' },
  2: { textId: 'enum.knowledge.jobStatus.2', status: 'Processing' },
  3: { textId: 'enum.knowledge.jobStatus.3', status: 'Success' },
  4: { textId: 'enum.knowledge.jobStatus.4', status: 'Error' },
};
export const JOB_STATUS_ORDER: readonly KnowledgeJobStatus[] = [1, 2, 3, 4];

export const SPACE_TYPE_META: Record<KnowledgeSpaceType, { textId: string }> = {
  general: { textId: 'enum.knowledge.spaceType.general' },
  manual: { textId: 'enum.knowledge.spaceType.manual' },
  standard: { textId: 'enum.knowledge.spaceType.standard' },
  incident: { textId: 'enum.knowledge.spaceType.incident' },
  faq: { textId: 'enum.knowledge.spaceType.faq' },
};
export const SPACE_TYPE_ORDER: readonly KnowledgeSpaceType[] = [
  'general',
  'manual',
  'standard',
  'incident',
  'faq',
];

export const VISIBILITY_META: Record<KnowledgeVisibility, { textId: string }> =
  {
    1: { textId: 'enum.knowledge.visibility.1' },
    2: { textId: 'enum.knowledge.visibility.2' },
  };
export const VISIBILITY_ORDER: readonly KnowledgeVisibility[] = [1, 2];

export const LEVEL_META: Record<KnowledgeLevel, { textId: string }> = {
  0: { textId: 'enum.knowledge.level.0' },
  1: { textId: 'enum.knowledge.level.1' },
  2: { textId: 'enum.knowledge.level.2' },
  3: { textId: 'enum.knowledge.level.3' },
};
export const ACL_LEVEL_ORDER: readonly KnowledgeLevel[] = [1, 2, 3];

export const LINK_TARGET_META: Record<
  KnowledgeLinkTargetType,
  { textId: string }
> = {
  cmdb_model: { textId: 'enum.knowledge.linkTarget.cmdb_model' },
  cmdb_ci: { textId: 'enum.knowledge.linkTarget.cmdb_ci' },
  monitor_rule: { textId: 'enum.knowledge.linkTarget.monitor_rule' },
  incident_playbook: {
    textId: 'enum.knowledge.linkTarget.incident_playbook',
  },
  ticket: { textId: 'enum.knowledge.linkTarget.ticket' },
  job_template: { textId: 'enum.knowledge.linkTarget.job_template' },
  workflow_definition: {
    textId: 'enum.knowledge.linkTarget.workflow_definition',
  },
};
export const LINK_TARGET_ORDER: readonly KnowledgeLinkTargetType[] = [
  'cmdb_ci',
  'cmdb_model',
  'monitor_rule',
  'incident_playbook',
  'ticket',
  'job_template',
  'workflow_definition',
];

/** 正文上限（与 proto 校验一致，512 KiB） */
export const DOC_CONTENT_MAX = 524288;
/** 标签上限 */
export const DOC_TAGS_MAX = 10;

/** 文档阅读页路径 */
export const docPath = (id: string) => `/knowledge/doc/${id}`;
/** 文档编辑页路径 */
export const docEditPath = (id: string) => `/knowledge/doc/${id}/edit`;
/** 空间文档列表路径 */
export const spacePath = (id: string) => `/knowledge/space/${id}`;
