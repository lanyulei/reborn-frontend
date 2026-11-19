/** 任务的运行记录：状态、消息、开始与结束时间（取自任务自身的状态）。 */
import { Table } from 'antd';
import type { K8sObject } from '@/services/k8s/typings';
import { formatTime } from '../../components/cells';
import { getJobStatus } from './jobCronJobHelpers';
import StatusText from './StatusText';

type JobRunRecord = {
  id: string;
  index: number;
  status?: string;
  message?: string;
  start_time?: string;
  completion_time?: string;
};

const buildRecords = (object?: K8sObject): JobRunRecord[] => {
  const status = object?.status;
  if (!status?.startTime) {
    return [];
  }
  const conditions: {
    type?: string;
    status?: string;
    message?: string;
    lastTransitionTime?: string;
  }[] = Array.isArray(status.conditions) ? status.conditions : [];
  const finished = conditions.find(
    (item) =>
      item.status === 'True' &&
      (item.type === 'Complete' || item.type === 'Failed'),
  );
  return [
    {
      id: object?.metadata?.uid ?? 'run',
      index: 1,
      status: getJobStatus(object),
      message: finished?.message,
      start_time: status.startTime,
      completion_time: status.completionTime ?? finished?.lastTransitionTime,
    },
  ];
};

const JobRunRecords = ({ object }: { object?: K8sObject }) => (
  <Table<JobRunRecord>
    rowKey="id"
    size="middle"
    pagination={false}
    dataSource={buildRecords(object)}
    columns={[
      { title: '序号', dataIndex: 'index', width: 110 },
      {
        title: '状态',
        dataIndex: 'status',
        width: 160,
        render: (_, record) => <StatusText status={record.status} />,
      },
      {
        title: '消息',
        dataIndex: 'message',
        ellipsis: true,
        render: (_, record) => record.message || '-',
      },
      {
        title: '开始时间',
        dataIndex: 'start_time',
        width: 210,
        render: (_, record) => formatTime(record.start_time) || '-',
      },
      {
        title: '结束时间',
        dataIndex: 'completion_time',
        width: 210,
        render: (_, record) => formatTime(record.completion_time) || '-',
      },
    ]}
  />
);

export default JobRunRecords;
