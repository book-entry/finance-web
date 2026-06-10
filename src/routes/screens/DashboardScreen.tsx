import { useNavigate } from '@tanstack/react-router';
import { Page } from '../../components/shell/Page';
import { TopBar } from '../../components/shell/TopBar';
import { Icon } from '../../components/icons/Icon';
import { UncategorisedBanner } from '../../components/dashboard/UncategorisedBanner';
import { StatsRow } from '../../components/dashboard/StatsRow';
import { SpendCategoryDonut } from '../../components/dashboard/SpendCategoryDonut';
import { MonthlyTrendChart } from '../../components/dashboard/MonthlyTrendChart';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { CategoryBreakdown } from '../../components/reports/CategoryBreakdown';
import '../../components/reports/reports.css';
import { useReportsSummary } from '../../hooks/queries/useReportsSummary';
import { useTransactions, useTransactionCounts } from '../../hooks/queries/useTransactions';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { useCategories } from '../../hooks/queries/useCategories';
import { useMe } from '../../hooks/queries/useMe';
import '../../components/dashboard/dashboard.css';

export function DashboardScreen() {
  const navigate = useNavigate();

  const summaryQuery = useReportsSummary({ range: 'month' });
  const recentTxnQuery = useTransactions({ size: 6 });
  const countsQuery = useTransactionCounts();
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const meQuery = useMe();

  const summary = summaryQuery.data;
  const uncategorisedCount = countsQuery.data?.uncategorized ?? 0;
  const firstName = meQuery.data?.displayName?.trim().split(/\s+/)[0] ?? null;

  return (
    <>
      <TopBar
        title={firstName ? `Hi, ${firstName} 👋` : 'Hi 👋'}
        breadcrumb="Overview"
        actions={
          <>
            <button
              type="button"
              className="btn"
              onClick={() => void navigate({ to: '/import' })}
            >
              <Icon.Import /> Import
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void navigate({ to: '/transactions' })}
            >
              <Icon.Plus /> Add transaction
            </button>
          </>
        }
      />
      <Page>
        <UncategorisedBanner count={uncategorisedCount} />

        {summaryQuery.isError ? (
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: 'var(--danger-soft)',
              border: '1px solid var(--danger)',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span>Couldn't load dashboard data.</span>
            <button
              type="button"
              className="btn"
              onClick={() => void summaryQuery.refetch()}
            >
              Retry
            </button>
          </div>
        ) : summary == null ? (
          <DashboardSkeleton />
        ) : (
          <>
            {summary.currency == null && summary.netWorth.current == null ? (
              <div className="dash-mix-notice">
                Mixed currencies in your transactions — totals can't be
                summed honestly until FX conversion lands. Per-currency
                breakdown is on the backlog.
              </div>
            ) : null}

            <StatsRow summary={summary} />

            <div className="dash-card" style={{ marginBottom: 18 }}>
              <div className="dash-card-head">
                <div>
                  <h2>Income vs spend</h2>
                  <div className="sub">Last 12 months</div>
                </div>
              </div>
              <MonthlyTrendChart
                income={summary.incomeByMonth}
                spend={summary.spendByMonth}
              />
            </div>

            <div className="dash-category-grid">
              <SpendCategoryDonut
                spendByCategory={summary.spendByCategory}
                categories={categoriesQuery.data ?? []}
              />
              <CategoryBreakdown
                spendByCategory={summary.spendByCategory}
                categories={categoriesQuery.data ?? []}
                limit={5}
                title="Top categories"
                subtitle="By share of this period's spend"
              />
            </div>

            <RecentActivity
              transactions={recentTxnQuery.data?.data ?? []}
              accounts={accountsQuery.data ?? []}
            />
          </>
        )}
      </Page>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="dash-stat-row">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card">
            <span className="dash-skeleton" style={{ width: 80, height: 12 }}>
              &nbsp;
            </span>
            <span
              className="dash-skeleton"
              style={{ width: 120, height: 36, marginTop: 10 }}
            >
              &nbsp;
            </span>
          </div>
        ))}
      </div>
      <div className="dash-card" style={{ marginBottom: 18 }}>
        <span className="dash-skeleton" style={{ width: 140, height: 16 }}>
          &nbsp;
        </span>
        <div style={{ marginTop: 18 }}>
          <span
            className="dash-skeleton"
            style={{ width: '100%', height: 160 }}
          >
            &nbsp;
          </span>
        </div>
      </div>
      <div className="dash-category-grid">
        <div className="dash-card">
          <span className="dash-skeleton" style={{ width: 140, height: 16 }}>
            &nbsp;
          </span>
          <div
            style={{ marginTop: 18, display: 'grid', placeItems: 'center' }}
          >
            <span
              className="dash-skeleton"
              style={{ width: 170, height: 170, borderRadius: '50%' }}
            >
              &nbsp;
            </span>
          </div>
        </div>
        <div className="dash-card">
          <span className="dash-skeleton" style={{ width: 140, height: 16 }}>
            &nbsp;
          </span>
          <div
            style={{
              marginTop: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="dash-skeleton"
                style={{ width: '100%', height: 28 }}
              >
                &nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
