/**
 * 规则的查询列表编辑器：1-4 行「PromQL + 级别」，级别互不相同（多档阈值：每个级别一条查询）。
 * 「校验」逐条检查 PromQL 语法（不保存）；每行的「数据预览」把查询打到一个数据源并画图。
 * 只读查看时整个编辑器不可操作：校验与预览的接口权限随「新建 / 编辑规则」授予，只读者没有。
 * 受控组件（value / onChange），可直接放进 Form.Item；配套校验见 validateQueries。
 */
import {
  CheckCircleFilled,
  DeleteOutlined,
  ExclamationCircleFilled,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Flex, Input, Modal, Select, theme } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { NOTIFY_SEVERITY_META } from '@/constants';
import { validateRuleExprs } from '@/services/monitor/rule';
import type {
  MonitorSeverity,
  RuleExprResult,
  RuleQuery,
} from '@/services/monitor/typings';
import { useOptions, useT } from '@/utils/i18n';
import { MONITOR_LIMITS, SEVERITY_ORDER } from '../components/meta';
import { QueryRunner } from '../components/QueryRunner';
import { useMonitorStyles } from '../components/styles';

/** 每行表达式非空、不超长，级别互不相同 */
export const validateQueries = (queries?: RuleQuery[]): boolean => {
  const list = queries ?? [];
  return (
    list.length >= 1 &&
    list.length <= MONITOR_LIMITS.queryMax &&
    list.every(
      (q) =>
        q.expr.trim().length > 0 &&
        q.expr.length <= MONITOR_LIMITS.exprMax &&
        SEVERITY_ORDER.includes(q.severity),
    ) &&
    new Set(list.map((q) => q.severity)).size === list.length
  );
};

export const QueriesEditor: React.FC<{
  value?: RuleQuery[];
  onChange?: (value: RuleQuery[]) => void;
  /** 可用于校验与预览的数据源（指定数据源时为所选的，全局时为全部已启用的） */
  datasourceOptions: { value: string; label: string }[];
  /** 只读（无管理权限时查看）：不可增删改，也不可校验与预览 */
  readOnly?: boolean;
}> = ({ value, onChange, datasourceOptions, readOnly }) => {
  const t = useT();
  const { token } = theme.useToken();
  const { styles } = useMonitorStyles();
  const severityOptions = useOptions(NOTIFY_SEVERITY_META, SEVERITY_ORDER);
  const rows = value ?? [];
  const [validating, setValidating] = useState(false);
  // 校验结果按表达式原文对应（改动某行后该行结果自然失效）
  const [results, setResults] = useState<Record<string, RuleExprResult>>({});
  const [previewExpr, setPreviewExpr] = useState<string>();
  const [previewDatasource, setPreviewDatasource] = useState<string>();

  const update = (index: number, patch: Partial<RuleQuery>) =>
    onChange?.(
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  const used = new Set(rows.map((row) => row.severity));
  const nextSeverity = (): MonitorSeverity =>
    [...SEVERITY_ORDER].reverse().find((s) => !used.has(s)) ?? 2;

  const validate = async () => {
    const exprs = rows.map((row) => row.expr.trim()).filter(Boolean);
    if (exprs.length === 0) return;
    setValidating(true);
    try {
      const response = await validateRuleExprs({
        exprs,
        datasourceId: datasourceOptions[0]?.value,
      });
      setResults(
        Object.fromEntries(
          (response.results ?? []).map((result, i) => [exprs[i], result]),
        ),
      );
    } catch {
      // 已由请求层提示
    } finally {
      setValidating(false);
    }
  };

  const openPreview = (expr: string) => {
    setPreviewDatasource(
      datasourceOptions.some((option) => option.value === previewDatasource)
        ? previewDatasource
        : datasourceOptions[0]?.value,
    );
    setPreviewExpr(expr);
  };

  return (
    <div>
      {rows.map((row, index) => {
        const result = results[row.expr.trim()];
        const duplicated =
          rows.filter((other) => other.severity === row.severity).length > 1;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: 行无稳定标识，按位置编辑
          <div key={index} style={{ marginBottom: 12 }}>
            <div className={styles.editorRow} style={{ marginBottom: 4 }}>
              <Input.TextArea
                className={styles.codeInput}
                style={{ flex: 1, minWidth: 0 }}
                autoSize={{ minRows: 2, maxRows: 8 }}
                maxLength={MONITOR_LIMITS.exprMax}
                value={row.expr}
                status={result && !result.valid ? 'error' : undefined}
                placeholder={t('pages.monitor.rule.form.expr.placeholder')}
                onChange={(e) => update(index, { expr: e.target.value })}
              />
              <Select<MonitorSeverity>
                style={{ width: 110, flex: 'none' }}
                value={row.severity}
                status={duplicated ? 'error' : undefined}
                options={severityOptions}
                onChange={(severity) => update(index, { severity })}
              />
              <Button
                type="text"
                icon={<DeleteOutlined />}
                disabled={readOnly || rows.length <= 1}
                aria-label={t('pages.monitor.editor.remove')}
                onClick={() => onChange?.(rows.filter((_, i) => i !== index))}
              />
            </div>
            <Flex gap={12} align="center" wrap>
              <Button
                type="link"
                size="small"
                style={{ paddingInline: 0 }}
                disabled={
                  readOnly || !row.expr.trim() || datasourceOptions.length === 0
                }
                onClick={() => openPreview(row.expr.trim())}
              >
                {t('pages.monitor.rule.form.preview')}
              </Button>
              {result?.valid && (
                <span style={{ color: token.colorSuccess }}>
                  <CheckCircleFilled />{' '}
                  {t('pages.monitor.rule.form.expr.valid')}
                </span>
              )}
              {result && !result.valid && (
                <span style={{ color: token.colorError }}>
                  <ExclamationCircleFilled /> {result.error}
                </span>
              )}
            </Flex>
          </div>
        );
      })}
      <Flex gap={8}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          style={{ flex: 1 }}
          disabled={readOnly || rows.length >= MONITOR_LIMITS.queryMax}
          onClick={() =>
            onChange?.([...rows, { expr: '', severity: nextSeverity() }])
          }
        >
          {t('pages.monitor.rule.form.queries.add')}
        </Button>
        <Button
          loading={validating}
          disabled={readOnly}
          onClick={() => void validate()}
        >
          {t('pages.monitor.rule.form.validate')}
        </Button>
      </Flex>

      <Modal
        title={t('pages.monitor.rule.form.preview')}
        open={previewExpr !== undefined}
        width={960}
        footer={null}
        destroyOnHidden
        onCancel={() => setPreviewExpr(undefined)}
      >
        <div className={styles.codeBlock} style={{ marginBottom: 12 }}>
          {previewExpr}
        </div>
        <Flex gap={8} align="center" style={{ marginBottom: 12 }}>
          <span>{t('pages.monitor.common.datasource')}</span>
          <Select
            style={{ width: 280 }}
            value={previewDatasource}
            options={datasourceOptions}
            onChange={setPreviewDatasource}
          />
        </Flex>
        <QueryRunner
          key={previewDatasource}
          datasourceId={previewDatasource}
          expr={previewExpr}
          mode="range"
          autoRun
        />
      </Modal>
    </div>
  );
};

export default QueriesEditor;
