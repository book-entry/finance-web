import type { JobStatusResponse } from '../../api/bulkUpload';
import { Icon } from '../icons/Icon';

type DoneStepProps = {
  job: JobStatusResponse | null;
  pollError: string | null;
  onImportAnother: () => void;
  onGoToTransactions: () => void;
};

export function DoneStep({
  job,
  pollError,
  onImportAnother,
  onGoToTransactions,
}: DoneStepProps) {
  if (pollError) {
    return (
      <div className="wiz-card done-card">
        <div className="tile fail">
          <Icon.X />
        </div>
        <h2>Couldn't reach the server</h2>
        <div className="meta">{pollError}</div>
        <div className="actions">
          <button type="button" className="btn" onClick={onImportAnother}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!job || job.status === 'PENDING' || job.status === 'PROCESSING') {
    return (
      <div className="wiz-card done-card">
        <div className="tile" style={{ background: 'var(--primary-soft)', color: 'var(--primary-bright)' }}>
          <Icon.Sparkles />
        </div>
        <h2>{job?.status === 'PROCESSING' ? 'Processing…' : 'Queueing…'}</h2>
        <div className="meta">
          Hang tight — your statement is being imported in the background.
          {job?.totalRows ? ` ${job.totalRows} rows total.` : ''}
        </div>
      </div>
    );
  }

  if (job.status === 'FAILED') {
    return (
      <div className="wiz-card done-card">
        <div className="tile fail">
          <Icon.X />
        </div>
        <h2>Import failed</h2>
        <div className="meta">
          The job stopped before completing. {job.errorRows?.length ?? 0} error
          {(job.errorRows?.length ?? 0) === 1 ? '' : 's'} reported.
        </div>
        {job.errorRows && job.errorRows.length ? (
          <div className="error-card" style={{ textAlign: 'left' }}>
            {job.errorRows.slice(0, 8).map((e) => (
              <div className="row" key={e.row}>
                Row {e.row}: {e.reason}
              </div>
            ))}
            {job.errorRows.length > 8 ? (
              <div
                style={{
                  color: 'var(--danger)',
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                + {job.errorRows.length - 8} more
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="actions">
          <button type="button" className="btn" onClick={onImportAnother}>
            Import another
          </button>
        </div>
      </div>
    );
  }

  // COMPLETED
  const partial = (job.errorCount ?? 0) > 0;
  return (
    <div className="wiz-card done-card">
      <div className="tile">
        <Icon.Check />
      </div>
      <h2>Import {partial ? 'partially complete' : 'complete'}</h2>
      <div className="meta">
        <strong>{job.successCount ?? 0}</strong> transaction
        {(job.successCount ?? 0) === 1 ? '' : 's'} imported
        {partial ? (
          <>
            {' '}
            · <strong style={{ color: 'var(--danger)' }}>{job.errorCount}</strong>{' '}
            row{job.errorCount === 1 ? '' : 's'} rejected
          </>
        ) : null}
        .
      </div>
      {partial && job.errorRows && job.errorRows.length ? (
        <div className="error-card" style={{ textAlign: 'left' }}>
          {job.errorRows.slice(0, 8).map((e) => (
            <div className="row" key={e.row}>
              Row {e.row}: {e.reason}
            </div>
          ))}
          {job.errorRows.length > 8 ? (
            <div
              style={{
                color: 'var(--danger)',
                fontSize: 12,
                marginTop: 6,
              }}
            >
              + {job.errorRows.length - 8} more
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="actions">
        <button type="button" className="btn" onClick={onImportAnother}>
          Import another
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onGoToTransactions}
        >
          View transactions →
        </button>
      </div>
    </div>
  );
}
