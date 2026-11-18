/**
 * 事件标签改写步骤编辑器（语义同 Prometheus relabel_config 的同名动作）：有序列表，可增删、上移下移；
 * 每步按动作只显示它用得到的字段。受控组件，值为 RelabelRow 列表；配套校验见 validateRelabel。
 */
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, ConfigProvider, Form, Input, Select } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import type { RuleRelabelAction } from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import { LABEL_NAME_REGEX } from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import type { RelabelRow } from './ruleForm';
import { byteLength } from './useRuleOptions';

export const RELABEL_LIMITS = {
  stepMax: 10,
  sourceLabelMax: 5,
  labelNameMax: 128,
  /** regex / separator / replacement 的字节上限 */
  textBytesMax: 256,
} as const;

const ACTIONS: readonly RuleRelabelAction[] = [
  'replace',
  'labelmap',
  'labeldrop',
  'labelkeep',
];

export type RelabelErrorCode =
  | 'action'
  | 'source'
  | 'targetRequired'
  | 'targetInvalid'
  | 'regexRequired'
  | 'regexInvalid'
  | 'tooLong';

export interface RelabelError {
  /** 第几步（从 0 起） */
  index: number;
  field: keyof RelabelRow;
  code: RelabelErrorCode;
}

/**
 * 正则能否编译的粗查：后端按 RE2 语法编译，这里只用浏览器的正则引擎拦明显写错的（括号不配对等）。
 * RE2 有而 JS 没有的写法——(?P<name>…) 命名分组、(?i) 这类行内标志、\A \z——先换成等价写法再试；
 * 含 \Q…\E 字面量段的不查。拿不准的一律放行，交给后端。
 */
