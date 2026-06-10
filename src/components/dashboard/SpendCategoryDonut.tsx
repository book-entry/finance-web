import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Icon } from '../icons/Icon';
import { formatHKDCompact } from '../../lib/money';
import { styleForCategory } from '../../lib/categoryStyles';
import type { CategorySpend } from '../../api/reports';
import type { Category } from '../../api/categories';

type Props = {
  spendByCategory: CategorySpend[];
  /** Used to colour slices via {@link styleForCategory}. */
  categories: Category[];
  totalLabel?: string;
};

const UNCATEGORISED_COLOR = '#64748B';

export function SpendCategoryDonut({
  spendByCategory,
  categories,
  totalLabel = 'Spent',
}: Props) {
  const navigate = useNavigate();
  const catById = useMemo(
    () => new Map(categories.map((c) => [c.categoryId, c])),
    [categories],
  );

  const slices = useMemo(
    () =>
      spendByCategory
        .filter((s) => s.total > 0)
        .map((s) => {
          const cat = s.categoryId ? catById.get(s.categoryId) : null;
          return {
            id: s.categoryId ?? 'uncategorised',
            label: s.name ?? (s.categoryId == null ? 'Uncategorised' : 'Deleted'),
            value: s.total,
            color: cat
              ? styleForCategory(cat).color
              : s.categoryId == null
                ? UNCATEGORISED_COLOR
                : '#94A3B8',
          };
        }),
    [spendByCategory, catById],
  );

  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <div className="dash-card">
      <div className="dash-card-head">
        <div>
          <h2>Spending by category</h2>
          <div className="sub">Top categories this period</div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => void navigate({ to: '/reports' })}
        >
          View report <Icon.ChevronRight />
        </button>
      </div>
      {slices.length === 0 ? (
        <div className="dash-empty">
          No spending in this period yet — once you import or add a few
          transactions the donut lights up.
        </div>
      ) : (
        <div className="dash-donut-row">
          <div className="dash-donut-wrap">
            <DonutSvg slices={slices} />
            <div className="center">
              <div>
                <div className="label">{totalLabel}</div>
                <div className="value">{formatHKDCompact(total)}</div>
              </div>
            </div>
          </div>
          <div className="dash-legend">
            {slices.slice(0, 5).map((s) => (
              <div key={s.id} className="legend-row">
                <span
                  className="swatch"
                  style={{ background: s.color }}
                  aria-hidden
                />
                <span className="name">{s.label}</span>
                <span className="amt">{formatHKDCompact(s.value)}</span>
              </div>
            ))}
            {slices.length > 5 ? (
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-dim)',
                  marginTop: 4,
                }}
              >
                + {slices.length - 5} more
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SVG donut chart. Each slice is a stroke-dashoffset arc on the same circle
 * so we don't need a charting library for one chart. 170×170 viewBox, 22px
 * stroke matches the design reference dimensions.
 */
function DonutSvg({
  slices,
}: {
  slices: { id: string; value: number; color: string }[];
}) {
  const size = 170;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((s, x) => s + x.value, 0);

  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--surface-2)"
        strokeWidth={stroke}
      />
      {slices.map((s) => {
        const portion = total === 0 ? 0 : s.value / total;
        const dash = portion * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={s.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}
