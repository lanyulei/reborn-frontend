/**
 * 变更审计：实例变更（跨资源检索，字段级 diff，模型显示名称）
 * | 模型变更（分组 / 模型 / 字段 / 关系类型的结构变更，ListSchemaAudit）。
 * 表格行只出变更字段摘要，完整的字段级前后对比在展开行里。
 * 实例 diff 按行所属模型懒取字段定义（页内缓存），驱动字段名与取值渲染。
 */
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import dayjs from 'dayjs';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { listHistory } from '@/services/cmdb/ci';
import { listSchemaAudit } from '@/services/cmdb/insight';
import { getModel, listAllModels } from '@/services/cmdb/model';
import type {
  CmdbField,
  CmdbHistory,
  CmdbSchemaAudit,
  CmdbSchemaTargetType,
} from '@/services/cmdb/typings';
import { useEnumText, useOptions, useT, useValueEnum } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { DiffSummary, DiffView } from '../components/DiffView';
import { HistoryDiff, isRelationAction } from '../components/HistoryDiff';
import {
  CMDB_ACTION_META,
  CMDB_SCHEMA_ACTION_META,
  CMDB_SCHEMA_TARGET_META,
  CMDB_SCHEMA_TARGET_ORDER,
} from '../components/meta';
import { useSourceText } from '../components/useSourceText';
import { useUserNames } from '../components/useUserNames';

