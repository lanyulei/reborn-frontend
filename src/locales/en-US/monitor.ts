import monitorAlert from './monitorAlert';
import monitorNoise from './monitorNoise';
import monitorOps from './monitorOps';
import monitorRuleExt from './monitorRuleExt';
import monitorRuleTools from './monitorRuleTools';

/** 监控告警：菜单 / 元素权限 / 枚举 / 告警事件 / 告警规则 / 屏蔽规则 / 告警订阅 / 数据源 / 即时查询 */
export default {
  // 菜单 / 元素权限
  'menu.monitor': 'Monitoring',
  'menu.monitor.notice': 'Notification Policies',
  'menu.monitor.metric': 'Metrics',
  'menu.monitor.insight': 'Insights',
  'menu.monitor.alert': 'Alerts',
  'menu.monitor.alert-detail': 'Alert Detail',
  'menu.monitor.rule': 'Alert Rules',
  'menu.monitor.mute': 'Noise Reduction',
  'menu.monitor.subscription': 'Subscriptions',
  'menu.monitor.datasource': 'Datasource Management',
  'menu.monitor.explore': 'Explore',
  'permission.monitor.rule.create': 'Create alert rule',
  'permission.monitor.rule.edit': 'Edit / clone / move / roll back alert rules',
  'permission.monitor.rule.delete': 'Delete alert rule',
  'permission.monitor.rule.toggle': 'Enable / disable alert rules',
  'permission.monitor.rule.import': 'Import alert rules',
  'permission.monitor.rule.export': 'Export alert rules',
  'permission.monitor.rule.group': 'Maintain rule groups',
  'permission.monitor.rule.scope': 'Grant rule groups to roles',
  'permission.monitor.mute.create': 'Create mute rule',
  'permission.monitor.mute.edit': 'Edit mute rule',
  'permission.monitor.mute.delete': 'Delete mute rule',
  'permission.monitor.subscription.create': 'Create alert subscription',
  'permission.monitor.subscription.edit':
    'Edit / enable / disable alert subscriptions',
  'permission.monitor.subscription.delete': 'Delete alert subscription',
  'permission.monitor.datasource.create': 'Create datasource',
  'permission.monitor.datasource.edit': 'Edit datasource',
  'permission.monitor.datasource.delete': 'Delete datasource',
  'permission.monitor.datasource.test': 'Test datasource connection',

  // 枚举
  'enum.monitor.evalStatus.0': 'Not evaluated',
  'enum.monitor.evalStatus.1': 'OK',
  'enum.monitor.evalStatus.2': 'Firing',
  'enum.monitor.evalStatus.3': 'No data',
  'enum.monitor.evalStatus.4': 'Query error',
  'enum.monitor.evalStatus.5': 'Outside active hours',
  'enum.monitor.alertStatus.1': 'Firing',
  'enum.monitor.alertStatus.2': 'Resolved',
  'enum.monitor.alertStatus.3': 'Closed',
  'enum.monitor.health.0': 'Unknown',
  'enum.monitor.health.1': 'Healthy',
  'enum.monitor.health.2': 'Unhealthy',
  'enum.monitor.authType.1': 'None',
  'enum.monitor.authType.2': 'Basic',
  'enum.monitor.authType.3': 'Bearer',
  'enum.monitor.datasourceScope.1': 'Selected datasources',
  'enum.monitor.datasourceScope.2': 'All datasources',
  'enum.monitor.scopeLevel.0': 'No access',
  'enum.monitor.scopeLevel.1': 'Read only',
  'enum.monitor.scopeLevel.2': 'Manage',
  'enum.monitor.muteMode.1': 'Mute notifications',
  'enum.monitor.muteMode.2': 'Drop events',
  'enum.monitor.muteTimeType.1': 'One-off',
  'enum.monitor.muteTimeType.2': 'Recurring',
  'enum.monitor.muteState.pending': 'Pending',
  'enum.monitor.muteState.active': 'Active',
  'enum.monitor.muteState.expired': 'Expired',
  'enum.monitor.muteState.disabled': 'Disabled',
  'enum.monitor.notifyKind.1': 'Firing',
  'enum.monitor.notifyKind.2': 'Repeat',
  'enum.monitor.notifyKind.3': 'Resolved',
  'enum.monitor.evalStep.pending': 'Pending (waiting for duration)',
  'enum.monitor.evalStep.fired': 'Fired',
  'enum.monitor.evalStep.firing': 'Still firing',
  'enum.monitor.evalStep.muted_event': 'Muted (no event)',
  'enum.monitor.evalStep.muted_notify': 'Muted (not notified)',
  'enum.monitor.evalStep.inhibited': 'Inhibited by higher severity',
  'enum.monitor.evalStep.recovering': 'Recovering',
  'enum.monitor.evalStep.resolved': 'Resolved',
  'enum.monitor.versionAction.create': 'Create',
  'enum.monitor.versionAction.update': 'Edit',
  'enum.monitor.versionAction.enable': 'Enable',
  'enum.monitor.versionAction.disable': 'Disable',
  'enum.monitor.versionAction.move': 'Move',
  'enum.monitor.versionAction.rollback': 'Rollback',
  'enum.monitor.versionAction.import': 'Import',
  'enum.monitor.versionAction.delete': 'Delete',
  'enum.monitor.versionAction.batch': 'Batch',
  'enum.monitor.batchAction.enable': 'Enable',
  'enum.monitor.batchAction.disable': 'Disable',
  'enum.monitor.batchAction.move': 'Move to group',
  'enum.monitor.batchAction.set_severity': 'Set severity',
  'enum.monitor.batchAction.set_timing': 'Set timing',
  'enum.monitor.batchAction.add_labels': 'Add labels',
  'enum.monitor.batchAction.remove_labels': 'Remove labels',
  'enum.monitor.batchAction.set_notify': 'Set notification',
  'enum.monitor.batchAction.delete': 'Delete',
  'enum.monitor.importStatus.new': 'New',
  'enum.monitor.importStatus.conflict': 'Name conflict',
  'enum.monitor.importStatus.invalid': 'Invalid',
  'enum.monitor.importStatus.skipped': 'Skipped',
  'enum.monitor.importConflict.skip': 'Skip',
  'enum.monitor.importConflict.overwrite': 'Overwrite existing rule',
  'enum.monitor.importConflict.rename': 'Rename and create',
  'enum.monitor.importResult.created': 'Created',
  'enum.monitor.importResult.updated': 'Overwritten',
  'enum.monitor.importResult.skipped': 'Skipped',
  'enum.monitor.importResult.failed': 'Failed',

  // 公共
  'pages.monitor.needManage': 'Requires Manage access to the rule group',
  'pages.monitor.ref.missing': 'Deleted or unavailable; no longer in effect',
  'pages.monitor.ref.missingOption': '{name} (deleted)',
  'pages.monitor.retry': 'Retry',
  'pages.monitor.action.enable': 'Enable',
  'pages.monitor.action.disable': 'Disable',
  'pages.monitor.upstream.raw': 'Datasource responded: {detail}',
  'pages.monitor.upstream.query': 'Query {n}',
  'pages.monitor.upstream.http': '{text} (HTTP {status})',
  'pages.monitor.upstream.incomplete':
    'Incomplete result; series that were not returned keep their state',
  'pages.monitor.upstream.busy':
    'The datasource query slots were full; this request did not start before the timeout',
  'pages.monitor.upstream.disabled': 'The datasource is disabled',
  'pages.monitor.upstream.credential':
    'Datasource credential unavailable: the master key is missing or does not match',
  'pages.monitor.upstream.configInvalid': 'Invalid datasource configuration',
  'pages.monitor.upstream.noQueries': 'The rule has no valid queries',
  'pages.monitor.upstream.invalidSeverity': 'Query {n} has an invalid severity',
  'pages.monitor.upstream.notVector':
    'The query must return an instant vector, but returned a {type}',
  'pages.monitor.upstream.type.bad_data':
    'Invalid query expression or parameters',
  'pages.monitor.upstream.type.timeout': 'Request timed out',
  'pages.monitor.upstream.type.canceled': 'Request canceled',
  'pages.monitor.upstream.type.network':
    'Network error; cannot reach the datasource',
  'pages.monitor.upstream.type.blocked':
    'The datasource address is not allowed',
  'pages.monitor.upstream.type.redirect':
    'The datasource answered with a redirect (redirects are not followed)',
  'pages.monitor.upstream.type.body_too_large':
    'The datasource response is too large',
  'pages.monitor.upstream.type.bad_response':
    'The datasource response is not valid Prometheus API output',
  'pages.monitor.upstream.type.http': 'The datasource returned an error status',
  'pages.monitor.labelFilter.invalid':
    'Each item must be name=value; label names start with a letter or underscore and contain only letters, digits and underscores',
  'pages.monitor.targets.failed':
    'Failed to load on-call schedule and department options (you may lack permission). Existing selections are kept; try again later or contact an administrator.',
  'pages.monitor.listSeparator': ', ',
  'pages.monitor.editor.remove': 'Remove',
  'pages.monitor.common.name': 'Name',
  'pages.monitor.common.description': 'Description',
  'pages.monitor.common.group': 'Rule group',
  'pages.monitor.common.group.placeholder': 'Select a rule group',
  'pages.monitor.common.datasource': 'Datasource',
  'pages.monitor.common.datasources': 'Datasources',
  'pages.monitor.common.rules': 'Rules',
  'pages.monitor.common.severities': 'Severities',
  'pages.monitor.common.matchers': 'Label matchers',
  'pages.monitor.common.users': 'Users',
  'pages.monitor.common.users.placeholder': 'Search and select users',
  'pages.monitor.common.schedules': 'On-call schedules',
  'pages.monitor.common.schedules.placeholder': 'Select schedules',
  'pages.monitor.common.schedules.tooltip':
    'Resolved to whoever is on call when the notification is sent',
  'pages.monitor.common.unlimited': 'Any',
  'pages.monitor.common.unlimitedIfEmpty': 'Leave empty for no restriction',
  'pages.monitor.common.creator': 'Created by',
  'pages.monitor.common.yes': 'Yes',
  'pages.monitor.common.no': 'No',
  'pages.monitor.unit.second': 's',
  'pages.monitor.unit.minute': 'min',
  'pages.monitor.unit.seconds': '{n} s',
  'pages.monitor.unit.minutes': '{n} min',
  'pages.monitor.duration.day': '{n}d',
  'pages.monitor.duration.hour': '{n}h',
  'pages.monitor.duration.minute': '{n}m',
  'pages.monitor.duration.second': '{n}s',
  'pages.monitor.weekday.1': 'Mon',
  'pages.monitor.weekday.2': 'Tue',
  'pages.monitor.weekday.3': 'Wed',
  'pages.monitor.weekday.4': 'Thu',
  'pages.monitor.weekday.5': 'Fri',
  'pages.monitor.weekday.6': 'Sat',
  'pages.monitor.weekday.7': 'Sun',
  'pages.monitor.window.timezone': 'Time zone',
  'pages.monitor.window.timezone.hint': 'IANA time zone name; empty means UTC',
  'pages.monitor.window.add': 'Add time window',
  'pages.monitor.window.hint':
    'An end before the start runs into the next day; end equal to start means all day',
  'pages.monitor.window.invalid':
    'Each time window needs at least one day and both times',
  'pages.monitor.matcher.label': 'Label name',
  'pages.monitor.matcher.value': 'Value',
  'pages.monitor.matcher.regex': 'Regex (matches the whole value)',
  'pages.monitor.matcher.values':
    'Type and press Enter; multiple values allowed',
  'pages.monitor.matcher.add': 'Add matcher',
  'pages.monitor.matcher.tooltip':
    "Rows are ANDed. Matches series labels and the rule's extra labels; a missing label compares as empty.",
  'pages.monitor.matcher.invalid':
    'Incomplete matcher: check the label name (letters, digits and underscores, not starting with a digit) and its value',
  'pages.monitor.matcher.op.eq': '== equals',
  'pages.monitor.matcher.op.ne': '!= not equal',
  'pages.monitor.matcher.op.re': '=~ matches regex',
  'pages.monitor.matcher.op.nre': '!~ does not match',
  'pages.monitor.matcher.op.in': 'in',
  'pages.monitor.matcher.op.nin': 'not in',
  'pages.monitor.preview.action': 'Preview matches',
  'pages.monitor.preview.title': 'Matching alerts',
  'pages.monitor.chart.title': 'Query result trend',
  'pages.monitor.chart.empty': 'No data points to plot',
  'pages.monitor.query.run': 'Run query',
  'pages.monitor.query.failed': 'Query failed',
  'pages.monitor.query.truncated':
    'The result exceeded the series or point limit and was truncated. Narrow the query.',
  'pages.monitor.query.summary': '{count} series in {ms} ms',
  'pages.monitor.query.chartLimit': 'only the first {max} are plotted',
  'pages.monitor.query.column.series': 'Series',
  'pages.monitor.query.column.value': 'Value',
  'pages.monitor.query.column.latest': 'Latest value',
  'pages.monitor.query.column.time': 'Sample time',
  'pages.monitor.query.time.now': 'Now',
  'pages.monitor.query.step': 'Step',
  'pages.monitor.query.step.auto': 'auto',
  'pages.monitor.query.range.300': 'Last 5 minutes',
  'pages.monitor.query.range.900': 'Last 15 minutes',
  'pages.monitor.query.range.3600': 'Last 1 hour',
  'pages.monitor.query.range.10800': 'Last 3 hours',
  'pages.monitor.query.range.21600': 'Last 6 hours',
  'pages.monitor.query.range.43200': 'Last 12 hours',
  'pages.monitor.query.range.86400': 'Last 1 day',
  'pages.monitor.query.range.172800': 'Last 2 days',
  'pages.monitor.query.range.604800': 'Last 7 days',
  'pages.monitor.query.range.custom': 'Custom range',

  // Error reasons (backend MONITOR_* reason → message; withDetail appends the specific cause)
  'pages.monitor.error.withDetail': '{text}: {detail}',
  'pages.monitor.error.MONITOR_FORBIDDEN':
    'Outside your data scope, or Manage access to the rule group is required',
  'pages.monitor.error.MONITOR_VERSION_CONFLICT':
    'This record was changed by someone else. Refresh and try again.',
  'pages.monitor.error.MONITOR_TIME_RANGE_INVALID':
    'The time range is invalid or exceeds the limit',
  'pages.monitor.error.MONITOR_SECRET_UNAVAILABLE':
    'The encryption master key is not configured on the server, so datasource credentials cannot be saved or used. Contact an administrator.',
  'pages.monitor.error.MONITOR_DATASOURCE_NOT_FOUND':
    'The datasource does not exist or was deleted',
  'pages.monitor.error.MONITOR_DATASOURCE_NAME_EXISTS':
    'The datasource name is already taken',
  'pages.monitor.error.MONITOR_DATASOURCE_INVALID':
    'The datasource configuration is invalid',
  'pages.monitor.error.MONITOR_DATASOURCE_IN_USE':
    'The datasource is still used by rules and cannot be deleted',
  'pages.monitor.error.MONITOR_DATASOURCE_DISABLED':
    'The datasource is disabled and cannot be queried',
  'pages.monitor.error.MONITOR_DATASOURCE_UNREACHABLE':
    'The datasource is unreachable or returned an unexpected response',
  'pages.monitor.error.MONITOR_QUERY_INVALID': 'The query is invalid',
  'pages.monitor.error.MONITOR_QUERY_BUSY':
    'Too many concurrent queries. Try again later.',
  'pages.monitor.error.MONITOR_DATASOURCE_SECRET_REQUIRED':
    'The saved credential or header values cannot be reused; enter them again and retry (required after the scheme, host or port of the address changes, and when you only have the test permission)',
  'pages.monitor.error.MONITOR_DATASOURCE_ADDRESS_BLOCKED':
    'The datasource address points to a blocked address (link-local, cloud metadata, etc.)',
  'pages.monitor.error.MONITOR_GROUP_NOT_FOUND':
    'The rule group does not exist or was deleted',
  'pages.monitor.error.MONITOR_GROUP_NAME_EXISTS':
    'A group with the same name already exists under this parent',
  'pages.monitor.error.MONITOR_GROUP_IN_USE':
    'The group still has child groups or rules and cannot be deleted',
  'pages.monitor.error.MONITOR_GROUP_IN_USE.refs':
    'The group is still referenced by {mutes} mute rule(s) and {subscriptions} subscription(s) and cannot be deleted; change or delete them first',
  'pages.monitor.error.MONITOR_GROUP_INVALID':
    'The group parameters are invalid',
  'pages.monitor.error.MONITOR_ROLE_SCOPE_INVALID':
    'The role access settings are invalid',
  'pages.monitor.error.MONITOR_RULE_NOT_FOUND':
    'The alert rule does not exist or was deleted',
  'pages.monitor.error.MONITOR_RULE_NAME_EXISTS':
    'A rule with the same name already exists in this group',
  'pages.monitor.error.MONITOR_RULE_INVALID':
    'The rule configuration is invalid',
  'pages.monitor.error.MONITOR_RULE_VERSION_NOT_FOUND':
    'This version does not exist',
  'pages.monitor.error.MONITOR_RULE_BATCH_INVALID':
    'The batch operation parameters are invalid',
  'pages.monitor.error.MONITOR_RULE_IMPORT_INVALID':
    'The import content cannot be parsed',
  'pages.monitor.error.MONITOR_ALERT_NOT_FOUND':
    'The alert does not exist or you have no access to it',
  'pages.monitor.error.MONITOR_MUTE_NOT_FOUND':
    'The mute rule does not exist or was deleted',
  'pages.monitor.error.MONITOR_MUTE_INVALID': 'The mute rule is invalid',
  'pages.monitor.error.MONITOR_SUBSCRIPTION_NOT_FOUND':
    'The subscription does not exist or was deleted',
  'pages.monitor.error.MONITOR_SUBSCRIPTION_INVALID':
    'The subscription is invalid',

  // 告警事件
  'pages.monitor.alert.tab.active': 'Active',
  'pages.monitor.alert.tab.history': 'History',
  'pages.monitor.alert.search.placeholder': 'Rule name',
  'pages.monitor.alert.search.labels.tooltip':
    'Exact match on event labels. Each item is name=value, up to 5 items, ANDed together',
  'pages.monitor.alert.search.muted': 'Muted',
  'pages.monitor.alert.search.mine': 'Mine',
  'pages.monitor.alert.search.mine.only':
    'Only alerts I was notified of or acknowledged',
  'pages.monitor.alert.search.mine.tooltip':
    'I am a notification target of the rule, a subscription receiver, an escalation target, or the acknowledger',
  'pages.monitor.alert.search.fireTime': 'First fired',
  'pages.monitor.alert.column.severity': 'Severity',
  'pages.monitor.alert.column.rule': 'Rule',
  'pages.monitor.alert.column.labels': 'Labels',
  'pages.monitor.alert.column.value': 'Value',
  'pages.monitor.alert.column.firstFireTime': 'First fired',
  'pages.monitor.alert.column.resolveTime': 'Resolved / closed',
  'pages.monitor.alert.column.duration': 'Duration',
  'pages.monitor.alert.column.notifyCount': 'Notifications',
  'pages.monitor.alert.action.detail': 'Detail',
  'pages.monitor.alert.action.mute': 'Mute',
  'pages.monitor.alert.action.subscribe': 'Subscribe to similar',
  'pages.monitor.alert.muted': 'Muted',
  'pages.monitor.alert.notMuted': 'Not muted',
  'pages.monitor.alert.labels.compact': 'Compact',
  'pages.monitor.alert.labels.full': 'All labels',
  'pages.monitor.alert.refresh.0': 'Auto refresh off',
  'pages.monitor.alert.refresh.10': 'Every 10 s',
  'pages.monitor.alert.refresh.30': 'Every 30 s',
  'pages.monitor.alert.refresh.60': 'Every 1 min',
  'pages.monitor.alert.agg.title': 'Group by',
  'pages.monitor.alert.agg.by.none': 'None',
  'pages.monitor.alert.agg.by.rule': 'Rule',
  'pages.monitor.alert.agg.by.severity': 'Severity',
  'pages.monitor.alert.agg.by.group': 'Group',
  'pages.monitor.alert.agg.by.label': 'Label',
  'pages.monitor.alert.agg.summary':
    '{total} active alerts in {count} buckets (click a card to filter)',
  'pages.monitor.alert.agg.emptyFiltered':
    'No active alerts match the current filters',
  'pages.monitor.alert.agg.error': 'Failed to load aggregation',
  'pages.monitor.alert.agg.noLabel': '(no {label} label)',
  'pages.monitor.alert.agg.filtered': 'Filtered by "{name}"',
  'pages.monitor.alert.agg.partial':
    'Cards ignore the keyword, "Mine", handling-state, rule and resource filters, so counts may exceed the list below',
  'pages.monitor.alert.agg.labelLimit':
    'Up to {max} label filters are allowed and all are in use, so this card cannot be applied; remove one label filter first',
  'pages.monitor.alert.rule.filtered': 'Showing alerts of rule "{name}"',
  'pages.monitor.alert.fingerprint': 'Fingerprint',
  'pages.monitor.alert.fingerprint.filtered':
    'Showing past alerts of the same object (fingerprint {fingerprint})',
  'pages.monitor.alert.sameObject': 'Past alerts of this object',
  'pages.monitor.alert.detail.title': 'Alert detail',
  'pages.monitor.alert.backToList': 'Back to alerts',
  'pages.monitor.alert.notFound':
    'The alert does not exist or you cannot view it',
  'pages.monitor.alert.loadFailed': 'Failed to load the alert',
  'pages.monitor.alert.ruleDeleted': 'Rule deleted',
  'pages.monitor.alert.section.basic': 'Basics',
  'pages.monitor.alert.section.expr': 'Expression',
  'pages.monitor.alert.section.timeline': 'Notification timeline',
  'pages.monitor.alert.recoveryValue': 'Recovery value',
  'pages.monitor.alert.lastFireTime': 'Last fired',
  'pages.monitor.alert.openExplore': 'Open in Explore',
  'pages.monitor.alert.notify.seq': 'Notification #{n}',
  'pages.monitor.alert.notify.source.rule': 'Source: rule notification targets',
  'pages.monitor.alert.notify.source.subscription':
    'Source: subscription "{name}"',
  'pages.monitor.alert.notify.noRecipient': 'No recipients',
  'pages.monitor.alert.notify.delivery': 'Delivery {n}',
  'pages.monitor.alert.notify.empty': 'No notifications sent yet',
  'pages.monitor.alert.notify.undelivered':
    'The notification was not delivered; it will be retried automatically',
  'pages.monitor.alert.mute.prefillName': 'Mute {name}',
  'pages.monitor.alert.subscribe.prefillName': 'Subscribe to {name}',

  // 告警规则：分组与授权
  'pages.monitor.group.title': 'Rule groups',
  'pages.monitor.group.contextTip': 'Right-click a group to manage it',
  'pages.monitor.group.all': 'All rules',
  'pages.monitor.group.empty':
    'No accessible rule groups. Ask an administrator for access.',
  'pages.monitor.group.createRoot': 'New top-level group',
  'pages.monitor.group.createChild': 'New subgroup',
  'pages.monitor.group.createChild.title': 'New group under "{name}"',
  'pages.monitor.group.edit.title': 'Edit group - {name}',
  'pages.monitor.group.scope': 'Role access',
  'pages.monitor.group.delete.title': 'Delete group "{name}"?',
  'pages.monitor.group.delete.description':
    'A group that still has subgroups or rules cannot be deleted. Role access granted on this group is removed with it.',
  'pages.monitor.group.form.name': 'Group name',
  'pages.monitor.group.form.name.blank': 'The name cannot be blank',
  'pages.monitor.group.form.sort': 'Sort order',
  'pages.monitor.group.form.sort.tooltip':
    'Siblings are ordered ascending by this value, 0-9999. A group cannot be moved under another parent.',
  'pages.monitor.scope.title': 'Role access - {name}',
  'pages.monitor.scope.notice':
    'A granted group includes its subgroups. Read only: view rules and alerts. Manage: also maintain rules and mutes.',
  'pages.monitor.scope.role.placeholder': 'Select a role',
  'pages.monitor.scope.roleDisabled': '{name} (disabled)',
  'pages.monitor.scope.add': 'Add role',
  'pages.monitor.scope.loadFailed':
    'Failed to load role access, so it cannot be edited. Try again.',
  'pages.monitor.scope.inherited':
    'Inherited from parent groups (edit on the source group)',
  'pages.monitor.scope.column.role': 'Role',
  'pages.monitor.scope.column.level': 'Level',
  'pages.monitor.scope.column.from': 'Source group',

  // 告警规则：列表
  'pages.monitor.rule.search.placeholder': 'Name / description / PromQL',
  'pages.monitor.rule.search.labels.tooltip':
    'Filter by extra labels. Each item is name=value, up to 5 items, ANDed together',
  'pages.monitor.rule.search.firing.yes': 'Firing',
  'pages.monitor.rule.search.firing.no': 'Not firing',
  'pages.monitor.rule.column.name': 'Rule name',
  'pages.monitor.rule.column.expr': 'PromQL',
  'pages.monitor.rule.column.timing': 'Interval / for',
  'pages.monitor.rule.column.timing.tooltip':
    'Evaluation interval / pending duration',
  'pages.monitor.rule.column.firing': 'Active alerts',
  'pages.monitor.rule.column.lastStatus': 'Last evaluation',
  'pages.monitor.rule.column.updatedBy': 'Last modified',
  'pages.monitor.rule.create.title': 'New rule',
  'pages.monitor.rule.edit.title': 'Edit rule - {name}',
  'pages.monitor.rule.view.title': 'View rule - {name}',
  'pages.monitor.rule.action.clone': 'Clone',
  'pages.monitor.rule.action.move': 'Move',
  'pages.monitor.rule.action.versions': 'History',
  'pages.monitor.rule.action.evalRecords': 'Evaluation records',
  'pages.monitor.rule.disable.title': 'Disable rule "{name}"?',
  'pages.monitor.rule.disable.description':
    'A disabled rule is no longer evaluated; its active alerts are closed without a recovery notification. To silence it temporarily, use a mute rule instead.',
  'pages.monitor.rule.disable.firing':
    'This rule has {count} active alerts. Disabling it closes them and no recovery notification will be sent. To silence it temporarily, use a mute rule instead.',
  'pages.monitor.rule.delete.title': 'Delete rule "{name}"?',
  'pages.monitor.rule.delete.description':
    'Its active alerts are closed (no recovery notification); past alerts are kept.',
  'pages.monitor.rule.clone.title': 'Clone rule - {name}',
  'pages.monitor.rule.clone.name': 'New rule name',
  'pages.monitor.rule.clone.name.placeholder': 'Defaults to "{name} - copy"',
  'pages.monitor.rule.clone.done':
    'Cloned. The new rule is disabled by default.',
  'pages.monitor.rule.noRepeat': 'No repeat',

  // 告警规则：表单
  'pages.monitor.rule.section.basic': 'Basics',
  'pages.monitor.rule.section.query': 'Datasource & queries',
  'pages.monitor.rule.section.effective': 'Active hours',
  'pages.monitor.rule.section.content': 'Event content',
  'pages.monitor.rule.section.notify': 'Notification',
  'pages.monitor.rule.form.labels': 'Extra labels',
  'pages.monitor.rule.form.labels.tooltip':
    'Merged with series labels into event labels (these win on conflict); usable in mutes, subscriptions and routes.',
  'pages.monitor.rule.form.labels.add': 'Add label',
  'pages.monitor.rule.form.labels.rule':
    'Up to 20. Names start with a letter or underscore, contain only letters, digits and underscores, do not start with __ and are unique; values are 1-256 characters',
  'pages.monitor.rule.form.labels.refire':
    "Changing extra labels makes this rule's active alerts resolve, then fire again with the new labels",
  'pages.monitor.rule.form.datasourceScope': 'Datasource scope',
  'pages.monitor.rule.form.datasourceScope.allHint':
    'Runs on {count} enabled datasources now; new ones are included automatically, disabled or deleted ones drop out.',
  'pages.monitor.rule.form.datasourceScope.eachHint':
    'Each datasource is evaluated separately and produces its own events',
  'pages.monitor.rule.form.queries': 'Queries & severity',
  'pages.monitor.rule.form.queries.tooltip':
    'Put the threshold in the PromQL: any result is an anomaly, one alert per series. Use one query per severity.',
  'pages.monitor.rule.form.queries.add': 'Add query',
  'pages.monitor.rule.form.queries.rule':
    'Enter 1-4 queries; each needs an expression and a distinct severity',
  'pages.monitor.rule.form.expr.placeholder':
    'PromQL including the comparison, e.g. cpu_usage > 90',
  'pages.monitor.rule.form.expr.valid': 'Syntax OK',
  'pages.monitor.rule.form.validate': 'Validate',
  'pages.monitor.rule.form.preview': 'Preview data',
  'pages.monitor.rule.form.levelInhibit': 'Severity inhibition',
  'pages.monitor.rule.form.levelInhibit.tooltip':
    'When a series matches several thresholds, keep only the highest severity; when off, each severity fires its own event.',
  'pages.monitor.rule.form.levelInhibit.refire':
    "Switching this makes the rule's active alerts resolve, then fire again",
  'pages.monitor.rule.form.evalInterval': 'Evaluation interval',
  'pages.monitor.rule.form.evalInterval.tooltip':
    'How often the query runs, 15-3600 s; 60 recommended',
  'pages.monitor.rule.form.for': 'Pending duration',
  'pages.monitor.rule.form.for.tooltip':
    'The anomaly must last this long before the alert fires; 0 fires immediately',
  'pages.monitor.rule.form.recover': 'Recovery hold',
  'pages.monitor.rule.form.recover.tooltip':
    'The series must stay normal this long before the alert resolves (anti-flapping); 0 resolves immediately',
  'pages.monitor.rule.form.nodataKeep': 'Keep after series vanishes',
  'pages.monitor.rule.form.nodataKeep.tooltip':
    'Seconds to keep the alert after its series disappears, so a brief scrape gap is not a recovery. 0 = use recovery hold.',
  'pages.monitor.rule.form.effective': 'Active time',
  'pages.monitor.rule.form.effective.tooltip':
    'Outside these windows the rule is not evaluated and existing alerts stay as they are',
  'pages.monitor.rule.form.effective.always': 'Always active',
  'pages.monitor.rule.form.annotations': 'Annotations',
  'pages.monitor.rule.form.annotations.tooltip':
    'Text sent with notifications, e.g. summary, runbook_url. Values may use template functions such as printf, humanize.',
  'pages.monitor.rule.form.annotations.hint':
    'Values are templates, e.g. {{ $labels.instance }}, {{ $value }}',
  'pages.monitor.rule.form.annotations.add': 'Add annotation',
  'pages.monitor.rule.form.annotations.rule':
    'Up to 10. Names start with a letter or underscore, contain only letters, digits and underscores and are unique; values are 1-2048 characters',
  'pages.monitor.rule.form.recoveryExpr': 'Recovery query',
  'pages.monitor.rule.form.recoveryExpr.tooltip':
    'PromQL (no threshold) run when the alert resolves; its result is shown as the recovery value. {{ $labels.<name> }} is available.',
  'pages.monitor.rule.form.notify.hint':
    'A rule sets who is notified and how often; channels and content come from Notifications. Empty = routes and subscriptions decide.',
  'pages.monitor.rule.form.depts': 'Department leaders',
  'pages.monitor.rule.form.depts.tooltip':
    'Notifies the leaders of the selected departments',
  'pages.monitor.rule.form.depts.placeholder': 'Select departments',
  'pages.monitor.rule.form.notifyRecovery': 'Notify on recovery',
  'pages.monitor.rule.form.repeatInterval': 'Repeat interval',
  'pages.monitor.rule.form.repeatInterval.tooltip':
    'While the alert keeps firing, notify again at this interval; 0 means no repeat, otherwise 5-10080 minutes',
  'pages.monitor.rule.form.repeatInterval.rule':
    'Enter 0 (no repeat) or 5-10080',
  'pages.monitor.rule.form.maxNotify': 'Max notifications',
  'pages.monitor.rule.form.maxNotify.tooltip':
    'Cap on notifications per event (including the first, excluding recovery); 0 means unlimited',
  'pages.monitor.rule.form.groupKeyLabels': 'Grouping labels',
  'pages.monitor.rule.form.groupKeyLabels.tooltip':
    'Label names used to group notifications (e.g. datacenter, service); empty groups all events of the rule together',
  'pages.monitor.rule.form.groupKeyLabels.placeholder':
    'Type a label name and press Enter; empty groups by rule',
  'pages.monitor.rule.form.groupKeyLabels.rule':
    'Label names start with a letter or underscore and contain only letters, digits and underscores',
  'pages.monitor.rule.form.summary': 'Change note',
  'pages.monitor.rule.form.summary.tooltip':
    'Optional; recorded in the change history',

  // 告警规则：批量、导入导出
  'pages.monitor.rule.batch.action': 'Batch actions',
  'pages.monitor.rule.batch.clear': 'Clear selection',
  'pages.monitor.rule.batch.limit':
    'Up to {max} rules can be selected at once; the rest were not selected',
  'pages.monitor.rule.batch.affected':
    'This applies to the {count} selected rules. Each rule is processed independently; failures do not affect the others',
  'pages.monitor.rule.batch.targetGroup': 'Target group',
  'pages.monitor.rule.batch.severity.hint':
    'Only applies to rules with a single query; rules with multiple thresholds will fail',
  'pages.monitor.rule.batch.timing.hint':
    'Only the fields you fill in are changed; empty ones are left as they are',
  'pages.monitor.rule.batch.addLabels.hint':
    'Same-name labels are overwritten; each rule may still have at most 20',
  'pages.monitor.rule.batch.labelNames': 'Label names to remove',
  'pages.monitor.rule.batch.labelNames.rule':
    'Enter at least one valid label name',
  'pages.monitor.rule.batch.notify.hint':
    'Only the checked items are changed; notification targets are replaced as a whole',
  'pages.monitor.rule.batch.notify.targets':
    'Notification targets (replaced as a whole; leaving all empty clears them)',
  'pages.monitor.rule.batch.nothing': 'Fill in or check at least one item',
  'pages.monitor.rule.batch.result': '{succeeded} succeeded, {failed} failed',
  'pages.monitor.rule.batch.column.result': 'Result',
  'pages.monitor.rule.batch.column.reason': 'Reason',
  'pages.monitor.rule.batch.ok': 'OK',
  'pages.monitor.rule.batch.failed': 'Failed',
  'pages.monitor.rule.import.action': 'Import',
  'pages.monitor.rule.import.title.input': 'Import alert rules',
  'pages.monitor.rule.import.title.preview': 'Import preview',
  'pages.monitor.rule.import.title.result': 'Import result',
  'pages.monitor.rule.import.hint':
    'Accepts Prometheus / vmalert alerting rule YAML or JSON exported here; recording rules are skipped.',
  'pages.monitor.rule.import.content': 'Rule content',
  'pages.monitor.rule.import.upload': 'Choose a YAML / JSON file',
  'pages.monitor.rule.import.tooLarge':
    'The content must not exceed 1 MiB. Split the file.',
  'pages.monitor.rule.import.group': 'Import into group',
  'pages.monitor.rule.import.defaultSeverity': 'Default severity',
  'pages.monitor.rule.import.defaultSeverity.hint':
    'Used when a rule has no recognisable severity label',
  'pages.monitor.rule.import.severityMap': 'Severity mapping',
  'pages.monitor.rule.import.severityMap.tooltip':
    'Maps severity label values to severities here (case-insensitive). Unlisted values use the built-in mapping, then the default.',
  'pages.monitor.rule.import.severityMap.label':
    'Severity label value, e.g. P1',
  'pages.monitor.rule.import.severityMap.add': 'Add mapping',
  'pages.monitor.rule.import.severityMap.rule':
    'Label values must not be empty or repeated (case-insensitive)',
  'pages.monitor.rule.import.jsonHint':
    'Recognised as JSON exported here: imported as is; default severity and severity mapping do not apply.',
  'pages.monitor.rule.import.notifyUsers': 'Notify users',
  'pages.monitor.rule.import.notify.hint':
    'Targets may be left empty and set in batch after the import',
  'pages.monitor.rule.import.notify.jsonHint':
    'Leave empty to keep the targets in the file; anything set here replaces them',
  'pages.monitor.rule.import.preview': 'Preview',
  'pages.monitor.rule.import.back': 'Back',
  'pages.monitor.rule.import.submit': 'Import {count}',
  'pages.monitor.rule.import.close': 'Done',
  'pages.monitor.rule.import.preview.summary':
    '{total} parsed: {newCount} new, {conflict} name conflicts, {invalid} invalid, {skipped} skipped',
  'pages.monitor.rule.import.preview.limit':
    'Only the first {shown} are listed. Split large files and import in batches.',
  'pages.monitor.rule.import.column.sourceGroup': 'Source group',
  'pages.monitor.rule.import.column.status': 'Outcome',
  'pages.monitor.rule.import.column.problems': 'Problems & notes',
  'pages.monitor.rule.import.problem.error': 'Cannot import: {detail}',
  'pages.monitor.rule.import.onConflict': 'On name conflict',
  'pages.monitor.rule.import.enabled': 'Enable right after import',
  'pages.monitor.rule.import.enabled.hint':
    'Importing disabled first and enabling in batch after review is recommended',
  'pages.monitor.rule.import.result.summary':
    '{created} created, {updated} overwritten, {skipped} skipped, {failed} failed',
  'pages.monitor.rule.export.action': 'Export',
  'pages.monitor.rule.export.yaml': 'Prometheus YAML (for exchange)',
  'pages.monitor.rule.export.json': 'JSON (full content, re-importable)',
  'pages.monitor.rule.export.needScope':
    'Select rules first, or pick a group on the left',
  'pages.monitor.rule.export.done': '{count} rules exported',

  // 告警规则：变更历史、判定记录
  'pages.monitor.rule.version.drawer': 'History - {name}',
  'pages.monitor.rule.version.column.version': 'Version',
  'pages.monitor.rule.version.column.action': 'Action',
  'pages.monitor.rule.version.column.operator': 'Operator',
  'pages.monitor.rule.version.column.time': 'Time',
  'pages.monitor.rule.version.current': 'Current',
  'pages.monitor.rule.version.compare': 'Compare the two selected',
  'pages.monitor.rule.version.compare.title': 'Compare: v{from} → v{to}',
  'pages.monitor.rule.version.title': 'Version v{version}',
  'pages.monitor.rule.version.field': 'Field',
  'pages.monitor.rule.version.onlyChanged': 'Only changed fields',
  'pages.monitor.rule.version.same': 'The two versions are identical',
  'pages.monitor.rule.version.rollback': 'Roll back',
  'pages.monitor.rule.version.rollback.title':
    'Roll back to version v{version}?',
  'pages.monitor.rule.version.rollback.description':
    'The rule content is restored to that version and takes effect immediately. The rollback is recorded as a new version; history is not rewritten.',
  'pages.monitor.rule.version.rollback.done': 'Rolled back',
  'pages.monitor.rule.eval.drawer': 'Evaluation records - {name}',
  'pages.monitor.rule.eval.tasks': 'Current state per datasource',
  'pages.monitor.rule.eval.records': 'Evaluation rounds (kept for 7 days)',
  'pages.monitor.rule.eval.nextTime': 'Next evaluation',
  'pages.monitor.rule.eval.column.time': 'Evaluated at',
  'pages.monitor.rule.eval.column.status': 'Result',
  'pages.monitor.rule.eval.column.series': 'Series',
  'pages.monitor.rule.eval.column.anomalies': 'Anomalies',
  'pages.monitor.rule.eval.column.recovered': 'Recovered',
  'pages.monitor.rule.eval.column.duration': 'Took',
  'pages.monitor.rule.eval.column.error': 'Error',
  'pages.monitor.rule.eval.query': 'Query',
  'pages.monitor.rule.eval.query.index': 'Query {n}',
  'pages.monitor.rule.eval.query.note':
    'Evaluation records do not keep the expression used at the time; if the rule has changed since, see the matching version in Change history',
  'pages.monitor.rule.eval.truncated': 'Truncated',
  'pages.monitor.rule.eval.partial': 'Partial result',
  'pages.monitor.rule.eval.incomplete': 'Incomplete',
  'pages.monitor.rule.eval.incomplete.tooltip':
    'Series were truncated or the datasource returned a partial result; missing series keep their state and are not resolved.',
  'pages.monitor.rule.eval.step': 'Outcome',
  'pages.monitor.rule.eval.viewAlert': 'View alert',
  'pages.monitor.rule.eval.pointsTruncated':
    'More than 50 anomalous points; the rest are not listed',

  // 屏蔽规则
  'pages.monitor.mute.search.placeholder': 'Name / reason',
  'pages.monitor.mute.create.title': 'New mute rule',
  'pages.monitor.mute.edit.title': 'Edit mute rule - {name}',
  'pages.monitor.mute.created': 'Created. It takes effect within 5 seconds.',
  'pages.monitor.mute.allGroups': 'All groups',
  'pages.monitor.mute.column.conditions': 'Conditions',
  'pages.monitor.mute.column.time': 'Mute time',
  'pages.monitor.mute.column.state': 'State',
  'pages.monitor.mute.column.mutedCount': 'Muting',
  'pages.monitor.mute.column.mutedCount.tooltip':
    'Active alerts whose notifications it is currently muting',
  'pages.monitor.mute.time.open': 'open',
  'pages.monitor.mute.delete.title': 'Delete mute rule "{name}"?',
  'pages.monitor.mute.delete.description':
    'Alerts it was muting are notified again; if still firing, that counts as a new notification.',
  'pages.monitor.mute.section.match':
    'Conditions (ANDed; empty means no restriction)',
  'pages.monitor.mute.section.behaviour': 'Mode & time',
  'pages.monitor.mute.form.group': 'Scope group',
  'pages.monitor.mute.form.group.tooltip':
    'Only mutes alerts from rules in this group and its subgroups. Only super administrators can target all groups.',
  'pages.monitor.mute.form.group.placeholder':
    'Select the rule group it applies to',
  'pages.monitor.mute.form.group.all': 'Empty = applies to all groups',
  'pages.monitor.mute.form.reason': 'Reason',
  'pages.monitor.mute.form.mode': 'Mode',
  'pages.monitor.mute.form.mode.1.hint':
    'Events are still created and recorded, just not notified; suited to changes and maintenance',
  'pages.monitor.mute.form.mode.2.hint':
    'Matching alerts create no event and leave no record; use only for noise you can safely ignore',
  'pages.monitor.mute.form.timeType': 'Time type',
  'pages.monitor.mute.form.range': 'Mute period',
  'pages.monitor.mute.form.periodic': 'Recurring windows',
  'pages.monitor.mute.form.periodic.required':
    'Add at least one time window, each with days and both times',
  'pages.monitor.mute.form.validity': 'Validity',
  'pages.monitor.mute.form.validity.tooltip':
    'Optional: the recurring mute applies from the start and expires at the end; either side may be left empty',
  'pages.monitor.mute.quick.30': '30 min',
  'pages.monitor.mute.quick.60': '1 hour',
  'pages.monitor.mute.quick.120': '2 hours',
  'pages.monitor.mute.quick.360': '6 hours',
  'pages.monitor.mute.quick.1440': '1 day',
  'pages.monitor.mute.quick.10080': '7 days',
  'pages.monitor.mute.preview.summary':
    '{total} currently active alerts would match (time range not considered); the latest {shown} are listed',

  // 告警订阅
  'pages.monitor.subscription.tab.mine': 'My subscriptions',
  'pages.monitor.subscription.tab.all': 'All subscriptions',
  'pages.monitor.subscription.notice':
    "Follow alerts you do not own, independent of each rule's recipients. Set channels in Notifications → Subscriptions.",
  'pages.monitor.subscription.search.placeholder': 'Subscription name',
  'pages.monitor.subscription.create.title': 'New subscription',
  'pages.monitor.subscription.edit.title': 'Edit subscription - {name}',
  'pages.monitor.subscription.column.owner': 'Owner',
  'pages.monitor.subscription.column.filter': 'Filter',
  'pages.monitor.subscription.column.receivers': 'Receivers',
  'pages.monitor.subscription.column.lastHitTime': 'Last hit',
  'pages.monitor.subscription.column.hitCount7d': 'Hits (7 days)',
  'pages.monitor.subscription.neverHit': 'Never',
  'pages.monitor.subscription.outOfScope':
    'The owner can no longer access this group; its alerts are no longer sent to this subscription',
  'pages.monitor.subscription.receiver.me': 'Me',
  'pages.monitor.subscription.receiver.owner': 'Owner',
  'pages.monitor.subscription.event.firing': 'Firing',
  'pages.monitor.subscription.event.resolved': 'Resolved',
  'pages.monitor.subscription.disable.title': 'Disable subscription "{name}"?',
  'pages.monitor.subscription.disable.description':
    'Receivers stop getting subscription notifications. It can be enabled again at any time.',
  'pages.monitor.subscription.delete.title': 'Delete subscription "{name}"?',
  'pages.monitor.subscription.delete.description':
    'Receivers stop getting subscription notifications.',
  'pages.monitor.subscription.section.filter': 'Filter (ANDed)',
  'pages.monitor.subscription.section.receiver': 'Receivers & behaviour',
  'pages.monitor.subscription.form.groups': 'Rule groups',
  'pages.monitor.subscription.form.groups.tooltip':
    'Only groups you can access; selecting a parent includes all of its subgroups',
  'pages.monitor.subscription.form.events': 'Events',
  'pages.monitor.subscription.form.broad':
    'No rule, datasource or label filter: you will receive every alert of these severities in the selected groups.',
  'pages.monitor.subscription.form.self': 'Notify me',
  'pages.monitor.subscription.form.receiver.required':
    'Choose at least one receiver: me, users, on-call schedules or chat groups',
  'pages.monitor.subscription.form.followRepeat': 'Follow repeats',
  'pages.monitor.subscription.form.followRepeat.tooltip':
    'Off: notified once on firing and once on recovery. On: also on every repeat notification of the rule.',
  'pages.monitor.subscription.form.others.tooltip':
    'Subscribing on behalf of other users, schedules or groups requires Manage access to the selected groups',
  'pages.monitor.subscription.form.robotGroups': 'Chat groups',
  'pages.monitor.subscription.form.robotGroups.tooltip':
    'Group identifiers of chat-robot channels in Notifications, starting with $, e.g. $group:ops; up to 10',
  'pages.monitor.subscription.form.robotGroups.rule':
    'A group identifier starts with $ followed by 1-63 letters, digits or : _ . -',
  'pages.monitor.subscription.preview.summary':
    '{total} alerts (currently active plus the last 24 hours of history) would match; the latest {shown} are listed',

  // 数据源
  'pages.monitor.datasource.search.placeholder': 'Name / URL',
  'pages.monitor.datasource.create.title': 'New datasource',
  'pages.monitor.datasource.edit.title': 'Edit datasource - {name}',
  'pages.monitor.datasource.default': 'Default',
  'pages.monitor.datasource.defaultSuffix': '(default)',
  'pages.monitor.datasource.disabledSuffix': '(disabled)',
  'pages.monitor.datasource.column.name': 'Name',
  'pages.monitor.datasource.column.url': 'Query URL',
  'pages.monitor.datasource.column.authType': 'Auth',
  'pages.monitor.datasource.column.health': 'Health',
  'pages.monitor.datasource.column.healthTime': 'Last probe',
  'pages.monitor.datasource.column.ruleCount': 'Rules',
  'pages.monitor.datasource.column.ruleCount.tooltip':
    'Rules that explicitly select this datasource (all-datasource rules excluded). Cannot be deleted while above 0.',
  'pages.monitor.datasource.url.hint':
    'Base URL without /api/v1/query; a path prefix is allowed',
  'pages.monitor.datasource.url.example.vmSingle':
    'VictoriaMetrics single-node',
  'pages.monitor.datasource.url.example.vmCluster':
    'VictoriaMetrics cluster (0 is the tenant ID)',
  'pages.monitor.datasource.url.example.prometheus': 'Prometheus',
  'pages.monitor.datasource.url.rule':
    'Must start with http:// or https:// and contain no whitespace',
  'pages.monitor.datasource.form.timeout': 'Query timeout (ms)',
  'pages.monitor.datasource.form.username': 'Username',
  'pages.monitor.datasource.form.password': 'Password',
  'pages.monitor.datasource.form.token': 'Token',
  'pages.monitor.datasource.form.secret.kept':
    'Already set; leave empty to keep it',
  'pages.monitor.datasource.form.secret.required': 'Enter the credential',
  'pages.monitor.datasource.form.secret.addressChanged':
    'The scheme, host or port of the address changed; enter the credential again',
  'pages.monitor.datasource.form.headers': 'Custom headers',
  'pages.monitor.datasource.form.headers.tooltip':
    'Up to 20. Headers such as Authorization, Cookie, Host and Content-Type are not allowed.',
  'pages.monitor.datasource.form.headers.key': 'Header name',
  'pages.monitor.datasource.form.headers.value': 'Value',
  'pages.monitor.datasource.form.headers.kept':
    'Already set; leave empty to keep it',
  'pages.monitor.datasource.form.headers.addressChanged':
    'The scheme, host or port of the address changed; enter the header values marked "Already set" again',
  'pages.monitor.datasource.form.headers.add': 'Add header',
  'pages.monitor.datasource.form.headers.rule':
    'Header names must be valid (up to 64 characters) and unique (case-insensitive); values up to 1024 characters',
  'pages.monitor.datasource.form.headers.valueRequired':
    'Enter a value for every header; a renamed header needs its value again, and only an unrenamed header marked "Already set" may be left empty to keep its value',
  'pages.monitor.datasource.form.headers.maskLiteral':
    'A header value cannot be ****** (that means "keep the saved value")',
  'pages.monitor.datasource.form.remoteWriteUrl': 'Remote write URL',
  'pages.monitor.datasource.form.remoteWriteUrl.tooltip':
    'Optional; recording rules write metrics back through it. On a cluster it is the vminsert URL, not the query URL.',
  'pages.monitor.datasource.form.tlsSkipVerify': 'Skip TLS verify',
  'pages.monitor.datasource.form.tlsSkipVerify.tooltip':
    'For internal datasources with self-signed certificates',
  'pages.monitor.datasource.form.isDefault': 'Default',
  'pages.monitor.datasource.form.isDefault.tooltip':
    'Preselected for new rules and Explore. At most one; setting it clears the previous default.',
  'pages.monitor.datasource.form.enabled.tooltip':
    'When off, rules stop evaluating on it. When on, rules scoped to all datasources run on it automatically.',
  'pages.monitor.datasource.test': 'Test connection',
  'pages.monitor.datasource.testing': 'Testing…',
  'pages.monitor.datasource.test.ok': 'Connected in {ms} ms',
  'pages.monitor.datasource.test.failed': 'Connection failed ({ms} ms)',
  'pages.monitor.datasource.delete.title': 'Delete datasource "{name}"?',
  'pages.monitor.datasource.delete.description':
    'It cannot be deleted while rules explicitly select it. Rules scoped to all datasources drop it automatically and their active alerts on it are closed.',
  'pages.monitor.datasource.delete.inUse.title':
    'The datasource is still in use',
  'pages.monitor.datasource.delete.inUse.hint':
    'Filter Alert Rules by this datasource, switch those rules to another datasource, then delete it.',

  // 即时查询
  'pages.monitor.explore.datasource.placeholder': 'Select a datasource',
  'pages.monitor.explore.expr.placeholder': 'Enter PromQL, e.g. up == 0',
  'pages.monitor.explore.mode.range': 'Range',
  'pages.monitor.explore.mode.instant': 'Instant',
  // ---------- Phase 2 / 3: menus, element permissions, enums, error reasons (page texts live in the monitor*.ts fragments) ----------
  'menu.monitor.mute.silence': 'Mute Rules',
  'menu.monitor.mute.inhibit': 'Inhibit Rules',
  'menu.monitor.escalation': 'Escalation Policies',
  'menu.monitor.record': 'Recording Rules',
  'menu.monitor.stats': 'Alert Statistics',
  'menu.monitor.engine': 'Engine Status',
  'permission.monitor.alert.ack': 'Acknowledge / transfer alerts',
  'permission.monitor.alert.comment': 'Comment on alerts',
  'permission.monitor.alert.close': 'Close alerts manually',
  'permission.monitor.alert.ticket': 'Create ticket from alert',
  'permission.monitor.alert.view': 'Save aggregate views',
  'permission.monitor.rule.simulate': 'Simulate alert rule',
  'permission.monitor.mute.inhibit_create': 'Create inhibit rule',
  'permission.monitor.mute.inhibit_edit': 'Edit inhibit rule',
  'permission.monitor.mute.inhibit_delete': 'Delete inhibit rule',
  'permission.monitor.escalation.create': 'Create escalation policy',
  'permission.monitor.escalation.edit': 'Edit escalation policy',
  'permission.monitor.escalation.delete': 'Delete escalation policy',
  'permission.monitor.record.create': 'Create recording rule',
  'permission.monitor.record.edit': 'Edit / toggle recording rule',
  'permission.monitor.record.delete': 'Delete recording rule',
  'enum.monitor.notifyKind.4': 'Escalation',
  'enum.monitor.handleState.1': 'Unacknowledged',
  'enum.monitor.handleState.2': 'Acknowledged',
  'enum.monitor.handleState.3': 'Muted',
  'enum.monitor.handleState.4': 'Inhibited',
  'enum.monitor.escalationMode.1': 'Stack',
  'enum.monitor.escalationMode.2': 'Take over',
  'enum.monitor.escalationTrigger.1': 'Still unacknowledged',
  'enum.monitor.escalationTrigger.2': 'Still unresolved',
  'enum.monitor.evalStep.dropped': 'Dropped by condition (no event)',
  'enum.monitor.evalStep.out_of_scope': 'Outside resource scope (no event)',
  'enum.monitor.evalStep.inhibited_rule': 'Inhibited by rule (not notified)',
  'enum.monitor.evalStep.inhibited_topology':
    'Upstream resource alerting (not notified)',
  'enum.monitor.evalStep.muted_maintenance':
    'Resource in maintenance (not notified)',
  'enum.monitor.batchAction.set_escalation': 'Set escalation policy',
  'pages.monitor.error.MONITOR_NOT_IMPLEMENTED':
    'This feature is not available on the server yet',
  'pages.monitor.error.MONITOR_RULE_TEMPLATE_NOT_FOUND':
    'The rule template pack does not exist',
  'pages.monitor.error.MONITOR_SIMULATE_INVALID':
    'The simulation parameters are invalid',
  'pages.monitor.error.MONITOR_ALERT_NOT_FIRING':
    'The alert is already resolved or closed and can no longer be acknowledged, transferred or closed',
  'pages.monitor.error.MONITOR_ALERT_ALREADY_ACKED':
    'The alert is already acknowledged by someone else; use Transfer to take it over',
  'pages.monitor.error.MONITOR_ALERT_ALREADY_ACKED.by':
    'The alert is already acknowledged by {name}; use Transfer to take it over',
  'pages.monitor.error.MONITOR_ALERT_ACTION_INVALID':
    'The action parameters are invalid',
  'pages.monitor.error.MONITOR_ALERT_TICKET_EXISTS':
    'The alert is already linked to a ticket',
  'pages.monitor.error.MONITOR_ALERT_VIEW_NOT_FOUND':
    'The aggregate view does not exist or you cannot change it',
  'pages.monitor.error.MONITOR_ALERT_VIEW_NAME_EXISTS':
    'An aggregate view with this name already exists',
  'pages.monitor.error.MONITOR_ALERT_VIEW_INVALID':
    'The aggregate view is invalid',
  'pages.monitor.error.MONITOR_ESCALATION_NOT_FOUND':
    'The escalation policy does not exist',
  'pages.monitor.error.MONITOR_ESCALATION_NAME_EXISTS':
    'An escalation policy with this name already exists in the same scope',
  'pages.monitor.error.MONITOR_ESCALATION_INVALID':
    'The escalation policy is invalid',
  'pages.monitor.error.MONITOR_ESCALATION_IN_USE':
    'The escalation policy is still referenced by rules and cannot be deleted',
  'pages.monitor.error.MONITOR_ESCALATION_IN_USE.refs':
    'The escalation policy is still referenced by {count} rule(s) and cannot be deleted',
  'pages.monitor.error.MONITOR_INHIBIT_NOT_FOUND':
    'The inhibit rule does not exist',
  'pages.monitor.error.MONITOR_INHIBIT_INVALID': 'The inhibit rule is invalid',
  'pages.monitor.error.MONITOR_RECORD_RULE_NOT_FOUND':
    'The recording rule does not exist',
  'pages.monitor.error.MONITOR_RECORD_RULE_NAME_EXISTS':
    'A recording rule with this metric name already exists for the same group and datasource',
  'pages.monitor.error.MONITOR_RECORD_RULE_INVALID':
    'The recording rule is invalid',
  'pages.monitor.error.MONITOR_RECORD_RULE_NO_WRITE_URL':
    'The selected datasource has no Remote Write URL and cannot be used for recording rules',
  'pages.monitor.ciAlerts.tab': 'Alerts',
  'pages.monitor.ciAlerts.active': 'Active',
  'pages.monitor.ciAlerts.history': 'History',
  'pages.monitor.ciAlerts.viewAll': 'Open in Alerts',
  'pages.monitor.ciAlerts.failed': 'Failed to load alerts',
  'pages.monitor.ciAlerts.empty.active': 'This resource has no active alerts',
  'pages.monitor.ciAlerts.empty.history': 'This resource has no past alerts',
  'pages.monitor.shiftAlerts.title': '{total} alert(s) during shifts:',
  'pages.monitor.shiftAlerts.primary': '{day} primary {name}',
  'pages.monitor.shiftAlerts.backup': '{day} backup {name}',
  'pages.monitor.shiftAlerts.tooltip':
    '{start} ~ {end}: {count} alert(s) notified to the person on duty',
  'pages.monitor.shiftAlerts.more': '{count} more shift(s)',
  ...monitorAlert,
  ...monitorNoise,
  ...monitorRuleExt,
  ...monitorRuleTools,
  ...monitorOps,
};
