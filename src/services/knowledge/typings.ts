/**
 * 知识库域类型：空间 / ACL / 文档 / 版本 / 关联 / 检索 / 导入任务 / 管理统计。
 * 接口契约见 backend/core/api/knowledge/v1/knowledge.proto（protojson：字段 camelCase，
 * 零值字段省略，int64 为字符串）。
 */

/** 空间可见性：1 公开 / 2 受限 */
export type KnowledgeVisibility = 1 | 2;
/** 空间类型 */
export type KnowledgeSpaceType =
  | 'general'
  | 'manual'
  | 'standard'
  | 'incident'
  | 'faq';
/** 文档状态：1 草稿 / 2 已发布 / 3 已归档 */
export type KnowledgeDocStatus = 1 | 2 | 3;
/** 索引状态：0 未索引 / 1 索引中 / 2 已索引 / 3 失败 */
export type KnowledgeIndexStatusCode = 0 | 1 | 2 | 3;
/** 任务状态：1 排队 / 2 处理中 / 3 成功 / 4 失败 */
export type KnowledgeJobStatus = 1 | 2 | 3 | 4;
/** 权限级别：0 无 / 1 读 / 2 写 / 3 管理 */
export type KnowledgeLevel = 0 | 1 | 2 | 3;
/** ACL 主体类型 */
export type KnowledgeSubjectType = 'role' | 'user' | 'machine';
/** 关联对象类型 */
export type KnowledgeLinkTargetType =
  | 'cmdb_model'
  | 'cmdb_ci'
  | 'monitor_rule'
  | 'incident_playbook'
  | 'ticket'
  | 'job_template'
  | 'workflow_definition';
/** 相关知识查询的对象类型（比关联类型多了告警事件 / 故障） */
export type KnowledgeRelatedTargetType =
  | KnowledgeLinkTargetType
  | 'monitor_alert'
  | 'incident';

export interface KnowledgeSpace {
  id: string;
  code: string;
  name: string;
  type: KnowledgeSpaceType;
  description?: string;
  visibility?: KnowledgeVisibility;
  ownerId: string;
  ownerName?: string;
  embeddingEnabled?: boolean;
  reviewRequired?: boolean;
  reviewDays?: number;
  level?: KnowledgeLevel;
  documentCount?: number;
  createTime?: string;
  updateTime?: string;
}

export interface KnowledgeAclEntry {
  subjectType: KnowledgeSubjectType;
  subjectId: string;
  subjectName?: string;
  level: KnowledgeLevel;
}

export interface KnowledgeLink {
  id: string;
  targetType: KnowledgeLinkTargetType;
  targetId: string;
  targetName?: string;
  createTime?: string;
}

export interface KnowledgeDocument {
  id: string;
  spaceId: string;
  spaceName?: string;
  slug: string;
  title: string;
  status?: KnowledgeDocStatus;
  reviewState?: 0 | 1;
  /** 详情：正文（草稿状态为草稿正文；已发布为已发布正文） */
  content?: string;
  /** 详情且有写权限：待发布草稿正文 */
  draftContent?: string;
  hasDraft?: boolean;
  summary?: string;
  tags?: string[];
  source?: 'manual' | 'import' | 'assistant' | 'postmortem';
  sourceRef?: string;
  ownerId: string;
  ownerName?: string;
  reviewAt?: string;
  reviewOverdue?: boolean;
  version?: number;
  indexStatus?: KnowledgeIndexStatusCode;
  level?: KnowledgeLevel;
  links?: KnowledgeLink[];
  headings?: string[];
  createUser?: string;
  updateUser?: string;
  createTime?: string;
  updateTime?: string;
  publishTime?: string;
}

export interface KnowledgeVersion {
  version: number;
  title: string;
  note?: string;
  content?: string;
  publishUser?: string;
  publishUserName?: string;
  createTime?: string;
}

export interface KnowledgeSearchHit {
  documentId: string;
  title: string;
  spaceId: string;
  spaceName?: string;
  chunkSeq?: number;
  headingPath?: string;
  /** 命中片段：<mark> 标注命中词，其余已 HTML 转义 */
  snippet?: string;
  section?: string;
  score?: number;
  reviewOverdue?: boolean;
  citation?: string;
}

export interface KnowledgeSearchResult {
  items?: KnowledgeSearchHit[];
  degraded?: boolean;
  searchLogId?: string;
  /** int64 字符串 */
  durationMs?: string;
}

export interface KnowledgeRelatedDocument {
  documentId: string;
  title: string;
  spaceName?: string;
  summary?: string;
  linked?: boolean;
  linkId?: string;
  reviewOverdue?: boolean;
}

export interface KnowledgeOverview {
  recent?: KnowledgeDocument[];
  mine?: KnowledgeDocument[];
  pendingReview?: KnowledgeDocument[];
  reviewDue?: KnowledgeDocument[];
  spaceCount?: number;
  documentCount?: number;
}

export interface KnowledgeIngestJob {
  id: string;
  spaceId: string;
  spaceName?: string;
  documentId?: string;
  fileId: string;
  filename: string;
  status?: KnowledgeJobStatus;
  error?: string;
  chunkCount?: number;
  attempts?: number;
  createUser?: string;
  createTime?: string;
  updateTime?: string;
}

export interface KnowledgeIndexStatus {
  vectorAvailable?: boolean;
  embeddingConfigured?: boolean;
  embeddingModel?: string;
  embeddingOpen?: boolean;
  chunkCount?: string;
  embeddedCount?: string;
  pendingJobs?: string;
  failedJobs?: string;
  hint?: string;
}

export interface KnowledgeSearchLog {
  id: string;
  userId: string;
  userName?: string;
  source?: string;
  query: string;
  hitCount?: number;
  degraded?: boolean;
  durationMs?: string;
  feedback?: 0 | 1 | 2;
  createTime?: string;
}

export interface KnowledgeStats {
  spaceCount?: string;
  documentCount?: string;
  draftCount?: string;
  chunkCount?: string;
  reviewOverdueCount?: string;
  pendingReviewCount?: string;
  searchCount?: string;
  noResultCount?: string;
  helpfulCount?: string;
  unhelpfulCount?: string;
  topQueries?: { query: string; count?: string }[];
}
