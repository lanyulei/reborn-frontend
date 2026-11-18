/**
 * 升级策略表单抽屉（新建 / 编辑）：基本信息 + 各级（LevelsEditor）+ 24 小时通知量的联动估算。
 * 归属分组新建后不可更改；留空 = 全局策略，仅超级管理员可选。
 * 抽屉只对有新建 / 编辑权限的用户打开——候选接口（通知对象、值班分组）与估算接口都随这两个权限开放。
 */
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormDependency,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, App, Button, Col, Form } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { NOTIFY_SEVERITY_META } from '@/constants';
import { FULL, HALF } from '@/constants/layout';
import {
  createEscalation,
  estimateEscalation,
  getEscalation,
  listOncallGroupOptions,
  updateEscalation,
} from '@/services/monitor/escalation';
import {
  type NormalizedEscalationSpec,
  normalizeEscalationSpec,
} from '@/services/monitor/normalize';
import type {
  EscalationEstimate,
  EscalationSpec,
  MonitorEscalation,
  MonitorEscalationMode,
  MonitorSeverity,
  NamedRef,
  RuleGroup,
} from '@/services/monitor/typings';
import { useFormRules, useOptions, useSubmitter, useT } from '@/utils/i18n';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import {
  refsToKnown,
  useNotifyTargets,
  withRefOptions,
} from '../components/hooks';
import {
  ESCALATION_MODE_META,
  ESCALATION_MODE_ORDER,
  MONITOR_LIMITS,
  SEVERITY_ORDER,
} from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { TargetsFailedAlert } from '../components/tags';
import { LevelsEditor } from './LevelsEditor';
import {
  buildLevels,
  ESCALATION_LIMITS,
  type LevelValue,
  levelError,
  levelsToValues,
  nextLevel,
} from './levels';

/** 表单停止变化多久后才估算（毫秒） */
const ESTIMATE_DEBOUNCE_MS = 400;

interface EscalationFormValues {
  name: string;
  description?: string;
  groupId?: string;
  mode: MonitorEscalationMode;
  minSeverity: MonitorSeverity;
  levels: LevelValue[];
  enabled?: boolean;
}

const buildSpec = (values: EscalationFormValues): EscalationSpec => ({
  ...(values.groupId ? { groupId: values.groupId } : {}),
  name: (values.name ?? '').trim(),
  description: (values.description ?? '').trim(),
  mode: values.mode,
  minSeverity: values.minSeverity,
  levels: buildLevels(values.levels),
  enabled: values.enabled ?? false,
});

/** 已保存的策略 → 表单值（spec 已归一化，不补缺省：缺失的 enabled 即已停用） */
const specToValues = (
  spec: NormalizedEscalationSpec,
): Partial<EscalationFormValues> => ({
  name: spec.name,
  description: spec.description,
  groupId: spec.groupId,
  mode: spec.mode,
  minSeverity: spec.minSeverity,
  levels: levelsToValues(spec.levels),
  enabled: spec.enabled,
});

/** 新建表单的初值：叠加、不限级别、启用，带一级空白的「15 分钟未认领」 */
const createValues = (): Partial<EscalationFormValues> => ({
  mode: 1,
  minSeverity: 1,
  levels: [nextLevel([])],
  enabled: true,
});

/**
 * 影响估算结果的那部分表单内容的指纹；表单还不足以估算（名称为空——接口按完整策略校验，
 * 或各级未填完）时为空串。
 */
const estimateKey = (values: Partial<EscalationFormValues>): string =>
  values.name?.trim() &&
  values.mode &&
  values.minSeverity &&
  values.levels?.length &&
  !levelError(values.levels)
    ? JSON.stringify([values.mode, buildLevels(values.levels)])
    : '';

/** 各级显示名并成一池：编辑时增删级会让下标错位，而显示名只与 ID 有关 */
const poolRefs = (
  escalation: MonitorEscalation | null,
  kind: 'users' | 'schedules' | 'oncallGroups' | 'depts',
): NamedRef[] => {
  const seen = new Map<string, NamedRef>();
  for (const refs of escalation?.levelRefs ?? []) {
    for (const ref of refs[kind] ?? []) {
      if (!seen.has(ref.id)) seen.set(ref.id, ref);
    }
  }
  return [...seen.values()];
};

