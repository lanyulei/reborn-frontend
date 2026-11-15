/**
 * 值班日历：一次只看一张值班表——分组与值班表必选，默认第一个分组的第一张值班表，
 * 选择记在地址栏参数里（?groupId=&scheduleId=）。
 * 布局：当前值班 + 筛选卡片（分组 / 值班表 / 人员 / 我的值班）+ 内容卡片（月视图 / 列表，头部右侧为操作与视图切换）。
 * 卡片内边距、间距与项目内 ProTable 页面（筛选卡片 24px、表格卡片工具栏 64px）一致。
 * 点击班次查看详情并可发起替班；替班班次可撤销；有排班异常的日期标红；
 * 点击还缺主或备值班人的日期（今天及以后）可临时安排，一次配置主 / 备值班人。
 * 时间一律按浏览器本地时区展示。
 */
import { LinkOutlined, SwapOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  DatePicker,
  Modal,
  Segmented,
  Select,
  Switch,
  Tag,
  Tooltip,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listGroups } from '@/services/oncall/group';
import {
  getCurrentDuty,
  listSchedules,
  listShifts,
} from '@/services/oncall/schedule';
import type {
  OncallCurrentDuty,
  OncallGroup,
  OncallSchedule,
  OncallShift,
  OncallShiftIssue,
  OncallShiftRole,
} from '@/services/oncall/typings';
import { usePermissions } from '@/services/system/permissions';
import { useEnumText, useT } from '@/utils/i18n';
import { fetchAllPages } from '@/utils/paging';
import { ManageLink, useIssueText } from '../components/hooks';
import { MonthCalendar } from '../components/MonthCalendar';
import {
  ONCALL_SHIFT_ROLE_META,
  ONCALL_SHIFT_SOURCE_META,
} from '../components/meta';
import { ShareLinks } from '../components/ShareLinks';
import {
  OverrideModal,
  type OverrideTarget,
  ShiftDetailModal,
} from '../components/ShiftModals';
import { useOncallStyles } from '../components/styles';
import {
  addDutyDays,
  DATE_TIME_FORMAT,
  dutyDayStart,
  formatDateTime,
  formatRange,
  mergeAdjacentShifts,
  monthQueryRange,
} from '../components/time';
import { UserSelect } from '../components/UserSelect';

type ViewMode = 'month' | 'list';
/** 班次查询范围上限（天，与后端一致） */
const MAX_RANGE_DAYS = 100;
/** 异常摘要最多列出的条数 */
const ISSUE_PREVIEW = 5;

