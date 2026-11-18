/**
 * 从模板创建：左侧列出内置的规则模板包（按类别分组），右侧预览选中包里的规则；「导入」把该包的
 * 规则 YAML 原样交给导入弹窗（ImportModal 的 source）——目标分组、数据源范围、级别、预览、
 * 重名处理都走已有的导入流程，这里不另做一套。
 */
import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Modal, Spin, Table, Tag } from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  getRuleTemplatePack,
  listRuleTemplatePacks,
} from '@/services/monitor/rule';
import type {
  RuleGroup,
  RuleTemplateItem,
  RuleTemplatePack,
  RuleTemplatePackDetail,
} from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import type { DatasourceOptionsState } from '../components/hooks';
import { useMonitorStyles } from '../components/styles';
import { SeverityTag } from '../components/tags';
import { ImportModal } from './ImportModal';

/** 后端约定的类别；其余取值原样显示 */
const KNOWN_CATEGORIES = ['host', 'middleware', 'database', 'platform'];

export const TemplateModal: React.FC<{
  groups: readonly RuleGroup[];
  /** 全部数据源选项（页面取一次下传） */
  datasources: DatasourceOptionsState;
  /** 预选的目标分组（左侧树当前选中的，且可管理） */
  defaultGroupId?: string;
  onClose: () => void;
  /** 导入过后调用：刷新列表与分组计数 */
  onDone: () => void;
}> = ({ groups, datasources, defaultGroupId, onClose, onDone }) => {
  const t = useT();
  const { styles, cx } = useMonitorStyles();

  const [packs, setPacks] = useState<RuleTemplatePack[]>([]);
  const [listState, setListState] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);
  const [code, setCode] = useState<string>();
  const [detail, setDetail] = useState<RuleTemplatePackDetail>();
  const [detailState, setDetailState] = useState<
    'idle' | 'loading' | 'ready' | 'failed'
  >('idle');
  const [importing, setImporting] = useState(false);
  // 导入弹窗里是否真的导入过：导入过则连同本弹窗一起关闭，只是取消则回到模板预览
  const imported = useRef(false);

  // attempt 只用来触发重试
  useEffect(() => {
    let cancelled = false;
    setListState('loading');
    listRuleTemplatePacks()
      .then((result) => {
        if (cancelled) return;
        const items = result.items ?? [];
        setPacks(items);
        setListState('ready');
        // 默认选中第一个，打开即有预览
        setCode((current) => current ?? items[0]?.code);
      })
      .catch(() => {
        // 已由请求层提示；这里留一个可重试的失败状态
        if (!cancelled) setListState('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    setDetail(undefined);
    setDetailState('loading');
    getRuleTemplatePack(code)
      .then((result) => {
        if (cancelled) return;
        setDetail(result);
        setDetailState('ready');
      })
      .catch(() => {
        // 已由请求层提示（如模板包不存在）
        if (!cancelled) setDetailState('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  // 按类别分组，保持后端给出的顺序（按类别、名称排序）
  const categories = [...new Set(packs.map((pack) => pack.category ?? ''))];
  const categoryText = (category: string) =>
    KNOWN_CATEGORIES.includes(category)
      ? t(`pages.monitor.rule.template.category.${category}`)
      : category || t('pages.monitor.rule.template.category.other');

  const selected = packs.find((pack) => pack.code === code);
  const pack = detail?.pack ?? selected;
  const rules = detail?.rules ?? [];
  const content = detail?.content ?? '';

  return (
    <>
      <Modal
        title={t('pages.monitor.rule.template.title')}
        open
        width={1080}
        destroyOnHidden
        mask={{ closable: false }}
        onCancel={onClose}
        footer={[
          <Button key="cancel" onClick={onClose}>
            {t('common.action.cancel')}
          </Button>,
          <Button
            key="import"
            type="primary"
            disabled={detailState !== 'ready' || !content.trim()}
            onClick={() => setImporting(true)}
          >
            {t('pages.monitor.rule.template.import')}
          </Button>,
        ]}
      >
        {listState === 'failed' ? (
          <Alert
            type="error"
            showIcon
            title={t('pages.monitor.rule.template.listFailed')}
            action={
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => setAttempt((n) => n + 1)}
              >
                {t('pages.monitor.retry')}
              </Button>
            }
          />
        ) : listState === 'loading' ? (
          <div className="flex justify-center py-12">
            <Spin />
          </div>
        ) : packs.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.monitor.rule.template.empty')}
          />
        ) : (
          <div className="flex items-start gap-4">
            <div
              className="flex w-72 flex-none flex-col gap-2 overflow-auto"
              style={{ maxHeight: 560 }}
            >
              {categories.map((category) => (
                <div key={category} className="flex flex-col gap-2">
                  <div className={styles.hint}>{categoryText(category)}</div>
                  {packs
                    .filter((item) => (item.category ?? '') === category)
                    .map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        aria-pressed={item.code === code}
                        className={cx(
                          styles.aggCard,
                          styles.aggCardButton,
                          item.code === code && styles.aggCardActive,
                        )}
                        onClick={() => setCode(item.code)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate font-medium">
                            {item.name || item.code}
                          </span>
                          <Tag style={{ marginInlineEnd: 0 }}>
                            {t('pages.monitor.rule.template.ruleCount', {
                              count: item.ruleCount ?? 0,
                            })}
                          </Tag>
                        </div>
                        {item.description && (
                          <div className={styles.hint}>{item.description}</div>
                        )}
                      </button>
                    ))}
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              {detailState === 'failed' ? (
                <Alert
                  type="error"
                  showIcon
                  title={t('pages.monitor.rule.template.detailFailed')}
                />
              ) : (
                <>
                  <div className="mb-3">
                    <div className="font-medium">
                      {pack?.name || pack?.code}
                    </div>
                    {pack?.description && (
                      <div className={styles.hint}>{pack.description}</div>
                    )}
                  </div>
                  <Table<RuleTemplateItem & { key: number }>
                    size="small"
                    rowKey="key"
                    loading={detailState === 'loading'}
                    dataSource={rules.map((rule, key) => ({ ...rule, key }))}
                    pagination={false}
                    scroll={{ x: 'max-content', y: 440 }}
                    locale={{
                      emptyText: t('pages.monitor.rule.template.noRules'),
                    }}
                    columns={[
                      {
                        title: t('pages.monitor.rule.column.name'),
                        dataIndex: 'name',
                        width: 200,
                        render: (_, row) => (
                          <div style={{ maxWidth: 240 }}>
                            <div>{row.name}</div>
                            {row.summary && (
                              <div className={styles.hint}>{row.summary}</div>
                            )}
                          </div>
                        ),
                      },
                      {
                        title: t('pages.monitor.alert.column.severity'),
                        width: 90,
                        render: (_, row) => (
                          <SeverityTag severity={row.severity} />
                        ),
                      },
                      {
                        title: t('pages.monitor.rule.template.column.for'),
                        width: 100,
                        render: (_, row) => `${row.forS ?? 0}s`,
                      },
                      {
                        title: t('pages.monitor.rule.column.expr'),
                        render: (_, row) => (
                          <div
                            className={styles.code}
                            style={{ maxWidth: 360 }}
                          >
                            {row.expr}
                          </div>
                        ),
                      },
                    ]}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {importing && (
        <ImportModal
          groups={groups}
          datasources={datasources}
          defaultGroupId={defaultGroupId}
          source={{
            content,
            name: pack?.name || pack?.code || '',
            // 以实际预览到的规则数为准；摘要缺失时退回包上登记的条数
            ruleCount: rules.length || (pack?.ruleCount ?? 0),
          }}
          onClose={() => {
            setImporting(false);
            if (imported.current) onClose();
          }}
          onDone={() => {
            imported.current = true;
            onDone();
          }}
        />
      )}
    </>
  );
};

export default TemplateModal;
