/**
 * 轮转名单（表单控件，值为有序的用户 ID）：从分组成员里追加，上移 / 下移调整顺序。
 * 名单顺序即轮转顺序；不可用的成员标红提示移出。
 */
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Button, Empty, Select, Tag } from 'antd';
import type React from 'react';
import { useT } from '@/utils/i18n';
import { ONCALL_ROTATION_MEMBER_MAX } from '../components/meta';
import { useOncallStyles } from '../components/styles';

export interface RotationCandidate {
  userId: string;
  name: string;
  available: boolean;
}

export const RotationList: React.FC<{
  value?: string[];
  onChange?: (value: string[]) => void;
  /** 可选成员（分组成员 + 名单内已有的人） */
  candidates: RotationCandidate[];
  disabled?: boolean;
}> = ({ value, onChange, candidates, disabled }) => {
  const t = useT();
  const { styles } = useOncallStyles();
  const ids = value ?? [];
  const byId = new Map(candidates.map((c) => [c.userId, c]));
  const full = ids.length >= ONCALL_ROTATION_MEMBER_MAX;

  const move = (index: number, delta: number) => {
    const next = [...ids];
    const target = index + delta;
    [next[index], next[target]] = [next[target], next[index]];
    onChange?.(next);
  };

  return (
    <div>
      <Select
        showSearch={{ optionFilterProp: 'label' }}
        style={{ width: '100%' }}
        disabled={disabled || full}
        // 只作"追加"入口：选中即加入名单，自身不保留值
        value={null}
        placeholder={
          full
            ? t('pages.oncall.schedule.form.members.full', {
                max: ONCALL_ROTATION_MEMBER_MAX,
              })
            : t('pages.oncall.schedule.form.members.add')
        }
        options={candidates
          .filter((c) => c.available && !ids.includes(c.userId))
          .map((c) => ({ value: c.userId, label: c.name }))}
        onChange={(id: string | null) => {
          if (id) onChange?.([...ids, id]);
        }}
        notFoundContent={t('pages.oncall.schedule.form.members.none')}
      />
      {ids.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.oncall.schedule.form.members.empty')}
        />
      ) : (
        <div className={styles.rotationList}>
          {ids.map((id, index) => {
            const member = byId.get(id);
            return (
              <div key={id} className={styles.rotationRow}>
                <span className={styles.rotationIndex}>{index + 1}</span>
                <span className={styles.rotationName}>
                  {member?.name ?? id}
                  {member?.available === false && (
                    <Tag color="error" style={{ marginInlineStart: 8 }}>
                      {t('pages.oncall.member.unavailable')}
                    </Tag>
                  )}
                </span>
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowUpOutlined />}
                  aria-label={t('pages.oncall.schedule.form.members.up')}
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowDownOutlined />}
                  aria-label={t('pages.oncall.schedule.form.members.down')}
                  disabled={disabled || index === ids.length - 1}
                  onClick={() => move(index, 1)}
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  aria-label={t('pages.oncall.schedule.form.members.remove')}
                  disabled={disabled}
                  onClick={() => onChange?.(ids.filter((item) => item !== id))}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
