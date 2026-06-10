import { useMemo, useState } from 'react';
import { message, Spin } from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { Page } from '../../components/shell/Page';
import { TopBar } from '../../components/shell/TopBar';
import { BankCard } from '../../components/accounts/BankCard';
import { LinkAccountCard } from '../../components/accounts/LinkAccountCard';
import { LinkAccountModal } from '../../components/accounts/LinkAccountModal';
import '../../components/accounts/accounts.css';
import { useAccounts, useCloseAccount } from '../../hooks/queries/useAccounts';
import { useTransactionBalances } from '../../hooks/queries/useTransactions';
import { useTxnFiltersStore } from '../../stores/txnFiltersStore';
import { ApiError } from '../../api/types';
import type { Account } from '../../api/accounts';
import {
  balanceDeltasFromBalancesResponse,
  totalsFor,
} from '../../lib/accounts';
import { Icon } from '../../components/icons/Icon';

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'neg';
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={'stat-value' + (tone === 'neg' ? ' neg' : '')}>
        <span className="currency">HK$</span>
        {new Intl.NumberFormat('en-HK', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Math.abs(value))}
      </div>
    </div>
  );
}

export function AccountsScreen() {
  const navigate = useNavigate();
  const setTxnAccountFilter = useTxnFiltersStore((s) => s.setAccount);

  const [linkOpen, setLinkOpen] = useState(false);
  const { data, isLoading, isError, error, refetch, isFetching } = useAccounts();
  const balancesQuery = useTransactionBalances();
  const closeAccount = useCloseAccount();

  const viewAccountTransactions = (accountId: string) => {
    setTxnAccountFilter(accountId);
    void navigate({ to: '/transactions' });
  };

  const handleClose = async (account: Account) => {
    try {
      await closeAccount.mutateAsync(account.accountId);
      message.success(`${account.accountName} closed`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not close account';
      message.error(msg);
    }
  };

  const deltas = useMemo(
    () => balanceDeltasFromBalancesResponse(balancesQuery.data),
    [balancesQuery.data],
  );
  const totals = useMemo(() => totalsFor(data ?? [], deltas), [data, deltas]);
  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => a.bankName.localeCompare(b.bankName));
  }, [data]);

  return (
    <>
      <TopBar
        title="Accounts"
        breadcrumb="Banks"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setLinkOpen(true)}
          >
            <Icon.Plus /> Add account
          </button>
        }
      />
      <Page>
        <div className="accounts-stat-row">
          <StatCard label="Total assets" value={totals.assets} />
          <StatCard
            label="Total debt"
            value={totals.debt}
            tone={totals.debt > 0 ? 'neg' : undefined}
          />
          <StatCard label="Net" value={totals.net} />
        </div>

        <div className="accounts-section-head">
          <h2>Your accounts</h2>
          <span className="muted">
            {isFetching
              ? 'Refreshing…'
              : balancesQuery.isLoading
                ? 'Loading balances…'
                : balancesQuery.isError
                  ? 'Balance lookup failed — showing opening balances only'
                  : balancesQuery.data
                    ? `Balances as of ${balancesQuery.data.asOf}`
                    : 'Balances live from transactions'}
          </span>
        </div>

        {isLoading ? (
          <div className="accounts-empty">
            <Spin />
            <div style={{ marginTop: 14 }}>Loading accounts…</div>
          </div>
        ) : isError ? (
          <div className="accounts-empty">
            <div className="ico">!</div>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>
              Couldn't load accounts
            </div>
            <div style={{ marginTop: 8 }}>
              {(error as Error)?.message ?? 'Try again.'}
            </div>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 16 }}
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="bank-grid">
            {sorted.map((account) => (
              <BankCard
                key={account.accountId}
                account={account}
                deltas={deltas}
                onView={(a) => viewAccountTransactions(a.accountId)}
                onClose={handleClose}
                closing={
                  closeAccount.isPending &&
                  closeAccount.variables === account.accountId
                }
              />
            ))}
            <LinkAccountCard onClick={() => setLinkOpen(true)} />
            {sorted.length === 0 ? (
              <div
                className="accounts-empty"
                style={{ gridColumn: '1 / -1', marginTop: 0 }}
              >
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}
                >
                  No accounts yet
                </div>
                <div style={{ marginTop: 6 }}>
                  Link your first bank or e-wallet to start tracking transactions.
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Page>

      <LinkAccountModal open={linkOpen} onClose={() => setLinkOpen(false)} />
    </>
  );
}
