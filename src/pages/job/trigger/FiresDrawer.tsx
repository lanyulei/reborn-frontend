/** 触发记录抽屉：一个触发器的历次触发（含被跳过与失败的），按触发时间倒序。 */
import { Link } from '@umijs/max';
import { Drawer, Flex, Select, Table, Tag } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { listJobTriggerFires } from '@/services/job/trigger';
import type {
  JobFireResult,
  JobSignalState,
  JobTrigger,
  JobTriggerFire,
} from '@/services/job/typings';
import { useT } from '@/utils/i18n';
import { formatTime } from '../components/format';
import { FIRE_RESULT_META, SIGNAL_STATE_META } from '../components/meta';

const RESULTS: readonly JobFireResult[] = [1, 2, 3];

export const FiresDrawer: React.FC<{
  trigger: JobTrigger;
  /** 当前用户能否打开流程实例详情 */
  canViewWorkflow: boolean;
  onClose: () => void;
}> = ({ trigger, canViewWorkflow, onClose }) => {
  const t = useT();
  const [result, setResult] = useState<JobFireResult>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<JobTriggerFire[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listJobTriggerFires({ page, pageSize, triggerId: trigger.id, result })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items ?? []);
        setTotal(Number(res.total ?? 0));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trigger.id, page, pageSize, result]);

  const resultOptions = useMemo(
    () =>
      RESULTS.map((value) => ({
        value,
        label: t(FIRE_RESULT_META[value].textId),
      })),
    [t],
  );
  const isApi = trigger.spec.type === 1;

  return (
    <Drawer
      open
      size={960}
      title={t('pages.job.trigger.fires.title', { name: trigger.spec.name })}
      onClose={onClose}
      destroyOnHidden
    >
      <Flex style={{ marginBottom: 12 }}>
        <Select<JobFireResult>
          allowClear
          style={{ width: 180 }}
          value={result}
          options={resultOptions}
          placeholder={t('pages.job.trigger.fires.column.result')}
          onChange={(next) => {
            setResult(next);
            setPage(1);
          }}
        />
      </Flex>
      <Table<JobTriggerFire>
        size="small"
        rowKey="id"
        loading={loading}
        dataSource={items}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (nextPage, nextSize) => {
            setPage(nextSize === pageSize ? nextPage : 1);
            setPageSize(nextSize);
          },
        }}
        columns={[
          {
            title: t('pages.job.trigger.fires.column.time'),
            dataIndex: 'createTime',
            width: 170,
            render: (value?: string) => formatTime(value),
          },
          {
            title: t('pages.job.trigger.fires.column.result'),
            dataIndex: 'result',
            width: 110,
            render: (value?: JobFireResult) => {
              const meta = value ? FIRE_RESULT_META[value] : undefined;
              return meta ? (
                <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
                  {t(meta.textId)}
                </Tag>
              ) : (
                t('common.empty')
              );
            },
          },
          {
            title: t('pages.job.trigger.fires.column.summary'),
            dataIndex: 'summary',
            render: (value?: string) => value || t('common.empty'),
          },
          {
            title: t('pages.job.trigger.fires.column.reason'),
            dataIndex: 'reason',
            render: (value?: string) => value || t('common.empty'),
          },
          {
            title: t('pages.job.trigger.fires.column.execution'),
            dataIndex: 'executionId',
            width: 110,
            render: (value?: string) =>
              value ? (
                <Link to={`/job/execution/${value}`}>
                  {t('pages.job.execution.detail')}
                </Link>
              ) : (
                t('common.empty')
              ),
          },
          // 流程信号只与接口触发器有关
          ...(isApi
            ? [
                {
                  title: t('pages.job.trigger.fires.column.signal'),
                  dataIndex: 'signalState',
                  width: 150,
                  render: (
                    value: JobSignalState | undefined,
                    record: JobTriggerFire,
                  ) => {
                    const meta = SIGNAL_STATE_META[value ?? 0];
                    const tag = (
                      <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
                        {t(meta.textId)}
                      </Tag>
                    );
                    return record.workflowInstanceId && canViewWorkflow ? (
                      <Link
                        to={`/workflow/instance/${record.workflowInstanceId}`}
                      >
                        {tag}
                      </Link>
                    ) : (
                      tag
                    );
                  },
                },
              ]
            : []),
        ]}
      />
    </Drawer>
  );
};
