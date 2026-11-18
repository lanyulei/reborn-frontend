/**
 * 工作负载：Deployment / StatefulSet / DaemonSet / Job·CronJob / Pod。各页签都是通用资源视图，
 * 详情里按资源类型给出 Pod、日志、历史版本等页签与伸缩、重启、回滚等操作。
 */
import { Segmented } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { useT } from '@/utils/i18n';
import { GVRS } from '../components/meta';
import { ResourceView } from '../components/ResourceView';
import { K8sPage } from '../components/scope';

const DEPLOYMENT_TEMPLATE = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: example
spec:
  replicas: 1
  selector:
    matchLabels:
      app: example
  template:
    metadata:
      labels:
        app: example
    spec:
      containers:
        - name: app
          image: nginx:1.27
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
`;

/** Job 与 CronJob 合在一个页签里，用分段控件切换 */
const Jobs: React.FC = () => {
  const [kind, setKind] = useState<'cronJob' | 'job'>('cronJob');
  return (
    <ResourceView
      key={kind}
      gvr={GVRS[kind]}
      extra={
        <Segmented<'cronJob' | 'job'>
          style={{ marginInlineStart: 12 }}
          value={kind}
          onChange={setKind}
          options={[
            { value: 'cronJob', label: 'CronJob' },
            { value: 'job', label: 'Job' },
          ]}
        />
      }
    />
  );
};

const Workload: React.FC = () => {
  const t = useT();
  return (
    <K8sPage
      tabs={[
        {
          key: 'deployment',
          label: 'Deployment',
          render: () => (
            <ResourceView
              gvr={GVRS.deployment}
              template={DEPLOYMENT_TEMPLATE}
            />
          ),
        },
        {
          key: 'statefulset',
          label: 'StatefulSet',
          render: () => <ResourceView gvr={GVRS.statefulSet} />,
        },
        {
          key: 'daemonset',
          label: 'DaemonSet',
          render: () => <ResourceView gvr={GVRS.daemonSet} />,
        },
        {
          key: 'job',
          label: t('pages.k8s.workload.tab.job'),
          render: () => <Jobs />,
        },
        {
          key: 'pod',
          label: 'Pod',
          render: () => <ResourceView gvr={GVRS.pod} />,
        },
      ]}
    />
  );
};

export default Workload;
