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
import { useEffect, useMemo } from 'react';
import type { BizScope } from '@/services/notify/hooks';
import { useBizScope, useChannelOptions } from '@/services/notify/hooks';
import type { NotifyChannel } from '@/services/notify/typings';
import { useFormRules, useT } from '@/utils/i18n';

/** biz 标识格式（与 proto 校验一致）；校验文案见 pages.notify.common.bizIdRule */
export const BIZ_ID_PATTERN = /^[a-z0-9_-]{1,64}$/;

/**
 * 创建表单的「业务」字段（name=bizId）：受限用户为范围内单选（必填），
 * 不限用户为可选文本（留空 = default）。biz 创建后不可改，编辑表单不渲染此字段。
 */
export const BizIdFormField: React.FC<{
  scope: BizScope;
  /** grid 布局下的栅格占位（与相邻字段同行时传入） */
  colProps?: ColProps;
}> = ({ scope, colProps }) => {
  const t = useT();
  const rules = useFormRules();
  const label = t('pages.notify.common.biz');
  return scope.restricted ? (
    <ProFormSelect
      name="bizId"
      label={label}
      colProps={colProps}
      tooltip={t('pages.notify.common.biz.tooltip.restricted')}
      options={scope.bizIds.map((bizId) => ({ label: bizId, value: bizId }))}
      rules={[rules.select(label)]}
    />
  ) : (
    <ProFormText
      name="bizId"
      label={label}
      colProps={colProps}
      tooltip={t('pages.notify.common.biz.tooltip')}
      placeholder={t('pages.notify.common.biz.placeholder')}
      rules={[
        {
          pattern: BIZ_ID_PATTERN,
          message: t('pages.notify.common.bizIdRule'),
        },
      ]}
    />
  );
};

/**
 * 编辑表单的「业务」只读展示（biz 创建后不可改）：与创建表单占位一致，
 * 保持两列栅格对齐，同时让操作者明确当前对象归属。无 name，不参与提交。
 */
export const BizIdReadonlyField: React.FC<{
  bizId: string;
  colProps?: ColProps;
}> = ({ bizId, colProps }) => {
  const t = useT();
  return (
    <ProFormText
      label={t('pages.notify.common.biz')}
      colProps={colProps}
      disabled
      tooltip={t('pages.notify.common.biz.tooltip.readonly')}
      fieldProps={{ value: bizId }}
    />
  );
};

/**
 * 列表「业务」列 + 筛选项（dataIndex=bizId）：受限用户为范围内单选、必填且
 * 默认取首项（首屏即带 biz 查询，避免 NOTIFY_BIZ_REQUIRED）；不限用户为可选文本。
 * 以 hook 形式提供（列标题/文案随当前语言），在列定义处调用。
 */
export function useBizIdColumn<T extends { bizId: string }>(
  scope: BizScope,
): ProColumns<T> {
  const t = useT();
  const rules = useFormRules();
  const label = t('pages.notify.common.biz');
  const base: ProColumns<T> = {
    title: label,
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
      formItemProps: { rules: [rules.select(label)] },
    };
  }
  return {
    ...base,
    fieldProps: { placeholder: t('pages.notify.common.biz.filterPlaceholder') },
  };
}

/**
 * 运行表（任务/明细/死信无 biz 列）受限用户的渠道筛选兜底：后端要求必须带
 * channel_id，渠道选项异步加载完成后若筛选为空则自动选中首个并重新查询。
 */
const useRequiredChannelFilter = (
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

/**
 * 运行表「渠道」筛选列 + 受限守卫（任务 / 明细 / 死信共用，同一后端契约的三件事收口）：
 * - column：按渠道筛选（下拉随渠道选项异步加载更新），受限用户必选、不可清空；
 * - guard(params)：受限且未选渠道时为 true，调用方直接返回空结果，避免首屏 400
 *   （NOTIFY_BIZ_REQUIRED）；渠道选项加载后自动选中首个并重查；
 * - nameOf：渠道 ID → 名称，供其他列展示。
 */
export function useChannelFilter<T>(options: {
  /** 筛选框占位 i18n 键（如目标渠道 / 投递渠道） */
  placeholderId: string;
  formRef: React.RefObject<ProFormInstance | undefined>;
  actionRef: React.RefObject<ActionType | undefined | null>;
}) {
  const { placeholderId, formRef, actionRef } = options;
  const t = useT();
  const rules = useFormRules();
  const { restricted } = useBizScope();
  const { channels, options: channelOptions, nameOf } = useChannelOptions();
  useRequiredChannelFilter(restricted, channels, formRef, actionRef);

  const column = useMemo<ProColumns<T>>(
    () => ({
      title: t('pages.notify.common.channel'),
      dataIndex: 'channelId',
      ellipsis: true,
      render: (_, record) =>
        nameOf((record as { channelId: string }).channelId),
      valueType: 'select',
      // options 经 state 驱动：渠道列表异步加载完成后搜索下拉随之更新
      fieldProps: {
        showSearch: true,
        optionFilterProp: 'label',
        options: channelOptions,
        allowClear: !restricted,
        placeholder: t(placeholderId),
      },
      formItemProps: restricted
        ? { rules: [rules.select(t('pages.notify.common.channel'))] }
        : undefined,
    }),
    [t, rules, restricted, channelOptions, nameOf, placeholderId],
  );

  const guard = (params: Record<string, unknown>) =>
    restricted && !params.channelId;

  return { column, guard, nameOf };
}
