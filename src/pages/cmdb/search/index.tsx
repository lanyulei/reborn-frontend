/**
 * 全局搜索（独立页面）：未搜索时搜索框居中、点阵底图；搜索后搜索框上移，
 * 结果按模型筛选（全部 / 各模型命中数），逐行列出 资源 / 命中字段 / 状态 / 环境。
 * 关键字进 URL（?q=），分享与返回不丢上下文；命中的属性字段按模型字段名展示。
 */
import { SearchOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import { Button, Empty, Input, Segmented, Spin, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { type SearchHit, searchCIs } from '@/services/cmdb/ci';
import { getModel } from '@/services/cmdb/model';
import { useEnumText, useT } from '@/utils/i18n';
import { ModelIcon } from '../components/icons';
import { CMDB_CI_STATUS_META } from '../components/meta';
import { useCmdbStyles } from '../components/styles';

const LIMIT = 50;
const ALL = '__all__';

const useStyles = createStyles(({ token, css }) => ({
  stage: css`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: calc(100vh - 220px);
    padding: 8px 0 48px;
    transition: padding-top ${token.motionDurationSlow};
  `,
  stageIdle: css`
    padding-top: 22vh;
  `,
  /** 点阵底图：中心清晰、四周渐隐 */
  backdrop: css`
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
        circle at 2px 2px,
        ${token.colorFillSecondary} 2px,
        transparent 0
      )
      0 0 / 12px 12px;
    mask-image: radial-gradient(
      ellipse 62% 58% at 50% 42%,
      #000 15%,
      transparent 72%
    );
  `,
  box: css`
    position: relative;
    width: 100%;
    max-width: 760px;
  `,
  bar: css`
    display: flex;
  `,
  barInput: css`
    flex: 1;
    background: ${token.colorBgContainer};
    /* 上 / 下 / 左浅灰边框；右侧与按钮相接，不留边 */
    border-color: ${token.colorBorder};
    border-inline-end-width: 0;
    &:hover,
    &:focus-within {
      background: ${token.colorBgContainer};
    }
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  `,
  barButton: css`
    flex: none;
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  `,
  hint: css`
    margin-top: 12px;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    text-align: center;
  `,
  results: css`
    position: relative;
    width: 100%;
    max-width: 960px;
    margin-top: 20px;
  `,
  list: css`
    margin-top: 12px;
    padding: 8px;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
  `,
  hitMain: css`
    display: flex;
    flex: none;
    flex-direction: column;
    width: 260px;
    min-width: 0;
  `,
  hitModel: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
}));

const SearchPage: React.FC = () => {
  const t = useT();
  const { styles: shared } = useCmdbStyles();
  const { styles, cx } = useStyles();
  const statusText = useEnumText(CMDB_CI_STATUS_META);
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim();
  const [input, setInput] = useState(q);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  // 模型 code → { 图标, 字段 code → 字段名 }（命中模型懒取）
  const [meta, setMeta] = useState<
    Record<string, { icon?: string; fields: Record<string, string> }>
  >({});
  const [activeModel, setActiveModel] = useState(ALL);

  useEffect(() => {
    setInput(q);
    setActiveModel(ALL);
    if (!q) {
      setHits(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchCIs(q, LIMIT)
      .then(async (result) => {
        if (cancelled) return;
        setHits(result.items);
        const codes = [...new Set(result.items.map((h) => h.ci.modelCode))];
        const details = await Promise.all(
          codes.map((code) => getModel(code).catch(() => null)),
        );
        if (cancelled) return;
        setMeta(
          Object.fromEntries(
            details
              .filter((d) => !!d)
              .map((d) => [
                d.model.code,
                {
                  icon: d.model.icon,
                  fields: Object.fromEntries(
                    d.fields.map((f) => [f.code, f.name]),
                  ),
                },
              ]),
          ),
        );
      })
      .catch(() => {
        // authRequest 已提示
        if (!cancelled) setHits([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const onSearch = (value: string) => {
    const next = value.trim();
    history.replace(
      next ? `/cmdb/search?q=${encodeURIComponent(next)}` : '/cmdb/search',
    );
  };

  // 模型筛选项：全部 + 各模型（按命中数降序）
  const modelOptions = useMemo(() => {
    const counts = new Map<string, { name: string; n: number }>();
    for (const h of hits ?? []) {
      const cur = counts.get(h.ci.modelCode);
      counts.set(h.ci.modelCode, {
        name: h.ci.modelName ?? h.ci.modelCode,
        n: (cur?.n ?? 0) + 1,
      });
    }
    return [
      {
        value: ALL,
        label: `${t('pages.cmdb.model.filter.all')} (${hits?.length ?? 0})`,
      },
      ...[...counts.entries()]
        .sort((a, b) => b[1].n - a[1].n)
        .map(([code, { name, n }]) => ({
          value: code,
          label: `${name} (${n})`,
        })),
    ];
  }, [hits, t]);

  const visible = useMemo(
    () =>
      (hits ?? []).filter(
        (h) => activeModel === ALL || h.ci.modelCode === activeModel,
      ),
    [hits, activeModel],
  );

  const matchedLabel = (hit: SearchHit) => {
    switch (hit.matchedField) {
      case 'name':
        return t('pages.cmdb.ci.column.name');
      case 'externalId':
        return t('pages.cmdb.ci.column.externalId');
      case 'tags':
        return t('pages.cmdb.ci.column.tags');
      default:
        return (
          meta[hit.ci.modelCode]?.fields[hit.matchedField] ?? hit.matchedField
        );
    }
  };

  const idle = hits === null && !loading;

  return (
    <PageContainer title={false}>
      <div className={cx(styles.stage, idle && styles.stageIdle)}>
        {idle && <div className={styles.backdrop} />}
        <div className={styles.box}>
          {/* 输入框 + 主按钮拼接（Input.Search 的自定义按钮在当前主题下不是实心主色） */}
          <div className={styles.bar}>
            <Input
              size="large"
              allowClear
              autoFocus
              className={styles.barInput}
              placeholder={t('pages.cmdb.search.placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={() => onSearch(input)}
            />
            <Button
              size="large"
              type="primary"
              className={styles.barButton}
              icon={<SearchOutlined />}
              loading={loading}
              onClick={() => onSearch(input)}
            >
              {t('pages.cmdb.search.button')}
            </Button>
          </div>
          <div className={styles.hint}>
            {hits === null
              ? t('pages.cmdb.search.hint')
              : t('pages.cmdb.search.result', { q, n: hits.length })}
          </div>
        </div>

        {hits !== null && (
          <div className={styles.results}>
            {loading ? (
              <div style={{ padding: 64, textAlign: 'center' }}>
                <Spin />
              </div>
            ) : hits.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('pages.cmdb.search.empty')}
                style={{ padding: 64 }}
              />
            ) : (
              <>
                <Segmented
                  value={activeModel}
                  onChange={(v) => setActiveModel(v as string)}
                  options={modelOptions}
                />
                <div className={styles.list}>
                  {visible.map((hit) => (
                    <div key={hit.ci.id} className={shared.hitRow}>
                      <ModelIcon
                        icon={meta[hit.ci.modelCode]?.icon}
                        size={32}
                        muted={hit.ci.status === 'retired'}
                      />
                      <div className={styles.hitMain}>
                        <Typography.Link
                          ellipsis
                          onClick={() => history.push(`/cmdb/ci/${hit.ci.id}`)}
                        >
                          {hit.ci.name}
                        </Typography.Link>
                        <span className={styles.hitModel}>
                          {hit.ci.modelName ?? hit.ci.modelCode}
                        </span>
                      </div>
                      <Tag style={{ marginInlineEnd: 0 }}>
                        {matchedLabel(hit)}
                      </Tag>
                      <Typography.Text
                        type="secondary"
                        ellipsis={{ tooltip: hit.matchedValue }}
                        style={{ flex: 1, minWidth: 0 }}
                      >
                        {hit.matchedValue}
                      </Typography.Text>
                      <Tag style={{ marginInlineEnd: 0 }}>
                        {statusText(hit.ci.status)}
                      </Tag>
                      <Typography.Text
                        type="secondary"
                        style={{ width: 80, textAlign: 'end' }}
                      >
                        {hit.ci.env || t('common.empty')}
                      </Typography.Text>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default SearchPage;
