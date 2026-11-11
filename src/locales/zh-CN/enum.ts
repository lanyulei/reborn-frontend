/** 枚举文案：与 src/constants 中各 *_META 的 textId 一一对应 */
export default {
  'enum.gender.male': '男',
  'enum.gender.female': '女',
  'enum.gender.unknown': '未知',

  'enum.userStatus.1': '可用',
  'enum.userStatus.2': '停用',
  'enum.userStatus.3': '暂停',
  'enum.userStatus.4': '离职',

  'enum.roleStatus.1': '启用',
  'enum.roleStatus.0': '禁用',

  'enum.loginLogResult.1': '成功',
  'enum.loginLogResult.2': '用户不存在',
  'enum.loginLogResult.3': '密码错误',
  'enum.loginLogResult.4': '账号禁用',
  'enum.loginLogResult.5': '签发令牌失败',

  'enum.channelType.email': '邮件（SMTP）',
  'enum.channelType.email.secretLabel': 'SMTP 密码',
  'enum.channelType.email.secretPlaceholder': 'SMTP 认证密码，1-512 位',
  'enum.channelType.webhook': 'Webhook',
  'enum.channelType.webhook.secretLabel': 'HMAC 签名密钥',
  'enum.channelType.webhook.secretPlaceholder':
    '出站 HMAC-SHA256 签名密钥，可选，1-512 位',
  'enum.channelType.dingtalk': '钉钉机器人',
  'enum.channelType.dingtalk.secretLabel': '机器人 Token',
  'enum.channelType.dingtalk.secretPlaceholder':
    '钉钉群机器人 access_token，1-512 位',
  'enum.channelType.wecom': '企业微信机器人',
  'enum.channelType.wecom.secretLabel': '机器人 Key',
  'enum.channelType.wecom.secretPlaceholder':
    '企微群机器人 webhook 密钥，1-512 位',
  'enum.channelType.feishu': '飞书机器人',
  'enum.channelType.feishu.secretLabel': '机器人 Token',
  'enum.channelType.feishu.secretPlaceholder': '飞书群机器人签名密钥，1-512 位',

  'enum.severity.1': '提示',
  'enum.severity.2': '警告',
  'enum.severity.3': '严重',
  'enum.severity.4': '致命',

  'enum.templateChannel.any': '任意渠道',
  'enum.templateChannel.email': '邮件',
  'enum.templateChannel.webhook': 'Webhook',
  'enum.templateChannel.dingtalk': '钉钉',
  'enum.templateChannel.wecom': '企业微信',
  'enum.templateChannel.feishu': '飞书',

  'enum.eventStatus.1': '已接收',
  'enum.eventStatus.2': '已路由',
  'enum.eventStatus.3': '已静默',
  'enum.eventStatus.4': '路由失败',

  'enum.publishState.0': '待发布',
  'enum.publishState.1': '已发布',

  'enum.dispatchStatus.1': '待发送',
  'enum.dispatchStatus.2': '发送中',
  'enum.dispatchStatus.3': '已发送',
  'enum.dispatchStatus.4': '重试中',
  'enum.dispatchStatus.5': '死信',

  'enum.replayState.1': '未重放',
  'enum.replayState.2': '待重放',
  'enum.replayState.3': '已重放',

  'enum.eventSource.api': '生产者接入',
  'enum.eventSource.internal': '内置产生',

  'enum.enabled.true': '启用',
  'enum.enabled.false': '停用',

  'enum.deliveryOk.true': '成功',
  'enum.deliveryOk.false': '失败',
};
