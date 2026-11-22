/**
 * 存储设置的卡片展示层：入口选择卡（还没有存储项时）、已配置存储卡与追加卡（StatefulSet 按
 * 卷声明模板 / 挂载两组展示）。纯展示 + 回调，不持有表单状态——草稿编辑在 StorageSettings 的弹窗里。
 */
import {
  DeleteOutlined,
  DockerOutlined,
  EditOutlined,
  HddOutlined,
  SettingOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Button, Typography } from 'antd';
import type React from 'react';
import type { ReactNode } from 'react';
import { useT } from '@/utils/i18n';
import type { WorkloadKind, WorkloadStorageConfigItem } from '../types';
import { getConfigResourceLabel, getResourceIcon } from './resourceOptions';
import useStyles from './styles';

type StorageActionVariant = 'entry' | 'add';

type StorageActionItem = {
  description: string;
  icon?: ReactNode;
  key: string;
  onSelect: () => void;
  title: string;
  wide?: boolean;
};

type StorageActionGroup = {
  key: string;
  actions: StorageActionItem[];
  match: (item: WorkloadStorageConfigItem) => boolean;
};

/** 添加动作回调：由 StorageSettings 提供，打开对应草稿的编辑弹窗 */
type StorageAddActions = {
  onAddVolumeMount: () => void;
  onAddConfigMount: () => void;
  onAddClaimTemplate: () => void;
};

/** 动作组：StatefulSet 多一组「卷声明模板」；已配置项按 match 分到对应组展示 */
const buildActionGroups = (
  type: WorkloadKind,
  t: ReturnType<typeof useT>,
  actions: StorageAddActions,
): StorageActionGroup[] => [
  {
    key: 'volumeClaimTemplate',
    actions:
      type === 'StatefulSet'
        ? [
            {
              description: t(
                'pages.k8s.forms.workload.storage.volumeClaimTemplate.add.description',
              ),
              icon: <HddOutlined />,
              key: 'volumeClaimTemplate',
              onSelect: actions.onAddClaimTemplate,
              title: t(
                'pages.k8s.forms.workload.storage.volumeClaimTemplate.add',
              ),
              wide: true,
            },
          ]
        : [],
    match: (item: WorkloadStorageConfigItem) =>
      item.storageType === 'volumeClaimTemplate',
  },
  {
    key: 'mounts',
    actions: [
      {
        description: t(
          'pages.k8s.forms.workload.storage.volume.mount.description',
        ),
        icon: <HddOutlined />,
        key: 'volume',
        onSelect: actions.onAddVolumeMount,
        title: t('pages.k8s.forms.workload.storage.volume.mount'),
      },
      {
        description: t(
          'pages.k8s.forms.workload.storage.config.mount.description',
        ),
        icon: <ToolOutlined />,
        key: 'config',
        onSelect: actions.onAddConfigMount,
        title: t('pages.k8s.forms.workload.storage.config.mount'),
      },
    ],
    match: (item: WorkloadStorageConfigItem) =>
      item.storageType !== 'volumeClaimTemplate',
  },
];

const getStorageCardIcon = (item: WorkloadStorageConfigItem) => {
  if (item.storageCategory === 'config') {
    return getResourceIcon(item.configResourceType);
  }
  return item.storageType === 'hostPath' ? <ToolOutlined /> : <HddOutlined />;
};

const getStorageCardFields = (
  item: WorkloadStorageConfigItem,
  t: ReturnType<typeof useT>,
) => {
  if (item.storageType === 'volumeClaimTemplate') {
    return [
      {
        label: t('pages.k8s.forms.common.storageClass'),
        value: item.pvcStorageClassName || '-',
      },
      {
        label: t('pages.k8s.forms.common.capacity'),
        value: `${item.pvcSizeGi || 10}Gi`,
      },
      {
        label: t('pages.k8s.forms.common.accessMode'),
        value: item.pvcAccessModes?.join(', ') || 'ReadWriteOnce',
      },
    ];
  }

  if (item.storageType === 'persistentVolumeClaim') {
    return [
      {
        label: t('pages.k8s.forms.common.storageClass'),
        value: item.claimStorageClassName || '-',
      },
      {
        label: t('pages.k8s.forms.common.capacity'),
        value: item.claimCapacity || '-',
      },
      {
        label: t('pages.k8s.forms.common.accessMode'),
        value: item.claimAccessModes?.join(', ') || '-',
      },
    ];
  }

  if (item.storageType === 'hostPath') {
    return [{ label: 'HostPath', value: item.hostPath || '-' }];
  }

  if (item.storageType === 'configMap' || item.storageType === 'secret') {
    return [
      {
        label: getConfigResourceLabel(item.configResourceType, t),
        value: item.configResourceName || '-',
      },
    ];
  }

  return [
    {
      label: t('pages.k8s.forms.workload.storage.volumeType'),
      value: 'EmptyDir',
    },
  ];
};

