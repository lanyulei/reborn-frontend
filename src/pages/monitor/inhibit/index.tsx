/**
 * 抑制规则（降噪规则页的页签，外层 PageContainer 由 Tab 容器提供）：存在满足源条件的活跃告警时，
 * 抑制满足目标条件且相等标签取值相同的告警的通知。
 * 元素权限决定操作是否展示；编辑、删除另要求对作用分组「可管理」（canManage），
 * 作用于全部分组的规则仅超级管理员可维护。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { ENABLED_META } from '@/constants';
import { deleteInhibit, listInhibits } from '@/services/monitor/inhibit';
import type {
  InhibitSelector,
  MonitorInhibit,
  NamedRef,
} from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { formatTime } from '../components/format';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import { useRuleGroups } from '../components/hooks';
import { MatcherTags } from '../components/MatchersEditor';
import { MONITOR_LIMITS } from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { ManageLink, RefTags, SeverityTag } from '../components/tags';
import { InhibitDrawer } from './InhibitDrawer';

const InhibitList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const { styles } = useMonitorStyles();
  const { groups, isAdmin } = useRuleGroups();
  const enabledEnum = useValueEnum(ENABLED_META);

  // undefined = 抽屉关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<MonitorInhibit | null | undefined>(
    undefined,
  );

  const reload = () => actionRef.current?.reload();
  const hasAnyAction =
    has('monitor.mute.inhibit_edit') || has('monitor.mute.inhibit_delete');
  // 新建要落在某个可管理的分组上（作用于全部分组仅超级管理员）：没有可管理的分组就不提供入口
  const canCreate =
    has('monitor.mute.inhibit_create') &&
    (isAdmin || groups.some((group) => (group.level ?? 0) >= 2));
  // 作用于全部分组的规则只有超级管理员能改，不单看后端给的 canManage
  const manageable = (record: MonitorInhibit) =>
    record.canManage === true && (!!record.spec.groupId || isAdmin);

  /** 一侧条件的摘要：级别、规则、标签匹配；全空即不限 */
  const selectorSummary = (
    selector: InhibitSelector | null | undefined,
    ruleRefs: NamedRef[] | undefined,
  ) => {
    const ruleIds = selector?.ruleIds ?? [];
    const severities = selector?.severities ?? [];
    const matchers = selector?.matchers ?? [];
    if (!ruleIds.length && !severities.length && !matchers.length) {
      return t('pages.monitor.common.unlimited');
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!!severities.length && (
          <span>
            {severities.map((severity) => (
              <span key={severity} style={{ marginInlineEnd: 4 }}>
                <SeverityTag severity={severity} />
              </span>
            ))}
          </span>
        )}
        {!!ruleIds.length && (
          <RefTags
            // 显示名缺失时回落为规则 ID
            refs={ruleIds.map(
              (id) => ruleRefs?.find((ref) => ref.id === id) ?? { id },
            )}
            max={2}
          />
        )}
        {!!matchers.length && <MatcherTags matchers={matchers} />}
      </div>
    );
  };

  const columns: ProColumns<MonitorInhibit>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.monitor.inhibit.search.placeholder'),
        maxLength: MONITOR_LIMITS.keywordMax,
      },
    },
    {
      title: t('pages.monitor.common.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      render: (_, record) => (
        <div>
          <div>{record.spec.name}</div>
          {record.spec.description && (
            <div className={styles.hint}>{record.spec.description}</div>
          )}
        </div>
      ),
    },
    {
      title: t('pages.monitor.mute.form.group'),
      dataIndex: 'groupId',
      // value / onChange 由搜索表单注入到返回的元素上，这里不要自己传（见 LabelFilter 的说明）
      formItemRender: () => (
        <GroupTreeSelect
          groups={groups}
          placeholder={t('pages.monitor.common.group.placeholder')}
        />
      ),
      render: (_, record) =>
        record.spec.groupId ? (
          record.groupName || record.spec.groupId
        ) : (
          <Tag color="purple">{t('pages.monitor.mute.allGroups')}</Tag>
        ),
    },
    {
      title: t('pages.monitor.inhibit.section.source'),
      dataIndex: 'source',
      search: false,
      render: (_, record) =>
        selectorSummary(record.spec.source, record.sourceRules),
    },
    {
      title: t('pages.monitor.inhibit.section.target'),
      dataIndex: 'target',
      search: false,
      render: (_, record) =>
        selectorSummary(record.spec.target, record.targetRules),
    },
    {
      title: t('pages.monitor.inhibit.form.equalLabels'),
      dataIndex: 'equalLabels',
      search: false,
      render: (_, record) =>
        record.spec.equalLabels?.length ? (
          <span className={styles.tagList}>
            {record.spec.equalLabels.map((label) => (
              <Tag key={label}>{label}</Tag>
            ))}
          </span>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.monitor.inhibit.column.inhibitedCount'),
      dataIndex: 'inhibitedCount',
      search: false,
      width: 110,
      tooltip: t('pages.monitor.inhibit.column.inhibitedCount.tooltip'),
      renderText: (value?: number) => value ?? 0,
    },
    {
      title: t('common.column.status'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
      renderText: (_, record) => String(record.spec.enabled ?? false),
    },
    {
      title: t('pages.monitor.common.creator'),
      dataIndex: 'createUserName',
      search: false,
      width: 110,
      renderText: (value?: string) => value || t('common.empty'),
    },
    {
      title: t('pages.monitor.rule.column.updatedBy'),
      dataIndex: 'updateTime',
      search: false,
      width: 170,
      render: (_, record) => (
        <div>
          <div>{record.updateUserName || t('common.empty')}</div>
          <div className={styles.hint}>{formatTime(record.updateTime)}</div>
        </div>
      ),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 120,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('monitor.mute.inhibit_edit')) {
          actions.push(
            <ManageLink
              key="edit"
              canManage={manageable(record)}
              onClick={() => setFormRow(record)}
            >
              {t('common.action.edit')}
            </ManageLink>,
          );
        }
        if (has('monitor.mute.inhibit_delete')) {
          actions.push(
            manageable(record) ? (
              <DeleteConfirmLink
                key="delete"
                title={t('pages.monitor.inhibit.delete.title', {
                  name: record.spec.name,
                })}
                description={t('pages.monitor.inhibit.delete.description')}
                onConfirm={async () => {
                  try {
                    await deleteInhibit(record.id);
                  } catch {
                    // 提示已由请求层给出；这里接住，避免确认弹窗把拒绝抛成未处理的异常
                    return;
                  }
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
      <ProTable<MonitorInhibit>
        cardBordered
        headerTitle={
          canCreate && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.monitor.inhibit.create.title')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        columnEmptyText={t('common.empty')}
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          const result = await listInhibits({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            groupId: params.groupId || undefined,
            enabled: parseBoolParam(params.enabled),
          });
          return toTableResult(result);
        }}
      />
      {formRow !== undefined && (
        <InhibitDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          groups={groups}
          isAdmin={isAdmin}
          onClose={() => setFormRow(undefined)}
          onSaved={reload}
        />
      )}
    </>
  );
};

export default InhibitList;
