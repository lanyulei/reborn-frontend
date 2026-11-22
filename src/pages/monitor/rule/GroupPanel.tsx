/**
 * 规则分组树（告警规则页左栏）：按数据范围只显示可访问的分组（level=0 的上级分组仅用于保持
 * 层级，置灰且不可选）。分组维护（新建下级 / 编辑 / 删除）在分组的右键菜单里，需要元素权限 monitor.rule.group
 * 且对该分组「可管理」；新建顶级分组与「分组授权」仅超级管理员。
 * 分组不能更换上级（后端不支持），同级顺序通过「排序」调整。
 */
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import type { MenuProps } from 'antd';
import { App, Button, Dropdown, Empty, Spin, Tooltip, Tree, theme } from 'antd';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import {
  createRuleGroup,
  deleteRuleGroup,
  updateRuleGroup,
} from '@/services/monitor/ruleGroup';
import type { RuleGroup } from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';
import { buildTree, type TreeNode } from '@/utils/tree';
import { MONITOR_LIMITS } from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { GroupScopeModal } from './GroupScopeModal';

/** 分组至多 5 层 */
const MAX_DEPTH = 5;

interface GroupFormValues {
  name: string;
  description?: string;
  sort?: number;
}

/** 新建（parent 为上级，null = 顶级）或编辑（group） */
type GroupFormState =
  | { mode: 'create'; parent: RuleGroup | null }
  | { mode: 'edit'; group: RuleGroup };

interface GroupDataNode {
  key: string;
  title: React.ReactNode;
  selectable: boolean;
  children?: GroupDataNode[];
}

