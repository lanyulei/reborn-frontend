import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  pageContainer: {
    // 对齐工作负载详情页：全局隐藏标题左侧，这里仅恢复标题行容器以露出右侧「操作」按钮。
    '.ant-pro-page-container-warp-page-header .ant-page-header-heading': {
      display: 'flex !important',
      paddingBlockStart: 0,
      marginBlockStart: 0,
      marginBottom: 10,
    },
    '.ant-pro-page-container-warp-page-header .ant-page-header-breadcrumb': {
      paddingBottom: 13,
    },
  },
  content: {
    backgroundColor: token.colorBgContainer,
    border: `1px solid ${token.colorBorder}80`,
    borderRadius: token.borderRadiusLG,
    padding: 18,
  },
  moreInfo: {
    marginTop: 15,
  },
  moreInfoCard: {
    borderColor: `${token.colorBorder}80`,

    '.ant-card-body': {
      paddingTop: 2,
    },
  },
  overview: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorBgContainer,

    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  resourceItem: {
    display: 'grid',
    gridTemplateColumns: '52px 1fr',
    alignItems: 'center',
    minHeight: 62,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 4,
    backgroundColor: token.colorFillQuaternary,
    transition: `background-color ${token.motionDurationMid}`,

    '&:hover': {
      backgroundColor: token.colorFillSecondary,
    },
  },
  resourceIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: token.colorTextSecondary,
    fontSize: 24,
  },
  resourceContent: {
    minWidth: 0,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
  },
  resourceCount: {
    color: token.colorText,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.4,
  },
  resourceCountActive: {
    color: token.colorSuccess,
  },
  resourceLabel: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  resourceSpin: {
    '.ant-spin-container': {
      minHeight: 0,
    },
  },
  quotaPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  defaultQuota: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginLG,
    padding: `8px 5px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  defaultQuotaGroup: {
    display: 'grid',
    gridTemplateColumns: '52px 1fr 1fr',
    alignItems: 'center',
    minHeight: 48,
  },
  quotaIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: token.colorTextSecondary,
    fontSize: 26,
  },
  quotaMetric: {
    minWidth: 0,
  },
  quotaMetricValue: {
    display: 'block',
    overflow: 'hidden',
    color: token.colorText,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  quotaMetricLabel: {
    display: 'block',
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  projectQuota: {
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorFillQuaternary,
  },
  projectQuotaItem: {
    display: 'grid',
    gridTemplateColumns: '64px 180px 180px 180px 1fr',
    alignItems: 'center',
    minHeight: 70,
    padding: `0 ${token.padding}px 0 0`,
    transition: `background-color ${token.motionDurationMid}`,

    '&:hover': {
      backgroundColor: token.colorFillSecondary,
    },

    '@media (max-width: 1200px)': {
      gridTemplateColumns: '56px 1fr 1fr',
      rowGap: token.marginSM,
      padding: `${token.paddingSM}px ${token.padding}px`,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '48px 1fr',
    },
  },
  quotaUsage: {
    minWidth: 0,

    '@media (max-width: 1200px)': {
      gridColumn: '2 / 4',
    },

    '@media (max-width: 768px)': {
      gridColumn: '2 / 3',
    },
  },
  usageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: token.marginSM,
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  usageTitle: {
    color: token.colorText,
    fontSize: 14,
    // fontWeight: 600,
  },
  usageBar: {
    position: 'relative',
    height: 18,
    marginTop: 4,
    overflow: 'hidden',
    borderRadius: 0,
    backgroundColor: token.colorFillSecondary,
  },
  usageBarInner: {
    height: '100%',
    backgroundColor: token.colorPrimary,
  },
  usageLimit: {
    position: 'absolute',
    top: 0,
    right: token.paddingSM,
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: '18px',
  },
  quotaForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    padding: `${token.paddingXS}px 0`,
  },
  quotaFormSectionTitle: {
    color: token.colorText,
    fontWeight: 500,
    lineHeight: token.lineHeight,
    marginTop: token.marginXS,

    '&:first-child': {
      marginTop: 0,
    },
  },
  storageQuotaCard: {
    padding: ` 0 ${token.padding}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorFillQuaternary,
  },
  storageQuotaTabs: {
    '.ant-tabs-nav': {
      marginBottom: token.marginSM,
    },
  },
  storageQuotaFields: {
    display: 'flex',
    flexDirection: 'column',
    // gap: token.marginSM,
  },
  storageQuotaSlider: {
    marginBottom: 16,

    '.ant-form-item-control-input-content': {
      boxSizing: 'border-box',
      padding: `0 ${token.paddingLG}px`,
    },

    '.ant-slider': {
      width: '100%',
    },
  },
  storageQuotaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: `20px`,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  storageQuotaGridItem: {
    marginBottom: 0,
  },
  storageQuotaTotalBlock: {
    minHeight: 64,
    padding: `12px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorBgContainer,
    boxShadow: token.boxShadowTertiary,
  },
  storageClassList: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    marginBottom: token.marginSM,
  },
  storageClassQuotaItem: {
    display: 'grid',
    gridTemplateColumns:
      '52px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 76px',
    alignItems: 'center',
    minHeight: 64,
    padding: `${token.paddingXS}px ${token.paddingSM}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorBgContainer,
    boxShadow: token.boxShadowTertiary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '44px minmax(0, 1fr) 76px',
      rowGap: token.marginXS,
    },
  },
  storageClassIcon: {
    color: token.colorTextSecondary,
    fontSize: 26,
    textAlign: 'center',
  },
  storageClassMetric: {
    minWidth: 0,
  },
  storageClassActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  storageClassSelectBox: {
    padding: token.paddingSM,
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorBgContainer,
  },
  storageClassSelectHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
    marginBottom: token.marginSM,
  },
  storageClassFields: {
    marginTop: token.marginMD,
  },
}));

export default useStyles;
