/**
 * 保存的视图：把资源列表当前的筛选条件存为命名视图，之后一键套用。
 * 存在服务端，按账号 + 模型，随账号漫游（换浏览器 / 电脑仍在）。
 * 之前存在浏览器本地的视图会自动迁移到服务端（迁不上的留在本地、照常可用，不丢）。
 * 视图接口不可用（旧后端 / 角色尚未授权 / 网络故障）时只展示本地遗留的视图、不能新存：
 * 不在本地另存一份，避免与服务端各存各的、之后互相覆盖。
 */
import { DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { App, Button, Dropdown } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteCIView, listCIViews, saveCIView } from '@/services/cmdb/insight';
import { useT } from '@/utils/i18n';

interface SavedView {
  name: string;
  values: Record<string, unknown>;
}

/** 每个模型最多保存的视图数（与后端一致） */
const MAX_VIEWS = 20;
const storageKey = (userId: string, modelCode: string) =>
  `cmdb.ci.views.${userId}.${modelCode}`;

const loadLocal = (userId: string, modelCode: string): SavedView[] => {
  try {
    const raw = JSON.parse(
      localStorage.getItem(storageKey(userId, modelCode)) ?? '[]',
    );
    return Array.isArray(raw)
      ? raw.filter(
          (v): v is SavedView =>
            !!v && typeof v.name === 'string' && typeof v.values === 'object',
        )
      : [];
  } catch {
    return [];
  }
};

const storeLocal = (userId: string, modelCode: string, views: SavedView[]) => {
  try {
    if (views.length) {
      localStorage.setItem(
        storageKey(userId, modelCode),
        JSON.stringify(views),
      );
    } else {
      localStorage.removeItem(storageKey(userId, modelCode));
    }
  } catch {
    // 本地存储不可用（隐私模式 / 配额）：仅本次会话有效
  }
};

const byName = (a: SavedView, b: SavedView) => a.name.localeCompare(b.name);

export const SavedViews: React.FC<{
  modelCode: string;
  /** 取当前筛选表单的值 */
  getValues: () => Record<string, unknown>;
  /** 套用视图（重置表单 → 填入 → 查询） */
  onApply: (values: Record<string, unknown>) => void;
}> = ({ modelCode, getValues, onApply }) => {
  const t = useT();
  const { message, modal } = App.useApp();
  const [views, setViews] = useState<SavedView[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  // remote：视图接口可用（不可用时只读展示本地遗留的视图）
  const [remote, setRemote] = useState(false);
  const { initialState } = useModel('@@initialState');
  const userId = initialState?.currentUser?.id ?? 'anonymous';
  // 只采纳最后一次加载的结果（快速切换模型时旧请求作废）
  const seq = useRef(0);

  const load = useCallback(async () => {
    const current = ++seq.current;
    const local = loadLocal(userId, modelCode);
    try {
      const { items } = await listCIViews(modelCode);
      if (current !== seq.current) return;
      const server: SavedView[] = (items ?? []).map((v) => ({
        name: v.name,
        values: v.filters ?? {},
      }));
      // 本地遗留的视图迁移到服务端（服务端已有同名的以服务端为准）；全部迁完才清本地
      const pending = local.filter(
        (l) => !server.some((s) => s.name === l.name),
      );
      const kept: SavedView[] = [];
      for (const v of pending) {
        try {
          await saveCIView(modelCode, v.name, v.values, { silent: true });
          server.push(v);
        } catch {
          kept.push(v); // 超出上限等：留在本地，不丢
        }
      }
      if (current !== seq.current) return;
      storeLocal(userId, modelCode, kept);
      setRemote(true);
      setViews([...server, ...kept].sort(byName));
    } catch {
      if (current !== seq.current) return;
      setRemote(false);
      setViews(local.sort(byName));
    }
  }, [userId, modelCode]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (name: string) => {
    if (remote) {
      try {
        await deleteCIView(modelCode, name);
      } catch {
        return; // authRequest 已提示
      }
    }
    // 本地同名的（迁移未成功留下的 / 降级模式）一并移除
    storeLocal(
      userId,
      modelCode,
      loadLocal(userId, modelCode).filter((v) => v.name !== name),
    );
    setViews((cur) => cur.filter((v) => v.name !== name));
  };

  return (
    <>
      <Dropdown
        menu={{
          items: [
            ...views.map((v) => ({
              key: `view:${v.name}`,
              label: v.name,
              extra: (
                <DeleteOutlined
                  aria-label={t('common.action.delete')}
                  onClick={(e) => {
                    e.stopPropagation();
                    modal.confirm({
                      title: t('pages.cmdb.ci.views.delete.title', {
                        name: v.name,
                      }),
                      okButtonProps: { danger: true },
                      onOk: () => remove(v.name),
                    });
                  }}
                />
              ),
            })),
            ...(views.length ? [{ type: 'divider' as const }] : []),
            { key: 'save', label: t('pages.cmdb.ci.views.save') },
          ],
          onClick: ({ key }) => {
            if (key === 'save') {
              if (remote) setSaveOpen(true);
              else message.warning(t('pages.cmdb.ci.views.unavailable'));
              return;
            }
            const view = views.find((v) => `view:${v.name}` === key);
            if (view) onApply(view.values);
          },
        }}
      >
        <Button icon={<FilterOutlined />}>
          {t('pages.cmdb.ci.views.action')}
        </Button>
      </Dropdown>
      <ModalForm<{ name: string }>
        title={t('pages.cmdb.ci.views.save')}
        width={420}
        open={saveOpen}
        onOpenChange={setSaveOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async ({ name }) => {
          const trimmed = name.trim();
          // 只保存有值的条件
          const values = Object.fromEntries(
            Object.entries(getValues()).filter(
              ([, v]) => v !== undefined && v !== null && v !== '',
            ),
          );
          if (Object.keys(values).length === 0) {
            message.warning(t('pages.cmdb.ci.views.empty'));
            return false;
          }
          const rest = views.filter((v) => v.name !== trimmed);
          if (rest.length >= MAX_VIEWS) {
            message.warning(t('pages.cmdb.ci.views.limit', { max: MAX_VIEWS }));
            return false;
          }
          try {
            await saveCIView(modelCode, trimmed, values);
          } catch {
            return false; // authRequest 已提示
          }
          // 服务端已有这个名字：本地遗留的同名视图不再需要
          storeLocal(
            userId,
            modelCode,
            loadLocal(userId, modelCode).filter((v) => v.name !== trimmed),
          );
          // 同名覆盖
          setViews([...rest, { name: trimmed, values }].sort(byName));
          message.success(t('common.msg.saved'));
          return true;
        }}
      >
        <ProFormText
          name="name"
          label={t('pages.cmdb.ci.views.name')}
          extra={t('pages.cmdb.ci.views.tip')}
          rules={[{ required: true, whitespace: true }, { max: 32 }]}
        />
      </ModalForm>
    </>
  );
};
