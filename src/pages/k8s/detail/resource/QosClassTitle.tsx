import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  qosTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
  },
  qosHelpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: 13,
    marginTop: 2,
  },
  qosTooltip: {
    display: 'grid',
    gap: token.marginXXS,
    maxWidth: 360,
    lineHeight: token.lineHeight,
  },
}));

const QosClassTitle = () => {
  const { styles } = useStyles();

  return (
    <span className={styles.qosTitle}>
      QoS 类别
      <Tooltip
        placement="top"
        title={
          <div className={styles.qosTooltip}>
            <div>
              <strong>Guaranteed：</strong>
              CPU/内存 request 与 limit
              都设置且相等，资源保障最高，节点资源紧张时最后被驱逐。
            </div>
            <div>
              <strong>Burstable：</strong>
              至少设置了一个 request 或 limit，但不满足 Guaranteed
              条件，可在空闲资源上突发使用。
            </div>
            <div>
              <strong>BestEffort：</strong>
              未设置 CPU/内存 request 和
              limit，无资源保障，节点资源紧张时最先被驱逐。
            </div>
          </div>
        }
      >
        <QuestionCircleOutlined
          aria-label="QoS 类别说明"
          className={styles.qosHelpIcon}
          tabIndex={0}
        />
      </Tooltip>
    </span>
  );
};

export default QosClassTitle;
