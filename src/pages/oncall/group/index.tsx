/**
 * 值班分组列表：新建 / 编辑 / 删除，显示成员数、值班表数与我的身份。
 * 元素权限决定操作是否展示；编辑、删除另要求分组管理员身份（canManage）。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  createGroup,
  deleteGroup,
  listGroups,
  updateGroup,
} from '@/services/oncall/group';
import type { OncallGroup } from '@/services/oncall/typings';
import { usePermissions } from '@/services/system/permissions';
import { useSubmitter, useT } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { ManageLink } from '../components/hooks';
import { GroupFormFields, type GroupFormValues } from './GroupFormFields';

const OncallGroupList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const submitter = useSubmitter();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<OncallGroup | null>(null);

  const reload = () => actionRef.current?.reload();
  const hasAnyAction = has('oncall.group.edit') || has('oncall.group.delete');

  const columns: ProColumns<OncallGroup>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.oncall.group.search.placeholder') },
    },
    {
      title: t('pages.oncall.group.search.mine'),
      dataIndex: 'mine',
      hideInTable: true,
      valueEnum: { true: { text: t('pages.oncall.group.search.mine.only') } },
    },
    {
      title: t('pages.oncall.group.column.name'),
      dataIndex: 'name',
      search: false,
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => history.push(`/oncall/group/${record.id}`)}>
          {record.name}
        </a>
      ),
    },
    {
      title: t('pages.oncall.group.column.description'),
      dataIndex: 'description',
      search: false,
      ellipsis: true,
      renderText: (value: string) => value || t('common.empty'),
    },
    {
      title: t('pages.oncall.group.column.memberCount'),
      dataIndex: 'memberCount',
      search: false,
      width: 90,
      renderText: (value?: number) => value ?? 0,
    },
    {
      title: t('pages.oncall.group.column.scheduleCount'),
      dataIndex: 'scheduleCount',
      search: false,
      width: 100,
      renderText: (value?: number) => value ?? 0,
    },
    {
      title: t('pages.oncall.group.column.myRole'),
      dataIndex: 'myRole',
      search: false,
      width: 110,
      render: (_, record) =>
        record.myRole === 1 ? (
          <Tag color="gold">{t('enum.oncall.memberRole.1')}</Tag>
        ) : record.myRole === 2 ? (
          <Tag>{t('enum.oncall.memberRole.2')}</Tag>
        ) : (
          t('common.empty')
        ),
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
      width: 120,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('oncall.group.edit')) {
          actions.push(
            <ManageLink
              key="edit"
              canManage={record.canManage}
              onClick={() => setEditRow(record)}
            >
              {t('common.action.edit')}
            </ManageLink>,
          );
        }
        if (has('oncall.group.delete')) {
          actions.push(
            record.canManage ? (
              <DeleteConfirmLink
                key="delete"
                title={t('pages.oncall.group.delete.title')}
                description={t('pages.oncall.group.delete.description')}
                onConfirm={async () => {
                  await deleteGroup(record.id);
                  message.success(t('common.msg.deleted'));
                  reload();
                }}
              />
            ) : (
              <ManageLink key="delete" onClick={() => undefined}>
                {t('common.action.delete')}
              </ManageLink>
            ),
          );
        }
        return actions.length ? actions : t('common.empty');
      },
    },
  ];

  return (
    <>
      <PageContainer title={false}>
        <ProTable<OncallGroup>
          cardBordered
          headerTitle={
            has('oncall.group.create') && (
              <CreateButton onClick={() => setCreateOpen(true)}>
                {t('pages.oncall.group.create.title')}
              </CreateButton>
            )
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          scroll={{ x: 'max-content' }}
          request={async (params) => {
            const result = await listGroups({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              mine: parseBoolParam(params.mine),
            });
            return toTableResult(result);
          }}
        />
      </PageContainer>

      <ModalForm<GroupFormValues>
        key="create-group"
        title={t('pages.oncall.group.create.title')}
        width={480}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        submitter={submitter.create}
        onFinish={async (values) => {
          const { group } = await createGroup({
            name: values.name,
            description: values.description?.trim() || undefined,
          });
          message.success(t('common.msg.created'));
          // 新建后直接进入详情继续添加成员与值班表
          if (group?.id) history.push(`/oncall/group/${group.id}`);
          else reload();
          return true;
        }}
      >
        <GroupFormFields />
      </ModalForm>

      {editRow && (
        <ModalForm<GroupFormValues>
          key={`edit-group-${editRow.id}`}
          title={t('pages.oncall.group.edit.title', { name: editRow.name })}
          width={480}
          open
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{
            name: editRow.name,
            description: editRow.description,
          }}
          submitter={submitter.save}
          onFinish={async (values) => {
            await updateGroup(editRow.id, {
              name: values.name,
              description: values.description?.trim() ?? '',
            });
            message.success(t('common.msg.saved'));
            reload();
            return true;
          }}
        >
          <GroupFormFields />
        </ModalForm>
      )}
    </>
  );
};

export default OncallGroupList;
