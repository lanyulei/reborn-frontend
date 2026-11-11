import { ProForm, ProFormRadio, ProFormText } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { App } from 'antd';
import React, { startTransition } from 'react';
import { GENDER_META, GENDER_ORDER } from '@/constants';
import type { Gender } from '@/services/system/typings';
import { type UpdateUserParams, updateUser } from '@/services/system/user';
import { useFormRules, useOptions, useT } from '@/utils/i18n';

interface BaseFormValues {
  nickname: string;
  gender: Gender;
  email?: string;
  phone?: string;
}

/** 基本设置：编辑本人资料（后端无头像上传，仅 nickname/gender/email/phone 可改） */
const BaseView: React.FC = () => {
  const { message } = App.useApp();
  const t = useT();
  const rules = useFormRules();
  const genderOptions = useOptions(GENDER_META, GENDER_ORDER);
  const { initialState, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  if (!currentUser) return null;

  const handleFinish = async (values: BaseFormValues) => {
    const body: UpdateUserParams = {
      nickname: values.nickname,
      gender: values.gender,
      isAdmin: currentUser.isAdmin,
    };
    if (values.email) body.email = values.email;
    if (values.phone) body.phone = values.phone;
    await updateUser(currentUser.id, body);
    message.success(t('pages.account.base.success'));
    // 同步全局 currentUser，右上角昵称等展示即时生效
    const profile = await initialState?.fetchUserInfo?.();
    if (profile?.user) {
      startTransition(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: profile.user,
          roles: profile.roles,
        }));
      });
    }
    return true;
  };

  return (
    <ProForm
      layout="vertical"
      onFinish={handleFinish}
      submitter={{
        searchConfig: { submitText: t('pages.account.base.submit') },
        render: (_, dom) => dom[1],
      }}
      initialValues={{
        username: currentUser.username,
        nickname: currentUser.nickname,
        gender: currentUser.gender,
        email: currentUser.email,
        phone: currentUser.phone,
      }}
      requiredMark={false}
    >
      <ProFormText
        width="md"
        name="username"
        label={t('pages.system.user.column.username')}
        disabled
      />
      <ProFormText
        width="md"
        name="nickname"
        label={t('pages.system.user.column.nickname')}
        rules={[
          {
            required: true,
            message: t('pages.account.base.nickname.required'),
          },
          rules.max(64),
        ]}
      />
      <ProFormRadio.Group
        name="gender"
        label={t('pages.system.user.column.gender')}
        options={genderOptions}
      />
      <ProFormText
        width="md"
        name="email"
        label={t('pages.system.user.column.email')}
        rules={[
          { type: 'email', message: t('pages.account.base.email.invalid') },
        ]}
      />
      <ProFormText
        width="md"
        name="phone"
        label={t('pages.system.user.column.phone')}
      />
    </ProForm>
  );
};

export default BaseView;
