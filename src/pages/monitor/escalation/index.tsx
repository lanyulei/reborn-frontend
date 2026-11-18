/**
 * 升级策略：告警持续未认领 / 未恢复时逐级通知更多的人。策略归属一个规则分组（该分组及下级的规则可引用）
 * 或为全局策略（仅超级管理员可维护）。元素权限决定操作是否展示；编辑、删除另要求对归属分组
 * 「可管理」（canManage）。「引用规则」走规则列表接口，只对有告警规则菜单的用户可点开。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import { App, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { ENABLED_META } from '@/constants';
import {
  deleteEscalation,
  listEscalations,
} from '@/services/monitor/escalation';
import type {
  EscalationLevel,
  EscalationLevelRefs,
  MonitorEscalation,
  NamedRef,
} from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useEnumText, useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { formatTime } from '../components/format';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import { NOTICE_TABS } from '../components/groups';
import { useRuleGroups } from '../components/hooks';
import { ESCALATION_MODE_META, MONITOR_LIMITS } from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { ManageLink, RefTags, SeverityTag } from '../components/tags';
import { EscalationDrawer } from './EscalationDrawer';
import { ESCALATION_LIMITS } from './levels';
import { RulesModal } from './RulesModal';
import { useEscalationStyles } from './styles';

const EscalationList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const access = useAccess();
  const t = useT();
  const { styles } = useMonitorStyles();
  const { styles: own } = useEscalationStyles();
  const { groups, isAdmin } = useRuleGroups();
  const enabledEnum = useValueEnum(ENABLED_META);
  const modeEnum = useValueEnum(ESCALATION_MODE_META);
  const modeText = useEnumText(ESCALATION_MODE_META);

  // undefined = 抽屉关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<MonitorEscalation | null | undefined>(
    undefined,
  );
  const [rulesOf, setRulesOf] = useState<{ id: string; name: string } | null>(
    null,
  );

  const reload = () => actionRef.current?.reload();
  const hasAnyAction =
    has('monitor.escalation.edit') || has('monitor.escalation.delete');
  // 新建要落在某个可管理的分组上（全局策略仅超级管理员）：没有可管理的分组就不提供入口
  const canCreate =
    has('monitor.escalation.create') &&
    (isAdmin || groups.some((group) => (group.level ?? 0) >= 2));
  // 全局策略（无归属分组）只有超级管理员能改，不单看后端给的 canManage
  const manageable = (record: MonitorEscalation) =>
    record.canManage === true && (!!record.spec.groupId || isAdmin);

  /** 一级的通知对象 → 带说明的名称列表（仅备班、分组管理员、向上几级负责人） */
  const levelTargets = (
    level: EscalationLevel,
    refs?: EscalationLevelRefs,
  ): NamedRef[] => {
    const find = (list: NamedRef[] | undefined, id: string) =>
      list?.find((ref) => ref.id === id);
    const targets = level.targets;
    return [
      ...(targets?.schedules ?? []).map((schedule) => {
        const ref = find(refs?.schedules, schedule.id);
        const name = ref?.name || schedule.id;
        return {
          id: `schedule:${schedule.id}`,
          name: schedule.backupOnly
            ? t('pages.monitor.escalation.summary.backupOnly', { name })
            : name,
          missing: ref?.missing,
        };
      }),
      ...(targets?.oncallGroupIds ?? []).map((id) => {
        const ref = find(refs?.oncallGroups, id);
        return {
          id: `oncall:${id}`,
          name: t('pages.monitor.escalation.summary.oncallGroup', {
            name: ref?.name || id,
          }),
          missing: ref?.missing,
        };
      }),
      ...(targets?.depts ?? []).map((dept, index) => {
        // 显示名与 targets.depts 逐项对应；对不上时按 ID 找
        const aligned = refs?.depts?.[index];
        const ref =
          aligned?.id === dept.id ? aligned : find(refs?.depts, dept.id);
        const name = ref?.name || dept.id;
        return {
          id: `dept:${dept.id}:${dept.up ?? 0}:${index}`,
          name: dept.up
            ? t('pages.monitor.escalation.summary.deptUp', {
                name,
                n: dept.up,
              })
            : t('pages.monitor.escalation.summary.dept', { name }),
          missing: ref?.missing,
        };
      }),
      ...(targets?.userIds ?? []).map((id) => {
        const ref = find(refs?.users, id);
        return {
          id: `user:${id}`,
          name: ref?.name || id,
          missing: ref?.missing,
        };
      }),
    ];
  };

  const repeatText = (level: EscalationLevel) => {
    if (!level.repeatIntervalM) {
      return t('pages.monitor.escalation.summary.once');
    }
    return level.maxNotify
      ? t('pages.monitor.escalation.summary.repeatMax', {
          interval: level.repeatIntervalM,
          max: level.maxNotify,
        })
      : t('pages.monitor.escalation.summary.repeat', {
          interval: level.repeatIntervalM,
        });
  };

  const columns: ProColumns<MonitorEscalation>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.monitor.escalation.search.placeholder'),
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
      title: t('pages.monitor.escalation.form.group'),
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
          <Tag color="purple">{t('pages.monitor.escalation.global')}</Tag>
        ),
    },
    {
      title: t('pages.monitor.escalation.column.scope'),
      dataIndex: 'global',
      hideInTable: true,
      valueEnum: {
        true: { text: t('pages.monitor.escalation.scope.global') },
        false: { text: t('pages.monitor.escalation.scope.group') },
      },
    },
    {
      title: t('pages.monitor.escalation.form.mode'),
      dataIndex: 'mode',
      valueEnum: modeEnum,
      search: false,
      width: 90,
      render: (_, record) =>
        record.spec.mode ? (
          <Tag color={record.spec.mode === 2 ? 'volcano' : 'blue'}>
            {modeText(record.spec.mode)}
          </Tag>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.monitor.escalation.form.minSeverity'),
      dataIndex: 'minSeverity',
      search: false,
      width: 100,
      render: (_, record) => <SeverityTag severity={record.spec.minSeverity} />,
    },
    {
      title: t('pages.monitor.escalation.column.levels'),
      dataIndex: 'levels',
      search: false,
      render: (_, record) =>
        (record.spec.levels ?? []).map((level, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 各级无稳定标识，只读展示
          <div key={index} className={own.summaryLevel}>
            <span>
              {t(`pages.monitor.escalation.summary.trigger.${level.trigger}`, {
                n: level.afterM,
              })}
              {' →'}
            </span>
            <RefTags
              refs={levelTargets(level, record.levelRefs?.[index])}
              max={4}
            />
            <span className={styles.hint}>{repeatText(level)}</span>
          </div>
        )),
    },
    {
      title: t('pages.monitor.escalation.column.estimate'),
      dataIndex: 'estimate',
      search: false,
      width: 130,
      tooltip: t('pages.monitor.escalation.column.estimate.tooltip'),
      render: (_, record) => {
        if (!record.estimate) return t('common.empty');
        const total = record.estimate.total ?? 0;
        return (
          <span
            className={
              total > ESCALATION_LIMITS.estimateWarn ? own.warn : undefined
            }
          >
            {t('pages.monitor.escalation.times', { n: total })}
          </span>
        );
      },
    },
    {
      title: t('pages.monitor.escalation.column.ruleCount'),
      dataIndex: 'ruleCount',
      search: false,
      width: 100,
      render: (_, record) => {
        const count = record.ruleCount ?? 0;
        // 引用规则的明细来自规则列表接口：没有告警规则菜单的用户只看数量
        return count > 0 && access.canMonitorRule ? (
          <a
            onClick={() =>
              setRulesOf({ id: record.id, name: record.spec.name })
            }
          >
            {count}
          </a>
        ) : (
          count
        );
      },
    },
    {
      title: t('common.column.status'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
      renderText: (_, record) => String(record.spec.enabled ?? false),
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
        if (has('monitor.escalation.edit')) {
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
        if (has('monitor.escalation.delete')) {
          actions.push(
            manageable(record) ? (
              <DeleteConfirmLink
                key="delete"
                title={t('pages.monitor.escalation.delete.title', {
                  name: record.spec.name,
                })}
                description={t('pages.monitor.escalation.delete.description')}
                onConfirm={async () => {
                  try {
                    await deleteEscalation(record.id);
                  } catch {
                    // 多为仍被规则引用（MONITOR_ESCALATION_IN_USE）：提示已由请求层给出，
                    // 这里接住，避免确认弹窗把拒绝抛成未处理的异常
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
    <RouteTabsPage tabs={NOTICE_TABS}>
      <ProTable<MonitorEscalation>
        cardBordered
        headerTitle={
          canCreate && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.monitor.escalation.create.title')}
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
          const result = await listEscalations({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            groupId: params.groupId || undefined,
            global: parseBoolParam(params.global),
            enabled: parseBoolParam(params.enabled),
          });
          return toTableResult(result);
        }}
      />
      {formRow !== undefined && (
        <EscalationDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          groups={groups}
          isAdmin={isAdmin}
          onClose={() => setFormRow(undefined)}
          onSaved={reload}
        />
      )}
      <RulesModal escalation={rulesOf} onClose={() => setRulesOf(null)} />
    </RouteTabsPage>
  );
};

export default EscalationList;
