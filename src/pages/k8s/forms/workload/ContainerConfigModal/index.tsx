import { CodeSandboxOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Col, Form, Input, Modal, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
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
      okText="保存"
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
      title="编辑容器配置"
      width={960}
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form form={form} layout="vertical" requiredMark>
        <div className={styles.stack}>
          <div>
            <div className={styles.sectionTitle}>
              容器设置
              {/* <Tooltip title="配置容器的镜像、名称、类型和计算资源">
                <QuestionCircleOutlined className={styles.sectionHelpIcon} />
              </Tooltip> */}
            </div>
            <ContainerFormSection description="配置容器的镜像、名称、类型和计算资源">
              <Form.Item
                label="镜像"
                name="image"
                tooltip="如需使用私有镜像服务，您需要先创建镜像服务保密字典"
                rules={[{ required: true, message: '请输入容器镜像' }]}
              >
                <Input
                  className={styles.imageInput}
                  placeholder="镜像名称或路径，例如 nginx:latest"
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
                        label="容器名称"
                        name="containerName"
                        tooltip="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符"
                        rules={[
                          { required: true, message: '请输入容器名称' },
                          { max: 63, message: '容器名称最长 63 个字符' },
                          {
                            pattern: NAME_PATTERN,
                            message:
                              '容器名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
                          },
                          {
                            validator: (_, value?: string) =>
                              value && usedNames.includes(value.trim())
                                ? Promise.reject(new Error('容器名称已存在'))
                                : Promise.resolve(),
                          },
                        ]}
                      >
                        <Input placeholder="例如 container-ab12cd34" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="容器类型" name="containerType">
                        <Select
                          options={[
                            { label: '工作容器', value: 'worker' },
                            { label: '初始化容器', value: 'init' },
                          ]}
                          placeholder="请选择容器类型"
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
            description="设置用于访问容器的端口。"
            title="端口设置"
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
