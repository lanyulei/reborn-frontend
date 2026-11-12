/**
 * 资源实例：左侧模型选择（吸顶；搜索 / 分组 / 收藏置顶），右侧实例表格
 * （工具栏左置 新建 / 导入 / 导出）。
 * 当前模型进 URL（?model=），分享与返回不丢上下文；
 * 搜索表单按字段类型生成「属性条件」（等值）；批量支持删除 / 状态流转 / 关联；
 * 导出携带当前筛选；空模型给出新建引导。
 */
import {
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
  ProFormDependency,
  ProFormSelect,
  ProTable,
} from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import type { MenuProps } from 'antd';
import {
  App,
  Button,
  Dropdown,
  Empty,
  Input,
  Menu,
  Space,
  Spin,
  Tag,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { deleteCI, exportCIs, listCIs, transitionCI } from '@/services/cmdb/ci';
import { getModel } from '@/services/cmdb/model';
import { linkCIs } from '@/services/cmdb/relation';
import type {
  CmdbCI,
  CmdbCIStatus,
  CmdbDirection,
  CmdbField,
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
import { useAttrColumns } from '../components/schema';
import { useCmdbStyles } from '../components/styles';
import { useCatalog } from '../components/useCatalog';

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
  const {
    loading,
    models,
    groups,
    favorites,
    reload: reloadCatalog,
  } = useCatalog();
  const [searchParams] = useSearchParams();
  const [modelKeyword, setModelKeyword] = useState('');
  const [activeCode, setActiveCode] = useState<string | undefined>(
    () => searchParams.get('model') ?? undefined,
  );
  const [fields, setFields] = useState<CmdbField[]>([]);
  const [relTypes, setRelTypes] = useState<CmdbRelationType[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<CmdbCI[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
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
    reloadCatalog();
  };

  // 目录只列启用模型；URL 指定的模型不可见（无权限 / 停用）时回退首个
  const enabled = useMemo(() => models.filter((m) => m.status === 1), [models]);

  const selectModel = useCallback((code: string) => {
    setActiveCode(code);
    setSelectedIds([]);
    setSelectedRows([]);
    history.replace(`/cmdb/ci?model=${code}`);
  }, []);
  useEffect(() => {
    if (loading || enabled.length === 0) return;
    if (!activeCode || !enabled.some((m) => m.code === activeCode)) {
      selectModel(enabled[0].code);
    }
  }, [loading, enabled, activeCode, selectModel]);

  // 切换类型：拉取字段定义，表格列与筛选条件随之变化
  const loadFields = useCallback(async (code: string) => {
    const detail = await getModel(code);
    setFields(detail.fields);
    setRelTypes(detail.relationTypes);
  }, []);
  useEffect(() => {
    if (!activeCode) return;
    setFields([]);
    void loadFields(activeCode);
  }, [activeCode, loadFields]);

  // 导出当前类型（随当前筛选）为 CSV/JSON 并触发下载
  const onExport = async (format: 'csv' | 'json' = 'csv') => {
    if (!activeModel) return;
    const values = formRef.current?.getFieldsValue?.() ?? {};
    setExporting(true);
    try {
      const blob = await exportCIs({
        modelCode: activeModel.code,
        keyword: values.keyword || undefined,
        status: values.status || undefined,
        env: values.env || undefined,
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
                  (f.enumValues ?? []).map((v) => [v, { text: v }]),
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

  // 批量操作结果汇报：部分失败给出成功/失败计数
  const reportBatch = (results: PromiseSettledResult<unknown>[]) => {
    const failed = results.filter((r) => r.status === 'rejected').length;
    const ok = results.length - failed;
    const text = t('pages.cmdb.ci.batch.done', { ok, failed });
    if (failed > 0) message.warning(text);
    else message.success(text);
    setSelectedIds([]);
    setSelectedRows([]);
    reload();
  };
  const onBatchDelete = () => {
    modal.confirm({
      title: t('pages.cmdb.ci.batch.delete.title', { n: selectedIds.length }),
      content: t('pages.cmdb.ci.batch.delete.description'),
      okButtonProps: { danger: true },
      onOk: async () => {
        const results = await Promise.allSettled(
          selectedIds.map((id) => deleteCI(id)),
        );
        reportBatch(results);
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
        const results = await Promise.allSettled(
          selectedRows.map((r) => transitionCI(r.id, r.version, status)),
        );
        reportBatch(results);
      },
    });
  };

  const canSelect =
    has('cmdb.ci.link') || has('cmdb.ci.delete') || has('cmdb.ci.transition');
  const hasAnyAction = has('cmdb.ci.edit') || has('cmdb.ci.delete');
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
      render: (_, r) => (
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
      search: false,
      width: 100,
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
    {
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
          {activeModel && (
            <ProTable<CmdbCI>
              cardBordered
              key={activeModel.code}
              rowKey="id"
              actionRef={actionRef}
              formRef={formRef}
              headerTitle={
                <Space size={8}>
                  {has('cmdb.ci.create') && (
                    <CreateButton onClick={() => setCreateOpen(true)}>
                      {t('common.action.create')}
                    </CreateButton>
                  )}
                  {has('cmdb.ci.import') && (
                    <Button
                      icon={<UploadOutlined />}
                      onClick={() => setImportOpen(true)}
                    >
                      {t('pages.cmdb.import.action')}
                    </Button>
                  )}
                  {has('cmdb.ci.export') && (
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
              search={{ labelWidth: 'auto' }}
              rowSelection={
                canSelect
                  ? {
                      selectedRowKeys: selectedIds,
                      onChange: (keys, rows) => {
                        setSelectedIds(keys as string[]);
                        setSelectedRows(rows);
                      },
                    }
                  : undefined
              }
              tableAlertOptionRender={() => (
                <>
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
                const rel = splitRelation(
                  params.relation as string | undefined,
                );
                const mode = (params.relMode as string | undefined) ?? 'any';
                // 属性等值条件：attr_<code> → attrs.<code>
                const attrs: Record<string, unknown> = {};
                for (const f of fields) {
                  const value = params[`attr_${f.code}`];
                  if (value !== undefined && value !== null && value !== '') {
                    attrs[f.code] = value;
                  }
                }
                const result = await listCIs({
                  page: params.current,
                  pageSize: params.pageSize,
                  modelCode: activeModel.code,
                  keyword: params.keyword || undefined,
                  status: params.status as CmdbCIStatus | undefined,
                  env: params.env || undefined,
                  tag: params.tag || undefined,
                  attrs: Object.keys(attrs).length > 0 ? attrs : undefined,
                  ...(rel
                    ? {
                        relType: rel.relType,
                        relDirection: rel.relDirection,
                        relNone: mode === 'none' || undefined,
                        relTargetId:
                          mode === 'target'
                            ? (params.relTargetId as string | undefined) ||
                              undefined
                            : undefined,
                      }
                    : {}),
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
            setSelectedRows([]);
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
