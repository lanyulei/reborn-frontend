import {
  ModalForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { App, Form } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/utils/i18n';
import { GVRS, listNames, toYaml, useNamespaceOptions } from '../shared/kube';
import ResourceMetadataFields from '../shared/ResourceMetadataFields';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import type { CreateServiceAccountFormValues } from './helpers';
import {
  buildServiceAccountManifest,
  SERVICE_ACCOUNT_NAME_PATTERN,
  validateImagePullSecrets,
  validateMetadataItems,
} from './helpers';

const getInitialNamespace = (namespaces: string[]) =>
  namespaces.includes('default') ? 'default' : namespaces[0];

const CreateServiceAccountModal = ({
  clusterId,
  namespace: defaultNamespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateServiceAccountFormValues>();
  const serviceAccountNameRules = [
    {
      required: true,
      message: t('pages.k8s.forms.common.name.required'),
    },
    {
      min: 1,
      max: 63,
      message: t('pages.k8s.forms.serviceaccount.name.length'),
    },
    {
      pattern: SERVICE_ACCOUNT_NAME_PATTERN,
      message: t('pages.k8s.forms.serviceaccount.name.pattern'),
    },
  ];
  const namespaceRules = [
    {
      required: true,
      message: t('pages.k8s.forms.common.namespace.required'),
    },
  ];
  const imagePullSecretRules = [
    {
      validator: async (_: unknown, value?: string[]) => {
        const error = validateImagePullSecrets(value, t);
        if (error) {
          throw new Error(error);
        }
      },
    },
  ];
  // 待提交的清单：有值时在表单之上打开清单弹窗（预检 → 提交）
  const [pending, setPending] = useState<{ yaml: string; namespace: string }>();
  const [namespaceSearch, setNamespaceSearch] = useState('');
  const [secretNames, setSecretNames] = useState<string[]>([]);
  const { namespaces, loading: namespacesLoading } =
    useNamespaceOptions(clusterId);
  const selectedNamespace = Form.useWatch('namespace', form);
  const namespaceOptions = useMemo(() => {
    // 候选项取不到（无权限列出命名空间等）时允许手输；预选的命名空间始终可选
    const names = new Set(namespaces);
    if (defaultNamespace) {
      names.add(defaultNamespace);
    }
    if (namespaces.length === 0 && namespaceSearch.trim()) {
      names.add(namespaceSearch.trim());
    }
    return [...names].map((name) => ({ label: name, value: name }));
  }, [defaultNamespace, namespaceSearch, namespaces]);

  // 没有预选命名空间时，候选项到达后默认选 default（没有则选第一个）
  useEffect(() => {
    if (defaultNamespace || form.getFieldValue('namespace')) {
      return;
    }

    const initialNamespace = getInitialNamespace(namespaces);
    if (initialNamespace) {
      form.setFieldsValue({ namespace: initialNamespace });
    }
  }, [defaultNamespace, form, namespaces]);

  // 镜像拉取密钥的候选项：所选命名空间里的保密字典（取不到时仍可手输）
  useEffect(() => {
    let cancelled = false;

    setSecretNames([]);
    if (!selectedNamespace) {
      return;
    }

    listNames(clusterId, GVRS.secret, selectedNamespace).then((names) => {
      if (!cancelled) {
        setSecretNames(names);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [clusterId, selectedNamespace]);

  return (
    <>
      <ModalForm<CreateServiceAccountFormValues>
        form={form}
        initialValues={{
          namespace: defaultNamespace || undefined,
          imagePullSecrets: [],
          labels: [],
          annotations: [],
        }}
        modalProps={{
          destroyOnHidden: true,
          mask: { closable: false },
          onCancel: onClose,
        }}
        open
        submitter={{
          resetButtonProps: {
            onClick: onClose,
          },
          searchConfig: {
            resetText: t('common.action.cancel'),
            submitText: t('common.action.submitCreate'),
          },
        }}
        title={t('pages.k8s.forms.serviceaccount.title')}
        width={520}
        onFinish={async () => {
          // onFinish 已通过表单校验；取全量值生成清单
          const values: CreateServiceAccountFormValues =
            form.getFieldsValue(true);
          const error =
            validateMetadataItems(
              values.labels,
              t('pages.k8s.forms.common.labels'),
              t,
            ) ||
            validateMetadataItems(
              values.annotations,
              t('pages.k8s.forms.common.annotations'),
              t,
            );

          if (error) {
            message.warning(error);
            return false;
          }

          setPending({
            yaml: toYaml(buildServiceAccountManifest(values)),
            namespace: values.namespace.trim(),
          });

          // 表单保持打开：清单弹窗取消后回到这里继续修改
          return false;
        }}
      >
        <ProFormText
          fieldProps={{
            autoComplete: 'off',
            autoFocus: true,
          }}
          label={t('pages.k8s.forms.common.name')}
          name="name"
          placeholder={t('pages.k8s.forms.common.name.required')}
          rules={serviceAccountNameRules}
        />
        <ProFormSelect
          fieldProps={{
            loading: namespacesLoading,
            showSearch: {
              optionFilterProp: 'label',
              onSearch: setNamespaceSearch,
            },
            // 镜像拉取密钥属于命名空间：切换后清空已选
            onChange: () => form.setFieldsValue({ imagePullSecrets: [] }),
          }}
          label={t('pages.k8s.forms.common.namespace')}
          name="namespace"
          options={namespaceOptions}
          placeholder={t('pages.k8s.forms.common.namespace.required')}
          rules={namespaceRules}
        />
        <ProFormSelect
          extra={t('pages.k8s.forms.serviceaccount.imagePullSecrets.extra')}
          fieldProps={{
            mode: 'tags',
            tokenSeparators: [',', ' '],
          }}
          label={t('pages.k8s.forms.serviceaccount.imagePullSecrets')}
          name="imagePullSecrets"
          options={secretNames.map((name) => ({ label: name, value: name }))}
          placeholder={t(
            'pages.k8s.forms.serviceaccount.imagePullSecrets.placeholder',
          )}
          rules={imagePullSecretRules}
        />
        <ResourceMetadataFields collapsible />
      </ModalForm>
      {pending && (
        <SubmitManifest
          clusterId={clusterId}
          yaml={pending.yaml}
          namespace={pending.namespace}
          title={t('pages.k8s.forms.serviceaccount.title')}
          onBack={() => setPending(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateServiceAccountModal;
