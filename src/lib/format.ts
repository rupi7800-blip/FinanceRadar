/** Formattazione di prezzi e variazioni per qualsiasi classe di strumento (sicuro anche lato client). */
type Q = { cls: string; ccy: string };

const SYM: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', GBp: 'p', JPY: '¥', CHF: 'CHF ', HKD: 'HK$', CNY: '¥', KRW: '₩', INR: '₹', TWD: 'NT$', DKK: 'DKK ', AUD: 'A$', CAD: 'C$', BRL: 'R$' };

export function fmtPrice(n: number | null | undefined, q: Q): string {
  if (n == null || !Number.isFinite(n)) return 'n.d.';
  if (q.cls === 'yield') return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 3 }) + '%';
  if (q.cls === 'fx') { const d = n >= 100 ? 2 : 4; return n.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  const num = n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: digits });
  if (q.cls === 'index' || q.cls === 'volatility' || q.ccy === 'pt') return num;
  const s = SYM[q.ccy];
  if (q.ccy === 'GBp') return num + ' p';
  return s ? (s.endsWith(' ') ? s + num : s + num) : `${num} ${q.ccy}`;
}

/** Variazione: % per tutti gli strumenti, punti base per i rendimenti. */
export function fmtChange(v: number | null | undefined, q: { cls: string }): string {
  if (v == null || !Number.isFinite(v)) return 'n.d.';
  if (q.cls === 'yield') return (v > 0 ? '+' : '') + Math.round(v) + ' pb';
  return (v > 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + '%';
}

export function fmtCompact(n: number | null | undefined, ccy = 'USD'): string {
  if (n == null || !Number.isFinite(n)) return 'n.d.';
  const s = SYM[ccy] ?? '';
  const abs = Math.abs(n);
  if (abs >= 1e12) return s + (n / 1e12).toFixed(2).replace('.', ',') + ' T';
  if (abs >= 1e9) return s + (n / 1e9).toFixed(2).replace('.', ',') + ' Mld';
  if (abs >= 1e6) return s + (n / 1e6).toFixed(2).replace('.', ',') + ' Mln';
  return s + n.toLocaleString('it-IT', { maximumFractionDigits: 0 });
}
