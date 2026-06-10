import { Modal, Spin, message } from 'antd';
import type { Category } from '../../api/categories';
import {
  useCategorySummary,
  useDeleteCategory,
} from '../../hooks/queries/useCategories';
import { ApiError } from '../../api/types';
import { formatHKD } from '../../lib/money';

type Props = {
  category: Category | null;
  onClose: () => void;
};

export function DeleteCategoryConfirm({ category, onClose }: Props) {
  const open = category !== null;
  const summary = useCategorySummary(category?.categoryId ?? null);
  const del = useDeleteCategory();

  const handleDelete = async () => {
    if (!category) return;
    try {
      await del.mutateAsync(category.categoryId);
      message.success(`Deleted "${category.name}"`);
      onClose();
    } catch (err) {
      const text = err instanceof ApiError ? err.message : 'Could not delete.';
      message.error(text);
    }
  };

  return (
    <Modal
      open={open}
      title={category ? `Delete "${category.name}"?` : ''}
      onCancel={onClose}
      onOk={handleDelete}
      okButtonProps={{ danger: true, loading: del.isPending }}
      okText={del.isPending ? 'Deleting…' : 'Delete category'}
      destroyOnHidden
    >
      {summary.isLoading ? (
        <div style={{ display: 'grid', placeItems: 'center', padding: 20 }}>
          <Spin />
        </div>
      ) : summary.isError ? (
        <p>Couldn't fetch usage. You can still proceed.</p>
      ) : summary.data && summary.data.transactionCount > 0 ? (
        <p>
          <strong>{summary.data.transactionCount}</strong>{' '}
          {summary.data.transactionCount === 1 ? 'transaction is' : 'transactions are'}{' '}
          tagged with this category
          {summary.data.currency
            ? ` (total ${formatHKD(summary.data.totalAmount)})`
            : ''}
          . They'll stay intact but become <strong>Uncategorized</strong>.
        </p>
      ) : (
        <p>
          No transactions reference this category yet. Deleting it is safe to do.
        </p>
      )}
    </Modal>
  );
}
