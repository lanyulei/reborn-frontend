/**
 * 处置预案：一组有序步骤（作业模板 / 流程定义 + 参数 + 审批 + 风险 + 执行目标），附操作文档与推荐条件；
 * 代理执行人是步骤实际以其身份运行的机器账号（其作业 / 流程权限决定能做什么）。
 */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {
  App,
  Button,
  Col,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { SectionTitle } from '@/components/SectionTitle';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import { UserSelect } from '@/components/UserSelect';
import { ENABLED_META } from '@/constants';
import { FULL, HALF } from '@/constants/layout';
import {
  MatchersEditor,
  normalizeMatchers,
} from '@/pages/monitor/components/MatchersEditor';
import {
  createPlaybook,
  deletePlaybook,
  getPlaybook,
  listPlaybooks,
  listPlaybookTargets,
  updatePlaybook,
} from '@/services/incident/config';
import type {
  LabelMatcher,
  Playbook,
  PlaybookSpec,
  PlaybookStep,
  PlaybookTarget,
} from '@/services/incident/typings';
import type { LabelMatcher as MonitorMatcher } from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import {
  fetchIncidentUsers,
  refOptions,
  refsToKnown,
  useIncidentOptions,
} from '../components/hooks';
import {
  APPROVAL_META,
  APPROVAL_ORDER,
  CONFIG_TABS,
  INCIDENT_LIMITS,
  RISK_META,
  RISK_ORDER,
  TARGET_MODE_META,
  TARGET_MODE_ORDER,
} from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import { RefName } from '../components/tags';

const MAX_STEPS = 20;

/** 步骤编辑器（受控）：每行 = 名称 / 类型 / 目标 / 审批 / 风险 / 执行目标；参数以 key=value 每行一个 */
const StepsEditor: React.FC<{
  value?: PlaybookStep[];
  onChange?: (v: PlaybookStep[]) => void;
  targets: PlaybookTarget[];
}> = ({ value, onChange, targets }) => {
  const t = useT();
  const { styles } = useIncidentStyles();
  const rows = value ?? [];
  // 参数文本框受控：编辑中的原文按步骤位置暂存，失焦解析进 step.params 后清掉
  const [paramDrafts, setParamDrafts] = useState<Record<number, string>>({});
  const update = (i: number, patch: Partial<PlaybookStep>) =>
    onChange?.(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const paramsText = (p?: Record<string, string>) =>
    Object.entries(p ?? {})
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
  const parseParams = (text: string) =>
    Object.fromEntries(
      text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const i = l.indexOf('=');
          return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1)] : [l, ''];
        }),
    );
  return (
    <div>
      {rows.map((row, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: 步骤按位置标识，顺序就是语义
          key={`${i}-${row.ref}`}
          className={styles.step}
        >
          <div className={styles.stepHead}>
            <span>{t('pages.incident.playbook.step.index', { n: i + 1 })}</span>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                setParamDrafts({});
                onChange?.(rows.filter((_, idx) => idx !== i));
              }}
            />
          </div>
          <div className={styles.stepGrid}>
            <div>
              <div className={styles.fieldLabel}>
                {t('pages.incident.playbook.step.name')}
              </div>
              <Input
                value={row.name}
                maxLength={INCIDENT_LIMITS.nameMax}
                onChange={(e) => update(i, { name: e.target.value })}
              />
            </div>
            <div>
              <div className={styles.fieldLabel}>
                {t('pages.incident.playbook.step.kind')}
              </div>
              <Select
                style={{ width: '100%' }}
                value={row.kind}
                options={[
                  {
                    value: 'job',
                    label: t('pages.incident.proposal.kind.job'),
                  },
                  {
                    value: 'workflow',
                    label: t('pages.incident.proposal.kind.workflow'),
                  },
                ]}
                onChange={(kind) => update(i, { kind, ref: '' })}
              />
            </div>
            <div>
              <div className={styles.fieldLabel}>
                {t('pages.incident.playbook.step.ref')}
              </div>
              <Select
                style={{ width: '100%' }}
                showSearch={{ optionFilterProp: 'label' }}
                value={row.ref || undefined}
                placeholder={t('pages.incident.playbook.step.refPlaceholder')}
                options={targets
                  .filter((x) => x.kind === row.kind)
                  .map((x) => ({ value: x.ref, label: x.name ?? x.ref }))}
                onChange={(ref) => update(i, { ref })}
              />
            </div>
            <div>
              <div className={styles.fieldLabel}>
                {t('pages.incident.playbook.step.approval')}
              </div>
              <Select
                style={{ width: '100%' }}
                value={row.approval ?? 0}
                options={APPROVAL_ORDER.map((a) => ({
                  value: a,
                  label: t(APPROVAL_META[a].textId),
                }))}
                onChange={(approval) => update(i, { approval })}
              />
            </div>
            <div>
              <div className={styles.fieldLabel}>
                {t('pages.incident.proposal.risk')}
              </div>
              <Select
                style={{ width: '100%' }}
                value={row.risk ?? 2}
                options={RISK_ORDER.map((r) => ({
                  value: r,
                  label: t(RISK_META[r].textId),
                }))}
                onChange={(risk) => update(i, { risk })}
              />
            </div>
            <div>
              <div className={styles.fieldLabel}>
                {t('pages.incident.playbook.step.target')}
              </div>
              <Select
                style={{ width: '100%' }}
                value={row.targetMode ?? 0}
                options={TARGET_MODE_ORDER.map((m) => ({
                  value: m,
                  label: t(TARGET_MODE_META[m].textId),
                }))}
                onChange={(targetMode) => update(i, { targetMode })}
              />
            </div>
          </div>
          <div className={styles.fieldLabel}>
            {t('pages.incident.playbook.step.params')}
          </div>
          <Input.TextArea
            value={paramDrafts[i] ?? paramsText(row.params)}
            autoSize={{ minRows: 1, maxRows: 4 }}
            placeholder={t('pages.incident.playbook.step.paramsPlaceholder')}
            onChange={(e) =>
              setParamDrafts((d) => ({ ...d, [i]: e.target.value }))
            }
            onBlur={(e) => {
              update(i, { params: parseParams(e.target.value) });
              setParamDrafts((d) => {
                const { [i]: _, ...rest } = d;
                return rest;
              });
            }}
            className={styles.mono}
          />
        </div>
      ))}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        disabled={rows.length >= MAX_STEPS}
        onClick={() =>
          onChange?.([
            ...rows,
            {
              name: '',
              kind: 'job',
              ref: '',
              approval: 0,
              risk: 2,
              targetMode: 0,
            },
          ])
        }
      >
        {t('pages.incident.playbook.step.add')}
      </Button>
      <div className={styles.hint} style={{ marginTop: 6 }}>
        {t('pages.incident.playbook.step.hint')}
      </div>
    </div>
  );
};