/** 模型 code → 名称 / 字段定义的页内缓存（实例 diff 渲染用） */
const useModelMeta = () => {
  const [names, setNames] = useState<Record<string, string>>({});
  const fieldsRef = useRef<Map<string, CmdbField[] | null>>(new Map());
  const [fieldsVersion, setFieldsVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listAllModels()
      .then((result) => {
        if (!cancelled)
          setNames(
            Object.fromEntries(result.items.map((m) => [m.code, m.name])),
          );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  /** 确保给定模型的字段定义已缓存（ProTable request 内调用；失败置 null 防反复重试） */
  const ensureFields = async (codes: string[]) => {
    const missing = codes.filter((code) => !fieldsRef.current.has(code));
    if (missing.length === 0) return;
    await Promise.all(
      missing.map((code) =>
        // 历史行所属模型可能已删除：静默降级为无字段定义（diff 按原键展示）
        getModel(code, { silent: true })
          .then((d) => fieldsRef.current.set(code, d.fields))
          .catch(() => fieldsRef.current.set(code, null)),
      ),
    );
    setFieldsVersion((v) => v + 1);
  };
  const fieldsOf = (code?: string) =>
    (code ? fieldsRef.current.get(code) : undefined) ?? [];
  return { names, ensureFields, fieldsOf, fieldsVersion };
};

const InstanceAuditTab: React.FC = () => {
  const t = useT();
  const actionEnum = useValueEnum(CMDB_ACTION_META);
  const userNames = useUserNames();
  const sourceText = useSourceText();
  const { names, ensureFields, fieldsOf, fieldsVersion } = useModelMeta();

  const columns: ProColumns<CmdbHistory>[] = [
    {
      title: t('pages.cmdb.detail.history.column.time'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 170,
      search: false,
    },
    {
      title: t('pages.cmdb.audit.column.timeRange'),
      dataIndex: 'timeRange',
      valueType: 'dateTimeRange',
      hideInTable: true,
    },
    {
      title: t('pages.cmdb.ci.column.name'),
      dataIndex: 'ciName',
      ellipsis: true,
      render: (_, r) => (
        <a onClick={() => history.push(`/cmdb/ci/${r.ciId}`)}>
          {r.ciName || r.ciId}
        </a>
      ),
      fieldProps: { placeholder: t('pages.cmdb.audit.keyword.placeholder') },
    },
    {
      title: t('pages.cmdb.ci.column.model'),
      dataIndex: 'modelCode',
      width: 140,
      valueType: 'select',
      request: async () => {
        const result = await listAllModels();
        return result.items.map((m) => ({ label: m.name, value: m.code }));
      },
      render: (_, r) => names[r.modelCode ?? ''] ?? r.modelCode ?? '—',
    },
    {
      title: t('pages.cmdb.detail.history.column.action'),
      dataIndex: 'action',
      valueEnum: actionEnum,
      width: 100,
    },
    {
      title: t('pages.cmdb.detail.history.column.operator'),
      dataIndex: 'operator',
      width: 160,
      ellipsis: true,
      copyable: true,
      renderText: (val) => userNames[val ?? ''] || val,
    },
    {
      title: t('pages.cmdb.detail.history.column.source'),
      dataIndex: 'source',
      width: 120,
      search: false,
      ellipsis: true,
      renderText: (val) => sourceText(val),
    },
    {
      title: t('pages.cmdb.detail.history.column.diff'),
      dataIndex: 'diff',
      search: false,
      render: (_, r) => (
        <HistoryDiff
          key={fieldsVersion}
          summary
          action={r.action}
          diff={r.diff}
          fields={fieldsOf(r.modelCode)}
        />
      ),
    },
  ];
  return (
    <ProTable<CmdbHistory>
      cardBordered
      rowKey="id"
      search={{ labelWidth: 'auto' }}
      columns={columns}
      expandable={{
        rowExpandable: (r) => !isRelationAction(r.action),
        expandedRowRender: (r) => (
          <HistoryDiff
            key={fieldsVersion}
            action={r.action}
            diff={r.diff}
            fields={fieldsOf(r.modelCode)}
          />
        ),
      }}
      request={async (params) => {
        const range = params.timeRange as [string, string] | undefined;
        const result = await listHistory({
          page: params.current,
          pageSize: params.pageSize,
          modelCode: params.modelCode || undefined,
          action: (params.action as CmdbHistory['action']) || undefined,
          operator: params.operator || undefined,
          keyword: params.ciName || undefined,
          from: range?.[0] ? dayjs(range[0]).toISOString() : undefined,
          to: range?.[1] ? dayjs(range[1]).toISOString() : undefined,
        });
        await ensureFields(
          [...new Set(result.items.map((i) => i.modelCode ?? ''))].filter(
            Boolean,
          ),
        );
        return toTableResult(result);
      }}
    />
  );
};

const SchemaAuditTab: React.FC = () => {
  const t = useT();
  const actionEnum = useValueEnum(CMDB_SCHEMA_ACTION_META);
  const targetText = useEnumText(CMDB_SCHEMA_TARGET_META);
  const userNames = useUserNames();
  const targetOptions = useOptions(
    CMDB_SCHEMA_TARGET_META,
    CMDB_SCHEMA_TARGET_ORDER,
  );
  const { names } = useModelMeta();

  const columns: ProColumns<CmdbSchemaAudit>[] = [
    {
      title: t('pages.cmdb.detail.history.column.time'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 170,
      search: false,
    },
    {
      title: t('pages.cmdb.audit.column.timeRange'),
      dataIndex: 'timeRange',
      valueType: 'dateTimeRange',
      hideInTable: true,
    },
    {
      title: t('pages.cmdb.audit.column.targetType'),
      dataIndex: 'targetType',
      valueType: 'select',
      fieldProps: { options: targetOptions },
      width: 110,
      render: (_, r) => targetText(r.targetType),
    },
    {
      title: t('pages.cmdb.audit.column.target'),
      dataIndex: 'keyword',
      ellipsis: true,
      render: (_, r) =>
        r.targetName ? `${r.targetName} (${r.targetCode})` : r.targetCode,
      fieldProps: { placeholder: t('pages.cmdb.audit.keyword.placeholder') },
    },
    {
      title: t('pages.cmdb.ci.column.model'),
      dataIndex: 'modelCode',
      width: 140,
      valueType: 'select',
      request: async () => {
        const result = await listAllModels();
        return result.items.map((m) => ({ label: m.name, value: m.code }));
      },
      render: (_, r) =>
        r.modelCode ? (names[r.modelCode] ?? r.modelCode) : '—',
    },
    {
      title: t('pages.cmdb.detail.history.column.action'),
      dataIndex: 'action',
      valueEnum: actionEnum,
      width: 90,
    },
    {
      title: t('pages.cmdb.detail.history.column.operator'),
      dataIndex: 'operator',
      width: 160,
      ellipsis: true,
      copyable: true,
      renderText: (val) => userNames[val ?? ''] || val,
    },
    {
      title: t('pages.cmdb.detail.history.column.diff'),
      dataIndex: 'diff',
      search: false,
      render: (_, r) => {
        const d = r.diff ?? {};
        const before = (d.before ?? undefined) as
          | Record<string, unknown>
          | undefined;
        const after = (d.after ?? undefined) as
          | Record<string, unknown>
          | undefined;
        return <DiffSummary before={before} after={after} />;
      },
    },
  ];
  return (
    <ProTable<CmdbSchemaAudit>
      cardBordered
      rowKey="id"
      search={{ labelWidth: 'auto' }}
      columns={columns}
      expandable={{
        expandedRowRender: (r) => (
          <DiffView
            before={r.diff?.before as Record<string, unknown> | undefined}
            after={r.diff?.after as Record<string, unknown> | undefined}
          />
        ),
      }}
      request={async (params) => {
        const range = params.timeRange as [string, string] | undefined;
        const result = await listSchemaAudit({
          page: params.current,
          pageSize: params.pageSize,
          targetType: (params.targetType as CmdbSchemaTargetType) || undefined,
          modelCode: params.modelCode || undefined,
          action:
            (params.action as 'create' | 'update' | 'delete') || undefined,
          operator: params.operator || undefined,
          keyword: params.keyword || undefined,
          from: range?.[0] ? dayjs(range[0]).toISOString() : undefined,
          to: range?.[1] ? dayjs(range[1]).toISOString() : undefined,
        });
        return toTableResult(result);
      }}
    />
  );
};

const AuditPage: React.FC = () => {
  const t = useT();
  const [tab, setTab] = useState('instances');
  return (
    <PageContainer
      title={false}
      tabList={[
        { key: 'instances', tab: t('pages.cmdb.audit.tab.instances') },
        { key: 'schema', tab: t('pages.cmdb.audit.tab.schema') },
      ]}
      tabActiveKey={tab}
      onTabChange={setTab}
    >
      {tab === 'schema' ? <SchemaAuditTab /> : <InstanceAuditTab />}
    </PageContainer>
  );
};

export default AuditPage;
