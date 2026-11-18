export default {
  'enum.monitor.recordStatus.0': 'Not run',
  'enum.monitor.recordStatus.1': 'Written',
  'enum.monitor.recordStatus.2': 'No result',
  'enum.monitor.recordStatus.3': 'Query failed',
  'enum.monitor.recordStatus.4': 'Write failed',
  'pages.monitor.stats.empty': 'No data in the selected range',
  'pages.monitor.stats.total': 'Total',
  'pages.monitor.stats.other': 'Other',
  'pages.monitor.stats.loadFailed': 'Failed to load "{name}"',
  'pages.monitor.stats.range.days': 'Last {n} days',
  'pages.monitor.stats.range.custom': 'Custom',
  'pages.monitor.stats.range.hint':
    'Counted by first firing time; the range is at most {max} days',
  'pages.monitor.stats.group.placeholder': 'All rule groups',
  'pages.monitor.stats.overview': 'Overview',
  'pages.monitor.stats.overview.hint':
    'Current state; not affected by the time range',
  'pages.monitor.stats.overview.firing': 'Firing alerts',
  'pages.monitor.stats.overview.unacked': 'Unacknowledged',
  'pages.monitor.stats.overview.unacked.tooltip':
    'Firing alerts nobody has acknowledged yet, excluding muted and inhibited ones',
  'pages.monitor.stats.overview.muted': 'Muted',
  'pages.monitor.stats.overview.inhibited': 'Inhibited',
  'pages.monitor.stats.overview.todayFired': 'Fired today',
  'pages.monitor.stats.overview.todayResolved': 'Resolved today',
  'pages.monitor.stats.overview.todayClosed': 'Closed today',
  'pages.monitor.stats.overview.todayClosed.tooltip':
    'Closed manually, or because the rule was deleted or disabled',
  'pages.monitor.stats.trend': 'Alert trend',
  'pages.monitor.stats.by.severity': 'By severity',
  'pages.monitor.stats.by.group': 'By group',
  'pages.monitor.stats.top.rule': 'Noisiest rules',
  'pages.monitor.stats.top.ci': 'Resources with the most alerts',
  'pages.monitor.stats.top.total': '{n} alert events in total',
  'pages.monitor.stats.top.gone': 'Deleted',
  'pages.monitor.stats.top.firing': '{n} firing',
  'pages.monitor.stats.efficiency': 'Handling efficiency (MTTA / MTTR)',
  'pages.monitor.stats.efficiency.alerts': 'Alert events',
  'pages.monitor.stats.efficiency.acked': 'Acknowledged',
  'pages.monitor.stats.efficiency.resolved': 'Resolved',
  'pages.monitor.stats.efficiency.mtta': 'Mean time to acknowledge (MTTA)',
  'pages.monitor.stats.efficiency.mttr': 'Mean time to resolve (MTTR)',
  'pages.monitor.stats.noise': 'Noise reduction',
  'pages.monitor.stats.noise.alerts': 'Alerts generated',
  'pages.monitor.stats.noise.notified': 'Notified',
  'pages.monitor.stats.noise.silent': 'Never notified',
  'pages.monitor.stats.noise.muted': 'Muted',
  'pages.monitor.stats.noise.inhibited': 'Inhibited',
  'pages.monitor.stats.noise.hint':
    '"Never notified" = muted, inhibited or without recipients; one alert may be both muted and inhibited',
  'pages.monitor.stats.noise.rate': 'Noise reduction rate',
  'pages.monitor.stats.noise.rate.tooltip':
    'Share of generated alerts that never sent a notification',
  'pages.monitor.stats.noise.notifications': 'Notifications sent',
  'pages.monitor.stats.noise.notifications.tooltip':
    'Notifications actually sent; one notification to several people counts once',
  'pages.monitor.stats.noise.source.rule': 'Rule notifications',
  'pages.monitor.stats.noise.source.subscription': 'Subscription notifications',
  'pages.monitor.stats.noise.source.escalation': 'Escalation notifications',
  'pages.monitor.engine.ms': '{n} ms',
  'pages.monitor.engine.lasting': 'For {duration}',
  'pages.monitor.engine.refresh': 'Refresh',
  'pages.monitor.engine.loadedAt': 'Updated at {time}',
  'pages.monitor.engine.loadFailed': 'Failed to load the engine status',
  'pages.monitor.engine.healthy': 'The evaluation engine is healthy',
  'pages.monitor.engine.healthy.description':
    'There are live evaluator instances and a leader, and tasks are not piling up',
  'pages.monitor.engine.unhealthy': 'The evaluation engine is unhealthy',
  'pages.monitor.engine.unhealthy.description':
    'No live evaluator instance, no leader, or tasks are piling up; alerts may not fire on time',
  'pages.monitor.engine.reason.noInstance': 'No live engine instance',
  'pages.monitor.engine.reason.noLeader':
    'No leader (task planning and datasource probing have stopped)',
  'pages.monitor.engine.reason.overdue': '{n} evaluation tasks overdue',
  'pages.monitor.engine.reason.separator': '; ',
  'pages.monitor.engine.tile.taskTotal': 'Evaluation tasks',
  'pages.monitor.engine.tile.taskTotal.tooltip': 'Rules × datasources',
  'pages.monitor.engine.tile.taskOverdue': 'Overdue tasks',
  'pages.monitor.engine.tile.taskOverdue.tooltip':
    'Tasks not started two evaluation intervals after they were due',
  'pages.monitor.engine.tile.taskError': 'Query errors',
  'pages.monitor.engine.tile.taskError.tooltip':
    'Tasks whose latest evaluation ended in a query error',
  'pages.monitor.engine.tile.maxLag': 'Max evaluation lag',
  'pages.monitor.engine.tile.maxLag.tooltip':
    'How long the oldest due task has been waiting',
  'pages.monitor.engine.tile.recordTask': 'Recording rule tasks',
  'pages.monitor.engine.tile.recordTask.failed': '{n} failed on the latest run',
  'pages.monitor.engine.tile.notifyPending': 'Pending notifications',
  'pages.monitor.engine.tile.notifyPending.tooltip':
    'Alert notifications waiting to be dispatched (outbox backlog)',
  'pages.monitor.engine.tile.ci': 'CMDB resource index',
  'pages.monitor.engine.tile.ci.syncTime': 'Last synced {time}',
  'pages.monitor.engine.tile.ci.never': 'Never synced',
  'pages.monitor.engine.instances': 'Engine instances',
  'pages.monitor.engine.noInstance': 'No live engine instance',
  'pages.monitor.engine.noInstance.description':
    'Rules are not being evaluated and no alert will fire or resolve. Check that the evaluation engine service is running',
  'pages.monitor.engine.instance': 'Instance',
  'pages.monitor.engine.leader': 'Leader',
  'pages.monitor.engine.stale': 'Stale',
  'pages.monitor.engine.roles': 'Roles',
  'pages.monitor.engine.role.planner': 'Planner',
  'pages.monitor.engine.role.evaluator': 'Evaluator',
  'pages.monitor.engine.version': 'Version',
  'pages.monitor.engine.startTime': 'Started',
  'pages.monitor.engine.lastSeen': 'Last heartbeat',
  'pages.monitor.engine.taskCount': 'Tasks',
  'pages.monitor.engine.evalLag': 'Evaluation lag',
  'pages.monitor.engine.evalCount': 'Evaluations',
  'pages.monitor.engine.failCount': 'Query errors',
  'pages.monitor.engine.datasources': 'Unhealthy datasources',
  'pages.monitor.engine.datasources.ok': 'All good: no unhealthy datasource',
  'pages.monitor.engine.error': 'Error',
  'pages.monitor.engine.since': 'Since',
  'pages.monitor.engine.ruleCount': 'Affected rules',
  'pages.monitor.engine.rules': 'Rules that keep failing',
  'pages.monitor.engine.rules.ok': 'All good: no rule keeps failing',
  'pages.monitor.engine.rule': 'Rule',
  'pages.monitor.engine.failures': 'Consecutive failures',
  'pages.monitor.record.create.title': 'Create recording rule',
  'pages.monitor.record.edit.title': 'Edit recording rule "{name}"',
  'pages.monitor.record.search.placeholder':
    'Metric name / description / PromQL',
  'pages.monitor.record.form.name': 'Metric name',
  'pages.monitor.record.form.name.tooltip':
    'The rule name is the metric written back; unique within a group and datasource',
  'pages.monitor.record.form.name.hint':
    'Recommended naming: level:metric:operations',
  'pages.monitor.record.form.name.rule':
    'Must start with a letter, underscore or colon and contain only letters, digits, underscores and colons',
  'pages.monitor.record.form.datasource.tooltip':
    'Queried on and written back to this datasource; it must have a Remote Write URL.',
  'pages.monitor.record.noWritable.title':
    'No datasource can be used for recording rules',
  'pages.monitor.record.noWritable.description':
    'Recording rules write metrics back through a datasource Remote Write URL. Set one on a datasource first.',
  'pages.monitor.record.noWritable.link': 'Go to datasources',
  'pages.monitor.record.section.query': 'Query and write-back',
  'pages.monitor.record.form.expr.placeholder':
    'e.g. sum by (job) (rate(http_requests_total[5m]))',
  'pages.monitor.record.form.expr.rule':
    'The expression is at most {max} bytes',
  'pages.monitor.record.validate': 'Validate',
  'pages.monitor.record.validate.ok': 'Validation passed; ready to save',
  'pages.monitor.record.validate.issues': 'Validation found problems',
  'pages.monitor.record.preview': 'Data preview',
  'pages.monitor.record.preview.tooltip':
    'Runs the current expression on the selected datasource to show the series that would be written back',
  'pages.monitor.record.form.interval': 'Interval',
  'pages.monitor.record.form.interval.tooltip':
    'How often the rule is computed and written back: 15-3600 s, 60 s recommended',
  'pages.monitor.record.form.labels': 'Extra labels',
  'pages.monitor.record.form.labels.tooltip':
    'Merged into the labels of the result series on write-back (extra labels win on conflict)',
  'pages.monitor.record.form.labels.rule':
    'Up to 20. Names start with a letter or underscore, contain only letters, digits and underscores, do not start with __ and are unique; values are 1-256 characters',
  'pages.monitor.record.form.labels.add': 'Add label',
  'pages.monitor.record.notWritable': 'Datasource not writable',
  'pages.monitor.record.notWritable.tooltip':
    'The datasource is missing, disabled or has no Remote Write URL; the rule will not run',
  'pages.monitor.record.column.lastStatus': 'Last run',
  'pages.monitor.record.column.lastEval': 'Last run time',
  'pages.monitor.record.column.lastEval.detail':
    '{ms} ms · {series} series written',
  'pages.monitor.record.disable.title': 'Disable recording rule "{name}"?',
  'pages.monitor.record.disable.description':
    'The metric will no longer be computed and written back, so alert rules that use it will see no new data. Data already written is kept.',
  'pages.monitor.record.delete.title': 'Delete recording rule "{name}"?',
  'pages.monitor.record.delete.description':
    'The metric will no longer be produced. Metric data already written is kept and not affected.',
};
