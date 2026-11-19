/** 读取一个对象（以用户身份直接读自集群），带加载 / 错误状态与刷新。 */
import { useCallback, useEffect, useState } from 'react';
import { getK8sErrorMessage } from '@/services/k8s/request';
import { getObject } from '@/services/k8s/resource';
import type { ObjectResult, ResourceRef } from '@/services/k8s/typings';

const useObject = (clusterId: string, ref: ResourceRef) => {
  const [data, setData] = useState<ObjectResult>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  // 调用方每次渲染都可能新建 ref 对象：按内容比较
  const key = JSON.stringify(ref);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await getObject(clusterId, JSON.parse(key) as ResourceRef, {
          silent: true,
        }),
      );
      setError(undefined);
    } catch (err) {
      setError(getK8sErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clusterId, key]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
};

export default useObject;
