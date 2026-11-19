/**
 * 键值对编辑器（告警规则附加标签 / 附加信息、数据源请求头、作业触发器参数等共用）：受控组件，
 * 表单值为有序的 { key, value } 列表（编辑过程允许键暂时重复 / 为空），提交时经 kvToRecord
 * 转成 map。配套校验见 validateKeyValues。
 */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Input } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useT } from '@/utils/i18n';

const useStyles = createStyles(({ css }) => ({
  /** 一行：键 + 值 + 删除 */
  row: css`
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-bottom: 8px;
  `,
}));

export interface KeyValue {
  key: string;
  value: string;
  /**
   * 加载时的键名：后端为它保存着一个不回显的值（如数据源请求头，由调用方在加载时填入）。
   * 是否沿用已保存的值不单独存标记，而是由 isKept 从当前内容推出。
   */
  savedKey?: string;
}

/**
 * 该行沿用已保存的值：键名仍是加载时的那个，且值留空。输入了值即改值；清空后恢复沿用；
 * 改了键名则不再沿用（已保存的值属于原来的键名），须重新填值。
 *
 * 值「留空」包括缺失：ProForm 提交时会把空串字段去掉（omitNil），onFinish 拿到的行里空值是
 * undefined 而不是 ''。
 */
export const isKept = (row: KeyValue): boolean =>
  row.savedKey !== undefined && row.key.trim() === row.savedKey && !row.value;

export const recordToKv = (record?: Record<string, string>): KeyValue[] =>
  Object.entries(record ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value }));

export const kvToRecord = (rows?: KeyValue[]): Record<string, string> =>
  Object.fromEntries((rows ?? []).map((row) => [row.key.trim(), row.value]));

/** 键合法且不重复、值长度在范围内 */
export const validateKeyValues = (
  rows: KeyValue[] | undefined,
  rule: {
    keyPattern: RegExp;
    keyMax: number;
    valueMax: number;
    /** 值是否必填（沿用已保存值的行除外，见 isKept） */
    valueRequired?: boolean;
    /** 键名查重不区分大小写（HTTP 头名） */
    caseInsensitiveKeys?: boolean;
    /** 键不得以该前缀开头（附加标签不得以 __ 开头） */
    forbidKeyPrefix?: string;
  },
): boolean => {
  const list = rows ?? [];
  const keys = list.map((row) => row.key.trim());
  const distinct = new Set(
    rule.caseInsensitiveKeys ? keys.map((key) => key.toLowerCase()) : keys,
  );
  if (distinct.size !== keys.length) return false;
  return list.every((row, i) => {
    const key = keys[i];
    return (
      rule.keyPattern.test(key) &&
      key.length <= rule.keyMax &&
      !(rule.forbidKeyPrefix && key.startsWith(rule.forbidKeyPrefix)) &&
      row.value.length <= rule.valueMax &&
      (!rule.valueRequired || isKept(row) || row.value.length > 0)
    );
  });
};

export const KeyValueEditor: React.FC<{
  value?: KeyValue[];
  onChange?: (value: KeyValue[]) => void;
  max: number;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  /** 沿用已保存值的行（isKept）的值输入框提示 */
  keptPlaceholder?: string;
  /** 值用多行输入（附加信息的模板文本） */
  multiline?: boolean;
  addText: string;
}> = ({
  value,
  onChange,
  max,
  keyPlaceholder,
  valuePlaceholder,
  keptPlaceholder,
  multiline,
  addText,
}) => {
  const t = useT();
  const { styles } = useStyles();
  // 表单整体只读（禁用）时「添加」也要禁用：按钮上显式的 disabled 会盖过表单的禁用状态
  const { componentDisabled } = ConfigProvider.useConfig();
  const rows = value ?? [];

  const update = (index: number, patch: Partial<KeyValue>) =>
    onChange?.(
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  return (
    <div>
      {rows.map((row, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 行无稳定标识，按位置编辑
        <div key={index} className={styles.row}>
          <Input
            style={{ width: 200 }}
            value={row.key}
            placeholder={keyPlaceholder}
            onChange={(e) => update(index, { key: e.target.value })}
          />
          {multiline ? (
            <Input.TextArea
              style={{ flex: 1, minWidth: 0 }}
              autoSize={{ minRows: 1, maxRows: 6 }}
              value={row.value}
              placeholder={valuePlaceholder}
              onChange={(e) => update(index, { value: e.target.value })}
            />
          ) : (
            <Input
              style={{ flex: 1, minWidth: 0 }}
              value={row.value}
              placeholder={isKept(row) ? keptPlaceholder : valuePlaceholder}
              onChange={(e) => update(index, { value: e.target.value })}
            />
          )}
          <Button
            type="text"
            icon={<DeleteOutlined />}
            aria-label={t('common.action.remove')}
            onClick={() => onChange?.(rows.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        disabled={componentDisabled || rows.length >= max}
        onClick={() => onChange?.([...rows, { key: '', value: '' }])}
      >
        {addText}
      </Button>
    </div>
  );
};

export default KeyValueEditor;
