/** 指向另一个资源详情的链接：带上当前集群 */
import { Link } from '@umijs/max';
import type { ReactNode } from 'react';
import { useK8sScope } from '../../components/scope';

const ClusterLink = ({ to, children }: { to: string; children: ReactNode }) => {
  const { clusterId } = useK8sScope();
  return (
    <Link to={`${to}?cluster=${encodeURIComponent(clusterId)}`}>
      {children}
    </Link>
  );
};

export default ClusterLink;
