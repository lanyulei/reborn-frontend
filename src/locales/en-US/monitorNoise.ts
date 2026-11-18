/** 监控告警 · 升级策略与抑制规则（由 monitor.ts 并入） */
export default {
  // Escalation policies
  'pages.monitor.escalation.create.title': 'New escalation policy',
  'pages.monitor.escalation.edit.title': 'Edit escalation policy - {name}',
  'pages.monitor.escalation.search.placeholder': 'Name / description',
  'pages.monitor.escalation.global': 'Global',
  'pages.monitor.escalation.column.scope': 'Scope',
  'pages.monitor.escalation.scope.global': 'Global policies',
  'pages.monitor.escalation.scope.group': 'Group policies',
  'pages.monitor.escalation.column.levels': 'Levels',
  'pages.monitor.escalation.column.estimate': 'Notifications / 24h',
  'pages.monitor.escalation.column.estimate.tooltip':
    "Most notifications in 24 hours for an alert nobody handles (the rule's own repeats excluded).",
  'pages.monitor.escalation.times': '{n}',
  'pages.monitor.escalation.column.ruleCount': 'Rules',
  'pages.monitor.escalation.delete.title': 'Delete escalation policy "{name}"?',
  'pages.monitor.escalation.delete.description':
    'A policy still referenced by rules cannot be deleted. Deletion cannot be undone.',
  'pages.monitor.escalation.rules.title': 'Rules using "{name}"',
  'pages.monitor.escalation.form.group': 'Owner group',
  'pages.monitor.escalation.form.group.tooltip':
    'Usable by rules in this group and its sub-groups. Empty = global (super admins only). Fixed after creation.',
  'pages.monitor.escalation.form.group.global': 'Empty = global policy',
  'pages.monitor.escalation.form.group.placeholder':
    'Select the owner rule group',
  'pages.monitor.escalation.form.mode': 'Mode',
  'pages.monitor.escalation.form.mode.1.hint':
    "After escalating, earlier levels and the rule's recipients keep getting repeat reminders",
  'pages.monitor.escalation.form.mode.2.hint':
    'After escalating, only the current level is reminded; recovery still goes to everyone notified',
  'pages.monitor.escalation.form.minSeverity': 'Min severity',
  'pages.monitor.escalation.form.minSeverity.tooltip':
    'Alerts below this severity are not escalated',
  'pages.monitor.escalation.form.enabled.tooltip':
    'When disabled, rules using it no longer escalate',
  'pages.monitor.escalation.section.levels': 'Levels',
  'pages.monitor.escalation.oncallGroups.failed':
    'Failed to load on-call groups (possibly no permission). Selected items are kept; retry later or contact an administrator',
  'pages.monitor.escalation.level.title': 'Level {n}',
  'pages.monitor.escalation.level.remove': 'Remove this level',
  'pages.monitor.escalation.level.add': 'Add level',
  'pages.monitor.escalation.level.trigger': 'Trigger',
  'pages.monitor.escalation.level.afterM': 'Minutes',
  'pages.monitor.escalation.level.afterM.hint':
    'Counted from the first firing; must increase level by level',
  'pages.monitor.escalation.level.backupOnly': 'Backup only',
  'pages.monitor.escalation.level.schedule.add': 'Add schedule',
  'pages.monitor.escalation.level.oncallGroups': 'On-call groups',
  'pages.monitor.escalation.level.oncallGroups.placeholder':
    'Select on-call groups (their admins are notified)',
  'pages.monitor.escalation.level.depts': 'Dept heads',
  'pages.monitor.escalation.level.depts.placeholder': 'Select department',
  'pages.monitor.escalation.level.dept.self': 'Head of this dept',
  'pages.monitor.escalation.level.dept.up': 'Head {n} level(s) up',
  'pages.monitor.escalation.level.dept.upLabel': 'Levels up',
  'pages.monitor.escalation.level.dept.add': 'Add department',
  'pages.monitor.escalation.level.repeat': 'Repeat interval',
  'pages.monitor.escalation.level.repeat.hint':
    '0 = no repeat, otherwise 5–10080 minutes',
  'pages.monitor.escalation.level.maxNotify': 'Max notifications',
  'pages.monitor.escalation.level.maxNotify.unit': 'times',
  'pages.monitor.escalation.level.maxNotify.hint':
    'Includes the one sent on escalation; 0 = unlimited',
  'pages.monitor.escalation.level.required': 'At least one level is required',
  'pages.monitor.escalation.level.invalid': 'Level {n}: {reason}',
  'pages.monitor.escalation.level.error.trigger': 'select a trigger',
  'pages.monitor.escalation.level.error.afterM':
    'minutes must be an integer between 1 and 10080',
  'pages.monitor.escalation.level.error.increasing':
    'minutes must be greater than the previous level (strictly increasing)',
  'pages.monitor.escalation.level.error.schedule':
    'a schedule row is empty; select one or remove the row',
  'pages.monitor.escalation.level.error.scheduleDup':
    'each schedule may appear only once',
  'pages.monitor.escalation.level.error.dept':
    'a department row is empty; select one or remove the row',
  'pages.monitor.escalation.level.error.targets':
    'choose at least one kind of recipient',
  'pages.monitor.escalation.level.error.repeat':
    'repeat interval must be 0 or 5–10080 minutes',
  'pages.monitor.escalation.level.error.maxNotify':
    'max notifications must be an integer between 0 and 100',
  'pages.monitor.escalation.estimate.pending':
    'Fill in the name and the levels to see the 24-hour notification estimate here',
  'pages.monitor.escalation.estimate.total':
    'With this configuration an alert nobody handles sends at most {total} notifications in 24 hours',
  'pages.monitor.escalation.estimate.rule': 'rule itself {n}',
  'pages.monitor.escalation.estimate.level': 'level {level}: {n}',
  'pages.monitor.escalation.estimate.warn':
    'That is a lot of notifications. Consider a longer repeat interval or a notification limit.',
  'pages.monitor.escalation.summary.trigger.1': 'Unacknowledged for {n} min',
  'pages.monitor.escalation.summary.trigger.2': 'Unresolved for {n} min',
  'pages.monitor.escalation.summary.backupOnly': '{name} (backup only)',
  'pages.monitor.escalation.summary.oncallGroup': '{name} admins',
  'pages.monitor.escalation.summary.dept': 'Head of {name}',
  'pages.monitor.escalation.summary.deptUp': 'Head {n} level(s) above {name}',
  'pages.monitor.escalation.summary.once': 'once',
  'pages.monitor.escalation.summary.repeat': 'repeats every {interval} min',
  'pages.monitor.escalation.summary.repeatMax':
    'repeats every {interval} min, up to {max} times',
  // Inhibit rules
  'pages.monitor.inhibit.create.title': 'New inhibit rule',
  'pages.monitor.inhibit.edit.title': 'Edit inhibit rule - {name}',
  'pages.monitor.inhibit.search.placeholder': 'Name / description',
  'pages.monitor.inhibit.column.inhibitedCount': 'Inhibiting',
  'pages.monitor.inhibit.column.inhibitedCount.tooltip':
    'Active alerts whose notifications it is currently inhibiting',
  'pages.monitor.inhibit.delete.title': 'Delete inhibit rule "{name}"?',
  'pages.monitor.inhibit.delete.description':
    'Alerts it is inhibiting are released at the next evaluation; if still firing, that counts as a new notification.',
  'pages.monitor.inhibit.form.hint':
    'While a source alert is active, target alerts with the same equal-label values are not notified or escalated, but still recorded.',
  'pages.monitor.inhibit.form.hint.example':
    'Example: source = rule "Host down", equal label = ident: other alerts of the same host are inhibited.',
  'pages.monitor.inhibit.form.group.tooltip':
    'Source and target alerts must both be in this group or its sub-groups. Empty = all groups (super admins only).',
  'pages.monitor.inhibit.section.source': 'Source conditions',
  'pages.monitor.inhibit.section.target': 'Target conditions',
  'pages.monitor.inhibit.form.source.required':
    'Source conditions cannot be empty: set at least one of rules, severities or label matchers',
  'pages.monitor.inhibit.form.target.required':
    'Target conditions and equal labels cannot both be empty',
  'pages.monitor.inhibit.form.equalLabels': 'Equal labels',
  'pages.monitor.inhibit.form.equalLabels.tooltip':
    'Source and target alerts must match on all these labels (a missing label counts as empty). Up to 10.',
  'pages.monitor.inhibit.form.equalLabels.placeholder':
    'Type a label name and press Enter, e.g. ident',
  'pages.monitor.inhibit.form.equalLabels.rule':
    'Label names start with a letter or underscore, contain only letters, digits and underscores, up to 128 characters',
  'pages.monitor.inhibit.preview.action': 'Preview',
  'pages.monitor.inhibit.preview.title': 'Inhibit preview',
  'pages.monitor.inhibit.preview.sources':
    'Active alerts matching the source conditions: {total} in total, {shown} listed',
  'pages.monitor.inhibit.preview.targets':
    'Alerts that would be inhibited: {total} in total, {shown} listed',
};
