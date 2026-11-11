/**
 * 国际化工具：在 Umi locale 插件之上提供两件事——
 * 1. `t` / `useT`：按 id 取文案，缺键时回落 zh-CN（而非显示裸键名），切换语言时
 *    某条翻译缺失也不会破坏界面；
 * 2. 枚举元数据 → ProTable valueEnum / 选项 / 文案 的 hook，使 `src/constants`
 *    只保存结构与 i18n 键、不再内嵌中文。
 */
import type { ProColumns } from '@ant-design/pro-components';
import { getIntl, useIntl } from '@umijs/max';
import { useCallback, useMemo } from 'react';
import { PASSWORD_LENGTH } from '@/constants';
import zhCN from '@/locales/zh-CN';

const FALLBACK = zhCN as Record<string, string>;

export type I18nValues = Record<
  string,
  string | number | boolean | null | undefined
>;

export type Translate = (id: string, values?: I18nValues) => string;

/** 组件外使用（app.tsx / requestErrorConfig / 非 hook 工具）；渲染期请用 useT */
export const t: Translate = (id, values) =>
  getIntl().formatMessage(
    { id, defaultMessage: FALLBACK[id] },
    values,
  ) as string;

/** 组件内使用；返回函数引用随当前语言变化，可安全作为 useMemo 依赖 */
export const useT = (): Translate => {
  const intl = useIntl();
  return useCallback<Translate>(
    (id, values) =>
      intl.formatMessage(
        { id, defaultMessage: FALLBACK[id] },
        values,
      ) as string,
    [intl],
  );
};

/** ProColumns valueEnum 徽标状态（含进行中，与 ProSchema 值枚举一致） */
export type ProBadgeStatus =
  | 'Success'
  | 'Processing'
  | 'Error'
  | 'Default'
  | 'Warning';

/** 枚举元数据项：文案以 i18n 键表达，status 为 valueEnum 徽标 */
export interface EnumMetaItem {
  textId: string;
  status?: ProBadgeStatus;
}

export type EnumMeta<K extends PropertyKey = PropertyKey> = Record<
  K,
  EnumMetaItem
>;

export type ValueEnum = NonNullable<ProColumns['valueEnum']>;

/** 元数据 → ProTable valueEnum（表格筛选 + 展示），文案随当前语言 */
export const useValueEnum = <K extends PropertyKey>(
  meta: EnumMeta<K>,
): ValueEnum => {
  const tr = useT();
  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(meta as Record<string, EnumMetaItem>).map(
          ([key, item]) => [
            key,
            { text: tr(item.textId), status: item.status },
          ],
        ),
      ),
    [meta, tr],
  );
};

/** 元数据 → 取单个枚举值文案的函数（Tag / 列 render 等） */
export const useEnumText = <K extends PropertyKey>(
  meta: Record<K, { textId: string }>,
) => {
  const tr = useT();
  return useCallback((key: K) => tr(meta[key].textId), [meta, tr]);
};

/** 元数据 + 顺序 → 表单选项 `{ label, value }` */
export const useOptions = <K extends string | number>(
  meta: Record<K, { textId: string }>,
  order: readonly K[],
) => {
  const tr = useT();
  return useMemo(
    () => order.map((value) => ({ value, label: tr(meta[value].textId) })),
    [meta, order, tr],
  );
};

/**
 * 常用表单校验规则（文案随当前语言）：
 * required/select 以字段标签拼装提示；长度类规则直接给定上限。
 */
export const useFormRules = () => {
  const t = useT();
  return useMemo(
    () => ({
      required: (label: string) => ({
        required: true,
        message: t('common.validation.required', { label }),
      }),
      select: (label: string) => ({
        required: true,
        message: t('common.validation.select', { label }),
      }),
      max: (max: number) => ({
        max,
        message: t('common.validation.maxLength', { max }),
      }),
      maxChars: (max: number) => ({
        max,
        message: t('common.validation.maxChars', { max }),
      }),
      lengthRange: (min: number, max: number) => ({
        min,
        max,
        message: t('common.validation.lengthRange', { min, max }),
      }),
      email: () => ({
        type: 'email' as const,
        message: t('common.validation.email'),
      }),
      passwordLength: () => ({
        ...PASSWORD_LENGTH,
        message: t('common.validation.passwordLength', PASSWORD_LENGTH),
      }),
    }),
    [t],
  );
};

/** 新建 / 编辑表单的 submitter 文案组合（创建·取消 / 保存·取消） */
export const useSubmitter = () => {
  const t = useT();
  return useMemo(
    () => ({
      create: {
        searchConfig: {
          submitText: t('common.action.submitCreate'),
          resetText: t('common.action.cancel'),
        },
      },
      save: {
        searchConfig: {
          submitText: t('common.action.save'),
          resetText: t('common.action.cancel'),
        },
      },
    }),
    [t],
  );
};
