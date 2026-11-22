/**
 * 空间权限抽屉：整组编辑 ACL（主体类型 角色 / 用户，级别 读 / 写 / 管理），保存即整组替换。
 */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Drawer,
  Flex,
  Form,
  Select,
  Space,
  Spin,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { getSpaceAcl, setSpaceAcl } from '@/services/knowledge/space';
import type {
  KnowledgeAclEntry,
  KnowledgeLevel,
  KnowledgeSpace,
  KnowledgeSubjectType,
} from '@/services/knowledge/typings';
import { listRoles } from '@/services/system/role';
import { useOptions, useT } from '@/utils/i18n';
import { ACL_LEVEL_ORDER, LEVEL_META } from '../components/meta';
import { OwnerSelect } from '../components/selectors';

interface AclRow {
  subjectType: KnowledgeSubjectType;
  subjectId?: string;
  subjectName?: string;
  level: KnowledgeLevel;
}

export const AclDrawer: React.FC<{
  space: KnowledgeSpace | null;
  onClose: () => void;
}> = ({ space, onClose }) => {
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<{ items: AclRow[] }>();
  const [loading, setLoading] = useState(false);
  // 只有本次 ACL 成功加载后才允许保存，避免把空表单整组覆盖到后端
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);
  const levelOptions = useOptions(LEVEL_META, ACL_LEVEL_ORDER);
  const subjectOptions = [
    { value: 'role', label: t('pages.knowledge.acl.subject.role') },
    { value: 'user', label: t('pages.knowledge.acl.subject.user') },
  ];

  useEffect(() => {
    form.resetFields();
    setLoaded(false);
    if (!space) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getSpaceAcl(space.id),
      listRoles({ page: 1, pageSize: 100 }, { silent: true }).catch(() => ({
        items: [],
      })),
    ])
      .then(([acl, roleRes]) => {
        if (cancelled) return;
        form.setFieldsValue({ items: (acl.items ?? []) as AclRow[] });
        setRoles(
          (roleRes.items ?? []).map((r) => ({ value: r.id, label: r.name })),
        );
        setLoaded(true);
      })
      .catch(() => {
        // 域级 request 已提示；保持 loaded=false，保存按钮不可用
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [space, form]);

  const save = async () => {
    if (!space) return;
    const { items } = await form.validateFields();
    const payload: Omit<KnowledgeAclEntry, 'subjectName'>[] = (items ?? [])
      .filter((row) => row.subjectId)
      .map((row) => ({
        subjectType: row.subjectType,
        subjectId: row.subjectId as string,
        level: row.level,
      }));
    setSaving(true);
    try {
      await setSpaceAcl(space.id, payload);
      message.success(t('pages.knowledge.msg.updated'));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={space ? t('pages.knowledge.acl.title', { name: space.name }) : ''}
      open={!!space}
      onClose={onClose}
      size={640}
      destroyOnHidden
      extra={
        <Button
          type="primary"
          loading={saving}
          disabled={loading || !loaded}
          onClick={save}
        >
          {t('common.action.save')}
        </Button>
      }
    >
      <Spin spinning={loading}>
        <Alert
          type="info"
          showIcon
          title={t('pages.knowledge.acl.hint')}
          style={{ marginBottom: 16 }}
        />
        <Form form={form} initialValues={{ items: [] }}>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <Flex vertical gap={8}>
                {fields.map((field) => (
                  <Space key={field.key} align="start" wrap>
                    <Form.Item
                      name={[field.name, 'subjectType']}
                      rules={[{ required: true }]}
                      style={{ marginBottom: 0, width: 100 }}
                    >
                      <Select
                        options={subjectOptions}
                        onChange={() =>
                          form.setFieldValue(
                            ['items', field.name, 'subjectId'],
                            undefined,
                          )
                        }
                      />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate>
                      {({ getFieldValue }) => {
                        const type = getFieldValue([
                          'items',
                          field.name,
                          'subjectType',
                        ]);
                        const name = getFieldValue([
                          'items',
                          field.name,
                          'subjectName',
                        ]);
                        const id = getFieldValue([
                          'items',
                          field.name,
                          'subjectId',
                        ]);
                        return (
                          <Form.Item
                            name={[field.name, 'subjectId']}
                            rules={[
                              {
                                required: true,
                                message: t(
                                  'pages.knowledge.acl.subjectRequired',
                                ),
                              },
                            ]}
                            style={{ marginBottom: 0, width: 260 }}
                          >
                            {type === 'role' ? (
                              <Select
                                showSearch={{ optionFilterProp: 'label' }}
                                options={roles}
                                placeholder={t(
                                  'pages.knowledge.acl.rolePlaceholder',
                                )}
                              />
                            ) : (
                              <OwnerSelect
                                known={
                                  id && name ? [{ id, label: name }] : undefined
                                }
                              />
                            )}
                          </Form.Item>
                        );
                      }}
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'level']}
                      rules={[{ required: true }]}
                      style={{ marginBottom: 0, width: 120 }}
                    >
                      <Select options={levelOptions} />
                    </Form.Item>
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                      aria-label={t('common.action.delete')}
                    />
                  </Space>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({ subjectType: 'user', level: 1 })}
                >
                  {t('pages.knowledge.acl.add')}
                </Button>
              </Flex>
            )}
          </Form.List>
        </Form>
      </Spin>
    </Drawer>
  );
};
