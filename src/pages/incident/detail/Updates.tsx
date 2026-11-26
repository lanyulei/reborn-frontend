/**
 * 故障详情「对外公告」：公告列表（进展 / 缓解 / 解决），处理人发布公告（可让 AI 起草）；
 * 分享链接：新建 / 查看地址 / 重置 / 作废，链接指向匿名状态页。
 */
import { CopyOutlined, RobotOutlined } from '@ant-design/icons';
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Empty,
  Flex,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { ConfirmLink, DeleteConfirmLink } from '@/components/TableActions';
import type {
  Incident,
  IncidentUpdate,
  ShareLink,
  UpdateKind,
} from '@/services/incident/typings';
import {
  createShareLink,
  createUpdate,
  deleteShareLink,
  draftUpdate,
  getShareLinkToken,
  listShareLinks,
  listUpdates,
  publicIncidentUrl,
  resetShareLink,
} from '@/services/incident/update';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useFormRules, useT } from '@/utils/i18n';
import {
  INCIDENT_LIMITS,
  UPDATE_KIND_META,
  UPDATE_KIND_ORDER,
} from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import { RefName } from '../components/tags';

const PublishModal: React.FC<{
  incident: Incident;
  onClose: () => void;
  onDone: () => void;
}> = ({ incident, onClose, onDone }) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  const formRef =
    useRef<ProFormInstance<{ kind: UpdateKind; content: string }>>(undefined);
  const [drafting, setDrafting] = useState(false);
  const defaultKind: UpdateKind =
    incident.status === 4 ? 3 : incident.status === 3 ? 2 : 1;
  return (
    <ModalForm<{ kind: UpdateKind; content: string }>
      title={t('pages.incident.update.publish')}
      width={600}
      open
      formRef={formRef}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      initialValues={{ kind: defaultKind }}
      onFinish={async (values) => {
        await createUpdate(incident.id, values.kind, values.content.trim());
        message.success(t('pages.incident.update.published'));
        onDone();
        return true;
      }}
    >
      <ProFormSelect
        name="kind"
        label={t('pages.incident.update.kind')}
        rules={[rules.select(t('pages.incident.update.kind'))]}
        options={UPDATE_KIND_ORDER.map((k) => ({
          value: k,
          label: t(UPDATE_KIND_META[k].textId),
        }))}
      />
      <ProFormTextArea
        name="content"
        label={t('pages.incident.update.content')}
        rules={[rules.required(t('pages.incident.update.content'))]}
        fieldProps={{
          rows: 6,
          maxLength: INCIDENT_LIMITS.updateMax,
          showCount: true,
        }}
        extra={
          <Button
            type="link"
            size="small"
            icon={<RobotOutlined />}
            loading={drafting}
            style={{ paddingInline: 0 }}
            onClick={async () => {
              setDrafting(true);
              try {
                const kind =
                  formRef.current?.getFieldValue('kind') ?? defaultKind;
                const text = await draftUpdate(incident.id, kind);
                formRef.current?.setFieldValue('content', text);
              } finally {
                setDrafting(false);
              }
            }}
          >
            {t('pages.incident.update.draft')}
          </Button>
        }
      />
    </ModalForm>
  );
};

