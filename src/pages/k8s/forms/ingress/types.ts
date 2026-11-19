import type { KeyValueEditorItem } from '../shared/KeyValueEditor';

export type IngressRuleProtocol = 'HTTP' | 'HTTPS';

export type IngressPathType = 'Exact' | 'Prefix' | 'ImplementationSpecific';

export type IngressRoutePathItem = {
  id: string;
  path?: string;
  pathType: IngressPathType;
  serviceName?: string;
  /** 端口号（number）或命名端口（string） */
  servicePort?: number | string;
  /** 非 Service 的后端（backend.resource 等）：仅从已有清单带入，表单里不可编辑，原样写回 */
  backend?: Record<string, unknown>;
};

export type IngressRouteRuleItem = {
  id: string;
  /** 留空 = 匹配所有域名 */
  host?: string;
  protocol: IngressRuleProtocol;
  paths: IngressRoutePathItem[];
};

export type IngressServicePortOption = {
  label: string;
  value: number | string;
};

export type IngressServiceOption = {
  label: string;
  /** 未加载时为 undefined（端口在选中服务后按需读取） */
  ports?: IngressServicePortOption[];
  value: string;
};

export type CreateIngressFormValues = {
  name?: string;
  namespace?: string;
  rules: IngressRouteRuleItem[];
  ingressClassName?: string;
  tlsSecretName?: string;
  enablePathRewrite: boolean;
  rewriteTarget?: string;
  labels: KeyValueEditorItem[];
  annotations: KeyValueEditorItem[];
};
