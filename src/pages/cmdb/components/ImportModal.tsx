/**
 * 资源导入：选择 CSV → 按字段定义转换 → 试运行预览（逐行动作/错误）→ 确认导入。
 */

import { UploadOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, App, Button, Modal, Space, Typography, Upload } from 'antd';
import type React from 'react';
import { useMemo, useState } from 'react';
import {
  type ImportRelation,
  type ImportResult,
  type ImportRow,
  type ImportRowResult,
  importCIs,
} from '@/services/cmdb/ci';
import type {
  CmdbCIStatus,
  CmdbField,
  CmdbModel,
} from '@/services/cmdb/typings';
import { useT, useValueEnum } from '@/utils/i18n';
import { parseCsv } from './csv';

const FIXED = new Set(['name', 'status', 'env', 'owner', 'tags', 'externalId']);
/** 导出文件里存在但导入时忽略的列 */
const IGNORED = new Set(['id', 'version', 'updateTime', 'createTime']);
/** 关系列：rel:<关系类型>:<方向>[:<对端类型>]，单元格为对端资源名称（分号分隔多个） */
const REL_PREFIX = 'rel:';

const parseRelationHeader = (
  col: string,
): Omit<ImportRelation, 'targetName'> | null => {
  if (!col.startsWith(REL_PREFIX)) return null;
  const parts = col.slice(REL_PREFIX.length).split(':');
  if (parts.length < 2 || (parts[1] !== 'outgoing' && parts[1] !== 'incoming'))
    return null;
  return {
    relationType: parts[0],
    direction: parts[1],
    targetModel: parts[2] || undefined,
  };
};

const IMPORT_ACTION_META = {
  create: {
    textId: 'enum.cmdb.importAction.create',
    status: 'Success' as const,
  },
  update: {
    textId: 'enum.cmdb.importAction.update',
    status: 'Processing' as const,
  },
  skip: { textId: 'enum.cmdb.importAction.skip', status: 'Default' as const },
  error: { textId: 'enum.cmdb.importAction.error', status: 'Error' as const },
};

/** 单元格文本 → 字段值（空串视为未提供） */
const convertCell = (field: CmdbField | undefined, raw: string): unknown => {
  const text = raw.trim();
  if (text === '') return undefined;
  switch (field?.type) {
    case 'int':
    case 'float': {
      const n = Number(text);
      if (Number.isNaN(n)) throw new Error(`${field.code}: ${text}`);
      return n;
    }
    case 'bool':
      if (/^(true|1|yes|y)$/i.test(text)) return true;
      if (/^(false|0|no|n)$/i.test(text)) return false;
      throw new Error(`${field.code}: ${text}`);
    case 'json':
      return JSON.parse(text);
    default:
      return text;
  }
};

/** JSON（导出格式同构的数组）→ 导入行 */
const fromJson = (text: string): ImportRow[] => {
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('1|not a JSON array');
  return data.map((item, idx) => {
    const obj = item as Record<string, unknown>;
    if (!obj || typeof obj.name !== 'string' || !obj.name) {
      throw new Error(`${idx + 1}|name is required`);
    }
    const row: ImportRow = {
      name: obj.name,
      attrs: (obj.attrs as Record<string, unknown>) ?? {},
    };
    if (typeof obj.status === 'string' && obj.status !== 'retired') {
      row.status = obj.status as ImportRow['status'];
    }
    if (typeof obj.env === 'string') row.env = obj.env;
    if (typeof obj.owner === 'string') row.owner = obj.owner;
    if (typeof obj.externalId === 'string') row.externalId = obj.externalId;
    if (Array.isArray(obj.tags)) row.tags = obj.tags.map(String);
    if (Array.isArray(obj.relations)) {
      row.relations = obj.relations as ImportRelation[];
    }
    return row;
  });
};

