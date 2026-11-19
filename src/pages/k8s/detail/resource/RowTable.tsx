/** 一组已取好的资源行：名称（可进详情）、状态、命名空间、创建时间，支持按名称搜索。 */
import { SearchOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Alert, Input } from 'antd';
import { useMemo, useState } from 'react';
import type { GVR, ListRow, StateCell } from '@/services/k8s/typings';
import { formatTime, StateBadge } from '../../components/cells';
import { detailPath } from '../../components/meta';

type RowTableProps = {
  clusterId: string;
  gvr: GVR;
  rows: ListRow[];
  loading?: boolean;
  onReload?: () => void;
  /** 状态列之后追加的列（取自行的 cells） */
  cells?: { key: string; title: string }[];
  /** 表格上方的提示 */
  notice?: string;
};

const RowTable = ({
  clusterId,
  gvr,
  rows,
  loading,
  onReload,
  cells = [],
  notice,
}: RowTableProps) => {
  const [keyword, setKeyword] = useState('');
  const filtered = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return text
      ? rows.filter((row) => row.name.toLowerCase().includes(text))
      : rows;
  }, [keyword, rows]);

  const columns: ProColumns<ListRow>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (_, row) => (
        <a
          onClick={() =>
            history.push(detailPath(clusterId, gvr, row.name, row.namespace))
          }
        >
          {row.name}
        </a>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 160,
      render: (_, row) => {
        const cell = row.cells?.status as StateCell | undefined;
        return cell ? (
          <StateBadge
            state={cell.state}
            text={cell.text}
            reason={cell.reason}
          />
        ) : (
          '-'
        );
      },
    },
    ...cells.map((cell) => ({
      title: cell.title,
      key: cell.key,
      width: 160,
      render: (_: unknown, row: ListRow) => {
        const value = row.cells?.[cell.key];
        return value === undefined || value === null || value === ''
          ? '-'
          : String(value);
      },
    })),
    {
      title: '命名空间',
      dataIndex: 'namespace',
      width: 200,
      ellipsis: true,
      renderText: (_, row) => row.namespace || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      renderText: (_, row) => formatTime(row.createTime) || '-',
    },
  ];

  return (
    <>
      {notice && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          title={notice}
        />
      )}
      <ProTable<ListRow>
        cardBordered={false}
        ghost
        rowKey="uid"
        search={false}
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        headerTitle={
          <Input
            allowClear
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="按名称搜索"
            style={{ width: 260 }}
            suffix={<SearchOutlined />}
            value={keyword}
          />
        }
        options={{ reload: onReload ?? false, density: true, setting: true }}
      />
    </>
  );
};

export default RowTable;
