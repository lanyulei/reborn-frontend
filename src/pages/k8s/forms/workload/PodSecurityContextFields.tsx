import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  Tooltip,
} from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  securityContext: {
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    marginTop: `16px`,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  securityHeader: {
    display: 'grid',
    gridTemplateColumns: '18px minmax(0, 1fr)',
    gap: token.marginSM,
    alignItems: 'start',
    // marginBottom: `10px`,
  },
  securityCheckbox: {
    marginTop: 3,
  },
  securityTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  securityHelpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: `14px`,
  },
  securityDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  securityNote: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    gap: token.marginSM,
    marginBottom: token.marginMD,
    padding: `12px 16px`,
    borderRadius: token.borderRadiusSM,
    background: token.colorInfoBg,
    color: token.colorInfoText,
  },
  securityNoteIcon: {
    color: token.colorInfo,
    fontSize: 20,
    lineHeight: 1,
  },
  securityNoteTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  securityNoteText: {
    marginTop: token.marginXXS,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  securityGroupTitle: {
    margin: `16px 0 8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  securityGroup: {
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,
  },
  seLinuxGroup: {
    background: token.colorFillQuaternary,
  },
  nonRootRow: {
    margin: `-${token.paddingSM}px -${token.paddingSM}px 16px`,
    padding: `12px`,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorFillQuaternary,
  },
  fieldHelp: {
    marginTop: token.marginXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

const PodSecurityContextFields = () => {
  const { styles } = useStyles();
  const form = Form.useFormInstance();
  const enabled = Form.useWatch('enablePodSecurityContext', form);
  const securityContextTip =
    '如果容器组安全上下文和容器安全上下文中都设置了用户、用户组和 SELinux 上下文，容器安全上下文中的设置将覆盖容器组安全上下文中的设置。';
  return (
    <div className={styles.securityContext}>
      <div className={styles.securityHeader}>
        <Form.Item
          className={styles.securityCheckbox}
          name="enablePodSecurityContext"
          valuePropName="checked"
        >
          <Checkbox aria-label="启用容器组安全上下文" />
        </Form.Item>
        <span>
          <div className={styles.securityTitle}>
            <span>容器组安全上下文</span>
            <Tooltip title={securityContextTip}>
              <QuestionCircleOutlined className={styles.securityHelpIcon} />
            </Tooltip>
          </div>
          <div className={styles.securityDescription}>
            自定义容器组的权限设置。
          </div>
        </span>
      </div>

      {enabled && (
        <>
          <div className={styles.securityGroupTitle}>用户和用户组</div>
          <div className={styles.securityGroup}>
            <div className={styles.nonRootRow}>
              <Form.Item
                label="仅允许非 root 用户运行"
                name="runAsNonRoot"
                valuePropName="checked"
                tooltip="启动容器之前检查容器是否将以 root 用户运行。如果容器将以 root 用户运行则不启动容器"
              >
                <Switch size="small" />
              </Form.Item>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="用户"
                  name="runAsUser"
                  tooltip="执行容器进程入口点的 UID。默认为镜像元数据中指定的 UID"
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                    placeholder="请输入用户 ID"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="用户组"
                  name="runAsGroup"
                  tooltip="执行容器进程入口点的 GID。默认为容器运行时的默认 GID"
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                    placeholder="请输入用户组 ID"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="文件系统组"
                  name="fsGroup"
                  tooltip="挂载卷时使用的 FSGroup。"
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                    placeholder="请输入文件系统组 ID"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="附加组策略"
                  name="supplementalGroupsPolicy"
                  tooltip="Kubernetes 1.35 GA。Strict 仅附加显式声明的组，避免镜像 /etc/group 隐式组影响卷权限。"
                >
                  <Select
                    allowClear
                    options={[
                      { label: 'Merge', value: 'Merge' },
                      { label: 'Strict', value: 'Strict' },
                    ]}
                    placeholder="默认 Merge"
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="附加用户组"
                  name="supplementalGroups"
                  tooltip="多个 GID 可使用英文逗号或换行分隔。"
                >
                  <Input.TextArea
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    placeholder="例如 3000,4000"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div
            className={styles.securityGroupTitle}
            style={{ marginTop: `16px` }}
          >
            SELinux 上下文
          </div>
          <div
            className={[styles.securityGroup, styles.seLinuxGroup].join(' ')}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="等级"
                  name="seLinuxLevel"
                  style={{ marginBottom: `16px` }}
                >
                  <Input placeholder="请输入 SELinux 等级" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="角色"
                  name="seLinuxRole"
                  style={{ marginBottom: `16px` }}
                >
                  <Input placeholder="请输入 SELinux 角色" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="类型" name="seLinuxType">
                  <Input placeholder="请输入 SELinux 类型" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="用户" name="seLinuxUser">
                  <Input placeholder="请输入 SELinux 用户" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </>
      )}
    </div>
  );
};

export default PodSecurityContextFields;
