import {
  DeleteOutlined,
  DockerOutlined,
  EditOutlined,
  FolderOpenOutlined,
  HddOutlined,
  PlusOutlined,
  SettingOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  Alert,
  App,
  Button,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popover,
  Select,
  Slider,
  Spin,
  Tooltip,
  Typography,
} from 'antd';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GVRS, listNames, listRows } from '../../shared/kube';
import CreatableSelect from '../CreatableSelect';
import { useWizardScope } from '../context';
import { useConfigResourceKeys, useConfigResources } from '../resources';
import type {
  CreateWorkloadContainerValues,
  CreateWorkloadFormValues,
  WorkloadConfigResourceType,
  WorkloadContainerMountItem,
  WorkloadKind,
  WorkloadStorageCategory,
  WorkloadStorageConfigItem,
  WorkloadStorageKeyPathItem,
  WorkloadVolumeType,
} from '../types';
import {
  ABSOLUTE_PATH_PATTERN,
  activateEmptyMounts,
  configResourceTypeOptions,
  createStorageKeyPathItem,
  getAvailableKeys,
  getMountModeOptions,
  isRelativeVolumeItemPath,
  isVolumeItemPath,
  KUBERNETES_NAME_PATTERN,
  normalizeContainerMounts,
  STORAGE_QUANTITY_PATTERN,
  volumeTypeOptions,
} from './helpers';
import type { PvcOption } from './resourceOptions';
import {
  getConfigResourceLabel,
  getPvcMetrics,
  getResourceIcon,
  ResourceOptionContent,
  ResourcePlaceholder,
} from './resourceOptions';
import {
  accessModeOptions,
  createStorageConfigId,
  getInitialStorageDraftValues,
  storageFieldNames,
} from './storageDraft';
import useStyles from './styles';

type StorageSettingsProps = {
  form: FormInstance<CreateWorkloadFormValues>;
  type: WorkloadKind;
};

type SubPathEditorState = {
  index: number;
  value: string;
  error?: string;
};

type StorageActionVariant = 'entry' | 'add';

type StorageActionItem = {
  description: string;
  icon?: ReactNode;
  key: string;
  onSelect: () => void;
  title: string;
  wide?: boolean;
};

