/**
 * 数据源表单抽屉（新建 / 编辑）：表单内可对尚未保存的配置「测试连接」。凭据只写不读——
 * 已保存过且认证方式未变时可留空沿用。
 */
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, App, Button, Col, Form } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import {
  isKept,
  type KeyValue,
  KeyValueEditor,
  recordToKv,
  validateKeyValues,
} from '@/components/KeyValueEditor';
import { FULL, HALF } from '@/constants/layout';
import {
  createDatasource,
  getDatasource,
  HEADER_VALUE_MASK,
  testDatasourceConfig,
  updateDatasource,
} from '@/services/monitor/datasource';
import { upstreamErrorText } from '@/services/monitor/errorText';
import {
  type NormalizedDatasourceSpec,
  normalizeDatasourceSpec,
} from '@/services/monitor/normalize';
import type {
  DatasourceConnection,
  DatasourceSpec,
  DatasourceTestResult,
  MonitorAuthType,
  MonitorDatasource,
} from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useOptions, useSubmitter, useT } from '@/utils/i18n';
import {
  AUTH_TYPE_META,
  AUTH_TYPE_ORDER,
  MONITOR_LIMITS,
} from '../components/meta';
import { useMonitorStyles } from '../components/styles';

const URL_REGEX = /^https?:\/\/[^\s]+$/;
/** HTTP 头名（token 字符集，与后端一致） */
const HEADER_NAME_REGEX = /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/;
/** 三种形态的查询地址示例（表单内提示） */
const URL_EXAMPLES: [labelId: string, url: string][] = [
  ['pages.monitor.datasource.url.example.vmSingle', 'http://vm:8428'],
  [
    'pages.monitor.datasource.url.example.vmCluster',
    'http://vmselect:8481/select/0/prometheus',
  ],
  ['pages.monitor.datasource.url.example.prometheus', 'http://prometheus:9090'],
];

interface DatasourceFormValues {
  name: string;
  url: string;
  authType: MonitorAuthType;
  username?: string;
  secret?: string;
  headers?: KeyValue[];
  timeoutMs: number;
  tlsSkipVerify?: boolean;
  remoteWriteUrl?: string;
  description?: string;
  isDefault?: boolean;
  enabled?: boolean;
}

/** 已保存的请求头 → 表单行：值是掩码（不回显），留空并记下键名 = 沿用该键已保存的值 */
const headersToRows = (headers: Record<string, string>): KeyValue[] =>
  recordToKv(headers).map((row) =>
    row.value === HEADER_VALUE_MASK
      ? { key: row.key, value: '', savedKey: row.key }
      : row,
  );

/**
 * 表单行 → 请求头：沿用的行（键名未改、值留空）把掩码原样传回，其余传填写的值。
 * 其余行的值非空且不是掩码字面量由表单校验保证（见 headerValueProblem）。
 */
const rowsToHeaders = (rows?: KeyValue[]): Record<string, string> =>
  Object.fromEntries(
    (rows ?? []).map((row) => [
      row.key.trim(),
      isKept(row) ? HEADER_VALUE_MASK : row.value,
    ]),
  );

/**
 * 不沿用已保存值的行（新增、改了键名、改了值）的值问题：留空会把请求头存成空值；等于掩码字面量
 * 会被后端当作「沿用」。返回对应的文案键，没有问题返回 undefined。
 */
const headerValueProblem = (rows?: KeyValue[]): string | undefined => {
  const values = (rows ?? [])
    .filter((row) => !isKept(row))
    .map((row) => (row.value ?? '').trim());
  if (values.some((value) => value === '')) {
    return 'pages.monitor.datasource.form.headers.valueRequired';
  }
  if (values.some((value) => value === HEADER_VALUE_MASK)) {
    return 'pages.monitor.datasource.form.headers.maskLiteral';
  }
  return undefined;
};

/** 地址的「协议 + 主机 + 端口」；不是合法地址时为 undefined */
const originOf = (url?: string): string | undefined => {
  try {
    const parsed = new URL((url ?? '').trim());
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }
};

