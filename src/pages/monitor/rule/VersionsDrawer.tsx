/**
 * 规则变更历史抽屉：版本列表（操作、说明、操作人、时间）→ 查看某个版本的快照、勾选两个
 * 版本逐字段对比、回滚到某个版本（回滚本身记为一个新版本，不改写历史）。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Checkbox, Drawer, Empty, Modal, Spin, Tag } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmLink } from '@/components/TableActions';
import {
  getRule,
  getRuleVersion,
  listRuleVersions,
  rollbackRule,
} from '@/services/monitor/rule';
import type { MonitorRule, RuleVersion } from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import {
  type DatasourceOptionsState,
  useNotifyTargets,
} from '../components/hooks';
import { VERSION_ACTION_META } from '../components/meta';
import { useWindowText } from '../components/TimeWindowsEditor';
import { type SpecField, specFields } from './specFields';

const useStyles = createStyles(({ token, css }) => ({
  table: css`
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    th {
      padding: 8px 12px;
      color: ${token.colorTextTertiary};
      font-weight: 500;
      text-align: start;
      border-bottom: 1px solid ${token.colorSplit};
    }
    td {
      padding: 8px 12px;
      vertical-align: top;
      white-space: pre-wrap;
      word-break: break-word;
      border-bottom: 1px solid ${token.colorSplit};
    }
  `,
  field: css`
    width: 150px;
    color: ${token.colorText};
    font-weight: 500;
  `,
  code: css`
    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSizeSM}px;
  `,
  removed: css`
    background: ${token.colorErrorBg};
  `,
  added: css`
    background: ${token.colorSuccessBg};
  `,
  unchanged: css`
    color: ${token.colorTextTertiary};
  `,
}));

/** 一个或两个版本的字段表：两个版本时标出有差异的字段 */
const SpecTable: React.FC<{
  left: { title: string; fields: SpecField[] };
  right?: { title: string; fields: SpecField[] };
  onlyChanged?: boolean;
}> = ({ left, right, onlyChanged }) => {
  const t = useT();
  const { styles, cx } = useStyles();
  const rightByKey = new Map(right?.fields.map((field) => [field.key, field]));
  const rows = left.fields
    .map((field) => {
      const other = rightByKey.get(field.key);
      return { field, other, changed: !!right && other?.value !== field.value };
    })
    .filter((row) => !onlyChanged || row.changed);

  if (rows.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('pages.monitor.rule.version.same')}
      />
    );
  }
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.field}>
            {t('pages.monitor.rule.version.field')}
          </th>
          <th>{left.title}</th>
          {right && <th>{right.title}</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ field, other, changed }) => (
          <tr key={field.key}>
            <td className={styles.field}>{field.label}</td>
            <td
              className={cx(
                field.code && styles.code,
                right && (changed ? styles.removed : styles.unchanged),
              )}
            >
              {field.value || t('common.empty')}
            </td>
            {right && (
              <td
                className={cx(
                  field.code && styles.code,
                  changed ? styles.added : styles.unchanged,
                )}
              >
                {other?.value || t('common.empty')}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const VersionsDrawer: React.FC<{
  rule: MonitorRule;
  /** 全部数据源选项（页面取一次下传；快照里的数据源 ID → 名称） */
  datasources: DatasourceOptionsState;
  /** 能否回滚（编辑权限 + 对所在分组可管理） */
  canRollback: boolean;
  onClose: () => void;
  /** 回滚成功后调用：刷新规则列表 */
  onChanged: () => void;
}> = ({ rule, datasources, canRollback, onClose, onChanged }) => {
  const t = useT();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const windowText = useWindowText();
  const has = usePermissions();
  // 快照里的值班表 / 部门 ID → 名称：候选接口随编辑权限开放，没有时不请求（显示当前规则已知的名称或 ID）
  const targets = useNotifyTargets(has('monitor.rule.edit'));
  // 回滚要带当前版本号（乐观锁）；回滚后以返回的新版本号为准
  const [current, setCurrent] = useState(rule);
  const [selected, setSelected] = useState<number[]>([]);
  // 查看（一个版本）或对比（两个版本，旧 → 新）
  const [viewing, setViewing] = useState<number[] | null>(null);
  const [loaded, setLoaded] = useState<RuleVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlyChanged, setOnlyChanged] = useState(true);

  // 列表行不带通知对象的显示名：取一次详情补全 ID → 名称
  useEffect(() => {
    getRule(rule.id)
      .then((result) => setCurrent(result.rule))
      .catch(() => undefined);
  }, [rule.id]);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of datasources.items) map.set(item.id, item.name);
    for (const dept of targets.depts) map.set(dept.id, dept.name);
    for (const option of targets.scheduleOptions) {
      map.set(option.value, option.label);
    }
    for (const ref of [
      ...(current.datasources ?? []),
      ...(current.notifyUsers ?? []),
      ...(current.notifySchedules ?? []),
      ...(current.notifyDepts ?? []),
      // 升级策略 / 工单模板 / 流程 / 代理用户：未引用时为 null
      current.escalation,
      current.ticketTemplate,
      current.ticketAgent,
      current.workflowDefinition,
      current.workflowAgent,
    ]) {
      if (ref?.id && ref.name) map.set(ref.id, ref.name);
    }
    return map;
  }, [datasources.items, targets, current]);

  // 只采纳最后一次打开的结果：连续点开不同版本（或中途关闭）时，先发出的请求后返回也不会覆盖
  const openSeq = useRef(0);
  const open = async (versions: number[]) => {
    const current = ++openSeq.current;
    const ordered = [...versions].sort((a, b) => a - b);
    setViewing(ordered);
    setLoaded([]);
    setLoading(true);
    try {
      const results = await Promise.all(
        ordered.map((version) => getRuleVersion(rule.id, version)),
      );
      if (current !== openSeq.current) return;
      setLoaded(results.map((result) => result.version));
    } catch {
      if (current === openSeq.current) setViewing(null);
    } finally {
      if (current === openSeq.current) setLoading(false);
    }
  };
  const closeViewing = () => {
    openSeq.current++;
    setViewing(null);
    setLoading(false);
  };

  const toFields = (version: RuleVersion) => ({
    title: t('pages.monitor.rule.version.title', { version: version.version }),
    fields: specFields(version.spec, {
      t,
      groupName: version.groupName,
      names,
      windowText,
    }),
  });

  const columns: ProColumns<RuleVersion>[] = [
    {
      title: t('pages.monitor.rule.version.column.version'),
      dataIndex: 'version',
      width: 110,
      render: (_, record) => (
        <>
          v{record.version}
          {record.version === current.version && (
            <Tag color="blue" style={{ marginInlineStart: 8 }}>
              {t('pages.monitor.rule.version.current')}
            </Tag>
          )}
        </>
      ),
    },
    {
      title: t('pages.monitor.rule.version.column.action'),
      dataIndex: 'action',
      width: 100,
      render: (_, record) =>
        record.action && VERSION_ACTION_META[record.action]
          ? t(VERSION_ACTION_META[record.action].textId)
          : record.action || t('common.empty'),
    },
    {
      title: t('pages.monitor.rule.form.summary'),
      dataIndex: 'summary',
      ellipsis: true,
      renderText: (value?: string) => value || t('common.empty'),
    },
    {
      title: t('pages.monitor.rule.version.column.operator'),
      dataIndex: 'operatorName',
      width: 120,
      renderText: (value?: string) => value || t('common.empty'),
    },
    {
      title: t('pages.monitor.rule.version.column.time'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 170,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 120,
      render: (_, record) => {
        const actions: React.ReactNode[] = [
          <a key="view" onClick={() => void open([record.version])}>
            {t('common.action.view')}
          </a>,
        ];
        if (canRollback && record.version !== current.version) {
          actions.push(
            <ConfirmLink
              key="rollback"
              danger
              title={t('pages.monitor.rule.version.rollback.title', {
                version: record.version,
              })}
              description={t('pages.monitor.rule.version.rollback.description')}
              onConfirm={async () => {
                const result = await rollbackRule(rule.id, {
                  version: record.version,
                  currentVersion: current.version,
                });
                setCurrent(result.rule);
                message.success(t('pages.monitor.rule.version.rollback.done'));
                actionRef.current?.reload();
                onChanged();
              }}
            >
              {t('pages.monitor.rule.version.rollback')}
            </ConfirmLink>,
          );
        }
        return actions;
      },
    },
  ];

  return (
    <Drawer
      title={t('pages.monitor.rule.version.drawer', { name: rule.spec.name })}
      size={960}
      open
      destroyOnHidden
      onClose={onClose}
    >
      <ProTable<RuleVersion>
        rowKey="version"
        actionRef={actionRef}
        search={false}
        options={false}
        columns={columns}
        columnEmptyText={t('common.empty')}
        headerTitle={
          <Button
            disabled={selected.length !== 2}
            onClick={() => void open(selected)}
          >
            {t('pages.monitor.rule.version.compare')}
          </Button>
        }
        rowSelection={{
          selectedRowKeys: selected,
          hideSelectAll: true,
          // 只能勾两个：已满两个时其余行不可再勾
          getCheckboxProps: (record) => ({
            disabled:
              selected.length >= 2 && !selected.includes(record.version),
          }),
          onChange: (keys) => setSelected(keys as number[]),
        }}
        tableAlertRender={false}
        pagination={{ defaultPageSize: 10 }}
        request={async (params) =>
          toTableResult(
            await listRuleVersions(rule.id, {
              page: params.current,
              pageSize: params.pageSize,
            }),
          )
        }
      />

      <Modal
        title={
          viewing?.length === 2
            ? t('pages.monitor.rule.version.compare.title', {
                from: viewing[0],
                to: viewing[1],
              })
            : t('pages.monitor.rule.version.title', {
                version: viewing?.[0] ?? '',
              })
        }
        open={viewing !== null}
        width={viewing?.length === 2 ? 1080 : 720}
        footer={null}
        destroyOnHidden
        onCancel={closeViewing}
      >
        <Spin spinning={loading}>
          {viewing?.length === 2 && (
            <Checkbox
              checked={onlyChanged}
              onChange={(e) => setOnlyChanged(e.target.checked)}
              style={{ marginBottom: 12 }}
            >
              {t('pages.monitor.rule.version.onlyChanged')}
            </Checkbox>
          )}
          {loaded.length > 0 && (
            <SpecTable
              left={toFields(loaded[0])}
              right={loaded[1] ? toFields(loaded[1]) : undefined}
              onlyChanged={loaded.length === 2 && onlyChanged}
            />
          )}
        </Spin>
      </Modal>
    </Drawer>
  );
};

export default VersionsDrawer;
