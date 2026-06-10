import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import type { Account } from '../../api/accounts';

vi.mock('../../api/accounts', () => ({
  accountsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    close: vi.fn(),
  },
}));
vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    categorise: vi.fn(),
    delete: vi.fn(),
  },
}));

import { accountsApi } from '../../api/accounts';
import { transactionsApi } from '../../api/transactions';
import { AccountsScreen } from './AccountsScreen';

const mocked = accountsApi as unknown as {
  list: ReturnType<typeof vi.fn>;
};
const txMock = transactionsApi as unknown as {
  list: ReturnType<typeof vi.fn>;
};

function mkAccount(o: Partial<Account>): Account {
  return {
    accountId: o.accountId ?? 'a',
    accountName: o.accountName ?? 'HSBC One',
    bankName: o.bankName ?? 'HSBC',
    bankCode: o.bankCode ?? null,
    accountCode: o.accountCode ?? '4000 1234 5678 8842',
    accountType: o.accountType ?? 'ASSET',
    currency: o.currency ?? 'HKD',
    openingBalance: o.openingBalance ?? 48230.5,
    status: o.status ?? 'ACTIVE',
    description: o.description ?? null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

function renderScreen() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const accountsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/accounts',
    component: AccountsScreen,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([accountsRoute]),
    history: createMemoryHistory({ initialEntries: ['/accounts'] }),
  });
  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mocked.list.mockReset();
  txMock.list.mockReset();
  // Default: no transactions → balances == opening balance.
  txMock.list.mockResolvedValue({ data: [], total: 0, page: 1, size: 1000 });
});

describe('<AccountsScreen />', () => {
  it('renders bank cards and computes totals from the API response', async () => {
    mocked.list.mockResolvedValueOnce([
      mkAccount({
        accountId: '1',
        accountName: 'HSBC One',
        accountType: 'ASSET',
        openingBalance: 48230.5,
      }),
      mkAccount({
        accountId: '2',
        accountName: 'Red Credit Card',
        accountType: 'LIABILITY',
        openingBalance: 3240,
      }),
    ]);

    renderScreen();

    expect(await screen.findByText('HSBC One')).toBeInTheDocument();
    expect(screen.getByText('Red Credit Card')).toBeInTheDocument();

    // Totals: assets 48,230.50, debt 3,240.00, net 44,990.50
    expect(screen.getByText('48,230.50')).toBeInTheDocument();
    expect(screen.getByText('3,240.00')).toBeInTheDocument();
    expect(screen.getByText('44,990.50')).toBeInTheDocument();

    // Last-4 visible on every card (both share the test default code).
    expect(screen.getAllByText(/8842/).length).toBeGreaterThan(0);
  });

  it('shows the empty state when the user has no accounts yet', async () => {
    mocked.list.mockResolvedValueOnce([]);
    renderScreen();
    expect(await screen.findByText('No accounts yet')).toBeInTheDocument();
  });

  it('renders an error state and a retry button when the API fails', async () => {
    mocked.list.mockRejectedValueOnce(new Error('boom'));
    renderScreen();
    expect(await screen.findByText("Couldn't load accounts")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