export const regexCompiles = (source: string): boolean => {
  if (source.includes('\\Q')) return true;
  const portable = source
    .replace(/\(\?P</g, '(?<')
    .replace(/\(\?[imsU-]+\)/g, '')
    .replace(/\(\?[imsU-]+:/g, '(?:')
    .replace(/\\A/g, '^')
    .replace(/\\z/g, '$');
  try {
    new RegExp(portable);
    return true;
  } catch {
    return false;
  }
};

/** 逐步按动作校验必填项与格式，返回第一处问题；全部合法返回 null */
export const validateRelabel = (rows?: RelabelRow[]): RelabelError | null => {
  for (const [index, row] of (rows ?? []).entries()) {
    const fail = (field: keyof RelabelRow, code: RelabelErrorCode) => ({
      index,
      field,
      code,
    });
    if (!row.action) return fail('action', 'action');
    const regex = row.regex ?? '';
    if (row.action === 'replace') {
      const sources = row.sourceLabels ?? [];
      if (
        sources.length > RELABEL_LIMITS.sourceLabelMax ||
        sources.some(
          (label) =>
            !LABEL_NAME_REGEX.test(label) ||
            label.length > RELABEL_LIMITS.labelNameMax,
        )
      ) {
        return fail('sourceLabels', 'source');
      }
      const target = row.targetLabel?.trim() ?? '';
      if (!target) return fail('targetLabel', 'targetRequired');
      if (
        !LABEL_NAME_REGEX.test(target) ||
        target.length > RELABEL_LIMITS.labelNameMax ||
        target.startsWith('__')
      ) {
        return fail('targetLabel', 'targetInvalid');
      }
      if (byteLength(row.separator ?? '') > RELABEL_LIMITS.textBytesMax) {
        return fail('separator', 'tooLong');
      }
    } else if (!regex) {
      // replace 的正则可留空（= "(.*)"），其余动作必填
      return fail('regex', 'regexRequired');
    }
    if (byteLength(regex) > RELABEL_LIMITS.textBytesMax) {
      return fail('regex', 'tooLong');
    }
    if (regex && !regexCompiles(regex)) return fail('regex', 'regexInvalid');
    if (
      row.action !== 'labeldrop' &&
      row.action !== 'labelkeep' &&
      byteLength(row.replacement ?? '') > RELABEL_LIMITS.textBytesMax
    ) {
      return fail('replacement', 'tooLong');
    }
  }
  return null;
};

const useStyles = createStyles(({ token, css }) => ({
  step: css`
    margin-bottom: 8px;
    padding: 8px 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
  index: css`
    flex: none;
    width: 20px;
    color: ${token.colorTextTertiary};
    font-variant-numeric: tabular-nums;
  `,
  fieldLabel: css`
    margin-bottom: 2px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
}));

export const RelabelEditor: React.FC<{
  value?: RelabelRow[];
  onChange?: (value: RelabelRow[]) => void;
}> = ({ value, onChange }) => {
  const t = useT();
  const { styles } = useStyles();
  const { styles: monitorStyles } = useMonitorStyles();
  // 表单整体只读（禁用）时按钮也要禁用：按钮上显式的 disabled 会盖过表单的禁用状态
  const { componentDisabled } = ConfigProvider.useConfig();
  // 表单项校验不通过时，把出问题的那个输入框标红（提示文字在表单项下方）
  const { status } = Form.Item.useStatus();
  const rows = value ?? [];
  const error = status === 'error' ? validateRelabel(rows) : null;

  const update = (index: number, patch: Partial<RelabelRow>) =>
    onChange?.(
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  const move = (index: number, offset: -1 | 1) => {
    const next = [...rows];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange?.(next);
  };
  const errorOn = (index: number, field: keyof RelabelRow) =>
    error?.index === index && error.field === field ? 'error' : undefined;

  const field = (
    name: 'separator' | 'regex' | 'targetLabel' | 'replacement',
    row: RelabelRow,
    index: number,
    placeholder: string,
  ) => (
    <div>
      <div className={styles.fieldLabel}>
        {t(`pages.monitor.rule.relabel.field.${name}`)}
      </div>
      <Input
        className={monitorStyles.codeInput}
        value={row[name]}
        status={errorOn(index, name)}
        placeholder={placeholder}
        aria-label={t(`pages.monitor.rule.relabel.field.${name}`)}
        onChange={(e) => update(index, { [name]: e.target.value })}
      />
    </div>
  );

  return (
    <div>
      {rows.map((row, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 行无稳定标识，按位置编辑
        <div key={index} className={styles.step} data-relabel-step={index}>
          <div className="flex items-center gap-2">
            <span className={styles.index}>{index + 1}</span>
            <Select<RuleRelabelAction>
              style={{ width: 150, flex: 'none' }}
              value={row.action}
              status={errorOn(index, 'action')}
              options={ACTIONS.map((action) => ({
                value: action,
                label: action,
              }))}
              placeholder={t('pages.monitor.rule.relabel.action')}
              aria-label={t('pages.monitor.rule.relabel.action')}
              onChange={(action) => update(index, { action })}
            />
            <span className={`${monitorStyles.hint} min-w-0 flex-1`}>
              {row.action &&
                t(`pages.monitor.rule.relabel.action.${row.action}`)}
            </span>
            <Button
              type="text"
              icon={<ArrowUpOutlined />}
              disabled={componentDisabled || index === 0}
              aria-label={t('pages.monitor.rule.relabel.moveUp')}
              onClick={() => move(index, -1)}
            />
            <Button
              type="text"
              icon={<ArrowDownOutlined />}
              disabled={componentDisabled || index === rows.length - 1}
              aria-label={t('pages.monitor.rule.relabel.moveDown')}
              onClick={() => move(index, 1)}
            />
            <Button
              type="text"
              icon={<DeleteOutlined />}
              aria-label={t('pages.monitor.editor.remove')}
              onClick={() => onChange?.(rows.filter((_, i) => i !== index))}
            />
          </div>
          {row.action && (
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 pl-7">
              {row.action === 'replace' && (
                <>
                  <div>
                    <div className={styles.fieldLabel}>
                      {t('pages.monitor.rule.relabel.field.sourceLabels')}
                    </div>
                    <Select
                      mode="tags"
                      open={false}
                      suffix={null}
                      style={{ width: '100%' }}
                      value={row.sourceLabels ?? []}
                      status={errorOn(index, 'sourceLabels')}
                      maxCount={RELABEL_LIMITS.sourceLabelMax}
                      tokenSeparators={[',', ' ']}
                      placeholder={t(
                        'pages.monitor.rule.relabel.field.sourceLabels.placeholder',
                      )}
                      aria-label={t(
                        'pages.monitor.rule.relabel.field.sourceLabels',
                      )}
                      onChange={(sourceLabels: string[]) =>
                        update(index, { sourceLabels })
                      }
                    />
                  </div>
                  {field('separator', row, index, ';')}
                </>
              )}
              {field(
                'regex',
                row,
                index,
                row.action === 'replace' ? '(.*)' : 'tmp_.*',
              )}
              {row.action === 'replace' &&
                field('targetLabel', row, index, 'host')}
              {(row.action === 'replace' || row.action === 'labelmap') &&
                field('replacement', row, index, '$1')}
            </div>
          )}
        </div>
      ))}
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        disabled={componentDisabled || rows.length >= RELABEL_LIMITS.stepMax}
        onClick={() => onChange?.([...rows, { action: 'replace' }])}
      >
        {t('pages.monitor.rule.relabel.add')}
      </Button>
    </div>
  );
};

export default RelabelEditor;
