import { Empty, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';
import ClusterLink from '../shared/ClusterLink';

const useStyles = createStyles(({ token }) => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginXS,
  },
  label: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  value: {
    minHeight: 46,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
    color: token.colorTextSecondary,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}));

type ResourceDataItem = {
  key: string;
  path?: string;
  value?: string;
};

type ResourceDataFieldsProps = {
  emptyText?: string;
  items?: ResourceDataItem[];
};

const ResourceDataFields = ({
  emptyText,
  items = [],
}: ResourceDataFieldsProps) => {
  const t = useT();
  const { styles } = useStyles();

  if (items.length === 0) {
    return <Empty description={emptyText ?? t('pages.k8s.metrics.noData')} />;
  }

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <div className={styles.item} key={item.key}>
          <Tooltip title={item.key} placement="topLeft">
            <div className={styles.label}>{item.key}</div>
          </Tooltip>
          <div className={styles.value}>
            {item.path ? (
              <ClusterLink to={item.path}>
                {item.value || item.path}
              </ClusterLink>
            ) : (
              item.value || ''
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export type { ResourceDataFieldsProps, ResourceDataItem };
export default ResourceDataFields;
