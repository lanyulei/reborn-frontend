/**
 * 分组授权（角色数据范围）：把某个分组授权给角色（只读 / 可管理），即包含其全部下级分组。
 * 用户的有效范围是其全部启用角色的并集；超级管理员不受限。整组替换保存；从上级分组继承来的
 * 授权只读展示，须到来源分组上修改。仅超级管理员可设置。
 */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, App, Button, Modal, Select, Spin, Table, Tag } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import {
  listGroupRoleScopes,
  setGroupRoleScopes,
} from '@/services/monitor/ruleGroup';
import type {
  InheritedGroupRoleScope,
  RuleGroup,
} from '@/services/monitor/typings';
import { listRoles } from '@/services/system/role';
import { useOptions, useT } from '@/utils/i18n';
import { fetchAllPages } from '@/utils/paging';
import {
  GRANT_LEVEL_ORDER,
  MONITOR_LIMITS,
  SCOPE_LEVEL_META,
} from '../components/meta';
import { useMonitorStyles } from '../components/styles';

interface ScopeRow {
  roleId?: string;
  level: 1 | 2;
}

export const GroupScopeModal: React.FC<{
  group: RuleGroup;
  onClose: () => void;
}> = ({ group, onClose }) => {
  const t = useT();
  const { message } = App.useApp();
  const { styles } = useMonitorStyles();
  const levelOptions = useOptions(SCOPE_LEVEL_META, GRANT_LEVEL_ORDER);
  const [loading, setLoading] = useState(true);
  // 加载失败时不能保存：保存是整组替换，会用空列表清掉已有授权
  const [failed, setFailed] = useState(false);
  // 递增即重新加载（「重试」）
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ScopeRow[]>([]);
  const [inherited, setInherited] = useState<InheritedGroupRoleScope[]>([]);
  const [roleOptions, setRoleOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // attempt 递增即重新加载
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    Promise.all([
      listGroupRoleScopes(group.id),
      // 角色候选：无角色管理权限时静默为空，已授权的角色仍按接口返回的名称回显
      fetchAllPages((page, pageSize) =>
        listRoles({ page, pageSize }, { silent: true }),
      ).catch(() => []),
    ])
      .then(([scopes, roles]) => {
        if (cancelled) return;
        const items = scopes.items ?? [];
        setRows(
          items.map((item) => ({ roleId: item.roleId, level: item.level })),
        );
        setInherited(scopes.inherited ?? []);
        const known = new Map(
          roles.map((role) => [
            role.id,
            role.status === 1
              ? role.name
              : t('pages.monitor.scope.roleDisabled', { name: role.name }),
          ]),
        );
        for (const item of items) {
          if (!known.has(item.roleId)) {
            known.set(item.roleId, item.roleName || item.roleId);
          }
        }
        setRoleOptions([...known].map(([value, label]) => ({ value, label })));
      })
      // 失败原因已由请求层提示
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [group.id, t, attempt]);

  const update = (index: number, patch: Partial<ScopeRow>) =>
    setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const taken = new Set(rows.map((row) => row.roleId).filter(Boolean));
  const incomplete = rows.some((row) => !row.roleId);

  const save = async () => {
    setSaving(true);
    try {
      await setGroupRoleScopes({
        groupId: group.id,
        items: rows.map((row) => ({
          roleId: row.roleId as string,
          level: row.level,
        })),
      });
      message.success(t('common.msg.saved'));
      onClose();
    } catch {
      // 已由请求层提示
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={t('pages.monitor.scope.title', {
        name: group.fullName || group.name,
      })}
      open
      width={560}
      destroyOnHidden
      mask={{ closable: false }}
      confirmLoading={saving}
      okText={t('common.action.save')}
      okButtonProps={{ disabled: loading || failed || incomplete }}
      onOk={() => void save()}
      onCancel={onClose}
    >
      <Alert
        type="info"
        showIcon
        title={t('pages.monitor.scope.notice')}
        style={{ marginBottom: 16 }}
      />
      {failed && (
        <Alert
          type="error"
          showIcon
          title={t('pages.monitor.scope.loadFailed')}
          action={
            <Button size="small" onClick={() => setAttempt((n) => n + 1)}>
              {t('pages.monitor.retry')}
            </Button>
          }
        />
      )}
      {!failed && (
        <Spin spinning={loading}>
          {rows.map((row, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 行无稳定标识，按位置编辑
            <div key={index} className={styles.editorRow}>
              <Select
                style={{ flex: 1, minWidth: 0 }}
                showSearch={{ optionFilterProp: 'label' }}
                value={row.roleId}
                placeholder={t('pages.monitor.scope.role.placeholder')}
                options={roleOptions.map((option) => ({
                  ...option,
                  disabled:
                    option.value !== row.roleId && taken.has(option.value),
                }))}
                onChange={(roleId: string) => update(index, { roleId })}
              />
              <Select<1 | 2>
                style={{ width: 140 }}
                value={row.level}
                options={levelOptions}
                onChange={(level) => update(index, { level })}
              />
              <Button
                type="text"
                icon={<DeleteOutlined />}
                aria-label={t('pages.monitor.editor.remove')}
                onClick={() => setRows(rows.filter((_, i) => i !== index))}
              />
            </div>
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            disabled={rows.length >= MONITOR_LIMITS.roleScopeMax}
            onClick={() => setRows([...rows, { level: 1 }])}
          >
            {t('pages.monitor.scope.add')}
          </Button>

          {inherited.length > 0 && (
            <>
              <SectionTitle>{t('pages.monitor.scope.inherited')}</SectionTitle>
              <Table<InheritedGroupRoleScope>
                size="small"
                rowKey={(row) => `${row.roleId}-${row.groupId}`}
                pagination={false}
                dataSource={inherited}
                columns={[
                  {
                    title: t('pages.monitor.scope.column.role'),
                    dataIndex: 'roleName',
                    render: (_, row) => row.roleName || row.roleId,
                  },
                  {
                    title: t('pages.monitor.scope.column.level'),
                    dataIndex: 'level',
                    width: 110,
                    render: (_, row) => (
                      <Tag color={row.level === 2 ? 'blue' : undefined}>
                        {t(SCOPE_LEVEL_META[row.level].textId)}
                      </Tag>
                    ),
                  },
                  {
                    title: t('pages.monitor.scope.column.from'),
                    dataIndex: 'groupName',
                    render: (_, row) => row.groupName || row.groupId,
                  },
                ]}
              />
            </>
          )}
        </Spin>
      )}
    </Modal>
  );
};

export default GroupScopeModal;
