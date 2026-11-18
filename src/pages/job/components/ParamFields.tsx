/**
 * 按作业模板的参数定义生成的参数取值表单项（执行作业弹窗、定时作业、触发器共用）：
 * string→单行输入，text→多行输入，int / float→数字，bool→开关，enum→下拉；缺省值预填。
 */
import { Form, Input, InputNumber, Select, Switch } from 'antd';
import type React from 'react';
import type { JobParam } from '@/services/job/typings';
import { useFormRules } from '@/utils/i18n';
import { useJobStyles } from './styles';

export type ParamValues = Record<string, unknown>;

/** 缺省值文本 → 表单初值 */
const parseDefault = (param: JobParam): unknown => {
  const text = param.default ?? '';
  switch (param.type) {
    case 'int':
    case 'float': {
      const n = Number(text);
      return text !== '' && Number.isFinite(n) ? n : undefined;
    }
    case 'bool':
      return text === 'true';
    case 'enum':
      return (param.options ?? []).includes(text) ? text : undefined;
    default:
      return text || undefined;
  }
};

/** 预置取值（上次的参数 / 已保存的固定值）是否仍符合当前的参数定义 */
const presetFits = (param: JobParam, value: unknown): boolean => {
  switch (param.type) {
    case 'int':
      return typeof value === 'number' && Number.isInteger(value);
    case 'float':
      return typeof value === 'number' && Number.isFinite(value);
    case 'bool':
      return typeof value === 'boolean';
    case 'enum':
      return typeof value === 'string' && (param.options ?? []).includes(value);
    default:
      return typeof value === 'string';
  }
};

/** 表单初值：预置取值仍合法的沿用，否则取缺省值 */
export const initialParamValues = (
  params: readonly JobParam[],
  preset?: ParamValues,
): ParamValues =>
  Object.fromEntries(
    params.map((param) => {
      const value = preset?.[param.code];
      return [
        param.code,
        value !== undefined && presetFits(param, value)
          ? value
          : parseDefault(param),
      ];
    }),
  );

/** 表单值 → 提交的参数取值：未填的不带（由后端取缺省值 / 由调用方补齐）；开关恒带 */
export const collectParamValues = (
  params: readonly JobParam[],
  values: ParamValues | undefined,
): ParamValues => {
  const result: ParamValues = {};
  for (const param of params) {
    const value = values?.[param.code];
    if (param.type === 'bool') {
      result[param.code] = value === true;
    } else if (value !== undefined && value !== null && value !== '') {
      result[param.code] = value;
    }
  }
  return result;
};

export const ParamFields: React.FC<{
  params: readonly JobParam[];
  /** 表单值里的上级字段名；给出时各参数存于 values[prefix][code] */
  prefix?: string;
  /** 是否校验必填项，缺省校验（允许调用方补齐参数的触发器不校验） */
  enforceRequired?: boolean;
}> = ({ params, prefix, enforceRequired = true }) => {
  const rules = useFormRules();
  const { styles } = useJobStyles();
  return (
    <>
      {params.map((param) => {
        const key = param.code;
        const required = enforceRequired && param.required === true;
        const common = {
          name: prefix ? [prefix, param.code] : param.code,
          label: (
            <span>
              {param.name}
              <span className={styles.hint} style={{ marginInlineStart: 8 }}>
                {param.code}
              </span>
            </span>
          ),
          extra: param.description || undefined,
        };
        const requiredRules = required ? [rules.required(param.name)] : [];
        switch (param.type) {
          case 'text':
            return (
              <Form.Item key={key} {...common} rules={requiredRules}>
                <Input.TextArea autoSize={{ minRows: 3, maxRows: 10 }} />
              </Form.Item>
            );
          case 'int':
          case 'float':
            return (
              <Form.Item key={key} {...common} rules={requiredRules}>
                <InputNumber
                  style={{ width: 240 }}
                  precision={param.type === 'int' ? 0 : undefined}
                />
              </Form.Item>
            );
          case 'bool':
            return (
              <Form.Item key={key} {...common} valuePropName="checked">
                <Switch />
              </Form.Item>
            );
          case 'enum':
            return (
              <Form.Item
                key={key}
                {...common}
                rules={required ? [rules.select(param.name)] : []}
              >
                <Select
                  allowClear={!required}
                  options={(param.options ?? []).map((option) => ({
                    value: option,
                    label: option,
                  }))}
                />
              </Form.Item>
            );
          default:
            return (
              <Form.Item key={key} {...common} rules={requiredRules}>
                <Input />
              </Form.Item>
            );
        }
      })}
    </>
  );
};
