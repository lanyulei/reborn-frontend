import {
  DeleteOutlined,
  LoginOutlined,
  LogoutOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Input, InputNumber, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useMemo } from 'react';
import { type Translate, useT } from '@/utils/i18n';
import {
  createNetworkPolicyPeerItem,
  createNetworkPolicyPortItem,
  createNetworkPolicyRuleItem,
  getDefaultPeerForType,
  getIpBlockExceptError,
  getPortError,
  isValidCidr,
} from './helpers';
import LabelSelectorEditor from './LabelSelectorEditor';
import type {
  NetworkPolicyPeerItem,
  NetworkPolicyPeerType,
  NetworkPolicyPortItem,
  NetworkPolicyProtocol,
  NetworkPolicyRuleItem,
} from './types';

type NetworkPolicyRuleDirection = 'egress' | 'ingress';

const PROTOCOL_OPTIONS: { label: string; value: NetworkPolicyProtocol }[] = [
  { label: 'TCP', value: 'TCP' },
  { label: 'UDP', value: 'UDP' },
  { label: 'SCTP', value: 'SCTP' },
];

const useStyles = createStyles(({ token }) => ({
  stack: {
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
    fontSize: 30,
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
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
    marginTop: 14,
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  sectionTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  peerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  peerCard: {
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
  },
  peerHeader: {
    display: 'grid',
    gridTemplateColumns: 'minmax(180px, 240px) minmax(0, 1fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  peerType: {
    width: '100%',

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
  },
  peerBody: {
    marginTop: token.marginSM,
  },
  selectorGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: token.marginMD,
  },
  selectorPanel: {
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  selectorTitle: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  ipBlockRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(180px, 0.8fr) minmax(0, 1fr)',
    gap: token.marginSM,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  input: {
    minWidth: 0,
    width: '100%',
  },
  fieldError: {
    marginTop: token.marginXXS,
    color: token.colorError,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  hint: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  portRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  portRow: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(120px, 0.5fr) minmax(160px, 1fr) minmax(140px, 0.7fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  portInput: {
    minWidth: 0,
    width: '100%',

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  addRule: {
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
}));

type NetworkPolicyRuleEditorProps = {
  direction: NetworkPolicyRuleDirection;
  value?: NetworkPolicyRuleItem[];
  onChange?: (value: NetworkPolicyRuleItem[]) => void;
};

/** 方向相关文案：键位于 pages.k8s.forms.networkpolicy.{ingress|egress}.* */
const getDirectionText = (
  direction: NetworkPolicyRuleDirection,
  t: Translate,
) => {
  const prefix = `pages.k8s.forms.networkpolicy.${direction}`;

  return {
    add: t(`${prefix}.add`),
    addDescription: t(`${prefix}.addDescription`),
    addPeer: t(`${prefix}.addPeer`),
    allPeers: t(`${prefix}.allPeers`),
    delete: t(`${prefix}.delete`),
    deletePeer: t(`${prefix}.deletePeer`),
    icon: direction === 'ingress' ? <LoginOutlined /> : <LogoutOutlined />,
    peer: t(
      direction === 'ingress'
        ? 'pages.k8s.forms.networkpolicy.source'
        : 'pages.k8s.forms.networkpolicy.destination',
    ),
    peerCount: (count: number) => t(`${prefix}.peerCount`, { count }),
    ruleDescription: t(`${prefix}.description`),
    rule: t(prefix),
  };
};

const getRuleSummaryItems = (
  rule: NetworkPolicyRuleItem,
  directionText: ReturnType<typeof getDirectionText>,
  t: Translate,
) => {
  const peerText = rule.peers?.length
    ? directionText.peerCount(rule.peers.length)
    : directionText.allPeers;
  const portText = rule.ports?.length
    ? t('pages.k8s.forms.networkpolicy.summary.portCount', {
        count: rule.ports.length,
      })
    : t('pages.k8s.forms.networkpolicy.summary.allPorts');

  return {
    peerText,
    portText,
  };
};

const NetworkPolicyRuleEditor = ({
  direction,
  value = [],
  onChange,
}: NetworkPolicyRuleEditorProps) => {
  const t = useT();
  const { styles } = useStyles();
  const directionText = getDirectionText(direction, t);
  const peerTypeOptions = useMemo<
    { label: string; value: NetworkPolicyPeerType }[]
  >(
    () => [
      { label: t('pages.k8s.forms.common.podSelector'), value: 'podSelector' },
      {
        label: t('pages.k8s.forms.networkpolicy.namespaceSelector'),
        value: 'namespaceSelector',
      },
      {
        label: t('pages.k8s.forms.networkpolicy.peerType.podAndNamespace'),
        value: 'podAndNamespaceSelector',
      },
      {
        label: t('pages.k8s.forms.networkpolicy.peerType.ipBlock'),
        value: 'ipBlock',
      },
    ],
    [t],
  );

  const updateRules = (nextRules: NetworkPolicyRuleItem[]) => {
    onChange?.(nextRules);
  };

  const updateRule = (
    ruleId: string,
    patch: Partial<NetworkPolicyRuleItem>,
  ) => {
    updateRules(
      value.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
    );
  };

  const updatePeer = (
    rule: NetworkPolicyRuleItem,
    peerId: string,
    nextPeer: NetworkPolicyPeerItem,
  ) => {
    updateRule(rule.id, {
      peers: (rule.peers || []).map((peer) =>
        peer.id === peerId ? nextPeer : peer,
      ),
    });
  };

  const updatePort = (
    rule: NetworkPolicyRuleItem,
    portId: string,
    patch: Partial<NetworkPolicyPortItem>,
  ) => {
    updateRule(rule.id, {
      ports: (rule.ports || []).map((port) =>
        port.id === portId ? { ...port, ...patch } : port,
      ),
    });
  };

  return (
    <div className={styles.stack}>
      {value.map((rule, index) => {
        const summary = getRuleSummaryItems(rule, directionText, t);

        return (
          <div className={styles.card} key={rule.id}>
            <div className={styles.cardHeader}>
              <div className={styles.icon}>{directionText.icon}</div>
              <div>
                <div className={styles.title}>
                  {directionText.rule} {index + 1}
                </div>
                <div className={styles.protocol}>
                  {directionText.ruleDescription}
                </div>
              </div>
              <div className={styles.actions}>
                <Button
                  aria-label={directionText.delete}
                  className={styles.deleteButton}
                  icon={<DeleteOutlined />}
                  type="text"
                  onClick={() =>
                    updateRules(value.filter((item) => item.id !== rule.id))
                  }
                />
              </div>
            </div>

            <div className={styles.summary}>
              <span className={styles.summaryItem}>
                {t('pages.k8s.forms.networkpolicy.summary.peers', {
                  label: directionText.peer,
                  text: summary.peerText,
                })}
              </span>
              <span className={styles.summaryItem}>
                {t('pages.k8s.forms.networkpolicy.summary.ports', {
                  text: summary.portText,
                })}
              </span>
            </div>

            <div className={styles.body}>
              <div className={styles.section}>
                <div className={styles.sectionTitle}>{directionText.peer}</div>
                <div className={styles.peerList}>
                  {(rule.peers || []).map((peer) => (
                    <div className={styles.peerCard} key={peer.id}>
                      <div className={styles.peerHeader}>
                        <Select
                          className={styles.peerType}
                          options={peerTypeOptions}
                          value={peer.type}
                          onChange={(nextType) =>
                            updatePeer(
                              rule,
                              peer.id,
                              getDefaultPeerForType(nextType, peer),
                            )
                          }
                        />
                        <span />
                        <Button
                          aria-label={directionText.deletePeer}
                          className={styles.deleteButton}
                          icon={<DeleteOutlined />}
                          type="text"
                          onClick={() =>
                            updateRule(rule.id, {
                              peers: (rule.peers || []).filter(
                                (item) => item.id !== peer.id,
                              ),
                            })
                          }
                        />
                      </div>

                      <div className={styles.peerBody}>
                        {peer.type === 'ipBlock' ? (
                          <>
                            <div className={styles.ipBlockRow}>
                              <Input
                                className={styles.input}
                                placeholder={t(
                                  'pages.k8s.forms.networkpolicy.ipBlock.cidrPlaceholder',
                                )}
                                status={
                                  peer.ipBlockCidr?.trim() &&
                                  !isValidCidr(peer.ipBlockCidr)
                                    ? 'error'
                                    : undefined
                                }
                                value={peer.ipBlockCidr}
                                onChange={(event) =>
                                  updatePeer(rule, peer.id, {
                                    ...peer,
                                    ipBlockCidr: event.target.value,
                                  })
                                }
                              />
                              <Select
                                className={styles.input}
                                mode="tags"
                                placeholder={t(
                                  'pages.k8s.forms.networkpolicy.ipBlock.exceptPlaceholder',
                                )}
                                status={
                                  getIpBlockExceptError(peer, t)
                                    ? 'error'
                                    : undefined
                                }
                                value={peer.ipBlockExcept}
                                onChange={(ipBlockExcept) =>
                                  updatePeer(rule, peer.id, {
                                    ...peer,
                                    ipBlockExcept,
                                  })
                                }
                              />
                            </div>
                            {peer.ipBlockCidr?.trim() &&
                              (!isValidCidr(peer.ipBlockCidr) ||
                                getIpBlockExceptError(peer, t)) && (
                                <div className={styles.fieldError}>
                                  {isValidCidr(peer.ipBlockCidr)
                                    ? getIpBlockExceptError(peer, t)
                                    : t(
                                        'pages.k8s.forms.networkpolicy.ipBlock.cidrInvalid',
                                      )}
                                </div>
                              )}
                          </>
                        ) : peer.type === 'podAndNamespaceSelector' ? (
                          <div className={styles.selectorGrid}>
                            <div className={styles.selectorPanel}>
                              <div className={styles.selectorTitle}>
                                {t('pages.k8s.forms.common.podSelector')}
                              </div>
                              <LabelSelectorEditor
                                value={peer.podSelector}
                                onChange={(podSelector) =>
                                  updatePeer(rule, peer.id, {
                                    ...peer,
                                    podSelector,
                                  })
                                }
                              />
                            </div>
                            <div className={styles.selectorPanel}>
                              <div className={styles.selectorTitle}>
                                {t(
                                  'pages.k8s.forms.networkpolicy.namespaceSelector',
                                )}
                              </div>
                              <LabelSelectorEditor
                                value={peer.namespaceSelector}
                                onChange={(namespaceSelector) =>
                                  updatePeer(rule, peer.id, {
                                    ...peer,
                                    namespaceSelector,
                                  })
                                }
                              />
                            </div>
                          </div>
                        ) : (
                          <div className={styles.selectorPanel}>
                            <div className={styles.selectorTitle}>
                              {peer.type === 'namespaceSelector'
                                ? t(
                                    'pages.k8s.forms.networkpolicy.namespaceSelector',
                                  )
                                : t('pages.k8s.forms.common.podSelector')}
                            </div>
                            <LabelSelectorEditor
                              value={
                                peer.type === 'namespaceSelector'
                                  ? peer.namespaceSelector
                                  : peer.podSelector
                              }
                              onChange={(selector) =>
                                updatePeer(rule, peer.id, {
                                  ...peer,
                                  namespaceSelector:
                                    peer.type === 'namespaceSelector'
                                      ? selector
                                      : peer.namespaceSelector,
                                  podSelector:
                                    peer.type === 'podSelector'
                                      ? selector
                                      : peer.podSelector,
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.footer}>
                  <Button
                    onClick={() =>
                      updateRule(rule.id, {
                        peers: [
                          ...(rule.peers || []),
                          createNetworkPolicyPeerItem(),
                        ],
                      })
                    }
                  >
                    {directionText.addPeer}
                  </Button>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  {t('pages.k8s.form.port')}
                </div>
                <div className={styles.portRows}>
                  {(rule.ports || []).map((port) => (
                    <div key={port.id}>
                      <div className={styles.portRow}>
                        <Select
                          className={styles.portInput}
                          options={PROTOCOL_OPTIONS}
                          value={port.protocol}
                          onChange={(protocol) =>
                            updatePort(rule, port.id, { protocol })
                          }
                        />
                        <Input
                          className={styles.portInput}
                          placeholder={t(
                            'pages.k8s.forms.networkpolicy.port.placeholder',
                          )}
                          status={
                            getPortError(port, t)?.field === 'port'
                              ? 'error'
                              : undefined
                          }
                          value={port.port}
                          onChange={(event) =>
                            updatePort(rule, port.id, {
                              port: event.target.value,
                            })
                          }
                        />
                        <InputNumber
                          className={styles.portInput}
                          max={65535}
                          min={1}
                          placeholder={t(
                            'pages.k8s.forms.networkpolicy.endPort',
                          )}
                          precision={0}
                          status={
                            getPortError(port, t)?.field === 'endPort'
                              ? 'error'
                              : undefined
                          }
                          value={port.endPort}
                          onChange={(endPort) =>
                            updatePort(rule, port.id, {
                              endPort: endPort ?? undefined,
                            })
                          }
                        />
                        <Button
                          aria-label={t('pages.k8s.forms.common.deletePort')}
                          className={styles.deleteButton}
                          icon={<DeleteOutlined />}
                          type="text"
                          onClick={() =>
                            updateRule(rule.id, {
                              ports: (rule.ports || []).filter(
                                (item) => item.id !== port.id,
                              ),
                            })
                          }
                        />
                      </div>
                      {getPortError(port, t) && (
                        <div className={styles.fieldError}>
                          {getPortError(port, t)?.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {(rule.ports || []).length > 0 && (
                  <div className={styles.hint}>
                    {t('pages.k8s.forms.networkpolicy.endPort.hint')}
                  </div>
                )}
                <div className={styles.footer}>
                  <Button
                    onClick={() =>
                      updateRule(rule.id, {
                        ports: [
                          ...(rule.ports || []),
                          createNetworkPolicyPortItem(),
                        ],
                      })
                    }
                  >
                    {t('pages.k8s.forms.networkpolicy.port.add')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <button
        className={styles.addRule}
        type="button"
        onClick={() => updateRules([...value, createNetworkPolicyRuleItem()])}
      >
        <PlusOutlined />
        <span className={styles.addText}>
          <span className={styles.addTitle}>{directionText.add}</span>
          <span className={styles.addDescription}>
            {directionText.addDescription}
          </span>
        </span>
      </button>
    </div>
  );
};

export default NetworkPolicyRuleEditor;
