/**
 * 接入 / 编辑集群抽屉。两种接入方式：
 * - Agent 反向隧道：只登记基本信息，保存后生成安装命令，Agent 连回来即在线；平台不保存凭据。
 * - 直连：API Server 地址 + CA + 凭据（令牌或客户端证书）；可粘贴 kubeconfig 自动填入，保存前可测试连接。
 * 名称与接入方式创建后不可改；直连凭据只写不读，编辑时留空即沿用已保存的。
 */
import {
  DrawerForm,
  ProFormDependency,
  ProFormRadio,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  App,
  AutoComplete,
  Button,
  Col,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Tag,
} from 'antd';
import type React from 'react';
import { useState } from 'react';
import SectionTitle from '@/components/SectionTitle';
import { FULL, HALF } from '@/constants/layout';
import {
  createCluster,
  parseKubeconfig,
  testCluster,
  updateCluster,
} from '@/services/k8s/cluster';
import type {
  AccessMode,
  AgentLocation,
  Cluster,
  ClusterCredential,
  ClusterSpec,
  TestClusterResult,
} from '@/services/k8s/typings';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';
import { ApprovalTemplateField } from '../change/requests';
import { NAME_REGEX } from '../components/meta';
import { ClusterInsightFields } from './InsightFields';

interface FormValues {
  name: string;
  displayName?: string;
  env?: string;
  accessMode: AccessMode;
  agentLocation?: AgentLocation;
  apiServer?: string;
  proxyUrl?: string;
  caCert?: string;
  authType?: 'token' | 'cert';
  token?: string;
  clientCert?: string;
  clientKey?: string;
  execDisabled?: boolean;
  description?: string;
  enabled?: boolean;
  datasourceId?: string;
  eventReasons?: string[];
  approvalTemplateId?: string;
}

const ENV_REGEX = /^[a-z0-9_-]{0,32}$/;

const credentialOf = (values: FormValues): ClusterCredential | undefined => {
  if (values.authType === 'cert') {
    return values.clientCert?.trim() || values.clientKey?.trim()
      ? {
          clientCert: values.clientCert?.trim(),
          clientKey: values.clientKey?.trim(),
        }
      : undefined;
  }
  return values.token?.trim() ? { token: values.token.trim() } : undefined;
};

