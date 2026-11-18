/**
 * 全局策略：受保护环境、审批流程、快速执行是否一律须审批、单条执行的主机数上限。
 * 审批复用流程中心：需要审批的执行按这里配置的流程发起审批，未配置时这类提交一律被拒绝。
 */
import {
  Alert,
  App,
  Badge,
  Button,
  Form,
  InputNumber,
  Select,
  Skeleton,
  Switch,
} from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { getJobPolicy, updateJobPolicy } from '@/services/job/policy';
import type { JobPolicy } from '@/services/job/typings';
import { usePermissions } from '@/services/system/permissions';
import { listDefinitions } from '@/services/workflow/definition';
import type { WorkflowDefinition } from '@/services/workflow/typings';
import { useT } from '@/utils/i18n';
import { fetchAllPages } from '@/utils/paging';
import { formatTime } from '../components/format';
import { JOB_LIMITS } from '../components/meta';
import { useJobStyles } from '../components/styles';

interface PolicyFormValues {
  protectedEnvs?: string[];
  approvalWorkflowKey?: string;
  adhocApproval?: boolean;
  maxHosts?: number;
}

export const GlobalPolicy: React.FC = () => {
  const t = useT();
  const { message } = App.useApp();
  const has = usePermissions();
  const canEdit = has('job.policy.edit');
  const { styles } = useJobStyles();
  const [form] = Form.useForm<PolicyFormValues>();
  const [policy, setPolicy] = useState<JobPolicy>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const selectedKey = Form.useWatch('approvalWorkflowKey', form);

  useEffect(() => {
    let cancelled = false;
    getJobPolicy()
      .then((result) => {
        if (!cancelled) setPolicy(result.policy ?? {});
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // 流程定义候选：没有流程定义菜单权限时静默为空（仍回显已配置的流程）
    fetchAllPages<WorkflowDefinition>((page, pageSize) =>
      listDefinitions({ page, pageSize }, { silent: true }),
    )
      .then((items) => {
        if (!cancelled) setDefinitions(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const workflowOptions = useMemo(() => {
    const options = definitions.map((definition) => {
      const usable =
        definition.status === 1 && (definition.publishedVersion ?? 0) > 0;
      return {
        value: definition.key,
        label: usable
          ? `${definition.name}（${definition.key}）`
          : t('pages.job.policy.global.workflow.notReady', {
              name: definition.name,
              key: definition.key,
            }),
      };
    });
    const current = policy?.approvalWorkflowKey;
    // 已配置的流程不在候选里（无权限 / 已删除）：按名称或标识回显
    if (current && !definitions.some((d) => d.key === current)) {
      options.push({
        value: current,
        label: policy?.approvalWorkflowName
          ? `${policy.approvalWorkflowName}（${current}）`
          : current,
      });
    }
    return options;
  }, [definitions, policy, t]);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (!policy) return null;

  const save = async (values: PolicyFormValues) => {
    setSaving(true);
    try {
      const result = await updateJobPolicy({
        protectedEnvs: (values.protectedEnvs ?? [])
          .map((env) => env.trim())
          .filter(Boolean),
        approvalWorkflowKey: values.approvalWorkflowKey ?? '',
        adhocApproval: values.adhocApproval ?? false,
        maxHosts: values.maxHosts ?? 0,
        version: policy.version,
      });
      setPolicy(result.policy ?? {});
      message.success(t('common.msg.saved'));
    } catch {
      // 已由请求层提示（版本冲突、审批流程不可发起等）
    } finally {
      setSaving(false);
    }
  };

  // 只读的就绪状态对应已保存的流程；改选之后要保存才知道
  const savedSelected =
    (selectedKey ?? '') === (policy.approvalWorkflowKey ?? '');

  return (
    <Form<PolicyFormValues>
      form={form}
      layout="vertical"
      style={{ maxWidth: 720 }}
      disabled={!canEdit || saving}
      initialValues={{
        protectedEnvs: policy.protectedEnvs ?? [],
        approvalWorkflowKey: policy.approvalWorkflowKey || undefined,
        adhocApproval: policy.adhocApproval ?? false,
        maxHosts: policy.maxHosts ?? 0,
      }}
      onFinish={(values) => void save(values)}
    >
      <Form.Item
        name="approvalWorkflowKey"
        label={t('pages.job.policy.global.workflow')}
        tooltip={t('pages.job.policy.global.workflow.vars')}
        extra={t('pages.job.policy.global.workflow.extra')}
      >
        <Select
          allowClear
          showSearch={{ optionFilterProp: 'label' }}
          options={workflowOptions}
          placeholder={t('pages.job.policy.global.workflow.placeholder')}
        />
      </Form.Item>
      <div style={{ marginTop: -12, marginBottom: 20 }}>
        {!policy.approvalWorkflowKey ? (
          <Badge
            status="error"
            text={t('pages.job.policy.global.workflow.unset')}
          />
        ) : !savedSelected ? (
          <Badge
            status="default"
            text={t('pages.job.policy.global.workflow.unsaved')}
          />
        ) : policy.approvalWorkflowReady ? (
          <Badge
            status="success"
            text={t('pages.job.policy.global.workflow.ready', {
              name: policy.approvalWorkflowName || policy.approvalWorkflowKey,
            })}
          />
        ) : (
          <Badge
            status="error"
            text={t('pages.job.policy.global.workflow.unready')}
          />
        )}
      </div>
      {!policy.approvalWorkflowReady && (
        <Alert
          type="warning"
          showIcon
          title={t('pages.job.policy.global.workflow.warning')}
          style={{ marginBottom: 20 }}
        />
      )}
      <Form.Item
        name="protectedEnvs"
        label={t('pages.job.policy.global.protectedEnvs')}
        extra={t('pages.job.policy.global.protectedEnvs.extra')}
        rules={[
          {
            validator: (_: unknown, value?: string[]) =>
              (value ?? []).length <= JOB_LIMITS.protectedEnvMax &&
              (value ?? []).every(
                (env) => env.trim().length <= JOB_LIMITS.targetFilterMax,
              )
                ? Promise.resolve()
                : Promise.reject(
                    new Error(
                      t('pages.job.policy.global.protectedEnvs.rule', {
                        max: JOB_LIMITS.protectedEnvMax,
                        len: JOB_LIMITS.targetFilterMax,
                      }),
                    ),
                  ),
          },
        ]}
      >
        <Select
          mode="tags"
          open={false}
          suffix={null}
          tokenSeparators={[',', '，', ' ']}
          placeholder="prod"
        />
      </Form.Item>
      <Form.Item
        name="adhocApproval"
        label={t('pages.job.policy.global.adhocApproval')}
        valuePropName="checked"
        extra={t('pages.job.policy.global.adhocApproval.extra')}
      >
        <Switch />
      </Form.Item>
      <Form.Item
        name="maxHosts"
        label={t('pages.job.policy.global.maxHosts')}
        extra={t('pages.job.policy.global.maxHosts.extra', {
          max: JOB_LIMITS.maxHostsMax,
        })}
      >
        <InputNumber
          min={0}
          max={JOB_LIMITS.maxHostsMax}
          precision={0}
          style={{ width: 200 }}
        />
      </Form.Item>
      {canEdit && (
        <Button type="primary" htmlType="submit" loading={saving}>
          {t('common.action.save')}
        </Button>
      )}
      {policy.updateTime && (
        <span className={styles.hint} style={{ marginInlineStart: 16 }}>
          {t('pages.job.policy.global.updated', {
            name: policy.updateUserName ?? '',
            time: formatTime(policy.updateTime),
          })}
        </span>
      )}
    </Form>
  );
};
