/**
 * PromQL 表达式编辑器（CodeMirror 6）：语法高亮 + 自动补全，替代原先
 * 「Input.TextArea + 等宽字体」的 PromQL 输入（explore、规则查询、记录规则、
 * 恢复表达式四处）。补全分两层：语言包内置的函数 / 关键字 / 片段（恒可用）；
 * 传入 datasourceId 时按数据源拉取指标名 / 标签名 / 标签值（60s 缓存、在途去重，
 * 失败静默降级为空建议，绝不影响输入）。
 * 受控组件（value / onChange），可直接放进 Form.Item；disabled 经 ConfigProvider 上下文
 * 继承表单的 disabled（同 MatchersEditor）。编辑器配色与 k8s 的 YamlEditor 同款做法：
 * 颜色全部取 antd token，跟随明暗主题。
 */

import { EditorState, type Extension, Transaction } from '@codemirror/state';
import { placeholder as cmPlaceholder } from '@codemirror/view';
import type { PrometheusClient } from '@prometheus-io/codemirror-promql';
import { PromQLExtension } from '@prometheus-io/codemirror-promql';
import { theme as antdTheme, ConfigProvider } from 'antd';
import { createStyles } from 'antd-style';
import { basicSetup, EditorView } from 'codemirror';
import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import {
  listLabelNames,
  listLabelValues,
  listMetricNames,
} from '@/services/monitor/datasource';

/** 十六进制底色是否为深色（据此告诉 CodeMirror 用深色的语法高亮），与 k8s YamlEditor 同款 */
const isDarkColor = (color: string): boolean => {
  const hex = /^#([0-9a-f]{6})/i.exec(color)?.[1];
  if (!hex) return false;
  const n = Number.parseInt(hex, 16);
  return (
    ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 <
    128
  );
};

/** 跟随 antd 主题（明 / 暗）的编辑器配色，与 k8s YamlEditor 同款 */
const useEditorTheme = (): Extension => {
  const { token } = antdTheme.useToken();
  const dark = isDarkColor(token.colorBgContainer);
  return useMemo(
    () =>
      EditorView.theme(
        {
          '&': {
            backgroundColor: token.colorBgContainer,
            color: token.colorText,
          },
          '.cm-cursor': { borderLeftColor: token.colorText },
          '.cm-selectionBackground': {
            backgroundColor: token.colorPrimaryBg,
          },
          '.cm-tooltip': {
            border: `1px solid ${token.colorBorder}`,
            backgroundColor: token.colorBgElevated,
            borderRadius: token.borderRadius,
          },
        },
        { dark },
      ),
    [token, dark],
  );
};

const useStyles = createStyles(
  ({ token, css }, props: { error: boolean; disabled: boolean }) => ({
    /** 外框对齐 antd 输入件：边框、圆角、聚焦变色、错误红边、禁用降透明 */
    host: css`
      border: 1px solid ${props.error ? token.colorError : token.colorBorder};
      border-radius: ${token.borderRadius}px;
      background: ${token.colorBgContainer};
      transition: border-color ${token.motionDurationMid};
      &:focus-within {
        border-color: ${props.error ? token.colorError : token.colorPrimary};
      }
      opacity: ${props.disabled ? 0.6 : 1};
      cursor: ${props.disabled ? 'not-allowed' : 'auto'};
    `,
  }),
);

/** 补全数据缓存 TTL：指标 / 标签分钟级变化，60s 足够新鲜，且避免每次击键打后端 */
const COMPLETION_TTL_MS = 60_000;

/** 补全数据缓存（跨编辑器实例共享：同一数据源多处编辑复用同一份） */
const completionCache = new Map<string, { at: number; data: string[] }>();
/** 在途请求去重：同一键并发击键只发一次 */
const completionInflight = new Map<string, Promise<string[]>>();

/** 取补全数据：60s 缓存 + 在途去重；任何失败静默降级为空数组（不缓存失败，下次击键重试） */
async function loadCompletion(
  key: string,
  loader: () => Promise<string[]>,
): Promise<string[]> {
  const hit = completionCache.get(key);
  if (hit && Date.now() - hit.at < COMPLETION_TTL_MS) return hit.data;
  const pending = completionInflight.get(key);
  if (pending) return pending;
  const request = (async () => {
    try {
      const data = await loader();
      completionCache.set(key, { at: Date.now(), data });
      return data;
    } catch {
      // 静默降级：数据源不可达 / 权限不足等一律表现为「无建议」，不弹任何错误
      return [];
    } finally {
      completionInflight.delete(key);
    }
  })();
  completionInflight.set(key, request);
  return request;
}

/** 把补全元数据接口适配成语言包要求的 PrometheusClient（用不到的能力返回空值） */
class DatasourceCompletionClient implements PrometheusClient {
  private readonly datasourceId: string;

  constructor(datasourceId: string) {
    this.datasourceId = datasourceId;
  }

