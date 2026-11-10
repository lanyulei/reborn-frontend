/**
 * 通知模块 biz 范围 UI 共享件：创建表单的 biz 字段、列表的 biz 列/筛选、
 * 运行表受限用户的渠道筛选兜底。语义与后端 service/notify/guard.go 一致：
 * 不限用户可任意填写/留空（缺省 default），受限用户只能在可管范围内选择且列表必填。
 */
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { ProFormSelect, ProFormText } from '@ant-design/pro-components';
import type { ColProps } from 'antd';
import type React from 'react';
import { useEffect } from 'react';
import type { BizScope } from '@/services/notify/hooks';
import type { NotifyChannel } from '@/services/notify/typings';

/** biz 标识格式（与 proto 校验一致） */
export const BIZ_ID_RULE = {
  pattern: /^[a-z0-9_-]{1,64}$/,
  message: '1-64 位小写字母/数字/下划线/连字符',
};

/**
 * 创建表单的「业务」字段（name=bizId）：受限用户为范围内单选（必填），
 * 不限用户为可选文本（留空 = default）。biz 创建后不可改，编辑表单不渲染此字段。
 */
export const BizIdFormField: React.FC<{
  scope: BizScope;
  /** grid 布局下的栅格占位（与相邻字段同行时传入） */
  colProps?: ColProps;
}> = ({ scope, colProps }) =>
  scope.restricted ? (
    <ProFormSelect
      name="bizId"
      label="业务"
      colProps={colProps}
      tooltip="仅可在角色授予的通知业务范围内创建"
      options={scope.bizIds.map((bizId) => ({ label: bizId, value: bizId }))}
      rules={[{ required: true, message: '请选择业务' }]}
    />
  ) : (
    <ProFormText
      name="bizId"
      label="业务"
      colProps={colProps}
      tooltip="业务租户标识，按 biz 隔离路由/配额/模板解析；留空 = default"
      placeholder="留空 = default"
      rules={[BIZ_ID_RULE]}
    />
  );

/**
 * 编辑表单的「业务」只读展示（biz 创建后不可改）：与创建表单占位一致，
 * 保持两列栅格对齐，同时让操作者明确当前对象归属。无 name，不参与提交。
 */
export const BizIdReadonlyField: React.FC<{
  bizId: string;
  colProps?: ColProps;
}> = ({ bizId, colProps }) => (
  <ProFormText
    label="业务"
    colProps={colProps}
    disabled
    tooltip="业务租户标识，创建后不可修改"
    fieldProps={{ value: bizId }}
  />
);

/**
 * 列表「业务」列 + 筛选项（dataIndex=bizId）：受限用户为范围内单选、必填且
 * 默认取首项（首屏即带 biz 查询，避免 NOTIFY_BIZ_REQUIRED）；不限用户为可选文本。
 */
export function bizIdColumn<T extends { bizId: string }>(
  scope: BizScope,
): ProColumns<T> {
  const base: ProColumns<T> = {
    title: '业务',
    dataIndex: 'bizId',
    width: 110,
    ellipsis: true,
  };
  if (scope.restricted) {
    return {
      ...base,
      valueType: 'select',
      initialValue: scope.defaultBizId,
      fieldProps: {
        allowClear: false,
        options: scope.bizIds.map((bizId) => ({ label: bizId, value: bizId })),
      },
      formItemProps: { rules: [{ required: true, message: '请选择业务' }] },
    };
  }
  return {
    ...base,
    fieldProps: { placeholder: '业务标识（精确）' },
  };
}

/**
 * 运行表（任务/明细/死信无 biz 列）受限用户的渠道筛选兜底：后端要求必须带
 * channel_id，渠道选项异步加载完成后若筛选为空则自动选中首个并重新查询。
 * 调用方在 request 中对「受限 && 无 channelId」直接返回空结果，避免首屏 400。
 */
export const useRequiredChannelFilter = (
  restricted: boolean,
  channels: NotifyChannel[],
  formRef: React.RefObject<ProFormInstance | undefined>,
  actionRef: React.RefObject<ActionType | undefined | null>,
) => {
  useEffect(() => {
    if (!restricted || !channels.length) return;
    if (formRef.current?.getFieldValue('channelId')) return;
    formRef.current?.setFieldValue('channelId', channels[0].id);
    actionRef.current?.reload();
  }, [restricted, channels, formRef, actionRef]);
};
