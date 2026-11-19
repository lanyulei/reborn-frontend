/**
 * 详情概览里的 RBAC 区块：Role / ClusterRole 的权限规则与风险评级；
 * RoleBinding / ClusterRoleBinding 的角色引用、授权主体与风险评级（会去取所引用角色的规则，取不到则只按角色名与主体判断）。
 * 风险评级在浏览器里按对象内容计算（规则见 forms/role/risk.ts），只是提示，不参与任何判定。
 */
import { Table, Tag, Tooltip } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import SectionTitle from '@/components/SectionTitle';
import { getObject } from '@/services/k8s/resource';
import type { GVR, K8sObject } from '@/services/k8s/typings';
import {
  analyzeRbacBindingRisk,
  analyzeRbacRoleRisk,
  analyzeRbacRuleRisk,
  type RbacPolicyRule,
  type RbacRisk,
  type RbacRiskLevel,
  type RbacSubject,
  RISK_LEVEL_TEXT,
} from '../forms/role/risk';
import { TextList } from './cells';
import { GVRS, sameGVR } from './meta';

const RISK_COLOR: Record<RbacRiskLevel, string> = {
  Critical: 'error',
  High: 'warning',
  Medium: 'gold',
  None: 'default',
};

const RiskTag: React.FC<{ risk: RbacRisk }> = ({ risk }) => (
  <Tooltip
    title={
      risk.reasons.length > 0
        ? risk.reasons.map((reason) => <div key={reason}>{reason}</div>)
        : undefined
    }
  >
    <Tag color={RISK_COLOR[risk.level]} style={{ marginInlineEnd: 0 }}>
      {RISK_LEVEL_TEXT[risk.level]}
    </Tag>
  </Tooltip>
);

const list = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item)) : [];

const Rules: React.FC<{ rules: RbacPolicyRule[]; title: React.ReactNode }> = ({
  rules,
  title,
}) => (
  <>
    <SectionTitle>{title}</SectionTitle>
    <Table<RbacPolicyRule & { key: number }>
      size="small"
      pagination={false}
      dataSource={rules.map((rule, key) => ({ ...rule, key }))}
      columns={[
        {
          title: 'API 组',
          width: 180,
          render: (_, rule) => (
            <TextList
              value={list(rule.apiGroups).map((group) => group || 'core')}
            />
          ),
        },
        {
          title: '资源 / 非资源 URL',
          render: (_, rule) => (
            <TextList
              value={[...list(rule.resources), ...list(rule.nonResourceURLs)]}
              max={4}
            />
          ),
        },
        {
          title: '资源名称',
          width: 160,
          render: (_, rule) => <TextList value={list(rule.resourceNames)} />,
        },
        {
          title: '操作',
          render: (_, rule) => <TextList value={list(rule.verbs)} max={8} />,
        },
        {
          title: '风险',
          width: 90,
          render: (_, rule) => <RiskTag risk={analyzeRbacRuleRisk(rule)} />,
        },
      ]}
    />
  </>
);

export const isRbacGVR = (gvr: GVR): boolean =>
  [GVRS.role, GVRS.clusterRole, GVRS.roleBinding, GVRS.clusterRoleBinding].some(
    (item) => sameGVR(item, gvr),
  );

export const RbacSection: React.FC<{
  clusterId: string;
  gvr: GVR;
  object: K8sObject;
}> = ({ clusterId, gvr, object }) => {
  const binding =
    sameGVR(gvr, GVRS.roleBinding) || sameGVR(gvr, GVRS.clusterRoleBinding);
  const roleRef = (object.roleRef ?? {}) as { kind?: string; name?: string };
  const namespace = object.metadata?.namespace;
  const [refRules, setRefRules] = useState<RbacPolicyRule[]>();

  // 绑定：取所引用角色的规则（无权限或角色不存在时取不到，风险只按角色名与主体判断）
  useEffect(() => {
    if (!binding || !roleRef.name) return;
    let cancelled = false;
    const clusterRole = roleRef.kind === 'ClusterRole';
    getObject(
      clusterId,
      {
        ...(clusterRole ? GVRS.clusterRole : GVRS.role),
        namespace: clusterRole ? undefined : namespace,
        name: roleRef.name,
      },
      { silent: true },
    )
      .then((res) => {
        if (!cancelled) {
          setRefRules(
            Array.isArray(res.object.rules)
              ? (res.object.rules as RbacPolicyRule[])
              : [],
          );
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [binding, clusterId, namespace, roleRef.kind, roleRef.name]);

  if (!binding) {
    const rules = Array.isArray(object.rules)
      ? (object.rules as RbacPolicyRule[])
      : [];
    return (
      <Rules
        rules={rules}
        title={
          <>
            权限规则 <RiskTag risk={analyzeRbacRoleRisk({ rules })} />
          </>
        }
      />
    );
  }

  const subjects = Array.isArray(object.subjects)
    ? (object.subjects as RbacSubject[])
    : [];
  return (
    <>
      <SectionTitle>
        角色引用{' '}
        <RiskTag
          risk={analyzeRbacBindingRisk({ roleRef, subjects }, refRules)}
        />
      </SectionTitle>
      <div style={{ marginBottom: 16 }}>
        <Tag>{roleRef.kind}</Tag>
        {roleRef.name}
      </div>
      <SectionTitle>授权主体</SectionTitle>
      <Table<RbacSubject & { key: number }>
        size="small"
        pagination={false}
        dataSource={subjects.map((subject, key) => ({ ...subject, key }))}
        columns={[
          { title: '类型', dataIndex: 'kind', width: 160 },
          { title: '名称', dataIndex: 'name' },
          {
            title: '命名空间',
            dataIndex: 'namespace',
            width: 220,
            render: (value) => value || '-',
          },
        ]}
      />
      {refRules && refRules.length > 0 && (
        <Rules rules={refRules} title="所引用角色的权限规则" />
      )}
    </>
  );
};
