/** 工作负载的事件：类型、原因、发生时间、来源、消息，支持搜索。 */
import { SearchOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Input, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listObjectEvents } from '@/services/k8s/resource';
import type { K8sEvent, ResourceRef } from '@/services/k8s/typings';
import { type Translate, useT } from '@/utils/i18n';
import { formatTime } from '../../components/cells';

const DEFAULT_PAGE_SIZE = 10;

type EventTableProps = {
  clusterId: string;
  target: ResourceRef;
  /** 标签页内嵌的紧凑样式（透明底）；缺省为整页样式 */
  compact?: boolean;
};

const useStyles = createStyles(({ token }) => ({
  eventType: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    whiteSpace: 'nowrap',
  },
  eventTypeDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
  },
  // 标签页内嵌（compact）时收紧工具栏容器的纵向内边距：上 0、下 16px
  compactToolbar: {
    '.ant-pro-table-list-toolbar-container': {
      paddingBlock: '0 16px',
    },
  },
}));

const formatRelativeTime = (t: Translate, value?: string) => {
  if (!value) {
    return '-';
  }

  const time = dayjs(value);
  if (!time.isValid()) {
    return value;
  }

  const diffSeconds = Math.max(0, dayjs().diff(time, 'second'));
  const diffDays = Math.floor(diffSeconds / 86400);
  if (diffDays > 0) {
    return t('pages.k8s.detail.event.daysAgo', { count: diffDays });
  }
  const diffHours = Math.floor(diffSeconds / 3600);
  if (diffHours > 0) {
    return t('pages.k8s.detail.event.hoursAgo', { count: diffHours });
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes > 0) {
    return t('pages.k8s.detail.event.minutesAgo', { count: diffMinutes });
  }
  return t('pages.k8s.detail.event.justNow');
};

const getEventTypeLabel = (t: Translate, type?: string) => {
  const normalizedType = type?.toLowerCase();

  if (normalizedType === 'normal') {
    return t('pages.k8s.detail.event.normal');
  }
  if (normalizedType === 'warning') {
    return t('pages.k8s.detail.event.warning');
  }
  return type || '-';
};

const matchEventKeyword = (t: Translate, event: K8sEvent, keyword: string) =>
  [
    event.type,
    getEventTypeLabel(t, event.type),
    event.reason,
    event.source,
    event.message,
  ].some((value) => value?.toLowerCase().includes(keyword));

const EventTable = ({
  clusterId,
  target,
  compact = false,
}: EventTableProps) => {
  const t = useT();
  const { styles, theme: token } = useStyles();
  const [items, setItems] = useState<K8sEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  // 调用方每次渲染都会新建 ref 对象：按内容比较
  const targetKey = JSON.stringify(target);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listObjectEvents(
        clusterId,
        JSON.parse(targetKey) as ResourceRef,
      );
      setItems(res.items ?? []);
    } catch {
      // 已由请求层提示
    } finally {
      setLoading(false);
    }
  }, [clusterId, targetKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return normalizedKeyword
      ? items.filter((event) => matchEventKeyword(t, event, normalizedKeyword))
      : items;
  }, [items, keyword]);

  const dotColor = (type?: string) => {
    const normalizedType = type?.toLowerCase();
    if (normalizedType === 'normal') return token.colorSuccess;
    if (normalizedType === 'warning') return token.colorWarning;
    return token.colorError;
  };

  const columns: ProColumns<K8sEvent>[] = [
    {
      title: t('pages.k8s.event.type'),
      dataIndex: 'type',
      width: 110,
      render: (_, record) => (
        <span className={styles.eventType}>
          <span
            className={styles.eventTypeDot}
            style={{ backgroundColor: dotColor(record.type) }}
          />
          <span>{getEventTypeLabel(t, record.type)}</span>
        </span>
      ),
    },
    {
      title: t('pages.k8s.event.reason'),
      dataIndex: 'reason',
      width: 160,
      ellipsis: true,
      renderText: (_, record) => record.reason || '-',
    },
    {
      title: t('pages.k8s.detail.event.lastTime'),
      dataIndex: 'lastTime',
      width: 160,
      render: (_, record) => (
        <Tooltip title={formatTime(record.lastTime)}>
          <span>{formatRelativeTime(t, record.lastTime)}</span>
        </Tooltip>
      ),
    },
    {
      title: t('pages.k8s.detail.event.source'),
      dataIndex: 'source',
      width: 210,
      ellipsis: true,
      render: (_, record) => {
        const source = record.source || '-';

        return (
          <Tooltip title={source} placement="topLeft">
            <span>{source}</span>
          </Tooltip>
        );
      },
    },
    {
      title: t('pages.k8s.detail.event.message'),
      dataIndex: 'message',
      ellipsis: true,
      render: (_, record) => {
        const message = record.message || '-';

        return (
          <Tooltip title={message} placement="topLeft">
            <span>{message}</span>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <ProTable<K8sEvent>
      cardBordered={!compact}
      ghost={compact}
      className={compact ? styles.compactToolbar : undefined}
      rowKey={(event) =>
        `${event.object}/${event.reason}/${event.firstTime}/${event.message}`
      }
      search={false}
      loading={loading}
      columns={columns}
      scroll={compact ? undefined : { x: 'max-content' }}
      dataSource={filteredItems}
      pagination={{
        defaultPageSize: DEFAULT_PAGE_SIZE,
        showSizeChanger: false,
      }}
      headerTitle={
        <Input
          allowClear
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={t('pages.k8s.detail.event.search')}
          /* 工具栏标题容器带 500 字重 / 16px：恢复输入框默认字体 */
          style={{ fontSize: token.fontSize, fontWeight: 400, width: 260 }}
          suffix={<SearchOutlined />}
          value={keyword}
        />
      }
      options={{
        reload: () => void load(),
        density: true,
        fullScreen: false,
        setting: true,
      }}
    />
  );
};

export default EventTable;
