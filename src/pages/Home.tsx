import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useModel } from '@umijs/max';
import { Typography } from 'antd';
import React from 'react';

const Home: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState ?? {};

  return (
    <PageContainer title={false}>
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <Typography.Title level={2} style={{ marginBottom: 8 }}>
          <FormattedMessage
            id="pages.home.welcomeTitle"
            defaultMessage="欢迎登录 LanYuLei"
          />
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 16 }}>
          <FormattedMessage
            id="pages.home.welcomeDesc"
            defaultMessage="{name}，您已成功登录，祝您使用愉快！"
            values={{
              name: currentUser?.nickname || currentUser?.username || '',
            }}
          />
        </Typography.Text>
      </div>
    </PageContainer>
  );
};

export default Home;
