import type { FormInstance } from 'antd';
import { App, Form } from 'antd';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useT } from '@/utils/i18n';
import { toYaml } from '../shared/kube';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import type { Manifest } from './helpers';
import {
  checkContainers,
  checkWorkloadValues,
  inspectYamlSubmission,
} from './helpers';
import type { CreateWorkloadFormValues } from './types';

/** 多个对象 → 多文档 YAML */
const documentsToYaml = (documents: Manifest[]) =>
  documents.map((document) => toYaml(document)).join('---\n');

type UseCreateWizardOptions<Values extends CreateWorkloadFormValues> =
  CreateFormProps & {
    form: FormInstance<Values>;
    /** 目标对象的 kind / apiVersion：YAML 模式提交前据此检查 */
    kind: string;
    apiVersion: string;
    /** 清单弹窗的标题 */
    title: string;
    stepCount: number;
    /** 「容器组设置」所在的步骤：离开它之前要求至少有一个工作容器 */
    containerStep: number;
    initialValues: Values;
    /** 表单值 → 要提交的全部对象 */
    buildDocuments: (values: Values) => Manifest[];
  };

/**
 * 三个工作负载向导（工作负载 / 任务 / 定时任务）共用的流程：步骤切换与校验、表单 ⇄ YAML 模式、
 * 以及最终提交——向导自己不写集群，只把 YAML 交给清单弹窗做服务端预检并提交。
 */
const useCreateWizard = <Values extends CreateWorkloadFormValues>({
  apiVersion,
  buildDocuments,
  clusterId,
  containerStep,
  form,
  initialValues,
  kind,
  stepCount,
  title,
  onClose,
  onDone,
}: UseCreateWizardOptions<Values>) => {
  const { message } = App.useApp();
  const t = useT();
  // 共用逻辑只读写工作负载的公共字段：按公共字段类型使用同一个表单实例
  const baseForm = form as unknown as FormInstance<CreateWorkloadFormValues>;
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() =>
    documentsToYaml(buildDocuments(initialValues)),
  );
  const [submission, setSubmission] = useState<{
    yaml: string;
    namespace?: string;
  }>();
  // 向导只在打开期间挂载：初始值只在挂载时写入一次
  const initialValuesRef = useRef(initialValues);
  const values = (Form.useWatch([], { form, preserve: true }) || {}) as Values;

  useEffect(() => {
    baseForm.setFieldsValue(initialValuesRef.current);
  }, [baseForm]);

  /** 全部表单值：只挂载了当前步骤的字段，必须用 getFieldsValue(true) 取完整数据 */
  const getAllValues = () => form.getFieldsValue(true) as Values;

  const validateCurrentStep = async () => {
    if (current === containerStep) {
      const warning = checkContainers(getAllValues(), t);
      if (warning) {
        message.warning(warning);
        return false;
      }
    }

    try {
      // 不传字段名：校验当前步骤挂载的全部字段
      await form.validateFields();
    } catch {
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (await validateCurrentStep()) {
      setCurrent((step) => Math.min(step + 1, stepCount - 1));
    }
  };

  const handleStepChange = async (nextStep: number) => {
    if (nextStep <= current) {
      setCurrent(nextStep);
      return;
    }
    if (nextStep > current + 1) {
      return;
    }
    if (await validateCurrentStep()) {
      setCurrent(nextStep);
    }
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      setYamlValue(documentsToYaml(buildDocuments(getAllValues())));
    }
    setYamlMode(checked);
  };

  const handleSubmit = async () => {
    if (yamlMode) {
      const result = inspectYamlSubmission(yamlValue, kind, apiVersion, t);
      if (result.error !== undefined) {
        message.error(result.error);
        return;
      }

      const targetNamespace = result.namespace || getAllValues().namespace;
      if (!targetNamespace) {
        message.error(t('pages.k8s.forms.common.yaml.nameNamespaceRequired'));
        return;
      }
      setSubmission({ yaml: yamlValue, namespace: targetNamespace });
      return;
    }

    if (!(await validateCurrentStep())) {
      return;
    }

    const allValues = getAllValues();
    const warning = checkWorkloadValues(allValues, t);
    if (warning) {
      message.warning(warning);
      return;
    }
    setSubmission({
      yaml: documentsToYaml(buildDocuments(allValues)),
      namespace: allValues.namespace?.trim(),
    });
  };

  const manifestModal: ReactNode = submission ? (
    <SubmitManifest
      clusterId={clusterId}
      yaml={submission.yaml}
      namespace={submission.namespace}
      title={title}
      onBack={() => setSubmission(undefined)}
      onClose={onClose}
      onDone={onDone}
    />
  ) : null;

  return {
    /** 全部表单值的实时快照（步骤状态文案用） */
    values,
    manifestModal,
    drawerProps: {
      current,
      open: true,
      yamlMode,
      yamlValue,
      onCancel: onClose,
      onNext: handleNext,
      onPrev: () => setCurrent((step) => Math.max(step - 1, 0)),
      onStepChange: handleStepChange,
      onSubmit: handleSubmit,
      onYamlChange: setYamlValue,
      onYamlModeChange: handleYamlModeChange,
    },
    formProps: {
      form,
      layout: 'vertical' as const,
      requiredMark: true,
      onValuesChange: (changedValues: Partial<Values>) => {
        // 亲和目标只在工作负载所在命名空间里选：换了命名空间，已选目标作废
        if ('namespace' in changedValues) {
          const rules = getAllValues().podSchedulingCustomRules || [];
          if (rules.some((rule) => rule?.target)) {
            baseForm.setFieldValue(
              'podSchedulingCustomRules',
              rules.map((rule) => ({
                ...rule,
                target: undefined,
                targetSelector: undefined,
              })),
            );
          }
        }
        if (!yamlMode) {
          setYamlValue(documentsToYaml(buildDocuments(getAllValues())));
        }
      },
    },
  };
};

export { documentsToYaml };
export default useCreateWizard;
