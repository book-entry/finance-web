import { Popconfirm } from 'antd';
import type { Account } from '../../api/accounts';
import { currentBalance, gradientFor, lastFour } from '../../lib/accounts';
import { formatHKD } from '../../lib/money';

type BankCardProps = {
  account: Account;
  /** Pre-computed signed delta per account from `balanceDeltasByAccount`. */
  deltas?: Map<string, number>;
  onView?: (account: Account) => void;
  /** When provided, renders an overflow menu that lets the user soft-close the account. */
  onClose?: (account: Account) => void;
  closing?: boolean;
};

function formatMoney(amount: number, currency: string): string {
  if (currency === 'HKD') return formatHKD(amount);
  const formatted = new Intl.NumberFormat('en-HK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return `${amount < 0 ? '−' : ''}${currency} ${formatted}`;
}

export function BankCard({ account, deltas, onView, onClose, closing }: BankCardProps) {
  const last4 = lastFour(account.accountCode);
  const isClosed = account.status === 'CLOSED';
  const balance = currentBalance(account, deltas);
  const showCloseAction = !isClosed && onClose;

  return (
    <div
      className="bank-card-wrap"
      style={{ position: 'relative' }}
    >
      <button
        type="button"
        className="bank-card"
        style={{ ['--bank-grad' as string]: gradientFor(account) }}
        onClick={() => onView?.(account)}
        aria-label={`${account.bankName} — ${account.accountName}`}
      >
        <div>
          <div className="bank-top">
            <span className="bank-name">{account.bankName}</span>
            <span className={'linked-pill' + (isClosed ? ' closed-pill' : '')}>
              <span className="dot" /> {isClosed ? 'Closed' : 'Active'}
            </span>
          </div>
          <div className="bank-account-name">{account.accountName}</div>
        </div>
        <div>
          <div className="bank-balance">
            {formatMoney(balance, account.currency)}
          </div>
          <div className="bank-foot" style={{ marginTop: 10 }}>
            <span className="bank-num">
              {last4 ? `•••• •••• •••• ${last4}` : account.currency}
            </span>
            <span className="view-pill">View →</span>
          </div>
        </div>
      </button>

      {showCloseAction ? (
        <Popconfirm
          title="Close this account?"
          description={
            <div style={{ maxWidth: 260, fontSize: 12.5, color: 'var(--text-2)' }}>
              Marks <strong>{account.accountName}</strong> as closed. Transactions
              and balances stay intact; this can be undone later by re-opening on
              the backend.
            </div>
          }
          okText="Close account"
          cancelText="Cancel"
          okButtonProps={{ danger: true, loading: closing }}
          onConfirm={() => onClose?.(account)}
          placement="bottomRight"
        >
          <button
            type="button"
            className="bank-card-kebab"
            aria-label={`Close ${account.accountName}`}
            onClick={(e) => e.stopPropagation()}
            disabled={closing}
          >
            ⋯
          </button>
        </Popconfirm>
      ) : null}
    </div>
  );
}
