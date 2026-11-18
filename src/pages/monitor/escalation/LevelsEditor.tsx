/**
 * 升级策略的「各级」编辑器（受控组件，放进 Form.Item）：每级一张卡片 = 触发条件 + 通知对象四类
 * （值班表可逐张指定仅备班、值班分组通知其管理员、部门负责人可指定向上几级、指定用户）+ 重复提醒。
 * 配套校验见 levels.ts 的 levelError；候选项与已保存对象的显示名由抽屉取好传入。
 */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, InputNumber, Select } from 'antd';
import type React from 'react';
import { DeptSelect } from '@/components/DeptSelect';
import { type UserOption, UserSelect } from '@/components/UserSelect';
import { fetchMonitorUsers } from '@/components/UserSelect/sources';
import type { MonitorEscalationTrigger } from '@/services/monitor/typings';
import type { SystemDept } from '@/services/system/typings';
import { useOptions, useT } from '@/utils/i18n';
import {
  ESCALATION_TRIGGER_META,
  ESCALATION_TRIGGER_ORDER,
} from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { ESCALATION_LIMITS, type LevelValue, nextLevel } from './levels';
import { useEscalationStyles } from './styles';

type Option = { value: string; label: string };

export interface LevelsEditorProps {
  value?: LevelValue[];
  onChange?: (value: LevelValue[]) => void;
  /** 值班表 / 值班分组候选（已并入已保存但不在候选里的项） */
  scheduleOptions: readonly Option[];
  oncallGroupOptions: readonly Option[];
  /** 部门候选与已保存部门的显示名 */
  depts: readonly SystemDept[];
  knownDepts: readonly { id: string; name: string }[];
  /** 已保存用户的显示名 */
  knownUsers: readonly UserOption[];
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => {
  const { styles } = useEscalationStyles();
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.fieldBody}>{children}</div>
    </div>
  );
};

