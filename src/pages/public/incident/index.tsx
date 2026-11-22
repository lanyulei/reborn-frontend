/**
 * 故障匿名状态页（免登录、只读、无主布局）：凭地址里的分享令牌读取故障的编号 / 标题 / 等级 / 状态与对外公告。
 * 无效、过期、作废的地址统一提示不可用。不依赖登录态，请求不走 authRequest。
 */
import { Helmet, useParams } from '@umijs/max';
import { Badge, Button, Result, Spin, Tag, Timeline } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { SEVERITY_META, STATUS_META, UPDATE_KIND_META } from '@/pages/incident/components/meta';
import { useIncidentStyles } from '@/pages/incident/components/styles';
import type { PublicIncident } from '@/services/incident/typings';
import { getPublicIncident } from '@/services/incident/update';
import { formatTime } from '@/utils/format';
import { useT } from '@/utils/i18n';

type LoadState = 'loading' | 'ok' | 'invalid' | 'error';

const PublicIncidentPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const t = useT();
  const { styles } = useIncidentStyles();
  const [data, setData] = useState<PublicIncident | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    getPublicIncident(token)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setState('ok');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const status = (error as { response?: { status?: number } })?.response?.status;
        setState(status !== undefined && status >= 400 && status < 500 ? 'invalid' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [token, retry]);

  if (state === 'loading') {
    return (
      <div className={styles.publicPage} style={{ textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }
  if (state !== 'ok' || !data) {
    return (
      <Result
        status={state === 'invalid' ? '404' : 'error'}
        title={t(state === 'invalid' ? 'pages.incident.public.invalid' : 'pages.incident.public.error')}
        extra={state === 'error' && <Button onClick={() => setRetry((n) => n + 1)}>{t('pages.incident.retry')}</Button>}
      />
    );
  }

  const sev = data.severity ? SEVERITY_META[data.severity] : undefined;
  const st = data.status ? STATUS_META[data.status] : undefined;
  const resolved = data.status !== undefined && data.status >= 4;

  return (
    <div className={styles.publicPage}>
      <Helmet>
        <title>{`${data.number ?? ''} ${data.title ?? ''}`}</title>
      </Helmet>
      <div className={styles.headerTitle}>
        {sev && <Tag color={sev.color}>{t(sev.textId)}</Tag>}
        <span className={styles.mono}>{data.number}</span>
        <span>{data.title}</span>
        {data.isDrill && <Tag>{t('pages.incident.drill')}</Tag>}
      </div>
      <div style={{ margin: '12px 0 24px' }}>
        {st && (
          <Badge
            status={resolved ? 'success' : 'processing'}
            text={t(st.textId)}
          />
        )}
        {data.businessName && <span className={styles.hint}> · {data.businessName}</span>}
        <div className={styles.hint} style={{ marginTop: 4 }}>
          {t('pages.incident.public.occurTime', { time: formatTime(data.occurTime) })}
          {data.resolveTime && ` · ${t('pages.incident.public.resolveTime', { time: formatTime(data.resolveTime) })}`}
        </div>
      </div>
      {data.updates?.length ? (
        <Timeline
          items={data.updates.map((u) => ({
            key: u.id,
            color: UPDATE_KIND_META[u.kind ?? 1].color,
            children: (
              <>
                <div className={styles.timelineHead}>
                  <Tag color={UPDATE_KIND_META[u.kind ?? 1].color} style={{ marginInlineEnd: 0 }}>
                    {t(UPDATE_KIND_META[u.kind ?? 1].textId)}
                  </Tag>
                  <span className={styles.hint}>{formatTime(u.createTime)}</span>
                </div>
                <div className={styles.pre}>{u.content}</div>
              </>
            ),
          }))}
        />
      ) : (
        <div className={styles.hint}>{t('pages.incident.public.noUpdates')}</div>
      )}
      <div className={styles.hint} style={{ marginTop: 32 }}>
        {t('pages.incident.public.footer')}
      </div>
    </div>
  );
};

export default PublicIncidentPage;
