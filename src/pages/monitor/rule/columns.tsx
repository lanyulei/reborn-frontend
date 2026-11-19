/**
 * 告警规则列表的列定义（搜索项 + 表格列 + 操作列）。操作只负责把点击交回页面（actions），
 * 弹窗 / 抽屉的状态都在页面里。
 */
import { DownOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { history, useAccess } from '@umijs/max';
import { Badge, Dropdown, type MenuProps, Space, Tag, Tooltip } from 'antd';
import type React from 'react';
import { ENABLED_META, NOTIFY_SEVERITY_META } from '@/constants';
import {
  isIncompleteResult,
  upstreamErrorText,
} from '@/services/monitor/errorText';
import type {
  MonitorEvalStatus,
  MonitorRule,
} from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useEnumText, useT, useValueEnum } from '@/utils/i18n';
import { formatTime } from '../components/format';
import { labelFilterSearch } from '../components/LabelFilter';
import { EVAL_STATUS_META, MONITOR_LIMITS } from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import {
  LabelTags,
  ManageLink,
  RefTags,
  SeverityTag,
} from '../components/tags';

const STATUS_BADGE = {
  Success: 'success',
  Error: 'error',
  Warning: 'warning',
  Default: 'default',
  Processing: 'processing',
} as const;

export interface RuleRowActions {
  /** 点规则名 / 「编辑」：打开规则抽屉（能否编辑由页面按权限决定） */
  onOpen: (rule: MonitorRule) => void;
  onToggle: (rule: MonitorRule) => void;
  onClone: (rule: MonitorRule) => void;
  onMove: (rule: MonitorRule) => void;
  onVersions: (rule: MonitorRule) => void;
  onEval: (rule: MonitorRule) => void;
  onRemove: (rule: MonitorRule) => void;
}

