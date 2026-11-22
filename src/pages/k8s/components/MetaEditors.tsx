/**
 * 节点的标签 / 污点编辑，命名空间的配额（ResourceQuota）与容器缺省资源（LimitRange）编辑。
 * 都是「表单 → 改对象 → 预检（dry-run）→ 对比 → 提交」，与 YAML 编辑走同一条变更路径；
 * 表单没建模的字段原样保留（workloadForm.ts 的 applyNodeMeta / applyQuota）。
 */
import { DeleteOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Col,
  Collapse,
  Drawer,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Spin,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import SectionTitle from '@/components/SectionTitle';
import {
  getApprovalCluster,
  getEmergencyCluster,
} from '@/services/k8s/approval';
import {
  getErrorReason,
  getK8sErrorMessage,
  isChangeSubmitted,
} from '@/services/k8s/request';
import {
  applyManifest,
  applyObject,
  deleteObject,
  getObject,
  listResources,
  previewManifest,
  previewObject,
} from '@/services/k8s/resource';
import type { GVR, ManifestItem, PreviewResult } from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { useKeyValueEditorStyles } from '../forms/shared/KeyValueEditor';
import { ApprovalNotice } from './approval';
import { GVRS } from './meta';
import {
  applyNodeMeta,
  applyQuota,
  duplicates,
  type KV,
  parseObject,
  QUANTITY,
  type QuotaForm,
  quotaToForm,
  TAINT_EFFECTS,
  type TaintForm,
  taintError,
  toYaml,
  validLabelKey,
  validLabelValue,
} from './workloadForm';
import { YamlDiff } from './YamlEditor';

type T = ReturnType<typeof useT>;

/** 键值对列表（标签 / 注解）：外观与创建向导里的标签 / 注解编辑一致，逐行校验 */
const KVList: React.FC<{
  name: string | (string | number)[];
  t: T;
  /** 值按标签值校验（注解不校验） */
  labelValue?: boolean;
}> = ({ name, t, labelValue }) => {
  const { styles } = useKeyValueEditorStyles({ footerJustify: 'flex-end' });
  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <>
          <div className={styles.editor}>
            {fields.map((field) => (
              <div
                key={field.key}
                className={styles.row}
                // 校验提示出现时各列顶对齐
                style={{ alignItems: 'start' }}
              >
                <Form.Item
                  name={[field.name, 'key']}
                  style={{ marginBottom: 0 }}
                  rules={[
                    {
                      validator: (_, v) =>
                        validLabelKey(v ?? '')
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(t('pages.k8s.form.key.rule')),
                            ),
                    },
                  ]}
                >
                  <Input
                    className={styles.input}
                    placeholder={t('pages.k8s.form.key')}
                    maxLength={317}
                  />
                </Form.Item>
                <Form.Item
                  name={[field.name, 'value']}
                  style={{ marginBottom: 0 }}
                  rules={
                    labelValue
                      ? [
                          {
                            validator: (_, v) =>
                              validLabelValue(v ?? '')
                                ? Promise.resolve()
                                : Promise.reject(
                                    new Error(
                                      t('pages.k8s.form.labelValue.rule'),
                                    ),
                                  ),
                          },
                        ]
                      : undefined
                  }
                >
                  <Input
                    className={styles.input}
                    placeholder={t('pages.k8s.form.value')}
                  />
                </Form.Item>
                <Button
                  aria-label={t('common.action.delete')}
                  className={styles.deleteButton}
                  icon={<DeleteOutlined />}
                  type="text"
                  onClick={() => remove(field.name)}
                />
              </div>
            ))}
          </div>
          <div className={styles.footer}>
            <Button onClick={() => add({ key: '', value: '' })}>
              {t('pages.k8s.form.add')}
            </Button>
          </div>
        </>
      )}
    </Form.List>
  );
};

const QUOTA: GVR = { group: '', version: 'v1', resource: 'resourcequotas' };
const LIMIT_RANGE: GVR = { group: '', version: 'v1', resource: 'limitranges' };

/** 编辑抽屉的宽度：视口的一半，至少 800px（与 YAML 编辑抽屉一致） */
const EDIT_DRAWER_SIZE = 'max(800px, 50vw)';

