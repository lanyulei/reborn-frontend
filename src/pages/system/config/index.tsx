import { CloudUploadOutlined } from '@ant-design/icons';
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  PageContainer,
  ProForm,
  ProFormText,
} from '@ant-design/pro-components';
import { useIntl, useModel } from '@umijs/max';
import { App, Button, Form, Image, Radio, Typography, theme } from 'antd';
import React, { useRef, useState } from 'react';
import {
  getSystemConfig,
  LOGO_MAX_SIZE,
  LOGO_MIME_WHITELIST,
  updateSystemConfig,
  uploadSystemLogo,
} from '@/services/system/config';
import { usePermissions } from '@/services/system/permissions';
import type { SystemConfig } from '@/services/system/typings';
import defaultSettings from '../../../../config/defaultSettings';

/** 表单字段宽度：基础 md(328px) ×1.5 再 ×1.2 */
const FIELD_WIDTH = 590;

/** logo 配置方式二选一：图片 URL / 本地上传（已存值为上传指纹 URL 时归入上传） */
type LogoMode = 'url' | 'upload';

/**
 * 系统配置页：全局展示配置（系统标题/子标题/logo/页脚文案），后端单行表
 * 存储，表单整页提交全量覆盖（空串 = 清空该项，前端回退构建期默认值）。
 * logo 二选一配置：默认本地上传，可切图片 URL（上传返回带指纹 URL 存
 * 入字段，已存外链 URL 时回显为图片 URL 方式）。
 * 保存成功后同步 initialState（settings + systemConfig），顶栏标题/logo、
 * 浏览器标签页、页脚即时生效。编辑随元素权限 system.config.edit（管理员
 * 短路放行），未授权用户只读查看。
 */
