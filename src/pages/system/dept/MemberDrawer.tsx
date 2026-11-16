/**
 * 部门成员抽屉：查看部门成员（可含下级部门）、添加成员、移出成员。
 * 成员数据复用用户列表接口（按部门过滤）；只有直属成员可在此移出。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { App, Checkbox, Drawer, Form } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { UserDeptTags } from '@/components/DeptSelect/UserDeptTags';
import { ConfirmLink, CreateButton } from '@/components/TableActions';
import { UserSelect } from '@/components/UserSelect';
import { DEPT_ADD_MEMBER_MAX, USER_STATUS_META } from '@/constants';
import {
  addDeptMembers,
  listDeptMembers,
  removeDeptMember,
} from '@/services/system/dept';
import type { DeptMember, SystemDept } from '@/services/system/typings';
import { useFormRules, useSubmitter, useT, useValueEnum } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { fetchDeptUserCandidates } from './candidates';

const MemberDrawer: React.FC<{
  /** 当前查看的部门；null = 关闭 */
  dept: SystemDept | null;
  /** 是否可添加 / 移出成员 */
  canManage: boolean;
  onClose: () => void;
  /** 成员变化后回调（刷新部门列表的成员数） */
  onChanged: () => void;
}> = ({ dept, canManage, onClose, onChanged }) => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const userStatusEnum = useValueEnum(USER_STATUS_META);
  const [includeSub, setIncludeSub] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const afterChange = () => {
    actionRef.current?.reload();
    onChanged();
  };

  const columns: ProColumns<DeptMember>[] = [
    {
      title: t('pages.system.user.column.username'),
      dataIndex: 'username',
      ellipsis: true,
    },
    {
      title: t('pages.system.user.column.nickname'),
      dataIndex: 'nickname',
      ellipsis: true,
    },
    {
      title: t('pages.system.user.column.depts'),
      dataIndex: 'depts',
      render: (_, record) => <UserDeptTags depts={record.depts} />,
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: userStatusEnum,
      width: 90,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 80,
      hideInTable: !canManage,
      render: (_, record) =>
        // 含下级部门时列表里会出现非直属成员：只能到其所在部门移出
        dept && record.depts?.some((item) => item.id === dept.id) ? (
          <ConfirmLink
            danger
            title={t('pages.system.dept.member.remove.title')}
            description={t('pages.system.dept.member.remove.description', {
              user: record.nickname || record.username,
              dept: dept.name,
            })}
            onConfirm={async () => {
              await removeDeptMember(dept.id, record.id);
              message.success(t('pages.system.dept.member.removed'));
              afterChange();
            }}
          >
            {t('pages.system.dept.member.remove')}
          </ConfirmLink>
        ) : (
          t('common.empty')
        ),
    },
  ];

  return (
    <Drawer
      title={
        dept ? t('pages.system.dept.member.title', { name: dept.name }) : ''
      }
      size={720}
      open={!!dept}
      onClose={() => {
        setIncludeSub(false);
        onClose();
      }}
      destroyOnHidden
    >
      {dept && (
        <ProTable<DeptMember>
          rowKey="id"
          actionRef={actionRef}
          search={false}
          options={false}
          columns={columns}
          params={{ deptId: dept.id, includeSub }}
          headerTitle={
            <Checkbox
              checked={includeSub}
              onChange={(e) => setIncludeSub(e.target.checked)}
            >
              {t('pages.system.dept.member.includeSub')}
            </Checkbox>
          }
          toolBarRender={() =>
            canManage
              ? [
                  <CreateButton key="add" onClick={() => setAddOpen(true)}>
                    {t('pages.system.dept.member.add')}
                  </CreateButton>,
                ]
              : []
          }
          pagination={{ defaultPageSize: 10, showSizeChanger: false }}
          request={async (params) => {
            const result = await listDeptMembers(params.deptId, {
              page: params.current,
              pageSize: params.pageSize,
              includeSubDepts: params.includeSub || undefined,
            });
            return toTableResult(result);
          }}
        />
      )}

      {dept && (
        <ModalForm<{ userIds: string[] }>
          title={t('pages.system.dept.member.add.title', { name: dept.name })}
          width={480}
          open={addOpen}
          onOpenChange={setAddOpen}
          modalProps={{ destroyOnHidden: true }}
          submitter={submitter.save}
          onFinish={async (values) => {
            await addDeptMembers(dept.id, values.userIds);
            message.success(t('pages.system.dept.member.added'));
            afterChange();
            return true;
          }}
        >
          <Form.Item
            name="userIds"
            label={t('pages.system.dept.member.add.users')}
            tooltip={t('pages.system.dept.member.add.tooltip')}
            rules={[
              {
                required: true,
                type: 'array',
                message: rules.select(t('pages.system.dept.member.add.users'))
                  .message,
              },
            ]}
          >
            <UserSelect
              multiple
              maxCount={DEPT_ADD_MEMBER_MAX}
              fetchUsers={fetchDeptUserCandidates}
              placeholder={t('pages.system.dept.member.add.placeholder')}
            />
          </Form.Item>
        </ModalForm>
      )}
    </Drawer>
  );
};

export default MemberDrawer;