/** 节点：标签与污点 */
export const NodeMetaModal: React.FC<{
  clusterId: string;
  node: string;
  onClose: () => void;
  onDone?: () => void;
}> = ({ clusterId, node, onClose, onDone }) => {
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<{ labels: KV[]; taints: TaintForm[] }>();
  const { styles: kvStyles } = useKeyValueEditorStyles({
    footerJustify: 'flex-end',
  });
  const obj = useRef<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [conflict, setConflict] = useState(false);
  const [resourceVersion, setResourceVersion] = useState('');
  const [preview, setPreview] = useState<{
    yaml: string;
    result: PreviewResult;
  }>();
  const ref = useRef({ ...GVRS.node, name: node }).current;

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    setConflict(false);
    setPreview(undefined);
    try {
      const res = await getObject(clusterId, ref, { silent: true });
      const parsed = parseObject(res.yaml);
      delete parsed.status;
      obj.current = parsed;
      setResourceVersion(res.resourceVersion);
      form.setFieldsValue({
        labels: Object.entries(res.object.metadata?.labels ?? {}).map(
          ([key, value]) => ({ key, value }),
        ),
        taints: (res.object.spec?.taints ?? []).map((taint: TaintForm) => ({
          key: taint.key,
          value: taint.value,
          effect: taint.effect,
        })),
      });
    } catch (err) {
      setError(getK8sErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clusterId, ref, form]);

  useEffect(() => {
    void load();
  }, [load]);

  const fail = (err: unknown) => {
    if (isChangeSubmitted(err)) {
      onClose();
      return;
    }
    setConflict(getErrorReason(err) === 'K8S_CONFLICT');
    setError(getK8sErrorMessage(err));
  };

  const doPreview = async () => {
    let values: { labels: KV[]; taints: TaintForm[] };
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const labels = values.labels ?? [];
    const taints = values.taints ?? [];
    const dup = [
      ...duplicates(labels.map((l) => l.key)),
      ...duplicates(taints.map((x) => `${x.key}:${x.effect}`)),
    ];
    if (dup.length > 0) {
      setError(t('pages.k8s.form.duplicate', { names: dup.join(', ') }));
      return;
    }
    setBusy(true);
    setError(undefined);
    setConflict(false);
    try {
      const yaml = toYaml(applyNodeMeta(obj.current, labels, taints));
      const result = await previewObject(
        clusterId,
        { ref, yaml, resourceVersion },
        { silent: true },
      );
      setPreview({ yaml, result });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!preview) return;
    setBusy(true);
    setError(undefined);
    try {
      await applyObject(
        clusterId,
        {
          ref,
          yaml: preview.yaml,
          resourceVersion: preview.result.resourceVersion,
        },
        { silent: true },
      );
      message.success(t('common.msg.updated'));
      onDone?.();
      onClose();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      open
      size={EDIT_DRAWER_SIZE}
      keyboard={false}
      title={t('pages.k8s.nodeMeta.title', { name: node })}
      destroyOnHidden
      mask={{ closable: false }}
      onClose={onClose}
      footer={
        <Flex justify="end" gap={8}>
          <Button onClick={onClose}>{t('common.action.cancel')}</Button>
          {preview ? (
            <>
              <Button disabled={busy} onClick={() => setPreview(undefined)}>
                {t('pages.k8s.change.back')}
              </Button>
              <Button
                type="primary"
                loading={busy}
                disabled={!preview.result.changed}
                onClick={() => void apply()}
              >
                {t('pages.k8s.change.apply')}
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              loading={busy}
              disabled={loading}
              onClick={() => void doPreview()}
            >
              {t('pages.k8s.change.preview')}
            </Button>
          )}
        </Flex>
      }
    >
      <ApprovalNotice />
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={error}
          action={
            conflict && (
              <Button size="small" onClick={() => void load()}>
                {t('pages.k8s.change.reload')}
              </Button>
            )
          }
        />
      )}
      <Spin spinning={loading}>
        {preview &&
          (preview.result.changed ? (
            <YamlDiff
              before={preview.result.beforeYaml}
              after={preview.result.afterYaml}
            />
          ) : (
            <Alert
              type="info"
              showIcon
              title={t('pages.k8s.change.noChange')}
            />
          ))}
        {/* 抽屉正文自带滚动：不再限制表单高度 */}
        <div style={{ display: preview ? 'none' : undefined }}>
          <Form form={form} layout="vertical" disabled={busy}>
            <Form.Item label={t('pages.k8s.detail.labels')}>
              <KVList name="labels" t={t} labelValue />
            </Form.Item>
            <Form.Item
              label={t('pages.k8s.nodeMeta.taints')}
              extra={t('pages.k8s.nodeMeta.taints.hint')}
            >
              <Form.List name="taints">
                {(fields, { add, remove }) => (
                  <>
                    <div className={kvStyles.editor}>
                      {fields.map((field) => (
                        <div
                          key={field.key}
                          className={kvStyles.row}
                          // 比键值行多一列「效果」；校验提示出现时各列顶对齐
                          style={{
                            gridTemplateColumns:
                              'minmax(0, 1fr) minmax(0, 1fr) 190px 40px',
                            alignItems: 'start',
                          }}
                        >
                          <Form.Item
                            name={[field.name, 'key']}
                            style={{ marginBottom: 0 }}
                            rules={[
                              {
                                validator: (_, v) =>
                                  taintError({
                                    key: v ?? '',
                                    effect: 'NoSchedule',
                                  }) === 'key'
                                    ? Promise.reject(
                                        new Error(t('pages.k8s.form.key.rule')),
                                      )
                                    : Promise.resolve(),
                              },
                            ]}
                          >
                            <Input
                              className={kvStyles.input}
                              placeholder={t('pages.k8s.form.key')}
                            />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'value']}
                            style={{ marginBottom: 0 }}
                            rules={[
                              {
                                validator: (_, v) =>
                                  taintError({
                                    key: 'k',
                                    value: v ?? '',
                                    effect: 'NoSchedule',
                                  }) === 'value'
                                    ? Promise.reject(
                                        new Error(
                                          t('pages.k8s.form.labelValue.rule'),
                                        ),
                                      )
                                    : Promise.resolve(),
                              },
                            ]}
                          >
                            <Input
                              className={kvStyles.input}
                              placeholder={t('pages.k8s.form.value')}
                            />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'effect']}
                            style={{ marginBottom: 0 }}
                            rules={[{ required: true, message: '' }]}
                          >
                            <Select
                              options={TAINT_EFFECTS.map((value) => ({
                                value,
                              }))}
                            />
                          </Form.Item>
                          <Button
                            aria-label={t('common.action.delete')}
                            className={kvStyles.deleteButton}
                            icon={<DeleteOutlined />}
                            type="text"
                            onClick={() => remove(field.name)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className={kvStyles.footer}>
                      <Button
                        onClick={() =>
                          add({ key: '', value: '', effect: 'NoSchedule' })
                        }
                      >
                        {t('pages.k8s.form.add')}
                      </Button>
                    </div>
                  </>
                )}
              </Form.List>
            </Form.Item>
          </Form>
        </div>
      </Spin>
    </Drawer>
  );
};

