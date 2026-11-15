/**
 * 值班域时间与班次工具：时区换算、班次合并、按天切片。
 * 日历一律按浏览器本地时区展示；值班表配置中的时刻按值班表时区解释。
 */
import dayjs, { type Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import type {
  OncallShiftIssue,
  OncallShiftRole,
  OncallShiftSource,
} from '@/services/oncall/typings';

dayjs.extend(utc);
dayjs.extend(timezone);

export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm';
const WALL_FORMAT = 'YYYY-MM-DDTHH:mm:00';
const FALLBACK_TIMEZONES = [
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
];

/** 浏览器当前时区（IANA 名） */
export const browserTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';

/** 可选时区清单（运行环境不支持枚举时回落常用时区） */
export const timezoneList = (): string[] => {
  const supported = (
    Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
  ).supportedValuesOf;
  try {
    const zones = supported ? supported('timeZone') : FALLBACK_TIMEZONES;
    return zones.includes('UTC') ? zones : ['UTC', ...zones];
  } catch {
    return ['UTC', ...FALLBACK_TIMEZONES];
  }
};

/** 选择器里的本地时刻（按 tz 解释）→ RFC3339 */
export const wallToInstant = (value: Dayjs, tz: string): string =>
  dayjs.tz(value.format(WALL_FORMAT), tz).toISOString();

/** RFC3339 → 选择器里的本地时刻（tz 下的钟面时间） */
export const instantToWall = (iso: string, tz: string): Dayjs =>
  dayjs(dayjs(iso).tz(tz).format(WALL_FORMAT));

export const formatDateTime = (iso?: string): string =>
  iso ? dayjs(iso).format(DATE_TIME_FORMAT) : '';

/** 时间段文案：同一天只写一次日期 */
export const formatRange = (start: string, end: string): string => {
  const s = dayjs(start);
  const e = dayjs(end);
  return `${s.format(DATE_TIME_FORMAT)} ~ ${e.format(
    s.isSame(e, 'day') ? 'HH:mm' : DATE_TIME_FORMAT,
  )}`;
};

/**
 * 值班以天为最小单位：一个「值班日」从当天的交接时刻到次日的交接时刻（值班表时区）。
 * 交接时刻取轮转起点在值班表时区下的钟面时刻。
 */
type DutyClock = { anchorTime: string; timezone: string };
const DATE_FORMAT = 'YYYY-MM-DD';

/** 每天的交接时刻 HH:mm（值班表时区） */
export const handoverClock = (config: DutyClock): string =>
  dayjs(config.anchorTime).tz(config.timezone).format('HH:mm');

/** 某个值班日（YYYY-MM-DD，值班表时区的日期）开始的时刻 */
export const dutyDayStart = (config: DutyClock, date: string): Dayjs =>
  dayjs.tz(`${date}T${handoverClock(config)}:00`, config.timezone);

/** 某个时刻所属的值班日（YYYY-MM-DD） */
export const dutyDayOf = (
  config: DutyClock,
  instant: string | Dayjs,
): string => {
  const local = dayjs(instant).tz(config.timezone);
  const date = local.format(DATE_FORMAT);
  return local.isBefore(dutyDayStart(config, date))
    ? local.subtract(1, 'day').format(DATE_FORMAT)
    : date;
};

/** 值班日加减天数 */
export const addDutyDays = (date: string, days: number): string =>
  dayjs(date).add(days, 'day').format(DATE_FORMAT);

/** 日历可展示的班次最小形态（登录态班次与公共日历班次都满足） */
export interface ShiftLike {
  id?: string;
  scheduleId?: string;
  scheduleName?: string;
  role: OncallShiftRole;
  userId?: string;
  userName?: string;
  startTime: string;
  endTime: string;
  source?: OncallShiftSource;
  originUserName?: string;
  /** 值班人手机号（仅公共日历在地址开启显示手机号时返回） */
  phone?: string;
}

const scheduleKeyOf = (s: ShiftLike) => s.scheduleId || s.scheduleName || '';
const personKeyOf = (s: ShiftLike) => s.userId || s.userName || '';
const isOverride = (s: ShiftLike) => s.source === 2;

const compareShift = (a: ShiftLike, b: ShiftLike) =>
  (a.scheduleName ?? '').localeCompare(b.scheduleName ?? '') ||
  scheduleKeyOf(a).localeCompare(scheduleKeyOf(b)) ||
  a.role - b.role ||
  a.startTime.localeCompare(b.startTime);

/**
 * 相邻且同一人的自动班次合并为一条（列表展示用）；替班班次保持独立
 * （按 id 撤销）。返回按开始时间排序的新数组。
 */
export function mergeAdjacentShifts<T extends ShiftLike>(shifts: T[]): T[] {
  const sorted = [...shifts].sort(compareShift);
  const out: T[] = [];
  for (const shift of sorted) {
    const last = out[out.length - 1];
    if (
      last &&
      !isOverride(last) &&
      !isOverride(shift) &&
      scheduleKeyOf(last) === scheduleKeyOf(shift) &&
      last.role === shift.role &&
      personKeyOf(last) === personKeyOf(shift) &&
      dayjs(last.endTime).valueOf() === dayjs(shift.startTime).valueOf()
    ) {
      out[out.length - 1] = { ...last, endTime: shift.endTime };
    } else {
      out.push(shift);
    }
  }
  return out.sort(
    (a, b) => a.startTime.localeCompare(b.startTime) || compareShift(a, b),
  );
}

/** 某天内的一段值班（已按当天边界裁剪） */
export interface DaySegment<T extends ShiftLike> {
  shift: T;
  /** 段开始（毫秒）；等于当天 0 点表示从前一天延续 */
  start: number;
  /** 段结束（毫秒）；等于次日 0 点表示延续到后一天 */
  end: number;
}

/** 某天内一张值班表某个角色的值班情况：依次由哪些人接力 */
export interface DayLine<T extends ShiftLike> {
  key: string;
  scheduleName: string;
  role: OncallShiftRole;
  segments: DaySegment<T>[];
}

/**
 * 把班次切到每一天：返回 dayKey（YYYY-MM-DD，本地时区）→ 当天各值班表各角色的接力线。
 * 同一条线内相邻且同一人、同来源的段合并。
 */
export function buildDayLines<T extends ShiftLike>(
  shifts: T[],
  days: Dayjs[],
): Map<string, DayLine<T>[]> {
  const sorted = [...shifts].sort(compareShift);
  const parsed = sorted.map((shift) => ({
    shift,
    start: dayjs(shift.startTime).valueOf(),
    end: dayjs(shift.endTime).valueOf(),
  }));
  const result = new Map<string, DayLine<T>[]>();
  for (const day of days) {
    const dayStart = day.startOf('day').valueOf();
    const dayEnd = day.endOf('day').valueOf() + 1;
    const lines = new Map<string, DayLine<T>>();
    for (const item of parsed) {
      if (item.end <= dayStart || item.start >= dayEnd) continue;
      const key = `${scheduleKeyOf(item.shift)}|${item.shift.role}`;
      let line = lines.get(key);
      if (!line) {
        line = {
          key,
          scheduleName: item.shift.scheduleName ?? '',
          role: item.shift.role,
          segments: [],
        };
        lines.set(key, line);
      }
      const last = line.segments[line.segments.length - 1];
      if (
        last &&
        personKeyOf(last.shift) === personKeyOf(item.shift) &&
        isOverride(last.shift) === isOverride(item.shift) &&
        (last.shift.originUserName ?? '') === (item.shift.originUserName ?? '')
      ) {
        last.end = Math.min(item.end, dayEnd);
        continue;
      }
      line.segments.push({
        shift: item.shift,
        start: Math.max(item.start, dayStart),
        end: Math.min(item.end, dayEnd),
      });
    }
    if (lines.size) result.set(day.format('YYYY-MM-DD'), [...lines.values()]);
  }
  return result;
}

/** 异常按天归集：dayKey → 与当天相交的异常 */
export function buildDayIssues(
  issues: OncallShiftIssue[],
  days: Dayjs[],
): Map<string, OncallShiftIssue[]> {
  const result = new Map<string, OncallShiftIssue[]>();
  if (!issues.length) return result;
  const parsed = issues.map((issue) => ({
    issue,
    start: dayjs(issue.startTime).valueOf(),
    end: dayjs(issue.endTime).valueOf(),
  }));
  for (const day of days) {
    const dayStart = day.startOf('day').valueOf();
    const dayEnd = day.endOf('day').valueOf() + 1;
    const hits = parsed
      .filter((item) => item.end > dayStart && item.start < dayEnd)
      .map((item) => item.issue);
    if (hits.length) result.set(day.format('YYYY-MM-DD'), hits);
  }
  return result;
}

/**
 * 月视图取数范围：当月前后各留出日历网格溢出的天数（6 行网格最多前溢 6 天、
 * 后溢 14 天），合计 ≤ 53 天，在登录态（100 天）与公共日历（62 天）上限之内。
 */
export const monthQueryRange = (
  month: Dayjs,
): { startTime: string; endTime: string } => ({
  startTime: month.startOf('month').subtract(7, 'day').toISOString(),
  endTime: month.endOf('month').add(15, 'day').startOf('day').toISOString(),
});

/** 月视图取数范围内的每一天 */
export const monthQueryDays = (month: Dayjs): Dayjs[] => {
  const start = month.startOf('month').subtract(7, 'day');
  const end = month.endOf('month').add(15, 'day').startOf('day');
  const days: Dayjs[] = [];
  for (let d = start; d.isBefore(end); d = d.add(1, 'day')) days.push(d);
  return days;
};
