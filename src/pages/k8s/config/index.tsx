/**
 * 网络与配置：Service / Ingress / ConfigMap / Secret / 存储（PVC、PV、StorageClass）。
 * ConfigMap 的键值经 YAML 编辑；Secret 的值默认掩码，持有权限时可在详情里查看明文（记入审计）。
 */
import { Segmented } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { useT } from '@/utils/i18n';
import { GVRS } from '../components/meta';
import { ResourceView } from '../components/ResourceView';
import { K8sPage } from '../components/scope';

const CONFIGMAP_TEMPLATE = `apiVersion: v1
kind: ConfigMap
metadata:
  name: example
data:
  key: value
`;

const SECRET_TEMPLATE = `apiVersion: v1
kind: Secret
metadata:
  name: example
type: Opaque
stringData:
  key: value
`;

type StorageKind = 'pvc' | 'pv' | 'storageClass';

/** 存储：PVC 是命名空间级，PV 与 StorageClass 是集群级 */
const Storage: React.FC = () => {
  const [kind, setKind] = useState<StorageKind>('pvc');
  return (
    <ResourceView
      key={kind}
      gvr={GVRS[kind]}
      namespaced={kind === 'pvc'}
      extra={
        <Segmented<StorageKind>
          style={{ marginInlineStart: 12 }}
          value={kind}
          onChange={setKind}
          options={[
            { value: 'pvc', label: 'PVC' },
            { value: 'pv', label: 'PV' },
            { value: 'storageClass', label: 'StorageClass' },
          ]}
        />
      }
    />
  );
};

const Config: React.FC = () => {
  const t = useT();
  return (
    <K8sPage
      tabs={[
        {
          key: 'service',
          label: 'Service',
          render: () => <ResourceView gvr={GVRS.service} />,
        },
        {
          key: 'ingress',
          label: 'Ingress',
          render: () => <ResourceView gvr={GVRS.ingress} />,
        },
        {
          key: 'configmap',
          label: 'ConfigMap',
          render: () => (
            <ResourceView gvr={GVRS.configMap} template={CONFIGMAP_TEMPLATE} />
          ),
        },
        {
          key: 'secret',
          label: 'Secret',
          render: () => (
            <ResourceView gvr={GVRS.secret} template={SECRET_TEMPLATE} />
          ),
        },
        {
          key: 'storage',
          label: t('pages.k8s.config.tab.storage'),
          render: () => <Storage />,
        },
      ]}
    />
  );
};

export default Config;