const QUOTA_FIELDS: [keyof QuotaForm, string][] = [
  ['cpuRequests', '4'],
  ['memoryRequests', '8Gi'],
  ['cpuLimits', '8'],
  ['memoryLimits', '16Gi'],
  ['pods', '50'],
];
const LIMIT_FIELDS: [keyof QuotaForm, string][] = [
  ['defaultCpuRequest', '100m'],
  ['defaultMemoryRequest', '128Mi'],
  ['defaultCpuLimit', '500m'],
  ['defaultMemoryLimit', '256Mi'],
];

interface QuotaPlan {
  /** 要创建 / 更新的对象 */
  yaml: string;
  /** 建模字段全部清空后要删除的对象 */
  deletes: { ref: GVR & { namespace: string; name: string }; kind: string }[];
  items: ManifestItem[];
}

/**
 * 命名空间的配额与容器缺省资源：编辑名为 default 的 ResourceQuota / LimitRange（没有则取第一个；
 * 都没有则新建 default）。清空某一组的全部字段即删除对应对象（它没有其它内容时）。
 */
export const NamespaceQuotaModal: React.FC<{
  clusterId: string;
  namespace: string;
  onClose: () => void;
  onDone?: () => void;
}> = ({ clusterId, namespace, onClose, onDone }) => {
  const t = useT();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<QuotaForm>();
  const current = useRef<{
    quota?: Record<string, unknown>;
    limitRange?: Record<string, unknown>;
    others: string[];
  }>({ others: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [others, setOthers] = useState<string[]>([]);
  const [plan, setPlan] = useState<QuotaPlan>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    setPlan(undefined);
    try {
      const pick = async (gvr: GVR) => {
        const list = await listResources(
          clusterId,
          { ...gvr, namespace, pageSize: 200 },
          { silent: true },
        );
        const names = (list.rows ?? []).map((row) => row.name);
        const name = names.includes('default') ? 'default' : names[0];
        if (!name) return { names, object: undefined };
        const res = await getObject(
          clusterId,
          { ...gvr, namespace, name },
          { silent: true },
        );
        const parsed = parseObject(res.yaml);
        delete parsed.status;
        return { names: names.filter((n) => n !== name), object: parsed };
      };
      const [quota, limitRange] = await Promise.all([
        pick(QUOTA),
        pick(LIMIT_RANGE),
      ]);
      current.current = {
        quota: quota.object,
        limitRange: limitRange.object,
        others: [...quota.names, ...limitRange.names],
      };
      setOthers(current.current.others);
      form.resetFields();
      form.setFieldsValue(quotaToForm(quota.object, limitRange.object));
    } catch (err) {
      setError(getK8sErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clusterId, namespace, form]);

  useEffect(() => {
    void load();
  }, [load]);

  const doPreview = async () => {
    let values: QuotaForm;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const { quota, limitRange } = current.current;
      const out = applyQuota(
        namespace,
        values,
        quota ? structuredClone(quota) : undefined,
        limitRange ? structuredClone(limitRange) : undefined,
      );
      const docs = [out.quota, out.limitRange].filter(Boolean);
      const deletes: QuotaPlan['deletes'] = [];
      const nameOf = (o?: Record<string, unknown>) =>
        (o?.metadata as { name?: string } | undefined)?.name ?? '';
      if (quota && !out.quota) {
        deletes.push({
          ref: { ...QUOTA, namespace, name: nameOf(quota) },
          kind: 'ResourceQuota',
        });
      }
      if (limitRange && !out.limitRange) {
        deletes.push({
          ref: { ...LIMIT_RANGE, namespace, name: nameOf(limitRange) },
          kind: 'LimitRange',
        });
      }
      const yaml = docs.map((d) => toYaml(d)).join('---\n');
      let items: ManifestItem[] = [];
      if (yaml) {
        const res = await previewManifest(
          clusterId,
          { yaml, namespace },
          { silent: true },
        );
        items = res.items ?? [];
        const bad = items.find((item) => item.error);
        if (bad) {
          setError(`${bad.kind} ${bad.ref.name ?? ''}: ${bad.error}`);
          return;
        }
      }
      setPlan({ yaml, deletes, items });
    } catch (err) {
      setError(getK8sErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!plan) return;
    // 需审批的集群上，每个请求各生成一张变更单：第一个请求转审批后，其余步骤不会被提交。
    // 不允许只提交一半——一次只提交一项（先保存新增 / 修改，审批执行后再提交移除）。
    const steps = (plan.yaml ? 1 : 0) + plan.deletes.length;
    if (
      steps > 1 &&
      getApprovalCluster() === clusterId &&
      getEmergencyCluster() !== clusterId
    ) {
      setError(t('pages.k8s.change.oneStep'));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      if (plan.yaml) {
        const res = await applyManifest(
          clusterId,
          { yaml: plan.yaml, namespace },
          { silent: true },
        );
        const bad = (res.items ?? []).find((item) => item.error);
        if (bad) {
          setError(`${bad.kind} ${bad.ref.name ?? ''}: ${bad.error}`);
          onDone?.();
          return;
        }
      }
      for (const del of plan.deletes) {
        await deleteObject(clusterId, { ref: del.ref });
      }
      message.success(t('common.msg.updated'));
      onDone?.();
      onClose();
    } catch (err) {
      if (isChangeSubmitted(err)) {
        onClose();
        return;
      }
      setError(getK8sErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  /** 方案里有删除（清空配额 / 限制范围）时先二次确认，再提交 */
  const submit = () => {
    if (!plan) return;
    if (plan.deletes.length === 0) {
      void apply();
      return;
    }
    modal.confirm({
      title: t('pages.k8s.quota.delete.title'),
      content: t('pages.k8s.quota.delete.content', {
        kinds: plan.deletes.map((del) => del.kind).join(', '),
      }),
      okButtonProps: { danger: true },
      onOk: apply,
    });
  };

  const rule = {
    pattern: QUANTITY,
    message: t('pages.k8s.namespace.quantity.rule'),
  };
  const field = ([name, placeholder]: [keyof QuotaForm, string]) => (
    <Col span={8} key={name}>
      <Form.Item
        name={name}
        label={t(`pages.k8s.namespace.${name}`)}
        rules={[rule]}
      >
        <Input placeholder={placeholder} allowClear />
      </Form.Item>
    </Col>
  );
  const unchanged =
    plan &&
    plan.deletes.length === 0 &&
    plan.items.every((item) => item.beforeYaml === item.afterYaml);

  return (
    <Drawer
      open
      size={EDIT_DRAWER_SIZE}
      keyboard={false}
      title={t('pages.k8s.quota.title', { name: namespace })}
      destroyOnHidden
      mask={{ closable: false }}
      onClose={onClose}
      footer={
        <Flex justify="end" gap={8}>
          <Button onClick={onClose}>{t('common.action.cancel')}</Button>
          {plan ? (
            <>
              <Button disabled={busy} onClick={() => setPlan(undefined)}>
                {t('pages.k8s.change.back')}
              </Button>
              <Button
                type="primary"
                danger={plan.deletes.length > 0}
                loading={busy}
                disabled={unchanged}
                onClick={submit}
              >
                {t('pages.k8s.change.apply')}
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              loading={busy}
              disabled={loading}
              onClick={() => void doPreview()}
            >
              {t('pages.k8s.change.preview')}
            </Button>
          )}
        </Flex>
      }
    >
      <ApprovalNotice />
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={error}
        />
      )}
      <Spin spinning={loading}>
        {plan && (
          <>
            {unchanged && (
              <Alert
                type="info"
                showIcon
                title={t('pages.k8s.change.noChange')}
              />
            )}
            {plan.deletes.map((del) => (
              <Alert
                key={del.kind}
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                title={t('pages.k8s.quota.delete', {
                  kind: del.kind,
                  name: del.ref.name,
                })}
              />
            ))}
            {!unchanged && plan.items.length > 0 && (
              <Collapse
                size="small"
                defaultActiveKey={plan.items.map((_, i) => String(i))}
                items={plan.items.map((item, i) => ({
                  key: String(i),
                  label: `${item.kind} ${item.ref.name ?? ''}${
                    item.create ? ` · ${t('common.action.create')}` : ''
                  }`,
                  children: (
                    <YamlDiff
                      before={item.beforeYaml ?? ''}
                      after={item.afterYaml ?? ''}
                      maxHeight={320}
                    />
                  ),
                }))}
              />
            )}
          </>
        )}
        <div style={{ display: plan ? 'none' : undefined }}>
          {others.length > 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              title={t('pages.k8s.quota.others', { names: others.join(', ') })}
            />
          )}
          <Form form={form} layout="vertical" disabled={busy}>
            <SectionTitle>{t('pages.k8s.quota.section')}</SectionTitle>
            <Typography.Paragraph type="secondary">
              {t('pages.k8s.namespace.quota.hint')}
            </Typography.Paragraph>
            <Row gutter={16}>{QUOTA_FIELDS.map(field)}</Row>
            <SectionTitle>{t('pages.k8s.quota.limitRange')}</SectionTitle>
            <Typography.Paragraph type="secondary">
              {t('pages.k8s.namespace.limitRange.hint')}
            </Typography.Paragraph>
            <Row gutter={16}>{LIMIT_FIELDS.map(field)}</Row>
          </Form>
        </div>
      </Spin>
    </Drawer>
  );
};