/** 值班分组候选（失败时给出提示与重试，同通知对象候选） */
const useOncallGroups = () => {
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // attempt 只用来触发重试
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listOncallGroupOptions()
      .then((result) => {
        if (cancelled) return;
        setOptions(
          (result.items ?? []).map((item) => ({
            value: item.id,
            label: item.name || item.id,
          })),
        );
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { options, failed, loading, retry };
};

/** 24 小时通知量估算：合计 + 各级明细；数量过大时换成警示样式 */
const EstimateView: React.FC<{ estimate: EscalationEstimate | null }> = ({
  estimate,
}) => {
  const t = useT();
  const { styles } = useMonitorStyles();
  if (!estimate) {
    return (
      <div className={styles.hint} style={{ marginBottom: 16 }}>
        {t('pages.monitor.escalation.estimate.pending')}
      </div>
    );
  }
  const total = estimate.total ?? 0;
  const tooMany = total > ESCALATION_LIMITS.estimateWarn;
  const parts = [
    ...(estimate.rule
      ? [t('pages.monitor.escalation.estimate.rule', { n: estimate.rule })]
      : []),
    ...(estimate.levels ?? []).map((n, index) =>
      t('pages.monitor.escalation.estimate.level', { level: index + 1, n }),
    ),
  ];
  return (
    <Alert
      type={tooMany ? 'warning' : 'info'}
      showIcon
      title={t('pages.monitor.escalation.estimate.total', { total })}
      description={
        <>
          <div>{parts.join(t('pages.monitor.listSeparator'))}</div>
          {tooMany && <div>{t('pages.monitor.escalation.estimate.warn')}</div>}
        </>
      }
      style={{ marginBottom: 16 }}
    />
  );
};

/** 值班分组候选加载失败的提示（带重试；值班表 / 部门的见 TargetsFailedAlert） */
const OncallGroupsFailedAlert: React.FC<{
  loading: boolean;
  retry: () => void;
}> = ({ loading, retry }) => {
  const t = useT();
  return (
    <Alert
      type="warning"
      showIcon
      title={t('pages.monitor.escalation.oncallGroups.failed')}
      action={
        <Button size="small" loading={loading} onClick={retry}>
          {t('pages.monitor.retry')}
        </Button>
      }
      style={{ marginBottom: 16 }}
    />
  );
};

export interface EscalationDrawerProps {
  /** 编辑的策略；为空即新建 */
  row?: MonitorEscalation | null;
  /** 规则分组与是否超级管理员：页面取一次下传 */
  groups: readonly RuleGroup[];
  isAdmin: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const EscalationDrawer: React.FC<EscalationDrawerProps> = ({
  row,
  groups,
  isAdmin,
  onClose,
  onSaved,
}) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const severityOptions = useOptions(NOTIFY_SEVERITY_META, SEVERITY_ORDER);
  const modeOptions = useOptions(ESCALATION_MODE_META, ESCALATION_MODE_ORDER);
  const formRef = useRef<ProFormInstance<EscalationFormValues> | undefined>(
    undefined,
  );
  const [saved, setSaved] = useState<MonitorEscalation | null>(row ?? null);
  const targets = useNotifyTargets();
  const oncallGroups = useOncallGroups();

  // ---- 估算：防抖，只采纳最后一次请求的结果；内容没变（如只改了名称）不重复请求
  const [estimate, setEstimate] = useState<EscalationEstimate | null>(null);
  const estimateTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const estimateSeq = useRef(0);
  const estimatedKey = useRef('');
  useEffect(
    () => () => {
      clearTimeout(estimateTimer.current);
      estimateSeq.current++;
    },
    [],
  );
  const scheduleEstimate = (values: Partial<EscalationFormValues>) => {
    const key = estimateKey(values);
    if (key === estimatedKey.current) return;
    estimatedKey.current = key;
    clearTimeout(estimateTimer.current);
    const current = ++estimateSeq.current;
    if (!key) {
      setEstimate(null);
      return;
    }
    estimateTimer.current = setTimeout(async () => {
      try {
        const result = await estimateEscalation({
          spec: buildSpec(values as EscalationFormValues),
        });
        if (current === estimateSeq.current) {
          setEstimate(result.estimate ?? null);
        }
      } catch {
        // 多为表单内容后端不接受（400）：不提示，只是不显示估算；下次改动再试
        if (current === estimateSeq.current) {
          setEstimate(null);
          estimatedKey.current = '';
        }
      }
    }, ESTIMATE_DEBOUNCE_MS);
  };

  const scheduleOptions = useMemo(
    () =>
      withRefOptions(targets.scheduleOptions, poolRefs(saved, 'schedules'), t),
    [targets.scheduleOptions, saved, t],
  );
  const oncallGroupOptions = useMemo(
    () =>
      withRefOptions(oncallGroups.options, poolRefs(saved, 'oncallGroups'), t),
    [oncallGroups.options, saved, t],
  );
  const knownDepts = useMemo(
    () =>
      poolRefs(saved, 'depts').map((ref) => ({
        id: ref.id,
        name: ref.name || ref.id,
      })),
    [saved],
  );
  const knownUsers = useMemo(
    () => refsToKnown(poolRefs(saved, 'users')),
    [saved],
  );

  return (
    <DrawerForm<EscalationFormValues>
      title={
        row
          ? t('pages.monitor.escalation.edit.title', { name: row.spec.name })
          : t('pages.monitor.escalation.create.title')
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
        if (!row) return createValues() as EscalationFormValues;
        const { escalation } = await getEscalation(row.id);
        setSaved(escalation);
        const values = specToValues(normalizeEscalationSpec(escalation.spec));
        // 已保存的内容直接用详情带回的估算，改动后才请求
        setEstimate(escalation.estimate ?? null);
        estimatedKey.current = estimateKey(values);
        return values as EscalationFormValues;
      }}
      submitter={row ? submitter.save : submitter.create}
      onValuesChange={(changed: Partial<EscalationFormValues>) => {
        const form = formRef.current;
        if (!form) return;
        // 各级的校验只在提交时触发（编辑到一半不报错）；已经报错的，改动后立即重新校验
        if ('levels' in changed && form.getFieldError('levels').length) {
          form.validateFields(['levels']).catch(() => undefined);
        }
        scheduleEstimate(form.getFieldsValue());
      }}
      onFinish={async (values) => {
        const spec = buildSpec(values);
        if (row) {
          await updateEscalation(row.id, {
            spec,
            version: saved?.version ?? row.version,
          });
          message.success(t('common.msg.saved'));
        } else {
          await createEscalation(spec);
          message.success(t('common.msg.created'));
        }
        onSaved?.();
        return true;
      }}
    >
      <ProFormText
        name="name"
        label={t('pages.monitor.common.name')}
        colProps={HALF}
        rules={[
          rules.required(t('pages.monitor.common.name')),
          rules.max(MONITOR_LIMITS.nameMax),
        ]}
      />
      <Col span={12}>
        <Form.Item
          name="groupId"
          label={t('pages.monitor.escalation.form.group')}
          tooltip={t('pages.monitor.escalation.form.group.tooltip')}
          // 全局策略（留空）仅超级管理员；编辑时不可更改，无需校验
          rules={
            isAdmin || row
              ? []
              : [rules.select(t('pages.monitor.escalation.form.group'))]
          }
        >
          <GroupTreeSelect
            groups={groups}
            minLevel={2}
            disabled={!!row}
            knownGroups={
              saved?.spec.groupId && saved.groupName
                ? [{ id: saved.spec.groupId, name: saved.groupName }]
                : undefined
            }
            placeholder={
              isAdmin || row
                ? t('pages.monitor.escalation.form.group.global')
                : t('pages.monitor.escalation.form.group.placeholder')
            }
          />
        </Form.Item>
      </Col>
      <ProFormTextArea
        name="description"
        label={t('pages.monitor.common.description')}
        colProps={FULL}
        fieldProps={{
          rows: 2,
          maxLength: ESCALATION_LIMITS.descMax,
          showCount: true,
        }}
      />
      <ProFormDependency name={['mode']}>
        {({ mode }) => (
          <ProFormRadio.Group
            name="mode"
            label={t('pages.monitor.escalation.form.mode')}
            colProps={FULL}
            options={modeOptions}
            extra={
              mode ? t(`pages.monitor.escalation.form.mode.${mode}.hint`) : null
            }
            rules={[rules.select(t('pages.monitor.escalation.form.mode'))]}
          />
        )}
      </ProFormDependency>
      <ProFormSelect
        name="minSeverity"
        label={t('pages.monitor.escalation.form.minSeverity')}
        tooltip={t('pages.monitor.escalation.form.minSeverity.tooltip')}
        colProps={HALF}
        options={severityOptions}
        allowClear={false}
        rules={[rules.select(t('pages.monitor.escalation.form.minSeverity'))]}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        tooltip={t('pages.monitor.escalation.form.enabled.tooltip')}
        colProps={HALF}
      />

      <Col span={24}>
        <SectionTitle>
          {t('pages.monitor.escalation.section.levels')}
        </SectionTitle>
        <TargetsFailedAlert targets={targets} />
        {oncallGroups.failed && (
          <OncallGroupsFailedAlert
            loading={oncallGroups.loading}
            retry={oncallGroups.retry}
          />
        )}
        <Form.Item
          name="levels"
          validateTrigger={[]}
          rules={[
            {
              validator: (_: unknown, value?: LevelValue[]) => {
                if (!value?.length) {
                  return Promise.reject(
                    new Error(t('pages.monitor.escalation.level.required')),
                  );
                }
                const error = levelError(value);
                return error
                  ? Promise.reject(
                      new Error(
                        t('pages.monitor.escalation.level.invalid', {
                          n: error.index + 1,
                          reason: t(
                            `pages.monitor.escalation.level.error.${error.code}`,
                          ),
                        }),
                      ),
                    )
                  : Promise.resolve();
              },
            },
          ]}
        >
          <LevelsEditor
            scheduleOptions={scheduleOptions}
            oncallGroupOptions={oncallGroupOptions}
            depts={targets.depts}
            knownDepts={knownDepts}
            knownUsers={knownUsers}
          />
        </Form.Item>
        <EstimateView estimate={estimate} />
      </Col>
    </DrawerForm>
  );
};

export default EscalationDrawer;