const OncallCalendar: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const { styles, cx } = useOncallStyles();
  const issueText = useIssueText();
  const roleText = useEnumText(ONCALL_SHIFT_ROLE_META);
  const sourceText = useEnumText(ONCALL_SHIFT_SOURCE_META);
  const [searchParams, setSearchParams] = useSearchParams();

  // 分组与值班表：加载完成前为 null
  const [groups, setGroups] = useState<OncallGroup[] | null>(null);
  const [schedules, setSchedules] = useState<OncallSchedule[] | null>(null);
  // 当前分组与值班表以地址栏参数为准（?groupId=&scheduleId=），刷新、分享链接都保持不变
  const groupId = searchParams.get('groupId') || undefined;
  const scheduleId = searchParams.get('scheduleId') || undefined;
  const select = (group?: string, schedule?: string) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of [
      ['groupId', group],
      ['scheduleId', schedule],
    ] as const) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // 替换当前历史记录：切换筛选不产生一串后退步骤
    setSearchParams(next, { replace: true });
  };
  const [userId, setUserId] = useState<string>();
  const [mine, setMine] = useState(false);
  const [view, setView] = useState<ViewMode>('month');
  const [month, setMonth] = useState<Dayjs>(() => dayjs());
  const [listRange, setListRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().startOf('day'),
    dayjs().add(30, 'day').startOf('day'),
  ]);

  const [shifts, setShifts] = useState<OncallShift[]>([]);
  const [issues, setIssues] = useState<OncallShiftIssue[]>([]);
  const [duties, setDuties] = useState<OncallCurrentDuty[]>([]);
  const [loading, setLoading] = useState(false);
  // 替班 / 撤销后递增，触发班次与当前值班重新拉取
  const [version, setVersion] = useState(0);

  const [activeShift, setActiveShift] = useState<OncallShift | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<OverrideTarget | null>(
    null,
  );
  const [shareOpen, setShareOpen] = useState(false);

  const canOverride = has('oncall.calendar.override');

  // 筛选项：全部分组与全部值班表（值班表按所选分组在前端过滤）
  useEffect(() => {
    fetchAllPages<OncallGroup>((page, pageSize) =>
      listGroups({ page, pageSize }),
    )
      .then(setGroups)
      .catch(() => setGroups([]));
    listSchedules()
      .then(({ items }) => setSchedules(items ?? []))
      .catch(() => setSchedules([]));
  }, []);

  const scheduleList = schedules ?? [];
  const scheduleById = useMemo(
    () => new Map(scheduleList.map((s) => [s.id, s])),
    [schedules],
  );
  const scheduleOptions = useMemo(
    () =>
      scheduleList
        .filter((s) => s.groupId === groupId)
        .map((s) => ({ value: s.id, label: s.config.name })),
    [schedules, groupId],
  );

  // 必须选中一个分组和一张值班表：地址栏没带或带的已失效时，落到第一个分组的第一张值班表；
  // 只带了值班表时补上它所属的分组
  useEffect(() => {
    if (!groups || !schedules) return;
    const current = scheduleId ? scheduleById.get(scheduleId) : undefined;
    const group =
      groupId && groups.some((g) => g.id === groupId)
        ? groupId
        : (current?.groupId ?? groups[0]?.id);
    const schedule =
      current && current.groupId === group
        ? current.id
        : schedules.find((s) => s.groupId === group)?.id;
    if (group !== groupId || schedule !== scheduleId) select(group, schedule);
  }, [groups, schedules, groupId, scheduleId]);

  const monthKey = month.format('YYYY-MM');
  const range = useMemo(
    () =>
      view === 'month'
        ? monthQueryRange(month)
        : {
            startTime: listRange[0].startOf('day').toISOString(),
            endTime: listRange[1].add(1, 'day').startOf('day').toISOString(),
          },
    [view, monthKey, listRange],
  );

  useEffect(() => {
    // 没有选中值班表（还在加载，或所选分组下没有值班表）：不取数
    if (!scheduleId) {
      setShifts([]);
      setIssues([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    listShifts({
      ...range,
      groupId,
      scheduleId,
      userId: mine ? undefined : userId,
      mine: mine || undefined,
    })
      .then((result) => {
        if (cancelled) return;
        setShifts(result.items ?? []);
        setIssues(result.issues ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setShifts([]);
        setIssues([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, groupId, scheduleId, userId, mine, version]);

  useEffect(() => {
    if (!scheduleId) {
      setDuties([]);
      return;
    }
    let cancelled = false;
    getCurrentDuty({ groupId, scheduleId }, { silent: true })
      .then(({ items }) => {
        if (!cancelled) setDuties(items ?? []);
      })
      .catch(() => {
        if (!cancelled) setDuties([]);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId, scheduleId, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const canManageShift = (shift: OncallShift) =>
    !!shift.scheduleId &&
    scheduleById.get(shift.scheduleId)?.canManage === true;

  const startOverride = (shift: OncallShift) => {
    const schedule = shift.scheduleId
      ? scheduleById.get(shift.scheduleId)
      : undefined;
    if (!schedule) return;
    setOverrideTarget({
      schedule,
      role: shift.role,
      startTime: shift.startTime,
      endTime: shift.endTime,
    });
  };

  // 临时安排值班：某一天、当前筛选范围内，能管理且已启用的值班表里还缺哪些角色。
  // 值班日 = 当天交接时刻 ~ 次日交接时刻；某角色在值班日结束前一刻有人即视为已安排
  const assignPlan = (date: Dayjs) => {
    const day = date.format('YYYY-MM-DD');
    const scoped = scheduleList.filter(
      (s) =>
        (!groupId || s.groupId === groupId) &&
        (!scheduleId || s.id === scheduleId),
    );
    const manageable = scoped.filter((s) => s.canManage === true);
    const enabled = manageable.filter(
      (s) => s.status === 1 && !!s.generatedUntil,
    );
    const missing: Record<string, OncallShiftRole[]> = {};
    const candidates = enabled.filter((s) => {
      const end = dutyDayStart(s.config, addDutyDays(day, 1));
      // 这个值班日须在已排班范围内
      if (end.isAfter(dayjs(s.generatedUntil))) return false;
      const probe = end.subtract(1, 'minute');
      const covered = (role: OncallShiftRole) =>
        shifts.some(
          (shift) =>
            shift.scheduleId === s.id &&
            shift.role === role &&
            !dayjs(shift.startTime).isAfter(probe) &&
            dayjs(shift.endTime).isAfter(probe),
        );
      const roles: OncallShiftRole[] = [];
      if (!covered(1)) roles.push(1);
      if (s.config.backupEnabled && !covered(2)) roles.push(2);
      missing[s.id] = roles;
      return roles.length > 0;
    });
    return { day, scoped, manageable, enabled, candidates, missing };
  };

  // 点击还缺值班人的日期：弹窗一次配置主 / 备值班人；没有可用的值班表时按原因分别提示
  const assignDay = (date: Dayjs) => {
    const { day, scoped, manageable, enabled, candidates, missing } =
      assignPlan(date);
    if (candidates.length === 0) {
      if (scoped.length === 0) {
        message.info(t('pages.oncall.calendar.assign.noSchedule'));
      } else if (manageable.length === 0) {
        message.info(t('pages.oncall.calendar.assign.noPermission'));
      } else if (enabled.length === 0) {
        message.info(t('pages.oncall.calendar.assign.disabled'));
      } else {
        const until = enabled
          .map((s) => dayjs(s.generatedUntil))
          .reduce((max, cur) => (cur.isAfter(max) ? cur : max));
        message.info(
          t('pages.oncall.calendar.assign.outOfRange', {
            time: until.format(DATE_TIME_FORMAT),
          }),
        );
      }
      return;
    }
    setOverrideTarget({
      schedule: candidates[0],
      candidates,
      missing,
      dates: [day, day],
    });
  };

  const selectedSchedule = scheduleId
    ? scheduleById.get(scheduleId)
    : undefined;
  const listData = useMemo(() => mergeAdjacentShifts(shifts), [shifts]);

  const columns: ProColumns<OncallShift>[] = [
    {
      title: t('pages.oncall.shift.column.time'),
      dataIndex: 'startTime',
      width: 290,
      render: (_, record) => formatRange(record.startTime, record.endTime),
    },
    {
      title: t('pages.oncall.shift.column.schedule'),
      dataIndex: 'scheduleName',
      ellipsis: true,
    },
    {
      title: t('pages.oncall.shift.column.role'),
      dataIndex: 'role',
      width: 90,
      render: (_, record) => roleText(record.role),
    },
    {
      title: t('pages.oncall.shift.column.user'),
      dataIndex: 'userName',
      render: (_, record) => (
        <>
          {record.userName || t('common.empty')}
          {record.userAvailable === false && (
            <Tag color="error" style={{ marginInlineStart: 8 }}>
              {t('pages.oncall.member.unavailable')}
            </Tag>
          )}
        </>
      ),
    },
    {
      title: t('pages.oncall.shift.column.source'),
      dataIndex: 'source',
      width: 100,
      render: (_, record) => (
        <Tag color={record.source === 2 ? 'warning' : undefined}>
          {sourceText(record.source ?? 1)}
        </Tag>
      ),
    },
    {
      title: t('pages.oncall.shift.column.origin'),
      dataIndex: 'originUserName',
      width: 120,
      renderText: (value: string) => value || t('common.empty'),
    },
    {
      title: t('pages.oncall.shift.column.remark'),
      dataIndex: 'remark',
      ellipsis: true,
      renderText: (value: string) => value || t('common.empty'),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 100,
      render: (_, record) => [
        <a key="view" onClick={() => setActiveShift(record)}>
          {t('common.action.view')}
        </a>,
        canOverride && dayjs(record.endTime).isAfter(dayjs()) && (
          <ManageLink
            key="override"
            canManage={canManageShift(record)}
            onClick={() => startOverride(record)}
          >
            {t('pages.oncall.override.title')}
          </ManageLink>
        ),
      ],
    },
  ];

  // 内容卡片头部右侧操作：月视图与列表共用，切换视图时位置不变
  const actions = (
    <div className={styles.toolbarActions}>
      {canOverride && (
        <Tooltip
          title={
            !selectedSchedule
              ? t('pages.oncall.override.pickSchedule')
              : selectedSchedule.canManage
                ? undefined
                : t('pages.oncall.needManager')
          }
        >
          <span>
            <Button
              icon={<SwapOutlined />}
              disabled={!selectedSchedule?.canManage}
              onClick={() =>
                selectedSchedule &&
                setOverrideTarget({ schedule: selectedSchedule })
              }
            >
              {t('pages.oncall.override.title')}
            </Button>
          </span>
        </Tooltip>
      )}
      {has('oncall.calendar.share') && (
        <Button icon={<LinkOutlined />} onClick={() => setShareOpen(true)}>
          {t('pages.oncall.share.mine')}
        </Button>
      )}
      <Segmented<ViewMode>
        value={view}
        onChange={setView}
        options={[
          { value: 'month', label: t('pages.oncall.view.month') },
          { value: 'list', label: t('pages.oncall.view.list') },
        ]}
      />
    </div>
  );

  return (
    <PageContainer title={false}>
      {duties.length > 0 && (
        <div className={styles.dutyBar}>
          {duties.map((duty) => (
            <div key={duty.scheduleId} className={styles.dutyLine}>
              <span className={styles.dutyTitle}>
                <span
                  className={cx(
                    styles.dutyDot,
                    !duty.primary?.userName && styles.dutyDotEmpty,
                  )}
                />
                {t('pages.oncall.duty.title')}
              </span>
              <span className={styles.dutyItem}>
                <span className={styles.dutyLabel}>
                  {t('enum.oncall.shiftRole.1')}
                </span>
                {duty.primary?.userName ? (
                  <span className={styles.dutyValue}>
                    {duty.primary.userName}
                  </span>
                ) : (
                  <span className={styles.dutyEmpty}>
                    {t('pages.oncall.duty.nobody')}
                  </span>
                )}
              </span>
              {duty.backup?.userName && (
                <span className={styles.dutyItem}>
                  <span className={styles.dutyLabel}>
                    {t('enum.oncall.shiftRole.2')}
                  </span>
                  <span className={styles.dutyValue}>
                    {duty.backup.userName}
                  </span>
                </span>
              )}
              <span className={cx(styles.dutyItem, styles.dutyHandover)}>
                {duty.nextHandoverTime ? (
                  <>
                    <span className={styles.dutyLabel}>
                      {t('pages.oncall.duty.nextHandover')}
                    </span>
                    <span className={styles.dutyValue}>
                      {formatDateTime(duty.nextHandoverTime)}
                    </span>
                  </>
                ) : (
                  <span className={styles.dutyLabel}>
                    {t('pages.oncall.duty.noHandover')}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.toolbar}>
        <Select
          showSearch={{ optionFilterProp: 'label' }}
          style={{ width: 180 }}
          placeholder={t('pages.oncall.filter.group')}
          loading={!groups}
          value={groupId}
          options={(groups ?? []).map((g) => ({ value: g.id, label: g.name }))}
          // 换分组：落到该分组的第一张值班表
          onChange={(value: string) =>
            select(value, scheduleList.find((s) => s.groupId === value)?.id)
          }
        />
        <Select
          showSearch={{ optionFilterProp: 'label' }}
          style={{ width: 180 }}
          placeholder={t('pages.oncall.filter.schedule')}
          loading={!schedules}
          value={scheduleId}
          options={scheduleOptions}
          onChange={(value: string) => select(groupId, value)}
        />
        <UserSelect
          style={{ width: 180 }}
          placeholder={t('pages.oncall.filter.user')}
          disabled={mine}
          value={mine ? undefined : userId}
          onChange={(value) => setUserId(value as string | undefined)}
        />
        <span className={styles.dutyRow}>
          <Switch size="small" checked={mine} onChange={setMine} />
          {t('pages.oncall.filter.mine')}
        </span>
      </div>

      {issues.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          title={t('pages.oncall.issue.summary', { count: issues.length })}
          description={
            <ul className={styles.issueList} style={{ maxWidth: 'none' }}>
              {issues.slice(0, ISSUE_PREVIEW).map((issue) => (
                <li
                  key={`${issue.type}${issue.scheduleId}${issue.userId}${issue.startTime}`}
                >
                  {issueText(issue)}
                </li>
              ))}
              {issues.length > ISSUE_PREVIEW && (
                <li>
                  {t('pages.oncall.issue.more', {
                    count: issues.length - ISSUE_PREVIEW,
                  })}
                </li>
              )}
            </ul>
          }
        />
      )}

      {view === 'month' ? (
        <MonthCalendar<OncallShift>
          month={month}
          onMonthChange={setMonth}
          shifts={shifts}
          issues={issues}
          loading={loading}
          isUnavailable={(shift) => shift.userAvailable === false}
          onShiftClick={setActiveShift}
          // 按人员筛选时空白不代表没人值班：不提供安排入口
          onDayClick={canOverride && !mine && !userId ? assignDay : undefined}
          // 空白日期总能点（没有可用值班表时提示原因）；已有值班人的日期只在还缺角色时能点
          canAssignDay={(date, lines) =>
            lines === 0 || assignPlan(date).candidates.length > 0
          }
          extra={actions}
        />
      ) : (
        <ProTable<OncallShift>
          cardBordered
          rowKey={(record) =>
            record.id ??
            `${record.scheduleId}-${record.role}-${record.startTime}`
          }
          search={false}
          options={false}
          headerTitle={
            <DatePicker.RangePicker
              allowClear={false}
              // 表格标题区默认加粗，日期保持常规字重
              style={{ fontWeight: 'normal' }}
              value={listRange}
              onChange={(value) => {
                if (!value?.[0] || !value?.[1]) return;
                if (value[1].diff(value[0], 'day') >= MAX_RANGE_DAYS) {
                  message.warning(
                    t('pages.oncall.filter.rangeLimit', {
                      days: MAX_RANGE_DAYS,
                    }),
                  );
                  return;
                }
                setListRange([value[0], value[1]]);
              }}
            />
          }
          toolBarRender={() => [actions]}
          pagination={{ defaultPageSize: 20, showSizeChanger: true }}
          loading={loading}
          dataSource={listData}
          columns={columns}
          scroll={{ x: 'max-content' }}
        />
      )}

      <ShiftDetailModal
        shift={activeShift}
        writable={canOverride}
        canManage={activeShift ? canManageShift(activeShift) : false}
        onClose={() => setActiveShift(null)}
        onOverride={startOverride}
        onChanged={refresh}
      />
      <OverrideModal
        target={overrideTarget}
        onClose={() => setOverrideTarget(null)}
        onDone={() => {
          setOverrideTarget(null);
          refresh();
        }}
      />
      <Modal
        title={t('pages.oncall.share.mine')}
        open={shareOpen}
        onCancel={() => setShareOpen(false)}
        footer={null}
        width={960}
        destroyOnHidden
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title={t('pages.oncall.share.mine.hint')}
        />
        <ShareLinks scopeType={3} writable canManage />
      </Modal>
    </PageContainer>
  );
};

export default OncallCalendar;
