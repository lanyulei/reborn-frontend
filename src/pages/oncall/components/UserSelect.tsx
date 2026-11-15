/**
 * 用户选择器：从可用的系统用户中远程搜索（值为用户 ID，可多选）。
 * 候选接口最多返回 50 个，靠关键字缩小范围；已选项的显示名单独记住，
 * 候选被搜索词换掉后仍能显示。
 */
import { Select, type SelectProps } from 'antd';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { listUserCandidates } from '@/services/oncall/group';
import { displayName } from './hooks';

type Option = { label: string; value: string; disabled?: boolean };

export const UserSelect: React.FC<{
  value?: string | string[];
  onChange?: (value?: string | string[]) => void;
  multiple?: boolean;
  /** 多选上限 */
  maxCount?: number;
  /** 置灰的用户（如已在分组内） */
  disabledIds?: ReadonlySet<string>;
  disabledLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  size?: SelectProps['size'];
}> = ({
  value,
  onChange,
  multiple,
  maxCount,
  disabledIds,
  disabledLabel,
  placeholder,
  disabled,
  style,
  size,
}) => {
  const [candidates, setCandidates] = useState<Option[] | null>(null);
  const [loading, setLoading] = useState(false);
  const names = useRef(new Map<string, string>());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // 只采纳最后一次搜索的结果
  const seq = useRef(0);

  const search = (keyword: string) => {
    clearTimeout(timer.current);
    const current = ++seq.current;
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { items } = await listUserCandidates(keyword.trim());
        if (current !== seq.current) return;
        const list = (items ?? []).map((u) => {
          const name = displayName(u);
          const label =
            u.nickname && u.nickname !== u.username
              ? `${u.nickname}（${u.username}）`
              : name;
          names.current.set(u.id, label);
          return { label, value: u.id };
        });
        setCandidates(list);
      } catch {
        if (current === seq.current) setCandidates([]);
      } finally {
        if (current === seq.current) setLoading(false);
      }
    }, 300);
  };

  const options = useMemo(() => {
    const list: Option[] = (candidates ?? []).map((o) =>
      disabledIds?.has(o.value)
        ? {
            ...o,
            disabled: true,
            label: disabledLabel ? `${o.label} · ${disabledLabel}` : o.label,
          }
        : o,
    );
    // 已选但不在当前候选里的值：补选项，避免只显示裸 ID
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    const missing = selected
      .filter((id) => !list.some((o) => o.value === id))
      .map((id) => ({ label: names.current.get(id) ?? id, value: id }));
    return [...missing, ...list];
  }, [candidates, value, disabledIds, disabledLabel]);

  return (
    <Select
      {...(multiple ? { mode: 'multiple' as const, maxCount } : {})}
      showSearch={{ filterOption: false, onSearch: search }}
      allowClear
      size={size}
      style={style}
      disabled={disabled}
      value={value || undefined}
      placeholder={placeholder}
      loading={loading}
      options={options}
      onFocus={() => candidates === null && search('')}
      onChange={(v) => onChange?.(v)}
    />
  );
};
