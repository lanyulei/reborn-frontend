/**
 * 模型详情：标题条（返回）+ 概要头（图标 / 名称 / 元信息栅格 / 操作）+
 * 四个标签：模型字段（按详情布局分组的字段卡片）| 模型关联（表格）| 唯一校验 | 详情布局。
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useAccess, useParams } from '@umijs/max';
import {
  App,
  Button,
  Card,
  Empty,
  Input,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeleteConfirmLink } from '@/components/TableActions';
import {
  deleteModel,
  deprecateField,
  getModel,
  getModelView,
  listModels,
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
    grid-template-columns: repeat(4, minmax(110px, auto));
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
  groupHead: css`
    margin: 4px 0 12px;
    color: ${token.colorText};
    font-weight: 600;
  `,
  fieldGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
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
  fieldMarks: css`
    position: absolute;
    top: -1px;
    right: -1px;
    display: flex;
    overflow: hidden;
    border-radius: 0 ${token.borderRadiusLG}px 0 ${token.borderRadius}px;
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
}

/** 新建字段分组：展开内联输入，确认后追加到详情布局 */
const AddGroupButton: React.FC<{ onAdd: (title: string) => void }> = ({
  onAdd,
}) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const submit = () => {
    setOpen(false);
    onAdd(title.trim() || t('pages.cmdb.modelDetail.fields.defaultGroup'));
  };
  return (
    <Space>
      <Button
        onClick={() => {
          setTitle('');
          setOpen(true);
        }}
      >
        {t('pages.cmdb.modelDetail.fields.addGroup')}
      </Button>
      {open && (
        <Space>
          <Input
            style={{ width: 180 }}
            placeholder={t('pages.cmdb.view.section.title')}
            value={title}
            maxLength={64}
            onChange={(e) => setTitle(e.target.value)}
            onPressEnter={submit}
          />
          <Button type="primary" onClick={submit}>
            {t('common.action.confirm')}
          </Button>
          <Button onClick={() => setOpen(false)}>
            {t('common.action.cancel')}
          </Button>
        </Space>
      )}
    </Space>
  );
};

const ModelDetailPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const t = useT();
  const { message } = App.useApp();
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
  const [fieldModal, setFieldModal] = useState<{
    open: boolean;
    field: CmdbField | null;
  }>({ open: false, field: null });

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    try {
      const [detail, view, modelsRes] = await Promise.all([
        getModel(code),
        getModelView(code),
        listModels({ page: 1, pageSize: 100 }),
      ]);
      setModel(detail.model);
      setFields(detail.fields);
      setRelationTypes(detail.relationTypes);
      setSections(view.sections);
      setModelNames(
        Object.fromEntries(modelsRes.items.map((m) => [m.code, m.name])),
      );
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
    const attrsSections = sections.filter((s) => s.type === 'attrs');
    const grouped = attrsSections.map((s, i) => ({
      key: `group-${i}`,
      title: s.title || t('pages.cmdb.modelDetail.fields.defaultGroup'),
      fields: (s.fields ?? [])
        .map((fc) => fields.find((f) => f.code === fc))
        .filter((f): f is CmdbField => !!f),
    }));
    const inAny = new Set(attrsSections.flatMap((s) => s.fields ?? []));
    const rest = fields.filter((f) => !inAny.has(f.code));
    if (rest.length > 0) {
      grouped.push({
        key: 'group-other',
        title: t('pages.cmdb.modelDetail.fields.otherGroup'),
        fields: rest,
      });
    }
    return grouped;
  }, [sections, fields, t]);

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
      <div className={pageStyles.pageBar}>
        <Button
          type="text"
          aria-label={t('pages.cmdb.modelDetail.backToList')}
          onClick={() => history.push('/cmdb/model')}
          icon={<UiIcon name="back" size={18} />}
        />
        <span className={pageStyles.pageBarTitle}>
          {t('menu.cmdb.model-detail')}【{model.name}】
        </span>
      </div>
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
            <Typography.Text code>{model.code}</Typography.Text>
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
          <span className={styles.metaLabel}>
            {t('common.column.updateTime')}
          </span>
          <span className={styles.metaLabel}>
            {t('common.column.createTime')}
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
          <span className={styles.metaValue}>
            {dayjs(model.updateTime).format('YYYY-MM-DD HH:mm')}
          </span>
          <span className={styles.metaValue}>
            {dayjs(model.createTime).format('YYYY-MM-DD HH:mm')}
          </span>
        </div>
        <Space className={pageStyles.summaryActions}>
          {has('cmdb.model.edit') && (
            <>
              <Button onClick={() => setEditOpen(true)}>
                {t('common.action.edit')}
              </Button>
              <Button onClick={() => void onToggleStatus()}>
                {model.status === 1
                  ? t('pages.cmdb.model.action.disable')
                  : t('pages.cmdb.model.action.enable')}
              </Button>
            </>
          )}
          {has('cmdb.model.delete') && !model.builtin && (
            <DeleteConfirmLink
              title={t('pages.cmdb.model.delete.title')}
              description={t('pages.cmdb.model.delete.description')}
              onConfirm={async () => {
                await deleteModel(model.code);
                message.success(t('common.msg.deleted'));
                history.push('/cmdb/model');
              }}
            />
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
                  <div className={pageStyles.toolbar}>
                    {canField && (
                      <Button
                        type="primary"
                        onClick={() =>
                          setFieldModal({ open: true, field: null })
                        }
                      >
                        {t('pages.cmdb.modelDetail.fields.add')}
                      </Button>
                    )}
                    {canView && (
                      <AddGroupButton
                        onAdd={(title) => void onAddGroup(title)}
                      />
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
                  fieldGroups.map((g) => (
                    <section key={g.key}>
                      <div className={styles.groupHead}>
                        {g.title} ( {g.fields.length} )
                      </div>
                      {g.fields.length === 0 ? (
                        <div
                          className={pageStyles.emptyGroup}
                          style={{ marginBottom: 24 }}
                        >
                          {t('pages.cmdb.modelDetail.fields.groupEmpty')}
                        </div>
                      ) : (
                        <div className={styles.fieldGrid}>
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
                                      setFieldModal({ open: true, field: f })
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
                                      message.success(t('common.msg.updated'));
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
                      )}
                    </section>
                  ))
                )}
              </>
            ),
          },
          {
            key: 'relations',
            label: t('pages.cmdb.modelDetail.tab.relations'),
            children: (
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
      <FieldFormModal
        open={fieldModal.open}
        onOpenChange={(open) => setFieldModal((s) => ({ ...s, open }))}
        modelCode={model.code}
        field={fieldModal.field ?? undefined}
        onSuccess={() => void load()}
      />
    </PageContainer>
  );
};

export default ModelDetailPage;
