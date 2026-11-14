/**
 * 资源详情：标题条（返回）+ 概要头（模型图标 / 名称 / 状态 / 元信息 / 操作）+
 * 顶层标签 属性 | 关联 | 拓扑 | 变更记录。
 * 属性分组与关联面板的顺序、字段/列、默认折叠由类型的详情布局（GetModelView）驱动；
 * 未配置时为缺省布局（全部字段一组 + 每个适用关系方向一个面板）。
 * 变更记录按字段级前后对比展示（DiffView）；ref 属性渲染为可点击链接。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProTable,
} from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  App,
  Badge,
  Button,
  Card,
  Collapse,
  Dropdown,
  Empty,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
  theme,
} from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import type React from 'react';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getCI,
  listCIHistory,
  listCIs,
  transitionCI,
} from '@/services/cmdb/ci';
import {
  getModel,
  getModelView,
  listAllModels,
  type ViewSection,
} from '@/services/cmdb/model';
import {
  linkCIs,
  listRelated,
  moveCI,
  unlinkCI,
} from '@/services/cmdb/relation';
import type {
  CmdbCI,
  CmdbCIStatus,
  CmdbField,
  CmdbHistory,
  CmdbModel,
  CmdbRelatedCI,
  CmdbRelationSummary,
  CmdbRelationType,
} from '@/services/cmdb/typings';
import { usePermissions } from '@/services/system/permissions';
import {
  useEnumText,
  useFormRules,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { CIForm } from '../components/CIForm';
import { HistoryDiff, isRelationAction } from '../components/HistoryDiff';
import { ModelIcon } from '../components/icons';
import {
  CMDB_ACTION_META,
  CMDB_ANY_MODEL,
  CMDB_CI_STATUS_META,
  CMDB_CI_TRANSITIONS,
  CMDB_FIELD_OWNER_META,
} from '../components/meta';
import { renderAttrValue } from '../components/schema';
import { useCmdbStyles } from '../components/styles';
import { TopologyPanel } from '../components/TopologyPanel';
import { useSourceText } from '../components/useSourceText';
import { useUserNames } from '../components/useUserNames';

/** 关联 Tab 内 ProTable 的紧凑留白（按用户指定的选择器与数值） */
const useRelationStyles = createStyles(({ css }) => ({
  relationTables: css`
    .ant-pro-card > .ant-pro-card-body {
      padding-inline: 8px;
      padding-block: 6px;
    }
    .ant-pro-table-list-toolbar-container {
      padding: 5px 0 12px;
    }
  `,
}));