/** 表单值 → 连接配置；凭据留空即不携带（编辑 / 测试时沿用已保存的） */
const buildConnection = (
  values: DatasourceFormValues,
): DatasourceConnection => ({
  url: values.url.trim(),
  authType: values.authType,
  username: values.authType === 2 ? (values.username?.trim() ?? '') : '',
  ...(values.authType !== 1 && values.secret ? { secret: values.secret } : {}),
  headers: rowsToHeaders(values.headers),
  timeoutMs: values.timeoutMs,
  tlsSkipVerify: values.tlsSkipVerify ?? false,
});

const buildSpec = (values: DatasourceFormValues): DatasourceSpec => ({
  name: values.name.trim(),
  connection: buildConnection(values),
  remoteWriteUrl: values.remoteWriteUrl?.trim() ?? '',
  description: values.description?.trim() ?? '',
  isDefault: values.isDefault ?? false,
  enabled: values.enabled ?? false,
});

/** 新建缺省值（只用于新建路径） */
const CREATE_VALUES: DatasourceFormValues = {
  name: '',
  url: '',
  authType: 1,
  timeoutMs: 10000,
  enabled: true,
};

/**
 * 已保存的内容 → 表单值（spec 已归一化：缺失的布尔即 false，不在这里补缺省）。认证方式、超时
 * 万一缺失就留空，由必填校验要求补填。
 */
const specToValues = (
  spec: NormalizedDatasourceSpec,
): Partial<DatasourceFormValues> => ({
  name: spec.name,
  url: spec.connection.url,
  authType: spec.connection.authType,
  username: spec.connection.username,
  headers: headersToRows(spec.connection.headers),
  timeoutMs: spec.connection.timeoutMs,
  tlsSkipVerify: spec.connection.tlsSkipVerify,
  remoteWriteUrl: spec.remoteWriteUrl,
  description: spec.description,
  isDefault: spec.isDefault,
  enabled: spec.enabled,
});

