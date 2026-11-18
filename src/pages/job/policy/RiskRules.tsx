/**
 * 高危命令规则：对快速执行的命令与脚本内容做正则匹配（RE2 语法），命中后拦截 / 须审批 / 仅提醒。
 * 规则表单内可用一段示例文本测试尚未保存的规则；页面上另有「测试全部规则」。
 */
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormDependency,
  ProFormRadio,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, App, Badge, Button, Card, Col, Input, Switch } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { FULL, HALF } from '@/constants/layout';
import {
  createJobRiskRule,
  deleteJobRiskRule,
  listJobRiskRules,
  testJobRiskRules,
  updateJobRiskRule,
} from '@/services/job/policy';
import type {
  JobRiskAction,
  JobRiskHit,
  JobRiskRule,
  JobRiskRuleSpec,
} from '@/services/job/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useOptions, useSubmitter, useT } from '@/utils/i18n';
import {
  JOB_LIMITS,
  RISK_ACTION_META,
  RISK_ACTION_ORDER,
} from '../components/meta';
import { RiskHits } from '../components/RiskHits';
import { useJobStyles } from '../components/styles';
import { CodeText, RiskActionTag, UpdatedCell } from '../components/tags';

interface RuleFormValues {
  name: string;
  pattern: string;
  action: JobRiskAction;
  enabled?: boolean;
  description?: string;
}

const buildSpec = (values: RuleFormValues): JobRiskRuleSpec => ({
  name: values.name.trim(),
  // 正则原样提交（首尾空白可能是模式的一部分）
  pattern: values.pattern,
  action: values.action,
  enabled: values.enabled ?? false,
  description: values.description?.trim() ?? '',
});

