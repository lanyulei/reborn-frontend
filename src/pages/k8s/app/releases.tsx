/**
 * 应用（Helm）的 Release 侧：当前集群与命名空间内，以当前用户的身份访问集群
 * （Release 存放在 Secret 里，只读档位看不到）。
 * 安装 / 升级先预检（服务端 dry-run）：展示渲染出的清单，升级时对比 values 与清单两层差异，
 * 确认后才提交。卸载、回滚用确认弹窗，生产集群要求输入 Release 名。
 */
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  App,
  AutoComplete,
  Badge,
  Button,
  Descriptions,
  Drawer,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Spin,
  Table,
  Tabs,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SectionTitle from '@/components/SectionTitle';
import { CreateButton } from '@/components/TableActions';
import {
  getHelmChart,
  getHelmRelease,
  type HelmApplyBody,
  type HelmChartSummary,
  type HelmPreview,
  type HelmRelease,
  type HelmReleaseDetail,
  type HelmRepoOption,
  installHelmRelease,
  listHelmCharts,
  listHelmReleases,
  listHelmRepoOptions,
  previewHelmRelease,
  rollbackHelmRelease,
  uninstallHelmRelease,
  upgradeHelmRelease,
} from '@/services/k8s/helm';
import { getK8sErrorMessage, isChangeSubmitted } from '@/services/k8s/request';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { ApprovalNotice } from '../components/approval';
import { formatTime } from '../components/cells';
import { useDangerConfirm } from '../components/confirm';
import { NAME_REGEX } from '../components/meta';
import {
  type DetailTarget,
  ResourceDetail,
} from '../components/ResourceDetail';
import { ScopeSelects, useK8sScope } from '../components/scope';
import { useK8sStyles } from '../components/styles';
import { YamlDiff, YamlEditor } from '../components/YamlEditor';

