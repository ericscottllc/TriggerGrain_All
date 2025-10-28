export interface NavigationItem {
  id: string;
  title: string;
  icon_name: string;
  path: string;
  color: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon_name: 'BarChart3',
    path: '/',
    color: 'tg-primary'
  },
  {
    id: 'grain-entries',
    title: 'Grain Entries',
    icon_name: 'Grain',
    path: '/grain-entries',
    color: 'tg-green'
  },
  {
    id: 'settings',
    title: 'Settings',
    icon_name: 'Settings',
    path: '/settings',
    color: 'tg-grey'
  },
  {
    id: 'one-pager',
    title: 'One Pager',
    icon_name: 'FileText',
    path: '/one-pager',
    color: 'tg-coral'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon_name: 'TrendingUp',
    path: '/analytics',
    color: 'tg-primary'
  },
  {
    id: 'scenario',
    title: 'Scenario',
    icon_name: 'Workflow',
    path: '/scenario',
    color: 'tg-green'
  },
  {
    id: 'clients',
    title: 'Clients',
    icon_name: 'Users',
    path: '/clients',
    color: 'tg-primary'
  }
];
