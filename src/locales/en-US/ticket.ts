/** Ticket pages (submit ticket / ticket list / all tickets / ticket templates) plus menu, permission and enum entries */
export default {
  'menu.ticket': 'Tickets',
  'menu.ticket.create': 'Submit Ticket',
  'menu.ticket.create-form': 'New Ticket',
  'menu.ticket.detail': 'Ticket Details',
  'pages.ticket.create.loadFailed':
    'Failed to load the template. It may be disabled or no longer exist.',
  'pages.ticket.detail.loadFailed':
    'Failed to load the ticket. It may not exist or you may not have access.',
  'menu.ticket.mine': 'Ticket List',
  'menu.ticket.all': 'All Tickets',
  'menu.ticket.catalog': 'Ticket Templates',
  'permission.ticket.mine.create': 'Submit ticket',
  'permission.ticket.catalog.category': 'Manage categories',
  'permission.ticket.catalog.template': 'Manage templates',
  'enum.ticket.status.1': 'In progress',
  'enum.ticket.status.2': 'Completed',
  'enum.ticket.status.3': 'Rejected',
  'enum.ticket.status.4': 'Withdrawn',
  'enum.ticket.status.5': 'Terminated',
  'enum.ticket.priority.1': 'Low',
  'enum.ticket.priority.2': 'Normal',
  'enum.ticket.priority.3': 'High',
  'enum.ticket.priority.4': 'Urgent',
  'enum.ticket.fieldType.string': 'Text',
  'enum.ticket.fieldType.text': 'Long text',
  'enum.ticket.fieldType.int': 'Integer',
  'enum.ticket.fieldType.float': 'Decimal',
  'enum.ticket.fieldType.bool': 'Yes / No',
  'enum.ticket.fieldType.enum': 'Dropdown',
  'enum.ticket.fieldType.datetime': 'Date & time',
  'enum.ticket.fieldType.user': 'User',
  'enum.ticket.fieldType.dept': 'Department',

  // Ticket lists and detail
  'pages.ticket.view.todo': 'To Do',
  'pages.ticket.view.done': 'Done',
  'pages.ticket.view.cc': "CC'd to Me",
  'pages.ticket.view.mine': 'Submitted',
  'pages.ticket.search.placeholder': 'Title / ticket number',
  'pages.ticket.search.title': 'Title',
  'pages.ticket.column.number': 'Number',
  'pages.ticket.column.title': 'Title',
  'pages.ticket.column.template': 'Service',
  'pages.ticket.column.priority': 'Priority',
  'pages.ticket.column.status': 'Status',
  'pages.ticket.column.node': 'Current step',
  'pages.ticket.column.creator': 'Requester',
  'pages.ticket.column.myStatus': 'My action',
  'pages.ticket.column.createTime': 'Submitted at',
  'pages.ticket.column.arriveTime': 'Arrived at',
  'pages.ticket.column.actionTime': 'Handled at',
  'pages.ticket.column.endTime': 'Closed at',
  'pages.ticket.column.description': 'Description',
  'pages.ticket.column.sort': 'Sort',
  'pages.ticket.form.sort.tooltip': 'Smaller values come first',
  'pages.ticket.action.handle': 'Handle',
  'pages.ticket.bool.true': 'Yes',
  'pages.ticket.bool.false': 'No',
  'pages.ticket.detail.form': 'Form',

  // Submit a ticket
  'pages.ticket.create.title': 'Submit Ticket',
  'pages.ticket.create.titleOf': 'Submit Ticket: {name}',
  'pages.ticket.create.empty':
    'No services available yet. Ask an administrator to set up ticket templates.',
  'pages.ticket.create.noDesc': 'No description',
  'pages.ticket.create.submit': 'Submit',
  'pages.ticket.create.success': 'Ticket {number} submitted',
  'pages.ticket.create.discard.title': 'Discard this ticket?',
  'pages.ticket.create.discard.description':
    'What you have filled in and the uploaded attachments will not be saved.',
  'pages.ticket.create.discard.ok': 'Discard',
  'pages.ticket.attachment.label': 'Attachments',
  'pages.ticket.attachment.upload': 'Upload',
  'pages.ticket.attachment.hint': 'Up to 20 files, 5 MB each',
  'pages.ticket.attachment.tooLarge':
    '"{name}" is larger than 5 MB and cannot be uploaded',
  'pages.ticket.attachment.tooMany':
    'At most {max} attachments; extra files were not uploaded',

  // Comments
  'pages.ticket.comment.placeholder': 'Add details or an update…',
  'pages.ticket.comment.heading': 'Comments',
  'pages.ticket.comment.empty': 'No comments yet',
  'pages.ticket.comment.reply': 'Reply',
  'pages.ticket.comment.reply.placeholder': 'Reply to {name}…',
  'pages.ticket.comment.post': 'Post',
  'pages.ticket.comment.posted': 'Comment posted',
  'pages.ticket.comment.rateLimited':
    'You are commenting too fast. Try again in a minute (30 comments per minute at most).',

  // Service catalog: categories
  'pages.ticket.category.title': 'Categories',
  'pages.ticket.category.create': 'New Category',
  'pages.ticket.category.edit': 'Edit Category',
  'pages.ticket.category.name': 'Category name',
  'pages.ticket.category.templates': 'Templates',
  'pages.ticket.category.delete.title': 'Delete category',
  'pages.ticket.category.delete.description':
    'Delete category "{name}"? A category that still has templates cannot be deleted.',

  // Service catalog: templates
  'pages.ticket.template.create': 'New Template',
  'pages.ticket.template.edit': 'Edit Template',
  'pages.ticket.template.search.placeholder': 'Template name',
  'pages.ticket.template.name': 'Template name',
  'pages.ticket.template.category': 'Category',
  'pages.ticket.template.workflow': 'Workflow',
  'pages.ticket.template.workflow.tooltip':
    'Tickets follow this workflow. Only published, enabled workflows are listed.',
  'pages.ticket.template.prefix': 'Number prefix',
  'pages.ticket.template.prefix.tooltip':
    'Ticket numbers look like PREFIX-date-sequence, e.g. REQ-20260101-0001',
  'pages.ticket.template.prefix.pattern': '2-8 uppercase letters',
  'pages.ticket.template.status.tooltip':
    'A disabled template cannot be used for new tickets; existing tickets are unaffected',
  'pages.ticket.template.description.tooltip':
    'Shown in the service list to help requesters pick the right service',
  'pages.ticket.template.form': 'Form fields',
  'pages.ticket.template.form.tooltip':
    'What requesters fill in. Changes only affect tickets submitted afterwards.',
  'pages.ticket.template.copy': 'Copy Template',
  'pages.ticket.template.copy.name': '{name} (copy)',
  'pages.ticket.template.icon': 'Icon',
  'pages.ticket.template.icon.tooltip':
    'Shown on the template card of the Submit Ticket page',
  'pages.ticket.submit.search.placeholder': 'Search templates',
  'pages.ticket.submit.noMatch': 'No matching templates',
  'pages.ticket.template.delete.title': 'Delete template',
  'pages.ticket.template.delete.description':
    'Delete template "{name}"? Tickets already submitted are unaffected.',

  // Template form fields
  'pages.ticket.field.add': 'Add Field',
  'pages.ticket.field.edit': 'Edit Field',
  'pages.ticket.field.empty':
    'No fields yet. Requesters only fill in the title and priority.',
  'pages.ticket.field.name': 'Field name',
  'pages.ticket.field.code': 'Field code',
  'pages.ticket.field.code.tooltip':
    'Workflow conditions refer to this value as form.<code>',
  'pages.ticket.field.code.pattern':
    'Start with a letter; 1-32 letters, digits or underscores',
  'pages.ticket.field.code.reserved':
    '"priority" is reserved for the ticket priority',
  'pages.ticket.field.code.duplicate': 'This code is already used',
  'pages.ticket.field.type': 'Type',
  'pages.ticket.field.required': 'Required',
  'pages.ticket.field.enumValues': 'Options',
  'pages.ticket.field.enumValues.placeholder': 'Type and press Enter to add',
  'pages.ticket.field.enumValues.invalid':
    'Each option must be 1-{max} characters',
  'pages.ticket.field.min': 'Minimum',
  'pages.ticket.field.max': 'Maximum',
  'pages.ticket.field.max.invalid': 'Maximum must not be less than minimum',
  'pages.ticket.field.maxLen': 'Max length',
  'pages.ticket.field.pattern': 'Pattern (regex)',
  'pages.ticket.field.pattern.tooltip':
    'Input must match this regular expression; leave empty for no check',
  'pages.ticket.field.description': 'Help text',
  'pages.ticket.field.moveUp': 'Move up',
  'pages.ticket.field.moveDown': 'Move down',
  'pages.ticket.field.delete.title': 'Delete field',
  'pages.ticket.field.delete.description': 'Delete field "{name}"?',

  // SLA, linked resources, form editing, rating and statistics
  'menu.ticket.stats': 'Ticket Stats',
  'pages.ticket.column.sla': 'SLA',
  'pages.ticket.filter.overdue': 'Overdue only',
  'pages.ticket.span.dh': '{d}d {h}h',
  'pages.ticket.span.hm': '{h}h {m}m',
  'pages.ticket.span.m': '{m}m',
  'pages.ticket.sla.title': 'SLA',
  'pages.ticket.sla.response': 'Response time',
  'pages.ticket.sla.resolve': 'Resolution time',
  'pages.ticket.sla.unit': 'Unit',
  'pages.ticket.sla.unit.minute': 'min',
  'pages.ticket.sla.unit.hour': 'hours',
  'pages.ticket.sla.unit.day': 'days',
  'pages.ticket.sla.unset': 'None',
  'pages.ticket.sla.workTime': 'Work time',
  'pages.ticket.sla.hint':
    "Only checked priorities have targets. Response = handler's first action; resolution = ticket closed. Work time follows the workflow calendar.",
  'pages.ticket.sla.incomplete':
    'Each checked priority needs a response or a resolution time',
  'pages.ticket.sla.inverted':
    'A resolution time is shorter than its response time — please double-check',
  'pages.ticket.sla.escalate': 'Escalation recipients',
  'pages.ticket.sla.escalate.tooltip':
    'Notified together with the current handlers when a ticket misses its response or resolution time',
  'pages.ticket.sla.escalate.placeholder':
    'Pick extra people to notify (optional)',
  'pages.ticket.sla.none': 'Not set',
  'pages.ticket.sla.state.met': 'Met',
  'pages.ticket.sla.state.ok': 'On track',
  'pages.ticket.sla.state.breached': 'Overdue',
  'pages.ticket.sla.state.running': '{left} left',
  'pages.ticket.ciLink.title': 'Linked resources',
  'pages.ticket.ciLink.label': 'Link CMDB resources on submit',
  'pages.ticket.ciLink.tooltip':
    'Requesters can only link resources they may view. When required, users without resource access cannot submit this service.',
  'pages.ticket.ciLink.0': 'None',
  'pages.ticket.ciLink.1': 'Optional',
  'pages.ticket.ciLink.2': 'Required',
  'pages.ticket.resource.label': 'Linked resources',
  'pages.ticket.resource.placeholder': 'Search resources by name',
  'pages.ticket.create.ci.blocked':
    'This service requires linking a CMDB resource, but you have no access to resources, so it cannot be submitted. Ask an administrator for access.',
  'pages.ticket.form.edit': 'Edit form',
  'pages.ticket.form.missing': 'Fill in before approving: {fields}',
  'pages.ticket.rating.label': 'Satisfaction',
  'pages.ticket.rating.prompt':
    'This ticket is closed — please rate the service',
  'pages.ticket.rating.placeholder':
    'What went well or could be better (optional)',
  'pages.ticket.rating.submit': 'Submit rating',
  'pages.ticket.rating.done': 'Thanks for your rating',
  'pages.ticket.rating.todo': 'Rate',
  'pages.ticket.stats.days': 'Last (days)',
  'pages.ticket.stats.total': 'Tickets',
  'pages.ticket.stats.processing': 'In progress',
  'pages.ticket.stats.avgResolve': 'Avg. resolution',
  'pages.ticket.stats.responseSla': 'Response SLA met',
  'pages.ticket.stats.resolveSla': 'Resolution SLA met',
  'pages.ticket.stats.rating': 'Avg. rating ({n} rated)',
  'pages.ticket.stats.trend': 'Daily trend',
  'pages.ticket.stats.created': 'Submitted',
  'pages.ticket.stats.closed': 'Closed',
  'pages.ticket.stats.byStatus': 'By status',
  'pages.ticket.stats.byPriority': 'By priority',
  'pages.ticket.stats.byTemplate': 'Top 10 services',
};
