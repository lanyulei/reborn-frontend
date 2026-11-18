/** 命中的高危命令规则列表：动作标签 + 规则名 + 说明 + 命中的片段（等宽）。 */
import type React from 'react';
import type { JobRiskHit } from '@/services/job/typings';
import { useJobStyles } from './styles';
import { RiskActionTag } from './tags';

export const RiskHits: React.FC<{ hits: readonly JobRiskHit[] }> = ({
  hits,
}) => {
  const { styles } = useJobStyles();
  return (
    <div>
      {hits.map((hit, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 同一规则可能命中多次，无稳定标识
        <div key={index} className={styles.riskHit}>
          <div>
            <RiskActionTag action={hit.action} />
            <strong style={{ marginInlineStart: 8 }}>{hit.name}</strong>
            {hit.description && (
              <span
                className={styles.secondary}
                style={{ marginInlineStart: 8 }}
              >
                {hit.description}
              </span>
            )}
          </div>
          {hit.match && (
            <pre className={styles.codeBlock} style={{ marginTop: 4 }}>
              {hit.match}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
};