const PlaybookDrawer: React.FC<{
  playbook: Playbook | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ playbook, onClose, onSaved }) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  const [targets, setTargets] = useState<PlaybookTarget[]>([]);
  const { options } = useIncidentOptions(['businesses']);
  useEffect(() => {
    listPlaybookTargets()
      .then((r) => setTargets(r.items ?? []))
      .catch(() => setTargets([]));
  }, []);
  return (
    <DrawerForm<PlaybookSpec>
      title={t(
        playbook
          ? 'pages.incident.playbook.edit'
          : 'pages.incident.playbook.create',
      )}
      open
      width={720}
      grid
      rowProps={{ gutter: 16 }}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      drawerProps={{ destroyOnHidden: true }}
      initialValues={
        playbook ? playbook.spec : { enabled: true, steps: [], match: {} }
      }
      onFinish={async (values) => {
        const steps = (values.steps ?? []).map((s) => ({
          ...s,
          name: s.name.trim(),
        }));
        if (steps.length === 0 || steps.some((s) => !s.name || !s.ref)) {
          message.error(t('pages.incident.playbook.stepsInvalid'));
          return false;
        }
        const spec: PlaybookSpec = {
          ...values,
          name: values.name.trim(),
          steps,
          match: {
            ...values.match,
            matchers: normalizeMatchers(
              values.match?.matchers as MonitorMatcher[] | undefined,
            ) as LabelMatcher[],
          },
        };
        if (playbook) {
          await updatePlaybook(playbook.id, spec, playbook.version ?? 0);
          message.success(t('common.msg.saved'));
        } else {
          await createPlaybook(spec);
          message.success(t('common.msg.created'));
        }
        onSaved();
        return true;
      }}
    >
      <ProFormText
        name="name"
        label={t('pages.incident.playbook.name')}
        colProps={HALF}
        rules={[
          rules.required(t('pages.incident.playbook.name')),
          rules.maxChars(INCIDENT_LIMITS.nameMax),
        ]}
      />
      <Col span={12}>
        <Form.Item
          name="agentUserId"
          label={t('pages.incident.playbook.agentUser')}
          extra={t('pages.incident.playbook.agentUserHint')}
        >
          <UserSelect
            fetchUsers={fetchIncidentUsers}
            knownUsers={refsToKnown(
              playbook?.agentUser ? [playbook.agentUser] : [],
            )}
          />
        </Form.Item>
      </Col>
      <ProFormTextArea
        name="description"
        label={t('pages.incident.business.description')}
        colProps={FULL}
        fieldProps={{ rows: 2, maxLength: INCIDENT_LIMITS.descriptionMax }}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        colProps={HALF}
      />
      <SectionTitle>{t('pages.incident.playbook.steps')}</SectionTitle>
      <Col span={24}>
        <Form.Item name="steps">
          <StepsEditor targets={targets} />
        </Form.Item>
      </Col>
      <SectionTitle>{t('pages.incident.playbook.match')}</SectionTitle>
      <ProFormSelect
        name={['match', 'businessIds']}
        label={t('pages.incident.playbook.matchBusinesses')}
        colProps={HALF}
        mode="multiple"
        showSearch
        options={refOptions(options.businesses)}
      />
      <ProFormSelect
        name={['match', 'modelCodes']}
        label={t('pages.incident.rule.modelCodes')}
        colProps={HALF}
        mode="tags"
        fieldProps={{ tokenSeparators: [',', ' '] }}
      />
      <Col span={24}>
        <Form.Item
          name={['match', 'matchers']}
          label={t('pages.incident.rule.matchers')}
        >
          <MatchersEditor />
        </Form.Item>
      </Col>
      <SectionTitle>{t('pages.incident.playbook.doc')}</SectionTitle>
      <ProFormTextArea
        name="doc"
        colProps={FULL}
        fieldProps={{
          rows: 8,
          maxLength: INCIDENT_LIMITS.docSectionMax,
          showCount: true,
        }}
        extra={t('pages.incident.playbook.docHint')}
      />
    </DrawerForm>
  );
};

