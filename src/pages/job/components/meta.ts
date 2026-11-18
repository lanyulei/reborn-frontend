/**
 * 作业中心域枚举元数据与表单上限：只保存结构与 i18n 键（文案在 locales/<lang>/job.ts）。
 */
import type {
  JobBecomeMethod,
  JobCredentialType,
  JobExecutionStatus,
  JobFireResult,
  JobHostProblem,
  JobHostStatus,
  JobInterpreter,
  JobKind,
  JobMisfire,
  JobParamType,
  JobProjectAuthType,
  JobRiskAction,
  JobSignalState,
  JobTargetMode,
  JobTriggerSource,
  JobTriggerType,
} from '@/services/job/typings';
import type { EnumMeta } from '@/utils/i18n';

export const CREDENTIAL_TYPE_META: Record<
  JobCredentialType,
  { textId: string; color: string }
> = {
  1: { textId: 'enum.job.credentialType.1', color: 'blue' },
  2: { textId: 'enum.job.credentialType.2', color: 'gold' },
};
export const CREDENTIAL_TYPE_ORDER: readonly JobCredentialType[] = [1, 2];

/** 提权方式；键 none 对应接口里的空串（表单项不便用空串作值） */
export type BecomeMethodKey = 'none' | 'sudo' | 'su';
export const BECOME_METHOD_META: EnumMeta<BecomeMethodKey> = {
  none: { textId: 'enum.job.becomeMethod.none' },
  sudo: { textId: 'enum.job.becomeMethod.sudo' },
  su: { textId: 'enum.job.becomeMethod.su' },
};
export const BECOME_METHOD_ORDER: readonly BecomeMethodKey[] = [
  'none',
  'sudo',
  'su',
];
export const toBecomeKey = (method?: JobBecomeMethod): BecomeMethodKey =>
  method === 'sudo' || method === 'su' ? method : 'none';
export const fromBecomeKey = (key?: BecomeMethodKey): JobBecomeMethod =>
  key === 'sudo' || key === 'su' ? key : '';

export const PROJECT_AUTH_META: EnumMeta<JobProjectAuthType> = {
  1: { textId: 'enum.job.projectAuth.1' },
  2: { textId: 'enum.job.projectAuth.2' },
  3: { textId: 'enum.job.projectAuth.3' },
};
export const PROJECT_AUTH_ORDER: readonly JobProjectAuthType[] = [1, 2, 3];

export const TARGET_MODE_META: EnumMeta<JobTargetMode> = {
  1: { textId: 'enum.job.targetMode.1' },
  2: { textId: 'enum.job.targetMode.2' },
};
export const TARGET_MODE_ORDER: readonly JobTargetMode[] = [1, 2];

export const PARAM_TYPE_META: EnumMeta<JobParamType> = {
  string: { textId: 'enum.job.paramType.string' },
  text: { textId: 'enum.job.paramType.text' },
  int: { textId: 'enum.job.paramType.int' },
  float: { textId: 'enum.job.paramType.float' },
  bool: { textId: 'enum.job.paramType.bool' },
  enum: { textId: 'enum.job.paramType.enum' },
};
export const PARAM_TYPE_ORDER: readonly JobParamType[] = [
  'string',
  'text',
  'int',
  'float',
  'bool',
  'enum',
];

/** 执行状态：status 供筛选下拉的徽标，color 供状态标签 */
export const EXECUTION_STATUS_META: Record<
  JobExecutionStatus,
  {
    textId: string;
    status: 'Default' | 'Processing' | 'Success' | 'Error' | 'Warning';
    color: string;
  }
> = {
  1: {
    textId: 'enum.job.executionStatus.1',
    status: 'Default',
    color: 'default',
  },
  2: {
    textId: 'enum.job.executionStatus.2',
    status: 'Processing',
    color: 'processing',
  },
  3: {
    textId: 'enum.job.executionStatus.3',
    status: 'Success',
    color: 'success',
  },
  4: { textId: 'enum.job.executionStatus.4', status: 'Error', color: 'error' },
  5: {
    textId: 'enum.job.executionStatus.5',
    status: 'Warning',
    color: 'orange',
  },
  6: {
    textId: 'enum.job.executionStatus.6',
    status: 'Default',
    color: 'default',
  },
  7: {
    textId: 'enum.job.executionStatus.7',
    status: 'Error',
    color: 'volcano',
  },
  8: {
    textId: 'enum.job.executionStatus.8',
    status: 'Warning',
    color: 'warning',
  },
  9: {
    textId: 'enum.job.executionStatus.9',
    status: 'Processing',
    color: 'purple',
  },
  10: {
    textId: 'enum.job.executionStatus.10',
    status: 'Error',
    color: 'magenta',
  },
};
/** 筛选下拉的顺序：待审批在最前（按流转先后） */
export const EXECUTION_STATUS_ORDER: readonly JobExecutionStatus[] = [
  9, 1, 2, 3, 4, 5, 6, 7, 8, 10,
];

