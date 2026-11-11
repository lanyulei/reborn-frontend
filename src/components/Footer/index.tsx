import { useModel } from '@umijs/max';
import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ token, css }) => ({
  footer: css`
    padding: 16px 24px;
    text-align: center;
    color: ${token.colorTextDescription};
    font-size: ${token.fontSizeSM}px;
    line-height: ${token.lineHeight};
    background: transparent;
  `,
}));

const Footer: React.FC = () => {
  const { styles } = useStyles();
  const { initialState } = useModel('@@initialState');
  const year = new Date().getFullYear();
  // 系统配置的页脚文案优先，未配置回退默认版权
  const text = initialState?.systemConfig?.footer || `LanYuLei © ${year}`;

  return (
    // data-layout-footer：供需要扣除页脚高度的整页（如智能助手）定位测量
    <div className={styles.footer} data-layout-footer>
      <div>{text}</div>
    </div>
  );
};

export default Footer;
