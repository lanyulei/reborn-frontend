/**
 * 执行参数定义编辑器（受控）：每个参数一张卡片——变量名、显示名、类型、必填、缺省值、
 * 可选值（单选类型）、填写说明。校验规则与后端一致，表单校验失败后在出错的卡片下方提示原因。
 */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Form, Input, Row, Select } from 'antd';
import type React from 'react';
import type { JobParam, JobParamType } from '@/services/job/typings';
import { type Translate, useOptions, useT } from '@/utils/i18n';
import {
  JOB_LIMITS,
  PARAM_CODE_FORBIDDEN_PREFIXES,
  PARAM_CODE_REGEX,
  PARAM_CODE_RESERVED,
  PARAM_TYPE_META,
  PARAM_TYPE_ORDER,
} from '../components/meta';
import { useJobStyles } from '../components/styles';

/** 缺省值的文本能否按类型解析 */
const isValidDefault = (param: JobParam): boolean => {
  const text = param.default ?? '';
  if (text === '') return true;
  switch (param.type) {
    case 'int':
      return /^-?\d+$/.test(text);
    case 'float':
      return text.trim() !== '' && Number.isFinite(Number(text));
    case 'bool':
      return text === 'true' || text === 'false';
    case 'enum':
      return (param.options ?? []).includes(text);
    default:
      return true;
  }
};

/** 校验一个参数；返回出错原因（已本地化），无误返回 undefined */
export const validateParam = (
  param: JobParam,
  index: number,
  all: readonly JobParam[],
  t: Translate,
): string | undefined => {
  const code = param.code ?? '';
  if (!PARAM_CODE_REGEX.test(code)) return t('pages.job.param.error.code');
  if (PARAM_CODE_FORBIDDEN_PREFIXES.some((prefix) => code.startsWith(prefix))) {
    return t('pages.job.param.error.codePrefix');
  }
  if (PARAM_CODE_RESERVED.has(code)) {
    return t('pages.job.param.error.codeReserved', { code });
  }
  if (all.some((other, i) => i !== index && other.code === code)) {
    return t('pages.job.param.error.codeDuplicate', { code });
  }
  const name = param.name?.trim() ?? '';
  if (!name || name.length > JOB_LIMITS.nameMax) {
    return t('pages.job.param.error.name', { max: JOB_LIMITS.nameMax });
  }
  if (param.type === 'enum') {
    const options = param.options ?? [];
    if (
      options.length === 0 ||
      options.length > JOB_LIMITS.paramOptionMax ||
      options.some(
        (option) => !option || option.length > JOB_LIMITS.paramOptionLenMax,
      )
    ) {
      return t('pages.job.param.error.options', {
        max: JOB_LIMITS.paramOptionMax,
        len: JOB_LIMITS.paramOptionLenMax,
      });
    }
  }
  if ((param.default ?? '').length > JOB_LIMITS.paramDefaultMax) {
    return t('pages.job.param.error.defaultTooLong', {
      max: JOB_LIMITS.paramDefaultMax,
    });
  }
  if (!isValidDefault(param)) return t('pages.job.param.error.default');
  if ((param.description ?? '').length > JOB_LIMITS.descMax) {
    return t('pages.job.param.error.descriptionTooLong', {
      max: JOB_LIMITS.descMax,
    });
  }
  return undefined;
};

/** 全部参数是否无误（表单校验用） */
export const validateParams = (
  params: readonly JobParam[] | undefined,
  t: Translate,
): boolean =>
  (params ?? []).length <= JOB_LIMITS.paramMax &&
  (params ?? []).every(
    (param, index, all) => validateParam(param, index, all, t) === undefined,
  );

/** 表单值 → 提交的参数定义：去掉首尾空白，非单选类型不带可选值 */
export const normalizeParams = (params?: readonly JobParam[]): JobParam[] =>
  (params ?? []).map((param) => ({
    code: param.code,
    name: param.name.trim(),
    type: param.type,
    required: param.required ?? false,
    default: param.default ?? '',
    options: param.type === 'enum' ? (param.options ?? []) : [],
    description: param.description?.trim() ?? '',
  }));

const BOOL_DEFAULT_OPTIONS = [
  { value: 'true', label: 'true' },
  { value: 'false', label: 'false' },
];