/** 试匹配区：输入一段命令 / 脚本 → 命中的规则；draft 给出时只测这一条 */
const RiskTester: React.FC<{
  /** 取尚未保存的规则；返回 undefined 表示表单未通过校验（不测试） */
  getDraft?: () => Promise<JobRiskRuleSpec | undefined>;
}> = ({ getDraft }) => {
  const t = useT();
  const { styles } = useJobStyles();
  const [content, setContent] = useState('');
  const [testing, setTesting] = useState(false);
  const [hits, setHits] = useState<JobRiskHit[] | null>(null);

  const run = async () => {
    const draft = getDraft ? await getDraft() : undefined;
    if (getDraft && !draft) return;
    setTesting(true);
    try {
      const result = await testJobRiskRules({ content, draft });
      setHits(result.hits ?? []);
    } catch {
      // 已由请求层提示（正则无法编译等）
      setHits(null);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <Input.TextArea
        className={styles.codeInput}
        rows={4}
        spellCheck={false}
        value={content}
        placeholder={t('pages.job.policy.test.placeholder')}
        onChange={(e) => {
          setContent(e.target.value);
          setHits(null);
        }}
      />
      <Button
        style={{ marginTop: 8 }}
        loading={testing}
        disabled={!content}
        onClick={() => void run()}
      >
        {t('pages.job.policy.test')}
      </Button>
      {hits &&
        (hits.length > 0 ? (
          <Alert
            type="warning"
            showIcon
            title={t('pages.job.policy.test.hit', { n: hits.length })}
            description={<RiskHits hits={hits} />}
            style={{ marginTop: 8 }}
          />
        ) : (
          <Alert
            type="success"
            showIcon
            title={t('pages.job.policy.test.miss')}
            style={{ marginTop: 8 }}
          />
        ))}
    </div>
  );
};

/** 新建 / 编辑规则弹窗（row 为空即新建） */
const RuleModal: React.FC<{
  row: JobRiskRule | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ row, onClose, onSaved }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const { styles } = useJobStyles();
  const actionOptions = useOptions(RISK_ACTION_META, RISK_ACTION_ORDER);
  const formRef = useRef<ProFormInstance<RuleFormValues> | undefined>(
    undefined,
  );

  const getDraft = async () => {
    const form = formRef.current;
    if (!form) return undefined;
    // 只校验与匹配有关的字段：名称未填也能先测
    const valid = await form.validateFields(['pattern', 'action']).then(
      () => true,
      () => false,
    );
    if (!valid) return undefined;
    const values = form.getFieldsValue(true) as RuleFormValues;
    return buildSpec({
      ...values,
      name: values.name?.trim() || t('pages.job.policy.rule.draftName'),
      // 测试时不论是否启用都参与匹配
      enabled: true,
    });
  };

  return (
    <ModalForm<RuleFormValues>
      title={
        row
          ? t('pages.job.policy.rule.edit.title', { name: row.spec.name })
          : t('pages.job.policy.rule.create.title')
      }
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      open
      formRef={formRef}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={{ destroyOnHidden: true, mask: { closable: false } }}
      initialValues={
        row
          ? {
              name: row.spec.name,
              pattern: row.spec.pattern,
              action: row.spec.action,
              enabled: row.spec.enabled ?? false,
              description: row.spec.description,
            }
          : { name: '', pattern: '', action: 2, enabled: true }
      }
      submitter={row ? submitter.save : submitter.create}
      onFinish={async (values) => {
        const spec = buildSpec(values);
        if (row) {
          await updateJobRiskRule(row.id, { spec, version: row.version });
          message.success(t('common.msg.saved'));
        } else {
          await createJobRiskRule(spec);
          message.success(t('common.msg.created'));
        }
        onSaved();
        return true;
      }}
    >
      <ProFormText
        name="name"
        label={t('pages.job.common.name')}
        colProps={HALF}
        rules={[
          rules.required(t('pages.job.common.name')),
          rules.max(JOB_LIMITS.nameMax),
        ]}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        colProps={HALF}
      />
      <ProFormText
        name="pattern"
        label={t('pages.job.policy.rule.column.pattern')}
        colProps={FULL}
        placeholder={'rm\\s+-rf\\s+/'}
        extra={t('pages.job.policy.rule.form.pattern.extra')}
        fieldProps={{ className: styles.codeInput, spellCheck: false }}
        rules={[
          rules.required(t('pages.job.policy.rule.column.pattern')),
          rules.max(JOB_LIMITS.riskPatternMax),
        ]}
      />
      <ProFormDependency name={['action']}>
        {({ action }) => (
          <ProFormRadio.Group
            name="action"
            label={t('pages.job.policy.rule.column.action')}
            colProps={FULL}
            options={actionOptions}
            extra={
              action
                ? t(`pages.job.policy.rule.form.action.${action}`)
                : undefined
            }
            rules={[rules.select(t('pages.job.policy.rule.column.action'))]}
          />
        )}
      </ProFormDependency>
      <ProFormTextArea
        name="description"
        label={t('pages.job.common.description')}
        colProps={FULL}
        extra={t('pages.job.policy.rule.form.description.extra')}
        fieldProps={{
          rows: 2,
          maxLength: JOB_LIMITS.descMax,
          showCount: true,
        }}
      />
      <Col span={24}>
        <SectionTitle>{t('pages.job.policy.rule.form.test')}</SectionTitle>
        <RiskTester getDraft={getDraft} />
      </Col>
    </ModalForm>
  );
};

