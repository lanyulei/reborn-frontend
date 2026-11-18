/**
 * 数据源管理：登记 Prometheus 兼容时序库的查询地址（只记「在哪、怎么连」）。列表展示引擎
 * 探活的健康状态与最近失败原因；表单内可对尚未保存的配置「测试连接」。凭据只写不读。
 * 数据源是全局资源：仍被规则指定使用时不可删除（范围为「全局」的规则不算引用）。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Badge, Tag, Tooltip } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { ENABLED_META } from '@/constants';
import {
  deleteDatasource,
  listDatasources,
  testDatasource,
} from '@/services/monitor/datasource';
import { upstreamErrorText } from '@/services/monitor/errorText';
import {
  getErrorReason,
  getMonitorErrorMessage,
} from '@/services/monitor/request';
import type {
  MonitorDatasource,
  MonitorHealthStatus,
} from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useEnumText, useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { METRIC_TABS } from '../components/groups';
import {
  AUTH_TYPE_META,
  HEALTH_STATUS_META,
  MONITOR_LIMITS,
} from '../components/meta';
import { DatasourceDrawer } from './DatasourceDrawer';

const HEALTH_BADGE: Record<
  MonitorHealthStatus,
  'default' | 'success' | 'error'
> = { 0: 'default', 1: 'success', 2: 'error' };
const DatasourceList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const enabledEnum = useValueEnum(ENABLED_META);
  const healthEnum = useValueEnum(HEALTH_STATUS_META);
  const healthText = useEnumText(HEALTH_STATUS_META);
  const authText = useEnumText(AUTH_TYPE_META);

  // undefined = 抽屉关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<MonitorDatasource | null | undefined>(
    undefined,
  );
  const [testingId, setTestingId] = useState<string>();

  const reload = () => actionRef.current?.reload();
  const hasAnyAction =
    has('monitor.datasource.edit') ||
    has('monitor.datasource.delete') ||
    has('monitor.datasource.test');

  const runTest = async (record: MonitorDatasource) => {
    setTestingId(record.id);
    try {
      const result = await testDatasource(record.id);
      if (result.ok) {
        message.success(
          t('pages.monitor.datasource.test.ok', { ms: result.latencyMs ?? 0 }),
        );
      } else {
        modal.error({
          title: t('pages.monitor.datasource.test.failed', {
            ms: result.latencyMs ?? 0,
          }),
          content: upstreamErrorText(result.error),
        });
      }
      // 测试结果会写入健康状态
      reload();
    } catch {
      // 已由请求层提示
    } finally {
      setTestingId(undefined);
    }
  };

  const remove = async (record: MonitorDatasource) => {
    try {
      await deleteDatasource(record.id);
    } catch (error) {
      // 仍被规则指定使用：单独弹窗说清原因，而不是一闪而过的提示
      if (getErrorReason(error) === 'MONITOR_DATASOURCE_IN_USE') {
        modal.error({
          title: t('pages.monitor.datasource.delete.inUse.title'),
          content: (
            <>
              <div>{getMonitorErrorMessage(error)}</div>
              <div>{t('pages.monitor.datasource.delete.inUse.hint')}</div>
            </>
          ),
        });
      } else {
        message.error(getMonitorErrorMessage(error));
      }
      return;
    }
    message.success(t('common.msg.deleted'));
    reload();
  };

  const columns: ProColumns<MonitorDatasource>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.monitor.datasource.search.placeholder'),
        maxLength: MONITOR_LIMITS.datasourceNameMax,
      },
    },
    {
      title: t('pages.monitor.datasource.column.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      render: (_, record) => (
        <>
          <span title={record.spec.description || undefined}>
            {record.spec.name}
          </span>
          {record.spec.isDefault && (
            <Tag color="blue" style={{ marginInlineStart: 8 }}>
              {t('pages.monitor.datasource.default')}
            </Tag>
          )}
        </>
      ),
    },
    {
      title: t('pages.monitor.datasource.column.url'),
      dataIndex: ['spec', 'connection', 'url'],
      search: false,
      copyable: true,
      ellipsis: true,
    },
    {
      title: t('pages.monitor.datasource.column.authType'),
      dataIndex: ['spec', 'connection', 'authType'],
      search: false,
      width: 100,
      render: (_, record) => authText(record.spec.connection?.authType ?? 1),
    },
    {
      title: t('pages.monitor.datasource.column.health'),
      dataIndex: 'healthStatus',
      valueEnum: healthEnum,
      width: 220,
      render: (_, record) => {
        const status = record.healthStatus ?? 0;
        return (
          <div>
            <Badge status={HEALTH_BADGE[status]} text={healthText(status)} />
            {status === 2 && record.healthError && (
              <Tooltip title={upstreamErrorText(record.healthError)}>
                <div
                  style={{
                    maxWidth: 260,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {upstreamErrorText(record.healthError)}
                </div>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: t('pages.monitor.datasource.column.healthTime'),
      dataIndex: 'healthTime',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    {
      title: t('pages.monitor.datasource.column.ruleCount'),
      dataIndex: 'ruleCount',
      search: false,
      width: 100,
      tooltip: t('pages.monitor.datasource.column.ruleCount.tooltip'),
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
      width: 180,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('monitor.datasource.edit')) {
          actions.push(
            <a key="edit" onClick={() => setFormRow(record)}>
              {t('common.action.edit')}
            </a>,
          );
        }
        if (has('monitor.datasource.test')) {
          actions.push(
            testingId === record.id ? (
              <span key="test">{t('pages.monitor.datasource.testing')}</span>
            ) : (
              <a key="test" onClick={() => void runTest(record)}>
                {t('pages.monitor.datasource.test')}
              </a>
            ),
          );
        }
        if (has('monitor.datasource.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.monitor.datasource.delete.title', {
                name: record.spec.name,
              })}
              description={t('pages.monitor.datasource.delete.description')}
              onConfirm={() => remove(record)}
            />,
          );
        }
        return actions;
      },
    },
  ];

  return (
    <RouteTabsPage tabs={METRIC_TABS}>
      <ProTable<MonitorDatasource>
        cardBordered
        headerTitle={
          has('monitor.datasource.create') && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.monitor.datasource.create.title')}
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
          const result = await listDatasources({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            enabled: parseBoolParam(params.enabled),
            healthStatus:
              params.healthStatus === undefined || params.healthStatus === ''
                ? undefined
                : (Number(params.healthStatus) as MonitorHealthStatus),
          });
          return toTableResult(result);
        }}
      />
      {formRow !== undefined && (
        <DatasourceDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={reload}
        />
      )}
    </RouteTabsPage>
  );
};

export default DatasourceList;
