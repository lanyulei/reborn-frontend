/**
 * 告警规则：左侧规则分组树（按数据范围只显示可访问的分组），右侧规则列表。
 * 元素权限决定操作是否展示；修改类操作另要求对规则所在分组「可管理」（canManage），否则置灰。
 * 单条：编辑 / 启停 / 克隆 / 移动 / 变更历史 / 判定记录 / 删除；多选后批量操作并给出逐条结果；
 * 导入 Prometheus / vmalert YAML 或本系统的 JSON，导出 YAML（对外交换）或 JSON（完整内容，可再导入）。
 */
import {
  DownloadOutlined,
  DownOutlined,
  FileTextOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProFormInstance } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import { App, Button, Dropdown, type MenuProps, Space } from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { CreateButton } from '@/components/TableActions';
import {
  deleteRule,
  type ExportRulesFormat,
  exportRules,
  getRule,
  listRules,
  toggleRule,
} from '@/services/monitor/rule';
import type {
  MonitorEvalStatus,
  MonitorRule,
  MonitorSeverity,
  RuleBatchAction,
} from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { saveBlob } from '@/utils/download';
import { useT } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { parseLabelFilters } from '../components/format';
import { useDatasourceOptions, useRuleGroups } from '../components/hooks';
import {
  BATCH_ACTION_META,
  BATCH_ACTION_ORDER,
  MONITOR_LIMITS,
} from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { BatchModal } from './BatchModal';
import { CloneModal } from './CloneModal';
import { useRuleColumns } from './columns';
import { EvalRecordsDrawer } from './EvalRecordsDrawer';
import { GroupPanel } from './GroupPanel';
import { ImportModal } from './ImportModal';
import { RuleDrawer } from './RuleDrawer';
import { TemplateModal } from './TemplateModal';
import { VersionsDrawer } from './VersionsDrawer';

/** 批量操作各自需要的元素权限 */
const BATCH_PERMISSION: Record<
  RuleBatchAction,
  'monitor.rule.toggle' | 'monitor.rule.edit' | 'monitor.rule.delete'
> = {
  enable: 'monitor.rule.toggle',
  disable: 'monitor.rule.toggle',
  move: 'monitor.rule.edit',
  set_severity: 'monitor.rule.edit',
  set_timing: 'monitor.rule.edit',
  add_labels: 'monitor.rule.edit',
  remove_labels: 'monitor.rule.edit',
  set_notify: 'monitor.rule.edit',
  set_escalation: 'monitor.rule.edit',
  delete: 'monitor.rule.delete',
};

