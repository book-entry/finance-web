type BrandProps = {
  size?: number;
  hideName?: boolean;
};

export function Brand({ size = 30, hideName = false }: BrandProps) {
  return (
    <div className="brand">
      <div className="brand-mark" style={{ width: size, height: size }}>
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="M4 18 L9 12 L13 15 L20 6" />
          <circle cx="20" cy="6" r="1.2" fill="currentColor" />
        </svg>
      </div>
      {!hideName && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div className="brand-name">Splitwallet</div>
          <div className="brand-sub">Joint finances</div>
        </div>
      )}
    </div>
  );
}
