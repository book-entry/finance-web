/**
 * Used by Reports / Settings screens that are still stubs. When those
 * screens ship for real, the import is removed and so is this file.
 */
export function PlaceholderCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: 32,
        marginTop: 4,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 8, color: 'var(--text-dim)', fontSize: 13.5 }}>
        {subtitle}
      </div>
    </div>
  );
}
