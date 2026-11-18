/**
 * 作业中心页面共享的小展示件：执行状态 / 主机结果标签、等宽可复制文本、更新人与时间。
 */
import {
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
  MinusCircleOutlined,
  QuestionCircleOutlined,
  StopOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Tag, Typography } from 'antd';
import type React from 'react';
import type {
  JobExecutionStatus,
  JobHostStatus,
  JobKind,
  JobRiskAction,
} from '@/services/job/typings';
import { useT } from '@/utils/i18n';
import { formatTime } from './format';
import {
  EXECUTION_STATUS_META,
  HOST_STATUS_META,
  KIND_META,
  RISK_ACTION_META,
} from './meta';
import { useJobStyles } from './styles';

const EXECUTION_STATUS_ICON: Record<JobExecutionStatus, React.ReactNode> = {
  1: <ClockCircleOutlined />,
  2: <SyncOutlined spin />,
  3: <CheckCircleOutlined />,
  4: <CloseCircleOutlined />,
  5: <ExclamationCircleOutlined />,
  6: <MinusCircleOutlined />,
  7: <FieldTimeOutlined />,
  8: <QuestionCircleOutlined />,
  9: <AuditOutlined />,
  10: <StopOutlined />,
};

/** 执行状态标签（颜色 + 图标） */
export const ExecutionStatusTag: React.FC<{ status?: JobExecutionStatus }> = ({
  status,
}) => {
  const t = useT();
  const meta = status ? EXECUTION_STATUS_META[status] : undefined;
  if (!status || !meta) return t('common.empty');
  return (
    <Tag
      color={meta.color}
      icon={EXECUTION_STATUS_ICON[status]}
      style={{ marginInlineEnd: 0 }}
    >
      {t(meta.textId)}
    </Tag>
  );
};

/** 预检模式标签 */
export const CheckModeTag: React.FC = () => {
  const t = useT();
  return (
    <Tag color="purple" style={{ marginInlineEnd: 0 }}>
      {t('pages.job.checkMode')}
    </Tag>
  );
};

/** 主机结果标签 */
export const HostStatusTag: React.FC<{ status?: JobHostStatus }> = ({
  status,
}) => {
  const t = useT();
  const meta = HOST_STATUS_META[status ?? 0] ?? HOST_STATUS_META[0];
  return (
    <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
      {t(meta.textId)}
    </Tag>
  );
};

/** 等宽文本，可选复制；空值显示占位符。display 用于展示缩短形式而复制完整值 */
export const CodeText: React.FC<{
  value?: string;
  display?: string;
  copyable?: boolean;
}> = ({ value, display, copyable }) => {
  const t = useT();
  const { styles } = useJobStyles();
  if (!value) return t('common.empty');
  return (
    <Typography.Text
      className={styles.code}
      copyable={copyable ? { text: value } : false}
    >
      {display ?? value}
    </Typography.Text>
  );
};

/** 「更新人 / 更新时间」两行单元格 */
export const UpdatedCell: React.FC<{
  userName?: string;
  time?: string;
}> = ({ userName, time }) => {
  const t = useT();
  const { styles } = useJobStyles();
  return (
    <div>
      <div>{userName || t('common.empty')}</div>
      <div className={styles.secondary}>{formatTime(time)}</div>
    </div>
  );
};

/** 作业类型标签（作业模板 / 执行命令 / 执行脚本 / 分发文件） */
export const KindTag: React.FC<{ kind?: JobKind }> = ({ kind }) => {
  const t = useT();
  const meta = KIND_META[kind ?? 1] ?? KIND_META[1];
  return (
    <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
      {t(meta.textId)}
    </Tag>
  );
};

/** 高危命令规则动作标签（拦截 / 须审批 / 仅提醒） */
export const RiskActionTag: React.FC<{ action?: JobRiskAction }> = ({
  action,
}) => {
  const t = useT();
  const meta = action ? RISK_ACTION_META[action] : undefined;
  if (!meta) return t('common.empty');
  return (
    <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
      {t(meta.textId)}
    </Tag>
  );
};
