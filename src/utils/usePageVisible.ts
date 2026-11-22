import { useEffect, useRef, useState } from 'react';

/**
 * 页面（标签页）是否可见。后台标签页里停掉轮询 / 订阅，恢复可见时通过 onVisible 刷新一次。
 */
export const usePageVisible = (onVisible?: () => void) => {
  const [visible, setVisible] = useState(
    () => document.visibilityState === 'visible',
  );
  const callback = useRef(onVisible);
  callback.current = onVisible;
  useEffect(() => {
    const onChange = () => {
      const next = document.visibilityState === 'visible';
      setVisible(next);
      if (next) callback.current?.();
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
};
