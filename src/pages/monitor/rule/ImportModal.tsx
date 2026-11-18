/**
 * 规则导入弹窗：粘贴或上传 → 填导入选项 → 预览（逐条的转换结果、重名、无法转换的原因）→
 * 选重名处理与是否立即启用 → 导入并给出逐条结果。内容可以是 Prometheus / vmalert 告警规则
 * YAML，或本系统导出的 JSON（完整内容；由后端按内容自动识别）。
 * 预览与导入用同一份选项（两次请求须一致），所以预览后改动选项需重新预览。
 * 「从模板创建」也走这个弹窗：给出 source（模板包的规则 YAML）时内容预先填好且不可改，其余步骤不变。
 */
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from 'antd';
import type React from 'react';
import { useState } from 'react';
import { DeptSelect } from '@/components/DeptSelect';
import { UserSelect } from '@/components/UserSelect';
import { fetchMonitorUsers } from '@/components/UserSelect/sources';
import { NOTIFY_SEVERITY_META } from '@/constants';
import { K8sRuleTemplateButton } from '@/pages/k8s/components/monitorLink';
import { importRules, previewImportRules } from '@/services/monitor/rule';
import type {
  ImportConflictPolicy,
  ImportPreviewResult,
  ImportRuleItem,
  ImportRuleResult,
  ImportRulesOptions,
  ImportRulesResult,
  MonitorDatasourceScope,
  MonitorSeverity,
  RuleGroup,
} from '@/services/monitor/typings';
import { useFormRules, useOptions, useT } from '@/utils/i18n';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import {
  type DatasourceOptionsState,
  useNotifyTargets,
} from '../components/hooks';
import {
  DATASOURCE_SCOPE_META,
  DATASOURCE_SCOPE_ORDER,
  IMPORT_CONFLICT_META,
  IMPORT_CONFLICT_ORDER,
  IMPORT_RESULT_META,
  IMPORT_STATUS_META,
  MONITOR_LIMITS,
  SEVERITY_ORDER,
} from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { SeverityTag, TargetsFailedAlert } from '../components/tags';

interface ImportFormValues {
  content: string;
  groupId: string;
  datasourceScope: MonitorDatasourceScope;
  datasourceIds?: string[];
  defaultSeverity: MonitorSeverity;
  /** 级别对照表：severity 标签取值 → 级别 */
  severityMap?: SeverityMapRow[];
  userIds?: string[];
  scheduleIds?: string[];
  deptIds?: string[];
}

/** 级别对照表的一行：severity 标签取值 → 级别 */
interface SeverityMapRow {
  label: string;
  severity: MonitorSeverity;
}

/** 与后端一致：至多 50 项，标签取值 1-64 字符 */
const SEVERITY_MAP_MAX = 50;
const SEVERITY_LABEL_MAX = 64;

/** 内容是否为本系统导出的 JSON（与后端同一判断：首个非空白字符是 `{`） */
const isJsonContent = (content?: string) =>
  (content ?? '').trimStart().startsWith('{');

/** 对照表各行：标签取值非空且（不区分大小写）不重复 */
const validateSeverityMap = (rows?: SeverityMapRow[]): boolean => {
  const labels = (rows ?? []).map((row) => row.label.trim().toLowerCase());
  return (
    labels.length <= SEVERITY_MAP_MAX &&
    labels.every((label) => label.length > 0) &&
    new Set(labels).size === labels.length
  );
};

