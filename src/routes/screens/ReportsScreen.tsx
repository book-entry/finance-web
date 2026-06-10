import { useState } from 'react';
import { Page } from '../../components/shell/Page';
import { TopBar } from '../../components/shell/TopBar';
import { MonthlyTrendChart } from '../../components/dashboard/MonthlyTrendChart';
import { TopMerchantsList } from '../../components/reports/TopMerchantsList';
import { CategoryBreakdown } from '../../components/reports/CategoryBreakdown';
import { useReportsSummary } from '../../hooks/queries/useReportsSummary';
import { useCategories } from '../../hooks/queries/useCategories';
import type { ReportsRange } from '../../api/reports';
import '../../components/dashboard/dashboard.css';
import '../../components/reports/reports.css';

export function ReportsScreen() {
  const [range, setRange] = useState<ReportsRange>('month');
  const summaryQuery = useReportsSummary({ range });
  const categoriesQuery = useCategories();
  const summary = summaryQuery.data;

  return (
    <>
      <TopBar
        title="Reports"
        breadcrumb="Insights"
        actions={
          <div className="reports-range-toggle">
            <button
              type="button"
              className={range === 'month' ? 'on' : ''}
              onClick={() => setRange('month')}
            >
              Month
            </button>
            <button
              type="button"
              className={range === 'year' ? 'on' : ''}
              onClick={() => setRange('year')}
            >
              Year
            </button>
          </div>
        }
      />
      <Page>
        {summaryQuery.isError ? (
          <ErrorPanel onRetry={() => void summaryQuery.refetch()} />
        ) : summary == null ? (
          <ReportsSkeleton />
        ) : (
          <>
            {summary.currency == null ? (
              <div className="dash-mix-notice">
                Mixed currencies in your transactions — totals are summed
                naively until FX conversion lands.
              </div>
            ) : null}

            <div className="reports-two-col">
              <div className="dash-card">
                <div className="dash-card-head">
                  <div>
                    <h2>Monthly trend</h2>
                    <div className="sub">Last 12 months · income vs spend</div>
                  </div>
                </div>
                <MonthlyTrendChart
                  income={summary.incomeByMonth}
                  spend={summary.spendByMonth}
                />
              </div>
              <TopMerchantsList merchants={summary.topMerchants} />
            </div>

            <CategoryBreakdown
              spendByCategory={summary.spendByCategory}
              categories={categoriesQuery.data ?? []}
            />
          </>
        )}
      </Page>
    </>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
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
      <span>Couldn't load report data.</span>
      <button type="button" className="btn" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div>
      <div className="reports-two-col">
        <div className="dash-card">
          <span className="dash-skeleton" style={{ width: 140, height: 16 }}>
            &nbsp;
          </span>
          <div style={{ marginTop: 18 }}>
            <span
              className="dash-skeleton"
              style={{ width: '100%', height: 200 }}
            >
              &nbsp;
            </span>
          </div>
        </div>
        <div className="dash-card">
          <span className="dash-skeleton" style={{ width: 140, height: 16 }}>
            &nbsp;
          </span>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="dash-skeleton"
                style={{ width: '100%', height: 30 }}
              >
                &nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="dash-card">
        <span className="dash-skeleton" style={{ width: 200, height: 16 }}>
          &nbsp;
        </span>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
  );
}
