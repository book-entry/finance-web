import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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
import type { Account } from '../../api/accounts';
import type { Category } from '../../api/categories';
import type { Transaction } from '../../api/transactions';
import { useTxnFiltersStore } from '../../stores/txnFiltersStore';

vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    categorise: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../api/accounts', () => ({
  accountsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    close: vi.fn(),
  },
}));
vi.mock('../../api/categories', () => ({
  categoriesApi: {
    list: vi.fn(),
    create: vi.fn(),
    bulkUpsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    summary: vi.fn(),
  },
}));

import { transactionsApi } from '../../api/transactions';
import { accountsApi } from '../../api/accounts';
import { categoriesApi } from '../../api/categories';
import { TransactionsScreen } from './TransactionsScreen';

const tx = transactionsApi as unknown as { list: ReturnType<typeof vi.fn>; categorise: ReturnType<typeof vi.fn> };
const acct = accountsApi as unknown as { list: ReturnType<typeof vi.fn> };
const cat = categoriesApi as unknown as { list: ReturnType<typeof vi.fn> };

function mkAccount(o: Partial<Account>): Account {
  return {
    accountId: o.accountId ?? 'acc-1',
    accountName: o.accountName ?? 'HSBC One',
    bankName: o.bankName ?? 'HSBC',
    bankCode: null,
    accountCode: o.accountCode ?? '4000 1234 5678 8842',
    accountType: o.accountType ?? 'ASSET',
    currency: 'HKD',
    openingBalance: 0,
    status: 'ACTIVE',
    description: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

function mkCategory(o: Partial<Category>): Category {
  return {
    categoryId: o.categoryId ?? 'c-1',
    name: o.name ?? 'Groceries',
    colourHex: null,
    createdAt: '2026-01-01T00:00:00Z',
  };
}

function mkTxn(o: Partial<Transaction>): Transaction {
  return {
    transactionId: o.transactionId ?? 't',
    accountId: o.accountId ?? 'acc-1',
    entryType: o.entryType ?? 'DEBIT',
    amount: o.amount ?? 100,
    currency: 'HKD',
    transactionDate: o.transactionDate ?? '2026-05-24',
    reference: o.reference ?? null,
    description: o.description ?? 'ParknShop',
    source: 'MANUAL',
    category: o.category ?? null,
    createdAt: '2026-05-24T00:00:00Z',
  };
}

function renderScreen() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const r = createRoute({
    getParentRoute: () => rootRoute,
    path: '/transactions',
    component: TransactionsScreen,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([r]),
    history: createMemoryHistory({ initialEntries: ['/transactions'] }),
  });
  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  tx.list.mockReset();
  tx.categorise.mockReset();
  acct.list.mockReset();
  cat.list.mockReset();
  useTxnFiltersStore.setState({
    accountId: null,
    categoryFilter: null,
    search: '',
    selectedIds: new Set(),
  });

  acct.list.mockResolvedValue([
    mkAccount({ accountId: 'acc-1', accountName: 'HSBC One' }),
  ]);
  cat.list.mockResolvedValue([
    mkCategory({ categoryId: 'c-1', name: 'Groceries' }),
  ]);
});

describe('<TransactionsScreen />', () => {
  it('renders day-grouped rows with merchant + amount', async () => {
    tx.list.mockResolvedValueOnce({
      data: [
        mkTxn({
          transactionId: 't1',
          description: 'ParknShop',
          amount: 384.2,
          entryType: 'DEBIT',
        }),
        mkTxn({
          transactionId: 't2',
          description: 'Salary',
          amount: 56800,
          entryType: 'CREDIT',
        }),
      ],
      total: 2,
      page: 1,
      size: 200,
    });

    renderScreen();

    expect(await screen.findByText('ParknShop')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('HK$−384.20')).toBeInTheDocument();
    expect(screen.getByText('HK$+56,800.00')).toBeInTheDocument();
    expect(screen.getByText(/2 transactions/)).toBeInTheDocument();
  });

  it('forwards search input to the server-side q param (debounced)', async () => {
    const all = [
      mkTxn({ transactionId: 't1', description: 'ParknShop' }),
      mkTxn({ transactionId: 't2', description: 'Starbucks' }),
      mkTxn({ transactionId: 't3', description: 'Wellcome' }),
    ];
    // Mock simulates the server filter so the rendered list updates too.
    tx.list.mockImplementation(async (params: { q?: string } = {}) => {
      const q = params.q?.toLowerCase() ?? '';
      const data = q
        ? all.filter((t) => (t.description ?? '').toLowerCase().includes(q))
        : all;
      return { data, total: data.length, page: 1, size: 200 };
    });

    const user = userEvent.setup();
    renderScreen();

    await screen.findByText('ParknShop');
    await user.type(screen.getByPlaceholderText('Search merchant…'), 'star');

    await waitFor(() => {
      expect(tx.list).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'star' }),
      );
    });
    await waitFor(() => {
      expect(screen.queryByText('ParknShop')).not.toBeInTheDocument();
      expect(screen.queryByText('Wellcome')).not.toBeInTheDocument();
      expect(screen.getByText('Starbucks')).toBeInTheDocument();
    });
  });

  it('forwards the Uncategorized chip to the server-side uncategorized param', async () => {
    const categorized = mkTxn({
      transactionId: 't1',
      description: 'ParknShop',
      category: { id: 'c-1', name: 'Groceries', isNew: false },
    });
    const uncategorized = mkTxn({
      transactionId: 't2',
      description: 'Starbucks',
      category: null,
    });
    tx.list.mockImplementation(async (params: { uncategorized?: boolean } = {}) => {
      const data = params.uncategorized
        ? [uncategorized]
        : [categorized, uncategorized];
      return { data, total: data.length, page: 1, size: 200 };
    });

    const user = userEvent.setup();
    renderScreen();

    await screen.findByText('ParknShop');
    await user.click(screen.getByRole('tab', { name: /Uncategorized/i }));

    await waitFor(() => {
      expect(tx.list).toHaveBeenCalledWith(
        expect.objectContaining({ uncategorized: true }),
      );
    });
    await waitFor(() => {
      expect(screen.queryByText('ParknShop')).not.toBeInTheDocument();
      expect(screen.getByText('Starbucks')).toBeInTheDocument();
    });
  });

  it('shows the bulk action bar after selecting a row, and clears it via Clear', async () => {
    tx.list.mockResolvedValue({
      data: [
        mkTxn({ transactionId: 't1', description: 'ParknShop' }),
        mkTxn({ transactionId: 't2', description: 'Starbucks' }),
      ],
      total: 2,
      page: 1,
      size: 200,
    });

    const user = userEvent.setup();
    renderScreen();

    await screen.findByText('ParknShop');

    const rowCheckboxes = screen.getAllByRole('checkbox', {
      name: /Select transaction/,
    });
    await user.click(rowCheckboxes[0]);

    const bulkBar = await screen.findByRole('region', { name: /bulk actions/i });
    expect(within(bulkBar).getByText('1 selected')).toBeInTheDocument();

    await user.click(within(bulkBar).getByRole('button', { name: /^Clear$/ }));
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /bulk actions/i })).not.toBeInTheDocument();
    });
  });
});