export const RiskRules: React.FC = () => {
  const t = useT();
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const canEdit = has('job.policy.rule');
  const [items, setItems] = useState<JobRiskRule[]>([]);
  const [loading, setLoading] = useState(true);
  // undefined = 弹窗关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<JobRiskRule | null | undefined>(
    undefined,
  );
  const [togglingId, setTogglingId] = useState<string>();

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await listJobRiskRules()).items ?? []);
    } catch {
      // 已由请求层提示
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** 启停：没有独立接口，整组回传 spec 只改 enabled */
  const setEnabled = async (record: JobRiskRule, enabled: boolean) => {
    setTogglingId(record.id);
    try {
      await updateJobRiskRule(record.id, {
        spec: { ...record.spec, enabled },
        version: record.version,
      });
      message.success(t('common.msg.updated'));
    } catch {
      // 已由请求层提示（版本冲突等）
    } finally {
      setTogglingId(undefined);
      void reload();
    }
  };

  const toggle = (record: JobRiskRule, enabled: boolean) => {
    if (enabled) {
      void setEnabled(record, true);
      return;
    }
    // 停用一条安全规则等于放开一类命令：二次确认
    modal.confirm({
      autoFocusButton: 'cancel',
      title: t('pages.job.policy.rule.disable.title', {
        name: record.spec.name,
      }),
      content: t('pages.job.policy.rule.disable.description'),
      okButtonProps: { danger: true },
      onOk: () => setEnabled(record, false),
    });
  };

  const remove = async (record: JobRiskRule) => {
    try {
      await deleteJobRiskRule(record.id);
    } catch {
      // 已由请求层提示
      return;
    }
    message.success(t('common.msg.deleted'));
    void reload();
  };

  return (
    <div>
      <Alert
        type="info"
        showIcon
        title={t('pages.job.policy.rule.intro')}
        style={{ marginBottom: 16 }}
      />
      <ProTable<JobRiskRule>
        cardBordered
        headerTitle={
          canEdit && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.job.policy.rule.create.title')}
            </CreateButton>
          )
        }
        rowKey="id"
        search={false}
        options={false}
        loading={loading}
        dataSource={items}
        pagination={false}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            title: t('pages.job.common.name'),
            dataIndex: ['spec', 'name'],
            width: 200,
          },
          {
            title: t('pages.job.policy.rule.column.pattern'),
            dataIndex: ['spec', 'pattern'],
            render: (_, record) => <CodeText value={record.spec.pattern} />,
          },
          {
            title: t('pages.job.policy.rule.column.action'),
            dataIndex: ['spec', 'action'],
            width: 100,
            render: (_, record) => (
              <RiskActionTag action={record.spec.action} />
            ),
          },
          {
            title: t('common.column.enabled'),
            dataIndex: ['spec', 'enabled'],
            width: 90,
            render: (_, record) =>
              canEdit ? (
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
                    record.spec.enabled
                      ? 'enum.enabled.true'
                      : 'enum.enabled.false',
                  )}
                />
              ),
          },
          {
            title: t('pages.job.common.description'),
            dataIndex: ['spec', 'description'],
            render: (_, record) => record.spec.description || t('common.empty'),
          },
          {
            title: t('pages.job.common.updated'),
            dataIndex: 'updateUserName',
            width: 180,
            render: (_, record) => (
              <UpdatedCell
                userName={record.updateUserName}
                time={record.updateTime}
              />
            ),
          },
          ...(canEdit
            ? [
                {
                  title: t('common.column.action'),
                  key: 'action',
                  width: 120,
                  render: (_: unknown, record: JobRiskRule) => (
                    <span style={{ display: 'inline-flex', gap: 12 }}>
                      <a onClick={() => setFormRow(record)}>
                        {t('common.action.edit')}
                      </a>
                      <DeleteConfirmLink
                        title={t('pages.job.policy.rule.delete.title', {
                          name: record.spec.name,
                        })}
                        description={t(
                          'pages.job.policy.rule.delete.description',
                        )}
                        onConfirm={() => remove(record)}
                      />
                    </span>
                  ),
                },
              ]
            : []),
        ]}
      />
      <Card
        variant="outlined"
        title={t('pages.job.policy.testAll')}
        style={{ marginTop: 16 }}
      >
        <RiskTester />
      </Card>
      {formRow !== undefined && (
        <RuleModal
          key={formRow?.id ?? 'create'}
          row={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={() => void reload()}
        />
      )}
    </div>
  );
};