  metricNames(): Promise<string[]> {
    return loadCompletion(`${this.datasourceId}:metric`, () =>
      listMetricNames(this.datasourceId, 1000),
    );
  }

  labelNames(): Promise<string[]> {
    return loadCompletion(`${this.datasourceId}:labels`, () =>
      listLabelNames(this.datasourceId, 1000),
    );
  }

  labelValues(labelName: string): Promise<string[]> {
    return loadCompletion(`${this.datasourceId}:lv:${labelName}`, () =>
      listLabelValues(this.datasourceId, labelName, 1000),
    );
  }

  async metricMetadata(): Promise<
    Record<string, { type: string; help: string }[]>
  > {
    return {};
  }

  async series(): Promise<Map<string, string>[]> {
    return [];
  }

  async flags(): Promise<Record<string, string>> {
    return {};
  }
}

export const PromqlEditor: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** 同 Input.TextArea 的 maxLength：拒绝使内容超限的用户输入（外部赋值不受限） */
  maxLength?: number;
  /** 视觉行数上下限，对齐原 Input.TextArea 的 autoSize */
  minRows?: number;
  maxRows?: number;
  /** 校验失败红边（对齐 antd 输入件的 status="error"） */
  status?: 'error';
  /** 数据源 ID：提供后按数据源拉取指标 / 标签补全；缺省只补函数与关键字。切换即重建编辑器 */
  datasourceId?: string;
}> = ({
  value = '',
  onChange,
  placeholder,
  maxLength,
  minRows = 2,
  maxRows = 10,
  status,
  datasourceId,
}) => {
  const { componentDisabled } = ConfigProvider.useConfig();
  const { token } = antdTheme.useToken();
  const { styles } = useStyles({
    error: status === 'error',
    disabled: componentDisabled,
  });
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const editorTheme = useEditorTheme();

  // 视觉高度对齐原 Input.TextArea 的 autoSize：行高取 antd 行高 token；隐藏行号槽（表达式只有几行）
  // 注意：CM 主题的样式值不会自动补 px 单位，数字会生成非法 CSS 被浏览器丢弃，必须传字符串
  const sizeTheme = useMemo(() => {
    const lineHeight = Math.ceil(token.lineHeight * token.fontSize);
    return EditorView.theme({
      '&': {
        fontSize: `${token.fontSize}px`,
        minHeight: `${minRows * lineHeight + 8}px`,
        maxHeight: `${maxRows * lineHeight + 8}px`,
        // 编辑器自身的背景也按圆角裁剪：否则方角白底会把外层边框的圆角弧线涂没
        borderRadius: `${token.borderRadius}px`,
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: token.fontFamilyCode,
      },
      '.cm-content': { padding: '4px 11px' },
      '.cm-gutters': { display: 'none' },
      '&.cm-focused': { outline: 'none' },
    });
  }, [token, minRows, maxRows]);

  // 补全扩展随数据源切换重建：无数据源时只有语言包内置的函数 / 关键字补全
  const promqlExt = useMemo(
    () =>
      datasourceId
        ? new PromQLExtension()
            .setComplete({
              remote: new DatasourceCompletionClient(datasourceId),
            })
            .asExtension()
        : new PromQLExtension().asExtension(),
    [datasourceId],
  );

  const extensions = useMemo(() => {
    const list: Extension[] = [
      basicSetup,
      // Prometheus 官方语言包：语法高亮 + 补全（asExtension 返回单个 Extension）
      promqlExt,
      // 长表达式自动换行（同原 TextArea 的默认折行）
      EditorView.lineWrapping,
      editorTheme,
      sizeTheme,
      EditorState.readOnly.of(componentDisabled),
      EditorView.editable.of(!componentDisabled),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current?.(update.state.doc.toString());
        }
      }),
    ];
    if (placeholder) list.push(cmPlaceholder(placeholder));
    if (maxLength !== undefined) {
      // 用户输入超限时拒掉该事务（外部赋值没有 userEvent 标注，不受限），与 Input.TextArea 行为一致
      list.push(
        EditorState.transactionFilter.of((tr) => {
          if (
            tr.annotation(Transaction.userEvent) &&
            tr.newDoc.length > maxLength
          ) {
            return [];
          }
          return tr;
        }),
      );
    }
    return list;
  }, [
    componentDisabled,
    editorTheme,
    sizeTheme,
    placeholder,
    maxLength,
    promqlExt,
  ]);

  useEffect(() => {
    if (!host.current) return;
    const instance = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions,
      }),
    });
    view.current = instance;
    return () => {
      instance.destroy();
      view.current = null;
    };
    // value 故意不在依赖里：只作初值，后续由下方同步（同 k8s YamlEditor，避免打断输入）
  }, [extensions]);

  // 外部 value 变化时同步进编辑器（不打断正在进行的输入）
  useEffect(() => {
    const instance = view.current;
    if (!instance) return;
    const current = instance.state.doc.toString();
    if (current !== value) {
      instance.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={host} className={styles.host} />;
};
