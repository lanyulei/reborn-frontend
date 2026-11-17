/**
 * 流程设计器页：左侧画布（结构化编辑，版面自动），右侧抽屉配置选中的节点 / 分支，
 * 顶部保存草稿 / 发布，下方列出校验问题（点击定位）。
 * 草稿可以带着未完成项保存；发布以后端校验为准。
 */
import {
  DiffOutlined,
  PlayCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Drawer,
  Flex,
  Form,
  Modal,
  Result,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  branchSummary,
  ConfigPanel,
  type FieldGroup,
  type Flow,
  FlowCanvas,
  findTarget,
  fromGraph,
  locateIssue,
  type OncallGroupOption,
  RawGraphView,
  stepSummary,
  toGraph,
  walkNodes,
} from '@/components/FlowDesigner';
import { UserSelect } from '@/components/UserSelect';
import { listGroups } from '@/services/oncall/group';
import { listSchedules } from '@/services/oncall/schedule';
import { usePermissions } from '@/services/system/permissions';
import { getErrorMessage } from '@/services/system/request';
import { listRoles } from '@/services/system/role';
import { getTemplate, listManagedCatalog } from '@/services/ticket';
import { listWebhooks } from '@/services/workflow/config';
import {
  getDefinition,
  listDefinitions,
  publishDefinition,
  saveDefinitionDraft,
  WORKFLOW_DEFINITION_CONFLICT,
} from '@/services/workflow/definition';
import type {
  GraphIssue,
  WorkflowDefinition,
} from '@/services/workflow/typings';
import { useT } from '@/utils/i18n';
import { fetchAllPages } from '@/utils/paging';
import { fetchWorkflowUsers } from '../components/meta';
import { Simulate } from './Simulate';
import { VersionCompare } from './VersionCompare';

