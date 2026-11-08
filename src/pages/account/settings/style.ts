import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => {
  return {
    main: {
      display: 'flex',
      width: '100%',
      height: '100%',
      paddingTop: '16px',
      paddingBottom: '16px',
      backgroundColor: token.colorBgContainer,
      '.ant-list-item': { paddingTop: '14px', paddingBottom: '14px' },
      [`@media screen and (max-width: ${token.screenMD}px)`]: {
        flexDirection: 'column',
      },
    },
    leftMenu: {
      width: '224px',
      borderRight: `${token.lineWidth}px solid ${token.colorSplit}`,
      '.ant-menu-inline': { border: 'none !important' },
      [`@media screen and (max-width: ${token.screenMD}px)`]: {
        width: '100%',
        border: 'none',
      },
    },
    right: {
      flex: '1',
      padding: '8px 40px',
      [`@media screen and (max-width: ${token.screenMD}px)`]: {
        padding: '40px',
      },
    },
    title: {
      marginBottom: '12px',
      color: token.colorTextHeading,
      fontWeight: '500',
      fontSize: '20px',
      lineHeight: '28px',
    },
    // 安全设置列表行：分割线 + 标题（Listy 语义 item 挂类名）
    securityItem: {
      padding: '14px 0',
      borderBottom: `1px solid ${token.colorSplit}`,
      '&:last-child': { borderBottom: 'none' },
    },
    securityTitle: {
      display: 'block',
      marginBottom: '4px',
      color: token.colorTextHeading,
      fontSize: '14px',
    },
  };
});

export default useStyles;
