/**
 * 变更单：需审批的集群上的写操作、以及自助申请（命名空间 / 集群权限）都会生成一张变更单并提一张工单。
 * 这里看每张变更单的去向——待审批、已批准待执行、执行结果——以及它涉及的字段：系统执行前会把这些字段
 * 与现状逐个比对，审批期间被他人改动即不执行。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import {
  Alert,
  App,
  Badge,
  Collapse,
  Descriptions,
  Drawer,
  Segmented,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import SectionTitle from '@/components/SectionTitle';
import { ConfirmLink } from '@/components/TableActions';
import type { ChangeItem, K8sChange } from '@/services/k8s/change';
import { cancelChange, getChange, listChanges } from '@/services/k8s/change';
import { listClusterOptions } from '@/services/k8s/cluster';
import { usePermissions } from '@/services/system/permissions';
import type { Translate } from '@/utils/i18n';
import { t, useT } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { formatTime } from '../components/cells';
import { SECURITY_TABS } from '../components/groups';
import { kindTextId } from '../components/meta';
import { useK8sStyles } from '../components/styles';
import { YamlDiff, YamlEditor } from '../components/YamlEditor';

const STATUS_BADGE: Record<
  number,
  'processing' | 'warning' | 'success' | 'error' | 'default'
> = {
  1: 'processing',
  2: 'warning',
  3: 'processing',
  4: 'success',
  5: 'error',
  6: 'default',
  7: 'default',
  8: 'error',
};
const STATUSES = [1, 2, 3, 4, 5, 6, 7, 8];

const targetText = (item: {
  kind?: string | number;
  resKind?: string;
  resource?: string;
  namespace?: string;
  name?: string;
}): string => {
  const kind =
    item.resKind ||
    (typeof item.kind === 'string' ? item.kind : '') ||
    item.resource ||
    '';
  // 资源名走本地化（已知类型）；未知（CRD 等）原样
  const kindId = kindTextId(kind);
  const kindText = kindId ? t(kindId) : kind;
  const name = `${item.namespace ? `${item.namespace}/` : ''}${item.name ?? ''}`;
  return `${kindText} ${name}`.trim();
};

/** 有本地化文案的动作（与审计页同一套词条）；其余原样显示 */
const KNOWN_ACTIONS = new Set([
  'create',
  'update',
  'delete',
  'scale',
  'restart',
  'set_image',
  'rollback',
  'pause',
  'resume',
  'trigger',
  'suspend',
  'unsuspend',
  'evict',
  'cordon',
  'uncordon',
  'drain',
  'helm_install',
  'helm_upgrade',
  'helm_rollback',
  'helm_uninstall',
]);
const actionText = (t: Translate, action?: string): string =>
  action && KNOWN_ACTIONS.has(action)
    ? t(`pages.k8s.audit.action.${action}`)
    : (action ?? '');

const ItemBody: React.FC<{ item: ChangeItem }> = ({ item }) => {
  const t = useT();
  return (
    <>
      {(item.fields?.length ?? 0) > 0 && (
        <Table
          size="small"
          rowKey="path"
          pagination={false}
          dataSource={item.fields}
          style={{ marginBottom: 12 }}
          columns={[
            {
              title: t('pages.k8s.changeOrder.field'),
              dataIndex: 'path',
              render: (value: string) => (
                <Typography.Text code>{value}</Typography.Text>
              ),
            },
            {
              title: t('pages.k8s.changeOrder.field.before'),
              dataIndex: 'before',
              width: '30%',
              render: (value?: string) => value || t('common.empty'),
            },
            {
              title: t('pages.k8s.changeOrder.field.after'),
              dataIndex: 'after',
              width: '30%',
              render: (value?: string) => value || t('common.empty'),
            },
          ]}
        />
      )}
      {item.beforeYaml && item.afterYaml ? (
        <YamlDiff
          before={item.beforeYaml}
          after={item.afterYaml}
          maxHeight={420}
        />
      ) : (
        (item.beforeYaml || item.afterYaml) && (
          <YamlEditor
            value={item.afterYaml || item.beforeYaml || ''}
            readOnly
            height={320}
          />
        )
      )}
    </>
  );
};

