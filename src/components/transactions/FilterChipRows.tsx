import type { Account } from '../../api/accounts';
import type { Category } from '../../api/categories';
import { lastFour, gradientFor } from '../../lib/accounts';
import { styleForCategory } from '../../lib/categoryStyles';
import { useTxnFiltersStore, type CategoryFilter } from '../../stores/txnFiltersStore';
import { Icon } from '../icons/Icon';

type AccountChipRowProps = {
  accounts: Account[];
  countsByAccount: Map<string, number>;
  totalCount: number;
};

export function AccountChipRow({
  accounts,
  countsByAccount,
  totalCount,
}: AccountChipRowProps) {
  const accountId = useTxnFiltersStore((s) => s.accountId);
  const setAccount = useTxnFiltersStore((s) => s.setAccount);

  return (
    <div className="filter-row" role="tablist" aria-label="Filter by account">
      <span className="filter-label">Account</span>
      <button
        type="button"
        className={'filter-chip' + (accountId === null ? ' active' : '')}
        onClick={() => setAccount(null)}
        role="tab"
        aria-selected={accountId === null}
      >
        All accounts <span className="count">{totalCount}</span>
      </button>
      {accounts.map((a) => {
        const grad = gradientFor(a);
        const accent = grad.match(/#[0-9a-fA-F]{6}/)?.[0] ?? '#4F46E5';
        const last4 = lastFour(a.accountCode);
        return (
          <button
            key={a.accountId}
            type="button"
            className={
              'filter-chip acct' + (accountId === a.accountId ? ' active' : '')
            }
            style={{ ['--swatch' as string]: accent }}
            onClick={() => setAccount(a.accountId)}
            role="tab"
            aria-selected={accountId === a.accountId}
          >
            <span className="swatch" />
            {a.accountName}
            {last4 ? <span className="last4">·{last4}</span> : null}
            <span className="count">{countsByAccount.get(a.accountId) ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

type CategoryChipRowProps = {
  categories: Category[];
  uncategorizedCount: number;
};

export function CategoryChipRow({
  categories,
  uncategorizedCount,
}: CategoryChipRowProps) {
  const filter = useTxnFiltersStore((s) => s.categoryFilter);
  const setCategory = useTxnFiltersStore((s) => s.setCategory);
  const search = useTxnFiltersStore((s) => s.search);
  const setSearch = useTxnFiltersStore((s) => s.setSearch);

  const isActive = (value: CategoryFilter): boolean => {
    if (value === null) return filter === null;
    return filter === value;
  };

  return (
    <div className="filter-row" role="tablist" aria-label="Filter by category">
      <span className="filter-label">Category</span>
      <button
        type="button"
        className={'filter-chip' + (isActive(null) ? ' active' : '')}
        onClick={() => setCategory(null)}
        role="tab"
        aria-selected={isActive(null)}
      >
        All
      </button>
      <button
        type="button"
        className={
          'filter-chip uncat' + (isActive('uncategorized') ? ' active' : '')
        }
        onClick={() => setCategory('uncategorized')}
        role="tab"
        aria-selected={isActive('uncategorized')}
      >
        <span className="pulse" aria-hidden="true" />
        Uncategorized
        <span className="pill">{uncategorizedCount}</span>
      </button>
      {categories.slice(0, 7).map((c) => {
        const style = styleForCategory(c);
        return (
          <button
            key={c.categoryId}
            type="button"
            className={
              'filter-chip' + (isActive(c.categoryId) ? ' active' : '')
            }
            style={{ ['--swatch' as string]: style.color }}
            onClick={() => setCategory(c.categoryId)}
            role="tab"
            aria-selected={isActive(c.categoryId)}
          >
            <span className="swatch" />
            {c.name}
          </button>
        );
      })}
      <span style={{ flex: 1 }} />
      <div className="txn-search">
        <Icon.Search />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search merchant…"
          aria-label="Search transactions"
        />
      </div>
    </div>
  );
}
