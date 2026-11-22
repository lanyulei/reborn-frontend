import { DownOutlined, UpOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { App, Button, Checkbox, Form } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { useT } from '@/utils/i18n';
import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import KeyValueEditor from '../shared/KeyValueEditor';
import { createId } from './helpers';
import NodeSelectorModal from './NodeSelectorModal';
import type { CreateWorkloadFormValues, WorkloadKind } from './types';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  sectionTitle: {
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  option: {
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  optionHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
  },
  optionHeaderButton: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
    width: '100%',
    padding: 0,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
  },
  headerIcon: {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    marginTop: 2,
  },
  title: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  description: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  body: {
    marginTop: `14px`,
    // padding: token.paddingSM,
    borderRadius: token.borderRadiusSM,
    // background: token.colorFillQuaternary,
  },
  metadataBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
    marginTop: `14px`,
    // padding: token.paddingSM,
    borderRadius: token.borderRadiusSM,
    // background: token.colorFillQuaternary,
  },
  fieldLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type WorkloadAdvancedSettingsProps = {
  defaultMetadataOpen?: boolean;
  form: FormInstance<CreateWorkloadFormValues>;
  type: WorkloadKind;
};

const createKeyValueItem = (): KeyValueEditorItem => ({
  id: createId(),
  keyName: '',
  value: '',
});

const WorkloadAdvancedSettings = ({
  defaultMetadataOpen = true,
  form,
  type,
}: WorkloadAdvancedSettingsProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const t = useT();
  const [metadataOpen, setMetadataOpen] = useState(defaultMetadataOpen);
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const showNodeSelector = type !== 'DaemonSet';
  const enableNodeSelector = Form.useWatch('enableNodeSelector', form);
  const selectedNodeNames =
    (Form.useWatch('selectedNodeNames', {
      form,
      preserve: true,
    }) as string[]) || [];

  return (
    <div className={styles.stack}>
      {showNodeSelector && (
        <div>
          <div className={styles.sectionTitle}>
            {t('pages.k8s.forms.workload.node.select')}
          </div>
          <div className={styles.option}>
            <div className={styles.optionHeader}>
              <Form.Item
                className={styles.checkbox}
                name="enableNodeSelector"
                valuePropName="checked"
              >
                <Checkbox
                  aria-label={t('pages.k8s.forms.workload.node.select')}
                />
              </Form.Item>
              <span>
                <div className={styles.title}>
                  {t('pages.k8s.forms.workload.node.select')}
                </div>
                <div className={styles.description}>
                  {t('pages.k8s.forms.workload.node.select.description')}
                </div>
              </span>
            </div>
            {enableNodeSelector && (
              <div className={styles.body}>
                <Form.Item name="nodeSelectors">
                  <KeyValueEditor
                    addIcon={false}
                    addText={t('pages.k8s.forms.workload.node.selector.add')}
                    deleteAriaLabel={t(
                      'pages.k8s.forms.workload.node.selector.delete',
                    )}
                    minRows={1}
                    footerExtra={
                      <Button onClick={() => setNodeModalOpen(true)}>
                        {t('pages.k8s.forms.workload.node.assign')}
                      </Button>
                    }
                    footerJustify="space-between"
                    onAddBlocked={() =>
                      message.warning(
                        t('pages.k8s.forms.workload.node.selector.keyFirst'),
                      )
                    }
                    onCreateItem={createKeyValueItem}
                  />
                </Form.Item>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <div className={styles.sectionTitle}>
          {t('pages.k8s.forms.common.metadata')}
        </div>
        <div className={styles.option}>
          <button
            className={styles.optionHeaderButton}
            type="button"
            onClick={() => setMetadataOpen((open) => !open)}
          >
            <span className={styles.headerIcon}>
              {metadataOpen ? <UpOutlined /> : <DownOutlined />}
            </span>
            <span>
              <div className={styles.title}>
                {t('pages.k8s.forms.common.addMetadata')}
              </div>
              <div className={styles.description}>
                {t('pages.k8s.forms.workload.metadata.description')}
              </div>
            </span>
          </button>
          {metadataOpen && (
            <div className={styles.metadataBody}>
              <div>
                <div className={styles.fieldLabel}>
                  {t('pages.k8s.forms.common.labels')}
                </div>
                <Form.Item name="labels">
                  <KeyValueEditor
                    addIcon={false}
                    addText={t('pages.k8s.form.add')}
                    deleteAriaLabel={t('pages.k8s.forms.common.deleteLabel')}
                    minRows={1}
                    onAddBlocked={() =>
                      message.warning(t('pages.k8s.forms.common.labelKeyFirst'))
                    }
                    onCreateItem={createKeyValueItem}
                  />
                </Form.Item>
              </div>
              <div>
                <div className={styles.fieldLabel}>
                  {t('pages.k8s.forms.common.annotations')}
                </div>
                <Form.Item name="annotations">
                  <KeyValueEditor
                    addIcon={false}
                    addText={t('pages.k8s.form.add')}
                    deleteAriaLabel={t(
                      'pages.k8s.forms.common.deleteAnnotation',
                    )}
                    minRows={1}
                    onAddBlocked={() =>
                      message.warning(
                        t('pages.k8s.forms.common.annotationKeyFirst'),
                      )
                    }
                    onCreateItem={createKeyValueItem}
                  />
                </Form.Item>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNodeSelector && (
        <NodeSelectorModal
          open={nodeModalOpen}
          selectedNodeNames={selectedNodeNames}
          onCancel={() => setNodeModalOpen(false)}
          onOk={(nodeNames) => {
            form.setFieldValue('selectedNodeNames', nodeNames);
            setNodeModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default WorkloadAdvancedSettings;