export const useRuleColumns = ({
  datasourceOptions,
  canEdit,
  canClone,
  actions,
}: {
  datasourceOptions: { value: string; label: string }[];
  /** 有「编辑规则」元素权限（逐行另看 canManage） */
  canEdit: boolean;
  /** 有「新建规则」元素权限且至少有一个可管理的分组 */
  canClone: boolean;
  actions: RuleRowActions;
}): ProColumns<MonitorRule>[] => {
  const t = useT();
  const has = usePermissions();
  const access = useAccess();
  const { styles } = useMonitorStyles();
  const enabledEnum = useValueEnum(ENABLED_META);
  const severityEnum = useValueEnum(NOTIFY_SEVERITY_META);
  const statusEnum = useValueEnum(EVAL_STATUS_META);
  const statusText = useEnumText(EVAL_STATUS_META);

  return [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.monitor.rule.search.placeholder'),
        maxLength: MONITOR_LIMITS.keywordMax,
      },
    },
    {
      title: t('pages.monitor.rule.column.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      fixed: 'left',
      render: (_, record) => (
        <div style={{ maxWidth: 240 }}>
          <a onClick={() => actions.onOpen(record)}>{record.spec.name}</a>
          <div className={styles.hint}>{record.groupName}</div>
        </div>
      ),
    },
    // 启停状态紧跟名称（同资源实例列表）：表格放不下而横向滚动时，它不会被右侧固定的操作列挡住
    {
      title: t('common.column.status'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
      renderText: (_, record) => String(record.spec.enabled ?? false),
    },
    {
      title: t('pages.monitor.alert.column.severity'),
      dataIndex: 'severity',
      valueType: 'select',
      valueEnum: severityEnum,
      width: 120,
      // 多档阈值：全部级别都显示（单行排开，不竖着叠）
      render: (_, record) => (
        <Space size={4}>
          {[...(record.spec.queries ?? [])]
            .sort((a, b) => b.severity - a.severity)
            .map((query) => (
              <Tooltip key={query.severity} title={query.expr}>
                <span>
                  <SeverityTag severity={query.severity} />
                </span>
              </Tooltip>
            ))}
        </Space>
      ),
    },
    {
      title: t('pages.monitor.rule.column.firing'),
      dataIndex: 'firing',
      width: 100,
      valueEnum: {
        true: { text: t('pages.monitor.rule.search.firing.yes') },
        false: { text: t('pages.monitor.rule.search.firing.no') },
      },
      render: (_, record) => {
        const count = record.firingCount ?? 0;
        // 0 不吸注意力：置灰弱化；有活跃告警才用链接强调
        if (count === 0) return <span className={styles.hint}>0</span>;
        return access.canMonitorAlert ? (
          <a
            onClick={() =>
              history.push(
                `/monitor/alert?ruleId=${record.id}&ruleName=${encodeURIComponent(record.spec.name)}`,
              )
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
      title: t('pages.monitor.rule.column.lastStatus'),
      dataIndex: 'lastStatus',
      valueEnum: statusEnum,
      width: 180,
      render: (_, record) => {
        const status = (record.status ?? 0) as MonitorEvalStatus;
        return (
          <div>
            <Tooltip title={upstreamErrorText(record.lastError) || undefined}>
              <Badge
                status={
                  STATUS_BADGE[EVAL_STATUS_META[status]?.status ?? 'Default']
                }
                text={statusText(status)}
              />
              {isIncompleteResult(record.lastError, status) && (
                <Tag color="warning" style={{ marginInlineStart: 8 }}>
                  {t('pages.monitor.rule.eval.incomplete')}
                </Tag>
              )}
            </Tooltip>
            {record.lastEvalTime && (
              <div className={styles.hint}>
                {formatTime(record.lastEvalTime)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: t('pages.monitor.common.datasource'),
      dataIndex: 'datasourceId',
      valueType: 'select',
      fieldProps: { options: datasourceOptions, showSearch: true },
      render: (_, record) =>
        record.spec.datasourceScope === 2 ? (
          <Tag color="purple">{t('enum.monitor.datasourceScope.2')}</Tag>
        ) : (
          <RefTags refs={record.datasources} max={2} />
        ),
    },
    {
      title: t('pages.monitor.rule.column.timing'),
      dataIndex: 'timing',
      search: false,
      width: 120,
      tooltip: t('pages.monitor.rule.column.timing.tooltip'),
      render: (_, record) =>
        `${record.spec.evalIntervalS}s / ${record.spec.forS ?? 0}s`,
    },
    {
      title: t('pages.monitor.rule.form.labels'),
      dataIndex: 'labels',
      tooltip: t('pages.monitor.rule.search.labels.tooltip'),
      ...labelFilterSearch<MonitorRule>(t, 'team=infra'),
      render: (_, record) => <LabelTags labels={record.spec.labels} max={2} />,
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
      width: 170,
      render: (_, record) => {
        const manage = record.canManage === true;
        const links: React.ReactNode[] = [];
        if (canEdit) {
          links.push(
            <ManageLink
              key="edit"
              canManage={manage}
              onClick={() => actions.onOpen(record)}
            >
              {t('common.action.edit')}
            </ManageLink>,
          );
        }
        if (has('monitor.rule.toggle')) {
          links.push(
            <ManageLink
              key="toggle"
              canManage={manage}
              onClick={() => actions.onToggle(record)}
            >
              {record.spec.enabled
                ? t('pages.monitor.action.disable')
                : t('pages.monitor.action.enable')}
            </ManageLink>,
          );
        }
        const items: NonNullable<MenuProps['items']> = [];
        // 克隆是在目标分组里新建：只要有可管理的分组即可
        if (canClone) {
          items.push({
            key: 'clone',
            label: t('pages.monitor.rule.action.clone'),
            onClick: () => actions.onClone(record),
          });
        }
        if (canEdit && manage) {
          items.push({
            key: 'move',
            label: t('pages.monitor.rule.action.move'),
            onClick: () => actions.onMove(record),
          });
        }
        items.push(
          {
            key: 'versions',
            label: t('pages.monitor.rule.action.versions'),
            onClick: () => actions.onVersions(record),
          },
          {
            key: 'eval',
            label: t('pages.monitor.rule.action.evalRecords'),
            onClick: () => actions.onEval(record),
          },
        );
        if (has('monitor.rule.delete') && manage) {
          items.push(
            { type: 'divider' },
            {
              key: 'delete',
              danger: true,
              label: t('common.action.delete'),
              onClick: () => actions.onRemove(record),
            },
          );
        }
        links.push(
          <Dropdown key="more" menu={{ items }}>
            <a>
              {t('common.action.more')} <DownOutlined />
            </a>
          </Dropdown>,
        );
        return links;
      },
    },
  ];
};
