import { useMemo } from 'react';
import { formatHKD } from '../../lib/money';
import { styleForCategory } from '../../lib/categoryStyles';
import type { CategorySpend } from '../../api/reports';
import type { Category } from '../../api/categories';

type Props = {
  spendByCategory: CategorySpend[];
  categories: Category[];
  /** Cap the visible rows. Percentages are still computed against the full set. */
  limit?: number;
  /** Override the card title — Dashboard uses a tighter label than Reports. */
  title?: string;
  /** Override the subtitle. */
  subtitle?: string;
};

const UNCATEGORISED_COLOR = '#64748B';
const DELETED_COLOR = '#94A3B8';

/**
 * Horizontal bars showing each category's share of the period's spend.
 * The percentage is computed against the visible total (sum of non-zero
 * buckets) so a single dominant row doesn't make the rest invisible.
 */
export function CategoryBreakdown({
  spendByCategory,
  categories,
  limit,
  title = 'Where the money went',
  subtitle,
}: Props) {
  const catById = useMemo(
    () => new Map(categories.map((c) => [c.categoryId, c])),
    [categories],
  );

  const allRows = useMemo(() => {
    const filtered = spendByCategory.filter((s) => s.total > 0);
    const total = filtered.reduce((s, x) => s + x.total, 0);
    return filtered.map((s) => {
      const cat = s.categoryId ? catById.get(s.categoryId) : null;
      return {
        id: s.categoryId ?? 'uncategorised',
        label: s.name ?? (s.categoryId == null ? 'Uncategorised' : 'Deleted'),
        value: s.total,
        pct: total === 0 ? 0 : (s.total / total) * 100,
        color: cat
          ? styleForCategory(cat).color
          : s.categoryId == null
            ? UNCATEGORISED_COLOR
            : DELETED_COLOR,
      };
    });
  }, [spendByCategory, catById]);

  const visibleRows = limit ? allRows.slice(0, limit) : allRows;
  const hidden = allRows.length - visibleRows.length;

  if (allRows.length === 0) {
    return (
      <div className="dash-card">
        <div className="dash-card-head">
          <div>
            <h2>{title}</h2>
            <div className="sub">No categorised spend yet</div>
          </div>
        </div>
        <div className="dash-empty">
          Categorise a few transactions to see this breakdown light up.
        </div>
      </div>
    );
  }

  const sub =
    subtitle ??
    `${allRows.length} categor${allRows.length === 1 ? 'y' : 'ies'} this period`;

  return (
    <div className="dash-card">
      <div className="dash-card-head">
        <div>
          <h2>{title}</h2>
          <div className="sub">{sub}</div>
        </div>
      </div>
      <div className="reports-breakdown">
        {visibleRows.map((r) => (
          <div key={r.id}>
            <div className="row">
              <span className="swatch" style={{ background: r.color }} />
              <span className="name">{r.label}</span>
              <span className="pct">{r.pct.toFixed(1)}%</span>
              <span className="amt">{formatHKD(-r.value)}</span>
            </div>
            <div className="bar">
              <div
                className="fill"
                style={{ width: `${r.pct}%`, background: r.color }}
              />
            </div>
          </div>
        ))}
        {hidden > 0 ? (
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-dim)',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            + {hidden} more
          </div>
        ) : null}
      </div>
    </div>
  );
}