/** 关联面板：某关系类型某方向上的关联资源表格与操作 */
const RelationPanel: React.FC<{
  ci: CmdbCI;
  summary: CmdbRelationSummary;
  models: CmdbModel[];
  /** 布局指定的展示列（字段 code）；空 = 对端类型的列表可见字段 */
  columns?: string[];
  onChanged: () => void;
}> = ({ ci, summary, models, columns: viewColumns, onChanged }) => {
  const t = useT();
  const { message, modal } = App.useApp();
  const { token } = theme.useToken();
  const has = usePermissions();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const statusEnum = useValueEnum(CMDB_CI_STATUS_META);
  const actionRef = useRef<ActionType>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [moveRow, setMoveRow] = useState<CmdbRelatedCI | null>(null);
  const [targetFields, setTargetFields] = useState<CmdbField[]>([]);
  const canLink = has('cmdb.ci.link');
  const anyTarget = summary.targetModel === CMDB_ANY_MODEL;
  const targetModel = useMemo(
    () => models.find((m) => m.code === summary.targetModel),
    [models, summary.targetModel],
  );
  const attrColumns = useMemo<ProColumns<CmdbRelatedCI>[]>(
    () =>
      (viewColumns?.length
        ? viewColumns
            .map((code) => targetFields.find((f) => f.code === code))
            .filter((f): f is CmdbField => !!f)
        : targetFields.filter((f) => f.listVisible && !f.deprecated)
      ).map((f) => ({
        title: f.name,
        key: `attrs.${f.code}`,
        dataIndex: ['ci', 'attrs', f.code],
        ellipsis: true,
        render: (_, r) => renderAttrValue(f, r.ci.attrs?.[f.code], t),
      })),
    [targetFields, viewColumns, t],
  );

  // 对端类型固定时拉取字段定义（面板列 + "新建并关联"表单）
  useEffect(() => {
    let cancelled = false;
    if (anyTarget) {
      setTargetFields([]);
      return;
    }
    getModel(summary.targetModel)
      .then((d) => {
        if (!cancelled) setTargetFields(d.fields);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [anyTarget, summary.targetModel]);

  const refresh = () => {
    actionRef.current?.reload();
    onChanged();
  };

  const searchTargets = async (
    modelCode: string | undefined,
    keyword?: string,
  ) => {
    const result = await listCIs({
      page: 1,
      pageSize: 20,
      modelCode: modelCode || undefined,
      keyword: keyword || undefined,
    });
    return result.items
      .filter((item) => item.id !== ci.id)
      .map((item) => ({
        label: `${item.name}（${item.modelName ?? item.modelCode}）`,
        value: item.id,
      }));
  };

  const columns: ProColumns<CmdbRelatedCI>[] = [
    {
      title: t('pages.cmdb.ci.column.name'),
      dataIndex: ['ci', 'name'],
      render: (_, r) => (
        <a onClick={() => history.push(`/cmdb/ci/${r.ci.id}`)}>{r.ci.name}</a>
      ),
    },
    ...(anyTarget
      ? [
          {
            title: t('pages.cmdb.ci.column.model'),
            dataIndex: ['ci', 'modelName'],
          } as ProColumns<CmdbRelatedCI>,
        ]
      : []),
    {
      title: t('common.column.status'),
      dataIndex: ['ci', 'status'],
      valueEnum: statusEnum,
      width: 90,
    },
    {
      title: t('pages.cmdb.ci.column.env'),
      dataIndex: ['ci', 'env'],
      width: 100,
    },
    ...attrColumns,
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 120,
      hideInTable: !canLink,
      render: (_, r) => [
        <a key="move" onClick={() => setMoveRow(r)}>
          {t('pages.cmdb.detail.relation.move')}
        </a>,
        <a
          key="unlink"
          style={{ color: token.colorError }}
          onClick={() =>
            // 二次确认弹窗（与模型详情的删除 / 停用确认同一写法）
            modal.confirm({
              title: t('pages.cmdb.detail.relation.unlink.title', {
                name: r.ci.name,
              }),
              content: t('pages.cmdb.detail.relation.unlink.confirm'),
              okButtonProps: { danger: true },
              onOk: async () => {
                // 失败时 authRequest 已提示；抛出以保持弹窗打开
                await unlinkCI(
                  ci.id,
                  summary.relationType,
                  summary.direction,
                  r.ci.id,
                );
                message.success(t('common.msg.updated'));
                refresh();
              },
            })
          }
        >
          {t('pages.cmdb.detail.relation.unlink')}
        </a>,
      ],
    },
  ];

  return (
    <>
      <ProTable<CmdbRelatedCI>
        rowKey="relationId"
        actionRef={actionRef}
        search={false}
        options={false}
        size="small"
        columns={columns}
        scroll={{ x: 'max-content' }}
        headerTitle={
          <Space>
            <Typography.Text type="secondary">
              {t('pages.cmdb.detail.relation.targetModel')}：
              {anyTarget
                ? t('pages.cmdb.relationType.form.anyModel')
                : (targetModel?.name ?? summary.targetModel)}
            </Typography.Text>
          </Space>
        }
        toolBarRender={() =>
          canLink
            ? [
                <Button
                  key="link"
                  type="primary"
                  onClick={() => setLinkOpen(true)}
                >
                  {t('pages.cmdb.detail.relation.link')}
                </Button>,
                !anyTarget && targetModel && has('cmdb.ci.create') && (
                  <Button key="create" onClick={() => setCreateOpen(true)}>
                    {t('pages.cmdb.detail.relation.createAndLink')}
                  </Button>
                ),
              ]
            : []
        }
        request={async (params) => {
          const result = await listRelated(ci.id, {
            relationType: summary.relationType,
            direction: summary.direction,
            page: params.current,
            pageSize: params.pageSize,
          });
          return toTableResult(result);
        }}
      />
      {/* 关联已有：对端类型固定时直接选资源；通配时先选类型 */}
      <ModalForm<{ modelCode?: string; targetIds: string[] }>
        key={`link-${summary.relationType}-${summary.direction}`}
        title={t('pages.cmdb.detail.relation.link.title', {
          panel: summary.name,
        })}
        width={520}
        open={linkOpen}
        onOpenChange={setLinkOpen}
        modalProps={{ destroyOnHidden: true }}
        submitter={submitter.save}
        onFinish={async (values) => {
          const { linked } = await linkCIs(
            ci.id,
            summary.relationType,
            summary.direction,
            values.targetIds,
          );
          message.success(
            t('pages.cmdb.detail.relation.linked', { count: linked }),
          );
          refresh();
          return true;
        }}
      >
        {anyTarget && (
          <ProFormSelect
            name="modelCode"
            label={t('pages.cmdb.detail.relation.link.model')}
            options={models.map((m) => ({ label: m.name, value: m.code }))}
            rules={[rules.select(t('pages.cmdb.detail.relation.link.model'))]}
          />
        )}
        <ProFormSelect
          name="targetIds"
          label={t('pages.cmdb.detail.relation.link.targets')}
          mode="multiple"
          showSearch
          debounceTime={300}
          dependencies={['modelCode']}
          placeholder={t('pages.cmdb.detail.relation.link.targets.placeholder')}
          fieldProps={{ filterOption: false }}
          rules={[rules.select(t('pages.cmdb.detail.relation.link.targets'))]}
          request={async ({ keyWords, modelCode }) =>
            searchTargets(anyTarget ? modelCode : summary.targetModel, keyWords)
          }
        />
      </ModalForm>
      {/* 迁移：解除与当前行的关系并与新目标建立，同一事务 */}
      {moveRow && (
        <ModalForm<{ toId: string }>
          key={`move-${moveRow.relationId}`}
          title={t('pages.cmdb.detail.relation.move.title', {
            name: moveRow.ci.name,
          })}
          width={480}
          open={!!moveRow}
          onOpenChange={(open) => {
            if (!open) setMoveRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          submitter={submitter.save}
          onFinish={async (values) => {
            await moveCI(
              ci.id,
              summary.relationType,
              summary.direction,
              moveRow.ci.id,
              values.toId,
            );
            message.success(t('common.msg.updated'));
            refresh();
            return true;
          }}
        >
          <ProFormSelect
            name="toId"
            label={t('pages.cmdb.detail.relation.move.target')}
            showSearch
            debounceTime={300}
            fieldProps={{ filterOption: false }}
            rules={[rules.select(t('pages.cmdb.detail.relation.move.target'))]}
            request={async ({ keyWords }) =>
              searchTargets(
                anyTarget ? undefined : summary.targetModel,
                keyWords,
              )
            }
          />
        </ModalForm>
      )}
      {/* 新建并关联：按对端类型字段生成表单，创建成功后立即关联 */}
      {targetModel && (
        <CIForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          model={targetModel}
          fields={targetFields}
          onSuccess={async (created) => {
            try {
              await linkCIs(ci.id, summary.relationType, summary.direction, [
                created.id,
              ]);
            } catch {
              // authRequest 已按后端 message 提示，不重复弹
            }
            refresh();
          }}
        />
      )}
    </>
  );
};

const HistoryPanel: React.FC<{
  ciId: string;
  version: string;
  fields: CmdbField[];
}> = ({ ciId, version, fields }) => {
  const t = useT();
  const { styles } = useCmdbStyles();
  const actionEnum = useValueEnum(CMDB_ACTION_META);
  const userNames = useUserNames();
  const sourceText = useSourceText();
  const columns: ProColumns<CmdbHistory>[] = [
    {
      title: t('pages.cmdb.detail.history.column.time'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 170,
    },
    {
      title: t('pages.cmdb.detail.history.column.action'),
      dataIndex: 'action',
      valueEnum: actionEnum,
      width: 100,
    },
    {
      title: t('pages.cmdb.detail.history.column.operator'),
      dataIndex: 'operator',
      width: 220,
      ellipsis: true,
      copyable: true,
      renderText: (val) => userNames[val ?? ''] || val,
    },
    {
      title: t('pages.cmdb.detail.history.column.source'),
      dataIndex: 'source',
      width: 100,
      renderText: (val) => sourceText(val),
    },
    {
      title: t('pages.cmdb.detail.history.column.diff'),
      dataIndex: 'diff',
      render: (_, r) => (
        <HistoryDiff summary action={r.action} diff={r.diff} fields={fields} />
      ),
    },
  ];
  return (
    // 仅补表格最外层边框（单元格无线）
    <div className={styles.tableWrap}>
      {/* 与用户管理页的表格保持一致：默认密度 + 工具栏（刷新 / 密度 / 列设置）；
          历史列无可筛选项，不渲染查询表单 */}
      <ProTable<CmdbHistory>
        cardBordered
        key={version}
        rowKey="id"
        search={false}
        columns={columns}
        expandable={{
          rowExpandable: (r) => !isRelationAction(r.action),
          expandedRowRender: (r) => (
            <HistoryDiff action={r.action} diff={r.diff} fields={fields} />
          ),
        }}
        request={async (params) => {
          const result = await listCIHistory(ciId, {
            page: params.current,
            pageSize: params.pageSize,
          });
          return toTableResult(result);
        }}
      />
    </div>
  );
};

const CIDetailBody: React.FC<{ id: string }> = ({ id }) => {
  const t = useT();
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const statusText = useEnumText(CMDB_CI_STATUS_META);
  const ownerText = useEnumText(CMDB_FIELD_OWNER_META);
  const { styles: pageStyles } = useCmdbStyles();
  const { styles: relationStyles } = useRelationStyles();
  const styles = { ...pageStyles, ...relationStyles };
  const [ci, setCI] = useState<CmdbCI | null>(null);
  const [summaries, setSummaries] = useState<CmdbRelationSummary[]>([]);
  const [model, setModel] = useState<CmdbModel | null>(null);
  const [fields, setFields] = useState<CmdbField[]>([]);
  const [relTypes, setRelTypes] = useState<CmdbRelationType[]>([]);
  const [models, setModels] = useState<CmdbModel[]>([]);
  const [sections, setSections] = useState<ViewSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  // 最近一次 load 的序号：只采纳最新一次的结果
  const loadSeq = useRef(0);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    try {
      const detail = await getCI(id);
      const [md, all, view] = await Promise.all([
        getModel(detail.ci.modelCode),
        listAllModels(),
        getModelView(detail.ci.modelCode),
      ]);
      if (seq !== loadSeq.current) return;
      setCI(detail.ci);
      setSummaries(detail.relations);
      setModel(md.model);
      setFields(md.fields);
      setRelTypes(md.relationTypes);
      setModels(all.items);
      setSections(view.sections);
      setNotFound(false);
      setLoadFailed(false);
    } catch (error) {
      if (seq !== loadSeq.current) return;
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      // 仅 404 视为资源不存在；网络 / 5xx 等可重试（已有数据时保留当前展示）
      if (status === 404) setNotFound(true);
      else setLoadFailed(true);
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // 关联增删后的轻量刷新：只重取资源与关联汇总（模型 / 字段 / 布局不会因此变化）
  const refreshCI = useCallback(async () => {
    const seq = loadSeq.current;
    try {
      const detail = await getCI(id);
      if (seq !== loadSeq.current) return;
      setCI(detail.ci);
      setSummaries(detail.relations);
    } catch {
      // authRequest 已提示；保留当前展示
    }
  }, [id]);

  const transitionItems = useMemo(
    () =>
      ci
        ? CMDB_CI_TRANSITIONS[ci.status].map((status) => ({
            key: status,
            label: statusText(status),
          }))
        : [],
    [ci, statusText],
  );

  /** 退役前预览：cascade_retire 关系下游将被一并退役的资源（每个关系最多列 20 个） */
  const cascadePreview = async (): Promise<React.ReactNode> => {
    if (!ci) return null;
    const cascade = summaries.filter(
      (s) =>
        s.direction === 'outgoing' &&
        Number(s.count) > 0 &&
        relTypes.find((rt) => rt.code === s.relationType)?.onDelete ===
          'cascade_retire',
    );
    if (cascade.length === 0) return null;
    const groups = await Promise.all(
      cascade.map(async (s) => {
        const result = await listRelated(ci.id, {
          relationType: s.relationType,
          direction: s.direction,
          page: 1,
          pageSize: 20,
        });
        const names = result.items.map((r) => r.ci.name);
        const more = Number(s.count) - names.length;
        return `${s.name}：${names.join('、')}${more > 0 ? t('pages.cmdb.detail.transition.cascade.more', { n: more }) : ''}`;
      }),
    );
    return (
      <div style={{ marginTop: 8 }}>
        <Typography.Text type="warning">
          {t('pages.cmdb.detail.transition.cascade')}
        </Typography.Text>
        <ul style={{ margin: '4px 0 0', paddingInlineStart: 20 }}>
          {groups.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
    );
  };

  const onTransition = async (status: CmdbCIStatus) => {
    if (!ci) return;
    const preview = status === 'retired' ? await cascadePreview() : null;
    modal.confirm({
      title: t('pages.cmdb.detail.transition'),
      content: (
        <>
          {t('pages.cmdb.detail.transition.confirm', {
            status: statusText(status),
          })}
          {preview}
        </>
      ),
      onOk: async () => {
        try {
          await transitionCI(ci.id, ci.version, status);
          message.success(t('common.msg.updated'));
        } catch {
          // authRequest 已按后端 message 提示（含乐观锁冲突）
        }
        await load();
      },
    });
  };

  if (loading) {
    return (
      <PageContainer title={false}>
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin />
        </div>
      </PageContainer>
    );
  }
  if (notFound || !ci || !model) {
    return (
      <PageContainer title={false}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            notFound
              ? t('pages.cmdb.detail.notFound')
              : t('pages.cmdb.detail.loadFailed')
          }
        >
          {!notFound && loadFailed && (
            <Button
              onClick={() => {
                setLoading(true);
                void load();
              }}
            >
              {t('pages.cmdb.detail.retry')}
            </Button>
          )}
        </Empty>
      </PageContainer>
    );
  }

  const activeFields = fields.filter((f) => !f.deprecated);
  const status = CMDB_CI_STATUS_META[ci.status];
  const fmtTime = (v?: string) =>
    v && dayjs(v).isValid() ? dayjs(v).format('YYYY-MM-DD HH:mm') : v;
  // ref 属性值是对端资源 id，渲染为可点击链接
  const renderDetailValue = (f: CmdbField, value: unknown) => {
    if (f.type === 'ref' && typeof value === 'string' && value) {
      return <a onClick={() => history.push(`/cmdb/ci/${value}`)}>{value}</a>;
    }
    return renderAttrValue(f, value, t);
  };
  const kv = (key: string, label: React.ReactNode, value: React.ReactNode) => (
    <div key={key} className={styles.kvItem}>
      <span className={styles.kvLabel}>{label}</span>
      <span className={styles.kvValue}>{value}</span>
    </div>
  );
  // 属性分组：按布局顺序取字段；布局里没有属性分组时回退为全部字段一组
  const attrSections = sections.filter((s) => s.type === 'attrs');
  const attrGroups = (
    attrSections.length
      ? attrSections
      : [{ type: 'attrs' as const, fields: activeFields.map((f) => f.code) }]
  ).map((s, i) => ({
    key: `attrs-${i}`,
    title: s.title || t('pages.cmdb.detail.section.attrs'),
    fields: (s.fields ?? [])
      .map((code) => activeFields.find((f) => f.code === code))
      .filter((f): f is CmdbField => !!f),
  }));
  // 布局未收录的字段（如新建后尚未分组）归「其他」，否则在详情里不可见
  const grouped = new Set(
    attrGroups.flatMap((g) => g.fields.map((f) => f.code)),
  );
  const ungrouped = activeFields.filter((f) => !grouped.has(f.code));
  if (ungrouped.length > 0) {
    attrGroups.push({
      key: 'attrs-other',
      title: t('pages.cmdb.modelDetail.fields.otherGroup'),
      fields: ungrouped,
    });
  }
  // 关联面板：按布局顺序匹配汇总；布局未列出的关系方向不展示（缺省布局包含全部）
  const relationPanels = sections
    .filter((s) => s.type === 'relation')
    .map((s) => ({
      section: s,
      summary: summaries.find(
        (x) => x.relationType === s.relationType && x.direction === s.direction,
      ),
    }))
    .filter(
      (p): p is { section: ViewSection; summary: CmdbRelationSummary } =>
        !!p.summary,
    );

  return (
    <PageContainer title={false}>
      <div className={styles.summaryHeader}>
        <ModelIcon
          icon={model.icon}
          size={48}
          muted={ci.status === 'retired'}
        />
        <div className={styles.summaryBody}>
          <div className={styles.summaryTitle}>
            {ci.name}
            <Badge
              status={status.status?.toLowerCase() as never}
              text={statusText(ci.status)}
            />
            {ci.stale && <Tag color="orange">{t('pages.cmdb.ci.stale')}</Tag>}
          </div>
          <div className={styles.summaryMeta}>
            <span>{model.name}</span>
            {ci.env && (
              <span>
                {t('pages.cmdb.ci.column.env')}：{ci.env}
              </span>
            )}
            {ci.owner && (
              <span>
                {t('pages.cmdb.ci.column.owner')}：{ci.ownerName || ci.owner}
              </span>
            )}
            {ci.tags?.length ? (
              <span>
                {ci.tags.map((tag) => (
                  <Tag key={tag} style={{ marginInlineEnd: 4 }}>
                    {tag}
                  </Tag>
                ))}
              </span>
            ) : null}
            <span>
              {t('common.column.updateTime')}：{fmtTime(ci.updateTime)}
            </span>
          </div>
        </div>
        <div className={styles.summaryActions}>
          {has('cmdb.ci.edit') && (
            <Button onClick={() => setEditOpen(true)}>
              {t('common.action.edit')}
            </Button>
          )}
          {has('cmdb.ci.transition') && transitionItems.length > 0 && (
            <Dropdown
              menu={{
                items: transitionItems,
                onClick: ({ key }) => void onTransition(key as CmdbCIStatus),
              }}
            >
              <Button type="primary">
                {t('pages.cmdb.detail.transition')}
              </Button>
            </Dropdown>
          )}
        </div>
      </div>
      <Tabs
        items={[
          {
            key: 'attrs',
            label: t('pages.cmdb.detail.tab.attrs'),
            children: (
              <Card variant="outlined">
                <div className={styles.sectionTitle}>
                  {t('pages.cmdb.detail.section.basic')}
                </div>
                <div className={styles.kvGrid}>
                  {kv(
                    'source',
                    t('pages.cmdb.ci.column.source'),
                    ci.source === 'manual' ? (
                      t('pages.cmdb.detail.source.manual')
                    ) : (
                      <Space size={4}>
                        {ci.sourceName || ci.source}
                        {ci.sourceDeleted && (
                          <Tag color="red">
                            {t('pages.cmdb.detail.source.deleted')}
                          </Tag>
                        )}
                      </Space>
                    ),
                  )}
                  {kv(
                    'externalId',
                    t('pages.cmdb.ci.column.externalId'),
                    ci.externalId || t('common.empty'),
                  )}
                  {kv('version', t('pages.cmdb.ci.column.version'), ci.version)}
                  {kv(
                    'createTime',
                    t('common.column.createTime'),
                    fmtTime(ci.createTime),
                  )}
                  {ci.lastSyncedAt &&
                    kv(
                      'lastSyncedAt',
                      t('pages.cmdb.detail.lastSyncedAt'),
                      fmtTime(ci.lastSyncedAt),
                    )}
                </div>
                {attrGroups.map((group) => (
                  <Fragment key={group.key}>
                    <div className={styles.sectionTitle}>{group.title}</div>
                    {group.fields.length === 0 ? (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                      <div className={styles.kvGrid}>
                        {group.fields.map((f) =>
                          kv(
                            f.id,
                            <Space size={4}>
                              {f.name}
                              {f.owner && f.owner !== 'manual' && (
                                <Tag style={{ marginInlineEnd: 0 }}>
                                  {ownerText(f.owner)}
                                </Tag>
                              )}
                              {f.sensitive && (
                                <Tag
                                  color="volcano"
                                  style={{ marginInlineEnd: 0 }}
                                >
                                  {t('pages.cmdb.field.column.sensitive')}
                                </Tag>
                              )}
                            </Space>,
                            renderDetailValue(f, ci.attrs?.[f.code]),
                          ),
                        )}
                      </div>
                    )}
                  </Fragment>
                ))}
              </Card>
            ),
          },
          {
            key: 'relations',
            label: t('pages.cmdb.detail.tab.relations'),
            children:
              relationPanels.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('pages.cmdb.detail.relation.empty')}
                />
              ) : (
                <div className={styles.relationTables}>
                  <Collapse
                    size="small"
                    defaultActiveKey={relationPanels
                      .filter((p) => !p.section.collapsed)
                      .map(
                        (p) =>
                          `${p.summary.relationType}:${p.summary.direction}`,
                      )}
                    items={relationPanels.map(({ section, summary: s }) => ({
                      key: `${s.relationType}:${s.direction}`,
                      label: (
                        <Space size={4}>
                          {section.title || s.name}
                          <Badge
                            count={Number(s.count)}
                            showZero
                            color="blue"
                            overflowCount={9999}
                          />
                        </Space>
                      ),
                      children: (
                        <RelationPanel
                          ci={ci}
                          summary={s}
                          models={models}
                          columns={section.columns}
                          onChanged={() => void refreshCI()}
                        />
                      ),
                    }))}
                  />
                </div>
              ),
          },
          {
            key: 'topology',
            label: t('pages.cmdb.detail.tab.topology'),
            children: <TopologyPanel ciId={ci.id} models={models} />,
          },
          {
            key: 'history',
            label: t('pages.cmdb.detail.tab.history'),
            children: (
              <HistoryPanel ciId={ci.id} version={ci.version} fields={fields} />
            ),
          },
        ]}
      />
      <CIForm
        open={editOpen}
        onOpenChange={setEditOpen}
        model={model}
        fields={fields}
        sections={sections}
        ci={ci}
        onSuccess={() => void load()}
      />
    </PageContainer>
  );
};

/** 按资源 id 设 key：页内跳转到另一资源时整页重建，避免沿用上一资源的表格与状态 */
const CIDetailPage: React.FC = () => {
  const id = useParams<{ id: string }>().id ?? '';
  return <CIDetailBody key={id} id={id} />;
};

export default CIDetailPage;
