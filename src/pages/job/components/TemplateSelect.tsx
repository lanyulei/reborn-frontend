/**
 * 作业模板选择器（执行记录的筛选项）：按关键字服务端检索；已选但不在候选里的模板
 * （如从模板列表带参数跳转过来）单独取名称回显，取不到（已删除 / 无权限）时显示 ID。
 */
import { Select } from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { getJobTemplate, listJobTemplates } from '@/services/job/template';
import { useT } from '@/utils/i18n';

interface Option {
  value: string;
  label: string;
}

const SEARCH_DEBOUNCE_MS = 300;

export const TemplateSelect: React.FC<{
  value?: string;
  onChange?: (value?: string) => void;
}> = ({ value, onChange }) => {
  const t = useT();
  const [options, setOptions] = useState<Option[]>([]);
  const [current, setCurrent] = useState<Option>();
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = (keyword: string) => {
    clearTimeout(timer.current);
    const mine = ++seq.current;
    timer.current = setTimeout(async () => {
      try {
        const { items } = await listJobTemplates(
          { page: 1, pageSize: 50, keyword: keyword.trim() || undefined },
          { silent: true },
        );
        if (mine !== seq.current) return;
        setOptions(
          (items ?? []).map((item) => ({
            value: item.id,
            label: item.spec.name,
          })),
        );
      } catch {
        // 没有作业模板菜单权限等：候选为空，仍可按带入的模板筛选
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  useEffect(() => {
    search('');
    return () => clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (!value) return;
    let cancelled = false;
    getJobTemplate(value, { silent: true })
      .then(({ template }) => {
        if (!cancelled) setCurrent({ value, label: template.spec.name });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [value]);

  const merged =
    current &&
    current.value === value &&
    !options.some((option) => option.value === current.value)
      ? [current, ...options]
      : options;

  return (
    <Select<string>
      allowClear
      value={value}
      options={merged}
      placeholder={t('pages.job.execution.search.template')}
      showSearch={{ filterOption: false, onSearch: search }}
      onChange={(next) => onChange?.(next)}
    />
  );
};
