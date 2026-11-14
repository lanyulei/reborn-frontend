/**
 * 负责人选择器：从系统用户中搜索选择（值为用户 ID）。
 * 历史数据里的自由文本负责人原样显示（不在候选中，可清空或改选为用户）。
 */
import { Select, type SelectProps } from 'antd';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { listOwnerCandidates } from '@/services/cmdb/ci';

export const OwnerSelect: React.FC<{
  value?: string;
  onChange?: (value?: string) => void;
  /** 当前值的显示名（资源的 ownerName）；候选尚未加载时用它展示 */
  currentName?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  size?: SelectProps['size'];
}> = ({ value, onChange, currentName, placeholder, style, size }) => {
  const [candidates, setCandidates] = useState<
    { label: string; value: string }[] | null
  >(null);
  const [loading, setLoading] = useState(false);
  // 已知的 ID → 显示名（选过的、加载到的都记下）：候选被搜索词换掉后仍能显示当前值的名称
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
        const { items } = await listOwnerCandidates(keyword.trim());
        if (current !== seq.current) return;
        for (const u of items ?? []) names.current.set(u.id, u.name);
        setCandidates(
          (items ?? []).map((u) => ({ label: u.name, value: u.id })),
        );
      } catch {
        if (current === seq.current) setCandidates([]);
      } finally {
        if (current === seq.current) setLoading(false);
      }
    }, 300);
  };

  // 初始值与其名称配对记录一次（之后 value 变化不再用 currentName）
  const initial = useRef({ value, currentName });
  if (initial.current.value && initial.current.currentName) {
    names.current.set(initial.current.value, initial.current.currentName);
  }

  // 当前值不在候选里（尚未加载 / 被搜索过滤 / 历史自由文本）：补一个选项，避免只显示裸 ID
  const options = useMemo(() => {
    const list = candidates ?? [];
    if (!value || list.some((o) => o.value === value)) return list;
    const label = names.current.get(value) ?? value;
    return [{ label, value }, ...list];
  }, [candidates, value]);

  return (
    <Select
      showSearch={{ filterOption: false, onSearch: search }}
      allowClear
      size={size}
      style={style}
      value={value || undefined}
      placeholder={placeholder}
      loading={loading}
      options={options}
      onFocus={() => candidates === null && search('')}
      onChange={(v) => onChange?.(v)}
    />
  );
};
