import { Col, Form, Input, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import type { IngressClassParameterScope } from './types';

const useStyles = createStyles(({ token }) => ({
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    width: '100%',

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  parameterFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    width: '100%',
  },
}));

const booleanOptions = [
  { label: '启用', value: 'true' },
  { label: '不启用', value: 'false' },
];

const scopeOptions: { label: string; value: IngressClassParameterScope }[] = [
  { label: '集群级', value: 'Cluster' },
  { label: '命名空间级', value: 'Namespace' },
];

const IngressClassParameterSettings = () => {
  const { styles } = useStyles();
  const enableParameters = Form.useWatch('enableParameters');
  const parameterScope = Form.useWatch('parameterScope');

  return (
    <div className={styles.settings}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            extra="参数引用用于关联控制器需要的配置资源；未启用时不会输出 spec.parameters。"
            label="参数引用"
            name="enableParameters"
            rules={[{ required: true, message: '请选择是否启用参数引用' }]}
          >
            <Select options={booleanOptions} placeholder="请选择" />
          </Form.Item>
        </Col>
      </Row>

      {enableParameters === 'true' && (
        <div className={styles.parameterFields}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                extra="例如 k8s.example.com；核心 API 组可以留空。"
                label="API 组"
                name="parameterApiGroup"
              >
                <Input placeholder="请输入 API 组" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="类型"
                name="parameterKind"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: '请输入参数资源类型',
                  },
                ]}
              >
                <Input placeholder="请输入参数资源类型" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="名称"
                name="parameterName"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: '请输入参数资源名称',
                  },
                ]}
              >
                <Input placeholder="请输入参数资源名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="作用域"
                name="parameterScope"
                rules={[{ required: true, message: '请选择参数作用域' }]}
              >
                <Select options={scopeOptions} placeholder="请选择作用域" />
              </Form.Item>
            </Col>
          </Row>
          {parameterScope === 'Namespace' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="命名空间"
                  name="parameterNamespace"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: '请输入参数命名空间',
                    },
                  ]}
                >
                  <Input placeholder="请输入参数命名空间" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </div>
      )}
    </div>
  );
};

export default IngressClassParameterSettings;
