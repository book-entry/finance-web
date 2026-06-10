import type { Transaction } from '../../api/transactions';
import type { Account } from '../../api/accounts';
import type { Category } from '../../api/categories';
import { CategoryChip } from './CategoryChip';
import { Check } from './Check';
import { merchantColor, merchantInitials } from '../../lib/merchantColor';
import { displayName, formatTxnAmount, signedAmount } from '../../lib/transactions';
import { gradientFor } from '../../lib/accounts';

type TransactionRowProps = {
  transaction: Transaction;
  selected: boolean;
  onToggleSelect: () => void;
  onOpenDetail: () => void;
  onCategorize: () => void;
  account: Account | undefined;
  category: Category | null;
};

export function TransactionRow({
  transaction,
  selected,
  onToggleSelect,
  onOpenDetail,
  onCategorize,
  account,
  category,
}: TransactionRowProps) {
  const name = displayName(transaction);
  const isPositive = signedAmount(transaction) > 0;

  return (
    <div
      role="row"
      className={'txn-row' + (selected ? ' selected' : '')}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpenDetail();
      }}
      tabIndex={0}
    >
      <Check
        on={selected}
        onChange={onToggleSelect}
        ariaLabel={`Select transaction ${name}`}
      />
      <div
        className="merch-ico"
        style={{ background: merchantColor(name) }}
        aria-hidden="true"
      >
        {merchantInitials(name)}
      </div>
      <div className="merch-body">
        <div className="merch-name">{name}</div>
        <div className="merch-meta">
          {account ? (
            <>
              <span
                className="bank-dot"
                style={{ background: extractAccent(gradientFor(account)) }}
              />
              <span>{account.accountName}</span>
            </>
          ) : (
            <span>Unknown account</span>
          )}
          {transaction.reference ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="note">{transaction.reference}</span>
            </>
          ) : null}
        </div>
      </div>
      <CategoryChip category={category} onClick={onCategorize} />
      <div className={'amt' + (isPositive ? ' pos' : '')}>
        {formatTxnAmount(transaction)}
      </div>
    </div>
  );
}

/** Pull the first hex colour out of a `linear-gradient(...)` for the bank dot. */
function extractAccent(gradient: string): string {
  const match = gradient.match(/#[0-9a-fA-F]{6}/);
  return match?.[0] ?? 'var(--text-faint)';
}
