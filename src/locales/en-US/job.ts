/** Job center: menus / element permissions / enums / credentials / projects / runners / templates / executions / log */
export default {
  'menu.job': 'Job Center',
  'menu.job.library': 'Jobs',
  'menu.job.history': 'Executions',
  'menu.job.automation': 'Schedules & Triggers',
  'menu.job.resource': 'Resources',
  'menu.job.template': 'Job Templates',
  'menu.job.execution': 'Executions',
  'menu.job.execution-detail': 'Execution Detail',
  'menu.job.project': 'Projects',
  'menu.job.credential': 'Credentials',
  'menu.job.runner': 'Runners',
  'permission.job.template.create': 'Create job template',
  'permission.job.template.edit': 'Edit / enable / disable job template',
  'permission.job.template.delete': 'Delete job template',
  'permission.job.template.run': 'Run job',
  'permission.job.execution.cancel': 'Cancel execution',
  'permission.job.project.create': 'Create project',
  'permission.job.project.edit': 'Edit project',
  'permission.job.project.delete': 'Delete project',
  'permission.job.credential.create': 'Create credential',
  'permission.job.credential.edit': 'Edit credential',
  'permission.job.credential.delete': 'Delete credential',
  'permission.job.runner.create': 'Register runner',
  'permission.job.runner.edit': 'Edit / enable / disable runner',
  'permission.job.runner.delete': 'Delete runner',
  'permission.job.runner.token': 'Reset runner token',

  'enum.job.credentialType.1': 'SSH key',
  'enum.job.credentialType.2': 'SSH password',
  'enum.job.becomeMethod.none': 'None',
  'enum.job.becomeMethod.sudo': 'sudo',
  'enum.job.becomeMethod.su': 'su',
  'enum.job.projectAuth.1': 'None',
  'enum.job.projectAuth.2': 'Username + token',
  'enum.job.projectAuth.3': 'SSH key',
  'enum.job.targetMode.1': 'Selected resources',
  'enum.job.targetMode.2': 'Filter by conditions',
  'enum.job.paramType.string': 'Text',
  'enum.job.paramType.text': 'Multiline text',
  'enum.job.paramType.int': 'Integer',
  'enum.job.paramType.float': 'Decimal',
  'enum.job.paramType.bool': 'Switch',
  'enum.job.paramType.enum': 'Single choice',
  'enum.job.executionStatus.1': 'Queued',
  'enum.job.executionStatus.2': 'Running',
  'enum.job.executionStatus.3': 'Succeeded',
  'enum.job.executionStatus.4': 'Failed',
  'enum.job.executionStatus.5': 'Partially failed',
  'enum.job.executionStatus.6': 'Cancelled',
  'enum.job.executionStatus.7': 'Timed out',
  'enum.job.executionStatus.8': 'Unknown',
  'enum.job.hostStatus.0': 'Not run',
  'enum.job.hostStatus.1': 'OK',
  'enum.job.hostStatus.2': 'Changed',
  'enum.job.hostStatus.3': 'Failed',
  'enum.job.hostStatus.4': 'Unreachable',
  'enum.job.hostStatus.5': 'Skipped',
  'enum.job.hostProblem.address_empty': 'Address is empty',
  'enum.job.hostProblem.address_invalid': 'Invalid address',
  'enum.job.hostProblem.address_duplicate': 'Duplicate address',

  'pages.job.common.name': 'Name',
  'pages.job.common.description': 'Description',
  'pages.job.common.templateCount': 'Templates',
  'pages.job.common.updated': 'Updated by / at',
  'pages.job.common.yes': 'Yes',
  'pages.job.common.no': 'No',
  'pages.job.checkMode': 'Check',
  'pages.job.zone.rule':
    'Letters, digits, dots, underscores and hyphens only, starting with a letter or digit, up to 64 characters',
  'pages.job.duration.day': '{n}d',
  'pages.job.duration.hour': '{n}h',
  'pages.job.duration.minute': '{n}m',
  'pages.job.duration.second': '{n}s',
  'pages.job.unit.second': 'seconds',
  'pages.job.unit.minute': 'minutes',
  'pages.job.unit.hour': 'hours',
  'pages.job.ago': '{text} ago',
  'pages.job.ago.now': 'just now',

  'pages.job.error.conflict':
    'This item was modified by someone else. Refresh and try again.',
  'pages.job.error.secretUnavailable':
    'The encryption master key is not configured, so secrets cannot be saved. Contact an administrator.',
  'pages.job.error.credentialInUse':
    'This credential is still used by job templates and cannot be deleted',
  'pages.job.error.projectInUse':
    'This project is still used by job templates and cannot be deleted',
  'pages.job.error.templateDisabled':
    'This job template is disabled and cannot be run',
  'pages.job.error.targetForbidden':
    'The target hosts are outside your CMDB data scope',
  'pages.job.error.runForbidden':
    'You are not allowed to run jobs: whoever saves this becomes its owner and jobs run as you (disabling is always allowed)',
  'pages.job.error.executionConflict':
    'This template does not allow concurrent runs and one is still in progress. Try again after it finishes.',
  'pages.job.error.executionFinished':
    'The execution has already finished and cannot be cancelled',

  'pages.job.host.column.name': 'Resource',
  'pages.job.host.column.env': 'Env',
  'pages.job.host.column.address': 'Address',
  'pages.job.host.column.problem': 'Check',
  'pages.job.host.runnable': 'Runnable',
  'pages.job.hosts.truncated':
    'More than {max} hosts match and the rest are not listed. Such a target cannot be run; narrow it down.',

  'pages.job.credential.create.title': 'New credential',
  'pages.job.credential.edit.title': 'Edit credential: {name}',
  'pages.job.credential.search.placeholder': 'Name / username / description',
  'pages.job.credential.writeOnly':
    'Keys and passwords are write-only: never shown again, used only at run time.',
  'pages.job.credential.column.type': 'Type',
  'pages.job.credential.column.username': 'Login user',
  'pages.job.credential.column.become': 'Become method',
  'pages.job.credential.column.fingerprint': 'Fingerprint',
  'pages.job.credential.column.fingerprint.tooltip':
    'SHA256 fingerprint of the public key, to tell keys apart. Passwords have none.',
  'pages.job.credential.username.rule':
    'Letters, digits, underscores, dots and hyphens only, not starting with a hyphen, up to 64 characters',
  'pages.job.credential.form.privateKey': 'Private key',
  'pages.job.credential.form.privateKey.extra':
    'OpenSSH / PEM format. Passphrase-protected keys are not supported.',
  'pages.job.credential.form.password': 'Password',
  'pages.job.credential.form.secret.kept':
    'Leave empty to keep the saved secret',
  'pages.job.credential.form.secret.requiredOnTypeChange':
    'The type changed: enter the {label} again',
  'pages.job.credential.section.become': 'Privilege escalation',
  'pages.job.credential.form.become.extra':
    'How to switch user when a template runs with become',
  'pages.job.credential.form.becomeUser': 'Become user',
  'pages.job.credential.form.becomeSecret': 'Become password',
  'pages.job.credential.form.becomeSecret.placeholder':
    'Leave empty for passwordless escalation',
  'pages.job.credential.form.becomeSecret.kept':
    'Leave empty to keep the saved become password',
  'pages.job.credential.form.becomeSecret.saved': 'A become password is saved',
  'pages.job.credential.form.becomeSecret.none': 'No become password is saved',
  'pages.job.credential.form.becomeSecret.clear':
    'Clear the saved become password',
  'pages.job.credential.delete.title': 'Delete credential "{name}"?',
  'pages.job.credential.delete.description':
    'This cannot be undone. The key / password is destroyed as well.',
  'pages.job.credential.delete.inUse':
    'Still used by {n} job template(s); cannot be deleted',

  'pages.job.project.create.title': 'New project',
  'pages.job.project.edit.title': 'Edit project: {name}',
  'pages.job.project.search.placeholder': 'Name / repository URL / description',
  'pages.job.project.column.repoUrl': 'Repository URL',
  'pages.job.project.column.ref': 'Branch / tag',
  'pages.job.project.column.authType': 'Authentication',
  'pages.job.project.form.ref.extra':
    'The latest commit of this branch or tag is fetched on every run',
  'pages.job.project.form.repoUrl.extra':
    'http(s):// or ssh (ssh://… or user@host:path); do not embed credentials',
  'pages.job.project.form.repoUrl.rule':
    'Enter an http(s) or ssh repository URL',
  'pages.job.project.form.auth.tokenNeedsHttp':
    '"Username + token" only works with http(s) repository URLs',
  'pages.job.project.form.auth.keyNeedsSsh':
    '"SSH key" only works with ssh repository URLs (ssh://… or user@host:path)',
  'pages.job.project.form.username': 'Username',
  'pages.job.project.form.username.extra':
    'For GitLab access tokens any value works, e.g. oauth2',
  'pages.job.project.form.token': 'Access token',
  'pages.job.project.form.privateKey': 'SSH private key',
  'pages.job.project.form.privateKey.extra':
    'OpenSSH / PEM format. Passphrase-protected keys are not supported.',
  'pages.job.project.form.secret.kept': 'Leave empty to keep the saved secret',
  'pages.job.project.form.secret.requiredOnAuthChange':
    'The authentication changed: enter the {label} again',
  'pages.job.project.delete.title': 'Delete project "{name}"?',
  'pages.job.project.delete.description':
    'This cannot be undone. The repository secret is destroyed as well. Existing executions are kept.',
  'pages.job.project.delete.inUse':
    'Still used by {n} job template(s); cannot be deleted',

  'pages.job.runner.create.title': 'Register runner',
  'pages.job.runner.create.hint':
    'A token is generated and shown once; put it into the runner config.',
  'pages.job.runner.edit.title': 'Edit runner: {name}',
  'pages.job.runner.search.placeholder': 'Name / zone / hostname',
  'pages.job.runner.column.zone': 'Zone',
  'pages.job.runner.column.online': 'Connectivity',
  'pages.job.runner.column.lastSeen': 'Last seen',
  'pages.job.runner.column.hostname': 'Hostname',
  'pages.job.runner.column.agentVersion': 'Agent version',
  'pages.job.runner.column.load': 'Load',
  'pages.job.runner.column.load.tooltip':
    'Running jobs / concurrent job capacity',
  'pages.job.runner.online': 'Online',
  'pages.job.runner.offline': 'Offline',
  'pages.job.runner.neverSeen': 'Never connected',
  'pages.job.runner.form.zone.tooltip':
    'Jobs with a zone go only to runners in that zone; jobs without one go to any runner.',
  'pages.job.runner.form.zone.placeholder': 'Pick or type a zone; optional',
  'pages.job.runner.form.enabled.tooltip':
    'A disabled runner takes no new jobs; running jobs are not affected',
  'pages.job.runner.disable.title': 'Disable runner "{name}"?',
  'pages.job.runner.disable.description':
    'The runner stops taking new jobs; running jobs are not affected. If no other runner is available in its zone, jobs that require the zone stay queued.',
  'pages.job.runner.resetToken': 'Reset token',
  'pages.job.runner.resetToken.title': 'Reset the token of runner "{name}"?',
  'pages.job.runner.resetToken.description':
    'The old token stops working immediately: the runner can no longer take jobs or report results until you put the new token into its configuration and restart it. The new token is shown only once.',
  'pages.job.runner.delete.title': 'Delete runner "{name}"?',
  'pages.job.runner.delete.description':
    'Its token stops working immediately. Jobs running on it will be marked "Unknown" once their lease expires; the platform will not rerun them.',
  'pages.job.runner.token.title.create': 'Runner "{name}" registered',
  'pages.job.runner.token.title.reset': 'New token for runner "{name}"',
  'pages.job.runner.token.warning':
    'This token is shown only once and cannot be viewed again after you close this dialog. Copy and store it now.',
  'pages.job.runner.token.warning.reset':
    'The old token no longer works. Update the runner configuration and restart it soon.',
  'pages.job.runner.token.label': 'Token',
  'pages.job.runner.token.snippet':
    'Set it as the {env} environment variable of the runner:',
  'pages.job.runner.token.ok': 'I have saved it, close',

  'pages.job.template.create.title': 'New job template',
  'pages.job.template.edit.title': 'Edit job template: {name}',
  'pages.job.template.search.placeholder': 'Name / playbook / description',
  'pages.job.template.column.project': 'Project',
  'pages.job.template.column.playbook': 'Playbook',
  'pages.job.template.column.target': 'Target hosts',
  'pages.job.template.column.credential': 'Credential',
  'pages.job.template.column.version': 'Version',
  'pages.job.template.exclusive': 'Exclusive',
  'pages.job.template.project.missing': 'Project deleted',
  'pages.job.template.credential.missing': 'Credential deleted',
  'pages.job.template.target.ids': '{model} · {n} selected',
  'pages.job.template.target.filter': '{model} · filter {filters}',
  'pages.job.template.target.all': '{model} · all',
  'pages.job.template.target.keyword': 'name~"{keyword}"',
  'pages.job.template.run': 'Run',
  'pages.job.template.executions': 'Executions',
  'pages.job.template.disable.title': 'Disable job template "{name}"?',
  'pages.job.template.disable.description':
    'A disabled template cannot be run. Executions already submitted are not affected.',
  'pages.job.template.delete.title': 'Delete job template "{name}"?',
  'pages.job.template.delete.description':
    'This cannot be undone. Existing executions are kept but can no longer be rerun.',
  'pages.job.template.section.basic': 'Basics',
  'pages.job.template.section.content': 'What to run',
  'pages.job.template.section.target': 'Target hosts',
  'pages.job.template.section.params': 'Parameters',
  'pages.job.template.section.options': 'Options',
  'pages.job.template.form.enabled.tooltip':
    'A disabled template cannot be run',
  'pages.job.template.form.project.missing': '(project deleted, pick another)',
  'pages.job.template.form.credential.missing':
    '(credential deleted, pick another)',
  'pages.job.template.form.playbook.extra':
    'Path relative to the repo root; the playbook must use "hosts: all"',
  'pages.job.template.form.playbook.rule':
    'Enter a path relative to the repository ending with .yml or .yaml, without ".."',
  'pages.job.template.form.credential.extra':
    'SSH account for target hosts; also provides the become method and password',
  'pages.job.template.form.model': 'Resource type',
  'pages.job.template.form.model.extra':
    "Hosts come from this CMDB type, within the runner's data scope",
  'pages.job.template.form.addressField': 'Address from',
  'pages.job.template.form.addressField.name': 'Resource name',
  'pages.job.template.form.addressField.extra':
    'Attribute holding the IP or hostname (not sensitive ones)',
  'pages.job.template.form.mode': 'Selection',
  'pages.job.template.form.ciIds': 'Resources',
  'pages.job.template.form.ciIds.placeholder':
    'Type to search and select resources',
  'pages.job.template.form.ciIds.needModel': 'Select a resource type first',
  'pages.job.template.form.ciIds.empty': 'No matching resources',
  'pages.job.template.form.ciIds.count': '{n} / {max} selected',
  'pages.job.template.form.ciIds.clear': 'Clear',
  'pages.job.template.form.ciIds.invisible': 'Not visible {id}',
  'pages.job.template.form.ciIds.required': 'Select at least one resource',
  'pages.job.template.form.env': 'Env',
  'pages.job.template.form.tag': 'Tag',
  'pages.job.template.form.keyword': 'Name keyword',
  'pages.job.template.form.filter.hint':
    'Re-evaluated on every run; all empty selects every resource of the type (max 500)',
  'pages.job.template.preview': 'Preview hosts',
  'pages.job.template.preview.summary': '{total} matched, {runnable} runnable',
  'pages.job.template.preview.problems':
    '{n} with problems; fix before running',
  'pages.job.template.form.params.hint':
    'Filled in at run time and passed to the playbook as extra vars',
  'pages.job.template.form.params.rule':
    'Some parameters are invalid; see the message under each row',
  'pages.job.param.empty': 'No parameters defined',
  'pages.job.param.add': 'Add parameter',
  'pages.job.param.remove': 'Remove parameter',
  'pages.job.param.count': '{n} / {max}',
  'pages.job.param.required': 'Required',
  'pages.job.param.code.placeholder': 'Variable, e.g. app_version',
  'pages.job.param.name.placeholder': 'Display name',
  'pages.job.param.default.placeholder': 'Default (optional)',
  'pages.job.param.options.placeholder':
    'Choices: type and press Enter; separate several with commas',
  'pages.job.param.description.placeholder': 'Help text (optional)',
  'pages.job.param.error.code':
    'The variable must start with a lowercase letter and contain only lowercase letters, digits and underscores, up to 64 characters',
  'pages.job.param.error.codePrefix':
    'The variable must not start with ansible_ or cmdb_',
  'pages.job.param.error.codeReserved':
    '{code} is reserved by Ansible; pick another variable name (for example app_{code})',
  'pages.job.param.error.codeDuplicate': 'Duplicate variable {code}',
  'pages.job.param.error.name': 'Enter a display name (up to {max} characters)',
  'pages.job.param.error.options':
    'Single choice needs 1-{max} choices of up to {len} characters each',
  'pages.job.param.error.default': 'The default does not match the type',
  'pages.job.param.error.defaultTooLong':
    'The default is limited to {max} characters',
  'pages.job.param.error.descriptionTooLong':
    'The help text is limited to {max} characters',

  'pages.job.options.forks': 'Forks',
  'pages.job.options.forks.tooltip': 'How many hosts run in parallel, 1-100',
  'pages.job.options.timeout': 'Timeout',
  'pages.job.options.timeout.tooltip':
    'When exceeded the job is terminated and marked "Timed out"',
  'pages.job.options.timeout.rule':
    'The timeout must be between 1 minute and 24 hours',
  'pages.job.options.port': 'SSH port',
  'pages.job.options.verbosity': 'Verbosity',
  'pages.job.options.verbosity.0': 'Normal',
  'pages.job.options.verbosity.1': 'Verbose (-v)',
  'pages.job.options.verbosity.2': 'More verbose (-vv)',
  'pages.job.options.verbosity.3': 'Debug (-vvv)',
  'pages.job.options.runnerZone': 'Runner zone',
  'pages.job.options.runnerZone.tooltip':
    'Dispatch only to runners in this zone; leave empty to allow any runner',
  'pages.job.options.runnerZone.placeholder': 'Empty means any zone',
  'pages.job.options.runnerZone.any': 'Any zone',
  'pages.job.options.become': 'Run with become',
  'pages.job.options.become.tooltip':
    'Method and password come from the credential; sudo is used when the credential sets none',
  'pages.job.options.check': 'Check mode',
  'pages.job.options.check.tooltip':
    'Check mode by default: reports changes without applying them. Can be changed per run.',
  'pages.job.options.diff': 'Show diff',
  'pages.job.options.diff.tooltip': 'Print file change diffs in the log',
  'pages.job.options.exclusive': 'Exclusive',
  'pages.job.options.exclusive.extra':
    'When on, no new run can be submitted while one is unfinished',

  'pages.job.run.title': 'Run job',
  'pages.job.run.template': 'Template',
  'pages.job.run.loadFailed': 'Failed to load the job template',
  'pages.job.run.hostCount': 'Will run on {n} host(s)',
  'pages.job.run.hostList': 'Show host list ({n})',
  'pages.job.run.retryOnly':
    'Only the hosts that failed or were unreachable last time',
  'pages.job.run.problems':
    '{n} host(s) have address problems; fix them before running',
  'pages.job.run.noHosts': 'No hosts to run on',
  'pages.job.run.outOfScope':
    '{n} host(s) are outside your data scope and will not be run',
  'pages.job.run.dropped':
    '{n} of the previous hosts are no longer in the template target or in your data scope and will not be run',
  'pages.job.run.check': 'Check mode (no real changes)',
  'pages.job.run.check.hint':
    'Only reports what would change, without modifying the target hosts.',
  'pages.job.run.realWarning':
    'Real changes will be made on {n} host(s). Double-check the host list and parameters.',
  'pages.job.run.submitFailed': 'Submission failed',
  'pages.job.params.notReady':
    'Parameter definitions are not loaded yet; wait before saving (reopen if loading failed)',
  'pages.job.run.templateChanged':
    'The template was changed while you were confirming; close and reopen to review it',
  'pages.job.adhoc.script.loadFailed':
    'Cannot load the latest content of the selected script; pick it again',
  'pages.job.run.ok': 'Run',
  'pages.job.run.ok.check': 'Check',

  'pages.job.execution.search.placeholder': 'Template name',
  'pages.job.execution.search.template': 'Search and select a template',
  'pages.job.execution.mine': 'Mine only',
  'pages.job.execution.column.template': 'Template',
  'pages.job.execution.column.hosts': 'Hosts',
  'pages.job.execution.column.creator': 'Run by',
  'pages.job.execution.column.runner': 'Runner',
  'pages.job.execution.column.createTime': 'Submitted',
  'pages.job.execution.column.startTime': 'Started',
  'pages.job.execution.column.finishTime': 'Finished',
  'pages.job.execution.column.duration': 'Duration',
  'pages.job.execution.column.commit': 'Commit',
  'pages.job.execution.column.cancelUser': 'Cancelled by',
  'pages.job.execution.hosts.unreachable': '{n} unreachable',
  'pages.job.execution.hosts.total': 'of {n}',
  'pages.job.execution.hosts.tooltip':
    '{ok} ok / {failed} failed / {unreachable} unreachable ({total} total)',
  'pages.job.execution.detail': 'Detail',
  'pages.job.execution.cancel': 'Cancel',
  'pages.job.execution.cancelling': 'Cancelling…',
  'pages.job.execution.cancelling.hint':
    '{name} requested cancellation; waiting for the runner to stop the job…',
  'pages.job.execution.cancel.title': 'Cancel this execution of "{name}"?',
  'pages.job.execution.cancel.description.queued':
    'The job has not started; it will not run after cancellation.',
  'pages.job.execution.cancel.description.running':
    'The job is running: the runner sends a termination signal first and force-kills after a grace period. Changes already made are not rolled back and some hosts may be left half-way.',
  'pages.job.execution.cancel.requested': 'Cancellation requested',
  'pages.job.execution.cancel.unknown': 'Stop when runner reconnects',
  'pages.job.execution.cancel.description.unknown':
    'While the runner is unreachable we cannot tell whether the job is still running. After you register a stop request, the runner terminates this job as soon as it reconnects; if the job has already finished, nothing happens.',
  'pages.job.execution.unknown.cancelRequested':
    'Stop requested: the runner will terminate this job as soon as it reconnects.',
  'pages.job.execution.backToList': 'Back to executions',
  'pages.job.execution.loadFailed': 'Failed to load the execution',
  'pages.job.execution.refreshFailed': 'Failed to refresh the status; retrying',
  'pages.job.execution.rerun': 'Rerun',
  'pages.job.execution.retryFailed': 'Retry failed hosts ({n})',
  'pages.job.execution.retryFailed.none': 'No failed or unreachable hosts',
  'pages.job.execution.unknown.title': 'Unknown result: the runner was lost',
  'pages.job.execution.unknown.description':
    'The job may still be running on the target hosts, or it may have been interrupted. The platform will not rerun it automatically: check the hosts first, then decide whether to rerun.',
  'pages.job.execution.queued': 'Waiting for a runner to pick it up…',
  'pages.job.execution.queued.slow':
    'Queued for {text} and still not picked up',
  'pages.job.execution.queued.slow.zone':
    'Check that zone "{zone}" has an enabled, online runner and that it is not at capacity.',
  'pages.job.execution.queued.slow.any':
    'Check that an enabled, online runner exists and that it is not at capacity.',
  'pages.job.execution.error': 'Failure reason',
  'pages.job.execution.tab.log': 'Log',
  'pages.job.execution.tab.hosts': 'Hosts ({n})',
  'pages.job.execution.tab.content': 'What was run',
  'pages.job.execution.hostFilter.all': 'All',
  'pages.job.execution.hostFilter.ok': 'OK',
  'pages.job.execution.hostFilter.failed': 'Failed',
  'pages.job.execution.hostFilter.unreachable': 'Unreachable',
  'pages.job.execution.hostFilter.other': 'Not run / skipped',
  'pages.job.execution.hostSearch.placeholder': 'Name / address',
  'pages.job.execution.section.params': 'Parameter values',
  'pages.job.execution.params.code': 'Variable',
  'pages.job.execution.params.value': 'Value',
  'pages.job.execution.params.empty': 'This execution has no parameters',

  'pages.job.log.follow': 'Follow output',
  'pages.job.log.streaming': 'Streaming',
  'pages.job.log.paused': 'Paused while the page is hidden',
  'pages.job.log.done': 'Log fully loaded',
  'pages.job.log.toBottom': 'To bottom',
  'pages.job.log.download': 'Download',
  'pages.job.log.downloadFull': 'download the full log',
  'pages.job.log.dropped': '{n} earlier lines omitted, ',
  'pages.job.log.empty': 'No log output',
  'pages.job.log.waiting': 'Waiting for output…',
  'pages.job.log.pendingApproval': 'Awaiting approval',
  'pages.job.log.lost': 'Runner lost; logs resume when it reconnects',
  'pages.job.log.queued': 'Queued',
  'pages.job.log.pendingApproval.hint':
    'Execution starts after approval; the log will appear here.',
  'pages.job.log.queued.hint':
    'Waiting for a runner to claim the job; the log will appear here once it starts.',
  'pages.job.log.truncated':
    'The log exceeded the 32MB limit; the rest was not kept',
  'pages.job.log.error': 'Failed to read the log',
  'pages.job.log.error.retrying': 'Failed to read the log; retrying',
  'pages.job.log.copyFailed': 'Copy failed; use download instead',

  'menu.job.adhoc': 'Quick Run',
  'menu.job.schedule': 'Schedules',
  'menu.job.trigger': 'Triggers',
  'menu.job.script': 'Scripts',
  'menu.job.policy': 'Security Policy',
  'menu.job.stats': 'Statistics',
  'permission.job.adhoc.run': 'Quick run (command / script / file)',
  'permission.job.script.create': 'Create script',
  'permission.job.script.edit': 'Edit script',
  'permission.job.script.delete': 'Delete script',
  'permission.job.schedule.create': 'Create schedule',
  'permission.job.schedule.edit': 'Edit / enable / disable schedule',
  'permission.job.schedule.delete': 'Delete schedule',
  'permission.job.trigger.create': 'Create trigger',
  'permission.job.trigger.edit': 'Edit / enable / disable trigger',
  'permission.job.trigger.delete': 'Delete trigger',
  'permission.job.trigger.token': 'Reset trigger token',
  'permission.job.policy.rule': 'Manage risky-command rules',
  'permission.job.policy.edit': 'Edit global policy',

  'enum.job.executionStatus.9': 'Pending approval',
  'enum.job.executionStatus.10': 'Approval rejected',
  'enum.job.kind.1': 'Template',
  'enum.job.kind.2': 'Command',
  'enum.job.kind.3': 'Script',
  'enum.job.kind.4': 'File',
  'enum.job.triggerSource.1': 'Manual',
  'enum.job.triggerSource.2': 'Schedule',
  'enum.job.triggerSource.3': 'Open API',
  'enum.job.triggerSource.4': 'Alert',
  'enum.job.riskAction.1': 'Block',
  'enum.job.riskAction.2': 'Needs approval',
  'enum.job.riskAction.3': 'Warn only',
  'enum.job.misfire.1': 'Skip',
  'enum.job.misfire.2': 'Run once',
  'enum.job.triggerType.1': 'Open API',
  'enum.job.triggerType.2': 'Alert',
  'enum.job.fireResult.1': 'Submitted',
  'enum.job.fireResult.2': 'Skipped',
  'enum.job.fireResult.3': 'Failed',
  'enum.job.signalState.0': 'Not needed',
  'enum.job.signalState.1': 'Pending',
  'enum.job.signalState.2': 'Sent',
  'enum.job.signalState.3': 'Given up',

  'pages.job.common.owner': 'Owner',
  'pages.job.common.owner.tooltip':
    'Runs as the owner, within their CMDB data scope. Editing or toggling makes you the owner.',
  'pages.job.error.riskBlocked':
    'The command or script matches a blocking risk rule and cannot be submitted',
  'pages.job.error.approvalUnavailable':
    'This execution needs approval but no usable approval workflow is configured. Ask an administrator to set it in Security Policy.',
  'pages.job.approval.notice':
    'This execution needs approval: {reasons}. It will wait for approval after submission and run only once approved.',
  'pages.job.approval.unavailable':
    'Approval is required but no usable approval workflow is configured. Ask an administrator to set it in Security Policy.',
  'pages.job.params.needTemplate': 'Select a job template first',
  'pages.job.params.none': 'This template has no parameters',
  'pages.job.params.loadFailed':
    'Failed to load the template parameters (template deleted or not visible)',

  'pages.job.options.batchSize': 'Rolling batch size',
  'pages.job.options.batchSize.tooltip':
    'Hosts run in consecutive batches, one run per batch; unrelated to the playbook serial.',
  'pages.job.options.batchSize.extra': '0 means no batching',
  'pages.job.options.maxFailPercent': 'Failure threshold',
  'pages.job.options.maxFailPercent.tooltip':
    'After a batch, the run stops if failed and unreachable hosts exceed this share.',
  'pages.job.options.maxFailPercent.extra': '0 stops on any failure',
  'pages.job.options.maxFailPercent.disabled':
    'Only applies to rolling (batched) runs',
  'pages.job.options.sliceSize': 'Slice size',
  'pages.job.options.sliceSize.tooltip':
    'One submission is split into up to 10 executions that runners can run in parallel.',
  'pages.job.options.sliceSize.extra': '0 means no slicing',
  'pages.job.options.sliceSize.disabled':
    'Exclusive is on; slicing is not available',
  'pages.job.options.exclusive.disabled':
    'Slicing is set; exclusive is not available',
  'pages.job.template.form.requireApproval': 'Requires approval',
  'pages.job.template.form.requireApproval.extra':
    'Real runs wait for approval (not check mode); protected environments always need it',
  'pages.job.template.requireApproval': 'Approval',
  'pages.job.template.slice': 'Sliced',
  'pages.job.template.slice.tooltip': 'Sliced: {size} hosts per slice',
  'pages.job.run.slices':
    'This template is sliced ({size} hosts per slice): the submission will be split into {n} executions',
  'pages.job.run.submittedForApproval': 'Submitted; waiting for approval',

  'pages.job.execution.column.kind': 'Kind',
  'pages.job.execution.column.trigger': 'Trigger',
  'pages.job.execution.column.approval': 'Approval',
  'pages.job.execution.slice': 'Slice {no}/{total}',
  'pages.job.execution.slice.tooltip':
    'Sliced job: click to see all slices of the same submission',
  'pages.job.execution.filter.group':
    'Showing only the slices of one submission',
  'pages.job.execution.filter.triggerRef':
    'Showing only executions submitted by the selected schedule / trigger',
  'pages.job.execution.filter.clear': 'Show all',
  'pages.job.execution.withdraw': 'Withdraw',
  'pages.job.execution.cancel.description.approval':
    'The job is waiting for approval: withdrawing also withdraws the approval and the job will not run.',
  'pages.job.execution.approval.pending': 'Waiting for approval',
  'pages.job.execution.approval.pending.hint':
    'Once approved it is queued and run; if rejected, withdrawn or terminated it will not run.',
  'pages.job.execution.approval.reason': 'Why approval is needed: {reason}',
  'pages.job.execution.approval.rejected':
    'Approval was not granted; the job did not run',
  'pages.job.execution.approval.view': 'View approval',
  'pages.job.execution.riskHits': 'Risk rules matched at submission',
  'pages.job.execution.content.scriptFrom':
    'Script library: {name} (v{version})',
  'pages.job.execution.content.fileSize': 'File size',
  'pages.job.execution.content.batch':
    '{size} hosts per batch, failure threshold {percent}%',
  'pages.job.execution.content.batch.off': 'No batching',

  'pages.job.adhoc.command': 'Command',
  'pages.job.adhoc.command.extra':
    'Run through the shell on target hosts; checked against risky-command rules',
  'pages.job.adhoc.command.tooLarge':
    'Commands are limited to 4096 bytes; use a script for longer content',
  'pages.job.adhoc.scriptSource': 'Script source',
  'pages.job.adhoc.scriptSource.inline': 'Inline',
  'pages.job.adhoc.scriptSource.library': 'Script library',
  'pages.job.adhoc.scriptId': 'Script',
  'pages.job.adhoc.scriptId.placeholder': 'Search and select a script',
  'pages.job.adhoc.scriptId.extra':
    'Runs the current version; its content is saved with the execution',
  'pages.job.adhoc.scriptId.version': 'v{version}',
  'pages.job.adhoc.scriptId.loadFailed':
    'Failed to load the script (deleted or not visible)',
  'pages.job.adhoc.interpreter': 'Interpreter',
  'pages.job.adhoc.script': 'Script',
  'pages.job.adhoc.scriptArgs': 'Arguments',
  'pages.job.adhoc.scriptArgs.extra': 'Single line, split by shell rules',
  'pages.job.adhoc.scriptArgs.tooLarge': 'Arguments are limited to 1024 bytes',
  'pages.job.adhoc.file': 'File',
  'pages.job.adhoc.file.upload': 'Choose file',
  'pages.job.adhoc.file.extra':
    'One file, 4MB max; its content is saved with the execution',
  'pages.job.adhoc.file.required': 'Upload the file to distribute first',
  'pages.job.adhoc.file.tooLarge': 'The file must not exceed {max}',
  'pages.job.adhoc.fileName': 'File name on hosts',
  'pages.job.adhoc.fileName.extra': 'Defaults to the uploaded file name',
  'pages.job.adhoc.fileName.rule':
    'Letters, digits and . _ + - only, not starting with a dot or hyphen, up to 128 characters',
  'pages.job.adhoc.dest': 'Destination directory',
  'pages.job.adhoc.dest.extra':
    'Absolute path on target hosts; created if missing',
  'pages.job.adhoc.dest.rule':
    'Enter an absolute path with letters, digits and . _ / + - only, without ".."',
  'pages.job.adhoc.mode': 'File mode',
  'pages.job.adhoc.mode.rule': 'Three octal digits with a leading 0, e.g. 0644',
  'pages.job.adhoc.check': 'Check',
  'pages.job.adhoc.check.title': 'Check result',
  'pages.job.adhoc.check.ok': 'Check passed; ready to submit',
  'pages.job.adhoc.check.blocked':
    'A blocking risk rule matched; submission is not allowed',
  'pages.job.adhoc.check.riskHits': 'Risk rules matched; please confirm',
  'pages.job.adhoc.check.notSubmittable':
    'The check did not pass; fix the issues shown and submit again',
  'pages.job.adhoc.submit.hint':
    'Checked once more and confirmed before submission',
  'pages.job.adhoc.submit.noPermission':
    'You do not have permission to run; check only',
  'pages.job.adhoc.submit.approval': 'Submit for approval',
  'pages.job.adhoc.confirm.title': 'Confirm {kind} on {n} host(s)?',
  'pages.job.adhoc.confirm.credential': 'Credential: {name}',
  'pages.job.adhoc.confirm.file': 'File: {name} → {dest} ({mode})',
  'pages.job.adhoc.confirm.more': '… {n} more line(s) not shown',
  'pages.job.adhoc.confirm.warning':
    'It runs on the target hosts right after submission; changes made cannot be undone.',
  'pages.job.adhoc.confirm.approval':
    'It waits for approval after submission and runs only once approved.',
  'pages.job.adhoc.rerun.loaded':
    'Loaded the content of the previous run "{name}"; review before submitting',
  'pages.job.adhoc.rerun.file':
    'Loaded the target and options of the previous run "{name}". The file cannot be carried over; upload it again.',
  'pages.job.adhoc.rerun.notAdhoc':
    'That execution is not a quick run; nothing to load',
  'pages.job.adhoc.rerun.failed': 'Failed to load the previous run: {reason}',

  'pages.job.script.create.title': 'New script',
  'pages.job.script.edit.title': 'Edit script: {name}',
  'pages.job.script.search.placeholder': 'Name / description',
  'pages.job.script.column.size': 'Size',
  'pages.job.script.form.content': 'Content',
  'pages.job.script.form.content.stat':
    '{lines} line(s) · {size} (256KB at most)',
  'pages.job.script.form.content.tooLarge': 'The script must not exceed 256KB',
  'pages.job.script.delete.title': 'Delete script "{name}"?',
  'pages.job.script.delete.description':
    'This cannot be undone. Existing executions are not affected.',

  'pages.job.schedule.create.title': 'New schedule',
  'pages.job.schedule.edit.title': 'Edit schedule: {name}',
  'pages.job.schedule.search.placeholder': 'Name / description',
  'pages.job.schedule.notice.owner':
    'Runs as you (the owner); when approval is needed, each trigger waits for it.',
  'pages.job.schedule.column.cron': 'Cron',
  'pages.job.schedule.column.timezone': 'Timezone',
  'pages.job.schedule.column.lastTime': 'Last run',
  'pages.job.schedule.next': 'Next {time}',
  'pages.job.schedule.next.none': 'Disabled; will not run',
  'pages.job.schedule.template.missing': 'Template deleted',
  'pages.job.schedule.form.cron.extra':
    'Standard 5 fields: minute hour day month weekday; minimum interval 1 minute',
  'pages.job.schedule.preset': 'Presets',
  'pages.job.schedule.preset.every5m': 'Every 5 minutes',
  'pages.job.schedule.preset.hourly': 'Hourly',
  'pages.job.schedule.preset.daily': 'Daily at 3:00',
  'pages.job.schedule.preset.weekly': 'Mondays at 3:00',
  'pages.job.schedule.preset.monthly': '1st of month at 3:00',
  'pages.job.schedule.nextTimes': 'Next 5 runs (shown in your local time)',
  'pages.job.schedule.section.params': 'Fixed parameter values',
  'pages.job.schedule.form.misfire': 'On missed run',
  'pages.job.schedule.form.misfire.extra':
    'What to do when a trigger time is missed, e.g. during downtime',
  'pages.job.schedule.enable.title': 'Enable schedule "{name}"?',
  'pages.job.schedule.enable.description':
    'It will run automatically on its cron and be submitted as you (you become the owner).',
  'pages.job.schedule.disable.title': 'Disable schedule "{name}"?',
  'pages.job.schedule.disable.description':
    'It will no longer run. Executions already submitted are not affected.',
  'pages.job.schedule.delete.title': 'Delete schedule "{name}"?',
  'pages.job.schedule.delete.description':
    'It will no longer run and this cannot be undone. Executions already submitted are not affected.',

  'pages.job.trigger.create.title': 'New trigger',
  'pages.job.trigger.edit.title': 'Edit trigger: {name}',
  'pages.job.trigger.search.placeholder': 'Name / description',
  'pages.job.trigger.notice.owner':
    'Submits as you (the owner), validated and approved like a manual run.',
  'pages.job.trigger.column.type': 'Type',
  'pages.job.trigger.column.cooldown': 'Cooldown',
  'pages.job.trigger.column.lastFire': 'Last fired',
  'pages.job.trigger.cooldown.none': 'None',
  'pages.job.trigger.form.type.1.extra':
    'Called by workflow nodes or external systems with a token; type is fixed once created',
  'pages.job.trigger.form.type.2.extra':
    'Runs once per unmuted alert event (self-healing); type is fixed once created',
  'pages.job.trigger.section.api': 'Open API',
  'pages.job.trigger.section.alert': 'Alert match',
  'pages.job.trigger.form.passParams': 'Allow caller parameters',
  'pages.job.trigger.form.passParams.extra':
    'Callers may override fixed values and supply required ones',
  'pages.job.trigger.form.signal': 'Workflow signal',
  'pages.job.trigger.form.signal.extra':
    'Optional; sent to the calling workflow instance when the job ends',
  'pages.job.trigger.form.signal.tooltip':
    'The request must carry a workflow instance ID; add a "wait for signal" node after the service node.',
  'pages.job.trigger.form.signal.rule':
    'Starts with a letter; letters, digits and _ . - only; up to 64 characters',
  'pages.job.trigger.form.rules': 'Alert rules',
  'pages.job.trigger.form.rules.placeholder': 'Search and select alert rules',
  'pages.job.trigger.form.rules.extra':
    'Up to 50; empty means any rule, and label conditions are then required',
  'pages.job.trigger.form.rules.rule':
    'Add at least one label condition when no alert rule is selected',
  'pages.job.trigger.form.severities': 'Severities',
  'pages.job.trigger.form.severities.extra': 'None checked means any severity',
  'pages.job.trigger.form.labels': 'Label conditions',
  'pages.job.trigger.form.labels.extra':
    'All label conditions must match exactly; up to 10',
  'pages.job.trigger.form.labels.key': 'Label',
  'pages.job.trigger.form.labels.value': 'Value',
  'pages.job.trigger.form.labels.add': 'Add condition',
  'pages.job.trigger.form.labels.rule':
    'Label names start with a letter or underscore, use letters, digits and underscores only and must be unique; values are limited to 256 characters',
  'pages.job.trigger.form.hostLabel': 'Host label',
  'pages.job.trigger.form.hostLabel.extra':
    'Alert label holding the host address, e.g. instance; empty runs on all hosts',
  'pages.job.trigger.form.hostLabel.tooltip':
    'When set, runs only on the target host whose address equals the label value (without :port); skipped if none.',
  'pages.job.trigger.form.hostLabel.rule':
    'Starts with a letter or underscore; letters, digits and underscores only',
  'pages.job.trigger.form.cooldown.extra':
    'Events this soon after a fire are skipped; 0 = off',
  'pages.job.trigger.form.cooldown.rule':
    'The cooldown must not exceed 24 hours',
  'pages.job.trigger.enable.title': 'Enable trigger "{name}"?',
  'pages.job.trigger.enable.description':
    'External calls / matching alerts will run the job automatically, submitted as you (you become the owner).',
  'pages.job.trigger.disable.title': 'Disable trigger "{name}"?',
  'pages.job.trigger.disable.description':
    'External calls will be rejected and matching alerts will no longer fire. Executions already submitted are not affected.',
  'pages.job.trigger.resetToken.title': 'Reset the token of trigger "{name}"?',
  'pages.job.trigger.resetToken.description':
    'The old token stops working immediately: workflow webhooks and external systems still using it will fail until updated. The new token is shown only once.',
  'pages.job.trigger.delete.title': 'Delete trigger "{name}"?',
  'pages.job.trigger.delete.description':
    'Its token stops working immediately and this cannot be undone. Executions already submitted are not affected.',
  'pages.job.trigger.token.title.create': 'Trigger "{name}" created',
  'pages.job.trigger.token.title.reset': 'New token for trigger "{name}"',
  'pages.job.trigger.token.warning.reset':
    'The old token no longer works. Update the callers soon.',
  'pages.job.trigger.token.label': 'Token',
  'pages.job.trigger.usage.url': 'Endpoint (POST)',
  'pages.job.trigger.usage.curl':
    'Example (requestId is an optional idempotency key)',
  'pages.job.trigger.usage.workflow': 'Using it in a workflow',
  'pages.job.trigger.usage.workflow.webhook':
    'Workflow → Config → Webhook: use the endpoint above as the URL and the token as the signing secret.',
  'pages.job.trigger.usage.workflow.signal':
    'Add a "wait for signal" node after the service node with signal name {signal}; the workflow continues when the job ends.',
  'pages.job.trigger.usage.workflow.noSignal':
    'No signal is configured: the workflow will not wait for the job. Set a "Workflow signal" on the trigger if it should.',
  'pages.job.trigger.usage.workflow.vars':
    'Signal variables: jobExecutionId, jobStatus (execution status 3-10), jobSuccess.',
  'pages.job.trigger.fires': 'Fires',
  'pages.job.trigger.fires.title': 'Fires: {name}',
  'pages.job.trigger.fires.column.time': 'Time',
  'pages.job.trigger.fires.column.result': 'Result',
  'pages.job.trigger.fires.column.summary': 'Source',
  'pages.job.trigger.fires.column.reason': 'Skip / failure reason',
  'pages.job.trigger.fires.column.execution': 'Execution',
  'pages.job.trigger.fires.column.signal': 'Workflow signal',

  'pages.job.policy.tab.rules': 'Risky-command rules',
  'pages.job.policy.tab.global': 'Global policy',
  'pages.job.policy.rule.intro':
    'Rules match quick-run commands and scripts by regex (RE2); template playbooks are not matched.',
  'pages.job.policy.rule.create.title': 'New rule',
  'pages.job.policy.rule.edit.title': 'Edit rule: {name}',
  'pages.job.policy.rule.draftName': 'Untitled rule',
  'pages.job.policy.rule.column.pattern': 'Pattern',
  'pages.job.policy.rule.column.action': 'Action',
  'pages.job.policy.rule.form.pattern.extra':
    'RE2 syntax, searched in the command / script; no backreferences or lookarounds',
  'pages.job.policy.rule.form.action.1': 'Block: submission is not allowed',
  'pages.job.policy.rule.form.action.2':
    'Approval: runs only after the submission is approved',
  'pages.job.policy.rule.form.action.3':
    'Warn only: shown to the submitter, does not affect submission',
  'pages.job.policy.rule.form.description.extra':
    'Shown to the submitter and approvers on a match',
  'pages.job.policy.rule.form.test': 'Test this rule',
  'pages.job.policy.rule.disable.title': 'Disable rule "{name}"?',
  'pages.job.policy.rule.disable.description':
    'The rule stops matching: commands it used to block or send for approval will run directly.',
  'pages.job.policy.rule.delete.title': 'Delete rule "{name}"?',
  'pages.job.policy.rule.delete.description':
    'This cannot be undone. Commands it used to block or send for approval will run directly.',
  'pages.job.policy.testAll': 'Test all rules',
  'pages.job.policy.test': 'Test',
  'pages.job.policy.test.placeholder': 'Enter a command or script',
  'pages.job.policy.test.hit': '{n} match(es)',
  'pages.job.policy.test.miss': 'No match',
  'pages.job.policy.global.workflow': 'Approval workflow',
  'pages.job.policy.global.workflow.placeholder':
    'Select a workflow definition; empty means not configured',
  'pages.job.policy.global.workflow.extra':
    'Starts approvals; must be enabled and published. Unset = such submissions are rejected',
  'pages.job.policy.global.workflow.vars':
    'Workflow variables: kind (1-4), name, host_count, envs, reason, check, trigger (1-4)',
  'pages.job.policy.global.workflow.notReady':
    '{name} ({key}) · disabled or unpublished',
  'pages.job.policy.global.workflow.unset': 'No approval workflow configured',
  'pages.job.policy.global.workflow.unsaved':
    'Changed; takes effect after saving',
  'pages.job.policy.global.workflow.ready': '"{name}" is ready',
  'pages.job.policy.global.workflow.unready':
    'The workflow cannot be started (disabled, unpublished or missing)',
  'pages.job.policy.global.workflow.warning':
    'Approval workflow unavailable: nothing that needs approval can be submitted.',
  'pages.job.policy.global.protectedEnvs': 'Protected environments',
  'pages.job.policy.global.protectedEnvs.extra':
    'CMDB environments (e.g. prod), Enter to add; such targets need approval (not check mode)',
  'pages.job.policy.global.protectedEnvs.rule':
    '{max} at most, up to {len} characters each',
  'pages.job.policy.global.adhocApproval': 'All quick runs need approval',
  'pages.job.policy.global.adhocApproval.extra':
    'When on, every quick run waits for approval first',
  'pages.job.policy.global.maxHosts': 'Max hosts per execution',
  'pages.job.policy.global.maxHosts.extra':
    'Targets above the limit cannot be submitted; 0 = system limit {max}',
  'pages.job.policy.global.updated': 'Updated by {name} at {time}',

  'pages.job.stats.days': 'Last (days)',
  'pages.job.stats.total': 'Executions',
  'pages.job.stats.successRate': 'Success rate',
  'pages.job.stats.avgDuration': 'Avg duration',
  'pages.job.stats.hostRuns': 'Host runs',
  'pages.job.stats.active': 'In progress',
  'pages.job.stats.runners': 'Runners online',
  'pages.job.stats.trend': 'Daily trend',
  'pages.job.stats.trend.total': 'Submitted',
  'pages.job.stats.trend.success': 'Succeeded',
  'pages.job.stats.trend.failed': 'Failed',
  'pages.job.stats.byStatus': 'By status',
  'pages.job.stats.byKind': 'By kind',
  'pages.job.stats.byTrigger': 'By trigger',
  'pages.job.stats.topTemplates': 'Most-run templates',
  'pages.job.stats.count': 'Runs',
  'pages.job.stats.failed': 'Failed',

  // Common joiners and execution host columns
  'pages.job.common.separator': '; ',
  'pages.job.common.withCode': '{name} ({code})',
  'pages.job.execution.hostCol.ok': 'ok',
  'pages.job.execution.hostCol.changed': 'changed',
  'pages.job.execution.hostCol.failed': 'failed',
  'pages.job.execution.hostCol.unreachable': 'unreachable',
  'pages.job.execution.hostCol.skipped': 'skipped',
  'pages.job.error.scheduleInvalid': 'Invalid schedule configuration',
  'pages.job.error.triggerInvalid': 'Invalid trigger configuration',
};
