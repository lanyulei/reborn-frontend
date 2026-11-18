/**
 * YAML 编辑器与对比视图（CodeMirror 6）。
 * - YamlEditor：只读 / 可编辑；外部 value 变化时同步进编辑器（不打断正在进行的输入）。
 * - YamlDiff：左右对比「当前 → 变更后」，未变化的段落折叠。
 */
import { yaml } from '@codemirror/lang-yaml';
import { MergeView } from '@codemirror/merge';
import { EditorState, type Extension } from '@codemirror/state';
import { theme as antdTheme } from 'antd';
import { basicSetup, EditorView } from 'codemirror';
import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useK8sStyles } from './styles';

/** 十六进制底色是否为深色（据此告诉 CodeMirror 用深色的语法高亮） */
const isDarkColor = (color: string): boolean => {
  const hex = /^#([0-9a-f]{6})/i.exec(color)?.[1];
  if (!hex) return false;
  const n = Number.parseInt(hex, 16);
  return (
    ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 <
    128
  );
};

/** 跟随 antd 主题（明 / 暗）的编辑器配色 */
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
          '.cm-gutters': {
            backgroundColor: token.colorFillQuaternary,
            color: token.colorTextQuaternary,
            border: 'none',
          },
          '.cm-activeLine': { backgroundColor: token.colorFillQuaternary },
          '.cm-activeLineGutter': { backgroundColor: token.colorFillTertiary },
          '.cm-cursor': { borderLeftColor: token.colorText },
        },
        { dark },
      ),
    [token, dark],
  );
};

export const YamlEditor: React.FC<{
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  /** 编辑区高度；缺省 480 */
  height?: number | string;
}> = ({ value, onChange, readOnly = false, height = 480 }) => {
  const { styles } = useK8sStyles();
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const editorTheme = useEditorTheme();
  const cssHeight = typeof height === 'number' ? `${height}px` : height;

  useEffect(() => {
    if (!host.current) return;
    const instance = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          yaml(),
          editorTheme,
          EditorView.theme({
            '&': { height: cssHeight },
            '.cm-scroller': { overflow: 'auto' },
          }),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current?.(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    view.current = instance;
    return () => {
      instance.destroy();
      view.current = null;
    };
  }, [readOnly, editorTheme, cssHeight]);

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

  return <div ref={host} className={styles.editor} />;
};

export const YamlDiff: React.FC<{
  before: string;
  after: string;
  /** 最大高度；缺省 520 */
  maxHeight?: number;
}> = ({ before, after, maxHeight = 520 }) => {
  const { styles } = useK8sStyles();
  const host = useRef<HTMLDivElement>(null);
  const editorTheme = useEditorTheme();

  useEffect(() => {
    if (!host.current) return;
    const extensions = [
      basicSetup,
      yaml(),
      editorTheme,
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
    ];
    const merge = new MergeView({
      parent: host.current,
      a: { doc: before, extensions },
      b: { doc: after, extensions },
      collapseUnchanged: { margin: 3, minSize: 6 },
      gutter: true,
    });
    return () => merge.destroy();
  }, [before, after, editorTheme]);

  return (
    <div
      ref={host}
      className={styles.editor}
      style={{ maxHeight, overflow: 'auto' }}
    />
  );
};
