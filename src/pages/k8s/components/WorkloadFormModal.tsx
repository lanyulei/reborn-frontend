/**
 * 工作负载表单：Deployment / StatefulSet / DaemonSet / CronJob 的创建与编辑。
 * 表单 ⇄ YAML 可随时切换，两边同一份对象：表单只改它建模的字段，其余字段原样保留
 * （逻辑在 workloadForm.ts）。提交仍走统一路径——编辑：预检（dry-run）→ 对比 → 提交；
 * 创建：生成清单（可附带 Service）后交给清单弹窗预检与提交。
 */
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  AutoComplete,
  Button,
  Checkbox,
  Col,
  Collapse,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Segmented,
  Select,
  Spin,
  Switch,
  Tabs,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getErrorReason,
  getK8sErrorMessage,
  isChangeSubmitted,
} from '@/services/k8s/request';
import {
  applyObject,
  getObject,
  listResources,
  previewObject,
} from '@/services/k8s/resource';
import type { GVR, PreviewResult, ResourceRef } from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { ApprovalNotice } from './approval';
import { ManifestModal } from './ChangePreview';
import { GVRS } from './meta';
import {
  applyForm,
  DNS_LABEL,
  duplicates,
  ENV_NAME,
  emptyContainer,
  emptyForm,
  INT_OR_PERCENT,
  kindOfObject,
  newWorkload,
  parseObject,
  QUANTITY,
  serviceFor,
  toForm,
  toYaml,
  validLabelKey,
  validLabelValue,
  type WorkloadForm,
  type WorkloadKind,
} from './workloadForm';
import { YamlDiff, YamlEditor } from './YamlEditor';

export const WORKLOAD_FORM_GVR: Record<WorkloadKind, GVR> = {
  Deployment: GVRS.deployment,
  StatefulSet: GVRS.statefulSet,
  DaemonSet: GVRS.daemonSet,
  CronJob: GVRS.cronJob,
};

/** 资源类型 → 表单支持的 Kind；不支持返回 undefined */
export const formKindOf = (gvr: GVR): WorkloadKind | undefined =>
  (Object.keys(WORKLOAD_FORM_GVR) as WorkloadKind[]).find(
    (kind) =>
      WORKLOAD_FORM_GVR[kind].resource === gvr.resource &&
      WORKLOAD_FORM_GVR[kind].group === gvr.group,
  );

type T = ReturnType<typeof useT>;

/** 键值对列表（标签 / 注解） */
export const KVList: React.FC<{
  name: string | (string | number)[];
  t: T;
  /** 值按标签值校验（注解不校验） */
  labelValue?: boolean;
}> = ({ name, t, labelValue }) => (
  <Form.List name={name}>
    {(fields, { add, remove }) => (
      <>
        {fields.map((field) => (
          <Flex key={field.key} gap={8} align="baseline">
            <Form.Item
              name={[field.name, 'key']}
              style={{ flex: 1, marginBottom: 8 }}
              rules={[
                {
                  validator: (_, v) =>
                    validLabelKey(v ?? '')
                      ? Promise.resolve()
                      : Promise.reject(new Error(t('pages.k8s.form.key.rule'))),
                },
              ]}
            >
              <Input placeholder={t('pages.k8s.form.key')} maxLength={317} />
            </Form.Item>
            <Form.Item
              name={[field.name, 'value']}
              style={{ flex: 1, marginBottom: 8 }}
              rules={
                labelValue
                  ? [
                      {
                        validator: (_, v) =>
                          validLabelValue(v ?? '')
                            ? Promise.resolve()
                            : Promise.reject(
                                new Error(t('pages.k8s.form.labelValue.rule')),
                              ),
                      },
                    ]
                  : undefined
              }
            >
              <Input placeholder={t('pages.k8s.form.value')} />
            </Form.Item>
            <MinusCircleOutlined onClick={() => remove(field.name)} />
          </Flex>
        ))}
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => add({ key: '', value: '' })}
        >
          {t('pages.k8s.form.add')}
        </Button>
      </>
    )}
  </Form.List>
);

const quantityRule = (t: T) => ({
  pattern: QUANTITY,
  message: t('pages.k8s.namespace.quantity.rule'),
});

