import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { AppLayout } from '../components/shell/AppLayout';
import { AuthScreen } from '../components/auth/AuthScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { TransactionsScreen } from './screens/TransactionsScreen';
import { ImportScreen } from './screens/ImportScreen';
import { AccountsScreen } from './screens/AccountsScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useAuthStore } from '../stores/authStore';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const session = useAuthStore.getState().session;
    throw redirect({ to: session ? '/transactions' : '/sign-in' });
  },
});

// ── Auth layout — unauthenticated users only ────────────────────────────────
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth-layout',
  beforeLoad: () => {
    if (useAuthStore.getState().session) {
      throw redirect({ to: '/transactions' });
    }
  },
  component: () => <Outlet />,
});

const signInRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/sign-in',
  component: () => <AuthScreen mode="signin" />,
});

const signUpRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/sign-up',
  component: () => <AuthScreen mode="signup" />,
});

// ── App layout — authenticated users only ───────────────────────────────────
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-layout',
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().session) {
      throw redirect({ to: '/sign-in', search: { from: location.pathname } });
    }
  },
  component: AppLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardScreen,
});

const transactionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/transactions',
  component: TransactionsScreen,
});

const importRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/import',
  component: ImportScreen,
});

const accountsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/accounts',
  component: AccountsScreen,
});

const categoriesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/categories',
  component: CategoriesScreen,
});

const reportsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/reports',
  component: ReportsScreen,
});

const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: SettingsScreen,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  authLayoutRoute.addChildren([signInRoute, signUpRoute]),
  appLayoutRoute.addChildren([
    dashboardRoute,
    transactionsRoute,
    importRoute,
    accountsRoute,
    categoriesRoute,
    reportsRoute,
    settingsRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
