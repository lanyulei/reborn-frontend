/**
 * 唯一校验（模型详情 · 唯一校验 Tab）：维护模型的唯一规则。
 * 一条规则 = 一组字段，这组字段的取值在模型内不可重复：1 个字段即单字段唯一，
 * 多个字段即联合唯一；多条规则互相独立。规则内任一字段为空的资源不受该规则约束。
 * 新增 / 改字段组时先预检存量资源是否已有重复（有则后端拒绝保存）。
 */
import {
  ModalForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Alert, App, Card, Empty, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  checkUniqueRule,
  createUniqueRule,
  deleteUniqueRule,
  type UniqueRuleCheck,
  updateUniqueRule,
} from '@/services/cmdb/model';
import type {
  CmdbField,
  CmdbFieldType,
  CmdbUniqueRule,
} from '@/services/cmdb/typings';
import { usePermissions } from '@/services/system/permissions';
import { useFormRules, useSubmitter, useT } from '@/utils/i18n';
import { FieldTypeIcon } from '../components/icons';
import { useCmdbStyles } from '../components/styles';

/** 与后端一致的上限与可用字段类型（后端为准，这里只用于提前提示） */
const MAX_RULES = 8;
const MAX_RULE_FIELDS = 5;
const UNIQUE_FIELD_TYPES: readonly CmdbFieldType[] = [
  'string',
  'int',
  'enum',
  'datetime',
  'ip',
  'ref',
];