const Probe: React.FC<{ base: (string | number)[]; label: string; t: T }> = ({
  base,
  label,
  t,
}) => (
  <Form.Item label={label} style={{ marginBottom: 8 }}>
    <Flex gap={8} wrap>
      <Form.Item name={[...base, 'type']} noStyle>
        <Select
          style={{ width: 130 }}
          options={[
            { value: 'none', label: t('pages.k8s.form.probe.none') },
            { value: 'httpGet', label: 'HTTP' },
            { value: 'tcpSocket', label: 'TCP' },
            { value: 'exec', label: t('pages.k8s.form.probe.exec') },
            {
              value: 'raw',
              label: t('pages.k8s.form.probe.raw'),
              disabled: true,
            },
          ]}
        />
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(a, b) =>
          JSON.stringify(a.containers) !== JSON.stringify(b.containers)
        }
      >
        {({ getFieldValue }) => {
          const type = getFieldValue(['containers', ...base, 'type']);
          if (!type || type === 'none' || type === 'raw') return null;
          return (
            <>
              {type === 'httpGet' && (
                <Form.Item name={[...base, 'path']} noStyle>
                  <Input style={{ width: 160 }} placeholder="/healthz" />
                </Form.Item>
              )}
              {type !== 'exec' && (
                <Form.Item
                  name={[...base, 'port']}
                  noStyle
                  rules={[{ required: true, message: '' }]}
                >
                  <Input
                    style={{ width: 110 }}
                    placeholder={t('pages.k8s.form.port')}
                  />
                </Form.Item>
              )}
              {type === 'exec' && (
                <Form.Item
                  name={[...base, 'command']}
                  noStyle
                  rules={[{ required: true, message: '' }]}
                >
                  <ArgList t={t} width={260} />
                </Form.Item>
              )}
              <Form.Item name={[...base, 'initialDelaySeconds']} noStyle>
                <InputNumber
                  min={0}
                  max={86400}
                  style={{ width: 130 }}
                  placeholder={t('pages.k8s.form.probe.delay')}
                />
              </Form.Item>
              <Form.Item name={[...base, 'periodSeconds']} noStyle>
                <InputNumber
                  min={1}
                  max={86400}
                  style={{ width: 130 }}
                  placeholder={t('pages.k8s.form.probe.period')}
                />
              </Form.Item>
            </>
          );
        }}
      </Form.Item>
    </Flex>
  </Form.Item>
);

/**
 * 字符串数组输入（command / args / exec 探针命令）：一项一个输入框，原样保留空串与内嵌换行。
 * 不能用「每行一项」的文本框——`sh -c "多行脚本"` 会被拆成多个参数。
 */
const ArgList: React.FC<{
  t: T;
  value?: string[];
  onChange?: (v: string[]) => void;
  width?: number;
}> = ({ t, value, onChange, width }) => {
  const list = value ?? [];
  return (
    <Flex vertical gap={4} style={{ width: width ?? '100%' }}>
      {list.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 无稳定标识的纯字符串列表，按位置编辑
        <Flex key={i} gap={4} align="start">
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 8 }}
            value={item}
            onChange={(e) =>
              onChange?.(list.map((v, j) => (j === i ? e.target.value : v)))
            }
          />
          <Button
            type="text"
            icon={<MinusCircleOutlined />}
            onClick={() => onChange?.(list.filter((_, j) => j !== i))}
          />
        </Flex>
      ))}
      <Button
        type="dashed"
        size="small"
        icon={<PlusOutlined />}
        onClick={() => onChange?.([...list, ''])}
      >
        {t('pages.k8s.form.lines')}
      </Button>
    </Flex>
  );
};

interface Names {
  configMaps: string[];
  secrets: string[];
  pvcs: string[];
}

