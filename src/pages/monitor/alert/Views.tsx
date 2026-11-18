/**
 * 聚合视图（活跃告警页签）：把当前的聚合方式与筛选条件存成个人或公共视图，之后一键套用。
 * 列表随菜单开放；保存 / 更新 / 删除要求「保存视图」元素权限，公共视图只有超级管理员能建、改、删
 * （后端按 canEdit 返回）。
 */
import { DownOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { App, Button, Dropdown, type MenuProps, Select, Tag } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  createAlertView,
  deleteAlertView,
  listAlertViews,
  updateAlertView,
} from '@/services/monitor/alertView';
import type {
  AlertViewFilter,
  MonitorAlertView,
} from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useT } from '@/utils/i18n';
import { useMonitorStyles } from '../components/styles';
import { ALERT_LIMITS } from './meta';

/** 当前的聚合方式与筛选条件；by 为空 = 没有选聚合方式（不能保存） */
export interface CurrentView {
  by?: string;
  filters: AlertViewFilter;
}

export const AlertViewBar: React.FC<{
  isAdmin: boolean;
  /** 当前套用的视图 */
  activeId?: string;
  onActiveChange: (id?: string) => void;
  /** 套用视图：把它的聚合方式与筛选条件带进页面 */
  onApply: (view: MonitorAlertView) => void;
  getCurrent: () => CurrentView;
  /** 保存弹窗开合（列表据此暂停自动刷新） */
  onOpenChange: (open: boolean) => void;
}> = ({
  isAdmin,
  activeId,
  onActiveChange,
  onApply,
  getCurrent,
  onOpenChange,
}) => {
  const t = useT();
  const has = usePermissions();
  const rules = useFormRules();
  const { message, modal } = App.useApp();
  const { styles } = useMonitorStyles();
  const [views, setViews] = useState<MonitorAlertView[]>([]);
  // create = 另存为新视图；update = 用当前条件覆盖正在套用的视图
  const [saving, setSaving] = useState<'create' | 'update'>();

  const reload = useCallback(async () => {
    try {
      setViews((await listAlertViews()).items ?? []);
    } catch {
      // 视图只是快捷方式：取不到就当没有，不打扰
      setViews([]);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);

  const active = views.find((view) => view.id === activeId);
  const canSave = has('monitor.alert.view');
  const openSave = (mode: 'create' | 'update') => {
    // 视图必须带聚合方式（后端校验 by）
    if (!getCurrent().by) {
      message.warning(t('pages.monitor.alert.view.needBy'));
      return;
    }
    setSaving(mode);
    onOpenChange(true);
  };
  const closeSave = () => {
    setSaving(undefined);
    onOpenChange(false);
  };

  const items: MenuProps['items'] = [
    {
      key: 'create',
      label: t('pages.monitor.alert.view.save'),
      onClick: () => openSave('create'),
    },
    ...(active?.canEdit
      ? [
          {
            key: 'update',
            label: t('pages.monitor.alert.view.update'),
            onClick: () => openSave('update'),
          },
          {
            key: 'delete',
            danger: true,
            label: t('pages.monitor.alert.view.delete'),
            onClick: () =>
              modal.confirm({
                title: t('pages.monitor.alert.view.delete.title', {
                  name: active.spec.name,
                }),
                content: active.spec.isPublic
                  ? t('pages.monitor.alert.view.delete.public')
                  : undefined,
                okButtonProps: { danger: true },
                onOk: async () => {
                  await deleteAlertView(active.id);
                  message.success(t('pages.monitor.alert.view.deleted'));
                  onActiveChange(undefined);
                  await reload();
                },
              }),
          },
        ]
      : []),
  ];

  return (
    <>
      <span className={styles.hint}>{t('pages.monitor.alert.view.title')}</span>
      <Select<string>
        style={{ width: 200 }}
        allowClear
        showSearch={{ optionFilterProp: 'title' }}
        value={active ? activeId : undefined}
        placeholder={t('pages.monitor.alert.view.placeholder')}
        notFoundContent={t('pages.monitor.alert.view.empty')}
        options={views.map((view) => ({
          value: view.id,
          title: view.spec.name,
          label: (
            <>
              {view.spec.name}
              {view.spec.isPublic && (
                <Tag style={{ marginInlineStart: 8, marginInlineEnd: 0 }}>
                  {t('pages.monitor.alert.view.public')}
                </Tag>
              )}
            </>
          ),
        }))}
        onChange={(id?: string) => {
          onActiveChange(id || undefined);
          const view = views.find((item) => item.id === id);
          if (view) onApply(view);
        }}
      />
      {canSave && (
        <Dropdown menu={{ items }} trigger={['click']}>
          <Button>
            {t('pages.monitor.alert.view.actions')} <DownOutlined />
          </Button>
        </Dropdown>
      )}

      {saving && (
        <ModalForm<{ name?: string; isPublic?: boolean }>
          title={
            saving === 'update'
              ? t('pages.monitor.alert.view.update')
              : t('pages.monitor.alert.view.save')
          }
          width={480}
          open
          onOpenChange={(open) => {
            if (!open) closeSave();
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={
            saving === 'update' && active
              ? {
                  name: active.spec.name,
                  isPublic: active.spec.isPublic === true,
                }
              : { isPublic: false }
          }
          onFinish={async (values) => {
            const current = getCurrent();
            const spec = {
              name: values.name?.trim() ?? '',
              by: current.by ?? '',
              filters: current.filters,
              // 公共视图只有超级管理员能设；其余人保存的一律是个人视图
              isPublic: isAdmin && values.isPublic === true,
            };
            const { view } =
              saving === 'update' && active
                ? await updateAlertView(active.id, spec)
                : await createAlertView(spec);
            message.success(t('pages.monitor.alert.view.saved'));
            await reload();
            if (view?.id) onActiveChange(view.id);
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.monitor.alert.view.name')}
            extra={t('pages.monitor.alert.view.name.extra')}
            fieldProps={{ maxLength: ALERT_LIMITS.viewNameMax }}
            rules={[
              {
                ...rules.required(t('pages.monitor.alert.view.name')),
                whitespace: true,
              },
              rules.maxChars(ALERT_LIMITS.viewNameMax),
            ]}
          />
          {isAdmin && (
            <ProFormCheckbox
              name="isPublic"
              extra={t('pages.monitor.alert.view.public.extra')}
            >
              {t('pages.monitor.alert.view.public.label')}
            </ProFormCheckbox>
          )}
        </ModalForm>
      )}
    </>
  );
};

export default AlertViewBar;
