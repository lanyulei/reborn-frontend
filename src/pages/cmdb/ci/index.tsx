/**
 * 资源实例：左侧模型选择（吸顶；搜索 / 分组 / 收藏置顶），右侧实例表格
 * （工具栏左置 新建 / 导入 / 导出）。
 * 当前模型进 URL（?model=），分享与返回不丢上下文；
 * 搜索表单按字段类型生成「属性条件」（等值）；批量支持删除 / 状态流转 / 关联；
 * 导出携带当前筛选；空模型给出新建引导。
 */
import {
  DeleteOutlined,
  DownloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormCheckbox,
  ProFormDependency,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import type { MenuProps } from 'antd';
import {
  Alert,
  App,
  Button,
  Dropdown,
  Empty,
  Input,
  Menu,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  type BatchCIsResult,
  batchDeleteCIs,
  batchTransitionCIs,
  batchUpdateCIs,
  deleteCI,
  exportCIs,
  listCIs,
  restoreCI,
} from '@/services/cmdb/ci';
import { getModel } from '@/services/cmdb/model';
import { linkCIs } from '@/services/cmdb/relation';
import type {
  CmdbCI,
  CmdbCIStatus,
  CmdbDirection,
  CmdbField,
  CmdbQualityIssue,
  CmdbRelationType,
} from '@/services/cmdb/typings';
import { usePermissions } from '@/services/system/permissions';
import { useEnumText, useT, useValueEnum } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { CIForm } from '../components/CIForm';
import { CISelect } from '../components/CISelect';
import { ImportModal } from '../components/ImportModal';
import { ModelGlyph } from '../components/icons';
import {
  CMDB_ANY_MODEL,
  CMDB_CI_STATUS_META,
  CMDB_CI_STATUS_ORDER,
} from '../components/meta';
import { OwnerSelect } from '../components/OwnerSelect';
import { useAttrColumns } from '../components/schema';
import { useCmdbStyles } from '../components/styles';
import { useCatalog } from '../components/useCatalog';

/**
 * 每次提交的条数。后端单次上限 100，但逐条执行、受请求超时约束，
 * 小批次提交可保证每个请求都在超时内返回逐条结果。
 */
const BATCH_CHUNK = 20;

/**
 * 分批顺序提交并合并结果。某一批整体失败（网络 / 超时）时不抛出：已完成批次的结果保留，
 * 该批及之后的条目标记为未处理，由调用方统一汇报。
 */
async function runBatch(
  ids: string[],
  call: (chunk: string[]) => Promise<BatchCIsResult>,
  notProcessed: string,
): Promise<NonNullable<BatchCIsResult['results']>> {
  const out: NonNullable<BatchCIsResult['results']> = [];
  for (let i = 0; i < ids.length; i += BATCH_CHUNK) {
    try {
      const { results } = await call(ids.slice(i, i + BATCH_CHUNK));
      out.push(...(results ?? []));
    } catch {
      for (const id of ids.slice(i)) {
        out.push({ id, ok: false, message: notProcessed });
      }
      break;
    }
  }
  return out;
}

const QUALITY_ISSUE_KEYS: readonly CmdbQualityIssue[] = [
  'missing_required',
  'no_owner',
  'orphan',
  'stale',
  'outdated',
];

/** 可做等值筛选的字段类型（后端按 attrs ->> code 文本比较，均成立） */
const FILTERABLE_TYPES = ['string', 'ip', 'enum', 'int', 'float', 'bool'];

const CIListPage: React.FC = () => {
  const t = useT();
  const { styles } = useCmdbStyles();
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const statusEnum = useValueEnum(CMDB_CI_STATUS_META);
  const statusText = useEnumText(CMDB_CI_STATUS_META);
  const { loading, models, groups, favorites, refreshCounts } = useCatalog();
  const [searchParams] = useSearchParams();
  const [modelKeyword, setModelKeyword] = useState('');
  const [activeCode, setActiveCode] = useState<string | undefined>(
    () => searchParams.get('model') ?? undefined,
  );
  // 数据质量问题筛选：从统计页带入（?issue=），显示为可关闭的提示条；切换模型即清除
  const [issue, setIssue] = useState<CmdbQualityIssue | undefined>(() => {
    const v = searchParams.get('issue');
    return QUALITY_ISSUE_KEYS.includes(v as CmdbQualityIssue)
      ? (v as CmdbQualityIssue)
      : undefined;
  });
  const [fields, setFields] = useState<CmdbField[]>([]);
  const [relTypes, setRelTypes] = useState<CmdbRelationType[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  // 回收站视图：只列已删除的资源，行操作为「恢复」
  const [recycle, setRecycle] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<CmdbCI | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const attrColumns = useAttrColumns<CmdbCI>(fields);
  const activeModel = useMemo(
    () => models.find((m) => m.code === activeCode),
    [models, activeCode],
  );
  // 列表与左侧模型实例数一并刷新
  const reload = () => {
    actionRef.current?.reload();
    refreshCounts();
  };

  // 目录只列启用模型；URL 指定的模型不可见（无权限 / 停用）时回退首个
  const enabled = useMemo(() => models.filter((m) => m.status === 1), [models]);

  const selectModel = useCallback((code: string) => {
    setActiveCode(code);
    setSelectedIds([]);
    setRecycle(false);
    setIssue(undefined);
    history.replace(`/cmdb/ci?model=${code}`);
  }, []);
  useEffect(() => {
    if (loading || enabled.length === 0) return;
    if (!activeCode || !enabled.some((m) => m.code === activeCode)) {
      selectModel(enabled[0].code);
    }
  }, [loading, enabled, activeCode, selectModel]);

  // 切换类型：拉取字段定义，表格列与筛选条件随之变化
  // 快速切换模型时只采纳当前模型的响应（否则旧模型的字段会驱动新模型的列与表单）
  useEffect(() => {
    if (!activeCode) return;
    let cancelled = false;
    setFields([]);
    setRelTypes([]);
    getModel(activeCode)
      .then((detail) => {
        if (cancelled) return;
        setFields(detail.fields);
        setRelTypes(detail.relationTypes);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeCode]);

  // 导出当前类型（随当前筛选，与列表一致）为 CSV/JSON 并触发下载
  const onExport = async (format: 'csv' | 'json' = 'csv') => {
    if (!activeModel) return;
    const values = formRef.current?.getFieldsValue?.() ?? {};
    setExporting(true);
    try {
      const blob = await exportCIs({
        modelCode: activeModel.code,
        ...buildFilters(values),
        format,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cmdb-${activeModel.code}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const kw = modelKeyword.trim().toLowerCase();
  const visibleModels = useMemo(
    () =>
      enabled.filter(
        (m) =>
          !kw ||
          m.name.toLowerCase().includes(kw) ||
          m.code.toLowerCase().includes(kw),
      ),
    [enabled, kw],
  );

  const menuItems = useMemo<MenuProps['items']>(() => {
    const menuItem = (m: (typeof visibleModels)[number]) => ({
      key: m.code,
      label: (
        <span className={styles.modelMenuItem}>
          <ModelGlyph icon={m.icon} size={16} />
          <span className={styles.modelMenuName}>{m.name}</span>
          <span className={styles.modelMenuCount}>
            {m.ciCount ? Number(m.ciCount) : 0}
          </span>
        </span>
      ),
    });
    const items: MenuProps['items'] = [];
    if (favorites) {
      const favs = visibleModels.filter((m) => favorites.includes(m.code));
      if (favs.length > 0) {
        items.push({
          key: 'favorites',
          type: 'group' as const,
          label: t('pages.cmdb.overview.favorites'),
          children: favs.map(menuItem),
        });
      }
    }
    for (const g of groups) {
      const list = visibleModels.filter((m) => m.category === g.code);
      if (list.length === 0) continue;
      items.push({
        key: `group-${g.code}`,
        type: 'group' as const,
        label: g.name,
        children: list.map(menuItem),
      });
    }
    return items;
  }, [favorites, groups, visibleModels, t, styles]);

  // 适用于当前类型的关系方向：值 = 类型:方向，标签 = 正向/反向名称
  const relationOptions = useMemo(
    () =>
      relTypes.flatMap((rt) => {
        const out: { label: string; value: string; target: string }[] = [];
        if (rt.srcModel === CMDB_ANY_MODEL || rt.srcModel === activeCode) {
          out.push({
            label: rt.forwardName,
            value: `${rt.code}:outgoing`,
            target: rt.dstModel,
          });
        }
        if (rt.dstModel === CMDB_ANY_MODEL || rt.dstModel === activeCode) {
          out.push({
            label: rt.backwardName,
            value: `${rt.code}:incoming`,
            target: rt.srcModel,
          });
        }
        return out;
      }),
    [relTypes, activeCode],
  );
  const relationValueEnum = useMemo(
    () =>
      Object.fromEntries(
        relationOptions.map((o) => [o.value, { text: o.label }]),
      ),
    [relationOptions],
  );
  const splitRelation = (value?: string) => {
    if (!value) return undefined;
    const [relType, relDirection] = value.split(':');
    return { relType, relDirection: relDirection as CmdbDirection };
  };

  // 搜索表单值 → 列表 / 导出共用的筛选条件（属性等值 attr_<code> → attrs.<code>；关联条件）
  const buildFilters = (params: Record<string, unknown>) => {
    const rel = splitRelation(params.relation as string | undefined);
    const mode = (params.relMode as string | undefined) ?? 'any';
    const attrs: Record<string, unknown> = {};
    for (const f of fields) {
      const value = params[`attr_${f.code}`];
      if (value !== undefined && value !== null && value !== '') {
        attrs[f.code] = value;
      }
    }
    return {
      keyword: (params.keyword as string) || undefined,
      status: (params.status as CmdbCIStatus) || undefined,
      env: (params.env as string) || undefined,
      tag: (params.tag as string) || undefined,
      owner: (params.owner as string) || undefined,
      attrs: Object.keys(attrs).length > 0 ? attrs : undefined,
      ...(rel
        ? {
            relType: rel.relType,
            relDirection: rel.relDirection,
            relNone: mode === 'none' || undefined,
            relTargetId:
              mode === 'target'
                ? (params.relTargetId as string | undefined) || undefined
                : undefined,
          }
        : {}),
    };
  };

  // 属性等值筛选列（按字段类型选择控件；提交时收集为 attrs）
  const attrFilterColumns = useMemo<ProColumns<CmdbCI>[]>(
    () =>
      fields
        .filter((f) => !f.deprecated && FILTERABLE_TYPES.includes(f.type))
        .map((f) => ({
          title: f.name,
          dataIndex: `attr_${f.code}`,
          hideInTable: true,
          ...(f.type === 'enum'
            ? {
                valueType: 'select' as const,
                valueEnum: Object.fromEntries(
                  (f.enumValues ?? []).map((v) => [
                    v,
                    { text: f.enumLabels?.[v] ?? v },
                  ]),
                ),
              }
            : {}),
          ...(f.type === 'bool'
            ? {
                valueType: 'select' as const,
                valueEnum: {
                  true: { text: 'true' },
                  false: { text: 'false' },
                },
              }
            : {}),
        })),
    [fields],
  );

  // 批量操作结果汇报：全部成功给提示；有失败时列出每条失败的资源与原因
  const reportBatch = (results: NonNullable<BatchCIsResult['results']>) => {
    const failures = results.filter((r) => !r.ok);
    const text = t('pages.cmdb.ci.batch.done', {
      ok: results.length - failures.length,
      failed: failures.length,
    });
    if (failures.length === 0) {
      message.success(text);
    } else {
      modal.warning({
        title: text,
        width: 560,
        content: (
          <div style={{ maxHeight: 320, overflow: 'auto' }}>
            {failures.map((r) => (
              <div key={r.id} style={{ padding: '4px 0' }}>
                <Typography.Text strong>{r.name || r.id}</Typography.Text>
                <Typography.Text type="secondary">
                  {' — '}
                  {r.message}
                </Typography.Text>
              </div>
            ))}
          </div>
        ),
      });
    }
    setSelectedIds([]);
    reload();
  };
  const onBatchDelete = () => {
    modal.confirm({
      title: t('pages.cmdb.ci.batch.delete.title', { n: selectedIds.length }),
      content: t('pages.cmdb.ci.batch.delete.description'),
      okButtonProps: { danger: true },
      onOk: async () => {
        reportBatch(
          await runBatch(
            selectedIds,
            batchDeleteCIs,
            t('pages.cmdb.ci.batch.notProcessed'),
          ),
        );
      },
    });
  };
  const onBatchTransition = (status: CmdbCIStatus) => {
    modal.confirm({
      title: t('pages.cmdb.detail.transition'),
      content: t('pages.cmdb.detail.transition.confirm', {
        status: statusText(status),
      }),
      onOk: async () => {
        reportBatch(
          await runBatch(
            selectedIds,
            (ids) => batchTransitionCIs(ids, status),
            t('pages.cmdb.ci.batch.notProcessed'),
          ),
        );
      },
    });
  };

  const canSelect =
    !recycle &&
    (has('cmdb.ci.link') ||
      has('cmdb.ci.delete') ||
      has('cmdb.ci.transition') ||
      has('cmdb.ci.edit'));
  const hasAnyAction = recycle
    ? has('cmdb.ci.delete')
    : has('cmdb.ci.edit') || has('cmdb.ci.delete');
  const columns: ProColumns<CmdbCI>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.cmdb.ci.search.placeholder') },
    },
    ...attrFilterColumns,
    {
      title: t('pages.cmdb.ci.filter.relation'),
      dataIndex: 'relation',
      hideInTable: true,
      valueType: 'select',
      valueEnum: relationValueEnum,
      fieldProps: {
        placeholder: t('pages.cmdb.ci.filter.relation.placeholder'),
      },
    },
    {
      title: t('pages.cmdb.ci.filter.relMode'),
      dataIndex: 'relMode',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        any: { text: t('pages.cmdb.ci.filter.relMode.any') },
        none: { text: t('pages.cmdb.ci.filter.relMode.none') },
        target: { text: t('pages.cmdb.ci.filter.relMode.target') },
      },
    },
    {
      title: t('pages.cmdb.ci.filter.relTarget'),
      dataIndex: 'relTargetId',
      hideInTable: true,
      formItemRender: (_, { value, onChange }, form) => {
        const rel = relationOptions.find(
          (o) => o.value === form.getFieldValue('relation'),
        );
        return (
          <CISelect
            value={value as string | undefined}
            onChange={onChange}
            modelCode={rel?.target}
            placeholder={t('pages.cmdb.ci.filter.relTarget.placeholder')}
          />
        );
      },
    },
    {
      title: t('pages.cmdb.ci.column.name'),
      dataIndex: 'name',
      search: false,
      ellipsis: true,
      fixed: 'left',
      render: (_, r) =>
        // 已删除的资源没有详情页
        recycle ? (
          r.name
        ) : (
          <a onClick={() => history.push(`/cmdb/ci/${r.id}`)}>
            {r.name}
            {r.stale && (
              <Tag color="orange" style={{ marginInlineStart: 8 }}>
                {t('pages.cmdb.ci.stale')}
              </Tag>
            )}
          </a>
        ),
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      width: 90,
    },
    { title: t('pages.cmdb.ci.column.env'), dataIndex: 'env', width: 100 },
    ...attrColumns,
    {
      title: t('pages.cmdb.ci.column.owner'),
      dataIndex: 'owner',
      width: 120,
      ellipsis: true,
      render: (_, r) => r.ownerName || r.owner || t('common.empty'),
      formItemRender: (_, { value, onChange }) => (
        <OwnerSelect
          value={value as string | undefined}
          onChange={onChange}
          placeholder={t('pages.cmdb.ci.form.owner.placeholder')}
        />
      ),
    },
    {
      title: t('pages.cmdb.ci.column.tags'),
      dataIndex: 'tag',
      width: 160,
      ellipsis: true,
      render: (_, r) =>
        r.tags?.length
          ? r.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
          : t('common.empty'),
    },
    recycle
      ? {
          title: t('pages.cmdb.ci.recycle.deleteTime'),
          dataIndex: 'deleteTime',
          valueType: 'dateTime',
          search: false,
          width: 160,
        }
      : {
          title: t('common.column.updateTime'),
          dataIndex: 'updateTime',
          valueType: 'dateTime',
          search: false,
          width: 160,
        },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 140,
      fixed: 'right',
      hideInTable: !hasAnyAction,
      render: (_, r) => {
        if (recycle) {
          return (
            <Popconfirm
              title={t('pages.cmdb.ci.recycle.restore.confirm', {
                name: r.name,
              })}
              onConfirm={async () => {
                try {
                  await restoreCI(r.id);
                } catch {
                  return; // authRequest 已提示（名称 / 唯一规则被占用等）
                }
                message.success(t('pages.cmdb.ci.recycle.restored'));
                reload();
              }}
            >
              <a>{t('pages.cmdb.ci.recycle.restore')}</a>
            </Popconfirm>
          );
        }
        const actions: React.ReactNode[] = [];
        if (has('cmdb.ci.edit')) {
          actions.push(
            <a key="edit" onClick={() => setEditRow(r)}>
              {t('common.action.edit')}
            </a>,
          );
        }
        if (has('cmdb.ci.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.cmdb.ci.delete.title')}
              description={t('pages.cmdb.ci.delete.description')}
              onConfirm={async () => {
                await deleteCI(r.id);
                message.success(t('common.msg.deleted'));
                // 已删除的行从勾选里去掉（跨页保留勾选时不会自动清理）
                setSelectedIds((ids) => ids.filter((id) => id !== r.id));
                reload();
              }}
            />,
          );
        }
        return actions.length ? actions : t('common.empty');
      },
    },
  ];

  return (
    <PageContainer title={false}>
      <div className={styles.split}>
        <aside className={styles.splitSide}>
          <div className={styles.splitSideTitle}>
            {t('pages.cmdb.ci.models.title')}
          </div>
          <div style={{ padding: '8px 16px 0' }}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={t('pages.cmdb.ci.models.search')}
              value={modelKeyword}
              onChange={(e) => setModelKeyword(e.target.value)}
            />
          </div>
          {loading && models.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : visibleModels.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('pages.cmdb.ci.models.empty')}
              style={{ padding: 24 }}
            />
          ) : (
            <Menu
              mode="inline"
              inlineIndent={12}
              className={styles.modelMenu}
              selectedKeys={activeCode ? [activeCode] : []}
              items={menuItems}
              onClick={({ key }) => selectModel(key)}
              style={{
                borderInlineEnd: 0,
                marginTop: 4,
                marginBottom: 6,
                background: 'transparent',
              }}
            />
          )}
        </aside>
        <div className={styles.splitMain}>
          {activeModel && issue && !recycle && (
            <Alert
              type="info"
              showIcon
              closable={{ onClose: () => setIssue(undefined) }}
              title={t('pages.cmdb.ci.issue.tip', {
                issue: t(`pages.cmdb.quality.issue.${issue}`, { days: 180 }),
              })}
              style={{ marginBottom: 16 }}
            />
          )}
          {activeModel && (
            <ProTable<CmdbCI>
              cardBordered
              key={`${activeModel.code}-${recycle ? 'bin' : 'live'}-${issue ?? ''}`}
              rowKey="id"
              actionRef={actionRef}
              formRef={formRef}
              headerTitle={
                <Space size={8}>
                  {recycle && (
                    <Typography.Text type="secondary">
                      {t('pages.cmdb.ci.recycle.tip')}
                    </Typography.Text>
                  )}
                  {!recycle && has('cmdb.ci.create') && (
                    <CreateButton onClick={() => setCreateOpen(true)}>
                      {t('common.action.create')}
                    </CreateButton>
                  )}
                  {!recycle && has('cmdb.ci.import') && (
                    <Button
                      icon={<UploadOutlined />}
                      onClick={() => setImportOpen(true)}
                    >
                      {t('pages.cmdb.import.action')}
                    </Button>
                  )}
                  {!recycle && has('cmdb.ci.export') && (
                    <Dropdown
                      menu={{
                        items: [
                          { key: 'csv', label: 'CSV' },
                          { key: 'json', label: 'JSON' },
                        ],
                        onClick: ({ key }) =>
                          void onExport(key as 'csv' | 'json'),
                      }}
                    >
                      <Button icon={<DownloadOutlined />} loading={exporting}>
                        {t('pages.cmdb.export.action')}
                      </Button>
                    </Dropdown>
                  )}
                </Space>
              }
              toolBarRender={() =>
                has('cmdb.ci.delete')
                  ? [
                      <Button
                        key="recycle"
                        type={recycle ? 'primary' : 'default'}
                        ghost={recycle}
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          setSelectedIds([]);
                          setRecycle((v) => !v);
                        }}
                      >
                        {t(
                          recycle
                            ? 'pages.cmdb.ci.recycle.back'
                            : 'pages.cmdb.ci.recycle.action',
                        )}
                      </Button>,
                    ]
                  : []
              }
              search={{ labelWidth: 'auto' }}
              // 筛选条件变化后清空勾选：避免批量操作落到当前已看不见的行上
              onSubmit={() => setSelectedIds([])}
              onReset={() => setSelectedIds([])}
              rowSelection={
                canSelect
                  ? {
                      selectedRowKeys: selectedIds,
                      // 跨页保留勾选（批量接口按 ID 提交，不依赖行数据）
                      preserveSelectedRowKeys: true,
                      onChange: (keys) => setSelectedIds(keys as string[]),
                    }
                  : undefined
              }
              tableAlertOptionRender={() => (
                <>
                  {has('cmdb.ci.edit') && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setBatchEditOpen(true)}
                    >
                      {t('pages.cmdb.ci.batch.edit')}
                    </Button>
                  )}
                  {has('cmdb.ci.delete') && (
                    <Button
                      type="link"
                      size="small"
                      danger
                      onClick={onBatchDelete}
                    >
                      {t('pages.cmdb.ci.batch.delete')}
                    </Button>
                  )}
                  {has('cmdb.ci.transition') && (
                    <Dropdown
                      menu={{
                        items: CMDB_CI_STATUS_ORDER.map((s) => ({
                          key: s,
                          label: statusText(s),
                        })),
                        onClick: ({ key }) =>
                          void onBatchTransition(key as CmdbCIStatus),
                      }}
                    >
                      <Button type="link" size="small">
                        {t('pages.cmdb.ci.batch.transition')}
                      </Button>
                    </Dropdown>
                  )}
                  {has('cmdb.ci.link') && relationOptions.length > 0 && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setBatchOpen(true)}
                    >
                      {t('pages.cmdb.ci.batchLink.action')}
                    </Button>
                  )}
                </>
              )}
              scroll={{ x: 'max-content' }}
              columns={columns}
              request={async (params) => {
                const result = await listCIs({
                  page: params.current,
                  pageSize: params.pageSize,
                  modelCode: activeModel.code,
                  deleted: recycle || undefined,
                  issue: recycle ? undefined : issue,
                  ...buildFilters(params),
                });
                return toTableResult(result);
              }}
            />
          )}
        </div>
      </div>
      {activeModel && (
        <CIForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          model={activeModel}
          fields={fields}
          onSuccess={reload}
        />
      )}
      {activeModel && (
        <ImportModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          model={activeModel}
          fields={fields}
          onImported={reload}
        />
      )}
      {/* 批量关联：把选中的资源一次关联到同一个目标（在目标侧调用，方向取反） */}
      {activeModel && (
        <ModalForm<{ relation: string; targetId: string }>
          key={`batch-link-${activeModel.code}`}
          title={t('pages.cmdb.ci.batchLink.title', { n: selectedIds.length })}
          width={520}
          open={batchOpen}
          onOpenChange={setBatchOpen}
          modalProps={{ destroyOnHidden: true }}
          onFinish={async (values) => {
            const rel = splitRelation(values.relation);
            if (!rel) return false;
            const reverse: CmdbDirection =
              rel.relDirection === 'outgoing' ? 'incoming' : 'outgoing';
            const { linked } = await linkCIs(
              values.targetId,
              rel.relType,
              reverse,
              selectedIds,
            );
            message.success(
              t('pages.cmdb.detail.relation.linked', { count: linked }),
            );
            setSelectedIds([]);
            reload();
            return true;
          }}
        >
          <ProFormSelect
            name="relation"
            label={t('pages.cmdb.ci.filter.relation')}
            options={relationOptions.map((o) => ({
              label: o.label,
              value: o.value,
            }))}
            rules={[
              {
                required: true,
                message: t('common.validation.select', {
                  label: t('pages.cmdb.ci.filter.relation'),
                }),
              },
            ]}
          />
          <ProFormDependency name={['relation']}>
            {({ relation }) => {
              const rel = relationOptions.find((o) => o.value === relation);
              return (
                <ProForm.Item
                  name="targetId"
                  label={t('pages.cmdb.ci.filter.relTarget')}
                  rules={[
                    {
                      required: true,
                      message: t('common.validation.select', {
                        label: t('pages.cmdb.ci.filter.relTarget'),
                      }),
                    },
                  ]}
                >
                  <CISelect
                    modelCode={rel?.target}
                    placeholder={t(
                      'pages.cmdb.ci.filter.relTarget.placeholder',
                    )}
                  />
                </ProForm.Item>
              );
            }}
          </ProFormDependency>
        </ModalForm>
      )}
      {/* 批量编辑：只提交填写了的项（负责人 / 环境 / 增删标签） */}
      <ModalForm<{
        owner?: string;
        clearOwner?: boolean;
        env?: string;
        addTags?: string[];
        removeTags?: string[];
      }>
        title={t('pages.cmdb.ci.batch.edit.title', { n: selectedIds.length })}
        width={520}
        open={batchEditOpen}
        onOpenChange={setBatchEditOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          const addTags = values.addTags ?? [];
          const removeTags = values.removeTags ?? [];
          const env = values.env?.trim();
          // 负责人：勾选「清空」提交空串；否则选了才提交
          const owner = values.clearOwner ? '' : values.owner || undefined;
          if (
            owner === undefined &&
            !env &&
            !addTags.length &&
            !removeTags.length
          ) {
            message.warning(t('pages.cmdb.ci.batch.edit.empty'));
            return false;
          }
          reportBatch(
            await runBatch(
              selectedIds,
              (ids) =>
                batchUpdateCIs({
                  ids,
                  owner,
                  env: env || undefined,
                  addTags: addTags.length ? addTags : undefined,
                  removeTags: removeTags.length ? removeTags : undefined,
                }),
              t('pages.cmdb.ci.batch.notProcessed'),
            ),
          );
          return true;
        }}
      >
        <Typography.Paragraph type="secondary">
          {t('pages.cmdb.ci.batch.edit.tip')}
        </Typography.Paragraph>
        <ProFormDependency name={['clearOwner']}>
          {({ clearOwner }) =>
            !clearOwner && (
              <ProForm.Item
                name="owner"
                label={t('pages.cmdb.ci.column.owner')}
              >
                <OwnerSelect
                  placeholder={t('pages.cmdb.ci.form.owner.placeholder')}
                />
              </ProForm.Item>
            )
          }
        </ProFormDependency>
        <ProFormCheckbox name="clearOwner">
          {t('pages.cmdb.ci.batch.edit.clearOwner')}
        </ProFormCheckbox>
        <ProFormText
          name="env"
          label={t('pages.cmdb.ci.column.env')}
          rules={[{ max: 32 }]}
        />
        <ProFormSelect
          name="addTags"
          label={t('pages.cmdb.ci.batch.edit.addTags')}
          fieldProps={{
            mode: 'tags',
            open: false,
            tokenSeparators: [',', ' '],
            maxCount: 20,
          }}
        />
        <ProFormSelect
          name="removeTags"
          label={t('pages.cmdb.ci.batch.edit.removeTags')}
          fieldProps={{
            mode: 'tags',
            open: false,
            tokenSeparators: [',', ' '],
            maxCount: 20,
          }}
        />
      </ModalForm>
      {activeModel && editRow && (
        <CIForm
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          model={activeModel}
          fields={fields}
          ci={editRow}
          onSuccess={reload}
        />
      )}
    </PageContainer>
  );
};

export default CIListPage;
