/**
 * 定时作业：按 Cron 表达式以固定参数执行作业模板。以负责人（创建人，编辑 / 启停后为操作人）的身份提交，
 * 目标主机按负责人的 CMDB 数据范围解析；模板须审批或目标含受保护环境时，每次触发都产生一条「待审批」的执行。
 */
import { DownOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Link, useAccess, useSearchParams } from '@umijs/max';
import {
  Alert,
  App,
  Badge,
  Button,
  Col,
  Dropdown,
  Form,
  Input,
  Space,
  Spin,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { SectionTitle } from '@/components/SectionTitle';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { ENABLED_META } from '@/constants';
import { FULL, HALF } from '@/constants/layout';
import { getJobErrorMessage } from '@/services/job/request';
import {
  createJobSchedule,
  deleteJobSchedule,
  listJobSchedules,
  previewJobSchedule,
  updateJobSchedule,
} from '@/services/job/schedule';
import type {
  JobMisfire,
  JobParam,
  JobSchedule,
  JobScheduleSpec,
} from '@/services/job/typings';
import { usePermissions } from '@/services/system/permissions';
import {
  useFormRules,
  useOptions,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { formatTime } from '../components/format';
import { AUTOMATION_TABS } from '../components/groups';
import { JOB_LIMITS, MISFIRE_META, MISFIRE_ORDER } from '../components/meta';
import {
  collectParamValues,
  type ParamValues,
} from '../components/ParamFields';
import { useJobStyles } from '../components/styles';
import { TemplateParams } from '../components/TemplateParams';
import { TemplateSelect } from '../components/TemplateSelect';
import { CodeText } from '../components/tags';

const PREVIEW_DEBOUNCE_MS = 400;

/** 常用 Cron 表达式 */
const CRON_PRESETS: [textId: string, cron: string][] = [
  ['pages.job.schedule.preset.every5m', '*/5 * * * *'],
  ['pages.job.schedule.preset.hourly', '0 * * * *'],
  ['pages.job.schedule.preset.daily', '0 3 * * *'],
  ['pages.job.schedule.preset.weekly', '0 3 * * 1'],
  ['pages.job.schedule.preset.monthly', '0 3 1 * *'],
];

/** 常用时区；浏览器时区不在其中时补在最前 */
const COMMON_TIMEZONES = [
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Tokyo',
  'Asia/Singapore',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
];
const browserTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';

interface ScheduleFormValues {
  name: string;
  templateId?: string;
  cron: string;
  timezone: string;
  params?: ParamValues;
  misfire: JobMisfire;
  enabled?: boolean;
  description?: string;
}

/** Cron 输入（受控）：等宽输入框 + 常用表达式下拉 */
const CronInput: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value, onChange }) => {
  const t = useT();
  const { styles } = useJobStyles();
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        className={styles.codeInput}
        value={value}
        maxLength={JOB_LIMITS.cronMax}
        placeholder="0 3 * * *"
        spellCheck={false}
        onChange={(e) => onChange?.(e.target.value)}
      />
      <Dropdown
        trigger={['click']}
        menu={{
          items: CRON_PRESETS.map(([textId, cron]) => ({
            key: cron,
            label: (
              <span>
                {t(textId)}
                <span className={styles.hint} style={{ marginInlineStart: 12 }}>
                  {cron}
                </span>
              </span>
            ),
          })),
          onClick: ({ key }) => onChange?.(key),
        }}
      >
        <Button>
          {t('pages.job.schedule.preset')} <DownOutlined />
        </Button>
      </Dropdown>
    </Space.Compact>
  );
};

