import { ClusterOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import KeyValueList from '../shared/KeyValueList';
import SubTitle from '../shared/SubTitle';
import { buildPodContainers } from './podHelpers';

const useStyles = createStyles(({ token }) => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  item: {
    padding: 0,
  },
  itemWithSpacing: {
    marginTop: 16,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 20,
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    padding: 0,
    border: 0,
    backgroundColor: 'transparent',
    color: token.colorText,
    cursor: 'pointer',
    textAlign: 'left',

    '&:hover': {
      color: token.colorText,
    },

    '&:focus-visible': {
      outline: `2px solid ${token.colorPrimaryBorder}`,
      outlineOffset: 2,
    },
  },
  title: {
    display: 'inline-flex',
    alignItems: 'center',
    height: 20,
    minWidth: 0,
    gap: token.marginSM,
    color: token.colorText,
    fontSize: 14,
    // fontWeight: 600,
  },
  icon: {
    color: token.colorTextSecondary,
    fontSize: 16,
  },
  content: {
    marginTop: token.marginSM,
  },
}));

type JobEnvironmentVariablesProps = {
  manifest?: Record<string, unknown>;
};

const getContainers = (manifest?: Record<string, unknown>) => {
  return buildPodContainers(manifest).map((container) => ({
    name: container.name || '-',
    env: (container.env || [])
      .map((env) => ({
        key: env.name || '',
        value: env.value || env.value_from,
      }))
      .filter((item) => item.key),
  }));
};

const JobEnvironmentVariables = ({
  manifest,
}: JobEnvironmentVariablesProps) => {
  const { styles } = useStyles();
  const containers = useMemo(
    () =>
      getContainers(manifest).filter((container) => container.env.length > 0),
    [manifest],
  );
  const [expandedContainerName, setExpandedContainerName] = useState<string>();

  useEffect(() => {
    setExpandedContainerName(containers[0]?.name);
  }, [containers]);

  if (containers.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className={styles.list}>
      {containers.map((container, index) => {
        const expanded = expandedContainerName === container.name;

        return (
          <div
            className={`${styles.item} ${
              index > 0 ? styles.itemWithSpacing : ''
            }`}
            key={container.name}
          >
            <div className={styles.header}>
              <SubTitle style={{ marginBottom: 0 }}>
                <button
                  aria-expanded={expanded}
                  className={styles.toggle}
                  onClick={() =>
                    setExpandedContainerName(
                      expanded ? undefined : container.name,
                    )
                  }
                  type="button"
                >
                  <span className={styles.title}>
                    <ClusterOutlined className={styles.icon} />
                    <span>容器：{container.name}</span>
                  </span>
                </button>
              </SubTitle>
            </div>
            {expanded ? (
              <div className={styles.content}>
                <KeyValueList items={container.env} keyLabel="" valueLabel="" />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default JobEnvironmentVariables;
