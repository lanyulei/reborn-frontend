/**
 * 业务字典：业务编码 / 名称 / 负责人 / 值班表 / 通知群 / 关联资源 / 匹配的标签值；规则按标签把告警落到业务，
 * 故障的指挥值班表与通知群缺省取业务上的。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Form, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { UserSelect } from '@/components/UserSelect';
import { ENABLED_META } from '@/constants';
import {
  createBusiness,
  deleteBusiness,
  listBusinesses,
  updateBusiness,
} from '@/services/incident/config';
import type { Business, BusinessSpec } from '@/services/incident/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useSubmitter, useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import {
  fetchCIs,
  fetchIncidentUsers,
  refOptions,
  refsToKnown,
  useIncidentOptions,
} from '../components/hooks';
import { CONFIG_TABS, INCIDENT_LIMITS } from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import { CiLink, RefName } from '../components/tags';

const BusinessList: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { message } = App.useApp();
  const { styles } = useIncidentStyles();
  const actionRef = useRef<ActionType>(null);
  const enabledEnum = useValueEnum(ENABLED_META);
  const [formRow, setFormRow] = useState<Business | null | undefined>(
    undefined,
  );
  const { options } = useIncidentOptions(['schedules'], formRow !== undefined);
  const reload = () => actionRef.current?.reload();

  const columns: ProColumns<Business>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.incident.business.keywordPlaceholder'),
      },
    },
    {
      title: t('pages.incident.business.code'),
      dataIndex: 'code',
      search: false,
      width: 140,
      render: (_, r) => <span className={styles.mono}>{r.code}</span>,
    },
    {
      title: t('pages.incident.business.name'),
      dataIndex: 'name',
      search: false,
      render: (_, r) => (
        <div>
          <div>{r.name}</div>
          {r.description && <div className={styles.hint}>{r.description}</div>}
        </div>
      ),
    },
    {
      title: t('pages.incident.business.owner'),
      dataIndex: 'owner',
      search: false,
      width: 110,
      render: (_, r) => <RefName ref={r.owner} />,
    },
    {
      title: t('pages.incident.business.schedule'),
      dataIndex: 'schedule',
      search: false,
      width: 140,
      render: (_, r) => <RefName ref={r.schedule} />,
    },
    {
      title: t('pages.incident.business.groups'),
      dataIndex: 'groups',
      search: false,
      width: 160,
      render: (_, r) =>
        r.groups?.length
          ? r.groups.map((g) => <Tag key={g}>{g}</Tag>)
          : t('common.empty'),
    },
    {
      title: t('pages.incident.business.ci'),
      dataIndex: 'ci',
      search: false,
      width: 140,
      render: (_, r) => (r.ci?.id ? <CiLink ci={r.ci} /> : t('common.empty')),
    },
    {
      title: t('pages.incident.business.labelValues'),
      dataIndex: 'labelValues',
      search: false,
      width: 180,
      render: (_, r) =>
        r.labelValues?.length
          ? r.labelValues.map((v) => <Tag key={v}>{v}</Tag>)
          : t('common.empty'),
    },
    {
      title: t('common.column.enabled'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
      render: (_, r) =>
        r.enabled ? (
          <Tag color="success">{t('common.status.enabled')}</Tag>
        ) : (
          <Tag>{t('common.status.disabled')}</Tag>
        ),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 120,
      hideInTable: !(
        has('incident.business.update') || has('incident.business.delete')
      ),
      render: (_, r) => [
        has('incident.business.update') && (
          <a key="edit" onClick={() => setFormRow(r)}>
            {t('common.action.edit')}
          </a>
        ),
        has('incident.business.delete') && (
          <DeleteConfirmLink
            key="delete"
            title={t('pages.incident.business.delete.title', { name: r.name })}
            description={t('pages.incident.business.delete.desc')}
            onConfirm={async () => {
              await deleteBusiness(r.id);
              message.success(t('common.msg.deleted'));
              reload();
            }}
          />
        ),
      ],
    },
  ];

  return (
    <RouteTabsPage tabs={CONFIG_TABS}>
      <ProTable<Business>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        cardBordered
        headerTitle={
          has('incident.business.create') && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.incident.business.create')}
            </CreateButton>
          )
        }
        request={async (params) =>
          toTableResult(
            await listBusinesses({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword?.trim() || undefined,
              enabled: parseBoolParam(params.enabled),
            }),
          )
        }
        columnEmptyText={t('common.empty')}
        search={{ labelWidth: 'auto' }}
        scroll={{ x: 'max-content' }}
      />
      {formRow !== undefined && (
        <ModalForm<BusinessSpec>
          title={t(
            formRow
              ? 'pages.incident.business.edit'
              : 'pages.incident.business.create',
          )}
          width={600}
          open
          onOpenChange={(open) => {
            if (!open) setFormRow(undefined);
          }}
          modalProps={{ destroyOnHidden: true }}
          submitter={formRow ? submitter.save : submitter.create}
          initialValues={
            formRow
              ? {
                  code: formRow.code,
                  name: formRow.name,
                  description: formRow.description,
                  ownerId: formRow.owner?.id,
                  scheduleId: formRow.schedule?.id,
                  groups: formRow.groups ?? [],
                  ciId: formRow.ci?.id,
                  labelValues: formRow.labelValues ?? [],
                  sort: formRow.sort ?? 0,
                  enabled: formRow.enabled ?? true,
                }
              : { enabled: true, sort: 0 }
          }
          onFinish={async (values) => {
            const spec: BusinessSpec = {
              ...values,
              code: values.code.trim(),
              name: values.name.trim(),
              description: values.description?.trim(),
              groups: values.groups ?? [],
              labelValues: values.labelValues ?? [],
            };
            if (formRow) {
              await updateBusiness(formRow.id, spec, formRow.version ?? 0);
              message.success(t('common.msg.saved'));
            } else {
              await createBusiness(spec);
              message.success(t('common.msg.created'));
            }
            reload();
            return true;
          }}
        >
          <ProFormText
            name="code"
            label={t('pages.incident.business.code')}
            disabled={!!formRow}
            rules={[
              rules.required(t('pages.incident.business.code')),
              {
                pattern: /^[a-z0-9][a-z0-9_-]{0,63}$/,
                message: t('pages.incident.business.codeRule'),
              },
            ]}
            extra={t('pages.incident.business.codeHint')}
          />
          <ProFormText
            name="name"
            label={t('pages.incident.business.name')}
            rules={[
              rules.required(t('pages.incident.business.name')),
              rules.maxChars(INCIDENT_LIMITS.nameMax),
            ]}
          />
          <ProFormTextArea
            name="description"
            label={t('pages.incident.business.description')}
            fieldProps={{ rows: 2, maxLength: INCIDENT_LIMITS.descriptionMax }}
          />
          <Form.Item name="ownerId" label={t('pages.incident.business.owner')}>
            <UserSelect
              fetchUsers={fetchIncidentUsers}
              knownUsers={refsToKnown(formRow?.owner ? [formRow.owner] : [])}
            />
          </Form.Item>
          <ProFormSelect
            name="scheduleId"
            label={t('pages.incident.business.schedule')}
            showSearch
            options={refOptions(options.schedules)}
            extra={t('pages.incident.business.scheduleHint')}
          />
          <ProFormSelect
            name="groups"
            label={t('pages.incident.business.groups')}
            mode="tags"
            fieldProps={{ tokenSeparators: [',', ' '] }}
            rules={[
              {
                validator: (_, v: string[] | undefined) =>
                  (v ?? []).every((g) => /^\$[\w-]{1,64}$/.test(g))
                    ? Promise.resolve()
                    : Promise.reject(t('pages.incident.business.groupsRule')),
              },
            ]}
            extra={t('pages.incident.business.groupsHint')}
          />
          <Form.Item name="ciId" label={t('pages.incident.business.ci')}>
            <UserSelect
              fetchUsers={fetchCIs}
              knownUsers={refsToKnown(formRow?.ci ? [formRow.ci] : [])}
              placeholder={t('pages.incident.field.ciPlaceholder')}
            />
          </Form.Item>
          <ProFormSelect
            name="labelValues"
            label={t('pages.incident.business.labelValues')}
            mode="tags"
            fieldProps={{ tokenSeparators: [',', ' '] }}
            extra={t('pages.incident.business.labelValuesHint')}
          />
          <ProFormDigit
            name="sort"
            label={t('pages.incident.business.sort')}
            min={0}
            max={9999}
            fieldProps={{ precision: 0 }}
          />
          <ProFormSwitch name="enabled" label={t('common.column.enabled')} />
        </ModalForm>
      )}
    </RouteTabsPage>
  );
};

export default BusinessList;
