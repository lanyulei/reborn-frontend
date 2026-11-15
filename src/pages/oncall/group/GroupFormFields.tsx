/**
 * 分组表单字段（新建 / 编辑一致；列表页与详情页共用）。
 */
import { ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import type React from 'react';
import { useFormRules, useT } from '@/utils/i18n';
import { ONCALL_DESC_MAX, ONCALL_NAME_MAX } from '../components/meta';

export interface GroupFormValues {
  name: string;
  description?: string;
}

export const GroupFormFields: React.FC = () => {
  const t = useT();
  const rules = useFormRules();
  return (
    <>
      <ProFormText
        name="name"
        label={t('pages.oncall.group.column.name')}
        rules={[
          rules.required(t('pages.oncall.group.column.name')),
          rules.max(ONCALL_NAME_MAX),
        ]}
      />
      <ProFormTextArea
        name="description"
        label={t('pages.oncall.group.column.description')}
        fieldProps={{ rows: 3, maxLength: ONCALL_DESC_MAX, showCount: true }}
      />
    </>
  );
};
