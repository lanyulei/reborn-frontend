/**
 * /ticket 落地：按权限跳到第一个可访问的子页（同 /workflow、/cmdb 的落地方式）。
 */
import type React from 'react';
import { AccessLanding, type Landing } from '@/components/RouteTabs';

const LANDINGS: Landing[] = [
  ['canTicketMine', '/ticket/mine'],
  ['canTicketAll', '/ticket/all'],
  ['canTicketStats', '/ticket/stats'],
  ['canTicketCatalog', '/ticket/catalog'],
];

const TicketIndex: React.FC = () => <AccessLanding landings={LANDINGS} />;

export default TicketIndex;
