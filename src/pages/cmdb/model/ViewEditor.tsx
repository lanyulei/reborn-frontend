/**
 * 详情布局编辑器（自 ViewDrawer 抽出，内嵌于模型详情页）：
 * 按顺序维护“属性分组 / 关联面板”区块，整体替换保存。
 * 缺省布局（未配置时）由后端 GetModelView 生成；“恢复缺省”在本地按同一规则重建。
 */
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Input,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
} from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  getModel,
  getModelView,
  updateModelView,
  type ViewSection,
} from '@/services/cmdb/model';
import type {
  CmdbField,
  CmdbModel,
  CmdbRelationType,
} from '@/services/cmdb/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { CMDB_ANY_MODEL } from '../components/meta';

/** 适用于本类型的关系方向（与后端 DefaultView 规则一致） */
interface RelationOption {
  key: string;
  relationType: string;
  direction: 'outgoing' | 'incoming';
  label: string;
  targetModel: string;
}

export const relationOptions = (
  modelCode: string,
  types: CmdbRelationType[],
): RelationOption[] => {
  const out: RelationOption[] = [];
  for (const rt of types) {
    if (rt.srcModel === CMDB_ANY_MODEL || rt.srcModel === modelCode) {
      out.push({
        key: `${rt.code}:outgoing`,
        relationType: rt.code,
        direction: 'outgoing',
        label: `${rt.forwardName} (${rt.code})`,
        targetModel: rt.dstModel,
      });
    }
    if (rt.dstModel === CMDB_ANY_MODEL || rt.dstModel === modelCode) {
      out.push({
        key: `${rt.code}:incoming`,
        relationType: rt.code,
        direction: 'incoming',
        label: `${rt.backwardName} (${rt.code})`,
        targetModel: rt.srcModel,
      });
    }
  }
  return out;
};

export const defaultSections = (
  fields: CmdbField[],
  relations: RelationOption[],
): ViewSection[] => [
  {
    type: 'attrs',
    fields: fields.filter((f) => !f.deprecated).map((f) => f.code),
  },
  ...relations.map<ViewSection>((r) => ({
    type: 'relation',
    relationType: r.relationType,
    direction: r.direction,
  })),
];

