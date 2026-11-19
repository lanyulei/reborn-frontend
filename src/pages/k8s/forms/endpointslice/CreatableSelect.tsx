import { AutoComplete } from 'antd';
import { useMemo } from 'react';

type CreatableSelectProps = {
  allowClear?: boolean;
  /** 候选名称；不在候选项里的值也可以直接输入 */
  names: string[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
};

/** 带候选项的输入框：从集群里已有的对象中选择，也允许手输 */
const CreatableSelect = ({
  allowClear,
  names,
  placeholder,
  value,
  onChange,
}: CreatableSelectProps) => {
  const options = useMemo(
    () => names.map((name) => ({ label: name, value: name })),
    [names],
  );

  return (
    <AutoComplete
      allowClear={allowClear}
      options={options}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
};

export default CreatableSelect;
