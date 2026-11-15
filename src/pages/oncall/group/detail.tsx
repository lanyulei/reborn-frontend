/**
 * 值班分组详情：概要头（名称 / 说明 / 我的身份 / 操作）+ 四个标签：
 * 成员 | 值班表 | 公共地址 | 变更记录。
 * 元素权限决定操作是否展示；修改类操作另要求分组管理员身份（canManage），
 * 不满足时置灰并提示。
 */
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormRadio,
  ProTable,
} from '@ant-design/pro-components';
import { history, useAccess, useParams } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Dropdown,
  Empty,
  Form,
  type MenuProps,
  Select,
  Space,
  Spin,
  Tabs,
  Tag,
  Tooltip,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmLink, DeleteConfirmLink } from '@/components/TableActions';
import { JsonView } from '@/pages/notify/components/JsonView';
import {
  addGroupMembers,
  deleteGroup,
  getGroup,
  listChangeLogs,
  listGroupMembers,
  removeGroupMember,
  updateGroup,
  updateGroupMember,
} from '@/services/oncall/group';
import {
  deleteSchedule,
  getNotificationStatus,
  listSchedules,
  updateScheduleStatus,
} from '@/services/oncall/schedule';
import type {
  OncallChangeLog,
  OncallGroup,
  OncallGroupMember,
  OncallMemberRole,
  OncallNotificationStatus,
  OncallSchedule,
} from '@/services/oncall/typings';
import { usePermissions } from '@/services/system/permissions';
import {
  useEnumText,
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { displayName, ManageLink } from '../components/hooks';
import {
  ONCALL_ADD_MEMBER_MAX,
  ONCALL_CHANGE_ACTIONS,
  ONCALL_MEMBER_ROLE_META,
  ONCALL_MEMBER_ROLE_ORDER,
  ONCALL_ROTATION_UNIT_META,
  ONCALL_SCHEDULE_STATUS_META,
} from '../components/meta';
import { ShareLinks } from '../components/ShareLinks';
import { useOncallStyles } from '../components/styles';
import { formatDateTime } from '../components/time';
import { UserSelect } from '../components/UserSelect';
import { NotifyModal } from '../schedule/NotifyModal';
import { ScheduleDrawer } from '../schedule/ScheduleDrawer';
import { SchedulePreviewDrawer } from '../schedule/SchedulePreviewDrawer';
import { GroupFormFields, type GroupFormValues } from './GroupFormFields';

/** 公共地址范围切换的「整个分组」取值 */
const SCOPE_GROUP = '__group__';

/** 主按钮：不可管理时置灰并提示「需要分组管理员」 */
const ManageButton: React.FC<{
  canManage?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ canManage, onClick, children }) => {
  const t = useT();
  return (
    <Tooltip title={canManage ? undefined : t('pages.oncall.needManager')}>
      {/* 置灰按钮不触发鼠标事件，包一层保证提示可见 */}
      <span>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={!canManage}
          onClick={onClick}
        >
          {children}
        </Button>
      </span>
    </Tooltip>
  );
};

const noop = () => undefined;

const OncallGroupDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const t = useT();
  const has = usePermissions();
  const access = useAccess();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { message, modal } = App.useApp();
  // 查看日历会离开当前页：二次确认后再跳转
  const openCalendar = (query: string) =>
    modal.confirm({
      title: t('pages.oncall.group.calendar.confirm.title'),
      content: t('pages.oncall.group.calendar.confirm.description'),
      onOk: () => history.push(`/oncall/calendar?${query}`),
    });
  const { styles } = useOncallStyles();
  const memberRoleText = useEnumText(ONCALL_MEMBER_ROLE_META);
  const memberRoleOptions = useOptions(
    ONCALL_MEMBER_ROLE_META,
    ONCALL_MEMBER_ROLE_ORDER,
  );
  const rotationUnitText = useEnumText(ONCALL_ROTATION_UNIT_META);
  const scheduleStatusEnum = useValueEnum(ONCALL_SCHEDULE_STATUS_META);

  const [group, setGroup] = useState<OncallGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<OncallGroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [schedules, setSchedules] = useState<OncallSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  /** 值班表抽屉：id 为空串表示新建；seq 每次打开递增，作为 key 让抽屉以全新表单挂载 */
  const [scheduleEdit, setScheduleEdit] = useState({
    id: '',
    open: false,
    seq: 0,
  });
  const openScheduleEdit = (scheduleId: string) =>
    setScheduleEdit((prev) => ({
      id: scheduleId,
      open: true,
      seq: prev.seq + 1,
    }));
  const [schedulePreview, setSchedulePreview] = useState<OncallSchedule>();
  const [notifySchedule, setNotifySchedule] = useState<OncallSchedule>();
  // 值班通知是否配通：只读检查，取不到（如无权限）就不提示
  const [notifyStatus, setNotifyStatus] = useState<OncallNotificationStatus[]>(
    [],
  );
  useEffect(() => {
    getNotificationStatus()
      .then(({ items }) => setNotifyStatus(items ?? []))
      .catch(() => setNotifyStatus([]));
  }, []);
  const [shareScope, setShareScope] = useState<string>(SCOPE_GROUP);
  const logRef = useRef<ActionType>(null);

  const loadGroup = useCallback(async () => {
    try {
      const result = await getGroup(id, { silent: true });
      setGroup(result.group ?? null);
    } catch {
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const { items } = await listGroupMembers(id);
      setMembers(items ?? []);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [id]);

  // 发不出去的通知类别：个人通知只要有启用的值班表就提示；每日播报只在有值班表设了播报时间时提示
  const notifyWarnings = notifyStatus.filter(
    (item) =>
      !item.channelCount &&
      schedules.some(
        (schedule) =>
          schedule.status === 1 &&
          (item.kind === 1 || !!schedule.config.digestTime),
      ),
  );

  const loadSchedules = useCallback(async () => {
    setSchedulesLoading(true);
    try {
      const { items } = await listSchedules(id);
      setSchedules(items ?? []);
    } catch {
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void loadGroup();
    void loadMembers();
    void loadSchedules();
  }, [loadGroup, loadMembers, loadSchedules]);

  /** 写操作之后：刷新概要计数与变更记录 */
  const afterChange = useCallback(() => {
    void loadGroup();
    logRef.current?.reload();
  }, [loadGroup]);

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.userId)),
    [members],
  );

  if (loading) {
    return (
      <div style={{ padding: 96, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!group) {
    return (
      <Card variant="outlined">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.oncall.group.notFound')}
        >
          <Button type="primary" onClick={() => history.push('/oncall/group')}>
            {t('pages.oncall.group.backToList')}
          </Button>
        </Empty>
      </Card>
    );
  }

  const canManage = group.canManage === true;
  const canMember = has('oncall.group.member');
  const canSchedule = has('oncall.group.schedule');
  const canShare = has('oncall.group.share');

  const memberColumns: ProColumns<OncallGroupMember>[] = [
    {
      title: t('pages.oncall.member.column.name'),
      dataIndex: 'nickname',
      render: (_, record) => (
        <>
          {displayName(record)}
          {record.available === false && (
            <Tooltip title={t('pages.oncall.member.unavailable.tooltip')}>
              <Tag color="error" style={{ marginInlineStart: 8 }}>
                {t('pages.oncall.member.unavailable')}
              </Tag>
            </Tooltip>
          )}
        </>
      ),
    },
    {
      title: t('pages.oncall.member.column.username'),
      dataIndex: 'username',
      copyable: true,
    },
    {
      title: t('pages.oncall.member.column.role'),
      dataIndex: 'role',
      width: 110,
      render: (_, record) => (
        <Tag color={record.role === 1 ? 'gold' : undefined}>
          {memberRoleText(record.role)}
        </Tag>
      ),
    },
    {
      title: t('pages.oncall.member.column.inRotation'),
      dataIndex: 'inRotation',
      width: 110,
      render: (_, record) =>
        record.inRotation ? (
          <Tag color="processing">{t('pages.oncall.member.inRotation')}</Tag>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.oncall.member.column.joinTime'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 160,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 180,
      hideInTable: !canMember,
      render: (_, record) => {
        const nextRole: OncallMemberRole = record.role === 1 ? 2 : 1;
        const roleLabel = t(
          nextRole === 1
            ? 'pages.oncall.member.action.promote'
            : 'pages.oncall.member.action.demote',
        );
        const removeLabel = t('pages.oncall.member.action.remove');
        if (!canManage) {
          return [
            <ManageLink key="role" onClick={noop}>
              {roleLabel}
            </ManageLink>,
            <ManageLink key="remove" onClick={noop}>
              {removeLabel}
            </ManageLink>,
          ];
        }
        return [
          <ConfirmLink
            key="role"
            title={t('pages.oncall.member.role.title', {
              name: displayName(record),
              role: memberRoleText(nextRole),
            })}
            onConfirm={async () => {
              await updateGroupMember(id, record.userId, nextRole);
              message.success(t('common.msg.updated'));
              void loadMembers();
              afterChange();
            }}
          >
            {roleLabel}
          </ConfirmLink>,
          <DeleteConfirmLink
            key="remove"
            title={t('pages.oncall.member.remove.title', {
              name: displayName(record),
            })}
            description={t('pages.oncall.member.remove.description')}
            onConfirm={async () => {
              await removeGroupMember(id, record.userId);
              message.success(t('pages.oncall.member.msg.removed'));
              void loadMembers();
              afterChange();
            }}
          >
            {removeLabel}
          </DeleteConfirmLink>,
        ];
      },
    },
  ];

  const scheduleColumns: ProColumns<OncallSchedule>[] = [
    {
      title: t('pages.oncall.schedule.column.name'),
      dataIndex: ['config', 'name'],
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => openScheduleEdit(record.id)}>{record.config.name}</a>
      ),
    },
    {
      title: t('pages.oncall.schedule.column.rotation'),
      dataIndex: ['config', 'rotationUnit'],
      width: 120,
      render: (_, record) =>
        t('pages.oncall.schedule.rotation.every', {
          interval: record.config.rotationInterval,
          unit: rotationUnitText(record.config.rotationUnit),
        }),
    },
    {
      title: t('pages.oncall.schedule.column.timezone'),
      dataIndex: ['config', 'timezone'],
      width: 150,
    },
    {
      title: t('pages.oncall.schedule.column.members'),
      dataIndex: 'members',
      width: 100,
      render: (_, record) => {
        const list = record.members ?? [];
        const broken = list.filter((m) => m.available === false).length;
        return (
          <>
            {list.length}
            {broken > 0 && (
              <Tag color="error" style={{ marginInlineStart: 8 }}>
                {t('pages.oncall.schedule.unavailableCount', { count: broken })}
              </Tag>
            )}
          </>
        );
      },
    },
    {
      title: t('pages.oncall.schedule.column.backup'),
      dataIndex: ['config', 'backupEnabled'],
      width: 90,
      render: (_, record) =>
        record.config.backupEnabled
          ? t('pages.oncall.schedule.backup.on')
          : t('pages.oncall.schedule.backup.off'),
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: scheduleStatusEnum,
      width: 90,
    },
    {
      title: t('pages.oncall.schedule.column.generatedUntil'),
      dataIndex: 'generatedUntil',
      width: 160,
      render: (_, record) =>
        formatDateTime(record.generatedUntil) || t('common.empty'),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 160,
      render: (_, record) => {
        // 常用的"预览 / 编辑"直接露出，其余收进"更多"
        const actions: React.ReactNode[] = [
          <a key="preview" onClick={() => setSchedulePreview(record)}>
            {t('pages.oncall.schedule.action.preview')}
          </a>,
        ];
        const items: NonNullable<MenuProps['items']> = [];
        if (access.canOncallCalendar) {
          items.push({
            key: 'calendar',
            label: t('pages.oncall.schedule.action.calendar'),
          });
        }
        const enabled = record.status === 1;
        if (canSchedule) {
          actions.push(
            <a key="edit" onClick={() => openScheduleEdit(record.id)}>
              {t('common.action.edit')}
            </a>,
          );
          // 非分组管理员：写操作置灰，悬停提示原因
          const guard = canManage
            ? {}
            : { disabled: true, title: t('pages.oncall.needManager') };
          items.push(
            {
              key: 'notify',
              label: t('pages.oncall.notify.title'),
              ...guard,
            },
            {
              key: 'toggle',
              label: enabled
                ? t('pages.oncall.schedule.action.disable')
                : t('pages.oncall.schedule.action.enable'),
              ...guard,
            },
            { type: 'divider' },
            {
              key: 'delete',
              label: t('common.action.delete'),
              danger: true,
              ...guard,
            },
          );
        }
        const toggle = async () => {
          await updateScheduleStatus(record.id, enabled ? 2 : 1);
          message.success(t('common.msg.updated'));
          void loadSchedules();
          afterChange();
        };
        const onMenuClick = (key: string) => {
          if (key === 'calendar') {
            openCalendar(`groupId=${id}&scheduleId=${record.id}`);
          } else if (key === 'notify') {
            setNotifySchedule(record);
          } else if (key === 'toggle') {
            // 停用会结束进行中的班次并清除未开始的班次：二次确认；启用直接执行
            if (!enabled) {
              void toggle();
              return;
            }
            modal.confirm({
              okButtonProps: { danger: true },
              title: t('pages.oncall.schedule.disable.title'),
              content: t('pages.oncall.schedule.disable.description'),
              onOk: toggle,
            });
          } else if (key === 'delete') {
            modal.confirm({
              okButtonProps: { danger: true },
              title: t('pages.oncall.schedule.delete.title'),
              content: t('pages.oncall.schedule.delete.description'),
              onOk: async () => {
                await deleteSchedule(record.id);
                message.success(t('common.msg.deleted'));
                if (shareScope === record.id) setShareScope(SCOPE_GROUP);
                void loadSchedules();
                void loadMembers();
                afterChange();
              },
            });
          }
        };
        if (items.length > 0) {
          actions.push(
            <Dropdown
              key="more"
              menu={{ items, onClick: ({ key }) => onMenuClick(key) }}
            >
              <a>
                {t('common.action.more')} <DownOutlined />
              </a>
            </Dropdown>,
          );
        }
        return actions;
      },
    },
  ];

  const logColumns: ProColumns<OncallChangeLog>[] = [
    {
      title: t('pages.oncall.log.column.time'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 170,
    },
    {
      title: t('pages.oncall.log.column.operator'),
      dataIndex: 'operatorName',
      width: 140,
      ellipsis: true,
      renderText: (value: string) => value || t('common.empty'),
    },
    {
      title: t('pages.oncall.log.column.action'),
      dataIndex: 'action',
      width: 160,
      render: (_, record) => (
        <Tag>
          {/* 未知操作码（后端新增而前端未跟进）原样显示 */}
          {(ONCALL_CHANGE_ACTIONS as readonly string[]).includes(record.action)
            ? t(`enum.oncall.changeAction.${record.action}`)
            : record.action}
        </Tag>
      ),
    },
    {
      title: t('pages.oncall.log.column.summary'),
      dataIndex: 'summary',
      ellipsis: true,
    },
  ];

  return (
    <PageContainer title={false}>
      <div className={styles.summaryHeader}>
        <div className={styles.summaryBody}>
          <span className={styles.summaryTitle}>
            {group.name}
            {group.myRole === 1 && (
              <Tag color="gold">{t('enum.oncall.memberRole.1')}</Tag>
            )}
            {group.myRole === 2 && <Tag>{t('enum.oncall.memberRole.2')}</Tag>}
          </span>
          <span className={styles.summaryMeta}>
            {group.description && <span>{group.description}</span>}
            <span>
              {t('pages.oncall.group.meta.members', {
                count: group.memberCount ?? members.length,
              })}
            </span>
            <span>
              {t('pages.oncall.group.meta.schedules', {
                count: group.scheduleCount ?? schedules.length,
              })}
            </span>
          </span>
        </div>
        <Space>
          {access.canOncallCalendar && (
            <Button onClick={() => openCalendar(`groupId=${id}`)}>
              {t('pages.oncall.group.action.calendar')}
            </Button>
          )}
          {has('oncall.group.edit') && (
            <Tooltip
              title={canManage ? undefined : t('pages.oncall.needManager')}
            >
              <span>
                <Button disabled={!canManage} onClick={() => setEditOpen(true)}>
                  {t('common.action.edit')}
                </Button>
              </span>
            </Tooltip>
          )}
          {has('oncall.group.delete') && (
            <Tooltip
              title={canManage ? undefined : t('pages.oncall.needManager')}
            >
              <span>
                <Button
                  color="danger"
                  variant="outlined"
                  disabled={!canManage}
                  onClick={() => {
                    modal.confirm({
                      okButtonProps: { danger: true },
                      title: t('pages.oncall.group.delete.title'),
                      content: t('pages.oncall.group.delete.description'),
                      onOk: async () => {
                        await deleteGroup(id);
                        message.success(t('common.msg.deleted'));
                        history.push('/oncall/group');
                      },
                    });
                  }}
                >
                  {t('common.action.delete')}
                </Button>
              </span>
            </Tooltip>
          )}
        </Space>
      </div>

      <Tabs
        defaultActiveKey="schedules"
        items={[
          {
            key: 'schedules',
            label: t('pages.oncall.group.tab.schedules'),
            children: (
              <>
                {notifyWarnings.length > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                    title={t('pages.oncall.notifyStatus.title')}
                    description={
                      <ul
                        className={styles.issueList}
                        style={{ maxWidth: 'none' }}
                      >
                        {notifyWarnings.map((item) => (
                          <li key={item.kind}>
                            {t(`pages.oncall.notifyStatus.kind.${item.kind}`)}
                            {item.routeName
                              ? t('pages.oncall.notifyStatus.noChannel', {
                                  name: item.routeName,
                                })
                              : t('pages.oncall.notifyStatus.noRoute')}
                          </li>
                        ))}
                      </ul>
                    }
                    action={
                      access.canNotifyRoute && (
                        <Button
                          size="small"
                          onClick={() => history.push('/notify/rule/route')}
                        >
                          {t('pages.oncall.notifyStatus.configure')}
                        </Button>
                      )
                    }
                  />
                )}
                <ProTable<OncallSchedule>
                  cardBordered
                  rowKey="id"
                  search={false}
                  options={false}
                  pagination={false}
                  loading={schedulesLoading}
                  dataSource={schedules}
                  columns={scheduleColumns}
                  scroll={{ x: 'max-content' }}
                  headerTitle={
                    canSchedule && (
                      <ManageButton
                        canManage={canManage}
                        onClick={() => openScheduleEdit('')}
                      >
                        {t('pages.oncall.schedule.create.title')}
                      </ManageButton>
                    )
                  }
                />
              </>
            ),
          },
          {
            key: 'members',
            label: t('pages.oncall.group.tab.members'),
            children: (
              <ProTable<OncallGroupMember>
                cardBordered
                rowKey="userId"
                search={false}
                options={false}
                pagination={false}
                loading={membersLoading}
                dataSource={members}
                columns={memberColumns}
                scroll={{ x: 'max-content' }}
                headerTitle={
                  canMember && (
                    <ManageButton
                      canManage={canManage}
                      onClick={() => setAddOpen(true)}
                    >
                      {t('pages.oncall.member.add.title')}
                    </ManageButton>
                  )
                }
              />
            ),
          },
          {
            key: 'share',
            label: t('pages.oncall.group.tab.share'),
            children: (
              <ShareLinks
                scopeType={shareScope === SCOPE_GROUP ? 1 : 2}
                scopeId={shareScope === SCOPE_GROUP ? id : shareScope}
                writable={canShare}
                canManage={canManage}
                toolbar={
                  <Select
                    style={{ width: 240 }}
                    value={shareScope}
                    onChange={setShareScope}
                    options={[
                      {
                        value: SCOPE_GROUP,
                        label: t('pages.oncall.share.scope.group'),
                      },
                      ...schedules.map((s) => ({
                        value: s.id,
                        label: t('pages.oncall.share.scope.schedule', {
                          name: s.config.name,
                        }),
                      })),
                    ]}
                  />
                }
              />
            ),
          },
          {
            key: 'logs',
            label: t('pages.oncall.group.tab.logs'),
            children: (
              <ProTable<OncallChangeLog>
                cardBordered
                rowKey="id"
                actionRef={logRef}
                search={false}
                options={false}
                columns={logColumns}
                scroll={{ x: 'max-content' }}
                pagination={{ defaultPageSize: 20 }}
                expandable={{
                  rowExpandable: (record) =>
                    !!record.detail && Object.keys(record.detail).length > 0,
                  expandedRowRender: (record) => (
                    <JsonView value={record.detail} />
                  ),
                }}
                request={async (params) => {
                  const result = await listChangeLogs({
                    page: params.current,
                    pageSize: params.pageSize,
                    groupId: id,
                  });
                  return toTableResult(result);
                }}
              />
            ),
          },
        ]}
      />

      <ModalForm<GroupFormValues>
        title={t('pages.oncall.group.edit.title', { name: group.name })}
        width={480}
        open={editOpen}
        onOpenChange={setEditOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{ name: group.name, description: group.description }}
        submitter={submitter.save}
        onFinish={async (values) => {
          await updateGroup(id, {
            name: values.name,
            description: values.description?.trim() ?? '',
          });
          message.success(t('common.msg.saved'));
          afterChange();
          return true;
        }}
      >
        <GroupFormFields />
      </ModalForm>

      <ModalForm<{ userIds: string[]; role: OncallMemberRole }>
        title={t('pages.oncall.member.add.title')}
        width={520}
        open={addOpen}
        onOpenChange={setAddOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{ role: 2 }}
        onFinish={async (values) => {
          const { added } = await addGroupMembers(id, {
            userIds: values.userIds,
            role: values.role,
          });
          message.success(
            t('pages.oncall.member.msg.added', { count: added ?? 0 }),
          );
          void loadMembers();
          afterChange();
          return true;
        }}
      >
        <Form.Item
          name="userIds"
          label={t('pages.oncall.member.add.users')}
          tooltip={t('pages.oncall.member.add.users.tooltip')}
          rules={[
            {
              required: true,
              type: 'array',
              message: rules.select(t('pages.oncall.member.add.users')).message,
            },
          ]}
        >
          <UserSelect
            multiple
            maxCount={ONCALL_ADD_MEMBER_MAX}
            disabledIds={memberIds}
            disabledLabel={t('pages.oncall.member.add.joined')}
            placeholder={t('pages.oncall.member.add.placeholder')}
          />
        </Form.Item>
        <ProFormRadio.Group
          name="role"
          label={t('pages.oncall.member.column.role')}
          options={memberRoleOptions}
        />
      </ModalForm>

      <ScheduleDrawer
        key={scheduleEdit.seq}
        open={scheduleEdit.open}
        groupId={id}
        scheduleId={scheduleEdit.id || undefined}
        canManage={canManage}
        members={members}
        onClose={() => setScheduleEdit((prev) => ({ ...prev, open: false }))}
        onSaved={() => {
          void loadSchedules();
          // 轮转名单变化会影响成员的"轮转中"标记
          void loadMembers();
          afterChange();
        }}
      />
      <SchedulePreviewDrawer
        schedule={schedulePreview}
        onClose={() => setSchedulePreview(undefined)}
      />
      <NotifyModal
        schedule={notifySchedule}
        onClose={() => {
          setNotifySchedule(undefined);
          // 手动发送会写入变更记录
          afterChange();
        }}
      />
    </PageContainer>
  );
};

export default OncallGroupDetail;