/** 未结束（待审批 / 排队中 / 执行中）：可取消，页面需要轮询 */
export const isActiveStatus = (status?: number): boolean =>
  status === 1 || status === 2 || status === 9;

export const KIND_META: Record<JobKind, { textId: string; color?: string }> = {
  1: { textId: 'enum.job.kind.1' },
  2: { textId: 'enum.job.kind.2', color: 'cyan' },
  3: { textId: 'enum.job.kind.3', color: 'blue' },
  4: { textId: 'enum.job.kind.4', color: 'geekblue' },
};
export const KIND_ORDER: readonly JobKind[] = [1, 2, 3, 4];
/** 快速执行的三种类型 */
export const ADHOC_KIND_ORDER: readonly (2 | 3 | 4)[] = [2, 3, 4];

export const TRIGGER_SOURCE_META: EnumMeta<JobTriggerSource> = {
  1: { textId: 'enum.job.triggerSource.1' },
  2: { textId: 'enum.job.triggerSource.2' },
  3: { textId: 'enum.job.triggerSource.3' },
  4: { textId: 'enum.job.triggerSource.4' },
};
export const TRIGGER_SOURCE_ORDER: readonly JobTriggerSource[] = [1, 2, 3, 4];

/** 高危命令规则动作：拦截 = 红，须审批 = 橙，仅提醒 = 金 */
export const RISK_ACTION_META: Record<
  JobRiskAction,
  { textId: string; color: string }
> = {
  1: { textId: 'enum.job.riskAction.1', color: 'red' },
  2: { textId: 'enum.job.riskAction.2', color: 'orange' },
  3: { textId: 'enum.job.riskAction.3', color: 'gold' },
};
export const RISK_ACTION_ORDER: readonly JobRiskAction[] = [1, 2, 3];

export const INTERPRETER_ORDER: readonly JobInterpreter[] = [
  'bash',
  'sh',
  'python3',
];
export const INTERPRETER_OPTIONS = INTERPRETER_ORDER.map((value) => ({
  value,
  label: value,
}));

export const MISFIRE_META: EnumMeta<JobMisfire> = {
  1: { textId: 'enum.job.misfire.1' },
  2: { textId: 'enum.job.misfire.2' },
};
export const MISFIRE_ORDER: readonly JobMisfire[] = [1, 2];

export const TRIGGER_TYPE_META: Record<
  JobTriggerType,
  { textId: string; color: string }
> = {
  1: { textId: 'enum.job.triggerType.1', color: 'blue' },
  2: { textId: 'enum.job.triggerType.2', color: 'volcano' },
};
export const TRIGGER_TYPE_ORDER: readonly JobTriggerType[] = [1, 2];

export const FIRE_RESULT_META: Record<
  JobFireResult,
  { textId: string; color: string }
> = {
  1: { textId: 'enum.job.fireResult.1', color: 'success' },
  2: { textId: 'enum.job.fireResult.2', color: 'default' },
  3: { textId: 'enum.job.fireResult.3', color: 'error' },
};

export const SIGNAL_STATE_META: Record<
  JobSignalState,
  { textId: string; color: string }
> = {
  0: { textId: 'enum.job.signalState.0', color: 'default' },
  1: { textId: 'enum.job.signalState.1', color: 'processing' },
  2: { textId: 'enum.job.signalState.2', color: 'success' },
  3: { textId: 'enum.job.signalState.3', color: 'warning' },
};

export const HOST_STATUS_META: Record<
  JobHostStatus,
  { textId: string; color: string }
> = {
  0: { textId: 'enum.job.hostStatus.0', color: 'default' },
  1: { textId: 'enum.job.hostStatus.1', color: 'success' },
  2: { textId: 'enum.job.hostStatus.2', color: 'gold' },
  3: { textId: 'enum.job.hostStatus.3', color: 'error' },
  4: { textId: 'enum.job.hostStatus.4', color: 'volcano' },
  5: { textId: 'enum.job.hostStatus.5', color: 'default' },
};

export const HOST_PROBLEM_TEXT_ID: Record<JobHostProblem, string> = {
  address_empty: 'enum.job.hostProblem.address_empty',
  address_invalid: 'enum.job.hostProblem.address_invalid',
  address_duplicate: 'enum.job.hostProblem.address_duplicate',
};

