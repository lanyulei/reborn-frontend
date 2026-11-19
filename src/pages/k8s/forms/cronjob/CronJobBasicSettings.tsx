import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { AutoComplete, Col, Form, Input, InputNumber, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
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

/** 快捷选项：展示「名称 + 表达式」，选中后填入表达式 */
const scheduleQuickPicks = cronScheduleOptions.map((option) => ({
  label: `${option.label}（${option.value}）`,
  value: option.value,
}));

const concurrencyPolicyOptions = [
  { label: '允许并发运行', value: 'Allow' },
  { label: '跳过新任务', value: 'Forbid' },
  { label: '替换旧任务', value: 'Replace' },
];

const CronJobBasicSettings = () => {
  const { styles } = useStyles();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className={styles.basicFields}>
      <Row gutter={18}>
        <Col span={12}>
          <Form.Item
            tooltip="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符"
            label="名称"
            name="name"
            rules={[
              { required: true, message: '请输入名称' },
              { max: 63, message: '名称最长 63 个字符' },
              {
                pattern: NAME_PATTERN,
                message:
                  '名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
              },
            ]}
          >
            <Input placeholder="请输入名称" autoFocus />
          </Form.Item>
        </Col>
        <Col span={12}>
          <NamespaceField
            label="项目"
            tooltip="项目用于对资源进行分组管理和控制不同用户的资源管理权限"
          />
        </Col>
        <Col span={24}>
          <Form.Item
            tooltip="为定时任务设置定时计划。Kubernetes 会按 CronJob 的时区设置解析该计划"
            label="定时计划"
            name="schedule"
            rules={[
              { required: true, message: '请选择或输入定时计划' },
              {
                validator: async (_, value?: string) => {
                  if (value?.trim() && !isCronSchedule(value)) {
                    throw new Error(
                      '请输入合法的 cron 表达式，例如 */5 * * * * 或 @hourly',
                    );
                  }
                },
              },
            ]}
          >
            <AutoComplete
              allowClear
              options={scheduleQuickPicks}
              placeholder="请选择或输入 cron 表达式，例如 */5 * * * *"
            />
          </Form.Item>
        </Col>
      </Row>

      <button
        className={styles.advancedToggle}
        type="button"
        onClick={() => setAdvancedOpen((open) => !open)}
      >
        <span>高级设置</span>
        {advancedOpen ? <UpOutlined /> : <DownOutlined />}
      </button>

      {advancedOpen && (
        <Row gutter={18}>
          <Col span={12}>
            <Form.Item
              tooltip="由于某种原因未能按计划启动任务时，任务启动的最大延迟时间"
              label="最大启动延后时间（s）"
              name="startingDeadlineSeconds"
            >
              <InputNumber
                className={styles.numberInput}
                controls={false}
                min={0}
                placeholder="请输入最大启动延后时间"
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              tooltip="允许保留的成功任务的个数。默认值为 3"
              label="成功任务保留数量"
              name="successfulJobsHistoryLimit"
            >
              <InputNumber
                className={styles.numberInput}
                controls={false}
                min={0}
                placeholder="请输入成功任务保留数量"
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              tooltip="允许保留的失败任务的个数。默认值为 1"
              label="失败任务保留数量"
              name="failedJobsHistoryLimit"
            >
              <InputNumber
                className={styles.numberInput}
                controls={false}
                min={0}
                placeholder="请输入失败任务保留数量"
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              tooltip="定时任务创建的多个任务发生重叠时，系统采取的策略"
              label="并发策略"
              name="concurrencyPolicy"
            >
              <Select
                options={concurrencyPolicyOptions}
                placeholder="请选择并发策略"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              tooltip="对应 Kubernetes CronJob 的 spec.timeZone。不填写时由集群控制器使用默认时区"
              label="时区"
              name="timeZone"
            >
              <Input placeholder="例如 Asia/Shanghai" />
            </Form.Item>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default CronJobBasicSettings;
