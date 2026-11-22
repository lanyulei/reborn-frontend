/**
 * /agent 落地：按权限跳到第一个可访问的子页。
 */
import type React from 'react';
import { AccessLanding, type Landing } from '@/components/RouteTabs';

const LANDINGS: Landing[] = [
  ['canAgentTask', '/agent/task'],
  ['canAgentProfile', '/agent/profile'],
  ['canAgentStats', '/agent/stats'],
];

const AgentIndex: React.FC = () => <AccessLanding landings={LANDINGS} />;

export default AgentIndex;
