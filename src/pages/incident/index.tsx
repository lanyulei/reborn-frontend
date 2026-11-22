/**
 * /incident 落地：按权限跳到第一个可访问的子页。
 */
import type React from 'react';
import { AccessLanding, type Landing } from '@/components/RouteTabs';

const LANDINGS: Landing[] = [
  ['canIncidentList', '/incident/list'],
  ['canIncidentReview', '/incident/review'],
  ['canIncidentStats', '/incident/stats'],
  ['canIncidentConfig', '/incident/config'],
];

const IncidentIndex: React.FC = () => <AccessLanding landings={LANDINGS} />;

export default IncidentIndex;
