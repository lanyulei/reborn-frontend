import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { AutoComplete, Col, Form, Input, InputNumber, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useMemo, useState } from 'react';
import { useT } from '@/utils/i18n';
import NamespaceField from '../workload/NamespaceField';
import { cronScheduleOptions, isCronSchedule, NAME_PATTERN } from './helpers';

const useStyles = createStyles(({ token }) => ({
  basicFields: {
    width: '100%',

    '.ant-form-item': {
      marginBottom: token.marginLG,
    },

    '.ant-form-item-extra': {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  advancedToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    marginBottom: 12,
    padding: 0,
    border: 0,
    background: 'transparent',
    color: token.colorPrimary,
    cursor: 'pointer',
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  numberInput: {
    width: '100%',
  },
}));

const concurrencyPolicyOptions = [
  { labelId: 'pages.k8s.forms.cronjob.concurrency.allow', value: 'Allow' },
  { labelId: 'pages.k8s.forms.cronjob.concurrency.forbid', value: 'Forbid' },
  { labelId: 'pages.k8s.forms.cronjob.concurrency.replace', value: 'Replace' },
];

const CronJobBasicSettings = () => {
  const { styles } = useStyles();
  const t = useT();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  /** 快捷选项：展示「名称 + 表达式」，选中后填入表达式 */
  const scheduleQuickPicks = useMemo(
    () =>
      cronScheduleOptions.map((option) => ({
        label: t('pages.k8s.forms.cronjob.schedule.quickPick', {
          label: t(option.labelId),
          value: option.value,
        }),
        value: option.value,
      })),
    [t],
  );

  return (
    <div className={styles.basicFields}>
      <Row gutter={18}>
        <Col span={12}>
          <Form.Item
            tooltip={t('pages.k8s.forms.common.name.dnsLabel')}
            label={t('pages.k8s.forms.common.name')}
            name="name"
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.common.name.required'),
              },
              { max: 63, message: t('pages.k8s.forms.common.name.maxLength') },
              {
                pattern: NAME_PATTERN,
                message: t('pages.k8s.forms.common.name.pattern'),
              },
            ]}
          >
            <Input
              placeholder={t('pages.k8s.forms.common.name.required')}
              autoFocus
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <NamespaceField
            label={t('pages.k8s.forms.cronjob.project')}
            tooltip={t('pages.k8s.forms.cronjob.project.tip')}
          />
        </Col>
        <Col span={24}>
          <Form.Item
            tooltip={t('pages.k8s.forms.cronjob.schedule.tip')}
            label={t('pages.k8s.forms.cronjob.schedule')}
            name="schedule"
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.cronjob.schedule.required'),
              },
              {
                validator: async (_, value?: string) => {
                  if (value?.trim() && !isCronSchedule(value)) {
                    throw new Error(
                      t('pages.k8s.forms.cronjob.schedule.invalid'),
                    );
                  }
                },
              },
            ]}
          >
            <AutoComplete
              allowClear
              options={scheduleQuickPicks}
              placeholder={t('pages.k8s.forms.cronjob.schedule.placeholder')}
            />
          </Form.Item>
        </Col>
      </Row>

      <button
        className={styles.advancedToggle}
        type="button"
        onClick={() => setAdvancedOpen((open) => !open)}
      >
        <span>{t('pages.k8s.forms.common.advanced')}</span>
        {advancedOpen ? <UpOutlined /> : <DownOutlined />}
      </button>

      {advancedOpen && (
        <Row gutter={18}>
          <Col span={12}>
            <Form.Item
              tooltip={t('pages.k8s.forms.cronjob.startingDeadline.tip')}
              label={t('pages.k8s.forms.cronjob.startingDeadline')}
              name="startingDeadlineSeconds"
            >
              <InputNumber
                className={styles.numberInput}
                controls={false}
                min={0}
                placeholder={t(
                  'pages.k8s.forms.cronjob.startingDeadline.placeholder',
                )}
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              tooltip={t('pages.k8s.forms.cronjob.successfulHistory.tip')}
              label={t('pages.k8s.forms.cronjob.successfulHistory')}
              name="successfulJobsHistoryLimit"
            >
              <InputNumber
                className={styles.numberInput}
                controls={false}
                min={0}
                placeholder={t(
                  'pages.k8s.forms.cronjob.successfulHistory.placeholder',
                )}
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              tooltip={t('pages.k8s.forms.cronjob.failedHistory.tip')}
              label={t('pages.k8s.forms.cronjob.failedHistory')}
              name="failedJobsHistoryLimit"
            >
              <InputNumber
                className={styles.numberInput}
                controls={false}
                min={0}
                placeholder={t(
                  'pages.k8s.forms.cronjob.failedHistory.placeholder',
                )}
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              tooltip={t('pages.k8s.forms.cronjob.concurrency.tip')}
              label={t('pages.k8s.form.concurrency')}
              name="concurrencyPolicy"
            >
              <Select
                options={concurrencyPolicyOptions.map((option) => ({
                  label: t(option.labelId),
                  value: option.value,
                }))}
                placeholder={t('pages.k8s.forms.cronjob.concurrency.required')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              tooltip={t('pages.k8s.forms.cronjob.timeZone.tip')}
              label={t('pages.k8s.forms.cronjob.timeZone')}
              name="timeZone"
            >
              <Input
                placeholder={t('pages.k8s.forms.cronjob.timeZone.placeholder')}
              />
            </Form.Item>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default CronJobBasicSettings;
