/** Notify module pages (channels / routes / silences / templates / subscriptions / sources / delivery trace) */
export default {
  // Shared across pages
  'pages.notify.common.channelOption': '{name} ({type})',
  'pages.notify.common.biz': 'Business',
  'pages.notify.common.biz.tooltip':
    'Business tenant id; routes, quotas and template resolution are isolated per biz. Leave empty for default',
  'pages.notify.common.biz.tooltip.restricted':
    'You can only create within the notify business scope granted to your roles',
  'pages.notify.common.biz.tooltip.readonly':
    'Business tenant id; immutable after creation',
  'pages.notify.common.biz.placeholder': 'Leave empty for default',
  'pages.notify.common.biz.filterPlaceholder': 'Business id (exact)',
  'pages.notify.common.bizIdRule':
    '1-64 lowercase letters, digits, underscores or hyphens',
  'pages.notify.common.eventPattern': 'Event pattern',
  'pages.notify.common.eventPattern.rule':
    'Exact / prefix wildcard (monitor.alert.*) / match all (*)',
  'pages.notify.common.channel': 'Channel',
  'pages.notify.common.deliveryChannel': 'Delivery channel',
  'pages.notify.common.eventId': 'Event ID',
  'pages.notify.common.eventId.placeholder': 'Drill down by event (exact)',
  'pages.notify.common.dispatchId': 'Dispatch ID',
  'pages.notify.common.dispatchId.placeholder':
    'Drill down by dispatch (exact)',
  'pages.notify.common.recipient': 'Recipient',
  'pages.notify.common.attempts': 'Attempts',
  'pages.notify.common.failReason': 'Failure reason',
  'pages.notify.common.viewDispatch': 'View dispatches',
  'pages.notify.common.viewDeliveryLog': 'View deliveries',
  'pages.notify.common.unlimited': 'Unlimited',
  'pages.notify.common.zeroUnlimited': '0 = unlimited',
  'pages.notify.common.noDuplicate': 'Items must be unique',
  'pages.notify.common.recipientLength':
    'Each recipient must be 1-255 characters',

  // Channels
  'pages.notify.channel.create.title': 'Create channel',
  'pages.notify.channel.edit.title': 'Edit channel: {name}',
  'pages.notify.channel.column.name': 'Channel name',
  'pages.notify.channel.column.type': 'Type',
  'pages.notify.channel.column.config': 'Config summary',
  'pages.notify.channel.config.atMobiles': '@ {count} phone number(s)',
  'pages.notify.channel.action.test': 'Test',
  'pages.notify.channel.delete.title': 'Delete channel',
  'pages.notify.channel.delete.description':
    'Channels still referenced by routes must be unbound first; the name becomes reusable and delivery history is kept. Delete?',
  'pages.notify.channel.form.name.placeholder':
    '1-128 characters, unique within the business',
  'pages.notify.channel.form.type': 'Channel type',
  'pages.notify.channel.form.type.tooltip':
    'Determines the config structure and sending adapter; immutable after creation',
  'pages.notify.channel.form.type.readonlyTooltip':
    'Immutable after creation; create a new channel to switch type',
  'pages.notify.channel.form.host': 'SMTP server',
  'pages.notify.channel.form.host.placeholder': 'e.g. smtp.example.com',
  'pages.notify.channel.form.port': 'Port',
  'pages.notify.channel.form.username': 'Auth username',
  'pages.notify.channel.form.fromAddr': 'From address',
  'pages.notify.channel.form.url': 'Target URL',
  'pages.notify.channel.form.url.https': 'Must start with https://',
  'pages.notify.channel.form.headers': 'Extra headers',
  'pages.notify.channel.form.headers.tooltip':
    'Headers (e.g. auth) sent with outbound requests, up to 16 pairs',
  'pages.notify.channel.form.headers.add': 'Add header',
  'pages.notify.channel.form.headers.key': 'Name',
  'pages.notify.channel.form.headers.value': 'Value',
  'pages.notify.channel.form.timeout': 'Outbound timeout (s)',
  'pages.notify.channel.form.timeout.tooltip':
    '1-10 seconds; backend default 5',
  'pages.notify.channel.form.timeout.required':
    'Please enter the outbound timeout (1-10 s)',
  'pages.notify.channel.form.atMobiles': '@ mention phones',
  'pages.notify.channel.form.atMobiles.tooltip':
    'Optional, up to 20, each 5-32 characters',
  'pages.notify.channel.form.atMobiles.placeholder':
    'Type a phone number and press Enter; multiple allowed',
  'pages.notify.channel.form.atMobiles.max': 'At most 20',
  'pages.notify.channel.form.atMobiles.length':
    'Each phone number must be 5-32 characters',
  'pages.notify.channel.form.secret.editPlaceholder':
    'Leave empty to keep the current credential; enter a value to rotate',
  'pages.notify.channel.form.signSecret': 'Signing secret',
  'pages.notify.channel.form.signSecret.tooltip':
    'DingTalk "sign" / Feishu "signature verification" secret, optional; write-only',
  'pages.notify.channel.form.signSecret.editPlaceholder':
    'Leave empty to keep the current secret; enter a value to rotate',
  'pages.notify.channel.form.signSecret.placeholder':
    'Optional, 1-512 characters',
  'pages.notify.channel.form.clearSignSecret': 'Clear signing secret',
  'pages.notify.channel.form.clearSignSecret.tooltip':
    'When on, saving disables signing (the input above is ignored)',
  'pages.notify.channel.form.qps': 'Rate limit QPS',
  'pages.notify.channel.form.burst': 'Burst limit',
  'pages.notify.channel.test.title': 'Send test event: {name}',
  'pages.notify.channel.test.defaultTitle': 'Notify channel connectivity test',
  'pages.notify.channel.test.submit': 'Send',
  'pages.notify.channel.test.created': 'Test event created',
  'pages.notify.channel.test.eventType': 'Event type',
  'pages.notify.channel.test.eventType.tooltip':
    'Delivered only if a route event_pattern covers this type and its channel set includes this instance',
  'pages.notify.channel.test.eventType.rule':
    'Dot-separated string starting with a lowercase letter or digit, up to 128 characters',
  'pages.notify.channel.test.eventTitle': 'Event title',
  'pages.notify.channel.test.recipients': 'Recipients',
  'pages.notify.channel.test.recipients.tooltip':
    'Leave empty to let routes resolve recipients (same path as production events)',
  'pages.notify.channel.test.recipients.placeholder':
    'Email / group id, press Enter to confirm, up to 20',
  'pages.notify.channel.test.recipients.max': 'At most 20',
  'pages.notify.channel.test.payload': 'Extra payload (JSON)',
  'pages.notify.channel.test.payload.tooltip':
    'Optional; merged into the event payload as test context',
  'pages.notify.channel.test.payload.object': 'Must be a JSON object',
  'pages.notify.channel.test.payload.invalid': 'Invalid JSON',
  'pages.notify.channel.test.result.desc':
    'The event has entered the async delivery pipeline (route → template → send). Track dispatches and deliveries by event ID in Delivery Trace:',

  // Routes
  'pages.notify.route.create.title': 'Create route',
  'pages.notify.route.edit.title': 'Edit route: {name}',
  'pages.notify.route.column.severityMin': 'Min severity',
  'pages.notify.route.column.priority': 'Priority',
  'pages.notify.route.column.recipient': 'Recipient policy',
  'pages.notify.route.recipient.fixed': 'Fixed {count}',
  'pages.notify.route.recipient.subscription': 'Subscribers',
  'pages.notify.route.delete.title': 'Delete route',
  'pages.notify.route.delete.description':
    'In-flight dispatches will still complete. Delete?',
  'pages.notify.route.form.severityMin.tooltip':
    'Matches only events with severity ≥ this level; default 1 (Info)',
  'pages.notify.route.form.severityMin.placeholder': 'Default 1 (Info)',
  'pages.notify.route.form.priority.tooltip':
    '1-9, 1 is highest; when several routes match, the highest priority wins. Default 5',
  'pages.notify.route.form.priority.placeholder': 'Default 5',
  'pages.notify.route.form.tags': 'Tag match',
  'pages.notify.route.form.tags.tooltip':
    'Matches only when all payload tags are equal (AND), up to 16 pairs; empty = no condition',
  'pages.notify.route.form.tags.add': 'Add tag condition',
  'pages.notify.route.form.tags.key': 'Key',
  'pages.notify.route.form.tags.value': 'Value',
  'pages.notify.route.form.channels': 'Target channels',
  'pages.notify.route.form.channels.tooltip':
    'Channel instances to fan out to (must share the route business); each enabled channel gets a dispatch',
  'pages.notify.route.form.channels.placeholder': 'Select 1-50 channels',
  'pages.notify.route.form.recipientFixed': 'Fixed recipients',
  'pages.notify.route.form.recipientFixed.tooltip':
    'Email addresses / group ids. Email channels need fixed recipients or subscribers; webhook and bot channels deliver to the instance itself and may leave this empty',
  'pages.notify.route.form.recipientFixed.placeholder.email':
    'Email channels need recipients: type and press Enter, up to 100',
  'pages.notify.route.form.recipientFixed.placeholder':
    'Optional: type and press Enter, up to 100',
  'pages.notify.route.form.recipientFixed.required':
    'Email channel included: configure fixed recipients or enable "Add subscribers"',
  'pages.notify.route.form.recipientFixed.max': 'At most 100',
  'pages.notify.route.form.recipientSubscription': 'Add subscribers',
  'pages.notify.route.form.recipientSubscription.tooltip':
    'Resolves subscribers from user preferences intersected with the route channel types, deduplicated against fixed recipients',
  'pages.notify.route.form.aggregateWindow': 'Aggregation window (s)',
  'pages.notify.route.form.aggregateWindow.tooltip':
    '0 = no aggregation (default); >0 must be 30-300, events with a group key are batched',
  'pages.notify.route.form.aggregateWindow.placeholder': 'Default 0',
  'pages.notify.route.form.aggregateWindow.rule': '0 or 30-300',
  'pages.notify.route.form.suppressThreshold': 'Suppression threshold',
  'pages.notify.route.form.suppressThreshold.tooltip':
    'Switches to digest mode once the group count exceeds this; default 500',
  'pages.notify.route.form.suppressThreshold.placeholder': 'Default 500',
  'pages.notify.route.form.suppressDuration': 'Suppression duration (min)',
  'pages.notify.route.form.suppressDuration.tooltip':
    'Silence window for the same group key after the threshold is exceeded; default 30',
  'pages.notify.route.form.suppressDuration.placeholder': 'Default 30',

  // Silences
  'pages.notify.silence.create.title': 'Create silence rule',
  'pages.notify.silence.edit.title': 'Edit silence rule: {name}',
  'pages.notify.silence.column.severityMax': 'Max severity',
  'pages.notify.silence.column.timeWindow': 'Time window',
  'pages.notify.silence.window.summary': '{start}-{end} ({tz})',
  'pages.notify.silence.window.always': 'Always',
  'pages.notify.silence.delete.title': 'Delete silence rule',
  'pages.notify.silence.delete.description':
    'The rule will no longer be matched. Delete?',
  'pages.notify.silence.form.severityMax.tooltip':
    'Only events at or below this level can be silenced; default 2 (Warning)',
  'pages.notify.silence.form.severityMax.placeholder': 'Default 2 (Warning)',
  'pages.notify.silence.form.windowEnabled': 'Restrict time window',
  'pages.notify.silence.form.windowEnabled.tooltip':
    'Off = silence all day; turning it off when saving clears the window',
  'pages.notify.silence.form.windowStart': 'Window start',
  'pages.notify.silence.form.windowStart.tooltip':
    '24-hour HH:MM, may cross midnight (e.g. 22:00→08:00 covers the night)',
  'pages.notify.silence.form.windowEnd': 'Window end',
  'pages.notify.silence.form.windowEnd.sameAsStart':
    'End must differ from start',
  'pages.notify.silence.form.tz': 'Time zone',
  'pages.notify.silence.form.tz.tooltip': 'IANA time zone name, default UTC',
  'pages.notify.silence.form.tz.rule':
    'IANA time zone name, e.g. Asia/Shanghai',

  // Templates
  'pages.notify.template.create.title': 'Create template',
  'pages.notify.template.edit.title': 'Edit template: {name}',
  'pages.notify.template.search.placeholder': 'Event type / channel / subject',
  'pages.notify.template.column.eventType': 'Event type',
  'pages.notify.template.column.channelType': 'Channel type',
  'pages.notify.template.column.subject': 'Subject template',
  'pages.notify.template.column.version': 'Version',
  'pages.notify.template.delete.title': 'Delete template',
  'pages.notify.template.delete.description':
    'The (business, event type, channel type) combination becomes reusable; delivery history is kept. Delete?',
  'pages.notify.template.form.eventType.tooltip':
    "Exact match or '*' wildcard; other values are dot-separated strings starting with a lowercase letter or digit",
  'pages.notify.template.form.eventType.placeholder':
    'monitor.alert.firing or *',
  'pages.notify.template.form.eventType.rule':
    "'*' or a dot-separated string starting with a lowercase letter or digit, up to 128 characters",
  'pages.notify.template.form.channelType.tooltip':
    "Channel dimension of the 3-D override; '*' wildcard allowed",
  'pages.notify.template.form.subject.tooltip':
    'Email subject / bot title, Go template syntax',
  'pages.notify.template.form.subject.placeholder': 'Alert: {title}',
  'pages.notify.template.form.body': 'Body template',
  'pages.notify.template.form.body.tooltip.title': 'Go template syntax',
  'pages.notify.template.form.body.tooltip.content':
    'Available variables: Title / Payload / Severity / Count / Samples / BizID / EventTime',
  'pages.notify.template.form.body.placeholder':
    'Event: {title}\nBusiness: {biz}',

  // Subscriptions
  'pages.notify.subscription.create.title': 'Create subscription',
  'pages.notify.subscription.edit.title': 'Edit subscription: {name}',
  'pages.notify.subscription.column.userId': 'Subscriber',
  'pages.notify.subscription.column.userId.tooltip':
    'User ID (yourself or managed by an admin)',
  'pages.notify.subscription.column.userId.placeholder':
    'User ID (defaults to yourself)',
  'pages.notify.subscription.column.channelPrefs': 'Channel preferences',
  'pages.notify.subscription.prefWithTarget': '{channel}: {target}',
  'pages.notify.subscription.delete.title': 'Delete subscription',
  'pages.notify.subscription.delete.description':
    'The same key can be recreated afterwards. Delete?',
  'pages.notify.subscription.form.userId.tooltip':
    'Leave empty for yourself; specifying another user requires admin (managed)',
  'pages.notify.subscription.form.userId.placeholder':
    'Leave empty for yourself',
  'pages.notify.subscription.form.userId.rule': 'User ID must be a UUID',
  'pages.notify.subscription.form.biz.tooltip':
    'Subscriptions are matched per business; leave empty for default',
  'pages.notify.subscription.form.eventPattern.tooltip':
    'Exact / prefix wildcard (monitor.alert.*) / match all (*), same as routes',
  'pages.notify.subscription.form.prefs.title':
    'Channel preferences (at least one)',
  'pages.notify.subscription.form.email.tooltip':
    'Recipient address is taken from the user profile email',
  'pages.notify.subscription.form.pref.none': 'Not subscribed',
  'pages.notify.subscription.form.pref.subscribed': 'Subscribe',
  'pages.notify.subscription.form.pref.subscribedDefault':
    'Subscribe (default binding)',
  'pages.notify.subscription.form.pref.target': 'Specific target group',
  'pages.notify.subscription.form.target.label': '{channel} target group',
  'pages.notify.subscription.form.target.tooltip':
    'Bot target group id, e.g. $group:ops',
  'pages.notify.subscription.form.target.placeholder':
    'Choose "Specific target group" first',
  'pages.notify.subscription.msg.atLeastOne':
    'Configure a preference for at least one channel',

  // Event sources
  'pages.notify.producer.create.title': 'Create source',
  'pages.notify.producer.edit.title': 'Edit source: {name}',
  'pages.notify.producer.column.name': 'Name',
  'pages.notify.producer.column.whitelist': 'Event whitelist',
  'pages.notify.producer.column.limit': 'Ingress limit',
  'pages.notify.producer.column.limit.tooltip':
    'Per-second / per-day (UTC) ingress caps; 429 when exceeded',
  'pages.notify.producer.column.expireTime': 'Expires at',
  'pages.notify.producer.neverExpire': 'Never',
  'pages.notify.producer.limit.perSecond': '{n}/s',
  'pages.notify.producer.limit.perDay': '{n}/day',
  'pages.notify.producer.limit.summary': '{qps} · {daily}',
  'pages.notify.producer.rotate.title': 'Rotate token',
  'pages.notify.producer.rotate.description':
    'The old token is revoked immediately (≤10s) and the new one is shown only once. Rotate?',
  'pages.notify.producer.rotate.success': 'Token rotated',
  'pages.notify.producer.delete.title': 'Delete source',
  'pages.notify.producer.delete.description':
    'The token is revoked as well (the name becomes reusable). Delete?',
  'pages.notify.producer.form.name.tooltip':
    'Unique among non-deleted rows within the business',
  'pages.notify.producer.form.name.placeholder': '1-64 characters',
  'pages.notify.producer.form.whitelist': 'Event type whitelist',
  'pages.notify.producer.form.whitelist.tooltip':
    'Empty = any event type (the token is still scoped to the business); items are event patterns',
  'pages.notify.producer.form.whitelist.placeholder':
    'monitor.alert.* (press Enter to confirm, up to 32)',
  'pages.notify.producer.form.whitelist.max': 'At most 32 items',
  'pages.notify.producer.form.qpsLimit': 'Per-second limit',
  'pages.notify.producer.form.qpsLimit.tooltip':
    'Counted per source by the pipeline ingress; 429 when exceeded. 0 = unlimited',
  'pages.notify.producer.form.dailyLimit': 'Per-day limit',
  'pages.notify.producer.form.dailyLimit.tooltip':
    'Counted per UTC day; 0 = unlimited',
  'pages.notify.producer.form.expireTime.tooltip':
    'Leave empty for never; leaving it empty when saving clears the expiry',
  'pages.notify.producer.token.title': 'Access token: {name}',
  'pages.notify.producer.token.ok': 'I have saved it',
  'pages.notify.producer.token.warning':
    'The token is shown only once: only its hash is stored and no API can return it again. If lost, rotate to issue a new one. Save it now.',
  'pages.notify.producer.token.hint':
    'Data-plane access: Authorization: HMAC {id}:{sig}:{ts} (±5 min replay protection)',

  // Events
  'pages.notify.event.column.eventType': 'Event type',
  'pages.notify.event.column.eventType.placeholder': 'Event type (exact)',
  'pages.notify.event.column.title': 'Title',
  'pages.notify.event.column.severity': 'Severity',
  'pages.notify.event.column.status': 'Routing status',
  'pages.notify.event.column.publishState': 'Publish state',
  'pages.notify.event.column.source': 'Source',
  'pages.notify.event.column.publishAttempts': 'Publish attempts',
  'pages.notify.event.column.createTime': 'Stored at',
  'pages.notify.event.detail.nextPublishTime': 'Next publish time',
  'pages.notify.event.detail.dedupKey': 'Dedup key',
  'pages.notify.event.detail.groupKey': 'Group key',
  'pages.notify.event.detail.recipients': 'Explicit recipients',
  'pages.notify.event.detail.recipients.empty':
    '— (resolved by route recipient policy)',
  'pages.notify.event.detail.payload': 'Payload',
  'pages.notify.event.detail.payload.empty': '— (no payload)',

  // Dispatches
  'pages.notify.dispatch.column.channel.placeholder': 'Target channel',
  'pages.notify.dispatch.column.nextRetry': 'Next retry',
  'pages.notify.dispatch.column.lastError': 'Last error',
  'pages.notify.dispatch.column.createTime': 'Created at',
  'pages.notify.dispatch.detail.pending': '— (rendered at send time)',
  'pages.notify.dispatch.detail.sendKey': 'Idempotency key',
  'pages.notify.dispatch.detail.template': 'Render template',
  'pages.notify.dispatch.detail.template.default': 'Built-in default template',
  'pages.notify.dispatch.detail.agg': 'Aggregation',
  'pages.notify.dispatch.detail.agg.count': '{count} event(s)',
  'pages.notify.dispatch.detail.agg.digest':
    'Digest mode (threshold exceeded, no details)',
  'pages.notify.dispatch.detail.agg.samples': '{count} sample(s)',
  'pages.notify.dispatch.detail.agg.single': '— (single event)',
  'pages.notify.dispatch.detail.subject': 'Rendered subject',
  'pages.notify.dispatch.detail.body': 'Rendered body',
  'pages.notify.dispatch.detail.raw': 'Raw snapshot',
  'pages.notify.dispatch.detail.raw.empty': '— (no snapshot)',

  // Dead letters
  'pages.notify.dlq.column.replayState': 'Replay state',
  'pages.notify.dlq.column.createTime': 'Moved at',
  'pages.notify.dlq.replay.action': 'Mark for replay',
  'pages.notify.dlq.replay.description':
    'The dead-letter worker will regenerate the dispatch. Mark?',
  'pages.notify.dlq.replay.success': 'Marked for replay',

  // Delivery logs
  'pages.notify.deliveryLog.column.ok': 'Result',
  'pages.notify.deliveryLog.column.attempt': 'Attempt #',
  'pages.notify.deliveryLog.column.latency': 'Latency',
  'pages.notify.deliveryLog.latency.ms': '{ms} ms',
  'pages.notify.deliveryLog.column.providerMsgId': 'Provider message ID',
  'pages.notify.deliveryLog.column.createTime': 'Stored at',
};
