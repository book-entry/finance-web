import { Icon } from '../icons/Icon';

type BulkActionBarProps = {
  count: number;
  busy: boolean;
  onCategorize: () => void;
  onDelete: () => void;
  onClear: () => void;
};

export function BulkActionBar({
  count,
  busy,
  onCategorize,
  onDelete,
  onClear,
}: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div className="bulk-bar" role="region" aria-label="Bulk actions">
      <span className="count">{count} selected</span>
      <button
        type="button"
        className="bulk-btn"
        onClick={onCategorize}
        disabled={busy}
      >
        <Icon.Tags /> Categorize
      </button>
      <span className="sep" />
      <button
        type="button"
        className="bulk-btn danger"
        onClick={onDelete}
        disabled={busy}
      >
        <Icon.X /> Delete
      </button>
      <span className="sep" />
      <button
        type="button"
        className="bulk-btn"
        onClick={onClear}
        disabled={busy}
      >
        Clear
      </button>
    </div>
  );
}
