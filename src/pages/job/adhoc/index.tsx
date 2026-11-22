/**
 * 快速执行：不经作业模板，直接在选中的主机上执行一条命令、一段脚本或分发一个文件。
 * 提交前必经「检查」——解析目标主机、匹配高危命令规则、判定是否需要审批；命中「拦截」规则、
 * 主机有问题或需要审批而审批流程不可用时不能提交。提交前再弹窗确认一次。
 */
import {
  PageContainer,
  ProForm,
  ProFormDependency,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Collapse,
  Flex,
  Form,
  Row,
  Segmented,
  Skeleton,
} from 'antd';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { FULL, HALF } from '@/constants/layout';
import {
  checkJobAdhoc,
  getJobExecution,
  type JobAdhocBody,
  submitJobAdhoc,
} from '@/services/job/execution';
import { getJobErrorMessage } from '@/services/job/request';
import { getJobScript } from '@/services/job/script';
import type {
  JobAdhoc,
  JobAdhocCheck,
  JobAdhocKind,
  JobInterpreter,
  JobScript,
} from '@/services/job/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useOptions, useT } from '@/utils/i18n';
import { randomUUID } from '@/utils/uuid';
import { byteLength } from '../components/format';
import { HostTable, summarizeHosts } from '../components/HostTable';
import { useCredentialSelectOptions } from '../components/hooks';
import { DurationInput, ZoneInput } from '../components/inputs';
import {
  ADHOC_KIND_ORDER,
  DEST_DIR_REGEX,
  FILE_MODE_REGEX,
  FILE_NAME_REGEX,
  INTERPRETER_OPTIONS,
  JOB_LIMITS,
  KIND_META,
  ZONE_REGEX,
} from '../components/meta';
import { RiskHits } from '../components/RiskHits';
import { useJobStyles } from '../components/styles';
import {
  buildTarget,
  resetTargetOnModelChange,
  TARGET_INITIAL,
  TargetFields,
  type TargetFormValues,
  targetToValues,
} from '../components/TargetFields';
import { FileField, type UploadedFile } from './FileField';
import { ScriptPicker } from './ScriptPicker';

type ScriptSource = 'inline' | 'library';

interface AdhocFormValues extends TargetFormValues {
  kind: JobAdhocKind;
  credentialId?: string;
  command?: string;
  scriptSource: ScriptSource;
  scriptId?: string;
  interpreter: JobInterpreter;
  script?: string;
  scriptArgs?: string;
  file?: UploadedFile;
  fileName?: string;
  dest?: string;
  /** 文件权限（与目标主机的选择方式 mode 区分） */
  fileMode?: string;
  forks: number;
  timeoutS: number;
  port: number;
  become?: boolean;
  batchSize?: number;
  maxFailPercent?: number;
  runnerZone?: string;
}

const DEFAULTS: AdhocFormValues = {
  ...TARGET_INITIAL,
  kind: 2,
  scriptSource: 'inline',
  interpreter: 'bash',
  fileMode: '0644',
  forks: JOB_LIMITS.forks.default,
  timeoutS: JOB_LIMITS.timeoutS.default,
  port: JOB_LIMITS.port.default,
  become: false,
  batchSize: 0,
  maxFailPercent: 0,
};

/** 确认弹窗里预览的行数 */
const PREVIEW_LINES = 5;

const buildAdhoc = (values: AdhocFormValues): JobAdhoc => {
  switch (values.kind) {
    case 2:
      return { command: values.command ?? '' };
    case 3:
      return values.scriptSource === 'library'
        ? {
            scriptId: values.scriptId ?? '',
            scriptArgs: values.scriptArgs?.trim() ?? '',
          }
        : {
            script: values.script ?? '',
            interpreter: values.interpreter,
            scriptArgs: values.scriptArgs?.trim() ?? '',
          };
    default:
      return {
        // 检查时可不带文件
        fileId: values.file?.id ?? '',
        fileName: values.fileName?.trim() ?? '',
        dest: values.dest?.trim() ?? '',
        mode: values.fileMode?.trim() || '0644',
      };
  }
};

