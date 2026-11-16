/**
 * /workflow 落地：按权限跳到第一个可访问的子页（同 /cmdb、/oncall 的落地方式）。
 */
import { history, useAccess } from '@umijs/max';
import type React from 'react';
import { useEffect } from 'react';

const LANDINGS: [accessKey: string, path: string][] = [
  ['canWorkflowDefinition', '/workflow/definition'],
  ['canWorkflowInstance', '/workflow/instance'],
  ['canWorkflowConfig', '/workflow/config'],
];

const WorkflowIndex: React.FC = () => {
  const access = useAccess() as Record<string, unknown>;
  useEffect(() => {
    const target = LANDINGS.find(([key]) => access[key]);
    history.replace(target ? target[1] : '/');
  }, [access]);
  return null;
};

export default WorkflowIndex;