/** 接下来 5 次触发时间（随 Cron 表达式与时区变化，防抖后请求后端校验） */
const NextTimes: React.FC<{ cron?: string; timezone?: string }> = ({
  cron,
  timezone,
}) => {
  const t = useT();
  const { styles } = useJobStyles();
  const [loading, setLoading] = useState(false);
  const [times, setTimes] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const expr = cron?.trim();
    setTimes([]);
    setError(undefined);
    if (!expr || !timezone) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      previewJobSchedule({ cron: expr, timezone })
        .then((result) => {
          if (!cancelled) setTimes(result.nextTimes ?? []);
        })
        .catch((err) => {
          if (!cancelled) setError(getJobErrorMessage(err));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, PREVIEW_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cron, timezone]);

  if (error) {
    return (
      <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />
    );
  }
  return (
    <div className={styles.codeBlock} style={{ marginBottom: 16 }}>
      <div className={styles.secondary} style={{ fontFamily: 'inherit' }}>
        {t('pages.job.schedule.nextTimes')}
        {loading && <Spin size="small" style={{ marginInlineStart: 8 }} />}
      </div>
      {times.length > 0
        ? times.map((time) => <div key={time}>{formatTime(time)}</div>)
        : !loading && <div>{t('common.empty')}</div>}
    </div>
  );
};

const buildSpec = (
  values: ScheduleFormValues,
  params: readonly JobParam[],
): JobScheduleSpec => ({
  name: values.name.trim(),
  templateId: values.templateId ?? '',
  cron: values.cron.trim(),
  timezone: values.timezone,
  params: collectParamValues(params, values.params),
  misfire: values.misfire,
  enabled: values.enabled ?? false,
  description: values.description?.trim() ?? '',
});

/** 新建 / 编辑定时作业抽屉（row 为空即新建） */
const ScheduleDrawer: React.FC<{
  row: JobSchedule | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ row, onClose, onSaved }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const misfireOptions = useOptions(MISFIRE_META, MISFIRE_ORDER);
  const [form] = Form.useForm<ScheduleFormValues>();
  const templateId = Form.useWatch('templateId', form);
  const cron = Form.useWatch('cron', form);
  const timezone = Form.useWatch('timezone', form);
  // 所选模板的参数定义（提交时据此整理参数取值）
  const paramDefs = useRef<JobParam[] | undefined>([]);
  // 表单里展示的参数定义所属的模板版本：随保存提交，模板在此期间被改过则后端拒绝
  const templateVersion = useRef<number | undefined>(undefined);

  const timezoneOptions = useMemo(() => {
    const zones = new Set([
      browserTimezone(),
      ...(row ? [row.spec.timezone] : []),
      ...COMMON_TIMEZONES,
    ]);
    return [...zones].map((value) => ({ value, label: value }));
  }, [row]);

  return (
    <DrawerForm<ScheduleFormValues>
      title={
        row
          ? t('pages.job.schedule.edit.title', { name: row.spec.name })
          : t('pages.job.schedule.create.title')
      }
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      open
      form={form}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true, mask: { closable: false } }}
      initialValues={
        row
          ? {
              name: row.spec.name,
              templateId: row.spec.templateId,
              cron: row.spec.cron,
              timezone: row.spec.timezone,
              misfire: row.spec.misfire ?? 1,
              enabled: row.spec.enabled ?? false,
              description: row.spec.description,
            }
          : {
              name: '',
              cron: '0 3 * * *',
              timezone: browserTimezone(),
              misfire: 1,
              enabled: true,
            }
      }
      submitter={row ? submitter.save : submitter.create}
      onFinish={async (values) => {
        if (!paramDefs.current) {
          message.warning(t('pages.job.params.notReady'));
          return false;
        }
        const spec = {
          ...buildSpec(values, paramDefs.current),
          templateVersion: templateVersion.current,
        };
        if (row) {
          await updateJobSchedule(row.id, { spec, version: row.version });
          message.success(t('common.msg.saved'));
        } else {
          await createJobSchedule(spec);
          message.success(t('common.msg.created'));
        }
        onSaved();
        return true;
      }}
    >
      <Col span={24}>
        <Alert
          type="info"
          showIcon
          title={t('pages.job.schedule.notice.owner')}
          style={{ marginBottom: 16 }}
        />
      </Col>
      <ProFormText
        name="name"
        label={t('pages.job.common.name')}
        colProps={HALF}
        rules={[
          rules.required(t('pages.job.common.name')),
          rules.max(JOB_LIMITS.nameMax),
        ]}
      />
      <Col span={12}>
        <Form.Item
          name="templateId"
          label={t('pages.job.execution.column.template')}
          rules={[rules.select(t('pages.job.execution.column.template'))]}
        >
          <TemplateSelect />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="cron"
          label={t('pages.job.schedule.column.cron')}
          extra={t('pages.job.schedule.form.cron.extra')}
          rules={[rules.required(t('pages.job.schedule.column.cron'))]}
        >
          <CronInput />
        </Form.Item>
      </Col>
      <ProFormSelect
        name="timezone"
        label={t('pages.job.schedule.column.timezone')}
        colProps={HALF}
        options={timezoneOptions}
        allowClear={false}
        showSearch
        rules={[rules.select(t('pages.job.schedule.column.timezone'))]}
      />
      <Col span={24}>
        <NextTimes cron={cron} timezone={timezone} />
      </Col>
      <ProFormRadio.Group
        name="misfire"
        label={t('pages.job.schedule.form.misfire')}
        colProps={HALF}
        options={misfireOptions}
        extra={t('pages.job.schedule.form.misfire.extra')}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        colProps={HALF}
      />
      <ProFormTextArea
        name="description"
        label={t('pages.job.common.description')}
        colProps={FULL}
        fieldProps={{
          rows: 2,
          maxLength: JOB_LIMITS.descMax,
          showCount: true,
        }}
      />
      <Col span={24}>
        <SectionTitle>{t('pages.job.schedule.section.params')}</SectionTitle>
        <TemplateParams
          templateId={templateId}
          saved={
            row
              ? { templateId: row.spec.templateId, params: row.spec.params }
              : undefined
          }
          onParams={(params, version) => {
            paramDefs.current = params;
            templateVersion.current = version;
          }}
        />
      </Col>
    </DrawerForm>
  );
};

