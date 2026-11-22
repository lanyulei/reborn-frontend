/**
 * 故障详情「处置建议」：建议列表（标题 / 动作 / 风险 / 状态 / 提出者 / 结果 / 验证），指挥审批或拒绝，
 * 提出者可取消；处理人按预案步骤提出新建议；熔断后指挥可恢复自动通过。
 */

import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormDependency,
  ProFormSelect,
  ProFormSwitch,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import {
  Alert,
  App,
  Badge,
  Button,
  Empty,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmLink } from '@/components/TableActions';
import { getPlaybook } from '@/services/incident/config';
import {
  cancelProposal,
  createProposal,
  decideProposal,
  listProposals,
  resetAutoApprove,
} from '@/services/incident/proposal';
import type { Incident, Playbook, Proposal } from '@/services/incident/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useFormRules, useT } from '@/utils/i18n';
import { useIncidentOptions } from '../components/hooks';
import {
  ACTOR_META,
  INCIDENT_LIMITS,
  PROPOSAL_STATUS_META,
  RISK_META,
} from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import { RefName } from '../components/tags';

const badge = (status?: string) =>
  (status?.toLowerCase() ?? 'default') as
    | 'success'
    | 'processing'
    | 'error'
    | 'default'
    | 'warning';

/** 提出建议：选预案与步骤；指挥可勾选「提出即通过」 */
const ProposeModal: React.FC<{
  incident: Incident;
  onClose: () => void;
  onDone: () => void;
}> = ({ incident, onClose, onDone }) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  const { options } = useIncidentOptions(['playbooks']);
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const formRef = useRef<ProFormInstance>(undefined);
  // 只采纳最后一次选中预案的详情
  const seq = useRef(0);
  return (
    <ModalForm<{
      playbookId: string;
      stepIndex: number;
      reason?: string;
      approve?: boolean;
    }>
      title={t('pages.incident.proposal.propose')}
      width={560}
      open
      formRef={formRef}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      onValuesChange={async (changed) => {
        if (changed.playbookId) {
          const current = ++seq.current;
          formRef.current?.setFieldValue('stepIndex', undefined);
          setPlaybook(null);
          const pb = await getPlaybook(changed.playbookId).catch(() => null);
          if (current === seq.current) setPlaybook(pb);
        }
      }}
      onFinish={async (values) => {
        await createProposal(incident.id, {
          playbookId: values.playbookId,
          stepIndex: values.stepIndex,
          reason: values.reason?.trim(),
          approve: values.approve,
        });
        message.success(t('pages.incident.proposal.proposed'));
        onDone();
        return true;
      }}
    >
      <ProFormSelect
        name="playbookId"
        label={t('pages.incident.proposal.playbook')}
        rules={[rules.select(t('pages.incident.proposal.playbook'))]}
        showSearch
        options={(options.playbooks ?? []).map((p) => ({
          value: p.id,
          label: p.description ? `${p.name} · ${p.description}` : p.name,
        }))}
      />
      <ProFormDependency name={['playbookId']}>
        {({ playbookId }) => (
          <ProFormSelect
            name="stepIndex"
            label={t('pages.incident.proposal.step')}
            rules={[rules.select(t('pages.incident.proposal.step'))]}
            disabled={!playbookId}
            options={(playbook?.spec.steps ?? []).map((st, i) => ({
              value: i,
              label: `${i + 1}. ${st.name}（${t(RISK_META[st.risk ?? 2].textId)}）`,
            }))}
          />
        )}
      </ProFormDependency>
      <ProFormTextArea
        name="reason"
        label={t('pages.incident.proposal.reason')}
        fieldProps={{ rows: 3, maxLength: INCIDENT_LIMITS.noteMax }}
      />
      {incident.canManage && (
        <ProFormSwitch
          name="approve"
          label={t('pages.incident.proposal.approveNow')}
        />
      )}
    </ModalForm>
  );
};

const DecideModal: React.FC<{
  incident: Incident;
  proposal: Proposal;
  approved: boolean;
  onClose: () => void;
  onDone: () => void;
}> = ({ incident, proposal, approved, onClose, onDone }) => {
  const t = useT();
  const rules = useFormRules();
  const { message } = App.useApp();
  return (
    <ModalForm<{ note?: string }>
      title={t(
        approved
          ? 'pages.incident.proposal.approve'
          : 'pages.incident.proposal.reject',
      )}
      width={480}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      submitter={{ submitButtonProps: approved ? undefined : { danger: true } }}
      onFinish={async (values) => {
        await decideProposal(
          incident.id,
          proposal.id,
          approved,
          values.note?.trim(),
        );
        message.success(t('pages.incident.proposal.decided'));
        onDone();
        return true;
      }}
    >
      <Alert
        type={approved ? 'warning' : 'info'}
        showIcon
        title={proposal.title}
        description={
          <>
            {proposal.action?.refName && (
              <div>
                {t(
                  `pages.incident.proposal.kind.${proposal.action.kind ?? 'job'}`,
                )}
                ：{proposal.action.refName}
              </div>
            )}
            {(proposal.action?.ciRefs?.length ?? 0) > 0 && (
              <div>
                {t('pages.incident.proposal.targets')}：
                {proposal.action?.ciRefs?.map((c) => c.name || c.id).join('、')}
              </div>
            )}
          </>
        }
        style={{ marginBottom: 16 }}
      />
      <ProFormTextArea
        name="note"
        label={t('pages.incident.proposal.decisionNote')}
        rules={
          approved
            ? undefined
            : [rules.required(t('pages.incident.proposal.decisionNote'))]
        }
        fieldProps={{ rows: 3, maxLength: INCIDENT_LIMITS.noteMax }}
      />
    </ModalForm>
  );
};

