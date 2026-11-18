/**
 * 事件标签匹配条件编辑器（屏蔽规则、订阅规则共用）：每行 = 标签名 + 操作符 + 值，行间是
 * 「并且」。操作符六种：== != =~ !~ in not in；in / not in 用多值输入，其余用单值。
 * 受控组件（value / onChange），可直接放进 Form.Item；配套校验见 validateMatchers。
 */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Input, Select, Tag } from 'antd';
import type React from 'react';
import type {
  LabelMatcher,
  MonitorMatcherOp,
} from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import {
  isMultiValueOp,
  LABEL_NAME_REGEX,
  MATCHER_OP_TEXT_ID,
  MATCHER_OPS,
  MONITOR_LIMITS,
} from './meta';
import { useMonitorStyles } from './styles';

const utf8Length = (text: string) => new TextEncoder().encode(text).length;

/** 逐行校验：标签名合法、值非空且不超长（与后端 proto 校验一致） */
export const validateMatchers = (matchers?: LabelMatcher[]): boolean =>
  (matchers ?? []).every((m) => {
    if (!LABEL_NAME_REGEX.test(m.label ?? '') || m.label.length > 128) {
      return false;
    }
    if (isMultiValueOp(m.op)) {
      const values = m.values ?? [];
      return (
        values.length >= 1 &&
        values.length <= MONITOR_LIMITS.matcherValuesMax &&
        values.every((v) => utf8Length(v) <= MONITOR_LIMITS.matcherValueMax)
      );
    }
    const value = m.value ?? '';
    // 正则须非空；== / != 允许空值（表示标签不存在 / 存在）
    if ((m.op === '=~' || m.op === '!~') && !value) return false;
    return utf8Length(value) <= MONITOR_LIMITS.matcherValueMax;
  });

/** 提交前归一化：按操作符只保留 value 或 values */
export const normalizeMatchers = (matchers?: LabelMatcher[]): LabelMatcher[] =>
  (matchers ?? []).map((m) =>
    isMultiValueOp(m.op)
      ? { label: m.label.trim(), op: m.op, values: m.values ?? [] }
      : { label: m.label.trim(), op: m.op, value: m.value ?? '' },
  );

/** 事件标签 → 等值匹配条件（从告警详情预填屏蔽 / 订阅） */
export const labelsToMatchers = (
  labels?: Record<string, string>,
): LabelMatcher[] =>
  Object.entries(labels ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, MONITOR_LIMITS.matcherMax)
    .map(([label, value]) => ({ label, op: '==' as const, value }));

/** 匹配条件的只读展示（列表列）：每行一枚 Tag，如 instance =~ web-.* */
export const MatcherTags: React.FC<{ matchers?: LabelMatcher[] }> = ({
  matchers,
}) => {
  const { styles } = useMonitorStyles();
  return (
    <span className={styles.tagList}>
      {(matchers ?? []).map((m) => (
        <Tag
          key={`${m.label} ${m.op} ${m.value ?? (m.values ?? []).join(',')}`}
        >
          {m.label} {m.op}{' '}
          {isMultiValueOp(m.op) ? `(${(m.values ?? []).join(', ')})` : m.value}
        </Tag>
      ))}
    </span>
  );
};

export const MatchersEditor: React.FC<{
  value?: LabelMatcher[];
  onChange?: (value: LabelMatcher[]) => void;
}> = ({ value, onChange }) => {
  const t = useT();
  const { styles } = useMonitorStyles();
  // 表单整体只读（禁用）时「添加」也要禁用：按钮上显式的 disabled 会盖过表单的禁用状态
  const { componentDisabled } = ConfigProvider.useConfig();
  const rows = value ?? [];

  const update = (index: number, patch: Partial<LabelMatcher>) =>
    onChange?.(
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  return (
    <div>
      {rows.map((row, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 行无稳定标识，按位置编辑
        <div key={index} className={styles.editorRow}>
          <Input
            style={{ width: 180 }}
            value={row.label}
            maxLength={128}
            placeholder={t('pages.monitor.matcher.label')}
            status={
              row.label && !LABEL_NAME_REGEX.test(row.label)
                ? 'error'
                : undefined
            }
            onChange={(e) => update(index, { label: e.target.value })}
          />
          <Select<MonitorMatcherOp>
            style={{ width: 150 }}
            value={row.op}
            options={MATCHER_OPS.map((op) => ({
              value: op,
              label: t(MATCHER_OP_TEXT_ID[op]),
            }))}
            onChange={(op) =>
              update(
                index,
                isMultiValueOp(op)
                  ? { op, value: undefined, values: row.values ?? [] }
                  : { op, values: undefined, value: row.value ?? '' },
              )
            }
          />
          {isMultiValueOp(row.op) ? (
            <Select
              mode="tags"
              open={false}
              suffix={null}
              style={{ flex: 1, minWidth: 0 }}
              maxCount={MONITOR_LIMITS.matcherValuesMax}
              tokenSeparators={[',']}
              value={row.values ?? []}
              placeholder={t('pages.monitor.matcher.values')}
              onChange={(values: string[]) => update(index, { values })}
            />
          ) : (
            <Input
              style={{ flex: 1, minWidth: 0 }}
              value={row.value}
              placeholder={
                row.op === '=~' || row.op === '!~'
                  ? t('pages.monitor.matcher.regex')
                  : t('pages.monitor.matcher.value')
              }
              onChange={(e) => update(index, { value: e.target.value })}
            />
          )}
          <Button
            type="text"
            icon={<DeleteOutlined />}
            aria-label={t('pages.monitor.editor.remove')}
            onClick={() => onChange?.(rows.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        disabled={componentDisabled || rows.length >= MONITOR_LIMITS.matcherMax}
        onClick={() =>
          onChange?.([...rows, { label: '', op: '==', value: '' }])
        }
      >
        {t('pages.monitor.matcher.add')}
      </Button>
    </div>
  );
};

export default MatchersEditor;
