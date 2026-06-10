import { useNavigate } from '@tanstack/react-router';
import { Icon } from '../icons/Icon';
import { formatHKD } from '../../lib/money';
import { merchantColor, merchantInitials } from '../../lib/merchantColor';
import type { Transaction } from '../../api/transactions';
import type { Account } from '../../api/accounts';

type Props = {
  transactions: Transaction[];
  accounts: Account[];
};

export function RecentActivity({ transactions, accounts }: Props) {
  const navigate = useNavigate();
  const acctById = new Map(accounts.map((a) => [a.accountId, a]));

  return (
    <div className="dash-card">
      <div className="dash-card-head">
        <div>
          <h2>Recent activity</h2>
          <div className="sub">Latest {transactions.length} transactions</div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => void navigate({ to: '/transactions' })}
        >
          All transactions <Icon.ChevronRight />
        </button>
      </div>
      {transactions.length === 0 ? (
        <div className="dash-empty">
          No transactions yet — import a statement or add one manually.
        </div>
      ) : (
        <div className="dash-recent">
          {transactions.map((t) => {
            const acct = acctById.get(t.accountId);
            const name = t.description?.trim() || 'No description';
            const signed = t.entryType === 'CREDIT' ? t.amount : -t.amount;
            return (
              <div key={t.transactionId} className="recent-row">
                <div
                  className="merch-ico"
                  style={{ background: merchantColor(name) }}
                  aria-hidden
                >
                  {merchantInitials(name)}
                </div>
                <div className="merch-body">
                  <div className="name">{name}</div>
                  <div className="meta">
                    {t.transactionDate}
                    {acct ? ` · ${acct.accountName}` : ''}
                  </div>
                </div>
                {t.category ? (
                  <span className="pill">{t.category.name}</span>
                ) : (
                  <span className="pill">Uncategorised</span>
                )}
                <div className={'amt ' + (signed > 0 ? 'pos' : 'neg')}>
                  {formatHKD(signed, { alwaysSign: true })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
