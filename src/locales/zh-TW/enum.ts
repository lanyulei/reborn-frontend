/** 列舉文案：與 src/constants 中各 *_META 的 textId 一一對應 */
export default {
  'enum.gender.male': '男',
  'enum.gender.female': '女',
  'enum.gender.unknown': '未知',

  'enum.userStatus.1': '可用',
  'enum.userStatus.2': '停用',
  'enum.userStatus.3': '暫停',
  'enum.userStatus.4': '離職',

  'enum.roleStatus.1': '啟用',
  'enum.roleStatus.0': '停用',

  'enum.loginLogResult.1': '成功',
  'enum.loginLogResult.2': '使用者不存在',
  'enum.loginLogResult.3': '密碼錯誤',
  'enum.loginLogResult.4': '帳號停用',
  'enum.loginLogResult.5': '簽發權杖失敗',

  'enum.channelType.email': '郵件（SMTP）',
  'enum.channelType.email.secretLabel': 'SMTP 密碼',
  'enum.channelType.email.secretPlaceholder': 'SMTP 認證密碼，1-512 位',
  'enum.channelType.webhook': 'Webhook',
  'enum.channelType.webhook.secretLabel': 'HMAC 簽章金鑰',
  'enum.channelType.webhook.secretPlaceholder':
    '出站 HMAC-SHA256 簽章金鑰，可選，1-512 位',
  'enum.channelType.dingtalk': '釘釘機器人',
  'enum.channelType.dingtalk.secretLabel': '機器人 Token',
  'enum.channelType.dingtalk.secretPlaceholder':
    '釘釘群機器人 access_token，1-512 位',
  'enum.channelType.wecom': '企業微信機器人',
  'enum.channelType.wecom.secretLabel': '機器人 Key',
  'enum.channelType.wecom.secretPlaceholder':
    '企微群機器人 webhook 金鑰，1-512 位',
  'enum.channelType.feishu': '飛書機器人',
  'enum.channelType.feishu.secretLabel': '機器人 Token',
  'enum.channelType.feishu.secretPlaceholder': '飛書群機器人簽章金鑰，1-512 位',

  'enum.severity.1': '提示',
  'enum.severity.2': '警告',
  'enum.severity.3': '嚴重',
  'enum.severity.4': '致命',

  'enum.templateChannel.any': '任意頻道',
  'enum.templateChannel.email': '郵件',
  'enum.templateChannel.webhook': 'Webhook',
  'enum.templateChannel.dingtalk': '釘釘',
  'enum.templateChannel.wecom': '企業微信',
  'enum.templateChannel.feishu': '飛書',

  'enum.eventStatus.1': '已接收',
  'enum.eventStatus.2': '已路由',
  'enum.eventStatus.3': '已靜默',
  'enum.eventStatus.4': '路由失敗',

  'enum.publishState.0': '待發布',
  'enum.publishState.1': '已發布',

  'enum.dispatchStatus.1': '待發送',
  'enum.dispatchStatus.2': '發送中',
  'enum.dispatchStatus.3': '已發送',
  'enum.dispatchStatus.4': '重試中',
  'enum.dispatchStatus.5': '死信',

  'enum.replayState.1': '未重放',
  'enum.replayState.2': '待重放',
  'enum.replayState.3': '已重放',

  'enum.eventSource.api': '生產者接入',
  'enum.eventSource.internal': '內建產生',

  'enum.enabled.true': '啟用',
  'enum.enabled.false': '停用',

  'enum.deliveryOk.true': '成功',
  'enum.deliveryOk.false': '失敗',
};
