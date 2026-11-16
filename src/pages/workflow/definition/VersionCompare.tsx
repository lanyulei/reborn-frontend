/**
 * 版本对比：选两个已发布版本（或某个版本与当前草稿）并排查看，标出新增、删除、
 * 修改的节点与分支。按元素 ID 配对；不是由设计器产生的版本只能并排查看、不逐项标注。
 */
import {
  Alert,
  Button,
  Empty,
  Flex,
  Modal,
  Select,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  branchSummary,
  diffFlows,
  type Flow,
  FlowCanvas,
  fromGraph,
  RawGraphView,
  stepSummary,
  walkNodes,
} from '@/components/FlowDesigner';
import {
  getDefinitionVersion,
  listDefinitionVersions,
} from '@/services/workflow/definition';
import type { DefinitionVersion } from '@/services/workflow/typings';
import { useT } from '@/utils/i18n';

/** 「当前草稿」在版本下拉里的取值 */
const DRAFT = 0;

const useStyles = createStyles(({ token, css }) => ({
  bar: css`
    margin-bottom: 12px;
  `,
  side: css`
    flex: 1;
    min-width: 0;
  `,
  sideTitle: css`
    margin-bottom: 8px;
    color: ${token.colorTextSecondary};
  `,
  select: css`
    width: 220px;
  `,
  canvas: css`
    height: calc(100vh - 360px);
    min-height: 360px;
  `,
  empty: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadiusLG}px;
  `,
}));

interface Loaded {
  graph?: Record<string, unknown>;
  flow?: Flow;
  /** 取回失败（可重试） */
  failed?: boolean;
}

export const VersionCompare: React.FC<{
  definitionId: string;
  open: boolean;
  onClose: () => void;
  /** 当前草稿的流程图（编辑中的内容，含未保存的修改）；不传则不提供「当前草稿」选项 */
  draftGraph?: Record<string, unknown>;
}> = ({ definitionId, open, onClose, draftGraph }) => {
  const { styles } = useStyles();
  const t = useT();
  const [versions, setVersions] = useState<DefinitionVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [left, setLeft] = useState<number>();
  const [right, setRight] = useState<number>();
  const [loaded, setLoaded] = useState<Record<number, Loaded>>({});
  const hasDraft = draftGraph !== undefined;
  // 只采纳本次打开期间发出的请求的响应
  const session = useRef(0);

  useEffect(() => {
    if (!open) return;
    session.current += 1;
    const current = session.current;
    setLoaded({});
    setVersions([]);
    setLeft(undefined);
    setRight(undefined);
    setLoading(true);
    listDefinitionVersions(definitionId)
      .then((result) => {
        if (current !== session.current) return;
        const items = result.items ?? [];
        setVersions(items);
        // 缺省：最新版本 对比 当前草稿；没有草稿则对比最近两个版本
        if (hasDraft) {
          setLeft(items[0]?.version);
          setRight(DRAFT);
        } else {
          setLeft(items[1]?.version ?? items[0]?.version);
          setRight(items[0]?.version);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (current === session.current) setLoading(false);
      });
  }, [open, definitionId, hasDraft]);

  // 按需取回选中版本的流程图（同一版本只取一次）
  useEffect(() => {
    if (!open) return;
    const current = session.current;
    for (const version of [left, right]) {
      if (version === undefined || version === DRAFT || loaded[version])
        continue;
      setLoaded((all) => ({ ...all, [version]: {} }));
      getDefinitionVersion(definitionId, version)
        .then((result) => {
          if (current !== session.current) return;
          setLoaded((all) => ({
            ...all,
            [version]: { graph: result.graph, flow: fromGraph(result.graph) },
          }));
        })
        .catch(() => {
          // 失败提示由请求层弹出；这一侧显示「加载失败 + 重试」，而不是一直转圈
          if (current !== session.current) return;
          setLoaded((all) => ({ ...all, [version]: { failed: true } }));
        });
    }
  }, [open, definitionId, left, right, loaded]);

  /** 重新取回某个版本（清掉失败标记，由上面的 effect 重新发起） */
  const retry = (version: number) =>
    setLoaded(({ [version]: _failed, ...rest }) => rest);

  const draft = useMemo<Loaded>(
    () => ({ graph: draftGraph, flow: fromGraph(draftGraph) }),
    [draftGraph],
  );
  const sideOf = (version?: number): Loaded | undefined =>
    version === undefined
      ? undefined
      : version === DRAFT
        ? draft
        : loaded[version];
  const before = sideOf(left);
  const after = sideOf(right);

  const diff = useMemo(
    () =>
      before?.flow && after?.flow
        ? diffFlows(before.flow, after.flow)
        : undefined,
    [before?.flow, after?.flow],
  );

  const options = [
    ...(hasDraft
      ? [{ value: DRAFT, label: t('pages.workflow.compare.draft') }]
      : []),
    ...versions.map((v) => ({
      value: v.version,
      label: v.createTime
        ? `v${v.version} · ${dayjs(v.createTime).format('YYYY-MM-DD HH:mm')}`
        : `v${v.version}`,
    })),
  ];

  const canvasOf = (
    side: Loaded | undefined,
    marks: Record<string, 'added' | 'removed' | 'modified'> | undefined,
    version?: number,
  ) => {
    if (!side) {
      return (
        <div className={styles.empty}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      );
    }
    if (side.failed) {
      return (
        <div className={styles.empty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.workflow.compare.failed')}
          >
            {version !== undefined && (
              <Button size="small" onClick={() => retry(version)}>
                {t('pages.workflow.compare.retry')}
              </Button>
            )}
          </Empty>
        </div>
      );
    }
    if (!side.graph) {
      return (
        <div className={styles.empty}>
          <Spin />
        </div>
      );
    }
    if (!side.flow) return <RawGraphView graph={side.graph} />;
    const names = new Map<string, string>();
    for (const node of walkNodes(side.flow.nodes)) {
      if (node.kind !== 'branch') names.set(node.id, node.name);
    }
    return (
      <FlowCanvas
        flow={side.flow}
        marks={marks}
        summaryOf={(node) => stepSummary(node, t)}
        conditionOf={(branch) => branchSummary(branch, t)}
        nameOf={(id) => names.get(id) ?? id}
      />
    );
  };

  const ready = !!before?.graph && !!after?.graph;

  return (
    <Modal
      title={t('pages.workflow.compare.title')}
      width="calc(100vw - 96px)"
      centered
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        {!loading && options.length < 2 ? (
          <Empty description={t('pages.workflow.compare.empty')} />
        ) : (
          <>
            <Flex className={styles.bar} align="center" gap={8} wrap>
              <Typography.Text type="secondary">
                {t('pages.workflow.compare.legend')}
              </Typography.Text>
              <Tag color="success">
                {t('pages.workflow.compare.added', { n: diff?.added ?? 0 })}
              </Tag>
              <Tag color="error">
                {t('pages.workflow.compare.removed', { n: diff?.removed ?? 0 })}
              </Tag>
              <Tag color="warning">
                {t('pages.workflow.compare.modified', {
                  n: diff?.modified ?? 0,
                })}
              </Tag>
            </Flex>
            {ready && !diff && (
              <Alert
                className={styles.bar}
                type="info"
                showIcon
                title={t('pages.workflow.compare.raw')}
              />
            )}
            {diff?.settings && (
              <Alert
                className={styles.bar}
                type="warning"
                showIcon
                title={t('pages.workflow.compare.settings')}
              />
            )}
            {diff &&
              !diff.settings &&
              diff.added + diff.removed + diff.modified === 0 && (
                <Alert
                  className={styles.bar}
                  type="success"
                  showIcon
                  title={t('pages.workflow.compare.same')}
                />
              )}
            <Flex gap={16}>
              <div className={styles.side}>
                <Flex className={styles.sideTitle} align="center" gap={8}>
                  {t('pages.workflow.compare.before')}
                  <Select
                    className={styles.select}
                    options={options}
                    value={left}
                    onChange={setLeft}
                  />
                </Flex>
                <div className={styles.canvas}>
                  {canvasOf(before, diff?.before, left)}
                </div>
              </div>
              <div className={styles.side}>
                <Flex className={styles.sideTitle} align="center" gap={8}>
                  {t('pages.workflow.compare.after')}
                  <Select
                    className={styles.select}
                    options={options}
                    value={right}
                    onChange={setRight}
                  />
                </Flex>
                <div className={styles.canvas}>
                  {canvasOf(after, diff?.after, right)}
                </div>
              </div>
            </Flex>
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default VersionCompare;
