import { GridContent } from '@ant-design/pro-components';
import { Menu } from 'antd';
import React, { useState } from 'react';
import BaseView from './components/base';
import SecurityView from './components/security';
import useStyles from './style';

type SettingsStateKeys = 'base' | 'security';

const menuMap: Record<SettingsStateKeys, React.ReactNode> = {
  base: '基本设置',
  security: '安全设置',
};

const menuItems = (Object.keys(menuMap) as SettingsStateKeys[]).map((item) => ({
  key: item,
  label: menuMap[item],
}));

/** 个人设置：左侧分区菜单 + 右侧内容（参考 Ant Design Pro account/settings，按后端能力裁剪） */
const Settings: React.FC = () => {
  const { styles } = useStyles();
  const [selectKey, setSelectKey] = useState<SettingsStateKeys>('base');

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
            items={menuItems}
          />
        </div>
        <div className={styles.right}>
          <div className={styles.title}>{menuMap[selectKey]}</div>
          {selectKey === 'base' ? <BaseView /> : <SecurityView />}
        </div>
      </div>
    </GridContent>
  );
};

export default Settings;
