import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { App, Button, Flex, Listy, Typography } from 'antd';
import React, { useState } from 'react';
import { PASSWORD_LENGTH_RULE } from '@/constants';
import { resetUserPassword } from '@/services/system/user';
import { encodeSensitive } from '@/utils/encoding';
import useStyles from '../style';

const maskPhone = (phone: string) =>
  `${phone.slice(0, 3)}****${phone.slice(-4)}`;

const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}***@${domain}`;
};

interface SecurityItem {
  key: string;
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode[];
}

/** 安全设置：修改密码走本人重置接口；手机/邮箱在基本设置中维护 */
const SecurityView: React.FC = () => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const { initialState } = useModel('@@initialState');
  const [pwdOpen, setPwdOpen] = useState(false);
  const currentUser = initialState?.currentUser;

  if (!currentUser) return null;

  const items: SecurityItem[] = [
    {
      key: 'password',
      title: '账户密码',
      description: '定期更换密码可有效保护账户安全',
      actions: [
        <Button
          key="modify"
          type="link"
          onClick={() => {
            setPwdOpen(true);
          }}
        >
          修改
        </Button>,
      ],
    },
    {
      key: 'phone',
      title: '密保手机',
      description: currentUser.phone
        ? `已绑定手机：${maskPhone(currentUser.phone)}`
        : '未绑定手机，可在基本设置中填写',
    },
    {
      key: 'email',
      title: '备用邮箱',
      description: currentUser.email
        ? `已绑定邮箱：${maskEmail(currentUser.email)}`
        : '未绑定邮箱，可在基本设置中填写',
    },
  ];

  return (
    <>
      <Listy
        items={items}
        rowKey={(item) => item.key}
        classNames={{ item: styles.securityItem }}
        itemRender={(item) => (
          <Flex gap={16} align="center">
            <Flex vertical flex="auto" style={{ minWidth: 0 }}>
              <span className={styles.securityTitle}>{item.title}</span>
              <Typography.Text type="secondary">
                {item.description}
              </Typography.Text>
            </Flex>
            {item.actions}
          </Flex>
        )}
      ></Listy>

      {/* 修改密码：与登录/重置密码一致，密码经 Base64 编码后传输 */}
      <ModalForm
        title="修改密码"
        width={480}
        open={pwdOpen}
        onOpenChange={setPwdOpen}
        modalProps={{ destroyOnHidden: true }}
        submitter={{
          searchConfig: { submitText: '确认修改', resetText: '取消' },
        }}
        onFinish={async (values) => {
          await resetUserPassword(
            currentUser.id,
            encodeSensitive(values.password),
          );
          message.success('密码已修改');
          return true;
        }}
      >
        <ProFormText.Password
          name="password"
          label="新密码"
          placeholder="8-64 位"
          rules={[
            { required: true, message: '请输入新密码' },
            PASSWORD_LENGTH_RULE,
          ]}
        />
      </ModalForm>
    </>
  );
};

export default SecurityView;
