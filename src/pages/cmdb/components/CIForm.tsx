/**
 * 资源新建 / 编辑表单（右侧抽屉，两列栅格）：基础信息 + 按类型字段定义生成的属性项。
 * 传入 sections（详情布局）时属性按布局分组展示，与详情页一致；缺省平铺。
 * 编辑携带 version 做乐观锁；属性按键合并（空值清空）。
 */
import {
  DrawerForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { App, Col } from 'antd';
import type React from 'react';
import { Fragment, useMemo } from 'react';
import { createCI, updateCI } from '@/services/cmdb/ci';
import type { ViewSection } from '@/services/cmdb/model';
import type {
  CmdbCI,
  CmdbCIStatus,
  CmdbField,
  CmdbModel,
} from '@/services/cmdb/typings';
import { useFormRules, useOptions, useSubmitter, useT } from '@/utils/i18n';
import { CMDB_CI_STATUS_META } from './meta';
import { AttrFormItems, attrsToForm, formToAttrs } from './schema';
import { useCmdbStyles } from './styles';

interface CIFormValues {
  name: string;
  status?: Exclude<CmdbCIStatus, 'retired'>;
  env?: string;
  owner?: string;
  tags?: string[];
  externalId?: string;
  attrs?: Record<string, unknown>;
}

const CREATE_STATUSES: readonly Exclude<CmdbCIStatus, 'retired'>[] = [
  'planning',
  'active',
  'maintenance',
];

export const CIForm: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: CmdbModel;
  fields: CmdbField[];
  /** 详情布局（属性按分组展示；缺省平铺） */
  sections?: ViewSection[];
  /** 编辑目标；缺省新建 */
  ci?: CmdbCI;
  onSuccess: (ci: CmdbCI) => void;
}> = ({ open, onOpenChange, model, fields, sections, ci, onSuccess }) => {
  const t = useT();
  const { message } = App.useApp();
  const { styles } = useCmdbStyles();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const statusOptions = useOptions(CMDB_CI_STATUS_META, CREATE_STATUSES);
  const editing = !!ci;

  // 属性分组：按布局的 attrs 段；未入段的字段归「其他」；未配置布局时平铺
  const attrGroups = useMemo(() => {
    const active = fields.filter((f) => !f.deprecated);
    const attrsSections = (sections ?? []).filter((s) => s.type === 'attrs');
    if (attrsSections.length === 0)
      return [{ title: undefined as string | undefined, fields: active }];
    const grouped = attrsSections.map((s) => ({
      title: s.title || t('pages.cmdb.detail.section.attrs'),
      fields: (s.fields ?? [])
        .map((code) => active.find((f) => f.code === code))
        .filter((f): f is CmdbField => !!f),
    }));
    const inGroups = new Set(
      grouped.flatMap((g) => g.fields.map((f) => f.code)),
    );
    const rest = active.filter((f) => !inGroups.has(f.code));
    if (rest.length > 0)
      grouped.push({
        title: t('pages.cmdb.modelDetail.fields.otherGroup'),
        fields: rest,
      });
    return grouped;
  }, [sections, fields, t]);

  return (
    <DrawerForm<CIFormValues>
      key={ci ? `edit-${ci.id}-${ci.version}` : `create-${model.code}`}
      title={
        ci
          ? t('pages.cmdb.ci.edit.title', { name: ci.name })
          : t('pages.cmdb.ci.create.title', { model: model.name })
      }
      width={760}
      grid
      rowProps={{ gutter: 24 }}
      colProps={{ span: 12 }}
      open={open}
      onOpenChange={onOpenChange}
      drawerProps={{ destroyOnHidden: true }}
      submitter={editing ? submitter.save : submitter.create}
      initialValues={
        ci
          ? {
              name: ci.name,
              env: ci.env,
              owner: ci.owner,
              tags: ci.tags,
              externalId: ci.externalId,
              attrs: attrsToForm(fields, ci.attrs),
            }
          : { status: 'active', tags: [] }
      }
      onFinish={async (values) => {
        const attrs = formToAttrs(fields, values.attrs);
        if (ci) {
          const { ci: saved } = await updateCI(ci.id, {
            version: ci.version,
            name: values.name,
            env: values.env ?? '',
            owner: values.owner ?? '',
            tags: { items: values.tags ?? [] },
            externalId: values.externalId ?? '',
            attrs,
          });
          message.success(t('common.msg.saved'));
          onSuccess(saved);
          return true;
        }
        // 新建：空值不提交（后端全量校验必填）
        const created: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(attrs)) {
          if (v !== null) created[k] = v;
        }
        const { ci: saved } = await createCI({
          modelCode: model.code,
          name: values.name,
          status: values.status,
          env: values.env || undefined,
          owner: values.owner || undefined,
          tags: values.tags,
          externalId: values.externalId || undefined,
          attrs: created,
        });
        message.success(t('common.msg.created'));
        onSuccess(saved);
        return true;
      }}
    >
      <Col span={24}>
        <div className={styles.sectionTitle}>
          {t('pages.cmdb.detail.section.basic')}
        </div>
      </Col>
      <ProFormText
        name="name"
        label={t('pages.cmdb.ci.column.name')}
        rules={[rules.required(t('pages.cmdb.ci.column.name')), rules.max(128)]}
      />
      {!editing && (
        <ProFormSelect
          name="status"
          label={t('common.column.status')}
          options={statusOptions}
          allowClear={false}
        />
      )}
      <ProFormText
        name="env"
        label={t('pages.cmdb.ci.column.env')}
        rules={[rules.max(32)]}
      />
      <ProFormText
        name="owner"
        label={t('pages.cmdb.ci.column.owner')}
        rules={[rules.max(64)]}
      />
      <ProFormSelect
        name="tags"
        label={t('pages.cmdb.ci.column.tags')}
        fieldProps={{
          mode: 'tags',
          open: false,
          tokenSeparators: [',', ' '],
          placeholder: t('pages.cmdb.ci.form.tags.placeholder'),
        }}
      />
      <ProFormText
        name="externalId"
        label={t('pages.cmdb.ci.column.externalId')}
        rules={[rules.max(128)]}
      />
      {attrGroups.map((group, i) =>
        group.fields.length === 0 ? null : (
          <Fragment key={group.title ?? `attrs-${i}`}>
            <Col span={24}>
              <div className={styles.sectionTitle}>
                {group.title ?? t('pages.cmdb.detail.section.attrs')}
              </div>
            </Col>
            <AttrFormItems fields={group.fields} editing={editing} />
          </Fragment>
        ),
      )}
    </DrawerForm>
  );
};
