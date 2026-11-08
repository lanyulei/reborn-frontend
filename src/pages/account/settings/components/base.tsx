import { ProForm, ProFormRadio, ProFormText } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { App } from 'antd';
import React, { startTransition } from 'react';
import { GENDER_OPTIONS } from '@/constants';
import type { Gender } from '@/services/system/typings';
import { type UpdateUserParams, updateUser } from '@/services/system/user';

interface BaseFormValues {
  nickname: string;
  gender: Gender;
  email?: string;
  phone?: string;
}

/** 基本设置：编辑本人资料（后端无头像上传，仅 nickname/gender/email/phone 可改） */
const BaseView: React.FC = () => {
  const { message } = App.useApp();
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
    message.success('更新基本信息成功');
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
        searchConfig: { submitText: '更新基本信息' },
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
      <ProFormText width="md" name="username" label="用户名" disabled />
      <ProFormText
        width="md"
        name="nickname"
        label="昵称"
        rules={[
          { required: true, message: '请输入您的昵称!' },
          { max: 64, message: '最多 64 位' },
        ]}
      />
      <ProFormRadio.Group name="gender" label="性别" options={GENDER_OPTIONS} />
      <ProFormText
        width="md"
        name="email"
        label="邮箱"
        rules={[{ type: 'email', message: '邮箱格式不正确!' }]}
      />
      <ProFormText width="md" name="phone" label="手机号" />
    </ProForm>
  );
};

export default BaseView;
