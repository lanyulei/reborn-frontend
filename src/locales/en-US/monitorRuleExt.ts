export default {
  'pages.monitor.rule.section.ci': 'Linked resource (CMDB)',
  'pages.monitor.rule.section.ci.summary':
    'Association, enrichment tags, resource scope, topology inhibition, notify resource owner',
  'pages.monitor.rule.section.process': 'Event processing',
  'pages.monitor.rule.section.process.summary': 'Relabeling, conditional drop',
  'pages.monitor.rule.section.actions': 'Event actions',
  'pages.monitor.rule.section.actions.summary':
    'Auto ticket, start workflow, AI summary',
  'pages.monitor.rule.fold.configured': 'Configured',
  'pages.monitor.rule.fold.default': 'Default',
  'pages.monitor.rule.options.failed':
    'Failed to load ticket template, workflow and CMDB candidates (possibly no permission). Saved selections are kept; retry later or contact an administrator',
  'pages.monitor.rule.form.simulate': 'Simulate',
  'pages.monitor.rule.form.effectiveMode': 'Effective mode',
  'pages.monitor.rule.form.effectiveMode.windows': 'Time windows',
  'pages.monitor.rule.form.effectiveMode.work_time': 'Working hours only',
  'pages.monitor.rule.form.effectiveMode.off_time': 'Non-working hours only',
  'pages.monitor.rule.form.effectiveMode.calendarHint':
    "Follows the workflow center's working calendar; always in effect until the calendar is configured",
  'pages.monitor.rule.form.escalation': 'Escalation policy',
  'pages.monitor.rule.form.escalation.tooltip':
    'Notifies more people while an alert stays unhandled. Policies: global, or from the rule group and its ancestors.',
  'pages.monitor.rule.form.escalation.placeholder': 'No escalation',
  'pages.monitor.rule.form.escalation.needGroup': 'Select a rule group first',
  'pages.monitor.rule.form.escalation.global': 'Global',
  'pages.monitor.rule.form.escalation.option': '{levels} level(s) · {mode}',
  'pages.monitor.rule.form.escalation.failed':
    'Failed to load escalation policy candidates (possibly no permission). The saved selection is kept; retry later or contact an administrator',
  'pages.monitor.rule.form.escalation.cleared':
    'The selected rule group cannot reference the previous escalation policy; it has been cleared, please choose again',
  'pages.monitor.rule.ci.mode': 'Association',
  'pages.monitor.rule.ci.mode.default': 'Global default',
  'pages.monitor.rule.ci.mode.custom': 'Custom',
  'pages.monitor.rule.ci.mode.off': 'Do not associate',
  'pages.monitor.rule.ci.mode.default.hint':
    'Matches the ident label to the resource name, then instance to its IP; no association if several match',
  'pages.monitor.rule.ci.mode.custom.hint':
    'Looks the resource up by the given event label; no association if several match',
  'pages.monitor.rule.ci.mode.tooltip':
    'The port of a host:port label value is dropped before matching; matching is case-insensitive.',
  'pages.monitor.rule.ci.mode.off.hint':
    'Without association, label enrichment, maintenance muting, topology inhibition and owner notification do not work',
  'pages.monitor.rule.ci.mode.off.scope':
    '"Only for specific resources" is on, so without association this rule produces no events',
  'pages.monitor.rule.ci.label': 'Event label',
  'pages.monitor.rule.ci.label.tooltip':
    'The event label whose value is used to look the resource up',
  'pages.monitor.rule.ci.label.rule':
    'Must start with a letter or underscore and contain only letters, digits and underscores',
  'pages.monitor.rule.ci.by': "Matches the resource's",
  'pages.monitor.rule.ci.by.name': 'Name',
  'pages.monitor.rule.ci.by.attr': 'Attribute',
  'pages.monitor.rule.ci.attr': 'Attribute name',
  'pages.monitor.rule.ci.attr.tooltip':
    'Only attributes registered for matching at deployment can be chosen; empty means ip',
  'pages.monitor.rule.ci.attr.placeholder': 'ip (default)',
  'pages.monitor.rule.ci.models': 'Restrict to models',
  'pages.monitor.rule.ci.models.hint':
    'Only resources of these models are searched, 20 at most; empty means any model',
  'pages.monitor.rule.ci.enrichTags': 'Enrichment tags',
  'pages.monitor.rule.ci.enrichTags.hint':
    'Adds ci_tag_<tag>="true" to the event for each listed tag the resource has (max 10)',
  'pages.monitor.rule.ci.enrichTags.tooltip':
    'Environment, owner and model are always added as ci_env / ci_owner / ci_model; no need to list them here.',
  'pages.monitor.rule.ci.tags.placeholder':
    'Type a resource tag and press Enter',
  'pages.monitor.rule.ci.items.rule':
    'At most {max} items; each must be non-empty and no longer than {bytes} bytes',
  'pages.monitor.rule.ci.scope': 'Only for specific resources',
  'pages.monitor.rule.ci.scope.hint':
    'When on, only events whose resource matches the conditions are kept; the rest are dropped',
  'pages.monitor.rule.ci.scope.models': 'Resource models',
  'pages.monitor.rule.ci.scope.envs': 'Resource environments',
  'pages.monitor.rule.ci.scope.tags': 'Resource tags',
  'pages.monitor.rule.ci.scope.tags.tooltip':
    'The resource needs to carry any one of these tags',
  'pages.monitor.rule.ci.topology': 'Topology inhibition',
  'pages.monitor.rule.ci.topology.hint':
    'No notification while an upstream of the resource (host, uplink switch…) is alerting',
  'pages.monitor.rule.ci.owner': 'Notify resource owner',
  'pages.monitor.rule.ci.owner.hint':
    'Adds the resource owner to the recipients (must be an active user)',
  'pages.monitor.rule.relabel': 'Relabeling',
  'pages.monitor.rule.relabel.tooltip':
    'Actions work as in Prometheus relabel_config; regexes use RE2 syntax and are fully anchored.',
  'pages.monitor.rule.relabel.hint':
    'Up to 10 steps, run in order; ci_ labels do not exist yet at this point',
  'pages.monitor.rule.relabel.refire':
    "After the relabel steps change, this rule's active alerts resolve, then fire again under the new labels",
  'pages.monitor.rule.relabel.add': 'Add relabel step',
  'pages.monitor.rule.relabel.moveUp': 'Move up',
  'pages.monitor.rule.relabel.moveDown': 'Move down',
  'pages.monitor.rule.relabel.action': 'Action',
  'pages.monitor.rule.relabel.action.replace':
    'Joins the source label values, matches the regex and writes the replacement to the target label (an empty result removes the label)',
  'pages.monitor.rule.relabel.action.labelmap':
    'Copies every label whose name matches the regex to a new name built from the replacement',
  'pages.monitor.rule.relabel.action.labeldrop':
    'Removes the labels whose names match the regex',
  'pages.monitor.rule.relabel.action.labelkeep':
    'Keeps only the labels whose names match the regex',
  'pages.monitor.rule.relabel.field.sourceLabels':
    'Source labels (5 at most; empty writes a constant)',
  'pages.monitor.rule.relabel.field.sourceLabels.placeholder':
    'Type a label name and press Enter',
  'pages.monitor.rule.relabel.field.separator': 'Separator (empty = ;)',
  'pages.monitor.rule.relabel.field.regex': 'Regex',
  'pages.monitor.rule.relabel.field.targetLabel': 'Target label',
  'pages.monitor.rule.relabel.field.replacement': 'Replacement (empty = $1)',
  'pages.monitor.rule.relabel.error.action': 'Step {n}: choose an action',
  'pages.monitor.rule.relabel.error.source':
    'Step {n}: at most 5 source labels, each a valid label name',
  'pages.monitor.rule.relabel.error.targetRequired':
    'Step {n}: enter the target label',
  'pages.monitor.rule.relabel.error.targetInvalid':
    'Step {n}: the target label must be a valid label name and must not start with __',
  'pages.monitor.rule.relabel.error.regexRequired': 'Step {n}: enter the regex',
  'pages.monitor.rule.relabel.error.regexInvalid':
    'Step {n}: the regex is invalid',
  'pages.monitor.rule.relabel.error.tooLong':
    'Step {n}: the regex, separator and replacement may not exceed 256 bytes each',
  'pages.monitor.rule.dropExpr': 'Conditional drop',
  'pages.monitor.rule.dropExpr.hint':
    'The event is dropped when this template renders to true; $labels and $value are available',
  'pages.monitor.rule.dropExpr.tooltip':
    'Same syntax as annotations. Runs after resource association, so ci_ labels are readable; a render error keeps the event.',
  'pages.monitor.rule.dropExpr.rule': 'Must not exceed {max} bytes',
  'pages.monitor.rule.action.ticket': 'Auto ticket',
  'pages.monitor.rule.action.ticket.hint':
    'Creates one ticket per event when it fires; a note is appended when the alert resolves',
  'pages.monitor.rule.action.ticket.template': 'Ticket template',
  'pages.monitor.rule.action.ticket.agent': 'Agent requester',
  'pages.monitor.rule.action.ticket.agent.tooltip':
    'The ticket is created as this user and follows their permissions. Must be an active user.',
  'pages.monitor.rule.action.workflow': 'Start workflow',
  'pages.monitor.rule.action.workflow.hint':
    'Starts one workflow per event when it fires, with the event as workflow variables',
  'pages.monitor.rule.action.workflow.tooltip':
    'Workflow variables: {variables}',
  'pages.monitor.rule.action.workflow.definition': 'Workflow',
  'pages.monitor.rule.action.workflow.definition.tooltip':
    'Must have a published version',
  'pages.monitor.rule.action.workflow.agent': 'Initiator',
  'pages.monitor.rule.action.ai': 'AI summary',
  'pages.monitor.rule.action.ai.hint':
    'The assistant adds a summary and troubleshooting suggestions to the alert detail',
  'pages.monitor.rule.action.ai.unavailable':
    'The assistant has no model key configured; no summary will be generated even when this is on',
  'pages.monitor.rule.batch.escalation.set': 'Set a policy',
  'pages.monitor.rule.batch.escalation.clear': 'Remove escalation policy',
  'pages.monitor.rule.batch.escalation.clear.hint':
    'The selected rules will no longer escalate',
  'pages.monitor.rule.batch.escalation.hint':
    'Only enabled policies that every selected rule can use are listed',
  'pages.monitor.rule.batch.escalation.globalOnly':
    'The selected rules span more than {max} groups; only global policies are offered',
  'pages.monitor.rule.eval.viewInhibitor': 'View source alert',
  'pages.monitor.rule.version.ciMatch.custom': 'Label {label} → {target}',
  'pages.monitor.rule.version.ciMatch.attr': 'attribute {attr}',
  'pages.monitor.rule.version.models': 'Models: {items}',
  'pages.monitor.rule.version.envs': 'Environments: {items}',
  'pages.monitor.rule.version.tags': 'Tags: {items}',
  'pages.monitor.rule.version.ticket.template': 'Template: {name}',
  'pages.monitor.rule.version.ticket.agent': 'Agent requester: {name}',
  'pages.monitor.rule.version.workflow.definition': 'Workflow: {name}',
  'pages.monitor.rule.version.workflow.agent': 'Initiator: {name}',
};
