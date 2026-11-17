/**
 * 字段配置表单项（全站共用）：配置一个表单字段——名称、字段码、类型、必填、说明，以及随类型
 * 变化的校验（文本的长度与正则、数字的范围、下拉的可选项、引用的模型）。
 *
 * 只是一组表单项：放在调用方自己的栅格表单（ModalForm / DrawerForm，grid）里，初始值与提交
 * 都由调用方处理，组件不调用任何接口、不依赖任何业务模块。各模块通过参数声明开放哪些类型、
 * 用哪种可选项形式，并经 afterType / switches 插入自己专有的配置项。
 *
 * 表单值的字段名：name / code / type / required / description / enumValues（或 enumPairs）/
 * refModel / minLen / maxLen / pattern / min / max；开放扩展配置时另有 multiple / format /
 * unit / precision / placeholder / defaultValue（是否类型为 'true' / 'false'）/ width / group /
 * showWhenField / showWhenValues。
 */
import {
  ProForm,
  ProFormDependency,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, AutoComplete, Col, Form, Input, Modal, Typography } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { type Translate, useFormRules, useOptions, useT } from '@/utils/i18n';
import {
  DEFAULT_TYPES,
  FIELD_FORMATS,
  FIELD_TYPE_META,
  FIELD_WIDTHS,
  type FieldType,
  FORMAT_PATTERNS,
  MULTIPLE_TYPES,
  NUMERIC_TYPES,
  PLACEHOLDER_TYPES,
  TEXTUAL_TYPES,
} from './fieldTypes';

const HALF = { span: 12 };
const FULL = { span: 24 };

export interface FieldFormItemsProps {
  /** 开放的字段类型（类型下拉的顺序）；须为稳定引用 */
  types: readonly FieldType[];
  /** 编辑已有字段时锁定字段码、类型与引用的模型（已有数据依赖它们） */
  lockIdentity?: boolean;
  /** 字段码的规则：格式、格式不符时的提示、说明，以及调用方自己的校验（返回错误提示） */
  code: {
    pattern: RegExp;
    patternMessage: string;
    tooltip?: string;
    validate?: (code: string | undefined) => string | undefined;
  };
  /** 字段名称的最大长度，缺省 64 */
  nameMax?: number;
  /** 填写说明的最大长度 */
  descriptionMax: number;
  /** 下拉选项的形式：values = 只有值；pairs = 实际值 + 展示值。缺省 values */
  enumMode?: 'values' | 'pairs';
  /** 可选项的个数上限，缺省 50 */
  enumMax?: number;
  /** 正则的最大长度；不传不限制 */
  patternMax?: number;
  /** 文本类是否可配置最小长度 */
  minLen?: boolean;
  /**
   * 「必填」开关的位置：rules = 跟在随类型变化的配置旁边（文本类时与最大长度同一行）；
   * switches = 与调用方的其他开关（switches）排在一起。缺省 rules
   */
  requiredPlacement?: 'rules' | 'switches';
  /** 类型之后、类型相关配置之前的附加项（如分组、排序） */
  afterType?: React.ReactNode;
  /** 附加的开关项，排在最后（说明之前） */
  switches?: React.ReactNode;
  /** 「引用资源」类型的候选模型；开放了 ref 类型时须提供 */
  refOptions?: () => Promise<{ label: string; value: string }[]>;
  /** 开放扩展配置：多选、内容格式、单位与小数位、输入提示、初始值、字段宽度（需要后端支持） */
  advanced?: boolean;
  /** 已有的分组名称；提供后可以设置字段的所属分组 */
  groupNames?: readonly string[];
  /**
   * 可以作为显示条件的控制字段（排在它前面的单选下拉 / 是否字段）及其可取的值；
   * 提供后可以设置显示条件
   */
  controls?: readonly FieldControl[];
}

/** 显示条件的一个控制字段 */
export interface FieldControl {
  code: string;
  name: string;
  options: { value: string; label: string }[];
}

/** 可选项（实际值 + 展示值）↔ 字段定义里的 enumValues / enumLabels */
export const toEnumPairs = (
  values?: readonly string[],
  labels?: Record<string, string>,
): { value: string; label?: string }[] =>
  (values ?? []).map((value) => ({ value, label: labels?.[value] }));

