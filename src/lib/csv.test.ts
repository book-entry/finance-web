import { describe, it, expect } from 'vitest';
import {
  buildCsvTemplate,
  canonicalCsvString,
  normaliseDate,
  parseCanonicalRows,
  parseEntryType,
  parseSignedAmount,
  REQUIRED_HEADERS,
  type ParsedFile,
} from './csv';

describe('normaliseDate', () => {
  it('passes ISO-format dates through', () => {
    expect(normaliseDate('2026-05-24')).toBe('2026-05-24');
  });
  it('rewrites DD/MM/YYYY (HK)', () => {
    expect(normaliseDate('24/05/2026')).toBe('2026-05-24');
  });
  it('rewrites DD-MM-YYYY', () => {
    expect(normaliseDate('24-05-2026')).toBe('2026-05-24');
  });
  it('throws on garbage', () => {
    expect(() => normaliseDate('next tuesday')).toThrow();
  });
});

describe('parseSignedAmount', () => {
  it('parses simple positive numbers', () => {
    expect(parseSignedAmount('1,234.56')).toBe(1234.56);
  });
  it('parses signed negatives', () => {
    expect(parseSignedAmount('-89.00')).toBe(-89);
  });
  it('parses accounting parens as negative', () => {
    expect(parseSignedAmount('(12.34)')).toBe(-12.34);
  });
  it('strips currency symbols and surrounding whitespace (DBS export)', () => {
    expect(parseSignedAmount(' $30.00 ')).toBe(30);
    expect(parseSignedAmount(' $1,031.68 ')).toBe(1031.68);
    expect(parseSignedAmount('HK$45.20')).toBe(45.2);
    expect(parseSignedAmount('HKD 12.00')).toBe(12);
  });
  it('throws on non-numeric input', () => {
    expect(() => parseSignedAmount('abc')).toThrow();
    expect(() => parseSignedAmount('$')).toThrow();
  });
});

describe('parseEntryType', () => {
  it('accepts the canonical words case-insensitively', () => {
    expect(parseEntryType('DEBIT')).toBe('DEBIT');
    expect(parseEntryType('credit')).toBe('CREDIT');
  });
  it('accepts common synonyms', () => {
    expect(parseEntryType('withdrawal')).toBe('DEBIT');
    expect(parseEntryType('Deposit')).toBe('CREDIT');
    expect(parseEntryType('D')).toBe('DEBIT');
    expect(parseEntryType('Cr')).toBe('CREDIT');
  });
  it('rejects unknown values', () => {
    expect(() => parseEntryType('banana')).toThrow(/Unrecognised entryType/);
  });
  it('rejects blank', () => {
    expect(() => parseEntryType('')).toThrow();
  });
});