const SystemConfigPage: React.FC = () => {
  const intl = useIntl();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const { setInitialState } = useModel('@@initialState');
  const canEdit = usePermissions()('system.config.edit');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoMode, setLogoMode] = useState<LogoMode>('upload');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<ProFormInstance<SystemConfig> | undefined>(undefined);

  /** 本地文件上传：校验类型/大小 → base64 上传 → URL 自动填入表单字段 */
  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!LOGO_MIME_WHITELIST.includes(file.type)) {
      message.error(
        `不支持的图片格式 ${file.type || '(未知)'}，仅支持 PNG/JPEG/SVG/WebP/ICO`,
      );
      return;
    }
    if (file.size > LOGO_MAX_SIZE) {
      message.error('图片大小不能超过 2MB');
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadSystemLogo(file);
      // 上传成功：URL 自动填入表单字段并同步预览，随保存落库
      formRef.current?.setFieldsValue({ logo: url });
      setLogoUrl(url);
      message.success('Logo 已上传，保存配置后生效');
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '上传失败，请重试',
      );
    } finally {
      setUploading(false);
      // 允许连续重选同一文件（change 只在同值变化时触发）
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFinish = async (values: SystemConfig) => {
    await updateSystemConfig(values);
    message.success('系统配置已保存');
    // 同步全局状态：顶栏标题/logo、标签页、页脚即时生效
    // （标签页标题由 ProLayout 的 useDocumentTitle 随 settings.title 更新）
    setInitialState((s) => ({
      ...s,
      systemConfig: values,
      settings: {
        ...s?.settings,
        // 空串 = 清空该项，回退构建期默认值（与 getInitialState 合并语义一致）
        title: values.title || defaultSettings.title,
        logo: values.logo || defaultSettings.logo,
        // 子标题仅登录页展示（读 systemConfig）：不进布局 settings 并清残留
        subTitle: undefined,
      },
    }));
    return true;
  };

  const breadcrumbItems = [
    { title: intl.formatMessage({ id: 'menu.system' }) },
    { title: intl.formatMessage({ id: 'menu.system.config' }) },
  ];

  return (
    // subTitle={false}：本页顶部页头不再重复展示子标题（表单内可编辑），
    // 登录页/其他页面页头的子标题展示不受影响
    <PageContainer
      title={false}
      subTitle={false}
      breadcrumb={{ items: breadcrumbItems }}
    >
      {!canEdit && (
        <Typography.Paragraph type="secondary">
          当前角色未授权「编辑系统配置」，以下内容仅可查看。
        </Typography.Paragraph>
      )}
      <ProForm<SystemConfig>
        layout="vertical"
        formRef={formRef}
        request={async () => {
          const { config } = await getSystemConfig();
          setLogoUrl(config.logo);
          // 已存值是外链 URL → 归入图片 URL 方式，其余（空/上传指纹）默认本地上传
          setLogoMode(
            config.logo !== '' &&
              !config.logo.startsWith('/api/v1/system/config/logo')
              ? 'url'
              : 'upload',
          );
          return config;
        }}
        onValuesChange={(changed) => {
          if ('logo' in changed) {
            setLogoUrl((changed as { logo?: string }).logo ?? '');
          }
        }}
        onFinish={handleFinish}
        submitter={
          canEdit
            ? {
                searchConfig: { submitText: '保存配置' },
                render: (_, dom) => dom[1],
                resetButtonProps: { style: { display: 'none' } },
              }
            : false
        }
      >
        <ProFormText
          width={FIELD_WIDTH}
          name="title"
          label="系统标题"
          placeholder="显示在顶栏、浏览器标签页与登录页；留空使用默认标题"
          disabled={!canEdit}
          rules={[{ max: 50, message: '最多 50 个字符' }]}
        />
        <ProFormText
          width={FIELD_WIDTH}
          name="subTitle"
          label="系统子标题"
          placeholder="标题旁的补充小字；留空不显示"
          disabled={!canEdit}
          rules={[{ max: 100, message: '最多 100 个字符' }]}
        />
        {/* logo 配置二选一：默认本地上传，可切图片 URL；预览在输入控件上方 */}
        <Form.Item label="系统 Logo">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              width: FIELD_WIDTH,
            }}
          >
            <Radio.Group
              value={logoMode}
              onChange={(e) => setLogoMode(e.target.value as LogoMode)}
              disabled={!canEdit}
              options={[
                { label: '图片 URL', value: 'url' },
                { label: '本地上传', value: 'upload' },
              ]}
            />
            {/* 预览图：有图才渲染，空状态不占位；边框用主题色随明暗主题 */}
            {logoUrl && (
              <Image
                src={logoUrl}
                alt="logo 预览"
                width={96}
                height={96}
                style={{
                  objectFit: 'contain',
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: 4,
                }}
              />
            )}
            {/* URL 方式：隐藏而非卸载，切换方式时已填值/上传指纹不丢失 */}
            <div style={{ display: logoMode === 'url' ? 'block' : 'none' }}>
              <ProFormText
                name="logo"
                label={false}
                placeholder="https://example.com/logo.svg；留空使用默认 logo"
                disabled={!canEdit}
                rules={[{ max: 500, message: '最多 500 个字符' }]}
              />
            </div>
            {logoMode === 'upload' && (
              <div>
                {/* 原生 input + antd Button：antd v6 Upload 组件在 utoo pack 下
                    模块分析失败（编译期错误），logo 场景用原生文件选择等价实现 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={LOGO_MIME_WHITELIST.join(',')}
                  style={{ display: 'none' }}
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
                <Button
                  icon={<CloudUploadOutlined />}
                  loading={uploading}
                  disabled={!canEdit}
                  onClick={() => fileInputRef.current?.click()}
                >
                  上传本地图片
                </Button>
                <Typography.Text
                  type="secondary"
                  style={{ marginLeft: 12, fontSize: token.fontSizeSM }}
                >
                  支持 PNG/JPEG/SVG/WebP/ICO，≤2MB；上传后随保存配置生效
                </Typography.Text>
              </div>
            )}
          </div>
        </Form.Item>
        <ProFormText
          width={FIELD_WIDTH}
          name="footer"
          label="页脚文案"
          placeholder="页面底部展示的版权/描述文字；留空使用默认"
          disabled={!canEdit}
          rules={[{ max: 200, message: '最多 200 个字符' }]}
        />
      </ProForm>
    </PageContainer>
  );
};

export default SystemConfigPage;
