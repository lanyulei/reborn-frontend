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
import { useT } from '@/utils/i18n';
import {
  analyzeRbacBindingRisk,
  analyzeRbacRoleRisk,
  analyzeRbacRuleRisk,
  formatRbacRiskReason,
  type RbacPolicyRule,
  type RbacRisk,
  type RbacRiskLevel,
  type RbacSubject,
  RISK_LEVEL_TEXT_ID,
} from '../forms/role/risk';
import { TextList } from './cells';
import { GVRS, sameGVR } from './meta';

const RISK_COLOR: Record<RbacRiskLevel, string> = {
  Critical: 'error',
  High: 'warning',
  Medium: 'gold',
  None: 'default',
};

const RiskTag: React.FC<{ risk: RbacRisk }> = ({ risk }) => {
  const t = useT();
  return (
    <Tooltip
      title={
        risk.reasons.length > 0
          ? risk.reasons.map((reason) => {
              const text = formatRbacRiskReason(reason, t);
              return (
                <div key={`${reason.id}:${reason.name ?? ''}`}>{text}</div>
              );
            })
          : undefined
      }
    >
      <Tag color={RISK_COLOR[risk.level]} style={{ marginInlineEnd: 0 }}>
        {t(RISK_LEVEL_TEXT_ID[risk.level])}
      </Tag>
    </Tooltip>
  );
};

const list = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item)) : [];

const Rules: React.FC<{ rules: RbacPolicyRule[]; title: React.ReactNode }> = ({
  rules,
  title,
}) => {
  const t = useT();
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <Table<RbacPolicyRule & { key: number }>
        size="small"
        pagination={false}
        dataSource={rules.map((rule, key) => ({ ...rule, key }))}
        columns={[
          {
            title: t('pages.k8s.detail.rbac.apiGroups'),
            width: 180,
            render: (_, rule) => (
              <TextList
                value={list(rule.apiGroups).map((group) => group || 'core')}
              />
            ),
          },
          {
            title: t('pages.k8s.detail.rbac.resources'),
            render: (_, rule) => (
              <TextList
                value={[...list(rule.resources), ...list(rule.nonResourceURLs)]}
                max={4}
              />
            ),
          },
          {
            title: t('pages.k8s.detail.resourceName'),
            width: 160,
            render: (_, rule) => <TextList value={list(rule.resourceNames)} />,
          },
          {
            title: t('pages.k8s.detail.rbac.verbs'),
            render: (_, rule) => <TextList value={list(rule.verbs)} max={8} />,
          },
          {
            title: t('pages.k8s.detail.rbac.risk'),
            width: 90,
            render: (_, rule) => <RiskTag risk={analyzeRbacRuleRisk(rule)} />,
          },
        ]}
      />
    </>
  );
};

export const isRbacGVR = (gvr: GVR): boolean =>
  [GVRS.role, GVRS.clusterRole, GVRS.roleBinding, GVRS.clusterRoleBinding].some(
    (item) => sameGVR(item, gvr),
  );

export const RbacSection: React.FC<{
  clusterId: string;
  gvr: GVR;
  object: K8sObject;
}> = ({ clusterId, gvr, object }) => {
  const t = useT();
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
            {t('pages.k8s.detail.rbac.rules')}{' '}
            <RiskTag risk={analyzeRbacRoleRisk({ rules })} />
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
        {t('pages.k8s.detail.rbac.roleRef')}{' '}
        <RiskTag
          risk={analyzeRbacBindingRisk({ roleRef, subjects }, refRules)}
        />
      </SectionTitle>
      <div style={{ marginBottom: 16 }}>
        <Tag>{roleRef.kind}</Tag>
        {roleRef.name}
      </div>
      <SectionTitle>{t('pages.k8s.detail.rbac.subjects')}</SectionTitle>
      <Table<RbacSubject & { key: number }>
        size="small"
        pagination={false}
        dataSource={subjects.map((subject, key) => ({ ...subject, key }))}
        columns={[
          { title: t('pages.k8s.event.type'), dataIndex: 'kind', width: 160 },
          { title: t('pages.k8s.column.name'), dataIndex: 'name' },
          {
            title: t('pages.k8s.column.namespace'),
            dataIndex: 'namespace',
            width: 220,
            render: (value) => value || '-',
          },
        ]}
      />
      {refRules && refRules.length > 0 && (
        <Rules rules={refRules} title={t('pages.k8s.detail.rbac.refRules')} />
      )}
    </>
  );
};
