import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Modal, Spin, message } from 'antd';
import { Page } from '../../components/shell/Page';
import { TopBar } from '../../components/shell/TopBar';
import {
  AccountChipRow,
  CategoryChipRow,
} from '../../components/transactions/FilterChipRows';
import { DayGroup } from '../../components/transactions/DayGroup';
import { Check } from '../../components/transactions/Check';
import { BulkActionBar } from '../../components/transactions/BulkActionBar';
import {
  CategoryPickerModal,
  type CategoryChoice,
} from '../../components/transactions/CategoryPickerModal';
import { TransactionDetailModal } from '../../components/transactions/TransactionDetailModal';
import { AddTransactionModal } from '../../components/transactions/AddTransactionModal';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { useCategories } from '../../hooks/queries/useCategories';
import {
  useBulkCategorize,
  useBulkDelete,
  useTransactionBalances,
  useTransactionCounts,
  useTransactions,
  useUpdateCategory,
} from '../../hooks/queries/useTransactions';
import { useTxnFiltersStore } from '../../stores/txnFiltersStore';
import { groupByDay } from '../../lib/transactions';
import { txnCountsFromBalancesResponse } from '../../lib/accounts';
import type { Transaction } from '../../api/transactions';
import { Icon } from '../../components/icons/Icon';
import { ApiError } from '../../api/types';
import '../../components/transactions/transactions.css';

const PAGE_SIZE = 200;
// Debounce so a fast typist doesn't fire a fetch per keystroke.
const SEARCH_DEBOUNCE_MS = 280;

