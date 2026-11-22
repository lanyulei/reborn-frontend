import { CodeSandboxOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Col, Form, Input, Modal, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import { useT } from '@/utils/i18n';
import { NAME_PATTERN } from '../helpers';
import type { CreateWorkloadContainerValues } from '../types';
import ContainerAdvancedOptions from './ContainerAdvancedOptions';
import ContainerFormSection from './ContainerFormSection';
import ContainerPortFields from './ContainerPortFields';
import ContainerResourceFields from './ContainerResourceFields';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionHelpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: `14px`,
  },
  imageInput: {
    '.ant-input-prefix': {
      alignSelf: 'stretch',
      alignItems: 'center',
      marginInlineEnd: token.marginSM,
      marginInlineStart: -token.paddingSM,
      padding: `0 ${token.paddingSM}px`,
      background: token.colorText,
      color: token.colorBgContainer,
      fontWeight: 600,
    },
  },
  imageSuffix: {
    color: token.colorTextSecondary,
  },
  imagePreview: {
    display: 'flex',
    minHeight: 140,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: token.marginXS,
    marginTop: token.marginMD,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
  },
  imagePreviewIcon: {
    color: token.colorText,
    fontSize: 42,
  },
  advancedToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
    margin: `${token.marginSM}px 0`,
    padding: 0,
    height: 'auto',
    color: token.colorPrimary,
    fontSize: token.fontSizeSM,
  },
  helper: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type ContainerConfigModalProps = {
  form: FormInstance<CreateWorkloadContainerValues>;
  open: boolean;
  /** 其它容器已占用的名称（同一 Pod 内容器名不能重复） */
  usedNames?: string[];
  onCancel: () => void;
  onOk: () => Promise<void>;
};

const ContainerConfigModal = ({
  form,
  open,
  usedNames = [],
  onCancel,
  onOk,
}: ContainerConfigModalProps) => {
  const { styles, theme } = useStyles();
  const t = useT();
  const [advancedOpen, setAdvancedOpen] = useState(true);

  useEffect(() => {
    if (open) {
      setAdvancedOpen(true);
    }
  }, [open]);

  return (
    <Modal
      destroyOnHidden
      mask={{ closable: false }}
      okText={t('common.action.save')}
      open={open}
      styles={{
        container: { padding: 0, overflow: 'hidden' },
        header: {
          marginBottom: 0,
          padding: `${theme.paddingMD}px ${theme.paddingLG}px`,
          borderBottom: `1px solid ${theme.colorBorderSecondary}`,
        },
        body: {
          maxHeight: 'calc(100vh - 210px)',
          overflow: 'auto',
          padding: theme.paddingLG,
          background: theme.colorBgContainer,
        },
        footer: {
          marginTop: 0,
          padding: `${theme.paddingSM}px ${theme.paddingLG}px`,
          borderTop: `1px solid ${theme.colorBorderSecondary}`,
          background: theme.colorBgContainer,
        },
      }}
      title={t('pages.k8s.forms.workload.container.edit')}
      width={960}
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form form={form} layout="vertical" requiredMark>
        <div className={styles.stack}>
          <div>
            <div className={styles.sectionTitle}>
              {t('pages.k8s.forms.workload.container.settings')}
              {/* <Tooltip title="配置容器的镜像、名称、类型和计算资源">
                <QuestionCircleOutlined className={styles.sectionHelpIcon} />
              </Tooltip> */}
            </div>
            <ContainerFormSection
              description={t(
                'pages.k8s.forms.workload.container.settings.description',
              )}
            >
              <Form.Item
                label={t('pages.k8s.column.image')}
                name="image"
                tooltip={t('pages.k8s.forms.workload.container.image.tooltip')}
                rules={[
                  {
                    required: true,
                    message: t(
                      'pages.k8s.forms.workload.container.image.required',
                    ),
                  },
                ]}
              >
                <Input
                  className={styles.imageInput}
                  placeholder={t(
                    'pages.k8s.forms.workload.container.image.placeholder',
                  )}
                  suffix={
                    <CodeSandboxOutlined className={styles.imageSuffix} />
                  }
                />
              </Form.Item>

              {/* <Button
            className={styles.advancedToggle}
            type="link"
            onClick={() => setAdvancedOpen((current) => !current)}
          >
            高级设置 {advancedOpen ? <UpOutlined /> : <DownOutlined />}
          </Button> */}

              {advancedOpen && (
                <>
                  <Row gutter={18}>
                    <Col span={12}>
                      <Form.Item
                        label={t('pages.k8s.forms.workload.container.name')}
                        name="containerName"
                        tooltip={t('pages.k8s.forms.common.name.dnsLabel')}
                        rules={[
                          {
                            required: true,
                            message: t(
                              'pages.k8s.forms.workload.container.name.required',
                            ),
                          },
                          {
                            max: 63,
                            message: t(
                              'pages.k8s.forms.workload.container.name.maxLength',
                            ),
                          },
                          {
                            pattern: NAME_PATTERN,
                            message: t(
                              'pages.k8s.forms.workload.container.name.pattern',
                            ),
                          },
                          {
                            validator: (_, value?: string) =>
                              value && usedNames.includes(value.trim())
                                ? Promise.reject(
                                    new Error(
                                      t(
                                        'pages.k8s.forms.workload.container.name.duplicate',
                                      ),
                                    ),
                                  )
                                : Promise.resolve(),
                          },
                        ]}
                      >
                        <Input
                          placeholder={t(
                            'pages.k8s.forms.workload.container.name.placeholder',
                          )}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('pages.k8s.forms.workload.container.type')}
                        name="containerType"
                      >
                        <Select
                          options={[
                            {
                              label: t(
                                'pages.k8s.forms.workload.container.type.worker',
                              ),
                              value: 'worker',
                            },
                            {
                              label: t('pages.k8s.form.section.initContainers'),
                              value: 'init',
                            },
                          ]}
                          placeholder={t(
                            'pages.k8s.forms.workload.container.type.required',
                          )}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <ContainerResourceFields />
                </>
              )}
            </ContainerFormSection>
          </div>

          <ContainerFormSection
            description={t(
              'pages.k8s.forms.workload.container.ports.description',
            )}
            title={t('pages.k8s.forms.workload.container.ports')}
          >
            <ContainerPortFields />
          </ContainerFormSection>

          <ContainerAdvancedOptions />
        </div>
      </Form>
    </Modal>
  );
};

export default ContainerConfigModal;