const useStyles = createStyles(({ token, css }) => ({
  /** 工具栏、提示与画布连成一块面板 */
  panel: css`
    overflow: hidden;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  toolbar: css`
    padding: 14px 20px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  alert: css`
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  title: css`
    margin: 0 !important;
    font-size: ${token.fontSizeLG}px !important;
  `,
  canvas: css`
    height: calc(100vh - 320px);
    min-height: 420px;

    /* 画布自带圆角，嵌在面板里时由面板统一裁切 */
    > * {
      border-radius: 0;
    }
  `,
  issue: css`
    cursor: pointer;
    &:hover {
      color: ${token.colorPrimary};
    }
  `,
}));

/** 接口错误里的原因码与说明 */
const errorOf = (error: unknown): { reason?: string; message?: string } =>
  (error as { response?: { data?: { reason?: string; message?: string } } })
    .response?.data ?? {};

/** 流程管理员数量上限（与后端校验一致） */
const MAX_ADMINS = 20;

const DefinitionDesign: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { styles } = useStyles();
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const [definition, setDefinition] = useState<WorkflowDefinition>();
  const [flow, setFlow] = useState<Flow>();
  /** 图不是设计器产生的（经接口写入）：只读展示原图，不能编辑 */
  const [rawGraph, setRawGraph] = useState<Record<string, unknown>>();
  const [compareOpen, setCompareOpen] = useState(false);
  const [issues, setIssues] = useState<GraphIssue[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  /** 加载失败（无权限 / 不存在 / 网络）：显示说明与返回，而不是只剩一条工具栏 */
  const [loadFailed, setLoadFailed] = useState(false);
  /** 草稿已被他人修改：让用户选「加载最新」还是「覆盖保存」 */
  const [conflict, setConflict] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<{ code: string; name: string }[]>([]);
  // 值班组与值班表（值班人规则的候选）
  const [oncallGroups, setOncallGroups] = useState<OncallGroupOption[]>([]);
  // 绑定了这个流程的工单模板及其表单字段：配置表单权限时按模板挑字段
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [webhooks, setWebhooks] =
    useState<{ id: string; name: string; enabled: boolean }[]>();
  const [definitions, setDefinitions] = useState<
    { key: string; name: string }[]
  >([]);
  // 编辑序号：每次修改加一。保存时记下发出去的是第几版，返回后只有期间没有新修改才算「已保存」
  const editSeq = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDefinition(id);
      setDefinition(result.definition);
      const parsed = fromGraph(result.draft);
      setFlow(parsed);
      setRawGraph(parsed ? undefined : (result.draft ?? {}));
      setIssues(result.issues ?? []);
      setDirty(false);
      setLoadFailed(false);
      return true;
    } catch {
      // 失败提示由请求层统一弹出
      setLoadFailed(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
    // 角色候选：无权限时静默为空（仍可使用其他处理人规则）
    fetchAllPages((page, pageSize) =>
      listRoles({ page, pageSize, status: 1 }, { silent: true }),
    )
      .then((items) =>
        setRoles(items.map((r) => ({ code: r.code, name: r.name }))),
      )
      .catch(() => undefined);
    // 值班组与其下的值班表：同样静默失败（没有权限时值班人规则只回显已配置的名称）
    Promise.all([
      fetchAllPages((page, pageSize) =>
        listGroups({ page, pageSize }, { silent: true }),
      ),
      listSchedules(undefined, { silent: true }),
    ])
      .then(([groups, { items }]) =>
        setOncallGroups(
          groups.map((g) => ({
            id: g.id,
            name: g.name,
            schedules: (items ?? [])
              .filter((s) => s.groupId === g.id)
              .map((s) => ({
                id: s.id,
                name: s.config.name,
                enabled: s.status === 1,
              })),
          })),
        ),
      )
      .catch(() => undefined);
    // 自动任务可选的 Webhook 端点、子流程可选的流程：同样静默失败（配置面板里仍能看到已选值）
    listWebhooks({ silent: true })
      .then((items) =>
        setWebhooks(
          items.map((w) => ({
            id: w.id,
            name: w.name,
            enabled: w.status === 1,
          })),
        ),
      )
      .catch(() => undefined);
    fetchAllPages((page, pageSize) =>
      listDefinitions({ page, pageSize }, { silent: true }),
    )
      .then((items) =>
        setDefinitions(
          items
            .filter((d) => d.id !== id)
            .map((d) => ({ key: d.key, name: d.name })),
        ),
      )
      .catch(() => undefined);
  }, [load, id]);

  // 有未保存的修改时拦住离开：站内跳转（菜单、返回、浏览器前进后退）弹确认，
  // 关闭 / 刷新页面由 history.block 自带的 beforeunload 提醒
  useEffect(() => {
    if (!dirty) return;
    // 确认框还开着时再次触发跳转（连点返回 / 菜单）：不叠第二个确认框
    let asking = false;
    const unblock = history.block((tx) => {
      if (asking) return;
      asking = true;
      modal.confirm({
        title: t('pages.workflow.design.leave.title'),
        content: t('pages.workflow.design.leave.content'),
        okButtonProps: { danger: true },
        onOk: () => {
          unblock();
          tx.retry();
        },
        afterClose: () => {
          asking = false;
        },
      });
    });
    return unblock;
  }, [dirty, modal, t]);

  const nodeNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const node of walkNodes(flow?.nodes ?? [])) {
      if (node.kind !== 'branch') names.set(node.id, node.name);
      // 分支也记名称：问题列表里按分支定位的问题带上分支名
      else
        for (const branch of node.branches) names.set(branch.id, branch.name);
    }
    return names;
  }, [flow]);

  /** 问题说明：按问题码本地化，未收录的码回落后端的英文说明 */
  const issueText = useCallback(
    (issue: GraphIssue) => {
      const key = `component.flow.issue.${issue.code}`;
      const text = t(key);
      return text === key ? issue.message : text;
    },
    [t],
  );

  /** 画布元素 ID → 问题说明（卡片角标） */
  const issueMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    if (!flow) return map;
    for (const issue of issues) {
      const target = locateIssue(flow, issue);
      if (!target) continue;
      map[target] = [...(map[target] ?? []), issueText(issue)];
    }
    return map;
  }, [flow, issues, issueText]);

  const change = (next: Flow) => {
    editSeq.current += 1;
    setFlow(next);
    setDirty(true);
  };

  /** 保存 / 发布失败的提示：修订号过期时让用户选怎么办，草稿过大时说明原因，其余照常提示 */
  const reportFailure = (error: unknown) => {
    const { reason } = errorOf(error);
    if (reason === WORKFLOW_DEFINITION_CONFLICT) {
      setConflict(true);
    } else if (reason === 'WORKFLOW_GRAPH_TOO_LARGE') {
      message.error(t('pages.workflow.design.tooLarge'));
    } else {
      message.error(getErrorMessage(error));
    }
  };

  /**
   * 保存草稿；返回保存后的修订号与问题（失败返回 undefined，提示已给出）。
   * revision 缺省用当前所见的修订号；「覆盖保存」时传刚取回的最新修订号。
   */
  const save = async (revision = definition?.revision) => {
    if (!flow || !definition || revision === undefined) return undefined;
    setSaving(true);
    const sent = editSeq.current;
    try {
      const result = await saveDefinitionDraft(id, toGraph(flow), revision, {
        silent: true,
      });
      setDefinition((d) => (d ? { ...d, revision: result.revision } : d));
      setIssues(result.issues ?? []);
      // 请求在途时又有修改：库里是旧内容，仍然是「未保存」
      const clean = editSeq.current === sent;
      setDirty(!clean);
      return { ...result, clean };
    } catch (error) {
      reportFailure(error);
      return undefined;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (revision?: number) => {
    const result = await save(revision);
    if (!result) return;
    if (result.issues?.length) {
      message.warning(
        t('pages.workflow.design.saved.issues', { n: result.issues.length }),
      );
    } else {
      message.success(t('common.msg.saved'));
    }
  };

  /** 冲突处理：放弃自己的修改，加载别人保存的最新草稿 */
  const reloadLatest = async () => {
    setResolving(true);
    try {
      if (await load()) setConflict(false);
    } finally {
      setResolving(false);
    }
  };

  /** 冲突处理：以自己正在编辑的内容覆盖（取回最新修订号后再保存） */
  const overwrite = async () => {
    setResolving(true);
    try {
      const latest = await getDefinition(id);
      setConflict(false);
      await handleSave(latest.definition.revision);
    } catch {
      // 失败提示由请求层统一弹出，留在冲突对话框里
    } finally {
      setResolving(false);
    }
  };

  const handlePublish = async () => {
    // 发布的是库里的草稿：有未保存的修改先保存，并以保存后的校验结果为准
    let revision = definition?.revision;
    let current = issues;
    if (dirty) {
      const saved = await save();
      // 保存期间又有修改：不发布旧内容，留给用户再点一次
      if (!saved?.clean) return;
      revision = saved.revision;
      current = saved.issues ?? [];
    }
    if (revision === undefined) return;
    if (current.length > 0) {
      message.error(t('pages.workflow.design.publish.blocked'));
      return;
    }
    const target = revision;
    modal.confirm({
      title: t('pages.workflow.design.publish.title'),
      content: t('pages.workflow.design.publish.content'),
      onOk: async () => {
        try {
          const published = await publishDefinition(id, target, {
            silent: true,
          });
          setDefinition(published.definition);
          message.success(
            t('pages.workflow.design.published', {
              version: published.definition.publishedVersion ?? 0,
            }),
          );
        } catch (error) {
          reportFailure(error);
        }
      },
    });
  };

  // 有未保存的修改时由上面的离开拦截弹确认
  const back = () => history.push('/workflow/definition');

  // 找出绑定了这个流程的工单模板并取它们的表单字段。没有工单模板权限时静默为空，
  // 表单权限里退回手工填写字段码
  const definitionKey = definition?.key;
  useEffect(() => {
    if (!definitionKey) return;
    let stale = false;
    listManagedCatalog({ silent: true })
      .then(async ({ items }) => {
        const bound = (items ?? [])
          .flatMap((category) => category.templates ?? [])
          .filter((template) => template.workflowKey === definitionKey);
        const details = await Promise.all(
          bound.map((template) => getTemplate(template.id, { silent: true })),
        );
        if (stale) return;
        setFieldGroups(
          details.map(({ template }) => ({
            key: template.id,
            name: template.name,
            fields: (template.form ?? []).map((f) => ({
              code: f.code,
              name: f.name,
            })),
          })),
        );
      })
      .catch(() => undefined);
    return () => {
      stale = true;
    };
  }, [definitionKey]);

  /** 版本对比里的「当前草稿」：编辑中的内容（含未保存的修改）；接口创建的图用原图 */
  const draftGraph = useMemo(
    () => (flow ? toGraph(flow) : rawGraph),
    [flow, rawGraph],
  );

  const target = flow ? findTarget(flow, selectedId) : {};
  const canPublish = has('workflow.definition.publish');

  return (
    <PageContainer title={false}>
      <Spin spinning={loading}>
        <div className={styles.panel}>
          <Flex className={styles.toolbar} align="center" gap={12} wrap>
            <Typography.Title level={5} className={styles.title}>
              {definition?.name}
            </Typography.Title>
            {definition &&
              (definition.publishedVersion ? (
                <Tag color="blue">
                  {t('pages.workflow.design.version', {
                    version: definition.publishedVersion,
                  })}
                </Tag>
              ) : (
                <Tag>{t('pages.workflow.definition.unpublished')}</Tag>
              ))}
            {dirty && (
              <Tag color="warning">{t('pages.workflow.design.unsaved')}</Tag>
            )}
            <Flex flex={1} justify="flex-end" gap={12}>
              <Button
                icon={<DiffOutlined />}
                onClick={() => setCompareOpen(true)}
                disabled={!definition?.publishedVersion}
              >
                {t('pages.workflow.compare.title')}
              </Button>
              <Button
                icon={<PlayCircleOutlined />}
                onClick={() => setSimulateOpen(true)}
                disabled={!flow}
              >
                {t('pages.workflow.simulate.title')}
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setSettingsOpen(true)}
                disabled={!flow}
              >
                {t('pages.workflow.design.settings')}
              </Button>
              <Button
                onClick={() => void handleSave()}
                loading={saving}
                disabled={!flow || !dirty}
              >
                {t('pages.workflow.design.save')}
              </Button>
              {canPublish && (
                <Button
                  type="primary"
                  onClick={() => void handlePublish()}
                  disabled={!flow || saving}
                >
                  {t('pages.workflow.design.publish')}
                </Button>
              )}
            </Flex>
          </Flex>

          {loadFailed && !definition ? (
            <Result
              status="warning"
              title={t('pages.workflow.design.loadFailed')}
              extra={
                <Flex justify="center" gap={8}>
                  <Button onClick={back}>
                    {t('pages.workflow.design.back')}
                  </Button>
                  <Button type="primary" onClick={() => void load()}>
                    {t('pages.workflow.design.retry')}
                  </Button>
                </Flex>
              }
            />
          ) : rawGraph ? (
            <>
              <Alert
                className={styles.alert}
                banner
                type="info"
                showIcon
                title={t('pages.workflow.design.unsupported.title')}
                description={t('pages.workflow.design.unsupported.desc')}
              />
              <div className={styles.canvas}>
                <RawGraphView graph={rawGraph} />
              </div>
            </>
          ) : (
            flow && (
              <>
                {issues.length > 0 && (
                  <Alert
                    className={styles.alert}
                    banner
                    type="warning"
                    showIcon
                    title={t('pages.workflow.design.issues', {
                      n: issues.length,
                    })}
                    description={
                      <Flex vertical gap={2}>
                        {issues.map((issue, index) => {
                          const at = locateIssue(flow, issue);
                          const name = at ? nodeNames.get(at) : undefined;
                          return (
                            // biome-ignore lint/suspicious/noArrayIndexKey: 问题列表按顺序展示，无稳定标识
                            <span key={index}>
                              {at ? (
                                <a
                                  className={styles.issue}
                                  onClick={() => setSelectedId(at)}
                                >
                                  {name ? `${name}：` : ''}
                                  {issueText(issue)}
                                </a>
                              ) : (
                                issueText(issue)
                              )}
                            </span>
                          );
                        })}
                      </Flex>
                    }
                  />
                )}
                <div className={styles.canvas}>
                  <FlowCanvas
                    flow={flow}
                    onChange={change}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    issues={issueMap}
                    summaryOf={(node) => stepSummary(node, t)}
                    conditionOf={(branch) => branchSummary(branch, t)}
                    nameOf={(nodeId) => nodeNames.get(nodeId) ?? nodeId}
                  />
                </div>
                <Drawer
                  title={
                    target.node
                      ? t(`component.flow.panel.${target.node.kind}`)
                      : t('component.flow.panel.branch')
                  }
                  size={600}
                  open={!!(target.node || target.branch)}
                  onClose={() => setSelectedId(undefined)}
                  mask={false}
                  destroyOnHidden
                >
                  <ConfigPanel
                    flow={flow}
                    selectedId={selectedId}
                    onChange={change}
                    deps={{
                      fetchUsers: fetchWorkflowUsers,
                      roles,
                      webhooks,
                      definitions,
                      fieldGroups,
                      oncallGroups,
                    }}
                  />
                </Drawer>
                <Simulate
                  definitionId={id}
                  open={simulateOpen}
                  onClose={() => setSimulateOpen(false)}
                  flow={flow}
                  nameOf={(nodeId) => nodeNames.get(nodeId) ?? nodeId}
                />
                <Modal
                  title={t('pages.workflow.design.settings')}
                  width={520}
                  open={settingsOpen}
                  onCancel={() => setSettingsOpen(false)}
                  footer={null}
                  destroyOnHidden
                >
                  <Form layout="vertical">
                    <Form.Item
                      label={t('pages.workflow.design.settings.admins')}
                      extra={t('pages.workflow.design.settings.admins.extra')}
                    >
                      <UserSelect
                        multiple
                        maxCount={MAX_ADMINS}
                        style={{ width: '100%' }}
                        fetchUsers={fetchWorkflowUsers}
                        knownUsers={flow.admins.map((uid) => ({
                          id: uid,
                          label: flow.adminLabels?.[uid] ?? uid,
                        }))}
                        value={flow.admins}
                        placeholder={t('pages.workflow.form.user.placeholder')}
                        onLabeledChange={(users) =>
                          change({
                            ...flow,
                            admins: users.map((u) => u.id),
                            adminLabels: Object.fromEntries(
                              users.map((u) => [u.id, u.label]),
                            ),
                          })
                        }
                      />
                    </Form.Item>
                  </Form>
                </Modal>
              </>
            )
          )}
        </div>
      </Spin>
      <Modal
        title={t('pages.workflow.design.conflict.title')}
        open={conflict}
        closable={!resolving}
        mask={{ closable: false }}
        onCancel={() => setConflict(false)}
        footer={
          <Flex justify="flex-end" gap={8} wrap>
            <Button disabled={resolving} onClick={() => setConflict(false)}>
              {t('common.action.cancel')}
            </Button>
            <Button
              danger
              disabled={resolving}
              onClick={() => void reloadLatest()}
            >
              {t('pages.workflow.design.conflict.reload')}
            </Button>
            <Button
              type="primary"
              danger
              loading={resolving}
              onClick={() => void overwrite()}
            >
              {t('pages.workflow.design.conflict.overwrite')}
            </Button>
          </Flex>
        }
      >
        {t('pages.workflow.design.conflict.content')}
      </Modal>
      <VersionCompare
        definitionId={id}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        draftGraph={draftGraph}
      />
    </PageContainer>
  );
};

export default DefinitionDesign;
