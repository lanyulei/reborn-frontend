/** 值班管理：菜单 / 元素权限 / 值班日历 / 分组 / 值班表 / 公共地址 */
export default {
  // 菜单 / 元素权限
  'menu.oncall': 'On-call',
  'menu.oncall.calendar': 'Calendar',
  'menu.oncall.group': 'Groups',
  'menu.oncall.group-detail': 'Group Detail',
  'permission.oncall.calendar.override': 'Override / revoke shifts',
  'permission.oncall.calendar.share': 'Manage my public links',
  'permission.oncall.group.create': 'Create group',
  'permission.oncall.group.edit': 'Edit group',
  'permission.oncall.group.delete': 'Delete group',
  'permission.oncall.group.member': 'Manage members',
  'permission.oncall.group.schedule': 'Manage schedules',
  'permission.oncall.group.share': 'Manage public links',

  // 枚举
  'enum.oncall.memberRole.1': 'Admin',
  'enum.oncall.memberRole.2': 'Member',
  'enum.oncall.rotationUnit.1': 'day(s)',
  'enum.oncall.rotationUnit.2': 'week(s)',
  'enum.oncall.shiftRole.1': 'Primary',
  'enum.oncall.shiftRole.2': 'Backup',
  'enum.oncall.shiftRoleShort.1': 'P',
  'enum.oncall.shiftRoleShort.2': 'B',
  'enum.oncall.shiftSource.1': 'Scheduled',
  'enum.oncall.shiftSource.2': 'Override',
  'enum.oncall.issueType.1': 'No one on call',
  'enum.oncall.issueType.2': 'On-call user unavailable',
  'enum.oncall.issueType.3': 'Primary and backup are the same person',
  'enum.oncall.issueType.4': 'Double-booked across schedules',
  'enum.oncall.issueType.5': 'On call for too long in a row',
  'enum.oncall.scopeType.1': 'Group',
  'enum.oncall.scopeType.2': 'Schedule',
  'enum.oncall.scopeType.3': 'Personal',
  'enum.oncall.changeAction.group.create': 'Group created',
  'enum.oncall.changeAction.group.update': 'Group updated',
  'enum.oncall.changeAction.member.add': 'Members added',
  'enum.oncall.changeAction.member.update': 'Member role changed',
  'enum.oncall.changeAction.member.remove': 'Member removed',
  'enum.oncall.changeAction.schedule.create': 'Schedule created',
  'enum.oncall.changeAction.schedule.update': 'Schedule updated',
  'enum.oncall.changeAction.schedule.status': 'Schedule enabled / disabled',
  'enum.oncall.changeAction.schedule.delete': 'Schedule deleted',
  'enum.oncall.changeAction.schedule.notify': 'Send notification manually',
  'enum.oncall.changeAction.shift.override': 'Shift overridden',
  'enum.oncall.changeAction.shift.revoke': 'Override revoked',
  'enum.oncall.changeAction.share.create': 'Public link created',
  'enum.oncall.changeAction.share.reset': 'Public link reset',
  'enum.oncall.changeAction.share.delete': 'Public link revoked',

  // 通用
  'pages.oncall.needManager': 'Group admin required',
  'pages.oncall.issue.summary': '{count} scheduling issue(s) in this range',
  'pages.oncall.issue.more':
    '{count} more — see the dates marked red on the calendar',
  'pages.oncall.issue.other': 'conflicts with "{name}"',
  'pages.oncall.issue.otherMany':
    'conflicts with "{name}" and {count} schedules in total',

  // 值班日历
  'pages.oncall.calendar.assign.noSchedule':
    'No schedule matches the current filters. Create one in an on-call group first',
  'pages.oncall.calendar.assign.noPermission':
    'You are not a manager of the group that owns the schedule',
  'pages.oncall.calendar.assign.disabled':
    'The schedule is disabled. Enable it before assigning',
  'pages.oncall.calendar.assign.outOfRange':
    'This date is beyond the generated range (currently up to {time})',
  'pages.oncall.override.assign.primary': 'Primary',
  'pages.oncall.override.assign.backup': 'Backup',
  'pages.oncall.override.assign.same':
    'Primary and backup must be different people',
  'pages.oncall.override.assign.done': 'On-call assigned',
  'pages.oncall.override.assign.range': 'Dates',
  'pages.oncall.override.assign.remark': 'Note',
  'pages.oncall.override.assign.title': 'Assign on-call',
  'pages.oncall.calendar.today': 'This month',
  'pages.oncall.calendar.prevMonth': 'Previous month',
  'pages.oncall.calendar.nextMonth': 'Next month',
  'pages.oncall.calendar.overrideOf': 'Override, originally {name}',
  'pages.oncall.calendar.legend.issue': 'Scheduling issue',
  'pages.oncall.calendar.issueTitle': '{count} scheduling issue(s) on this day',
  'pages.oncall.duty.title': 'On call now',
  'pages.oncall.duty.nobody': 'No one',
  'pages.oncall.duty.nextHandover': 'Next handover',
  'pages.oncall.duty.noHandover': 'No upcoming shift',
  'pages.oncall.filter.group': 'Select a group',
  'pages.oncall.filter.schedule': 'Select a schedule',
  'pages.oncall.filter.user': 'Anyone',
  'pages.oncall.filter.mine': 'My shifts',
  'pages.oncall.filter.rangeLimit': 'The range cannot exceed {days} days',
  'pages.oncall.view.month': 'Month',
  'pages.oncall.view.list': 'List',

  // 班次与替班
  'pages.oncall.shift.title': 'Shift',
  'pages.oncall.shift.close': 'Close',
  'pages.oncall.shift.column.time': 'Time',
  'pages.oncall.shift.column.schedule': 'Schedule',
  'pages.oncall.shift.column.role': 'Role',
  'pages.oncall.shift.column.user': 'On call',
  'pages.oncall.shift.column.source': 'Source',
  'pages.oncall.shift.column.origin': 'Originally',
  'pages.oncall.shift.column.remark': 'Reason',
  'pages.oncall.notifyStatus.title':
    'On-call notifications cannot be delivered',
  'pages.oncall.notifyStatus.kind.1':
    'Shift reminders, substitutions and schedule issues: ',
  'pages.oncall.notifyStatus.kind.2': 'Daily digest: ',
  'pages.oncall.notifyStatus.noChannel': 'rule "{name}" has no usable channel',
  'pages.oncall.notifyStatus.noRoute': 'no notification rule matches',
  'pages.oncall.notifyStatus.configure': 'Configure',
  'pages.oncall.notify.title': 'Send notification',
  'pages.oncall.notify.titleOf': 'Send notification - {name}',
  'pages.oncall.notify.kind': 'Type',
  'pages.oncall.notify.kind.remind': 'Shift reminder',
  'pages.oncall.notify.kind.digest': 'Daily digest',
  'pages.oncall.notify.target': 'Shift',
  'pages.oncall.notify.target.current': 'Current shift',
  'pages.oncall.notify.target.next': 'Next shift',
  'pages.oncall.notify.recipients': 'Recipients',
  'pages.oncall.notify.recipients.none':
    'Nobody can be notified for this shift',
  'pages.oncall.notify.recipients.digest':
    "Decided by the notification rules (usually a group bot); the content is today's primary and backup",
  'pages.oncall.notify.hint':
    'This sends a real notification through the same rules and channels as the automatic ones. Each type can be sent manually once per minute and does not affect later automatic notifications.',
  'pages.oncall.notify.disabled':
    'The schedule is disabled, notifications cannot be sent',
  'pages.oncall.notify.send': 'Send',
  'pages.oncall.notify.confirm.title': 'Send this on-call notification?',
  'pages.oncall.notify.confirm.remind':
    'A shift reminder will be sent to {names}.',
  'pages.oncall.notify.confirm.digest':
    "Today's on-call digest will be sent by the notification rules (usually to a group).",
  'pages.oncall.notify.sent': 'Notification submitted. Delivery results:',
  'pages.oncall.notify.result.waiting': 'Waiting for the notification service…',
  'pages.oncall.notify.result.stuck':
    'The notification service has not processed it yet. Check that the service is running; see Notifications → Tracking later',
  'pages.oncall.notify.result.silenced':
    'Suppressed by a silence rule, not sent',
  'pages.oncall.notify.result.noRoute':
    'No notification rule matched, or the rule has no usable channel. Configure it in Notifications → Rules',
  'pages.oncall.notify.result.noDelivery':
    'A rule matched but nothing was queued. The recipient may have no usable address (for example no email)',
  'pages.oncall.notify.delivery.1': 'Pending',
  'pages.oncall.notify.delivery.2': 'Sending',
  'pages.oncall.notify.delivery.3': 'Sent',
  'pages.oncall.notify.delivery.4': 'Retrying',
  'pages.oncall.notify.delivery.5': 'Failed',
  'pages.oncall.override.title': 'Override',
  'pages.oncall.override.titleOf': 'Override - {name}',
  'pages.oncall.override.pickSchedule': 'Pick a schedule in the filter first',
  'pages.oncall.override.form.user': 'Covered by',
  'pages.oncall.override.form.user.tooltip':
    'Only available members of the group can be chosen',
  'pages.oncall.override.form.range': 'Dates',
  'pages.oncall.override.form.range.hint':
    'Whole days only: handover at {time} every day ({timezone}); both selected dates are included',
  'pages.oncall.override.samePerson':
    'Primary and backup must be different people: this person is already {role} on {date}',
  'pages.oncall.override.msg.created': 'Override saved',
  'pages.oncall.override.revoke': 'Revoke override',
  'pages.oncall.override.revoke.title': 'Revoke this override?',
  'pages.oncall.override.revoke.description':
    'The period goes back to the automatic schedule',
  'pages.oncall.override.msg.revoked': 'Override revoked',

  // 值班分组
  'pages.oncall.group.search.placeholder': 'Group name',
  'pages.oncall.group.search.mine': 'Scope',
  'pages.oncall.group.search.mine.only': 'Only my groups',
  'pages.oncall.group.column.name': 'Name',
  'pages.oncall.group.column.description': 'Description',
  'pages.oncall.group.column.memberCount': 'Members',
  'pages.oncall.group.column.scheduleCount': 'Schedules',
  'pages.oncall.group.column.myRole': 'My role',
  'pages.oncall.group.create.title': 'New group',
  'pages.oncall.group.edit.title': 'Edit group - {name}',
  'pages.oncall.group.delete.title': 'Delete this group?',
  'pages.oncall.group.delete.description':
    'A group that still has schedules cannot be deleted. Memberships are removed with it',
  'pages.oncall.group.notFound': 'This group does not exist or was deleted',
  'pages.oncall.group.backToList': 'Back to groups',
  'pages.oncall.group.meta.members': '{count} member(s)',
  'pages.oncall.group.meta.schedules': '{count} schedule(s)',
  'pages.oncall.group.calendar.confirm.title': 'Go to the on-call calendar?',
  'pages.oncall.group.calendar.confirm.description':
    'You will leave this group page and open the on-call calendar.',
  'pages.oncall.group.action.calendar': 'View calendar',
  'pages.oncall.group.tab.members': 'Members',
  'pages.oncall.group.tab.schedules': 'Schedules',
  'pages.oncall.group.tab.share': 'Public links',
  'pages.oncall.group.tab.logs': 'Change log',

  // 分组成员
  'pages.oncall.member.column.name': 'Name',
  'pages.oncall.member.column.username': 'Username',
  'pages.oncall.member.column.role': 'Role',
  'pages.oncall.member.column.inRotation': 'Rotation',
  'pages.oncall.member.column.joinTime': 'Joined',
  'pages.oncall.member.inRotation': 'In rotation',
  'pages.oncall.member.unavailable': 'Unavailable',
  'pages.oncall.member.unavailable.tooltip':
    'This user is disabled or has left and can no longer be on call. Update the rotations they are in',
  'pages.oncall.member.add.title': 'Add members',
  'pages.oncall.member.add.users': 'Users',
  'pages.oncall.member.add.users.tooltip':
    'Pick from active system users; search by username or nickname',
  'pages.oncall.member.add.placeholder': 'Search by username or nickname',
  'pages.oncall.member.add.joined': 'already a member',
  'pages.oncall.member.msg.added': '{count} member(s) added',
  'pages.oncall.member.action.promote': 'Make admin',
  'pages.oncall.member.action.demote': 'Make member',
  'pages.oncall.member.action.remove': 'Remove',
  'pages.oncall.member.role.title': 'Change {name} to {role}?',
  'pages.oncall.member.remove.title': 'Remove {name} from the group?',
  'pages.oncall.member.remove.description':
    'Members still in a rotation must be taken off the schedule first. A group keeps at least one admin',
  'pages.oncall.member.msg.removed': 'Member removed',

  // 值班表
  'pages.oncall.schedule.column.name': 'Name',
  'pages.oncall.schedule.column.rotation': 'Rotation',
  'pages.oncall.schedule.column.timezone': 'Time zone',
  'pages.oncall.schedule.column.members': 'People',
  'pages.oncall.schedule.column.backup': 'Backup',
  'pages.oncall.schedule.column.generatedUntil': 'Generated until',
  'pages.oncall.schedule.rotation.every': 'Every {interval} {unit}',
  'pages.oncall.schedule.unavailableCount': '{count} unavailable',
  'pages.oncall.schedule.backup.on': 'On',
  'pages.oncall.schedule.backup.off': 'Off',
  'pages.oncall.schedule.action.calendar': 'Calendar',
  'pages.oncall.schedule.action.preview': 'Preview',
  'pages.oncall.schedule.edit.title': 'Edit Schedule',
  'pages.oncall.schedule.preview.hint':
    'Computed from the current settings, excluding existing overrides; times are shown in your browser time zone ({timezone})',
  'pages.oncall.schedule.action.enable': 'Enable',
  'pages.oncall.schedule.action.disable': 'Disable',
  'pages.oncall.schedule.create.title': 'New schedule',
  'pages.oncall.schedule.disable.title': 'Disable this schedule?',
  'pages.oncall.schedule.disable.description':
    'The current shift ends now and all upcoming shifts are removed. Shifts are generated again when it is re-enabled',
  'pages.oncall.schedule.delete.title': 'Delete this schedule?',
  'pages.oncall.schedule.delete.description':
    'Its shifts are removed and its public links stop working',
  'pages.oncall.schedule.msg.saved': 'Saved. Upcoming shifts were regenerated',
  'pages.oncall.schedule.form.saveHint':
    'Saving regenerates every automatic shift that has not started. The current shift, past shifts and overrides are untouched.',
  'pages.oncall.schedule.form.reanchored':
    'The rotation list or cycle changed, so the rotation restarts: the first handover is prefilled with the end of the current shift and the starting person with whoever follows the current primary in the new list. Adjust if needed.',
  'pages.oncall.schedule.form.name.placeholder': 'e.g. Production on-call',
  'pages.oncall.schedule.form.description': 'Description',
  'pages.oncall.schedule.form.timezone.tooltip':
    "Handover and daily digest times use this zone's local time, so they do not drift across daylight-saving changes",
  'pages.oncall.schedule.form.rotation.every': 'Every',
  'pages.oncall.schedule.form.rotation.tooltip':
    'How often the person changes: 1-30 days or 1-4 weeks',
  'pages.oncall.schedule.form.anchorTime': 'First handover',
  'pages.oncall.schedule.form.anchorTime.tooltip':
    "In the schedule's time zone. Handovers repeat at this time every cycle; the starting person goes on call at this moment. Shifts are whole days, so this time of day is the daily handover time",
  'pages.oncall.schedule.form.members': 'Rotation',
  'pages.oncall.schedule.form.members.tooltip':
    'Chosen from group members; list order is rotation order. With backup on, the backup is the person after the primary',
  'pages.oncall.schedule.form.members.add': 'Add a member to the end',
  'pages.oncall.schedule.form.members.full': 'At most {max} people',
  'pages.oncall.schedule.form.members.none': 'No more group members to add',
  'pages.oncall.schedule.form.members.empty':
    'The list is empty — no one will be on call',
  'pages.oncall.schedule.form.members.required': 'Add at least one member',
  'pages.oncall.schedule.form.members.up': 'Move up',
  'pages.oncall.schedule.form.members.down': 'Move down',
  'pages.oncall.schedule.form.members.remove': 'Remove from list',
  'pages.oncall.schedule.form.startUser': 'Starting person',
  'pages.oncall.schedule.form.startUser.tooltip':
    'Who goes on call at the first handover; the list order follows from there',
  'pages.oncall.schedule.form.startUser.placeholder':
    'Defaults to the first in the list',
  'pages.oncall.schedule.form.backup.needTwo':
    'Primary and backup must be different people: add at least 2 members to enable backup',
  'pages.oncall.schedule.form.backup.tooltip':
    'Adds a backup to every shift (the person after the primary in the list)',
  'pages.oncall.schedule.form.horizonDays': 'Generate ahead',
  'pages.oncall.schedule.form.horizonDays.tooltip':
    'How many days of shifts to keep generated (7-180); topped up automatically every day',
  'pages.oncall.schedule.form.days': 'days',
  'pages.oncall.schedule.form.remind': 'Shift reminders',
  'pages.oncall.schedule.form.remind.tooltip':
    'Notify the person before their shift starts; up to {max} lead times',
  'pages.oncall.schedule.form.remind.placeholder': 'No reminder',
  'pages.oncall.schedule.form.digestTime': 'Daily digest',
  'pages.oncall.schedule.form.digestTime.tooltip':
    'Emits the oncall.daily.digest event at this time (schedule time zone) every day. Add a notification route to a chat-bot channel to receive it. Leave empty to turn off',
  'pages.oncall.schedule.form.digestTime.placeholder': 'Off',
  'pages.oncall.schedule.remind.atStart': 'At handover',
  'pages.oncall.schedule.remind.minutes': '{count} min before',
  'pages.oncall.schedule.remind.hours': '{count} h before',
  'pages.oncall.schedule.remind.days': '{count} d before',
  'pages.oncall.schedule.preview.title': 'Preview',
  'pages.oncall.schedule.preview.days': '{days} days',
  'pages.oncall.schedule.preview.empty': 'No shifts',
  'pages.oncall.schedule.preview.failed': 'Preview failed',
  'pages.oncall.schedule.preview.noIssue':
    'No scheduling issues in the preview range',

  // 公共地址
  'pages.oncall.share.mine': 'My public links',
  'pages.oncall.share.mine.hint':
    'Personal links contain only your own shifts.',
  'pages.oncall.share.scope.group': 'Whole group',
  'pages.oncall.share.scope.schedule': 'Schedule: {name}',
  'pages.oncall.share.column.name': 'Name',
  'pages.oncall.share.column.showPhone': 'Show phone',
  'pages.oncall.share.column.expireTime': 'Expires',
  'pages.oncall.share.column.lastAccessTime': 'Last accessed',
  'pages.oncall.share.column.creator': 'Created by',
  'pages.oncall.share.showPhone.on': 'Shown',
  'pages.oncall.share.showPhone.off': 'Hidden',
  'pages.oncall.share.neverExpire': 'Never',
  'pages.oncall.share.expired': 'Expired',
  'pages.oncall.share.create.title': 'New public link',
  'pages.oncall.share.form.name.placeholder':
    'e.g. Calendar for the business team',
  'pages.oncall.share.form.showPhone.tooltip':
    'Anyone with the link will see phone numbers — turn on with care',
  'pages.oncall.share.form.expireTime.tooltip':
    'Leave empty for no expiry. The link stops working when it expires',
  'pages.oncall.share.form.expireTime.past': 'The expiry must be in the future',
  'pages.oncall.share.action.view': 'View address',
  'pages.oncall.share.action.reset': 'Reset',
  'pages.oncall.share.action.revoke': 'Revoke',
  'pages.oncall.share.reset.title': 'Reset this link?',
  'pages.oncall.share.reset.description':
    'The old link stops working at once; share the new one with whoever uses it',
  'pages.oncall.share.delete.title': 'Revoke this link?',
  'pages.oncall.share.delete.description':
    'The link stops working at once and cannot be restored',
  'pages.oncall.share.msg.revoked': 'Link revoked',
  'pages.oncall.share.token.title': 'Public link - {name}',
  'pages.oncall.share.token.web': 'Web page (read-only, no sign-in)',
  'pages.oncall.share.token.hint':
    'Anyone with this address can view the calendar without signing in. Share it only with those who need it; reset it if it leaks.',

  // 变更记录
  'pages.oncall.log.column.time': 'Time',
  'pages.oncall.log.column.operator': 'Operator',
  'pages.oncall.log.column.action': 'Action',
  'pages.oncall.log.column.summary': 'Summary',

  // 公共日历页（免登录）
  'pages.oncall.public.title': 'On-call calendar',
  'pages.oncall.public.noDescription': 'No description',
  'pages.oncall.public.readonly': 'Read-only',
  'pages.oncall.public.timezone':
    "Times on this page are shown in your browser's zone ({timezone})",
  'pages.oncall.public.invalid.title': 'Link unavailable',
  'pages.oncall.public.invalid.description':
    'This public link does not exist, has expired or was revoked. Ask whoever shared it for a new one.',
  'pages.oncall.public.error.title': 'Failed to load. Please try again later',
  'pages.oncall.public.error.retry': 'Retry',
};