const PlaybookList: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const { styles } = useIncidentStyles();
  const actionRef = useRef<ActionType>(null);
  const enabledEnum = useValueEnum(ENABLED_META);
  const [formRow, setFormRow] = useState<Playbook | null | undefined>(
    undefined,
  );
  const reload = () => actionRef.current?.reload();

  const columns: ProColumns<Playbook>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.incident.playbook.keywordPlaceholder'),
      },
    },
    {
      title: t('pages.incident.playbook.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      render: (_, r) => (
        <div>
          <div>{r.spec.name}</div>
          {r.spec.description && (
            <div className={styles.hint}>{r.spec.description}</div>
          )}
        </div>
      ),
    },
    {
      title: t('pages.incident.playbook.steps'),
      key: 'steps',
      search: false,
      render: (_, r) => (
        <Space size={[4, 4]} wrap>
          {(r.spec.steps ?? []).map((s, i) => {
            const ref = r.stepRefs?.[i];
            return (
              <Tooltip
                // biome-ignore lint/suspicious/noArrayIndexKey: 步骤按位置标识，顺序就是语义
                key={`${i}-${s.ref}`}
                title={`${t(`pages.incident.proposal.kind.${s.kind}`)} · ${ref?.name || s.ref}`}
              >
                <Tag
                  color={ref?.missing ? 'error' : RISK_META[s.risk ?? 2].color}
                >
                  {i + 1}. {s.name}
                </Tag>
              </Tooltip>
            );
          })}
        </Space>
      ),
    },
    {
      title: t('pages.incident.playbook.agentUser'),
      dataIndex: 'agentUser',
      search: false,
      width: 120,
      ellipsis: true,
      render: (_, r) => <RefName ref={r.agentUser} />,
    },
    {
      title: t('pages.incident.playbook.matchBusinesses'),
      dataIndex: 'businessRefs',
      search: false,
      width: 160,
      render: (_, r) =>
        r.businessRefs?.length
          ? r.businessRefs.map((b) => <Tag key={b.id}>{b.name || b.id}</Tag>)
          : t('pages.incident.playbook.anyBusiness'),
    },
    {
      title: t('pages.incident.playbook.execCount'),
      dataIndex: 'execCount',
      search: false,
      width: 90,
    },
    {
      title: t('common.column.enabled'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
      render: (_, r) =>
        r.spec.enabled ? (
          <Tag color="success">{t('common.status.enabled')}</Tag>
        ) : (
          <Tag>{t('common.status.disabled')}</Tag>
        ),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 120,
      hideInTable: !(
        has('incident.playbook.update') || has('incident.playbook.delete')
      ),
      render: (_, r) => (
        <Space size={8}>
          {has('incident.playbook.update') && (
            <a onClick={async () => setFormRow(await getPlaybook(r.id))}>
              {t('common.action.edit')}
            </a>
          )}
          {has('incident.playbook.delete') && (
            <DeleteConfirmLink
              title={t('pages.incident.playbook.delete.title', {
                name: r.spec.name,
              })}
              description={t('pages.incident.playbook.delete.desc')}
              onConfirm={async () => {
                await deletePlaybook(r.id);
                message.success(t('common.msg.deleted'));
                reload();
              }}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <RouteTabsPage tabs={CONFIG_TABS}>
      <ProTable<Playbook>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        cardBordered
        headerTitle={
          has('incident.playbook.create') && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.incident.playbook.create')}
            </CreateButton>
          )
        }
        request={async (params) =>
          toTableResult(
            await listPlaybooks({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword?.trim() || undefined,
              enabled: parseBoolParam(params.enabled),
            }),
          )
        }
        columnEmptyText={t('common.empty')}
        search={{ labelWidth: 'auto' }}
        scroll={{ x: 'max-content' }}
      />
      {formRow !== undefined && (
        <PlaybookDrawer
          playbook={formRow}
          onClose={() => setFormRow(undefined)}
          onSaved={() => {
            setFormRow(undefined);
            reload();
          }}
        />
      )}
    </RouteTabsPage>
  );
};

export default PlaybookList;