/** CSV → 导入行；无法转换的行抛出带行号的错误 */
const toRows = (
  header: string[],
  rows: string[][],
  fields: CmdbField[],
): ImportRow[] => {
  const byCode = new Map(
    fields.filter((f) => !f.deprecated).map((f) => [f.code, f]),
  );
  return rows.map((cells, idx) => {
    const row: ImportRow = { name: '', attrs: {} };
    try {
      header.forEach((col, i) => {
        const raw = cells[i] ?? '';
        if (IGNORED.has(col)) return;
        const rel = parseRelationHeader(col);
        if (rel) {
          const names = raw
            .split(/[;；]/)
            .map((s) => s.trim())
            .filter(Boolean);
          if (names.length) {
            row.relations = [
              ...(row.relations ?? []),
              ...names.map((targetName) => ({ ...rel, targetName })),
            ];
          }
          return;
        }
        if (FIXED.has(col)) {
          const text = raw.trim();
          if (col === 'name') row.name = text;
          else if (col === 'tags')
            row.tags = text
              ? text
                  .split(/[;；]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : undefined;
          else if (col === 'status')
            row.status = (text || undefined) as ImportRow['status'];
          else if (text !== '')
            (row as unknown as Record<string, unknown>)[col] = text;
          return;
        }
        const value = convertCell(byCode.get(col), raw);
        if (value !== undefined)
          (row.attrs as Record<string, unknown>)[col] = value;
      });
    } catch (error) {
      const err = error as Error;
      throw new Error(`${idx + 2}|${err.message}`);
    }
    return row;
  });
};

/** 后端约定：资源已写入但关联未建成的行，message 以此开头（biz ImportRelationFailedPrefix） */
const RELATION_FAILED_PREFIX = 'relation failed: ';

const relationFailures = (result: ImportResult): number =>
  result.results.filter((r) => r.message?.startsWith(RELATION_FAILED_PREFIX))
    .length;

export const ImportModal: React.FC<{
  open: boolean;
  onClose: () => void;
  model: CmdbModel;
  fields: CmdbField[];
  onImported: () => void;
}> = ({ open, onClose, model, fields, onImported }) => {
  const t = useT();
  const { message } = App.useApp();
  const actionEnum = useValueEnum(IMPORT_ACTION_META);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setRows([]);
    setPreview(null);
    setFileName('');
    setDone(false);
  };

  const loadFile = async (file: File) => {
    const text = await file.text();
    let converted: ImportRow[];
    try {
      if (/\.json$/i.test(file.name)) {
        converted = fromJson(text);
      } else {
        const parsed = parseCsv(text);
        converted = toRows(parsed.header, parsed.rows, fields);
      }
    } catch (error) {
      const [row, msg] = String((error as Error).message).split('|');
      message.error(t('pages.cmdb.import.parseError', { row, message: msg }));
      return;
    }
    if (converted.length === 0) {
      message.warning(t('pages.cmdb.import.empty'));
      return;
    }
    setFileName(file.name);
    setRows(converted);
    setDone(false);
    setLoading(true);
    try {
      setPreview(await importCIs(model.code, converted, true));
    } finally {
      setLoading(false);
    }
  };

  const commit = async () => {
    setLoading(true);
    try {
      const result = await importCIs(model.code, rows, false);
      setPreview(result);
      setDone(true);
      const relFailed = relationFailures(result);
      if (relFailed > 0) {
        // 资源已写入但部分关联未建成：整体不算失败，单独提示
        message.warning(
          `${t('pages.cmdb.import.result', summary(result))}${t(
            'pages.cmdb.import.relationFailed',
            { n: relFailed },
          )}`,
        );
      } else {
        message.success(t('pages.cmdb.import.result', summary(result)));
      }
      onImported();
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<ProColumns<ImportRowResult>[]>(
    () => [
      { title: t('pages.cmdb.import.column.row'), dataIndex: 'row', width: 60 },
      {
        title: t('pages.cmdb.import.column.name'),
        dataIndex: 'name',
        ellipsis: true,
      },
      {
        title: t('pages.cmdb.import.column.action'),
        dataIndex: 'action',
        valueEnum: actionEnum,
        width: 100,
      },
      {
        title: t('pages.cmdb.import.column.message'),
        dataIndex: 'message',
        ellipsis: true,
        // 「资源已写入、关联失败」的行用警告色标出（action 仍是新建 / 更新 / 无变化）
        render: (_, r) =>
          r.message?.startsWith(RELATION_FAILED_PREFIX) ? (
            <Typography.Text type="warning" ellipsis={{ tooltip: r.message }}>
              {r.message}
            </Typography.Text>
          ) : (
            (r.message ?? '')
          ),
      },
    ],
    [t, actionEnum],
  );

  return (
    <Modal
      title={t('pages.cmdb.import.title', { model: model.name })}
      open={open}
      onCancel={() => {
        reset();
        onClose();
      }}
      width={800}
      destroyOnHidden
      footer={
        <Space>
          <Button
            onClick={() => {
              reset();
              onClose();
            }}
          >
            {t('common.action.cancel')}
          </Button>
          <Button
            type="primary"
            loading={loading}
            disabled={
              !preview ||
              done ||
              rows.length === 0 ||
              (preview.failed ?? 0) === rows.length
            }
            onClick={commit}
          >
            {t('pages.cmdb.import.confirm')}
          </Button>
        </Space>
      }
    >
      <Space vertical size="middle" style={{ width: '100%' }}>
        <Alert type="info" showIcon title={t('pages.cmdb.import.hint')} />
        <Upload
          accept=".csv,.json,text/csv,application/json"
          maxCount={1}
          showUploadList={false}
          beforeUpload={(file) => {
            void loadFile(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>
            {t('pages.cmdb.import.upload')}
          </Button>
          {fileName && <span style={{ marginInlineStart: 8 }}>{fileName}</span>}
        </Upload>
        {preview && (
          <>
            <Alert
              type={
                done
                  ? relationFailures(preview) > 0 || (preview.failed ?? 0) > 0
                    ? 'warning'
                    : 'success'
                  : (preview.failed ?? 0) > 0
                    ? 'warning'
                    : 'info'
              }
              showIcon
              title={t(
                done ? 'pages.cmdb.import.result' : 'pages.cmdb.import.preview',
                summary(preview),
              )}
            />
            <ProTable<ImportRowResult>
              rowKey="row"
              size="small"
              search={false}
              options={false}
              loading={loading}
              columns={columns}
              dataSource={preview.results}
              pagination={{ pageSize: 10, size: 'small' }}
              scroll={{ x: 'max-content', y: 300 }}
            />
          </>
        )}
      </Space>
    </Modal>
  );
};

const summary = (r: ImportResult) => ({
  created: r.created ?? 0,
  updated: r.updated ?? 0,
  skipped: r.skipped ?? 0,
  failed: r.failed ?? 0,
});

export type { CmdbCIStatus };
