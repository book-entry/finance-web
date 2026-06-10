import { useEffect, useState } from 'react';
import { DatePicker, Input, Modal, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { Transaction } from '../../api/transactions';
import type { Account } from '../../api/accounts';
import type { Category } from '../../api/categories';
import { CategoryChip } from './CategoryChip';
import { CategoryPickerModal, type CategoryChoice } from './CategoryPickerModal';
import { merchantColor, merchantInitials } from '../../lib/merchantColor';
import { displayName, formatTxnAmount, signedAmount } from '../../lib/transactions';
import { gradientFor } from '../../lib/accounts';
import { useUpdateTransaction } from '../../hooks/queries/useTransactions';
import { ApiError } from '../../api/types';

type TransactionDetailModalProps = {
  open: boolean;
  transaction: Transaction | null;
  account?: Account | null;
  category?: Category | null;
  onClose: () => void;
  onPickCategory: (choice: CategoryChoice) => void;
  /** Called with the server's response after a successful PATCH. */
  onTransactionUpdated?: (transaction: Transaction) => void;
};

type Draft = {
  description: string;
  reference: string;
  transactionDate: Dayjs;
};

function draftOf(transaction: Transaction): Draft {
  return {
    description: transaction.description ?? '',
    reference: transaction.reference ?? '',
    transactionDate: dayjs(`${transaction.transactionDate}T00:00:00`),
  };
}

function isDirty(draft: Draft, transaction: Transaction): boolean {
  return (
    draft.description.trim() !== (transaction.description ?? '').trim() ||
    draft.reference.trim() !== (transaction.reference ?? '').trim() ||
    draft.transactionDate.format('YYYY-MM-DD') !== transaction.transactionDate
  );
}

export function TransactionDetailModal({
  open,
  transaction,
  account,
  category,
  onClose,
  onPickCategory,
  onTransactionUpdated,
}: TransactionDetailModalProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const updateTxn = useUpdateTransaction();

  // Reset the draft each time the modal is opened against a new transaction.
  useEffect(() => {
    if (transaction && open) setDraft(draftOf(transaction));
    if (!open) setDraft(null);
  }, [transaction, open]);

  if (!transaction || !draft) return null;

  const name = displayName(transaction);
  const isPositive = signedAmount(transaction) > 0;
  const accent = account
    ? gradientFor(account).match(/#[0-9a-fA-F]{6}/)?.[0] ?? '#4F46E5'
    : 'var(--text-faint)';

  const dirty = isDirty(draft, transaction);

  const handleSave = async () => {
    if (!dirty) return;
    const payload: { description?: string; reference?: string; transactionDate?: string } = {};
    const trimDesc = draft.description.trim();
    if (trimDesc !== (transaction.description ?? '').trim()) payload.description = trimDesc;
    const trimRef = draft.reference.trim();
    if (trimRef !== (transaction.reference ?? '').trim()) payload.reference = trimRef;
    const dateStr = draft.transactionDate.format('YYYY-MM-DD');
    if (dateStr !== transaction.transactionDate) payload.transactionDate = dateStr;

    try {
      const updated = await updateTxn.mutateAsync({
        id: transaction.transactionId,
        input: payload,
      });
      onTransactionUpdated?.(updated);
      message.success('Transaction updated');
    } catch (err) {
      const text = err instanceof ApiError ? err.message : 'Could not save.';
      message.error(text);
    }
  };

  const reset = () => setDraft(draftOf(transaction));

  return (
    <>
      <Modal
        open={open}
        title="Transaction"
        onCancel={onClose}
        destroyOnHidden
        width={580}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            {dirty ? (
              <button type="button" className="btn btn-ghost" onClick={reset}>
                Discard changes
              </button>
            ) : null}
            <button type="button" className="btn" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!dirty || updateTxn.isPending}
            >
              {updateTxn.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        }
      >
        <div className="txn-detail-hero">
          <div
            className="merch-ico"
            style={{ background: merchantColor(name) }}
            aria-hidden="true"
          >
            {merchantInitials(name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="name">{name}</div>
            <div className="date">
              {new Date(`${transaction.transactionDate}T00:00:00`).toLocaleDateString(
                'en-HK',
                { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
              )}
            </div>
          </div>
          <div className="amt">
            <div className={'value' + (isPositive ? ' pos' : '')}>
              {formatTxnAmount(transaction)}
            </div>
            <div className="currency">
              {transaction.currency} · {transaction.entryType.toLowerCase()}
            </div>
          </div>
        </div>

        <div className="txn-detail-grid">
          <div className="txn-field">
            <label>Category</label>
            <div style={{ display: 'flex' }}>
              <CategoryChip
                category={category ?? null}
                onClick={() => setPickerOpen(true)}
                size="lg"
              />
            </div>
          </div>

          <div className="txn-field">
            <label>Account</label>
            <div className="value">
              <span className="swatch" style={{ background: accent }} />
              {account?.accountName ?? 'Unknown account'}
            </div>
          </div>

          <div className="txn-field">
            <label>Transaction date</label>
            <DatePicker
              value={draft.transactionDate}
              onChange={(d) => d && setDraft({ ...draft, transactionDate: d })}
              format="YYYY-MM-DD"
              allowClear={false}
              style={{ width: '100%' }}
            />
          </div>

          <div className="txn-field">
            <label>Reference</label>
            <Input
              value={draft.reference}
              onChange={(e) => setDraft({ ...draft, reference: e.target.value })}
              maxLength={100}
              placeholder="HSBC ref / invoice no."
            />
          </div>

          <div className="txn-field full">
            <label>Description / merchant</label>
            <Input.TextArea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              autoSize={{ minRows: 1, maxRows: 3 }}
              placeholder="What was it for?"
            />
          </div>
        </div>

        <div className="txn-detail-footnote">
          {sourceLabel(transaction)} · {transaction.entryType} · ID&nbsp;
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {transaction.transactionId.slice(0, 8)}
          </span>
          . Account, type, amount, and currency are immutable — delete and
          re-create to change those.
        </div>
      </Modal>

      <CategoryPickerModal
        open={pickerOpen}
        selectedId={category?.categoryId}
        onPick={(choice) => {
          onPickCategory(choice);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}

function sourceLabel(transaction: Transaction): string {
  switch (transaction.source) {
    case 'MANUAL':
      return 'Manual entry';
    case 'BULK':
      return 'Imported via CSV';
    case 'API':
      return 'API integration';
  }
}
