/**
 * 模型管理：模型（分组折叠卡片网格 + 图标 + 启停筛选）| 关联类型 | 数据范围。
 * 新增一类基础设施 = 新建模型（选分组与图标）→ 详情页定义字段 → 配置关联。
 */

import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Collapse,
  Dropdown,
  Empty,
  Input,
  Segmented,
  Space,
  Spin,
  Tag,
  Tooltip,
} from 'antd';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  createModelGroup,
  deleteModelGroup,
  updateModelGroup,
} from '@/services/cmdb/insight';
import {
  createRelationType,
  deleteRelationType,
  listModels,
  listRelationTypes,
  updateRelationType,
} from '@/services/cmdb/model';
import type {
  CmdbCardinality,
  CmdbOnDelete,
  CmdbRelationType,
} from '@/services/cmdb/typings';
import { usePermissions } from '@/services/system/permissions';
import {
  useEnumText,
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
} from '@/utils/i18n';
import { ModelIcon, UiIcon } from '../components/icons';
import {
  CMDB_ANY_MODEL,
  CMDB_CARDINALITY_META,
  CMDB_CARDINALITY_ORDER,
  CMDB_ON_DELETE_META,
  CMDB_ON_DELETE_ORDER,
} from '../components/meta';
import { useCmdbStyles } from '../components/styles';
import { type CatalogGroup, useCatalog } from '../components/useCatalog';
import { ModelFormModal } from './ModelFormModal';
import { ScopesTab } from './ScopesTab';

const CODE_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;

interface RelationTypeFormValues {
  code: string;
  name: string;
  forwardName: string;
  backwardName: string;
  srcModel: string;
  dstModel: string;
  cardinality: CmdbCardinality;
  onDelete?: CmdbOnDelete;
  description?: string;
}

/** 类型选项（含“任意类型”通配），供关系类型两端选择 */
const useModelOptions = (withAny: boolean) => {
  const t = useT();
  return async () => {
    const result = await listModels({ page: 1, pageSize: 100 });
    const options = result.items.map((m) => ({
      label: `${m.name} (${m.code})`,
      value: m.code,
    }));
    return withAny
      ? [
          {
            label: t('pages.cmdb.relationType.form.anyModel'),
            value: CMDB_ANY_MODEL,
          },
          ...options,
        ]
      : options;
  };
};

/** 分组管理菜单（重命名 / 删除；内置与非空分组不可删，后端兜底） */
const GroupMenu: React.FC<{
  group: CatalogGroup;
  onRename: () => void;
  onDelete: () => void;
}> = ({ group, onRename, onDelete }) => {
  const t = useT();
  const { styles } = useCmdbStyles();
  const deleteBlocked = group.builtin || group.modelCount > 0;
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: [
          { key: 'rename', label: t('pages.cmdb.model.group.rename') },
          {
            key: 'delete',
            label: t('common.action.delete'),
            danger: true,
            disabled: deleteBlocked,
          },
        ],
        onClick: ({ key, domEvent }) => {
          domEvent.stopPropagation();
          if (key === 'rename') onRename();
          if (key === 'delete' && !deleteBlocked) onDelete();
        },
      }}
    >
      <button
        type="button"
        className={styles.groupMenuIcon}
        aria-label={t('pages.cmdb.model.group.manage')}
        onClick={(e) => e.stopPropagation()}
      >
        <UiIcon name="more" />
      </button>
    </Dropdown>
  );
};

