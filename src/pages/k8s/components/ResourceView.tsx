/**
 * 一类资源的完整视图：列表 + 详情抽屉 + 操作 + 新建（登记了创建表单的类型走表单抽屉，
 * 抽屉内有「编辑 YAML」开关；未登记的类型从 YAML 创建）。工作负载、网络与配置、节点、
 * 资源浏览器的各个页签都是它，只是资源类型不同。
 */
import { history } from '@umijs/max';
import { Button, Empty, Flex, Spin } from 'antd';
import type React from 'react';
import { Suspense, useCallback, useRef, useState } from 'react';
import { CreateButton } from '@/components/TableActions';
import type { GVR, ListRow } from '@/services/k8s/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { createFormOf, preloadFormOf } from '../forms/registry';
import {
  type ActionTarget,
  type DetailTab,
  useResourceActions,
} from './actions';
import { ManifestModal } from './ChangePreview';
import { detailPath, elementCode, GVRS, sameGVR } from './meta';
import {
  type ExtraColumn,
  ResourceTable,
  type ResourceTableHandle,
} from './ResourceTable';
import { ScopeSelects, useK8sScope } from './scope';

export const ResourceView: React.FC<{
  gvr: GVR;
  /** 是否命名空间级资源；缺省 true */
  namespaced?: boolean;
  /** 是否提供新建入口；缺省 true（节点没有） */
  creatable?: boolean;
  /** 表头附加内容（放在创建按钮之后） */
  extra?: React.ReactNode;
  /** 追加的列 */
  extraColumns?: ExtraColumn[];
}> = ({ gvr, namespaced = true, creatable = true, extra, extraColumns }) => {
  const t = useT();
  const has = usePermissions();
  const scope = useK8sScope();
  const table = useRef<ResourceTableHandle>(null);
  const [creating, setCreating] = useState(false);
  const [forming, setForming] = useState(false);
  // 登记了创建向导的类型走向导
  const CreateForm = createFormOf(gvr);
  const hasForm = Boolean(CreateForm);
  // 悬停 / 聚焦「新建」时预取向导代码：首次点击不用干等懒加载 chunk
  const preloadForm = useCallback(() => {
    if (hasForm) preloadFormOf(gvr);
  }, [gvr, hasForm]);

  const reload = useCallback(() => table.current?.reload(), []);
  // 详情是独立的整页（地址可分享、可返回）
  const open = (target: ActionTarget, tab?: DetailTab) =>
    history.push(
      detailPath(scope.clusterId, gvr, target.name, target.namespace, tab),
    );

  const actions = useResourceActions({
    clusterId: scope.clusterId,
    gvr,
    onChanged: reload,
    onOpenTab: open,
  });
  const canCreate =
    creatable && !sameGVR(gvr, GVRS.node) && has(elementCode(gvr, 'create'));

  return (
    <>
      <ResourceTable
        tableRef={table}
        clusterId={scope.clusterId}
        gvr={gvr}
        namespace={namespaced ? scope.namespace : ''}
        namespaced={namespaced}
        onOpen={(row: ListRow) => open(row)}
        rowActions={(row) => actions.render(row)}
        batchActions={actions.batch}
        emptyHint={
          canCreate ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                namespaced && scope.namespace
                  ? t('pages.k8s.detail.view.emptyNamespaced', {
                      namespace: scope.namespace,
                    })
                  : t('pages.k8s.detail.view.empty')
              }
            >
              <Button
                type="primary"
                onClick={() => (hasForm ? setForming(true) : setCreating(true))}
                onMouseEnter={preloadForm}
                onFocus={preloadForm}
              >
                {t(hasForm ? 'common.action.create' : 'pages.k8s.create.yaml')}
              </Button>
            </Empty>
          ) : undefined
        }
        extraColumns={extraColumns}
        toolbar={
          <>
            {/* 新建类按钮在最左（extra 也是创建入口，如命名空间的创建 / 申请），
                其后是集群 / 命名空间筛选；行内间距由 ResourceTable 统一为 8px。
                登记了创建表单的类型只给「新建」：表单抽屉里有「编辑 YAML」开关，
                不重复提供 YAML 入口；未登记的类型（资源浏览器 / CRD 等）才给「从 YAML 创建」 */}
            {canCreate && hasForm && (
              <CreateButton
                onClick={() => setForming(true)}
                onMouseEnter={preloadForm}
                onFocus={preloadForm}
              >
                {t('common.action.create')}
              </CreateButton>
            )}
            {canCreate && !hasForm && (
              <CreateButton onClick={() => setCreating(true)}>
                {t('pages.k8s.create.yaml')}
              </CreateButton>
            )}
            {extra}
            <ScopeSelects showNamespace={namespaced} />
          </>
        }
      />
      {actions.holder}
      {/* 表单代码按需加载：真要等时给个转圈，而不是点了没反应 */}
      {forming && CreateForm && (
        <Suspense
          fallback={
            <Flex
              align="center"
              justify="center"
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            >
              <Spin />
            </Flex>
          }
        >
          <CreateForm
            clusterId={scope.clusterId}
            namespace={namespaced ? scope.namespace || undefined : undefined}
            onClose={() => setForming(false)}
            onDone={reload}
          />
        </Suspense>
      )}
      {creating && (
        <ManifestModal
          clusterId={scope.clusterId}
          namespace={namespaced ? scope.namespace : undefined}
          title={t('pages.k8s.create.yaml')}
          onClose={() => setCreating(false)}
          onDone={reload}
        />
      )}
    </>
  );
};