/** 新建 / 编辑数据源抽屉（row 为空即新建） */
export const DatasourceDrawer: React.FC<{
  row: MonitorDatasource | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ row, onClose, onSaved }) => {
  const t = useT();
  const { message } = App.useApp();
  const has = usePermissions();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { styles } = useMonitorStyles();
  const authOptions = useOptions(AUTH_TYPE_META, AUTH_TYPE_ORDER);
  const formRef = useRef<ProFormInstance<DatasourceFormValues> | undefined>(
    undefined,
  );
  // 编辑时以详情接口返回的为准（乐观锁版本号、是否已保存凭据）
  const [saved, setSaved] = useState<MonitorDatasource | null>(row);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<DatasourceTestResult | null>(
    null,
  );
  // 已保存的凭据 / 请求头值只能发往原来的地址：协议、主机或端口变了就须重新填写（后端同样拒绝）
  const savedOrigin = originOf(saved?.spec.connection.url);
  const addressChanged = (url?: string) =>
    !!row && originOf(url) !== savedOrigin;

  const runTest = async () => {
    const form = formRef.current;
    if (!form) return;
    // 只校验与连接有关的字段：名称等未填也能先测连接
    const valid = await form
      .validateFields([
        'url',
        'authType',
        'username',
        'secret',
        'headers',
        'timeoutMs',
      ])
      .then(
        () => true,
        () => false,
      );
    // 校验不通过：错误已显示在表单项上
    if (!valid) return;
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(
        await testDatasourceConfig({
          connection: buildConnection(form.getFieldsValue(true)),
          id: row?.id,
        }),
      );
    } catch {
      // 参数类错误已由请求层提示
    } finally {
      setTesting(false);
    }
  };

  return (
    <DrawerForm<DatasourceFormValues>
      title={
        row
          ? t('pages.monitor.datasource.edit.title', { name: row.spec.name })
          : t('pages.monitor.datasource.create.title')
      }
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      open
      formRef={formRef}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true }}
      request={async () => {
        if (!row) return CREATE_VALUES;
        const { datasource } = await getDatasource(row.id);
        setSaved(datasource);
        return specToValues(
          normalizeDatasourceSpec(datasource.spec),
        ) as DatasourceFormValues;
      }}
      submitter={{
        ...(row ? submitter.save : submitter.create),
        render: (_, dom) => [
          has('monitor.datasource.test') && (
            <Button key="test" loading={testing} onClick={() => void runTest()}>
              {t('pages.monitor.datasource.test')}
            </Button>
          ),
          ...dom,
        ],
      }}
      onFinish={async (values) => {
        const spec = buildSpec(values);
        if (row) {
          await updateDatasource(row.id, {
            spec,
            version: saved?.version ?? row.version,
          });
          message.success(t('common.msg.saved'));
        } else {
          await createDatasource(spec);
          message.success(t('common.msg.created'));
        }
        onSaved();
        return true;
      }}
    >
      <ProFormText
        name="name"
        label={t('pages.monitor.datasource.column.name')}
        colProps={HALF}
        rules={[
          rules.required(t('pages.monitor.datasource.column.name')),
          rules.max(MONITOR_LIMITS.datasourceNameMax),
        ]}
      />
      <ProFormDigit
        name="timeoutMs"
        label={t('pages.monitor.datasource.form.timeout')}
        colProps={HALF}
        min={MONITOR_LIMITS.timeoutMs.min}
        max={MONITOR_LIMITS.timeoutMs.max}
        fieldProps={{ precision: 0, step: 1000 }}
        rules={[rules.required(t('pages.monitor.datasource.form.timeout'))]}
      />
      <ProFormText
        name="url"
        label={t('pages.monitor.datasource.column.url')}
        colProps={FULL}
        placeholder="http://vm:8428"
        tooltip={URL_EXAMPLES.map(([labelId, url]) => (
          <div key={url}>
            {t(labelId)}
            <span className={styles.code}> {url}</span>
          </div>
        ))}
        extra={t('pages.monitor.datasource.url.hint')}
        rules={[
          rules.required(t('pages.monitor.datasource.column.url')),
          rules.max(MONITOR_LIMITS.urlMax),
          {
            pattern: URL_REGEX,
            message: t('pages.monitor.datasource.url.rule'),
          },
        ]}
      />
      <ProFormSelect
        name="authType"
        label={t('pages.monitor.datasource.column.authType')}
        colProps={HALF}
        options={authOptions}
        allowClear={false}
        rules={[rules.select(t('pages.monitor.datasource.column.authType'))]}
      />
      <ProFormDependency name={['authType', 'url']}>
        {({ authType, url }) => {
          const hasSaved =
            !!saved?.hasSecret && saved.spec.connection.authType === authType;
          // 凭据只写不读：已保存过、认证方式与地址都未变时可留空沿用
          const keep = hasSaved && !addressChanged(url);
          return (
            <>
              {authType === 2 && (
                <ProFormText
                  name="username"
                  label={t('pages.monitor.datasource.form.username')}
                  colProps={HALF}
                  rules={[
                    rules.required(t('pages.monitor.datasource.form.username')),
                    rules.max(MONITOR_LIMITS.usernameMax),
                  ]}
                />
              )}
              {authType !== 1 && (
                <ProFormText.Password
                  name="secret"
                  label={t(
                    authType === 2
                      ? 'pages.monitor.datasource.form.password'
                      : 'pages.monitor.datasource.form.token',
                  )}
                  colProps={HALF}
                  placeholder={
                    keep
                      ? t('pages.monitor.datasource.form.secret.kept')
                      : undefined
                  }
                  fieldProps={{ autoComplete: 'new-password' }}
                  rules={[
                    rules.max(MONITOR_LIMITS.secretMax),
                    {
                      required: !keep,
                      message: t(
                        hasSaved
                          ? 'pages.monitor.datasource.form.secret.addressChanged'
                          : 'pages.monitor.datasource.form.secret.required',
                      ),
                    },
                  ]}
                />
              )}
            </>
          );
        }}
      </ProFormDependency>
      <Col span={24}>
        <Form.Item
          name="headers"
          label={t('pages.monitor.datasource.form.headers')}
          tooltip={t('pages.monitor.datasource.form.headers.tooltip')}
          dependencies={['url']}
          rules={[
            {
              validator: (_: unknown, value?: KeyValue[]) =>
                validateKeyValues(value, {
                  keyPattern: HEADER_NAME_REGEX,
                  keyMax: MONITOR_LIMITS.headerKeyMax,
                  valueMax: MONITOR_LIMITS.headerValueMax,
                  caseInsensitiveKeys: true,
                })
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(
                        t('pages.monitor.datasource.form.headers.rule'),
                      ),
                    ),
            },
            {
              validator: (_: unknown, value?: KeyValue[]) => {
                const problem = headerValueProblem(value);
                return problem
                  ? Promise.reject(new Error(t(problem)))
                  : Promise.resolve();
              },
            },
            ({ getFieldValue }) => ({
              validator: (_: unknown, value?: KeyValue[]) =>
                addressChanged(getFieldValue('url')) &&
                (value ?? []).some(isKept)
                  ? Promise.reject(
                      new Error(
                        t(
                          'pages.monitor.datasource.form.headers.addressChanged',
                        ),
                      ),
                    )
                  : Promise.resolve(),
            }),
          ]}
        >
          <KeyValueEditor
            max={MONITOR_LIMITS.headerMax}
            keyPlaceholder={t('pages.monitor.datasource.form.headers.key')}
            valuePlaceholder={t('pages.monitor.datasource.form.headers.value')}
            keptPlaceholder={t('pages.monitor.datasource.form.headers.kept')}
            addText={t('pages.monitor.datasource.form.headers.add')}
          />
        </Form.Item>
      </Col>
      <ProFormText
        name="remoteWriteUrl"
        label={t('pages.monitor.datasource.form.remoteWriteUrl')}
        colProps={FULL}
        tooltip={t('pages.monitor.datasource.form.remoteWriteUrl.tooltip')}
        rules={[
          rules.max(MONITOR_LIMITS.urlMax),
          {
            pattern: URL_REGEX,
            message: t('pages.monitor.datasource.url.rule'),
          },
        ]}
      />
      <ProFormTextArea
        name="description"
        label={t('pages.monitor.common.description')}
        colProps={FULL}
        fieldProps={{
          rows: 2,
          maxLength: MONITOR_LIMITS.datasourceDescMax,
          showCount: true,
        }}
      />
      <ProFormSwitch
        name="tlsSkipVerify"
        label={t('pages.monitor.datasource.form.tlsSkipVerify')}
        tooltip={t('pages.monitor.datasource.form.tlsSkipVerify.tooltip')}
        colProps={{ span: 8 }}
      />
      <ProFormSwitch
        name="isDefault"
        label={t('pages.monitor.datasource.form.isDefault')}
        tooltip={t('pages.monitor.datasource.form.isDefault.tooltip')}
        colProps={{ span: 8 }}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        tooltip={t('pages.monitor.datasource.form.enabled.tooltip')}
        colProps={{ span: 8 }}
      />
      {testResult && (
        <Col span={24}>
          <Alert
            type={testResult.ok ? 'success' : 'error'}
            showIcon
            title={
              testResult.ok
                ? t('pages.monitor.datasource.test.ok', {
                    ms: testResult.latencyMs ?? 0,
                  })
                : t('pages.monitor.datasource.test.failed', {
                    ms: testResult.latencyMs ?? 0,
                  })
            }
            description={
              testResult.ok ? undefined : upstreamErrorText(testResult.error)
            }
          />
        </Col>
      )}
    </DrawerForm>
  );
};

export default DatasourceDrawer;
