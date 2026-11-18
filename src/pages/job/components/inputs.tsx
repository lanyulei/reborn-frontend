/** 作业中心表单共用的受控输入：带单位的时长、执行节点区域。 */
import { AutoComplete, InputNumber, Select, Space } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { useT } from '@/utils/i18n';
import { useZoneOptions } from './hooks';

type DurationUnit = 's' | 'm' | 'h';
const UNIT_SECONDS: Record<DurationUnit, number> = { s: 1, m: 60, h: 3600 };
const autoUnit = (seconds?: number): DurationUnit =>
  !seconds || seconds % 60 !== 0 ? 's' : seconds % 3600 === 0 ? 'h' : 'm';

/** 时长输入（受控，值为秒）：数值 + 单位（秒 / 分钟 / 小时） */
export const DurationInput: React.FC<{
  value?: number;
  onChange?: (value?: number) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const t = useT();
  // 用户动过之后固定单位；之前按取值自动挑一个能整除的
  const [picked, setPicked] = useState<DurationUnit>();
  const unit = picked ?? autoUnit(value);
  const amount = value === undefined ? undefined : value / UNIT_SECONDS[unit];
  return (
    <Space.Compact style={{ width: '100%' }}>
      <InputNumber
        style={{ width: '100%' }}
        min={0}
        disabled={disabled}
        value={amount}
        onChange={(next) => {
          setPicked(unit);
          onChange?.(
            typeof next === 'number'
              ? Math.round(next * UNIT_SECONDS[unit])
              : undefined,
          );
        }}
      />
      <Select<DurationUnit>
        style={{ width: 96 }}
        disabled={disabled}
        value={unit}
        options={[
          { value: 's', label: t('pages.job.unit.second') },
          { value: 'm', label: t('pages.job.unit.minute') },
          { value: 'h', label: t('pages.job.unit.hour') },
        ]}
        onChange={(next) => {
          setPicked(next);
          // 保持显示的数值不变，按新单位折算
          if (amount !== undefined) {
            onChange?.(Math.round(amount * UNIT_SECONDS[next]));
          }
        }}
      />
    </Space.Compact>
  );
};

/** 执行节点区域输入（受控）：可从已登记的区域里选，也可直接输入 */
export const ZoneInput: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const zoneOptions = useZoneOptions();
  return (
    <AutoComplete
      allowClear
      value={value}
      onChange={onChange}
      options={zoneOptions}
      placeholder={placeholder}
      showSearch={{
        filterOption: (input, option) =>
          String(option?.value ?? '')
            .toLowerCase()
            .includes(input.toLowerCase()),
      }}
    />
  );
};
