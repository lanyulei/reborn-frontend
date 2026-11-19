/**
 * /workflow 落地：按权限跳到第一个可访问的子页（同 /cmdb、/oncall 的落地方式）。
 */
import type React from 'react';
import { AccessLanding, type Landing } from '@/components/RouteTabs';

const LANDINGS: Landing[] = [
  ['canWorkflowDefinition', '/workflow/definition'],
  ['canWorkflowInstance', '/workflow/instance'],
  ['canWorkflowConfig', '/workflow/config'],
];

const WorkflowIndex: React.FC = () => <AccessLanding landings={LANDINGS} />;

export default WorkflowIndex;
