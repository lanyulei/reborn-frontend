/**
 * 知识空间列表：可见空间及自己的权限级别；新建 / 编辑 / 权限（ACL）/ 删除（仍有文档时后端拒绝）。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import { App, Form, Space, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  createSpace,
  deleteSpace,
  listSpaces,
  type SaveSpaceParams,
  updateSpace,
} from '@/services/knowledge/space';
import type { KnowledgeSpace } from '@/services/knowledge/typings';
import { usePermissions } from '@/services/system/permissions';
import {
  useEnumText,
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
} from '@/utils/i18n';
import {
  LEVEL_META,
  SPACE_TYPE_META,
  SPACE_TYPE_ORDER,
  spacePath,
  VISIBILITY_META,
  VISIBILITY_ORDER,
} from '../components/meta';
import { OwnerSelect } from '../components/selectors';
import { useKnowledgeStyles } from '../components/styles';
import { AclDrawer } from './AclDrawer';

const SpaceList: React.FC = () => {
  const t = useT();
  const { message } = App.useApp();
  const has = usePermissions();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { styles } = useKnowledgeStyles();
  const actionRef = useRef<ActionType>(null);
  const typeText = useEnumText(SPACE_TYPE_META);
  const typeOptions = useOptions(SPACE_TYPE_META, SPACE_TYPE_ORDER);
  const visibilityText = useEnumText(VISIBILITY_META);
  const visibilityOptions = useOptions(VISIBILITY_META, VISIBILITY_ORDER);
  const levelText = useEnumText(LEVEL_META);
  // undefined = 弹窗关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<KnowledgeSpace | null | undefined>(
    undefined,
  );
  const [aclRow, setAclRow] = useState<KnowledgeSpace | null>(null);

  const reload = () => actionRef.current?.reload();
  const canManageSpace = has('knowledge.space');

  const columns: ProColumns<KnowledgeSpace>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.knowledge.space.searchPlaceholder') },
    },
    {
      title: t('pages.knowledge.space.column.name'),
      dataIndex: 'name',
      search: false,
      ellipsis: true,
      render: (_, row) => (
        <div>
          <Link to={spacePath(row.id)}>{row.name}</Link>
          <div className={styles.hint}>
            {row.code}
            {row.description ? ` · ${row.description}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: t('pages.knowledge.space.column.type'),
      dataIndex: 'type',
      valueType: 'select',
      width: 110,
      fieldProps: { options: typeOptions },
      render: (_, row) => typeText(row.type),
    },
    {
      title: t('pages.knowledge.space.column.visibility'),
      dataIndex: 'visibility',
      search: false,
      width: 90,
      render: (_, row) => visibilityText(row.visibility ?? 1),
    },
    {
      title: t('pages.knowledge.space.column.owner'),
      dataIndex: 'ownerName',
      search: false,
      width: 120,
      ellipsis: true,
    },
    {
      title: t('pages.knowledge.space.column.documentCount'),
      dataIndex: 'documentCount',
      search: false,
      width: 90,
      render: (_, row) => row.documentCount ?? 0,
    },
    {
      title: t('pages.knowledge.space.column.policy'),
      search: false,
      width: 220,
      render: (_, row) => (
        <Space size={4} wrap>
          {row.reviewRequired && (
            <Tag color="processing">
              {t('pages.knowledge.space.reviewRequired')}
            </Tag>
          )}
          {row.reviewDays ? (
            <Tag>
              {t('pages.knowledge.space.reviewDaysTag', {
                days: row.reviewDays,
              })}
            </Tag>
          ) : null}
          {row.embeddingEnabled === false && (
            <Tag>{t('pages.knowledge.space.noEmbedding')}</Tag>
          )}
          {!row.reviewRequired &&
            !row.reviewDays &&
            row.embeddingEnabled !== false &&
            t('common.empty')}
        </Space>
      ),
    },
    {
      title: t('pages.knowledge.space.column.level'),
      dataIndex: 'level',
      search: false,
      width: 90,
      render: (_, row) => <Tag color="blue">{levelText(row.level ?? 0)}</Tag>,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 180,
      render: (_, row) => {
        const manage = (row.level ?? 0) >= 3 && canManageSpace;
        return [
          <Link key="enter" to={spacePath(row.id)}>
            {t('pages.knowledge.space.enter')}
          </Link>,
          manage && (
            <a key="edit" onClick={() => setFormRow(row)}>
              {t('common.action.edit')}
            </a>
          ),
          manage && (
            <a key="acl" onClick={() => setAclRow(row)}>
              {t('pages.knowledge.space.acl')}
            </a>
          ),
          manage && (
            <DeleteConfirmLink
              key="delete"
              title={t('pages.knowledge.space.deleteTitle', {
                name: row.name,
              })}
              description={t('pages.knowledge.space.deleteDesc')}
              onConfirm={async () => {
                await deleteSpace(row.id);
                message.success(t('pages.knowledge.msg.deleted'));
                reload();
              }}
            />
          ),
        ];
      },
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<KnowledgeSpace>
        cardBordered
        headerTitle={
          canManageSpace && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.knowledge.space.create')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        columnEmptyText={t('common.empty')}
        pagination={false}
        search={{ labelWidth: 'auto' }}
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          const res = await listSpaces({
            keyword: params.keyword?.trim() || undefined,
            type: params.type,
          });
          return { data: res.items ?? [], success: true };
        }}
      />

      {formRow !== undefined && (
        <ModalForm<SaveSpaceParams>
          title={t(
            formRow
              ? 'pages.knowledge.space.edit'
              : 'pages.knowledge.space.create',
          )}
          width={640}
          open
          onOpenChange={(open) => {
            if (!open) setFormRow(undefined);
          }}
          modalProps={{ destroyOnHidden: true }}
          submitter={formRow ? submitter.save : submitter.create}
          initialValues={
            formRow
              ? {
                  code: formRow.code,
                  name: formRow.name,
                  type: formRow.type,
                  visibility: formRow.visibility ?? 1,
                  ownerId: formRow.ownerId,
                  description: formRow.description,
                  reviewRequired: formRow.reviewRequired ?? false,
                  reviewDays: formRow.reviewDays ?? 0,
                  embeddingEnabled: formRow.embeddingEnabled ?? true,
                }
              : {
                  type: 'general',
                  visibility: 1,
                  embeddingEnabled: true,
                  reviewRequired: false,
                  reviewDays: 0,
                }
          }
          onFinish={async (values) => {
            const body: SaveSpaceParams = {
              ...values,
              name: values.name?.trim(),
              description: values.description?.trim(),
            };
            if (formRow) {
              await updateSpace(formRow.id, body);
              message.success(t('pages.knowledge.msg.updated'));
            } else {
              await createSpace(body);
              message.success(t('pages.knowledge.msg.created'));
            }
            reload();
            return true;
          }}
        >
          <SectionTitle style={{ marginTop: 0 }}>
            {t('pages.knowledge.space.section.basic')}
          </SectionTitle>
          <ProFormText
            name="code"
            label={t('pages.knowledge.space.form.code')}
            tooltip={t('pages.knowledge.space.form.codeTip')}
            disabled={!!formRow}
            rules={
              formRow
                ? undefined
                : [
                    rules.required(t('pages.knowledge.space.form.code')),
                    {
                      pattern: /^[a-z0-9][a-z0-9-]{1,63}$/,
                      message: t('pages.knowledge.space.form.codePattern'),
                    },
                  ]
            }
          />
          <ProFormText
            name="name"
            label={t('pages.knowledge.space.column.name')}
            rules={[
              rules.required(t('pages.knowledge.space.column.name')),
              rules.maxChars(128),
            ]}
            fieldProps={{ maxLength: 128, showCount: true }}
          />
          <ProFormSelect
            name="type"
            label={t('pages.knowledge.space.column.type')}
            options={typeOptions}
            rules={[rules.select(t('pages.knowledge.space.column.type'))]}
          />
          <ProFormSelect
            name="visibility"
            label={t('pages.knowledge.space.column.visibility')}
            options={visibilityOptions}
            tooltip={t('pages.knowledge.space.form.visibilityTip')}
            rules={[rules.select(t('pages.knowledge.space.column.visibility'))]}
          />
          <Form.Item
            name="ownerId"
            label={t('pages.knowledge.space.column.owner')}
          >
            <OwnerSelect
              known={
                formRow?.ownerName
                  ? [{ id: formRow.ownerId, label: formRow.ownerName }]
                  : undefined
              }
            />
          </Form.Item>
          <ProFormTextArea
            name="description"
            label={t('pages.knowledge.space.form.description')}
            fieldProps={{ rows: 2, maxLength: 1000, showCount: true }}
          />
          <SectionTitle>
            {t('pages.knowledge.space.section.policy')}
          </SectionTitle>
          <ProFormSwitch
            name="reviewRequired"
            label={t('pages.knowledge.space.reviewRequired')}
            tooltip={t('pages.knowledge.space.form.reviewRequiredTip')}
          />
          <ProFormDigit
            name="reviewDays"
            label={t('pages.knowledge.space.form.reviewDays')}
            tooltip={t('pages.knowledge.space.form.reviewDaysTip')}
            min={0}
            max={3650}
            fieldProps={{ precision: 0 }}
          />
          <ProFormSwitch
            name="embeddingEnabled"
            label={t('pages.knowledge.space.form.embedding')}
            tooltip={t('pages.knowledge.space.form.embeddingTip')}
          />
        </ModalForm>
      )}

      <AclDrawer space={aclRow} onClose={() => setAclRow(null)} />
    </PageContainer>
  );
};

export default SpaceList;
