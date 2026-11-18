/**
 * 变更审批的入口与设置：
 * - ApprovalTemplateField：集群表单里的「审批工单模板」；
 * - ChangeSettingsButton：自助申请所用的工单模板（平台级设置）；
 * - NamespaceRequestButton / PermissionRequestButton：申请命名空间与配额、申请集群权限。
 *   两个申请入口只在对应模板已设置时出现；提交后进入标准的工单审批。
 */
import { ProFormSelect } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, Button, Form, Input, Modal, Select, Typography } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { FULL } from '@/constants/layout';
import type { ChangeSettings, RequestCluster } from '@/services/k8s/change';
import {
  getChangeSettings,
  listRequestClusters,
  requestNamespace,
  requestPermission,
  updateChangeSettings,
} from '@/services/k8s/change';
import { listCatalog } from '@/services/ticket';
import { useT } from '@/utils/i18n';
import { ALL_NAMESPACES, NAME_REGEX } from '../components/meta';

const QUANTITY_REGEX = /^[0-9]+(\.[0-9]+)?(m|k|Ki|M|Mi|G|Gi|T|Ti)?$/;

/** 已启用的工单模板选项（按分类分组）；没有工单目录权限时为空 */
const loadTemplateOptions = async () => {
  try {
    const res = await listCatalog();
    return (res.items ?? [])
      .filter((category) => (category.templates?.length ?? 0) > 0)
      .map((category) => ({
        label: category.name,
        options: (category.templates ?? []).map((tpl) => ({
          value: tpl.id,
          label: tpl.name,
        })),
      }));
  } catch {
    return [];
  }
};

export const ApprovalTemplateField: React.FC = () => {
  const t = useT();
  return (
    <ProFormSelect
      name="approvalTemplateId"
      label={t('pages.k8s.approval.template')}
      tooltip={t('pages.k8s.approval.template.tooltip')}
      colProps={FULL}
      showSearch
      allowClear
      placeholder={t('pages.k8s.approval.template.placeholder')}
      request={loadTemplateOptions}
    />
  );
};

type TemplateOptions = Awaited<ReturnType<typeof loadTemplateOptions>>;

export const ChangeSettingsButton: React.FC = () => {
  const t = useT();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState<TemplateOptions>([]);
  const [form] = Form.useForm<ChangeSettings>();

  useEffect(() => {
    if (!open) return;
    loadTemplateOptions().then(setOptions);
    getChangeSettings()
      .then((res) =>
        form.setFieldsValue({
          namespaceRequestTemplateId:
            res.settings?.namespaceRequestTemplateId || undefined,
          permissionRequestTemplateId:
            res.settings?.permissionRequestTemplateId || undefined,
        }),
      )
      .catch(() => undefined);
  }, [open, form]);

  const select = (name: keyof ChangeSettings) => (
    <Form.Item
      name={name}
      label={t(`pages.k8s.approval.setting.${name}`)}
      tooltip={t('pages.k8s.approval.setting.extra')}
    >
      <Select
        allowClear
        showSearch
        options={options}
        placeholder={t('pages.k8s.approval.setting.placeholder')}
      />
    </Form.Item>
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {t('pages.k8s.approval.setting')}
      </Button>
      <Modal
        open={open}
        destroyOnHidden
        title={t('pages.k8s.approval.setting')}
        confirmLoading={busy}
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          setBusy(true);
          try {
            await updateChangeSettings({
              namespaceRequestTemplateId:
                values.namespaceRequestTemplateId ?? '',
              permissionRequestTemplateId:
                values.permissionRequestTemplateId ?? '',
            });
            message.success(t('pages.k8s.approval.saved'));
            setOpen(false);
          } catch {
            // 错误已由请求层提示
          } finally {
            setBusy(false);
          }
        }}
      >
        <Typography.Paragraph type="secondary">
          {t('pages.k8s.approval.setting.desc')}
        </Typography.Paragraph>
        <Form form={form} layout="vertical">
          {select('namespaceRequestTemplateId')}
          {select('permissionRequestTemplateId')}
        </Form>
      </Modal>
    </>
  );
};

/** 自助申请的设置（静默读取；没有权限或未设置时两项都为空） */
export const useChangeSettings = (): ChangeSettings => {
  const [settings, setSettings] = useState<ChangeSettings>({});
  useEffect(() => {
    getChangeSettings({ silent: true })
      .then((res) => setSettings(res.settings ?? {}))
      .catch(() => undefined);
  }, []);
  return settings;
};

const useSubmitted = () => {
  const t = useT();
  const { modal } = App.useApp();
  return (res: { changeId: string; ticketId: string; ticketNumber: string }) =>
    modal.success({
      title: t('pages.k8s.approval.submitted'),
      content: t('pages.k8s.approval.request.submitted', {
        number: res.ticketNumber,
      }),
      okText: t('pages.k8s.approval.viewTicket', { number: res.ticketNumber }),
      onOk: () => history.push(`/ticket/detail/${res.ticketId}`),
      closable: true,
    });
};

interface NamespaceForm {
  name: string;
  requestsCpu?: string;
  requestsMemory?: string;
  limitsCpu?: string;
  limitsMemory?: string;
  pods?: string;
  defaultCpu?: string;
  defaultMemory?: string;
  defaultRequestCpu?: string;
  defaultRequestMemory?: string;
  reason?: string;
}

const compact = (
  pairs: [string, string | undefined][],
): Record<string, string> =>
  Object.fromEntries(
    pairs.filter(([, value]) => value?.trim()).map(([k, v]) => [k, v?.trim()]),
  ) as Record<string, string>;