const useStyles = createStyles(({ token, css }) => ({
  list: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  rule: css`
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 14px 16px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    transition: border-color ${token.motionDurationMid};
    &:hover {
      border-color: ${token.colorPrimaryBorder};
    }
  `,
  ruleBody: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  `,
  ruleHead: css`
    display: flex;
    gap: 8px;
    align-items: center;
  `,
  ruleName: css`
    overflow: hidden;
    color: ${token.colorText};
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  fields: css`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  `,
  /** 字段块：类型图标 + 名称 + 编码；联合规则的字段之间以 + 连接 */
  field: css`
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 2px 8px;
    color: ${token.colorText};
    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusSM}px;
  `,
  fieldCode: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    font-family: ${token.fontFamilyCode};
  `,
  plus: css`
    color: ${token.colorTextQuaternary};
  `,
  actions: css`
    display: flex;
    flex: none;
    gap: 12px;
  `,
}));

interface RuleFormValues {
  name: string;
  fieldCodes: string[];
}

type CheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'failed' }
  | { status: 'done'; result: UniqueRuleCheck };

/** 规则表单：名称 + 字段组，字段组变化时预检存量重复 */
const RuleFormModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelCode: string;
  /** 编辑的规则；缺省为新增 */
  rule: CmdbUniqueRule | null;
  /** 可选字段（未废弃、非敏感、类型受支持） */
  options: { label: string; value: string }[];
  onSaved: () => void;
}> = ({ open, onOpenChange, modelCode, rule, options, onSaved }) => {
  const t = useT();
  const { message } = App.useApp();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const [codes, setCodes] = useState<string[]>(rule?.fieldCodes ?? []);
  const [check, setCheck] = useState<CheckState>({ status: 'idle' });
  // 只采纳最后一次预检的结果（字段组连续变化时旧请求作废）
  const seqRef = useRef(0);

  const sortedKey = [...codes].sort().join(',');
  const unchanged =
    !!rule && sortedKey === [...rule.fieldCodes].sort().join(',');
  // 依赖用排序后的字段组（sortedKey）：只调整顺序不重复预检
  useEffect(() => {
    const seq = ++seqRef.current;
    // 未选字段 / 字段组与当前规则相同（已受约束，必然无重复）：不预检
    if (!open || sortedKey === '' || unchanged) {
      setCheck({ status: 'idle' });
      return;
    }
    setCheck({ status: 'checking' });
    const timer = setTimeout(() => {
      checkUniqueRule(modelCode, sortedKey.split(','))
        .then((result) => {
          if (seq === seqRef.current) setCheck({ status: 'done', result });
        })
        .catch(() => {
          if (seq === seqRef.current) setCheck({ status: 'failed' });
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [open, modelCode, sortedKey, unchanged]);

  const conflictGroups =
    check.status === 'done' ? Number(check.result.conflictGroups ?? 0) : 0;
  const sampleNames =
    check.status === 'done'
      ? (check.result.samples ?? [])
          .map((s) => (s.names ?? []).join('、'))
          .filter(Boolean)
      : [];

  return (
    <ModalForm<RuleFormValues>
      title={
        rule
          ? t('pages.cmdb.uniqueRule.edit.title', { name: rule.name })
          : t('pages.cmdb.uniqueRule.create.title')
      }
      width={560}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true }}
      initialValues={
        rule ? { name: rule.name, fieldCodes: rule.fieldCodes } : undefined
      }
      submitter={{
        ...(rule ? submitter.save : submitter.create),
        // 存量有重复时后端必然拒绝：直接禁用提交，引导先处理数据
        submitButtonProps: { disabled: conflictGroups > 0 },
      }}
      onValuesChange={(changed) => {
        if (changed.fieldCodes) setCodes(changed.fieldCodes);
      }}
      onFinish={async (values) => {
        const name = values.name.trim();
        try {
          if (rule) {
            await updateUniqueRule(modelCode, rule.id, {
              name,
              // 字段组未变时不提交（避免无谓的重算）
              fieldCodes: unchanged ? undefined : values.fieldCodes,
            });
          } else {
            await createUniqueRule(modelCode, {
              name,
              fieldCodes: values.fieldCodes,
            });
          }
        } catch {
          // authRequest 已按后端 message 提示（规则重名 / 存量重复 / 并发写入需重试等）
          return false;
        }
        message.success(t('common.msg.saved'));
        onSaved();
        return true;
      }}
    >
      <ProFormText
        name="name"
        label={t('pages.cmdb.uniqueRule.form.name')}
        placeholder={t('pages.cmdb.uniqueRule.form.name.placeholder')}
        rules={[
          rules.required(t('pages.cmdb.uniqueRule.form.name')),
          { whitespace: true },
          rules.max(64),
        ]}
      />
      <ProFormSelect
        name="fieldCodes"
        label={t('pages.cmdb.uniqueRule.form.fields')}
        mode="multiple"
        options={options}
        fieldProps={{ maxCount: MAX_RULE_FIELDS, optionFilterProp: 'label' }}
        extra={t('pages.cmdb.uniqueRule.form.fields.extra', {
          max: MAX_RULE_FIELDS,
        })}
        rules={[rules.select(t('pages.cmdb.uniqueRule.form.fields'))]}
      />
      {check.status === 'done' && conflictGroups === 0 && (
        <Alert
          type="success"
          showIcon
          title={t('pages.cmdb.uniqueRule.check.ok')}
        />
      )}
      {check.status === 'done' && conflictGroups > 0 && (
        <Alert
          type="error"
          showIcon
          title={t('pages.cmdb.uniqueRule.check.conflict', {
            count: conflictGroups,
          })}
          description={
            sampleNames.length > 0 &&
            sampleNames.map((names) => <div key={names}>{names}</div>)
          }
        />
      )}
      {check.status === 'failed' && (
        <Alert
          type="warning"
          showIcon
          title={t('pages.cmdb.uniqueRule.check.failed')}
        />
      )}
    </ModalForm>
  );
};

export const UniqueRules: React.FC<{
  modelCode: string;
  fields: CmdbField[];
  rules: CmdbUniqueRule[];
  /** 规则变更后通知父级重新加载（规则与字段的 unique 标记） */
  onChanged: () => void;
}> = ({ modelCode, fields, rules, onChanged }) => {
  const t = useT();
  const { message } = App.useApp();
  const has = usePermissions();
  const { styles } = useStyles();
  const { styles: pageStyles } = useCmdbStyles();
  const [modal, setModal] = useState<{
    open: boolean;
    rule: CmdbUniqueRule | null;
    /** 每次打开换一个 key：表单与预检状态重新初始化 */
    seq: number;
  }>({ open: false, rule: null, seq: 0 });
  const canEdit = has('cmdb.model.field');

  const fieldByCode = useMemo(
    () => new Map(fields.map((f) => [f.code, f])),
    [fields],
  );
  const options = useMemo(
    () =>
      fields
        .filter(
          (f) =>
            !f.deprecated &&
            !f.sensitive &&
            UNIQUE_FIELD_TYPES.includes(f.type),
        )
        .map((f) => ({ label: `${f.name} (${f.code})`, value: f.code })),
    [fields],
  );

  const openModal = (rule: CmdbUniqueRule | null) =>
    setModal((prev) => ({ open: true, rule, seq: prev.seq + 1 }));

  return (
    <>
      <Typography.Paragraph type="secondary">
        {t('pages.cmdb.uniqueRule.explain')}
      </Typography.Paragraph>
      {canEdit && (
        <div className={pageStyles.toolbar}>
          {rules.length < MAX_RULES ? (
            <CreateButton onClick={() => openModal(null)}>
              {t('pages.cmdb.uniqueRule.create.title')}
            </CreateButton>
          ) : (
            <Typography.Text type="secondary">
              {t('pages.cmdb.uniqueRule.limit', { max: MAX_RULES })}
            </Typography.Text>
          )}
        </div>
      )}
      {rules.length === 0 ? (
        <Card variant="outlined">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.cmdb.uniqueRule.empty')}
          />
        </Card>
      ) : (
        <div className={styles.list}>
          {rules.map((rule) => (
            <div key={rule.id} className={styles.rule}>
              <div className={styles.ruleBody}>
                <div className={styles.ruleHead}>
                  <span className={styles.ruleName}>{rule.name}</span>
                  <Tag
                    color={rule.fieldCodes.length > 1 ? 'purple' : 'blue'}
                    style={{ marginInlineEnd: 0 }}
                  >
                    {t(
                      rule.fieldCodes.length > 1
                        ? 'pages.cmdb.uniqueRule.kind.composite'
                        : 'pages.cmdb.uniqueRule.kind.single',
                    )}
                  </Tag>
                </div>
                <div className={styles.fields}>
                  {rule.fieldCodes.map((code, i) => {
                    const f = fieldByCode.get(code);
                    return (
                      <span key={code} className={styles.fields}>
                        {i > 0 && <span className={styles.plus}>+</span>}
                        <span className={styles.field}>
                          {f && <FieldTypeIcon type={f.type} />}
                          {f?.name ?? code}
                          <span className={styles.fieldCode}>{code}</span>
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
              {canEdit && (
                <div className={styles.actions}>
                  <a onClick={() => openModal(rule)}>
                    {t('common.action.edit')}
                  </a>
                  <DeleteConfirmLink
                    title={t('pages.cmdb.uniqueRule.delete.confirm', {
                      name: rule.name,
                    })}
                    description={t('pages.cmdb.uniqueRule.delete.description')}
                    onConfirm={async () => {
                      try {
                        await deleteUniqueRule(modelCode, rule.id);
                      } catch {
                        return; // authRequest 已提示
                      }
                      message.success(t('common.msg.deleted'));
                      onChanged();
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <RuleFormModal
        key={`unique-rule-${modal.seq}`}
        open={modal.open}
        onOpenChange={(open) => setModal((prev) => ({ ...prev, open }))}
        modelCode={modelCode}
        rule={modal.rule}
        options={options}
        onSaved={onChanged}
      />
    </>
  );
};
