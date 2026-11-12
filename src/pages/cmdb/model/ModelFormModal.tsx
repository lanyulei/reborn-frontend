/**
 * 模型新建 / 编辑弹窗：图标用 IconPicker 网格选择（替换自由文本），
 * 分组下拉来自分组接口（含降级推导的分组）。
 */
import {
  ModalForm,
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App } from 'antd';
import type React from 'react';
import { createModel, updateModel } from '@/services/cmdb/model';
import type { CmdbModel, CmdbModelStatus } from '@/services/cmdb/typings';
import { useFormRules, useOptions, useSubmitter, useT } from '@/utils/i18n';
import { IconPicker } from '../components/icons';
import {
  CMDB_MODEL_STATUS_META,
  CMDB_MODEL_STATUS_ORDER,
} from '../components/meta';
import type { CatalogGroup } from '../components/useCatalog';

const CODE_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;

interface ModelFormValues {
  code: string;
  name: string;
  category: string;
  icon?: string;
  description?: string;
  status?: CmdbModelStatus;
}

export const ModelFormModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CatalogGroup[];
  /** 编辑目标；缺省新建 */
  model?: CmdbModel;
  /** 新建时预选的分组；缺省首个分组 */
  defaultGroup?: string;
  onSuccess: (model: CmdbModel) => void;
}> = ({ open, onOpenChange, groups, model, defaultGroup, onSuccess }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const statusOptions = useOptions(
    CMDB_MODEL_STATUS_META,
    CMDB_MODEL_STATUS_ORDER,
  );
  const editing = !!model;
  const groupOptions = groups.map((g) => ({
    label: g.name,
    value: g.code,
  }));

  return (
    <ModalForm<ModelFormValues>
      key={
        model
          ? `edit-model-${model.code}`
          : `create-model-${defaultGroup ?? ''}`
      }
      title={
        model
          ? t('pages.cmdb.model.edit.title', { name: model.name })
          : t('pages.cmdb.model.create.title')
      }
      width={560}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true }}
      initialValues={
        model
          ? {
              code: model.code,
              name: model.name,
              category: model.category,
              icon: model.icon,
              description: model.description,
              status: model.status,
            }
          : { category: defaultGroup ?? groups[0]?.code ?? 'compute' }
      }
      submitter={editing ? submitter.save : submitter.create}
      onFinish={async (values) => {
        if (model) {
          const { model: saved } = await updateModel(model.code, {
            name: values.name,
            category: values.category,
            icon: values.icon ?? '',
            description: values.description ?? '',
            status: values.status,
          });
          message.success(t('common.msg.saved'));
          onSuccess(saved);
          return true;
        }
        const { model: saved } = await createModel({
          code: values.code,
          name: values.name,
          category: values.category,
          icon: values.icon || undefined,
          description: values.description || undefined,
        });
        message.success(t('common.msg.created'));
        onSuccess(saved);
        return true;
      }}
    >
      <ProFormText
        name="code"
        label={t('pages.cmdb.model.column.code')}
        placeholder={t('pages.cmdb.model.form.code.placeholder')}
        disabled={editing}
        rules={
          editing
            ? []
            : [
                rules.required(t('pages.cmdb.model.column.code')),
                {
                  pattern: CODE_PATTERN,
                  message: t('pages.cmdb.model.form.code.pattern'),
                },
              ]
        }
      />
      <ProFormText
        name="name"
        label={t('pages.cmdb.model.column.name')}
        rules={[
          rules.required(t('pages.cmdb.model.column.name')),
          rules.max(64),
        ]}
      />
      <ProFormSelect
        name="category"
        label={t('pages.cmdb.model.column.category')}
        options={groupOptions}
        allowClear={false}
      />
      {editing && (
        <ProFormSelect
          name="status"
          label={t('common.column.status')}
          options={statusOptions}
          allowClear={false}
        />
      )}
      <ProForm.Item
        name="icon"
        label={t('pages.cmdb.model.column.icon')}
        tooltip={t('pages.cmdb.model.form.icon.tooltip')}
      >
        <IconPicker />
      </ProForm.Item>
      <ProFormTextArea
        name="description"
        label={t('pages.cmdb.model.column.description')}
        rules={[rules.max(512)]}
      />
    </ModalForm>
  );
};
