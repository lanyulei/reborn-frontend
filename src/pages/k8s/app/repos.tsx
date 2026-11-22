/** 应用（Helm）的仓库侧：Helm 仓库的增删改查、连通性测试与 Chart 目录浏览。 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Drawer,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  createHelmRepo,
  deleteHelmRepo,
  type HelmChartSummary,
  type HelmRepo,
  type HelmRepoSpec,
  type HelmRepoTestResult,
  listHelmCharts,
  listHelmRepos,
  testHelmRepo,
  updateHelmRepo,
} from '@/services/k8s/helm';
import { getK8sErrorMessage } from '@/services/k8s/request';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { ApprovalNotice } from '../components/approval';
import { formatTime } from '../components/cells';

interface RepoForm extends HelmRepoSpec {
  secret?: string;
  clearSecret?: boolean;
  testChart?: string;
}

const RepoModal: React.FC<{
  row?: HelmRepo;
  onClose: () => void;
  onDone: () => void;
}> = ({ row, onClose, onDone }) => {
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<RepoForm>();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<HelmRepoTestResult>();
  const type = Form.useWatch('type', form);

  const payload = async () => {
    const v = await form.validateFields();
    const spec: HelmRepoSpec = {
      name: v.name.trim(),
      type: v.type,
      url: v.url.trim(),
      username: v.username?.trim() ?? '',
      caCert: v.caCert?.trim() ?? '',
      insecureSkipVerify: v.insecureSkipVerify === true,
      description: v.description?.trim() ?? '',
      enabled: v.enabled !== false,
    };
    // 不传 = 沿用已保存的；空串 = 清除
    const secret = v.secret ? v.secret : v.clearSecret ? '' : undefined;
    return { spec, secret, chart: v.testChart?.trim() };
  };

  const runTest = async () => {
    let p: Awaited<ReturnType<typeof payload>>;
    try {
      p = await payload();
    } catch {
      return;
    }
    setTesting(true);
    setTest(undefined);
    try {
      setTest(
        await testHelmRepo({
          id: row?.id,
          spec: p.spec,
          secret: p.secret,
          chart: p.chart || undefined,
        }),
      );
    } catch {
      // 已由请求层提示
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    let p: Awaited<ReturnType<typeof payload>>;
    try {
      p = await payload();
    } catch {
      return;
    }
    setSaving(true);
    try {
      if (row) {
        await updateHelmRepo(row.id, {
          spec: p.spec,
          secret: p.secret,
          version: row.version,
        });
      } else {
        await createHelmRepo({ spec: p.spec, secret: p.secret || undefined });
      }
      message.success(t('common.msg.saved'));
      onDone();
      onClose();
    } catch {
      // 已由请求层提示
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      width={720}
      title={t(row ? 'pages.k8s.repo.edit' : 'pages.k8s.repo.create')}
      destroyOnHidden
      mask={{ closable: false }}
      onCancel={onClose}
      footer={
        <Flex justify="space-between">
          <Button loading={testing} onClick={() => void runTest()}>
            {t('pages.k8s.repo.test')}
          </Button>
          <Flex gap={8}>
            <Button onClick={onClose}>{t('common.action.cancel')}</Button>
            <Button type="primary" loading={saving} onClick={() => void save()}>
              {t('common.action.save')}
            </Button>
          </Flex>
        </Flex>
      }
    >
      <ApprovalNotice />
      <Form
        form={form}
        layout="vertical"
        initialValues={row ? { ...row.spec } : { type: 1, enabled: true }}
      >
        <Flex gap={16}>
          <Form.Item
            name="name"
            label={t('pages.k8s.column.name')}
            style={{ flex: 1 }}
            rules={[{ required: true, whitespace: true, max: 64 }]}
          >
            <Input maxLength={64} />
          </Form.Item>
          <Form.Item
            name="type"
            label={t('pages.k8s.repo.type')}
            style={{ width: 200 }}
          >
            <Select
              disabled={!!row}
              options={[
                { value: 1, label: t('pages.k8s.repo.type.http') },
                { value: 2, label: t('pages.k8s.repo.type.oci') },
              ]}
            />
          </Form.Item>
        </Flex>
        <Form.Item
          name="url"
          label={t('pages.k8s.repo.url')}
          extra={t(
            type === 2 ? 'pages.k8s.repo.url.oci' : 'pages.k8s.repo.url.http',
          )}
          rules={[
            { required: true, whitespace: true, max: 512 },
            {
              validator: (_, v: string) =>
                !v ||
                (type === 2
                  ? /^oci:\/\/[^/@?#]+/
                  : /^https?:\/\/[^/@?#]+/
                ).test(v.trim())
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('pages.k8s.repo.url.rule'))),
            },
          ]}
        >
          <Input
            placeholder={
              type === 2
                ? 'oci://registry.example.com/charts'
                : 'https://charts.example.com'
            }
          />
        </Form.Item>
        <Flex gap={16}>
          <Form.Item
            name="username"
            label={t('pages.k8s.repo.username')}
            style={{ flex: 1 }}
          >
            <Input maxLength={128} autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="secret"
            label={t('pages.k8s.repo.secret')}
            style={{ flex: 1 }}
            extra={row?.hasSecret ? t('pages.k8s.repo.secret.keep') : undefined}
          >
            <Input.Password maxLength={16384} autoComplete="new-password" />
          </Form.Item>
        </Flex>
        {row?.hasSecret && (
          <Form.Item name="clearSecret" valuePropName="checked">
            <Switch
              size="small"
              checkedChildren={t('pages.k8s.repo.secret.clear')}
              unCheckedChildren={t('pages.k8s.repo.secret.clear')}
            />
          </Form.Item>
        )}
        <Form.Item name="caCert" label={t('pages.k8s.repo.caCert')}>
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 6 }}
            placeholder="-----BEGIN CERTIFICATE-----"
          />
        </Form.Item>
        <Flex gap={24}>
          <Form.Item
            name="insecureSkipVerify"
            label={t('pages.k8s.repo.insecure')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="enabled"
            label={t('pages.k8s.repo.enabled')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          {type === 2 && (
            <Form.Item
              name="testChart"
              label={t('pages.k8s.repo.testChart')}
              style={{ flex: 1 }}
              extra={t('pages.k8s.repo.testChart.hint')}
            >
              <Input maxLength={254} />
            </Form.Item>
          )}
        </Flex>
        <Form.Item name="description" label={t('pages.k8s.repo.description')}>
          <Input maxLength={255} />
        </Form.Item>
      </Form>
      {test && (
        <Alert
          type={test.ok ? 'success' : 'error'}
          showIcon
          title={
            test.ok
              ? t('pages.k8s.repo.test.ok', {
                  charts: test.charts,
                  ms: test.durationMs,
                })
              : t('pages.k8s.repo.test.failed')
          }
          description={test.error}
        />
      )}
    </Modal>
  );
};

/** 仓库的 Chart 目录 */
const ChartsDrawer: React.FC<{ repo: HelmRepo; onClose: () => void }> = ({
  repo,
  onClose,
}) => {
  const t = useT();
  const oci = repo.spec.type === 2;
  const [items, setItems] = useState<HelmChartSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<{ truncated?: boolean; fetchTime?: string }>(
    {},
  );
  const [error, setError] = useState<string>();

  const load = useCallback(
    async (params: { keyword?: string; chart?: string; refresh?: boolean }) => {
      setLoading(true);
      setError(undefined);
      try {
        const res = await listHelmCharts(repo.id, params, { silent: true });
        setItems(res.items ?? []);
        setInfo({ truncated: res.truncated, fetchTime: res.fetchTime });
      } catch (err) {
        setError(getK8sErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [repo.id],
  );

  useEffect(() => {
    if (!oci) void load({});
  }, [oci, load]);

  return (
    <Drawer
      open
      size={960}
      title={t('pages.k8s.repo.charts.title', { name: repo.spec.name })}
      onClose={onClose}
    >
      <Flex gap={8} style={{ marginBottom: 12 }}>
        <Input.Search
          allowClear
          style={{ width: 320 }}
          placeholder={t(
            oci ? 'pages.k8s.app.chart.oci' : 'pages.k8s.table.keyword',
          )}
          onSearch={(value) => {
            const v = value.trim();
            if (oci) {
              if (v) void load({ chart: v });
            } else {
              void load({ keyword: v || undefined });
            }
          }}
        />
        {!oci && (
          <Button onClick={() => void load({ refresh: true })}>
            {t('pages.k8s.repo.charts.refresh')}
          </Button>
        )}
        {info.fetchTime && !oci && (
          <Typography.Text type="secondary" style={{ lineHeight: '32px' }}>
            {t('pages.k8s.repo.charts.fetched', {
              time: formatTime(info.fetchTime),
            })}
          </Typography.Text>
        )}
      </Flex>
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={error}
        />
      )}
      {info.truncated && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          title={t('pages.k8s.repo.charts.truncated')}
        />
      )}
      <Table<HelmChartSummary>
        size="small"
        rowKey="name"
        loading={loading}
        dataSource={items}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        columns={[
          { title: 'Chart', dataIndex: 'name', width: 220 },
          {
            title: t('pages.k8s.repo.charts.latest'),
            width: 140,
            render: (_, row) => row.versions?.[0]?.version ?? '-',
          },
          {
            title: t('pages.k8s.repo.charts.versions'),
            width: 80,
            render: (_, row) => row.versions?.length ?? 0,
          },
          {
            title: t('pages.k8s.repo.description'),
            dataIndex: 'description',
            ellipsis: true,
          },
        ]}
      />
    </Drawer>
  );
};