export const ParamsEditor: React.FC<{
  value?: JobParam[];
  onChange?: (value: JobParam[]) => void;
}> = ({ value, onChange }) => {
  const t = useT();
  const { styles, cx } = useJobStyles();
  // 表单校验失败后才显示各行的出错原因（避免刚添加的空行立刻标红）
  const { status } = Form.Item.useStatus();
  const typeOptions = useOptions(PARAM_TYPE_META, PARAM_TYPE_ORDER);
  const rows = value ?? [];

  const update = (index: number, patch: Partial<JobParam>) =>
    onChange?.(
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  const changeType = (index: number, type: JobParamType) =>
    // 换类型后原缺省值多半不再合法，一并清空
    update(index, { type, default: '', options: [] });

  return (
    <div>
      {rows.length === 0 && (
        <div className={styles.hint} style={{ marginBottom: 8 }}>
          {t('pages.job.param.empty')}
        </div>
      )}
      {rows.map((row, index) => {
        const error =
          status === 'error' ? validateParam(row, index, rows, t) : undefined;
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: 行无稳定标识，按位置编辑
            key={index}
            className={cx(styles.editorCard, error && styles.editorCardError)}
          >
            <Row gutter={[8, 8]} align="middle">
              <Col span={6}>
                <Input
                  className={styles.codeInput}
                  value={row.code}
                  maxLength={64}
                  placeholder={t('pages.job.param.code.placeholder')}
                  onChange={(e) => update(index, { code: e.target.value })}
                />
              </Col>
              <Col span={6}>
                <Input
                  value={row.name}
                  maxLength={JOB_LIMITS.nameMax}
                  placeholder={t('pages.job.param.name.placeholder')}
                  onChange={(e) => update(index, { name: e.target.value })}
                />
              </Col>
              <Col span={5}>
                <Select<JobParamType>
                  style={{ width: '100%' }}
                  value={row.type}
                  options={typeOptions}
                  onChange={(type) => changeType(index, type)}
                />
              </Col>
              <Col span={5}>
                <Checkbox
                  checked={row.required === true}
                  onChange={(e) =>
                    update(index, { required: e.target.checked })
                  }
                >
                  {t('pages.job.param.required')}
                </Checkbox>
              </Col>
              <Col span={2} style={{ textAlign: 'end' }}>
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  aria-label={t('pages.job.param.remove')}
                  onClick={() => onChange?.(rows.filter((_, i) => i !== index))}
                />
              </Col>
              {row.type === 'enum' && (
                <Col span={24}>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    value={row.options ?? []}
                    open={false}
                    suffix={null}
                    tokenSeparators={[',', '，']}
                    placeholder={t('pages.job.param.options.placeholder')}
                    onChange={(options: string[]) =>
                      update(index, {
                        options,
                        // 缺省值被移出可选值时一并清空
                        default: options.includes(row.default ?? '')
                          ? row.default
                          : '',
                      })
                    }
                  />
                </Col>
              )}
              <Col span={10}>
                {row.type === 'bool' || row.type === 'enum' ? (
                  <Select
                    allowClear
                    style={{ width: '100%' }}
                    value={row.default || undefined}
                    options={
                      row.type === 'bool'
                        ? BOOL_DEFAULT_OPTIONS
                        : (row.options ?? []).map((option) => ({
                            value: option,
                            label: option,
                          }))
                    }
                    placeholder={t('pages.job.param.default.placeholder')}
                    onChange={(next?: string) =>
                      update(index, { default: next ?? '' })
                    }
                  />
                ) : (
                  <Input
                    value={row.default}
                    placeholder={t('pages.job.param.default.placeholder')}
                    onChange={(e) => update(index, { default: e.target.value })}
                  />
                )}
              </Col>
              <Col span={14}>
                <Input
                  value={row.description}
                  maxLength={JOB_LIMITS.descMax}
                  placeholder={t('pages.job.param.description.placeholder')}
                  onChange={(e) =>
                    update(index, { description: e.target.value })
                  }
                />
              </Col>
            </Row>
            <div
              className={styles.danger}
              style={{ minHeight: 8, marginTop: 4, fontSize: 12 }}
            >
              {error}
            </div>
          </div>
        );
      })}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        disabled={rows.length >= JOB_LIMITS.paramMax}
        onClick={() =>
          onChange?.([
            ...rows,
            { code: '', name: '', type: 'string', required: false },
          ])
        }
      >
        {t('pages.job.param.add')}
      </Button>
      <span className={styles.hint} style={{ marginInlineStart: 12 }}>
        {t('pages.job.param.count', {
          n: rows.length,
          max: JOB_LIMITS.paramMax,
        })}
      </span>
    </div>
  );
};
