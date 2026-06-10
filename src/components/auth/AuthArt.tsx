import { Icon } from '../icons/Icon';

export function AuthArt() {
  return (
    <div className="auth-art" aria-hidden="true">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="auth-art-content">
        <span className="auth-pill">
          <Icon.Sparkles /> Made for couples & roommates
        </span>
        <div className="auth-art-tag" style={{ marginTop: 22 }}>
          Every <em>ParknShop</em>, every <em>MTR top-up</em>, every <em>HSBC</em> line — <em>tagged.</em>
        </div>
      </div>

      <div className="auth-art-content" style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
        <div className="auth-preview-card">
          <div className="merch-ico" style={{ background: '#F97316' }}>
            P
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>ParknShop</div>
            <div style={{ fontSize: 11.5, opacity: 0.75 }}>Groceries · HSBC One</div>
          </div>
          <div className="merch-amt">−HK$384.20</div>
        </div>
        <div className="auth-preview-card">
          <div className="merch-ico" style={{ background: '#10B981' }}>
            L
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>Salary — Lumina Ltd.</div>
            <div style={{ fontSize: 11.5, opacity: 0.75 }}>Income · HSBC One</div>
          </div>
          <div className="merch-amt" style={{ color: '#34D399' }}>
            +HK$56,800
          </div>
        </div>
      </div>
    </div>
  );
}
