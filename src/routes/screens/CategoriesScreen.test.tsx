import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
import type { Category } from '../../api/categories';

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

import { categoriesApi } from '../../api/categories';
import { CategoriesScreen } from './CategoriesScreen';

const mocked = categoriesApi as unknown as {
  list: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  bulkUpsert: ReturnType<typeof vi.fn>;
};

function mk(o: Partial<Category>): Category {
  return {
    categoryId: o.categoryId ?? 'c1',
    name: o.name ?? 'Other',
    colourHex: o.colourHex ?? null,
    createdAt: '2026-01-01T00:00:00Z',
  };
}

function renderScreen() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const r = createRoute({
    getParentRoute: () => rootRoute,
    path: '/categories',
    component: CategoriesScreen,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([r]),
    history: createMemoryHistory({ initialEntries: ['/categories'] }),
  });
  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mocked.list.mockReset();
  mocked.create.mockReset();
  mocked.bulkUpsert.mockReset();
});

describe('<CategoriesScreen />', () => {
  it('renders the user categories alongside a "new category" tile', async () => {
    mocked.list.mockResolvedValueOnce([
      mk({ categoryId: 'a', name: 'Groceries' }),
      mk({ categoryId: 'b', name: 'Dining' }),
    ]);

    renderScreen();

    expect(await screen.findByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Dining')).toBeInTheDocument();
    expect(screen.getByText('2 categories')).toBeInTheDocument();
    // "New category" appears as both the TopBar action and the grid tile.
    expect(screen.getAllByText('New category').length).toBe(2);
  });

  it('shows the seed banner when the user has zero categories', async () => {
    mocked.list.mockResolvedValueOnce([]);
    renderScreen();
    expect(
      await screen.findByText(/Start with 13 ready-made categories/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add defaults/i }),
    ).toBeInTheDocument();
  });

  it('seeds the 13 defaults when the user clicks "Add defaults"', async () => {
    mocked.list.mockResolvedValue([]);
    mocked.bulkUpsert.mockResolvedValueOnce({
      created: 13,
      skipped: 0,
      categories: [],
    });

    const user = userEvent.setup();
    renderScreen();
    await user.click(await screen.findByRole('button', { name: /add defaults/i }));

    expect(mocked.bulkUpsert).toHaveBeenCalledTimes(1);
    const payload = mocked.bulkUpsert.mock.calls[0][0];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload.length).toBe(13);
    expect(payload[0]).toMatchObject({ name: 'Groceries', colourHex: '#84CC16' });
  });

  it('surfaces a retry button on API failure', async () => {
    mocked.list.mockRejectedValueOnce(new Error('boom'));
    renderScreen();
    expect(await screen.findByText("Couldn't load categories")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
