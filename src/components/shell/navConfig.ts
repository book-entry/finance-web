import { Icon, type IconKey } from '../icons/Icon';

export type NavId =
  | 'dashboard'
  | 'transactions'
  | 'import'
  | 'accounts'
  | 'categories'
  | 'reports'
  | 'settings';

export type NavItem = {
  id: NavId;
  label: string;
  path: string;
  icon: IconKey;
  badge?: string | null;
};

// Dashboard and Reports are temporarily hidden from the sidebar until the
// product is ready to ship them. The routes + screens are still registered
// in the router, so direct-URL access still works for debugging — just no
// nav entry. Re-add the two entries here to restore.
export const WORKSPACE_NAV: NavItem[] = [
  {
    id: 'transactions',
    label: 'Transactions',
    path: '/transactions',
    icon: 'Transactions',
  },
  { id: 'import', label: 'Import', path: '/import', icon: 'Import' },
  { id: 'accounts', label: 'Accounts', path: '/accounts', icon: 'Banks' },
  { id: 'categories', label: 'Categories', path: '/categories', icon: 'Tags' },
];

export const ACCOUNT_NAV: NavItem[] = [
  { id: 'settings', label: 'Settings', path: '/settings', icon: 'Settings' },
];

export const FULL_NAV: NavItem[] = [...WORKSPACE_NAV, ...ACCOUNT_NAV];

export const NavIcon = Icon;