const ScheduleList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const access = useAccess();
  const t = useT();
  const { styles } = useJobStyles();
  const enabledEnum = useValueEnum(ENABLED_META);
  // 执行详情的「触发来源」带名称跳转过来
  const [searchParams] = useSearchParams();

  // undefined = 抽屉关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<JobSchedule | null | undefined>(
    undefined,
  );
  const [togglingId, setTogglingId] = useState<string>();

  const reload = () => actionRef.current?.reload();
  const hasAnyAction =
    has('job.schedule.edit') ||
    has('job.schedule.delete') ||
    Boolean(access.canJobExecution);

  /** 启停：没有独立接口，整组回传 spec 只改 enabled（负责人随之变为当前操作人） */
  const setEnabled = async (record: JobSchedule, enabled: boolean) => {
    setTogglingId(record.id);
    try {
      await updateJobSchedule(record.id, {
        spec: { ...record.spec, enabled },
        version: record.version,
      });
      message.success(t('common.msg.updated'));
    } catch {
      // 已由请求层提示（版本冲突等）
    } finally {
      setTogglingId(undefined);
      reload();
    }
  };

  const toggle = (record: JobSchedule, enabled: boolean) =>
    // 启用后会以操作人的身份自动执行；停用则不再触发——都先确认
    modal.confirm({
      autoFocusButton: 'cancel',
      title: t(
        enabled
          ? 'pages.job.schedule.enable.title'
          : 'pages.job.schedule.disable.title',
        { name: record.spec.name },
      ),
      content: t(
        enabled
          ? 'pages.job.schedule.enable.description'
          : 'pages.job.schedule.disable.description',
      ),
      okButtonProps: enabled ? undefined : { danger: true },
      onOk: () => setEnabled(record, enabled),
    });

  const remove = async (record: JobSchedule) => {
    try {
      await deleteJobSchedule(record.id);
    } catch {
      // 已由请求层提示
      return;
    }
    message.success(t('common.msg.deleted'));
    reload();
  };

  const columns: ProColumns<JobSchedule>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.job.schedule.search.placeholder'),
        maxLength: JOB_LIMITS.keywordMax,
      },
    },
    {
      title: t('pages.job.common.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      render: (_, record) => (
        <div>
          <div>{record.spec.name}</div>
          {record.spec.description && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.spec.description}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: t('pages.job.execution.column.template'),
      dataIndex: 'templateId',
      formItemRender: (_, { value, onChange }) => (
        <TemplateSelect
          value={value as string | undefined}
          onChange={onChange}
        />
      ),
      render: (_, record) =>
        !record.templateName ? (
          <Typography.Text type="danger">
            {t('pages.job.schedule.template.missing')}
          </Typography.Text>
        ) : access.canJobTemplate ? (
          <Link
            to={`/job/template?keyword=${encodeURIComponent(record.templateName)}`}
          >
            {record.templateName}
          </Link>
        ) : (
          record.templateName
        ),
    },
    {
      title: t('pages.job.schedule.column.cron'),
      dataIndex: ['spec', 'cron'],
      search: false,
      width: 220,
      render: (_, record) => (
        <div>
          <CodeText value={record.spec.cron} />
          <div className={styles.secondary}>
            {record.nextTime
              ? t('pages.job.schedule.next', {
                  time: formatTime(record.nextTime),
                })
              : t('pages.job.schedule.next.none')}
          </div>
        </div>
      ),
    },
    {
      title: t('pages.job.schedule.column.timezone'),
      dataIndex: ['spec', 'timezone'],
      search: false,
      width: 150,
    },
    {
      title: t('common.column.enabled'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
      render: (_, record) =>
        has('job.schedule.edit') ? (
          <Switch
            size="small"
            checked={record.spec.enabled === true}
            loading={togglingId === record.id}
            onChange={(checked) => toggle(record, checked)}
          />
        ) : (
          <Badge
            status={record.spec.enabled ? 'success' : 'default'}
            text={t(
              record.spec.enabled ? 'enum.enabled.true' : 'enum.enabled.false',
            )}
          />
        ),
    },
    {
      title: t('pages.job.common.owner'),
      dataIndex: 'ownerName',
      search: false,
      width: 120,
      tooltip: t('pages.job.common.owner.tooltip'),
      renderText: (value?: string) => value || t('common.empty'),
    },
    {
      title: t('pages.job.schedule.column.lastTime'),
      dataIndex: 'lastTime',
      search: false,
      width: 200,
      render: (_, record) => (
        <span>
          {!record.lastTime ? (
            t('common.empty')
          ) : record.lastExecutionId ? (
            <Link to={`/job/execution/${record.lastExecutionId}`}>
              {formatTime(record.lastTime)}
            </Link>
          ) : (
            formatTime(record.lastTime)
          )}
          {record.lastError && (
            <Tooltip title={record.lastError}>
              <ExclamationCircleFilled
                className={styles.danger}
                style={{ marginInlineStart: 8 }}
              />
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 190,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('job.schedule.edit')) {
          actions.push(
            <a key="edit" onClick={() => setFormRow(record)}>
              {t('common.action.edit')}
            </a>,
          );
        }
        if (access.canJobExecution) {
          actions.push(
            <Link key="executions" to={`/job/history?triggerRef=${record.id}`}>
              {t('pages.job.template.executions')}
            </Link>,
          );
        }
        if (has('job.schedule.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.job.schedule.delete.title', {
                name: record.spec.name,
              })}
              description={t('pages.job.schedule.delete.description')}
              onConfirm={() => remove(record)}
            />,
          );
        }
        return actions;
      },
    },
  ];

  return (
    <RouteTabsPage tabs={AUTOMATION_TABS}>
      <ProTable<JobSchedule>
        cardBordered
        headerTitle={
          has('job.schedule.create') && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.job.schedule.create.title')}
            </CreateButton>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        form={{
          initialValues: { keyword: searchParams.get('keyword') ?? undefined },
        }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          const result = await listJobSchedules({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            templateId: params.templateId || undefined,
            enabled: parseBoolParam(params.enabled),
          });
          return toTableResult(result);
        }}
      />
      {formRow !== undefined && (
        <ScheduleDrawer
          key={formRow?.id ?? 'create'}
          row={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={reload}
        />
      )}
    </RouteTabsPage>
  );
};

export default ScheduleList;