const buildBody = (
  values: AdhocFormValues,
): Omit<JobAdhocBody, 'requestId'> => ({
  kind: values.kind,
  adhoc: buildAdhoc(values),
  target: buildTarget(values),
  credentialId: values.credentialId ?? '',
  options: {
    forks: values.forks,
    timeoutS: values.timeoutS,
    port: values.port,
    become: values.become ?? false,
    batchSize: values.batchSize ?? 0,
    maxFailPercent: values.batchSize ? (values.maxFailPercent ?? 0) : 0,
  },
  runnerZone: values.runnerZone?.trim() ?? '',
});

/** 字节数上限校验（后端按 UTF-8 字节限长） */
const maxBytes = (max: number, message: string) => ({
  validator: (_: unknown, value?: string) =>
    byteLength(value) <= max
      ? Promise.resolve()
      : Promise.reject(new Error(message)),
});

/** 检查结果能否提交 */
const isSubmittable = (check: JobAdhocCheck): boolean => {
  const summary = summarizeHosts(check.hosts ?? []);
  const maxHosts = check.maxHosts || JOB_LIMITS.targetCiMax;
  return !(
    check.blocked ||
    check.truncated ||
    summary.total > maxHosts ||
    summary.problems > 0 ||
    summary.runnable === 0 ||
    ((check.approvalReasons?.length ?? 0) > 0 && !check.approvalReady)
  );
};

/** 检查结果：主机数与清单、高危命令规则命中、审批提示 */
const CheckResult: React.FC<{ check: JobAdhocCheck }> = ({ check }) => {
  const t = useT();
  const { styles } = useJobStyles();
  const hosts = check.hosts ?? [];
  const summary = summarizeHosts(hosts);
  const maxHosts = check.maxHosts || JOB_LIMITS.targetCiMax;
  const reasons = check.approvalReasons ?? [];
  const hits = check.riskHits ?? [];
  return (
    <div>
      <div className={styles.hostCount}>
        {t('pages.job.run.hostCount', { n: summary.runnable })}
      </div>
      {(check.truncated || summary.total > maxHosts) && (
        <Alert
          type="error"
          showIcon
          title={t('pages.job.hosts.truncated', { max: maxHosts })}
          style={{ marginTop: 8 }}
        />
      )}
      {summary.problems > 0 && (
        <Alert
          type="error"
          showIcon
          title={t('pages.job.run.problems', { n: summary.problems })}
          style={{ marginTop: 8 }}
        />
      )}
      {summary.total === 0 && (
        <Alert
          type="error"
          showIcon
          title={t('pages.job.run.noHosts')}
          style={{ marginTop: 8 }}
        />
      )}
      {summary.total > 0 && (
        <Collapse
          ghost
          size="small"
          style={{ marginTop: 4 }}
          // 有不能执行的主机时直接展开，便于定位
          defaultActiveKey={summary.problems > 0 ? ['hosts'] : []}
          items={[
            {
              key: 'hosts',
              label: t('pages.job.run.hostList', { n: summary.total }),
              children: <HostTable hosts={hosts} pageSize={8} />,
            },
          ]}
        />
      )}
      {hits.length > 0 && (
        <Alert
          type={check.blocked ? 'error' : 'warning'}
          showIcon
          title={t(
            check.blocked
              ? 'pages.job.adhoc.check.blocked'
              : 'pages.job.adhoc.check.riskHits',
          )}
          description={<RiskHits hits={hits} />}
          style={{ marginTop: 8 }}
        />
      )}
      {reasons.length > 0 &&
        (check.approvalReady ? (
          <Alert
            type="info"
            showIcon
            title={t('pages.job.approval.notice', {
              reasons: reasons.join(t('pages.job.common.separator')),
            })}
            style={{ marginTop: 8 }}
          />
        ) : (
          <Alert
            type="error"
            showIcon
            title={t('pages.job.approval.unavailable')}
            description={reasons.join(t('pages.job.common.separator'))}
            style={{ marginTop: 8 }}
          />
        ))}
      {isSubmittable(check) && hits.length === 0 && reasons.length === 0 && (
        <Alert
          type="success"
          showIcon
          title={t('pages.job.adhoc.check.ok')}
          style={{ marginTop: 8 }}
        />
      )}
    </div>
  );
};

