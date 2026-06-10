import { useMemo, useState, type CSSProperties } from 'react';
import { Modal } from 'antd';
import type { Category } from '../../api/categories';
import { useCategories } from '../../hooks/queries/useCategories';
import { styleForCategory } from '../../lib/categoryStyles';
import { Icon } from '../icons/Icon';

/**
 * What the user picked in the modal. Either an existing category (server has
 * the id already) or a brand-new name we want the backend to create inline
 * via {@code PATCH /v1/transactions/{id}/category { categoryName }}.
 */
export type CategoryChoice =
  | { kind: 'existing'; category: Category }
  | { kind: 'new'; name: string };

type CategoryPickerModalProps = {
  open: boolean;
  selectedId?: string | null;
  title?: string;
  onPick: (choice: CategoryChoice) => void;
  onClose: () => void;
};

const PLACEHOLDER_COLOR = '#94A3B8';

export function CategoryPickerModal({
  open,
  selectedId,
  title = 'Set category',
  onPick,
  onClose,
}: CategoryPickerModalProps) {
  const { data: categories } = useCategories();
  const [query, setQuery] = useState('');

  const trimmedQuery = query.trim();

  const filtered = useMemo(() => {
    if (!categories) return [];
    if (!trimmedQuery) return categories;
    const q = trimmedQuery.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, trimmedQuery]);

  const exactMatch = useMemo(() => {
    if (!trimmedQuery || !categories) return null;
    const q = trimmedQuery.toLowerCase();
    return categories.find((c) => c.name.toLowerCase() === q) ?? null;
  }, [trimmedQuery, categories]);

  const canCreate = trimmedQuery.length > 0 && !exactMatch;

  const pickExisting = (category: Category) => {
    onPick({ kind: 'existing', category });
    onClose();
  };
  const pickNew = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onPick({ kind: 'new', name: trimmed });
    onClose();
  };

  return (
    <Modal
      open={open}
      title={title}
      footer={null}
      onCancel={onClose}
      destroyOnHidden
      width={460}
      afterOpenChange={(o) => {
        if (!o) setQuery('');
      }}
    >
      <div className="txn-search" style={{ width: '100%', marginBottom: 12 }}>
        <Icon.Search />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Pressing Enter when the search has no exact match creates one inline.
            if (e.key === 'Enter' && canCreate) {
              e.preventDefault();
              pickNew(trimmedQuery);
            }
          }}
          placeholder="Search or type a new category name…"
          aria-label="Search or create a category"
        />
      </div>

      <div className="cat-picker-grid">
        {filtered.map((category) => {
          const style = styleForCategory(category);
          const isSelected = category.categoryId === selectedId;
          return (
            <button
              key={category.categoryId}
              type="button"
              className={'picker-item' + (isSelected ? ' selected' : '')}
              onClick={() => pickExisting(category)}
            >
              <span className="chip-ico" style={{ background: style.color }}>
                {style.glyph}
              </span>
              <span style={{ fontSize: 13 }}>{category.name}</span>
            </button>
          );
        })}

        {canCreate ? (
          <button
            type="button"
            className="picker-item picker-create"
            onClick={() => pickNew(trimmedQuery)}
          >
            <span
              className="chip-ico"
              style={{
                background: PLACEHOLDER_COLOR,
                color: '#fff',
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              +
            </span>
            <span style={{ fontSize: 13 }}>
              Create&nbsp;<strong>"{trimmedQuery}"</strong>
            </span>
          </button>
        ) : null}
      </div>

      {filtered.length === 0 && !canCreate ? (
        <div
          style={{
            padding: 18,
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: 12.5,
          }}
        >
          {trimmedQuery
            ? 'No matches. Type any name to create it inline.'
            : 'No categories yet — type a name above to create one.'}
        </div>
      ) : null}

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
          color: 'var(--text-dim)',
          fontSize: 11.5,
        }}
      >
        Press <kbd style={kbdStyle}>Enter</kbd> to create a new category from the
        search box.
      </div>
    </Modal>
  );
}

const kbdStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  padding: '1px 6px',
  borderRadius: 4,
  background: 'var(--surface-2)',
  border: '1px solid var(--border-strong)',
};