const ContainerFields: React.FC<{ index: number; t: T; names: Names }> = ({
  index,
  t,
  names,
}) => {
  const opts = (list: string[]) => list.map((value) => ({ value }));
  return (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name={[index, 'name']}
            label={t('pages.k8s.form.container.name')}
            rules={[
              {
                required: true,
                pattern: DNS_LABEL,
                message: t('pages.k8s.form.dnsLabel.rule'),
              },
            ]}
          >
            <Input maxLength={63} />
          </Form.Item>
        </Col>
        <Col span={11}>
          <Form.Item
            name={[index, 'image']}
            label={t('pages.k8s.column.image')}
            rules={[{ required: true, whitespace: true, max: 1024 }]}
          >
            <Input placeholder="registry.example.com/app:1.0.0" />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item
            name={[index, 'imagePullPolicy']}
            label={t('pages.k8s.form.pullPolicy')}
          >
            <Select
              allowClear
              options={['IfNotPresent', 'Always', 'Never'].map((value) => ({
                value,
              }))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        {(
          [
            ['cpuRequest', '100m'],
            ['memoryRequest', '128Mi'],
            ['cpuLimit', '500m'],
            ['memoryLimit', '256Mi'],
          ] as const
        ).map(([field, placeholder]) => (
          <Col span={6} key={field}>
            <Form.Item
              name={[index, field]}
              label={t(`pages.k8s.form.${field}`)}
              rules={[quantityRule(t)]}
            >
              <Input placeholder={placeholder} />
            </Form.Item>
          </Col>
        ))}
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name={[index, 'command']}
            label={t('pages.k8s.form.command')}
          >
            <ArgList t={t} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={[index, 'args']} label={t('pages.k8s.form.args')}>
            <ArgList t={t} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label={t('pages.k8s.form.ports')} style={{ marginBottom: 12 }}>
        <Form.List name={[index, 'ports']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Flex key={field.key} gap={8} align="baseline">
                  <Form.Item
                    name={[field.name, 'containerPort']}
                    style={{ marginBottom: 8 }}
                    rules={[{ required: true, message: '' }]}
                  >
                    <InputNumber
                      min={1}
                      max={65535}
                      style={{ width: 130 }}
                      placeholder={t('pages.k8s.form.port')}
                    />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'protocol']}
                    style={{ marginBottom: 8 }}
                  >
                    <Select
                      style={{ width: 90 }}
                      options={['TCP', 'UDP', 'SCTP'].map((value) => ({
                        value,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'name']}
                    style={{ marginBottom: 8 }}
                    rules={[
                      {
                        pattern: /^[a-z0-9]([-a-z0-9]{0,13}[a-z0-9])?$/,
                        message: t('pages.k8s.form.portName.rule'),
                      },
                    ]}
                  >
                    <Input
                      style={{ width: 160 }}
                      placeholder={t('pages.k8s.form.portName')}
                    />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Flex>
              ))}
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => add({ protocol: 'TCP' })}
              >
                {t('pages.k8s.form.add')}
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Form.Item label={t('pages.k8s.form.env')} style={{ marginBottom: 12 }}>
        <Form.List name={[index, 'env']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Flex key={field.key} gap={8} align="baseline">
                  <Form.Item
                    name={[field.name, 'name']}
                    style={{ width: 200, marginBottom: 8 }}
                    rules={[
                      {
                        required: true,
                        pattern: ENV_NAME,
                        message: t('pages.k8s.form.envName.rule'),
                      },
                    ]}
                  >
                    <Input placeholder={t('pages.k8s.form.envName')} />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'source']}
                    style={{ marginBottom: 8 }}
                  >
                    <Select
                      style={{ width: 130 }}
                      options={[
                        {
                          value: 'value',
                          label: t('pages.k8s.form.env.value'),
                        },
                        { value: 'configMap', label: 'ConfigMap' },
                        { value: 'secret', label: 'Secret' },
                        {
                          value: 'raw',
                          label: t('pages.k8s.form.env.raw'),
                          disabled: true,
                        },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item
                    noStyle
                    shouldUpdate={(a, b) =>
                      JSON.stringify(a.containers?.[index]?.env) !==
                      JSON.stringify(b.containers?.[index]?.env)
                    }
                  >
                    {({ getFieldValue }) => {
                      const source = getFieldValue([
                        'containers',
                        index,
                        'env',
                        field.name,
                        'source',
                      ]);
                      if (source === 'raw') {
                        return (
                          <span style={{ flex: 1, opacity: 0.6 }}>
                            {t('pages.k8s.form.env.rawHint')}
                          </span>
                        );
                      }
                      if (source === 'configMap' || source === 'secret') {
                        return (
                          <>
                            <Form.Item
                              name={[field.name, 'ref']}
                              style={{ flex: 1, marginBottom: 8 }}
                              rules={[{ required: true, message: '' }]}
                            >
                              <AutoComplete
                                options={opts(
                                  source === 'secret'
                                    ? names.secrets
                                    : names.configMaps,
                                )}
                                placeholder={t('pages.k8s.form.refName')}
                              />
                            </Form.Item>
                            <Form.Item
                              name={[field.name, 'refKey']}
                              style={{ flex: 1, marginBottom: 8 }}
                              rules={[{ required: true, message: '' }]}
                            >
                              <Input placeholder={t('pages.k8s.form.refKey')} />
                            </Form.Item>
                          </>
                        );
                      }
                      return (
                        <Form.Item
                          name={[field.name, 'value']}
                          style={{ flex: 1, marginBottom: 8 }}
                        >
                          <Input placeholder={t('pages.k8s.form.value')} />
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Flex>
              ))}
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => add({ name: '', source: 'value', value: '' })}
              >
                {t('pages.k8s.form.add')}
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Form.Item
        label={t('pages.k8s.form.mounts')}
        style={{ marginBottom: 12 }}
      >
        <Form.List name={[index, 'mounts']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Flex key={field.key} gap={8} align="baseline">
                  <Form.Item
                    noStyle
                    shouldUpdate={(a, b) =>
                      JSON.stringify(a.volumes) !== JSON.stringify(b.volumes)
                    }
                  >
                    {({ getFieldValue }) => (
                      <Form.Item
                        name={[field.name, 'name']}
                        style={{ width: 180, marginBottom: 8 }}
                        rules={[{ required: true, message: '' }]}
                      >
                        <Select
                          placeholder={t('pages.k8s.form.volume')}
                          options={(
                            (getFieldValue('volumes') ?? []) as {
                              name?: string;
                            }[]
                          )
                            .filter((v) => v?.name)
                            .map((v) => ({ value: v.name as string }))}
                        />
                      </Form.Item>
                    )}
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'mountPath']}
                    style={{ flex: 1, marginBottom: 8 }}
                    rules={[
                      {
                        required: true,
                        pattern: /^\/[^:]*$/,
                        message: t('pages.k8s.form.mountPath.rule'),
                      },
                    ]}
                  >
                    <Input placeholder={t('pages.k8s.form.mountPath')} />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'subPath']}
                    style={{ width: 150, marginBottom: 8 }}
                  >
                    <Input placeholder="subPath" />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'readOnly']}
                    valuePropName="checked"
                    style={{ marginBottom: 8 }}
                  >
                    <Checkbox>{t('pages.k8s.form.readOnly')}</Checkbox>
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Flex>
              ))}
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => add({ mountPath: '' })}
              >
                {t('pages.k8s.form.add')}
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Probe
        base={[index, 'liveness']}
        label={t('pages.k8s.form.liveness')}
        t={t}
      />
      <Probe
        base={[index, 'readiness']}
        label={t('pages.k8s.form.readiness')}
        t={t}
      />
    </>
  );
};

