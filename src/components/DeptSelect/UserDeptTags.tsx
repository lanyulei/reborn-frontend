/**
 * 用户所属部门标签：主部门在前；属于多个部门时主部门以主色标出（只属于一个
 * 部门时无需区分）。无部门显示占位符。
 */
import { Space, Tag, Tooltip } from 'antd';
import type React from 'react';
import type { UserDept } from '@/services/system/typings';
import { useT } from '@/utils/i18n';

export const UserDeptTags: React.FC<{ depts?: readonly UserDept[] }> = ({
  depts,
}) => {
  const t = useT();
  if (!depts?.length) return <>{t('common.empty')}</>;
  const multiple = depts.length > 1;
  return (
    <Space size={[4, 4]} wrap>
      {depts.map((item) =>
        item.isPrimary && multiple ? (
          <Tooltip key={item.id} title={t('component.userDeptTags.primary')}>
            <Tag color="blue">{item.name}</Tag>
          </Tooltip>
        ) : (
          <Tag key={item.id}>{item.name}</Tag>
        ),
      )}
    </Space>
  );
};

export default UserDeptTags;
