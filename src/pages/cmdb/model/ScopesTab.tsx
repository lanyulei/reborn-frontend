/**
 * 数据范围：按角色配置可见资源类型 / 环境（空 = 不限）。
 * 用户生效范围 = 启用角色范围并集，任一角色未配置即不限；超管恒不限。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, ProFormSelect, ProTable } from '@ant-design/pro-components';
import { Alert, App, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { listModels } from '@/services/cmdb/model';
import {
  listRoleScopes,
  type RoleScope,
  setRoleScope,
} from '@/services/cmdb/scope';
import { usePermissions } from '@/services/system/permissions';
import { useSubmitter, useT } from '@/utils/i18n';

/** 与 proto 一致：每项 1–32 字符，≤100 项 */
const ENV_MAX_LEN = 32;
const ENV_MAX_ITEMS = 100;

export const ScopesTab: React.FC = () => {
  const t = useT();
  const { message } = App.useApp();
  const has = usePermissions();
  const submitter = useSubmitter();
  const actionRef = useRef<ActionType>(null);
  const [editRow, setEditRow] = useState<RoleScope | null>(null);
  const canEdit = has('cmdb.model.scope');
  const unlimited = t('pages.cmdb.scope.unlimited');

  const columns: ProColumns<RoleScope>[] = [
    {
      title: t('pages.cmdb.scope.column.role'),
      dataIndex: 'roleName',
      render: (_, r) => (
        <>
          {r.roleName ?? r.roleId}
          {r.roleCode && (
            <Tag style={{ marginInlineStart: 8 }}>{r.roleCode}</Tag>
          )}
        </>
      ),
    },
    {
      title: t('pages.cmdb.scope.column.models'),
      dataIndex: 'modelCodes',
      render: (_, r) =>
        r.modelCodes?.length
          ? r.modelCodes.map((code) => <Tag key={code}>{code}</Tag>)
          : unlimited,
    },
    {
      title: t('pages.cmdb.scope.column.envs'),
      dataIndex: 'envs',
      render: (_, r) =>
        r.envs?.length
          ? r.envs.map((env) => <Tag key={env}>{env}</Tag>)
          : unlimited,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 100,
      hideInTable: !canEdit,
      render: (_, r) => [
        <a key="edit" onClick={() => setEditRow(r)}>
          {t('common.action.edit')}
        </a>,
      ],
    },
  ];

  return (
    <>
      <Alert
        type="info"
        showIcon
        title={t('pages.cmdb.scope.notice')}
        style={{ marginBottom: 16 }}
      />
      <ProTable<RoleScope>
        cardBordered
        rowKey="roleId"
        actionRef={actionRef}
        search={false}
        options={false}
        pagination={false}
        columns={columns}
        request={async () => {
          const result = await listRoleScopes();
          return { data: result.items, success: true };
        }}
      />
      {editRow && (
        <ModalForm<{ modelCodes: string[]; envs: string[] }>
          key={`scope-${editRow.roleId}`}
          title={t('pages.cmdb.scope.edit.title', {
            name: editRow.roleName ?? editRow.roleId,
          })}
          width={520}
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{
            modelCodes: editRow.modelCodes ?? [],
            envs: editRow.envs ?? [],
          }}
          submitter={submitter.save}
          onFinish={async (values) => {
            await setRoleScope(editRow.roleId, {
              modelCodes: values.modelCodes ?? [],
              envs: values.envs ?? [],
            });
            message.success(t('common.msg.saved'));
            actionRef.current?.reload();
            return true;
          }}
        >
          <ProFormSelect
            name="modelCodes"
            label={t('pages.cmdb.scope.form.models')}
            tooltip={t('pages.cmdb.scope.form.models.hint')}
            mode="multiple"
            showSearch
            request={async () => {
              const result = await listModels({ page: 1, pageSize: 100 });
              return result.items.map((m) => ({
                label: `${m.name} (${m.code})`,
                value: m.code,
              }));
            }}
          />
          <ProFormSelect
            name="envs"
            label={t('pages.cmdb.scope.form.envs')}
            tooltip={t('pages.cmdb.scope.form.envs.hint')}
            fieldProps={{
              mode: 'tags',
              open: false,
              tokenSeparators: [',', ' '],
            }}
            rules={[
              {
                validator: (_: unknown, value?: string[]) =>
                  (value ?? []).length > ENV_MAX_ITEMS ||
                  (value ?? []).some(
                    (env) => env.length === 0 || env.length > ENV_MAX_LEN,
                  )
                    ? Promise.reject(
                        new Error(t('pages.cmdb.scope.form.envs.hint')),
                      )
                    : Promise.resolve(),
              },
            ]}
          />
        </ModalForm>
      )}
    </>
  );
};
