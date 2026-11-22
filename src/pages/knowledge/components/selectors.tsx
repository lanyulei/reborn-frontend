/**
 * 知识库共用的小选择器：负责人（系统用户候选）、知识空间（可按最低权限级别过滤）。
 */
import { Select } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  type UserOption,
  UserSelect,
  userLabel,
} from '@/components/UserSelect';
import { listSpaces } from '@/services/knowledge/space';
import type {
  KnowledgeLevel,
  KnowledgeSpace,
} from '@/services/knowledge/typings';
import { listDeptUserCandidates } from '@/services/system/dept';
import { useT } from '@/utils/i18n';

const fetchUsers = async (keyword: string): Promise<UserOption[]> => {
  const res = await listDeptUserCandidates(keyword);
  return (res.items ?? []).map((u) => ({ id: u.id, label: userLabel(u) }));
};

/** 负责人选择器（单选，值为用户 ID） */
export const OwnerSelect: React.FC<{
  value?: string;
  onChange?: (value?: string) => void;
  known?: UserOption[];
  disabled?: boolean;
}> = ({ value, onChange, known, disabled }) => {
  const t = useT();
  return (
    <UserSelect
      value={value}
      onChange={(v) => onChange?.(typeof v === 'string' ? v : undefined)}
      knownUsers={known}
      fetchUsers={fetchUsers}
      disabled={disabled}
      placeholder={t('pages.knowledge.form.ownerPlaceholder')}
    />
  );
};

/** 加载当前用户可见的空间（一次），供选择器与过滤使用 */
export const useSpaces = (minLevel: KnowledgeLevel = 1) => {
  const [spaces, setSpaces] = useState<KnowledgeSpace[]>([]);
  const [loading, setLoading] = useState(false);
  const reload = useCallback(() => {
    setLoading(true);
    listSpaces(undefined, { silent: true })
      .then((res) =>
        setSpaces((res.items ?? []).filter((s) => (s.level ?? 0) >= minLevel)),
      )
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false));
  }, [minLevel]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { spaces, loading, reload };
};

/** 知识空间选择器 */
export const SpaceSelect: React.FC<{
  value?: string | string[];
  onChange?: (value?: string | string[]) => void;
  minLevel?: KnowledgeLevel;
  multiple?: boolean;
  allowClear?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  placeholder?: string;
}> = ({
  value,
  onChange,
  minLevel = 1,
  multiple,
  allowClear = true,
  disabled,
  style,
  placeholder,
}) => {
  const t = useT();
  const { spaces, loading } = useSpaces(minLevel);
  return (
    <Select
      value={value}
      onChange={(v) => onChange?.(v)}
      mode={multiple ? 'multiple' : undefined}
      loading={loading}
      allowClear={allowClear}
      disabled={disabled}
      showSearch={{ optionFilterProp: 'label' }}
      style={style}
      placeholder={placeholder ?? t('pages.knowledge.form.spacePlaceholder')}
      options={spaces.map((s) => ({ value: s.id, label: s.name }))}
    />
  );
};
