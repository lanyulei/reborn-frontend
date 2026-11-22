import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { App, Button, Flex, Listy, Typography } from 'antd';
import React, { useState } from 'react';
import { changeMyPassword } from '@/services/system/auth';
import { getErrorReason } from '@/services/system/domainRequest';
import { getErrorMessage, redirectToLogin } from '@/services/system/request';
import { encodeSensitive } from '@/utils/encoding';
import { useFormRules, useT } from '@/utils/i18n';
import useStyles from '../style';

const maskPhone = (phone: string) =>
  `${phone.slice(0, 3)}****${phone.slice(-4)}`;

const maskEmail = (email: string) => {
  const at = email.indexOf('@');
  // 没有 @ 的异常值：只露前两位，避免拼出 "undefined"
  if (at < 0) return `${email.slice(0, 2)}***`;
  return `${email.slice(0, 2)}***@${email.slice(at + 1)}`;
};

interface SecurityItem {
  key: string;
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode[];
}

/** 安全设置：修改密码走本人自助改密接口（需当前密码）；手机/邮箱在基本设置中维护 */
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

      {/* 修改密码：需校验当前密码；与登录/重置密码一致，密码经 Base64 编码后传输 */}
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
          try {
            await changeMyPassword(
              encodeSensitive(values.oldPassword),
              encodeSensitive(values.password),
              { silent: true },
            );
          } catch (error) {
            // 当前密码错误给本地化提示，其余沿用后端文案；弹窗保持打开
            message.error(
              getErrorReason(error) === 'USER_PASSWORD_INVALID'
                ? t('pages.account.security.changePassword.oldInvalid')
                : getErrorMessage(error),
            );
            return false;
          }
          message.success(t('pages.account.security.changePassword.success'));
          // 改密后后端吊销全部会话：本地令牌已作废，直接回登录页重新登录，
          // 而不是等访问令牌过期时被突然踢出
          redirectToLogin();
          return true;
        }}
      >
        <ProFormText.Password
          name="oldPassword"
          label={t('pages.account.security.changePassword.oldPassword')}
          placeholder={t(
            'pages.account.security.changePassword.oldPassword.placeholder',
          )}
          rules={[
            rules.required(
              t('pages.account.security.changePassword.oldPassword'),
            ),
          ]}
        />
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
