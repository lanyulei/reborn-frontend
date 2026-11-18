export default {
  'pages.monitor.rule.template.action': 'From template',
  'pages.monitor.rule.template.title': 'Create rules from a built-in template',
  'pages.monitor.rule.template.import': 'Import',
  'pages.monitor.rule.template.listFailed': 'Failed to load the template packs',
  'pages.monitor.rule.template.detailFailed':
    'Failed to load this template pack. Pick another one or try again later',
  'pages.monitor.rule.template.empty': 'No built-in templates',
  'pages.monitor.rule.template.noRules': 'This pack has no rules',
  'pages.monitor.rule.template.ruleCount': '{count} rules',
  'pages.monitor.rule.template.column.for': 'For',
  'pages.monitor.rule.template.source': 'Template pack: {name} ({count} rules)',
  'pages.monitor.rule.template.category.host': 'Host',
  'pages.monitor.rule.template.category.middleware': 'Middleware',
  'pages.monitor.rule.template.category.database': 'Database',
  'pages.monitor.rule.template.category.platform': 'Platform self-monitoring',
  'pages.monitor.rule.template.category.other': 'Other',
  'pages.monitor.rule.simulate.title': 'Simulate',
  'pages.monitor.rule.simulate.close': 'Close',
  'pages.monitor.rule.simulate.run': 'Run simulation',
  'pages.monitor.rule.simulate.runAndSend': 'Run and send a test notification',
  'pages.monitor.rule.simulate.failed': 'Simulation failed',
  'pages.monitor.rule.simulate.noDatasource':
    'No usable datasource within the scope of this rule; cannot simulate',
  'pages.monitor.rule.simulate.datasource.hint.all':
    'The rule applies to all datasources: pick any enabled one to run the queries on',
  'pages.monitor.rule.simulate.datasource.hint.listed':
    'Only the datasources selected in the rule can be used',
  'pages.monitor.rule.simulate.sampleLabels': 'Sample labels',
  'pages.monitor.rule.simulate.sampleLabels.rule':
    'Label names must start with a letter or underscore, contain only letters, digits and underscores, be unique (128 characters max); values 256 characters max',
  'pages.monitor.rule.simulate.sampleValue': 'Sample value',
  'pages.monitor.rule.simulate.sample.hint':
    "Used to synthesise an event when the queries return nothing; the rule's labels are merged in",
  'pages.monitor.rule.simulate.dryRun': 'Dry run',
  'pages.monitor.rule.simulate.dryRun.on':
    'Only reports the result of each stage; nothing is sent',
  'pages.monitor.rule.simulate.dryRun.off':
    'This run sends a real notification marked [TEST]; dry run is switched back on afterwards',
  'pages.monitor.rule.simulate.send.confirm.title':
    'Turn off dry run and send a real test notification?',
  'pages.monitor.rule.simulate.send.confirm.content':
    'The simulation will send a real notification titled [TEST] to the resolved recipients, and they will actually receive it. Subscribers are not notified, and no escalation or event action is triggered.',
  'pages.monitor.rule.simulate.send.confirm.ok': 'Send for real',
  'pages.monitor.rule.simulate.noRoute':
    'No notification route matches the alert events of this rule',
  'pages.monitor.rule.simulate.noRoute.description':
    'Even if the rule fires, the notification will not be delivered. Configure a route for monitor alert events under Notifications → Routes.',
  'pages.monitor.rule.simulate.notInEffect':
    'The rule is outside its effective time right now: the engine would not evaluate it, but the stages below are still simulated',
  'pages.monitor.rule.simulate.synthetic':
    'The queries returned nothing; the event below was synthesised from the sample labels and value',
  'pages.monitor.rule.simulate.sent':
    'The test notification has been handed to the notification pipeline',
  'pages.monitor.rule.simulate.notSent':
    'No test notification was sent; see the "Send test notification" stage for the reason',
  'pages.monitor.rule.simulate.stages': 'Stages',
  'pages.monitor.rule.simulate.stage.query': 'Query',
  'pages.monitor.rule.simulate.stage.effective': 'Effective time',
  'pages.monitor.rule.simulate.stage.relabel': 'Relabeling',
  'pages.monitor.rule.simulate.stage.ci': 'Resource match & enrichment',
  'pages.monitor.rule.simulate.stage.drop': 'Conditional drop',
  'pages.monitor.rule.simulate.stage.scope': 'Resource scope',
  'pages.monitor.rule.simulate.stage.level_inhibit': 'Severity inhibition',
  'pages.monitor.rule.simulate.stage.inhibit': 'Rule & topology inhibition',
  'pages.monitor.rule.simulate.stage.mute': 'Mute',
  'pages.monitor.rule.simulate.stage.notify': 'Recipients & subscriptions',
  'pages.monitor.rule.simulate.stage.send': 'Send test notification',
  'pages.monitor.rule.simulate.status.pass': 'Pass',
  'pages.monitor.rule.simulate.status.warn': 'Warning',
  'pages.monitor.rule.simulate.status.block': 'Blocked',
  'pages.monitor.rule.simulate.status.error': 'Error',
  'pages.monitor.rule.simulate.status.skip': 'Skipped',
  'pages.monitor.rule.simulate.queries': 'Query results',
  'pages.monitor.rule.simulate.query.index': 'Query',
  'pages.monitor.rule.simulate.query.series': 'Series',
  'pages.monitor.rule.simulate.query.truncated': 'Truncated',
  'pages.monitor.rule.simulate.query.duration': 'Duration',
  'pages.monitor.rule.simulate.query.error': 'Error',
  'pages.monitor.rule.simulate.events': 'Events (showing {shown} of {total})',
  'pages.monitor.rule.simulate.event.outcome': 'Outcome',
  'pages.monitor.rule.simulate.event.ci': 'Resource',
  'pages.monitor.rule.simulate.event.fingerprint': 'Fingerprint',
  'pages.monitor.rule.simulate.event.labels': 'Final labels',
  'pages.monitor.rule.simulate.event.sourceLabels':
    'Labels before relabeling (series labels + rule labels)',
  'pages.monitor.rule.simulate.event.legend':
    'Green = added by relabeling / enrichment, orange = value rewritten, strikethrough = removed',
  'pages.monitor.rule.simulate.event.added': 'Added by relabeling / enrichment',
  'pages.monitor.rule.simulate.event.changed': 'Value rewritten, was: {from}',
  'pages.monitor.rule.simulate.event.removed': 'Removed by relabeling',
  'pages.monitor.rule.simulate.outcome.notify': 'Will notify',
  'pages.monitor.rule.simulate.outcome.dropped': 'Dropped',
  'pages.monitor.rule.simulate.outcome.out_of_scope': 'Out of scope',
  'pages.monitor.rule.simulate.outcome.level_inhibited':
    'Inhibited by a higher severity',
  'pages.monitor.rule.simulate.outcome.inhibited': 'Inhibited',
  'pages.monitor.rule.simulate.outcome.muted_event': 'Muted (no event)',
  'pages.monitor.rule.simulate.outcome.muted_notify':
    'Muted (notification only)',
  'pages.monitor.rule.simulate.outcome.maintenance':
    'Resource in maintenance (notification only)',
  'pages.monitor.rule.simulate.ciStatus.matched': 'Matched',
  'pages.monitor.rule.simulate.ciStatus.disabled': 'Matching disabled',
  'pages.monitor.rule.simulate.ciStatus.no_label': 'No label to match on',
  'pages.monitor.rule.simulate.ciStatus.not_found': 'No resource found',
  'pages.monitor.rule.simulate.ciStatus.ambiguous':
    'Ambiguous (several resources)',
  'pages.monitor.rule.simulate.ciStatus.unavailable':
    'Resource index not ready',
  'pages.monitor.rule.simulate.recipients': 'Recipients',
  'pages.monitor.rule.simulate.recipients.empty':
    'The event carries no recipients; notification routes and subscriptions decide who is notified',
  'pages.monitor.rule.simulate.subscriptions': 'Matched subscriptions',
  'pages.monitor.rule.simulate.subscriptions.empty': 'No subscription matches',
  'pages.monitor.rule.simulate.subscriptions.noRecipients':
    'No additional recipients',
  'pages.monitor.rule.simulate.escalation': 'Escalation levels',
  'pages.monitor.rule.simulate.escalation.empty':
    'The rule does not use an escalation policy',
  'pages.monitor.rule.simulate.escalation.level':
    'Level {level} · after {minutes} min',
  'pages.monitor.rule.simulate.escalation.noRecipients':
    'No recipients resolved right now',
};
