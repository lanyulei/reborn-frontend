/** 集群表单的可观测配置：关联的监控数据源（指标面板用）、上报到通知的 Warning 事件原因。 */
import { ProFormSelect } from '@ant-design/pro-components';
import type React from 'react';
import { FULL } from '@/constants/layout';
import { listDatasourceOptions } from '@/services/monitor/datasource';
import { useT } from '@/utils/i18n';

/** 缺省上报的原因（与 kit/k8scontract.DefaultEventReasons 一致） */
export const DEFAULT_EVENT_REASONS = [
  'NodeNotReady',
  'OOMKilling',
  'OOMKilled',
  'FailedScheduling',
  'Failed',
  'ErrImagePull',
  'ImagePullBackOff',
  'FailedMount',
  'FailedAttachVolume',
  'BackOff',
];

/** 常见但缺省不上报的原因：作为候选项 */
const MORE_REASONS = [
  'Unhealthy',
  'FailedCreatePodSandBox',
  'Evicted',
  'NodeHasDiskPressure',
  'FailedKillPod',
];

const REASON_REGEX = /^[A-Za-z][A-Za-z0-9]{0,63}$/;

export const ClusterInsightFields: React.FC = () => {
  const t = useT();
  return (
    <>
      <ProFormSelect
        name="datasourceId"
        label={t('pages.k8s.cluster.datasource')}
        tooltip={t('pages.k8s.cluster.datasource.tooltip')}
        colProps={FULL}
        showSearch
        allowClear
        placeholder={t('pages.k8s.cluster.datasource.placeholder')}
        // 没有监控数据源权限时选项为空：已保存的值原样保留
        request={async () => {
          try {
            const res = await listDatasourceOptions(true);
            return (res.items ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            }));
          } catch {
            return [];
          }
        }}
      />
      <ProFormSelect
        name="eventReasons"
        label={t('pages.k8s.cluster.eventReasons')}
        tooltip={t('pages.k8s.cluster.eventReasons.tooltip', {
          reasons: DEFAULT_EVENT_REASONS.join('、'),
        })}
        extra={t('pages.k8s.cluster.eventReasons.extra')}
        colProps={FULL}
        mode="tags"
        placeholder={t('pages.k8s.cluster.eventReasons.placeholder')}
        options={[...DEFAULT_EVENT_REASONS, ...MORE_REASONS].map((r) => ({
          value: r,
          label: r,
        }))}
        fieldProps={{ maxCount: 50, tokenSeparators: [',', ' '] }}
        rules={[
          {
            validator: async (_, value?: string[]) => {
              const bad = (value ?? []).find((r) => !REASON_REGEX.test(r));
              if (bad) {
                throw new Error(
                  t('pages.k8s.cluster.eventReasons.invalid', { reason: bad }),
                );
              }
            },
          },
        ]}
      />
    </>
  );
};
