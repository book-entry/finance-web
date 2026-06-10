import { useState } from 'react';
import { Spin, message } from 'antd';
import { Page } from '../../components/shell/Page';
import { TopBar } from '../../components/shell/TopBar';
import { ChipStyleToggle } from '../../components/categories/ChipStyleToggle';
import {
  CategoryCard,
  NewCategoryCard,
} from '../../components/categories/CategoryCard';
import { CategoryFormModal } from '../../components/categories/CategoryFormModal';
import { DeleteCategoryConfirm } from '../../components/categories/DeleteCategoryConfirm';
import {
  useBulkUpsertCategories,
  useCategories,
} from '../../hooks/queries/useCategories';
import { DEFAULT_CATEGORY_SEED } from '../../lib/categoryStyles';
import { Icon } from '../../components/icons/Icon';
import type { Category } from '../../api/categories';
import '../../components/categories/categories.css';

export function CategoriesScreen() {
  const { data: categories, isLoading, isError, error, refetch } = useCategories();
  const seed = useBulkUpsertCategories();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (category: Category) => {
    setEditing(category);
    setFormOpen(true);
  };

  const seedDefaults = async () => {
    try {
      const result = await seed.mutateAsync(DEFAULT_CATEGORY_SEED);
      message.success(
        `${result.created} category${result.created === 1 ? '' : 'ies'} added`,
      );
    } catch {
      message.error('Could not seed default categories.');
    }
  };

  const total = categories?.length ?? 0;

  return (
    <>
      <TopBar
        title="Categories"
        breadcrumb="Library"
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Icon.Plus /> New category
          </button>
        }
      />
      <Page>
        <div className="categories-head">
          <div className="head-left">
            <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>Style</span>
            <ChipStyleToggle />
          </div>
          <div className="head-right">
            {isLoading
              ? 'Loading…'
              : `${total} ${total === 1 ? 'category' : 'categories'}`}
          </div>
        </div>

        {!isLoading && !isError && total === 0 ? (
          <div className="cat-seed-banner">
            <span className="ico">
              <Icon.Sparkles />
            </span>
            <div className="copy">
              <div className="title">Start with 13 ready-made categories</div>
              <div className="sub">
                Groceries, Dining, Transport, Subscriptions and friends. You can
                rename or delete any of them later.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={seedDefaults}
              disabled={seed.isPending}
            >
              {seed.isPending ? 'Adding…' : 'Add defaults'}
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: 60 }}>
            <Spin />
          </div>
        ) : isError ? (
          <div
            style={{
              textAlign: 'center',
              padding: 48,
              color: 'var(--text-dim)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>
              Couldn't load categories
            </div>
            <div style={{ marginTop: 8 }}>
              {(error as Error)?.message ?? 'Try again.'}
            </div>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 14 }}
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="cat-grid">
            {(categories ?? []).map((c) => (
              <CategoryCard
                key={c.categoryId}
                category={c}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            ))}
            <NewCategoryCard onClick={openCreate} />
          </div>
        )}
      </Page>

      <CategoryFormModal
        open={formOpen}
        category={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <DeleteCategoryConfirm
        category={deleting}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