export const Repos: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  // undefined = 关闭；null = 新建；对象 = 编辑
  const [formRow, setFormRow] = useState<HelmRepo | null | undefined>(
    undefined,
  );
  const [charts, setCharts] = useState<HelmRepo>();
  const canManage = has('k8s.app.repo');
  const reload = () => actionRef.current?.reload();

  const columns: ProColumns<HelmRepo>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { maxLength: 64 },
    },
    {
      title: t('pages.k8s.column.name'),
      dataIndex: ['spec', 'name'],
      search: false,
      render: (_, row) => (
        <>
          {row.spec.name}
          {row.spec.enabled === false && (
            <Tag style={{ marginInlineStart: 8 }}>
              {t('enum.enabled.false')}
            </Tag>
          )}
        </>
      ),
    },
    {
      title: t('pages.k8s.repo.type'),
      search: false,
      width: 110,
      render: (_, row) => (row.spec.type === 2 ? 'OCI' : 'HTTP'),
    },
    {
      title: t('pages.k8s.repo.url'),
      dataIndex: ['spec', 'url'],
      search: false,
      copyable: true,
      ellipsis: true,
    },
    {
      title: t('pages.k8s.repo.auth'),
      search: false,
      width: 120,
      render: (_, row) =>
        row.hasSecret ? row.spec.username : t('pages.k8s.repo.auth.anonymous'),
    },
    {
      title: t('pages.k8s.repo.description'),
      dataIndex: ['spec', 'description'],
      search: false,
      ellipsis: true,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 200,
      render: (_, row) => [
        canManage && (
          <a key="charts" onClick={() => setCharts(row)}>
            {t('pages.k8s.repo.charts')}
          </a>
        ),
        canManage && (
          <a key="edit" onClick={() => setFormRow(row)}>
            {t('common.action.edit')}
          </a>
        ),
        canManage && (
          <DeleteConfirmLink
            key="delete"
            title={t('pages.k8s.repo.delete.title', { name: row.spec.name })}
            description={t('pages.k8s.repo.delete.content')}
            onConfirm={async () => {
              await deleteHelmRepo(row.id);
              message.success(t('common.msg.deleted'));
              reload();
            }}
          />
        ),
      ],
    },
  ];

  return (
    <>
      <ProTable<HelmRepo>
        cardBordered
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{ labelWidth: 'auto' }}
        scroll={{ x: 'max-content' }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: [20, 50, 100, 200],
        }}
        headerTitle={
          canManage && (
            <CreateButton onClick={() => setFormRow(null)}>
              {t('pages.k8s.repo.create')}
            </CreateButton>
          )
        }
        request={async (params) =>
          toTableResult(
            await listHelmRepos({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
            }),
          )
        }
      />
      {formRow !== undefined && (
        <RepoModal
          row={formRow ?? undefined}
          onClose={() => setFormRow(undefined)}
          onDone={reload}
        />
      )}
      {charts && (
        <ChartsDrawer repo={charts} onClose={() => setCharts(undefined)} />
      )}
    </>
  );
};