/** 已打码的 values 条目（与后端的 MaskedValue 一致）：原样提交表示「保持现值」，由数据面还原 */
const MASKED_VALUE = /:\s*["']?\*{6}["']?\s*$/m;

const RELEASE_NAME =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

const STATUS_BADGE: Record<
  string,
  'success' | 'processing' | 'error' | 'default' | 'warning'
> = {
  deployed: 'success',
  failed: 'error',
  superseded: 'default',
  uninstalled: 'default',
  uninstalling: 'processing',
  'pending-install': 'processing',
  'pending-upgrade': 'processing',
  'pending-rollback': 'processing',
};

const ReleaseStatus: React.FC<{ status: string }> = ({ status }) => (
  <Badge status={STATUS_BADGE[status] ?? 'warning'} text={status} />
);

// ---------------------------------------------------------------------------
// 安装 / 升级
// ---------------------------------------------------------------------------

interface ApplyForm {
  namespace: string;
  name: string;
  repoId: string;
  chart: string;
  version: string;
}

const ReleaseModal: React.FC<{
  clusterId: string;
  namespace?: string;
  namespaces: string[];
  /** 升级的 Release；不传 = 安装 */
  current?: HelmReleaseDetail;
  onClose: () => void;
  onDone: () => void;
}> = ({ clusterId, namespace, namespaces, current, onClose, onDone }) => {
  const t = useT();
  const { message } = App.useApp();
  const upgrade = !!current;
  const [form] = Form.useForm<ApplyForm>();
  const [repos, setRepos] = useState<HelmRepoOption[]>([]);
  const [charts, setCharts] = useState<HelmChartSummary[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [values, setValues] = useState(current?.values ?? '');
  const [defaults, setDefaults] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [preview, setPreview] = useState<{
    body: HelmApplyBody;
    result: HelmPreview;
  }>();
  const repoId = Form.useWatch('repoId', form);
  const chart = Form.useWatch('chart', form);
  const version = Form.useWatch('version', form);
  const repo = repos.find((r) => r.id === repoId);
  const oci = repo?.type === 2;

  useEffect(() => {
    listHelmRepoOptions()
      .then((res) => setRepos(res.items ?? []))
      .catch(() => undefined);
  }, []);

  // 仓库变化：HTTP 仓库拉目录；OCI 仓库没有目录，等用户输入 Chart 名
  useEffect(() => {
    setCharts([]);
    if (!repoId || oci) return;
    let cancelled = false;
    setChartsLoading(true);
    listHelmCharts(repoId, {})
      .then((res) => {
        if (!cancelled) setCharts(res.items ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setChartsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [repoId, oci]);

  const loadOciTags = async () => {
    const name = (form.getFieldValue('chart') ?? '').trim();
    if (!repoId || !name) return;
    setChartsLoading(true);
    try {
      const res = await listHelmCharts(repoId, { chart: name });
      setCharts(res.items ?? []);
    } catch {
      setCharts([]);
    } finally {
      setChartsLoading(false);
    }
  };

  const versions = useMemo(
    () => charts.find((c) => c.name === chart)?.versions ?? [],
    [charts, chart],
  );

  // 选定版本：取缺省 values 供参考；安装时若还没填过 values 则预填
  useEffect(() => {
    setDefaults('');
    if (!repoId || !chart || !version) return;
    let cancelled = false;
    getHelmChart(repoId, chart, version, { silent: true })
      .then((res) => {
        if (cancelled) return;
        setDefaults(res.values ?? '');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [repoId, chart, version]);

  const doPreview = async () => {
    let v: ApplyForm;
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    const body: HelmApplyBody = {
      namespace: current?.release.namespace ?? v.namespace,
      name: current?.release.name ?? v.name.trim(),
      repoId: v.repoId,
      chart: v.chart.trim(),
      version: v.version,
      values,
    };
    setBusy(true);
    setError(undefined);
    try {
      const result = await previewHelmRelease(clusterId, { ...body, upgrade });
      setPreview({ body, result });
    } catch (err) {
      setError(getK8sErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!preview) return;
    setBusy(true);
    setError(undefined);
    try {
      const res = upgrade
        ? await upgradeHelmRelease(clusterId, preview.body)
        : await installHelmRelease(clusterId, preview.body);
      if (res.pending) message.info(t('pages.k8s.app.pending'));
      else message.success(t('common.msg.updated'));
      onDone();
      onClose();
    } catch (err) {
      if (isChangeSubmitted(err)) {
        onClose();
        return;
      }
      setError(getK8sErrorMessage(err));
      onDone();
    } finally {
      setBusy(false);
    }
  };

  const result = preview?.result;
  return (
    <Modal
      open
      width={1080}
      title={
        upgrade
          ? t('pages.k8s.app.upgrade.title', {
              name: current?.release.name ?? '',
            })
          : t('pages.k8s.app.install')
      }
      destroyOnHidden
      mask={{ closable: false }}
      onCancel={onClose}
      footer={
        <Flex justify="end" gap={8}>
          <Button onClick={onClose}>{t('common.action.cancel')}</Button>
          {preview ? (
            <>
              <Button disabled={busy} onClick={() => setPreview(undefined)}>
                {t('pages.k8s.change.back')}
              </Button>
              <Button
                type="primary"
                loading={busy}
                onClick={() => void apply()}
              >
                {t('pages.k8s.change.apply')}
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              loading={busy}
              onClick={() => void doPreview()}
            >
              {t('pages.k8s.change.preview')}
            </Button>
          )}
        </Flex>
      }
    >
      <ApprovalNotice />
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={error}
        />
      )}
      {result && (
        <Tabs
          size="small"
          items={[
            ...(upgrade
              ? [
                  {
                    key: 'values',
                    label: t('pages.k8s.app.diff.values'),
                    children:
                      (result.currentValues ?? '') === result.values ? (
                        <Alert
                          type="info"
                          showIcon
                          title={t('pages.k8s.change.noChange')}
                        />
                      ) : (
                        <YamlDiff
                          before={result.currentValues ?? ''}
                          after={result.values}
                        />
                      ),
                  },
                ]
              : []),
            {
              key: 'manifest',
              label: t(
                upgrade
                  ? 'pages.k8s.app.diff.manifest'
                  : 'pages.k8s.app.manifest',
              ),
              children: upgrade ? (
                (result.currentManifest ?? '') === result.manifest ? (
                  <Alert
                    type="info"
                    showIcon
                    title={t('pages.k8s.change.noChange')}
                  />
                ) : (
                  <YamlDiff
                    before={result.currentManifest ?? ''}
                    after={result.manifest}
                  />
                )
              ) : (
                <YamlEditor value={result.manifest} readOnly />
              ),
            },
          ]}
        />
      )}
      <div style={{ display: preview ? 'none' : undefined }}>
        <Form
          form={form}
          layout="vertical"
          disabled={busy}
          initialValues={{
            namespace: current?.release.namespace ?? namespace,
            name: current?.release.name,
            chart: current?.release.chart,
          }}
        >
          <Flex gap={16}>
            <Form.Item
              name="namespace"
              label={t('pages.k8s.column.namespace')}
              style={{ flex: 1 }}
              rules={[
                {
                  required: true,
                  pattern: NAME_REGEX,
                  message: t('pages.k8s.namespace.name.required'),
                },
              ]}
            >
              <AutoComplete
                disabled={upgrade}
                options={namespaces.map((value) => ({ value }))}
              />
            </Form.Item>
            <Form.Item
              name="name"
              label={t('pages.k8s.app.release')}
              style={{ flex: 1 }}
              rules={[
                {
                  required: true,
                  max: 53,
                  pattern: RELEASE_NAME,
                  message: t('pages.k8s.app.name.rule'),
                },
              ]}
            >
              <Input disabled={upgrade} maxLength={53} />
            </Form.Item>
          </Flex>
          <Flex gap={16}>
            <Form.Item
              name="repoId"
              label={t('pages.k8s.app.repo')}
              style={{ flex: 1 }}
              rules={[{ required: true }]}
            >
              <Select
                showSearch={{ optionFilterProp: 'label' }}
                options={repos.map((r) => ({
                  value: r.id,
                  label: `${r.name}（${r.type === 2 ? 'OCI' : 'HTTP'}）`,
                }))}
                onChange={() => form.setFieldsValue({ version: undefined })}
              />
            </Form.Item>
            <Form.Item
              name="chart"
              label="Chart"
              style={{ flex: 1 }}
              rules={[{ required: true, whitespace: true, max: 254 }]}
              extra={oci ? t('pages.k8s.app.chart.oci') : undefined}
            >
              {oci ? (
                <Input.Search
                  enterButton={t('pages.k8s.app.chart.tags')}
                  loading={chartsLoading}
                  onSearch={() => void loadOciTags()}
                />
              ) : (
                <Select
                  showSearch
                  loading={chartsLoading}
                  options={charts.map((c) => ({ value: c.name }))}
                  onChange={() => form.setFieldsValue({ version: undefined })}
                />
              )}
            </Form.Item>
            <Form.Item
              name="version"
              label={t('pages.k8s.app.version')}
              style={{ width: 240 }}
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                options={versions.map((v) => ({
                  value: v.version,
                  label: `${v.version}${v.appVersion ? `（app ${v.appVersion}）` : ''}${v.deprecated ? ' · deprecated' : ''}`,
                }))}
              />
            </Form.Item>
          </Flex>
        </Form>
        <Flex
          justify="space-between"
          align="center"
          style={{ marginBottom: 8 }}
        >
          <Typography.Text strong>values</Typography.Text>
          <Flex gap={8}>
            {current && (
              <Button
                size="small"
                onClick={() => setValues(current.values ?? '')}
              >
                {t('pages.k8s.app.values.current')}
              </Button>
            )}
            <Button
              size="small"
              disabled={!defaults}
              onClick={() => setValues(defaults)}
            >
              {t('pages.k8s.app.values.defaults')}
            </Button>
            <Button size="small" onClick={() => setValues('')}>
              {t('pages.k8s.app.values.clear')}
            </Button>
          </Flex>
        </Flex>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          {t('pages.k8s.app.values.hint')}
        </Typography.Paragraph>
        {MASKED_VALUE.test(values) && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 8 }}
            title={t('pages.k8s.app.values.masked')}
          />
        )}
        <YamlEditor value={values} onChange={setValues} height={320} />
      </div>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Release 详情
// ---------------------------------------------------------------------------

const ReleaseDrawer: React.FC<{
  clusterId: string;
  target: { namespace: string; name: string };
  namespaces: string[];
  onClose: () => void;
  onChanged: () => void;
}> = ({ clusterId, target, namespaces, onClose, onChanged }) => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const confirm = useDangerConfirm();
  const [data, setData] = useState<HelmReleaseDetail>();
  const [error, setError] = useState<string>();
  const [upgrading, setUpgrading] = useState(false);
  const [detail, setDetail] = useState<DetailTarget>();

  const load = useCallback(async () => {
    try {
      setData(
        await getHelmRelease(clusterId, target.namespace, target.name, {
          silent: true,
        }),
      );
      setError(undefined);
    } catch (err) {
      setError(getK8sErrorMessage(err));
    }
  }, [clusterId, target.namespace, target.name]);

  useEffect(() => {
    void load();
  }, [load]);

  const changed = () => {
    void load();
    onChanged();
  };

  const rollback = (revision: number) =>
    confirm({
      title: t('pages.k8s.app.rollback.title', { name: target.name, revision }),
      content: t('pages.k8s.app.rollback.content'),
      name: target.name,
      namespace: target.namespace,
      onOk: () =>
        rollbackHelmRelease(clusterId, { ...target, revision })
          .then((res) => {
            if (res.pending) message.info(t('pages.k8s.app.pending'));
            else message.success(t('common.msg.updated'));
            changed();
          })
          .catch(() => undefined),
    });

  const release = data?.release;
  return (
    <Drawer
      open
      size={960}
      title={`${target.namespace}/${target.name}`}
      onClose={onClose}
      extra={
        release &&
        has('k8s.app.upgrade') && (
          <Button type="primary" onClick={() => setUpgrading(true)}>
            {t('pages.k8s.app.upgrade')}
          </Button>
        )
      }
    >
      {error && <Alert type="error" showIcon title={error} />}
      {!data && !error && (
        <Spin style={{ display: 'block', margin: '48px auto' }} />
      )}
      {data && release && (
        <Tabs
          items={[
            {
              key: 'overview',
              label: t('pages.k8s.detail.tab.overview'),
              children: (
                <>
                  <Descriptions
                    size="small"
                    column={2}
                    bordered
                    items={[
                      {
                        key: 'status',
                        label: t('common.column.status'),
                        children: <ReleaseStatus status={release.status} />,
                      },
                      {
                        key: 'rev',
                        label: t('pages.k8s.app.revision'),
                        children: release.revision,
                      },
                      {
                        key: 'chart',
                        label: 'Chart',
                        children: `${release.chart}-${release.chartVersion}`,
                      },
                      {
                        key: 'app',
                        label: t('pages.k8s.app.appVersion'),
                        children: release.appVersion || '-',
                      },
                      {
                        key: 'time',
                        label: t('pages.k8s.app.updated'),
                        children: formatTime(release.updateTime),
                      },
                      {
                        key: 'desc',
                        label: t('pages.k8s.app.description'),
                        children: release.description || '-',
                      },
                    ]}
                  />
                  <SectionTitle>{t('pages.k8s.app.resources')}</SectionTitle>
                  <Table
                    size="small"
                    rowKey={(row) =>
                      `${row.kind}/${row.ref.namespace ?? ''}/${row.ref.name}`
                    }
                    pagination={false}
                    dataSource={data.resources ?? []}
                    columns={[
                      { title: 'Kind', dataIndex: 'kind', width: 220 },
                      {
                        title: t('pages.k8s.column.name'),
                        render: (_, row) =>
                          row.ref.resource ? (
                            <a
                              onClick={() =>
                                setDetail({
                                  gvr: {
                                    group: row.ref.group,
                                    version: row.ref.version,
                                    resource: row.ref.resource,
                                  },
                                  namespace: row.ref.namespace,
                                  name: row.ref.name ?? '',
                                })
                              }
                            >
                              {row.ref.name}
                            </a>
                          ) : (
                            row.ref.name
                          ),
                      },
                      {
                        title: t('pages.k8s.column.namespace'),
                        render: (_, row) => row.ref.namespace || '-',
                      },
                    ]}
                  />
                  {data.notes && (
                    <>
                      <SectionTitle>NOTES</SectionTitle>
                      <NotesBlock text={data.notes} />
                    </>
                  )}
                </>
              ),
            },
            {
              key: 'values',
              label: 'values',
              children: data.values ? (
                <YamlEditor value={data.values} readOnly />
              ) : (
                <Alert
                  type="info"
                  showIcon
                  title={t('pages.k8s.app.values.none')}
                />
              ),
            },
            {
              key: 'manifest',
              label: t('pages.k8s.app.manifest'),
              children: (
                <YamlEditor value={data.manifest} readOnly height={560} />
              ),
            },
            {
              key: 'history',
              label: t('pages.k8s.app.history'),
              children: (
                <Table<HelmRelease>
                  size="small"
                  rowKey="revision"
                  pagination={false}
                  dataSource={data.history ?? []}
                  columns={[
                    {
                      title: t('pages.k8s.app.revision'),
                      dataIndex: 'revision',
                      width: 80,
                    },
                    {
                      title: t('common.column.status'),
                      render: (_, row) => <ReleaseStatus status={row.status} />,
                    },
                    {
                      title: 'Chart',
                      render: (_, row) => `${row.chart}-${row.chartVersion}`,
                    },
                    {
                      title: t('pages.k8s.app.updated'),
                      render: (_, row) => formatTime(row.updateTime),
                    },
                    {
                      title: t('pages.k8s.app.description'),
                      dataIndex: 'description',
                    },
                    {
                      title: t('common.column.action'),
                      render: (_, row) =>
                        has('k8s.app.upgrade') &&
                        row.revision !== release.revision ? (
                          <a onClick={() => rollback(row.revision)}>
                            {t('pages.k8s.app.rollback')}
                          </a>
                        ) : null,
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}
      {upgrading && data && (
        <ReleaseModal
          clusterId={clusterId}
          namespaces={namespaces}
          current={data}
          onClose={() => setUpgrading(false)}
          onDone={changed}
        />
      )}
      {detail && (
        <ResourceDetail
          key={`${detail.gvr.resource}/${detail.namespace}/${detail.name}`}
          clusterId={clusterId}
          target={detail}
          depth={1}
          onClose={() => setDetail(undefined)}
        />
      )}
    </Drawer>
  );
};

const NotesBlock: React.FC<{ text: string }> = ({ text }) => {
  const { styles } = useK8sStyles();
  return <pre className={styles.codeBlock}>{text}</pre>;
};

// ---------------------------------------------------------------------------
// Release 列表
// ---------------------------------------------------------------------------

export const Releases: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const scope = useK8sScope();
  const { message } = App.useApp();
  const confirm = useDangerConfirm();
  const [rows, setRows] = useState<HelmRelease[]>([]);
  const [partial, setPartial] = useState<string[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [keyword, setKeyword] = useState('');
  const [installing, setInstalling] = useState(false);
  const [detail, setDetail] = useState<{ namespace: string; name: string }>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  /** 请求序号：只采纳最后一次请求的结果，轮询也只由最后一次请求续期 */
  const seq = useRef(0);

  const load = useCallback(
    async (quiet = false) => {
      const id = ++seq.current;
      clearTimeout(timer.current);
      if (!quiet) setLoading(true);
      try {
        const res = await listHelmReleases(
          scope.clusterId,
          {
            namespace: scope.namespace || undefined,
            keyword: keyword || undefined,
          },
          { silent: true },
        );
        if (id !== seq.current) return;
        const items = res.items ?? [];
        setRows(items);
        setPartial(res.partialNamespaces ?? undefined);
        setError(undefined);
        // 有进行中的操作：稍后自动刷新
        if (
          items.some(
            (r) =>
              r.status.startsWith('pending') || r.status === 'uninstalling',
          )
        ) {
          timer.current = setTimeout(() => void load(true), 4000);
        }
      } catch (err) {
        if (id !== seq.current) return;
        setError(getK8sErrorMessage(err));
      } finally {
        if (id === seq.current) setLoading(false);
      }
    },
    [scope.clusterId, scope.namespace, keyword],
  );

  useEffect(() => {
    void load();
    return () => {
      // 卸载 / 条件变化：作废在途请求，并停掉它可能续期的轮询
      seq.current += 1;
      clearTimeout(timer.current);
    };
  }, [load]);

  const uninstall = (row: HelmRelease) =>
    confirm({
      title: t('pages.k8s.app.uninstall.title', { name: row.name }),
      content: t('pages.k8s.app.uninstall.content'),
      name: row.name,
      namespace: row.namespace,
      onOk: () =>
        uninstallHelmRelease(scope.clusterId, {
          namespace: row.namespace,
          name: row.name,
        })
          .then((res) => {
            if (res.pending) message.info(t('pages.k8s.app.pending'));
            else message.success(t('common.msg.deleted'));
            void load(true);
          })
          .catch(() => undefined),
    });

  return (
    <>
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          title={error}
          action={
            <Button size="small" onClick={() => void load()}>
              {t('pages.k8s.table.retry')}
            </Button>
          }
        />
      )}
      {partial && partial.length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title={t('pages.k8s.table.partial', {
            namespaces: partial.join('、'),
          })}
        />
      )}
      <ProTable<HelmRelease>
        cardBordered
        rowKey={(row) => `${row.namespace}/${row.name}`}
        search={{ labelWidth: 'auto' }}
        options={{ reload: () => void load(), density: true, setting: true }}
        loading={loading}
        dataSource={rows}
        scroll={{ x: 'max-content' }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: [20, 50, 100, 200],
        }}
        headerTitle={
          // 新建（安装）按钮在最左，其后是集群 / 命名空间筛选；list-toolbar-title
          // 自身无间距，包一层统一 8px（与资源列表页 ResourceTable 的处理一致）
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            {has('k8s.app.install') && (
              <CreateButton onClick={() => setInstalling(true)}>
                {t('pages.k8s.app.install')}
              </CreateButton>
            )}
            <ScopeSelects />
          </span>
        }
        onSubmit={(values) => {
          const v = values as { keyword?: string };
          setKeyword(v.keyword?.trim() ?? '');
        }}
        onReset={() => setKeyword('')}
        columns={[
          {
            title: t('common.column.keyword'),
            dataIndex: 'keyword',
            hideInTable: true,
            hideInSetting: true,
            fieldProps: {
              placeholder: t('pages.k8s.table.keyword'),
              maxLength: 64,
            },
          },
          {
            title: t('pages.k8s.column.name'),
            dataIndex: 'name',
            render: (_, row) => (
              <a
                onClick={() =>
                  setDetail({ namespace: row.namespace, name: row.name })
                }
              >
                {row.name}
              </a>
            ),
          },
          { title: t('pages.k8s.column.namespace'), dataIndex: 'namespace' },
          {
            title: t('common.column.status'),
            render: (_, row) => <ReleaseStatus status={row.status} />,
          },
          {
            title: 'Chart',
            render: (_, row) => `${row.chart}-${row.chartVersion}`,
          },
          { title: t('pages.k8s.app.appVersion'), dataIndex: 'appVersion' },
          {
            title: t('pages.k8s.app.revision'),
            dataIndex: 'revision',
            width: 80,
          },
          {
            title: t('pages.k8s.app.updated'),
            width: 170,
            render: (_, row) => formatTime(row.updateTime),
          },
          {
            title: t('common.column.action'),
            valueType: 'option',
            render: (_, row) => [
              <a
                key="open"
                onClick={() =>
                  setDetail({ namespace: row.namespace, name: row.name })
                }
              >
                {t('common.action.view')}
              </a>,
              has('k8s.app.uninstall') && (
                <Typography.Link
                  key="uninstall"
                  type="danger"
                  onClick={() => uninstall(row)}
                >
                  {t('pages.k8s.app.uninstall')}
                </Typography.Link>
              ),
            ],
          },
        ]}
      />
      {installing && (
        <ReleaseModal
          clusterId={scope.clusterId}
          namespace={scope.namespace || undefined}
          namespaces={scope.namespaces}
          onClose={() => setInstalling(false)}
          onDone={() => void load(true)}
        />
      )}
      {detail && (
        <ReleaseDrawer
          key={`${detail.namespace}/${detail.name}`}
          clusterId={scope.clusterId}
          target={detail}
          namespaces={scope.namespaces}
          onClose={() => setDetail(undefined)}
          onChanged={() => void load(true)}
        />
      )}
    </>
  );
};
