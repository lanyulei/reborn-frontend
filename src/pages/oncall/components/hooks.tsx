/**
 * 值班页面共享 hook / 小组件：异常文案、受限操作链接、人员显示名。
 */
import { Tooltip, Typography } from 'antd';
import type React from 'react';
import { useCallback } from 'react';
import type { OncallShiftIssue } from '@/services/oncall/typings';
import { useT } from '@/utils/i18n';
import { ONCALL_ISSUE_TYPE_META } from './meta';
import { formatRange } from './time';

/** 显示名：昵称优先，回落登录名 */
export const displayName = (user: {
  nickname?: string;
  username?: string;
}): string => user.nickname || user.username || '';

/** 排班异常 → 一句话说明（类型 + 值班表 + 相关人 + 时间段） */
export const useIssueText = () => {
  const t = useT();
  return useCallback(
    (issue: OncallShiftIssue) => {
      // 后端新增、前端未收录的异常类型：回退显示原始类型码，而不是对空键取文案白屏
      const meta = ONCALL_ISSUE_TYPE_META[issue.type];
      const parts = [meta ? t(meta.textId) : String(issue.type)];
      const subject = [issue.scheduleName, issue.userName]
        .filter(Boolean)
        .join(' · ');
      if (subject) parts.push(subject);
      if (issue.otherScheduleName) {
        const others = issue.otherScheduleCount ?? 1;
        parts.push(
          others > 1
            ? t('pages.oncall.issue.otherMany', {
                name: issue.otherScheduleName,
                count: others,
              })
            : t('pages.oncall.issue.other', { name: issue.otherScheduleName }),
        );
      }
      parts.push(formatRange(issue.startTime, issue.endTime));
      return parts.join(' | ');
    },
    [t],
  );
};

/**
 * 操作链接：元素权限决定是否渲染（调用方判断），分组身份决定是否可用——
 * 不可管理时置灰并提示「需要分组管理员」。
 */
export const ManageLink: React.FC<{
  canManage?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ canManage, onClick, children }) => {
  const t = useT();
  if (canManage) return <a onClick={onClick}>{children}</a>;
  return (
    <Tooltip title={t('pages.oncall.needManager')}>
      <Typography.Link disabled>{children}</Typography.Link>
    </Tooltip>
  );
};
