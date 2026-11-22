/**
 * 用户选择器（通用）：远程搜索系统用户，值为用户 ID，可单选 / 多选。
 * 候选来源由调用方注入（fetchUsers，须为稳定引用）：各业务域传自己的最小披露
 * 候选接口，组件不依赖任何业务接口。已选项的显示名单独记住，候选被搜索词换掉后
 * 仍能显示。
 */
import { Select, type SelectProps } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

/** 候选用户：id + 展示名 */
export interface UserOption {
  id: string;
  label: string;
}

/** 用户展示名：昵称（用户名），二者相同或无昵称时只显示用户名 */
export const userLabel = (user: {
  nickname?: string;
  username?: string;
}): string =>
  user.nickname && user.nickname !== user.username
    ? `${user.nickname}（${user.username ?? ''}）`
    : (user.username ?? '');

type Option = { label: string; value: string; disabled?: boolean };

export interface UserSelectProps {
  value?: string | string[];
  onChange?: (value?: string | string[]) => void;
  /** 同 onChange，但带上显示名（调用方需要把名称一并保存时使用） */
  onLabeledChange?: (users: UserOption[]) => void;
  multiple?: boolean;
  /** 多选上限 */
  maxCount?: number;
  /** 置灰的用户（如已在部门内） */
  disabledIds?: ReadonlySet<string>;
  disabledLabel?: string;
  /** 已知的用户展示名（回显已选值；候选尚未加载时用它展示） */
  knownUsers?: readonly UserOption[];
  /** 候选来源（按关键字返回候选用户） */
  fetchUsers: (keyword: string) => Promise<UserOption[]>;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  size?: SelectProps['size'];
}

export const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  onLabeledChange,
  multiple,
  maxCount,
  disabledIds,
  disabledLabel,
  knownUsers,
  fetchUsers,
  placeholder,
  disabled,
  style,
  size,
}) => {
  const [candidates, setCandidates] = useState<Option[] | null>(null);
  const [loading, setLoading] = useState(false);
  // 已知的 ID → 显示名（选过的、加载到的、调用方给的都记下）
  const names = useRef(new Map<string, string>());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // 只采纳最后一次搜索的结果
  const seq = useRef(0);
  // 卸载：停掉未触发的防抖，并作废在途搜索（不再写状态）
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      seq.current += 1;
    },
    [],
  );

  for (const user of knownUsers ?? []) {
    if (!names.current.has(user.id)) names.current.set(user.id, user.label);
  }

  const search = (keyword: string) => {
    clearTimeout(timer.current);
    const current = ++seq.current;
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await fetchUsers(keyword.trim());
        if (current !== seq.current) return;
        for (const user of users) names.current.set(user.id, user.label);
        setCandidates(users.map((u) => ({ label: u.label, value: u.id })));
      } catch {
        // 置回「未加载」：下次聚焦时重试，而不是停在空列表
        if (current === seq.current) setCandidates(null);
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
      onChange={(v: string | string[] | undefined) => {
        onChange?.(v);
        const ids = Array.isArray(v) ? v : v ? [v] : [];
        onLabeledChange?.(
          ids.map((id) => ({ id, label: names.current.get(id) ?? id })),
        );
      }}
    />
  );
};

export default UserSelect;
