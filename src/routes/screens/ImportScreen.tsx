import { useMemo, useState } from 'react';
import { message } from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { Page } from '../../components/shell/Page';
import { TopBar } from '../../components/shell/TopBar';
import { Stepper } from '../../components/import/Stepper';
import { UploadStep } from '../../components/import/UploadStep';
import { PreviewStep } from '../../components/import/PreviewStep';
import { DoneStep } from '../../components/import/DoneStep';
import { useBulkUpload, useJobStatus } from '../../hooks/queries/useBulkUpload';
import { canonicalBlob, parseCanonicalRows, type ParsedFile } from '../../lib/csv';
import { ApiError } from '../../api/types';
import { Icon } from '../../components/icons/Icon';
import '../../components/import/import.css';

const STEPS = ['Upload', 'Preview', 'Done'];

export function ImportScreen() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  const upload = useBulkUpload();
  const job = useJobStatus(jobId);

  const transformed = useMemo(() => {
    if (!parsed || !accountId) return { rows: [], errors: [] };
    return parseCanonicalRows(parsed, accountId);
  }, [parsed, accountId]);

  const missingForUpload = useMemo(() => {
    const out: string[] = [];
    if (!accountId) out.push('Pick an account');
    if (!parsed) out.push('Upload a CSV');
    return out;
  }, [accountId, parsed]);

  const fileHasFatalError = transformed.errors.some((e) => e.row === 0);

  const canAdvance = (): boolean => {
    if (step === 0) {
      return (
        missingForUpload.length === 0 &&
        !fileHasFatalError &&
        transformed.rows.length > 0
      );
    }
    if (step === 1) return transformed.rows.length > 0;
    return false;
  };

  const next = () => {
    if (step === 1) return submit();
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    if (!transformed.rows.length) return;
    setPollError(null);
    try {
      const blob = canonicalBlob(transformed.rows);
      const result = await upload.mutateAsync({
        blob,
        fileName: fileName ?? 'canonical.csv',
      });
      setJobId(result.jobId);
      setStep(2);
    } catch (err) {
      const text = err instanceof ApiError ? err.message : 'Upload failed.';
      message.error(text);
    }
  };

  const reset = () => {
    setStep(0);
    setFileName(null);
    setParsed(null);
    setJobId(null);
    setPollError(null);
  };

  return (
    <>
      <TopBar
        title="Import statement"
        breadcrumb="Import"
        hideSearch
        actions={
          step < 2 ? (
            <button type="button" className="btn btn-ghost" onClick={reset}>
              × Cancel
            </button>
          ) : null
        }
      />
      <Page narrow>
        <Stepper steps={STEPS} current={step} />

        {step === 0 ? (
          <>
            <UploadStep
              accountId={accountId}
              fileName={fileName}
              parsed={parsed}
              onAccountChange={setAccountId}
              onFile={(file, p) => {
                setFileName(file.name);
                setParsed(p);
              }}
              onClear={() => {
                setFileName(null);
                setParsed(null);
              }}
            />

            {fileHasFatalError ? (
              <div className="error-card" style={{ marginTop: 14 }}>
                {transformed.errors
                  .filter((e) => e.row === 0)
                  .map((e, i) => (
                    <div className="row" key={i}>
                      {e.reason}
                    </div>
                  ))}
              </div>
            ) : null}

            {/* Without this, a file whose every row fails to parse would leave
                Continue silently disabled with no explanation. */}
            {!fileHasFatalError && parsed && transformed.rows.length === 0 ? (
              <div className="error-card" style={{ marginTop: 14 }}>
                <div className="row">
                  None of the {parsed.rows.length} row
                  {parsed.rows.length === 1 ? '' : 's'} could be read. First problems:
                </div>
                {transformed.errors.slice(0, 5).map((e, i) => (
                  <div className="row" key={i}>
                    Row {e.row}: {e.reason}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {step === 1 ? (
          <PreviewStep rows={transformed.rows} errors={transformed.errors} />
        ) : null}

        {step === 2 ? (
          <DoneStep
            job={job.data ?? null}
            pollError={
              job.isError
                ? (job.error as Error)?.message ?? 'Polling failed'
                : pollError
            }
            onImportAnother={reset}
            onGoToTransactions={() => navigate({ to: '/transactions' })}
          />
        ) : null}

        {step < 2 ? (
          <div className="wiz-nav" style={{ alignItems: 'center' }}>
            <button
              type="button"
              className="btn"
              onClick={back}
              disabled={step === 0}
            >
              <Icon.ChevronLeft /> Back
            </button>

            <div
              className="missing-pill-row"
              style={{ flex: 1, justifyContent: 'flex-end', marginRight: 10 }}
            >
              {step === 0 && missingForUpload.length > 0
                ? missingForUpload.map((m) => (
                    <span key={m} className="missing-pill">
                      • {m}
                    </span>
                  ))
                : null}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={next}
              disabled={!canAdvance() || upload.isPending}
            >
              {step === 1
                ? upload.isPending
                  ? 'Uploading…'
                  : 'Confirm import'
                : 'Continue'}{' '}
              <Icon.ChevronRight />
            </button>
          </div>
        ) : null}
      </Page>
    </>
  );
}