export const ProposalsPanel: React.FC<{
  incident: Incident;
  refreshKey: number;
  onChanged: () => void;
}> = ({ incident, refreshKey, onChanged }) => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const { styles } = useIncidentStyles();
  const [items, setItems] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [decide, setDecide] = useState<{
    proposal: Proposal;
    approved: boolean;
  } | null>(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const current = ++seq.current;
    setLoading(true);
    try {
      const result = await listProposals(incident.id);
      if (current !== seq.current) return;
      setItems(result.items ?? []);
    } catch {
      if (current === seq.current) setItems([]);
    } finally {
      if (current === seq.current) setLoading(false);
    }
  }, [incident.id]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const active = incident.status <= 3;
  // 提出 / 审批 / 取消 / 恢复自动通过都要求元素权限，再叠加角色判定
  const canProposal = has('incident.list.proposal');
  const canHandle = canProposal && incident.canHandle === true && active;
  const canManage = canProposal && incident.canManage === true;
  // onChanged 会递增父级 refreshKey 触发本面板重载
  const done = () => onChanged();

  return (
    <div>
      {!incident.autoApprove && (
        <Alert
          type="warning"
          showIcon
          title={t('pages.incident.proposal.tripped')}
          action={
            canManage &&
            active && (
              <Button
                size="small"
                onClick={async () => {
                  await resetAutoApprove(incident.id);
                  message.success(t('pages.incident.proposal.autoReset'));
                  done();
                }}
              >
                {t('pages.incident.proposal.resetAuto')}
              </Button>
            )
          }
          style={{ marginBottom: 12 }}
        />
      )}
      {canHandle && (
        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" onClick={() => setProposeOpen(true)}>
            {t('pages.incident.proposal.propose')}
          </Button>
        </Space>
      )}
      <Spin spinning={loading}>
        {items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.incident.proposal.empty')}
          />
        ) : (
          <Table<Proposal>
            rowKey="id"
            size="small"
            dataSource={items}
            pagination={false}
            expandable={{
              expandedRowRender: (row) => (
                <div className={styles.pre}>
                  {row.reason && (
                    <div>
                      <strong>{t('pages.incident.proposal.reason')}：</strong>
                      {row.reason}
                    </div>
                  )}
                  {(row.evidence?.length ?? 0) > 0 && (
                    <div>
                      <strong>{t('pages.incident.proposal.evidence')}：</strong>
                      {row.evidence?.join('；')}
                    </div>
                  )}
                  {row.action?.params &&
                    Object.keys(row.action.params).length > 0 && (
                      <div className={styles.mono}>
                        {Object.entries(row.action.params)
                          .map(([k, v]) => `${k}=${v}`)
                          .join('  ')}
                      </div>
                    )}
                  {row.decisionNote && (
                    <div>
                      <strong>
                        {t('pages.incident.proposal.decisionNote')}：
                      </strong>
                      {row.decisionNote}
                    </div>
                  )}
                  {row.result && (
                    <div>
                      <strong>{t('pages.incident.proposal.result')}：</strong>
                      {row.result}
                    </div>
                  )}
                  {row.verifyResult && (
                    <div>
                      <strong>{t('pages.incident.proposal.verify')}：</strong>
                      {t('pages.incident.proposal.verifyText', {
                        before: row.verifyResult.alertsBefore ?? 0,
                        after: row.verifyResult.alertsAfter ?? 0,
                        resolved: row.verifyResult.resolved ?? 0,
                        fresh: row.verifyResult.newAlerts ?? 0,
                      })}
                      {row.verifyResult.worse && (
                        <Tag color="error" style={{ marginInlineStart: 6 }}>
                          {t('pages.incident.proposal.worse')}
                        </Tag>
                      )}
                    </div>
                  )}
                </div>
              ),
            }}
            columns={[
              {
                title: t('pages.incident.proposal.title'),
                dataIndex: 'title',
                ellipsis: true,
                render: (_, row) => (
                  <Space size={6}>
                    <span>{row.title}</span>
                    {row.auto && <Tag>{t('pages.incident.proposal.auto')}</Tag>}
                    {row.autoEligible && !row.auto && (
                      <Tag color="processing">
                        {t('pages.incident.proposal.autoEligible')}
                      </Tag>
                    )}
                  </Space>
                ),
              },
              {
                title: t('pages.incident.proposal.action'),
                dataIndex: 'action',
                ellipsis: true,
                render: (_, row) =>
                  row.action?.ref ? (
                    <Tooltip
                      title={row.action.ciRefs
                        ?.map((c) => c.name || c.id)
                        .join('、')}
                    >
                      <Tag>
                        {t(
                          `pages.incident.proposal.kind.${row.action.kind ?? 'job'}`,
                        )}
                      </Tag>
                      {row.action.refName || row.action.ref}
                      {(row.action.ciRefs?.length ?? 0) > 0 && (
                        <span className={styles.hint}>
                          {' '}
                          ×{row.action.ciRefs?.length}
                        </span>
                      )}
                    </Tooltip>
                  ) : (
                    t('common.empty')
                  ),
              },
              {
                title: t('pages.incident.proposal.risk'),
                dataIndex: 'risk',
                width: 80,
                render: (_, row) =>
                  row.risk ? (
                    <Tag color={RISK_META[row.risk].color}>
                      {t(RISK_META[row.risk].textId)}
                    </Tag>
                  ) : null,
              },
              {
                title: t('common.column.status'),
                dataIndex: 'status',
                width: 110,
                render: (_, row) => {
                  const meta = row.status
                    ? PROPOSAL_STATUS_META[row.status]
                    : undefined;
                  return meta ? (
                    <Badge status={badge(meta.status)} text={t(meta.textId)} />
                  ) : null;
                },
              },
              {
                title: t('pages.incident.proposal.proposer'),
                dataIndex: 'proposer',
                width: 120,
                ellipsis: true,
                render: (_, row) => (
                  <>
                    {row.proposerType && row.proposerType !== 1 && (
                      <Tag style={{ marginInlineEnd: 4 }}>
                        {t(ACTOR_META[row.proposerType].textId)}
                      </Tag>
                    )}
                    <RefName ref={row.proposer} />
                  </>
                ),
              },
              {
                title: t('pages.incident.proposal.decidedBy'),
                dataIndex: 'decidedBy',
                width: 120,
                ellipsis: true,
                render: (_, row) =>
                  row.decidedBy?.id ? (
                    <RefName ref={row.decidedBy} />
                  ) : (
                    t('common.empty')
                  ),
              },
              {
                title: t('pages.incident.proposal.exec'),
                dataIndex: 'execRef',
                width: 110,
                render: (_, row) =>
                  row.execUrl ? (
                    <Link to={row.execUrl}>
                      {t('pages.incident.proposal.openExec')}
                    </Link>
                  ) : (
                    <span className={styles.hint}>
                      {row.execRef
                        ? row.execRef.slice(0, 8)
                        : t('common.empty')}
                    </span>
                  ),
              },
              {
                title: t('common.column.createTime'),
                dataIndex: 'createTime',
                width: 160,
                render: (_, row) => formatTime(row.createTime),
              },
              {
                title: t('common.column.action'),
                key: 'op',
                width: 150,
                render: (_, row) =>
                  row.status === 1 ? (
                    <Space size={8}>
                      {row.canDecide && canProposal && (
                        <>
                          <a
                            onClick={() =>
                              setDecide({ proposal: row, approved: true })
                            }
                          >
                            {t('pages.incident.proposal.approve')}
                          </a>
                          <a
                            onClick={() =>
                              setDecide({ proposal: row, approved: false })
                            }
                          >
                            {t('pages.incident.proposal.reject')}
                          </a>
                        </>
                      )}
                      {canHandle && (
                        <ConfirmLink
                          title={t('pages.incident.proposal.cancel.title')}
                          onConfirm={async () => {
                            await cancelProposal(incident.id, row.id);
                            done();
                          }}
                        >
                          {t('common.action.cancel')}
                        </ConfirmLink>
                      )}
                    </Space>
                  ) : (
                    <Typography.Text type="secondary">
                      {row.expireTime && row.status === 8
                        ? formatTime(row.expireTime)
                        : ''}
                    </Typography.Text>
                  ),
              },
            ]}
          />
        )}
      </Spin>
      {proposeOpen && (
        <ProposeModal
          incident={incident}
          onClose={() => setProposeOpen(false)}
          onDone={done}
        />
      )}
      {decide && (
        <DecideModal
          incident={incident}
          proposal={decide.proposal}
          approved={decide.approved}
          onClose={() => setDecide(null)}
          onDone={done}
        />
      )}
    </div>
  );
};
