/**
 * 故障时间线：开启、等级 / 状态变更、指挥与成员、评论、关联告警、变更、公告、处置建议、工单、AI 摘要、
 * Agent 发现、升级 / 停滞提醒、复盘等，按时间升序；可按类型过滤、只看置顶；处理人可置顶 / 取消置顶。
 * 后端新增的类型在旧前端上也要能看：不认识的类型按原样显示类型名与说明。
 */
import { PushpinFilled, PushpinOutlined } from '@ant-design/icons';
import { Link } from '@umijs/max';
import {
  App,
  Button,
  Empty,
  Flex,
  Input,
  Pagination,
  Segmented,
  Select,
  Space,
  Spin,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CitedText } from '@/components/Citations';
import zhCN from '@/locales/zh-CN';
import {
  addComment,
  listTimeline,
  pinEvent,
} from '@/services/incident/incident';
import type {
  EventDetail,
  Incident,
  TimelineItem,
} from '@/services/incident/typings';
import { formatTime } from '@/utils/format';
import { useT } from '@/utils/i18n';
import {
  ACTOR_META,
  INCIDENT_LIMITS,
  incidentPath,
  RELATION_META,
  SEVERITY_META,
  STATUS_META,
  TIMELINE_COLOR,
} from '../components/meta';
import { useIncidentStyles } from '../components/styles';

/** 词条是否存在：useT 缺键时返回键名本身，不能用 `||` 回退 */
const hasText = (id: string) => id in zhCN;

const PAGE_SIZE = 50;
const FILTER_TYPES = [
  'status',
  'severity',
  'comment',
  'alert_attach',
  'alert_resolved',
  'change',
  'update',
  'proposal',
  'proposal_result',
  'agent_finding',
  'ticket',
  'notify',
] as const;

const refText = (ref?: { id: string; name?: string }) =>
  ref?.name || ref?.id || '';

/** 一条记录的正文（按类型拼装；细节字段缺失时只显示文字） */
const Body: React.FC<{ item: TimelineItem }> = ({ item }) => {
  const t = useT();
  const { styles } = useIncidentStyles();
  const d: EventDetail = item.detail ?? {};
  const sev = (v?: number) =>
    v && v >= 1 && v <= 4
      ? t(SEVERITY_META[v as 1 | 2 | 3 | 4].textId)
      : String(v ?? '');
  const st = (v?: number) =>
    v && v >= 1 && v <= 6
      ? t(STATUS_META[v as 1 | 2 | 3 | 4 | 5 | 6].textId)
      : String(v ?? '');
  let head: React.ReactNode = null;
  switch (item.type) {
    case 'severity':
      head = t('pages.incident.timeline.severity', {
        from: sev(d.from),
        to: sev(d.to),
      });
      break;
    case 'status':
      head = t('pages.incident.timeline.status', {
        from: st(d.from),
        to: st(d.to),
      });
      break;
    case 'commander':
      head = t('pages.incident.timeline.commander', { name: refText(d.user) });
      break;
    case 'member_add':
    case 'member_remove':
      head = t(`pages.incident.timeline.${item.type}`, {
        name: refText(d.user),
      });
      break;
    case 'alert_attach':
    case 'alert_detach':
    case 'alert_resolved':
      head = t(`pages.incident.timeline.${item.type}`, {
        n: d.alertCount ?? d.alertIds?.length ?? 0,
      });
      break;
    case 'merged':
    case 'merged_from':
      head = (
        <>
          {t(`pages.incident.timeline.${item.type}`)}{' '}
          {d.incident?.id ? (
            <Link to={incidentPath(d.incident.id)}>{refText(d.incident)}</Link>
          ) : (
            refText(d.incident)
          )}
        </>
      );
      break;
    case 'proposal':
    case 'proposal_decision':
    case 'proposal_result':
    case 'proposal_verify':
      head = (
        <>
          {t(`pages.incident.timeline.${item.type}`)}
          {d.proposal && (
            <Tag style={{ marginInlineStart: 6 }}>{refText(d.proposal)}</Tag>
          )}
        </>
      );
      break;
    case 'ticket':
      head = (
        <>
          {t('pages.incident.timeline.ticket')} {refText(d.ticket)}
        </>
      );
      break;
    case 'change':
      head = (
        <>
          {t('pages.incident.timeline.change')}
          {d.change?.relation !== undefined && (
            <Tag
              color={RELATION_META[d.change.relation]?.color}
              style={{ marginInlineStart: 6 }}
            >
              {t(
                RELATION_META[d.change.relation]?.textId ??
                  'enum.incident.relation.0',
              )}
            </Tag>
          )}
          {d.change?.summary && (
            <div className={styles.timelineBody}>{d.change.summary}</div>
          )}
        </>
      );
      break;
    case 'agent_finding':
      head = (
        <>
          {t('pages.incident.timeline.agent_finding')}
          {d.finding && (
            <div className={styles.timelineBody}>
              <strong>{d.finding.title}</strong>
              {d.finding.confidence !== undefined && (
                <Tag style={{ marginInlineStart: 6 }}>
                  {t('pages.incident.finding.confidence', {
                    n: d.finding.confidence,
                  })}
                </Tag>
              )}
              {d.finding.conclusion && (
                <div>
                  <CitedText text={d.finding.conclusion} />
                </div>
              )}
              {d.finding.nextStep && (
                <div>
                  {t('pages.incident.finding.nextStep')}：
                  <CitedText text={d.finding.nextStep} />
                </div>
              )}
              {d.finding.runId && (
                <Link to={{ search: '?tab=agent' }}>
                  {t('pages.incident.timeline.viewRun')}
                </Link>
              )}
            </div>
          )}
        </>
      );
      break;
    case 'escalate':
      head = t('pages.incident.timeline.escalate', { level: d.level ?? 0 });
      break;
    case 'review':
      head = t('pages.incident.timeline.review', { version: d.version ?? 0 });
      break;
    default:
      head = hasText(`pages.incident.timeline.${item.type}`)
        ? t(`pages.incident.timeline.${item.type}`, {})
        : item.type;
  }
  return (
    <>
      <div>{head}</div>
      {d.text && item.type !== 'change' && (
        <div className={styles.timelineBody}>{d.text}</div>
      )}
      {d.error && (
        <Typography.Text type="danger" className={styles.timelineBody}>
          {d.error}
        </Typography.Text>
      )}
    </>
  );
};

