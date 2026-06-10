import type { Account } from '../../api/accounts';
import type { Category } from '../../api/categories';
import type { Transaction } from '../../api/transactions';
import { TransactionRow } from './TransactionRow';

type DayGroupProps = {
  label: string;
  net: string;
  transactions: Transaction[];
  selectedIds: Set<string>;
  accountsById: Map<string, Account>;
  categoriesById: Map<string, Category>;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (transaction: Transaction) => void;
  onCategorize: (transaction: Transaction) => void;
};

export function DayGroup({
  label,
  net,
  transactions,
  selectedIds,
  accountsById,
  categoriesById,
  onToggleSelect,
  onOpenDetail,
  onCategorize,
}: DayGroupProps) {
  return (
    <section aria-label={`Transactions on ${label}`}>
      <div className="txn-day-header">
        <span className="day-num">{label}</span>
        <span>
          {transactions.length} item{transactions.length === 1 ? '' : 's'}
        </span>
        <span className="day-total">{net}</span>
      </div>
      {transactions.map((t) => (
        <TransactionRow
          key={t.transactionId}
          transaction={t}
          selected={selectedIds.has(t.transactionId)}
          onToggleSelect={() => onToggleSelect(t.transactionId)}
          onOpenDetail={() => onOpenDetail(t)}
          onCategorize={() => onCategorize(t)}
          account={accountsById.get(t.accountId)}
          category={
            t.category ? categoriesById.get(t.category.id) ?? toCategory(t.category) : null
          }
        />
      ))}
    </section>
  );
}

/** Fall back to a synthetic Category if the categories query hasn't yet refreshed. */
function toCategory(ref: NonNullable<Transaction['category']>): Category {
  return {
    categoryId: ref.id,
    name: ref.name,
    colourHex: null,
    createdAt: new Date(0).toISOString(),
  };
}