export function TransactionsScreen() {
  const navigate = useNavigate();
  const accountId = useTxnFiltersStore((s) => s.accountId);
  const categoryFilter = useTxnFiltersStore((s) => s.categoryFilter);
  const search = useTxnFiltersStore((s) => s.search);
  const selectedIds = useTxnFiltersStore((s) => s.selectedIds);
  const toggleSelected = useTxnFiltersStore((s) => s.toggleSelected);
  const clearSelected = useTxnFiltersStore((s) => s.clearSelected);
  const selectAll = useTxnFiltersStore((s) => s.selectAll);

  // Debounce the search query that's actually sent to the server.
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  const txQuery = useTransactions({
    accountId: accountId ?? undefined,
    categoryId:
      categoryFilter && categoryFilter !== 'uncategorized'
        ? categoryFilter
        : undefined,
    uncategorized: categoryFilter === 'uncategorized' || undefined,
    q: debouncedSearch.trim() || undefined,
    size: PAGE_SIZE,
  });

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const countsQuery = useTransactionCounts();
  const balancesQuery = useTransactionBalances();

  const accountsById = useMemo(
    () => new Map((accountsQuery.data ?? []).map((a) => [a.accountId, a])),
    [accountsQuery.data],
  );
  const categoriesById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((c) => [c.categoryId, c])),
    [categoriesQuery.data],
  );

  const transactions = txQuery.data?.data ?? [];
  const total = txQuery.data?.total ?? 0;

  // Counts shown on the filter chips come from the dedicated `/counts` and
  // `/balances` endpoints so they stay honest even when the visible page is
  // clipped at PAGE_SIZE.
  const countsByAccount = useMemo(
    () => txnCountsFromBalancesResponse(balancesQuery.data),
    [balancesQuery.data],
  );
  const uncategorizedCount = countsQuery.data?.uncategorized ?? 0;
  const totalCount =
    countsQuery.data?.total ??
    balancesQuery.data?.balances.reduce((s, b) => s + b.txnCount, 0) ??
    0;

  const visibleIds = useMemo(
    () => transactions.map((t) => t.transactionId),
    [transactions],
  );
  const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  // Drop any stale selections when the visible set changes.
  useEffect(() => {
    if (selectedIds.size === 0) return;
    const kept = [...selectedIds].filter((id) => visibleIdSet.has(id));
    if (kept.length !== selectedIds.size) {
      if (kept.length === 0) clearSelected();
      else selectAll(kept);
    }
  }, [visibleIdSet, selectedIds, selectAll, clearSelected]);

  const groups = useMemo(() => groupByDay(transactions), [transactions]);

  const allSelected =
    visibleIds.length > 0 && selectedIds.size === visibleIds.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // ── Modals & actions ────────────────────────────────────────────
  const [pickerOpenForRow, setPickerOpenForRow] = useState<Transaction | null>(
    null,
  );
  const [pickerForBulk, setPickerForBulk] = useState(false);
  const [detailFor, setDetailFor] = useState<Transaction | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const updateCategory = useUpdateCategory();
  const bulkCategorize = useBulkCategorize();
  const bulkDelete = useBulkDelete();

  const categoryBody = (choice: CategoryChoice) =>
    choice.kind === 'existing'
      ? { categoryId: choice.category.categoryId }
      : { categoryName: choice.name };

  const handlePickRow = async (choice: CategoryChoice) => {
    if (!pickerOpenForRow) return;
    try {
      const result = await updateCategory.mutateAsync({
        id: pickerOpenForRow.transactionId,
        body: categoryBody(choice),
      });
      message.success(
        result.category.isNew
          ? `Created "${result.category.name}" and tagged the transaction`
          : 'Category updated',
      );
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Could not update.');
    } finally {
      setPickerOpenForRow(null);
    }
  };

  const handlePickBulk = async (choice: CategoryChoice) => {
    const ids = [...selectedIds];
    setPickerForBulk(false);
    try {
      const result = await bulkCategorize.mutateAsync({
        transactionIds: ids,
        ...(choice.kind === 'existing'
          ? { categoryId: choice.category.categoryId }
          : { categoryName: choice.name }),
      });
      const successLabel =
        result.isNew && choice.kind === 'new'
          ? `Created "${result.name}" and tagged ${result.updated}`
          : `Categorized ${result.updated} transaction${result.updated === 1 ? '' : 's'}`;
      const extras: string[] = [];
      if (result.skipped > 0) extras.push(`${result.skipped} already tagged`);
      if (result.notFoundCount > 0)
        extras.push(`${result.notFoundCount} not found`);
      const msg = extras.length
        ? `${successLabel} · ${extras.join(' · ')}`
        : successLabel;
      if (result.notFoundCount > 0) message.warning(msg);
      else message.success(msg);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Bulk update failed.');
    }
    clearSelected();
  };

  const confirmBulkDelete = () => {
    const ids = [...selectedIds];
    Modal.confirm({
      title: `Delete ${ids.length} transaction${ids.length === 1 ? '' : 's'}?`,
      content:
        'They will be soft-deleted on the server (audit trail preserved) but disappear from this list.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const result = await bulkDelete.mutateAsync(ids);
          const extras: string[] = [];
          if (result.notFoundCount > 0)
            extras.push(`${result.notFoundCount} not found`);
          const msg = extras.length
            ? `Deleted ${result.deleted} · ${extras.join(' · ')}`
            : `Deleted ${result.deleted} transaction${result.deleted === 1 ? '' : 's'}`;
          if (result.notFoundCount > 0) message.warning(msg);
          else message.success(msg);
        } catch (err) {
          message.error(err instanceof ApiError ? err.message : 'Bulk delete failed.');
        }
        clearSelected();
      },
    });
  };

  const bulkBusy = bulkCategorize.isPending || bulkDelete.isPending;
  const searchSyncing = search.trim() !== debouncedSearch.trim();

  return (
    <>
      <TopBar
        title="Transactions"
        breadcrumb="All accounts"
        actions={
          <>
            <button
              type="button"
              className="btn"
              onClick={() => navigate({ to: '/import' })}
            >
              <Icon.Import /> Import
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAddOpen(true)}
            >
              <Icon.Plus /> Add
            </button>
          </>
        }
      />
      <Page>
        <AccountChipRow
          accounts={accountsQuery.data ?? []}
          countsByAccount={countsByAccount}
          totalCount={totalCount}
        />
        <CategoryChipRow
          categories={categoriesQuery.data ?? []}
          uncategorizedCount={uncategorizedCount}
        />

        <div className="txn-strip">
          <Check
            on={allSelected}
            indeterminate={someSelected}
            onChange={(next) => {
              if (next) selectAll(visibleIds);
              else clearSelected();
            }}
            ariaLabel="Select all visible transactions"
          />
          {selectedIds.size > 0 ? (
            <span>
              {selectedIds.size} selected ·{' '}
              <button
                type="button"
                className="select-all-btn"
                onClick={() => clearSelected()}
              >
                Clear
              </button>
            </span>
          ) : (
            <span>
              <button
                type="button"
                className="select-all-btn"
                onClick={() => selectAll(visibleIds)}
              >
                Select all visible
              </button>
            </span>
          )}
          <span className="spacer" />
          <span>
            {transactions.length} of {total} transaction
            {total === 1 ? '' : 's'}
            {searchSyncing ? ' · searching…' : ''}
          </span>
        </div>

        {txQuery.isLoading ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: 60 }}>
            <Spin />
          </div>
        ) : txQuery.isError ? (
          <div
            style={{
              textAlign: 'center',
              padding: 48,
              color: 'var(--text-dim)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>
              Couldn't load transactions
            </div>
            <div style={{ marginTop: 8 }}>
              {(txQuery.error as Error)?.message ?? 'Try again.'}
            </div>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 14 }}
              onClick={() => txQuery.refetch()}
            >
              Retry
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ paddingBottom: 80 }}>
            {groups.map((g) => (
              <DayGroup
                key={g.dateKey}
                label={g.label}
                net={g.net}
                transactions={g.transactions}
                selectedIds={selectedIds}
                accountsById={accountsById}
                categoriesById={categoriesById}
                onToggleSelect={toggleSelected}
                onOpenDetail={setDetailFor}
                onCategorize={setPickerOpenForRow}
              />
            ))}
          </div>
        )}
      </Page>

      <BulkActionBar
        count={selectedIds.size}
        busy={bulkBusy}
        onCategorize={() => setPickerForBulk(true)}
        onDelete={confirmBulkDelete}
        onClear={clearSelected}
      />

      <CategoryPickerModal
        open={pickerOpenForRow !== null}
        selectedId={pickerOpenForRow?.category?.id}
        onPick={handlePickRow}
        onClose={() => setPickerOpenForRow(null)}
      />

      <CategoryPickerModal
        open={pickerForBulk}
        title={`Categorize ${selectedIds.size} transaction${selectedIds.size === 1 ? '' : 's'}`}
        onPick={handlePickBulk}
        onClose={() => setPickerForBulk(false)}
      />

      <TransactionDetailModal
        open={detailFor !== null}
        transaction={detailFor}
        account={detailFor ? accountsById.get(detailFor.accountId) ?? null : null}
        category={
          detailFor?.category
            ? categoriesById.get(detailFor.category.id) ?? null
            : null
        }
        onClose={() => setDetailFor(null)}
        onTransactionUpdated={(next) => setDetailFor(next)}
        onPickCategory={async (choice) => {
          if (!detailFor) return;
          try {
            const result = await updateCategory.mutateAsync({
              id: detailFor.transactionId,
              body: categoryBody(choice),
            });
            setDetailFor(result.transaction);
            message.success(
              result.category.isNew
                ? `Created "${result.category.name}"`
                : 'Category updated',
            );
          } catch (err) {
            message.error(
              err instanceof ApiError ? err.message : 'Could not update.',
            );
          }
        }}
      />

      <AddTransactionModal
        open={addOpen}
        defaultAccountId={accountId}
        onClose={() => setAddOpen(false)}
      />
    </>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 60,
        color: 'var(--text-dim)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
        No transactions match
      </div>
      <div style={{ marginTop: 8 }}>
        Try clearing your filters, or add a transaction with the button up top.
      </div>
    </div>
  );
}