export const TimelinePanel: React.FC<{
  incident: Incident;
  refreshKey: number;
}> = ({ incident, refreshKey }) => {
  const t = useT();
  const { message } = App.useApp();
  const { styles, cx } = useIncidentStyles();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<string[]>([]);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const current = ++seq.current;
    setLoading(true);
    try {
      const result = await listTimeline(incident.id, {
        page,
        pageSize: PAGE_SIZE,
        types: types.length ? types : undefined,
        pinnedOnly: pinnedOnly || undefined,
      });
      if (current !== seq.current) return;
      setItems(result.items ?? []);
      setTotal(Number(result.total ?? 0));
    } catch {
      if (current === seq.current) setItems([]);
    } finally {
      if (current === seq.current) setLoading(false);
    }
  }, [incident.id, page, types, pinnedOnly]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const typeOptions = useMemo(
    () =>
      FILTER_TYPES.map((ty) => ({
        value: ty,
        label: t(`pages.incident.timeline.type.${ty}`),
      })),
    [t],
  );

  const canHandle = incident.canHandle === true;
  const active = incident.status <= 4;

  return (
    <div>
      <Flex gap={8} wrap align="center" style={{ marginBottom: 12 }}>
        <Select
          mode="multiple"
          allowClear
          value={types}
          onChange={(v) => {
            setTypes(v);
            setPage(1);
          }}
          options={typeOptions}
          placeholder={t('pages.incident.timeline.filterPlaceholder')}
          style={{ minWidth: 260 }}
          maxTagCount="responsive"
        />
        <Segmented
          value={pinnedOnly ? 'pinned' : 'all'}
          onChange={(v) => {
            setPinnedOnly(v === 'pinned');
            setPage(1);
          }}
          options={[
            { value: 'all', label: t('pages.incident.timeline.all') },
            { value: 'pinned', label: t('pages.incident.timeline.pinned') },
          ]}
        />
      </Flex>
      {canHandle && active && (
        <Flex gap={8} style={{ marginBottom: 16 }} align="flex-start">
          <Input.TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 6 }}
            maxLength={INCIDENT_LIMITS.commentMax}
            placeholder={t('pages.incident.timeline.commentPlaceholder')}
          />
          <Button
            type="primary"
            loading={posting}
            disabled={!comment.trim()}
            onClick={async () => {
              setPosting(true);
              try {
                await addComment(incident.id, comment.trim());
                setComment('');
                message.success(t('pages.incident.timeline.commented'));
                void load();
              } finally {
                setPosting(false);
              }
            }}
          >
            {t('pages.incident.timeline.commentButton')}
          </Button>
        </Flex>
      )}
      <Spin spinning={loading}>
        {items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.incident.timeline.empty')}
          />
        ) : (
          <Timeline
            items={items.map((item) => ({
              key: item.id,
              color: TIMELINE_COLOR[item.type] ?? 'gray',
              children: (
                <div className={cx(item.pinned && styles.pinned)}>
                  <div className={styles.timelineHead}>
                    <span className={styles.hint}>
                      {formatTime(item.createTime)}
                    </span>
                    <Tag style={{ marginInlineEnd: 0 }}>
                      {item.actorType && item.actorType !== 1
                        ? t(ACTOR_META[item.actorType].textId)
                        : refText(item.actor) || t('enum.incident.actor.1')}
                    </Tag>
                    <Space size={4}>
                      <Body item={item} />
                    </Space>
                    {canHandle && (
                      <Tooltip
                        title={t(
                          item.pinned
                            ? 'pages.incident.timeline.unpin'
                            : 'pages.incident.timeline.pin',
                        )}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={
                            item.pinned ? (
                              <PushpinFilled />
                            ) : (
                              <PushpinOutlined />
                            )
                          }
                          onClick={async () => {
                            await pinEvent(incident.id, item.id, !item.pinned);
                            void load();
                          }}
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
              ),
            }))}
          />
        )}
      </Spin>
      {total > PAGE_SIZE && (
        <Pagination
          size="small"
          current={page}
          pageSize={PAGE_SIZE}
          total={total}
          onChange={setPage}
          style={{ marginTop: 12 }}
        />
      )}
    </div>
  );
};