export const LevelsEditor: React.FC<LevelsEditorProps> = ({
  value,
  onChange,
  scheduleOptions,
  oncallGroupOptions,
  depts,
  knownDepts,
  knownUsers,
}) => {
  const t = useT();
  const { styles } = useEscalationStyles();
  const { styles: shared } = useMonitorStyles();
  const triggerOptions = useOptions(
    ESCALATION_TRIGGER_META,
    ESCALATION_TRIGGER_ORDER,
  );
  const levels = value ?? [];
  const upOptions = Array.from(
    { length: ESCALATION_LIMITS.deptUpMax + 1 },
    (_, up) => ({
      value: up,
      label: up
        ? t('pages.monitor.escalation.level.dept.up', { n: up })
        : t('pages.monitor.escalation.level.dept.self'),
    }),
  );

  const update = (index: number, patch: Partial<LevelValue>) =>
    onChange?.(
      levels.map((level, i) => (i === index ? { ...level, ...patch } : level)),
    );

  return (
    <div>
      {levels.map((level, index) => {
        const schedules = level.schedules ?? [];
        const levelDepts = level.depts ?? [];
        const previous = index > 0 ? levels[index - 1].afterM : undefined;
        // 各级须严格递增：填错当场标红（保存时另有校验文案）
        const notIncreasing =
          typeof level.afterM === 'number' &&
          typeof previous === 'number' &&
          level.afterM <= previous;
        return (
          <Card
            // biome-ignore lint/suspicious/noArrayIndexKey: 各级无稳定标识，按位置编辑
            key={index}
            size="small"
            className={styles.levelCard}
            title={t('pages.monitor.escalation.level.title', { n: index + 1 })}
            extra={
              levels.length > 1 && (
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  aria-label={t('pages.monitor.escalation.level.remove')}
                  onClick={() =>
                    onChange?.(levels.filter((_, i) => i !== index))
                  }
                />
              )
            }
          >
            <Field label={t('pages.monitor.escalation.level.trigger')}>
              <div className={styles.inline}>
                <Select<MonitorEscalationTrigger>
                  style={{ width: 160 }}
                  value={level.trigger}
                  options={triggerOptions}
                  placeholder={t('pages.monitor.escalation.level.trigger')}
                  onChange={(trigger) => update(index, { trigger })}
                />
                <InputNumber
                  style={{ width: 160 }}
                  min={ESCALATION_LIMITS.afterM.min}
                  max={ESCALATION_LIMITS.afterM.max}
                  precision={0}
                  status={notIncreasing ? 'error' : undefined}
                  value={level.afterM}
                  suffix={t('pages.monitor.unit.minute')}
                  aria-label={t('pages.monitor.escalation.level.afterM')}
                  onChange={(afterM) => update(index, { afterM })}
                />
                <span className={shared.hint}>
                  {t('pages.monitor.escalation.level.afterM.hint')}
                </span>
              </div>
            </Field>

            <Field label={t('pages.monitor.common.schedules')}>
              {schedules.map((schedule, row) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 行无稳定标识，按位置编辑
                <div key={row} className={shared.editorRow}>
                  <Select
                    style={{ flex: 1, minWidth: 0 }}
                    showSearch={{ optionFilterProp: 'label' }}
                    value={schedule.id}
                    // 同一张值班表在一级里只能出现一次
                    options={scheduleOptions.map((option) => ({
                      ...option,
                      disabled: schedules.some(
                        (other, i) => i !== row && other.id === option.value,
                      ),
                    }))}
                    placeholder={t(
                      'pages.monitor.common.schedules.placeholder',
                    )}
                    onChange={(id: string) =>
                      update(index, {
                        schedules: schedules.map((item, i) =>
                          i === row ? { ...item, id } : item,
                        ),
                      })
                    }
                  />
                  <Checkbox
                    style={{ lineHeight: '32px', flex: 'none' }}
                    checked={schedule.backupOnly === true}
                    onChange={(e) =>
                      update(index, {
                        schedules: schedules.map((item, i) =>
                          i === row
                            ? { ...item, backupOnly: e.target.checked }
                            : item,
                        ),
                      })
                    }
                  >
                    {t('pages.monitor.escalation.level.backupOnly')}
                  </Checkbox>
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    aria-label={t('pages.monitor.editor.remove')}
                    onClick={() =>
                      update(index, {
                        schedules: schedules.filter((_, i) => i !== row),
                      })
                    }
                  />
                </div>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                disabled={schedules.length >= ESCALATION_LIMITS.targetMax}
                onClick={() =>
                  update(index, {
                    schedules: [...schedules, { backupOnly: false }],
                  })
                }
              >
                {t('pages.monitor.escalation.level.schedule.add')}
              </Button>
            </Field>

            <Field label={t('pages.monitor.escalation.level.oncallGroups')}>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                maxCount={ESCALATION_LIMITS.targetMax}
                showSearch={{ optionFilterProp: 'label' }}
                value={level.oncallGroupIds ?? []}
                options={[...oncallGroupOptions]}
                placeholder={t(
                  'pages.monitor.escalation.level.oncallGroups.placeholder',
                )}
                onChange={(oncallGroupIds: string[]) =>
                  update(index, { oncallGroupIds })
                }
              />
            </Field>

            <Field label={t('pages.monitor.escalation.level.depts')}>
              {levelDepts.map((dept, row) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 行无稳定标识，按位置编辑
                <div key={row} className={shared.editorRow}>
                  <DeptSelect
                    style={{ flex: 1, minWidth: 0 }}
                    allowClear={false}
                    depts={depts}
                    knownDepts={knownDepts}
                    value={dept.id}
                    placeholder={t(
                      'pages.monitor.escalation.level.depts.placeholder',
                    )}
                    onChange={(id) =>
                      update(index, {
                        depts: levelDepts.map((item, i) =>
                          i === row ? { ...item, id: id as string } : item,
                        ),
                      })
                    }
                  />
                  <Select<number>
                    style={{ width: 190, flex: 'none' }}
                    value={dept.up ?? 0}
                    options={upOptions}
                    aria-label={t(
                      'pages.monitor.escalation.level.dept.upLabel',
                    )}
                    onChange={(up) =>
                      update(index, {
                        depts: levelDepts.map((item, i) =>
                          i === row ? { ...item, up } : item,
                        ),
                      })
                    }
                  />
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    aria-label={t('pages.monitor.editor.remove')}
                    onClick={() =>
                      update(index, {
                        depts: levelDepts.filter((_, i) => i !== row),
                      })
                    }
                  />
                </div>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                disabled={levelDepts.length >= ESCALATION_LIMITS.targetMax}
                onClick={() =>
                  update(index, { depts: [...levelDepts, { up: 0 }] })
                }
              >
                {t('pages.monitor.escalation.level.dept.add')}
              </Button>
            </Field>

            <Field label={t('pages.monitor.common.users')}>
              <UserSelect
                multiple
                style={{ width: '100%' }}
                maxCount={ESCALATION_LIMITS.targetMax}
                fetchUsers={fetchMonitorUsers}
                knownUsers={knownUsers}
                value={level.userIds ?? []}
                placeholder={t('pages.monitor.common.users.placeholder')}
                onChange={(userIds) =>
                  update(index, { userIds: (userIds as string[]) ?? [] })
                }
              />
            </Field>

            <Field label={t('pages.monitor.escalation.level.repeat')}>
              <div className={styles.inline}>
                <InputNumber
                  style={{ width: 160 }}
                  min={0}
                  max={ESCALATION_LIMITS.repeatInterval.max}
                  precision={0}
                  value={level.repeatIntervalM}
                  suffix={t('pages.monitor.unit.minute')}
                  aria-label={t('pages.monitor.escalation.level.repeat')}
                  onChange={(repeatIntervalM) =>
                    update(index, { repeatIntervalM })
                  }
                />
                <span className={shared.hint}>
                  {t('pages.monitor.escalation.level.repeat.hint')}
                </span>
              </div>
            </Field>
            <Field label={t('pages.monitor.escalation.level.maxNotify')}>
              <div className={styles.inline}>
                <InputNumber
                  style={{ width: 160 }}
                  min={ESCALATION_LIMITS.maxNotify.min}
                  max={ESCALATION_LIMITS.maxNotify.max}
                  precision={0}
                  value={level.maxNotify}
                  suffix={t('pages.monitor.escalation.level.maxNotify.unit')}
                  aria-label={t('pages.monitor.escalation.level.maxNotify')}
                  onChange={(maxNotify) => update(index, { maxNotify })}
                />
                <span className={shared.hint}>
                  {t('pages.monitor.escalation.level.maxNotify.hint')}
                </span>
              </div>
            </Field>
          </Card>
        );
      })}
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        disabled={levels.length >= ESCALATION_LIMITS.levelMax}
        onClick={() => onChange?.([...levels, nextLevel(levels)])}
      >
        {t('pages.monitor.escalation.level.add')}
      </Button>
    </div>
  );
};

export default LevelsEditor;
