/**
 * 工单分类管理抽屉：分类列表 + 新建 / 编辑 / 删除。分类是服务目录的一级，
 * 其下仍有模板时不能删除（后端拒绝）。
 */
import {
  ModalForm,
  ProFormDigit,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Drawer } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/services/ticket';
import type { TicketCategory } from '@/services/ticket/typings';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';

const NAME_MAX = 64;
const DESCRIPTION_MAX = 255;
const SORT_MAX = 9999;

interface CategoryValues {
  name: string;
  description?: string;
  sort?: number;
}

const useStyles = createStyles(({ css }) => ({
  /** 「新建分类」所在的工具栏：紧贴抽屉顶部，不再留上内边距 */
  table: css`
    .ant-pro-table-list-toolbar-container {
      padding-top: 0;
    }
  `,
}));

export const CategoryDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  categories: readonly TicketCategory[];
  /** 分类有变化后回调（重新加载目录） */
  onChanged: () => void;
}> = ({ open, onClose, categories, onChanged }) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  /** 正在编辑的分类；null = 新建；undefined = 弹窗关闭 */
  const [editing, setEditing] = useState<TicketCategory | null>();

  return (
    <Drawer
      title={t('pages.ticket.category.title')}
      size={720}
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      <ProTable<TicketCategory>
        className={styles.table}
        rowKey="id"
        search={false}
        options={false}
        pagination={false}
        ghost
        headerTitle={
          <CreateButton onClick={() => setEditing(null)}>
            {t('pages.ticket.category.create')}
          </CreateButton>
        }
        dataSource={[...categories]}
        columns={[
          {
            title: t('pages.ticket.category.name'),
            dataIndex: 'name',
            ellipsis: true,
          },
          {
            title: t('pages.ticket.column.description'),
            dataIndex: 'description',
            ellipsis: true,
          },
          {
            title: t('pages.ticket.category.templates'),
            width: 90,
            renderText: (_, record) => record.templates?.length ?? 0,
          },
          {
            title: t('pages.ticket.column.sort'),
            dataIndex: 'sort',
            width: 80,
            renderText: (_, record) => record.sort ?? 0,
          },
          {
            title: t('common.column.action'),
            valueType: 'option',
            width: 110,
            render: (_, record) => [
              <a key="edit" onClick={() => setEditing(record)}>
                {t('common.action.edit')}
              </a>,
              <DeleteConfirmLink
                key="delete"
                title={t('pages.ticket.category.delete.title')}
                description={t('pages.ticket.category.delete.description', {
                  name: record.name,
                })}
                onConfirm={async () => {
                  await deleteCategory(record.id);
                  message.success(t('common.msg.deleted'));
                  onChanged();
                }}
              />,
            ],
          },
        ]}
      />

      {editing !== undefined && (
        <ModalForm<CategoryValues>
          key={editing?.id ?? 'create-category'}
          title={t(
            editing
              ? 'pages.ticket.category.edit'
              : 'pages.ticket.category.create',
          )}
          width={480}
          open
          onOpenChange={(next) => {
            if (!next) setEditing(undefined);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{
            name: editing?.name,
            description: editing?.description ?? '',
            sort: editing?.sort ?? 0,
          }}
          submitter={editing ? submitter.save : submitter.create}
          onFinish={async (values) => {
            const body = {
              name: values.name.trim(),
              description: values.description ?? '',
              sort: values.sort ?? 0,
            };
            if (editing) await updateCategory(editing.id, body);
            else await createCategory(body);
            message.success(
              t(editing ? 'common.msg.saved' : 'common.msg.created'),
            );
            onChanged();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.ticket.category.name')}
            rules={[
              {
                required: true,
                whitespace: true,
                message: t('common.validation.required', {
                  label: t('pages.ticket.category.name'),
                }),
              },
              rules.max(NAME_MAX),
            ]}
          />
          <ProFormDigit
            name="sort"
            label={t('pages.ticket.column.sort')}
            tooltip={t('pages.ticket.form.sort.tooltip')}
            min={0}
            max={SORT_MAX}
            fieldProps={{ precision: 0 }}
          />
          <ProFormTextArea
            name="description"
            label={t('pages.ticket.column.description')}
            fieldProps={{
              maxLength: DESCRIPTION_MAX,
              showCount: true,
              autoSize: { minRows: 2, maxRows: 4 },
            }}
          />
        </ModalForm>
      )}
    </Drawer>
  );
};

export default CategoryDrawer;
