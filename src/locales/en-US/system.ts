/** System domain pages (users / roles / permissions / config / login log / account / header widgets) */
export default {
  // Users
  'pages.system.user.create.title': 'Create user',
  'pages.system.user.edit.title': 'Edit user: {name}',
  'pages.system.user.search.placeholder': 'Username / nickname / email / phone',
  'pages.system.user.column.username': 'Username',
  'pages.system.user.column.nickname': 'Nickname',
  'pages.system.user.column.email': 'Email',
  'pages.system.user.column.phone': 'Phone',
  'pages.system.user.column.gender': 'Gender',
  'pages.system.user.column.isAdmin': 'Admin',
  'pages.system.user.tag.superAdmin': 'Super admin',
  'pages.system.user.tag.normal': 'Regular user',
  'pages.system.user.action.resetPassword': 'Reset password',
  'pages.system.user.action.bindRoles': 'Role binding',
  'pages.system.user.action.changeStatus': 'Change status',
  'pages.system.user.action.more': 'More',
  'pages.system.user.statusChange.title': 'Change user status',
  'pages.system.user.statusChange.content':
    'Change the status of "{name}" to "{status}"?',
  'pages.system.user.statusChange.success': 'Status changed',
  'pages.system.user.delete.title': 'Delete user',
  'pages.system.user.delete.content':
    'All role bindings of this user will be removed as well. Delete?',
  'pages.system.user.form.username.rule':
    '3-64 letters, digits, underscores or hyphens',
  'pages.system.user.form.password': 'Password',
  'pages.system.user.form.password.placeholder': '8-64 characters',
  'pages.system.user.form.newPassword': 'New password',
  'pages.system.user.form.confirmPassword': 'Confirm password',
  'pages.system.user.form.confirmPassword.placeholder':
    'Enter the password again',
  'pages.system.user.form.confirmPassword.required':
    'Please enter the password again',
  'pages.system.user.form.confirmPassword.mismatch': 'Passwords do not match',
  'pages.system.user.reset.title': 'Reset password: {name}',
  'pages.system.user.reset.submit': 'Reset',
  'pages.system.user.reset.success': 'Password has been reset',
  'pages.system.user.roles.title': 'Role binding: {name}',
  'pages.system.user.roles.label': 'Bound roles',
  'pages.system.user.roles.placeholder': 'Select roles (up to 100)',
  'pages.system.user.roles.option': '{name} ({code})',
  'pages.system.user.roles.success': 'Role binding saved',

  // Roles
  'pages.system.role.create.title': 'Create role',
  'pages.system.role.edit.title': 'Edit role: {name}',
  'pages.system.role.search.placeholder': 'Role name / code',
  'pages.system.role.column.name': 'Role name',
  'pages.system.role.column.code': 'Role code',
  'pages.system.role.action.permission': 'Permissions',
  'pages.system.role.delete.title': 'Delete role',
  'pages.system.role.delete.description':
    'All users bound to this role will be unbound as well. Delete?',
  'pages.system.role.form.code.placeholder':
    '2-64 lowercase letters, digits or underscores; immutable after creation',
  'pages.system.role.form.code.pattern':
    '2-64 lowercase letters, digits or underscores',
  'pages.system.role.form.code.tooltip':
    'The code cannot be changed after creation',
  'pages.system.role.bizScope.label': 'Notify business scope',
  'pages.system.role.bizScope.tooltip':
    'Restricts which notify businesses (biz) this role can manage; leave empty for unrestricted. Multiple roles are unioned; any unrestricted role means unrestricted',
  'pages.system.role.bizScope.placeholder':
    'Type a biz id and press Enter; leave empty for unrestricted',
  'pages.system.role.bizScope.max': 'At most 64 items',
  'pages.system.role.bizScope.duplicate': 'Items must be unique',
  'pages.system.role.bizScope.pattern':
    '1-64 lowercase letters, digits, underscores or hyphens',
  'pages.system.role.bizScope.unlimited': 'Unrestricted',

  // Account settings
  'pages.account.base.success': 'Basic information updated',
  'pages.account.base.submit': 'Update information',
  'pages.account.base.nickname.required': 'Please enter your nickname!',
  'pages.account.base.email.invalid': 'Invalid email address!',
  'pages.account.security.modify': 'Change',
  'pages.account.security.password.title': 'Account password',
  'pages.account.security.password.desc':
    'Changing your password regularly keeps your account safe',
  'pages.account.security.phone.title': 'Security phone',
  'pages.account.security.phone.bound': 'Bound phone: {phone}',
  'pages.account.security.phone.unbound':
    'No phone bound; you can add one in Basic settings',
  'pages.account.security.email.title': 'Backup email',
  'pages.account.security.email.bound': 'Bound email: {email}',
  'pages.account.security.email.unbound':
    'No email bound; you can add one in Basic settings',
  'pages.account.security.changePassword.title': 'Change password',
  'pages.account.security.changePassword.submit': 'Confirm',
  'pages.account.security.changePassword.success': 'Password changed',
  'pages.account.menu.base': 'Basic settings',
  'pages.account.menu.security': 'Security settings',

  // Login log
  'pages.system.loginLog.column.result': 'Result',
  'pages.system.loginLog.column.ip': 'IP address',
  'pages.system.loginLog.column.loginTime': 'Login time',

  // Role permissions
  'pages.system.permission.tab.elements': 'Page elements',
  'pages.system.permission.tab.apis': 'API permissions',
  'pages.system.permission.desc.elements':
    'Check the actions allowed on this page; leaving all unchecked grants read-only access.',
  'pages.system.permission.desc.apis':
    'Checking grants the API directly; APIs linked to checked menus/elements are locked and unlock once those are unchecked.',
  'pages.system.permission.tip.noApis': 'No API bound to this element',
  'pages.system.permission.tip.apis': 'APIs linked to this element:',
  'pages.system.permission.tip.apiPath': 'Path: {path}',
  'pages.system.permission.tip.apiMethod': 'Method: {method}',
  'pages.system.permission.origin.menuDefault': 'Page default',
  'pages.system.permission.origin.menuDefaultOf': 'Page default · {name}',
  'pages.system.permission.save.title': 'Save permissions',
  'pages.system.permission.save.content':
    "The current selection will fully replace this role's permissions. Save?",
  'pages.system.permission.saved': 'Permissions saved',

  // System config
  'pages.system.config.readonly':
    'Your role is not granted "Edit system config"; the content below is read-only.',
  'pages.system.config.submit': 'Save config',
  'pages.system.config.saved': 'System config saved',
  'pages.system.config.title.label': 'System title',
  'pages.system.config.title.placeholder':
    'Shown in the header, browser tab and login page; leave empty for the default',
  'pages.system.config.subTitle.label': 'System subtitle',
  'pages.system.config.subTitle.placeholder':
    'Small text next to the title; leave empty to hide',
  'pages.system.config.logo.label': 'System logo',
  'pages.system.config.logo.mode.url': 'Image URL',
  'pages.system.config.logo.mode.upload': 'Upload',
  'pages.system.config.logo.preview': 'Logo preview',
  'pages.system.config.logo.urlPlaceholder':
    'https://example.com/logo.svg; leave empty for the default logo',
  'pages.system.config.logo.uploadButton': 'Upload image',
  'pages.system.config.logo.hint':
    'PNG/JPEG/SVG/WebP/ICO, ≤2MB; takes effect after saving the config',
  'pages.system.config.logo.unsupported':
    'Unsupported image type {type}; only PNG/JPEG/SVG/WebP/ICO are allowed',
  'pages.system.config.logo.unknownType': '(unknown)',
  'pages.system.config.logo.tooLarge': 'Image must not exceed 2MB',
  'pages.system.config.logo.uploaded':
    'Logo uploaded; save the config to apply it',
  'pages.system.config.logo.uploadFailed': 'Upload failed, please retry',
  'pages.system.config.footer.label': 'Footer text',
  'pages.system.config.footer.placeholder':
    'Copyright/description shown at the bottom; leave empty for the default',

  // Header / assistant
  'component.avatar.settings': 'Account settings',
  'component.avatar.logout': 'Sign out',
  'component.avatar.logout.confirm': 'Are you sure you want to sign out?',
  'component.chat.title': 'Assistant',
  'component.chat.welcome': '🤖 Hi, how can I help you?',
  'component.chat.newConversation': '💬 New chat',
  'component.chat.newConversationPlain': 'New chat',
  'component.chat.create': 'New chat',
  'component.chat.group.today': 'Today',
  'component.chat.group.yesterday': 'Yesterday',
  'component.chat.group.earlier': 'Earlier',
  'component.chat.placeholder': 'Type a message and press Enter to send...',
  'component.chat.thinking': 'Thinking',
  'component.chat.steps': 'Steps',
  'component.chat.pendingNotice':
    'An action is waiting for confirmation; sending a new message cancels it.',
  'component.chat.confirm.title':
    'This action modifies data. Review and confirm to run it.',
  'component.chat.confirm.approve': 'Confirm',
  'component.chat.confirm.reject': 'Reject',
  'component.chat.step.input': 'Input',
  'component.chat.step.output': 'Result',
  'component.chat.step.pending': 'Awaiting confirmation',
  'component.chat.step.approved': 'Running',
  'component.chat.step.rejected': 'Rejected',
  'component.chat.step.denied': 'Permission denied',
  'component.chat.step.succeeded': 'Done',
  'component.chat.step.failed': 'Failed',
  'component.chat.step.cancelled': 'Cancelled',
  'component.chat.error.disabled':
    'The assistant is not configured yet. Please contact an administrator.',
  'component.chat.error.busy':
    'This conversation is still replying. Please try again later.',
  'component.chat.error.notPending': 'This action has already been handled.',
  'component.chat.error.generic': 'Assistant request failed. Please retry.',
  'component.chat.error.loadFailed': 'Failed to load conversation',
  'component.chat.deleteConfirm': 'Delete this conversation?',
  'component.chat.stopped': 'Stopped',

  // Request errors (requestErrorConfig / request.ts)
  'app.request.httpFailed': 'Request failed (HTTP {status})',
  'app.request.retry': 'Request failed, please retry',
  'app.request.noResponse': 'None response! Please retry.',
  'app.request.error': 'Request error, please retry.',
};