const ModelsTab: React.FC = () => {
  const t = useT();
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { styles, cx } = useCmdbStyles();
  const { loading, allModels, groups, groupsEditable, reload } = useCatalog();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '1' | '2'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  // 从空分组的“立即添加”进入时预选该分组
  const [createGroup, setCreateGroup] = useState<string | undefined>();
  const [groupCreateOpen, setGroupCreateOpen] = useState(false);
  const [renameGroup, setRenameGroup] = useState<CatalogGroup | null>(null);

  const canManageGroups = groupsEditable && has('cmdb.model.edit');

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return allModels.filter(
      (m) =>
        (statusFilter === 'all' || m.status === Number(statusFilter)) &&
        (!kw ||
          m.name.toLowerCase().includes(kw) ||
          m.code.toLowerCase().includes(kw)),
    );
  }, [allModels, keyword, statusFilter]);

  // 未筛选时空分组也展示（给出“立即添加”引导）；筛选时只留有命中的分组
  const filtering = keyword.trim() !== '' || statusFilter !== 'all';
  const visibleGroups = useMemo(
    () =>
      groups
        .map((g) => ({
          group: g,
          models: filtered.filter((m) => m.category === g.code),
        }))
        .filter((x) => !filtering || x.models.length > 0),
    [groups, filtered, filtering],
  );

  const onDeleteGroup = (group: CatalogGroup) => {
    modal.confirm({
      title: t('pages.cmdb.model.group.delete.title'),
      content: t('pages.cmdb.model.group.delete.description', {
        name: group.name,
      }),
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteModelGroup(group.code);
        message.success(t('common.msg.deleted'));
        reload();
      },
    });
  };

  const collapseItems = visibleGroups.map(({ group, models }) => ({
    key: group.code,
    label: (
      <Space size={8} align="center">
        <span className={styles.groupTitle}>{group.name}</span>
        <span className={styles.groupCount}>( {models.length} )</span>
        {/* 分组管理（更多）按钮紧跟名称与计数，不再挂在标题栏最右侧 */}
        {canManageGroups && (
          <GroupMenu
            group={group}
            onRename={() => setRenameGroup(group)}
            onDelete={() => onDeleteGroup(group)}
          />
        )}
      </Space>
    ),
    children:
      models.length === 0 ? (
        // 空分组占位与模型卡片同宽（占一个网格位），内为文本链接
        <div className={styles.cardGrid}>
          <div className={styles.emptyGroup}>
            {has('cmdb.model.create') ? (
              <a
                className={styles.emptyGroupLink}
                onClick={() => {
                  setCreateGroup(group.code);
                  setCreateOpen(true);
                }}
              >
                <PlusOutlined />
                {t('pages.cmdb.model.create.title')}
              </a>
            ) : (
              t('common.empty')
            )}
          </div>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {models.map((m) => (
            <button
              key={m.code}
              type="button"
              className={cx(styles.modelCard)}
              onClick={() => history.push(`/cmdb/model/${m.code}`)}
            >
              <ModelIcon icon={m.icon} muted={m.status === 2} />
              <span className={styles.modelCardBody}>
                <span className={styles.modelCardName}>
                  {m.name}
                  {m.builtin && (
                    <Tag color="gold" style={{ marginInlineStart: 6 }}>
                      {t('pages.cmdb.model.tag.builtin')}
                    </Tag>
                  )}
                  {m.status === 2 && (
                    <Tag style={{ marginInlineStart: 6 }}>
                      {t('common.status.disabled')}
                    </Tag>
                  )}
                </span>
                <span className={styles.modelCardCode}>{m.code}</span>
              </span>
              <Tooltip title={t('pages.cmdb.model.column.ciCount')}>
                <span className={styles.modelCardCount}>
                  {Number(m.ciCount ?? 0).toLocaleString()}
                </span>
              </Tooltip>
            </button>
          ))}
        </div>
      ),
  }));

  return (
    <>
      <Alert
        type="info"
        showIcon
        closable
        title={t('pages.cmdb.model.tip')}
        style={{ marginBottom: 16 }}
      />
      <div className={cx(styles.toolbar, styles.toolbarTight)}>
        {has('cmdb.model.create') && (
          <CreateButton
            onClick={() => {
              setCreateGroup(undefined);
              setCreateOpen(true);
            }}
          >
            {t('pages.cmdb.model.create.title')}
          </CreateButton>
        )}
        {canManageGroups && has('cmdb.model.create') && (
          <Button onClick={() => setGroupCreateOpen(true)}>
            {t('pages.cmdb.model.group.create.title')}
          </Button>
        )}
        {/* 搜索框紧跟新建按钮；状态筛选右置 */}
        <Input
          allowClear
          style={{ width: 280 }}
          prefix={<SearchOutlined />}
          placeholder={t('pages.cmdb.model.search.placeholder')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <span className={styles.spacer} />
        <Segmented
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as 'all' | '1' | '2')}
          options={[
            { label: t('pages.cmdb.model.filter.all'), value: 'all' },
            { label: t('common.status.enabled'), value: '1' },
            { label: t('common.status.disabled'), value: '2' },
          ]}
        />
      </div>

      {loading ? (
        <div style={{ padding: 96, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : collapseItems.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.cmdb.model.empty')}
          style={{ padding: 64 }}
        />
      ) : (
        <Collapse
          ghost
          size="small"
          // 分组折叠头 8px 0、内容区 6px 0 6px 4px（语义化样式渲染为行内样式，直接生效）
          styles={{
            header: { padding: '8px 0 2px' },
            body: { padding: '6px 0 6px 4px' },
          }}
          defaultActiveKey={visibleGroups.map(({ group }) => group.code)}
          items={collapseItems}
        />
      )}

      <ModelFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        groups={groups}
        defaultGroup={createGroup}
        onSuccess={() => reload()}
      />
      <ModalForm<{ code: string; name: string }>
        key="create-group"
        title={t('pages.cmdb.model.group.create.title')}
        width={480}
        open={groupCreateOpen}
        onOpenChange={setGroupCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        submitter={submitter.create}
        onFinish={async (values) => {
          await createModelGroup({ code: values.code, name: values.name });
          message.success(t('common.msg.created'));
          reload();
          return true;
        }}
      >
        <ProFormText
          name="code"
          label={t('pages.cmdb.model.column.code')}
          rules={[
            rules.required(t('pages.cmdb.model.column.code')),
            {
              pattern: CODE_PATTERN,
              message: t('pages.cmdb.model.form.code.pattern'),
            },
          ]}
        />
        <ProFormText
          name="name"
          label={t('pages.cmdb.model.group.name')}
          rules={[
            rules.required(t('pages.cmdb.model.group.name')),
            rules.max(64),
          ]}
        />
      </ModalForm>
      {renameGroup && (
        <ModalForm<{ name: string }>
          key={`rename-group-${renameGroup.code}`}
          title={t('pages.cmdb.model.group.rename')}
          width={480}
          open={!!renameGroup}
          onOpenChange={(open) => {
            if (!open) setRenameGroup(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{ name: renameGroup.name }}
          submitter={submitter.save}
          onFinish={async (values) => {
            await updateModelGroup(renameGroup.code, { name: values.name });
            message.success(t('common.msg.saved'));
            reload();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.cmdb.model.group.name')}
            rules={[
              rules.required(t('pages.cmdb.model.group.name')),
              rules.max(64),
            ]}
          />
        </ModalForm>
      )}
    </>
  );
};

const RelationTypesTab: React.FC = () => {
  const t = useT();
  const { message } = App.useApp();
  const has = usePermissions();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const actionRef = useRef<ActionType>(null);
  const cardinalityText = useEnumText(CMDB_CARDINALITY_META);
  const onDeleteText = useEnumText(CMDB_ON_DELETE_META);
  const cardinalityOptions = useOptions(
    CMDB_CARDINALITY_META,
    CMDB_CARDINALITY_ORDER,
  );
  const onDeleteOptions = useOptions(CMDB_ON_DELETE_META, CMDB_ON_DELETE_ORDER);
  const modelOptions = useModelOptions(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<CmdbRelationType | null>(null);
  const reload = () => actionRef.current?.reload();
  const canEdit = has('cmdb.model.relation_type');
  const anyModel = t('pages.cmdb.relationType.form.anyModel');

  const columns: ProColumns<CmdbRelationType>[] = [
    { title: t('pages.cmdb.relationType.column.name'), dataIndex: 'name' },
    {
      title: t('pages.cmdb.relationType.column.code'),
      dataIndex: 'code',
      copyable: true,
    },
    {
      title: t('pages.cmdb.relationType.column.srcModel'),
      dataIndex: 'srcModel',
      render: (_, r) => (r.srcModel === CMDB_ANY_MODEL ? anyModel : r.srcModel),
    },
    {
      title: t('pages.cmdb.relationType.column.forwardName'),
      dataIndex: 'forwardName',
    },
    {
      title: t('pages.cmdb.relationType.column.dstModel'),
      dataIndex: 'dstModel',
      render: (_, r) => (r.dstModel === CMDB_ANY_MODEL ? anyModel : r.dstModel),
    },
    {
      title: t('pages.cmdb.relationType.column.backwardName'),
      dataIndex: 'backwardName',
    },
    {
      title: t('pages.cmdb.relationType.column.cardinality'),
      dataIndex: 'cardinality',
      width: 90,
      render: (_, r) => cardinalityText(r.cardinality),
    },
    {
      title: t('pages.cmdb.relationType.column.onDelete'),
      dataIndex: 'onDelete',
      width: 100,
      render: (_, r) => onDeleteText(r.onDelete),
    },
    {
      title: t('pages.cmdb.relationType.column.relationCount'),
      dataIndex: 'relationCount',
      width: 80,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 120,
      hideInTable: !canEdit,
      render: (_, r) => [
        <a key="edit" onClick={() => setEditRow(r)}>
          {t('common.action.edit')}
        </a>,
        <DeleteConfirmLink
          key="delete"
          title={t('pages.cmdb.relationType.delete.title')}
          description={t('pages.cmdb.relationType.delete.description')}
          onConfirm={async () => {
            await deleteRelationType(r.code);
            message.success(t('common.msg.deleted'));
            reload();
          }}
        />,
      ],
    },
  ];

  const nameItems = (
    <>
      <ProFormText
        name="name"
        label={t('pages.cmdb.relationType.column.name')}
        rules={[
          rules.required(t('pages.cmdb.relationType.column.name')),
          rules.max(64),
        ]}
      />
      <ProFormText
        name="forwardName"
        label={t('pages.cmdb.relationType.column.forwardName')}
        tooltip={t('pages.cmdb.relationType.form.forwardName.tooltip')}
        rules={[
          rules.required(t('pages.cmdb.relationType.column.forwardName')),
          rules.max(64),
        ]}
      />
      <ProFormText
        name="backwardName"
        label={t('pages.cmdb.relationType.column.backwardName')}
        tooltip={t('pages.cmdb.relationType.form.backwardName.tooltip')}
        rules={[
          rules.required(t('pages.cmdb.relationType.column.backwardName')),
          rules.max(64),
        ]}
      />
    </>
  );
  const policyItems = (
    <>
      <ProFormSelect
        name="onDelete"
        label={t('pages.cmdb.relationType.column.onDelete')}
        options={onDeleteOptions}
        allowClear={false}
      />
      <ProFormTextArea
        name="description"
        label={t('pages.cmdb.model.column.description')}
        rules={[rules.max(256)]}
      />
    </>
  );

  return (
    <>
      <ProTable<CmdbRelationType>
        cardBordered
        rowKey="code"
        actionRef={actionRef}
        search={false}
        columns={columns}
        pagination={false}
        headerTitle={
          canEdit && (
            <CreateButton onClick={() => setCreateOpen(true)}>
              {t('pages.cmdb.relationType.create.title')}
            </CreateButton>
          )
        }
        request={async () => {
          const result = await listRelationTypes();
          return { data: result.items, success: true };
        }}
      />
      <ModalForm<RelationTypeFormValues>
        key="create-relation-type"
        title={t('pages.cmdb.relationType.create.title')}
        width={560}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{ cardinality: 'one_to_many', onDelete: 'restrict' }}
        submitter={submitter.create}
        onFinish={async (values) => {
          await createRelationType({
            ...values,
            description: values.description || undefined,
          });
          message.success(t('common.msg.created'));
          reload();
          return true;
        }}
      >
        <ProFormText
          name="code"
          label={t('pages.cmdb.relationType.column.code')}
          rules={[
            rules.required(t('pages.cmdb.relationType.column.code')),
            {
              pattern: CODE_PATTERN,
              message: t('pages.cmdb.model.form.code.pattern'),
            },
          ]}
        />
        {nameItems}
        <ProFormSelect
          name="srcModel"
          label={t('pages.cmdb.relationType.column.srcModel')}
          request={modelOptions}
          showSearch
          rules={[rules.select(t('pages.cmdb.relationType.column.srcModel'))]}
        />
        <ProFormSelect
          name="dstModel"
          label={t('pages.cmdb.relationType.column.dstModel')}
          request={modelOptions}
          showSearch
          rules={[rules.select(t('pages.cmdb.relationType.column.dstModel'))]}
        />
        <ProFormSelect
          name="cardinality"
          label={t('pages.cmdb.relationType.column.cardinality')}
          tooltip={t('pages.cmdb.relationType.form.cardinality.tooltip')}
          options={cardinalityOptions}
          allowClear={false}
        />
        {policyItems}
      </ModalForm>
      {editRow && (
        <ModalForm<RelationTypeFormValues>
          key={`edit-relation-type-${editRow.code}`}
          title={t('pages.cmdb.relationType.edit.title', {
            name: editRow.name,
          })}
          width={560}
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={editRow}
          submitter={submitter.save}
          onFinish={async (values) => {
            await updateRelationType(editRow.code, {
              name: values.name,
              forwardName: values.forwardName,
              backwardName: values.backwardName,
              onDelete: values.onDelete,
              description: values.description ?? '',
            });
            message.success(t('common.msg.saved'));
            reload();
            return true;
          }}
        >
          <ProFormText
            name="code"
            label={t('pages.cmdb.relationType.column.code')}
            disabled
          />
          {nameItems}
          <ProFormText
            name="srcModel"
            label={t('pages.cmdb.relationType.column.srcModel')}
            disabled
          />
          <ProFormText
            name="dstModel"
            label={t('pages.cmdb.relationType.column.dstModel')}
            disabled
          />
          <ProFormText
            name="cardinality"
            label={t('pages.cmdb.relationType.column.cardinality')}
            disabled
          />
          {policyItems}
        </ModalForm>
      )}
    </>
  );
};

const ModelPage: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const [tab, setTab] = useState('models');
  return (
    <PageContainer
      title={false}
      tabList={[
        { key: 'models', tab: t('pages.cmdb.model.tab.models') },
        { key: 'relationTypes', tab: t('pages.cmdb.model.tab.relationTypes') },
        ...(has('cmdb.model.scope')
          ? [{ key: 'scopes', tab: t('pages.cmdb.model.tab.scopes') }]
          : []),
      ]}
      tabActiveKey={tab}
      onTabChange={setTab}
    >
      {tab === 'relationTypes' ? (
        <RelationTypesTab />
      ) : tab === 'scopes' ? (
        <ScopesTab />
      ) : (
        <ModelsTab />
      )}
    </PageContainer>
  );
};

export default ModelPage;
