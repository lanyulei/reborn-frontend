/**
 * 故障详情「复盘」：复盘文档（概述 / 影响 / 时间线 / 根因 / 触发 / 发现 / 处理 / 做得好 / 待改进）编辑与完成，
 * AI 起草初稿、按时间线生成时间线段、完成后只读并可修订（生成新版本）、版本历史；改进项列表（新建 / 编辑 /
 * 删除 / 转工单）。
 */
import { HistoryOutlined, RobotOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Link, useAccess } from '@umijs/max';
import {
  Alert,
  App,
  Badge,
  Button,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { ConfirmLink, DeleteConfirmLink } from '@/components/TableActions';
import { UserSelect } from '@/components/UserSelect';
import {
  completePostmortem,
  createActionItemTicket,
  deleteActionItem,
  draftPostmortem,
  generateTimeline,
  getPostmortem,
  listPostmortemVersions,
  revisePostmortem,
  saveActionItem,
  savePostmortem,
} from '@/services/incident/postmortem';
import type {
  ActionItem,
  ActionItemKind,
  ActionItemStatus,
  Incident,
  Postmortem,
  PostmortemDoc,
  PostmortemVersion,
} from '@/services/incident/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useFormRules, useT } from '@/utils/i18n';
import {
  fetchIncidentUsers,
  refsToKnown,
  useIncidentOptions,
} from '../components/hooks';
import {
  INCIDENT_LIMITS,
  ITEM_KIND_META,
  ITEM_KIND_ORDER,
  ITEM_STATUS_META,
  ITEM_STATUS_ORDER,
} from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import { RefName, ReviewBadge } from '../components/tags';

const SECTIONS: readonly (keyof PostmortemDoc)[] = [
  'summary',
  'impact',
  'timeline',
  'rootCause',
  'trigger',
  'detection',
  'handling',
  'wentWell',
  'wentWrong',
];

const badge = (status?: string) =>
  (status?.toLowerCase() ?? 'default') as
    | 'success'
    | 'processing'
    | 'error'
    | 'default'
    | 'warning';

const ActionItemModal: React.FC<{
  incident: Incident;
  item?: ActionItem | null;
  onClose: () => void;
  onDone: () => void;
}> = ({ incident, item, onClose, onDone }) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  return (
    <ModalForm<{
      title: string;
      kind: ActionItemKind;
      ownerId?: string;
      dueDate?: string;
      status: ActionItemStatus;
    }>
      title={t(
        item ? 'pages.incident.item.edit' : 'pages.incident.item.create',
      )}
      width={520}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      initialValues={{
        title: item?.title,
        kind: item?.kind ?? 2,
        ownerId: item?.owner?.id,
        dueDate: item?.dueDate,
        status: item?.status ?? 1,
      }}
      onFinish={async (values) => {
        await saveActionItem(incident.id, {
          itemId: item?.id,
          title: values.title.trim(),
          kind: values.kind,
          ownerId: values.ownerId,
          dueDate: values.dueDate,
          status: values.status,
        });
        message.success(t('common.msg.saved'));
        onDone();
        return true;
      }}
    >
      <ProFormText
        name="title"
        label={t('pages.incident.item.title')}
        rules={[
          rules.required(t('pages.incident.item.title')),
          rules.maxChars(INCIDENT_LIMITS.titleMax),
        ]}
      />
      <ProFormSelect
        name="kind"
        label={t('pages.incident.item.kind')}
        options={ITEM_KIND_ORDER.map((k) => ({
          value: k,
          label: t(ITEM_KIND_META[k].textId),
        }))}
      />
      <Form.Item name="ownerId" label={t('pages.incident.item.owner')}>
        <UserSelect
          fetchUsers={fetchIncidentUsers}
          knownUsers={refsToKnown(item?.owner ? [item.owner] : [])}
          placeholder={t('pages.incident.field.userPlaceholder')}
        />
      </Form.Item>
      <ProFormDatePicker
        name="dueDate"
        label={t('pages.incident.item.dueDate')}
        fieldProps={{ style: { width: '100%' } }}
      />
      <ProFormSelect
        name="status"
        label={t('common.column.status')}
        options={ITEM_STATUS_ORDER.map((s) => ({
          value: s,
          label: t(ITEM_STATUS_META[s].textId),
        }))}
      />
    </ModalForm>
  );
};

