import Papa from 'papaparse';

/** The canonical column headers the backend's `CsvParser` expects (spec §3.4). */
export const CANONICAL_HEADERS = [
  'accountId',
  'entryType',
  'amount',
  'currency',
  'transactionDate',
  'reference',
  'description',
  'categoryName',
] as const;

/**
 * Headers the frontend insists the user's CSV contains before we'll process
 * it. `accountId` is intentionally absent — the user picks the account at
 * upload time, and we inject it into every row to keep the picker as the
 * single source of truth (no UUID copy-paste required).
 */
export const REQUIRED_HEADERS = [
  'entryType',
  'amount',
  'currency',
  'transactionDate',
] as const;

export type CanonicalRow = {
  accountId: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: string;
  currency: string;
  transactionDate: string;
  reference: string;
  description: string;
  categoryName: string;
};

export type ParsedFile = {
  headers: string[];
  rows: Record<string, string>[];
};

/** Parse the file the user picked. Resolves with header list + every data row. */
export async function parseUploadedCsv(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const headers = result.meta.fields?.map((h) => h.trim()) ?? [];
        const rows = (result.data ?? []).filter((r) =>
          Object.values(r).some((v) => v && String(v).trim().length > 0),
        );
        resolve({ headers, rows });
      },
      error: (err) => reject(err),
    });
  });
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Lossless normalisation of common bank CSV date formats to YYYY-MM-DD. */
export function normaliseDate(raw: string): string {
  const trimmed = raw.trim();
  if (ISO_DATE.test(trimmed)) return trimmed;
  const eu = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (eu) {
    const [, d, m, y] = eu;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const [, m, d, y] = us;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  throw new Error(`Unrecognised date: "${raw}"`);
}

/**
 * Strip thousands separators, spaces and currency symbols (e.g. {@code $},
 * {@code HK$}, {@code £}, {@code HKD}) and return a JS number. Accounting-style
 * parentheses are treated as negative.
 */
export function parseSignedAmount(raw: string): number {
  if (!raw) throw new Error('Empty amount');
  const cleaned = raw
    .replace(/[\s,]/g, '')
    .replace(/^\((.*)\)$/, '-$1')
    // Drop anything that isn't a digit, decimal point or leading sign — this
    // removes currency symbols/codes ($, HK$, £, €, HKD, …) wherever they sit.
    .replace(/[^\d.+-]/g, '')
    .replace(/^[+]/, '');
  const n = Number(cleaned);
  if (!Number.isFinite(n) || cleaned === '' || cleaned === '-' || cleaned === '.') {
    throw new Error(`Not a number: "${raw}"`);
  }
  return n;
}

const DEBIT_TOKENS = new Set([
  'debit', 'd', 'dr', '-', 'out', 'withdrawal', 'withdraw', 'expense', 'spend', 'paid', 'payment',
]);
const CREDIT_TOKENS = new Set([
  'credit', 'c', 'cr', '+', 'in', 'deposit', 'income', 'received', 'inflow',
]);

/**
 * Coerce a free-text entry-type value into `'DEBIT' | 'CREDIT'`. Accepts the
 * canonical words plus the common synonyms that bank CSVs use.
 */
export function parseEntryType(raw: string): 'DEBIT' | 'CREDIT' {
  const v = raw.trim().toLowerCase();
  if (!v) throw new Error('entryType is blank');
  if (DEBIT_TOKENS.has(v)) return 'DEBIT';
  if (CREDIT_TOKENS.has(v)) return 'CREDIT';
  throw new Error(`Unrecognised entryType: "${raw}"`);
}

export type CanonicaliseResult = {
  rows: CanonicalRow[];
  /**
   * Per-row error messages. Row `0` denotes a file-level problem (e.g.
   * missing required header) — surface those before any row-level errors.
   */
  errors: { row: number; reason: string }[];
};

/**
 * Read a CSV that's already in canonical shape (downloaded from our template).
 * The `accountId` column in the file is **ignored** — we always inject the
 * `accountId` argument so the upload-time picker is the source of truth.
 *
 * File-level errors (missing required header) surface as a single
 * `row: 0` entry so the caller can show them without dragging the UI through
 * a hundred per-row complaints.
 */
export function parseCanonicalRows(
  parsed: ParsedFile,
  accountId: string,
): CanonicaliseResult {
  const missing = REQUIRED_HEADERS.filter((h) => !parsed.headers.includes(h));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          reason:
            'CSV is missing required column' +
            (missing.length === 1 ? '' : 's') +
            ': ' +
            missing.join(', ') +
            '. Download the template above to start.',
        },
      ],
    };
  }

  const rows: CanonicalRow[] = [];
  const errors: { row: number; reason: string }[] = [];

  parsed.rows.forEach((source, index) => {
    const oneIndexed = index + 1;
    try {
      const entryType = parseEntryType(source.entryType ?? '');

      const numeric = parseSignedAmount(source.amount ?? '');
      if (numeric === 0) throw new Error('amount must be greater than zero');
      const magnitude = Math.abs(numeric);

      const currency = (source.currency ?? '').trim().toUpperCase();
      if (currency.length !== 3) {
        throw new Error('currency must be a 3-letter ISO code');
      }

      const transactionDate = normaliseDate(source.transactionDate ?? '');

      const description = (source.description ?? '').trim();
      const reference = (source.reference ?? '').trim();
      const categoryName = (source.categoryName ?? '').trim();

      rows.push({
        accountId,
        entryType,
        amount: magnitude.toFixed(2),
        currency,
        transactionDate,
        reference,
        description,
        categoryName,
      });
    } catch (err) {
      errors.push({
        row: oneIndexed,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return { rows, errors };
}

/** Stringify canonical rows into a CSV body matching the backend's expected layout. */
export function canonicalCsvString(rows: CanonicalRow[]): string {
  return Papa.unparse(
    rows.map((r) => ({
      accountId: r.accountId,
      entryType: r.entryType,
      amount: r.amount,
      currency: r.currency,
      transactionDate: r.transactionDate,
      reference: r.reference,
      description: r.description,
      categoryName: r.categoryName,
    })),
    { columns: [...CANONICAL_HEADERS], newline: '\n' },
  );
}

/** Wrap {@link canonicalCsvString} in a `Blob` ready for `multipart/form-data` upload. */
export function canonicalBlob(rows: CanonicalRow[]): Blob {
  return new Blob([canonicalCsvString(rows)], { type: 'text/csv' });
}

/**
 * Build a template CSV that users can download, edit, and re-upload. The
 * `accountId` and `currency` columns are pre-filled with the user's
 * upload-step selection so they only need to add real rows.
 *
 * Three example rows demonstrate the three flavours the backend understands:
 * a DEBIT spend, a CREDIT income, and a DEBIT tagged with a categoryName so
 * the inline-create flow on the backend has something to bite on.
 */
export function buildCsvTemplate(accountId: string, currency: string): string {
  const today = new Date();
  const day = (offset: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  };

  const exampleRows: CanonicalRow[] = [
    {
      accountId,
      entryType: 'DEBIT',
      amount: '120.50',
      currency,
      transactionDate: day(0),
      reference: '',
      description: 'ParknShop groceries',
      categoryName: 'Groceries',
    },
    {
      accountId,
      entryType: 'CREDIT',
      amount: '56800.00',
      currency,
      transactionDate: day(2),
      reference: 'PAYROLL-MAY',
      description: 'Salary — Lumina Ltd.',
      categoryName: 'Income',
    },
    {
      accountId,
      entryType: 'DEBIT',
      amount: '45.20',
      currency,
      transactionDate: day(1),
      reference: '',
      description: 'MTR Octopus top-up',
      categoryName: 'Transport',
    },
  ];

  return canonicalCsvString(exampleRows);
}

/**
 * Triggers a browser download of the supplied CSV text. Lives next to the
 * template builder so callers don't have to know about Blob/URL plumbing.
 */
export function downloadCsv(csv: string, fileName: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
