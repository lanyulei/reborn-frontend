import { createContext, useContext } from 'react';

/** 向导所在的集群与表单里当前选择的命名空间：候选项（配置字典、PVC、节点等）都按它查询 */
type WizardScope = {
  clusterId: string;
  namespace?: string;
};

const WizardScopeContext = createContext<WizardScope>({ clusterId: '' });

const useWizardScope = () => useContext(WizardScopeContext);

export type { WizardScope };
export { useWizardScope, WizardScopeContext };