const ItemTicketModal: React.FC<{
  incident: Incident;
  item: ActionItem;
  onClose: () => void;
  onDone: () => void;
}> = ({ incident, item, onClose, onDone }) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  const { options } = useIncidentOptions(['ticket_templates']);
  return (
    <ModalForm<{ templateId: string }>
      title={t('pages.incident.item.ticket')}
      width={480}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      onFinish={async (values) => {
        const saved = await createActionItemTicket(
          incident.id,
          item.id,
          values.templateId,
        );
        message.success(
          t('pages.incident.ticket.done', { n: saved.ticketNumber ?? '' }),
        );
        onDone();
        return true;
      }}
    >
      <ProFormSelect
        name="templateId"
        label={t('pages.incident.ticket.template')}
        rules={[rules.select(t('pages.incident.ticket.template'))]}
        showSearch
        options={(options.ticketTemplates ?? []).map((x) => ({
          value: x.id,
          label: x.name || x.id,
        }))}
      />
    </ModalForm>
  );
};

export const PostmortemPanel: React.FC<{
  incident: Incident;
  refreshKey: number;
  onChanged: () => void;
}> = ({ incident, refreshKey, onChanged }) => {
  const t = useT();
  const has = usePermissions();
  const access = useAccess();
  const { message, modal } = App.useApp();
  const { styles } = useIncidentStyles();
  const [pm, setPm] = useState<Postmortem | null>(null);
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<PostmortemDoc>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<'draft' | 'timeline' | null>(null);
  const [versions, setVersions] = useState<PostmortemVersion[] | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [itemModal, setItemModal] = useState<ActionItem | null | undefined>(
    undefined,
  );
  const [ticketItem, setTicketItem] = useState<ActionItem | null>(null);
  const { options } = useIncidentOptions(['root_causes']);
  // 父级 refreshKey 触发的重载不覆盖未保存的本地编辑
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPostmortem(incident.id);
      setPm(result);
      if (!dirtyRef.current) {
        setDoc(result.doc ?? {});
        setDirty(false);
      }
    } catch {
      setPm(null);
    } finally {
      setLoading(false);
    }
  }, [incident.id]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const editable =
    has('incident.list.postmortem') && pm?.canEdit === true && pm.status !== 3;
  const update = (key: keyof PostmortemDoc, value: string) => {
    setDoc((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await savePostmortem(incident.id, doc);
      setPm(saved);
      setDirty(false);
      message.success(t('common.msg.saved'));
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  if (loading && !pm) return <Spin />;
  if (!pm)
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('pages.incident.postmortem.unavailable')}
      />
    );

  const items = pm.actionItems ?? [];

  return (
    <div>
      <Space wrap style={{ marginBottom: 12 }} align="center">
        <ReviewBadge status={pm.status} overdue={pm.overdue} />
        {pm.reviewDue && (
          <span className={styles.hint}>
            {t('pages.incident.postmortem.due', {
              time: formatTime(pm.reviewDue),
            })}
          </span>
        )}
        {(pm.currentVersion ?? 0) > 0 && (
          <Tag>
            {t('pages.incident.postmortem.version', { v: pm.currentVersion })}
          </Tag>
        )}
        {pm.updateUser?.id && (
          <span className={styles.hint}>
            <RefName ref={pm.updateUser} /> · {formatTime(pm.updateTime)}
          </span>
        )}
        <Button
          icon={<HistoryOutlined />}
          loading={versionsLoading}
          onClick={async () => {
            setVersionsLoading(true);
            try {
              setVersions(
                (await listPostmortemVersions(incident.id)).items ?? [],
              );
            } catch {
              // 域级 request 已提示
            } finally {
              setVersionsLoading(false);
            }
          }}
        >
          {t('pages.incident.postmortem.versions')}
        </Button>
        {editable && (
          <>
            <Button
              icon={<RobotOutlined />}
              loading={busy === 'draft'}
              onClick={async () => {
                setBusy('draft');
                try {
                  const draft = await draftPostmortem(incident.id);
                  setDoc((d) => ({
                    ...draft,
                    ...Object.fromEntries(
                      Object.entries(d).filter(([, v]) => v),
                    ),
                  }));
                  setDirty(true);
                } finally {
                  setBusy(null);
                }
              }}
            >
              {t('pages.incident.postmortem.draft')}
            </Button>
            <Button
              loading={busy === 'timeline'}
              onClick={async () => {
                setBusy('timeline');
                try {
                  update('timeline', await generateTimeline(incident.id));
                } finally {
                  setBusy(null);
                }
              }}
            >
              {t('pages.incident.postmortem.genTimeline')}
            </Button>
            <Button
              type="primary"
              loading={saving}
              disabled={!dirty}
              onClick={save}
            >
              {t('common.action.save')}
            </Button>
            <Button
              onClick={() =>
                modal.confirm({
                  title: t('pages.incident.postmortem.complete.title'),
                  content: t('pages.incident.postmortem.complete.desc'),
                  onOk: async () => {
                    if (dirty) await savePostmortem(incident.id, doc);
                    setPm(await completePostmortem(incident.id));
                    setDirty(false);
                    message.success(t('pages.incident.postmortem.completed'));
                    onChanged();
                  },
                })
              }
            >
              {t('pages.incident.postmortem.complete')}
            </Button>
          </>
        )}
        {has('incident.list.postmortem') && pm.canEdit && pm.status === 3 && (
          <ConfirmLink
            title={t('pages.incident.postmortem.revise.title')}
            description={t('pages.incident.postmortem.revise.desc')}
            onConfirm={async () => {
              setPm(await revisePostmortem(incident.id));
              onChanged();
            }}
          >
            {t('pages.incident.postmortem.revise')}
          </ConfirmLink>
        )}
      </Space>
      {pm.status === 1 && !editable && has('incident.list.postmortem') && (
        <Alert
          type="info"
          showIcon
          title={t('pages.incident.postmortem.readonlyHint')}
          style={{ marginBottom: 12 }}
        />
      )}

      <SectionTitle style={{ marginTop: 0 }}>
        {t('pages.incident.postmortem.rootCauseCode')}
      </SectionTitle>
      {editable ? (
        <Select
          allowClear
          style={{ width: 320 }}
          value={doc.rootCauseCode || undefined}
          onChange={(v) => update('rootCauseCode', v ?? '')}
          options={(options.rootCauses ?? []).map((rc) => ({
            value: rc.code,
            label: rc.name,
          }))}
          placeholder={t('pages.incident.postmortem.rootCausePlaceholder')}
        />
      ) : (
        <div>
          {options.rootCauses?.find((rc) => rc.code === doc.rootCauseCode)
            ?.name ||
            doc.rootCauseCode ||
            t('common.empty')}
        </div>
      )}
      {SECTIONS.map((key) => (
        <div key={key}>
          <SectionTitle>
            {t(`pages.incident.postmortem.section.${key}`)}
          </SectionTitle>
          {editable ? (
            <Input.TextArea
              value={doc[key] ?? ''}
              onChange={(e) => update(key, e.target.value)}
              autoSize={{ minRows: 3, maxRows: 16 }}
              maxLength={INCIDENT_LIMITS.docSectionMax}
              placeholder={t(`pages.incident.postmortem.hint.${key}`)}
            />
          ) : (
            <div className={styles.pre}>
              {doc[key] || (
                <span className={styles.hint}>{t('common.empty')}</span>
              )}
            </div>
          )}
        </div>
      ))}

      <Flex
        justify="space-between"
        align="center"
        style={{ marginTop: 20, marginBottom: 12 }}
      >
        <SectionTitle style={{ margin: 0 }}>
          {t('pages.incident.item.title.list')}
        </SectionTitle>
        {has('incident.list.postmortem') && pm.canEdit && (
          <Button onClick={() => setItemModal(null)}>
            {t('pages.incident.item.create')}
          </Button>
        )}
      </Flex>
      <Table<ActionItem>
        rowKey="id"
        size="small"
        dataSource={items}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('pages.incident.item.empty')}
            />
          ),
        }}
        columns={[
          {
            title: t('pages.incident.item.title'),
            dataIndex: 'title',
            ellipsis: true,
          },
          {
            title: t('pages.incident.item.kind'),
            dataIndex: 'kind',
            width: 90,
            render: (_, row) =>
              row.kind ? t(ITEM_KIND_META[row.kind].textId) : '',
          },
          {
            title: t('pages.incident.item.owner'),
            dataIndex: 'owner',
            width: 110,
            ellipsis: true,
            render: (_, row) => <RefName ref={row.owner} />,
          },
          {
            title: t('pages.incident.item.dueDate'),
            dataIndex: 'dueDate',
            width: 130,
            render: (_, row) => (
              <>
                {row.dueDate || t('common.empty')}
                {row.overdue && (
                  <Tag color="error" style={{ marginInlineStart: 6 }}>
                    {t('pages.incident.item.overdue')}
                  </Tag>
                )}
              </>
            ),
          },
          {
            title: t('common.column.status'),
            dataIndex: 'status',
            width: 100,
            render: (_, row) => {
              const meta = row.status
                ? ITEM_STATUS_META[row.status]
                : undefined;
              return meta ? (
                <Badge status={badge(meta.status)} text={t(meta.textId)} />
              ) : null;
            },
          },
          {
            title: t('pages.incident.item.ticketNumber'),
            dataIndex: 'ticket',
            width: 150,
            render: (_, row) =>
              row.ticket?.id ? (
                access.canTicket ? (
                  <Link to={`/ticket/detail/${row.ticket.id}`}>
                    {row.ticketNumber || row.ticket.name || row.ticket.id}
                  </Link>
                ) : (
                  row.ticketNumber || row.ticket.id
                )
              ) : (
                t('common.empty')
              ),
          },
          {
            title: t('common.column.action'),
            key: 'op',
            width: 170,
            hidden: !(has('incident.list.postmortem') && pm.canEdit),
            render: (_, row) => (
              <Space size={8}>
                <a onClick={() => setItemModal(row)}>
                  {t('common.action.edit')}
                </a>
                {!row.ticket?.id && (
                  <a onClick={() => setTicketItem(row)}>
                    {t('pages.incident.item.ticket')}
                  </a>
                )}
                <DeleteConfirmLink
                  title={t('pages.incident.item.delete.title')}
                  onConfirm={async () => {
                    await deleteActionItem(incident.id, row.id);
                    void load();
                  }}
                >
                  {t('common.action.delete')}
                </DeleteConfirmLink>
              </Space>
            ),
          },
        ]}
      />

      {itemModal !== undefined && (
        <ActionItemModal
          incident={incident}
          item={itemModal}
          onClose={() => setItemModal(undefined)}
          onDone={() => void load()}
        />
      )}
      {ticketItem && (
        <ItemTicketModal
          incident={incident}
          item={ticketItem}
          onClose={() => setTicketItem(null)}
          onDone={() => void load()}
        />
      )}
      <Drawer
        open={versions !== null}
        title={t('pages.incident.postmortem.versions')}
        size="large"
        onClose={() => setVersions(null)}
        destroyOnHidden
      >
        {versions?.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          versions?.map((v) => (
            <div key={v.id} style={{ marginBottom: 24 }}>
              <Typography.Title level={5}>
                {t('pages.incident.postmortem.version', { v: v.version })}
                <span
                  className={styles.hint}
                  style={{ marginInlineStart: 8, fontWeight: 'normal' }}
                >
                  <RefName ref={v.creator} /> · {formatTime(v.createTime)}
                  {v.note ? ` · ${v.note}` : ''}
                </span>
              </Typography.Title>
              {SECTIONS.filter((k) => v.doc?.[k]).map((k) => (
                <div key={k}>
                  <strong>{t(`pages.incident.postmortem.section.${k}`)}</strong>
                  <div className={styles.pre}>{v.doc?.[k]}</div>
                </div>
              ))}
            </div>
          ))
        )}
      </Drawer>
    </div>
  );
};
