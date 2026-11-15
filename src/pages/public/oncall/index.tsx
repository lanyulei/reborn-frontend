/**
 * 公共值班日历（免登录、只读、无主布局）：凭地址里的令牌读取月视图。
 * 无效、过期、作废的地址统一提示不可用。
 * 分组范围的地址一次只看一张值班表：页头只写分组，值班表在月历左上角选择（必选，默认第一张），
 * 选择记在地址栏参数里（?schedule=值班表名，同一分组内表名唯一）。
 * 匿名页面：不依赖登录态，请求不走 authRequest（不触发刷新令牌 / 跳转登录）。
 */
import { CalendarOutlined } from '@ant-design/icons';
import { Helmet, useParams, useSearchParams } from '@umijs/max';
import { Button, Result, Select, Tag } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { MonthCalendar } from '@/pages/oncall/components/MonthCalendar';
import { ONCALL_SCOPE_TYPE_META } from '@/pages/oncall/components/meta';
import { useOncallStyles } from '@/pages/oncall/components/styles';
import {
  browserTimezone,
  monthQueryRange,
} from '@/pages/oncall/components/time';
import { getPublicCalendar } from '@/services/oncall/share';
import type {
  OncallPublicCalendar,
  OncallPublicShift,
} from '@/services/oncall/typings';
import { useT } from '@/utils/i18n';

type LoadState = 'loading' | 'ok' | 'invalid' | 'error';

const PublicOncallCalendar: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const t = useT();
  const { styles } = useOncallStyles();
  const [month, setMonth] = useState<Dayjs>(() => dayjs());
  const [calendar, setCalendar] = useState<OncallPublicCalendar | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  // 见过的值班表名（翻到没有某张表排班的月份时，下拉里仍保留它）
  const [scheduleNames, setScheduleNames] = useState<string[]>([]);

  const monthKey = month.format('YYYY-MM');
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPublicCalendar(token, monthQueryRange(month))
      .then((result) => {
        if (cancelled) return;
        setCalendar(result);
        setState('ok');
        if (result.scopeType === 1) {
          setScheduleNames((prev) => {
            const names = new Set(prev);
            for (const item of result.items ?? []) {
              if (item.scheduleName) names.add(item.scheduleName);
            }
            return names.size === prev.length ? prev : [...names].sort();
          });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        // 4xx：地址无效 / 过期 / 作废（后端统一 404，令牌格式不对为 400）
        setState(
          status !== undefined && status >= 400 && status < 500
            ? 'invalid'
            : 'error',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, monthKey, retry]);

  // 分组范围：一次只展示一张值班表（只有一张时也显示选择框，标明是哪张表）
  const picking = calendar?.scopeType === 1 && scheduleNames.length > 0;
  const wanted = searchParams.get('schedule');
  const schedule = picking
    ? wanted && scheduleNames.includes(wanted)
      ? wanted
      : scheduleNames[0]
    : undefined;
  const selectSchedule = (name: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('schedule', name);
    setSearchParams(next, { replace: true });
  };
  // 默认选中的值班表也写进地址栏，分享出去的链接能定位到同一张表
  useEffect(() => {
    if (schedule && schedule !== wanted) selectSchedule(schedule);
  }, [schedule, wanted]);
  const shifts = useMemo(
    () =>
      (calendar?.items ?? []).filter(
        (item) => !schedule || item.scheduleName === schedule,
      ),
    [calendar, schedule],
  );

  const title = calendar?.title || t('pages.oncall.public.title');

  if (state === 'invalid') {
    return (
      <div className={styles.publicPage}>
        <Helmet>
          <title>{t('pages.oncall.public.title')}</title>
        </Helmet>
        <Result
          status="404"
          title={t('pages.oncall.public.invalid.title')}
          subTitle={t('pages.oncall.public.invalid.description')}
        />
      </div>
    );
  }

  if (state === 'error' && !calendar) {
    return (
      <div className={styles.publicPage}>
        <Helmet>
          <title>{t('pages.oncall.public.title')}</title>
        </Helmet>
        <Result
          status="warning"
          title={t('pages.oncall.public.error.title')}
          extra={
            <Button type="primary" onClick={() => setRetry((n) => n + 1)}>
              {t('pages.oncall.public.error.retry')}
            </Button>
          }
        />
      </div>
    );
  }


  return (
    <div className={styles.publicPage}>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className={styles.publicInner}>
        <div className={styles.card}>
          <div className={styles.publicHeader}>
            <span className={styles.publicIcon}>
              <CalendarOutlined />
            </span>
            <div className={styles.publicHeading}>
              <div className={styles.publicTitleRow}>
                <span className={styles.publicTitle}>{title}</span>
                {calendar?.scopeType && (
                  <Tag>
                    {t(ONCALL_SCOPE_TYPE_META[calendar.scopeType].textId)}
                  </Tag>
                )}
                <Tag>{t('pages.oncall.public.readonly')}</Tag>
              </div>
              <div className={styles.publicDesc}>
                {calendar?.description || t('pages.oncall.public.noDescription')}
              </div>
            </div>
            <span className={styles.publicHint}>
              {t('pages.oncall.public.timezone', {
                timezone: browserTimezone(),
              })}
            </span>
          </div>
        </div>
        <MonthCalendar<OncallPublicShift>
          month={month}
          onMonthChange={setMonth}
          shifts={shifts}
          loading={loading}
          showSchedule={calendar?.scopeType !== 2}
          // 值班表选择放在最左侧，写法同其他页面的搜索项（标签：选择框）
          leading={
            picking && (
              <span className={styles.fieldInline}>
                <span>{t('pages.oncall.shift.column.schedule')}：</span>
                <Select
                  showSearch
                  style={{ width: 200 }}
                  placeholder={t('pages.oncall.filter.schedule')}
                  value={schedule}
                  options={scheduleNames.map((name) => ({
                    value: name,
                    label: name,
                  }))}
                  onChange={selectSchedule}
                />
              </span>
            )
          }
        />
      </div>
    </div>
  );
};

export default PublicOncallCalendar;
