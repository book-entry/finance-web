import { formatHKD } from '../../lib/money';
import { merchantColor, merchantInitials } from '../../lib/merchantColor';
import type { MerchantSpend } from '../../api/reports';

type Props = {
  merchants: MerchantSpend[];
};

export function TopMerchantsList({ merchants }: Props) {
  return (
    <div className="dash-card">
      <div className="dash-card-head">
        <div>
          <h2>Top merchants</h2>
          <div className="sub">Where you spent most this period</div>
        </div>
      </div>
      {merchants.length === 0 ? (
        <div className="dash-empty">
          No outgoing transactions in this period — try widening the range.
        </div>
      ) : (
        <div className="reports-merchant-list">
          {merchants.map((m) => (
            <div key={m.description} className="row">
              <div
                className="merch-ico"
                style={{ background: merchantColor(m.description) }}
                aria-hidden
              >
                {merchantInitials(m.description)}
              </div>
              <div className="name">
                {m.description}
                <span className="meta">
                  · {m.txnCount} {m.txnCount === 1 ? 'txn' : 'txns'}
                </span>
              </div>
              <div className="amt">{formatHKD(-m.total)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