/** 级别对照表编辑器（受控组件，可直接放进 Form.Item）：每行「标签取值 → 级别」 */
const SeverityMapEditor: React.FC<{
  value?: SeverityMapRow[];
  onChange?: (value: SeverityMapRow[]) => void;
  severityOptions: { value: MonitorSeverity; label: string }[];
}> = ({ value, onChange, severityOptions }) => {
  const t = useT();
  const { styles } = useMonitorStyles();
  const rows = value ?? [];
  const update = (index: number, patch: Partial<SeverityMapRow>) =>
    onChange?.(
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  return (
    <div>
      {rows.map((row, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 行无稳定标识，按位置编辑
        <div key={index} className={styles.editorRow}>
          <Input
            style={{ flex: 1, minWidth: 0 }}
            value={row.label}
            maxLength={SEVERITY_LABEL_MAX}
            placeholder={t('pages.monitor.rule.import.severityMap.label')}
            onChange={(e) => update(index, { label: e.target.value })}
          />
          <Select<MonitorSeverity>
            style={{ width: 140 }}
            value={row.severity}
            options={severityOptions}
            onChange={(severity) => update(index, { severity })}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            aria-label={t('pages.monitor.editor.remove')}
            onClick={() => onChange?.(rows.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        disabled={rows.length >= SEVERITY_MAP_MAX}
        onClick={() => onChange?.([...rows, { label: '', severity: 2 }])}
      >
        {t('pages.monitor.rule.import.severityMap.add')}
      </Button>
    </div>
  );
};

const buildOptions = (values: ImportFormValues): ImportRulesOptions => ({
  content: values.content,
  groupId: values.groupId,
  datasourceScope: values.datasourceScope,
  datasourceIds:
    values.datasourceScope === 1 ? (values.datasourceIds ?? []) : [],
  defaultSeverity: values.defaultSeverity,
  notify: {
    userIds: values.userIds ?? [],
    scheduleIds: values.scheduleIds ?? [],
    deptIds: values.deptIds ?? [],
  },
  // 级别对照只对 YAML 起作用
  severityMap: isJsonContent(values.content)
    ? {}
    : Object.fromEntries(
        (values.severityMap ?? []).map((row) => [
          row.label.trim(),
          row.severity,
        ]),
      ),
});

export const ImportModal: React.FC<{
  groups: readonly RuleGroup[];
  /** 全部数据源选项（页面取一次下传） */
  datasources: DatasourceOptionsState;
  /** 预选的目标分组（左侧树当前选中的，且可管理） */
  defaultGroupId?: string;
  /** 内置模板包：内容取自模板（不再选文件 / 粘贴），其余选项与步骤同普通导入 */
  source?: { content: string; name: string; ruleCount?: number };
  onClose: () => void;
  /** 导入过后关闭时调用：刷新列表与分组计数 */
  onDone: () => void;
}> = ({ groups, datasources, defaultGroupId, source, onClose, onDone }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const { styles } = useMonitorStyles();
  const [form] = Form.useForm<ImportFormValues>();
  const targets = useNotifyTargets();
  const severityOptions = useOptions(NOTIFY_SEVERITY_META, SEVERITY_ORDER);
  const scopeOptions = useOptions(
    DATASOURCE_SCOPE_META,
    DATASOURCE_SCOPE_ORDER,
  );
  const conflictOptions = useOptions(
    IMPORT_CONFLICT_META,
    IMPORT_CONFLICT_ORDER,
  );
  const datasourceScope = Form.useWatch('datasourceScope', form);
  const isJson = isJsonContent(Form.useWatch('content', form));

  const [fileName, setFileName] = useState<string>();
  const [loading, setLoading] = useState(false);
  // 预览时用的选项：导入必须原样回传
  const [options, setOptions] = useState<ImportRulesOptions>();
  const [preview, setPreview] = useState<ImportPreviewResult>();
  const [onConflict, setOnConflict] = useState<ImportConflictPolicy>('skip');
  const [enabled, setEnabled] = useState(false);
  const [result, setResult] = useState<ImportRulesResult>();

  const step = result ? 'result' : preview ? 'preview' : 'input';

  const loadFile = async (file: File) => {
    if (file.size > MONITOR_LIMITS.importBytesMax) {
      message.error(t('pages.monitor.rule.import.tooLarge'));
      return;
    }
    form.setFieldValue('content', await file.text());
    setFileName(file.name);
  };

  const runPreview = async () => {
    const values = await form.validateFields().catch(() => undefined);
    // 校验不通过：错误已显示在表单项上
    if (!values) return;
    const next = buildOptions(values);
    setLoading(true);
    try {
      setPreview(await previewImportRules(next));
      setOptions(next);
    } catch {
      // 已由请求层提示（如内容不是合法的规则文件）
    } finally {
      setLoading(false);
    }
  };

  const runImport = async () => {
    if (!options) return;
    setLoading(true);
    try {
      setResult(await importRules({ options, onConflict, enabled }));
    } catch {
      // 已由请求层提示
    } finally {
      setLoading(false);
    }
  };

  const importable =
    (preview?.newCount ?? 0) +
    (onConflict === 'skip' ? 0 : (preview?.conflictCount ?? 0));

  const footer =
    step === 'input'
      ? [
          <Button key="cancel" onClick={onClose}>
            {t('common.action.cancel')}
          </Button>,
          <Button
            key="preview"
            type="primary"
            loading={loading}
            onClick={() => void runPreview()}
          >
            {t('pages.monitor.rule.import.preview')}
          </Button>,
        ]
      : step === 'preview'
        ? [
            <Button key="back" onClick={() => setPreview(undefined)}>
              {t('pages.monitor.rule.import.back')}
            </Button>,
            <Button
              key="import"
              type="primary"
              loading={loading}
              disabled={importable === 0}
              onClick={() => void runImport()}
            >
              {t('pages.monitor.rule.import.submit', { count: importable })}
            </Button>,
          ]
        : [
            <Button
              key="close"
              type="primary"
              onClick={() => {
                onDone();
                onClose();
              }}
            >
              {t('pages.monitor.rule.import.close')}
            </Button>,
          ];

  return (
    <Modal
      title={t(`pages.monitor.rule.import.title.${step}`)}
      open
      width={step === 'input' ? 720 : 960}
      destroyOnHidden
      mask={{ closable: false }}
      footer={footer}
      onCancel={() => {
        if (result) onDone();
        onClose();
      }}
    >
      {/* 输入页保持挂载：从预览返回时内容与选项都还在 */}
      <Form
        form={form}
        layout="vertical"
        style={{ display: step === 'input' ? undefined : 'none' }}
        initialValues={{
          content: source?.content ?? '',
          groupId: defaultGroupId,
          datasourceScope: 1,
          defaultSeverity: 2,
        }}
      >
        {!source && (
          <Alert
            type="info"
            showIcon
            title={t('pages.monitor.rule.import.hint')}
            style={{ marginBottom: 16 }}
          />
        )}
        {/* 模板包：只展示来源；下面的输入区隐藏但保持挂载（内容字段照常注册，预览 / 导入从表单取值） */}
        {source && (
          <Form.Item label={t('pages.monitor.rule.import.content')}>
            {t('pages.monitor.rule.template.source', {
              name: source.name,
              count: source.ruleCount ?? 0,
            })}
          </Form.Item>
        )}
        <Form.Item
          label={t('pages.monitor.rule.import.content')}
          required
          hidden={Boolean(source)}
        >
          <Space vertical style={{ width: '100%' }}>
            <Upload
              accept=".yml,.yaml,.json,text/yaml,application/x-yaml,application/json"
              maxCount={1}
              showUploadList={false}
              beforeUpload={(file) => {
                void loadFile(file);
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>
                {t('pages.monitor.rule.import.upload')}
              </Button>
              {fileName && (
                <span style={{ marginInlineStart: 8 }}>{fileName}</span>
              )}
            </Upload>
            <K8sRuleTemplateButton
              onLoad={(content, name) => {
                form.setFieldValue('content', content);
                setFileName(name);
              }}
            />
            <Form.Item
              name="content"
              noStyle
              rules={[
                {
                  validator: (_: unknown, value?: string) =>
                    !value?.trim()
                      ? Promise.reject(
                          new Error(
                            t('common.validation.required', {
                              label: t('pages.monitor.rule.import.content'),
                            }),
                          ),
                        )
                      : new TextEncoder().encode(value).length >
                          MONITOR_LIMITS.importBytesMax
                        ? Promise.reject(
                            new Error(t('pages.monitor.rule.import.tooLarge')),
                          )
                        : Promise.resolve(),
                },
              ]}
            >
              <Input.TextArea
                className={styles.codeInput}
                autoSize={{ minRows: 8, maxRows: 16 }}
                placeholder={
                  'groups:\n  - name: node\n    rules:\n      - alert: HighCpu\n        expr: cpu_usage > 90\n        for: 5m\n        labels:\n          severity: critical'
                }
              />
            </Form.Item>
          </Space>
        </Form.Item>
        <Form.Item
          name="groupId"
          label={t('pages.monitor.rule.import.group')}
          rules={[rules.select(t('pages.monitor.rule.import.group'))]}
        >
          <GroupTreeSelect
            groups={groups}
            minLevel={2}
            allowClear={false}
            placeholder={t('pages.monitor.common.group.placeholder')}
          />
        </Form.Item>
        <Form.Item
          name="datasourceScope"
          label={t('pages.monitor.rule.form.datasourceScope')}
        >
          <Radio.Group options={scopeOptions} />
        </Form.Item>
        {datasourceScope === 1 && (
          <Form.Item
            name="datasourceIds"
            label={t('pages.monitor.common.datasources')}
            rules={[
              {
                required: true,
                type: 'array',
                message: t('common.validation.select', {
                  label: t('pages.monitor.common.datasources'),
                }),
              },
            ]}
          >
            <Select
              mode="multiple"
              maxCount={MONITOR_LIMITS.ruleDatasourceMax}
              showSearch={{ optionFilterProp: 'label' }}
              options={datasources.options}
            />
          </Form.Item>
        )}
        {isJson && (
          <Alert
            type="info"
            showIcon
            title={t('pages.monitor.rule.import.jsonHint')}
            style={{ marginBottom: 16 }}
          />
        )}
        {/* 级别相关的两项只对 YAML 起作用；JSON 时隐藏但保持挂载（默认级别仍须随请求传） */}
        <Form.Item
          name="defaultSeverity"
          label={t('pages.monitor.rule.import.defaultSeverity')}
          extra={t('pages.monitor.rule.import.defaultSeverity.hint')}
          hidden={isJson}
          rules={[rules.select(t('pages.monitor.rule.import.defaultSeverity'))]}
        >
          <Select options={severityOptions} style={{ width: 200 }} />
        </Form.Item>
        <Form.Item
          name="severityMap"
          label={t('pages.monitor.rule.import.severityMap')}
          tooltip={t('pages.monitor.rule.import.severityMap.tooltip')}
          hidden={isJson}
          rules={[
            {
              validator: (_: unknown, value?: SeverityMapRow[]) =>
                isJsonContent(form.getFieldValue('content')) ||
                validateSeverityMap(value)
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(
                        t('pages.monitor.rule.import.severityMap.rule'),
                      ),
                    ),
            },
          ]}
        >
          <SeverityMapEditor severityOptions={severityOptions} />
        </Form.Item>
        <TargetsFailedAlert targets={targets} />
        <Form.Item
          name="userIds"
          label={t('pages.monitor.rule.import.notifyUsers')}
          extra={t(
            isJson
              ? 'pages.monitor.rule.import.notify.jsonHint'
              : 'pages.monitor.rule.import.notify.hint',
          )}
        >
          <UserSelect
            multiple
            maxCount={MONITOR_LIMITS.notifyUserMax}
            fetchUsers={fetchMonitorUsers}
            placeholder={t('pages.monitor.common.users.placeholder')}
          />
        </Form.Item>
        <Form.Item
          name="scheduleIds"
          label={t('pages.monitor.common.schedules')}
        >
          <Select
            mode="multiple"
            maxCount={MONITOR_LIMITS.notifyScheduleMax}
            showSearch={{ optionFilterProp: 'label' }}
            options={targets.scheduleOptions}
            placeholder={t('pages.monitor.common.schedules.placeholder')}
          />
        </Form.Item>
        <Form.Item name="deptIds" label={t('pages.monitor.rule.form.depts')}>
          <DeptSelect
            multiple
            maxCount={MONITOR_LIMITS.notifyDeptMax}
            depts={targets.depts}
            placeholder={t('pages.monitor.rule.form.depts.placeholder')}
          />
        </Form.Item>
      </Form>

      {step === 'preview' && preview && (
        <>
          <Alert
            type={
              (preview.invalidCount ?? 0) > 0 ||
              (preview.conflictCount ?? 0) > 0
                ? 'warning'
                : 'info'
            }
            showIcon
            title={t('pages.monitor.rule.import.preview.summary', {
              total: preview.total ?? 0,
              newCount: preview.newCount ?? 0,
              conflict: preview.conflictCount ?? 0,
              invalid: preview.invalidCount ?? 0,
              skipped: preview.skippedCount ?? 0,
            })}
            description={
              (preview.total ?? 0) > (preview.items ?? []).length
                ? t('pages.monitor.rule.import.preview.limit', {
                    shown: (preview.items ?? []).length,
                  })
                : undefined
            }
            style={{ marginBottom: 12 }}
          />
          <Table<ImportRuleItem>
            size="small"
            rowKey={(row) => row.index ?? 0}
            dataSource={preview.items ?? []}
            pagination={
              (preview.items ?? []).length > 10
                ? { pageSize: 10, showSizeChanger: false }
                : false
            }
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: t('pages.monitor.rule.import.column.sourceGroup'),
                dataIndex: 'sourceGroup',
                width: 140,
                ellipsis: true,
              },
              {
                title: t('pages.monitor.rule.column.name'),
                dataIndex: 'name',
                width: 200,
              },
              {
                title: t('pages.monitor.rule.import.column.status'),
                dataIndex: 'status',
                width: 100,
                render: (_, row) => {
                  const meta = row.status && IMPORT_STATUS_META[row.status];
                  return meta ? (
                    <Tag color={meta.color}>{t(meta.textId)}</Tag>
                  ) : (
                    t('common.empty')
                  );
                },
              },
              {
                title: t('pages.monitor.alert.column.severity'),
                width: 90,
                render: (_, row) => (
                  <SeverityTag severity={row.spec?.queries?.[0]?.severity} />
                ),
              },
              {
                title: t('pages.monitor.rule.column.expr'),
                render: (_, row) => (
                  <div className={styles.code} style={{ maxWidth: 320 }}>
                    {row.spec?.queries?.[0]?.expr}
                  </div>
                ),
              },
              {
                title: t('pages.monitor.rule.import.column.problems'),
                render: (_, row) =>
                  row.error || row.warnings?.length ? (
                    <div style={{ maxWidth: 320 }}>
                      {row.error && (
                        <div>
                          {t('pages.monitor.rule.import.problem.error', {
                            detail: row.error,
                          })}
                        </div>
                      )}
                      {(row.warnings ?? []).map((warning) => (
                        <div key={warning} className={styles.hint}>
                          {warning}
                        </div>
                      ))}
                    </div>
                  ) : (
                    t('common.empty')
                  ),
              },
            ]}
          />
          <Form layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              label={t('pages.monitor.rule.import.onConflict')}
              style={{ marginBottom: 12 }}
            >
              <Radio.Group
                value={onConflict}
                options={conflictOptions}
                onChange={(e) => setOnConflict(e.target.value)}
              />
            </Form.Item>
            <Form.Item
              extra={t('pages.monitor.rule.import.enabled.hint')}
              style={{ marginBottom: 0 }}
            >
              <Checkbox
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              >
                {t('pages.monitor.rule.import.enabled')}
              </Checkbox>
            </Form.Item>
          </Form>
        </>
      )}

      {step === 'result' && result && (
        <>
          <Alert
            type={(result.failed ?? 0) > 0 ? 'warning' : 'success'}
            showIcon
            title={t('pages.monitor.rule.import.result.summary', {
              created: result.created ?? 0,
              updated: result.updated ?? 0,
              skipped: result.skipped ?? 0,
              failed: result.failed ?? 0,
            })}
            style={{ marginBottom: 12 }}
          />
          <Table<ImportRuleResult>
            size="small"
            rowKey={(row) => row.index ?? 0}
            dataSource={result.results ?? []}
            pagination={
              (result.results ?? []).length > 10
                ? { pageSize: 10, showSizeChanger: false }
                : false
            }
            columns={[
              {
                title: t('pages.monitor.rule.column.name'),
                dataIndex: 'name',
              },
              {
                title: t('pages.monitor.rule.batch.column.result'),
                dataIndex: 'action',
                width: 110,
                render: (_, row) => {
                  const meta = row.action && IMPORT_RESULT_META[row.action];
                  return meta ? (
                    <Tag color={meta.color}>{t(meta.textId)}</Tag>
                  ) : (
                    t('common.empty')
                  );
                },
              },
              {
                title: t('pages.monitor.rule.batch.column.reason'),
                dataIndex: 'error',
                render: (_, row) =>
                  row.error
                    ? t('pages.monitor.rule.import.problem.error', {
                        detail: row.error,
                      })
                    : t('common.empty'),
              },
            ]}
          />
        </>
      )}
    </Modal>
  );
};

export default ImportModal;