const RuleList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const { styles } = useMonitorStyles();
  const [searchParams, setSearchParams] = useSearchParams();
  const groupState = useRuleGroups();
  const { groups } = groupState;
  const datasources = useDatasourceOptions();

  const [groupId, setGroupId] = useState<string>();
  // undefined = 抽屉关闭；null = 新建；对象 = 编辑 / 查看
  const [formRow, setFormRow] = useState<MonitorRule | null | undefined>(
    undefined,
  );
  const [cloneRow, setCloneRow] = useState<MonitorRule | null>(null);
  const [versionsRow, setVersionsRow] = useState<MonitorRule | null>(null);
  const [evalRow, setEvalRow] = useState<MonitorRule | null>(null);
  const [batch, setBatch] = useState<{
    ids: string[];
    action: RuleBatchAction;
  } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<MonitorRule[]>([]);
  const selectedIds = selectedRows.map((row) => row.id);

  const reload = () => actionRef.current?.reload();
  /** 规则增删、移动会改变分组上的规则数 */
  const reloadAll = () => {
    reload();
    void groupState.reload();
  };
  /** 分组改名、删除后列表里的分组名也要跟着变 */
  const onGroupsChanged = async () => {
    reload();
    await groupState.reload();
  };

  // 告警详情按规则 ID 跳转过来（?ruleId=）：直接打开该规则；不存在或无权时由请求层提示
  const linkedRuleId = searchParams.get('ruleId');
  useEffect(() => {
    if (!linkedRuleId) return;
    let cancelled = false;
    getRule(linkedRuleId)
      .then((result) => {
        if (!cancelled) setFormRow(result.rule);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [linkedRuleId]);

  /** 关闭规则抽屉：从告警详情带 ?ruleId= 跳转过来的，把该参数从地址栏去掉（否则刷新又会打开） */
  const closeForm = () => {
    setFormRow(undefined);
    if (!searchParams.has('ruleId')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('ruleId');
    setSearchParams(next, { replace: true });
  };

  const manageableGroups = groups.filter((group) => (group.level ?? 0) >= 2);
  const selectedGroup = groups.find((group) => group.id === groupId);
  // 新建 / 导入时预选左侧选中的分组（须可管理）
  const defaultGroupId =
    (selectedGroup?.level ?? 0) >= 2 ? selectedGroup?.id : undefined;
  const canCreate = has('monitor.rule.create') && manageableGroups.length > 0;
  const canImport = has('monitor.rule.import') && manageableGroups.length > 0;
  const canEdit = has('monitor.rule.edit');

  /** 启停：停用是破坏性操作（活跃告警随之关闭，不发恢复通知），一律二次确认 */
  const toggle = (record: MonitorRule) => {
    const run = async (enabled: boolean) => {
      await toggleRule(record.id, enabled);
      message.success(t('common.msg.updated'));
      reload();
    };
    if (!record.spec.enabled) {
      void run(true).catch(() => undefined);
      return;
    }
    const firing = record.firingCount ?? 0;
    modal.confirm({
      title: t('pages.monitor.rule.disable.title', { name: record.spec.name }),
      content:
        firing > 0
          ? t('pages.monitor.rule.disable.firing', { count: firing })
          : t('pages.monitor.rule.disable.description'),
      okButtonProps: { danger: true },
      onOk: () => run(false),
    });
  };

  const remove = (record: MonitorRule) =>
    modal.confirm({
      title: t('pages.monitor.rule.delete.title', { name: record.spec.name }),
      content: t('pages.monitor.rule.delete.description'),
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteRule(record.id);
        message.success(t('common.msg.deleted'));
        setSelectedRows((rows) => rows.filter((row) => row.id !== record.id));
        reloadAll();
      },
    });

  /** 导出：选中了规则就导出选中的，否则导出左侧选中的分组（含下级）；内容与文件名由后端生成 */
  const onExport = async (format: ExportRulesFormat) => {
    if (selectedIds.length === 0 && !groupId) {
      message.warning(t('pages.monitor.rule.export.needScope'));
      return;
    }
    setExporting(true);
    try {
      const result = await exportRules({
        ...(selectedIds.length ? { ids: selectedIds } : { groupId }),
        format,
      });
      saveBlob(
        new Blob([result.content ?? ''], {
          type:
            format === 'json'
              ? 'application/json;charset=utf-8'
              : 'text/yaml;charset=utf-8',
        }),
        result.filename || `alert-rules.${format}`,
      );
      message.success(
        t('pages.monitor.rule.export.done', { count: result.count ?? 0 }),
      );
    } catch {
      // 已由请求层提示
    } finally {
      setExporting(false);
    }
  };

  const columns = useRuleColumns({
    datasourceOptions: datasources.options,
    canEdit,
    canClone: has('monitor.rule.create') && manageableGroups.length > 0,
    actions: {
      onOpen: setFormRow,
      onToggle: toggle,
      onClone: setCloneRow,
      onMove: (record) => setBatch({ ids: [record.id], action: 'move' }),
      onVersions: setVersionsRow,
      onEval: setEvalRow,
      onRemove: remove,
    },
  });

  const batchItems: NonNullable<MenuProps['items']> = BATCH_ACTION_ORDER.filter(
    (action) => has(BATCH_PERMISSION[action]),
  ).flatMap((action) => [
    ...(action === 'delete' ? [{ type: 'divider' as const }] : []),
    {
      key: action,
      danger: action === 'delete',
      label: t(BATCH_ACTION_META[action].textId),
      onClick: () => setBatch({ ids: selectedIds, action }),
    },
  ]);

  return (
    <PageContainer title={false}>
      <div className={styles.split}>
        <GroupPanel
          groups={groups}
          isAdmin={groupState.isAdmin}
          loading={groupState.loading}
          selectedId={groupId}
          onSelect={setGroupId}
          onChanged={onGroupsChanged}
        />
        <div className={styles.splitMain}>
          <ProTable<MonitorRule>
            cardBordered
            rowKey="id"
            actionRef={actionRef}
            formRef={formRef}
            search={{ labelWidth: 'auto' }}
            // 标签筛选项带校验：不合法时在表单项内提示并阻止查询
            form={{ ignoreRules: false }}
            columns={columns}
            columnEmptyText={t('common.empty')}
            scroll={{ x: 'max-content' }}
            params={{ groupId }}
            headerTitle={
              <Space size={8}>
                {canCreate && (
                  <CreateButton onClick={() => setFormRow(null)}>
                    {t('pages.monitor.rule.create.title')}
                  </CreateButton>
                )}
                {canImport && (
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => setImportOpen(true)}
                  >
                    {t('pages.monitor.rule.import.action')}
                  </Button>
                )}
                {/* 从模板创建最终走导入接口：与「导入」同一权限 */}
                {canImport && (
                  <Button
                    icon={<FileTextOutlined />}
                    onClick={() => setTemplateOpen(true)}
                  >
                    {t('pages.monitor.rule.template.action')}
                  </Button>
                )}
                {has('monitor.rule.export') && (
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'yaml',
                          label: t('pages.monitor.rule.export.yaml'),
                        },
                        {
                          key: 'json',
                          label: t('pages.monitor.rule.export.json'),
                        },
                      ],
                      onClick: ({ key }) =>
                        void onExport(key as ExportRulesFormat),
                    }}
                  >
                    <Button icon={<DownloadOutlined />} loading={exporting}>
                      {t('pages.monitor.rule.export.action')}
                    </Button>
                  </Dropdown>
                )}
              </Space>
            }
            rowSelection={{
              selectedRowKeys: selectedIds,
              // 跨页保留勾选
              preserveSelectedRowKeys: true,
              onChange: (_, rows) => {
                const picked = rows.filter(Boolean);
                // 批量操作一次至多 200 条：超出的不保留勾选，并说明（而不是悄悄丢掉）
                if (picked.length > MONITOR_LIMITS.batchMax) {
                  message.warning(
                    t('pages.monitor.rule.batch.limit', {
                      max: MONITOR_LIMITS.batchMax,
                    }),
                  );
                }
                setSelectedRows(picked.slice(0, MONITOR_LIMITS.batchMax));
              },
            }}
            tableAlertOptionRender={() => (
              <Space size={8}>
                {batchItems.length > 0 && (
                  <Dropdown menu={{ items: batchItems }}>
                    <Button type="link" size="small">
                      {t('pages.monitor.rule.batch.action')} <DownOutlined />
                    </Button>
                  </Dropdown>
                )}
                <Button
                  type="link"
                  size="small"
                  onClick={() => setSelectedRows([])}
                >
                  {t('pages.monitor.rule.batch.clear')}
                </Button>
              </Space>
            )}
            request={async (params) => {
              const labels = parseLabelFilters(params.labels as string[]);
              const result = await listRules({
                page: params.current,
                pageSize: params.pageSize,
                groupId: params.groupId || undefined,
                keyword: params.keyword || undefined,
                severity: params.severity
                  ? (Number(params.severity) as MonitorSeverity)
                  : undefined,
                datasourceId: params.datasourceId || undefined,
                enabled: parseBoolParam(params.enabled),
                firing: parseBoolParam(params.firing),
                lastStatus:
                  params.lastStatus === undefined || params.lastStatus === ''
                    ? undefined
                    : (Number(params.lastStatus) as MonitorEvalStatus),
                labels: labels.length ? labels : undefined,
              });
              return toTableResult(result);
            }}
          />
        </div>
      </div>

      {formRow !== undefined && (
        <RuleDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          defaultGroupId={defaultGroupId}
          groups={groups}
          datasources={datasources}
          readOnly={formRow !== null && !(canEdit && formRow.canManage)}
          onClose={closeForm}
          onSaved={reloadAll}
        />
      )}

      {cloneRow && (
        <CloneModal
          key={`clone-${cloneRow.id}`}
          rule={cloneRow}
          groups={groups}
          onClose={() => setCloneRow(null)}
          onDone={reloadAll}
        />
      )}

      {batch && (
        <BatchModal
          key={`${batch.action}-${batch.ids.length}`}
          ids={batch.ids}
          action={batch.action}
          groups={groups}
          ruleGroupIds={[
            ...new Set(
              selectedRows
                .filter((row) => batch.ids.includes(row.id))
                .map((row) => row.spec.groupId),
            ),
          ]}
          onClose={() => setBatch(null)}
          onDone={() => {
            if (batch.action === 'delete') setSelectedRows([]);
            reloadAll();
          }}
        />
      )}

      {importOpen && (
        <ImportModal
          groups={groups}
          datasources={datasources}
          defaultGroupId={defaultGroupId}
          onClose={() => setImportOpen(false)}
          onDone={reloadAll}
        />
      )}

      {templateOpen && (
        <TemplateModal
          groups={groups}
          datasources={datasources}
          defaultGroupId={defaultGroupId}
          onClose={() => setTemplateOpen(false)}
          onDone={reloadAll}
        />
      )}

      {versionsRow && (
        <VersionsDrawer
          key={versionsRow.id}
          rule={versionsRow}
          datasources={datasources}
          canRollback={canEdit && versionsRow.canManage === true}
          onClose={() => setVersionsRow(null)}
          onChanged={reload}
        />
      )}

      {evalRow && (
        <EvalRecordsDrawer
          key={evalRow.id}
          rule={evalRow}
          onClose={() => setEvalRow(null)}
        />
      )}
    </PageContainer>
  );
};

export default RuleList;
