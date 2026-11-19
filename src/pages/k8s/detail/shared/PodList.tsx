/**
 * 详情页里的容器组列表（某节点上 / 某选择器下 / 某命名空间里的 Pod）：
 * 与容器组菜单页同一张表，点名称进入容器组详情，行操作（日志、终端、驱逐等）齐全。
 */
import { history } from '@umijs/max';
import { useRef } from 'react';
import type { ListQuery } from '@/services/k8s/typings';
import { useResourceActions } from '../../components/actions';
import { detailPath, GVRS } from '../../components/meta';
import {
  ResourceTable,
  type ResourceTableHandle,
} from '../../components/ResourceTable';

type PodListProps = {
  clusterId: string;
  /** 空 = 全部命名空间 */
  namespace?: string;
  fixed?: Pick<ListQuery, 'node' | 'owner' | 'labelSelector'>;
  /** 只是页签里的一个小节（上面还有小标题等内容）：不收紧工具栏的内边距 */
  section?: boolean;
};

const PodList = ({ clusterId, namespace, fixed, section }: PodListProps) => {
  const table = useRef<ResourceTableHandle>(null);
  const actions = useResourceActions({
    clusterId,
    gvr: GVRS.pod,
    onChanged: () => table.current?.reload(),
    onOpenTab: (pod, tab) =>
      history.push(
        detailPath(clusterId, GVRS.pod, pod.name, pod.namespace, tab),
      ),
  });

  return (
    <>
      <ResourceTable
        compact
        tabLayout
        flushToolbar={!section}
        tableRef={table}
        clusterId={clusterId}
        gvr={GVRS.pod}
        namespace={namespace ?? ''}
        fixed={fixed}
        onOpen={(row) =>
          history.push(detailPath(clusterId, GVRS.pod, row.name, row.namespace))
        }
        rowActions={(row) => actions.render(row, { inline: 1 })}
      />
      {actions.holder}
    </>
  );
};

export default PodList;
