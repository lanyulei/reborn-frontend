/** Enum wording: maps 1:1 to the textId values in src/constants *_META */
export default {
  'enum.gender.male': 'Male',
  'enum.gender.female': 'Female',
  'enum.gender.unknown': 'Unknown',

  'enum.userStatus.1': 'Active',
  'enum.userStatus.2': 'Disabled',
  'enum.userStatus.3': 'Suspended',
  'enum.userStatus.4': 'Resigned',

  'enum.roleStatus.1': 'Enabled',
  'enum.roleStatus.0': 'Disabled',

  'enum.loginLogResult.1': 'Success',
  'enum.loginLogResult.2': 'User not found',
  'enum.loginLogResult.3': 'Wrong password',
  'enum.loginLogResult.4': 'Account disabled',
  'enum.loginLogResult.5': 'Token issuance failed',

  'enum.channelType.email': 'Email (SMTP)',
  'enum.channelType.email.secretLabel': 'SMTP password',
  'enum.channelType.email.secretPlaceholder':
    'SMTP auth password, 1-512 characters',
  'enum.channelType.webhook': 'Webhook',
  'enum.channelType.webhook.secretLabel': 'HMAC signing secret',
  'enum.channelType.webhook.secretPlaceholder':
    'Outbound HMAC-SHA256 signing secret, optional, 1-512 characters',
  'enum.channelType.dingtalk': 'DingTalk bot',
  'enum.channelType.dingtalk.secretLabel': 'Bot token',
  'enum.channelType.dingtalk.secretPlaceholder':
    'DingTalk group bot access_token, 1-512 characters',
  'enum.channelType.wecom': 'WeCom bot',
  'enum.channelType.wecom.secretLabel': 'Bot key',
  'enum.channelType.wecom.secretPlaceholder':
    'WeCom group bot webhook key, 1-512 characters',
  'enum.channelType.feishu': 'Feishu bot',
  'enum.channelType.feishu.secretLabel': 'Bot token',
  'enum.channelType.feishu.secretPlaceholder':
    'Feishu group bot signing secret, 1-512 characters',

  'enum.severity.1': 'Info',
  'enum.severity.2': 'Warning',
  'enum.severity.3': 'Critical',
  'enum.severity.4': 'Fatal',

  'enum.templateChannel.any': 'Any channel',
  'enum.templateChannel.email': 'Email',
  'enum.templateChannel.webhook': 'Webhook',
  'enum.templateChannel.dingtalk': 'DingTalk',
  'enum.templateChannel.wecom': 'WeCom',
  'enum.templateChannel.feishu': 'Feishu',

  'enum.eventStatus.1': 'Received',
  'enum.eventStatus.2': 'Routed',
  'enum.eventStatus.3': 'Silenced',
  'enum.eventStatus.4': 'Routing failed',

  'enum.publishState.0': 'Pending',
  'enum.publishState.1': 'Published',

  'enum.dispatchStatus.1': 'Pending',
  'enum.dispatchStatus.2': 'Sending',
  'enum.dispatchStatus.3': 'Sent',
  'enum.dispatchStatus.4': 'Retrying',
  'enum.dispatchStatus.5': 'Dead letter',

  'enum.replayState.1': 'Not replayed',
  'enum.replayState.2': 'Pending replay',
  'enum.replayState.3': 'Replayed',

  'enum.eventSource.api': 'Producer API',
  'enum.eventSource.internal': 'Internal',

  'enum.enabled.true': 'Enabled',
  'enum.enabled.false': 'Disabled',

  'enum.deliveryOk.true': 'Success',
  'enum.deliveryOk.false': 'Failed',
};
