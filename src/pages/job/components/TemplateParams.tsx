/**
 * 「固定的参数取值」表单段（定时作业、触发器共用；须放在 antd Form 内）：随所选作业模板加载其参数定义，
 * 生成参数表单项（存于表单值的 params 字段下）。换模板时按新模板的缺省值重置；编辑时回填已保存的取值。
 */
import { Alert, Form, Skeleton } from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { getJobTemplate } from '@/services/job/template';
import type { JobParam } from '@/services/job/typings';
import { useT } from '@/utils/i18n';
import {
  initialParamValues,
  ParamFields,
  type ParamValues,
} from './ParamFields';
import { useJobStyles } from './styles';

export const TemplateParams: React.FC<{
  templateId?: string;
  /** 已保存的参数取值及其所属模板（编辑时回填） */
  saved?: { templateId: string; params?: ParamValues };
  /** 是否校验必填项 */
  enforceRequired?: boolean;
  /**
   * 模板的参数定义（提交时据此整理参数取值）；undefined = 尚未加载完成或加载失败，
   * 此时不能保存——否则已保存的固定参数会被当成「没有参数」而清空。
   * templateVersion 是这份定义所属的模板版本：保存时带上，模板在表单打开期间被改过则后端拒绝
   */
  onParams: (params: JobParam[] | undefined, templateVersion?: number) => void;
}> = ({ templateId, saved, enforceRequired, onParams }) => {
  const t = useT();
  const { styles } = useJobStyles();
  const form = Form.useFormInstance();
  const [params, setParams] = useState<JobParam[]>();
  const [failed, setFailed] = useState(false);
  const report = useRef(onParams);
  report.current = onParams;
  const savedRef = useRef(saved);

  useEffect(() => {
    setParams(undefined);
    setFailed(false);
    report.current(templateId ? undefined : []);
    if (!templateId) return;
    let cancelled = false;
    getJobTemplate(templateId, { silent: true })
      .then(({ template }) => {
        if (cancelled) return;
        const defs = template.spec.params ?? [];
        const preset =
          savedRef.current?.templateId === templateId
            ? savedRef.current.params
            : undefined;
        form.setFieldValue('params', initialParamValues(defs, preset));
        setParams(defs);
        report.current(defs, template.version);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [templateId, form]);

  if (!templateId) {
    return (
      <div className={styles.hint}>{t('pages.job.params.needTemplate')}</div>
    );
  }
  if (failed) {
    return (
      <Alert type="error" showIcon title={t('pages.job.params.loadFailed')} />
    );
  }
  if (!params) return <Skeleton active paragraph={{ rows: 2 }} />;
  if (params.length === 0) {
    return <div className={styles.hint}>{t('pages.job.params.none')}</div>;
  }
  return (
    <ParamFields
      params={params}
      prefix="params"
      enforceRequired={enforceRequired}
    />
  );
};
