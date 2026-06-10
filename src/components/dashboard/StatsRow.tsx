import { Icon } from '../icons/Icon';
import { formatHKDCompact } from '../../lib/money';
import type { ReportsSummary } from '../../api/reports';

type Props = {
  summary: ReportsSummary;
};

/**
 * Period income/spend come from the trend arrays: the last bucket is "this
 * month" so far (or the current YTD bucket aggregated, depending on range —
 * see TODO below). For v1 we keep it simple and always show the last
 * monthly bucket, which is the right reading for `range=month` and a
 * "this month so far" preview for `range=year`.
 */
export function StatsRow({ summary }: Props) {
  const periodIncome =
    summary.incomeByMonth[summary.incomeByMonth.length - 1]?.total ?? 0;
  const periodSpend =
    summary.spendByMonth[summary.spendByMonth.length - 1]?.total ?? 0;
  const savingsRate =
    periodIncome > 0
      ? Math.max(0, Math.round((1 - periodSpend / periodIncome) * 100))
      : null;

  const periodLabel = summary.range === 'year' ? 'this month' : 'this month';

  return (
    <div className="dash-stat-row">
      <StatCard
        label="Net worth"
        primary={summary.netWorth.current}
        delta={summary.netWorth.delta}
        deltaSuffix={summary.range === 'year' ? 'vs last year' : 'vs last month'}
      />
      <StatCard
        label={`Spent ${periodLabel}`}
        primary={periodSpend}
      />
      <StatCard
        label={`Income ${periodLabel}`}
        primary={periodIncome}
      />
      <SavingsCard rate={savingsRate} />
    </div>
  );
}

function StatCard({
  label,
  primary,
  delta,
  deltaSuffix,
}: {
  label: string;
  primary: number | null;
  delta?: number | null;
  deltaSuffix?: string;
}) {
  const primaryText =
    primary == null ? '—' : formatHKDCompact(primary);
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        <span className="currency">HK$</span>
        {primary == null ? '—' : primaryText.replace(/^HK\$/, '')}
      </div>
      {delta != null && deltaSuffix ? (
        <Delta value={delta} suffix={deltaSuffix} />
      ) : null}
    </div>
  );
}

function SavingsCard({ rate }: { rate: number | null }) {
  return (
    <div className="stat-card">
      <div className="stat-label">Savings rate</div>
      <div className="stat-value">
        {rate == null ? '—' : rate}
        {rate == null ? null : (
          <span
            style={{
              fontSize: '0.5em',
              color: 'var(--text-dim)',
              marginLeft: 4,
            }}
          >
            %
          </span>
        )}
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: 'var(--surface-2)',
          overflow: 'hidden',
          marginTop: 8,
        }}
      >
        <div
          style={{
            width: `${rate ?? 0}%`,
            height: '100%',
            background: 'var(--primary)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

function Delta({ value, suffix }: { value: number; suffix: string }) {
  if (value === 0) {
    return (
      <div className="dash-stat-delta flat">flat {suffix}</div>
    );
  }
  const up = value > 0;
  return (
    <div className={'dash-stat-delta ' + (up ? 'up' : 'down')}>
      {up ? <Icon.Up /> : <Icon.Down />} {up ? '+' : '−'}
      {formatHKDCompact(Math.abs(value)).replace(/^HK\$/, 'HK$')} {suffix}
    </div>
  );
}
