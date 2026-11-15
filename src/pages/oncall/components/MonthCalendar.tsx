/**
 * 值班月视图：antd Calendar 单元格渲染（带网格线的月历，日期在左上角，今天为实心圆）。每天按「值班表 × 角色」一条
 * 值班条，只写角色简称与值班人：每位值班人一种颜色；值班以天为单位，一天只显示当天接班的人
 * （交接日的交班人在悬停卡片里）；替班带斜纹；已过去的日期淡出。
 * 悬停一条查看完整时间段、手机号与原值班人；有排班异常的日期标红，悬停异常图标查看说明。
 * 登录态日历与公共日历共用（公共日历不传 onShiftClick / issues）。
 */
import {
  ExclamationCircleFilled,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Calendar, Popover, Space, Spin } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type React from 'react';
import { useMemo } from 'react';
import type { OncallShiftIssue } from '@/services/oncall/typings';
import { useT } from '@/utils/i18n';
import { useIssueText } from './hooks';
import { ONCALL_SHIFT_ROLE_SHORT } from './meta';
import { useOncallStyles } from './styles';
import {
  buildDayIssues,
  buildDayLines,
  type DayLine,
  monthQueryDays,
  type ShiftLike,
} from './time';

const DAY_MS = 24 * 3600 * 1000;
const personKey = (shift: ShiftLike) => shift.userId || shift.userName || '';

interface MonthCalendarProps<T extends ShiftLike> {
  /** 当前月份（任意一天） */
  month: Dayjs;
  onMonthChange: (month: Dayjs) => void;
  shifts: T[];
  issues?: OncallShiftIssue[];
  loading?: boolean;
  /** 行前是否带值班表名（同时展示多张值班表时） */
  showSchedule?: boolean;
  /** 值班人是否不可用（划线标红） */
  isUnavailable?: (shift: T) => boolean;
  onShiftClick?: (shift: T) => void;
  /** 这一天能否点击安排值班人（还缺主或备值班）；lines 为当天已有的值班条数 */
  canAssignDay?: (date: Dayjs, lines: number) => boolean;
  /** 点击可安排的日期（格子空白处；点值班条仍是查看班次） */
  onDayClick?: (date: Dayjs) => void;
  /** 头部最左侧（月份切换之前）的内容 */
  leading?: React.ReactNode;
  /** 头部右侧附加内容 */
  extra?: React.ReactNode;
}