/** 登录用户名 / 提权用户（与后端一致） */
export const USERNAME_REGEX = /^[A-Za-z0-9_.][A-Za-z0-9_.-]{0,63}$/;
/** 执行节点区域名（与后端一致） */
export const ZONE_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
/** 执行参数变量名（与后端一致） */
export const PARAM_CODE_REGEX = /^[a-z][a-z0-9_]{0,63}$/;
/** 变量名不得使用的前缀（与 Ansible / 平台注入的变量冲突） */
export const PARAM_CODE_FORBIDDEN_PREFIXES = ['ansible_', 'cmdb_'] as const;
/**
 * Ansible 的保留名（Play / 任务关键字、模板内置函数、魔法变量）：不能用作变量名。
 * 与后端 kit/jobcontract 的 reservedVars 一致（后端为准，这里只为了在表单里提前提示）。
 */
export const PARAM_CODE_RESERVED: ReadonlySet<string> = new Set(
  'action always any_errors_fatal args async async_val become become_exe become_flags become_method become_user block changed_when check_mode collections connection cycler debugger delay delegate_facts delegate_to dict diff environment fact_path failed_when force_handlers gather_facts gather_timeout handlers hosts ignore_errors ignore_unreachable joiner lipsum local_action lookup loop loop_control loop_with max_fail_percentage module_defaults name namespace no_log notify now omit order poll port post_tasks pre_tasks q query range register remote_user rescue retries roles run_once serial strategy tags tasks throttle timeout undef until validate_argspec vars vars_files vars_prompt when with_ group_names groups hostvars inventory_dir inventory_file inventory_hostname inventory_hostname_short play_hosts playbook_dir role_name role_names role_path role_uuid item'.split(
    ' ',
  ),
);
/** http(s) 仓库地址 */
export const HTTP_REPO_REGEX = /^https?:\/\/\S+$/i;
/** ssh 仓库地址：ssh://user@host/path 或 user@host:path */
export const SSH_REPO_REGEX = /^(ssh:\/\/\S+|[^\s@/]+@[^\s:/]+:\S+)$/i;
/** 分发文件：目标主机上的文件名（与后端一致） */
export const FILE_NAME_REGEX = /^[A-Za-z0-9_+][A-Za-z0-9._+-]{0,127}$/;
/** 分发文件：存放目录，绝对路径 */
export const DEST_DIR_REGEX = /^\/[A-Za-z0-9._/+-]*$/;
/** 分发文件：权限，0 开头的三位八进制 */
export const FILE_MODE_REGEX = /^0[0-7]{3}$/;
/** 触发器的流程信号名（与后端一致） */
export const SIGNAL_REGEX = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/;
/** 告警标签名（与后端一致） */
export const ALERT_LABEL_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{0,127}$/;
/** 审批流程定义标识（与后端一致） */
export const WORKFLOW_KEY_REGEX = /^[a-z][a-z0-9_-]{1,63}$/;
/** Playbook 路径以 .yml / .yaml 结尾 */
export const PLAYBOOK_REGEX = /\.ya?ml$/i;

/** 表单上限与缺省值（与后端 proto 校验一致） */
export const JOB_LIMITS = {
  nameMax: 64,
  descMax: 255,
  keywordMax: 64,
  secretMax: 16384,
  becomeSecretMax: 1024,
  repoUrlMax: 512,
  refMax: 128,
  projectUsernameMax: 128,
  playbookMax: 255,
  targetCiMax: 500,
  targetFilterMax: 64,
  paramMax: 30,
  paramDefaultMax: 1024,
  paramOptionMax: 50,
  paramOptionLenMax: 128,
  forks: { min: 1, max: 100, default: 10 },
  timeoutS: { min: 60, max: 86400, default: 3600 },
  port: { min: 1, max: 65535, default: 22 },
  verbosityMax: 3,
  batchSizeMax: 500,
  sliceSizeMax: 500,
  sliceMax: 10,
  commandMaxBytes: 4096,
  scriptMaxBytes: 262144,
  scriptArgsMaxBytes: 1024,
  adhocFileMaxBytes: 4 * 1024 * 1024,
  destMax: 255,
  cronMax: 64,
  cooldownMaxS: 86400,
  alertRuleMax: 50,
  alertLabelMax: 10,
  alertLabelValueMax: 256,
  riskPatternMax: 512,
  protectedEnvMax: 20,
  maxHostsMax: 500,
} as const;
