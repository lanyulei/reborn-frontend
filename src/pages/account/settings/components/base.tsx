import { UserOutlined } from '@ant-design/icons';
import { ProForm, ProFormRadio, ProFormText } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { App, Avatar, Button, Space, Typography } from 'antd';
import React, { startTransition, useRef, useState } from 'react';
import { GENDER_META, GENDER_ORDER } from '@/constants';
import { uploadMyAvatar } from '@/services/system/auth';
import type { Gender } from '@/services/system/typings';
import { type UpdateUserParams, updateUser } from '@/services/system/user';
import { useFormRules, useOptions, useT } from '@/utils/i18n';

interface BaseFormValues {
  nickname: string;
  gender: Gender;
  email?: string;
  phone?: string;
}

/** 头像限制：png / jpeg / webp，≤1MB（与后端 proto 校验一致） */
const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp';
const AVATAR_MAX_BYTES = 1024 * 1024;
/** 两列栅格：用户名/昵称一行，邮箱/手机号一行；性别独占一行 */
const HALF = { span: 12 };
const FULL = { span: 24 };

/** 基本设置：头像上传 + 编辑本人资料（nickname/gender/email/phone） */
const BaseView: React.FC = () => {
  const { message } = App.useApp();
  const t = useT();
  const rules = useFormRules();
  const genderOptions = useOptions(GENDER_META, GENDER_ORDER);
  const { initialState, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  /** 上传成功后刷新全局 currentUser，右上角与智能助手头像即时生效 */
  const refreshProfile = async () => {
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
  };

  /** 选择文件：前端先校验类型与大小，再走自助上传接口，成功后刷新全局用户信息 */
  const onAvatarPicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 允许再次选择同一文件
    event.target.value = '';
    if (!file) return;
    if (!AVATAR_ACCEPT.split(',').includes(file.type)) {
      message.error(t('pages.account.avatar.type'));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      message.error(t('pages.account.avatar.size'));
      return;
    }
    setUploading(true);
    try {
      await uploadMyAvatar(file);
      message.success(t('pages.account.avatar.success'));
      await refreshProfile();
    } catch {
      // authRequest 已提示
    } finally {
      setUploading(false);
    }
  };

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
    await refreshProfile();
    return true;
  };

  return (
    <>
      <Space size="large" align="center" style={{ marginBottom: 24 }}>
        <Avatar
          size={96}
          src={currentUser.avatar || undefined}
          icon={<UserOutlined />}
        />
        <Space vertical size="small">
          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            style={{ display: 'none' }}
            onChange={(e) => void onAvatarPicked(e)}
          />
          <Button
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('pages.account.avatar.upload')}
          </Button>
          <Typography.Text type="secondary">
            {t('pages.account.avatar.hint')}
          </Typography.Text>
        </Space>
      </Space>
      <ProForm
        layout="vertical"
        grid
        rowProps={{ gutter: 24 }}
        style={{ maxWidth: 720 }}
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
          colProps={HALF}
          name="username"
          label={t('pages.system.user.column.username')}
          disabled
        />
        <ProFormText
          colProps={HALF}
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
          colProps={FULL}
          name="gender"
          label={t('pages.system.user.column.gender')}
          options={genderOptions}
        />
        <ProFormText
          colProps={HALF}
          name="email"
          label={t('pages.system.user.column.email')}
          rules={[
            { type: 'email', message: t('pages.account.base.email.invalid') },
          ]}
        />
        <ProFormText
          colProps={HALF}
          name="phone"
          label={t('pages.system.user.column.phone')}
        />
      </ProForm>
    </>
  );
};

export default BaseView;
