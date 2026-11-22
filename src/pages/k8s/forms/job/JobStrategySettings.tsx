import { Col, Form, InputNumber, Row } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';

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
  const t = useT();

  return (
    <Row className={styles.strategyGrid} gutter={18}>
      <Col span={12}>
        <Form.Item
          extra={t('pages.k8s.forms.job.backoffLimit.extra')}
          label={t('pages.k8s.forms.job.backoffLimit')}
          name="backoffLimit"
        >
          <InputNumber
            className={styles.numberInput}
            controls={false}
            min={0}
            placeholder={t('pages.k8s.forms.job.backoffLimit.placeholder')}
            precision={0}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          extra={t('pages.k8s.forms.job.completions.extra')}
          label={t('pages.k8s.forms.job.completions')}
          name="completions"
        >
          <InputNumber
            className={styles.numberInput}
            controls={false}
            min={1}
            placeholder={t('pages.k8s.forms.job.completions.placeholder')}
            precision={0}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          extra={t('pages.k8s.forms.job.parallelism.extra')}
          label={t('pages.k8s.forms.job.parallelism')}
          name="parallelism"
        >
          <InputNumber
            className={styles.numberInput}
            controls={false}
            min={1}
            placeholder={t('pages.k8s.forms.job.parallelism.placeholder')}
            precision={0}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          extra={t('pages.k8s.forms.job.activeDeadlineSeconds.extra')}
          label={t('pages.k8s.forms.job.activeDeadlineSeconds')}
          name="activeDeadlineSeconds"
        >
          <InputNumber
            className={styles.numberInput}
            controls={false}
            min={1}
            placeholder={t(
              'pages.k8s.forms.job.activeDeadlineSeconds.placeholder',
            )}
            precision={0}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default JobStrategySettings;
