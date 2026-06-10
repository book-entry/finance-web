import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';

// Avoid initializing the real Firebase app (needs env config) in tests.
vi.mock('../../lib/firebase', () => ({ firebaseAuth: {} }));
vi.mock('firebase/auth', () => ({ signOut: vi.fn().mockResolvedValue(undefined) }));

import { Sidebar } from './Sidebar';
import { signOut } from 'firebase/auth';
import { useAuthStore } from '../../stores/authStore';

const mockedSignOut = signOut as unknown as ReturnType<typeof vi.fn>;

function renderAt(pathname: string) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <Sidebar />
        <Outlet />
      </>
    ),
  });
  const catchAll = createRoute({
    getParentRoute: () => rootRoute,
    path: '$',
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([catchAll]),
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });
  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('<Sidebar />', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    mockedSignOut.mockClear();
    useAuthStore.setState({ session: null });
  });

  it('links the account card to settings', async () => {
    renderAt('/transactions');
    const link = (await screen.findByLabelText('Open settings')).closest('a');
    expect(link).toHaveAttribute('href', '/settings');
  });

  it('signs out of Firebase and clears the session when the logout button is clicked', async () => {
    useAuthStore.setState({
      session: { accessToken: 'a', refreshToken: 'r', uid: 'u-1' },
    });
    const user = userEvent.setup();
    renderAt('/transactions');

    await user.click(await screen.findByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(mockedSignOut).toHaveBeenCalledTimes(1);
      expect(useAuthStore.getState().session).toBeNull();
    });
  });

  it('renders every workspace + account nav label', async () => {
    renderAt('/transactions');
    for (const label of [
      'Transactions',
      'Import',
      'Accounts',
      'Categories',
      'Settings',
    ]) {
      expect(await screen.findByText(label)).toBeInTheDocument();
    }
  });

  it('does not render Dashboard or Reports while they are hidden', async () => {
    renderAt('/transactions');
    await screen.findByText('Transactions');
    expect(screen.queryByText('Dashboard')).toBeNull();
    expect(screen.queryByText('Reports')).toBeNull();
  });

  it('marks Transactions active when on /transactions', async () => {
    renderAt('/transactions');
    const link = (await screen.findByText('Transactions')).closest('a');
    expect(link).toHaveClass('active');
  });

  it('marks Transactions active on a nested path like /transactions/123', async () => {
    renderAt('/transactions/abc');
    const link = (await screen.findByText('Transactions')).closest('a');
    expect(link).toHaveClass('active');
  });

  it('does not render any nav badges by default', async () => {
    renderAt('/transactions');
    await screen.findByText('Transactions');
    expect(document.querySelector('.nav-badge')).toBeNull();
  });
});
