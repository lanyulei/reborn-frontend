/**
 * 脚本库选择器（受控，值为脚本 ID）：按关键字服务端检索；选中后加载脚本详情，
 * 展示解释器、版本与只读的内容预览。执行时取该脚本的当前版本。
 */
import { Alert, Select, Skeleton, Tag } from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { getJobScript, listJobScripts } from '@/services/job/script';
import type { JobScript } from '@/services/job/typings';
import { useT } from '@/utils/i18n';
import { useJobStyles } from '../components/styles';

interface Option {
  value: string;
  label: string;
}

const SEARCH_DEBOUNCE_MS = 300;

export const ScriptPicker: React.FC<{
  value?: string;
  onChange?: (value?: string) => void;
  /** 选中的脚本加载完成（或清空 / 加载失败时为 undefined） */
  onLoaded?: (script?: JobScript) => void;
}> = ({ value, onChange, onLoaded }) => {
  const t = useT();
  const { styles } = useJobStyles();
  const [options, setOptions] = useState<Option[]>([]);
  const [script, setScript] = useState<JobScript>();
  const [failed, setFailed] = useState(false);
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const report = useRef(onLoaded);
  report.current = onLoaded;

  const search = (keyword: string) => {
    clearTimeout(timer.current);
    const mine = ++seq.current;
    timer.current = setTimeout(async () => {
      try {
        const { items } = await listJobScripts(
          { page: 1, pageSize: 50, keyword: keyword.trim() || undefined },
          { silent: true },
        );
        if (mine !== seq.current) return;
        setOptions(
          (items ?? []).map((item) => ({
            value: item.id,
            label: `${item.spec.name}（${item.spec.interpreter}）`,
          })),
        );
      } catch {
        // 没有脚本库权限等：候选为空
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  useEffect(() => {
    search('');
    return () => clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    setScript(undefined);
    setFailed(false);
    report.current?.(undefined);
    if (!value) return;
    let cancelled = false;
    getJobScript(value, { silent: true })
      .then(({ script: loaded }) => {
        if (cancelled) return;
        setScript(loaded);
        report.current?.(loaded);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  const merged =
    script && !options.some((option) => option.value === script.id)
      ? [
          {
            value: script.id,
            label: `${script.spec.name}（${script.spec.interpreter}）`,
          },
          ...options,
        ]
      : options;

  return (
    <div>
      <Select<string>
        allowClear
        value={value}
        options={merged}
        placeholder={t('pages.job.adhoc.scriptId.placeholder')}
        showSearch={{ filterOption: false, onSearch: search }}
        onChange={(next) => onChange?.(next)}
      />
      {value && failed && (
        <Alert
          type="error"
          showIcon
          title={t('pages.job.adhoc.scriptId.loadFailed')}
          style={{ marginTop: 8 }}
        />
      )}
      {value && !failed && !script && (
        <Skeleton active paragraph={{ rows: 3 }} style={{ marginTop: 8 }} />
      )}
      {script && (
        <div style={{ marginTop: 8 }}>
          <div className={styles.secondary} style={{ marginBottom: 4 }}>
            <Tag>{script.spec.interpreter}</Tag>
            {t('pages.job.adhoc.scriptId.version', { version: script.version })}
            {script.spec.description && ` · ${script.spec.description}`}
          </div>
          <pre className={styles.scriptBlock} style={{ maxHeight: 280 }}>
            {script.spec.content}
          </pre>
        </div>
      )}
    </div>
  );
};