export const GroupPanel: React.FC<{
  groups: readonly RuleGroup[];
  isAdmin: boolean;
  loading: boolean;
  /** 当前选中的分组；undefined = 全部 */
  selectedId?: string;
  onSelect: (id?: string) => void;
  /** 分组增删改后重新拉取 */
  onChanged: () => void | Promise<void>;
}> = ({ groups, isAdmin, loading, selectedId, onSelect, onChanged }) => {
  const t = useT();
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { styles, cx } = useMonitorStyles();
  const { token } = theme.useToken();
  const canMaintain = has('monitor.rule.group');
  const canGrant = isAdmin && has('monitor.rule.scope');

  const [form, setForm] = useState<GroupFormState>();
  const [scopeGroup, setScopeGroup] = useState<RuleGroup>();

  // 右键菜单的回调随 treeData 一起缓存：选中项与父组件回调经 ref 读取最新值，避免闭包过期
  const latest = useRef({ selectedId, onSelect, onChanged });
  latest.current = { selectedId, onSelect, onChanged };

  const remove = (group: RuleGroup) =>
    modal.confirm({
      title: t('pages.monitor.group.delete.title', { name: group.name }),
      content: t('pages.monitor.group.delete.description'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteRuleGroup(group.id);
        } catch {
          // 仍有下级 / 规则 / 被引用等：原因已由请求层提示，这里收住拒绝并关闭确认框
          return;
        }
        message.success(t('common.msg.deleted'));
        const current = latest.current;
        if (current.selectedId === group.id) current.onSelect(undefined);
        await current.onChanged();
      },
    });

  const treeData = useMemo(() => {
    const menuOf = (group: RuleGroup): MenuProps['items'] => {
      const manage = (group.level ?? 0) >= 2;
      const items: NonNullable<MenuProps['items']> = [];
      if (canMaintain && manage) {
        if ((group.depth ?? 1) < MAX_DEPTH) {
          items.push({
            key: 'create',
            label: t('pages.monitor.group.createChild'),
            onClick: () => setForm({ mode: 'create', parent: group }),
          });
        }
        items.push({
          key: 'edit',
          label: t('common.action.edit'),
          onClick: () => setForm({ mode: 'edit', group }),
        });
      }
      if (canGrant) {
        items.push({
          key: 'scope',
          label: t('pages.monitor.group.scope'),
          onClick: () => setScopeGroup(group),
        });
      }
      // 内置的缺省分组不可删除
      if (canMaintain && manage && !group.builtin) {
        items.push(
          { type: 'divider' },
          {
            key: 'delete',
            danger: true,
            label: t('common.action.delete'),
            onClick: () => remove(group),
          },
        );
      }
      return items;
    };

    const toNode = (node: TreeNode<RuleGroup>): GroupDataNode => {
      const visible = (node.level ?? 0) >= 1;
      const menu = menuOf(node);
      const row = (
        <span className={styles.treeNode}>
          <span
            className={cx(
              styles.treeNodeName,
              !visible && styles.treeNodeMuted,
            )}
            title={node.description || node.name}
          >
            {node.name}
          </span>
          {visible && (
            <span className={styles.treeNodeCount}>{node.ruleCount ?? 0}</span>
          )}
        </span>
      );
      return {
        key: node.id,
        selectable: visible,
        // 分组的维护操作在右键菜单里（没有可用操作的分组不挂菜单，保留浏览器默认的右键）
        title:
          menu && menu.length > 0 ? (
            <Dropdown
              menu={{
                items: menu,
                // 菜单在浮层里，但 React 事件仍会冒泡到树节点：不要因此改变选中的分组
                onClick: ({ domEvent }) => domEvent.stopPropagation(),
              }}
              trigger={['contextMenu']}
            >
              {row}
            </Dropdown>
          ) : (
            row
          ),
        children: node.children?.map(toNode),
      };
    };
    return buildTree(groups).map(toNode);
  }, [groups, canMaintain, canGrant, styles, cx, t]);

  const editing = form?.mode === 'edit' ? form.group : undefined;
  /** 可访问分组（level ≥ 1）的规则总数：分组上的 ruleCount 不含下级，求和即全部规则数 */
  const totalRules = groups.reduce(
    (sum, group) =>
      (group.level ?? 0) >= 1 ? sum + (group.ruleCount ?? 0) : sum,
    0,
  );

  return (
    <aside className={styles.splitSide}>
      <div className={styles.splitSideTitle}>
        <span style={{ flex: 1 }}>
          {t('pages.monitor.group.title')}
          {/* 维护操作在右键菜单里，没有可见入口：有维护权限时在标题旁说明一下 */}
          {(canMaintain || canGrant) && (
            <Tooltip title={t('pages.monitor.group.contextTip')}>
              <QuestionCircleOutlined
                style={{
                  marginInlineStart: 6,
                  color: token.colorTextTertiary,
                  fontSize: token.fontSizeSM,
                }}
              />
            </Tooltip>
          )}
        </span>
        {/* 顶级分组仅超级管理员可建 */}
        {canMaintain && isAdmin && (
          <Tooltip title={t('pages.monitor.group.createRoot')}>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              aria-label={t('pages.monitor.group.createRoot')}
              onClick={() => setForm({ mode: 'create', parent: null })}
            />
          </Tooltip>
        )}
      </div>
      <div style={{ padding: '4px 8px 12px' }}>
        {loading && groups.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : groups.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.monitor.group.empty')}
            style={{ padding: 24 }}
          />
        ) : (
          <>
            <button
              type="button"
              className={cx(
                styles.treeAll,
                !selectedId && styles.treeAllActive,
              )}
              aria-pressed={!selectedId}
              onClick={() => onSelect(undefined)}
            >
              <span className={styles.treeNodeName}>
                {t('pages.monitor.group.all')}
              </span>
              <span className={styles.treeNodeCount}>{totalRules}</span>
            </button>
            <Tree
              blockNode
              defaultExpandAll
              selectedKeys={selectedId ? [selectedId] : []}
              treeData={treeData}
              onSelect={(keys) => onSelect(keys[0] as string | undefined)}
            />
          </>
        )}
      </div>

      {form && (
        <ModalForm<GroupFormValues>
          key={
            editing?.id ??
            `create-${form.mode === 'create' ? (form.parent?.id ?? 'root') : ''}`
          }
          title={
            editing
              ? t('pages.monitor.group.edit.title', { name: editing.name })
              : form.mode === 'create' && form.parent
                ? t('pages.monitor.group.createChild.title', {
                    name: form.parent.fullName || form.parent.name,
                  })
                : t('pages.monitor.group.createRoot')
          }
          width={480}
          open
          onOpenChange={(open) => {
            if (!open) setForm(undefined);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{
            name: editing?.name,
            description: editing?.description,
            sort: editing?.sort ?? 0,
          }}
          submitter={editing ? submitter.save : submitter.create}
          onFinish={async (values) => {
            const body = {
              name: values.name.trim(),
              description: values.description?.trim() ?? '',
              sort: values.sort ?? 0,
            };
            if (editing) {
              await updateRuleGroup(editing.id, body);
              message.success(t('common.msg.saved'));
            } else {
              await createRuleGroup({
                ...body,
                parentId: form.mode === 'create' ? form.parent?.id : undefined,
              });
              message.success(t('common.msg.created'));
            }
            await onChanged();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.monitor.group.form.name')}
            rules={[
              rules.required(t('pages.monitor.group.form.name')),
              rules.max(MONITOR_LIMITS.groupNameMax),
              {
                whitespace: true,
                message: t('pages.monitor.group.form.name.blank'),
              },
            ]}
          />
          <ProFormDigit
            name="sort"
            label={t('pages.monitor.group.form.sort')}
            tooltip={t('pages.monitor.group.form.sort.tooltip')}
            min={0}
            max={MONITOR_LIMITS.groupSortMax}
            fieldProps={{ precision: 0 }}
          />
          <ProFormTextArea
            name="description"
            label={t('pages.monitor.common.description')}
            fieldProps={{
              rows: 3,
              maxLength: MONITOR_LIMITS.groupDescMax,
              showCount: true,
            }}
          />
        </ModalForm>
      )}
      {scopeGroup && (
        <GroupScopeModal
          key={scopeGroup.id}
          group={scopeGroup}
          onClose={() => setScopeGroup(undefined)}
        />
      )}
    </aside>
  );
};

export default GroupPanel;
