/**
 * 执行作业弹窗（作业模板的「执行」、执行记录的「重新执行」「仅重试失败主机」共用）：
 * 确认模板版本、Playbook、凭据与将要执行的主机，填写执行参数，选择是否预检，然后提交。
 * 弹窗打开时生成一个幂等键并在重试时复用——重复点击或网络重试不会产生两条执行。
 */
import { history } from '@umijs/max';
import {
  Alert,
  App,
  Collapse,
  Descriptions,
  Form,
  Modal,
  Result,
  Skeleton,
  Switch,
} from 'antd';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { submitJobExecution } from '@/services/job/execution';
import { getJobErrorMessage } from '@/services/job/request';
import { getJobTemplate, listJobTemplateHosts } from '@/services/job/template';
import type { JobTemplate, JobTemplateHosts } from '@/services/job/typings';
import { useT } from '@/utils/i18n';
import { randomUUID } from '@/utils/uuid';
import { HostTable, summarizeHosts } from './HostTable';
import { JOB_LIMITS } from './meta';
import {
  collectParamValues,
  initialParamValues,
  ParamFields,
  type ParamValues,
} from './ParamFields';
import { useJobStyles } from './styles';

export const RunModal: React.FC<{
  templateId: string;
  /** 预置的参数取值（重新执行） */
  params?: ParamValues;
  /** 只在这些主机上执行（仅重试失败主机） */
  ciIds?: string[];
  onClose: () => void;
}> = ({ templateId, params: presetParams, ciIds: presetCiIds, onClose }) => {
  const t = useT();
  const { message } = App.useApp();
  const { styles } = useJobStyles();
  const [form] = Form.useForm<ParamValues>();
  // 幂等键：同一份内容的重复提交（连点、网络重试）复用；参数或预检开关一改即换新，
  // 以免改过的内容被当成上一次提交的重试而拿回旧的执行
  const requestId = useRef(randomUUID());
  const [template, setTemplate] = useState<JobTemplate>();
  // 参数表单的初值：表单在模板加载完成后才挂载，初值随挂载传入（不对未挂载的表单 setFieldsValue）
  const [initialValues, setInitialValues] = useState<ParamValues>();
  const [targets, setTargets] = useState<JobTemplateHosts>();
  const [loadError, setLoadError] = useState<string>();
  const [check, setCheck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getJobTemplate(templateId, { silent: true }),
      listJobTemplateHosts(templateId),
    ])
      .then(([{ template: loaded }, hosts]) => {
        if (cancelled) return;
        setTemplate(loaded);
        setTargets(hosts);
        setCheck(loaded.spec.options?.check === true);
        setInitialValues(
          initialParamValues(loaded.spec.params ?? [], presetParams),
        );
      })
      .catch((error) => {
        if (!cancelled) setLoadError(getJobErrorMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  // 本次要执行的主机：指定了子集时取交集（已不在模板目标内 / 数据范围外的不会执行）
  const hosts = useMemo(() => {
    const all = targets?.hosts ?? [];
    if (!presetCiIds) return all;
    const wanted = new Set(presetCiIds);
    return all.filter((host) => wanted.has(host.ciId));
  }, [targets, presetCiIds]);
  const summary = summarizeHosts(hosts);
  const dropped = presetCiIds ? presetCiIds.length - hosts.length : 0;
  const params = template?.spec.params ?? [];
  const enabled = template?.spec.enabled === true;
  const ready = Boolean(template && targets);
  // 主机数上限（全局策略与切片设置综合后的值）
  const maxHosts = targets?.maxHosts || JOB_LIMITS.targetCiMax;
  const tooMany = targets?.truncated === true || summary.total > maxHosts;
  // 实际执行（非预检）才需要审批
  const approvalReasons = check ? [] : (targets?.approvalReasons ?? []);
  const needApproval = approvalReasons.length > 0;
  const approvalBlocked = needApproval && targets?.approvalReady !== true;
  const sliceSize = template?.spec.sliceSize ?? 0;
  const slices = sliceSize > 0 ? Math.ceil(summary.runnable / sliceSize) : 0;
  const blocked =
    !ready ||
    !enabled ||
    tooMany ||
    approvalBlocked ||
    summary.problems > 0 ||
    summary.runnable === 0;

  const submit = async () => {
    if (!template || blocked || submitting) return;
    let values: ParamValues;
    try {
      values = await form.validateFields();
    } catch {
      // 错误已显示在表单项上
      return;
    }
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      // 弹窗打开期间模板被人改过：不按旧的确认内容提交
      const { template: latest } = await getJobTemplate(templateId, {
        silent: true,
      });
      if (latest.version !== template.version) {
        setSubmitError(t('pages.job.run.templateChanged'));
        setSubmitting(false);
        return;
      }
      const { execution } = await submitJobExecution({
        templateId,
        params: collectParamValues(params, values),
        // 点名本次确认过的主机：提交与确认之间模板或 CMDB 变了，也只在看到的这些主机上执行
        // （接口至多点名 500 台；更多时只能由后端按模板解析）
        ciIds:
          presetCiIds || hosts.length <= 500
            ? hosts.map((host) => host.ciId)
            : undefined,
        check,
        requestId: requestId.current,
        // 上面的复核与提交之间还有一个窗口：由后端按版本号最终把关
        templateVersion: template.version,
      });
      if (execution.status === 9) {
        message.success(t('pages.job.run.submittedForApproval'));
      }
      onClose();
      history.push(`/job/execution/${execution.id}`);
    } catch (error) {
      setSubmitError(getJobErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      width={720}
      title={t('pages.job.run.title')}
      destroyOnHidden
      mask={{ closable: false }}
      onCancel={() => {
        // 提交在途时不关：否则请求返回后会突然跳到执行详情
        if (!submitting) onClose();
      }}
      cancelButtonProps={{ disabled: submitting }}
      okText={t(check ? 'pages.job.run.ok.check' : 'pages.job.run.ok')}
      okButtonProps={{
        danger: !check,
        disabled: blocked,
        loading: submitting,
      }}
      onOk={() => void submit()}
    >
      {loadError ? (
        <Result
          status="error"
          title={t('pages.job.run.loadFailed')}
          subTitle={loadError}
        />
      ) : !template || !targets ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          <Descriptions
            size="small"
            column={2}
            style={{ marginBottom: 12 }}
            items={[
              {
                key: 'template',
                label: t('pages.job.run.template'),
                children: (
                  <span>
                    {template.spec.name}
                    <span
                      className={styles.hint}
                      style={{ marginInlineStart: 8 }}
                    >
                      v{template.version}
                    </span>
                  </span>
                ),
              },
              {
                key: 'credential',
                label: t('pages.job.template.column.credential'),
                children: template.credentialName || t('common.empty'),
              },
              {
                key: 'project',
                label: t('pages.job.template.column.project'),
                children: template.projectName
                  ? `${template.projectName}（${template.projectRef ?? ''}）`
                  : t('common.empty'),
              },
              {
                key: 'playbook',
                label: t('pages.job.template.column.playbook'),
                children: (
                  <span className={styles.code}>{template.spec.playbook}</span>
                ),
              },
            ]}
          />

          {!enabled && (
            <Alert
              type="error"
              showIcon
              title={t('pages.job.error.templateDisabled')}
              style={{ marginBottom: 12 }}
            />
          )}

          <div className={styles.hostCount}>
            {t('pages.job.run.hostCount', { n: summary.runnable })}
          </div>
          {presetCiIds && (
            <div className={styles.hint}>{t('pages.job.run.retryOnly')}</div>
          )}
          {slices > 1 && (
            <div className={styles.hint}>
              {t('pages.job.run.slices', { n: slices, size: sliceSize })}
            </div>
          )}
          {tooMany && (
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
          {(targets.outOfScope ?? 0) > 0 && (
            <Alert
              type="warning"
              showIcon
              title={t('pages.job.run.outOfScope', {
                n: targets.outOfScope ?? 0,
              })}
              style={{ marginTop: 8 }}
            />
          )}
          {dropped > 0 && (
            <Alert
              type="warning"
              showIcon
              title={t('pages.job.run.dropped', { n: dropped })}
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

          <Form<ParamValues>
            form={form}
            initialValues={initialValues}
            layout="vertical"
            style={{ marginTop: 12 }}
            disabled={submitting}
            onValuesChange={() => {
              requestId.current = randomUUID();
            }}
          >
            <ParamFields params={params} />
          </Form>

          <div className={styles.codeBlock} style={{ fontFamily: 'inherit' }}>
            <Switch
              checked={check}
              disabled={submitting}
              onChange={(checked) => {
                requestId.current = randomUUID();
                setCheck(checked);
              }}
              aria-label={t('pages.job.run.check')}
            />
            <strong style={{ marginInlineStart: 12 }}>
              {t('pages.job.run.check')}
            </strong>
            <div className={styles.hint} style={{ marginTop: 4 }}>
              {t('pages.job.run.check.hint')}
            </div>
          </div>
          {approvalBlocked && (
            <Alert
              type="error"
              showIcon
              title={t('pages.job.approval.unavailable')}
              description={approvalReasons.join('；')}
              style={{ marginTop: 12 }}
            />
          )}
          {needApproval && !approvalBlocked && (
            <Alert
              type="info"
              showIcon
              title={t('pages.job.approval.notice', {
                reasons: approvalReasons.join('；'),
              })}
              style={{ marginTop: 12 }}
            />
          )}
          {!check && !blocked && (
            <Alert
              type="warning"
              showIcon
              title={t('pages.job.run.realWarning', { n: summary.runnable })}
              style={{ marginTop: 12 }}
            />
          )}
          {submitError && (
            <Alert
              type="error"
              showIcon
              title={t('pages.job.run.submitFailed')}
              description={submitError}
              style={{ marginTop: 12 }}
            />
          )}
        </>
      )}
    </Modal>
  );
};
