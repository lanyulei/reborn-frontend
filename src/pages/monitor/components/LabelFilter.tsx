/**
 * 列表搜索表单里的「标签筛选」项（告警事件、告警规则共用）：输入若干 name=value，回车成项。
 * 不合法的项在表单项内报错并阻止查询，而不是悄悄丢掉。所在 ProTable 须设
 * `form={{ ignoreRules: false }}`（ProTable 的搜索表单默认忽略校验规则）。
 */
import type { ProColumns } from '@ant-design/pro-components';
import { Select } from 'antd';
import type { Translate } from '@/utils/i18n';
import { parseLabelFilters } from './format';
import { LABEL_FILTER_REGEX, MONITOR_LIMITS } from './meta';

export const labelFilterSearch = <T,>(
  t: Translate,
  placeholder: string,
): Pick<ProColumns<T>, 'formItemProps' | 'formItemRender'> => ({
  formItemProps: {
    rules: [
      {
        validator: (_: unknown, value?: string[]) =>
          parseLabelFilters(value).every((item) =>
            LABEL_FILTER_REGEX.test(item),
          )
            ? Promise.resolve()
            : Promise.reject(new Error(t('pages.monitor.labelFilter.invalid'))),
      },
    ],
  },
  // 不要给返回的元素传 value / onChange：搜索表单会把字段的 value / onChange 注入进来，而元素上
  // 显式写出的属性（哪怕是 undefined——回调参数里并没有 onChange）会盖掉注入的，结果是控件
  // 看起来能选，值却进不了查询参数。
  formItemRender: () => (
    <Select
      mode="tags"
      open={false}
      suffix={null}
      maxCount={MONITOR_LIMITS.labelFilterMax}
      tokenSeparators={[',', ' ']}
      placeholder={placeholder}
    />
  ),
});