const AdhocPage: React.FC = () => {
  const t = useT();
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const rules = useFormRules();
  const { styles } = useJobStyles();
  const [form] = Form.useForm<AdhocFormValues>();
  const [searchParams] = useSearchParams();
  const rerunId = searchParams.get('rerun') ?? undefined;
  const presetScriptId = searchParams.get('scriptId') ?? undefined;
  const { credentials, options: credentialOptions } =
    useCredentialSelectOptions();
  const kindOptions = useOptions(KIND_META, ADHOC_KIND_ORDER);

  // 表单初值：带了 ?rerun= 时等执行详情加载完再挂载表单
  const [initial, setInitial] = useState<AdhocFormValues | undefined>(() =>
    rerunId
      ? undefined
      : presetScriptId
        ? {
            ...DEFAULTS,
            kind: 3,
            scriptSource: 'library',
            scriptId: presetScriptId,
          }
        : DEFAULTS,
  );
  // 「再次执行」带入的提示（分发文件须重新上传 / 加载失败）
  const [rerunNotice, setRerunNotice] = useState<{
    type: 'info' | 'warning';
    text: string;
  }>();
  const [check, setCheck] = useState<JobAdhocCheck>();
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // 幂等键：同一份内容的重复提交（连点、网络重试）复用；内容一改或提交成功即换新，
  // 以免改过的内容被当成上一次提交的重试而拿回旧的执行
  const requestId = useRef(randomUUID());
  // 脚本库里选中的脚本（确认弹窗里预览内容用）
  const libraryScript = useRef<JobScript | undefined>(undefined);
  // 检查请求的序号：返回时表单已改过（序号已变）的结果丢弃
  const checkSeq = useRef(0);
  // 提交流程在途（同步判定，挡住连点打开两个确认框）
  const submitGuard = useRef(false);

  useEffect(() => {
    if (!rerunId) return;
    let cancelled = false;
    getJobExecution(rerunId)
      .then(({ execution }) => {
        if (cancelled) return;
        const { detail } = execution;
        const adhoc = detail?.adhoc;
        const kind = execution.kind;
        if (kind !== 2 && kind !== 3 && kind !== 4) {
          setRerunNotice({
            type: 'warning',
            text: t('pages.job.adhoc.rerun.notAdhoc'),
          });
          setInitial(DEFAULTS);
          return;
        }
        setInitial({
          ...DEFAULTS,
          ...targetToValues(detail?.target),
          kind,
          credentialId: detail?.credentialId || undefined,
          command: adhoc?.command,
          // 脚本按上次固化的内容回填（与上次完全一致），不随脚本库的后续修改变化
          scriptSource: 'inline',
          interpreter: adhoc?.interpreter || 'bash',
          script: adhoc?.script,
          scriptArgs: adhoc?.scriptArgs,
          fileName: adhoc?.fileName,
          dest: adhoc?.dest,
          fileMode: adhoc?.mode || '0644',
          forks: detail?.options?.forks || JOB_LIMITS.forks.default,
          timeoutS: detail?.options?.timeoutS || JOB_LIMITS.timeoutS.default,
          port: detail?.options?.port || JOB_LIMITS.port.default,
          become: detail?.options?.become ?? false,
          batchSize: detail?.options?.batchSize ?? 0,
          maxFailPercent: detail?.options?.maxFailPercent ?? 0,
          runnerZone: detail?.runnerZone,
        });
        setRerunNotice({
          type: 'info',
          text: t(
            kind === 4
              ? 'pages.job.adhoc.rerun.file'
              : 'pages.job.adhoc.rerun.loaded',
            { name: execution.templateName ?? '' },
          ),
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setRerunNotice({
          type: 'warning',
          text: t('pages.job.adhoc.rerun.failed', {
            reason: getJobErrorMessage(error),
          }),
        });
        setInitial(DEFAULTS);
      });
    return () => {
      cancelled = true;
    };
  }, [rerunId, t]);

  const credentialName = useMemo(
    () => (id?: string) =>
      credentials.find((credential) => credential.id === id)?.name ?? '',
    [credentials],
  );

  /** 校验表单并调用检查接口；返回表单值与检查结果，校验不通过 / 请求失败返回 undefined */
  const runCheck = async (forSubmit: boolean) => {
    try {
      // 只做检查时不要求已上传文件（先看目标与审批）
      if (forSubmit) {
        await form.validateFields();
      } else {
        const names = Object.keys(form.getFieldsValue()).filter(
          (name) => name !== 'file',
        );
        await form.validateFields(names);
      }
    } catch {
      // 错误已显示在表单项上
      return undefined;
    }
    const values = form.getFieldsValue(true) as AdhocFormValues;
    setChecking(true);
    const seq = ++checkSeq.current;
    try {
      const { kind, adhoc, target } = buildBody(values);
      const result = await checkJobAdhoc({ kind, adhoc, target });
      if (seq !== checkSeq.current) return undefined;
      setCheck(result);
      return { values, result };
    } catch {
      // 已由请求层提示
      setCheck(undefined);
      return undefined;
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    if (submitGuard.current) return;
    submitGuard.current = true;
    try {
      await confirmAndSubmit();
    } finally {
      submitGuard.current = false;
    }
  };

  const confirmAndSubmit = async () => {
    const checked = await runCheck(true);
    if (!checked) return;
    const { values, result } = checked;
    if (!isSubmittable(result)) {
      message.error(t('pages.job.adhoc.check.notSubmittable'));
      return;
    }
    const summary = summarizeHosts(result.hosts ?? []);
    const needApproval = (result.approvalReasons?.length ?? 0) > 0;
    // 脚本库的脚本：确认前重新取一次——执行的是它此刻的版本，确认框里看到的必须就是这一份
    if (values.kind === 3 && values.scriptSource === 'library') {
      try {
        const { script } = await getJobScript(values.scriptId ?? '', {
          silent: true,
        });
        libraryScript.current = script;
      } catch {
        message.error(t('pages.job.adhoc.script.loadFailed'));
        return;
      }
    }
    const content =
      values.kind === 2
        ? values.command
        : values.kind === 3
          ? values.scriptSource === 'library'
            ? libraryScript.current?.spec.content
            : values.script
          : undefined;
    const lines = (content ?? '').split('\n');
    modal.confirm({
      autoFocusButton: 'cancel',
      width: 640,
      title: t('pages.job.adhoc.confirm.title', {
        kind: t(KIND_META[values.kind].textId),
        n: summary.runnable,
      }),
      content: (
        <div>
          <div>
            {t('pages.job.adhoc.confirm.credential', {
              name: credentialName(values.credentialId),
            })}
          </div>
          {values.kind === 4 ? (
            <div>
              {t('pages.job.adhoc.confirm.file', {
                name: values.fileName || values.file?.name || '',
                dest: values.dest ?? '',
                mode: values.fileMode || '0644',
              })}
            </div>
          ) : (
            <>
              <pre className={styles.scriptBlock} style={{ marginTop: 8 }}>
                {lines.slice(0, PREVIEW_LINES).join('\n')}
              </pre>
              {lines.length > PREVIEW_LINES && (
                <div className={styles.hint}>
                  {t('pages.job.adhoc.confirm.more', {
                    n: lines.length - PREVIEW_LINES,
                  })}
                </div>
              )}
            </>
          )}
          <div className={styles.warning} style={{ marginTop: 8 }}>
            {t(
              needApproval
                ? 'pages.job.adhoc.confirm.approval'
                : 'pages.job.adhoc.confirm.warning',
            )}
          </div>
        </div>
      ),
      okText: t(
        needApproval ? 'pages.job.adhoc.submit.approval' : 'pages.job.run.ok',
      ),
      okButtonProps: { danger: true },
      onOk: async () => {
        setSubmitting(true);
        try {
          const { execution } = await submitJobAdhoc({
            ...buildBody(values),
            requestId: requestId.current,
          });
          requestId.current = randomUUID();
          if (execution.status === 9) {
            message.success(t('pages.job.run.submittedForApproval'));
          }
          history.push(`/job/execution/${execution.id}`);
        } catch (error) {
          // 关闭确认弹窗，把原因留在页面上（可修正后再提交）
          modal.error({
            title: t('pages.job.run.submitFailed'),
            content: getJobErrorMessage(error),
          });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  if (!initial) {
    return (
      <PageContainer title={false}>
        <Card variant="outlined">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </PageContainer>
    );
  }

  const canRun = has('job.adhoc.run');

  return (
    <PageContainer title={false}>
      <Card variant="outlined">
        {rerunNotice && (
          <Alert
            type={rerunNotice.type}
            showIcon
            closable
            title={rerunNotice.text}
            style={{ marginBottom: 16 }}
          />
        )}
        <ProForm<AdhocFormValues>
          form={form}
          grid
          rowProps={{ gutter: 16 }}
          initialValues={initial}
          submitter={false}
          disabled={submitting}
          style={{ maxWidth: 960 }}
          onValuesChange={(changed: Partial<AdhocFormValues>) => {
            resetTargetOnModelChange(changed, form);
            // 内容变了：上次的检查结果作废，幂等键换新
            setCheck(undefined);
            checkSeq.current += 1;
            requestId.current = randomUUID();
          }}
        >
          <Col span={24}>
            <Form.Item name="kind" style={{ marginBottom: 15 }}>
              <Segmented options={kindOptions} />
            </Form.Item>
          </Col>

          {/* ---------- 目标主机 ---------- */}
          <Col span={24}>
            <SectionTitle style={{ margin: '0 0 12px' }}>
              {t('pages.job.template.section.target')}
            </SectionTitle>
          </Col>
          <TargetFields />
          <ProFormSelect
            name="credentialId"
            label={t('pages.job.template.column.credential')}
            colProps={FULL}
            options={credentialOptions}
            showSearch
            extra={t('pages.job.template.form.credential.extra')}
            rules={[rules.select(t('pages.job.template.column.credential'))]}
          />

          {/* ---------- 执行内容 ---------- */}
          <Col span={24}>
            <SectionTitle style={{ margin: '0 0 12px' }}>
              {t('pages.job.template.section.content')}
            </SectionTitle>
          </Col>
          <ProFormDependency name={['kind', 'scriptSource']}>
            {({ kind, scriptSource }) => {
              if (kind === 2) {
                return (
                  <ProFormTextArea
                    name="command"
                    label={t('pages.job.adhoc.command')}
                    colProps={FULL}
                    placeholder="systemctl status nginx"
                    extra={t('pages.job.adhoc.command.extra')}
                    fieldProps={{
                      autoSize: { minRows: 3, maxRows: 12 },
                      className: styles.codeInput,
                      spellCheck: false,
                    }}
                    rules={[
                      rules.required(t('pages.job.adhoc.command')),
                      maxBytes(
                        JOB_LIMITS.commandMaxBytes,
                        t('pages.job.adhoc.command.tooLarge'),
                      ),
                    ]}
                  />
                );
              }
              if (kind === 3) {
                return (
                  <>
                    <ProFormRadio.Group
                      name="scriptSource"
                      label={t('pages.job.adhoc.scriptSource')}
                      colProps={FULL}
                      options={[
                        {
                          value: 'inline',
                          label: t('pages.job.adhoc.scriptSource.inline'),
                        },
                        {
                          value: 'library',
                          label: t('pages.job.adhoc.scriptSource.library'),
                        },
                      ]}
                    />
                    {scriptSource === 'library' ? (
                      <Col span={24}>
                        <Form.Item
                          name="scriptId"
                          label={t('pages.job.adhoc.scriptId')}
                          extra={t('pages.job.adhoc.scriptId.extra')}
                          rules={[rules.select(t('pages.job.adhoc.scriptId'))]}
                        >
                          <ScriptPicker
                            onLoaded={(script) => {
                              libraryScript.current = script;
                            }}
                          />
                        </Form.Item>
                      </Col>
                    ) : (
                      <>
                        <ProFormSelect
                          name="interpreter"
                          label={t('pages.job.adhoc.interpreter')}
                          colProps={{ span: 8 }}
                          options={INTERPRETER_OPTIONS}
                          allowClear={false}
                        />
                        <ProFormTextArea
                          name="script"
                          label={t('pages.job.adhoc.script')}
                          colProps={FULL}
                          fieldProps={{
                            rows: 16,
                            className: styles.codeInput,
                            spellCheck: false,
                            wrap: 'off',
                          }}
                          rules={[
                            rules.required(t('pages.job.adhoc.script')),
                            maxBytes(
                              JOB_LIMITS.scriptMaxBytes,
                              t('pages.job.script.form.content.tooLarge'),
                            ),
                          ]}
                        />
                      </>
                    )}
                    <ProFormText
                      name="scriptArgs"
                      label={t('pages.job.adhoc.scriptArgs')}
                      colProps={FULL}
                      placeholder="--env prod 'hello world'"
                      extra={t('pages.job.adhoc.scriptArgs.extra')}
                      fieldProps={{ className: styles.codeInput }}
                      rules={[
                        maxBytes(
                          JOB_LIMITS.scriptArgsMaxBytes,
                          t('pages.job.adhoc.scriptArgs.tooLarge'),
                        ),
                      ]}
                    />
                  </>
                );
              }
              return (
                <>
                  <Col span={24}>
                    <Form.Item
                      name="file"
                      // 切换到脚本模式即丢弃文件值，避免隐藏字段带着旧文件提交
                      preserve={false}
                      label={t('pages.job.adhoc.file')}
                      extra={t('pages.job.adhoc.file.extra')}
                      rules={[
                        {
                          required: true,
                          message: t('pages.job.adhoc.file.required'),
                        },
                      ]}
                    >
                      <FileField
                        onChange={(file) => {
                          // 文件名随上传的文件预填（可再改）
                          if (file) form.setFieldValue('fileName', file.name);
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <ProFormText
                    name="fileName"
                    label={t('pages.job.adhoc.fileName')}
                    colProps={HALF}
                    extra={t('pages.job.adhoc.fileName.extra')}
                    fieldProps={{ className: styles.codeInput }}
                    rules={[
                      {
                        pattern: FILE_NAME_REGEX,
                        message: t('pages.job.adhoc.fileName.rule'),
                      },
                    ]}
                  />
                  <ProFormText
                    name="fileMode"
                    label={t('pages.job.adhoc.mode')}
                    colProps={HALF}
                    placeholder="0644"
                    fieldProps={{ className: styles.codeInput }}
                    rules={[
                      {
                        pattern: FILE_MODE_REGEX,
                        message: t('pages.job.adhoc.mode.rule'),
                      },
                    ]}
                  />
                  <ProFormText
                    name="dest"
                    label={t('pages.job.adhoc.dest')}
                    colProps={FULL}
                    placeholder="/opt/app/conf"
                    extra={t('pages.job.adhoc.dest.extra')}
                    fieldProps={{ className: styles.codeInput }}
                    rules={[
                      rules.required(t('pages.job.adhoc.dest')),
                      rules.max(JOB_LIMITS.destMax),
                      {
                        validator: (_: unknown, value?: string) => {
                          const path = value?.trim() ?? '';
                          return !path ||
                            (DEST_DIR_REGEX.test(path) &&
                              !path.split('/').includes('..'))
                            ? Promise.resolve()
                            : Promise.reject(
                                new Error(t('pages.job.adhoc.dest.rule')),
                              );
                        },
                      },
                    ]}
                  />
                </>
              );
            }}
          </ProFormDependency>

          {/* ---------- 执行选项 ---------- */}
          <Col span={24}>
            <Collapse
              style={{ marginBottom: 16 }}
              items={[
                {
                  key: 'options',
                  label: t('pages.job.template.section.options'),
                  // 折叠着也要挂载：这些表单项的值与校验都要参与提交
                  forceRender: true,
                  children: (
                    <Row gutter={16}>
                      <ProFormDigit
                        name="forks"
                        label={t('pages.job.options.forks')}
                        tooltip={t('pages.job.options.forks.tooltip')}
                        colProps={{ span: 8 }}
                        min={JOB_LIMITS.forks.min}
                        max={JOB_LIMITS.forks.max}
                        fieldProps={{ precision: 0 }}
                        rules={[rules.required(t('pages.job.options.forks'))]}
                      />
                      <Col span={8}>
                        <Form.Item
                          name="timeoutS"
                          label={t('pages.job.options.timeout')}
                          tooltip={t('pages.job.options.timeout.tooltip')}
                          rules={[
                            {
                              validator: (_: unknown, value?: number) =>
                                typeof value === 'number' &&
                                value >= JOB_LIMITS.timeoutS.min &&
                                value <= JOB_LIMITS.timeoutS.max
                                  ? Promise.resolve()
                                  : Promise.reject(
                                      new Error(
                                        t('pages.job.options.timeout.rule'),
                                      ),
                                    ),
                            },
                          ]}
                        >
                          <DurationInput />
                        </Form.Item>
                      </Col>
                      <ProFormDigit
                        name="port"
                        label={t('pages.job.options.port')}
                        colProps={{ span: 8 }}
                        min={JOB_LIMITS.port.min}
                        max={JOB_LIMITS.port.max}
                        fieldProps={{ precision: 0 }}
                        rules={[rules.required(t('pages.job.options.port'))]}
                      />
                      <ProFormDigit
                        name="batchSize"
                        label={t('pages.job.options.batchSize')}
                        tooltip={t('pages.job.options.batchSize.tooltip')}
                        colProps={{ span: 8 }}
                        min={0}
                        max={JOB_LIMITS.batchSizeMax}
                        fieldProps={{ precision: 0 }}
                        extra={t('pages.job.options.batchSize.extra')}
                      />
                      <ProFormDependency name={['batchSize']}>
                        {({ batchSize }) => (
                          <ProFormDigit
                            name="maxFailPercent"
                            label={t('pages.job.options.maxFailPercent')}
                            tooltip={t(
                              'pages.job.options.maxFailPercent.tooltip',
                            )}
                            colProps={{ span: 8 }}
                            min={0}
                            max={100}
                            disabled={!batchSize}
                            fieldProps={{ precision: 0, suffix: '%' }}
                            extra={t(
                              batchSize
                                ? 'pages.job.options.maxFailPercent.extra'
                                : 'pages.job.options.maxFailPercent.disabled',
                            )}
                          />
                        )}
                      </ProFormDependency>
                      <ProFormSwitch
                        name="become"
                        label={t('pages.job.options.become')}
                        tooltip={t('pages.job.options.become.tooltip')}
                        colProps={{ span: 8 }}
                      />
                      <Col span={16}>
                        <Form.Item
                          name="runnerZone"
                          label={t('pages.job.options.runnerZone')}
                          tooltip={t('pages.job.options.runnerZone.tooltip')}
                          rules={[
                            {
                              pattern: ZONE_REGEX,
                              message: t('pages.job.zone.rule'),
                            },
                          ]}
                        >
                          <ZoneInput
                            placeholder={t(
                              'pages.job.options.runnerZone.placeholder',
                            )}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  ),
                },
              ]}
            />
          </Col>

          {/* ---------- 检查与提交 ---------- */}
          {check && (
            <Col span={24}>
              <SectionTitle style={{ margin: '0 0 12px' }}>
                {t('pages.job.adhoc.check.title')}
              </SectionTitle>
              <CheckResult check={check} />
            </Col>
          )}
          <Col span={24}>
            <Flex gap={12} align="center" style={{ marginTop: 16 }}>
              <Button
                loading={checking}
                disabled={submitting}
                onClick={() => void runCheck(false)}
              >
                {t('pages.job.adhoc.check')}
              </Button>
              {canRun && (
                <Button
                  type="primary"
                  danger
                  loading={submitting}
                  // 检查结果仍有效且不允许提交时置灰；内容一改即重新可点（提交前会再检查）
                  disabled={checking || (check && !isSubmittable(check))}
                  onClick={() => void submit()}
                >
                  {t('pages.job.run.ok')}
                </Button>
              )}
              <span className={styles.hint}>
                {t(
                  canRun
                    ? 'pages.job.adhoc.submit.hint'
                    : 'pages.job.adhoc.submit.noPermission',
                )}
              </span>
            </Flex>
          </Col>
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default AdhocPage;
