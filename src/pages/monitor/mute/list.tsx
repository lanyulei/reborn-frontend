/**
 * 屏蔽规则（降噪规则页的页签，外层 PageContainer 由 Tab 容器提供）：在一段时间内屏蔽命中条件的告警（只屏蔽通知，或连事件一并不产生）。
 * 元素权限决定操作是否展示；编辑、删除另要求对作用分组「可管理」（canManage）。
 * 已结束的规则置灰并标记，可按「当前状态」筛出后清理。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { ENABLED_META } from '@/constants';
import { deleteMute, listMutes } from '@/services/monitor/mute';
import type {
  MonitorMute,
  MonitorMuteMode,
  MonitorMuteState,
} from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useEnumText, useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { formatTime } from '../components/format';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import { useDatasourceOptions, useRuleGroups } from '../components/hooks';
import { MatcherTags } from '../components/MatchersEditor';
import {
  MONITOR_LIMITS,
  MUTE_MODE_META,
  MUTE_STATE_META,
} from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { useWindowText } from '../components/TimeWindowsEditor';
import { ManageLink, RefTags, SeverityTag } from '../components/tags';
import { MuteDrawer } from './MuteDrawer';

const MuteList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const { styles } = useMonitorStyles();
  const { groups, isAdmin } = useRuleGroups();
  const datasources = useDatasourceOptions();
  const enabledEnum = useValueEnum(ENABLED_META);
  const modeEnum = useValueEnum(MUTE_MODE_META);
  const stateEnum = useValueEnum(MUTE_STATE_META);
  const modeText = useEnumText(MUTE_MODE_META);
  const windowText = useWindowText();

  // undefined = 抽屉关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<MonitorMute | null | undefined>(
    undefined,
  );

  const reload = () => actionRef.current?.reload();
  const hasAnyAction = has('monitor.mute.edit') || has('monitor.mute.delete');
  // 新建要落在某个可管理的分组上（作用于全部分组仅超级管理员）：没有可管理的分组就不提供入口
  const canCreate =
    has('monitor.mute.create') &&
    (isAdmin || groups.some((group) => (group.level ?? 0) >= 2));

  const timeText = (record: MonitorMute) => {
    const { spec } = record;
    if (spec.timeType === 2) {
      // 时间窗允许重复配置，文字相同：重复项的键带出现次数去重
      const seen = new Map<string, number>();
      const windows = (spec.periodic?.windows ?? []).map((window) => {
        const text = windowText(window);
        const count = (seen.get(text) ?? 0) + 1;
        seen.set(text, count);
        return { key: count > 1 ? `${text}#${count}` : text, text };
      });
      return (
        <div>
          {windows.map((item) => (
            <div key={item.key}>{item.text}</div>
          ))}
          <div className={styles.hint}>
            {spec.periodic?.timezone || 'UTC'}
            {(spec.startTime || spec.endTime) &&
              ` · ${formatTime(spec.startTime) || t('pages.monitor.mute.time.open')} ~ ${
                formatTime(spec.endTime) || t('pages.monitor.mute.time.open')
              }`}
          </div>
        </div>
      );
    }
    return (
      <div>
        <div>{formatTime(spec.startTime)}</div>
        <div>~ {formatTime(spec.endTime)}</div>
      </div>
    );
  };

  const columns: ProColumns<MonitorMute>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.monitor.mute.search.placeholder'),
        maxLength: MONITOR_LIMITS.keywordMax,
      },
    },
    {
      title: t('pages.monitor.common.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      render: (_, record) => (
        <span title={record.spec.reason}>{record.spec.name}</span>
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
      title: t('pages.monitor.mute.form.mode'),
      dataIndex: 'mode',
      valueEnum: modeEnum,
      width: 120,
      render: (_, record) => (
        <Tag color={record.spec.mode === 2 ? 'volcano' : 'blue'}>
          {modeText(record.spec.mode)}
        </Tag>
      ),
    },
    {
      title: t('pages.monitor.mute.column.conditions'),
      dataIndex: 'conditions',
      search: false,
      render: (_, record) => {
        const { spec } = record;
        const empty =
          !spec.ruleIds?.length &&
          !spec.datasourceIds?.length &&
          !spec.severities?.length &&
          !spec.matchers?.length;
        if (empty) return t('pages.monitor.common.unlimited');
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {!!spec.severities?.length && (
              <span>
                {spec.severities.map((severity) => (
                  <span key={severity} style={{ marginInlineEnd: 4 }}>
                    <SeverityTag severity={severity} />
                  </span>
                ))}
              </span>
            )}
            {!!record.rules?.length && <RefTags refs={record.rules} max={2} />}
            {!!record.datasources?.length && (
              <RefTags refs={record.datasources} max={2} />
            )}
            {!!spec.matchers?.length && (
              <MatcherTags matchers={spec.matchers} />
            )}
          </div>
        );
      },
    },
    {
      title: t('pages.monitor.mute.column.time'),
      dataIndex: 'time',
      search: false,
      render: (_, record) => timeText(record),
    },
    {
      title: t('pages.monitor.mute.column.state'),
      dataIndex: 'state',
      valueEnum: stateEnum,
      width: 100,
    },
    {
      title: t('common.column.status'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      hideInTable: true,
    },
    {
      title: t('pages.monitor.mute.column.mutedCount'),
      dataIndex: 'mutedCount',
      search: false,
      width: 110,
      tooltip: t('pages.monitor.mute.column.mutedCount.tooltip'),
      renderText: (value?: number) => value ?? 0,
    },
    {
      title: t('pages.monitor.mute.form.reason'),
      dataIndex: ['spec', 'reason'],
      search: false,
      ellipsis: true,
      width: 200,
    },
    {
      title: t('pages.monitor.common.creator'),
      dataIndex: 'createUserName',
      search: false,
      width: 110,
      renderText: (value?: string) => value || t('common.empty'),
    },
    {
      title: t('common.column.updateTime'),
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 120,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('monitor.mute.edit')) {
          actions.push(
            <ManageLink
              key="edit"
              canManage={record.canManage}
              onClick={() => setFormRow(record)}
            >
              {t('common.action.edit')}
            </ManageLink>,
          );
        }
        if (has('monitor.mute.delete')) {
          actions.push(
            record.canManage ? (
              <DeleteConfirmLink
                key="delete"
                title={t('pages.monitor.mute.delete.title', {
                  name: record.spec.name,
                })}
                description={t('pages.monitor.mute.delete.description')}
                onConfirm={async () => {
                  await deleteMute(record.id);
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
      <ProTable<MonitorMute>
        cardBordered
        headerTitle={
          canCreate && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.monitor.mute.create.title')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        columnEmptyText={t('common.empty')}
        scroll={{ x: 'max-content' }}
        // 已结束的屏蔽规则整行置灰
        rowClassName={(record) =>
          record.state === 'expired' ? styles.expired : ''
        }
        request={async (params) => {
          const result = await listMutes({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            groupId: params.groupId || undefined,
            enabled: parseBoolParam(params.enabled),
            mode: params.mode
              ? (Number(params.mode) as MonitorMuteMode)
              : undefined,
            state: (params.state as MonitorMuteState) || undefined,
          });
          return toTableResult(result);
        }}
      />
      {formRow !== undefined && (
        <MuteDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          groups={groups}
          isAdmin={isAdmin}
          datasources={datasources}
          onClose={() => setFormRow(undefined)}
          onSaved={reload}
        />
      )}
    </>
  );
};

export default MuteList;
