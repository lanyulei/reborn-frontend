import { QuestionCircleOutlined } from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Link, useAccess, useIntl, useParams } from '@umijs/max';
import type { TabsProps } from 'antd';
import {
  App,
  Checkbox,
  Tabs,
  Tag,
  Tooltip,
  Tree,
  Typography,
  theme,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import type { MenuPermissionCode } from '@/services/system/permissions';
import {
  ELEMENT_PERMISSION_CODES,
  ELEMENT_PERMISSIONS,
  MENU_PERMISSION_CODES,
  MENU_PERMISSIONS,
} from '@/services/system/permissions';
import {
  getRole,
  getRolePermissions,
  listPermissionCatalog,
  setRolePermissions,
} from '@/services/system/role';
import type {
  CatalogMenu,
  Operation,
  SystemRole,
} from '@/services/system/typings';
import { useT } from '@/utils/i18n';

/**
 * 角色权限管理页：无标题块，面包屑 + 左右分栏（间隔 16px）。
 * 左侧为菜单权限树（勾选 = 页面可见/只读，点选节点切换右侧详情）；
 * 右侧为所选菜单的详情 Tabs：
 * 「页面标签」勾选元素权限（标签旁问号图标悬停显示其绑定接口）；
 * 「接口权限」勾选接口直接授权——后端接口校验只认 apis，菜单/标签
 * 授权仅控前端可见性、不级联生效，因此勾选菜单/标签时其绑定接口
 * 自动勾选、锁定（禁用手动取消）并真实保存进 apis；取消菜单/标签
 * 时其接口若未被其他结构引用则自动取消并解锁；手动勾选的接口不
 * 受结构变化影响、永不禁用。
 * 保存 = 菜单勾选 ∪ 元素勾选（元素隐含菜单可见）∪ 接口勾选全量覆盖。
 */
const RolePermission: React.FC = () => {
  const roleId = useParams<{ id: string }>().id ?? '';
  const { message, modal } = App.useApp();
  const intl = useIntl();
  const t = useT();
  const { token } = theme.useToken();
  const { canAdmin: isAdmin } = useAccess();

  const [role, setRole] = useState<SystemRole | null>(null);
  // 内置角色的授权仅超管可改：非超管只读浏览（无保存、控件禁用、顶部提示）
  const readOnly = role?.builtin === true && !isAdmin;
  const [loading, setLoading] = useState(true);
  const [menuChecked, setMenuChecked] = useState<string[]>([]);
  const [elemChecked, setElemChecked] = useState<string[]>([]);
  /** 接口勾选（= 保存的 apis 全量；含结构自动勾选与手动勾选） */
  const [apiChecked, setApiChecked] = useState<string[]>([]);
  /**
   * 结构联动自动勾选部分：存续期间（结构仍引用）接口 Tab 中呈勾选+禁用，
   * 不可手动取消；随结构引用消失而自动取消，之后恢复可手动勾选。
   * 手动勾选的接口不入此列，不受结构变化影响。
   */
  const [autoApis, setAutoApis] = useState<string[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<MenuPermissionCode>(
    MENU_PERMISSIONS[0].code,
  );
  const [catalog, setCatalog] = useState<CatalogMenu[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [{ role: detail }, grants, catRes] = await Promise.all([
          getRole(roleId),
          getRolePermissions(roleId),
          listPermissionCatalog(),
        ]);
        setRole(detail);
        const menuCodes = grants.menus.filter((code) =>
          MENU_PERMISSION_CODES.has(code),
        );
        const elemCodes = grants.elements.filter((code) =>
          ELEMENT_PERMISSION_CODES.has(code),
        );
        setMenuChecked(menuCodes);
        setElemChecked(elemCodes);
        setCatalog(catRes.menus);
        // 剔除后端目录已下线的陈旧操作码（全量覆盖语义下保存即清理）
        const validCodes = new Set<string>();
        for (const menu of catRes.menus) {
          for (const op of menu.defaultOperations) validCodes.add(op.code);
          for (const elem of menu.elements) {
            for (const op of elem.operations) validCodes.add(op.code);
          }
        }
        const validApis = grants.apis.filter((code) => validCodes.has(code));
        setApiChecked(validApis);
        // 按加载结构恢复联动锁定集（结构引用且已勾选 → 勾选+禁用），
        // 否则刷新/重进后锁定丢失，取消菜单/标签无法自动取消勾选解锁
        const structSet = structApisOf(catRes.menus, menuCodes, elemCodes);
        setAutoApis([...structSet].filter((code) => validApis.includes(code)));
        // 默认选中第一个已授权菜单，无授权时取目录首项
        const firstMenu = menuCodes[0] as MenuPermissionCode | undefined;
        if (firstMenu) setSelectedMenu(firstMenu);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roleId]);

  // 左侧菜单树：父级分组 › 菜单两级，标题复用侧边栏 menu.* 词条随语言切换；
  // 只读态禁用勾选框但保留节点点选（仍可切换右侧详情浏览）
  const permTreeData = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        title: string;
        disableCheckbox: boolean;
        children: { key: string; title: string; disableCheckbox: boolean }[];
      }
    >();
    for (const menu of MENU_PERMISSIONS) {
      const group = groups.get(menu.parentKey) ?? {
        key: menu.parentKey,
        title: intl.formatMessage({ id: menu.parentKey }),
        disableCheckbox: readOnly,
        children: [],
      };
      group.children.push({
        key: menu.code,
        title: intl.formatMessage({ id: menu.labelKey }),
        disableCheckbox: readOnly,
      });
      groups.set(menu.parentKey, group);
    }
    return [...groups.values()];
  }, [intl, readOnly]);

  // 右侧详情数据源：所选菜单的元素权限
  const menuElements = useMemo(
    () =>
      ELEMENT_PERMISSIONS.filter((elem) => elem.parentCode === selectedMenu),
    [selectedMenu],
  );

  /** 所选菜单的目录项（页面默认接口 + 各标签绑定接口，以后端目录为准） */
  const currentMenu = useMemo(
    () => catalog.find((menu) => menu.code === selectedMenu),
    [catalog, selectedMenu],
  );

  /** 所选菜单的接口清单：页面默认接口 + 标签接口，按 code 去重 */
  const menuOperations = useMemo(() => {
    const byCode = new Map<string, Operation>();
    if (currentMenu) {
      for (const op of currentMenu.defaultOperations) {
        byCode.set(op.code, op);
      }
      for (const elem of currentMenu.elements) {
        for (const op of elem.operations) {
          byCode.set(op.code, op);
        }
      }
    }
    return [...byCode.values()];
  }, [currentMenu]);

  /**
   * 页面结构推导的接口集合：有效菜单（勾选菜单 ∪ 勾选标签隐含的父菜单）
   * 的默认接口 + 勾选标签绑定的接口。与后端目录一致、仅为前端联动依据
   * （后端不按此级联授权，接口权限以接口 Tab 勾选为准）。
   * catalog 由调用方传入（加载时 state 尚未就绪，用响应值直接计算）。
   */
  const structApisOf = (
    cat: CatalogMenu[],
    menus: string[],
    elems: string[],
  ): Set<string> => {
    const menuSet = new Set(menus);
    const elemSet = new Set(elems);
    const codes = new Set<string>();
    for (const menu of cat) {
      for (const elem of menu.elements) {
        if (elemSet.has(elem.code)) {
          menuSet.add(menu.code); // 标签授权隐含页面可见
          for (const op of elem.operations) codes.add(op.code);
        }
      }
      if (menuSet.has(menu.code)) {
        for (const op of menu.defaultOperations) codes.add(op.code);
      }
    }
    return codes;
  };

  /**
   * 菜单/标签勾选变化时的接口联动（以「本次新勾/取消的结构」为口径，
   * 不做结构集合的全量 diff 对齐——存量授权或手动取消过的接口会被
   * 绝对 diff 的 prev 守卫吞掉，导致自动勾选不生效）：
   * - 新勾选的菜单/标签（含标签隐含的父页面）→ 其引用接口无条件自动勾选，
   *   且勾选+禁用锁定（仅此类接口禁用，手动勾选/存量授权不受限）；
   * - 取消勾选的菜单/标签的接口，仍被其余勾选结构引用的保留（如 ListRoles
   *   同时从属于角色菜单与用户「角色绑定」标签），其余且属自动勾选的取消，
   *   取消/保留后禁用态随 autoApis 成员关系同步解除/维持；
   * - 手动在接口 Tab 勾选的接口不受结构变化影响。
   */
  const syncApisOnStructChange = (
    oldMenus: string[],
    newMenus: string[],
    oldElems: string[],
    newElems: string[],
  ) => {
    const addedMenus = newMenus.filter((code) => !oldMenus.includes(code));
    const removedMenus = oldMenus.filter((code) => !newMenus.includes(code));
    const addedElems = newElems.filter((code) => !oldElems.includes(code));
    const removedElems = oldElems.filter((code) => !newElems.includes(code));

    // 新勾结构的引用集 = 新增菜单默认接口 + 新增标签接口及其隐含父页面默认接口
    const toAdd = structApisOf(catalog, addedMenus, addedElems);
    // 取消结构的引用集，扣除仍被保留结构引用的部分
    const removed = structApisOf(catalog, removedMenus, removedElems);
    const remaining = structApisOf(catalog, newMenus, newElems);

    const checked = new Set(apiChecked);
    const auto = new Set(autoApis);
    for (const code of toAdd) {
      if (!checked.has(code)) {
        checked.add(code);
        auto.add(code);
      }
    }
    for (const code of removed) {
      if (remaining.has(code)) continue;
      if (auto.delete(code)) checked.delete(code);
    }
    setApiChecked([...checked]);
    setAutoApis([...auto]);
  };

  /** 页面标签 → 悬停问号图标的接口清单 */
  const elementApiTip = (elemCode: string): React.ReactNode => {
    const elem = currentMenu?.elements.find((item) => item.code === elemCode);
    if (!elem || elem.operations.length === 0) {
      return t('pages.system.permission.tip.noApis');
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span>{t('pages.system.permission.tip.apis')}</span>
        {elem.operations.map((op) => (
          <span key={op.code}>· {op.title}</span>
        ))}
      </div>
    );
  };

  /** 接口 → 悬停问号图标的 HTTP 元信息（路径 / 方法两行，来自后端 path/method 字段） */
  const apiMetaTip = (op: {
    path: string;
    method: string;
  }): React.ReactNode => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span>{t('pages.system.permission.tip.apiPath', { path: op.path })}</span>
      <span>
        {t('pages.system.permission.tip.apiMethod', { method: op.method })}
      </span>
    </div>
  );

  /**
   * 接口的全部结构从属（静态目录事实，与勾选状态无关；同一接口可被
   * 多个页面/标签共用，返回数组支持多标记）：当前页面默认 →
   * 「页面默认」，其他页面默认 →「页面默认·页面名」，标签 → 标签名。
   * 排序：页面类在前（当前页面优先），标签类在后。
   */
  const opOrigins = (
    opCode: string,
  ): { type: 'menu' | 'element'; name?: string; current?: boolean }[] => {
    const origins: {
      type: 'menu' | 'element';
      name?: string;
      current?: boolean;
    }[] = [];
    for (const menu of catalog) {
      if (menu.defaultOperations.some((op) => op.code === opCode)) {
        const def = MENU_PERMISSIONS.find((item) => item.code === menu.code);
        origins.push({
          type: 'menu',
          name: def ? intl.formatMessage({ id: def.labelKey }) : menu.name,
          current: menu.code === selectedMenu,
        });
      }
      for (const elem of menu.elements) {
        if (elem.operations.some((op) => op.code === opCode)) {
          const def = ELEMENT_PERMISSIONS.find(
            (item) => item.code === elem.code,
          );
          origins.push({
            type: 'element',
            name: def ? intl.formatMessage({ id: def.labelKey }) : elem.name,
          });
        }
      }
    }
    return origins.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'menu' ? -1 : 1;
      return Number(b.current ?? false) - Number(a.current ?? false);
    });
  };

  // 保存：菜单勾选 + 元素勾选 + 接口勾选全量覆盖（过滤分组节点），
  // 元素授权隐含菜单可见（后端 /me 按存储直授返回菜单）；
  // 接口勾选即真实授权全量保存——后端接口校验只认 apis，不随菜单/标签级联；
  // 执行中的 loading 由确认框的确定按钮承担
  const save = async () => {
    if (!roleId) return;
    const menus = new Set<string>(
      menuChecked.filter((code) => MENU_PERMISSION_CODES.has(code)),
    );
    const elements = elemChecked.filter((code) =>
      ELEMENT_PERMISSION_CODES.has(code),
    );
    for (const elem of ELEMENT_PERMISSIONS) {
      if (elements.includes(elem.code)) menus.add(elem.parentCode);
    }
    const apis = [...new Set(apiChecked)].sort();
    await setRolePermissions(roleId, {
      menus: [...menus].sort(),
      elements: [...elements].sort(),
      apis,
    });
    message.success(t('pages.system.permission.saved'));
  };

  // 面包屑：系统管理 / 角色管理（可返回列表） / 角色权限
  const breadcrumbItems = [
    { title: intl.formatMessage({ id: 'menu.system' }) },
    {
      title: (
        <Link to="/system/role">
          {intl.formatMessage({ id: 'menu.system.role' })}
        </Link>
      ),
    },
    { title: intl.formatMessage({ id: 'menu.system.role-permission' }) },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'elements',
      label: t('pages.system.permission.tab.elements'),
      children: (
        <>
          <Typography.Paragraph type="secondary">
            {t('pages.system.permission.desc.elements')}
          </Typography.Paragraph>
          <Checkbox.Group
            disabled={readOnly}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            options={menuElements.map((elem) => ({
              value: elem.code,
              label: (
                <span>
                  {intl.formatMessage({ id: elem.labelKey })}
                  <Tooltip title={elementApiTip(elem.code)}>
                    <QuestionCircleOutlined
                      style={{
                        marginLeft: 4,
                        color: token.colorTextTertiary,
                      }}
                    />
                  </Tooltip>
                </span>
              ),
            }))}
            value={elemChecked.filter((code) =>
              menuElements.some((elem) => elem.code === code),
            )}
            onChange={(values) => {
              const scope = new Set<string>(
                menuElements.map((elem) => elem.code),
              );
              const newElems = [
                ...elemChecked.filter((code) => !scope.has(code)),
                ...(values as string[]),
              ];
              syncApisOnStructChange(
                menuChecked,
                menuChecked,
                elemChecked,
                newElems,
              );
              setElemChecked(newElems);
            }}
          />
        </>
      ),
    },
    {
      key: 'apis',
      label: t('pages.system.permission.tab.apis'),
      children: (
        <>
          <Typography.Paragraph type="secondary">
            {t('pages.system.permission.desc.apis')}
          </Typography.Paragraph>
          <Checkbox.Group
            disabled={readOnly}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            options={menuOperations.map((op) => ({
              value: op.code,
              // 随菜单/标签联动自动勾选的接口禁用手动取消（取消对应结构后解锁）
              disabled: autoApis.includes(op.code),
              label: (
                <span>
                  <span>{op.title}</span>
                  <Tooltip title={apiMetaTip(op)}>
                    <QuestionCircleOutlined
                      style={{
                        marginLeft: 4,
                        color: token.colorTextTertiary,
                      }}
                    />
                  </Tooltip>
                  {opOrigins(op.code).map((origin) => (
                    <Tag
                      key={`${origin.type}:${origin.name ?? ''}`}
                      variant="filled"
                      color={origin.type === 'menu' ? 'blue' : 'cyan'}
                      style={{ marginLeft: 8 }}
                    >
                      {origin.type === 'menu'
                        ? origin.current
                          ? t('pages.system.permission.origin.menuDefault')
                          : t('pages.system.permission.origin.menuDefaultOf', {
                              name: origin.name,
                            })
                        : origin.name}
                    </Tag>
                  ))}
                </span>
              ),
            }))}
            value={menuOperations
              .filter((op) => apiChecked.includes(op.code))
              .map((op) => op.code)}
            onChange={(values) => {
              const scope = new Set<string>(
                menuOperations.map((op) => op.code),
              );
              const next = new Set(values as string[]);
              // 联动锁定的项（勾选+禁用）不可手动变更，恒保持勾选
              for (const code of scope) {
                if (autoApis.includes(code)) next.add(code);
              }
              // 范围外勾选保持不变；范围内以手动勾选为准
              setApiChecked([
                ...apiChecked.filter((code) => !scope.has(code)),
                ...next,
              ]);
              // 手动取消的自动项退出自动集合，后续结构变化不再代其取消
              setAutoApis(
                autoApis.filter((code) => !scope.has(code) || next.has(code)),
              );
            }}
          />
        </>
      ),
    },
  ];

  return (
    <PageContainer title={false} breadcrumb={{ items: breadcrumbItems }}>
      {readOnly && (
        <Typography.Paragraph type="secondary">
          {t('pages.system.permission.readonly')}
        </Typography.Paragraph>
      )}
      <div style={{ display: 'flex', gap: 16 }}>
        <ProCard
          style={{ width: 280 }}
          title={
            // 角色名称超出一行时省略，悬停显示全称
            <Typography.Text
              style={{ maxWidth: '100%' }}
              ellipsis={{ tooltip: role?.name ?? '' }}
            >
              {role?.name ?? ''}
            </Typography.Text>
          }
          headerBordered
          loading={loading}
          extra={
            readOnly ? null : (
              <a
                onClick={() => {
                  // 二次确认，避免误触覆盖权限
                  modal.confirm({
                    title: t('pages.system.permission.save.title'),
                    content: t('pages.system.permission.save.content'),
                    onOk: save,
                  });
                }}
              >
                {t('common.action.save')}
              </a>
            )
          }
        >
          <Tree
            checkable
            defaultExpandAll
            blockNode
            treeData={permTreeData}
            checkedKeys={menuChecked}
            selectedKeys={[selectedMenu]}
            onCheck={(keys) => {
              // 过滤分组节点，仅保留菜单码
              const newMenus = (
                Array.isArray(keys) ? keys.map(String) : []
              ).filter((code) => MENU_PERMISSION_CODES.has(code));
              syncApisOnStructChange(
                menuChecked,
                newMenus,
                elemChecked,
                elemChecked,
              );
              setMenuChecked(newMenus);
            }}
            onSelect={(keys) => {
              const menuKey = keys
                .map(String)
                .find((code) => MENU_PERMISSION_CODES.has(code));
              if (menuKey) setSelectedMenu(menuKey as MenuPermissionCode);
            }}
          />
        </ProCard>
        {/* 右侧容器：与左侧卡片同源背景（跟随明暗主题），card 类型 Tabs */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: token.colorBgContainer,
            border: `${token.lineWidth}px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary})`,
            borderRadius: token.borderRadiusLG,
            padding: '12px 16px 16px',
          }}
        >
          <Tabs type="card" defaultActiveKey="elements" items={tabItems} />
        </div>
      </div>
    </PageContainer>
  );
};

export default RolePermission;
