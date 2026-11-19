/**
 * /oncall 落地：按权限跳到第一个可访问的子页（同 /cmdb 的落地方式）。
 */
import type React from 'react';
import { AccessLanding, type Landing } from '@/components/RouteTabs';

const LANDINGS: Landing[] = [
  ['canOncallCalendar', '/oncall/calendar'],
  ['canOncallGroup', '/oncall/group'],
];

const OncallIndex: React.FC = () => <AccessLanding landings={LANDINGS} />;

export default OncallIndex;
