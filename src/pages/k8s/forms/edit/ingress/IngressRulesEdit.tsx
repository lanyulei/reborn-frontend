/** 编辑路由规则：规则（域名 / 路径 / 后端）、Ingress Class、TLS Secret、路径重写 */
import { App, Form } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '@/utils/i18n';
import {
  getIngressFormError,
  getServicePortOptions,
} from '../../ingress/helpers';
import IngressRuleSettings from '../../ingress/IngressRuleSettings';
import type {
  CreateIngressFormValues,
  IngressServiceOption,
} from '../../ingress/types';
import type { EditFormProps } from '../../shared/edit';
import { useEditObject } from '../../shared/edit';
import { fetchObject, GVRS, listNames } from '../../shared/kube';
import EditDrawer, { useEditFormValues } from '../service/EditDrawer';
import { applyIngressRules, buildIngressEditValues } from './helpers';

const ROUTE_FIELDS = [
  'rules',
  'ingressClassName',
  'tlsSecretName',
  'enablePathRewrite',
  'rewriteTarget',
];

const IngressRulesEdit = (props: EditFormProps) => {
  const { clusterId } = props;
  const t = useT();
  const { message } = App.useApp();
  // 目标在挂载期间不变
  const namespace = useRef(props.target.namespace).current;
  const state = useEditObject(clusterId, props.target);
  const [form] = Form.useForm<CreateIngressFormValues>();
  const initial = useEditFormValues(form, state.object, buildIngressEditValues);
  const [serviceOptions, setServiceOptions] = useState<IngressServiceOption[]>(
    [],
  );
  const [ingressClassNames, setIngressClassNames] = useState<string[]>([]);
  const [tlsSecretNames, setTlsSecretNames] = useState<string[]>([]);
  const loadedServicePorts = useRef(new Set<string>());

  // 候选项：Ingress Class，以及同命名空间下的服务与 Secret
  useEffect(() => {
    let active = true;
    Promise.all([
      listNames(clusterId, GVRS.ingressClass),
      namespace ? listNames(clusterId, GVRS.service, namespace) : [],
      namespace ? listNames(clusterId, GVRS.secret, namespace) : [],
    ]).then(([classes, services, secrets]) => {
      if (!active) {
        return;
      }
      setIngressClassNames(classes);
      // 端口可能已先一步读到（手输服务名）：合并而不是覆盖
      setServiceOptions((previous) => {
        const known = new Map(previous.map((item) => [item.value, item]));
        const names = Array.from(new Set([...services, ...known.keys()]));
        return names.map(
          (name) => known.get(name) || { label: name, value: name },
        );
      });
      setTlsSecretNames(secrets);
    });
    return () => {
      active = false;
    };
  }, [clusterId, namespace]);

  // 列表行不含对象内容：选中服务后再读取它的端口
  const loadServicePorts = useCallback(
    (serviceName: string) => {
      if (!namespace || loadedServicePorts.current.has(serviceName)) {
        return;
      }

      loadedServicePorts.current.add(serviceName);
      fetchObject(clusterId, GVRS.service, serviceName, namespace).then(
        (service) => {
          if (!service) {
            loadedServicePorts.current.delete(serviceName);
            return;
          }
          const ports = getServicePortOptions(service);
          setServiceOptions((previous) =>
            previous.some((item) => item.value === serviceName)
              ? previous.map((item) =>
                  item.value === serviceName ? { ...item, ports } : item,
                )
              : [
                  ...previous,
                  { label: serviceName, ports, value: serviceName },
                ],
          );
        },
      );
    },
    [clusterId, namespace],
  );

  return (
    <EditDrawer
      {...props}
      state={state}
      title={t('pages.k8s.forms.edit.ingress.rulesTitle')}
      onBuild={async (object) => {
        if (!initial) {
          return undefined;
        }
        try {
          await form.validateFields(ROUTE_FIELDS);
        } catch {
          // 校验错误已由表单项展示
          return undefined;
        }
        const values: CreateIngressFormValues = form.getFieldsValue(true);
        const error = getIngressFormError(values);
        if (error) {
          message.error(error);
          return undefined;
        }
        return applyIngressRules(object, initial, values);
      }}
    >
      <Form form={form} layout="vertical" requiredMark>
        <IngressRuleSettings
          form={form}
          ingressClassNames={ingressClassNames}
          serviceOptions={serviceOptions}
          tlsSecretNames={tlsSecretNames}
          onServiceSelect={loadServicePorts}
        />
      </Form>
    </EditDrawer>
  );
};

export default IngressRulesEdit;
