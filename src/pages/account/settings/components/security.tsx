import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { App, Button, Flex, Listy, Typography } from 'antd';
import React, { useState } from 'react';
import { redirectToLogin } from '@/services/system/request';
import { resetUserPassword } from '@/services/system/user';
import { encodeSensitive } from '@/utils/encoding';
import { useFormRules, useT } from '@/utils/i18n';
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
  const t = useT();
  const rules = useFormRules();
  const { initialState } = useModel('@@initialState');
  const [pwdOpen, setPwdOpen] = useState(false);
  const currentUser = initialState?.currentUser;

  if (!currentUser) return null;

  const items: SecurityItem[] = [
    {
      key: 'password',
      title: t('pages.account.security.password.title'),
      description: t('pages.account.security.password.desc'),
      actions: [
        <Button
          key="modify"
          type="link"
          onClick={() => {
            setPwdOpen(true);
          }}
        >
          {t('pages.account.security.modify')}
        </Button>,
      ],
    },
    {
      key: 'phone',
      title: t('pages.account.security.phone.title'),
      description: currentUser.phone
        ? t('pages.account.security.phone.bound', {
            phone: maskPhone(currentUser.phone),
          })
        : t('pages.account.security.phone.unbound'),
    },
    {
      key: 'email',
      title: t('pages.account.security.email.title'),
      description: currentUser.email
        ? t('pages.account.security.email.bound', {
            email: maskEmail(currentUser.email),
          })
        : t('pages.account.security.email.unbound'),
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
        title={t('pages.account.security.changePassword.title')}
        width={480}
        open={pwdOpen}
        onOpenChange={setPwdOpen}
        modalProps={{ destroyOnHidden: true }}
        submitter={{
          searchConfig: {
            submitText: t('pages.account.security.changePassword.submit'),
            resetText: t('common.action.cancel'),
          },
        }}
        onFinish={async (values) => {
          await resetUserPassword(
            currentUser.id,
            encodeSensitive(values.password),
          );
          message.success(t('pages.account.security.changePassword.success'));
          // 改密后后端吊销全部会话：本地令牌已作废，直接回登录页重新登录，
          // 而不是等访问令牌过期时被突然踢出
          redirectToLogin();
          return true;
        }}
      >
        <ProFormText.Password
          name="password"
          label={t('pages.system.user.form.newPassword')}
          placeholder={t('pages.system.user.form.password.placeholder')}
          rules={[
            rules.required(t('pages.system.user.form.newPassword')),
            rules.passwordLength(),
          ]}
        />
      </ModalForm>
    </>
  );
};

export default SecurityView;
