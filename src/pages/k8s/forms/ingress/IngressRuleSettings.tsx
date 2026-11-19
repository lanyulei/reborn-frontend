import {
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  App,
  AutoComplete,
  Button,
  Checkbox,
  Form,
  Input,
  Tooltip,
} from 'antd';
import { createStyles } from 'antd-style';
import { Fragment, useEffect, useMemo, useState } from 'react';
import KubernetesCompatibilityNotice from '../shared/KubernetesCompatibilityNotice';
import {
  createIngressRuleItem,
  isValidIngressPath,
  isValidIngressRule,
} from './helpers';
import IngressRuleModal from './IngressRuleModal';
import type {
  CreateIngressFormValues,
  IngressRouteRuleItem,
  IngressServiceOption,
} from './types';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  section: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  sectionTitle: {
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  card: {
    padding: '12px 16px',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  cardHeader: {
    display: 'grid',
    gridTemplateColumns: '40px minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: token.marginMD,
  },
  icon: {
    color: token.colorTextTertiary,
    fontSize: 32,
  },
  title: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  protocol: {
    marginTop: 2,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
  },
  actionButton: {
    color: token.colorTextTertiary,
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 160px',
    gap: token.marginMD,
    marginTop: 12,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: token.marginXS,
    },
  },
  summaryItem: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  add: {
    display: 'flex',
    width: '100%',
    minHeight: 64,
    alignItems: 'center',
    gap: token.marginSM,
    padding: '12px 20px',
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,
    cursor: 'pointer',
    textAlign: 'left',

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorFillQuaternary,
    },
  },
  addText: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginXXS,
  },
  addTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  addDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  rewrite: {
    padding: '12px 16px',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  ingressOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginMD,
    marginBottom: token.marginSM,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  rewriteHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
  },
  rewriteCheckbox: {
    marginTop: 2,
  },
  rewriteTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  rewriteDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  rewriteBody: {
    marginTop: 14,
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
  },
  rewriteFieldLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  helpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: 12,
  },
  rewriteTextArea: {
    width: 'min(456px, 100%)',
  },
  // 提示气泡是深色底：文字用 colorTextLightSolid，层次靠透明度区分
  rewriteTooltip: {
    width: 336,
    color: token.colorTextLightSolid,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  tooltipIntro: {
    marginBottom: token.marginSM,
  },
  tooltipTable: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: `${token.marginXS}px ${token.marginLG}px`,
    padding: token.paddingSM,
    border: `1px solid ${token.colorSplit}`,
    borderRadius: token.borderRadiusSM,
  },
  tooltipHeader: {
    fontWeight: 600,
    opacity: 0.6,
  },
  tooltipCell: {
    whiteSpace: 'nowrap',
  },
  tooltipNote: {
    marginTop: token.marginSM,
    opacity: 0.6,
  },
}));

const REWRITE_EXAMPLES = [
  ['匹配所有路径', '.*'],
  ['匹配 /api开头', '^/api.*'],
  ['匹配 /html结尾', '.*\\.html$'],
  ['匹配 /user/{id}', '^/user/(\\d+)$'],
  ['匹配 /old 为 /new', '^/old(.*) → /new$1'],
];

const filterByValue = (input: string, option?: { value?: unknown }) =>
  String(option?.value ?? '')
    .toLowerCase()
    .includes(input.toLowerCase());

type IngressRuleSettingsProps = {
  form: FormInstance<CreateIngressFormValues>;
  ingressClassNames: string[];
  serviceOptions: IngressServiceOption[];
  tlsSecretNames: string[];
  onServiceSelect: (serviceName: string) => void;
};

