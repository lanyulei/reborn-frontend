/**
 * 模板的 SLA 规则编辑器（表单受控，值为已启用的规则列表）：每个优先级一行，勾选后配置
 * 响应时限 / 解决时限。同一行的两个时限共用「按工作时间」开关。
 */
import { Checkbox, Flex, InputNumber, Select, Typography } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import type {
  SlaDuration,
  SlaRule,
  TicketPriority,
} from '@/services/ticket/typings';
import { useT } from '@/utils/i18n';
import {
  TICKET_PRIORITY_META,
  TICKET_PRIORITY_ORDER,
} from '../components/meta';

/** 时限数值上限（折合不超过一年，由后端最终校验） */
const VALUE_MAX = 100000;
const UNITS: readonly SlaDuration['unit'][] = ['minute', 'hour', 'day'];
/** 折合分钟（天按 24 小时），用于比较同一行的两个时限 */
const minutes = (d: SlaDuration) =>
  d.value * (d.unit === 'day' ? 1440 : d.unit === 'hour' ? 60 : 1);

const useStyles = createStyles(({ token, css }) => ({
  row: css`
    display: grid;
    grid-template-columns: 88px 1fr 1fr 104px;
    gap: 12px;
    align-items: center;
    min-height: 32px;
  `,
  head: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
}));

/** 规则是否自洽：至少配置一个时限 */
export const slaRuleComplete = (rule: SlaRule): boolean =>
  !!rule.response || !!rule.resolve;

/** 解决时限是否短于响应时限（同一日历下才可比） */
export const slaRuleInverted = (rule: SlaRule): boolean =>
  !!rule.response &&
  !!rule.resolve &&
  !!rule.response.workTime === !!rule.resolve.workTime &&
  minutes(rule.resolve) < minutes(rule.response);

const DurationInput: React.FC<{
  value?: SlaDuration;
  workTime: boolean;
  disabled?: boolean;
  label: string;
  onChange: (value?: SlaDuration) => void;
}> = ({ value, workTime, disabled, label, onChange }) => {
  const t = useT();
  return (
    <Flex gap={8}>
      <InputNumber
        style={{ flex: 1, minWidth: 0 }}
        min={1}
        max={VALUE_MAX}
        precision={0}
        disabled={disabled}
        value={value?.value}
        placeholder={t('pages.ticket.sla.unset')}
        aria-label={label}
        onChange={(v) =>
          onChange(
            v == null
              ? undefined
              : { value: v, unit: value?.unit ?? 'hour', workTime },
          )
        }
      />
      <Select
        style={{ width: 84 }}
        disabled={disabled || !value}
        value={value?.unit ?? 'hour'}
        aria-label={t('pages.ticket.sla.unit')}
        options={UNITS.map((unit) => ({
          value: unit,
          label: t(`pages.ticket.sla.unit.${unit}`),
        }))}
        onChange={(unit: SlaDuration['unit']) =>
          value && onChange({ ...value, unit })
        }
      />
    </Flex>
  );
};

export const SlaEditor: React.FC<{
  value?: SlaRule[];
  onChange?: (value: SlaRule[]) => void;
}> = ({ value, onChange }) => {
  const { styles, cx } = useStyles();
  const t = useT();
  const rules = value ?? [];

  const setRule = (priority: TicketPriority, rule?: SlaRule) =>
    onChange?.(
      [...rules.filter((r) => r.priority !== priority), ...(rule ? [rule] : [])]
        // 按优先级排序，保存的内容与界面顺序一致
        .sort((a, b) => a.priority - b.priority),
    );

  return (
    <Flex vertical gap={8}>
      <div className={cx(styles.row, styles.head)}>
        <span>{t('pages.ticket.column.priority')}</span>
        <span>{t('pages.ticket.sla.response')}</span>
        <span>{t('pages.ticket.sla.resolve')}</span>
        <span />
      </div>
      {TICKET_PRIORITY_ORDER.map((priority) => {
        const rule = rules.find((r) => r.priority === priority);
        const workTime = !!(rule?.response ?? rule?.resolve)?.workTime;
        return (
          <div key={priority} className={styles.row}>
            <Checkbox
              checked={!!rule}
              onChange={(e) =>
                setRule(
                  priority,
                  e.target.checked
                    ? {
                        priority,
                        resolve: { value: 1, unit: 'day', workTime: true },
                      }
                    : undefined,
                )
              }
            >
              {t(TICKET_PRIORITY_META[priority].textId)}
            </Checkbox>
            <DurationInput
              label={t('pages.ticket.sla.response')}
              value={rule?.response}
              workTime={workTime}
              disabled={!rule}
              onChange={(response) =>
                rule && setRule(priority, { ...rule, response })
              }
            />
            <DurationInput
              label={t('pages.ticket.sla.resolve')}
              value={rule?.resolve}
              workTime={workTime}
              disabled={!rule}
              onChange={(resolve) =>
                rule && setRule(priority, { ...rule, resolve })
              }
            />
            <Checkbox
              checked={workTime}
              // 两项时限都还没填时没有可标记的对象，勾了也不会生效
              disabled={!rule?.response && !rule?.resolve}
              onChange={(e) =>
                rule &&
                setRule(priority, {
                  priority,
                  response: rule.response && {
                    ...rule.response,
                    workTime: e.target.checked,
                  },
                  resolve: rule.resolve && {
                    ...rule.resolve,
                    workTime: e.target.checked,
                  },
                })
              }
            >
              {t('pages.ticket.sla.workTime')}
            </Checkbox>
          </div>
        );
      })}
      <Typography.Text type="secondary">
        {t('pages.ticket.sla.hint')}
      </Typography.Text>
    </Flex>
  );
};

export default SlaEditor;
