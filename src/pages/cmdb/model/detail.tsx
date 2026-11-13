/**
 * 模型详情：标题条（返回）+ 概要头（图标 / 名称 / 元信息栅格 / 操作）+
 * 四个标签：模型字段（按详情布局分组的字段卡片）| 模型关联（表格）| 唯一校验 | 详情布局。
 */
import { PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { history, useAccess, useParams } from '@umijs/max';
import {
  App,
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
} from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  deleteModel,
  deprecateField,
  getModel,
  getModelView,
  listAllModels,
  updateModel,
  updateModelView,
  type ViewSection,
} from '@/services/cmdb/model';
import type {
  CmdbField,
  CmdbModel,
  CmdbRelationType,
} from '@/services/cmdb/typings';
import { usePermissions } from '@/services/system/permissions';
import { useEnumText, useT } from '@/utils/i18n';
import { FieldTypeIcon, ModelIcon, UiIcon } from '../components/icons';
import {
  CMDB_ANY_MODEL,
  CMDB_CARDINALITY_META,
  CMDB_FIELD_TYPE_META,
  CMDB_ON_DELETE_META,
} from '../components/meta';
import { useCmdbStyles } from '../components/styles';
import { useCatalog } from '../components/useCatalog';
import { FieldFormModal } from './FieldFormModal';
import { ModelFormModal } from './ModelFormModal';
import { ViewEditor } from './ViewEditor';

