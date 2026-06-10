import type { CanonicalRow } from '../../lib/csv';

type PreviewStepProps = {
  rows: CanonicalRow[];
  errors: { row: number; reason: string }[];
};

export function PreviewStep({ rows, errors }: PreviewStepProps) {
  return (
    <div className="wiz-card">
      <h2>Preview &amp; confirm</h2>
      <div className="sub">
        <strong style={{ color: 'var(--text)' }}>{rows.length}</strong> ready to import
        {errors.length ? (
          <>
            {' '}
            ·{' '}
            <strong style={{ color: 'var(--danger)' }}>
              {errors.length} row{errors.length === 1 ? '' : 's'} rejected
            </strong>
          </>
        ) : null}
        . Failed rows stay in your file — fix them and re-import.
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="preview-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Reference</th>
              <th>Category</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((r, i) => (
              <tr key={i}>
                <td>{r.transactionDate}</td>
                <td>{r.description}</td>
                <td>{r.entryType}</td>
                <td>{r.reference || '—'}</td>
                <td>{r.categoryName || '—'}</td>
                <td className="num">
                  {r.entryType === 'DEBIT' ? '−' : '+'}
                  {r.amount} {r.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 8 ? (
        <div
          style={{
            marginTop: 10,
            color: 'var(--text-dim)',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          + {rows.length - 8} more transaction{rows.length - 8 === 1 ? '' : 's'}
        </div>
      ) : null}

      {errors.length ? (
        <div className="error-card">
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--danger)',
              marginBottom: 8,
            }}
          >
            Rejected
          </div>
          {errors.slice(0, 10).map((e, i) => (
            <div className="row" key={i}>
              Row {e.row}: {e.reason}
            </div>
          ))}
          {errors.length > 10 ? (
            <div
              style={{
                color: 'var(--danger)',
                fontSize: 12,
                marginTop: 6,
              }}
            >
              + {errors.length - 10} more
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
