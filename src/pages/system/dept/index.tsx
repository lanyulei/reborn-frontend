import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Col, Form, Space, Tag, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import { DeptSelect, invalidateDeptCache } from '@/components/DeptSelect';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { UserSelect, userLabel } from '@/components/UserSelect';
import {
  DEPT_DESCRIPTION_MAX,
  DEPT_LEADER_MAX,
  DEPT_NAME_MAX,
  DEPT_SORT_MAX,
  DEPT_STATUS_META,
  DEPT_STATUS_ORDER,
} from '@/constants';
import {
  createDept,
  deleteDept,
  getDept,
  listDepts,
  moveDept,
  updateDept,
} from '@/services/system/dept';
import { usePermissions } from '@/services/system/permissions';
import type { DeptStatus, SystemDept } from '@/services/system/typings';
import {
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import { buildTree, type TreeNode } from '@/utils/tree';
import { fetchDeptUserCandidates } from './candidates';
import MemberDrawer from './MemberDrawer';

/** 部门编码格式（与后端 proto 校验一致） */
const DEPT_CODE_PATTERN = /^[a-zA-Z0-9_-]{2,64}$/;

/** 列表里直接展示的负责人数量，其余折叠为 +N */
const LEADER_PREVIEW = 3;

/** 部门表单值（新建 / 编辑共用；status 仅编辑） */
interface DeptFormValues {
  parentId?: string;
  name: string;
  code?: string;
  leaderIds?: string[];
  sort?: number;
  status?: DeptStatus;
  description?: string;
}

/** 表单目标：新建（可带预选上级）或编辑某部门 */
type FormTarget =
  | { mode: 'create'; parentId?: string; seq: number }
  | { mode: 'edit'; row: SystemDept };

/**
 * 按关键字（名称 / 编码）与状态过滤部门，并保留命中项的全部上级，
 * 保证过滤后仍是一棵完整的树。
 */
const filterDepts = (
  depts: SystemDept[],
  keyword: string,
  status?: DeptStatus,
): SystemDept[] => {
  if (!keyword && status === undefined) return depts;
  const byId = new Map(depts.map((dept) => [dept.id, dept]));
  const lower = keyword.toLowerCase();
  const kept = new Set<string>();
  for (const dept of depts) {
    const hit =
      (status === undefined || dept.status === status) &&
      (!lower ||
        dept.name.toLowerCase().includes(lower) ||
        (dept.code ?? '').toLowerCase().includes(lower));
    if (!hit) continue;
    let current: SystemDept | undefined = dept;
    while (current && !kept.has(current.id)) {
      kept.add(current.id);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  }
  return depts.filter((dept) => kept.has(dept.id));
};

const DeptList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const statusEnum = useValueEnum(DEPT_STATUS_META);
  const statusOptions = useOptions(DEPT_STATUS_META, DEPT_STATUS_ORDER);

  // 全量部门（平铺）：上级选择器的数据源，随列表每次加载刷新
  const [depts, setDepts] = useState<SystemDept[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<readonly React.Key[]>([]);
  // 首次加载默认全部展开；之后保留用户的展开 / 折叠状态
  const expandedOnce = useRef(false);
  const [target, setTarget] = useState<FormTarget | null>(null);
  const [memberDept, setMemberDept] = useState<SystemDept | null>(null);
  const createSeq = useRef(0);

  const reload = () => actionRef.current?.reload();

  const openCreate = (parentId?: string) => {
    createSeq.current += 1;
    setTarget({ mode: 'create', parentId, seq: createSeq.current });
  };

  const expand = (id?: string) => {
    if (id)
      setExpandedKeys((keys) => (keys.includes(id) ? keys : [...keys, id]));
  };

  const hasAnyAction =
    has('system.dept.create') ||
    has('system.dept.edit') ||
    has('system.dept.member') ||
    has('system.dept.delete');

  const nameRules = [
    rules.required(t('pages.system.dept.column.name')),
    rules.max(DEPT_NAME_MAX),
  ];

  const columns: ProColumns<TreeNode<SystemDept>>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.system.dept.search.placeholder') },
    },
    {
      title: t('pages.system.dept.column.name'),
      dataIndex: 'name',
      search: false,
      ellipsis: true,
    },
    {
      title: t('pages.system.dept.column.code'),
      dataIndex: 'code',
      search: false,
      ellipsis: true,
      width: 160,
    },
    {
      title: t('pages.system.dept.column.leaders'),
      dataIndex: 'leaders',
      search: false,
      render: (_, record) => {
        const leaders = record.leaders ?? [];
        if (leaders.length === 0) return t('common.empty');
        const rest = leaders.slice(LEADER_PREVIEW);
        return (
          <Space size={[4, 4]} wrap>
            {leaders.slice(0, LEADER_PREVIEW).map((leader) => (
              <Tooltip
                key={leader.userId}
                title={
                  leader.status === 1
                    ? leader.username
                    : t('pages.system.dept.leader.inactive')
                }
              >
                <Tag color={leader.status === 1 ? undefined : 'warning'}>
                  {leader.nickname || leader.username}
                </Tag>
              </Tooltip>
            ))}
            {rest.length > 0 && (
              <Tooltip
                title={rest.map((l) => l.nickname || l.username).join('、')}
              >
                <Tag>+{rest.length}</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: t('pages.system.dept.column.memberCount'),
      dataIndex: 'memberCount',
      search: false,
      width: 90,
      render: (_, record) => (
        <a onClick={() => setMemberDept(record)}>{record.memberCount ?? 0}</a>
      ),
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      width: 90,
    },
    {
      title: t('pages.system.dept.column.sort'),
      dataIndex: 'sort',
      search: false,
      width: 80,
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
      fixed: 'right',
      width: 220,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('system.dept.create')) {
          actions.push(
            <a key="add-child" onClick={() => openCreate(record.id)}>
              {t('pages.system.dept.action.addChild')}
            </a>,
          );
        }
        if (has('system.dept.edit')) {
          actions.push(
            <a
              key="edit"
              onClick={() => setTarget({ mode: 'edit', row: record })}
            >
              {t('common.action.edit')}
            </a>,
          );
        }
        if (has('system.dept.member')) {
          actions.push(
            <a key="members" onClick={() => setMemberDept(record)}>
              {t('pages.system.dept.action.members')}
            </a>,
          );
        }
        if (has('system.dept.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.system.dept.delete.title')}
              description={t('pages.system.dept.delete.description', {
                name: record.name,
              })}
              onConfirm={async () => {
                await deleteDept(record.id);
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

  const editRow = target?.mode === 'edit' ? target.row : null;

  /**
   * 表单项（新建 / 编辑共用，两列栅格）；editing 时多出状态，并在上级选择里
   * 排除自身子树。自定义控件不带栅格列属性，手动包一层 Col。
   */
  const formItems = (editing: SystemDept | null) => (
    <>
      <ProFormText
        colProps={{ span: 12 }}
        name="name"
        label={t('pages.system.dept.column.name')}
        rules={nameRules}
      />
      <ProFormText
        colProps={{ span: 12 }}
        name="code"
        label={t('pages.system.dept.column.code')}
        placeholder={t('pages.system.dept.form.code.placeholder')}
        rules={[
          {
            pattern: DEPT_CODE_PATTERN,
            message: t('pages.system.dept.form.code.pattern'),
          },
        ]}
      />
      <Col span={12}>
        <Form.Item
          name="parentId"
          label={t('pages.system.dept.form.parent')}
          tooltip={t('pages.system.dept.form.parent.tooltip')}
        >
          <DeptSelect
            depts={depts}
            excludeSubtreeOf={editing?.id}
            placeholder={t('pages.system.dept.form.parent.placeholder')}
          />
        </Form.Item>
      </Col>
      <ProFormDigit
        colProps={{ span: 12 }}
        name="sort"
        label={t('pages.system.dept.column.sort')}
        tooltip={t('pages.system.dept.form.sort.tooltip')}
        min={0}
        max={DEPT_SORT_MAX}
        fieldProps={{ precision: 0 }}
      />
      <Col span={24}>
        <Form.Item
          name="leaderIds"
          label={t('pages.system.dept.column.leaders')}
          tooltip={t('pages.system.dept.form.leaders.tooltip')}
        >
          <UserSelect
            multiple
            maxCount={DEPT_LEADER_MAX}
            fetchUsers={fetchDeptUserCandidates}
            knownUsers={editing?.leaders?.map((leader) => ({
              id: leader.userId,
              label: userLabel(leader),
            }))}
            placeholder={t('pages.system.dept.form.leaders.placeholder')}
          />
        </Form.Item>
      </Col>
      {editing && (
        <ProFormRadio.Group
          colProps={{ span: 24 }}
          name="status"
          label={t('common.column.status')}
          options={statusOptions}
        />
      )}
      <ProFormTextArea
        colProps={{ span: 24 }}
        name="description"
        label={t('pages.system.dept.form.description')}
        fieldProps={{
          maxLength: DEPT_DESCRIPTION_MAX,
          showCount: true,
          autoSize: { minRows: 2, maxRows: 4 },
        }}
      />
    </>
  );

  return (
    <>
      <PageContainer title={false}>
        <ProTable<TreeNode<SystemDept>>
          cardBordered
          headerTitle={
            has('system.dept.create') && (
              <CreateButton onClick={() => openCreate()}>
                {t('pages.system.dept.create.title')}
              </CreateButton>
            )
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          scroll={{ x: 'max-content' }}
          pagination={false}
          expandable={{
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: setExpandedKeys,
          }}
          request={async (params) => {
            const { items = [] } = await listDepts();
            setDepts(items);
            // 部门选择器的缓存与本页同源数据保持一致
            invalidateDeptCache();
            const keyword = String(params.keyword ?? '').trim();
            const status =
              params.status === undefined || params.status === ''
                ? undefined
                : (Number(params.status) as DeptStatus);
            const visible = filterDepts(items, keyword, status);
            const filtering = keyword !== '' || status !== undefined;
            if (filtering || !expandedOnce.current) {
              // 过滤时全部展开以露出命中项；首次加载同样全部展开
              const parents = new Set(
                visible.map((dept) => dept.parentId).filter(Boolean),
              );
              setExpandedKeys([...parents] as string[]);
              expandedOnce.current = true;
            }
            return { data: buildTree(visible), success: true };
          }}
        />
      </PageContainer>

      {/* 新建部门：从行内「添加下级」进入时预选上级 */}
      {target?.mode === 'create' && (
        <ModalForm<DeptFormValues>
          key={`create-dept-${target.seq}`}
          title={t('pages.system.dept.create.title')}
          width={640}
          grid
          rowProps={{ gutter: 16 }}
          open
          onOpenChange={(open) => {
            if (!open) setTarget(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{ parentId: target.parentId, sort: 0 }}
          submitter={submitter.create}
          onFinish={async (values) => {
            await createDept({
              parentId: values.parentId || undefined,
              name: values.name,
              code: values.code || undefined,
              sort: values.sort ?? 0,
              description: values.description ?? '',
              leaderIds: values.leaderIds ?? [],
            });
            message.success(t('common.msg.created'));
            expand(values.parentId);
            reload();
            return true;
          }}
        >
          {formItems(null)}
        </ModalForm>
      )}

      {/* 编辑部门：打开时拉取详情；上级变化走移动接口（连同整棵子树） */}
      {editRow && (
        <ModalForm<DeptFormValues>
          key={`edit-dept-${editRow.id}`}
          title={t('pages.system.dept.edit.title', { name: editRow.name })}
          width={640}
          grid
          rowProps={{ gutter: 16 }}
          open
          onOpenChange={(open) => {
            if (!open) setTarget(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          params={{ id: editRow.id }}
          request={async ({ id }) => {
            const { dept } = await getDept(id);
            return {
              parentId: dept.parentId || undefined,
              name: dept.name,
              code: dept.code ?? '',
              leaderIds: (dept.leaders ?? []).map((leader) => leader.userId),
              sort: dept.sort ?? 0,
              status: dept.status ?? 0,
              description: dept.description ?? '',
            };
          }}
          submitter={submitter.save}
          onFinish={async (values) => {
            // 先移动：成环 / 层级超限 / 目标上级下重名在此处拒绝，资料不会被半途改掉
            const parentId = values.parentId || undefined;
            const moved = parentId !== (editRow.parentId || undefined);
            if (moved) await moveDept(editRow.id, parentId);
            try {
              await updateDept(editRow.id, {
                name: values.name,
                code: values.code ?? '',
                sort: values.sort ?? 0,
                status: values.status,
                description: values.description ?? '',
                // 整组替换：表单回显即当前值，空列表 = 清空负责人
                leaders: { userIds: values.leaderIds ?? [] },
              });
            } catch (error) {
              // 移动已生效而资料更新失败：刷新列表，树不停留在旧位置
              if (moved) reload();
              throw error;
            }
            message.success(t('common.msg.saved'));
            expand(parentId);
            reload();
            return true;
          }}
        >
          {formItems(editRow)}
        </ModalForm>
      )}

      <MemberDrawer
        dept={memberDept}
        canManage={has('system.dept.member')}
        onClose={() => setMemberDept(null)}
        onChanged={reload}
      />
    </>
  );
};

export default DeptList;