export const fromEnumPairs = (
  pairs?: readonly { value?: string; label?: string }[],
): { enumValues: string[]; enumLabels: Record<string, string> } => {
  const enumValues: string[] = [];
  const enumLabels: Record<string, string> = {};
  for (const pair of pairs ?? []) {
    const value = pair.value?.trim();
    // 空的、重复的实际值不要
    if (!value || enumValues.includes(value)) continue;
    enumValues.push(value);
    const label = pair.label?.trim();
    if (label) enumLabels[value] = label;
  }
  return { enumValues, enumLabels };
};

const PLACEHOLDER_MAX = 64;
const GROUP_MAX = 32;
const UNIT_MAX = 16;
const PRECISION_MAX = 6;

/** 单个可选项的最大长度（与后端校验一致） */
const ENUM_ITEM_MAX = 64;

type EnumPair = { value?: string; label?: string };

/**
 * JS 能解析、但后端（Go RE2）不支持的写法：环视与反向引用。先去掉转义对与字符组，
 * 剩下的才是真正的语法（\(?= 与 [(?=] 都是合法的普通写法）。
 */
const unsupportedByRE2 = (pattern: string): boolean => {
  let syntax = '';
  for (let i = 0; i < pattern.length; i += 1) {
    if (pattern[i] !== '\\') {
      syntax += pattern[i];
      continue;
    }
    if (/^\\([1-9]|k<)/.test(pattern.slice(i, i + 3))) return true;
    i += 1;
  }
  return /\(\?<?[=!]/.test(syntax.replace(/\[[^\]]*\]/g, ''));
};

/**
 * 初始值须满足字段自己的校验（范围、长度、正则、内容格式）：后端保存时同样会校验，
 * 这里提前拦下并指明原因。
 */
const defaultValueRule =
  (t: Translate) =>
  ({ getFieldValue }: { getFieldValue: (name: string) => unknown }) => ({
    validator: (_: unknown, value: unknown) => {
      const fail = (id: string) => Promise.reject(new Error(t(id)));
      const type = getFieldValue('type') as FieldType | undefined;
      if (!type) return Promise.resolve();
      if (typeof value === 'number' && NUMERIC_TYPES.includes(type)) {
        const min = getFieldValue('min');
        const max = getFieldValue('max');
        if (
          (typeof min === 'number' && value < min) ||
          (typeof max === 'number' && value > max)
        ) {
          return fail('component.schemaForm.field.defaultValue.range');
        }
      }
      if (
        typeof value === 'string' &&
        value !== '' &&
        TEXTUAL_TYPES.includes(type)
      ) {
        // 与后端一致：按字符（码点）计长度
        const length = [...value].length;
        const minLen = getFieldValue('minLen');
        const maxLen = getFieldValue('maxLen');
        if (
          (typeof minLen === 'number' && length < minLen) ||
          (typeof maxLen === 'number' && length > maxLen)
        ) {
          return fail('component.schemaForm.field.defaultValue.length');
        }
        const pattern = getFieldValue('pattern');
        if (typeof pattern === 'string' && pattern !== '') {
          let matched = true;
          try {
            matched = new RegExp(pattern.replace(/[\r\n]/g, '')).test(value);
          } catch {
            // 不是合法的 JS 正则（RE2 特有写法或写错了）：交给正则自己的校验与后端
          }
          if (!matched) {
            return fail('component.schemaForm.field.defaultValue.pattern');
          }
        }
        const format = getFieldValue('format');
        if (
          type === 'string' &&
          typeof format === 'string' &&
          FORMAT_PATTERNS[format] &&
          !FORMAT_PATTERNS[format].test(value)
        ) {
          return fail(`component.schemaForm.format.${format}.invalid`);
        }
      }
      return Promise.resolve();
    },
  });

/**
 * 批量添加可选项：每行一个，需要展示值时写成「实际值|展示值」（从表格粘贴的制表符分隔也认）。
 * 已有的实际值跳过，超出个数上限的不添加。
 */