const useStyles = createStyles(({ token, css }) => ({
  /** 概要头右侧元信息栅格（标签在上、取值在下） */
  metaGrid: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(110px, auto));
    gap: 4px 40px;
  `,
  metaLabel: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  metaValue: css`
    color: ${token.colorText};
    white-space: nowrap;
  `,
  /** 字段卡片：类型图标 + 名称/编码；标记在右上角，操作悬停显现 */
  fieldCard: css`
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 10px 14px;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
    transition: border-color ${token.motionDurationMid};
    &:hover,
    &:focus-within {
      border-color: ${token.colorPrimary};
    }
    &:hover .cmdb-field-actions,
    &:focus-within .cmdb-field-actions {
      opacity: 1;
    }
  `,
  fieldCardMuted: css`
    background: ${token.colorFillQuaternary};
  `,
  fieldBody: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  fieldName: css`
    overflow: hidden;
    color: ${token.colorText};
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  /** 字段标记（唯一 / 同步只读 / 已废弃）：紧贴边框内侧（右上角），不压边框线 */
  fieldMarks: css`
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    overflow: hidden;
    border-radius: 0 ${token.borderRadiusLG}px 0 ${token.borderRadiusSM}px;
  `,
  fieldMark: css`
    padding: 0 6px;
    color: ${token.colorPrimary};
    font-size: 11px;
    line-height: 16px;
    background: ${token.colorPrimaryBg};
  `,
  fieldMarkMuted: css`
    color: ${token.colorTextTertiary};
    background: ${token.colorFillTertiary};
  `,
  fieldActions: css`
    display: flex;
    flex: none;
    gap: 10px;
    padding-inline-start: 8px;
    font-size: ${token.fontSizeSM}px;
    opacity: 0;
    transition: opacity ${token.motionDurationMid};
  `,
  rowTitle: css`
    color: ${token.colorText};
    font-weight: 500;
    white-space: nowrap;
  `,
  requiredMark: css`
    color: ${token.colorError};
  `,
  secondary: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    white-space: nowrap;
  `,
  plainRow: css`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 2px;
    border-bottom: 1px solid ${token.colorSplit};
    &:last-child {
      border-bottom: none;
    }
  `,
}));

interface FieldGroup {
  key: string;
  title: string;
  fields: CmdbField[];
  /** 详情布局中的真实下标；-1 = 未入组字段聚合的「其他」 */
  sectionIndex: number;
}

const ModelDetailPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const t = useT();
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const access = useAccess();
  const typeText = useEnumText(CMDB_FIELD_TYPE_META);
  const cardinalityText = useEnumText(CMDB_CARDINALITY_META);
  const onDeleteText = useEnumText(CMDB_ON_DELETE_META);
  const { styles: pageStyles } = useCmdbStyles();
  const { styles, cx } = useStyles();
  const { groups } = useCatalog();

  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<CmdbModel | null>(null);
  const [fields, setFields] = useState<CmdbField[]>([]);
  const [relationTypes, setRelationTypes] = useState<CmdbRelationType[]>([]);
  const [sections, setSections] = useState<ViewSection[]>([]);
  const [modelNames, setModelNames] = useState<Record<string, string>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [groupCreateOpen, setGroupCreateOpen] = useState(false);
  const [renameGroup, setRenameGroup] = useState<{
    index: number;
    title: string;
  } | null>(null);
  const [fieldModal, setFieldModal] = useState<{
    open: boolean;
    field: CmdbField | null;
    /** 新建预设 / 编辑当前所在的分组（分区下标，-1 = 其他） */
    group: number;
  }>({ open: false, field: null, group: -1 });

  // 首次加载才整页转圈；之后的刷新（保存字段 / 布局后）静默进行，
  // 否则整页卸载会把当前标签跳回「模型字段」并重置折叠状态
  const loadedRef = useRef(false);
  // 详情布局是否已被显式配置过（false = 后端返回的是缺省布局：全部字段一组）
  const configuredRef = useRef(false);
  const load = useCallback(async () => {
    if (!code) return;
    if (!loadedRef.current) setLoading(true);
    try {
      const [detail, view, modelsRes] = await Promise.all([
        getModel(code),
        getModelView(code),
        listAllModels(),
      ]);
      setModel(detail.model);
      setFields(detail.fields);
      setRelationTypes(detail.relationTypes);
      setSections(view.sections);
      configuredRef.current = view.configured;
      setModelNames(
        Object.fromEntries(modelsRes.items.map((m) => [m.code, m.name])),
      );
      loadedRef.current = true;
      return view.sections;
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  const groupName =
    groups.find((g) => g.code === model?.category)?.name ?? model?.category;

  // 字段按详情布局的属性分组展示；未入组字段归“其他”
  const fieldGroups = useMemo<FieldGroup[]>(() => {
    const attrsSections = sections
      .map((s, i) => ({ section: s, index: i }))
      .filter((x) => x.section.type === 'attrs');
    const grouped = attrsSections.map(({ section: s, index }, i) => ({
      key: `group-${i}`,
      title: s.title || t('pages.cmdb.modelDetail.fields.defaultGroup'),
      fields: (s.fields ?? [])
        .map((fc) => fields.find((f) => f.code === fc))
        .filter((f): f is CmdbField => !!f),
      sectionIndex: index,
    }));
    const inAny = new Set(attrsSections.flatMap((x) => x.section.fields ?? []));
    const rest = fields.filter((f) => !inAny.has(f.code));
    if (rest.length > 0) {
      grouped.push({
        key: 'group-other',
        title: t('pages.cmdb.modelDetail.fields.otherGroup'),
        fields: rest,
        sectionIndex: -1,
      });
    }
    return grouped;
  }, [sections, fields, t]);

  /** 字段分组下拉（详情布局 attrs 分区）；无布局管理权限时不展示 */
  const fieldGroupOptions = useMemo(
    () =>
      has('cmdb.model.view')
        ? fieldGroups
            .filter((g) => g.sectionIndex >= 0)
            .map((g) => ({ label: g.title, value: g.sectionIndex }))
        : [],
    [fieldGroups, has],
  );

  const uniqueFields = useMemo(
    () => fields.filter((f) => f.unique && !f.deprecated),
    [fields],
  );

  // 与本模型相关的关联类型（含通配）
  const myRelations = useMemo(
    () =>
      relationTypes.filter(
        (r) =>
          r.srcModel === CMDB_ANY_MODEL ||
          r.dstModel === CMDB_ANY_MODEL ||
          r.srcModel === code ||
          r.dstModel === code,
      ),
    [relationTypes, code],
  );
  const modelName = (c: string) =>
    c === CMDB_ANY_MODEL
      ? t('pages.cmdb.relationType.form.anyModel')
      : (modelNames[c] ?? c);

  const onToggleStatus = async () => {
    if (!model) return;
    const { model: saved } = await updateModel(model.code, {
      status: model.status === 1 ? 2 : 1,
    });
    message.success(t('common.msg.updated'));
    setModel(saved);
  };

  const onAddGroup = async (title: string) => {
    if (!code) return;
    const next: ViewSection[] = [
      ...sections,
      { type: 'attrs', title, fields: [] },
    ];
    const { sections: saved } = await updateModelView(code, next);
    setSections(saved);
    message.success(t('common.msg.created'));
  };

  /** 字段保存后按所选分组落位布局：移出原分区并加入目标分区（-1 = 其他） */
  const onFieldSaved = async (fieldCode: string, group: number) => {
    if (!code) return;
    const fresh = (await load()) ?? [];
    // 布局尚未配置且没有指定分组：缺省布局本就包含新字段，不落库。
    // 否则会把「去掉该字段的缺省布局」持久化下来，等于替用户悄悄配置了布局
    if (!configuredRef.current && group === -1) return;
    const next = fresh.map((s, i) => {
      if (s.type !== 'attrs') return s;
      const inIt = (s.fields ?? []).includes(fieldCode);
      if (i === group) {
        return inIt ? s : { ...s, fields: [...(s.fields ?? []), fieldCode] };
      }
      return inIt
        ? { ...s, fields: (s.fields ?? []).filter((c) => c !== fieldCode) }
        : s;
    });
    if (JSON.stringify(next) === JSON.stringify(fresh)) return;
    // 落位要写详情布局：无布局权限时跳过（字段本身已保存，归入「其他」）
    if (!has('cmdb.model.view')) return;
    const { sections: saved } = await updateModelView(code, next);
    setSections(saved);
    configuredRef.current = true;
  };

  /** 删除字段分组：仅移除布局分组，组内字段自动归入「其他」 */
  const onDeleteGroup = (g: FieldGroup) => {
    modal.confirm({
      title: t('pages.cmdb.modelDetail.fields.group.delete.title'),
      content:
        g.fields.length > 0
          ? t('pages.cmdb.modelDetail.fields.group.delete.contentFields', {
              name: g.title,
              n: g.fields.length,
            })
          : t('pages.cmdb.modelDetail.fields.group.delete.content', {
              name: g.title,
            }),
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!code) return;
        const next = sections.filter((_, i) => i !== g.sectionIndex);
        const { sections: saved } = await updateModelView(code, next);
        setSections(saved);
        message.success(t('common.msg.deleted'));
      },
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 96, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!model) {
    return (
      <Card variant="outlined">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.cmdb.modelDetail.notFound')}
        >
          <Button type="primary" onClick={() => history.push('/cmdb/model')}>
            {t('pages.cmdb.modelDetail.backToList')}
          </Button>
        </Empty>
      </Card>
    );
  }

  const canField = has('cmdb.model.field');
  const canView = has('cmdb.model.view');

  return (
    <PageContainer title={false}>
      <div className={pageStyles.summaryHeader}>
        <ModelIcon icon={model.icon} size={56} muted={model.status === 2} />
        <div className={pageStyles.summaryBody}>
          <span className={pageStyles.summaryTitle}>
            {model.name}
            {model.builtin && (
              <Tag color="gold">{t('pages.cmdb.model.tag.builtin')}</Tag>
            )}
            {model.status === 2 && <Tag>{t('common.status.disabled')}</Tag>}
          </span>
          <span className={pageStyles.summaryMeta}>
            {model.description && <span>{model.description}</span>}
          </span>
        </div>
        <div className={styles.metaGrid}>
          <span className={styles.metaLabel}>
            {t('pages.cmdb.model.column.category')}
          </span>
          <span className={styles.metaLabel}>
            {t('pages.cmdb.model.column.ciCount')}
          </span>
          <span className={styles.metaValue}>{groupName}</span>
          <span className={styles.metaValue}>
            {access.canCmdbCI ? (
              <a onClick={() => history.push(`/cmdb/ci?model=${model.code}`)}>
                {model.ciCount ?? 0}
              </a>
            ) : (
              (model.ciCount ?? 0)
            )}
          </span>
        </div>
        {/* 概要操作：编辑（白）/ 停用（黄）/ 删除（红）；启用非破坏性，回白色 */}
        <Space className={pageStyles.summaryActions}>
          {has('cmdb.model.edit') && (
            <>
              <Button onClick={() => setEditOpen(true)}>
                {t('common.action.edit')}
              </Button>
              <Button
                onClick={() => {
                  // 停用需二次确认；启用直接执行
                  if (model.status === 1) {
                    modal.confirm({
                      title: t('pages.cmdb.model.disableConfirm.title'),
                      content: t('pages.cmdb.model.disableConfirm.description'),
                      onOk: () => onToggleStatus(),
                    });
                    return;
                  }
                  void onToggleStatus();
                }}
              >
                {model.status === 1
                  ? t('pages.cmdb.model.action.disable')
                  : t('pages.cmdb.model.action.enable')}
              </Button>
            </>
          )}
          {has('cmdb.model.delete') && !model.builtin && (
            <Button
              color="danger"
              variant="outlined"
              onClick={() => {
                // 删除需二次确认（与停用一致的对话框格式）
                modal.confirm({
                  title: t('pages.cmdb.model.delete.title'),
                  content: t('pages.cmdb.model.delete.description'),
                  onOk: async () => {
                    await deleteModel(model.code);
                    message.success(t('common.msg.deleted'));
                    history.push('/cmdb/model');
                  },
                });
              }}
            >
              {t('common.action.delete')}
            </Button>
          )}
        </Space>
      </div>

      <Tabs
        defaultActiveKey="fields"
        items={[
          {
            key: 'fields',
            label: t('pages.cmdb.modelDetail.tab.fields'),
            children: (
              <>
                {(canField || canView) && (
                  <div
                    className={cx(pageStyles.toolbar, pageStyles.toolbarTight)}
                  >
                    {canField && (
                      <CreateButton
                        onClick={() =>
                          setFieldModal({ open: true, field: null, group: -1 })
                        }
                      >
                        {t('pages.cmdb.modelDetail.fields.add')}
                      </CreateButton>
                    )}
                    {canView && (
                      <Button onClick={() => setGroupCreateOpen(true)}>
                        {t('pages.cmdb.modelDetail.fields.addGroup')}
                      </Button>
                    )}
                  </div>
                )}
                {fieldGroups.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('pages.cmdb.modelDetail.fields.empty')}
                    style={{ padding: 48 }}
                  />
                ) : (
                  <Collapse
                    ghost
                    size="small"
                    // 与模型管理一致：折叠头 8px 0、内容区 6px 0 6px 4px（行内样式，直接生效）
                    styles={{
                      header: { padding: '8px 0 2px' },
                      body: { padding: '6px 0 6px 4px' },
                    }}
                    defaultActiveKey={fieldGroups.map((g) => g.key)}
                    items={fieldGroups.map((g) => ({
                      key: g.key,
                      label: (
                        <Space size={8} align="center">
                          <span className={pageStyles.groupTitle}>
                            {g.title}
                          </span>
                          <span className={pageStyles.groupCount}>
                            ( {g.fields.length} )
                          </span>
                          {canView && g.sectionIndex >= 0 && (
                            <Dropdown
                              trigger={['click']}
                              menu={{
                                items: [
                                  {
                                    key: 'rename',
                                    label: t('pages.cmdb.model.group.rename'),
                                  },
                                  {
                                    key: 'delete',
                                    label: t('common.action.delete'),
                                    danger: true,
                                  },
                                ],
                                onClick: ({ key }) => {
                                  if (key === 'rename')
                                    setRenameGroup({
                                      index: g.sectionIndex,
                                      title: g.title,
                                    });
                                  if (key === 'delete') onDeleteGroup(g);
                                },
                              }}
                            >
                              <button
                                type="button"
                                className={pageStyles.groupMenuIcon}
                                aria-label={t('pages.cmdb.model.group.manage')}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <UiIcon name="more" />
                              </button>
                            </Dropdown>
                          )}
                        </Space>
                      ),
                      children:
                        g.fields.length === 0 ? (
                          // 与模型管理空分组一致：网格位内放「新建字段」文本链接，预设该分组
                          <div className={pageStyles.cardGrid}>
                            <div className={pageStyles.emptyGroup}>
                              {canField ? (
                                <a
                                  className={pageStyles.emptyGroupLink}
                                  onClick={() =>
                                    setFieldModal({
                                      open: true,
                                      field: null,
                                      group: g.sectionIndex,
                                    })
                                  }
                                >
                                  <PlusOutlined />
                                  {t('pages.cmdb.modelDetail.fields.add')}
                                </a>
                              ) : (
                                t('pages.cmdb.modelDetail.fields.groupEmpty')
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className={pageStyles.cardGrid}>
                            {g.fields.map((f) => (
                              <div
                                key={f.id}
                                className={cx(
                                  styles.fieldCard,
                                  f.deprecated && styles.fieldCardMuted,
                                )}
                              >
                                <FieldTypeIcon type={f.type} />
                                <div className={styles.fieldBody}>
                                  <span className={styles.fieldName}>
                                    {f.name}
                                    {f.required && (
                                      <span className={styles.requiredMark}>
                                        {' '}
                                        *
                                      </span>
                                    )}
                                  </span>
                                  <span className={pageStyles.modelCardCode}>
                                    {f.code} · {typeText(f.type)}
                                    {f.type === 'ref' && f.refModel
                                      ? ` → ${modelName(f.refModel)}`
                                      : ''}
                                  </span>
                                </div>
                                <div className={styles.fieldMarks}>
                                  {f.unique && (
                                    <span className={styles.fieldMark}>
                                      {t('pages.cmdb.field.column.unique')}
                                    </span>
                                  )}
                                  {f.owner === 'sync' && (
                                    <span
                                      className={cx(
                                        styles.fieldMark,
                                        styles.fieldMarkMuted,
                                      )}
                                    >
                                      {t(
                                        'pages.cmdb.modelDetail.fields.syncReadonly',
                                      )}
                                    </span>
                                  )}
                                  {f.deprecated && (
                                    <span
                                      className={cx(
                                        styles.fieldMark,
                                        styles.fieldMarkMuted,
                                      )}
                                    >
                                      {t('pages.cmdb.field.tag.deprecated')}
                                    </span>
                                  )}
                                </div>
                                {canField && !f.deprecated && (
                                  <div
                                    className={cx(
                                      styles.fieldActions,
                                      'cmdb-field-actions',
                                    )}
                                  >
                                    <a
                                      onClick={() =>
                                        setFieldModal({
                                          open: true,
                                          field: f,
                                          group:
                                            fieldGroups.find((g) =>
                                              g.fields.some(
                                                (x) => x.id === f.id,
                                              ),
                                            )?.sectionIndex ?? -1,
                                        })
                                      }
                                    >
                                      {t('common.action.edit')}
                                    </a>
                                    <DeleteConfirmLink
                                      title={t(
                                        'pages.cmdb.field.deprecate.title',
                                      )}
                                      description={t(
                                        'pages.cmdb.field.deprecate.description',
                                      )}
                                      onConfirm={async () => {
                                        await deprecateField(model.code, f.id);
                                        message.success(
                                          t('common.msg.updated'),
                                        );
                                        await load();
                                      }}
                                    >
                                      {t('pages.cmdb.field.deprecate.action')}
                                    </DeleteConfirmLink>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ),
                    }))}
                  />
                )}
              </>
            ),
          },
          {
            key: 'relations',
            label: t('pages.cmdb.modelDetail.tab.relations'),
            children: (
              // 仅补表格最外层边框（单元格不加线）
              <div className={pageStyles.tableWrap}>
                <ProTable<CmdbRelationType>
                  cardBordered
                  rowKey="code"
                  search={false}
                  options={false}
                  pagination={false}
                  dataSource={myRelations}
                  columns={[
                    {
                      title: t('pages.cmdb.relationType.column.code'),
                      dataIndex: 'code',
                      copyable: true,
                    },
                    {
                      title: t('pages.cmdb.relationType.column.name'),
                      dataIndex: 'name',
                    },
                    {
                      title: t('pages.cmdb.relationType.column.srcModel'),
                      dataIndex: 'srcModel',
                      render: (_, r) => modelName(r.srcModel),
                    },
                    {
                      title: t('pages.cmdb.relationType.column.forwardName'),
                      dataIndex: 'forwardName',
                    },
                    {
                      title: t('pages.cmdb.relationType.column.dstModel'),
                      dataIndex: 'dstModel',
                      render: (_, r) => modelName(r.dstModel),
                    },
                    {
                      title: t('pages.cmdb.relationType.column.backwardName'),
                      dataIndex: 'backwardName',
                    },
                    {
                      title: t('pages.cmdb.relationType.column.cardinality'),
                      dataIndex: 'cardinality',
                      render: (_, r) => (
                        <Tag>{cardinalityText(r.cardinality)}</Tag>
                      ),
                    },
                    {
                      title: t('pages.cmdb.relationType.column.onDelete'),
                      dataIndex: 'onDelete',
                      render: (_, r) => onDeleteText(r.onDelete),
                    },
                    {
                      title: t('pages.cmdb.relationType.column.relationCount'),
                      dataIndex: 'relationCount',
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'unique',
            label: t('pages.cmdb.modelDetail.tab.unique'),
            children: (
              <Card variant="outlined" size="small">
                <Typography.Paragraph type="secondary">
                  {t('pages.cmdb.modelDetail.unique.explain')}
                </Typography.Paragraph>
                {uniqueFields.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('pages.cmdb.modelDetail.unique.empty')}
                    style={{ padding: 32 }}
                  />
                ) : (
                  uniqueFields.map((f) => (
                    <div key={f.id} className={styles.plainRow}>
                      <FieldTypeIcon type={f.type} />
                      <span className={styles.rowTitle}>{f.name}</span>
                      <Typography.Text code>{f.code}</Typography.Text>
                      <span className={styles.secondary}>
                        {typeText(f.type)}
                      </span>
                    </div>
                  ))
                )}
              </Card>
            ),
          },
          {
            key: 'layout',
            label: t('pages.cmdb.modelDetail.tab.layout'),
            children: (
              <ViewEditor
                model={model}
                fields={fields}
                relationTypes={relationTypes}
                sectionsKey={JSON.stringify(sections)}
                onChanged={() => void load()}
              />
            ),
          },
        ]}
      />

      <ModelFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        groups={groups}
        model={model}
        onSuccess={(saved) => setModel(saved)}
      />
      <ModalForm<{ title: string }>
        key="create-field-group"
        title={t('pages.cmdb.modelDetail.fields.addGroup')}
        width={480}
        open={groupCreateOpen}
        onOpenChange={setGroupCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          await onAddGroup(
            values.title.trim() ||
              t('pages.cmdb.modelDetail.fields.defaultGroup'),
          );
          return true;
        }}
      >
        <ProFormText
          name="title"
          label={t('pages.cmdb.view.section.title')}
          rules={[{ required: true }, { max: 64 }]}
        />
      </ModalForm>
      {renameGroup && (
        <ModalForm<{ title: string }>
          key={`rename-field-group-${renameGroup.index}`}
          title={t('pages.cmdb.model.group.rename')}
          width={480}
          open={!!renameGroup}
          onOpenChange={(open) => {
            if (!open) setRenameGroup(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{ title: renameGroup.title }}
          onFinish={async (values) => {
            if (!code) return false;
            const next = sections.map((sec, i) =>
              i === renameGroup.index ? { ...sec, title: values.title } : sec,
            );
            const { sections: saved } = await updateModelView(code, next);
            setSections(saved);
            message.success(t('common.msg.saved'));
            return true;
          }}
        >
          <ProFormText
            name="title"
            label={t('pages.cmdb.view.section.title')}
            rules={[{ required: true }, { max: 64 }]}
          />
        </ModalForm>
      )}
      <FieldFormModal
        open={fieldModal.open}
        onOpenChange={(open) => setFieldModal((s) => ({ ...s, open }))}
        modelCode={model.code}
        field={fieldModal.field ?? undefined}
        groupOptions={fieldGroupOptions}
        initialGroup={fieldModal.group}
        onSuccess={onFieldSaved}
      />
    </PageContainer>
  );
};

export default ModelDetailPage;