const ShareLinks: React.FC<{ incident: Incident; writable: boolean }> = ({
  incident,
  writable,
}) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  const { styles } = useIncidentStyles();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    token: string;
  } | null>(null);
  // 只采纳最后一次加载的结果：切换故障时，旧响应不覆盖新数据
  const seq = useRef(0);

  const load = useCallback(async () => {
    const current = ++seq.current;
    setLoading(true);
    try {
      const result = await listShareLinks(incident.id);
      if (current !== seq.current) return;
      setLinks(result.items ?? []);
    } catch {
      if (current !== seq.current) return;
      setLinks([]);
    } finally {
      if (current === seq.current) setLoading(false);
    }
  }, [incident.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const url = tokenInfo ? publicIncidentUrl(tokenInfo.token) : '';

  return (
    <>
      <Flex
        justify="space-between"
        align="center"
        style={{ marginTop: 20, marginBottom: 12 }}
      >
        <SectionTitle style={{ margin: 0 }}>
          {t('pages.incident.share.title')}
        </SectionTitle>
        {writable && (
          <Button onClick={() => setCreateOpen(true)}>
            {t('pages.incident.share.create')}
          </Button>
        )}
      </Flex>
      <Table<ShareLink>
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={links}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('pages.incident.share.empty')}
            />
          ),
        }}
        columns={[
          {
            title: t('pages.incident.share.name'),
            dataIndex: 'name',
            ellipsis: true,
          },
          {
            title: t('pages.incident.share.expireTime'),
            dataIndex: 'expireTime',
            width: 170,
            render: (_, row) =>
              formatTime(row.expireTime) ||
              t('pages.incident.share.neverExpire'),
          },
          {
            title: t('pages.incident.share.accessCount'),
            dataIndex: 'accessCount',
            width: 90,
          },
          {
            title: t('pages.incident.share.lastAccess'),
            dataIndex: 'lastAccessTime',
            width: 160,
            render: (_, row) =>
              formatTime(row.lastAccessTime) || t('common.empty'),
          },
          {
            title: t('pages.incident.share.creator'),
            dataIndex: 'creator',
            width: 110,
            ellipsis: true,
            render: (_, row) => <RefName ref={row.creator} />,
          },
          {
            title: t('common.column.action'),
            key: 'op',
            width: 180,
            hidden: !writable,
            render: (_, row) => (
              <Space size={8}>
                <a
                  onClick={async () => {
                    const result = await getShareLinkToken(
                      incident.id,
                      row.id,
                    ).catch(() => null);
                    if (result)
                      setTokenInfo({
                        name: row.name ?? '',
                        token: result.token,
                      });
                  }}
                >
                  {t('pages.incident.share.view')}
                </a>
                <ConfirmLink
                  title={t('pages.incident.share.reset.title')}
                  description={t('pages.incident.share.reset.desc')}
                  onConfirm={async () => {
                    const { token } = await resetShareLink(incident.id, row.id);
                    setTokenInfo({ name: row.name ?? '', token });
                    void load();
                  }}
                >
                  {t('pages.incident.share.reset')}
                </ConfirmLink>
                <DeleteConfirmLink
                  title={t('pages.incident.share.revoke.title')}
                  description={t('pages.incident.share.revoke.desc')}
                  onConfirm={async () => {
                    await deleteShareLink(incident.id, row.id);
                    message.success(t('pages.incident.share.revoked'));
                    void load();
                  }}
                >
                  {t('pages.incident.share.revoke')}
                </DeleteConfirmLink>
              </Space>
            ),
          },
        ]}
      />
      {createOpen && (
        <ModalForm<{ name: string; expireHours?: number }>
          title={t('pages.incident.share.create')}
          width={480}
          open
          onOpenChange={(open) => {
            if (!open) setCreateOpen(false);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{ expireHours: 72 }}
          onFinish={async (values) => {
            const { token } = await createShareLink(incident.id, {
              name: values.name.trim(),
              expireHours: values.expireHours,
            });
            setTokenInfo({ name: values.name.trim(), token });
            void load();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.incident.share.name')}
            rules={[
              rules.required(t('pages.incident.share.name')),
              rules.maxChars(INCIDENT_LIMITS.shareNameMax),
            ]}
            extra={t('pages.incident.share.nameHint')}
          />
          <ProFormDigit
            name="expireHours"
            label={t('pages.incident.share.expireHours')}
            min={1}
            max={24 * 90}
            fieldProps={{ precision: 0 }}
            extra={t('pages.incident.share.expireHint')}
          />
        </ModalForm>
      )}
      <Modal
        open={!!tokenInfo}
        title={tokenInfo?.name}
        footer={null}
        onCancel={() => setTokenInfo(null)}
        destroyOnHidden
      >
        <Alert
          type="warning"
          showIcon
          title={t('pages.incident.share.tokenHint')}
          style={{ marginBottom: 12 }}
        />
        <Typography.Paragraph
          className={styles.mono}
          copyable={{ text: url, icon: <CopyOutlined /> }}
        >
          {url}
        </Typography.Paragraph>
      </Modal>
    </>
  );
};

export const UpdatesPanel: React.FC<{
  incident: Incident;
  refreshKey: number;
  onChanged: () => void;
}> = ({ incident, refreshKey, onChanged }) => {
  const t = useT();
  const has = usePermissions();
  const { styles } = useIncidentStyles();
  const [items, setItems] = useState<IncidentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);
  // 只采纳最后一次加载的结果：切换故障或连续刷新时，旧响应不覆盖新数据
  const seq = useRef(0);

  const load = useCallback(async () => {
    const current = ++seq.current;
    setLoading(true);
    try {
      const result = await listUpdates(incident.id);
      if (current !== seq.current) return;
      setItems(result.items ?? []);
    } catch {
      if (current !== seq.current) return;
      setItems([]);
    } finally {
      if (current === seq.current) setLoading(false);
    }
  }, [incident.id]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const canPublish =
    incident.canHandle === true &&
    incident.status <= 4 &&
    has('incident.list.update');

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <SectionTitle style={{ margin: 0 }}>
          {t('pages.incident.update.title')}
        </SectionTitle>
        {canPublish && (
          <Button type="primary" onClick={() => setPublishOpen(true)}>
            {t('pages.incident.update.publish')}
          </Button>
        )}
      </Flex>
      <Spin spinning={loading}>
        {items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.incident.update.empty')}
          />
        ) : (
          <Timeline
            items={items.map((u) => ({
              key: u.id,
              color: UPDATE_KIND_META[u.kind ?? 1].color,
              children: (
                <>
                  <div className={styles.timelineHead}>
                    <Tag
                      color={UPDATE_KIND_META[u.kind ?? 1].color}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {t(UPDATE_KIND_META[u.kind ?? 1].textId)}
                    </Tag>
                    <span className={styles.hint}>
                      {formatTime(u.createTime)}
                    </span>
                    <span className={styles.hint}>
                      <RefName ref={u.author} />
                    </span>
                  </div>
                  <div className={styles.pre}>{u.content}</div>
                </>
              ),
            }))}
          />
        )}
      </Spin>
      {has('incident.list.share') && (
        <ShareLinks
          incident={incident}
          writable={incident.canHandle === true}
        />
      )}
      {publishOpen && (
        <PublishModal
          incident={incident}
          onClose={() => setPublishOpen(false)}
          onDone={onChanged}
        />
      )}
    </div>
  );
};