const BulkOptions: React.FC<{ max: number }> = ({ max }) => {
  const t = useT();
  const { message } = App.useApp();
  const form = Form.useFormInstance();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const close = () => {
    setOpen(false);
    setText('');
  };

  const apply = () => {
    const current = (
      (form.getFieldValue('enumPairs') ?? []) as (EnumPair | undefined)[]
    ).flatMap((pair) => (pair?.value?.trim() ? [pair] : []));
    const taken = new Set(current.map((pair) => pair.value?.trim()));
    const added: EnumPair[] = [];
    for (const line of text.split(/\r?\n/)) {
      const [raw = '', ...rest] = line.split(/[\t|]/);
      const value = raw.trim();
      if (!value || taken.has(value)) continue;
      taken.add(value);
      added.push({ value, label: rest.join('|').trim() || undefined });
    }
    const room = Math.max(0, max - current.length);
    form.setFieldValue('enumPairs', [...current, ...added.slice(0, room)]);
    if (added.length > room) {
      message.warning(
        t('component.schemaForm.field.options.bulk.overflow', {
          max,
          n: added.length - room,
        }),
      );
    }
    close();
  };

  return (
    <>
      <Typography.Link
        style={{ marginInlineStart: 12 }}
        onClick={(e) => {
          // 链接在表单项的标题里：不让点击落到标题上
          e.preventDefault();
          setOpen(true);
        }}
      >
        {t('component.schemaForm.field.options.bulk')}
      </Typography.Link>
      <Modal
        title={t('component.schemaForm.field.options.bulk')}
        open={open}
        onOk={apply}
        onCancel={close}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          {t('component.schemaForm.field.options.bulk.tip')}
        </Typography.Paragraph>
        <Input.TextArea
          autoFocus
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Modal>
    </>
  );
};