const STRATEGIES: Record<Exclude<WorkloadKind, 'CronJob'>, string[]> = {
  Deployment: ['RollingUpdate', 'Recreate'],
  StatefulSet: ['RollingUpdate', 'OnDelete'],
  DaemonSet: ['RollingUpdate', 'OnDelete'],
};

export const WorkloadFormModal: React.FC<{
  clusterId: string;
  kind: WorkloadKind;
  /** 创建时的命名空间（全部命名空间时为空，需在 YAML 里写明） */
  namespace?: string;
  /** 编辑的对象；不传 = 创建 */
  target?: ResourceRef;
  onClose: () => void;
  onDone?: () => void;
}> = ({ clusterId, kind, namespace, target: targetProp, onClose, onDone }) => {
  const t = useT();
  const { message } = App.useApp();
  const target = useRef(targetProp).current;
  const create = !target;
  const [form] = Form.useForm<WorkloadForm>();
  // 对象是唯一的事实源：表单与 YAML 都从它生成、写回它
  const obj = useRef<Record<string, unknown>>(newWorkload(kind, namespace));
  const [mode, setMode] = useState<'form' | 'yaml'>('form');
  const [yaml, setYaml] = useState('');
  const [loading, setLoading] = useState(!create);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [conflict, setConflict] = useState(false);
  const [resourceVersion, setResourceVersion] = useState('');
  const [preview, setPreview] = useState<{
    yaml: string;
    result: PreviewResult;
  }>();
  const [manifest, setManifest] = useState<string>();
  const [names, setNames] = useState<Names>({
    configMaps: [],
    secrets: [],
    pvcs: [],
  });
  const [tab, setTab] = useState('0');
  const ns = target?.namespace ?? namespace;

  const load = useCallback(async () => {
    if (!target) {
      form.setFieldsValue(emptyForm(kind));
      return;
    }
    setLoading(true);
    setError(undefined);
    setConflict(false);
    setPreview(undefined);
    try {
      const res = await getObject(clusterId, target, { silent: true });
      const parsed = parseObject(res.yaml);
      // 运行状态不属于期望配置：不带进编辑与提交
      delete parsed.status;
      obj.current = parsed;
      setResourceVersion(res.resourceVersion);
      form.resetFields();
      form.setFieldsValue(toForm(parsed, kind));
      setYaml(toYaml(parsed));
      setMode('form');
    } catch (err) {
      setError(getK8sErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clusterId, target, kind, form]);

  useEffect(() => {
    void load();
  }, [load]);

  // 引用对象的候选名：取不到（无权限等）就只能手输
  useEffect(() => {
    if (!ns) return;
    let cancelled = false;
    const fetchNames = (gvr: GVR) =>
      listResources(
        clusterId,
        { ...gvr, namespace: ns, pageSize: 200, sortBy: 'name' },
        { silent: true },
      )
        .then((res) => (res.rows ?? []).map((row) => row.name))
        .catch(() => [] as string[]);
    void Promise.all([
      fetchNames(GVRS.configMap),
      fetchNames(GVRS.secret),
      fetchNames(GVRS.pvc),
    ]).then(([configMaps, secrets, pvcs]) => {
      if (!cancelled) setNames({ configMaps, secrets, pvcs });
    });
    return () => {
      cancelled = true;
    };
  }, [clusterId, ns]);

  /** 表单 → 对象（校验失败抛出） */
  const commitForm = async () => {
    const values = await form.validateFields();
    const full = { ...form.getFieldsValue(true), ...values } as WorkloadForm;
    const dupNames = duplicates((full.containers ?? []).map((c) => c.name));
    if (dupNames.length > 0) {
      throw new Error(
        t('pages.k8s.form.duplicate', { names: dupNames.join(', ') }),
      );
    }
    const dupVolumes = duplicates((full.volumes ?? []).map((v) => v.name));
    if (dupVolumes.length > 0) {
      throw new Error(
        t('pages.k8s.form.duplicate', { names: dupVolumes.join(', ') }),
      );
    }
    if ((full.containers ?? []).length === 0) {
      throw new Error(t('pages.k8s.form.container.required'));
    }
    applyForm(obj.current, kind, full, create);
    return full;
  };

  /** YAML → 对象（解析失败或类型不符抛出） */
  const commitYaml = () => {
    const parsed = parseObject(yaml);
    if (kindOfObject(parsed) !== kind) {
      throw new Error(t('pages.k8s.form.kindMismatch', { kind }));
    }
    obj.current = parsed;
  };

  const explain = (err: unknown): string | undefined => {
    if (err && typeof err === 'object' && 'errorFields' in err)
      return undefined; // 表单已就地标红
    return err instanceof Error ? err.message : String(err);
  };

  const switchMode = async (next: 'form' | 'yaml') => {
    setError(undefined);
    try {
      if (next === 'yaml') {
        await commitForm();
        setYaml(toYaml(obj.current));
      } else {
        commitYaml();
        // resetFields 会清掉「同时创建 Service」的选择：先取出再还原
        const service = form.getFieldValue('service');
        form.resetFields();
        form.setFieldsValue({ ...toForm(obj.current, kind), service });
      }
      setMode(next);
    } catch (err) {
      const text = explain(err);
      if (text) setError(text);
    }
  };

  const submit = async () => {
    setError(undefined);
    setConflict(false);
    let values: WorkloadForm | undefined;
    try {
      if (mode === 'form') values = await commitForm();
      else commitYaml();
    } catch (err) {
      const text = explain(err);
      if (text) setError(text);
      return;
    }
    const text = toYaml(obj.current);
    if (create) {
      const service = (values ?? form.getFieldsValue(true)).service;
      const svc = service?.enabled
        ? serviceFor(obj.current, kind, service.type)
        : undefined;
      if (service?.enabled && !svc) {
        setError(t('pages.k8s.form.service.noPorts'));
        return;
      }
      setManifest(svc ? `${text}---\n${toYaml(svc)}` : text);
      return;
    }
    if (!target) return;
    setBusy(true);
    try {
      const result = await previewObject(
        clusterId,
        { ref: target, yaml: text, resourceVersion },
        { silent: true },
      );
      setPreview({ yaml: text, result });
    } catch (err) {
      setConflict(getErrorReason(err) === 'K8S_CONFLICT');
      setError(getK8sErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!preview || !target) return;
    setBusy(true);
    setError(undefined);
    try {
      await applyObject(
        clusterId,
        {
          ref: target,
          yaml: preview.yaml,
          resourceVersion: preview.result.resourceVersion,
        },
        { silent: true },
      );
      message.success(t('common.msg.updated'));
      onDone?.();
      onClose();
    } catch (err) {
      if (isChangeSubmitted(err)) {
        onClose();
        return;
      }
      setConflict(getErrorReason(err) === 'K8S_CONFLICT');
      setError(getK8sErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (manifest !== undefined) {
    return (
      <ManifestModal
        clusterId={clusterId}
        namespace={namespace}
        title={t('pages.k8s.form.create', { kind })}
        initialYaml={manifest}
        onClose={onClose}
        onDone={onDone}
      />
    );
  }

  const title = create
    ? t('pages.k8s.form.create', { kind })
    : t('pages.k8s.form.edit', { kind, name: target?.name ?? '' });

  const body = preview ? (
    preview.result.changed ? (
      <YamlDiff
        before={preview.result.beforeYaml}
        after={preview.result.afterYaml}
      />
    ) : (
      <Alert type="info" showIcon title={t('pages.k8s.change.noChange')} />
    )
  ) : (
    <>
      <div style={{ display: mode === 'form' ? undefined : 'none' }}>
        <Form
          form={form}
          layout="vertical"
          disabled={busy}
          onValuesChange={() => setError(undefined)}
        >
          <Collapse
            size="small"
            defaultActiveKey={['basic', 'containers']}
            items={[
              {
                key: 'basic',
                label: t('pages.k8s.form.section.basic'),
                forceRender: true,
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={10}>
                        <Form.Item
                          name="name"
                          label={t('pages.k8s.column.name')}
                          rules={[
                            {
                              required: true,
                              pattern: /^[a-z0-9]([-a-z0-9.]{0,251}[a-z0-9])?$/,
                              message: t('pages.k8s.form.name.rule'),
                            },
                          ]}
                        >
                          <Input disabled={!create} maxLength={253} />
                        </Form.Item>
                      </Col>
                      {(kind === 'Deployment' || kind === 'StatefulSet') && (
                        <Col span={4}>
                          <Form.Item
                            name="replicas"
                            label={t('pages.k8s.action.scale.replicas')}
                            rules={[{ required: true }]}
                          >
                            <InputNumber
                              min={0}
                              max={10000}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                      )}
                      {kind === 'CronJob' ? (
                        <>
                          <Col span={6}>
                            <Form.Item
                              name="schedule"
                              label={t('pages.k8s.form.schedule')}
                              rules={[{ required: true, whitespace: true }]}
                            >
                              <Input placeholder="*/5 * * * *" />
                            </Form.Item>
                          </Col>
                          <Col span={5}>
                            <Form.Item
                              name="concurrencyPolicy"
                              label={t('pages.k8s.form.concurrency')}
                            >
                              <Select
                                options={['Allow', 'Forbid', 'Replace'].map(
                                  (value) => ({
                                    value,
                                  }),
                                )}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={3}>
                            <Form.Item
                              name="suspend"
                              label={t('pages.k8s.action.suspend')}
                              valuePropName="checked"
                            >
                              <Switch />
                            </Form.Item>
                          </Col>
                        </>
                      ) : (
                        <>
                          <Col span={4}>
                            <Form.Item
                              name="strategy"
                              label={t('pages.k8s.form.strategy')}
                            >
                              <Select
                                options={STRATEGIES[kind].map((value) => ({
                                  value,
                                }))}
                              />
                            </Form.Item>
                          </Col>
                          <Form.Item
                            noStyle
                            shouldUpdate={(a, b) => a.strategy !== b.strategy}
                          >
                            {({ getFieldValue }) =>
                              getFieldValue('strategy') === 'RollingUpdate' && (
                                <>
                                  {kind !== 'StatefulSet' && (
                                    <Col span={3}>
                                      <Form.Item
                                        name="maxSurge"
                                        label="maxSurge"
                                        rules={[
                                          {
                                            pattern: INT_OR_PERCENT,
                                            message: t(
                                              'pages.k8s.form.intOrPercent.rule',
                                            ),
                                          },
                                        ]}
                                      >
                                        <Input placeholder="25%" />
                                      </Form.Item>
                                    </Col>
                                  )}
                                  <Col span={3}>
                                    <Form.Item
                                      name="maxUnavailable"
                                      label="maxUnavailable"
                                      rules={[
                                        {
                                          pattern: INT_OR_PERCENT,
                                          message: t(
                                            'pages.k8s.form.intOrPercent.rule',
                                          ),
                                        },
                                      ]}
                                    >
                                      <Input placeholder="25%" />
                                    </Form.Item>
                                  </Col>
                                </>
                              )
                            }
                          </Form.Item>
                        </>
                      )}
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label={t('pages.k8s.detail.labels')}>
                          <KVList name="labels" t={t} labelValue />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label={t('pages.k8s.detail.annotations')}>
                          <KVList name="annotations" t={t} />
                        </Form.Item>
                      </Col>
                    </Row>
                    {create && kind !== 'CronJob' && (
                      <Flex gap={12} align="center">
                        <Form.Item
                          name={['service', 'enabled']}
                          valuePropName="checked"
                          style={{ marginBottom: 0 }}
                        >
                          <Checkbox>{t('pages.k8s.form.service')}</Checkbox>
                        </Form.Item>
                        <Form.Item
                          name={['service', 'type']}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            style={{ width: 150 }}
                            options={[
                              'ClusterIP',
                              'NodePort',
                              'LoadBalancer',
                              ...(kind === 'StatefulSet' ? ['Headless'] : []),
                            ].map((value) => ({ value }))}
                          />
                        </Form.Item>
                      </Flex>
                    )}
                  </>
                ),
              },
              {
                key: 'containers',
                label: t('pages.k8s.form.section.containers'),
                forceRender: true,
                children: (
                  <Form.List name="containers">
                    {(fields, { add, remove }) => (
                      <Tabs
                        type="editable-card"
                        size="small"
                        activeKey={tab}
                        onChange={setTab}
                        onEdit={(key, action) => {
                          if (action === 'add') {
                            add(
                              emptyContainer(`container-${fields.length + 1}`),
                            );
                            setTab(String(fields.length));
                          } else {
                            remove(Number(key));
                            setTab('0');
                          }
                        }}
                        items={fields.map((field, i) => ({
                          key: String(i),
                          forceRender: true,
                          closable: fields.length > 1,
                          label: (
                            <Form.Item noStyle shouldUpdate>
                              {({ getFieldValue }) =>
                                getFieldValue([
                                  'containers',
                                  field.name,
                                  'name',
                                ]) || `#${i + 1}`
                              }
                            </Form.Item>
                          ),
                          children: (
                            <ContainerFields
                              index={field.name}
                              t={t}
                              names={names}
                            />
                          ),
                        }))}
                      />
                    )}
                  </Form.List>
                ),
              },
              {
                key: 'volumes',
                label: t('pages.k8s.form.section.volumes'),
                forceRender: true,
                children: (
                  <Form.List name="volumes">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map((field) => (
                          <Flex key={field.key} gap={8} align="baseline">
                            <Form.Item
                              name={[field.name, 'name']}
                              style={{ width: 220, marginBottom: 8 }}
                              rules={[
                                {
                                  required: true,
                                  pattern: DNS_LABEL,
                                  message: t('pages.k8s.form.dnsLabel.rule'),
                                },
                              ]}
                            >
                              <Input
                                placeholder={t('pages.k8s.form.volume.name')}
                              />
                            </Form.Item>
                            <Form.Item
                              name={[field.name, 'type']}
                              style={{ marginBottom: 8 }}
                            >
                              <Select
                                style={{ width: 150 }}
                                options={[
                                  { value: 'configMap', label: 'ConfigMap' },
                                  { value: 'secret', label: 'Secret' },
                                  { value: 'pvc', label: 'PVC' },
                                  { value: 'emptyDir', label: 'emptyDir' },
                                  {
                                    value: 'raw',
                                    label: t('pages.k8s.form.volume.raw'),
                                    disabled: true,
                                  },
                                ]}
                              />
                            </Form.Item>
                            <Form.Item
                              noStyle
                              shouldUpdate={(a, b) =>
                                JSON.stringify(a.volumes) !==
                                JSON.stringify(b.volumes)
                              }
                            >
                              {({ getFieldValue }) => {
                                const type = getFieldValue([
                                  'volumes',
                                  field.name,
                                  'type',
                                ]);
                                if (type === 'emptyDir')
                                  return <span style={{ flex: 1 }} />;
                                if (type === 'raw') {
                                  return (
                                    <span style={{ flex: 1, opacity: 0.6 }}>
                                      {t('pages.k8s.form.volume.rawHint')}
                                    </span>
                                  );
                                }
                                const list =
                                  type === 'secret'
                                    ? names.secrets
                                    : type === 'pvc'
                                      ? names.pvcs
                                      : names.configMaps;
                                return (
                                  <Form.Item
                                    name={[field.name, 'source']}
                                    style={{ flex: 1, marginBottom: 8 }}
                                    rules={[{ required: true, message: '' }]}
                                  >
                                    <AutoComplete
                                      options={list.map((value) => ({ value }))}
                                      placeholder={t('pages.k8s.form.refName')}
                                    />
                                  </Form.Item>
                                );
                              }}
                            </Form.Item>
                            <MinusCircleOutlined
                              onClick={() => remove(field.name)}
                            />
                          </Flex>
                        ))}
                        <Button
                          type="dashed"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => add({ name: '', type: 'configMap' })}
                        >
                          {t('pages.k8s.form.add')}
                        </Button>
                      </>
                    )}
                  </Form.List>
                ),
              },
            ]}
          />
        </Form>
      </div>
      {mode === 'yaml' && (
        <YamlEditor
          value={yaml}
          onChange={(next) => {
            setYaml(next);
            setError(undefined);
          }}
        />
      )}
    </>
  );

  return (
    <Modal
      open
      width={1080}
      title={title}
      destroyOnHidden
      mask={{ closable: false }}
      onCancel={onClose}
      footer={
        <Flex justify="space-between" align="center">
          {preview ? (
            <span />
          ) : (
            <Segmented<'form' | 'yaml'>
              value={mode}
              disabled={loading || busy}
              onChange={(next) => void switchMode(next)}
              options={[
                { value: 'form', label: t('pages.k8s.form.mode.form') },
                { value: 'yaml', label: 'YAML' },
              ]}
            />
          )}
          <Flex gap={8}>
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
                onClick={() => void submit()}
              >
                {t(create ? 'pages.k8s.form.next' : 'pages.k8s.change.preview')}
              </Button>
            )}
          </Flex>
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
        <div style={{ maxHeight: '68vh', overflow: 'auto' }}>{body}</div>
      </Spin>
    </Modal>
  );
};
