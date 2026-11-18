/**
 * 一类资源的完整视图：列表 + 详情抽屉 + 操作 + 从 YAML 创建。工作负载、网络与配置、节点、
 * 资源浏览器的各个页签都是它，只是资源类型不同。
 */
import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { CreateButton } from '@/components/TableActions';
import type { GVR, ListRow } from '@/services/k8s/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import {
  type ActionTarget,
  type DetailTab,
  useResourceActions,
} from './actions';
import { ManifestModal } from './ChangePreview';
import { elementCode, GVRS, sameGVR } from './meta';
import { type DetailTarget, ResourceDetail } from './ResourceDetail';
import {
  type ExtraColumn,
  ResourceTable,
  type ResourceTableHandle,
} from './ResourceTable';
import { useK8sScope } from './scope';
import { formKindOf, WorkloadFormModal } from './WorkloadFormModal';

export const ResourceView: React.FC<{
  gvr: GVR;
  /** 是否命名空间级资源；缺省 true */
  namespaced?: boolean;
  /** 是否提供「从 YAML 创建」；缺省 true（节点没有） */
  creatable?: boolean;
  /** 新建时编辑器里的初始内容 */
  template?: string;
  /** 表头附加内容（放在创建按钮之后） */
  extra?: React.ReactNode;
  /** 追加的列 */
  extraColumns?: ExtraColumn[];
}> = ({
  gvr,
  namespaced = true,
  creatable = true,
  template,
  extra,
  extraColumns,
}) => {
  const t = useT();
  const has = usePermissions();
  const scope = useK8sScope();
  const table = useRef<ResourceTableHandle>(null);
  const [detail, setDetail] = useState<DetailTarget>();
  const [creating, setCreating] = useState(false);
  const [forming, setForming] = useState(false);
  const formKind = formKindOf(gvr);

  const reload = useCallback(() => table.current?.reload(), []);
  const open = (target: ActionTarget, tab?: DetailTab) =>
    setDetail({ gvr, namespace: target.namespace, name: target.name, tab });

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
        extraColumns={extraColumns}
        toolbar={
          <>
            {canCreate && formKind && (
              <CreateButton onClick={() => setForming(true)}>
                {t('pages.k8s.form.create', { kind: formKind })}
              </CreateButton>
            )}
            {canCreate && (
              <CreateButton onClick={() => setCreating(true)}>
                {t('pages.k8s.create.yaml')}
              </CreateButton>
            )}
            {extra}
          </>
        }
      />
      {actions.holder}
      {detail && (
        <ResourceDetail
          key={`${detail.gvr.resource}/${detail.namespace}/${detail.name}/${detail.tab}`}
          clusterId={scope.clusterId}
          target={detail}
          onClose={() => setDetail(undefined)}
          onChanged={reload}
        />
      )}
      {forming && formKind && (
        <WorkloadFormModal
          clusterId={scope.clusterId}
          kind={formKind}
          namespace={scope.namespace || undefined}
          onClose={() => setForming(false)}
          onDone={reload}
        />
      )}
      {creating && (
        <ManifestModal
          clusterId={scope.clusterId}
          namespace={namespaced ? scope.namespace : undefined}
          title={t('pages.k8s.create.yaml')}
          initialYaml={template}
          onClose={() => setCreating(false)}
          onDone={reload}
        />
      )}
    </>
  );
};
