import { Tooltip } from 'antd';
import { statusOrigin } from '../../components/statusText';
import ClusterStatusText from '../shared/StatusDot';
import { getJobStatusLabel, getJobStatusType } from './helpers';

type StatusTextProps = {
  status?: string;
};

const StatusText = ({ status }: StatusTextProps) => {
  const statusType = getJobStatusType(status);

  const text = (
    <ClusterStatusText label={getJobStatusLabel(status)} type={statusType} />
  );
  const origin = statusOrigin(status);

  // 悬停显示集群给出的原文
  return origin ? (
    <Tooltip title={origin}>
      <span>{text}</span>
    </Tooltip>
  ) : (
    text
  );
};

export default StatusText;
