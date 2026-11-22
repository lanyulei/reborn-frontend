/**
 * 目标主机表单项（作业模板、快速执行共用；须放在栅格 ProForm 内）：CMDB 资源类型、连接地址属性、
 * 选择方式（指定资源 / 按条件筛选）及对应的资源选择器或筛选条件。表单值见 TargetFormValues；
 * 所在表单须在 onValuesChange 里调用 resetTargetOnModelChange。
 */
import {
  ProFormDependency,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Col, Form } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { FULL, HALF } from '@/constants/layout';
import { getModel, listAllModels } from '@/services/cmdb/model';
import type { CmdbField, CmdbModel } from '@/services/cmdb/typings';
import type { JobTarget, JobTargetMode } from '@/services/job/typings';
import { useFormRules, useOptions, useT } from '@/utils/i18n';
import { CiPicker } from './CiPicker';
import { JOB_LIMITS, TARGET_MODE_META, TARGET_MODE_ORDER } from './meta';
import { useJobStyles } from './styles';

export interface TargetFormValues {
  modelCode?: string;
  mode: JobTargetMode;
  ciIds?: string[];
  env?: string;
  tag?: string;
  keyword?: string;
  /** 空串 = 用资源名称作为地址 */
  addressField?: string;
}

/** 目标主机相关的表单项名 */
export const TARGET_FIELDS = [
  'modelCode',
  'mode',
  'ciIds',
  'env',
  'tag',
  'keyword',
  'addressField',
] as const;

/** 新建时的初值 */
export const TARGET_INITIAL: TargetFormValues = {
  mode: 1,
  ciIds: [],
  addressField: '',
};

export const buildTarget = (values: TargetFormValues): JobTarget => ({
  modelCode: values.modelCode ?? '',
  mode: values.mode,
  ciIds: values.mode === 1 ? (values.ciIds ?? []) : [],
  env: values.mode === 2 ? (values.env?.trim() ?? '') : '',
  tag: values.mode === 2 ? (values.tag?.trim() ?? '') : '',
  keyword: values.mode === 2 ? (values.keyword?.trim() ?? '') : '',
  addressField: values.addressField ?? '',
});

export const targetToValues = (target?: JobTarget): TargetFormValues => ({
  modelCode: target?.modelCode,
  mode: target?.mode ?? 1,
  ciIds: target?.ciIds ?? [],
  env: target?.env,
  tag: target?.tag,
  keyword: target?.keyword,
  addressField: target?.addressField ?? '',
});

/**
 * 表单的 onValuesChange 里调用：换了资源类型时，原先指定的资源与地址属性都不再适用，一并清空。
 */
export const resetTargetOnModelChange = (
  changed: Partial<TargetFormValues>,
  form?: { setFieldsValue: (values: Partial<TargetFormValues>) => void },
) => {
  if ('modelCode' in changed) {
    form?.setFieldsValue({ ciIds: [], addressField: '' });
  }
};

export const TargetFields: React.FC = () => {
  const t = useT();
  const rules = useFormRules();
  const { styles } = useJobStyles();
  const form = Form.useFormInstance<TargetFormValues>();
  const modelCode = Form.useWatch('modelCode', form) as string | undefined;
  const modeOptions = useOptions(TARGET_MODE_META, TARGET_MODE_ORDER);
  const [models, setModels] = useState<CmdbModel[]>([]);
  const [fields, setFields] = useState<CmdbField[]>([]);

  useEffect(() => {
    let cancelled = false;
    listAllModels()
      .then(({ items }) => {
        if (!cancelled) setModels(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // 资源类型的属性定义（地址属性的候选）
  useEffect(() => {
    setFields([]);
    if (!modelCode) return;
    let cancelled = false;
    getModel(modelCode, { silent: true })
      .then((detail) => {
        if (!cancelled) setFields(detail.fields ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [modelCode]);

  const modelOptions = useMemo(() => {
    const options = models.map((model) => ({
      value: model.code,
      label: t('pages.job.common.withCode', {
        name: model.name,
        code: model.code,
      }),
    }));
    // 资源类型不在当前用户可见范围内：按编码回显
    if (modelCode && !models.some((model) => model.code === modelCode)) {
      options.push({ value: modelCode, label: modelCode });
    }
    return options;
  }, [models, modelCode]);

  const addressOptions = useMemo(
    () => [
      { value: '', label: t('pages.job.template.form.addressField.name') },
      ...fields
        // 敏感属性不能用作地址；已废弃的属性不再提供
        .filter((field) => !field.sensitive && !field.deprecated)
        .map((field) => ({
          value: field.code,
          label: t('pages.job.common.withCode', {
            name: field.name,
            code: field.code,
          }),
        })),
    ],
    [fields, t],
  );

  return (
    <>
      <ProFormSelect
        name="modelCode"
        label={t('pages.job.template.form.model')}
        colProps={HALF}
        options={modelOptions}
        showSearch
        extra={t('pages.job.template.form.model.extra')}
        rules={[rules.select(t('pages.job.template.form.model'))]}
      />
      <ProFormSelect
        name="addressField"
        label={t('pages.job.template.form.addressField')}
        colProps={HALF}
        options={addressOptions}
        allowClear={false}
        showSearch
        extra={t('pages.job.template.form.addressField.extra')}
      />
      <ProFormRadio.Group
        name="mode"
        label={t('pages.job.template.form.mode')}
        colProps={FULL}
        options={modeOptions}
        rules={[rules.select(t('pages.job.template.form.mode'))]}
      />
      <ProFormDependency name={['mode']}>
        {({ mode }) =>
          mode === 2 ? (
            <>
              <ProFormText
                name="env"
                label={t('pages.job.template.form.env')}
                colProps={{ span: 8 }}
                placeholder="prod"
                rules={[rules.max(JOB_LIMITS.targetFilterMax)]}
              />
              <ProFormText
                name="tag"
                label={t('pages.job.template.form.tag')}
                colProps={{ span: 8 }}
                rules={[rules.max(JOB_LIMITS.targetFilterMax)]}
              />
              <ProFormText
                name="keyword"
                label={t('pages.job.template.form.keyword')}
                colProps={{ span: 8 }}
                rules={[rules.max(JOB_LIMITS.targetFilterMax)]}
              />
              <Col span={24}>
                <div
                  className={styles.hint}
                  style={{ marginTop: -16, marginBottom: 16 }}
                >
                  {t('pages.job.template.form.filter.hint')}
                </div>
              </Col>
            </>
          ) : (
            <Col span={24}>
              <Form.Item
                name="ciIds"
                label={t('pages.job.template.form.ciIds')}
                rules={[
                  {
                    validator: (_: unknown, value?: string[]) =>
                      (value ?? []).length > 0
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              t('pages.job.template.form.ciIds.required'),
                            ),
                          ),
                  },
                ]}
              >
                <CiPicker modelCode={modelCode} />
              </Form.Item>
            </Col>
          )
        }
      </ProFormDependency>
    </>
  );
};
