import { Col, Form, InputNumber, Row } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  strategyGrid: {
    '.ant-form-item': {
      marginBottom: token.marginLG,
    },

    '.ant-form-item-extra': {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  numberInput: {
    width: '100%',
  },
}));

const JobStrategySettings = () => {
  const { styles } = useStyles();

  return (
    <Row className={styles.strategyGrid} gutter={18}>
      <Col span={12}>
        <Form.Item
          extra="将任务标记为失败前的最大重试次数。默认值为 6。"
          label="最大重试次数"
          name="backoffLimit"
        >
          <InputNumber
            className={styles.numberInput}
            controls={false}
            min={0}
            placeholder="请输入最大重试次数"
            precision={0}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          extra="将任务标记为完成所需成功运行的容器组数量。"
          label="容器组完成数量"
          name="completions"
        >
          <InputNumber
            className={styles.numberInput}
            controls={false}
            min={1}
            placeholder="请输入容器组完成数量"
            precision={0}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          extra="并行运行的容器组数量。"
          label="并行容器组数量"
          name="parallelism"
        >
          <InputNumber
            className={styles.numberInput}
            controls={false}
            min={1}
            placeholder="请输入并行容器组数量"
            precision={0}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          extra="任务的最大运行时间。任务达到最大运行时间时将被结束。"
          label="最大运行时间（s）"
          name="activeDeadlineSeconds"
        >
          <InputNumber
            className={styles.numberInput}
            controls={false}
            min={1}
            placeholder="请输入最大运行时间"
            precision={0}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default JobStrategySettings;
