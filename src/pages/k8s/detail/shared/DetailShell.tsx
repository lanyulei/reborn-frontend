import { Alert, Card, Empty, Spin, Tabs } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import SectionTitle from '@/components/SectionTitle';
import { useT } from '@/utils/i18n';

export type DetailTabItem = {
  key: string;
  label: string;
  children: ReactNode;
};

type DetailShellProps = {
  loading: boolean;
  error?: string;
  /** 对象已取到 */
  ready: boolean;
  emptyText?: string;
  basicInfo: ReactNode;
  tabs: DetailTabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  children?: ReactNode;
};

const useStyles = createStyles(({ token }) => ({
  content: {
    backgroundColor: token.colorBgContainer,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    padding: 18,
  },
  basicInfoContent: {
    display: 'flex',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    gap: 20,
  },
  moreInfo: {
    marginTop: 15,
    borderColor: token.colorBorderSecondary,
    '.ant-card-body': {
      paddingTop: 2,
    },
  },
}));

const DetailShell = ({
  loading,
  error,
  ready,
  emptyText,
  basicInfo,
  tabs,
  activeTab,
  onTabChange,
  children,
}: DetailShellProps) => {
  const t = useT();
  const { styles } = useStyles();

  return (
    <>
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={error}
        />
      )}
      <SectionTitle style={{ marginTop: 0 }}>
        {t('pages.k8s.detail.basicInfo')}
      </SectionTitle>
      <div className={styles.content}>
        <Spin spinning={loading}>
          {ready ? (
            <div className={styles.basicInfoContent}>{basicInfo}</div>
          ) : (
            <Empty
              description={
                loading
                  ? t('pages.k8s.detail.loading')
                  : (emptyText ?? t('pages.k8s.detail.shell.empty'))
              }
            />
          )}
        </Spin>
      </div>
      {ready && tabs.length > 0 && (
        <Card className={styles.moreInfo}>
          <Tabs
            activeKey={
              tabs.some((item) => item.key === activeTab)
                ? activeTab
                : tabs[0].key
            }
            destroyOnHidden
            items={tabs}
            onChange={onTabChange}
          />
        </Card>
      )}
      {children}
    </>
  );
};

export default DetailShell;
