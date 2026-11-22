import { DeleteOutlined } from '@ant-design/icons';
import { App, Button, Input, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';
import CollapsibleField from '../shared/CollapsibleField';
import KeyValueEditor from '../shared/KeyValueEditor';
import {
  createKeyValueItem,
  createSelectorExpressionItem,
  selectorOperatorNeedsValues,
} from './helpers';
import type {
  NetworkPolicyLabelSelectorValues,
  NetworkPolicySelectorExpressionItem,
  NetworkPolicySelectorOperator,
} from './types';

const SELECTOR_OPERATOR_OPTIONS: {
  label: string;
  value: NetworkPolicySelectorOperator;
}[] = [
  { label: 'In', value: 'In' },
  { label: 'NotIn', value: 'NotIn' },
  { label: 'Exists', value: 'Exists' },
  { label: 'DoesNotExist', value: 'DoesNotExist' },
];

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
  expressionRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  expressionRow: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(160px, 1fr) minmax(132px, 0.7fr) minmax(180px, 1fr) 40px',
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
  input: {
    minWidth: 0,
    width: '100%',

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
}));

type LabelSelectorEditorProps = {
  value?: NetworkPolicyLabelSelectorValues;
  onChange?: (value: NetworkPolicyLabelSelectorValues) => void;
};

const getSelectorValue = (
  value?: NetworkPolicyLabelSelectorValues,
): NetworkPolicyLabelSelectorValues => ({
  matchExpressions: value?.matchExpressions || [],
  matchLabels: value?.matchLabels || [],
});

const LabelSelectorEditor = ({ value, onChange }: LabelSelectorEditorProps) => {
  const t = useT();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const selectorValue = getSelectorValue(value);
  const expressions = selectorValue.matchExpressions || [];

  const updateValue = (nextValue: NetworkPolicyLabelSelectorValues) => {
    onChange?.(nextValue);
  };

  const updateExpression = (
    id: string,
    patch: Partial<NetworkPolicySelectorExpressionItem>,
  ) => {
    updateValue({
      ...selectorValue,
      matchExpressions: expressions.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  };

  const addExpression = () => {
    if (expressions.some((item) => !item.keyName?.trim())) {
      message.warning(
        t('pages.k8s.forms.networkpolicy.selector.expressionKeyFirst'),
      );
      return;
    }

    updateValue({
      ...selectorValue,
      matchExpressions: [...expressions, createSelectorExpressionItem()],
    });
  };

  const deleteExpression = (id: string) => {
    updateValue({
      ...selectorValue,
      matchExpressions: expressions.filter((item) => item.id !== id),
    });
  };

  return (
    <div className={styles.stack}>
      <CollapsibleField
        description={t('pages.k8s.forms.networkpolicy.matchLabels.description')}
        title={t('pages.k8s.forms.networkpolicy.matchLabels')}
      >
        <KeyValueEditor
          addIcon={false}
          addText={t('pages.k8s.form.add')}
          deleteAriaLabel={t(
            'pages.k8s.forms.networkpolicy.matchLabels.delete',
          )}
          keyPlaceholder={t('pages.k8s.forms.common.labelKey')}
          value={selectorValue.matchLabels}
          valuePlaceholder={t('pages.k8s.forms.common.labelValue')}
          onAddBlocked={() =>
            message.warning(t('pages.k8s.forms.common.labelKeyFirst'))
          }
          onChange={(nextLabels) =>
            updateValue({ ...selectorValue, matchLabels: nextLabels })
          }
          onCreateItem={() => createKeyValueItem()}
        />
      </CollapsibleField>

      <CollapsibleField
        description={t(
          'pages.k8s.forms.networkpolicy.matchExpressions.description',
        )}
        title={t('pages.k8s.forms.networkpolicy.matchExpressions')}
      >
        <div className={styles.expressionRows}>
          {expressions.map((item) => {
            const needsValues = selectorOperatorNeedsValues(item.operator);

            return (
              <div className={styles.expressionRow} key={item.id}>
                <Input
                  className={styles.input}
                  placeholder={t('pages.k8s.forms.common.labelKey')}
                  value={item.keyName}
                  onChange={(event) =>
                    updateExpression(item.id, {
                      keyName: event.target.value,
                    })
                  }
                />
                <Select
                  className={styles.input}
                  options={SELECTOR_OPERATOR_OPTIONS}
                  value={item.operator}
                  onChange={(operator) =>
                    updateExpression(item.id, {
                      operator,
                      values: selectorOperatorNeedsValues(operator)
                        ? item.values
                        : [],
                    })
                  }
                />
                <Select
                  className={styles.input}
                  disabled={!needsValues}
                  mode="tags"
                  placeholder={
                    needsValues
                      ? t(
                          'pages.k8s.forms.networkpolicy.matchExpressions.valuesPlaceholder',
                        )
                      : t(
                          'pages.k8s.forms.networkpolicy.matchExpressions.noValues',
                        )
                  }
                  value={item.values}
                  onChange={(values) => updateExpression(item.id, { values })}
                />
                <Button
                  aria-label={t(
                    'pages.k8s.forms.networkpolicy.matchExpressions.delete',
                  )}
                  className={styles.deleteButton}
                  icon={<DeleteOutlined />}
                  type="text"
                  onClick={() => deleteExpression(item.id)}
                />
              </div>
            );
          })}
        </div>
        <div className={styles.footer}>
          <Button onClick={addExpression}>{t('pages.k8s.form.add')}</Button>
        </div>
      </CollapsibleField>
    </div>
  );
};

export default LabelSelectorEditor;
