/**
 * 资源选择器：按名称 / 外部标识模糊搜索（可限定类型），供关联筛选与批量关联复用。
 */
import { Select, type SelectProps } from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { listCIs } from '@/services/cmdb/ci';

export interface CIOption {
  label: string;
  value: string;
}

export const CISelect: React.FC<{
  value?: string;
  onChange?: (value?: string) => void;
  /** 限定类型；为空或 '*' 时跨类型搜索 */
  modelCode?: string;
  /** 排除的资源 ID */
  excludeId?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  size?: SelectProps['size'];
}> = ({ value, onChange, modelCode, excludeId, placeholder, style, size }) => {
  const [options, setOptions] = useState<CIOption[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = (keyword: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await listCIs({
          page: 1,
          pageSize: 20,
          modelCode: modelCode && modelCode !== '*' ? modelCode : undefined,
          keyword: keyword || undefined,
        });
        setOptions(
          result.items
            .filter((item) => item.id !== excludeId)
            .map((item) => ({
              label: `${item.name}（${item.modelName ?? item.modelCode}）`,
              value: item.id,
            })),
        );
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // 类型切换后清空候选
  useEffect(() => {
    setOptions([]);
  }, [modelCode]);

  return (
    <Select
      showSearch={{ filterOption: false, onSearch: search }}
      allowClear
      size={size}
      style={style}
      value={value}
      placeholder={placeholder}
      loading={loading}
      options={options}
      onFocus={() => options.length === 0 && search('')}
      onChange={(v) => onChange?.(v)}
    />
  );
};
