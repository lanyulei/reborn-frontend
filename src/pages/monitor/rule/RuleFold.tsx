/**
 * 规则表单里默认收起的一节（关联资源 / 事件处理 / 事件动作）：分节标题 + 一个折叠面板，面板标题
 * 说明里面有什么，并标出当前是否配置了非缺省内容。面板没展开过时其中的表单项不渲染——取值留在
 * 表单的存储里，保存时由 RuleDrawer 从存储里取全量值（见那里的 allValues）。
 */
import { Col, Collapse, Form, Row, Tag } from 'antd';
import type React from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { useT } from '@/utils/i18n';
import { type FoldKey, foldConfigured, type RuleFormValues } from './ruleForm';

export const FoldSection: React.FC<{
  foldKey: FoldKey;
  title: string;
  /** 面板标题：里面有哪些配置项 */
  summary: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}> = ({ foldKey, title, summary, open, onOpenChange, children }) => {
  const t = useT();
  const form = Form.useFormInstance<RuleFormValues>();
  // preserve：没渲染出来的表单项也要算进去
  const configured = Form.useWatch(
    (values: Partial<RuleFormValues>) => foldConfigured[foldKey](values),
    { form, preserve: true },
  );

  return (
    <Col span={24}>
      <SectionTitle>{title}</SectionTitle>
      <Collapse
        size="small"
        data-fold={foldKey}
        activeKey={open ? [foldKey] : []}
        onChange={(keys) => onOpenChange(keys.length > 0)}
        items={[
          {
            key: foldKey,
            label: summary,
            extra: configured ? (
              <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                {t('pages.monitor.rule.fold.configured')}
              </Tag>
            ) : (
              <Tag style={{ marginInlineEnd: 0 }}>
                {t('pages.monitor.rule.fold.default')}
              </Tag>
            ),
            children: <Row gutter={16}>{children}</Row>,
          },
        ]}
      />
    </Col>
  );
};

export default FoldSection;
