import type { MonthlyTotal } from '../../api/reports';
import { formatHKDCompact } from '../../lib/money';

type Props = {
  income: MonthlyTotal[];
  spend: MonthlyTotal[];
};

/**
 * Twin-bar chart: one income bar (green) and one spend bar (primary purple)
 * per month for the last 12 months. We render plain SVG / divs — bringing in
 * @ant-design/charts here would add ~140KB to first paint for a chart this
 * simple, and the design language already matches the rest of the dashboard.
 */
export function MonthlyTrendChart({ income, spend }: Props) {
  const months = mergeByMonth(income, spend);
  const max = months.reduce(
    (m, x) => Math.max(m, x.income, x.spend),
    0,
  );

  if (months.length === 0 || max === 0) {
    return (
      <div className="dash-empty">
        No transactions in the last 12 months yet — import a statement to see
        the trend.
      </div>
    );
  }

  return (
    <>
      <div className="dash-bars">
        {months.map((m) => (
          <div
            key={m.month}
            className="dash-bar-col"
            title={
              `${m.month} · income ${formatHKDCompact(m.income)} · ` +
              `spend ${formatHKDCompact(m.spend)}`
            }
          >
            <div className="stack">
              <div
                className="bar income"
                style={{
                  height: `${(m.income / max) * 100}%`,
                  minHeight: m.income > 0 ? 2 : 0,
                }}
              />
              <div
                className="bar spend"
                style={{
                  height: `${(m.spend / max) * 100}%`,
                  minHeight: m.spend > 0 ? 2 : 0,
                }}
              />
            </div>
            <span className="tick">{tickLabel(m.month)}</span>
          </div>
        ))}
      </div>
      <div className="dash-bars-legend">
        <span>
          <span
            className="swatch"
            style={{ background: 'var(--success)', opacity: 0.85 }}
          />
          Income
        </span>
        <span>
          <span className="swatch" style={{ background: 'var(--primary)' }} />
          Spend
        </span>
      </div>
    </>
  );
}

/** "2025-08" → "Aug" — purely cosmetic for the x-axis ticks. */
function tickLabel(yyyymm: string): string {
  const [, mm] = yyyymm.split('-');
  const names = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const idx = Number(mm) - 1;
  return names[idx] ?? yyyymm;
}

type Row = { month: string; income: number; spend: number };

function mergeByMonth(
  income: MonthlyTotal[],
  spend: MonthlyTotal[],
): Row[] {
  const map = new Map<string, Row>();
  income.forEach((b) => {
    map.set(b.month, {
      month: b.month,
      income: b.total,
      spend: 0,
    });
  });
  spend.forEach((b) => {
    const existing = map.get(b.month);
    if (existing) existing.spend = b.total;
    else map.set(b.month, { month: b.month, income: 0, spend: b.total });
  });
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}
