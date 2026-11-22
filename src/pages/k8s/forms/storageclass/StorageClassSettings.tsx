import { App, AutoComplete, Col, Form, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useMemo } from 'react';
import { useT } from '@/utils/i18n';
import KeyValueEditor from '../shared/KeyValueEditor';
import StringListEditor from '../shared/StringListEditor';
import { createKeyValueItem, createStringItem } from './helpers';

const useStyles = createStyles(({ token }) => ({
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    width: '100%',

    '& > .ant-form-item': {
      marginBottom: 0,
    },
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    width: '100%',

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  parameterField: {
    width: '100%',
  },
}));

const reclaimPolicyOptions = [
  { label: 'Delete', value: 'Delete' },
  { label: 'Retain', value: 'Retain' },
];

type StorageClassSettingsProps = {
  /** 集群里已有存储类使用的供应者（候选项，可手输） */
  provisioners: string[];
};

const StorageClassSettings = ({ provisioners }: StorageClassSettingsProps) => {
  const { styles } = useStyles();
  const t = useT();
  const { message } = App.useApp();
  const booleanOptions = useMemo(
    () => [
      { label: t('pages.k8s.forms.common.yes'), value: 'true' },
      { label: t('pages.k8s.forms.common.no'), value: 'false' },
    ],
    [t],
  );
  const volumeBindingModeOptions = useMemo(
    () => [
      {
        label: t('pages.k8s.forms.storageclass.bindingMode.immediate'),
        value: 'Immediate',
      },
      {
        label: t(
          'pages.k8s.forms.storageclass.bindingMode.waitForFirstConsumer',
        ),
        value: 'WaitForFirstConsumer',
      },
    ],
    [t],
  );

  return (
    <div className={styles.settings}>
      <div className={styles.fieldGroup}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              extra={t('pages.k8s.forms.storageclass.provisioner.extra')}
              label={t('pages.k8s.forms.storageclass.provisioner')}
              name="provisioner"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: t(
                    'pages.k8s.forms.storageclass.provisioner.required',
                  ),
                },
              ]}
            >
              <AutoComplete
                allowClear
                options={provisioners.map((item) => ({
                  label: item,
                  value: item,
                }))}
                placeholder={t(
                  'pages.k8s.forms.storageclass.provisioner.required',
                )}
                showSearch={{
                  filterOption: (input, option) =>
                    String(option?.value ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase()),
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('pages.k8s.forms.storageclass.reclaimPolicy')}
              name="reclaimPolicy"
              rules={[
                {
                  required: true,
                  message: t(
                    'pages.k8s.forms.storageclass.reclaimPolicy.required',
                  ),
                },
              ]}
            >
              <Select
                options={reclaimPolicyOptions}
                placeholder={t(
                  'pages.k8s.forms.storageclass.reclaimPolicy.required',
                )}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              extra={t('pages.k8s.forms.storageclass.bindingMode.extra')}
              label={t('pages.k8s.forms.storageclass.bindingMode')}
              name="volumeBindingMode"
              rules={[
                {
                  required: true,
                  message: t(
                    'pages.k8s.forms.storageclass.bindingMode.required',
                  ),
                },
              ]}
            >
              <Select
                options={volumeBindingModeOptions}
                placeholder={t(
                  'pages.k8s.forms.storageclass.bindingMode.required',
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              extra={t('pages.k8s.forms.storageclass.expansion.extra')}
              label={t('pages.k8s.forms.storageclass.expansion')}
              name="allowVolumeExpansion"
              rules={[
                {
                  required: true,
                  message: t('pages.k8s.forms.storageclass.expansion.required'),
                },
              ]}
            >
              <Select
                options={booleanOptions}
                placeholder={t('pages.k8s.forms.common.select')}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>
      <Form.Item
        className={styles.parameterField}
        extra={t('pages.k8s.forms.storageclass.parameters.extra')}
        label={t('pages.k8s.forms.storageclass.parameters')}
        name="parameters"
      >
        <KeyValueEditor
          addText={t('pages.k8s.form.add')}
          deleteAriaLabel={t('pages.k8s.forms.storageclass.parameters.delete')}
          minRows={1}
          onAddBlocked={() =>
            message.warning(
              t('pages.k8s.forms.storageclass.parameters.keyFirst'),
            )
          }
          onCreateItem={createKeyValueItem}
        />
      </Form.Item>
      <Form.Item
        className={styles.parameterField}
        extra={t('pages.k8s.forms.storageclass.mountOptions.extra')}
        label={t('pages.k8s.forms.storageclass.mountOptions')}
        name="mountOptions"
      >
        <StringListEditor
          addText={t('pages.k8s.form.add')}
          deleteAriaLabel={t(
            'pages.k8s.forms.storageclass.mountOptions.delete',
          )}
          minRows={1}
          placeholder={t(
            'pages.k8s.forms.storageclass.mountOptions.placeholder',
          )}
          onAddBlocked={() =>
            message.warning(
              t('pages.k8s.forms.storageclass.mountOptions.first'),
            )
          }
          onCreateItem={createStringItem}
        />
      </Form.Item>
    </div>
  );
};

export default StorageClassSettings;
