/**
 * 服务目录：工单模板列表（按分类 / 状态筛选）+ 模板的新建 / 编辑 / 删除，
 * 分类在「分类管理」抽屉里维护。目录规模有上限，一次取回、前端筛选。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Space, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { usePermissions } from '@/services/system/permissions';
import { deleteTemplate, listManagedCatalog } from '@/services/ticket';
import type {
  TemplateStatus,
  TicketCategory,
  TicketTemplate,
} from '@/services/ticket/typings';
import { useT, useValueEnum } from '@/utils/i18n';
import { TEMPLATE_STATUS_META } from '../components/meta';
import { CategoryDrawer } from './CategoryDrawer';
import { TemplateDrawer } from './TemplateDrawer';

/** 模板行：补上所属分类名称 */
type Row = TicketTemplate & { categoryName: string; status: TemplateStatus };

const Catalog: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const statusEnum = useValueEnum(TEMPLATE_STATUS_META);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  /** 编辑的模板 ID；空串 = 新建；undefined = 关闭 */
  const [templateId, setTemplateId] = useState<string>();
  // 复制的来源模板：与 templateId === '' 一起打开「复制模板」抽屉
  const [copyFrom, setCopyFrom] = useState<string>();

  const reload = () => actionRef.current?.reload();
  const canTemplate = has('ticket.catalog.template');

  const columns: ProColumns<Row>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.ticket.template.search.placeholder'),
      },
    },
    {
      title: t('pages.ticket.template.name'),
      dataIndex: 'name',
      search: false,
      ellipsis: true,
      render: (_, record) => (
        <>
          {record.name}
          {record.builtin && (
            <Tag color="gold" style={{ marginInlineStart: 8 }}>
              {t('pages.ticket.template.tag.builtin')}
            </Tag>
          )}
        </>
      ),
    },
    {
      title: t('pages.ticket.template.category'),
      dataIndex: 'categoryId',
      valueType: 'select',
      fieldProps: {
        options: categories.map((c) => ({ value: c.id, label: c.name })),
      },
      ellipsis: true,
      width: 140,
      render: (_, record) => record.categoryName,
    },
    {
      title: t('pages.ticket.template.workflow'),
      dataIndex: 'workflowKey',
      search: false,
      ellipsis: true,
      width: 160,
    },
    {
      title: t('pages.ticket.template.prefix'),
      dataIndex: 'numberPrefix',
      search: false,
      width: 110,
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      width: 90,
    },
    {
      title: t('pages.ticket.column.sort'),
      dataIndex: 'sort',
      search: false,
      width: 80,
      renderText: (_, record) => record.sort ?? 0,
    },
    {
      title: t('common.column.updateTime'),
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 150,
      hideInTable: !canTemplate,
      render: (_, record) => [
        <a key="edit" onClick={() => setTemplateId(record.id)}>
          {t('common.action.edit')}
        </a>,
        <a
          key="copy"
          onClick={() => {
            setCopyFrom(record.id);
            setTemplateId('');
          }}
        >
          {t('common.action.copy')}
        </a>,
        // 内置模板可以修改、复制、停用，不能删除
        ...(record.builtin
          ? []
          : [
              <DeleteConfirmLink
                key="delete"
                title={t('pages.ticket.template.delete.title')}
                description={t('pages.ticket.template.delete.description', {
                  name: record.name,
                })}
                onConfirm={async () => {
                  await deleteTemplate(record.id);
                  message.success(t('common.msg.deleted'));
                  reload();
                }}
              />,
            ]),
      ],
    },
  ];

  return (
    <>
      <PageContainer title={false}>
        <ProTable<Row>
          cardBordered
          headerTitle={
            <Space>
              {canTemplate && (
                <CreateButton onClick={() => setTemplateId('')}>
                  {t('pages.ticket.template.create')}
                </CreateButton>
              )}
              {has('ticket.catalog.category') && (
                <Button onClick={() => setCategoryOpen(true)}>
                  {t('pages.ticket.category.title')}
                </Button>
              )}
            </Space>
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          scroll={{ x: 'max-content' }}
          request={async (params) => {
            const { items } = await listManagedCatalog();
            const list = items ?? [];
            setCategories(list);
            const keyword = String(params.keyword ?? '')
              .trim()
              .toLowerCase();
            const status =
              params.status === undefined || params.status === ''
                ? undefined
                : Number(params.status);
            const data = list
              .flatMap((category) =>
                (category.templates ?? []).map<Row>((item) => ({
                  ...item,
                  status: item.status ?? 0,
                  categoryName: category.name,
                })),
              )
              .filter(
                (row) =>
                  (!params.categoryId ||
                    row.categoryId === params.categoryId) &&
                  (status === undefined || row.status === status) &&
                  (!keyword || row.name.toLowerCase().includes(keyword)),
              );
            return { data, total: data.length, success: true };
          }}
        />
      </PageContainer>

      <CategoryDrawer
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        categories={categories}
        onChanged={reload}
      />

      <TemplateDrawer
        templateId={templateId}
        copyFrom={copyFrom}
        categories={categories}
        onClose={() => {
          setTemplateId(undefined);
          setCopyFrom(undefined);
        }}
        onSaved={reload}
      />
    </>
  );
};

export default Catalog;
