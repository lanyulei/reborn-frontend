/** Workflow pages (my workflows / design / monitor) plus menu, permission and enum entries */
export default {
  'menu.workflow': 'Workflow',
  'menu.workflow.definition': 'Workflow Design',
  'menu.workflow.definition-design': 'Workflow Designer',
  'menu.workflow.instance-detail': 'Workflow Details',
  'menu.workflow.instance': 'Workflow Monitor',
  'permission.workflow.definition.create': 'Create Workflow',
  'permission.workflow.definition.edit': 'Edit Workflow',
  'permission.workflow.definition.publish': 'Publish Workflow',
  'permission.workflow.definition.delete': 'Delete Workflow',
  'permission.workflow.instance.terminate': 'Terminate Workflow',
  'permission.workflow.instance.reassign': 'Reassign Task',
  'enum.workflow.instance.1': 'In Progress',
  'enum.workflow.instance.2': 'Approved',
  'enum.workflow.instance.3': 'Rejected',
  'enum.workflow.instance.4': 'Withdrawn',
  'enum.workflow.instance.5': 'Terminated',
  'enum.workflow.assignee.1': 'Pending',
  'enum.workflow.assignee.2': 'Queued',
  'enum.workflow.assignee.3': 'Approved',
  'enum.workflow.assignee.4': 'Rejected',
  'enum.workflow.assignee.5': 'Cancelled',
  'enum.workflow.assignee.6': 'Transferred',
  'enum.workflow.assignee.7': 'Returned',
  'enum.workflow.assignee.8': 'Notified',

  // Workflow definitions
  'pages.workflow.definition.create.title': 'Create Workflow',
  'pages.workflow.definition.edit.title': 'Edit Workflow: {name}',
  'pages.workflow.definition.search.placeholder': 'Workflow name / key',
  'pages.workflow.definition.column.name': 'Name',
  'pages.workflow.definition.column.key': 'Key',
  'pages.workflow.definition.column.category': 'Category',
  'pages.workflow.definition.column.version': 'Published Version',
  'pages.workflow.definition.published': 'Published',
  'pages.workflow.definition.unpublished': 'Unpublished',
  'pages.workflow.definition.action.design': 'Design',
  'pages.workflow.definition.delete.title': 'Delete Workflow',
  'pages.workflow.definition.delete.description':
    'Delete workflow "{name}"? A workflow with running instances cannot be deleted.',
  'pages.workflow.definition.form.key.tooltip':
    'Business systems start the workflow by this key; it cannot be changed after creation',
  'pages.workflow.definition.form.key.placeholder':
    '2-64 lowercase letters, digits, underscores or hyphens, starting with a letter',
  'pages.workflow.definition.form.key.pattern':
    '2-64 lowercase letters, digits, underscores or hyphens, starting with a letter',
  'pages.workflow.definition.form.description': 'Description',
  'pages.workflow.definition.form.status.tooltip':
    'A disabled workflow cannot be started; running instances are not affected',

  // Designer page
  'pages.workflow.design.save': 'Save Draft',
  'pages.workflow.design.publish': 'Publish',
  'pages.workflow.design.version': 'Current version v{version}',
  'pages.workflow.design.settings': 'Flow Settings',
  'pages.workflow.design.settings.admins': 'Workflow Admins',
  'pages.workflow.design.settings.admins.extra':
    'When a step has no assignee and is set to "Hand to Workflow Admin", these members handle it; with no admins configured the step is skipped.',
  'pages.workflow.design.unsaved': 'Unsaved changes',
  'pages.workflow.design.issues':
    '{n} issue(s) must be resolved before publishing',
  'pages.workflow.design.saved.issues': 'Draft saved; {n} issue(s) remain',
  'pages.workflow.design.publish.blocked':
    'The workflow still has issues and cannot be published',
  'pages.workflow.design.publish.title': 'Publish Workflow',
  'pages.workflow.design.publish.content':
    'New instances will follow this version; running instances are not affected. Publish?',
  'pages.workflow.design.published': 'Published as v{version}',
  'pages.workflow.design.leave.title': 'Discard Unsaved Changes',
  'pages.workflow.design.leave.content':
    'You have unsaved changes that will be lost. Leave anyway?',
  'pages.workflow.design.unsupported.title':
    'This workflow cannot be edited visually',
  'pages.workflow.design.unsupported.desc':
    'This workflow was written through the API rather than the designer. It is shown read-only below; maintain it through the API.',

  // My workflows / monitor
  'pages.workflow.search.placeholder': 'Title',
  'pages.workflow.column.title': 'Title',
  'pages.workflow.column.definition': 'Workflow',
  'pages.workflow.column.businessType': 'Business',
  'pages.workflow.businessType.ticket': 'Ticket',
  'pages.workflow.businessType.none': 'Standalone',
  'pages.workflow.column.node': 'Current Step',
  'pages.workflow.column.initiator': 'Initiator',
  'pages.workflow.column.startTime': 'Started At',
  'pages.workflow.column.endTime': 'Ended At',
  'pages.workflow.action.approve': 'Approve',
  'pages.workflow.action.reject': 'Reject',
  'pages.workflow.action.return': 'Return',
  'pages.workflow.action.transfer': 'Transfer',
  'pages.workflow.action.cancel': 'Withdraw',
  'pages.workflow.action.terminate': 'Terminate',
  'pages.workflow.action.reassign': 'Reassign',
  'pages.workflow.msg.approved': 'Approved',
  'pages.workflow.msg.rejected': 'Rejected',
  'pages.workflow.msg.returned': 'Returned',
  'pages.workflow.msg.transferred': 'Transferred',
  'pages.workflow.msg.cancelled': 'Withdrawn',
  'pages.workflow.msg.terminated': 'Workflow terminated',
  'pages.workflow.msg.reassigned': 'Reassigned',
  'pages.workflow.form.comment': 'Comment',
  'pages.workflow.form.reason': 'Reason',
  'pages.workflow.form.returnTo': 'Return To',
  'pages.workflow.form.transferTo': 'Transfer To',
  'pages.workflow.form.reassignTo': 'New Assignees',
  'pages.workflow.form.user.placeholder': 'Search and select users',
  // 模拟运行里的表单数据输入
  'pages.workflow.start.variables': 'Form data',
  'pages.workflow.start.variables.invalid': 'Must be a valid JSON object',
  'pages.workflow.detail.title': 'Workflow Details',
  'pages.workflow.detail.current': 'Currently With',
  'pages.workflow.detail.flow': 'Progress',
  'pages.workflow.detail.flowChart': 'View flowchart',
  'pages.workflow.detail.history': 'History',
  'pages.workflow.history.system': 'System',
  'pages.workflow.history.start': '{who} started the workflow',
  'pages.workflow.history.approve': '{who} approved "{node}"',
  'pages.workflow.history.reject': '{who} rejected "{node}"',
  'pages.workflow.history.return': '{who} returned "{node}" to "{to}"',
  'pages.workflow.history.transfer': '{who} transferred "{node}"',
  'pages.workflow.history.reassign': '{who} reassigned "{node}"',
  'pages.workflow.history.skip':
    '"{node}" had no available assignee and was skipped',
  'pages.workflow.history.cc': 'Copied to "{node}"',
  'pages.workflow.history.cancel': '{who} withdrew the workflow',
  'pages.workflow.history.terminate': '{who} terminated the workflow',
  'pages.workflow.history.complete': 'Workflow finished',
  'pages.workflow.compare.title': 'Compare Versions',
  'pages.workflow.compare.draft': 'Current draft',
  'pages.workflow.compare.before': 'Old',
  'pages.workflow.compare.after': 'New',
  'pages.workflow.compare.legend': 'Compared with the old version:',
  'pages.workflow.compare.added': '{n} added',
  'pages.workflow.compare.removed': '{n} removed',
  'pages.workflow.compare.modified': '{n} modified',
  'pages.workflow.compare.same':
    'Nodes and branches are identical in both versions',
  'pages.workflow.compare.raw':
    'One side was not created with the designer, so it can only be viewed side by side without per-item marks',
  'pages.workflow.compare.empty':
    'Nothing to compare yet. Publish a version first.',
  'menu.workflow.config': 'Workflow Settings',
  'permission.workflow.instance.wait': 'Handle waiting nodes',
  'permission.workflow.instance.handover': 'Hand over tasks',
  'permission.workflow.config.calendar': 'Edit working calendar',
  'permission.workflow.config.webhook': 'Manage webhook endpoints',
  'permission.workflow.config.client': 'Manage access credentials',
  'enum.workflow.assignee.9': 'Waiting for others',
  'pages.workflow.action.addSign': 'Add signers',
  'pages.workflow.action.delegate': 'Delegate',
  'pages.workflow.action.reply.agree': 'Reply: agree',
  'pages.workflow.action.reply.disagree': 'Reply: disagree',
  'pages.workflow.action.retry': 'Retry',
  'pages.workflow.action.skip': 'Skip',
  'pages.workflow.action.signal': 'Send signal',
  'pages.workflow.msg.addSigned': 'Signers added',
  'pages.workflow.msg.delegated': 'Delegated',
  'pages.workflow.msg.replied': 'Replied',
  'pages.workflow.msg.retried': 'Queued for another attempt',
  'pages.workflow.msg.skipped': 'Skipped',
  'pages.workflow.msg.signaled': 'Signal sent',
  'pages.workflow.form.delegateTo': 'Delegate to',
  'pages.workflow.form.delegate.extra':
    'After they reply (agree / disagree), the task comes back to you for the decision.',
  'pages.workflow.form.addSignTo': 'Add signers',
  'pages.workflow.form.addSign.position': 'How',
  'pages.workflow.form.addSign.before':
    'Before me: once they all approve, the task comes back to me',
  'pages.workflow.form.addSign.after':
    'After me: I approve now; it takes effect once they all approve',
  'pages.workflow.form.skip.hint':
    'After skipping "{node}" the flow continues past it; whatever that node was meant to do will not happen.',
  'pages.workflow.form.signal': 'Signal',
  'pages.workflow.form.signal.extra':
    'Only a flow currently waiting for this signal continues; you are told if nothing is waiting.',
  'pages.workflow.seat.origin.before': 'added',
  'pages.workflow.seat.origin.after': 'added',
  'pages.workflow.seat.origin.delegate': 'delegate',
  'pages.workflow.seat.onBehalf': 'for {name}',
  'pages.workflow.detail.due': 'Due {time}',
  'pages.workflow.detail.overdue': 'Overdue (due {time})',
  'pages.workflow.detail.waits': 'Waiting',
  'pages.workflow.detail.children': 'Sub-processes',
  'pages.workflow.detail.back': '← Back',
  'pages.workflow.detail.child.hint': 'This is a sub-process. ',
  'pages.workflow.detail.child.parent': 'View the parent workflow',
  'pages.workflow.wait.timer': 'Timer',
  'pages.workflow.wait.service': 'Automatic task',
  'pages.workflow.wait.dead': 'Needs attention',
  'pages.workflow.wait.timer.until': 'Until {time}',
  'pages.workflow.wait.service.pending': 'Queued',
  'pages.workflow.wait.service.retrying': '{n} attempts so far; next at {time}',
  'pages.workflow.wait.service.dead':
    'Failed after {n} attempts; retry or skip',
  'pages.workflow.wait.lastError': 'Last failure: {error}',
  'pages.workflow.wait.signal': 'Waiting for signal',
  'pages.workflow.wait.signal.name': 'Waiting for signal "{name}"',
  'pages.workflow.wait.system.dead': 'A system job failed; retry it',
  'pages.workflow.history.addSign.before':
    '{who} added {users} to sign before them at "{node}"',
  'pages.workflow.history.addSign.after':
    '{who} approved "{node}" and added {users} to sign after them',
  'pages.workflow.history.delegate': '{who} delegated "{node}" to {to}',
  'pages.workflow.history.reply.agree': '{who} replied on "{node}": agree',
  'pages.workflow.history.reply.disagree':
    '{who} replied on "{node}": disagree',
  'pages.workflow.history.handover':
    '{who} handed {from}\'s task at "{node}" over to {to}',
  'pages.workflow.history.amend': '{who} changed form fields: {fields}',
  'pages.workflow.history.conditionError':
    'Some branch conditions failed to evaluate and were treated as not met',
  'pages.workflow.history.timeout.remind':
    '"{node}" is overdue; the assignees were reminded',
  'pages.workflow.history.timeout.blocked':
    '"{node}" timed out, but required fields of this step are still empty; not auto-approved, assignees reminded',
  'pages.workflow.history.timeout.approve':
    '"{node}" timed out and was approved automatically',
  'pages.workflow.history.timeout.reject':
    '"{node}" timed out and was rejected automatically',
  'pages.workflow.history.timeout.admin':
    '"{node}" timed out and was handed over to the workflow admins',
  'pages.workflow.history.timer': '"{node}" finished waiting',
  'pages.workflow.history.timer.signal': '"{node}" received signal {signal}',
  'pages.workflow.history.timer.skipped': '"{node}" had nothing to wait for',
  'pages.workflow.history.service': 'Automatic task "{node}" succeeded',
  'pages.workflow.history.serviceFailed':
    'Automatic task "{node}" kept failing and awaits an admin',
  'pages.workflow.history.subProcess.start': '"{node}" started a sub-process',
  'pages.workflow.history.subProcess.done':
    'The sub-process of "{node}" passed',
  'pages.workflow.history.subProcess.failed':
    'The sub-process of "{node}" did not pass',
  'pages.workflow.history.skip.manual': '{who} skipped "{node}"',
  'pages.workflow.simulate.title': 'Simulate',
  'pages.workflow.simulate.desc':
    'Runs the flow on the canvas (no need to save first) without creating anything, sending notifications or calling external systems. Every user task is treated as approved.',
  'pages.workflow.simulate.variables.tooltip':
    'Form data used by branch conditions and form-based assignee rules',
  'pages.workflow.simulate.initiator': 'Initiator',
  'pages.workflow.simulate.initiator.extra':
    "Defaults to you; affects rules such as the initiator's manager",
  'pages.workflow.simulate.run': 'Run',
  'pages.workflow.simulate.failed': 'Cannot simulate',
  'pages.workflow.simulate.completed': 'The flow reaches the end',
  'pages.workflow.simulate.incomplete':
    'The flow did not reach the end (too many steps; stopped)',
  'pages.workflow.simulate.path': 'Path taken',
  'pages.workflow.simulate.steps': 'Assignees by node',
  'pages.workflow.simulate.skipped': 'No assignee; skipped',
  'pages.workflow.simulate.auto':
    'Handled automatically (assumed to pass in the simulation)',
  'pages.workflow.config.tab.calendar': 'Working Calendar',
  'pages.workflow.config.tab.webhook': 'Webhook Endpoints',
  'pages.workflow.config.tab.client': 'Access Credentials',
  'pages.workflow.client.create': 'New Credential',
  'pages.workflow.client.edit': 'Edit Credential',
  'pages.workflow.client.name': 'Name',
  'pages.workflow.client.name.tooltip':
    'Usually the name of the system that connects',
  'pages.workflow.client.token': 'Token',
  'pages.workflow.client.actingUser': 'Acting user',
  'pages.workflow.client.actingUser.tooltip':
    'Workflows started by this system use this user as the initiator',
  'pages.workflow.client.definitions': 'Allowed workflows',
  'pages.workflow.client.definitions.tooltip':
    'Only these workflows can be started, and only its own instances can be queried or changed',
  'pages.workflow.client.status.tooltip':
    'Disabling revokes the token immediately; started workflows are unaffected',
  'pages.workflow.client.description': 'Description',
  'pages.workflow.client.lastUsed': 'Last used',
  'pages.workflow.client.rotate': 'Reset token',
  'pages.workflow.client.rotate.title': 'Reset token',
  'pages.workflow.client.rotate.description':
    'Reset the token of "{name}"? The old token stops working immediately.',
  'pages.workflow.client.delete.title': 'Delete credential',
  'pages.workflow.client.delete.description':
    'Delete credential "{name}"? Its token stops working immediately; started workflows are unaffected.',
  'pages.workflow.client.issued.title': 'Token for "{name}"',
  'pages.workflow.client.issued.warning':
    'This token is shown only once. Copy and store it now; it cannot be viewed again, only reset.',
  'pages.workflow.client.issued.usage':
    'Send it in the request header: Authorization: Bearer <token>',
  'pages.workflow.calendar.timezone': 'Time zone',
  'pages.workflow.calendar.timezone.tooltip':
    'Working hours and holidays are interpreted in this time zone',
  'pages.workflow.calendar.weekdays': 'Working days',
  'pages.workflow.calendar.weekday.0': 'Sun',
  'pages.workflow.calendar.weekday.1': 'Mon',
  'pages.workflow.calendar.weekday.2': 'Tue',
  'pages.workflow.calendar.weekday.3': 'Wed',
  'pages.workflow.calendar.weekday.4': 'Thu',
  'pages.workflow.calendar.weekday.5': 'Fri',
  'pages.workflow.calendar.weekday.6': 'Sat',
  'pages.workflow.calendar.segments': 'Working hours',
  'pages.workflow.calendar.segments.tooltip':
    'In order, without overlap, up to 6; time limits counted in working time only consume these hours. An end time of 23:59 means until 24:00',
  'pages.workflow.calendar.segments.add': 'Add hours',
  'pages.workflow.calendar.segments.required': 'Choose a start and end time',
  'pages.workflow.calendar.segments.order': 'The end must be after the start',
  'pages.workflow.calendar.segments.overlap':
    'Must not start before the previous one ends',
  'pages.workflow.calendar.holidays': 'Holidays',
  'pages.workflow.calendar.holidays.tooltip':
    'Days off even if they fall on a working day',
  'pages.workflow.calendar.workdays': 'Extra working days',
  'pages.workflow.calendar.workdays.tooltip':
    'Working days even if they fall on a weekend',
  'pages.workflow.calendar.days.max': 'At most {max} dates',
  'pages.workflow.webhook.create': 'New Endpoint',
  'pages.workflow.webhook.edit': 'Edit Endpoint',
  'pages.workflow.webhook.name': 'Name',
  'pages.workflow.webhook.url': 'URL',
  'pages.workflow.webhook.url.tooltip':
    'Must be https, without credentials, and must not point to a private network',
  'pages.workflow.webhook.url.pattern': 'Enter a URL starting with https://',
  'pages.workflow.webhook.secret': 'Signing secret',
  'pages.workflow.webhook.secret.tooltip':
    'When set, every call carries a signature (X-Workflow-Signature) so the receiver can verify the sender',
  'pages.workflow.webhook.secret.placeholder': 'Leave empty for no signature',
  'pages.workflow.webhook.secret.keep':
    'Leave empty to keep the current secret',
  'pages.workflow.webhook.secret.clear':
    'Remove the signing secret (calls will no longer be signed)',
  'pages.workflow.webhook.secret.set': 'Set',
  'pages.workflow.webhook.secret.unset': 'Not set',
  'pages.workflow.webhook.status.tooltip':
    'Once disabled, automatic tasks using it fail and wait for an admin',
  'pages.workflow.webhook.description': 'Description',
  'pages.workflow.webhook.delete.title': 'Delete endpoint',
  'pages.workflow.webhook.delete.description':
    'Delete endpoint "{name}"? It cannot be deleted while a published workflow still uses it.',
  'pages.workflow.delegation.title': 'Delegation',
  'pages.workflow.delegation.desc':
    'During the chosen period, tasks newly assigned to you go to your delegate (you can still view them). Tasks already with you are unaffected.',
  'pages.workflow.delegation.create': 'New Delegation',
  'pages.workflow.delegation.delegate': 'Delegate',
  'pages.workflow.delegation.period': 'Period',
  'pages.workflow.delegation.period.extra':
    'Up to one year; must not overlap an existing delegation',
  'pages.workflow.delegation.period.past': 'The end must be in the future',
  'pages.workflow.delegation.reason': 'Note',
  'pages.workflow.delegation.state.active': 'Active',
  'pages.workflow.delegation.state.upcoming': 'Upcoming',
  'pages.workflow.delegation.state.ended': 'Ended',
  'pages.workflow.delegation.delete.title': 'Delete delegation',
  'pages.workflow.delegation.delete.description':
    'New tasks will no longer go to the delegate; tasks already handed over are unaffected.',
  'pages.workflow.handover.title': 'Hand Over Tasks',
  'pages.workflow.handover.desc':
    "Hand all of one person's pending tasks to another, typically on departure or transfer.",
  'pages.workflow.handover.from': 'From',
  'pages.workflow.handover.to': 'To',
  'pages.workflow.handover.same': 'Must be a different person',
  'pages.workflow.handover.submit': 'Hand over',
  'pages.workflow.handover.confirm.title': 'Hand over these tasks?',
  'pages.workflow.handover.confirm.content':
    'All unfinished tasks move to the new person immediately. This cannot be undone in one step.',
  'pages.workflow.handover.done': '{n} tasks handed over',
  'pages.workflow.handover.failed':
    'Handed over {n} tasks; {failed} workflows could not be handed over and stay with the original assignee — check them in the monitor',
  'pages.workflow.design.conflict.title':
    'The draft was changed by someone else',
  'pages.workflow.design.conflict.content':
    'Someone saved this draft while you were editing. Load the latest draft (discarding your unsaved changes), or overwrite their changes with what you are editing.',
  'pages.workflow.design.conflict.reload': 'Load latest (discard mine)',
  'pages.workflow.design.conflict.overwrite': 'Overwrite',
  'pages.workflow.design.tooLarge':
    'The flow is too large to save: reduce the users or field permissions listed on single steps, or move part of it into a sub-process',
  'pages.workflow.design.loadFailed':
    'Failed to load the workflow: you may lack edit permission, or it was deleted',
  'pages.workflow.design.back': 'Back to list',
  'pages.workflow.design.retry': 'Retry',
  'pages.workflow.compare.failed': 'Failed to load this version',
  'pages.workflow.compare.retry': 'Retry',
  'pages.workflow.compare.settings':
    'The workflow admins differ between the two versions',
  'pages.workflow.handover.failedMore':
    'Handed over {n} tasks; {failed} workflows could not be handed over and more may not have been reached yet. Resolve the failed ones in the monitor, then run it again',
  'pages.workflow.handover.partial':
    '{n} tasks handed over; some remain, please run it again',
};
