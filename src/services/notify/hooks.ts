/**
 * notify 模块共享 hooks：
 * - useBizScope：当前操作者的通知 biz 范围（来自 /api/v1/me，随登录态初始化）；
 * - useChannelOptions：渠道选项加载（路由表单选渠道、事件链路页渠道筛选与
 *   名称映射共用），按 biz 范围取数——受限用户逐 biz 拉取后合并，不限用户一次拉取。
 */
import { useModel } from '@umijs/max';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NOTIFY_CHANNEL_TYPE_META } from '@/constants';
import { useEnumText, useT } from '@/utils/i18n';
import { listChannels } from './channel';
import type { NotifyChannel } from './typings';

/** 后端缺省业务租户标识（请求不带 biz_id 时服务端落到此值） */
export const DEFAULT_BIZ_ID = 'default';

export interface BizScope {
  /** 受限：列表查询必须携带 biz（运行表带 channel_id）过滤，创建/读写须在范围内 */
  restricted: boolean;
  /** 可管理的 biz 列表（受限时非空、字典序；不限时为空） */
  bizIds: string[];
  /** 表单/筛选缺省 biz：受限取范围首项，不限取服务端缺省 default */
  defaultBizId: string;
}

/**
 * 当前操作者的通知 biz 范围：超管或任一启用角色 scope 为空即不限（行为与
 * 引入 biz 范围前一致）；/me 未下发 bizUnrestricted 时按不限处理（向后兼容）。
 */
export const useBizScope = (): BizScope => {
  const { initialState } = useModel('@@initialState');
  const isAdmin = initialState?.currentUser?.isAdmin === true;
  const unrestricted = isAdmin || initialState?.bizUnrestricted !== false;
  const scope = initialState?.bizScope ?? [];

  return useMemo(() => {
    const bizIds = unrestricted ? [] : scope;
    return {
      restricted: !unrestricted && bizIds.length > 0,
      bizIds,
      defaultBizId: bizIds[0] ?? DEFAULT_BIZ_ID,
    };
  }, [unrestricted, scope]);
};

/**
 * 渠道选项：按操作者 biz 范围加载（每 biz 首页 ≤100 条）；无 notify.channel
 * 权限或失败时静默降级为空，调用方回退展示原始 ID。
 */
export const useChannelOptions = () => {
  const { restricted, bizIds } = useBizScope();
  const t = useT();
  const channelTypeText = useEnumText(NOTIFY_CHANNEL_TYPE_META);
  const [channels, setChannels] = useState<NotifyChannel[]>([]);
  // 依赖以稳定字符串表达，避免数组引用变化重复拉取
  const bizKey = bizIds.join(',');

  /** 渠道下拉选项（名称 + 类型，便于同名多渠道区分） */
  const toOption = useCallback(
    (channel: NotifyChannel) => ({
      label: t('pages.notify.common.channelOption', {
        name: channel.name,
        type: channelTypeText(channel.type),
      }),
      value: channel.id,
    }),
    [t, channelTypeText],
  );

  useEffect(() => {
    let disposed = false;
    const queries = restricted
      ? bizKey.split(',').map((bizId) => listChannels({ page: 1, pageSize: 100, bizId }))
      : [listChannels({ page: 1, pageSize: 100 })];
    Promise.all(queries)
      .then((results) => {
        if (!disposed) setChannels(results.flatMap((result) => result.items ?? []));
      })
      .catch(() => {
        if (!disposed) setChannels([]);
      });
    return () => {
      disposed = true;
    };
  }, [restricted, bizKey]);

  return useMemo(
    () => ({
      channels,
      /** 全部渠道的下拉选项 */
      options: channels.map(toOption),
      /** 指定 biz 下的渠道选项（路由 channel_ids 须与路由同 biz） */
      optionsOf: (bizId: string) =>
        channels.filter((channel) => channel.bizId === bizId).map(toOption),
      /** 渠道 ID → 名称（加载前/未命中回退原始 ID） */
      nameOf: (id: string) =>
        channels.find((channel) => channel.id === id)?.name ?? id,
    }),
    [channels, toOption],
  );
};