export const NamespaceRequestButton: React.FC<{ clusterId: string }> = ({
  clusterId,
}) => {
  const t = useT();
  const submitted = useSubmitted();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm<NamespaceForm>();

  const quantity = {
    pattern: QUANTITY_REGEX,
    message: t('pages.k8s.namespace.quantity.rule'),
  };
  const field = (name: keyof NamespaceForm, placeholder: string) => (
    <Form.Item
      name={name}
      label={t(`pages.k8s.approval.ns.${name}`)}
      rules={[quantity]}
      style={{ flex: 1, minWidth: 180 }}
    >
      <Input placeholder={placeholder} maxLength={32} />
    </Form.Item>
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {t('pages.k8s.approval.ns.request')}
      </Button>
      <Modal
        open={open}
        width={720}
        destroyOnHidden
        title={t('pages.k8s.approval.ns.request')}
        okText={t('pages.k8s.approval.request.submit')}
        confirmLoading={busy}
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const v = await form.validateFields();
          setBusy(true);
          try {
            const res = await requestNamespace(clusterId, {
              name: v.name.trim(),
              quota: compact([
                ['requests.cpu', v.requestsCpu],
                ['requests.memory', v.requestsMemory],
                ['limits.cpu', v.limitsCpu],
                ['limits.memory', v.limitsMemory],
                ['pods', v.pods],
              ]),
              limitDefault: compact([
                ['cpu', v.defaultCpu],
                ['memory', v.defaultMemory],
              ]),
              limitDefaultRequest: compact([
                ['cpu', v.defaultRequestCpu],
                ['memory', v.defaultRequestMemory],
              ]),
              reason: v.reason?.trim() ?? '',
            });
            setOpen(false);
            form.resetFields();
            submitted(res);
          } catch {
            // 错误已由请求层提示
          } finally {
            setBusy(false);
          }
        }}
      >
        <Typography.Paragraph type="secondary">
          {t('pages.k8s.approval.ns.desc')}
        </Typography.Paragraph>
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('pages.k8s.column.name')}
            rules={[
              { required: true },
              {
                pattern: NAME_REGEX,
                message: t('pages.k8s.cluster.name.rule'),
              },
            ]}
          >
            <Input maxLength={63} placeholder="team-a" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {field('requestsCpu', '8')}
            {field('requestsMemory', '16Gi')}
            {field('limitsCpu', '16')}
            {field('limitsMemory', '32Gi')}
            {field('pods', '50')}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {field('defaultRequestCpu', '100m')}
            {field('defaultRequestMemory', '128Mi')}
            {field('defaultCpu', '500m')}
            {field('defaultMemory', '512Mi')}
          </div>
          <Form.Item name="reason" label={t('pages.k8s.approval.reason')}>
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

interface PermissionForm {
  clusterId: string;
  namespace: string;
  level: number;
  reason?: string;
}

export const PermissionRequestButton: React.FC<{
  /** 预选的集群 */
  clusterId?: string;
  type?: 'link' | 'default' | 'primary';
}> = ({ clusterId, type = 'link' }) => {
  const t = useT();
  const submitted = useSubmitted();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [clusters, setClusters] = useState<RequestCluster[]>();
  const [form] = Form.useForm<PermissionForm>();

  // 未开放权限申请（或没有该接口权限）时列表为空：不显示入口
  useEffect(() => {
    listRequestClusters()
      .then((res) => setClusters(res.items ?? []))
      .catch(() => setClusters([]));
  }, []);
  if (!clusters?.length) return null;

  return (
    <>
      <Button type={type} onClick={() => setOpen(true)}>
        {t('pages.k8s.approval.perm.request')}
      </Button>
      <Modal
        open={open}
        destroyOnHidden
        title={t('pages.k8s.approval.perm.request')}
        okText={t('pages.k8s.approval.request.submit')}
        confirmLoading={busy}
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const v = await form.validateFields();
          setBusy(true);
          try {
            const res = await requestPermission(v.clusterId, {
              namespace: v.namespace.trim(),
              level: v.level,
              reason: v.reason?.trim() ?? '',
            });
            setOpen(false);
            submitted(res);
          } catch {
            // 错误已由请求层提示
          } finally {
            setBusy(false);
          }
        }}
      >
        <Typography.Paragraph type="secondary">
          {t('pages.k8s.approval.perm.desc')}
        </Typography.Paragraph>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            clusterId: clusters.some((item) => item.id === clusterId)
              ? clusterId
              : undefined,
            namespace: '',
            level: 1,
          }}
        >
          <Form.Item
            name="clusterId"
            label={t('pages.k8s.scope.cluster')}
            rules={[{ required: true }]}
          >
            <Select
              showSearch={{ optionFilterProp: 'label' }}
              options={clusters.map((item) => ({
                value: item.id,
                label: `${item.displayName ? `${item.displayName}（${item.name}）` : item.name}${item.env ? ` · ${item.env}` : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="namespace"
            label={t('pages.k8s.column.namespace')}
            extra={t('pages.k8s.approval.perm.namespace.extra')}
            rules={[
              { required: true },
              {
                validator: async (_, value: string) => {
                  const ns = (value ?? '').trim();
                  if (ns && ns !== ALL_NAMESPACES && !NAME_REGEX.test(ns)) {
                    throw new Error(t('pages.k8s.cluster.name.rule'));
                  }
                },
              },
            ]}
          >
            <Input maxLength={63} placeholder="team-a" />
          </Form.Item>
          <Form.Item
            name="level"
            label={t('pages.k8s.roleScope.level')}
            rules={[{ required: true }]}
          >
            <Select
              options={[1, 2, 3].map((level) => ({
                value: level,
                label: t(`pages.k8s.level.${level}`),
              }))}
            />
          </Form.Item>
          <Form.Item name="reason" label={t('pages.k8s.approval.reason')}>
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
