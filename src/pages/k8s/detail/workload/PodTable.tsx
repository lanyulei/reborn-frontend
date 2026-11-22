/** 容器组列表：搜索、状态、日志与终端入口。 */
import {
  CodeOutlined,
  FileTextOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Button,
  Dropdown,
  Input,
  Modal,
  Space,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import { type ReactNode, useMemo, useState } from 'react';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { formatTime } from '../../components/cells';
import { LogViewer } from '../../components/LogViewer';
import { detailPath, GVRS } from '../../components/meta';
import { useTerminal } from '../../components/Terminal';
import StatusText from '../shared/StatusDot';
import { podStatusLabel, podStatusType, type WorkloadPod } from './helpers';

const DEFAULT_PAGE_SIZE = 10;

type PodTableProps = {
  clusterId: string;
  loading?: boolean;
  onReload?: () => void;
  pods?: WorkloadPod[];
  /** Pod 模板里的容器名（日志 / 终端按容器进入） */
  containers?: string[];
};

type ContainerActionHandler = (pod: WorkloadPod, container: string) => void;

const getPodKeywordValues = (pod: WorkloadPod) => [
  pod.name,
  pod.namespace,
  pod.ip,
  pod.nodeIP,
  pod.nodeName,
  pod.status,
  pod.ready,
  podStatusLabel(pod.status),
];

const PodTable = ({
  clusterId,
  loading = false,
  onReload,
  pods = [],
  containers = [],
}: PodTableProps) => {
  const t = useT();
  const has = usePermissions();
  const { token } = theme.useToken();
  const terminal = useTerminal();
  const [logTarget, setLogTarget] = useState<{
    pod: WorkloadPod;
    container: string;
  }>();
  const [keyword, setKeyword] = useState('');
  const filteredPods = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return pods;
    }
    return pods.filter((pod) =>
      getPodKeywordValues(pod).some((value) =>
        value?.toLowerCase().includes(normalizedKeyword),
      ),
    );
  }, [keyword, pods]);

  const openContainerLog: ContainerActionHandler = (pod, container) =>
    setLogTarget({ pod, container });

  const openContainerTerminal: ContainerActionHandler = (pod, container) =>
    terminal.open({
      clusterId,
      namespace: pod.namespace,
      pod: pod.name,
      container,
    });

  const renderContainerAction = (
    pod: WorkloadPod,
    title: string,
    icon: ReactNode,
    onSelect: ContainerActionHandler,
  ) => {
    if (containers.length === 0) {
      return (
        <Tooltip title={title}>
          <Button disabled icon={icon} type="text" />
        </Tooltip>
      );
    }

    if (containers.length === 1) {
      return (
        <Tooltip title={title}>
          <Button
            aria-label={`${title} ${containers[0]}`}
            icon={icon}
            onClick={() => onSelect(pod, containers[0])}
            type="text"
          />
        </Tooltip>
      );
    }

    return (
      <Dropdown
        menu={{
          items: containers.map((container) => ({
            key: container,
            label: container,
            onClick: () => onSelect(pod, container),
          })),
        }}
        trigger={['click']}
      >
        <Tooltip title={title}>
          <Button aria-label={title} icon={icon} type="text" />
        </Tooltip>
      </Dropdown>
    );
  };

  const canLog = has('k8s.workload.log');
  const canExec = has('k8s.workload.exec');
  const columns: ProColumns<WorkloadPod>[] = [
    {
      title: t('pages.k8s.detail.index'),
      dataIndex: 'index',
      width: 72,
      renderText: (_, _record, index) => index + 1,
    },
    {
      title: t('pages.k8s.column.name'),
      dataIndex: 'name',
      width: 260,
      ellipsis: true,
      render: (_, record) => (
        <Typography.Text copyable={{ text: record.name }} ellipsis>
          {/* 点击名称进入容器组详情 */}
          <a
            onClick={() =>
              history.push(
                detailPath(clusterId, GVRS.pod, record.name, record.namespace),
              )
            }
          >
            {record.name}
          </a>
        </Typography.Text>
      ),
    },
    {
      title: t('pages.k8s.detail.ip'),
      dataIndex: 'ip',
      width: 140,
      ellipsis: true,
      renderText: (_, record) => record.ip || '-',
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      width: 140,
      render: (_, record) => {
        const status = (
          <StatusText
            ellipsis
            label={podStatusLabel(record.status)}
            type={podStatusType(record)}
          />
        );
        // 有具体原因（镜像拉取失败等）时悬停显示
        return record.reason ? (
          <Tooltip title={record.reason}>
            <span>{status}</span>
          </Tooltip>
        ) : (
          status
        );
      },
    },
    {
      title: t('pages.k8s.metrics.series.ready'),
      dataIndex: 'ready',
      width: 88,
      renderText: (_, record) => record.ready || '-',
    },
    {
      title: t('pages.k8s.detail.restarts'),
      dataIndex: 'restarts',
      width: 96,
    },
    {
      title: t('pages.k8s.detail.pod.nodeIp'),
      dataIndex: 'nodeIP',
      width: 140,
      ellipsis: true,
      renderText: (_, record) => record.nodeIP || '-',
    },
    {
      title: t('pages.k8s.detail.pod.nodeName'),
      dataIndex: 'nodeName',
      width: 180,
      ellipsis: true,
      renderText: (_, record) => record.nodeName || '-',
    },
    {
      title: t('common.column.createTime'),
      dataIndex: 'createTime',
      width: 180,
      renderText: (_, record) => formatTime(record.createTime) || '-',
    },
    ...(canLog || canExec
      ? [
          {
            title: t('common.column.action'),
            valueType: 'option' as const,
            width: 108,
            // 列多时横向滚动：操作列固定在右侧
            fixed: 'right' as const,
            render: (_: ReactNode, record: WorkloadPod) => (
              <Space size={4}>
                {canLog &&
                  renderContainerAction(
                    record,
                    t('pages.k8s.detail.pod.containerLogs'),
                    <FileTextOutlined />,
                    openContainerLog,
                  )}
                {canExec &&
                  renderContainerAction(
                    record,
                    t('pages.k8s.action.terminal'),
                    <CodeOutlined />,
                    openContainerTerminal,
                  )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <ProTable<WorkloadPod>
        cardBordered
        rowKey="uid"
        search={false}
        loading={loading}
        columns={columns}
        scroll={{ x: 'max-content' }}
        dataSource={filteredPods}
        pagination={{
          defaultPageSize: DEFAULT_PAGE_SIZE,
          showSizeChanger: true,
        }}
        headerTitle={
          <Input
            allowClear
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t('pages.k8s.detail.pod.search')}
            /* 工具栏标题容器带 500 字重 / 16px：恢复输入框默认字体 */
            style={{ fontSize: token.fontSize, fontWeight: 400, width: 260 }}
            suffix={<SearchOutlined />}
            value={keyword}
          />
        }
        options={{
          reload: onReload,
          density: true,
          setting: true,
        }}
      />
      {logTarget && (
        <Modal
          destroyOnHidden
          footer={null}
          onCancel={() => setLogTarget(undefined)}
          open
          title={t('pages.k8s.detail.pod.logsTitle', {
            pod: logTarget.pod.name,
            container: logTarget.container,
          })}
          width="calc(100vw - 48px)"
        >
          <LogViewer
            clusterId={clusterId}
            height={520}
            target={{
              mode: 'pod',
              namespace: logTarget.pod.namespace,
              pod: logTarget.pod.name,
              containers: [{ name: logTarget.container }],
            }}
          />
        </Modal>
      )}
    </>
  );
};

export default PodTable;
