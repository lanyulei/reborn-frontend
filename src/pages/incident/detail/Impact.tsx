/**
 * 故障详情「影响面与变更」：受影响资源及其下游（按层级分组，带可见性），近期变更（作业 / 流程 / 容器平台 /
 * 手动标记，按时间倒序），处理人可标记疑似原因 / 已排除 / 修复操作。
 */
import { Link, useAccess } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Empty,
  Flex,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import zhCN from '@/locales/zh-CN';
import {
  getImpact,
  listChanges,
  markChange,
} from '@/services/incident/incident';
import type {
  ChangeRef,
  ChangeRelation,
  ImpactNode,
  Incident,
} from '@/services/incident/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useT } from '@/utils/i18n';
import { RELATION_META, RELATION_ORDER } from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import { CiLink, RefName } from '../components/tags';
import { MarkChangeModal } from './Dialogs';

const LOOKBACK_OPTIONS = [6, 24, 72, 168] as const;

const changeKey = (c: ChangeRef) =>
  `${c.domain}:${c.kind ?? ''}:${c.refId ?? ''}:${c.refTime ?? ''}`;

/** 词条是否存在：useT 缺键时返回键名本身，不能用 `||` 回退 */
const hasText = (id: string) => id in zhCN;

export const ImpactPanel: React.FC<{
  incident: Incident;
  refreshKey: number;
}> = ({ incident, refreshKey }) => {
  const t = useT();
  const access = useAccess();
  const has = usePermissions();
  const { message } = App.useApp();
  const { styles } = useIncidentStyles();
  const [nodes, setNodes] = useState<ImpactNode[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [impactLoading, setImpactLoading] = useState(true);
  const [changes, setChanges] = useState<ChangeRef[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [lookback, setLookback] = useState<number>(24);
  const [changesLoading, setChangesLoading] = useState(true);
  const [markOpen, setMarkOpen] = useState(false);
  const seq = useRef(0);
  const impactSeq = useRef(0);
  // 变更详情链接按来源域的菜单权限决定是否可点（无权限只显示文本）
  const canOpen = (domain: string) => {
    switch (domain) {
      case 'job':
        return Boolean(access.canJobExecution);
      case 'workflow':
        return Boolean(access.canWorkflowInstance);
      case 'k8s':
        return Boolean(access.canK8sChange);
      case 'cmdb':
        return Boolean(access.canCmdbCI);
      // 持续交付暂无前端页面与权限位：只显示摘要，不渲染跳转
      case 'cicd':
        return false;
      default:
        return false;
    }
  };

  const loadImpact = useCallback(async () => {
    // 只采纳最后一次加载的结果：切换故障或连续刷新时，旧响应不覆盖新数据
    const current = ++impactSeq.current;
    setImpactLoading(true);
    try {
      const result = await getImpact(incident.id);
      if (current !== impactSeq.current) return;
      setNodes(result.nodes ?? []);
      setTruncated(result.truncated === true);
    } catch {
      if (current !== impactSeq.current) return;
      setNodes([]);
    } finally {
      if (current === impactSeq.current) setImpactLoading(false);
    }
  }, [incident.id]);

  const loadChanges = useCallback(async () => {
    const current = ++seq.current;
    setChangesLoading(true);
    try {
      const result = await listChanges(incident.id, lookback);
      if (current !== seq.current) return;
      setChanges(result.items ?? []);
      setNotes(result.notes ?? []);
    } catch {
      if (current === seq.current) setChanges([]);
    } finally {
      if (current === seq.current) setChangesLoading(false);
    }
  }, [incident.id, lookback]);

  useEffect(() => {
    void loadImpact();
  }, [loadImpact, refreshKey]);
  useEffect(() => {
    void loadChanges();
  }, [loadChanges, refreshKey]);

  // 标记变更归元素权限「处置」（incident.list.handle），与页头操作同一口径
  const canHandle =
    incident.canHandle === true &&
    incident.status <= 4 &&
    has('incident.list.handle');
  const direct = nodes.filter((n) => (n.depth ?? 0) === 0);
  const downstream = nodes.filter((n) => (n.depth ?? 0) > 0);

  const relate = async (c: ChangeRef, relation: ChangeRelation) => {
    await markChange(incident.id, {
      domain: c.domain,
      kind: c.kind,
      refId: c.refId,
      summary: c.summary,
      refTime: c.refTime,
      relation,
    });
    message.success(t('pages.incident.msg.updated'));
    void loadChanges();
  };

  const renderCis = (list: ImpactNode[]) =>
    list.length === 0 ? (
      <span className={styles.hint}>{t('common.empty')}</span>
    ) : (
      <Space size={[6, 6]} wrap>
        {list.map((n) => (
          <Tag key={n.id} style={{ marginInlineEnd: 0 }}>
            <CiLink ci={{ id: n.id, name: n.name }} canView={n.canView} />
            {n.modelName && (
              <span className={styles.hint}> · {n.modelName}</span>
            )}
            {(n.depth ?? 0) > 0 && (
              <span className={styles.hint}> · L{n.depth}</span>
            )}
          </Tag>
        ))}
      </Space>
    );

  return (
    <div>
      <SectionTitle style={{ marginTop: 0 }}>
        {t('pages.incident.impact.direct')}
      </SectionTitle>
      <Spin spinning={impactLoading}>{renderCis(direct)}</Spin>
      <SectionTitle>{t('pages.incident.impact.downstream')}</SectionTitle>
      <Spin spinning={impactLoading}>
        {renderCis(downstream)}
        {truncated && (
          <div className={styles.hint} style={{ marginTop: 8 }}>
            {t('pages.incident.impact.truncated')}
          </div>
        )}
      </Spin>

      <Flex
        justify="space-between"
        align="center"
        wrap
        gap={8}
        style={{ marginTop: 20, marginBottom: 12 }}
      >
        <SectionTitle style={{ margin: 0 }}>
          {t('pages.incident.change.title')}
        </SectionTitle>
        <Space>
          <Select<number>
            value={lookback}
            onChange={setLookback}
            options={LOOKBACK_OPTIONS.map((h) => ({
              value: h,
              label: t('pages.incident.change.lookback', { h }),
            }))}
            style={{ width: 130 }}
          />
          {canHandle && (
            <Button onClick={() => setMarkOpen(true)}>
              {t('pages.incident.change.mark')}
            </Button>
          )}
        </Space>
      </Flex>
      {notes.map((n) => (
        <Alert
          key={n}
          type="info"
          showIcon
          title={n}
          style={{ marginBottom: 8 }}
        />
      ))}
      <Table<ChangeRef>
        rowKey={changeKey}
        size="small"
        loading={changesLoading}
        dataSource={changes}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('pages.incident.change.empty')}
            />
          ),
        }}
        columns={[
          {
            title: t('pages.incident.change.time'),
            dataIndex: 'refTime',
            width: 160,
            render: (_, row) => formatTime(row.refTime),
          },
          {
            title: t('pages.incident.change.source'),
            dataIndex: 'domain',
            width: 140,
            render: (_, row) => (
              <>
                <Tag>
                  {hasText(`pages.incident.change.domain.${row.domain}`)
                    ? t(`pages.incident.change.domain.${row.domain}`)
                    : row.domain}
                </Tag>
                {row.kind && row.kind !== row.domain && (
                  <span className={styles.hint}>{row.kind}</span>
                )}
              </>
            ),
          },
          {
            title: t('pages.incident.change.summary'),
            dataIndex: 'summary',
            ellipsis: true,
            render: (_, row) =>
              row.url && canOpen(row.domain) ? (
                <Link to={row.url}>{row.summary || row.refId}</Link>
              ) : (
                row.summary || row.refId
              ),
          },
          {
            title: t('pages.incident.change.ci'),
            dataIndex: 'ci',
            width: 160,
            ellipsis: true,
            render: (_, row) =>
              row.ci?.id ? <CiLink ci={row.ci} /> : t('common.empty'),
          },
          {
            title: t('pages.incident.change.operator'),
            dataIndex: 'operator',
            width: 110,
            ellipsis: true,
            render: (_, row) => <RefName ref={row.operator} />,
          },
          {
            title: t('pages.incident.change.relation'),
            dataIndex: 'relation',
            width: 180,
            render: (_, row) =>
              canHandle ? (
                <Select<ChangeRelation>
                  size="small"
                  value={row.relation ?? 0}
                  onChange={(v) => void relate(row, v)}
                  style={{ width: 150 }}
                  options={[0, ...RELATION_ORDER].map((r) => ({
                    value: r as ChangeRelation,
                    label: t(RELATION_META[r as ChangeRelation].textId),
                  }))}
                />
              ) : (
                <Tag color={RELATION_META[row.relation ?? 0].color}>
                  {t(RELATION_META[row.relation ?? 0].textId)}
                </Tag>
              ),
          },
        ]}
      />
      {markOpen && (
        <MarkChangeModal
          incident={incident}
          onClose={() => setMarkOpen(false)}
          onDone={() => void loadChanges()}
        />
      )}
    </div>
  );
};