const ChangeDetail: React.FC<{ id: string; onClose: () => void }> = ({
  id,
  onClose,
}) => {
  const t = useT();
  const { styles } = useK8sStyles();
  const [change, setChange] = useState<K8sChange>();

  useEffect(() => {
    let cancelled = false;
    getChange(id)
      .then((res) => {
        if (!cancelled) setChange(res.change);
      })
      .catch(onClose);
    return () => {
      cancelled = true;
    };
  }, [id]);

  const params = useMemo(() => {
    if (!change?.params) return '';
    try {
      return JSON.stringify(JSON.parse(change.params), null, 2);
    } catch {
      return change.params;
    }
  }, [change?.params]);

  return (
    <Drawer
      open
      size={1080}
      destroyOnHidden
      title={t('pages.k8s.changeOrder.detail')}
      onClose={onClose}
    >
      {!change ? (
        <Spin style={{ display: 'block', margin: '80px auto' }} />
      ) : (
        <>
          {change.status === 2 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              title={t('pages.k8s.changeOrder.approvedHint', {
                time: formatTime(change.expireTime),
              })}
            />
          )}
          {(change.status === 5 || change.status === 8) && change.message && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              title={t(`pages.k8s.changeOrder.status.${change.status}`)}
              description={change.message}
            />
          )}
          <Descriptions
            bordered
            size="small"
            column={2}
            styles={{ label: { width: 120, whiteSpace: 'nowrap' } }}
            items={[
              {
                key: 'summary',
                label: t('pages.k8s.changeOrder.summary'),
                span: 2,
                children: change.summary,
              },
              {
                key: 'status',
                label: t('pages.k8s.changeOrder.status'),
                children: (
                  <Badge
                    status={STATUS_BADGE[change.status]}
                    text={t(`pages.k8s.changeOrder.status.${change.status}`)}
                  />
                ),
              },
              {
                key: 'ticket',
                label: t('pages.k8s.changeOrder.ticket'),
                children: change.ticketId ? (
                  <a
                    onClick={() =>
                      history.push(`/ticket/detail/${change.ticketId}`)
                    }
                  >
                    {change.ticketNumber || change.ticketId}
                  </a>
                ) : (
                  t('common.empty')
                ),
              },
              {
                key: 'cluster',
                label: t('pages.k8s.scope.cluster'),
                children: change.clusterName,
              },
              {
                key: 'target',
                label: t('pages.k8s.audit.object'),
                children: targetText(change) || t('common.empty'),
              },
              {
                key: 'requester',
                label: t('pages.k8s.changeOrder.requester'),
                children: change.requesterName,
              },
              {
                key: 'create',
                label: t('pages.k8s.changeOrder.createTime'),
                children: formatTime(change.createTime),
              },
              {
                key: 'approve',
                label: t('pages.k8s.changeOrder.approveTime'),
                children: change.approveTime
                  ? formatTime(change.approveTime)
                  : t('common.empty'),
              },
              {
                key: 'finish',
                label: t('pages.k8s.changeOrder.finishTime'),
                children: change.finishTime
                  ? formatTime(change.finishTime)
                  : t('common.empty'),
              },
              ...(change.message && change.status !== 5 && change.status !== 8
                ? [
                    {
                      key: 'message',
                      label: t('pages.k8s.changeOrder.message'),
                      span: 2,
                      children: change.message,
                    },
                  ]
                : []),
            ]}
          />
          {(change.applied?.length ?? 0) > 0 && change.status === 5 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
              title={t('pages.k8s.changeOrder.applied')}
              description={change.applied?.join('、')}
            />
          )}
          {params && (
            <>
              <SectionTitle>{t('pages.k8s.changeOrder.params')}</SectionTitle>
              <Typography.Paragraph className={styles.codeBlock}>
                {params}
              </Typography.Paragraph>
            </>
          )}
          {(change.items?.length ?? 0) > 0 && (
            <>
              <SectionTitle>{t('pages.k8s.changeOrder.items')}</SectionTitle>
              {change.kind === 1 && (
                <Typography.Paragraph type="secondary">
                  {t('pages.k8s.changeOrder.items.hint')}
                </Typography.Paragraph>
              )}
              <Collapse
                defaultActiveKey={['0']}
                items={(change.items ?? []).map((item, index) => ({
                  key: String(index),
                  label: (
                    <span>
                      <Tag>{actionText(t, item.action)}</Tag>
                      {targetText(item)}
                    </span>
                  ),
                  children: <ItemBody item={item} />,
                }))}
              />
            </>
          )}
        </>
      )}
    </Drawer>
  );
};