describe('parseCanonicalRows', () => {
  const validCsv: ParsedFile = {
    headers: [
      'accountId',
      'entryType',
      'amount',
      'currency',
      'transactionDate',
      'reference',
      'description',
      'categoryName',
    ],
    rows: [
      {
        accountId: 'csv-ignored-id',
        entryType: 'DEBIT',
        amount: '120.50',
        currency: 'HKD',
        transactionDate: '2026-05-24',
        reference: '',
        description: 'ParknShop',
        categoryName: 'Groceries',
      },
      {
        accountId: 'csv-ignored-id',
        entryType: 'CREDIT',
        amount: '56800',
        currency: 'HKD',
        transactionDate: '2026-05-22',
        reference: 'PAYROLL',
        description: 'Salary',
        categoryName: 'Income',
      },
    ],
  };

  it('reads canonical rows and injects the picker accountId', () => {
    const { rows, errors } = parseCanonicalRows(validCsv, 'picker-uuid');
    expect(errors).toEqual([]);
    expect(rows.map((r) => r.accountId)).toEqual(['picker-uuid', 'picker-uuid']);
    expect(rows[0]).toMatchObject({
      entryType: 'DEBIT',
      amount: '120.50',
      currency: 'HKD',
      transactionDate: '2026-05-24',
      description: 'ParknShop',
      categoryName: 'Groceries',
    });
    expect(rows[1].entryType).toBe('CREDIT');
  });

  it('refuses the file when a required header is missing', () => {
    const parsed: ParsedFile = {
      headers: ['entryType', 'amount', 'currency'], // no transactionDate
      rows: [{ entryType: 'DEBIT', amount: '12', currency: 'HKD' }],
    };
    const { rows, errors } = parseCanonicalRows(parsed, 'p');
    expect(rows).toEqual([]);
    expect(errors).toEqual([
      {
        row: 0,
        reason: expect.stringMatching(/missing required column.*transactionDate.*template/i),
      },
    ]);
  });

  it('does not require an accountId column in the CSV', () => {
    const parsed: ParsedFile = {
      headers: ['entryType', 'amount', 'currency', 'transactionDate', 'description'],
      rows: [
        {
          entryType: 'DEBIT',
          amount: '12',
          currency: 'HKD',
          transactionDate: '2026-05-24',
          description: 'Coffee',
        },
      ],
    };
    const { rows, errors } = parseCanonicalRows(parsed, 'picker-uuid');
    expect(errors).toEqual([]);
    expect(rows[0].accountId).toBe('picker-uuid');
  });

  it('accumulates per-row errors and keeps the good rows', () => {
    const parsed: ParsedFile = {
      headers: ['entryType', 'amount', 'currency', 'transactionDate'],
      rows: [
        {
          entryType: 'DEBIT',
          amount: '12',
          currency: 'HKD',
          transactionDate: '2026-05-24',
        },
        {
          entryType: 'banana',
          amount: '12',
          currency: 'HKD',
          transactionDate: '2026-05-24',
        },
        {
          entryType: 'CREDIT',
          amount: '0',
          currency: 'HKD',
          transactionDate: '2026-05-24',
        },
      ],
    };
    const { rows, errors } = parseCanonicalRows(parsed, 'p');
    expect(rows).toHaveLength(1);
    expect(errors.map((e) => e.row)).toEqual([2, 3]);
    expect(errors[0].reason).toMatch(/entryType/i);
    expect(errors[1].reason).toMatch(/zero/i);
  });

  it('strips signs and uses absolute amount magnitude', () => {
    const parsed: ParsedFile = {
      headers: ['entryType', 'amount', 'currency', 'transactionDate'],
      rows: [
        {
          entryType: 'DEBIT',
          amount: '-99.50',
          currency: 'HKD',
          transactionDate: '2026-05-24',
        },
      ],
    };
    const { rows } = parseCanonicalRows(parsed, 'p');
    expect(rows[0].amount).toBe('99.50');
    expect(rows[0].entryType).toBe('DEBIT');
  });

  it('upper-cases the currency code', () => {
    const parsed: ParsedFile = {
      headers: ['entryType', 'amount', 'currency', 'transactionDate'],
      rows: [
        {
          entryType: 'DEBIT',
          amount: '12',
          currency: 'hkd',
          transactionDate: '2026-05-24',
        },
      ],
    };
    expect(parseCanonicalRows(parsed, 'p').rows[0].currency).toBe('HKD');
  });
});

describe('buildCsvTemplate', () => {
  it('produces a CSV with all canonical headers in spec order', () => {
    const csv = buildCsvTemplate('uuid-1', 'HKD');
    const firstLine = csv.split('\n')[0];
    expect(firstLine).toBe(
      'accountId,entryType,amount,currency,transactionDate,reference,description,categoryName',
    );
  });

  it('pre-fills accountId + currency on every example row', () => {
    const csv = buildCsvTemplate('my-uuid', 'USD');
    const dataLines = csv.trim().split('\n').slice(1);
    expect(dataLines.length).toBeGreaterThanOrEqual(2);
    for (const line of dataLines) {
      const cells = line.split(',');
      expect(cells[0]).toBe('my-uuid');
      expect(cells[3]).toBe('USD');
    }
  });

  it('round-trips cleanly through parseCanonicalRows', () => {
    const csv = buildCsvTemplate('uuid-1', 'HKD');
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map((line) => {
      const cells = line.split(',');
      return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ''])) as Record<
        string,
        string
      >;
    });
    const { rows: parsed, errors } = parseCanonicalRows(
      { headers, rows },
      'uuid-1',
    );
    expect(errors).toEqual([]);
    expect(parsed.length).toBe(rows.length);
  });
});

describe('canonicalCsvString', () => {
  it('emits CSV with the canonical header order', () => {
    const text = canonicalCsvString([
      {
        accountId: 'acct',
        entryType: 'DEBIT',
        amount: '12.34',
        currency: 'HKD',
        transactionDate: '2026-05-24',
        reference: 'r',
        description: 'd',
        categoryName: '',
      },
    ]);
    const lines = text.trim().split('\n');
    expect(lines[0]).toBe(
      'accountId,entryType,amount,currency,transactionDate,reference,description,categoryName',
    );
    expect(lines[1]).toBe('acct,DEBIT,12.34,HKD,2026-05-24,r,d,');
  });
});

describe('REQUIRED_HEADERS', () => {
  it('does not include accountId (picker handles it)', () => {
    expect(REQUIRED_HEADERS as readonly string[]).not.toContain('accountId');
  });
});