export function MonthCalendar<T extends ShiftLike>({
  month,
  onMonthChange,
  shifts,
  issues,
  loading,
  showSchedule,
  isUnavailable,
  onShiftClick,
  canAssignDay,
  onDayClick,
  leading,
  extra,
}: MonthCalendarProps<T>) {
  const t = useT();
  const issueText = useIssueText();
  const { styles, cx, theme } = useOncallStyles();

  const monthKey = month.format('YYYY-MM');
  const days = useMemo(() => monthQueryDays(month), [monthKey]);
  const dayLines = useMemo(() => buildDayLines(shifts, days), [shifts, days]);
  const dayIssues = useMemo(
    () => buildDayIssues(issues ?? [], days),
    [issues, days],
  );

  // 只有同时出现多张值班表时才在行前带表名（单表时是纯噪音，挤占姓名空间）
  const multiSchedule = useMemo(
    () =>
      new Set(shifts.map((s) => s.scheduleId || s.scheduleName || '')).size > 1,
    [shifts],
  );
  const withSchedule = !!showSchedule && multiSchedule;

  // 每位值班人一种颜色：按人员标识排序后依次取色，同一批人的配色稳定
  const palette = [
    theme.blue,
    theme.purple,
    theme.cyan,
    theme.magenta,
    theme.green,
    theme.geekblue,
    theme.volcano,
    theme.orange,
  ];
  const personIndex = useMemo(() => {
    const keys = [...new Set(shifts.map(personKey).filter(Boolean))].sort();
    return new Map(keys.map((key, index) => [key, index]));
  }, [shifts]);
  const colorVar = (shift: T) => {
    const index = personIndex.get(personKey(shift));
    return {
      '--oncall-color':
        index === undefined
          ? theme.colorTextQuaternary
          : palette[index % palette.length],
    } as React.CSSProperties;
  };

  /** 悬停卡片：该值班表该角色当天的完整接力情况 */
  const renderDetail = (line: DayLine<T>, dayStart: number) => (
    <div className={styles.detail}>
      {line.segments.map((segment) => {
        const { shift } = segment;
        const dayEnd = dayStart + DAY_MS;
        return (
          <div
            key={`${shift.id ?? ''}${segment.start}`}
            className={styles.detailRow}
          >
            <span className={styles.personDot} style={colorVar(shift)} />
            <span className={styles.detailTime}>
              {segment.start > dayStart
                ? dayjs(segment.start).format('HH:mm')
                : '00:00'}
              {' ~ '}
              {segment.end < dayEnd
                ? dayjs(segment.end).format('HH:mm')
                : '24:00'}
            </span>
            <span
              className={cx(
                isUnavailable?.(shift) && styles.segmentUnavailable,
              )}
            >
              {shift.userName || t('common.empty')}
            </span>
            {shift.phone && (
              <span className={styles.detailMeta}>{shift.phone}</span>
            )}
            {shift.source === 2 && (
              <span className={cx(styles.segment, styles.segmentOverride)}>
                {shift.originUserName
                  ? t('pages.oncall.calendar.overrideOf', {
                      name: shift.originUserName,
                    })
                  : t('enum.oncall.shiftSource.2')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderLine = (line: DayLine<T>, dayStart: number) => {
    // 值班以天为单位：一天只显示当天接班（当天最后在岗）的人，交接细节在悬停卡片里
    const current = line.segments[line.segments.length - 1].shift;
    return (
      <Popover
        key={line.key}
        placement="right"
        mouseEnterDelay={0.3}
        title={`${line.scheduleName ? `${line.scheduleName} · ` : ''}${t(
          `enum.oncall.shiftRole.${line.role}`,
        )}`}
        content={renderDetail(line, dayStart)}
      >
        <div
          className={cx(
            styles.bar,
            line.role === 2 && styles.barBackup,
            current.source === 2 && styles.barOverride,
            onShiftClick && styles.barClickable,
          )}
          style={colorVar(current)}
          onClick={
            onShiftClick
              ? (event) => {
                  // 不触发格子的「安排值班」
                  event.stopPropagation();
                  onShiftClick(current);
                }
              : undefined
          }
        >
          <span className={styles.barRole}>
            {t(ONCALL_SHIFT_ROLE_SHORT[line.role].textId)}
          </span>
          {withSchedule && line.scheduleName && (
            <span className={styles.lineSchedule}>{line.scheduleName}：</span>
          )}
          <span
            className={cx(
              isUnavailable?.(current) && styles.segmentUnavailable,
            )}
          >
            {current.userName || t('common.empty')}
          </span>
        </div>
      </Popover>
    );
  };

  const today = dayjs();

  return (
    <div className={styles.calendarWrap}>
      <Spin spinning={!!loading}>
        <Calendar
          mode="month"
          value={month}
          onChange={onMonthChange}
          headerRender={({ value, onChange }) => (
            <div className={styles.calendarHeader}>
              {leading}
              <Space.Compact>
                <Button
                  icon={<LeftOutlined />}
                  aria-label={t('pages.oncall.calendar.prevMonth')}
                  onClick={() => onChange(value.subtract(1, 'month'))}
                />
                <Button onClick={() => onChange(dayjs())}>
                  {t('pages.oncall.calendar.today')}
                </Button>
                <Button
                  icon={<RightOutlined />}
                  aria-label={t('pages.oncall.calendar.nextMonth')}
                  onClick={() => onChange(value.add(1, 'month'))}
                />
              </Space.Compact>
              <span className={styles.calendarTitle}>
                {value.format('YYYY-MM')}
              </span>
              <span className={styles.spacer} />
              {extra}
            </div>
          )}
          fullCellRender={(date, info) => {
            if (info.type !== 'date') return info.originNode;
            const key = date.format('YYYY-MM-DD');
            const lines = dayLines.get(key) ?? [];
            const hits = dayIssues.get(key);
            const isToday = date.isSame(today, 'day');
            const assignable =
              !!onDayClick &&
              !date.isBefore(today, 'day') &&
              (canAssignDay?.(date, lines.length) ?? lines.length === 0);
            return (
              <div
                className={cx(
                  styles.cell,
                  assignable && styles.cellAssignable,
                  !date.isSame(month, 'month') && styles.cellOutside,
                  isToday && styles.cellToday,
                  date.isBefore(today, 'day') && styles.cellPast,
                  hits && styles.cellIssue,
                )}
                onClick={assignable ? () => onDayClick?.(date) : undefined}
              >
                <div className={styles.cellHead}>
                  <span
                    className={cx(
                      styles.cellDate,
                      isToday && styles.cellDateToday,
                    )}
                  >
                    {date.date()}
                  </span>
                  {hits && (
                    <Popover
                      title={t('pages.oncall.calendar.issueTitle', {
                        count: hits.length,
                      })}
                      content={
                        <ul className={styles.issueList}>
                          {hits.map((issue) => (
                            <li
                              key={`${issue.type}${issue.scheduleId}${issue.userId}${issue.startTime}`}
                            >
                              {issueText(issue)}
                            </li>
                          ))}
                        </ul>
                      }
                    >
                      <ExclamationCircleFilled
                        className={styles.cellIssueIcon}
                      />
                    </Popover>
                  )}
                </div>
                <div className={styles.cellBody}>
                  {lines.map((line) =>
                    renderLine(line, date.startOf('day').valueOf()),
                  )}
                </div>
              </div>
            );
          }}
        />
        <span className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.roleBadge}>
              {t('enum.oncall.shiftRoleShort.1')}
            </span>
            {t('enum.oncall.shiftRole.1')}
          </span>
          <span className={styles.legendItem}>
            <span className={cx(styles.roleBadge, styles.roleBadgeBackup)}>
              {t('enum.oncall.shiftRoleShort.2')}
            </span>
            {t('enum.oncall.shiftRole.2')}
          </span>
          <span className={styles.legendItem}>
            <span
              className={cx(
                styles.bar,
                styles.barOverride,
                styles.legendSwatch,
              )}
            >
              {t('enum.oncall.shiftSource.2')}
            </span>
          </span>
          {issues !== undefined && (
            <span className={styles.legendItem}>
              <ExclamationCircleFilled className={styles.cellIssueIcon} />
              {t('pages.oncall.calendar.legend.issue')}
            </span>
          )}
        </span>
      </Spin>
    </div>
  );
}
