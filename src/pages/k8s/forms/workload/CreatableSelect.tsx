import type { SelectProps } from 'antd';
import { Select } from 'antd';
import { useMemo, useState } from 'react';

type CreatableSelectProps = Omit<
  SelectProps<string>,
  'mode' | 'options' | 'showSearch'
> & {
  /** 候选值；取不到（无权限等）时仍可直接输入 */
  items: string[];
};

/**
 * 可输入的下拉选择：外观与普通 Select 一致，候选项里没有的值可以直接键入后选中。
 * 用于候选项来自集群查询的字段——列表取不到时不至于填不了表单。
 */
const CreatableSelect = ({
  items,
  value,
  onSelect,
  ...props
}: CreatableSelectProps) => {
  const [search, setSearch] = useState('');
  const options = useMemo(() => {
    const typed = search.trim();
    const values = new Set(items);
    if (value) {
      values.add(value);
    }
    if (typed) {
      values.add(typed);
    }
    return Array.from(values).map((item) => ({ label: item, value: item }));
  }, [items, search, value]);

  return (
    <Select<string>
      {...props}
      options={options}
      showSearch={{ optionFilterProp: 'label', onSearch: setSearch }}
      value={value}
      onSelect={(...args) => {
        setSearch('');
        onSelect?.(...args);
      }}
    />
  );
};

export default CreatableSelect;
