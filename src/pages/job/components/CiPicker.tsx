/**
 * 「指定资源」选择器（受控，值为资源 ID 列表）：上方搜索框按关键字在所选资源类型内检索
 * （服务端检索，沿用 CMDB 资源列表接口，受当前用户数据范围约束），下方列出已选资源，可逐个移除。
 * 已选资源的名称经「预览目标主机」接口取回；不在数据范围内或已删除的显示为「不可见」。
 */
import { Select, Spin, Tag } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { listCIs } from '@/services/cmdb/ci';
import { previewJobTarget } from '@/services/job/template';
import { useT } from '@/utils/i18n';
import { JOB_LIMITS } from './meta';
import { useJobStyles } from './styles';

interface KnownCI {
  name: string;
  env?: string;
}

const SEARCH_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

const ciLabel = (ci: KnownCI) => (ci.env ? `${ci.name}（${ci.env}）` : ci.name);

export const CiPicker: React.FC<{
  /** 资源类型码；未选时不可用 */
  modelCode?: string;
  value?: string[];
  onChange?: (value: string[]) => void;
}> = ({ modelCode, value, onChange }) => {
  const t = useT();
  const { styles } = useJobStyles();
  const selected = useMemo(() => value ?? [], [value]);
  const [known, setKnown] = useState<Record<string, KnownCI>>({});
  const [results, setResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const searchSeq = useRef(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  /** 已尝试取回名称的 ID（取不到的不再重复请求） */
  const resolved = useRef(new Set<string>());

  const remember = (items: { id: string; name: string; env?: string }[]) =>
    setKnown((prev) => {
      const next = { ...prev };
      for (const item of items) {
        next[item.id] = { name: item.name, env: item.env };
      }
      return next;
    });

  const search = (keyword: string) => {
    clearTimeout(searchTimer.current);
    if (!modelCode) return;
    const seq = ++searchSeq.current;
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const { items } = await listCIs({
          modelCode,
          keyword: keyword.trim() || undefined,
          page: 1,
          pageSize: SEARCH_PAGE_SIZE,
        });
        if (seq !== searchSeq.current) return;
        remember(items ?? []);
        setResults((items ?? []).map((ci) => ci.id));
      } catch {
        // 已由请求层提示
        if (seq === searchSeq.current) setResults([]);
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  // 换资源类型：候选作废，重新取首屏
  useEffect(() => {
    setResults([]);
    search('');
    return () => clearTimeout(searchTimer.current);
  }, [modelCode]);

  // 已选但不知道名称的（编辑已有模板时）：经预览接口一次取回
  useEffect(() => {
    if (!modelCode) return;
    const unknown = selected.filter(
      (id) => !known[id] && !resolved.current.has(id),
    );
    if (unknown.length === 0) return;
    for (const id of unknown) resolved.current.add(id);
    setResolving(true);
    previewJobTarget({ modelCode, mode: 1, ciIds: unknown }, { silent: true })
      .then(({ hosts }) =>
        remember(
          (hosts ?? []).map((host) => ({
            id: host.ciId,
            name: host.name || host.ciId,
            env: host.env,
          })),
        ),
      )
      .catch(() => undefined)
      .finally(() => setResolving(false));
  }, [modelCode, selected, known]);

  const full = selected.length >= JOB_LIMITS.targetCiMax;
  const options = results.map((id) => ({
    value: id,
    label: known[id] ? ciLabel(known[id]) : id,
    disabled: full && !selected.includes(id),
  }));

  return (
    <div>
      <Select<string[]>
        mode="multiple"
        style={{ width: '100%' }}
        disabled={!modelCode}
        value={selected}
        options={options}
        // 已选项在下方单独列出，输入框里只显示数量
        maxTagCount={0}
        maxTagPlaceholder={() =>
          t('pages.job.template.form.ciIds.count', {
            n: selected.length,
            max: JOB_LIMITS.targetCiMax,
          })
        }
        placeholder={t(
          modelCode
            ? 'pages.job.template.form.ciIds.placeholder'
            : 'pages.job.template.form.ciIds.needModel',
        )}
        showSearch={{ filterOption: false, onSearch: search }}
        notFoundContent={
          searching ? (
            <Spin size="small" />
          ) : (
            t('pages.job.template.form.ciIds.empty')
          )
        }
        onChange={(next) => onChange?.(next.slice(0, JOB_LIMITS.targetCiMax))}
      />
      {selected.length > 0 && (
        <div className={styles.pickedBox}>
          {selected.map((id) => {
            const ci = known[id];
            return (
              <Tag
                key={id}
                closable
                color={ci || resolving ? undefined : 'warning'}
                title={ci ? undefined : id}
                onClose={(e) => {
                  e.preventDefault();
                  onChange?.(selected.filter((item) => item !== id));
                }}
              >
                {ci
                  ? ciLabel(ci)
                  : !resolving
                    ? t('pages.job.template.form.ciIds.invisible', {
                        id: id.slice(0, 8),
                      })
                    : id.slice(0, 8)}
              </Tag>
            );
          })}
        </div>
      )}
      {selected.length > 0 && (
        <div className={styles.hint} style={{ marginTop: 4 }}>
          {t('pages.job.template.form.ciIds.count', {
            n: selected.length,
            max: JOB_LIMITS.targetCiMax,
          })}
          <a style={{ marginInlineStart: 12 }} onClick={() => onChange?.([])}>
            {t('pages.job.template.form.ciIds.clear')}
          </a>
        </div>
      )}
    </div>
  );
};
