/**
 * 资源详情里的可观测部分：关联链路（Ingress → Service → Pod）与引用关系（ConfigMap / Secret 被谁引用）、
 * 节点对应的 CMDB 主机、交给智能助手分析的入口、由服务端解析的 Pod 选择器。
 */
import { RobotOutlined } from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import { Alert, App, Button, Empty, Flex, Space, Spin, Table, Tag } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { askAssistant } from '@/components/GlobalChat/ask';
import SectionTitle from '@/components/SectionTitle';
import {
  getNodeHost,
  getPodSelector,
  getRelations,
  type HostCI,
  type PodSelector,
  type Reference,
  type RelationService,
  type Relations,
} from '@/services/k8s/insight';
import { getK8sErrorMessage, isChangeSubmitted } from '@/services/k8s/request';
import { restartWorkload } from '@/services/k8s/resource';
import type { GVR, ResourceRef } from '@/services/k8s/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { StateBadge } from './cells';
import { useDangerConfirm } from './confirm';
import { GVRS, sameGVR, useKindName } from './meta';

const useStyles = createStyles(({ token, css }) => ({
  chain: css`
    margin-bottom: 12px;
    padding: 12px 16px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  hop: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  `,
  arrow: css`
    color: ${token.colorTextQuaternary};
  `,
  mono: css`
    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSizeSM}px;
  `,
  problem: css`
    margin-top: 8px;
    color: ${token.colorError};
  `,
  pods: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    margin-top: 8px;
  `,
}));

/** 服务端解析对象的 Pod 选择器（含 matchExpressions）；对象没有选择器时 empty */
export const usePodSelector = (
  clusterId: string,
  ref: ResourceRef,
  enabled: boolean,
): PodSelector | undefined => {
  const [selector, setSelector] = useState<PodSelector>();
  const key = JSON.stringify(ref);
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    getPodSelector(clusterId, JSON.parse(key) as ResourceRef)
      .then((res) => {
        if (!cancelled) setSelector(res);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [clusterId, key, enabled]);
  return selector;
};

const ServiceChain: React.FC<{
  service: RelationService;
  onOpen: (gvr: GVR, name: string) => void;
}> = ({ service, onOpen }) => {
  const t = useT();
  const { styles } = useStyles();
  const pods = service.pods ?? [];
  return (
    <>
      <div className={styles.hop}>
        <Tag>Service</Tag>
        {service.problem === 'not_found' ? (
          <span className={styles.mono}>{service.name}</span>
        ) : (
          <a
            className={styles.mono}
            onClick={() => onOpen(GVRS.service, service.name)}
          >
            {service.name}
          </a>
        )}
        {service.port && <span className={styles.mono}>:{service.port}</span>}
        <span className={styles.arrow}>→</span>
        <Tag>Pod</Tag>
        <StateBadge
          state={service.state}
          text={t('pages.k8s.relation.readyPods', {
            ready: service.readyPods,
            total: service.totalPods,
          })}
        />
        {service.selector && (
          <span className={styles.mono}>{service.selector}</span>
        )}
      </div>
      {service.problem && (
        <div className={styles.problem}>
          {t(`pages.k8s.relation.problem.${service.problem}`)}
        </div>
      )}
      {pods.length > 0 && (
        <div className={styles.pods}>
          {pods.map((pod) => (
            <a
              key={pod.name}
              className={styles.mono}
              onClick={() => onOpen(GVRS.pod, pod.name)}
            >
              <StateBadge
                state={pod.ready ? 'ok' : 'abnormal'}
                text={`${pod.name}${pod.ready ? '' : ` (${pod.status})`}`}
              />
            </a>
          ))}
          {!!service.podsOmitted && (
            <span>
              {t('pages.k8s.relation.omitted', { count: service.podsOmitted })}
            </span>
          )}
        </div>
      )}
    </>
  );
};

/** 关联关系页签：Ingress / Service 的链路，ConfigMap / Secret 的引用方 */
export const RelationsTab: React.FC<{
  clusterId: string;
  target: ResourceRef;
  onOpen: (gvr: GVR, name: string) => void;
}> = ({ clusterId, target, onOpen }) => {
  const t = useT();
  const kindName = useKindName();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const confirm = useDangerConfirm();
  const has = usePermissions();
  const [data, setData] = useState<Relations>();
  const [error, setError] = useState<string>();
  const [restarting, setRestarting] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getRelations(clusterId, target));
      setError(undefined);
    } catch (err) {
      setError(getK8sErrorMessage(err));
    }
  }, [clusterId, target]);
  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <Alert type="error" showIcon title={error} />;
  if (!data) return <Spin style={{ display: 'block', margin: '48px auto' }} />;

  const references = data.references ?? [];
  const restartable = references.filter((r) => r.restartable);
  const restartAll = () =>
    confirm({
      title: t('pages.k8s.relation.restart.title', {
        count: restartable.length,
      }),
      content: restartable
        .map((r) => `${kindName(r.kind)}/${r.ref.name}`)
        .join('、'),
      // 生产集群：输入被引用对象的名称确认
      name: target.name,
      namespace: target.namespace,
      onOk: async () => {
        setRestarting(true);
        let failed = 0;
        let submitted = 0;
        for (const r of restartable) {
          try {
            await restartWorkload(clusterId, r.ref);
          } catch (err) {
            // 需审批的集群：每个工作负载各生成一张变更单，不算失败
            if (isChangeSubmitted(err)) submitted += 1;
            else failed += 1;
          }
        }
        setRestarting(false);
        if (submitted > 0) {
          message.info(
            t('pages.k8s.relation.restart.submitted', { submitted, failed }),
          );
        } else if (failed > 0) {
          message.warning(
            t('pages.k8s.relation.restart.partial', {
              failed,
              total: restartable.length,
            }),
          );
        } else {
          message.success(t('pages.k8s.relation.restart.done'));
        }
      },
    });

  const isConfig =
    sameGVR(target, GVRS.configMap) || sameGVR(target, GVRS.secret);
  return (
    <>
      {data.rules?.map((rule) => (
        <div key={`${rule.host}${rule.path}`} className={styles.chain}>
          <div className={styles.hop} style={{ marginBottom: 8 }}>
            <Tag color="blue">Ingress</Tag>
            <span className={styles.mono}>
              {rule.host}
              {rule.path}
            </span>
            <span className={styles.arrow}>→</span>
          </div>
          <ServiceChain service={rule.service} onOpen={onOpen} />
        </div>
      ))}
      {data.rules && data.rules.length === 0 && (
        <Empty description={t('pages.k8s.relation.noRules')} />
      )}
      {data.service && (
        <div className={styles.chain}>
          <ServiceChain service={data.service} onOpen={onOpen} />
        </div>
      )}
      {isConfig && (
        <>
          <Flex justify="space-between" align="center">
            <SectionTitle>{t('pages.k8s.relation.references')}</SectionTitle>
            {restartable.length > 0 && has('k8s.workload.restart') && (
              <Button danger loading={restarting} onClick={restartAll}>
                {t('pages.k8s.relation.restart')}
              </Button>
            )}
          </Flex>
          {data.truncated && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              title={t('pages.k8s.relation.truncated')}
            />
          )}
          <Table<Reference>
            size="small"
            rowKey={(r) => `${r.kind}/${r.ref.name}`}
            pagination={false}
            dataSource={references}
            locale={{ emptyText: t('pages.k8s.relation.noReferences') }}
            columns={[
              { title: t('pages.k8s.relation.kind'), dataIndex: 'kind' },
              {
                title: t('pages.k8s.column.name'),
                render: (_, r) => (
                  <a onClick={() => onOpen(r.ref, r.ref.name)}>{r.ref.name}</a>
                ),
              },
              {
                title: t('pages.k8s.relation.via'),
                render: (_, r) => (
                  <Space size={4} wrap>
                    {r.via.map((v) => (
                      <Tag key={v}>{t(`pages.k8s.relation.via.${v}`)}</Tag>
                    ))}
                  </Space>
                ),
              },
            ]}
          />
        </>
      )}
    </>
  );
};

/** 节点对应的 CMDB 主机资源（按内网 IP 匹配）；没有匹配或没有 CMDB 权限时不显示 */
export const NodeHost: React.FC<{ clusterId: string; ip?: string }> = ({
  clusterId,
  ip,
}) => {
  const t = useT();
  const [items, setItems] = useState<HostCI[]>([]);
  useEffect(() => {
    if (!ip) return undefined;
    let cancelled = false;
    getNodeHost(clusterId, ip)
      .then((res) => {
        if (!cancelled) setItems(res.items ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [clusterId, ip]);
  if (items.length === 0) return null;
  return (
    <>
      <SectionTitle>{t('pages.k8s.host.title')}</SectionTitle>
      <Table<HostCI>
        size="small"
        rowKey="id"
        pagination={false}
        dataSource={items}
        columns={[
          {
            title: t('pages.k8s.column.name'),
            render: (_, r) => (
              <a href={`/cmdb/ci/${r.id}`} target="_blank" rel="noreferrer">
                {r.name}
              </a>
            ),
          },
          { title: t('pages.k8s.host.model'), dataIndex: 'modelName' },
          { title: t('pages.k8s.host.env'), dataIndex: 'env' },
          {
            title: t('pages.k8s.host.owner'),
            render: (_, r) => r.ownerName || r.owner || '-',
          },
        ]}
      />
    </>
  );
};

/** 「让助手分析」：把诊断问题交给全局智能助手（需有助手权限） */
export const AskAssistantButton: React.FC<{
  clusterName: string;
  kind: string;
  namespace?: string;
  name: string;
}> = ({ clusterName, kind, namespace, name }) => {
  const t = useT();
  const access = useAccess();
  if (!access.canAssistant) return null;
  return (
    <Button
      icon={<RobotOutlined />}
      onClick={() =>
        askAssistant(
          t('pages.k8s.assistant.question', {
            cluster: clusterName,
            kind,
            namespace: namespace ?? '-',
            name,
          }),
        )
      }
    >
      {t('pages.k8s.assistant.ask')}
    </Button>
  );
};