const ChangePage: React.FC = () => {
  const t = useT();
  const { message } = App.useApp();
  const can = usePermissions();
  const [params, setParams] = useSearchParams();
  const table = useRef<ActionType>(null);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [clusterEnum, setClusterEnum] = useState<
    Record<string, { text: string }>
  >({});
  const detailId = params.get('id') ?? '';

  const openDetail = (id?: string) => {
    const next = new URLSearchParams(params);
    if (id) next.set('id', id);
    else next.delete('id');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    listClusterOptions({ silent: true })
      .then((res) =>
        setClusterEnum(
          Object.fromEntries(
            (res.items ?? []).map((item) => [item.id, { text: item.name }]),
          ),
        ),
      )
      .catch(() => undefined);
  }, []);

  const statusEnum = useMemo(
    () =>
      Object.fromEntries(
        STATUSES.map((status) => [
          status,
          { text: t(`pages.k8s.changeOrder.status.${status}`) },
        ]),
      ),
    [t],
  );

  const columns: ProColumns<K8sChange>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.k8s.changeOrder.search'),
        maxLength: 64,
      },
    },
    {
      title: t('pages.k8s.changeOrder.createTime'),
      dataIndex: 'createTime',
      search: false,
      width: 170,
      renderText: (_, row) => formatTime(row.createTime),
    },
    {
      title: t('pages.k8s.scope.cluster'),
      dataIndex: 'clusterId',
      width: 140,
      valueType: 'select',
      valueEnum: clusterEnum,
      fieldProps: { showSearch: true },
      renderText: (_, row) => row.clusterName || t('common.empty'),
    },
    {
      title: t('pages.k8s.changeOrder.summary'),
      dataIndex: 'summary',
      search: false,
      ellipsis: true,
      render: (_, row) => (
        <a onClick={() => openDetail(row.id)}>{row.summary || row.id}</a>
      ),
    },
    {
      title: t('pages.k8s.column.namespace'),
      dataIndex: 'namespace',
      search: false,
      width: 140,
      renderText: (_, row) => row.namespace || t('common.empty'),
    },
    {
      title: t('pages.k8s.changeOrder.requester'),
      dataIndex: 'requesterName',
      search: false,
      width: 120,
    },
    {
      title: t('pages.k8s.changeOrder.status'),
      dataIndex: 'status',
      width: 130,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, row) => (
        <Badge
          status={STATUS_BADGE[row.status]}
          text={t(`pages.k8s.changeOrder.status.${row.status}`)}
        />
      ),
    },
    {
      title: t('pages.k8s.changeOrder.ticket'),
      dataIndex: 'ticketNumber',
      search: false,
      width: 170,
      render: (_, row) =>
        row.ticketId ? (
          <a onClick={() => history.push(`/ticket/detail/${row.ticketId}`)}>
            {row.ticketNumber || t('pages.k8s.changeOrder.ticket')}
          </a>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 90,
      render: (_, row) =>
        row.status === 1 && can('k8s.change.cancel') ? (
          <ConfirmLink
            danger
            title={t('pages.k8s.changeOrder.cancel.title')}
            description={t('pages.k8s.changeOrder.cancel.desc')}
            onConfirm={async () => {
              await cancelChange(row.id);
              message.success(t('pages.k8s.changeOrder.cancel.done'));
              table.current?.reload();
            }}
          >
            {t('pages.k8s.changeOrder.cancel')}
          </ConfirmLink>
        ) : null,
    },
  ];

  return (
    <RouteTabsPage tabs={SECURITY_TABS}>
      <ProTable<K8sChange>
        cardBordered
        actionRef={table}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        params={{ scope }}
        headerTitle={
          // ProTable 把 headerTitle 渲染在 500 字重 / 16px 的标题容器里：
          // 重置回常规字号字重，单选用默认样式（同 ScopeSelects / ResourceTable 的处理）
          <span style={{ fontSize: 14, fontWeight: 400 }}>
            <Segmented
              value={scope}
              onChange={(value) => setScope(value as 'mine' | 'all')}
              options={[
                {
                  value: 'mine',
                  label: t('pages.k8s.changeOrder.scope.mine'),
                },
                { value: 'all', label: t('pages.k8s.changeOrder.scope.all') },
              ]}
            />
          </span>
        }
        request={async ({ current, pageSize, ...rest }) =>
          toTableResult(
            await listChanges({
              page: current ?? 1,
              pageSize: pageSize ?? 20,
              scope: rest.scope,
              status: rest.status ? Number(rest.status) : undefined,
              clusterId: rest.clusterId || undefined,
              keyword: rest.keyword || undefined,
            }),
          )
        }
        pagination={{ defaultPageSize: 20 }}
      />
      {detailId && (
        <ChangeDetail
          key={detailId}
          id={detailId}
          onClose={() => {
            openDetail(undefined);
            table.current?.reload();
          }}
        />
      )}
    </RouteTabsPage>
  );
};

export default ChangePage;
