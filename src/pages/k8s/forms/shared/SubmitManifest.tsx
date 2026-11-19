/**
 * 创建向导的提交步骤：把向导生成的清单交给清单弹窗（预检 → 结果 → 提交）。
 * - 提交前取消 / 返回：回到向导继续修改；
 * - 提交后（含部分成功）：结果留在弹窗里给用户看，关闭弹窗时连同向导一起关闭；
 * - 被转为变更单（待审批）：集群未改动，向导直接关闭。
 */
import type React from 'react';
import { useRef } from 'react';
import { ManifestModal } from '../../components/ChangePreview';

export const SubmitManifest: React.FC<{
  clusterId: string;
  /** 清单里未写命名空间的对象的缺省命名空间；集群级资源不传 */
  namespace?: string;
  title: string;
  yaml: string;
  /** 回到向导 */
  onBack: () => void;
  /** 关闭整个向导 */
  onClose: () => void;
  /** 有对象创建成功（刷新列表） */
  onDone?: () => void;
}> = ({ clusterId, namespace, title, yaml, onBack, onClose, onDone }) => {
  const applied = useRef(false);
  return (
    <ManifestModal
      clusterId={clusterId}
      namespace={namespace}
      title={title}
      initialYaml={yaml}
      onDone={() => {
        applied.current = true;
        onDone?.();
      }}
      onSubmitted={onClose}
      onClose={() => (applied.current ? onClose() : onBack())}
    />
  );
};
