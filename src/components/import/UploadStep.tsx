import { useState } from 'react';
import { Select, message } from 'antd';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { Icon } from '../icons/Icon';
import {
  buildCsvTemplate,
  downloadCsv,
  parseUploadedCsv,
  type ParsedFile,
} from '../../lib/csv';

type UploadStepProps = {
  accountId: string | null;
  fileName: string | null;
  parsed: ParsedFile | null;
  onAccountChange: (id: string | null) => void;
  onFile: (file: File, parsed: ParsedFile) => void;
  onClear: () => void;
};

const TESTED_BANKS = [
  'HSBC',
  'Standard Chartered',
  'BOC',
  'Hang Seng',
  'Citi HK',
  'AlipayHK',
];

export function UploadStep({
  accountId,
  fileName,
  parsed,
  onAccountChange,
  onFile,
  onClear,
}: UploadStepProps) {
  const accounts = useAccounts();
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const selectedAccount =
    accounts.data?.find((a) => a.accountId === accountId) ?? null;

  const handleFile = async (file: File) => {
    setParseError(null);
    setParsing(true);
    try {
      const result = await parseUploadedCsv(file);
      if (!result.headers.length) throw new Error('CSV has no headers');
      if (!result.rows.length) throw new Error('CSV has no data rows');
      onFile(file, result);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Could not parse the CSV');
    } finally {
      setParsing(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!selectedAccount) {
      message.warning('Pick the destination account first.');
      return;
    }
    const csv = buildCsvTemplate(selectedAccount.accountId, selectedAccount.currency);
    const slug = selectedAccount.accountName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    downloadCsv(csv, `splitwallet-import-${slug || 'template'}.csv`);
  };

  return (
    <div className="wiz-card">
      <h2>Upload your statement</h2>
      <div className="sub">
        Pick the destination account, then drop a CSV that matches our
        template. We won't try to interpret arbitrary bank exports — the
        format is fixed for accuracy.
      </div>

      <div className="upload-account-row">
        <div className="upload-account-field">
          <label className="upload-label">
            Bank account this statement belongs to{' '}
            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span>
          </label>
          <Select
            style={{ width: '100%' }}
            placeholder="Pick an account"
            loading={accounts.isLoading}
            status={!accountId ? 'warning' : undefined}
            value={accountId ?? undefined}
            onChange={(v) => onAccountChange(v)}
            options={(accounts.data ?? []).map((a) => ({
              value: a.accountId,
              label: `${a.bankName} · ${a.accountName}`,
            }))}
          />
          {!accountId ? (
            <div className="upload-hint warn">
              Required — every imported row is attached to this account.
            </div>
          ) : (
            <div className="upload-hint">
              Importing into <strong>{selectedAccount?.accountName}</strong> ·{' '}
              {selectedAccount?.currency}
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn"
          onClick={handleDownloadTemplate}
          disabled={!selectedAccount}
          title={
            selectedAccount
              ? 'Download a starter CSV with your accountId + currency pre-filled'
              : 'Pick an account first'
          }
        >
          <Icon.Import /> Download template
        </button>
      </div>

      <label
        className={'dropzone' + (dragOver ? ' over' : '')}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
      >
        <div className="dz-ico">
          <Icon.Upload />
        </div>
        <div className="dz-title">
          {fileName ? `Got it — ${fileName}` : 'Drag & drop your CSV here'}
        </div>
        <div className="dz-sub">
          {parsed && fileName ? (
            <>
              {parsed.rows.length} row{parsed.rows.length === 1 ? '' : 's'} ·{' '}
              {parsed.headers.length} column
              {parsed.headers.length === 1 ? '' : 's'} ·{' '}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClear();
                }}
                style={{ color: 'var(--primary-bright)', cursor: 'pointer' }}
              >
                remove
              </span>
            </>
          ) : parsing ? (
            'Parsing…'
          ) : (
            'Header row required: accountId, entryType, amount, currency, transactionDate, reference, description, categoryName'
          )}
        </div>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>

      {parseError ? (
        <div className="error-card" style={{ marginTop: 14 }}>
          <div className="row">{parseError}</div>
        </div>
      ) : null}

      <div className="bank-pills">
        <span className="label">Tested with</span>
        {TESTED_BANKS.map((b) => (
          <span key={b} className="pill">
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}