const IngressRuleSettings = ({
  form,
  ingressClassNames,
  serviceOptions,
  tlsSecretNames,
  onServiceSelect,
}: IngressRuleSettingsProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [ruleForm] = Form.useForm<IngressRouteRuleItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | undefined>();
  const rules = (Form.useWatch('rules', form) as IngressRouteRuleItem[]) || [];
  const enablePathRewrite = Form.useWatch('enablePathRewrite', form);
  const validRules = useMemo(
    () =>
      rules
        .map((rule, index) => ({ index, rule }))
        .filter(({ rule }) => isValidIngressRule(rule)),
    [rules],
  );

  useEffect(() => {
    if (!enablePathRewrite) {
      return;
    }
    if (!form.getFieldValue('rewriteTarget')) {
      form.setFieldValue('rewriteTarget', '/');
    }
  }, [enablePathRewrite, form]);

  const rewriteTooltip = (
    <div className={styles.rewriteTooltip}>
      <div className={styles.tooltipIntro}>
        用于重写客户端请求的路径，支持静态路径（如 /new-path）、动态路径（如
        /$1、/$2等），组合路径（如 /v1/$1）和正则表达式
      </div>
      <div className={styles.tooltipTable}>
        <div className={styles.tooltipHeader}>用途示例</div>
        <div className={styles.tooltipHeader}>正则表达式</div>
        {REWRITE_EXAMPLES.map(([label, value]) => (
          <Fragment key={label}>
            <div className={styles.tooltipCell}>{label}</div>
            <div className={styles.tooltipCell}>{value}</div>
          </Fragment>
        ))}
      </div>
      <div className={styles.tooltipNote}>
        注：正则表达式需要于 path 字段的正则表达式匹配
      </div>
    </div>
  );

  const openModal = (index?: number) => {
    const rule = index === undefined ? createIngressRuleItem() : rules[index];

    setEditingIndex(index);
    ruleForm.resetFields();
    ruleForm.setFieldsValue(rule);
    // 已选服务的端口候选按需读取
    for (const path of rule.paths || []) {
      if (path.serviceName?.trim()) {
        onServiceSelect(path.serviceName.trim());
      }
    }
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      await ruleForm.validateFields();
    } catch {
      // 校验未通过：字段已就地标红，停在弹窗里
      return;
    }
    // 读完整存储：路径上不可编辑的字段（id、自定义后端）不在已挂载的表单项里
    const values = ruleForm.getFieldsValue(true) as IngressRouteRuleItem;
    const nextRule = createIngressRuleItem({
      ...values,
      host: values.host?.trim() || undefined,
      id:
        editingIndex === undefined
          ? values.id
          : rules[editingIndex]?.id || values.id,
    });
    const nextRules =
      editingIndex === undefined
        ? [...rules, nextRule]
        : rules.map((item, index) =>
            index === editingIndex ? nextRule : item,
          );

    form.setFieldValue('rules', nextRules);
    form.validateFields(['rules']).catch(() => undefined);
    setModalOpen(false);
  };

  const deleteRule = (index: number) => {
    form.setFieldValue(
      'rules',
      rules.filter((_, ruleIndex) => ruleIndex !== index),
    );
  };

  return (
    <div className={styles.stack}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>路由规则</div>
        <KubernetesCompatibilityNotice
          message="Kubernetes 1.35+ 路由建议"
          items={[
            'Ingress 资源仍可使用；新建复杂流量治理能力时建议评估 Gateway API。',
            'HTTPS 路由建议显式指定 TLS Secret，后端端口支持端口号或命名端口。',
          ]}
        />
        <div className={styles.ingressOptions}>
          <Form.Item
            label="Ingress Class"
            name="ingressClassName"
            tooltip="指定处理该 Ingress 的控制器类。"
          >
            <AutoComplete
              allowClear
              options={ingressClassNames.map((item) => ({
                label: item,
                value: item,
              }))}
              placeholder="例如 nginx、alb、traefik"
              showSearch={{ filterOption: filterByValue }}
            />
          </Form.Item>
          <Form.Item
            label="TLS Secret"
            name="tlsSecretName"
            tooltip="HTTPS 路由使用的 TLS Secret，需包含 tls.crt 与 tls.key。"
          >
            <AutoComplete
              allowClear
              options={tlsSecretNames.map((item) => ({
                label: item,
                value: item,
              }))}
              placeholder="例如 example-com-tls"
              showSearch={{ filterOption: filterByValue }}
            />
          </Form.Item>
        </div>
        <Form.Item
          name="rules"
          required
          rules={[
            {
              validator: async (_, value?: IngressRouteRuleItem[]) => {
                if ((value || []).some(isValidIngressRule)) {
                  return;
                }
                throw new Error('请添加至少一个路由规则');
              },
            },
          ]}
        >
          <div className={styles.list}>
            {validRules.map(({ index, rule }) => {
              const paths = (rule.paths || []).filter(isValidIngressPath);
              const pathSummary = paths
                .map((path) => path.path || '-')
                .join('、');
              const serviceSummary = paths
                .map((path) =>
                  path.backend
                    ? '自定义后端'
                    : `${path.serviceName || '-'}:${path.servicePort || '-'}`,
                )
                .join('、');

              return (
                <div className={styles.card} key={rule.id}>
                  <div className={styles.cardHeader}>
                    <GlobalOutlined className={styles.icon} />
                    <div>
                      <div className={styles.title}>
                        {rule.host || '所有域名'}
                      </div>
                      <div className={styles.protocol}>
                        协议： {rule.protocol}
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <Tooltip title="删除路由规则">
                        <Button
                          aria-label="删除路由规则"
                          className={styles.actionButton}
                          icon={<DeleteOutlined />}
                          type="text"
                          onClick={() => deleteRule(index)}
                        />
                      </Tooltip>
                      <Tooltip title="编辑路由规则">
                        <Button
                          aria-label="编辑路由规则"
                          className={styles.actionButton}
                          icon={<EditOutlined />}
                          type="text"
                          onClick={() => openModal(index)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                  <div className={styles.summary}>
                    <span className={styles.summaryItem}>
                      路径： {pathSummary || '-'}
                    </span>
                    <span className={styles.summaryItem}>
                      服务： {serviceSummary || '-'}
                    </span>
                    <span className={styles.summaryItem}>
                      数量： {paths.length}
                    </span>
                  </div>
                </div>
              );
            })}
            <button
              className={styles.add}
              type="button"
              onClick={() => openModal()}
            >
              <PlusOutlined />
              <span className={styles.addText}>
                <span className={styles.addTitle}>添加路由规则</span>
                <span className={styles.addDescription}>
                  添加一个路由规则将域名路径映射至服务。
                </span>
              </span>
            </button>
          </div>
        </Form.Item>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>路径重写</div>
        <div className={styles.rewrite}>
          <div className={styles.rewriteHeader}>
            <Form.Item
              className={styles.rewriteCheckbox}
              name="enablePathRewrite"
              valuePropName="checked"
            >
              <Checkbox aria-label="路径重写" />
            </Form.Item>
            <span>
              <div className={styles.rewriteTitle}>路径重写</div>
              <div className={styles.rewriteDescription}>
                通过正则表达式去配置应用在当前路由规则的重写路径
              </div>
            </span>
          </div>
          {enablePathRewrite && (
            <div className={styles.rewriteBody}>
              <div className={styles.rewriteFieldLabel}>
                重写路径
                <Tooltip placement="right" title={rewriteTooltip}>
                  <QuestionCircleOutlined className={styles.helpIcon} />
                </Tooltip>
              </div>
              <Form.Item
                name="rewriteTarget"
                rules={[{ required: true, message: '请输入重写路径' }]}
              >
                <Input.TextArea
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  className={styles.rewriteTextArea}
                  placeholder="/"
                />
              </Form.Item>
            </div>
          )}
        </div>
      </div>

      <IngressRuleModal
        form={ruleForm}
        open={modalOpen}
        serviceOptions={serviceOptions}
        title={editingIndex === undefined ? '添加路由规则' : '编辑路由规则'}
        onCancel={() => setModalOpen(false)}
        onOk={() => {
          handleModalOk().catch(() => {
            message.warning('请完善路由规则配置');
          });
        }}
        onServiceSelect={onServiceSelect}
      />
    </div>
  );
};

export default IngressRuleSettings;
