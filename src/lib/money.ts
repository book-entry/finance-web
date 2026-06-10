const MINUS = '−';

const formatter = new Intl.NumberFormat('en-HK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export type FormatMoneyOptions = {
  /** When true, positive numbers get a leading `+`. */
  alwaysSign?: boolean;
  /** When true, omit the `HK$` prefix. */
  bare?: boolean;
};

export function formatHKD(value: number, opts: FormatMoneyOptions = {}): string {
  const sign = value < 0 ? MINUS : opts.alwaysSign && value > 0 ? '+' : '';
  const body = formatter.format(Math.abs(value));
  return (opts.bare ? '' : 'HK$') + sign + body;
}

export function formatHKDCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? MINUS : '';
  if (abs >= 1000) return `${sign}HK$${(abs / 1000).toFixed(1)}k`;
  return `${sign}HK$${abs.toFixed(0)}`;
}
