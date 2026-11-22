import { Empty } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';
import { LabelTags } from '../../components/cells';
import KeyValueList from './KeyValueList';
import SubTitle from './SubTitle';

const useStyles = createStyles(({ token }) => ({
  metadata: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
}));

type ClusterMetadataProps = {
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  labelTitle?: string;
  annotationTitle?: string;
};

const getEntries = (data?: Record<string, string>) =>
  Object.entries(data || {}).filter(([key]) => Boolean(key));

const ClusterMetadata = ({
  labels,
  annotations,
  labelTitle: labelTitleProp,
  annotationTitle: annotationTitleProp,
}: ClusterMetadataProps) => {
  const t = useT();
  const labelTitle = labelTitleProp ?? t('pages.k8s.detail.labels');
  const annotationTitle =
    annotationTitleProp ?? t('pages.k8s.detail.annotations');
  const { styles } = useStyles();
  const labelEntries = getEntries(labels);
  const annotationEntries = getEntries(annotations);

  return (
    <div className={styles.metadata}>
      <div>
        <SubTitle>{labelTitle}</SubTitle>
        {/* 与列表的标签列同一个组件（这里全部展开） */}
        {labelEntries.length > 0 ? (
          <LabelTags value={labels} max={0} />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
      <div>
        <SubTitle>{annotationTitle}</SubTitle>
        <KeyValueList
          items={annotationEntries.map(([key, value]) => ({ key, value }))}
        />
      </div>
    </div>
  );
};

export type { ClusterMetadataProps };
export default ClusterMetadata;
