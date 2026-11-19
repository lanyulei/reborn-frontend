/**
 * 新建 / 编辑作业模板抽屉：基本信息 · 执行内容 · 目标主机 · 执行参数 · 执行选项。
 * 目标主机取自 CMDB 的一个资源类型，可随时「预览主机」核对会选中哪些主机（按当前用户的数据范围）。
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
import { useMemo, useRef, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { FULL, HALF } from '@/constants/layout';
import {
  createJobTemplate,
  getJobTemplate,
  previewJobTarget,
  updateJobTemplate,
} from '@/services/job/template';
import type {
  JobParam,
  JobTargetPreview,
  JobTemplate,
  JobTemplateSpec,
} from '@/services/job/typings';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';
import { HostTable, summarizeHosts } from '../components/HostTable';
import {
  useCredentialSelectOptions,
  useProjectOptions,
} from '../components/hooks';
import { DurationInput, ZoneInput } from '../components/inputs';
import { JOB_LIMITS, PLAYBOOK_REGEX, ZONE_REGEX } from '../components/meta';
import { useJobStyles } from '../components/styles';
import {
  buildTarget,
  resetTargetOnModelChange,
  TARGET_FIELDS,
  TARGET_INITIAL,
  TargetFields,
  type TargetFormValues,
  targetToValues,
} from '../components/TargetFields';
import { normalizeParams, ParamsEditor, validateParams } from './ParamsEditor';

interface TemplateFormValues extends TargetFormValues {
  name: string;
  description?: string;
  enabled?: boolean;
  projectId?: string;
  playbook: string;
  credentialId?: string;
  params?: JobParam[];
  forks: number;
  timeoutS: number;
  port: number;
  become?: boolean;
  check?: boolean;
  diff?: boolean;
  verbosity: number;
  runnerZone?: string;
  exclusive?: boolean;
  requireApproval?: boolean;
  batchSize?: number;
  maxFailPercent?: number;
  sliceSize?: number;
}

const buildSpec = (values: TemplateFormValues): JobTemplateSpec => ({
  name: values.name.trim(),
  description: values.description?.trim() ?? '',
  projectId: values.projectId ?? '',
  playbook: values.playbook.trim(),
  credentialId: values.credentialId ?? '',
  target: buildTarget(values),
  params: normalizeParams(values.params),
  options: {
    forks: values.forks,
    timeoutS: values.timeoutS,
    port: values.port,
    become: values.become ?? false,
    check: values.check ?? false,
    diff: values.diff ?? false,
    verbosity: values.verbosity ?? 0,
    batchSize: values.batchSize ?? 0,
    maxFailPercent: values.batchSize ? (values.maxFailPercent ?? 0) : 0,
  },
  runnerZone: values.runnerZone?.trim() ?? '',
  exclusive: values.exclusive ?? false,
  requireApproval: values.requireApproval ?? false,
  // 切片与禁止并发互斥：开了禁止并发就不切片
  sliceSize: values.exclusive ? 0 : (values.sliceSize ?? 0),
  enabled: values.enabled ?? false,
});

const specToValues = (spec: JobTemplateSpec): TemplateFormValues => ({
  name: spec.name,
  description: spec.description,
  enabled: spec.enabled ?? false,
  projectId: spec.projectId,
  playbook: spec.playbook,
  credentialId: spec.credentialId,
  ...targetToValues(spec.target),
  params: spec.params ?? [],
  // 0（省略）表示取缺省值：表单里直接显示缺省值
  forks: spec.options?.forks || JOB_LIMITS.forks.default,
  timeoutS: spec.options?.timeoutS || JOB_LIMITS.timeoutS.default,
  port: spec.options?.port || JOB_LIMITS.port.default,
  become: spec.options?.become ?? false,
  check: spec.options?.check ?? false,
  diff: spec.options?.diff ?? false,
  verbosity: spec.options?.verbosity ?? 0,
  runnerZone: spec.runnerZone,
  exclusive: spec.exclusive ?? false,
  requireApproval: spec.requireApproval ?? false,
  batchSize: spec.options?.batchSize ?? 0,
  maxFailPercent: spec.options?.maxFailPercent ?? 0,
  sliceSize: spec.sliceSize ?? 0,
});

/** 新建 / 编辑作业模板抽屉（row 为空即新建） */
export const TemplateDrawer: React.FC<{
  row: JobTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ row, onClose, onSaved }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { styles } = useJobStyles();
  const formRef = useRef<ProFormInstance<TemplateFormValues> | undefined>(
    undefined,
  );
  const projects = useProjectOptions();
  const { credentials, options: credentialBaseOptions } =
    useCredentialSelectOptions();

  // 编辑时以详情接口返回的为准（乐观锁版本号）
  const [saved, setSaved] = useState<JobTemplate | null>(row);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<JobTargetPreview | null>(null);

  const projectOptions = useMemo(() => {
    const options = projects.map((project) => ({
      value: project.id,
      label: project.ref ? `${project.name}（${project.ref}）` : project.name,
    }));
    const current = saved?.spec.projectId;
    // 模板引用的项目已被删除：保留一个占位选项，提示重新选择
    if (
      current &&
      projects.length > 0 &&
      !projects.some((p) => p.id === current)
    ) {
      options.push({
        value: current,
        label: t('pages.job.template.form.project.missing'),
      });
    }
    return options;
  }, [projects, saved, t]);

  const credentialOptions = useMemo(() => {
    const current = saved?.spec.credentialId;
    // 模板引用的凭据已被删除：保留一个占位选项，提示重新选择
    return current &&
      credentials.length > 0 &&
      !credentials.some((c) => c.id === current)
      ? [
          ...credentialBaseOptions,
          {
            value: current,
            label: t('pages.job.template.form.credential.missing'),
          },
        ]
      : credentialBaseOptions;
  }, [credentials, credentialBaseOptions, saved, t]);

  const runPreview = async () => {
    const form = formRef.current;
    if (!form) return;
    const valid = await form.validateFields([...TARGET_FIELDS]).then(
      () => true,
      () => false,
    );
    // 校验不通过：错误已显示在表单项上
    if (!valid) return;
    setPreviewing(true);
    try {
      setPreview(
        await previewJobTarget(buildTarget(form.getFieldsValue(true))),
      );
    } catch {
      // 已由请求层提示（资源类型不在数据范围内等）
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  };

  const previewSummary = preview ? summarizeHosts(preview.hosts ?? []) : null;

  return (
    <DrawerForm<TemplateFormValues>
      title={
        row
          ? t('pages.job.template.edit.title', { name: row.spec.name })
          : t('pages.job.template.create.title')
      }
      width={960}
      grid
      rowProps={{ gutter: 16 }}
      open
      formRef={formRef}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true, mask: { closable: false } }}
      onValuesChange={(changed: Partial<TemplateFormValues>) => {
        resetTargetOnModelChange(changed, formRef.current);
        // 目标主机配置变了：上次的预览结果作废
        if (TARGET_FIELDS.some((field) => field in changed)) setPreview(null);
      }}
      request={async () => {
        if (!row) {
          return {
            name: '',
            enabled: true,
            playbook: '',
            ...TARGET_INITIAL,
            params: [],
            forks: JOB_LIMITS.forks.default,
            timeoutS: JOB_LIMITS.timeoutS.default,
            port: JOB_LIMITS.port.default,
            verbosity: 0,
          };
        }
        const { template } = await getJobTemplate(row.id);
        setSaved(template);
        return specToValues(template.spec);
      }}
      submitter={row ? submitter.save : submitter.create}
      onFinish={async (values) => {
        const spec = buildSpec(values);
        if (row) {
          await updateJobTemplate(row.id, {
            spec,
            version: saved?.version ?? row.version,
          });
          message.success(t('common.msg.saved'));
        } else {
          await createJobTemplate(spec);
          message.success(t('common.msg.created'));
        }
        onSaved();
        return true;
      }}
    >
      {/* ---------- 基本信息 ---------- */}
      <Col span={24}>
        <SectionTitle style={{ margin: '0 0 12px' }}>
          {t('pages.job.template.section.basic')}
        </SectionTitle>
      </Col>
      <ProFormText
        name="name"
        label={t('pages.job.common.name')}
        colProps={HALF}
        rules={[
          rules.required(t('pages.job.common.name')),
          rules.max(JOB_LIMITS.nameMax),
        ]}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        tooltip={t('pages.job.template.form.enabled.tooltip')}
        colProps={HALF}
      />
      <ProFormSwitch
        name="requireApproval"
        label={t('pages.job.template.form.requireApproval')}
        extra={t('pages.job.template.form.requireApproval.extra')}
        colProps={FULL}
      />
      <ProFormTextArea
        name="description"
        label={t('pages.job.common.description')}
        colProps={FULL}
        fieldProps={{
          rows: 2,
          maxLength: JOB_LIMITS.descMax,
          showCount: true,
        }}
      />

      {/* ---------- 执行内容 ---------- */}
      <Col span={24}>
        <SectionTitle style={{ margin: '0 0 12px' }}>
          {t('pages.job.template.section.content')}
        </SectionTitle>
      </Col>
      <ProFormSelect
        name="projectId"
        label={t('pages.job.template.column.project')}
        colProps={HALF}
        options={projectOptions}
        showSearch
        rules={[rules.select(t('pages.job.template.column.project'))]}
      />
      <ProFormText
        name="playbook"
        label={t('pages.job.template.column.playbook')}
        colProps={HALF}
        placeholder="deploy/site.yml"
        extra={t('pages.job.template.form.playbook.extra')}
        fieldProps={{ className: styles.codeInput }}
        rules={[
          rules.required(t('pages.job.template.column.playbook')),
          rules.max(JOB_LIMITS.playbookMax),
          {
            validator: (_: unknown, value?: string) => {
              const path = value?.trim() ?? '';
              return !path ||
                (PLAYBOOK_REGEX.test(path) &&
                  !path.startsWith('/') &&
                  !path.split('/').includes('..'))
                ? Promise.resolve()
                : Promise.reject(
                    new Error(t('pages.job.template.form.playbook.rule')),
                  );
            },
          },
        ]}
      />
      <ProFormSelect
        name="credentialId"
        label={t('pages.job.template.column.credential')}
        colProps={FULL}
        options={credentialOptions}
        showSearch
        extra={t('pages.job.template.form.credential.extra')}
        rules={[rules.select(t('pages.job.template.column.credential'))]}
      />

      {/* ---------- 目标主机 ---------- */}
      <Col span={24}>
        <SectionTitle style={{ margin: '0 0 12px' }}>
          {t('pages.job.template.section.target')}
        </SectionTitle>
      </Col>
      <TargetFields />
      {/* 预览按钮不以 Form.Item 结尾（无 24px 底距）：补齐行距，下方「执行参数」分节标题才有
          与其他分节一致的间距（grid 的 gutter 只是水平间距，垂直空隙全靠元素外边距叠加） */}
      <Col span={24} style={{ marginBottom: 24 }}>
        <Button loading={previewing} onClick={() => void runPreview()}>
          {t('pages.job.template.preview')}
        </Button>
        {preview && previewSummary && (
          <div style={{ marginTop: 12 }}>
            {preview.truncated && (
              <Alert
                type="error"
                showIcon
                title={t('pages.job.hosts.truncated', {
                  max: JOB_LIMITS.targetCiMax,
                })}
                style={{ marginBottom: 8 }}
              />
            )}
            <div style={{ marginBottom: 8 }}>
              {t('pages.job.template.preview.summary', {
                total: previewSummary.total,
                runnable: previewSummary.runnable,
              })}
              {previewSummary.problems > 0 && (
                <span
                  className={styles.danger}
                  style={{ marginInlineStart: 8 }}
                >
                  {t('pages.job.template.preview.problems', {
                    n: previewSummary.problems,
                  })}
                </span>
              )}
            </div>
            <HostTable hosts={preview.hosts ?? []} pageSize={8} />
          </div>
        )}
      </Col>

      {/* ---------- 执行参数 ---------- */}
      <Col span={24}>
        <SectionTitle style={{ margin: '0 0 12px' }}>
          {t('pages.job.template.section.params')}
        </SectionTitle>
        <div className={styles.hint} style={{ marginBottom: 12 }}>
          {t('pages.job.template.form.params.hint')}
        </div>
        <Form.Item
          name="params"
          rules={[
            {
              validator: (_: unknown, value?: JobParam[]) =>
                validateParams(value, t)
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(t('pages.job.template.form.params.rule')),
                    ),
            },
          ]}
        >
          <ParamsEditor />
        </Form.Item>
      </Col>

      {/* ---------- 执行选项 ---------- */}
      <Col span={24}>
        <SectionTitle style={{ margin: '0 0 12px' }}>
          {t('pages.job.template.section.options')}
        </SectionTitle>
      </Col>
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
                      new Error(t('pages.job.options.timeout.rule')),
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
      <ProFormSelect
        name="verbosity"
        label={t('pages.job.options.verbosity')}
        colProps={{ span: 8 }}
        allowClear={false}
        options={[0, 1, 2, 3].map((value) => ({
          value,
          label: t(`pages.job.options.verbosity.${value}`),
        }))}
      />
      <Col span={16}>
        <Form.Item
          name="runnerZone"
          label={t('pages.job.options.runnerZone')}
          tooltip={t('pages.job.options.runnerZone.tooltip')}
          rules={[{ pattern: ZONE_REGEX, message: t('pages.job.zone.rule') }]}
        >
          <ZoneInput
            placeholder={t('pages.job.options.runnerZone.placeholder')}
          />
        </Form.Item>
      </Col>
      <ProFormSwitch
        name="become"
        label={t('pages.job.options.become')}
        tooltip={t('pages.job.options.become.tooltip')}
        colProps={{ span: 8 }}
      />
      <ProFormSwitch
        name="check"
        label={t('pages.job.options.check')}
        tooltip={t('pages.job.options.check.tooltip')}
        colProps={{ span: 8 }}
      />
      <ProFormSwitch
        name="diff"
        label={t('pages.job.options.diff')}
        tooltip={t('pages.job.options.diff.tooltip')}
        colProps={{ span: 8 }}
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
            tooltip={t('pages.job.options.maxFailPercent.tooltip')}
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
      <ProFormDependency name={['exclusive', 'sliceSize']}>
        {({ exclusive, sliceSize }) => (
          <>
            <ProFormDigit
              name="sliceSize"
              label={t('pages.job.options.sliceSize')}
              tooltip={t('pages.job.options.sliceSize.tooltip')}
              colProps={{ span: 8 }}
              min={0}
              max={JOB_LIMITS.sliceSizeMax}
              disabled={exclusive === true}
              fieldProps={{ precision: 0 }}
              extra={t(
                exclusive
                  ? 'pages.job.options.sliceSize.disabled'
                  : 'pages.job.options.sliceSize.extra',
              )}
            />
            <ProFormSwitch
              name="exclusive"
              label={t('pages.job.options.exclusive')}
              disabled={Boolean(sliceSize)}
              extra={t(
                sliceSize
                  ? 'pages.job.options.exclusive.disabled'
                  : 'pages.job.options.exclusive.extra',
              )}
              colProps={FULL}
            />
          </>
        )}
      </ProFormDependency>
    </DrawerForm>
  );
};