export const ViewEditor: React.FC<{
  model: CmdbModel;
  fields: CmdbField[];
  relationTypes: CmdbRelationType[];
  /** 保存成功后通知父级（刷新布局相关状态） */
  onChanged?: () => void;
}> = ({ model, fields, relationTypes, onChanged }) => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [sections, setSections] = useState<ViewSection[]>([]);
  // 对端类型字段缓存（关联面板“展示列”选项）
  const [targetFields, setTargetFields] = useState<Record<string, CmdbField[]>>(
    {},
  );
  const relations = useMemo(
    () => relationOptions(model.code, relationTypes),
    [model.code, relationTypes],
  );
  const canEdit = has('cmdb.model.view');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getModelView(model.code)
      .then((view) => {
        if (cancelled) return;
        setSections(view.sections);
        setConfigured(view.configured);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [model.code]);

  // 按需拉取关联面板对端类型的字段
  const neededTargets = useMemo(
    () =>
      Array.from(
        new Set(
          sections
            .filter((s) => s.type === 'relation')
            .map(
              (s) =>
                relations.find(
                  (r) =>
                    r.relationType === s.relationType &&
                    r.direction === s.direction,
                )?.targetModel,
            )
            .filter(
              (code): code is string => !!code && code !== CMDB_ANY_MODEL,
            ),
        ),
      ),
    [sections, relations],
  );
  useEffect(() => {
    const missing = neededTargets.filter((code) => !(code in targetFields));
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(missing.map((code) => getModel(code)))
      .then((details) => {
        if (cancelled) return;
        setTargetFields((prev) => {
          const next = { ...prev };
          details.forEach((d, i) => {
            next[missing[i]] = d.fields;
          });
          return next;
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [neededTargets, targetFields]);

  const fieldOptions = useMemo(
    () =>
      fields
        .filter((f) => !f.deprecated)
        .map((f) => ({ label: `${f.name} (${f.code})`, value: f.code })),
    [fields],
  );

  const patch = (index: number, update: Partial<ViewSection>) =>
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...update } : s)),
    );
  const move = (index: number, delta: -1 | 1) =>
    setSections((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  const remove = (index: number) =>
    setSections((prev) => prev.filter((_, i) => i !== index));

  const onSave = async () => {
    if (sections.length === 0) {
      message.warning(t('pages.cmdb.view.empty'));
      return;
    }
    setSaving(true);
    try {
      await updateModelView(model.code, sections);
      message.success(t('common.msg.saved'));
      setConfigured(true);
      onChanged?.();
    } catch {
      // authRequest 已按后端 message 提示（如引用了未知字段）
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (section: ViewSection, index: number) => {
    const isAttrs = section.type === 'attrs';
    const relation = relations.find(
      (r) =>
        r.relationType === section.relationType &&
        r.direction === section.direction,
    );
    const columnOptions =
      relation && relation.targetModel !== CMDB_ANY_MODEL
        ? (targetFields[relation.targetModel] ?? [])
            .filter((f) => !f.deprecated)
            .map((f) => ({ label: `${f.name} (${f.code})`, value: f.code }))
        : [];
    return (
      <Card
        variant="outlined"
        key={`${section.type}-${index}`}
        size="small"
        title={
          <Space>
            {/* 与同行的小号输入框 / 按钮等高（24px） */}
            <Tag
              color={isAttrs ? 'blue' : 'purple'}
              style={{ height: 24, lineHeight: '22px', marginInlineEnd: 0 }}
            >
              {t(
                isAttrs
                  ? 'pages.cmdb.view.section.attrs'
                  : 'pages.cmdb.view.section.relation',
              )}
            </Tag>
            <Input
              size="small"
              placeholder={t('pages.cmdb.view.section.title')}
              value={section.title}
              maxLength={64}
              style={{ width: 200 }}
              disabled={!canEdit}
              onChange={(e) => patch(index, { title: e.target.value })}
            />
          </Space>
        }
        extra={
          canEdit && (
            <Space size={4}>
              <Button
                type="text"
                size="small"
                icon={<ArrowUpOutlined />}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              />
              <Button
                type="text"
                size="small"
                icon={<ArrowDownOutlined />}
                disabled={index === sections.length - 1}
                onClick={() => move(index, 1)}
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => remove(index)}
              />
            </Space>
          )
        }
      >
        {isAttrs ? (
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder={t('pages.cmdb.view.section.fields')}
            options={fieldOptions}
            value={section.fields ?? []}
            disabled={!canEdit}
            onChange={(value) => patch(index, { fields: value })}
          />
        ) : (
          <Space vertical style={{ width: '100%' }}>
            <Select
              style={{ width: '100%' }}
              placeholder={t('pages.cmdb.view.section.relation.type')}
              options={relations.map((r) => ({
                label: r.label,
                value: r.key,
              }))}
              value={relation?.key}
              disabled={!canEdit}
              onChange={(key) => {
                const next = relations.find((r) => r.key === key);
                if (next) {
                  patch(index, {
                    relationType: next.relationType,
                    direction: next.direction,
                    columns: [],
                  });
                }
              }}
            />
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder={t('pages.cmdb.view.section.columns.placeholder')}
              disabled={
                !canEdit || !relation || relation.targetModel === CMDB_ANY_MODEL
              }
              options={columnOptions}
              value={section.columns ?? []}
              onChange={(value) => patch(index, { columns: value })}
            />
            <Space>
              <Switch
                size="small"
                checked={!!section.collapsed}
                disabled={!canEdit}
                onChange={(checked) => patch(index, { collapsed: checked })}
              />
              {t('pages.cmdb.view.section.collapsed')}
            </Space>
          </Space>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  return (
    <Space vertical size="middle" style={{ width: '100%' }}>
      {!configured && (
        <Alert type="info" showIcon title={t('pages.cmdb.view.default')} />
      )}
      {sections.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.cmdb.view.empty')}
        />
      ) : (
        sections.map(renderSection)
      )}
      {canEdit && (
        <Space>
          <Button
            onClick={() => setSections(defaultSections(fields, relations))}
          >
            {t('pages.cmdb.view.reset')}
          </Button>
          <Button
            onClick={() =>
              setSections((prev) => [...prev, { type: 'attrs', fields: [] }])
            }
          >
            {t('pages.cmdb.view.add.attrs')}
          </Button>
          <Button
            disabled={relations.length === 0}
            onClick={() =>
              setSections((prev) => [
                ...prev,
                {
                  type: 'relation',
                  relationType: relations[0].relationType,
                  direction: relations[0].direction,
                },
              ])
            }
          >
            {t('pages.cmdb.view.add.relation')}
          </Button>
          <Button
            type="primary"
            loading={saving}
            onClick={() => void onSave()}
            style={{ marginInlineStart: 'auto' }}
          >
            {t('common.action.save')}
          </Button>
        </Space>
      )}
    </Space>
  );
};
