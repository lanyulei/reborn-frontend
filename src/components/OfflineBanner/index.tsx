import { getIntl } from '@umijs/max';
import { Alert } from 'antd';
import { useSyncExternalStore } from 'react';

const subscribeOnlineStatus = (callback: () => void) => {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
};

const getOnlineStatus = () =>
  typeof navigator === 'undefined' ? true : navigator.onLine;

const OfflineBanner: React.FC = () => {
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineStatus,
    () => true,
  );

  if (isOnline) return null;

  return (
    <Alert
      type="warning"
      showIcon
      closable={false}
      style={{
        position: 'fixed',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        // 压过 antd 弹层基线（Modal/Drawer 遮罩 1000+），保证离线提示始终可见
        zIndex: 1100,
        maxWidth: 480,
      }}
      title={getIntl().formatMessage({
        id: 'app.network.offline',
        defaultMessage:
          'You are currently offline. Some features may be unavailable.',
      })}
    />
  );
};

export default OfflineBanner;
