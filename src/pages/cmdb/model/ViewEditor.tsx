/**
 * 详情布局编辑器（自 ViewDrawer 抽出，内嵌于模型详情页）：
 * 分两段维护“属性分组”（对应资源详情的属性页签与表单）和“关联面板”（对应关联页签），
 * 各自段内排序；保存时按“属性分组在前、关联面板在后”整体替换。
 * 缺省布局（未配置时）由后端 GetModelView 生成；“恢复缺省”在本地按同一规则重建。
 */
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
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
  Typography,
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
import { useCmdbStyles } from '../components/styles';

/** 属性分组在前、关联面板在后（各自保持原有顺序）：两类在资源详情里分属不同页签，互相的先后无意义 */
const normalize = (sections: ViewSection[]): ViewSection[] => [
  ...sections.filter((s) => s.type === 'attrs'),
  ...sections.filter((s) => s.type !== 'attrs'),
];

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
  /**
   * 父级当前布局的签名：在「模型字段」页增删改分组后变化，编辑器据此重新拉取，
   * 避免拿着旧布局保存、覆盖掉那边的分组改动。
   */
  sectionsKey?: string;
  /** 保存成功后通知父级（刷新布局相关状态） */
  onChanged?: () => void;
}> = ({ model, fields, relationTypes, sectionsKey, onChanged }) => {
  const t = useT();
  const has = usePermissions();
  const { styles: pageStyles } = useCmdbStyles();
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
        setSections(normalize(view.sections));
        setConfigured(view.configured);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // sectionsKey 仅作重新拉取的触发器
  }, [model.code, sectionsKey]);

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
  /** 段内移动：只与相邻的同类型区块交换（两类各自连续，见 normalize） */
  const move = (index: number, delta: -1 | 1) =>
    setSections((prev) => {
      const target = index + delta;
      if (prev[target]?.type !== prev[index].type) return prev;
      const next = [...prev];
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
        // 头部与页面其它工具栏同规格：默认尺寸控件（32px）+ 12px 16px 内边距；内容区同为 16px
        styles={{
          header: { minHeight: 56, padding: '12px 16px' },
          body: { padding: 16 },
        }}
        title={
          <Input
            placeholder={t('pages.cmdb.view.section.title')}
            value={section.title}
            maxLength={64}
            style={{ width: 280 }}
            disabled={!canEdit}
            onChange={(e) => patch(index, { title: e.target.value })}
          />
        }
        extra={
          canEdit && (
            <Space size={4}>
              <Button
                type="text"
                icon={<ArrowUpOutlined />}
                disabled={sections[index - 1]?.type !== section.type}
                onClick={() => move(index, -1)}
              />
              <Button
                type="text"
                icon={<ArrowDownOutlined />}
                disabled={sections[index + 1]?.type !== section.type}
                onClick={() => move(index, 1)}
              />
              <Button
                type="text"
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

  /** 一段：小节标题 + 数量 + 说明（影响资源详情的哪一处）+ 添加按钮，下接该类型的区块 */
  const renderGroup = (
    type: ViewSection['type'],
    hint: string,
    emptyText: string,
    addButton: React.ReactNode,
  ) => {
    const items = sections
      .map((section, index) => ({ section, index }))
      .filter((x) => x.section.type === type);
    return (
      <div>
        <div className={pageStyles.toolbar} style={{ marginBottom: 8 }}>
          <div className={pageStyles.sectionTitle} style={{ margin: 0 }}>
            {t(
              type === 'attrs'
                ? 'pages.cmdb.view.section.attrs'
                : 'pages.cmdb.view.section.relation',
            )}
          </div>
          <span className={pageStyles.groupCount}>( {items.length} )</span>
          <Typography.Text type="secondary">{hint}</Typography.Text>
          <span className={pageStyles.spacer} />
          {canEdit && addButton}
        </div>
        {items.length === 0 ? (
          <Card variant="outlined" styles={{ body: { padding: 16 } }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={emptyText}
            />
          </Card>
        ) : (
          <Space vertical size="middle" style={{ width: '100%' }}>
            {items.map(({ section, index }) => renderSection(section, index))}
          </Space>
        )}
      </div>
    );
  };

  return (
    <Space vertical size={18} style={{ width: '100%' }}>
      {!configured && (
        <Alert type="info" showIcon title={t('pages.cmdb.view.default')} />
      )}
      {renderGroup(
        'attrs',
        t('pages.cmdb.view.attrs.hint'),
        t('pages.cmdb.view.attrs.empty'),
        <Button
          icon={<PlusOutlined />}
          onClick={() =>
            // 插在最后一个属性分组之后（关联面板之前）
            setSections((prev) =>
              normalize([...prev, { type: 'attrs', fields: [] }]),
            )
          }
        >
          {t('pages.cmdb.view.add.attrs')}
        </Button>,
      )}
      {renderGroup(
        'relation',
        t('pages.cmdb.view.relation.hint'),
        t('pages.cmdb.view.relation.empty'),
        <Button
          icon={<PlusOutlined />}
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
        </Button>,
      )}
      {canEdit && (
        <div className={pageStyles.toolbar} style={{ marginBottom: 0 }}>
          <Button
            onClick={() => setSections(defaultSections(fields, relations))}
          >
            {t('pages.cmdb.view.reset')}
          </Button>
          <span className={pageStyles.spacer} />
          <Button type="primary" loading={saving} onClick={() => void onSave()}>
            {t('common.action.save')}
          </Button>
        </div>
      )}
    </Space>
  );
};
