import { GridContent } from '@ant-design/pro-components';
import { Menu } from 'antd';
import React, { useState } from 'react';
import { useT } from '@/utils/i18n';
import BaseView from './components/base';
import SecurityView from './components/security';
import useStyles from './style';

type SettingsStateKeys = 'base' | 'security';

const MENU_KEYS: SettingsStateKeys[] = ['base', 'security'];

/** 个人设置：左侧分区菜单 + 右侧内容（参考 Ant Design Pro account/settings，按后端能力裁剪） */
const Settings: React.FC = () => {
  const { styles } = useStyles();
  const t = useT();
  const [selectKey, setSelectKey] = useState<SettingsStateKeys>('base');

  const menuLabel = (key: SettingsStateKeys) => t(`pages.account.menu.${key}`);

  return (
    <GridContent>
      <div className={styles.main}>
        <div className={styles.leftMenu}>
          <Menu
            mode="inline"
            selectedKeys={[selectKey]}
            onClick={({ key }) => {
              setSelectKey(key as SettingsStateKeys);
            }}
            items={MENU_KEYS.map((key) => ({ key, label: menuLabel(key) }))}
          />
        </div>
        <div className={styles.right}>
          <div className={styles.title}>{menuLabel(selectKey)}</div>
          {selectKey === 'base' ? <BaseView /> : <SecurityView />}
        </div>
      </div>
    </GridContent>
  );
};

export default Settings;
