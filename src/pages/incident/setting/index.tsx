/**
 * 故障设置（单例）：各等级的响应时限 / 无进展提醒 / 首条公告时限 / 复盘期限 / 是否允许自动恢复与自动通过，
 * 根因分类，兜底值班表，候选过期、重开窗口、自动关闭、风暴阈值、建议过期、验证窗口、变更回看、Agent 发现上限，
 * 个人提醒的动作。保存带乐观锁版本。
 */
import {
  ProForm,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Alert, App, Button, Card, Col, Row, Spin, Table } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { SectionTitle } from '@/components/SectionTitle';
import { getSettings, updateSettings } from '@/services/incident/config';
import { getIncidentErrorMessage } from '@/services/incident/request';
import type {
  IncidentSettings,
  SettingsResult,
  SeveritySetting,
} from '@/services/incident/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useT } from '@/utils/i18n';
import { refOptions, useIncidentOptions } from '../components/hooks';
import {
  CONFIG_TABS,
  PERSONAL_EVENTS,
  SEVERITY_ORDER,
} from '../components/meta';
import { SeverityTag } from '../components/tags';

type FormValues = Omit<IncidentSettings, 'severities'> & {
  severities: Record<string, SeveritySetting>;
};

const SettingPage: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const rules = useFormRules();
  const { message } = App.useApp();
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const { options } = useIncidentOptions(['schedules']);
  const editable = has('incident.setting.update');

  const load = async () => {
    setLoading(true);
    try {
      setResult(await getSettings());
      setError(undefined);
    } catch (e) {
      setError(getIncidentErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  if (loading && !result) {
    return (
      <RouteTabsPage tabs={CONFIG_TABS}>
        <Spin />
      </RouteTabsPage>
    );
  }
  // 加载失败不渲染可编辑的空表单，避免把默认值当设置保存
  if (!result) {
    return (
      <RouteTabsPage tabs={CONFIG_TABS}>
        <Alert
          type="error"
          showIcon
          title={t('pages.incident.setting.loadFailed')}
          description={error}
          action={
            <Button size="small" loading={loading} onClick={() => void load()}>
              {t('pages.incident.retry')}
            </Button>
          }
        />
      </RouteTabsPage>
    );
  }
  const s = result.settings ?? {};

  return (
    <RouteTabsPage tabs={CONFIG_TABS}>
      <Card variant="outlined" title={t('menu.incident.setting')}>
        <ProForm<FormValues>
          key={s.version}
          disabled={!editable}
          initialValues={{ ...s, severities: s.severities ?? {} }}
          submitter={
            editable
              ? {
                  searchConfig: { submitText: t('common.action.save') },
                  resetButtonProps: { style: { display: 'none' } },
                }
              : false
          }
          onFinish={async (values) => {
            const saved = await updateSettings({
              ...values,
              version: s.version ?? 0,
            });
            setResult(saved);
            message.success(t('common.msg.saved'));
          }}
        >
          <SectionTitle style={{ marginTop: 0 }}>
            {t('pages.incident.setting.severities')}
          </SectionTitle>
          <Table<{ severity: 1 | 2 | 3 | 4 }>
            rowKey="severity"
            size="small"
            pagination={false}
            dataSource={SEVERITY_ORDER.map((severity) => ({ severity }))}
            columns={[
              {
                title: t('pages.incident.field.severity'),
                dataIndex: 'severity',
                width: 90,
                render: (_, r) => <SeverityTag severity={r.severity} />,
              },
              ...(
                ['respondM', 'staleM', 'firstUpdateM', 'reviewDays'] as const
              ).map((field) => ({
                title: t(`pages.incident.setting.${field}`),
                key: field,
                render: (_: unknown, r: { severity: number }) => (
                  <ProFormDigit
                    noStyle
                    name={['severities', String(r.severity), field]}
                    min={0}
                    max={field === 'reviewDays' ? 60 : 1440}
                    fieldProps={{ precision: 0, style: { width: 100 } }}
                    formItemProps={{ style: { marginBottom: 0 } }}
                  />
                ),
              })),
              ...(['allowAutoResolve', 'allowAutoApprove'] as const).map(
                (field) => ({
                  title: t(`pages.incident.setting.${field}`),
                  key: field,
                  render: (_: unknown, r: { severity: number }) => (
                    <ProFormSwitch
                      noStyle
                      name={['severities', String(r.severity), field]}
                      formItemProps={{ style: { marginBottom: 0 } }}
                    />
                  ),
                }),
              ),
            ]}
          />
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <Alert
              type="info"
              showIcon
              title={t('pages.incident.setting.severitiesHint')}
            />
          </div>

          <SectionTitle>{t('pages.incident.setting.general')}</SectionTitle>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <ProFormSelect
                name="fallbackScheduleId"
                label={t('pages.incident.setting.fallbackSchedule')}
                showSearch
                options={refOptions(options.schedules)}
                extra={t('pages.incident.setting.fallbackScheduleHint')}
              />
            </Col>
            <Col xs={24} md={12}>
              <ProFormSelect
                name="personalEvents"
                label={t('pages.incident.setting.personalEvents')}
                mode="multiple"
                options={PERSONAL_EVENTS.map((e) => ({
                  value: e,
                  label: t(`pages.incident.setting.event.${e}`),
                }))}
                extra={t('pages.incident.setting.personalEventsHint')}
              />
            </Col>
            {(
              [
                ['stormThreshold', 1, 100],
                ['candidateTtlM', 5, 1440],
                ['reopenWindowH', 1, 720],
                ['autoCloseDays', 1, 90],
                ['proposalTtlM', 5, 1440],
                ['verifyWindowM', 1, 120],
                ['changeLookbackH', 1, 168],
                ['agentMaxFindings', 10, 1000],
                ['agentAutoCooldownM', 1, 1440],
                ['agentAutoMaxRunning', 1, 100],
                ['agentAutoMaxRunningPerBusiness', 1, 100],
              ] as const
            ).map(([field, min, max]) => (
              <Col xs={12} md={6} key={field}>
                <ProFormDigit
                  name={field}
                  label={t(`pages.incident.setting.${field}`)}
                  min={min}
                  max={max}
                  fieldProps={{ precision: 0 }}
                  rules={[rules.required(t(`pages.incident.setting.${field}`))]}
                  extra={t(`pages.incident.setting.${field}Hint`)}
                />
              </Col>
            ))}
          </Row>

          <SectionTitle>{t('pages.incident.setting.rootCauses')}</SectionTitle>
          <ProFormList
            name="rootCauses"
            min={1}
            max={50}
            creatorButtonProps={
              editable
                ? {
                    creatorButtonText: t('pages.incident.setting.addRootCause'),
                  }
                : false
            }
            copyIconProps={false}
            deleteIconProps={editable ? undefined : false}
          >
            <ProForm.Group>
              <ProFormText
                name="code"
                label={t('pages.incident.setting.rootCauseCode')}
                width="sm"
                rules={[
                  rules.required(t('pages.incident.setting.rootCauseCode')),
                  {
                    pattern: /^[a-z0-9_-]{1,32}$/,
                    message: t('pages.incident.setting.rootCauseCodeRule'),
                  },
                ]}
              />
              <ProFormText
                name="name"
                label={t('pages.incident.setting.rootCauseName')}
                width="md"
                rules={[
                  rules.required(t('pages.incident.setting.rootCauseName')),
                  rules.maxChars(64),
                ]}
              />
            </ProForm.Group>
          </ProFormList>
        </ProForm>
      </Card>
    </RouteTabsPage>
  );
};

export default SettingPage;