export const FieldFormItems: React.FC<FieldFormItemsProps> = ({
  types,
  lockIdentity,
  code,
  nameMax = 64,
  descriptionMax,
  enumMode = 'values',
  enumMax = 50,
  patternMax,
  minLen,
  requiredPlacement = 'rules',
  afterType,
  switches,
  refOptions,
  advanced,
  groupNames,
  controls,
}) => {
  const t = useT();
  const rules = useFormRules();
  const typeOptions = useOptions(FIELD_TYPE_META, types);
  const inline = requiredPlacement === 'rules';

  const required = (
    <ProFormSwitch
      colProps={HALF}
      name="required"
      label={t('component.schemaForm.field.required')}
    />
  );

  const enumItems =
    enumMode === 'pairs' ? (
      <ProFormList
        name="enumPairs"
        colProps={FULL}
        label={
          <>
            {t('component.schemaForm.field.options')}
            <BulkOptions max={enumMax} />
          </>
        }
        tooltip={t('component.schemaForm.field.options.tooltip')}
        min={1}
        max={enumMax}
        arrowSort
        creatorButtonProps={{
          creatorButtonText: t('component.schemaForm.field.options.add'),
        }}
        rules={[
          {
            validator: (_: unknown, rows?: { value?: string }[]) =>
              rows?.some((r) => r.value && r.value.trim() !== '')
                ? Promise.resolve()
                : Promise.reject(
                    new Error(
                      t('common.validation.required', {
                        label: t('component.schemaForm.field.options'),
                      }),
                    ),
                  ),
          },
          {
            // 重复的实际值保存时只会留下第一个：直接指出来，不悄悄丢掉
            validator: (_: unknown, rows?: EnumPair[]) => {
              const seen = new Set<string>();
              for (const row of rows ?? []) {
                const value = row?.value?.trim();
                if (!value) continue;
                if (seen.has(value)) {
                  return Promise.reject(
                    new Error(
                      t('component.schemaForm.field.options.duplicate', {
                        value,
                      }),
                    ),
                  );
                }
                seen.add(value);
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <ProForm.Group rowProps={{ gutter: 16 }}>
          <ProFormText
            name="value"
            colProps={HALF}
            label={t('component.schemaForm.field.options.value')}
            rules={[
              rules.required(t('component.schemaForm.field.options.value')),
              { max: ENUM_ITEM_MAX },
            ]}
          />
          <ProFormText
            name="label"
            colProps={HALF}
            label={t('component.schemaForm.field.options.label')}
            tooltip={t('component.schemaForm.field.options.label.tip')}
            rules={[{ max: ENUM_ITEM_MAX }]}
          />
        </ProForm.Group>
      </ProFormList>
    ) : (
      <ProFormSelect
        name="enumValues"
        colProps={FULL}
        label={t('component.schemaForm.field.options')}
        placeholder={t('component.schemaForm.field.options.placeholder')}
        fieldProps={{
          mode: 'tags',
          maxCount: enumMax,
          open: false,
          suffix: null,
        }}
        rules={[
          {
            required: true,
            type: 'array',
            message: t('common.validation.required', {
              label: t('component.schemaForm.field.options'),
            }),
          },
          {
            validator: (_: unknown, items?: string[]) =>
              (items ?? []).some((v) => !v.trim() || v.length > ENUM_ITEM_MAX)
                ? Promise.reject(
                    new Error(
                      t('component.schemaForm.field.options.invalid', {
                        max: ENUM_ITEM_MAX,
                      }),
                    ),
                  )
                : Promise.resolve(),
          },
        ]}
      />
    );

  return (
    <>
      <ProFormText
        colProps={HALF}
        name="name"
        label={t('component.schemaForm.field.name')}
        rules={[
          {
            required: true,
            whitespace: true,
            message: t('common.validation.required', {
              label: t('component.schemaForm.field.name'),
            }),
          },
          rules.max(nameMax),
        ]}
      />
      <ProFormText
        colProps={HALF}
        name="code"
        label={t('component.schemaForm.field.code')}
        tooltip={code.tooltip}
        disabled={lockIdentity}
        rules={
          lockIdentity
            ? []
            : [
                rules.required(t('component.schemaForm.field.code')),
                { pattern: code.pattern, message: code.patternMessage },
                {
                  validator: (_: unknown, value?: string) => {
                    const error = code.validate?.(value);
                    return error
                      ? Promise.reject(new Error(error))
                      : Promise.resolve();
                  },
                },
              ]
        }
      />
      <ProFormSelect
        colProps={FULL}
        name="type"
        label={t('component.schemaForm.field.type')}
        allowClear={false}
        disabled={lockIdentity}
        options={typeOptions}
        rules={[rules.select(t('component.schemaForm.field.type'))]}
      />
      {afterType}
      <ProFormDependency name={['type']}>
        {({ type }: { type?: FieldType }) => {
          if (type === 'enum') {
            return (
              <>
                {enumItems}
                {inline && required}
              </>
            );
          }
          if (type === 'ref') {
            return (
              <>
                <ProFormSelect
                  name="refModel"
                  colProps={HALF}
                  label={t('component.schemaForm.field.refModel')}
                  disabled={lockIdentity}
                  showSearch
                  request={refOptions}
                  rules={
                    lockIdentity
                      ? []
                      : [rules.select(t('component.schemaForm.field.refModel'))]
                  }
                />
                {inline && required}
              </>
            );
          }
          if (type && NUMERIC_TYPES.includes(type)) {
            const precision = type === 'int' ? 0 : undefined;
            return (
              <>
                <ProFormDigit
                  colProps={HALF}
                  name="min"
                  label={t('component.schemaForm.field.min')}
                  // 数字控件缺省下限是 0，这里要允许负数
                  min={Number.MIN_SAFE_INTEGER}
                  fieldProps={{ precision }}
                />
                <ProFormDependency name={['min']}>
                  {({ min }: { min?: number }) => (
                    <ProFormDigit
                      colProps={HALF}
                      name="max"
                      label={t('component.schemaForm.field.max')}
                      min={Number.MIN_SAFE_INTEGER}
                      fieldProps={{ precision }}
                      rules={[
                        {
                          validator: (_: unknown, max?: number) =>
                            min != null && max != null && max < min
                              ? Promise.reject(
                                  new Error(
                                    t('component.schemaForm.field.max.invalid'),
                                  ),
                                )
                              : Promise.resolve(),
                        },
                      ]}
                    />
                  )}
                </ProFormDependency>
                {inline && required}
              </>
            );
          }
          if (type && TEXTUAL_TYPES.includes(type)) {
            return (
              <>
                {inline && required}
                {minLen && (
                  <ProFormDigit
                    colProps={HALF}
                    name="minLen"
                    label={t('component.schemaForm.field.minLen')}
                    min={0}
                    fieldProps={{ precision: 0 }}
                  />
                )}
                <ProFormDigit
                  colProps={HALF}
                  name="maxLen"
                  label={t('component.schemaForm.field.maxLen')}
                  min={1}
                  fieldProps={{ precision: 0 }}
                />
                {/* 正则往往较长：独占一行，两行高的文本框 */}
                <ProFormTextArea
                  colProps={FULL}
                  name="pattern"
                  label={t('component.schemaForm.field.pattern')}
                  tooltip={t('component.schemaForm.field.pattern.tooltip')}
                  fieldProps={{ rows: 2 }}
                  rules={[
                    ...(patternMax ? [rules.max(patternMax)] : []),
                    {
                      // 后端是 Go（RE2）语法，前端只做粗校验：拦下 RE2 不支持的环视 / 反向
                      // 引用，以及 JS 也解析不了的明显错误；RE2 特有写法（如 (?i)）放行，
                      // 由后端最终校验
                      validator: (_: unknown, value?: string) => {
                        if (!value) return Promise.resolve();
                        if (unsupportedByRE2(value)) {
                          return Promise.reject(
                            new Error(
                              t(
                                'component.schemaForm.field.pattern.unsupported',
                              ),
                            ),
                          );
                        }
                        if (/\(\?[a-zA-Z]/.test(value)) {
                          return Promise.resolve();
                        }
                        try {
                          new RegExp(value);
                          return Promise.resolve();
                        } catch {
                          return Promise.reject(
                            new Error(
                              t('component.schemaForm.field.pattern.invalid'),
                            ),
                          );
                        }
                      },
                    },
                  ]}
                />
              </>
            );
          }
          return inline ? required : null;
        }}
      </ProFormDependency>
      {advanced && (
        <ProFormDependency
          name={['type', 'multiple', 'enumPairs', 'enumValues']}
        >
          {({
            type,
            multiple,
            enumPairs,
            enumValues,
          }: {
            type?: FieldType;
            multiple?: boolean;
            enumPairs?: EnumPair[];
            enumValues?: string[];
          }) => {
            if (!type) return null;
            const options =
              enumMode === 'pairs'
                ? (enumPairs ?? [])
                    .filter((p) => p?.value?.trim())
                    .map((p) => ({
                      value: (p.value ?? '').trim(),
                      label: p.label?.trim() || (p.value ?? '').trim(),
                    }))
                : (enumValues ?? []).map((v) => ({ value: v, label: v }));
            const defaultProps = {
              name: 'defaultValue',
              label: t('component.schemaForm.field.defaultValue'),
              tooltip: t('component.schemaForm.field.defaultValue.tooltip'),
              rules: [defaultValueRule(t)],
            };
            return (
              <>
                {MULTIPLE_TYPES.includes(type) && (
                  <ProFormSwitch
                    colProps={HALF}
                    name="multiple"
                    label={t(
                      type === 'file'
                        ? 'component.schemaForm.field.multiple.file'
                        : 'component.schemaForm.field.multiple',
                    )}
                  />
                )}
                {type === 'string' && (
                  <ProFormSelect
                    colProps={HALF}
                    name="format"
                    label={t('component.schemaForm.field.format')}
                    placeholder={t('component.schemaForm.field.format.none')}
                    options={FIELD_FORMATS.map((format) => ({
                      value: format,
                      label: t(`component.schemaForm.field.format.${format}`),
                    }))}
                  />
                )}
                {NUMERIC_TYPES.includes(type) && (
                  <ProFormText
                    colProps={HALF}
                    name="unit"
                    label={t('component.schemaForm.field.unit')}
                    placeholder={t(
                      'component.schemaForm.field.unit.placeholder',
                    )}
                    rules={[rules.max(UNIT_MAX)]}
                  />
                )}
                {type === 'float' && (
                  <ProFormDigit
                    colProps={HALF}
                    name="precision"
                    label={t('component.schemaForm.field.precision')}
                    min={0}
                    max={PRECISION_MAX}
                    fieldProps={{ precision: 0 }}
                  />
                )}
                {PLACEHOLDER_TYPES.includes(type) && (
                  <ProFormText
                    colProps={HALF}
                    name="placeholder"
                    label={t('component.schemaForm.field.placeholder')}
                    tooltip={t(
                      'component.schemaForm.field.placeholder.tooltip',
                    )}
                    rules={[rules.max(PLACEHOLDER_MAX)]}
                  />
                )}
                {/* 初始值：按类型给对应的输入；多选不设初始值 */}
                {DEFAULT_TYPES.includes(type) &&
                  !(multiple && type === 'enum') &&
                  (type === 'text' ? (
                    <ProFormTextArea
                      colProps={FULL}
                      {...defaultProps}
                      fieldProps={{ rows: 2 }}
                    />
                  ) : NUMERIC_TYPES.includes(type) ? (
                    <ProFormDigit
                      colProps={HALF}
                      {...defaultProps}
                      min={Number.MIN_SAFE_INTEGER}
                      fieldProps={{ precision: type === 'int' ? 0 : undefined }}
                    />
                  ) : type === 'bool' ? (
                    <ProFormSelect
                      colProps={HALF}
                      {...defaultProps}
                      options={(['true', 'false'] as const).map((value) => ({
                        value,
                        label: t(`component.schemaForm.field.bool.${value}`),
                      }))}
                    />
                  ) : type === 'enum' ? (
                    <ProFormSelect
                      colProps={HALF}
                      {...defaultProps}
                      options={options}
                    />
                  ) : (
                    <ProFormText colProps={HALF} {...defaultProps} />
                  ))}
                <ProFormSelect
                  colProps={HALF}
                  name="width"
                  label={t('component.schemaForm.field.width')}
                  tooltip={t('component.schemaForm.field.width.tooltip')}
                  placeholder={t('component.schemaForm.field.width.auto')}
                  options={FIELD_WIDTHS.map((width) => ({
                    value: width,
                    label: t(`component.schemaForm.field.width.${width}`),
                  }))}
                />
              </>
            );
          }}
        </ProFormDependency>
      )}
      {groupNames && (
        <Col span={12}>
          <ProForm.Item
            name="group"
            label={t('component.schemaForm.field.group')}
            tooltip={t('component.schemaForm.field.group.tooltip')}
            rules={[rules.max(GROUP_MAX)]}
          >
            <AutoComplete
              allowClear
              placeholder={t('component.schemaForm.field.group.placeholder')}
              options={groupNames.map((name) => ({ value: name }))}
              showSearch={{
                filterOption: (input, option) =>
                  String(option?.value ?? '').includes(input),
              }}
            />
          </ProForm.Item>
        </Col>
      )}
      {controls && controls.length > 0 && (
        <>
          <ProFormSelect
            colProps={HALF}
            name="showWhenField"
            label={t('component.schemaForm.field.showWhen')}
            tooltip={t('component.schemaForm.field.showWhen.tooltip')}
            placeholder={t('component.schemaForm.field.showWhen.field')}
            options={controls.map((c) => ({ value: c.code, label: c.name }))}
          />
          <ProFormDependency name={['showWhenField']}>
            {({ showWhenField }: { showWhenField?: string }) => {
              const control = controls.find((c) => c.code === showWhenField);
              return control ? (
                <ProFormSelect
                  colProps={HALF}
                  name="showWhenValues"
                  mode="multiple"
                  label={t('component.schemaForm.field.showWhen.values')}
                  options={control.options}
                  rules={[
                    {
                      required: true,
                      type: 'array',
                      message: t(
                        'component.schemaForm.field.showWhen.values.required',
                      ),
                    },
                    {
                      // 换了控制字段后，旧的取值可能已不在它的可选值里
                      validator: (_: unknown, values?: string[]) =>
                        (values ?? []).every((v) =>
                          control.options.some((o) => o.value === v),
                        )
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(
                                t(
                                  'component.schemaForm.field.showWhen.values.required',
                                ),
                              ),
                            ),
                    },
                  ]}
                />
              ) : null;
            }}
          </ProFormDependency>
        </>
      )}
      {!inline && required}
      {switches}
      <ProFormTextArea
        colProps={FULL}
        name="description"
        label={t('component.schemaForm.field.description')}
        fieldProps={{
          maxLength: descriptionMax,
          showCount: true,
          autoSize: { minRows: 2, maxRows: 4 },
        }}
      />
    </>
  );
};

export default FieldFormItems;