const StorageSettings = ({ form, type }: StorageSettingsProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const { clusterId } = useWizardScope();
  const storageSnapshotRef = useRef<Partial<CreateWorkloadFormValues> | null>(
    null,
  );
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [editingStorageIndex, setEditingStorageIndex] = useState<number | null>(
    null,
  );
  const [subPathEditor, setSubPathEditor] = useState<SubPathEditorState | null>(
    null,
  );
  const namespace = Form.useWatch('namespace', {
    form,
    preserve: true,
  });
  const containers =
    (Form.useWatch('containers', {
      form,
      preserve: true,
    }) as CreateWorkloadContainerValues[]) || [];
  const storageCategory = Form.useWatch('storageCategory', {
    form,
    preserve: true,
  });
  const volumeType = Form.useWatch('volumeType', {
    form,
    preserve: true,
  });
  const storageType = Form.useWatch('storageType', {
    form,
    preserve: true,
  });
  const configResourceType = Form.useWatch('configResourceType', {
    form,
    preserve: true,
  });
  const containerMounts =
    (Form.useWatch('containerMounts', {
      form,
      preserve: true,
    }) as WorkloadContainerMountItem[]) || [];
  const storageItems =
    (Form.useWatch('storageItems', {
      form,
      preserve: true,
    }) as WorkloadStorageConfigItem[]) || [];
  const selectSpecificKeys = Form.useWatch('selectSpecificKeys', {
    form,
    preserve: true,
  });
  const specificKeyPaths =
    (Form.useWatch('specificKeyPaths', {
      form,
      preserve: true,
    }) as WorkloadStorageKeyPathItem[]) || [];
  const configResourceName = Form.useWatch('configResourceName', {
    form,
    preserve: true,
  });
  const pvcSizeGi = Form.useWatch('pvcSizeGi', {
    form,
    preserve: true,
  });
  const [pvcs, setPvcs] = useState<PvcOption[]>([]);
  const [storageClasses, setStorageClasses] = useState<string[]>([]);
  const [volumeLoading, setVolumeLoading] = useState(false);
  const {
    configMaps,
    secrets,
    loading: configLoading,
  } = useConfigResources(clusterId, namespace, storageCategory === 'config');
  const { keys: selectedKeys } = useConfigResourceKeys(
    clusterId,
    namespace,
    storageCategory === 'config' ? configResourceType : undefined,
    configResourceName,
  );
  const resourceLoading = volumeLoading || configLoading;

  const selectedConfigResources =
    configResourceType === 'secret' ? secrets : configMaps;

  const pvcOptions = useMemo(
    () =>
      pvcs.map((item) => ({
        label: (
          <ResourceOptionContent
            description={item.storageClassName || '默认存储类'}
            icon={<HddOutlined />}
            metrics={getPvcMetrics(item)}
            title={item.name}
          />
        ),
        searchLabel: item.name,
        value: item.name,
      })),
    [pvcs],
  );

  const storageClassOptions = useMemo(
    () =>
      storageClasses.map((item) => ({
        label: item,
        value: item,
      })),
    [storageClasses],
  );

  const configResourceOptions = useMemo(
    () =>
      selectedConfigResources.map((item) => ({
        label: (
          <ResourceOptionContent
            description={getConfigResourceLabel(configResourceType)}
            icon={getResourceIcon(configResourceType)}
            title={item}
          />
        ),
        searchLabel: item,
        value: item,
      })),
    [configResourceType, selectedConfigResources],
  );

  const normalizeMounts = useCallback(
    (category = storageCategory) =>
      normalizeContainerMounts(
        containers,
        (form.getFieldValue('containerMounts') ||
          []) as WorkloadContainerMountItem[],
        category,
      ),
    [containers, form, storageCategory],
  );

  const updateMounts = useCallback(
    (nextMounts: WorkloadContainerMountItem[]) => {
      form.setFieldValue('containerMounts', nextMounts);
    },
    [form],
  );

  const openSubPathEditor = (index: number) => {
    const mount = form.getFieldValue(['containerMounts', index]);

    setSubPathEditor({
      index,
      value: mount?.subPath || '',
    });
  };

  const cancelSubPathEditor = () => {
    setSubPathEditor(null);
  };

  const confirmSubPathEditor = () => {
    if (!subPathEditor) {
      return;
    }

    const nextValue = subPathEditor.value.trim();

    if (nextValue && !isVolumeItemPath(nextValue)) {
      setSubPathEditor({
        ...subPathEditor,
        error: '请输入绝对路径或相对路径，且不能包含 ..',
      });
      return;
    }

    form.setFieldValue(
      ['containerMounts', subPathEditor.index, 'subPath'],
      nextValue || undefined,
    );
    setSubPathEditor(null);
  };

  const activateMounts = useCallback(
    (category = storageCategory) => {
      updateMounts(activateEmptyMounts(normalizeMounts(category), category));
    },
    [normalizeMounts, storageCategory, updateMounts],
  );

  const getStorageSnapshot = useCallback(() => {
    const snapshot: Partial<CreateWorkloadFormValues> = {};

    storageFieldNames.forEach((fieldName) => {
      snapshot[fieldName] = structuredClone(form.getFieldValue(fieldName));
    });

    return snapshot;
  }, [form]);

  const restoreStorageSnapshot = useCallback(() => {
    const snapshot = storageSnapshotRef.current;

    if (!snapshot) {
      return;
    }

    form.setFieldsValue(snapshot);
    updateMounts(
      (snapshot.containerMounts || []) as WorkloadContainerMountItem[],
    );
    storageSnapshotRef.current = null;
  }, [form, updateMounts]);

  const openStorageModal = useCallback(
    (setupStorage: () => void) => {
      storageSnapshotRef.current = getStorageSnapshot();
      setEditingStorageIndex(null);
      setSubPathEditor(null);
      form.setFieldsValue(getInitialStorageDraftValues());
      setupStorage();
      setStorageModalOpen(true);
    },
    [form, getStorageSnapshot],
  );

  useEffect(() => {
    const normalized = normalizeMounts();
    const currentValue = JSON.stringify(
      containerMounts.map((item) => ({
        containerId: item.containerId,
        containerName: item.containerName,
        id: item.id,
        mountMode: item.mountMode,
        mountPath: item.mountPath,
        subPath: item.subPath,
      })),
    );
    const nextValue = JSON.stringify(
      normalized.map((item) => ({
        containerId: item.containerId,
        containerName: item.containerName,
        id: item.id,
        mountMode: item.mountMode,
        mountPath: item.mountPath,
        subPath: item.subPath,
      })),
    );

    if (currentValue !== nextValue) {
      updateMounts(normalized);
    }
  }, [containerMounts, normalizeMounts, updateMounts]);

  useEffect(() => {
    if (storageItems.length === 0) {
      return;
    }

    const normalizedItems = storageItems.map((item) => ({
      ...item,
      containerMounts: normalizeContainerMounts(
        containers,
        item.containerMounts || [],
        item.storageCategory,
      ),
    }));
    const currentValue = JSON.stringify(
      storageItems.map((item) => item.containerMounts || []),
    );
    const nextValue = JSON.stringify(
      normalizedItems.map((item) => item.containerMounts || []),
    );

    if (currentValue !== nextValue) {
      form.setFieldValue('storageItems', normalizedItems);
    }
  }, [containers, form, storageItems]);

  // 卷相关候选项：持久卷声明（当前命名空间）或存储类（卷声明模板）
  useEffect(() => {
    setPvcs([]);
    setStorageClasses([]);
    if (!namespace || storageCategory !== 'volume') {
      return;
    }

    let cancelled = false;
    setVolumeLoading(true);
    const load =
      storageType === 'volumeClaimTemplate'
        ? listNames(clusterId, GVRS.storageClass).then((names) => {
            if (!cancelled) {
              setStorageClasses(names);
            }
          })
        : listRows(clusterId, GVRS.pvc, namespace).then((rows) => {
            if (!cancelled) {
              setPvcs(
                rows.map((row) => ({
                  name: row.name,
                  capacity:
                    typeof row.cells?.capacity === 'string'
                      ? row.cells.capacity
                      : undefined,
                  accessModes: Array.isArray(row.cells?.accessModes)
                    ? row.cells.accessModes.map(String)
                    : undefined,
                  storageClassName:
                    typeof row.cells?.storageClass === 'string'
                      ? row.cells.storageClass
                      : undefined,
                })),
              );
            }
          });
    load.finally(() => {
      if (!cancelled) {
        setVolumeLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [clusterId, namespace, storageCategory, storageType]);

  useEffect(() => {
    if (
      storageType === 'volumeClaimTemplate' &&
      storageClasses.length > 0 &&
      !form.getFieldValue('pvcStorageClassName')
    ) {
      form.setFieldValue('pvcStorageClassName', storageClasses[0]);
    }
  }, [form, storageClasses, storageType]);

  useEffect(() => {
    if (!selectSpecificKeys) {
      return;
    }

    if (specificKeyPaths.length === 0) {
      form.setFieldValue('specificKeyPaths', [createStorageKeyPathItem()]);
    }
  }, [form, selectSpecificKeys, specificKeyPaths.length]);

  const selectStorageCategory = (
    category: Exclude<WorkloadStorageCategory, 'none'>,
  ) => {
    const nextType =
      category === 'volume' ? 'persistentVolumeClaim' : 'configMap';

    form.setFieldsValue({
      storageCategory: category,
      storageType: nextType,
      volumeType: category === 'volume' ? 'persistentVolumeClaim' : volumeType,
      configResourceType:
        category === 'config' ? 'configMap' : configResourceType,
      configResourceName: undefined,
      claimName: undefined,
      claimStorageClassName: undefined,
      claimCapacity: undefined,
      claimAccessModes: undefined,
      pvcNamePrefix: undefined,
      pvcStorageClassName: undefined,
      pvcAccessModes: ['ReadWriteOnce'],
      pvcSizeGi: 10,
      selectSpecificKeys: false,
      specificKeyPaths: [],
    });
    updateMounts(normalizeMounts(category));
  };

  const resetStorageCategory = () => {
    form.setFieldsValue({
      storageCategory: 'none',
      storageType: 'none',
      volumeType: 'persistentVolumeClaim',
      configResourceType: 'configMap',
      claimName: undefined,
      claimStorageClassName: undefined,
      claimCapacity: undefined,
      claimAccessModes: undefined,
      pvcNamePrefix: undefined,
      pvcStorageClassName: undefined,
      pvcAccessModes: ['ReadWriteOnce'],
      pvcSizeGi: 10,
      configResourceName: undefined,
      selectSpecificKeys: false,
      specificKeyPaths: [],
    });
    updateMounts(normalizeMounts('none'));
  };

  const handleVolumeTypeChange = (nextVolumeType: WorkloadVolumeType) => {
    form.setFieldsValue({
      storageType: nextVolumeType,
      volumeType: nextVolumeType,
      claimName: undefined,
      claimStorageClassName: undefined,
      claimCapacity: undefined,
      claimAccessModes: undefined,
    });

    if (nextVolumeType !== 'persistentVolumeClaim') {
      activateMounts('volume');
    }
  };

  const selectVolumeClaimTemplate = () => {
    form.setFieldsValue({
      storageCategory: 'volume',
      storageType: 'volumeClaimTemplate',
      volumeType: 'persistentVolumeClaim',
      claimName: undefined,
      claimStorageClassName: undefined,
      claimCapacity: undefined,
      claimAccessModes: undefined,
      pvcNamePrefix: form.getFieldValue('pvcNamePrefix') || '',
      pvcStorageClassName: form.getFieldValue('pvcStorageClassName'),
      pvcAccessModes: form.getFieldValue('pvcAccessModes') || ['ReadWriteOnce'],
      pvcSizeGi: form.getFieldValue('pvcSizeGi') || 10,
      selectSpecificKeys: false,
      specificKeyPaths: [],
    });
    activateMounts('volume');
  };

  const handleConfigResourceTypeChange = (
    nextResourceType: WorkloadConfigResourceType,
  ) => {
    form.setFieldsValue({
      configResourceName: undefined,
      configResourceType: nextResourceType,
      selectSpecificKeys: false,
      specificKeyPaths: [],
      storageType: nextResourceType,
    });
    activateMounts('config');
  };

  const addSpecificKeyPath = () => {
    const hasIncompleteItem = specificKeyPaths.some(
      (item) => !item.keyName || !item.path?.trim(),
    );

    if (
      hasIncompleteItem ||
      (selectedKeys.length > 0 &&
        specificKeyPaths.length >= selectedKeys.length)
    ) {
      return;
    }

    form.setFieldValue('specificKeyPaths', [
      ...specificKeyPaths,
      createStorageKeyPathItem(),
    ]);
  };

  const removeSpecificKeyPath = (index: number) => {
    form.setFieldValue(
      'specificKeyPaths',
      specificKeyPaths.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const cancelStorageModal = () => {
    restoreStorageSnapshot();
    setEditingStorageIndex(null);
    setSubPathEditor(null);
    setStorageModalOpen(false);
  };

  const validateContainerMountFields = async () => {
    const mounts =
      (form.getFieldValue('containerMounts') as WorkloadContainerMountItem[]) ||
      [];
    const fieldErrors = mounts.flatMap((mount, index) => {
      const mountMode = mount.mountMode || 'none';

      if (mountMode === 'none') {
        return [
          {
            errors: [],
            name: ['containerMounts', index, 'mountPath'],
          },
          {
            errors: [],
            name: ['containerMounts', index, 'subPath'],
          },
        ];
      }

      const mountPath = mount.mountPath?.trim();
      const subPath = mount.subPath?.trim();
      const errors: { errors: string[]; name: (number | string)[] }[] = [];

      if (!mountPath) {
        errors.push({
          errors: ['请输入挂载路径'],
          name: ['containerMounts', index, 'mountPath'],
        });
      } else if (!ABSOLUTE_PATH_PATTERN.test(mountPath)) {
        errors.push({
          errors: ['请输入以 / 开头的绝对路径'],
          name: ['containerMounts', index, 'mountPath'],
        });
      } else {
        errors.push({
          errors: [],
          name: ['containerMounts', index, 'mountPath'],
        });
      }

      if (subPath && !isVolumeItemPath(subPath)) {
        errors.push({
          errors: ['请输入绝对路径或相对路径，且不能包含 ..'],
          name: ['containerMounts', index, 'subPath'],
        });
      } else {
        errors.push({
          errors: [],
          name: ['containerMounts', index, 'subPath'],
        });
      }

      return errors;
    });
    const hasErrors = fieldErrors.some((field) => field.errors.length > 0);

    if (!hasErrors) {
      form.setFields(fieldErrors as Parameters<typeof form.setFields>[0]);
      return;
    }

    form.setFields(fieldErrors as Parameters<typeof form.setFields>[0]);
    message.warning('请完善挂载路径设置');
    throw new Error('请完善挂载路径设置');
  };

  const confirmStorageModal = async () => {
    try {
      await form.validateFields(storageFieldNames);
      await validateContainerMountFields();
    } catch {
      // 校验未通过：字段已就地标红（挂载路径另有提示），停在弹窗里
      return;
    }
    const selectedPvc = pvcs.find(
      (item) => item.name === form.getFieldValue('claimName'),
    );
    const nextItem: WorkloadStorageConfigItem = {
      id:
        editingStorageIndex === null
          ? createStorageConfigId()
          : storageItems[editingStorageIndex]?.id || createStorageConfigId(),
      storageCategory,
      storageType,
      volumeType,
      configResourceType,
      volumeName: form.getFieldValue('volumeName'),
      emptyDirSizeLimit: form.getFieldValue('emptyDirSizeLimit'),
      hostPath: form.getFieldValue('hostPath'),
      claimName: form.getFieldValue('claimName'),
      claimStorageClassName: selectedPvc?.storageClassName,
      claimCapacity: selectedPvc?.capacity,
      claimAccessModes: selectedPvc?.accessModes,
      pvcNamePrefix: form.getFieldValue('pvcNamePrefix'),
      pvcStorageClassName: form.getFieldValue('pvcStorageClassName'),
      pvcAccessModes: form.getFieldValue('pvcAccessModes'),
      pvcSizeGi: form.getFieldValue('pvcSizeGi'),
      configResourceName: form.getFieldValue('configResourceName'),
      containerMounts: form.getFieldValue('containerMounts'),
      selectSpecificKeys: form.getFieldValue('selectSpecificKeys'),
      specificKeyPaths: form.getFieldValue('specificKeyPaths'),
    };
    const nextItems = [...storageItems];

    if (editingStorageIndex === null) {
      nextItems.push(nextItem);
    } else {
      nextItems[editingStorageIndex] = nextItem;
    }

    form.setFieldValue('storageItems', nextItems);
    storageSnapshotRef.current = null;
    setEditingStorageIndex(null);
    setSubPathEditor(null);
    resetStorageCategory();
    setStorageModalOpen(false);
  };

  const editStorageConfig = (
    item: WorkloadStorageConfigItem,
    index: number,
  ) => {
    storageSnapshotRef.current = getStorageSnapshot();
    setEditingStorageIndex(index);
    form.setFieldsValue({
      storageCategory: item.storageCategory,
      storageType: item.storageType,
      volumeType: item.volumeType,
      configResourceType: item.configResourceType,
      volumeName: item.volumeName,
      emptyDirSizeLimit: item.emptyDirSizeLimit,
      hostPath: item.hostPath,
      claimName: item.claimName,
      claimStorageClassName: item.claimStorageClassName,
      claimCapacity: item.claimCapacity,
      claimAccessModes: item.claimAccessModes,
      pvcNamePrefix: item.pvcNamePrefix,
      pvcStorageClassName: item.pvcStorageClassName,
      pvcAccessModes: item.pvcAccessModes,
      pvcSizeGi: item.pvcSizeGi,
      configResourceName: item.configResourceName,
      containerMounts: item.containerMounts,
      selectSpecificKeys: item.selectSpecificKeys,
      specificKeyPaths: item.specificKeyPaths,
    });
    setSubPathEditor(null);
    setStorageModalOpen(true);
  };

  const deleteStorageConfig = (index: number) => {
    form.setFieldValue(
      'storageItems',
      storageItems.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const volumeClaimTemplateActionGroup = {
    key: 'volumeClaimTemplate',
    actions:
      type === 'StatefulSet'
        ? [
            {
              description:
                '添加持久卷声明模板为有状态副本集的每个容器组挂载一个持久卷',
              icon: <HddOutlined />,
              key: 'volumeClaimTemplate',
              onSelect: () => openStorageModal(selectVolumeClaimTemplate),
              title: '添加持久卷声明模板',
              wide: true,
            },
          ]
        : [],
    match: (item: WorkloadStorageConfigItem) =>
      item.storageType === 'volumeClaimTemplate',
  };

  const mountStorageActionGroup = {
    key: 'mounts',
    actions: [
      {
        description: '为容器挂载持久卷、临时卷或 HostPath 卷',
        icon: <HddOutlined />,
        key: 'volume',
        onSelect: () => openStorageModal(() => selectStorageCategory('volume')),
        title: '挂载卷',
      },
      {
        description: '为容器挂载配置字典或保密字典',
        icon: <ToolOutlined />,
        key: 'config',
        onSelect: () => openStorageModal(() => selectStorageCategory('config')),
        title: '挂载配置字典或保密字典',
      },
    ],
    match: (item: WorkloadStorageConfigItem) =>
      item.storageType !== 'volumeClaimTemplate',
  };

  const storageActionGroups = [
    volumeClaimTemplateActionGroup,
    mountStorageActionGroup,
  ];

  const renderStorageActionCard = (
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

  const renderStorageActionGrid = (
    actions: StorageActionItem[],
    variant: StorageActionVariant,
    className: string,
  ) => (
    <div className={className}>
      {actions.map((action) => renderStorageActionCard(action, variant))}
    </div>
  );

  const renderStatefulStorageActionSections = (
    variant: StorageActionVariant,
  ) => (
    <div className={styles.statefulStorageSections}>
      {storageActionGroups.map((group) => (
        <div className={styles.statefulStorageSection} key={group.key}>
          {renderStorageActionGrid(
            group.actions,
            variant,
            styles.statefulStorageActionGrid,
          )}
        </div>
      ))}
    </div>
  );

  const renderEntry = () =>
    type === 'StatefulSet'
      ? renderStatefulStorageActionSections('entry')
      : renderStorageActionGrid(
          mountStorageActionGroup.actions,
          'entry',
          styles.entryGrid,
        );

  const renderAddStorageActions = () =>
    type === 'StatefulSet'
      ? renderStatefulStorageActionSections('add')
      : renderStorageActionGrid(
          mountStorageActionGroup.actions,
          'add',
          styles.addStorageGrid,
        );

  const renderPvcSelector = () => (
    <div className={styles.resourceSelector}>
      <Form.Item
        className={styles.resourceItem}
        name="claimName"
        rules={[{ required: true, message: '请选择持久卷声明' }]}
      >
        <Select
          className={styles.resourceSelect}
          classNames={{
            content: styles.resourceSelectContent,
            placeholder: styles.resourceSelectContent,
          }}
          loading={resourceLoading}
          notFoundContent={
            resourceLoading ? <Spin size="small" /> : '未发现可用资源'
          }
          options={pvcOptions}
          placeholder={
            <ResourcePlaceholder
              description="将根据持久卷声明创建的持久卷挂载到容器"
              icon={<HddOutlined />}
              title={pvcs.length > 0 ? '选择持久卷声明' : '未发现可用资源'}
            />
          }
          showSearch={{ optionFilterProp: 'searchLabel' }}
          onChange={() => activateMounts('volume')}
        />
      </Form.Item>
    </div>
  );

  const renderConfigResourceSelector = () => {
    const resourceLabel = getConfigResourceLabel(configResourceType);

    return (
      <div className={styles.resourceSelector}>
        <Form.Item
          className={styles.resourceItem}
          name="configResourceName"
          rules={[{ required: true, message: `请选择${resourceLabel}。` }]}
        >
          <Select
            className={styles.resourceSelect}
            classNames={{
              content: styles.resourceSelectContent,
              placeholder: styles.resourceSelectContent,
            }}
            loading={resourceLoading}
            notFoundContent={
              resourceLoading ? <Spin size="small" /> : '未发现可用资源'
            }
            options={configResourceOptions}
            placeholder={
              <ResourcePlaceholder
                description={`将${resourceLabel}挂载到容器。`}
                icon={getResourceIcon(configResourceType)}
                title={
                  selectedConfigResources.length > 0
                    ? `选择${resourceLabel}`
                    : '未发现可用资源'
                }
              />
            }
            showSearch={{ optionFilterProp: 'searchLabel' }}
            onChange={() => {
              form.setFieldValue('specificKeyPaths', []);
              activateMounts('config');
            }}
          />
        </Form.Item>
      </div>
    );
  };

  const renderVolumeFields = () => {
    if (storageType === 'volumeClaimTemplate') {
      return null;
    }

    if (volumeType === 'persistentVolumeClaim') {
      return renderPvcSelector();
    }

    if (volumeType === 'hostPath') {
      return (
        <>
          <Alert
            className={styles.info}
            title="使用 HostPath 卷将主机文件系统中的文件或目录挂载到容器中。"
            showIcon={false}
            type="info"
          />
          <div className={styles.formGrid}>
            <Form.Item
              label="卷名称"
              name="volumeName"
              rules={[
                { required: true, message: '请输入卷名称' },
                { max: 63, message: '卷名称最长 63 个字符' },
                {
                  pattern: KUBERNETES_NAME_PATTERN,
                  message:
                    '卷名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
                },
              ]}
            >
              <Input placeholder="请输入卷名称" />
            </Form.Item>
            <Form.Item
              label="主机路径"
              name="hostPath"
              rules={[
                { required: true, message: '请输入主机路径' },
                {
                  pattern: ABSOLUTE_PATH_PATTERN,
                  message: '请输入以 / 开头的绝对路径',
                },
              ]}
            >
              <Input placeholder="请输入主机路径" />
            </Form.Item>
          </div>
        </>
      );
    }

    return (
      <div className={styles.formGrid}>
        <Form.Item
          label="卷名称"
          name="volumeName"
          rules={[
            { required: true, message: '请输入卷名称' },
            { max: 63, message: '卷名称最长 63 个字符' },
            {
              pattern: KUBERNETES_NAME_PATTERN,
              message:
                '卷名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
            },
          ]}
        >
          <Input placeholder="请输入卷名称" />
        </Form.Item>
        <Form.Item
          label="容量上限"
          name="emptyDirSizeLimit"
          rules={[
            { required: true, message: '请输入容量上限' },
            {
              pattern: STORAGE_QUANTITY_PATTERN,
              message: '请输入合法的容量，例如 200Mi 或 2Gi',
            },
          ]}
          tooltip="设置当前存储卷的容量上限，默认值为 200Mi，最大值不能超过 2Gi"
        >
          <Input placeholder="例如 200Mi 或 2Gi" />
        </Form.Item>
      </div>
    );
  };

  const renderVolumeClaimTemplateFields = () => (
    <div className={styles.templatePanel}>
      <div className={styles.templateFormGrid}>
        <Form.Item
          className={styles.templateField}
          tooltip="持久卷声明名称的前缀。前缀只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 253 个字符"
          label="PVC 名称前缀"
          name="pvcNamePrefix"
          rules={[
            { required: true, message: '请输入 PVC 名称前缀' },
            { max: 253, message: 'PVC 名称前缀最长 253 个字符' },
            {
              pattern: KUBERNETES_NAME_PATTERN,
              message:
                'PVC 名称前缀只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
            },
          ]}
        >
          <Input placeholder="请输入 PVC 名称前缀" />
        </Form.Item>
        <Form.Item
          className={styles.templateField}
          tooltip="选择一个存储类来创建特定种类的卷"
          label="存储类"
          name="pvcStorageClassName"
          rules={[{ required: true, message: '请选择存储类' }]}
        >
          <Select
            allowClear
            loading={resourceLoading}
            notFoundContent={
              resourceLoading ? <Spin size="small" /> : '未发现可用存储类'
            }
            options={storageClassOptions}
            placeholder="请选择存储类"
            showSearch
          />
        </Form.Item>
        <Form.Item
          className={styles.templateField}
          tooltip="选择存储类支持的一种或多种访问模式"
          label="访问模式"
          name="pvcAccessModes"
          rules={[{ required: true, message: '请选择访问模式' }]}
        >
          <Select
            mode="multiple"
            options={accessModeOptions}
            placeholder="请选择访问模式"
          />
        </Form.Item>
        <Form.Item className={styles.capacityFormItem} label="卷容量" required>
          <div className={styles.capacityRow}>
            <Slider
              className={styles.capacitySlider}
              marks={{
                0: '0',
                512: '512Gi',
                1024: '1024Gi',
                1536: '1536Gi',
                2048: '2048Gi',
              }}
              max={2048}
              min={0}
              value={pvcSizeGi ?? 10}
              onChange={(value) =>
                form.setFieldValue('pvcSizeGi', Math.max(value, 1))
              }
            />
            <InputNumber
              className={styles.capacityInput}
              controls={false}
              max={2048}
              min={1}
              placeholder="请输入卷容量"
              suffix="Gi"
              value={pvcSizeGi ?? 10}
              onChange={(value) => form.setFieldValue('pvcSizeGi', value || 1)}
            />
          </div>
        </Form.Item>
      </div>
    </div>
  );

  const renderSubPathEditor = () => (
    <div className={styles.subPathEditor}>
      <div className={styles.subPathHeader}>
        <div className={styles.subPathTitle}>指定子路径</div>
        <div className={styles.subPathDescription}>
          指定需要挂载到容器的卷子路径。
        </div>
      </div>
      <Input
        autoFocus
        placeholder="子路径"
        prefix={<FolderOpenOutlined />}
        status={subPathEditor?.error ? 'error' : undefined}
        value={subPathEditor?.value}
        onChange={(event) =>
          setSubPathEditor((current) =>
            current
              ? {
                  ...current,
                  error: undefined,
                  value: event.target.value,
                }
              : current,
          )
        }
        onPressEnter={confirmSubPathEditor}
      />
      {subPathEditor?.error && (
        <div className={styles.subPathError}>{subPathEditor.error}</div>
      )}
      <div className={styles.subPathFooter}>
        <Button onClick={cancelSubPathEditor}>取消</Button>
        <Button type="primary" onClick={confirmSubPathEditor}>
          确定
        </Button>
      </div>
    </div>
  );

  const renderContainerMountRows = () => {
    if (containers.length === 0) {
      return (
        <Empty
          className={styles.empty}
          description="请先添加容器"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <div className={styles.mountRows}>
        {containerMounts.map((item, index) => {
          const mountMode = item.mountMode || 'none';
          const disabled = mountMode === 'none';
          const mountPath = item.mountPath?.trim();
          const subPath = item.subPath?.trim();
          const subPathDisabled = disabled || !mountPath;

          return (
            <div className={styles.mountRow} key={item.id}>
              <div className={styles.containerIdentity}>
                <DockerOutlined className={styles.containerIcon} />
                <Typography.Text ellipsis>
                  {item.containerName || `container-${index + 1}`}
                </Typography.Text>
              </div>
              <Form.Item name={['containerMounts', index, 'mountMode']}>
                <Select
                  className={styles.mountControl}
                  options={getMountModeOptions(storageCategory)}
                  placeholder="请选择挂载方式"
                />
              </Form.Item>
              <Form.Item
                name={['containerMounts', index, 'mountPath']}
                dependencies={[['containerMounts', index, 'mountMode']]}
                rules={
                  disabled
                    ? []
                    : [
                        { required: true, message: '请输入挂载路径' },
                        {
                          pattern: ABSOLUTE_PATH_PATTERN,
                          message: '请输入以 / 开头的绝对路径',
                        },
                      ]
                }
              >
                <Input
                  className={styles.mountControl}
                  disabled={disabled}
                  placeholder="挂载路径"
                  prefix={<SettingOutlined />}
                  suffix={
                    <Popover
                      arrow
                      content={renderSubPathEditor()}
                      open={subPathEditor?.index === index}
                      placement="topRight"
                      trigger="click"
                      onOpenChange={(open) => {
                        if (open) {
                          openSubPathEditor(index);
                          return;
                        }
                        cancelSubPathEditor();
                      }}
                    >
                      <Tooltip title="指定子路径">
                        <Button
                          aria-label="指定子路径"
                          className={[
                            styles.subPathTrigger,
                            subPath ? styles.subPathTriggerActive : '',
                          ].join(' ')}
                          disabled={subPathDisabled}
                          icon={<FolderOpenOutlined />}
                          size="small"
                          type="text"
                        />
                      </Tooltip>
                    </Popover>
                  }
                />
              </Form.Item>
              <Form.Item
                hidden
                name={['containerMounts', index, 'subPath']}
                rules={[
                  {
                    validator: (_, value) =>
                      !value || isVolumeItemPath(value)
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              '请输入绝对路径或相对路径，且不能包含 ..',
                            ),
                          ),
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSpecificKeyPaths = () => {
    if (!selectSpecificKeys) {
      return null;
    }

    // 键读不到（无权限等）时不限制数量，键名可直接输入
    const addDisabled =
      (selectedKeys.length > 0 &&
        specificKeyPaths.length >= selectedKeys.length) ||
      specificKeyPaths.some((item) => !item.keyName || !item.path?.trim());

    return (
      <div className={styles.keyRows}>
        <div className={styles.keyEditor}>
          {specificKeyPaths.map((item, index) => (
            <div className={styles.keyRow} key={item.id}>
              <Form.Item
                name={['specificKeyPaths', index, 'keyName']}
                rules={[{ required: true, message: '请选择键' }]}
              >
                <CreatableSelect
                  items={getAvailableKeys(
                    selectedKeys,
                    specificKeyPaths,
                    item.keyName,
                  )}
                  placeholder="键"
                />
              </Form.Item>
              <Form.Item
                className={styles.keyValueField}
                name={['specificKeyPaths', index, 'path']}
                rules={[
                  { required: true, message: '请输入路径' },
                  {
                    validator: (_, value) =>
                      isRelativeVolumeItemPath(value)
                        ? Promise.resolve()
                        : Promise.reject(new Error('请使用相对路径。')),
                  },
                ]}
              >
                <Input placeholder="相对路径" />
              </Form.Item>
              <Button
                aria-label="删除键映射"
                className={styles.deleteButton}
                icon={<DeleteOutlined />}
                type="text"
                onClick={() => removeSpecificKeyPath(index)}
              />
            </div>
          ))}
        </div>
        <div className={styles.keyFooter}>
          <Button disabled={addDisabled} onClick={addSpecificKeyPath}>
            <PlusOutlined />
            添加
          </Button>
        </div>
      </div>
    );
  };

  const renderSpecificKeySelector = () => {
    if (storageCategory !== 'config') {
      return null;
    }

    return (
      <div className={styles.specificPanel}>
        <div className={styles.specificHeader}>
          <Form.Item name="selectSpecificKeys" valuePropName="checked">
            <Checkbox />
          </Form.Item>
          <div>
            <div className={styles.specificText}>选择特定键</div>
            <div className={styles.specificDescription}>
              选择需要挂载到容器的特定键
            </div>
          </div>
        </div>
        {renderSpecificKeyPaths()}
      </div>
    );
  };

  const renderVolumeTypeTabs = () => (
    <div className={styles.typeTabs}>
      {volumeTypeOptions.map((option) => (
        <button
          aria-pressed={option.value === volumeType}
          className={[
            styles.typeTab,
            option.value === volumeType ? styles.typeTabActive : '',
          ].join(' ')}
          key={option.value}
          type="button"
          onClick={() => handleVolumeTypeChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const renderConfigResourceTypeTabs = () => (
    <div className={styles.typeTabs}>
      {configResourceTypeOptions.map((option) => (
        <button
          aria-pressed={option.value === configResourceType}
          className={[
            styles.typeTab,
            option.value === configResourceType ? styles.typeTabActive : '',
          ].join(' ')}
          key={option.value}
          type="button"
          onClick={() => handleConfigResourceTypeChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const renderSelectedStorage = () => (
    <>
      {storageType !== 'volumeClaimTemplate' &&
        (storageCategory === 'volume'
          ? renderVolumeTypeTabs()
          : renderConfigResourceTypeTabs())}
      <div className={styles.panel}>
        {storageType === 'volumeClaimTemplate'
          ? renderVolumeClaimTemplateFields()
          : storageCategory === 'volume'
            ? renderVolumeFields()
            : renderConfigResourceSelector()}
        {renderContainerMountRows()}
        {renderSpecificKeySelector()}
      </div>
    </>
  );

  const getConfiguredStorageTitle = (item?: WorkloadStorageConfigItem) => {
    const currentStorageType = item?.storageType || storageType;
    const currentStorageCategory = item?.storageCategory || storageCategory;

    if (currentStorageType === 'volumeClaimTemplate') {
      return '持久卷声明模板';
    }
    if (currentStorageCategory === 'volume') {
      return '挂载卷';
    }
    return '挂载配置字典或保密字典';
  };

  const getStorageCardIcon = (item: WorkloadStorageConfigItem) => {
    if (item.storageCategory === 'config') {
      return getResourceIcon(item.configResourceType);
    }
    return item.storageType === 'hostPath' ? <ToolOutlined /> : <HddOutlined />;
  };

  const getStorageCardFields = (item: WorkloadStorageConfigItem) => {
    if (item.storageType === 'volumeClaimTemplate') {
      return [
        {
          label: '存储类',
          value: item.pvcStorageClassName || '-',
        },
        {
          label: '容量',
          value: `${item.pvcSizeGi || 10}Gi`,
        },
        {
          label: '访问模式',
          value: item.pvcAccessModes?.join(', ') || 'ReadWriteOnce',
        },
      ];
    }

    if (item.storageType === 'persistentVolumeClaim') {
      return [
        {
          label: '存储类',
          value: item.claimStorageClassName || '-',
        },
        {
          label: '容量',
          value: item.claimCapacity || '-',
        },
        {
          label: '访问模式',
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
          label: getConfigResourceLabel(item.configResourceType),
          value: item.configResourceName || '-',
        },
      ];
    }

    return [{ label: '卷类型', value: 'EmptyDir' }];
  };

  const getStorageCardName = (item: WorkloadStorageConfigItem) => {
    if (item.storageType === 'volumeClaimTemplate') {
      return item.pvcNamePrefix || 'volume';
    }
    if (item.storageType === 'persistentVolumeClaim') {
      return item.claimName || 'persistent-volume-claim';
    }
    if (item.storageType === 'configMap' || item.storageType === 'secret') {
      return (
        item.configResourceName ||
        getConfigResourceLabel(item.configResourceType)
      );
    }
    return item.volumeName || 'data';
  };

  const getStorageTypeDescription = (item: WorkloadStorageConfigItem) => {
    if (item.storageType === 'volumeClaimTemplate') {
      return '持久卷声明';
    }
    if (item.storageType === 'persistentVolumeClaim') {
      return '持久卷声明';
    }
    if (item.storageType === 'hostPath') {
      return 'HostPath';
    }
    if (item.storageType === 'configMap' || item.storageType === 'secret') {
      return getConfigResourceLabel(item.configResourceType);
    }
    return 'EmptyDir';
  };

  const renderStorageMounts = (item: WorkloadStorageConfigItem) => {
    const activeMounts = (item.containerMounts || []).filter(
      (mount) =>
        mount.mountMode && mount.mountMode !== 'none' && mount.mountPath,
    );

    if (activeMounts.length === 0) {
      return null;
    }

    return (
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
              {mount.mountMode === 'readWrite' ? '（读写）' : ''}
              {mount.subPath ? ` · 子路径：${mount.subPath}` : ''}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderStorageCard = (
    item: WorkloadStorageConfigItem,
    index: number,
  ) => (
    <div className={styles.storageCard} key={item.id}>
      <div className={styles.storageCardMain}>
        <div className={styles.storageCardIcon}>{getStorageCardIcon(item)}</div>
        <div className={styles.storageCardIdentity}>
          <div className={styles.storageCardName}>
            {getStorageCardName(item)}
          </div>
          <div className={styles.storageCardDescription}>
            卷类型： {getStorageTypeDescription(item)}
          </div>
        </div>
        {getStorageCardFields(item).map((field) => (
          <div className={styles.storageCardMetric} key={field.label}>
            {field.value}
            <span>{field.label}</span>
          </div>
        ))}
        <div className={styles.storageCardActions}>
          <Button
            aria-label="删除存储配置"
            icon={<DeleteOutlined />}
            type="text"
            onClick={() => deleteStorageConfig(index)}
          />
          <Button
            aria-label="编辑存储配置"
            icon={<EditOutlined />}
            type="text"
            onClick={() => editStorageConfig(item, index)}
          />
        </div>
      </div>
      <div style={{ marginBottom: 15 }}>{renderStorageMounts(item)}</div>
    </div>
  );

  const renderStatefulSetConfiguredStorage = () => {
    const indexedStorageItems = storageItems.map((item, index) => ({
      index,
      item,
    }));

    return (
      <div className={styles.statefulStorageSections}>
        {storageActionGroups.map((group) => (
          <div className={styles.statefulStorageSection} key={group.key}>
            {indexedStorageItems
              .filter(({ item }) => group.match(item))
              .map(({ index, item }) => renderStorageCard(item, index))}
            {renderStorageActionGrid(
              group.actions,
              'add',
              styles.statefulStorageActionGrid,
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderConfiguredStorage = () => (
    <div className={styles.storageList}>
      <div className={styles.storageTitle}>存储设置</div>
      <div className={styles.storageListPanel}>
        {type === 'StatefulSet' ? (
          renderStatefulSetConfiguredStorage()
        ) : (
          <>
            {storageItems.map(renderStorageCard)}
            {renderAddStorageActions()}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {storageItems.length === 0 ? (
        <>
          <div className={styles.storageTitle}>存储设置</div>
          {renderEntry()}
        </>
      ) : (
        renderConfiguredStorage()
      )}
      <Modal
        destroyOnHidden
        keyboard={false}
        mask={{ closable: false }}
        open={storageModalOpen}
        title={getConfiguredStorageTitle()}
        width={900}
        onCancel={cancelStorageModal}
        onOk={confirmStorageModal}
      >
        {storageCategory &&
          storageCategory !== 'none' &&
          renderSelectedStorage()}
      </Modal>
    </div>
  );
};

export default StorageSettings;