/** 粘贴 kubeconfig：解析后回填表单；多个 context 时可选择 */
const KubeconfigModal: React.FC<{
  onClose: () => void;
  onParsed: (values: Partial<FormValues>) => void;
}> = ({ onClose, onParsed }) => {
  const t = useT();
  const [text, setText] = useState('');
  const [contexts, setContexts] = useState<string[]>([]);
  const [context, setContext] = useState<string>();
  const [loading, setLoading] = useState(false);

  const parse = async () => {
    setLoading(true);
    try {
      const res = await parseKubeconfig({ kubeconfig: text, context });
      const list = res.contexts ?? [];
      // 有多个 context 且尚未选择：先让用户确认用哪个
      if (list.length > 1 && !context) {
        setContexts(list);
        setContext(res.context);
        return;
      }
      const credential = res.credential ?? {};
      onParsed({
        apiServer: res.apiServer,
        caCert: res.caCert,
        proxyUrl: res.proxyUrl,
        authType:
          credential.clientCert || credential.clientKey ? 'cert' : 'token',
        token: credential.token,
        clientCert: credential.clientCert,
        clientKey: credential.clientKey,
      });
      onClose();
    } catch {
      // 已由请求层提示（无法解析、依赖外部命令取凭据等）
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      width={720}
      title={t('pages.k8s.cluster.kubeconfig.title')}
      destroyOnHidden
      mask={{ closable: false }}
      confirmLoading={loading}
      okButtonProps={{ disabled: !text.trim() }}
      okText={t('pages.k8s.cluster.kubeconfig.parse')}
      onOk={parse}
      onCancel={onClose}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        title={t('pages.k8s.cluster.kubeconfig.hint')}
      />
      <Input.TextArea
        rows={14}
        value={text}
        maxLength={262144}
        placeholder="apiVersion: v1&#10;kind: Config&#10;..."
        style={{ fontFamily: 'monospace' }}
        onChange={(event) => {
          setText(event.target.value);
          setContexts([]);
          setContext(undefined);
        }}
      />
      {contexts.length > 1 && (
        <Flex align="center" gap={8} style={{ marginTop: 12 }}>
          <span>{t('pages.k8s.cluster.kubeconfig.context')}</span>
          <Select
            style={{ flex: 1 }}
            value={context}
            onChange={setContext}
            options={contexts.map((value) => ({ value, label: value }))}
          />
        </Flex>
      )}
    </Modal>
  );
};

/** 测试连接的结果：版本、耗时、错误原文与接入自检明细 */
export const TestResult: React.FC<{ result: TestClusterResult }> = ({
  result,
}) => {
  const t = useT();
  return (
    <Alert
      type={result.ok ? 'success' : 'error'}
      showIcon
      style={{ marginBottom: 16 }}
      title={
        result.ok
          ? t('pages.k8s.cluster.test.ok', {
              version: result.version ?? '',
              ms: result.durationMs ?? 0,
            })
          : t('pages.k8s.cluster.test.failed')
      }
      description={
        (result.error || (result.checks?.length ?? 0) > 0) && (
          <div>
            {result.error && <div>{result.error}</div>}
            {(result.checks ?? []).map((check) => (
              <div key={check.name}>
                <Tag color={check.ok ? 'success' : 'error'}>
                  {t(
                    check.ok
                      ? 'pages.k8s.cluster.test.pass'
                      : 'pages.k8s.cluster.test.fail',
                  )}
                </Tag>
                {check.name}
                {check.message ? `：${check.message}` : ''}
              </div>
            ))}
          </div>
        )
      }
    />
  );
};

export const ClusterDrawer: React.FC<{
  row: Cluster | null;
  envOptions: string[];
  onClose: () => void;
  /** 保存成功；新接入的 Agent 集群随后弹出安装命令 */
  onSaved: (cluster: Cluster, created: boolean) => void;
}> = ({ row, envOptions, onClose, onSaved }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const [form] = Form.useForm<FormValues>();
  const [pasting, setPasting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestClusterResult>();

  const test = async () => {
    const values = form.getFieldsValue();
    if (!values.apiServer?.trim()) {
      message.warning(t('pages.k8s.cluster.test.needServer'));
      return;
    }
    setTesting(true);
    setTestResult(undefined);
    try {
      setTestResult(
        await testCluster({
          id: row?.id,
          apiServer: values.apiServer.trim(),
          proxyUrl: values.proxyUrl?.trim() || undefined,
          caCert: values.caCert?.trim() || undefined,
          credential: credentialOf(values),
        }),
      );
    } catch {
      // 已由请求层提示
    } finally {
      setTesting(false);
    }
  };

  return (
    <DrawerForm<FormValues>
      form={form}
      title={
        row
          ? t('pages.k8s.cluster.edit.title', { name: row.spec.name })
          : t('pages.k8s.cluster.create.title')
      }
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true }}
      initialValues={
        row
          ? {
              ...row.spec,
              agentLocation: row.spec.agentLocation || 1,
              enabled: row.spec.enabled ?? false,
              execDisabled: row.spec.execDisabled ?? false,
              datasourceId: row.spec.datasourceId || undefined,
              eventReasons: row.spec.eventReasons ?? [],
              approvalTemplateId: row.spec.approvalTemplateId || undefined,
              authType: 'token',
            }
          : {
              // 默认直连；Agent 反向隧道由用户主动选择
              accessMode: 2,
              agentLocation: 1,
              enabled: true,
              authType: 'token',
            }
      }
      submitter={row ? submitter.save : submitter.create}
      onFinish={async (values) => {
        const direct = values.accessMode === 2;
        const spec: ClusterSpec = {
          name: values.name.trim(),
          displayName: values.displayName?.trim() ?? '',
          env: values.env?.trim() ?? '',
          accessMode: values.accessMode,
          agentLocation: direct ? 0 : (values.agentLocation ?? 1),
          apiServer: direct ? (values.apiServer?.trim() ?? '') : '',
          proxyUrl: direct ? (values.proxyUrl?.trim() ?? '') : '',
          caCert: direct ? (values.caCert?.trim() ?? '') : '',
          execDisabled: values.execDisabled ?? false,
          description: values.description?.trim() ?? '',
          enabled: values.enabled ?? false,
          datasourceId: values.datasourceId ?? '',
          eventReasons: values.eventReasons ?? [],
          approvalTemplateId: values.approvalTemplateId ?? '',
        };
        const credential = direct ? credentialOf(values) : undefined;
        if (row) {
          const { cluster } = await updateCluster(row.id, {
            spec,
            credential,
            version: row.version,
          });
          message.success(t('common.msg.saved'));
          onSaved(cluster, false);
        } else {
          const { cluster } = await createCluster({ spec, credential });
          message.success(t('common.msg.created'));
          onSaved(cluster, true);
        }
        return true;
      }}
    >
      <ProFormText
        name="name"
        label={t('pages.k8s.cluster.name')}
        tooltip={t('pages.k8s.cluster.name.tooltip')}
        colProps={HALF}
        disabled={!!row}
        rules={[
          rules.required(t('pages.k8s.cluster.name')),
          { pattern: NAME_REGEX, message: t('pages.k8s.cluster.name.rule') },
        ]}
      />
      <ProFormText
        name="displayName"
        label={t('pages.k8s.cluster.displayName')}
        colProps={HALF}
        rules={[rules.max(64)]}
      />
      <Col span={12}>
        <Form.Item
          name="env"
          label={t('pages.k8s.cluster.env')}
          tooltip={t('pages.k8s.cluster.env.tooltip')}
          rules={[
            { pattern: ENV_REGEX, message: t('pages.k8s.cluster.env.rule') },
          ]}
        >
          {/* 可从已有环境里选，也可直接输入新的 */}
          <AutoComplete
            allowClear
            options={[
              ...new Set(['prod', 'staging', 'test', 'dev', ...envOptions]),
            ].map((value) => ({ value }))}
          />
        </Form.Item>
      </Col>
      <ProFormRadio.Group
        name="accessMode"
        label={t('pages.k8s.cluster.accessMode')}
        colProps={HALF}
        disabled={!!row}
        options={[
          { value: 1, label: t('pages.k8s.cluster.accessMode.1') },
          { value: 2, label: t('pages.k8s.cluster.accessMode.2') },
        ]}
      />
      <ProFormDependency name={['accessMode', 'authType']}>
        {({ accessMode, authType }) =>
          accessMode === 1 ? (
            <>
              <ProFormRadio.Group
                name="agentLocation"
                label={t('pages.k8s.cluster.agentLocation')}
                colProps={FULL}
                options={[
                  { value: 1, label: t('pages.k8s.cluster.agentLocation.1') },
                  { value: 2, label: t('pages.k8s.cluster.agentLocation.2') },
                ]}
              />
              <Col span={24}>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  title={t('pages.k8s.cluster.agent.hint')}
                />
              </Col>
            </>
          ) : (
            <>
              <Col span={24}>
                <Flex justify="space-between" align="center">
                  <SectionTitle>{t('pages.k8s.cluster.direct')}</SectionTitle>
                  <Flex gap={8}>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => setPasting(true)}
                    >
                      {t('pages.k8s.cluster.kubeconfig.paste')}
                    </Button>
                    <Button
                      size="small"
                      type="link"
                      loading={testing}
                      onClick={test}
                    >
                      {t('pages.k8s.cluster.test')}
                    </Button>
                  </Flex>
                </Flex>
                {testResult && <TestResult result={testResult} />}
              </Col>
              <ProFormText
                name="apiServer"
                label={t('pages.k8s.cluster.apiServer')}
                colProps={HALF}
                placeholder="https://10.0.0.1:6443"
                rules={[
                  rules.required(t('pages.k8s.cluster.apiServer')),
                  rules.max(512),
                  {
                    pattern: /^https:\/\/\S+$/,
                    message: t('pages.k8s.cluster.apiServer.rule'),
                  },
                ]}
              />
              <ProFormText
                name="proxyUrl"
                label={t('pages.k8s.cluster.proxyUrl')}
                tooltip={t('pages.k8s.cluster.proxyUrl.tooltip')}
                colProps={HALF}
                rules={[rules.max(512)]}
              />
              <ProFormTextArea
                name="caCert"
                label={t('pages.k8s.cluster.caCert')}
                colProps={FULL}
                placeholder={t('pages.k8s.cluster.caCert.placeholder')}
                fieldProps={{ rows: 3, style: { fontFamily: 'monospace' } }}
              />
              <ProFormRadio.Group
                name="authType"
                label={t('pages.k8s.cluster.authType')}
                colProps={FULL}
                extra={
                  row?.hasCredential
                    ? t('pages.k8s.cluster.credential.keep')
                    : t('pages.k8s.cluster.credential.hint')
                }
                options={[
                  {
                    value: 'token',
                    label: t('pages.k8s.cluster.authType.token'),
                  },
                  {
                    value: 'cert',
                    label: t('pages.k8s.cluster.authType.cert'),
                  },
                ]}
              />
              {authType === 'cert' ? (
                <>
                  <ProFormTextArea
                    name="clientCert"
                    label={t('pages.k8s.cluster.clientCert')}
                    colProps={FULL}
                    fieldProps={{ rows: 3, style: { fontFamily: 'monospace' } }}
                    rules={
                      row?.hasCredential
                        ? []
                        : [rules.required(t('pages.k8s.cluster.clientCert'))]
                    }
                  />
                  <ProFormTextArea
                    name="clientKey"
                    label={t('pages.k8s.cluster.clientKey')}
                    colProps={FULL}
                    fieldProps={{ rows: 3, style: { fontFamily: 'monospace' } }}
                    rules={
                      row?.hasCredential
                        ? []
                        : [rules.required(t('pages.k8s.cluster.clientKey'))]
                    }
                  />
                </>
              ) : (
                <ProFormTextArea
                  name="token"
                  label={t('pages.k8s.cluster.token')}
                  colProps={FULL}
                  fieldProps={{ rows: 3, style: { fontFamily: 'monospace' } }}
                  rules={
                    row?.hasCredential
                      ? []
                      : [rules.required(t('pages.k8s.cluster.token'))]
                  }
                />
              )}
            </>
          )
        }
      </ProFormDependency>
      <ProFormTextArea
        name="description"
        label={t('pages.k8s.cluster.description')}
        colProps={FULL}
        fieldProps={{ rows: 2, maxLength: 255, showCount: true }}
      />
      <ClusterInsightFields />
      <ApprovalTemplateField />
      <ProFormSwitch
        name="execDisabled"
        label={t('pages.k8s.cluster.execDisabled')}
        tooltip={t('pages.k8s.cluster.execDisabled.tooltip')}
        colProps={HALF}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        tooltip={t('pages.k8s.cluster.enabled.tooltip')}
        colProps={HALF}
      />
      {pasting && (
        <KubeconfigModal
          onClose={() => setPasting(false)}
          onParsed={(values) => {
            form.setFieldsValue(values);
            setTestResult(undefined);
          }}
        />
      )}
    </DrawerForm>
  );
};
