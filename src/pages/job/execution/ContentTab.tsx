/**
 * 执行详情 · 执行内容：提交时固化的内容。作业模板显示项目、Playbook 与参数取值；
 * 快速执行按类型显示命令 / 脚本（解释器、参数、内容）/ 分发的文件（文件名、大小、校验和、存放目录、权限）
 * 与目标主机配置。
 */
import { Descriptions, Table } from 'antd';
import type React from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import type { JobExecution } from '@/services/job/typings';
import { formatBytes } from '@/utils/format';
import { useT } from '@/utils/i18n';
import {
  formatDuration,
  formatParamValue,
  targetSummary,
} from '../components/format';
import { JOB_LIMITS } from '../components/meta';
import { useJobStyles } from '../components/styles';
import { CodeText, KindTag } from '../components/tags';

type Item = NonNullable<
  React.ComponentProps<typeof Descriptions>['items']
>[number];

export const ContentTab: React.FC<{ execution: JobExecution }> = ({
  execution,
}) => {
  const t = useT();
  const { styles } = useJobStyles();
  const { detail } = execution;
  const options = detail?.options;
  const adhoc = detail?.adhoc;
  const kind = execution.kind ?? 1;
  const yesNo = (value?: boolean) =>
    t(value ? 'pages.job.common.yes' : 'pages.job.common.no');
  const paramEntries = Object.entries(detail?.params ?? {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  const templateItems: Item[] = [
    {
      key: 'project',
      label: t('pages.job.template.column.project'),
      children: detail?.projectName || t('common.empty'),
    },
    {
      key: 'ref',
      label: t('pages.job.project.column.ref'),
      children: <CodeText value={detail?.ref} />,
    },
    {
      key: 'repoUrl',
      label: t('pages.job.project.column.repoUrl'),
      span: 2,
      children: <CodeText value={detail?.repoUrl} copyable />,
    },
    {
      key: 'playbook',
      label: t('pages.job.template.column.playbook'),
      children: <CodeText value={detail?.playbook} />,
    },
  ];

  const adhocItems: Item[] = [
    {
      key: 'kind',
      label: t('pages.job.execution.column.kind'),
      children: <KindTag kind={execution.kind} />,
    },
    {
      key: 'target',
      label: t('pages.job.template.column.target'),
      children: targetSummary(detail?.target, undefined, t),
    },
    ...(kind === 3
      ? [
          {
            key: 'interpreter',
            label: t('pages.job.adhoc.interpreter'),
            children: <CodeText value={adhoc?.interpreter} />,
          },
          {
            key: 'scriptSource',
            label: t('pages.job.adhoc.scriptSource'),
            children: adhoc?.scriptName
              ? t('pages.job.execution.content.scriptFrom', {
                  name: adhoc.scriptName,
                  version: adhoc.scriptVersion ?? 1,
                })
              : t('pages.job.adhoc.scriptSource.inline'),
          },
          {
            key: 'scriptArgs',
            label: t('pages.job.adhoc.scriptArgs'),
            span: 2,
            children: <CodeText value={adhoc?.scriptArgs} />,
          },
        ]
      : []),
    ...(kind === 4
      ? [
          {
            key: 'fileName',
            label: t('pages.job.adhoc.fileName'),
            children: <CodeText value={adhoc?.fileName} />,
          },
          {
            key: 'fileSize',
            label: t('pages.job.execution.content.fileSize'),
            children: formatBytes(adhoc?.fileSize) || t('common.empty'),
          },
          {
            key: 'dest',
            label: t('pages.job.adhoc.dest'),
            children: <CodeText value={adhoc?.dest} />,
          },
          {
            key: 'mode',
            label: t('pages.job.adhoc.mode'),
            children: <CodeText value={adhoc?.mode || '0644'} />,
          },
          {
            key: 'sha256',
            label: 'SHA-256',
            span: 2,
            children: <CodeText value={adhoc?.fileSha256} copyable />,
          },
        ]
      : []),
  ];

  const commonItems: Item[] = [
    {
      key: 'credential',
      label: t('pages.job.template.column.credential'),
      children: detail?.credentialName || t('common.empty'),
    },
    {
      key: 'runnerZone',
      label: t('pages.job.options.runnerZone'),
      children: detail?.runnerZone || t('pages.job.options.runnerZone.any'),
    },
    {
      key: 'forks',
      label: t('pages.job.options.forks'),
      children: options?.forks || JOB_LIMITS.forks.default,
    },
    {
      key: 'timeout',
      label: t('pages.job.options.timeout'),
      children: formatDuration(
        options?.timeoutS || JOB_LIMITS.timeoutS.default,
        t,
      ),
    },
    {
      key: 'port',
      label: t('pages.job.options.port'),
      children: options?.port || JOB_LIMITS.port.default,
    },
    {
      key: 'become',
      label: t('pages.job.options.become'),
      children: yesNo(options?.become),
    },
    {
      key: 'batch',
      label: t('pages.job.options.batchSize'),
      span: kind === 1 ? 1 : 2,
      children: options?.batchSize
        ? t('pages.job.execution.content.batch', {
            size: options.batchSize,
            percent: options.maxFailPercent ?? 0,
          })
        : t('pages.job.execution.content.batch.off'),
    },
    // check / diff / verbosity 对快速执行无意义
    ...(kind === 1
      ? [
          {
            key: 'check',
            label: t('pages.job.options.check'),
            children: yesNo(execution.check),
          },
          {
            key: 'verbosity',
            label: t('pages.job.options.verbosity'),
            children: t(
              `pages.job.options.verbosity.${options?.verbosity ?? 0}`,
            ),
          },
          {
            key: 'diff',
            label: t('pages.job.options.diff'),
            children: yesNo(options?.diff),
          },
        ]
      : []),
  ];

  const content = kind === 2 ? adhoc?.command : adhoc?.script;

  return (
    <div>
      <Descriptions
        bordered
        size="small"
        column={2}
        styles={{ label: { width: 130, whiteSpace: 'nowrap' } }}
        items={[...(kind === 1 ? templateItems : adhocItems), ...commonItems]}
      />
      {kind === 1 ? (
        <>
          <SectionTitle>{t('pages.job.execution.section.params')}</SectionTitle>
          <Table<[string, unknown]>
            size="small"
            rowKey={(entry) => entry[0]}
            dataSource={paramEntries}
            pagination={false}
            locale={{ emptyText: t('pages.job.execution.params.empty') }}
            columns={[
              {
                title: t('pages.job.execution.params.code'),
                width: 260,
                render: (_, entry) => <CodeText value={entry[0]} />,
              },
              {
                title: t('pages.job.execution.params.value'),
                render: (_, entry) => (
                  <span
                    className={styles.code}
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {formatParamValue(entry[1])}
                  </span>
                ),
              },
            ]}
          />
        </>
      ) : (
        kind !== 4 && (
          <>
            <SectionTitle>
              {t(
                kind === 2
                  ? 'pages.job.adhoc.command'
                  : 'pages.job.adhoc.script',
              )}
            </SectionTitle>
            <pre className={styles.scriptBlock}>{content}</pre>
          </>
        )
      )}
    </div>
  );
};