const getStorageCardName = (
  item: WorkloadStorageConfigItem,
  t: ReturnType<typeof useT>,
) => {
  if (item.storageType === 'volumeClaimTemplate') {
    return item.pvcNamePrefix || 'volume';
  }
  if (item.storageType === 'persistentVolumeClaim') {
    return item.claimName || 'persistent-volume-claim';
  }
  if (item.storageType === 'configMap' || item.storageType === 'secret') {
    return (
      item.configResourceName ||
      getConfigResourceLabel(item.configResourceType, t)
    );
  }
  return item.volumeName || 'data';
};

const getStorageTypeDescription = (
  item: WorkloadStorageConfigItem,
  t: ReturnType<typeof useT>,
) => {
  if (item.storageType === 'volumeClaimTemplate') {
    return t('pages.k8s.kind.PersistentVolumeClaim');
  }
  if (item.storageType === 'persistentVolumeClaim') {
    return t('pages.k8s.kind.PersistentVolumeClaim');
  }
  if (item.storageType === 'hostPath') {
    return 'HostPath';
  }
  if (item.storageType === 'configMap' || item.storageType === 'secret') {
    return getConfigResourceLabel(item.configResourceType, t);
  }
  return 'EmptyDir';
};

/** 已配置存储的一张卡：类型 / 名称 / 指标 + 挂载明细 + 编辑、删除 */
const StorageCard: React.FC<{
  item: WorkloadStorageConfigItem;
  index: number;
  onEdit: (item: WorkloadStorageConfigItem, index: number) => void;
  onDelete: (index: number) => void;
}> = ({ item, index, onEdit, onDelete }) => {
  const { styles } = useStyles();
  const t = useT();

  const activeMounts = (item.containerMounts || []).filter(
    (mount) => mount.mountMode && mount.mountMode !== 'none' && mount.mountPath,
  );

  return (
    <div className={styles.storageCard}>
      <div className={styles.storageCardMain}>
        <div className={styles.storageCardIcon}>{getStorageCardIcon(item)}</div>
        <div className={styles.storageCardIdentity}>
          <div className={styles.storageCardName}>
            {getStorageCardName(item, t)}
          </div>
          <div className={styles.storageCardDescription}>
            {t('pages.k8s.forms.workload.storage.volumeTypeOf', {
              type: getStorageTypeDescription(item, t),
            })}
          </div>
        </div>
        {getStorageCardFields(item, t).map((field) => (
          <div className={styles.storageCardMetric} key={field.label}>
            {field.value}
            <span>{field.label}</span>
          </div>
        ))}
        <div className={styles.storageCardActions}>
          <Button
            aria-label={t('pages.k8s.forms.workload.storage.delete')}
            icon={<DeleteOutlined />}
            type="text"
            onClick={() => onDelete(index)}
          />
          <Button
            aria-label={t('pages.k8s.forms.workload.storage.edit')}
            icon={<EditOutlined />}
            type="text"
            onClick={() => onEdit(item, index)}
          />
        </div>
      </div>
      {activeMounts.length > 0 && (
        <div style={{ marginBottom: 15 }}>
          <div className={styles.cardMountRows}>
            {activeMounts.map((mount, index) => (
              <div className={styles.cardMountRow} key={mount.id || index}>
                <span className={styles.cardMountContainer}>
                  <DockerOutlined className={styles.containerIcon} />
                  <Typography.Text ellipsis>
                    {mount.containerName || `container-${index + 1}`}
                  </Typography.Text>
                </span>
                <span className={styles.cardMountMeta}>
                  <SettingOutlined />
                  {mount.mountPath}
                  {mount.mountMode === 'readWrite'
                    ? t('pages.k8s.forms.workload.storage.mount.readWrite')
                    : ''}
                  {mount.subPath
                    ? ` ${t('pages.k8s.forms.workload.storage.mount.subPath', { subPath: mount.subPath })}`
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export type { StorageAddActions };

/** 入口：还没有任何存储项时的选择卡 */
const StorageEntry: React.FC<StorageAddActions & { type: WorkloadKind }> = ({
  type,
  ...actions
}) => {
  const { styles } = useStyles();
  const t = useT();
  const groups = buildActionGroups(type, t, actions);
  const [, mountGroup] = groups;

  const renderActionCard = (
    action: StorageActionItem,
    variant: StorageActionVariant,
  ) => {
    const isEntry = variant === 'entry';
    const cardClassName = [
      isEntry ? styles.entryCard : styles.addStorageCard,
      action.wide
        ? isEntry
          ? styles.entryCardWide
          : styles.addStorageCardWide
        : '',
    ].join(' ');

    return (
      <button
        className={cardClassName}
        key={action.key}
        type="button"
        onClick={action.onSelect}
      >
        {isEntry && action.icon && (
          <span className={styles.entryIcon}>{action.icon}</span>
        )}
        {isEntry ? (
          <span className={styles.entryContent}>
            <span className={styles.entryTitle}>{action.title}</span>
            <span className={styles.entryDescription}>
              {action.description}
            </span>
          </span>
        ) : (
          <>
            <span className={styles.addStorageTitle}>{action.title}</span>
            <span className={styles.addStorageDescription}>
              {action.description}
            </span>
          </>
        )}
      </button>
    );
  };

  const renderActionGrid = (
    actionItems: StorageActionItem[],
    variant: StorageActionVariant,
    className: string,
  ) => (
    <div className={className}>
      {actionItems.map((action) => renderActionCard(action, variant))}
    </div>
  );

  if (type === 'StatefulSet') {
    return (
      <div className={styles.statefulStorageSections}>
        {groups.map((group) => (
          <div className={styles.statefulStorageSection} key={group.key}>
            {renderActionGrid(
              group.actions,
              'entry',
              styles.statefulStorageActionGrid,
            )}
          </div>
        ))}
      </div>
    );
  }
  return renderActionGrid(mountGroup.actions, 'entry', styles.entryGrid);
};

/** 已配置存储列表 + 追加卡（StatefulSet 按 match 分组） */
const StorageCardList: React.FC<
  StorageAddActions & {
    type: WorkloadKind;
    items: WorkloadStorageConfigItem[];
    onEdit: (item: WorkloadStorageConfigItem, index: number) => void;
    onDelete: (index: number) => void;
  }
> = ({ type, items, onEdit, onDelete, ...actions }) => {
  const { styles } = useStyles();
  const t = useT();
  const groups = buildActionGroups(type, t, actions);
  const [, mountGroup] = groups;

  const renderActionCard = (
    action: StorageActionItem,
    variant: StorageActionVariant,
  ) => {
    const isEntry = variant === 'entry';
    const cardClassName = [
      isEntry ? styles.entryCard : styles.addStorageCard,
      action.wide
        ? isEntry
          ? styles.entryCardWide
          : styles.addStorageCardWide
        : '',
    ].join(' ');

    return (
      <button
        className={cardClassName}
        key={action.key}
        type="button"
        onClick={action.onSelect}
      >
        {isEntry && action.icon && (
          <span className={styles.entryIcon}>{action.icon}</span>
        )}
        {isEntry ? (
          <span className={styles.entryContent}>
            <span className={styles.entryTitle}>{action.title}</span>
            <span className={styles.entryDescription}>
              {action.description}
            </span>
          </span>
        ) : (
          <>
            <span className={styles.addStorageTitle}>{action.title}</span>
            <span className={styles.addStorageDescription}>
              {action.description}
            </span>
          </>
        )}
      </button>
    );
  };

  const renderActionGrid = (
    actionItems: StorageActionItem[],
    variant: StorageActionVariant,
    className: string,
  ) => (
    <div className={className}>
      {actionItems.map((action) => renderActionCard(action, variant))}
    </div>
  );

  return (
    <div className={styles.storageList}>
      <div className={styles.storageTitle}>
        {t('pages.k8s.forms.common.storage')}
      </div>
      <div className={styles.storageListPanel}>
        {type === 'StatefulSet' ? (
          <div className={styles.statefulStorageSections}>
            {groups.map((group) => (
              <div className={styles.statefulStorageSection} key={group.key}>
                {items
                  .map((item, index) => ({ index, item }))
                  .filter(({ item }) => group.match(item))
                  .map(({ index, item }) => (
                    <StorageCard
                      key={item.id}
                      index={index}
                      item={item}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                {renderActionGrid(
                  group.actions,
                  'add',
                  styles.statefulStorageActionGrid,
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            {items.map((item, index) => (
              <StorageCard
                key={item.id}
                index={index}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {renderActionGrid(mountGroup.actions, 'add', styles.addStorageGrid)}
          </>
        )}
      </div>
    </div>
  );
};

export { StorageCard, StorageCardList, StorageEntry };
